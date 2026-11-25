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
import { candidateToDraft, countryRecordFor, slugify, type ResearchCandidate } from "../src/lib/research.ts";
import type { CountryRecord, MediaAsset, Source, Tradition } from "../src/lib/types.ts";

if (!process.env.DATABASE_URL?.trim()) {
  console.error("DATABASE_URL is not set (add it to .env.local).");
  process.exit(1);
}
const argv = process.argv.slice(2);
const only = argv.flatMap((a, i) => (argv[i - 1] === "--country" ? [a.toUpperCase()] : []));
const dryRun = argv.includes("--dry-run");
const BY = "Research pipeline (auto-published)";
const RESEARCH_HEADLINE = "First passports, from public records";
const RESEARCH_INTRO =
  "These passports were compiled from UNESCO listings and Wikidata and have not yet been reviewed by an editor. Every claim is marked “Further verification needed” and links to its source. Corrections are welcome on each passport.";

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
  // Names already in the archive (e.g. hand-written passports such as Kolhapuri Chappal), compared
  // loosely: case, punctuation, plurals and words like "painting" or "art" are ignored.
  const nameKey = (n: string) =>
    n
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((w) => w && !/^(paintings?|arts?|crafts?|work|ware|the|of|and|sarees?|saris?)$/.test(w))
      .map((w) => w.replace(/s$/, ""))
      .join(" ");
  const existingNames = new Map(archive.traditions.flatMap((t) => [t.name, t.displayTitle, ...(t.alternateNames ?? [])].map((n) => [nameKey(n), t.slug] as const)));
  const duplicates: { id: string; slug: string }[] = [];
  const existingWd = new Set(archive.sources.filter((s) => s.id.startsWith("research-") && s.id.endsWith("-wikidata")).map((s) => s.id));

  const today = new Date().toISOString().slice(0, 10);
  let nextNo = Math.max(0, ...archive.traditions.map((t) => Number(t.passportNo))) + 1;
  const slugs = new Set(archive.traditions.flatMap((t) => [t.slug, ...(t.slugHistory ?? [])]));
  const countries = new Map(archive.countries.map((c) => [c.iso2, structuredClone(c)]));
  const touchedCountries = new Set<string>();
  const newTraditions: Tradition[] = [];
  const newSources = new Map<string, Source>();
  const newMedia: MediaAsset[] = [];
  const decisions: { id: string; draftId: string }[] = [];
  let skipped = 0;

  for (const r of queue) {
    const c = { ...r.data, id: r.id };
    const wdSource = `research-${c.wikidataId.toLowerCase()}-wikidata`;
    if (existingWd.has(wdSource) || (r.draft_id && archive.traditions.some((t) => t.id === r.draft_id))) {
      skipped++;
      continue;
    }
    const dup = [c.name, c.gi?.goods ?? "", ...c.aliases].map(nameKey).find((k) => k && existingNames.has(k));
    if (dup) {
      duplicates.push({ id: c.id, slug: existingNames.get(dup)! });
      continue;
    }
    // Country: add it to the atlas, or upgrade a "documenting" country now that it has passports.
    let country = countries.get(c.country.iso2);
    if (!country) {
      if (!c.country.centroid) {
        console.warn(`  skip ${c.name}: no coordinates for ${c.country.name}`);
        continue;
      }
      country = { ...countryRecordFor(c.country), status: "introductory", headline: RESEARCH_HEADLINE, intro: RESEARCH_INTRO };
      countries.set(country.iso2, country);
      touchedCountries.add(country.iso2);
    } else if (country.status === "documenting" || country.status === "shared") {
      Object.assign(country, { status: "introductory", headline: RESEARCH_HEADLINE, intro: RESEARCH_INTRO } satisfies Partial<CountryRecord>);
      touchedCountries.add(country.iso2);
    }

    let slug = slugify(c.name) || c.wikidataId.toLowerCase();
    for (let n = 2; slugs.has(slug); n++) slug = `${slugify(c.name)}-${n}`;
    slugs.add(slug);
    const draft = candidateToDraft(c, {
      id: `trad-${randomUUID().slice(0, 8)}`,
      slug,
      passportNo: String(nextNo++).padStart(3, "0"),
      editor: BY,
      today,
      publish: true,
    });
    newTraditions.push(draft.tradition);
    for (const s of draft.sources) if (!archive.sources.some((x) => x.id === s.id)) newSources.set(s.id, s);
    if (draft.media) newMedia.push(draft.media);
    decisions.push({ id: c.id, draftId: draft.tradition.id });

    // Country-page lead with its UNESCO reference.
    if (c.ich) {
      const lead = { name: draft.tradition.name, note: `UNESCO ${c.ich.id}${c.ich.year ? ` · ${c.ich.year}` : ""} · ${c.ich.listLabel}`, sources: [`research-${c.wikidataId.toLowerCase()}-unesco`] };
      if (!country.candidates.some((x) => x.name.toLowerCase() === lead.name.toLowerCase())) {
        country.candidates = [...country.candidates, lead];
        touchedCountries.add(country.iso2);
      }
    }
  }

  // Integrity check on the archive as it will be after publishing.
  const next = {
    ...archive,
    traditions: [...archive.traditions, ...newTraditions],
    sources: [...archive.sources, ...newSources.values()],
    media: [...archive.media, ...newMedia],
    countries: [...countries.values()],
  };
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
