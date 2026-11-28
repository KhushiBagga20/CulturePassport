/**
 * Loads the snapshot (src/lib/data/snapshot.json) into PostgreSQL, so the editorial desk starts from
 * exactly what the public site shows. Run it before editing in /admin whenever the snapshot was
 * rebuilt outside the database (npm run snapshot:build), or `snapshot:export` would bring back
 * the older database text.
 *
 *   npm run db:load-snapshot -- --yes
 *
 * In one transaction it replaces every published passport with the snapshot's version (passports
 * kept by id keep their corrections and QR records), removes published passports that are not in
 * the snapshot, and updates sources, countries, places, organisations, images, routes and trails.
 * Drafts, uploads, corrections and the research queue are left alone.
 */
import { db, upsertRow } from "../../src/lib/db.ts";
import { loadPostgresArchive } from "../../src/lib/data/pg.ts";
import { archiveToRows, GLOBAL_TABLES, LATE_TABLES, traditionToRows } from "../../src/lib/data/rows.ts";
import type { Archive } from "../../src/lib/types.ts";
import { readFileSync } from "node:fs";

if (!process.argv.includes("--yes")) {
  console.error("This replaces the published archive in DATABASE_URL with the snapshot. Re-run with --yes to continue.");
  process.exit(1);
}
if (!process.env.DATABASE_URL?.trim()) {
  console.error("DATABASE_URL is not set (add it to .env.local).");
  process.exit(1);
}
const snapshot = JSON.parse(readFileSync(new URL("../../src/lib/data/snapshot.json", import.meta.url), "utf8")) as Omit<Archive, "backend">;
const rows = archiveToRows(snapshot);
const KEY: Record<string, string[]> = { countries: ["iso2"], trails: ["slug"], trail_steps: ["trail_slug", "position"] };
const sql = db();
try {
  await sql.begin(async (tx) => {
    const t = tx as unknown as typeof sql;
    const ids = snapshot.traditions.map((x) => x.id);
    const removed = await t`delete from traditions where status = 'published' and id <> all(${ids}) returning id`;
    const write = async (table: string) => {
      for (const row of rows[table] ?? []) {
        const key = KEY[table] ?? ("id" in row ? ["id"] : null);
        if (key) await upsertRow(table, row, key, t);
        else {
          const cols = Object.keys(row).map((c) => `"${c}"`).join(", ");
          await t.unsafe(`insert into "${table}" (${cols}) select ${cols} from jsonb_populate_record(null::"${table}", $1::jsonb) on conflict do nothing`, [row as never]);
        }
      }
    };
    for (const table of GLOBAL_TABLES) await write(table);
    const idOf = new Map(snapshot.traditions.map((x) => [x.slug, x.id]));
    for (const tr of snapshot.traditions) await t.unsafe("select save_tradition($1::jsonb)", [traditionToRows(tr, (s) => idOf.get(s) ?? s) as never]);
    for (const table of LATE_TABLES) await write(table);
    await t`insert into content_revisions (entity, entity_id, editor, summary, fields) values ('tradition', 'all', 'Snapshot loader', ${`Loaded the snapshot: ${snapshot.traditions.length} published passports, ${removed.length} older published passports removed`}, ${["snapshot"]})`;
    console.log(`✓ ${snapshot.traditions.length} passports loaded; ${removed.length} published passports not in the snapshot removed.`);
  });
  const back = await loadPostgresArchive(sql);
  const published = back.traditions.filter((x) => x.status === "published").length;
  console.log(`  The database now has ${published} published passports (snapshot: ${snapshot.traditions.length}).`);
  if (published !== snapshot.traditions.length) process.exitCode = 1;
} catch (e) {
  console.error(`✗ ${(e as Error).message.replaceAll(process.env.DATABASE_URL!, "<DATABASE_URL>")}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
