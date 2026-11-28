import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { CorrectionRequest, CountryRecord, MediaAsset, Revision, Source, Tradition } from "../types.ts";
import { commitFiles, CORRECTIONS_PATH, decrypt, encrypt, githubStoreConfigured, headCommit, readFile, STORE_PATH } from "./github-store.ts";

/**
 * The editorial store: edits kept as overrides on top of the published snapshot, which itself is
 * never modified. It lives in one of two places:
 *  - the GitHub repository (backend/data/editor/, see github-store.ts) when GITHUB_CONTENT_TOKEN is
 *    set: works on Vercel, each save is a commit and redeploys the site;
 *  - otherwise .data/store.json on a writable disk (`next dev`, `next start`).
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

const MAX_REVISIONS = 300;

async function readDisk(): Promise<LocalStore> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return { ...empty(), ...(JSON.parse(raw) as Partial<LocalStore>) };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return empty();
    throw err;
  }
}

/** The store as committed at `ref`, with corrections decrypted (null if they cannot be read). */
async function readGitHub(ref: string): Promise<{ store: LocalStore; corrections: CorrectionRequest[] | null }> {
  const [raw, enc] = await Promise.all([readFile(STORE_PATH, ref), readFile(CORRECTIONS_PATH, ref)]);
  const store = { ...empty(), ...(raw ? (JSON.parse(raw.toString("utf8")) as Partial<LocalStore>) : {}) };
  let corrections: CorrectionRequest[] | null = [];
  if (enc && enc.length) {
    try {
      corrections = decrypt<CorrectionRequest[]>(enc);
    } catch {
      corrections = null; // encrypted with another secret
    }
  }
  store.corrections = corrections ?? [];
  return { store, corrections };
}

export async function readStore(): Promise<LocalStore> {
  if (githubStoreConfigured()) return (await readGitHub(await headCommit())).store;
  return readDisk();
}

let queue: Promise<unknown> = Promise.resolve();

/**
 * Serialised read-modify-write so concurrent saves cannot clobber each other. On GitHub the write
 * is one commit on top of the commit that was read; if another save landed first, it re-reads
 * and applies the change again.
 */
export function updateStore<T>(fn: (s: LocalStore) => T | Promise<T>, message = "Editorial desk: update"): Promise<T> {
  const run = queue.then(async () => {
    if (githubStoreConfigured()) {
      for (let attempt = 0; attempt < 4; attempt++) {
        const head = await headCommit();
        const { store, corrections } = await readGitHub(head);
        const { corrections: beforeCorrections, ...rest } = store;
        const before = JSON.stringify(rest);
        const beforeC = JSON.stringify(beforeCorrections);
        const result = await fn(store);
        store.revisions = store.revisions.slice(0, MAX_REVISIONS);
        const { corrections: afterCorrections, ...after } = store;
        const files: { path: string; content: Buffer }[] = [];
        if (JSON.stringify(after) !== before) files.push({ path: STORE_PATH, content: Buffer.from(JSON.stringify({ ...after, corrections: [] }, null, 1) + "\n") });
        if (JSON.stringify(afterCorrections) !== beforeC || (corrections === null && afterCorrections.length)) files.push({ path: CORRECTIONS_PATH, content: encrypt(afterCorrections) });
        if (!files.length) return result;
        if (await commitFiles(head, files, message)) return result;
      }
      throw new Error("Another save landed at the same moment. Please try again.");
    }
    const store = await readDisk();
    const result = await fn(store);
    store.revisions = store.revisions.slice(0, MAX_REVISIONS);
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
