/**
 * One-command Supabase setup.
 *
 *   npm run db:setup                              apply pending migrations, load the seed if the archive is empty, then check
 *   npm run db:setup -- --editor you@example.com  make an existing Supabase Auth user an editor (admin)
 *   npm run db:setup -- --check                   only report what is there
 *
 * Reads SUPABASE_DB_URL (the project's Postgres connection string) from pipeline/.env, which is
 * git-ignored and never read by the web app. The connection string is never printed.
 * Needs `psql` on PATH.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error(
    "SUPABASE_DB_URL is not set. Add it to pipeline/.env (Supabase dashboard → Connect → connection string, with your database password).",
  );
  process.exit(1);
}
const argv = process.argv.slice(2);
const checkOnly = argv.includes("--check");
const editorEmail = argv.find((a, i) => argv[i - 1] === "--editor") ?? argv.find((a) => a.startsWith("--editor="))?.split("=")[1];

const work = mkdtempSync(path.join(tmpdir(), "cp-setup-"));
function psql(sql: string, vars: Record<string, string> = {}): string {
  const file = path.join(work, `q${Math.random().toString(36).slice(2)}.sql`);
  writeFileSync(file, sql);
  const v = Object.entries(vars).flatMap(([k, val]) => ["-v", `${k}=${val}`]);
  try {
    return execFileSync("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-q", "-At", ...v, "-d", url!, "-f", file], {
      encoding: "utf8",
      env: { ...process.env, PGOPTIONS: "-c client_min_messages=warning", PGCONNECT_TIMEOUT: "15" },
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    // Report psql's own message, which never includes the connection string.
    const err = e as { stderr?: string };
    throw new Error((err.stderr ?? String(e)).replaceAll(url!, "<SUPABASE_DB_URL>").trim());
  }
}
const one = (sql: string, vars?: Record<string, string>) => psql(sql, vars).trim();

try {
  const version = one("select current_setting('server_version');");
  const isSupabase = one("select count(*) from pg_namespace where nspname in ('auth', 'storage');") === "2";
  console.log(`Connected · PostgreSQL ${version}${isSupabase ? " · Supabase" : ""}`);
  if (!isSupabase && one("select count(*) from pg_namespace where nspname = 'auth';") !== "1") {
    throw new Error("This database has no `auth` schema, so it is not a Supabase project. Check SUPABASE_DB_URL.");
  }

  if (!checkOnly) {
    // Bookkeeping lives outside the `public` schema so the Supabase API never exposes it.
    psql(`create schema if not exists cp_admin;
          create table if not exists cp_admin.migrations (name text primary key, applied_at timestamptz not null default now());
          revoke all on schema cp_admin from public;`);
    const applied = new Set(one("select coalesce(string_agg(name, ','), '') from cp_admin.migrations;").split(",").filter(Boolean));
    const hasStorage = one("select count(*) from pg_namespace where nspname = 'storage';") === "1";
    // A project set up by hand before this script: detect the base schema and record it rather than re-running it.
    if (!applied.size && one("select count(*) from information_schema.tables where table_schema = 'public' and table_name = 'traditions';") === "1") {
      console.log("Found an existing Culture Passport schema; recording 0001–0003 as applied.");
      psql(`insert into cp_admin.migrations (name) values ('0001_schema.sql'), ('0002_policies.sql'), ('0003_storage.sql') on conflict do nothing;`);
      ["0001_schema.sql", "0002_policies.sql", "0003_storage.sql"].forEach((m) => applied.add(m));
    }
    const dir = path.join(process.cwd(), "supabase", "migrations");
    for (const m of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
      if (applied.has(m)) continue;
      if (m.includes("storage") && !hasStorage) {
        console.log(`· skipped ${m} (no storage schema)`);
        continue;
      }
      psql(`begin;\n${readFileSync(path.join(dir, m), "utf8")}\ninsert into cp_admin.migrations (name) values ('${m}');\ncommit;`);
      console.log(`✓ applied ${m}`);
    }

    if (one("select count(*) from traditions;") === "0") {
      psql(`begin;\n${readFileSync(path.join(process.cwd(), "supabase", "seed.sql"), "utf8")}\ncommit;`);
      console.log("✓ loaded the seed archive (supabase/seed.sql)");
    } else {
      console.log("· archive already has content; seed not loaded");
    }
  }

  if (editorEmail) {
    const id = one(`select id from auth.users where lower(email) = lower(:'email') limit 1;`, { email: editorEmail });
    if (!id) throw new Error("No Supabase Auth user has that email yet. Create the user first (Dashboard → Authentication → Add user), then re-run.");
    psql(`insert into editors (user_id, role) values (:'id', 'admin') on conflict (user_id) do update set role = 'admin';`, { id });
    console.log("✓ that user is now an editor (admin)");
  }

  // ── report ──
  const count = (t: string) => one(`select count(*) from ${t};`);
  console.log(
    `\nArchive: ${count("traditions")} passports (${one("select count(*) from traditions where status = 'published';")} published) · ${count("sources")} sources · ${count("countries")} countries · ${count("research_candidates")} research candidates · ${count("editors")} editor(s)`,
  );
  const anonPassports = one("begin; set local role anon; select count(*) from traditions; rollback;").split("\n").pop();
  const anonResearch = one("begin; set local role anon; select count(*) from research_candidates; rollback;").split("\n").pop();
  console.log(`Public (anon) view: ${anonPassports} passports · ${anonResearch} research candidates (should be 0)`);
  if (anonResearch !== "0") process.exitCode = 1;
} catch (e) {
  console.error(`\n✗ ${(e as Error).message}`);
  process.exitCode = 1;
} finally {
  rmSync(work, { recursive: true, force: true });
}
