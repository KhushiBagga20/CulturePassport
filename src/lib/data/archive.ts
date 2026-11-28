import { cache } from "react";
import type { Archive, MediaAsset, Source, Tradition } from "../types";
import snapshotJson from "./snapshot.json";
import editorStoreJson from "../../../backend/data/editor/store.json";
import { readStore, type LocalStore } from "./local-store";
import { loadPostgresArchive } from "./pg";
import { storeMode } from "./store-mode";

export type Backend = "local" | "postgres" | "github";
export const backend = (): Backend => (storeMode() === "postgres" ? "postgres" : storeMode());

function mergeById<T extends { id: string }>(base: T[], overrides: Record<string, T>): T[] {
  const seen = new Set<string>();
  const merged = base.map((item) => {
    seen.add(item.id);
    return overrides[item.id] ?? item;
  });
  for (const [id, item] of Object.entries(overrides)) if (!seen.has(id)) merged.push(item);
  return merged;
}

type Content = Omit<Archive, "backend">;

/** Applies editorial overrides (passports, sources, media, countries) on top of an archive. */
function applyStore(base: Content, store: Partial<LocalStore>): Content {
  const countries = store.countries ?? {};
  return {
    ...base,
    countries: [...base.countries.filter((c) => !countries[c.iso2]), ...Object.values(countries)],
    traditions: mergeById<Tradition>(base.traditions, store.traditions ?? {}).sort((a, b) => a.passportNo.localeCompare(b.passportNo)),
    sources: mergeById<Source>(base.sources, store.sources ?? {}),
    media: mergeById<MediaAsset>(base.media, store.media ?? {}),
  };
}

const hasEdits = (s: Partial<LocalStore>) =>
  Object.keys(s.traditions ?? {}).length + Object.keys(s.sources ?? {}).length + Object.keys(s.media ?? {}).length + Object.keys(s.countries ?? {}).length > 0;

/**
 * The published archive, baked into the repository (npm run snapshot:build / snapshot:export),
 * plus edits saved through the editorial desk on GitHub (backend/data/editor/store.json, part of
 * each deploy). Public pages read only this, so they never wait on, or fail with, a database.
 */
const snapshot = snapshotJson as unknown as Content;
const published = applyStore(snapshot, editorStoreJson as unknown as Partial<LocalStore>);

async function loadLocal(): Promise<Archive> {
  const store = await readStore();
  return { ...applyStore(published, store), backend: hasEdits(store) ? "local-store" : "local-seed" };
}

/**
 * The archive the public site shows. Locally (no GitHub or database), an editor's edits in .data
 * are merged in so they can be previewed. Includes drafts; public pages filter with isPublic().
 */
export const getArchive = cache(async (): Promise<Archive> => (storeMode() === "local" ? loadLocal() : { ...published, backend: "snapshot" }));

/**
 * The archive the editorial desk works on: the latest editorial store on GitHub (so editors see
 * their changes before the redeploy finishes), PostgreSQL, or the local files.
 */
export const getEditorArchive = cache(async (): Promise<Archive> => {
  const mode = storeMode();
  if (mode === "postgres") return loadPostgresArchive();
  if (mode === "github") return { ...applyStore(snapshot, await readStore()), backend: "github" };
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

export interface CountryEntry {
  /** place among the country's passports, in passport-number order (1-based) */
  n: number;
  total: number;
  country: string;
}

/**
 * Two numbers identify a passport: its passport number (unique across the archive) and its entry
 * number within its own country's collection.
 */
export function countryEntries(a: Archive): Map<string, CountryEntry> {
  const out = new Map<string, CountryEntry>();
  const pub = a.traditions.filter(isPublic).sort((x, y) => x.passportNo.localeCompare(y.passportNo));
  for (const c of new Set(pub.map((t) => t.collection))) {
    const own = pub.filter((t) => t.collection === c);
    const name = a.countries.find((x) => x.iso2 === c)?.name ?? c;
    own.forEach((t, i) => out.set(t.slug, { n: i + 1, total: own.length, country: name === "United Arab Emirates" ? "UAE" : name }));
  }
  return out;
}

/** "India entry 12" */
export const entryLabel = (e?: CountryEntry) => (e ? `${e.country} entry ${e.n}` : "");

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
