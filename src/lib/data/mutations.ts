import { randomUUID } from "node:crypto";
import type { CorrectionRequest, MediaAsset, Revision, Source, Tradition } from "../types";
import { readStore, updateStore } from "./local-store";
import { getArchive } from "./archive";
import { supabaseConfigured, publicClient, sessionClient } from "../supabase/clients";
import { mediaToRow, sourceToRow, traditionToRows } from "./rows";

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
  if (supabaseConfigured()) {
    const { error } = await publicClient()
      .from("correction_requests")
      .insert({ tradition_id: input.tradition, claim_id: input.claim ?? null, message: input.message, evidence_url: input.evidenceUrl ?? null, contact: input.contact ?? null });
    if (error) throw new Error(error.message);
    return;
  }
  await updateStore((s) => {
    s.corrections.unshift({ ...input, id: randomUUID(), status: "open", createdAt: new Date().toISOString() });
  });
}

// ───────────────────────────── editorial reads ─────────────────────────────

export async function listCorrections(): Promise<CorrectionRequest[]> {
  if (supabaseConfigured()) {
    const { data, error } = await (await sessionClient()).from("correction_requests").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id,
      tradition: r.tradition_id,
      claim: r.claim_id ?? undefined,
      message: r.message,
      evidenceUrl: r.evidence_url ?? undefined,
      contact: r.contact ?? undefined,
      status: r.status,
      createdAt: r.created_at,
      resolution: r.resolution ?? undefined,
    }));
  }
  return (await readStore()).corrections;
}

export async function listRevisions(entityId?: string): Promise<Revision[]> {
  if (supabaseConfigured()) {
    let q = (await sessionClient()).from("content_revisions").select("id, entity, entity_id, editor, at, summary, fields").order("at", { ascending: false }).limit(200);
    if (entityId) q = q.eq("entity_id", entityId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({ id: r.id, entity: r.entity, entityId: r.entity_id, editor: r.editor, at: r.at, summary: r.summary, fields: r.fields ?? [] }));
  }
  const all = (await readStore()).revisions;
  return entityId ? all.filter((r) => r.entityId === entityId) : all;
}

/** Public, non-personal change log for a published passport. */
export async function publicChangeLog(traditionId: string): Promise<{ at: string; summary: string }[]> {
  if (supabaseConfigured()) {
    const { data } = await publicClient().from("public_revision_log").select("at, summary").eq("tradition_id", traditionId).order("at", { ascending: false }).limit(20);
    return data ?? [];
  }
  return (await readStore()).revisions.filter((r) => r.entity === "tradition" && r.entityId === traditionId).map((r) => ({ at: r.at, summary: r.summary }));
}

// ───────────────────────────── editorial writes ─────────────────────────────

async function recordRevision(rev: Omit<Revision, "id" | "at">, snapshot?: unknown) {
  if (supabaseConfigured()) {
    const client = await sessionClient();
    const { data: user } = await client.auth.getUser();
    await client.from("content_revisions").insert({
      entity: rev.entity,
      entity_id: rev.entityId,
      editor_id: user.user?.id ?? null,
      editor: rev.editor,
      summary: rev.summary,
      fields: rev.fields,
      snapshot: snapshot ?? null,
    });
    return;
  }
  await updateStore((s) => {
    s.revisions.unshift({ ...rev, id: randomUUID(), at: new Date().toISOString() });
  });
}

export async function saveTradition(t: Tradition, editor: string, summary: string): Promise<string[]> {
  const archive = await getArchive();
  const before = archive.traditions.find((x) => x.id === t.id);
  const fields = changedFields(before, t);
  if (before && !fields.length) return [];
  if (supabaseConfigured()) {
    const bySlug = new Map(archive.traditions.map((x) => [x.slug, x.id]));
    const rows = traditionToRows(t, (s) => bySlug.get(s) ?? s);
    const { error } = await (await sessionClient()).rpc("save_tradition", { p: rows });
    if (error) throw new Error(error.message);
  } else {
    await updateStore((s) => {
      s.traditions[t.id] = t;
    });
  }
  await recordRevision({ entity: "tradition", entityId: t.id, editor, summary: summary || (before ? "Edited" : "Created"), fields: before ? fields : ["created"] }, t);
  return fields;
}

export async function saveSource(src: Source, editor: string): Promise<void> {
  const archive = await getArchive();
  const before = archive.sources.find((x) => x.id === src.id);
  if (supabaseConfigured()) {
    const { error } = await (await sessionClient()).from("sources").upsert(sourceToRow(src));
    if (error) throw new Error(error.message);
  } else {
    await updateStore((s) => {
      s.sources[src.id] = src;
    });
  }
  await recordRevision({ entity: "source", entityId: src.id, editor, summary: before ? `Edited source: ${src.title}` : `Added source: ${src.title}`, fields: changedFields(before, src) });
}

export async function saveMedia(m: MediaAsset, editor: string): Promise<void> {
  if (supabaseConfigured()) {
    const { error } = await (await sessionClient()).from("media_assets").upsert(mediaToRow(m));
    if (error) throw new Error(error.message);
  } else {
    await updateStore((s) => {
      s.media[m.id] = m;
    });
  }
  await recordRevision({ entity: "media", entityId: m.id, editor, summary: `Media: ${m.caption}`, fields: ["media"] });
}

export async function resolveCorrection(id: string, status: CorrectionRequest["status"], resolution: string): Promise<void> {
  if (supabaseConfigured()) {
    const client = await sessionClient();
    const { data: user } = await client.auth.getUser();
    const { error } = await client.from("correction_requests").update({ status, resolution, resolved_by: user.user?.id ?? null }).eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  await updateStore((s) => {
    const c = s.corrections.find((x) => x.id === id);
    if (c) {
      c.status = status;
      c.resolution = resolution;
    }
  });
}

/** Records a generated QR label in Supabase mode (audit of printed codes); a no-op locally. */
export async function recordQr(traditionId: string, targetUrl: string, format: "svg" | "png" | "label") {
  if (!supabaseConfigured()) return;
  const client = await sessionClient();
  const { data: user } = await client.auth.getUser();
  if (!user.user) return;
  const { count } = await client.from("qr_records").select("id", { count: "exact", head: true }).eq("tradition_id", traditionId).eq("target_url", targetUrl);
  if (count) return; // one record per tradition + URL is enough for the audit
  await client.from("qr_records").insert({ tradition_id: traditionId, target_url: targetUrl, format, created_by: user.user.id });
}
