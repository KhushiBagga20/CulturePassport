import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Editorial storage in the site's own GitHub repository, so the editorial desk works on Vercel
 * without a database. Each save is one commit to backend/data/editor/; Vercel redeploys and the
 * public site shows published changes about a minute later.
 *
 * Configure on the server (never with a NEXT_PUBLIC_ name):
 *   GITHUB_CONTENT_TOKEN   fine-grained token with "Contents: read and write" on this repository only
 *   GITHUB_CONTENT_REPO    owner/name, e.g. KhushiBagga20/CulturePassport
 *   GITHUB_CONTENT_BRANCH  optional, default "main"
 *
 * The repository is public, so readers' correction requests (which may hold contact details) are
 * stored encrypted (AES-256-GCM, key from EDITOR_SESSION_SECRET, or EDITOR_PASSCODE if unset).
 */
export const EDITOR_DIR = "backend/data/editor";
export const STORE_PATH = `${EDITOR_DIR}/store.json`;
export const CORRECTIONS_PATH = `${EDITOR_DIR}/corrections.enc`;
export const UPLOADS_PATH = `${EDITOR_DIR}/uploads`;

function config() {
  const token = process.env.GITHUB_CONTENT_TOKEN?.trim();
  const repo = process.env.GITHUB_CONTENT_REPO?.trim();
  if (!token || !repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) return null;
  return { token, repo, branch: process.env.GITHUB_CONTENT_BRANCH?.trim() || "main" };
}

export const githubStoreConfigured = () => config() !== null;

class GitHubError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function gh<T>(path: string, init: { method?: string; body?: unknown; raw?: boolean } = {}): Promise<T> {
  const c = config();
  if (!c) throw new Error("GitHub content storage is not configured");
  const r = await fetch(`https://api.github.com/repos/${c.repo}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${c.token}`,
      Accept: init.raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "culture-passport-editorial-desk",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) {
    // Never echo the token; GitHub's message is enough to diagnose (bad token, no access, conflict).
    const msg = ((await r.json().catch(() => ({}))) as { message?: string }).message ?? r.statusText;
    throw new GitHubError(`GitHub ${r.status}: ${msg}`, r.status);
  }
  return (init.raw ? Buffer.from(await r.arrayBuffer()) : await r.json()) as T;
}

/** The branch's current commit. */
export async function headCommit(): Promise<string> {
  const ref = await gh<{ object: { sha: string } }>(`/git/ref/heads/${config()!.branch}`);
  return ref.object.sha;
}

/** A file's bytes at a commit (or the branch head), or null if it does not exist. */
export async function readFile(path: string, ref?: string): Promise<Buffer | null> {
  try {
    return await gh<Buffer>(`/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(ref ?? config()!.branch)}`, { raw: true });
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return null;
    throw e;
  }
}

/**
 * Commits several files at once on top of `parent`. Returns false when the branch has moved on
 * since `parent` (another save landed first), so the caller can re-read and retry.
 */
export async function commitFiles(parent: string, files: { path: string; content: Buffer }[], message: string): Promise<boolean> {
  const base = await gh<{ tree: { sha: string } }>(`/git/commits/${parent}`);
  const tree = await Promise.all(
    files.map(async (f) => {
      const blob = await gh<{ sha: string }>(`/git/blobs`, { method: "POST", body: { content: f.content.toString("base64"), encoding: "base64" } });
      return { path: f.path, mode: "100644", type: "blob", sha: blob.sha };
    }),
  );
  const newTree = await gh<{ sha: string }>(`/git/trees`, { method: "POST", body: { base_tree: base.tree.sha, tree } });
  const commit = await gh<{ sha: string }>(`/git/commits`, { method: "POST", body: { message, tree: newTree.sha, parents: [parent] } });
  try {
    await gh(`/git/refs/heads/${config()!.branch}`, { method: "PATCH", body: { sha: commit.sha, force: false } });
    return true;
  } catch (e) {
    if (e instanceof GitHubError && (e.status === 422 || e.status === 409)) return false;
    throw e;
  }
}

// ───────────────────────────── encrypted corrections ─────────────────────────────

function key(): Buffer {
  const secret = (process.env.EDITOR_SESSION_SECRET ?? process.env.DEMO_SESSION_SECRET ?? process.env.EDITOR_PASSCODE ?? process.env.DEMO_ADMIN_PASSWORD)?.trim();
  if (!secret) throw new Error("Set EDITOR_SESSION_SECRET to store correction requests.");
  return createHash("sha256").update(`culture-passport/corrections/${secret}`).digest();
}

export function encrypt(value: unknown): Buffer {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(JSON.stringify(value), "utf8"), c.final()]);
  return Buffer.from(Buffer.concat([iv, c.getAuthTag(), body]).toString("base64"));
}

export function decrypt<T>(data: Buffer): T {
  const raw = Buffer.from(data.toString("utf8"), "base64");
  const d = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
  d.setAuthTag(raw.subarray(12, 28));
  return JSON.parse(Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8")) as T;
}

/** Adds or replaces one file in its own commit, retrying if another save lands first. */
export async function putFile(path: string, content: Buffer, message: string): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt++) {
    if (await commitFiles(await headCommit(), [{ path, content }], message)) return;
  }
  throw new Error("Another save landed at the same moment. Please try again.");
}
