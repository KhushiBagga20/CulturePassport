/**
 * One-command database setup for plain PostgreSQL (for example Neon).
 *
 *   npm run db:setup            apply pending migrations, load the seed if the archive is empty, then report
 *   npm run db:setup -- --check only report what is there
 *
 * Reads DATABASE_URL from .env.local (or pipeline/.env). The connection string is never printed.
 * Safe to re-run: applied migrations are recorded in cp_admin.migrations.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { db } from "../../src/lib/db.ts";

if (!process.env.DATABASE_URL?.trim()) {
  console.error("DATABASE_URL is not set. Add your Neon connection string to .env.local (see the README).");
  process.exit(1);
}
const checkOnly = process.argv.includes("--check");
const sql = db();
const root = process.cwd();
const hide = (msg: string) => msg.replaceAll(process.env.DATABASE_URL!, "<DATABASE_URL>");

try {
  const [{ version }] = await sql`select current_setting('server_version') as version`;
  console.log(`Connected · PostgreSQL ${version}`);

  if (!checkOnly) {
    // Bookkeeping lives in its own schema, away from the archive's tables.
    await sql.unsafe(`create schema if not exists cp_admin;
      create table if not exists cp_admin.migrations (name text primary key, applied_at timestamptz not null default now());`);
    const applied = new Set((await sql`select name from cp_admin.migrations`).map((r) => r.name as string));
    const dir = path.join(root, "backend", "db", "migrations");
    for (const m of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
      if (applied.has(m)) continue;
      await sql.begin(async (tx) => {
        await tx.unsafe(readFileSync(path.join(dir, m), "utf8"));
        await tx`insert into cp_admin.migrations (name) values (${m})`;
      });
      console.log(`✓ applied ${m}`);
    }

    const [{ n }] = await sql`select count(*)::int as n from traditions`;
    if (n === 0) {
      await sql.begin(async (tx) => {
        await tx.unsafe(readFileSync(path.join(root, "backend", "db", "seed.sql"), "utf8"));
      });
      console.log("✓ loaded the seed archive (db/seed.sql)");
    } else {
      console.log("· the archive already has content; seed not loaded");
    }
  }

  const [r] = await sql`
    select (select count(*) from traditions)::int as passports,
           (select count(*) from traditions where status = 'published')::int as published,
           (select count(*) from sources)::int as sources,
           (select count(*) from countries)::int as countries,
           (select count(*) from research_candidates)::int as candidates,
           (select count(*) from media_files)::int as uploads`;
  console.log(
    `\nArchive: ${r.passports} passports (${r.published} published) · ${r.sources} sources · ${r.countries} countries · ${r.candidates} research candidates · ${r.uploads} uploaded images`,
  );
} catch (e) {
  console.error(`\n✗ ${hide((e as Error).message)}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
