import { cache } from "react";
import type { Archive, MediaAsset, Source, Tradition } from "../types";
import { seedArchive } from "./seed";
import { readStore } from "./local-store";
import { dbConfigured } from "../db";
import { loadPostgresArchive } from "./pg";

export type Backend = "local" | "postgres";
export const backend = (): Backend => (dbConfigured() ? "postgres" : "local");

function mergeById<T extends { id: string }>(base: T[], overrides: Record<string, T>): T[] {
  const seen = new Set<string>();
  const merged = base.map((item) => {
    seen.add(item.id);
    return overrides[item.id] ?? item;
  });
  for (const [id, item] of Object.entries(overrides)) if (!seen.has(id)) merged.push(item);
  return merged;
}

async function loadLocal(): Promise<Archive> {
  const store = await readStore();
  const edited = Object.keys(store.traditions).length + Object.keys(store.sources).length + Object.keys(store.media).length + Object.keys(store.countries).length > 0;
  const countries = [...seedArchive.countries.filter((c) => !store.countries[c.iso2]), ...Object.values(store.countries)];
  return {
    ...seedArchive,
    countries,
    traditions: mergeById<Tradition>(seedArchive.traditions, store.traditions).sort((a, b) => a.passportNo.localeCompare(b.passportNo)),
    sources: mergeById<Source>(seedArchive.sources, store.sources),
    media: mergeById<MediaAsset>(seedArchive.media, store.media),
    backend: edited ? "local-store" : "local-seed",
  };
}

/** The whole archive (it is small), memoised per request. Includes drafts; public pages filter with isPublic(). */
export const getArchive = cache(async (): Promise<Archive> => {
  if (dbConfigured()) return loadPostgresArchive();
  return loadLocal();
});

export const isPublic = (t: Tradition) => t.status === "published";

export async function getPublicTraditions(): Promise<Tradition[]> {
  const a = await getArchive();
  return a.traditions.filter(isPublic);
}

/** Resolves current and historical slugs so printed QR codes keep working after a rename. */
export function findTradition(a: Archive, slug: string): { tradition: Tradition; canonical: boolean } | null {
  const direct = a.traditions.find((t) => t.slug === slug);
  if (direct) return { tradition: direct, canonical: true };
  const moved = a.traditions.find((t) => t.slugHistory?.includes(slug));
  return moved ? { tradition: moved, canonical: false } : null;
}

export function lookups(a: Archive) {
  return {
    source: new Map(a.sources.map((s) => [s.id, s])),
    place: new Map(a.places.map((p) => [p.id, p])),
    community: new Map(a.communities.map((c) => [c.id, c])),
    organization: new Map(a.organizations.map((o) => [o.id, o])),
    media: new Map(a.media.map((m) => [m.id, m])),
    tradition: new Map(a.traditions.map((t) => [t.slug, t])),
    country: new Map(a.countries.map((c) => [c.iso2, c])),
  };
}
export type Lookups = ReturnType<typeof lookups>;

/** All source ids a tradition cites, in first-use order — the numbering used in Sources & References. */
export function citedSources(t: Tradition): string[] {
  const order: string[] = [];
  const add = (ids?: string[]) => ids?.forEach((id) => !order.includes(id) && order.push(id));
  t.claims.forEach((c) => add(c.sources));
  t.timeline.forEach((e) => add(e.sources));
  t.makers.materials.forEach((m) => add(m.sources));
  t.makers.process.forEach((p) => add(p.sources));
  t.makers.practitioners.forEach((p) => add(p.sources));
  t.travels.influences.forEach((i) => add(i.sources));
  t.travels.cases.forEach((c) => {
    c.events.forEach((e) => add(e.sources));
    c.questions.forEach((q) => add(q.sources));
    add(c.legalNote?.sources);
  });
  t.keepAlive.resources.forEach((r) => r.source && add([r.source]));
  return order;
}
