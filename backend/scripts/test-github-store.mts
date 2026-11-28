/**
 * Tests the GitHub-backed editorial store against an in-memory fake of the GitHub API
 * (no network, no token): saves become commits, concurrent saves retry, corrections are
 * stored encrypted, and uploads round-trip.
 *
 *   node backend/scripts/test-github-store.mts
 */
process.env.GITHUB_CONTENT_TOKEN = "test-token";
process.env.GITHUB_CONTENT_REPO = "example/repo";
process.env.EDITOR_SESSION_SECRET = "test-secret";

type Blob = Buffer;
const blobs = new Map<string, Blob>();
const trees = new Map<string, Map<string, string>>(); // tree sha → path → blob sha
const commits = new Map<string, { tree: string; parents: string[]; message: string }>();
let head = "c0";
trees.set("t0", new Map());
commits.set("c0", { tree: "t0", parents: [], message: "root" });
let n = 0;
const id = (p: string) => `${p}${++n}`;
let raceOnce = false; // simulate another editor's commit landing between read and write

globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
  const url = new URL(String(input));
  const p = url.pathname.replace("/repos/example/repo", "");
  const method = init?.method ?? "GET";
  const body = init?.body ? JSON.parse(String(init.body)) : undefined;
  const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { "content-type": "application/json" } });
  if (p === "/git/ref/heads/main" && method === "GET") return json({ object: { sha: head } });
  if (p.startsWith("/git/commits/") && method === "GET") return json({ tree: { sha: commits.get(p.split("/").pop()!)!.tree } });
  if (p === "/git/blobs") {
    const sha = id("b");
    blobs.set(sha, Buffer.from(body.content, "base64"));
    return json({ sha });
  }
  if (p === "/git/trees") {
    const t = new Map(trees.get(body.base_tree));
    for (const e of body.tree) t.set(e.path, e.sha);
    const sha = id("t");
    trees.set(sha, t);
    return json({ sha });
  }
  if (p === "/git/commits" && method === "POST") {
    const sha = id("c");
    commits.set(sha, { tree: body.tree, parents: body.parents, message: body.message });
    return json({ sha });
  }
  if (p === "/git/refs/heads/main" && method === "PATCH") {
    if (raceOnce) {
      raceOnce = false;
      const other = id("c");
      commits.set(other, { tree: commits.get(head)!.tree, parents: [head], message: "someone else" });
      head = other;
    }
    if (commits.get(body.sha)!.parents[0] !== head) return json({ message: "Update is not a fast forward" }, 422);
    head = body.sha;
    return json({ object: { sha: head } });
  }
  if (p.startsWith("/contents/")) {
    const path = decodeURIComponent(p.slice("/contents/".length));
    const ref = url.searchParams.get("ref") ?? "main";
    const commit = commits.get(ref === "main" ? head : ref)!;
    const blob = trees.get(commit.tree)!.get(path);
    if (!blob) return json({ message: "Not Found" }, 404);
    return new Response(new Uint8Array(blobs.get(blob)!), { status: 200 });
  }
  return json({ message: `unhandled ${method} ${p}` }, 500);
}) as typeof fetch;

const { readStore, updateStore } = await import("../../src/lib/data/local-store.ts");
const { putFile, readFile, STORE_PATH, CORRECTIONS_PATH } = await import("../../src/lib/data/github-store.ts");

let failed = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — ${detail}`}`);
  if (!ok) failed++;
};

await updateStore((s) => {
  s.sources["src-x"] = { id: "src-x", title: "A source", publisher: "P", type: "reference", url: "https://example.org" } as never;
  s.revisions.unshift({ id: "r1", entity: "source", entityId: "src-x", editor: "Ed", at: "2026-11-28", summary: "Added", fields: [] });
}, "Editorial desk: added a source");
check("a save becomes one commit", commits.get(head)!.message === "Editorial desk: added a source");
check("the change is readable from the branch", (await readStore()).sources["src-x"]?.title === "A source");

const before = head;
await updateStore(() => {}, "nothing");
check("a save with no change makes no commit", head === before);

raceOnce = true;
await updateStore((s) => {
  s.sources["src-y"] = { id: "src-y", title: "Second" } as never;
}, "Editorial desk: second");
const s2 = await readStore();
check("a save retries when another commit lands first", !!s2.sources["src-y"] && !!s2.sources["src-x"] && commits.get(head)!.message === "Editorial desk: second");

await updateStore((s) => {
  s.corrections.unshift({ id: "k1", tradition: "trad-x", message: "Typo in the date", contact: "reader@example.org", status: "open", createdAt: "2026-11-28" });
}, "Correction request received");
const raw = (await readFile(CORRECTIONS_PATH))!.toString("utf8");
check("corrections are stored encrypted", !raw.includes("reader@example.org") && !raw.includes("Typo"));
check("the public store file holds no corrections", !(await readFile(STORE_PATH))!.toString("utf8").includes("reader@example.org"));
check("corrections decrypt for editors", (await readStore()).corrections[0]?.contact === "reader@example.org");

await putFile("backend/data/editor/uploads/upload-12345678.png", Buffer.from([137, 80, 78, 71]), "upload");
check("uploads round-trip", (await readFile("backend/data/editor/uploads/upload-12345678.png"))?.[1] === 80);

console.log(failed ? `\n${failed} check(s) failed` : "\nAll GitHub store checks passed");
process.exitCode = failed ? 1 : 0;
