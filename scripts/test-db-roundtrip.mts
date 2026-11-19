// End-to-end database test against a throwaway local PostgreSQL database:
//   npm run db:setup (migrations + seed) → the site's own loader (loadPostgresArchive) → deep-compare
//   with the seed, then exercise the site's write paths: save_tradition, upserts, uploads, the
//   research queue, corrections and the audit log.
// Run: npm run test:db      (needs `createdb` and `dropdb` on PATH, and a local PostgreSQL server)
import { execFileSync } from "node:child_process";
import { seedArchive } from "../src/lib/data/seed/index.ts";
import { archiveToRows, countryToRow, sourceToRow, traditionToRows } from "../src/lib/data/rows.ts";

const name = `cp_roundtrip_${process.pid}`;
const url = `postgresql:///${name}`;
const root = new URL("..", import.meta.url).pathname;
const canon = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(canon) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon((v as Record<string, unknown>)[k])])) : v;

let failures = 0;
const check = (label: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "✓" : "✗"} ${label}${!ok && detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

execFileSync("createdb", [name]);
process.env.DATABASE_URL = url;
const { db, upsertRow } = await import("../src/lib/db.ts");
const { loadPostgresArchive, ARCHIVE_TABLES } = await import("../src/lib/data/pg.ts");
const sql = db();
try {
  // ── setup script (the same command a user runs against Neon) ──
  const run = (args: string[] = []) =>
    execFileSync("node", ["scripts/db-setup.mts", ...args], { cwd: root, env: { ...process.env, DATABASE_URL: url }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const first = run();
  check("db:setup applies all four migrations", ["0001_schema", "0002_functions", "0003_media_files", "0004_research"].every((m) => first.includes(`applied ${m}`)), first);
  check("db:setup loads the seed", first.includes("loaded the seed archive"));
  const second = run();
  check("db:setup is safe to re-run", !second.includes("applied") && second.includes("seed not loaded"), second);
  check("db:setup never prints the connection string", !first.includes(url) && !second.includes(url));

  // ── read path: the site's own loader ──
  const expected = archiveToRows(seedArchive);
  for (const t of ARCHIVE_TABLES) {
    const [{ n }] = await sql.unsafe(`select count(*)::int as n from "${t}"`);
    check(`row count ${t}`, n === expected[t].length, `${n}/${expected[t].length}`);
  }
  const back = await loadPostgresArchive(sql);
  const same = JSON.stringify(canon({ ...back, backend: undefined })) === JSON.stringify(canon({ ...seedArchive, backend: undefined }));
  if (!same) {
    for (const k of Object.keys(seedArchive) as (keyof typeof seedArchive)[]) {
      const a = JSON.stringify(canon(seedArchive[k]));
      const b = JSON.stringify(canon(back[k]));
      if (a !== b) {
        let i = 0;
        while (i < a.length && a[i] === b[i]) i++;
        console.log(`  diff in ${String(k)} at ${i}:\n    seed: …${a.slice(Math.max(0, i - 80), i + 120)}\n    db:   …${b.slice(Math.max(0, i - 80), i + 120)}`);
      }
    }
  }
  check("archive round-trips through Postgres unchanged (loadPostgresArchive)", same);
  check("backend is reported as postgres", back.backend === "postgres");

  // ── write paths, as src/lib/data/mutations.ts calls them ──
  const idOf = (s: string) => seedArchive.traditions.find((t) => t.slug === s)?.id ?? s;
  const k = structuredClone(seedArchive.traditions[0]);
  k.tagline = "Edited through save_tradition.";
  k.claims = k.claims.slice(0, 3);
  await sql.unsafe("select save_tradition($1::jsonb)", [traditionToRows(k, idOf) as never]);
  const [saved] = await sql`select tagline, (select count(*)::int from claims where tradition_id = ${k.id}) as claims from traditions where id = ${k.id}`;
  check("save_tradition replaces fields and child rows atomically", saved.tagline === k.tagline && saved.claims === 3, JSON.stringify(saved));
  const reloaded = await loadPostgresArchive(sql);
  check("a saved passport reads back intact", JSON.stringify(canon(reloaded.traditions.find((t) => t.id === k.id))) === JSON.stringify(canon(k)));

  const draft = structuredClone(seedArchive.traditions[1]);
  // A fresh draft with no content of its own yet (claim, event and case IDs are unique across the archive).
  Object.assign(draft, {
    id: "trad-draft-test", slug: "draft-test", passportNo: "999", status: "draft", slugHistory: [],
    claims: [], timeline: [], origins: [], significance: [], related: [],
    makers: { ...draft.makers, intro: [], materials: [], process: [], practitioners: [] },
    travels: { intro: [], influences: [], cases: [] },
  });
  await sql.unsafe("select save_tradition($1::jsonb)", [traditionToRows(draft, idOf) as never]);
  check("drafts are stored and read back (public pages filter them out)", (await loadPostgresArchive(sql)).traditions.find((t) => t.id === draft.id)?.status === "draft");

  await upsertRow("sources", sourceToRow({ ...seedArchive.sources[0], title: "Updated title" }), ["id"], sql);
  await upsertRow("sources", sourceToRow({ id: "test-source", title: "New source", publisher: "Test", url: "https://example.org", type: "reference", accessed: "2026-11-19" }), ["id"], sql);
  const srcs = (await loadPostgresArchive(sql)).sources;
  check("upsertRow updates an existing source", srcs.find((s) => s.id === seedArchive.sources[0].id)?.title === "Updated title");
  check("upsertRow inserts a new source", srcs.some((s) => s.id === "test-source"));

  const peru = { iso2: "PE", isoNumeric: "604", slug: "peru", name: "Peru", status: "documenting" as const, plate: "", headline: "Stories being documented", intro: "…", candidates: [], centroid: [-75, -10] as [number, number] };
  await upsertRow("countries", countryToRow(peru), ["iso2"], sql);
  check("a new country can be added to the atlas", (await loadPostgresArchive(sql)).countries.some((c) => c.iso2 === "PE" && c.status === "documenting"));

  const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
  await sql`insert into media_files (id, content_type, bytes) values ('upload-test0001.jpg', 'image/jpeg', ${bytes})`;
  const [img] = await sql`select bytes from media_files where id = 'upload-test0001.jpg'`;
  check("uploaded images are stored and returned byte for byte", Buffer.compare(Buffer.from(img.bytes as Uint8Array), bytes) === 0);

  const upsertCandidate = (n: string) => sql`
    insert into research_candidates (id, country_iso2, wikidata_id, name, data, fetched_at)
    values ('wd-Q1', 'GH', 'Q1', ${n}, ${sql.json({ id: "wd-Q1", name: n })}, now())
    on conflict (id) do update set name = excluded.name, data = excluded.data, fetched_at = excluded.fetched_at`;
  await upsertCandidate("Test element");
  await sql`update research_candidates set status = 'rejected', note = 'Not material culture', reviewed_by = 'QA' where id = 'wd-Q1'`;
  await upsertCandidate("Test element (refreshed)");
  const [c1] = await sql`select name, status, note from research_candidates where id = 'wd-Q1'`;
  check("a pipeline refresh keeps the editor's decision", c1.status === "rejected" && c1.note === "Not material culture" && c1.name === "Test element (refreshed)", JSON.stringify(c1));

  await sql`insert into correction_requests (tradition_id, message) values (${k.id}, 'Please check the filing date of the GI application.')`;
  await sql`update correction_requests set status = 'accepted', resolution = 'Checked against the registry.', resolved_by = 'QA'`;
  const [corr] = await sql`select status, resolved_by from correction_requests`;
  check("corrections can be submitted and resolved", corr.status === "accepted" && corr.resolved_by === "QA");

  await sql`insert into content_revisions (entity, entity_id, editor, summary, fields) values ('country', 'PE', 'QA', 'Added Peru', ${["country"]})`;
  check("the audit log accepts country entries", (await sql`select count(*)::int as n from content_revisions where entity = 'country'`)[0].n === 1);

  let rejected = false;
  try {
    await sql`insert into correction_requests (tradition_id, message) values (${k.id}, 'short')`;
  } catch {
    rejected = true;
  }
  check("database constraints still reject invalid input", rejected);
} catch (e) {
  check("unexpected error", false, (e as Error).message);
} finally {
  await sql.end();
  execFileSync("dropdb", ["--if-exists", name]);
}
console.log(failures ? `\n${failures} check(s) failed` : "\nAll database checks passed");
process.exit(failures ? 1 : 0);
