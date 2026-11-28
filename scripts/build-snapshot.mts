/**
 * Writes the archive snapshot that the public site reads (src/lib/data/snapshot.json), so public
 * pages never depend on the database.
 *
 *   npm run snapshot:build               seed + the research queue in .data/research.json
 *                                        (+ the overviews in data/research-overviews.json)
 *   npm run snapshot:build -- --from-db  export the published archive from PostgreSQL (DATABASE_URL)
 *
 * Every passport keeps the address and number recorded in data/passport-ids.json, so printed QR
 * codes and shared links keep working; new passports get the next free number, and the file is
 * updated. Only published passports are written. The result is checked against the archive's
 * integrity rules before anything is saved.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { seedArchive, validateArchive } from "../src/lib/data/seed/index.ts";
import { RESEARCH_FILE, type ResearchCandidate, type ResearchFile } from "../src/lib/research.ts";
import { planPublish, type KnownIds } from "../src/lib/research-publish.ts";
import type { Archive } from "../src/lib/types.ts";

const root = new URL("..", import.meta.url).pathname;
const SNAPSHOT = path.join(root, "src/lib/data/snapshot.json");
const IDS = path.join(root, "data/passport-ids.json");
const fromDb = process.argv.includes("--from-db");

type IdFile = Record<string, { no: string; qid?: string }>;
const ids: IdFile = JSON.parse(await fs.readFile(IDS, "utf8").catch(() => "{}"));
const known: KnownIds = { byQid: new Map(), bySlug: new Map() };
for (const [slug, v] of Object.entries(ids)) {
  if (v.qid) known.byQid.set(v.qid, { slug, no: v.no });
  else known.bySlug.set(slug, v.no);
}

let archive: Omit<Archive, "backend">;
if (fromDb) {
  if (!process.env.DATABASE_URL?.trim()) throw new Error("--from-db needs DATABASE_URL (in .env.local).");
  const { db } = await import("../src/lib/db.ts");
  const { loadPostgresArchive } = await import("../src/lib/data/pg.ts");
  const sql = db();
  try {
    archive = await loadPostgresArchive(sql);
  } finally {
    await sql.end();
  }
} else {
  const file: ResearchFile = JSON.parse(await fs.readFile(path.join(root, RESEARCH_FILE), "utf8").catch(() => '{"candidates":{}}'));
  // Overviews written by editors from each Wikipedia article, kept in the repo.
  const overviews: Record<string, string> = JSON.parse(await fs.readFile(path.join(root, "data/research-overviews.json"), "utf8").catch(() => "{}"));
  for (const c of Object.values(file.candidates)) {
    const text = overviews[c.wikidataId];
    if (!text) continue;
    c.overview = text;
    const wp = c.sources.find((x) => x.key === "wikipedia");
    if (wp) wp.note = "The overview summarises this article in our own words; follow its references for more.";
  }
  const queue: ResearchCandidate[] = Object.values(file.candidates)
    .filter((c) => c.status !== "rejected")
    .sort((a, b) => a.country.iso2.localeCompare(b.country.iso2) || a.name.localeCompare(b.name));
  const plan = planPublish(structuredClone(seedArchive) as Archive, queue, { today: new Date().toISOString().slice(0, 10), known });
  for (const w of plan.warnings) console.warn(`  ${w}`);
  console.log(`${plan.newTraditions.length} research passports from ${queue.length} candidates; ${plan.duplicates.length} already in the archive (${plan.duplicates.map((d) => d.slug).join(", ") || "none"}).`);
  archive = plan.next;
}

// Public content only.
const published = archive.traditions.filter((t) => t.status === "published");
const snapshot = { ...archive, traditions: published.sort((a, b) => a.passportNo.localeCompare(b.passportNo)) };
delete (snapshot as Partial<Archive>).backend;
const problems = validateArchive(snapshot);
if (problems.length) {
  console.error(`✗ ${problems.length} integrity problem(s); nothing was written:\n  ${problems.slice(0, 20).join("\n  ")}`);
  process.exit(1);
}
const numbers = new Map<string, string>();
for (const t of snapshot.traditions) {
  if (numbers.has(t.passportNo)) throw new Error(`Passport number ${t.passportNo} is used by both ${numbers.get(t.passportNo)} and ${t.slug}`);
  numbers.set(t.passportNo, t.slug);
}

// Report addresses that existed before and are now missing (their links would break).
const lost = Object.keys(ids).filter((slug) => !snapshot.traditions.some((t) => t.slug === slug || t.slugHistory?.includes(slug)));
if (lost.length) console.warn(`⚠ ${lost.length} earlier address(es) no longer have a passport: ${lost.slice(0, 20).join(", ")}`);
const renumbered = snapshot.traditions.filter((t) => ids[t.slug] && ids[t.slug].no !== t.passportNo);
if (renumbered.length) console.warn(`⚠ ${renumbered.length} passport(s) got a different number: ${renumbered.map((t) => t.slug).join(", ")}`);

await fs.writeFile(SNAPSHOT, JSON.stringify(snapshot) + "\n");
const nextIds: IdFile = { ...ids };
for (const t of snapshot.traditions) {
  const qid = t.id.match(/^trad-(q\d+)$/)?.[1]?.toUpperCase() ?? snapshot.sources.find((s) => s.id.startsWith("research-") && s.id.endsWith("-wikidata") && t.claims.some((c) => c.sources.includes(s.id)))?.id.split("-")[1]?.toUpperCase();
  nextIds[t.slug] = { no: t.passportNo, ...(qid ?? ids[t.slug]?.qid ? { qid: qid ?? ids[t.slug]?.qid } : {}) };
}
const sorted = Object.fromEntries(Object.entries(nextIds).sort((a, b) => a[1].no.localeCompare(b[1].no)));
await fs.writeFile(IDS, JSON.stringify(sorted, null, 1) + "\n");
const per = new Map<string, number>();
for (const t of snapshot.traditions) per.set(t.collection, (per.get(t.collection) ?? 0) + 1);
console.log(`✓ ${path.relative(root, SNAPSHOT)}: ${snapshot.traditions.length} passports in ${per.size} collections, ${snapshot.sources.length} sources, ${(JSON.stringify(snapshot).length / 1e6).toFixed(1)} MB`);
