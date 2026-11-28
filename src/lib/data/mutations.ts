import { randomUUID } from "node:crypto";
import type { CorrectionRequest, CountryRecord, MediaAsset, Revision, Source, Tradition } from "../types";
import { readStore, updateStore } from "./local-store";
import { getEditorArchive } from "./archive";
import type postgres from "postgres";
import { db, upsertRow } from "../db";
import { useDatabase as dbConfigured } from "./store-mode";
import type { LocalStore } from "./local-store";
import { countryToRow, mediaToRow, sourceToRow, traditionToRows } from "./rows";

/** Field-level diff summary for the audit trail. */
export function changedFields(before: unknown, after: unknown, prefix = ""): string[] {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  if (before && after && typeof before === "object" && typeof after === "object" && !Array.isArray(before)) {
    const keys = new Set([...Object.keys(before as object), ...Object.keys(after as object)]);
    return [...keys].flatMap((k) =>
      JSON.stringify((before as Record<string, unknown>)[k]) === JSON.stringify((after as Record<string, unknown>)[k]) ? [] : [prefix + k],
    );
  }
  return [prefix || "value"];
}

// ───────────────────────────── corrections (public) ─────────────────────────────

export async function submitCorrection(input: Omit<CorrectionRequest, "id" | "status" | "createdAt">): Promise<void> {
  if (dbConfigured()) {
    await db()`insert into correction_requests (tradition_id, claim_id, message, evidence_url, contact)
               values (${input.tradition}, ${input.claim ?? null}, ${input.message}, ${input.evidenceUrl ?? null}, ${input.contact ?? null})`;
    return;
  }
  await updateStore((s) => {
    s.corrections.unshift({ ...input, id: randomUUID(), status: "open", createdAt: new Date().toISOString() });
  }, "Correction request received");
}

// ───────────────────────────── editorial reads ─────────────────────────────

export async function listCorrections(): Promise<CorrectionRequest[]> {
  if (dbConfigured()) {
    const [{ rows }] = await db()`select coalesce(json_agg(c order by c.created_at desc), '[]'::json) as rows from correction_requests c`;
    return (rows as Record<string, string | null>[]).map((r) => ({
      id: r.id!,
      tradition: r.tradition_id!,
      claim: r.claim_id ?? undefined,
      message: r.message!,
      evidenceUrl: r.evidence_url ?? undefined,
      contact: r.contact ?? undefined,
      status: r.status as CorrectionRequest["status"],
      createdAt: r.created_at!,
      resolution: r.resolution ?? undefined,
    }));
  }
  return (await readStore()).corrections;
}

export async function listRevisions(entityId?: string): Promise<Revision[]> {
  if (dbConfigured()) {
    const sql = db();
    const [{ rows }] = await sql`
      select coalesce(json_agg(r order by r.at desc), '[]'::json) as rows from (
        select id, entity, entity_id, editor, at, summary, fields from content_revisions
        ${entityId ? sql`where entity_id = ${entityId}` : sql``}
        order by at desc limit 200) r`;
    return (rows as { id: string; entity: Revision["entity"]; entity_id: string; editor: string; at: string; summary: string; fields: string[] | null }[]).map((r) => ({
      id: r.id,
      entity: r.entity,
      entityId: r.entity_id,
      editor: r.editor,
      at: r.at,
      summary: r.summary,
      fields: r.fields ?? [],
    }));
  }
  const all = (await readStore()).revisions;
  return entityId ? all.filter((r) => r.entityId === entityId) : all;
}

/** Public, non-personal change log for a published passport. */
export async function publicChangeLog(traditionId: string): Promise<{ at: string; summary: string }[]> {
  if (dbConfigured()) {
    const [{ rows }] = await db()`
      select coalesce(json_agg(r order by r.at desc), '[]'::json) as rows from (
        select at, summary from content_revisions where entity = 'tradition' and entity_id = ${traditionId} order by at desc limit 20) r`;
    return rows as { at: string; summary: string }[];
  }
  return (await readStore()).revisions.filter((r) => r.entity === "tradition" && r.entityId === traditionId).map((r) => ({ at: r.at, summary: r.summary }));
}

// ───────────────────────────── editorial writes ─────────────────────────────

/** Applies a change and its revision record in one write (one commit on GitHub). */
function writeWithRevision(apply: (s: LocalStore) => void, rev: Omit<Revision, "id" | "at">) {
  return updateStore((s) => {
    apply(s);
    s.revisions.unshift({ ...rev, id: randomUUID(), at: new Date().toISOString() });
  }, `Editorial desk: ${rev.summary} (${rev.editor})`.slice(0, 200));
}

async function recordRevision(rev: Omit<Revision, "id" | "at">, snapshot?: unknown) {
  if (dbConfigured()) {
    const sql = db();
    await sql`insert into content_revisions (entity, entity_id, editor, summary, fields, snapshot)
              values (${rev.entity}, ${rev.entityId}, ${rev.editor}, ${rev.summary}, ${rev.fields}, ${snapshot === undefined ? null : sql.json(snapshot as postgres.JSONValue)})`;
    return;
  }
  await updateStore((s) => {
    s.revisions.unshift({ ...rev, id: randomUUID(), at: new Date().toISOString() });
  });
}

export async function saveTradition(t: Tradition, editor: string, summary: string): Promise<string[]> {
  const archive = await getEditorArchive();
  const before = archive.traditions.find((x) => x.id === t.id);
  const fields = changedFields(before, t);
  if (before && !fields.length) return [];
  if (dbConfigured()) {
    const bySlug = new Map(archive.traditions.map((x) => [x.slug, x.id]));
    const rows = traditionToRows(t, (s) => bySlug.get(s) ?? s);
    await db().unsafe("select save_tradition($1::jsonb)", [rows as never]);
    await recordRevision({ entity: "tradition", entityId: t.id, editor, summary: summary || (before ? "Edited" : "Created"), fields: before ? fields : ["created"] }, t);
    return fields;
  }
  await writeWithRevision(
    (s) => {
      s.traditions[t.id] = t;
    },
    { entity: "tradition", entityId: t.id, editor, summary: summary || (before ? `Edited ${t.name}` : `Created ${t.name}`), fields: before ? fields : ["created"] },
  );
  return fields;
}

export async function saveSource(src: Source, editor: string): Promise<void> {
  const archive = await getEditorArchive();
  const before = archive.sources.find((x) => x.id === src.id);
  const rev = { entity: "source" as const, entityId: src.id, editor, summary: before ? `Edited source: ${src.title}` : `Added source: ${src.title}`, fields: changedFields(before, src) };
  if (dbConfigured()) {
    await upsertRow("sources", sourceToRow(src), ["id"]);
    await recordRevision(rev);
    return;
  }
  await writeWithRevision((s) => {
    s.sources[src.id] = src;
  }, rev);
}

export async function saveMedia(m: MediaAsset, editor: string): Promise<void> {
  const rev = { entity: "media" as const, entityId: m.id, editor, summary: `Media: ${m.caption}`, fields: ["media"] };
  if (dbConfigured()) {
    await upsertRow("media_assets", mediaToRow(m), ["id"]);
    await recordRevision(rev);
    return;
  }
  await writeWithRevision((s) => {
    s.media[m.id] = m;
  }, rev);
}

/** Adds (or updates) a country on the atlas. New countries start as "Stories being documented". */
export async function saveCountry(c: CountryRecord, editor: string): Promise<void> {
  const rev = { entity: "country" as const, entityId: c.iso2, editor, summary: `Added ${c.name} to the atlas (${c.status})`, fields: ["country"] };
  if (dbConfigured()) {
    await upsertRow("countries", countryToRow(c), ["iso2"]);
    await recordRevision(rev);
    return;
  }
  await writeWithRevision((s) => {
    s.countries[c.iso2] = c;
  }, rev);
}

export async function resolveCorrection(id: string, status: CorrectionRequest["status"], resolution: string, editor = "Editor"): Promise<void> {
  if (dbConfigured()) {
    await db()`update correction_requests set status = ${status}, resolution = ${resolution}, resolved_by = ${editor} where id = ${id}`;
    return;
  }
  await updateStore((s) => {
    const c = s.corrections.find((x) => x.id === id);
    if (c) {
      c.status = status;
      c.resolution = resolution;
    }
  }, "Correction request resolved");
}

/** Records a generated QR label in database mode (audit of printed codes); a no-op locally. */
export async function recordQr(traditionId: string, targetUrl: string, format: "svg" | "png" | "label", editor = "Editor") {
  if (!dbConfigured()) return;
  // One record per tradition + URL is enough for the audit.
  await db()`insert into qr_records (tradition_id, target_url, format, created_by)
             select ${traditionId}, ${targetUrl}, ${format}, ${editor}
             where not exists (select 1 from qr_records where tradition_id = ${traditionId} and target_url = ${targetUrl})`;
}
