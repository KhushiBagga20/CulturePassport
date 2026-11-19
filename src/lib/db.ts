import postgres from "postgres";

/**
 * Plain PostgreSQL (for example Neon). Only the server connects, using DATABASE_URL, which must
 * never be given a NEXT_PUBLIC_ name. Editing is authorised by the app's editor session; public
 * pages show published passports only (isPublic). Without DATABASE_URL the app runs in local mode.
 *
 * Kept free of path aliases so the setup script, the pipeline and the tests can import it.
 */
export const dbConfigured = () => !!process.env.DATABASE_URL?.trim();

const g = globalThis as unknown as { __cpSql?: postgres.Sql };

export function db(): postgres.Sql {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not set");
  // One small pool per process; reused across hot reloads in development.
  g.__cpSql ??= postgres(url, {
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idle_timeout: 20,
    connect_timeout: 15,
    // Neon's pooled endpoint (PgBouncer, transaction mode) does not support named prepared statements.
    prepare: false,
    onnotice: () => {},
  });
  return g.__cpSql;
}

const ident = (name: string) => {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error(`Unsafe SQL identifier: ${name}`);
  return `"${name}"`;
};

/**
 * Inserts or updates one row. Values go through jsonb_populate_record, so Postgres converts each
 * field to its column type (enums, arrays, jsonb, numbers) exactly as the seed loader does.
 */
export async function upsertRow(table: string, row: Record<string, unknown>, key: string[], sql: postgres.Sql = db()) {
  const cols = Object.keys(row).map(ident);
  const keys = key.map(ident);
  const updates = cols.filter((c) => !keys.includes(c));
  await sql.unsafe(
    `insert into ${ident(table)} (${cols.join(", ")})
     select ${cols.join(", ")} from jsonb_populate_record(null::${ident(table)}, $1::jsonb)
     on conflict (${keys.join(", ")}) do ${updates.length ? `update set ${updates.map((c) => `${c} = excluded.${c}`).join(", ")}` : "nothing"}`,
    // Passed as an object: the driver encodes it once for the jsonb parameter.
    [row as never],
  );
}

/** Every table as JSON in one round trip (the archive is small). */
export async function readTables(tables: string[], sql: postgres.Sql = db()): Promise<Record<string, Record<string, unknown>[]>> {
  const parts = tables.map((t) => `'${t}', (select coalesce(json_agg(x), '[]'::json) from ${ident(t)} x)`);
  // json_build_object takes at most 100 arguments, so read in chunks of 40 tables.
  const out: Record<string, Record<string, unknown>[]> = {};
  for (let i = 0; i < parts.length; i += 40) {
    const [row] = await sql.unsafe(`select json_build_object(${parts.slice(i, i + 40).join(", ")}) as t`);
    Object.assign(out, row.t as Record<string, Record<string, unknown>[]>);
  }
  return out;
}
