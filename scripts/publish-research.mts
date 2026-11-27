/**
 * Publishes the research queue to the live archive (PostgreSQL / Neon).
 *
 *   npm run research:publish                 every candidate that hasn't been rejected
 *   npm run research:publish -- --country JP only one country (repeatable)
 *   npm run research:publish -- --dry-run    report what would change
 *
 * For each candidate it creates a public passport, clearly labelled as an unreviewed research
 * passport ("editorial-draft"; every claim "Further verification needed"), plus its sources and
 * freely licensed image. It also lists each element on its country page as a UNESCO lead, and
 * adds countries that are new to the atlas. Countries that only had "stories being documented"
 * become introductory collections. Everything is written in one transaction and checked against
 * the archive's integrity rules first. Re-running skips candidates that already have a passport.
 */
import { randomUUID } from "node:crypto";
import { db, upsertRow } from "../src/lib/db.ts";
import { loadPostgresArchive } from "../src/lib/data/pg.ts";
import { countryToRow, mediaToRow, sourceToRow, traditionToRows } from "../src/lib/data/rows.ts";
import { validateArchive } from "../src/lib/data/seed/index.ts";
import type { ResearchCandidate } from "../src/lib/research.ts";
import { RESEARCH_BY as BY, planPublish } from "../src/lib/research-publish.ts";

if (!process.env.DATABASE_URL?.trim()) {
  console.error("DATABASE_URL is not set (add it to .env.local).");
  process.exit(1);
}
const argv = process.argv.slice(2);
const only = argv.flatMap((a, i) => (argv[i - 1] === "--country" ? [a.toUpperCase()] : []));
const dryRun = argv.includes("--dry-run");
const sql = db();
try {
  const archive = await loadPostgresArchive(sql);
  const rows = (await sql`select id, data, status, draft_id from research_candidates where status <> 'rejected' order by country_iso2, name`) as unknown as {
    id: string;
    data: ResearchCandidate;
    status: string;
    draft_id: string | null;
  }[];
  const queue = rows.filter((r) => !only.length || only.includes(r.data.country.iso2));
  const plan = planPublish(
    archive,
    queue.map((r) => ({ ...r.data, id: r.id, draftId: r.draft_id ?? undefined })),
    { today: new Date().toISOString().slice(0, 10), idFor: () => `trad-${randomUUID().slice(0, 8)}` },
  );
  const { next, newTraditions, newSources, newMedia, touchedCountries, countries, decisions, duplicates, skipped } = plan;
  for (const w of plan.warnings) console.warn(`  ${w}`);
  const problems = validateArchive(next);
  if (problems.length) {
    console.error(`✗ ${problems.length} integrity problem(s); nothing was written:\n  ${problems.slice(0, 15).join("\n  ")}`);
    process.exitCode = 1;
  } else {
    const per = new Map<string, number>();
    for (const t of newTraditions) per.set(t.collection, (per.get(t.collection) ?? 0) + 1);
    console.log(
      `${dryRun ? "Would publish" : "Publishing"} ${newTraditions.length} passports (${[...per].map(([k, n]) => `${k} ${n}`).join(", ") || "none"}), ${newSources.size} sources, ${newMedia.length} images; updating ${touchedCountries.size} countries; ${skipped} already published; ${duplicates.length} already in the archive (${duplicates.map((d) => d.slug).join(", ") || "none"}).`,
    );
    if (!dryRun && (newTraditions.length || touchedCountries.size || duplicates.length)) {
      const idOf = new Map(next.traditions.map((t) => [t.slug, t.id]));
      // One transaction per country: each country's passports land together, and if the connection
      // drops part-way, re-running carries on (published candidates are skipped).
      const isos = [...new Set([...newTraditions.map((t) => t.collection), ...touchedCountries])].sort();
      for (const iso of isos) {
        const trads = newTraditions.filter((t) => t.collection === iso);
        const ids = new Set(trads.map((t) => t.id));
        const srcKeys = new Set(trads.flatMap((t) => [...t.claims.flatMap((c) => c.sources), ...t.keepAlive.resources.flatMap((r) => (r.source ? [r.source] : []))]));
        const mediaIds = new Set(trads.flatMap((t) => (t.hero ? [t.hero] : [])));
        for (let attempt = 1; ; attempt++) {
          try {
            await sql.begin(async (tx) => {
              const t = tx as unknown as typeof sql;
              if (touchedCountries.has(iso)) await upsertRow("countries", countryToRow(countries.get(iso)!), ["iso2"], t);
              for (const s of newSources.values()) if (srcKeys.has(s.id)) await upsertRow("sources", sourceToRow(s), ["id"], t);
              for (const m of newMedia) if (mediaIds.has(m.id)) await upsertRow("media_assets", mediaToRow(m), ["id"], t);
              for (const tr of trads) await t.unsafe("select save_tradition($1::jsonb)", [traditionToRows(tr, (s) => idOf.get(s) ?? s) as never]);
              for (const d of decisions.filter((d) => ids.has(d.draftId)))
                await t`update research_candidates set status = 'drafted', draft_id = ${d.draftId}, reviewed_by = ${BY}, reviewed_at = now() where id = ${d.id}`;
              for (const tr of trads)
                await t`insert into content_revisions (entity, entity_id, editor, summary, fields) values ('tradition', ${tr.id}, ${BY}, ${"Published as an unreviewed research passport"}, ${["created"]})`;
              if (touchedCountries.has(iso))
                await t`insert into content_revisions (entity, entity_id, editor, summary, fields) values ('country', ${iso}, ${BY}, ${"Research passports and UNESCO leads added"}, ${["country"]})`;
            });
            console.log(`  ✓ ${iso}: ${trads.length} passports`);
            break;
          } catch (e) {
            if (attempt >= 3) throw e;
            console.warn(`  ${iso}: ${(e as Error).message}; retrying`);
            await new Promise((r) => setTimeout(r, 3000 * attempt));
          }
        }
      }
      if (duplicates.length)
        for (const d of duplicates)
          await sql`update research_candidates set status = 'rejected', note = ${`Already in the archive as /passport/${d.slug}`}, reviewed_by = ${BY}, reviewed_at = now() where id = ${d.id}`;
      console.log("✓ written to the database");
    }
  }
} catch (e) {
  console.error(`✗ ${(e as Error).message.replaceAll(process.env.DATABASE_URL!, "<DATABASE_URL>")}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
