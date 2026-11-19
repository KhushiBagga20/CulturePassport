import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { CorrectionRequest, CountryRecord, MediaAsset, Revision, Source, Tradition } from "../types";

/**
 * Local demo-mode store. Admin edits are written to .data/store.json as overrides on top
 * of the seed archive, so the seed itself is never modified. This works for `next dev`
 * and `next start` on a writable disk; serverless hosts need the Supabase backend.
 */
export interface LocalStore {
  traditions: Record<string, Tradition>;
  sources: Record<string, Source>;
  media: Record<string, MediaAsset>;
  /** countries added to the atlas from the research queue, keyed by ISO alpha-2 */
  countries: Record<string, CountryRecord>;
  revisions: Revision[];
  corrections: CorrectionRequest[];
}

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "store.json");
export const UPLOAD_DIR = path.join(DIR, "uploads");

const empty = (): LocalStore => ({ traditions: {}, sources: {}, media: {}, countries: {}, revisions: [], corrections: [] });

export async function readStore(): Promise<LocalStore> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return { ...empty(), ...(JSON.parse(raw) as Partial<LocalStore>) };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return empty();
    throw err;
  }
}

let queue: Promise<unknown> = Promise.resolve();

/** Serialised read-modify-write so concurrent admin saves cannot clobber each other. */
export function updateStore<T>(fn: (s: LocalStore) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const store = await readStore();
    const result = await fn(store);
    await fs.mkdir(DIR, { recursive: true });
    const tmp = `${FILE}.${randomUUID()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
    await fs.rename(tmp, FILE);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export async function storeHasEdits(): Promise<boolean> {
  const s = await readStore();
  return Object.keys(s.traditions).length + Object.keys(s.sources).length + Object.keys(s.media).length + Object.keys(s.countries).length > 0;
}
