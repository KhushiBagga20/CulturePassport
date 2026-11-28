import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { ResearchCandidate, ResearchFile } from "../research";
import { db } from "../db";
import { storeMode, useDatabase as dbConfigured } from "./store-mode";

/**
 * The research review queue, as editors see it: the research_candidates table when DATABASE_URL is
 * set, otherwise .data/research.json. Both are written by `npm run research`.
 * Callers must already have checked requireEditor().
 */
// Same file as RESEARCH_FILE, written as literal segments so the build can trace it narrowly.
const FILE = path.join(process.cwd(), ".data", "research.json");

async function readLocal(): Promise<ResearchFile> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as ResearchFile;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return { candidates: {} };
    throw e;
  }
}

let queue: Promise<unknown> = Promise.resolve();
function updateLocal(fn: (f: ResearchFile) => void) {
  const run = queue.then(async () => {
    const data = await readLocal();
    fn(data);
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.${randomUUID()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(tmp, FILE);
  });
  queue = run.catch(() => undefined);
  return run;
}

type Row = {
  id: string;
  data: ResearchCandidate;
  status: ResearchCandidate["status"];
  reviewed_by: string | null;
  reviewed_at: string | null;
  note: string | null;
  draft_id: string | null;
};

const fromRow = (r: Row): ResearchCandidate => ({
  ...r.data,
  id: r.id,
  status: r.status,
  reviewedBy: r.reviewed_by ?? undefined,
  reviewedAt: r.reviewed_at ?? undefined,
  note: r.note ?? undefined,
  draftId: r.draft_id ?? undefined,
});

export async function listCandidates(): Promise<ResearchCandidate[]> {
  if (dbConfigured()) {
    const [{ rows }] = await db()`
      select coalesce(json_agg(r), '[]'::json) as rows
      from (select id, data, status, reviewed_by, reviewed_at, note, draft_id from research_candidates limit 5000) r`;
    return (rows as Row[]).map(fromRow);
  }
  return Object.values((await readLocal()).candidates);
}

export async function getCandidate(id: string): Promise<ResearchCandidate | undefined> {
  return (await listCandidates()).find((c) => c.id === id);
}

export async function recordDecision(
  id: string,
  decision: { status: ResearchCandidate["status"]; reviewedBy: string; note?: string; draftId?: string },
): Promise<void> {
  const reviewedAt = new Date().toISOString();
  if (dbConfigured()) {
    const done = await db()`
      update research_candidates
      set status = ${decision.status}, reviewed_by = ${decision.reviewedBy}, reviewed_at = ${reviewedAt}, note = ${decision.note ?? null}, draft_id = ${decision.draftId ?? null}
      where id = ${id}`;
    if (!done.count) throw new Error("Candidate not found");
    return;
  }
  if (storeMode() === "github") throw new Error("The research queue lives on your computer: review candidates with npm run dev, then publish with npm run snapshot:build.");
  await updateLocal((f) => {
    const c = f.candidates[id];
    if (!c) throw new Error("Candidate not found");
    f.candidates[id] = { ...c, status: decision.status, reviewedBy: decision.reviewedBy, reviewedAt, note: decision.note, draftId: decision.draftId };
  });
}
