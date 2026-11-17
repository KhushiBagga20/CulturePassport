// End-to-end database test against a local PostgreSQL (no Supabase project needed):
//   migrations → generated seed.sql → read every table back → rowsToArchive → deep-compare with the seed,
//   then exercise RLS (anon cannot see drafts, cannot write) and the save_tradition RPC as an editor.
// Run: node scripts/test-db-roundtrip.mts      (needs `createdb`, `psql`, `dropdb` on PATH)
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { seedArchive } from "../src/lib/data/seed/index.ts";
import { archiveToRows, rowsToArchive, traditionToRows, GLOBAL_TABLES, TRADITION_CHILD_TABLES, LATE_TABLES } from "../src/lib/data/rows.ts";

const db = `cp_roundtrip_${process.pid}`;
const root = new URL("..", import.meta.url).pathname;
const work = mkdtempSync(path.join(tmpdir(), "cp-db-"));
const EDITOR = "00000000-0000-4000-8000-000000000001";

function psql(sql: string, opts: { quiet?: boolean } = {}): string {
  const file = path.join(work, `q${Math.random().toString(36).slice(2)}.sql`);
  writeFileSync(file, sql);
  return execFileSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-At", "-d", db, "-f", file], {
    env: { ...process.env, PGOPTIONS: "-c client_min_messages=warning" },
    encoding: "utf8",
    stdio: ["ignore", "pipe", opts.quiet ? "ignore" : "inherit"],
  });
}
const file = (p: string) => readFileSync(path.join(root, p), "utf8");
const canon = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(canon) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon((v as Record<string, unknown>)[k])])) : v;

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

execFileSync("createdb", [db]);
try {
  // Minimal stand-ins for what Supabase provides: roles, auth schema, auth.uid().
  psql(`
    do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
    do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $f$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $f$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `);
  psql(file("supabase/migrations/0001_schema.sql"));
  psql(file("supabase/migrations/0002_policies.sql"));
  psql(`grant usage on schema public to anon, authenticated;
        grant select, insert, update, delete on all tables in schema public to anon, authenticated;`);
  check("migrations apply cleanly", true);

  psql(file("supabase/seed.sql"));
  const tables = [...GLOBAL_TABLES, "traditions", ...TRADITION_CHILD_TABLES, ...LATE_TABLES];
  const expected = archiveToRows(seedArchive);
  const read = (role?: string) => {
    const rows: Record<string, Record<string, unknown>[]> = {};
    for (const t of tables) {
      const prefix = role ? `set role ${role};` : "";
      rows[t] = JSON.parse(psql(`${prefix} select coalesce(json_agg(x), '[]'::json) from ${t} x;`).trim() || "[]");
    }
    return rows;
  };
  const rows = read();
  for (const t of tables) check(`row count ${t}`, rows[t].length === expected[t].length, `${rows[t].length}/${expected[t].length}`);

  const back = rowsToArchive(rows);
  const same = JSON.stringify(canon(back)) === JSON.stringify(canon(seedArchive));
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
  check("archive round-trips through Postgres unchanged", same);

  // ── RLS ──
  psql(`update traditions set status = 'draft' where slug = 'warli-painting';`);
  const anonRows = read("anon");
  check("anon cannot read draft traditions", !anonRows.traditions.some((t) => t.slug === "warli-painting"));
  check("anon cannot read claims of drafts", !anonRows.claims.some((c) => c.tradition_id === "trad-warli"));
  check("anon still reads published traditions", anonRows.traditions.length === seedArchive.traditions.length - 1);
  let denied = false;
  try {
    psql(`set role anon; update traditions set tagline = 'x' where slug = 'kolhapuri-chappal';
          select count(*) from traditions where tagline = 'x';`, { quiet: true });
    denied = psql(`select count(*) from traditions where tagline = 'x';`).trim() === "0";
  } catch {
    denied = true;
  }
  check("anon cannot modify content", denied);
  psql(`set role anon; insert into correction_requests (tradition_id, message) values ('trad-kolhapuri', 'Please check the filing date of the GI application.');`);
  check("anon can submit a correction request", psql(`select count(*) from correction_requests;`).trim() === "1");
  let anonReadCorrections = "";
  try {
    anonReadCorrections = psql(`set role anon; select count(*) from correction_requests;`).trim();
  } catch {
    anonReadCorrections = "error";
  }
  check("anon cannot read correction requests", anonReadCorrections === "0" || anonReadCorrections === "error");

  // ── save_tradition as an editor ──
  psql(`insert into auth.users values ('${EDITOR}'); insert into editors (user_id, role) values ('${EDITOR}', 'admin');`);
  const k = structuredClone(seedArchive.traditions[0]);
  k.tagline = "Edited through the editor RPC.";
  k.claims = k.claims.slice(0, 3);
  const payload = traditionToRows(k, (s) => seedArchive.traditions.find((t) => t.slug === s)?.id ?? s);
  psql(`set role authenticated; select set_config('request.jwt.claim.sub', '${EDITOR}', false);
        select save_tradition($json$${JSON.stringify(payload)}$json$::jsonb);`);
  const saved = psql(`select tagline || '|' || (select count(*) from claims where tradition_id = 'trad-kolhapuri') from traditions where id = 'trad-kolhapuri';`).trim();
  check("editor save_tradition replaces fields and children atomically", saved === "Edited through the editor RPC.|3", saved);
  let blocked = false;
  try {
    psql(`set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000099', false);
          select save_tradition($json$${JSON.stringify(payload)}$json$::jsonb);`, { quiet: true });
  } catch {
    blocked = true;
  }
  check("non-editors cannot call save_tradition", blocked);
} finally {
  execFileSync("dropdb", ["--if-exists", db]);
}
console.log(failures ? `\n${failures} check(s) failed` : "\nAll database checks passed");
process.exit(failures ? 1 : 0);
