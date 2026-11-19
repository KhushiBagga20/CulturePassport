import type postgres from "postgres";
import type { Archive } from "../types.ts";
import { readTables } from "../db.ts";
import { GLOBAL_TABLES, LATE_TABLES, TRADITION_CHILD_TABLES, rowsToArchive } from "./rows.ts";

export const ARCHIVE_TABLES = [...GLOBAL_TABLES, "traditions", ...TRADITION_CHILD_TABLES, ...LATE_TABLES];

/**
 * Reads the whole archive from PostgreSQL, drafts included (as in local mode). Public pages
 * filter with isPublic(); only the editor desk and editor previews show drafts.
 */
export async function loadPostgresArchive(sql?: postgres.Sql): Promise<Archive> {
  return { ...rowsToArchive(await readTables(ARCHIVE_TABLES, sql)), backend: "postgres" };
}
