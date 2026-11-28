/**
 * Turns research candidates into published passports: the logic shared by
 * `npm run research:publish` (writes to PostgreSQL) and `npm run snapshot:build` (writes the
 * archive snapshot that the public site reads). Pure: it returns the plan and never writes.
 *
 * Kept free of path aliases so the scripts can import it.
 */
import { candidateToDraft, countryRecordFor, slugify, type ResearchCandidate } from "./research.ts";
import type { Archive, CountryRecord, MediaAsset, Source, Tradition } from "./types.ts";

export const RESEARCH_BY = "Research pipeline (auto-published)";
const RESEARCH_HEADLINE = "First passports, from public records";
const RESEARCH_INTRO =
  "These passports were compiled from UNESCO listings and Wikidata and have not yet been reviewed by an editor. Every claim is marked “Further verification needed” and links to its source. Corrections are welcome on each passport.";

/** Addresses and numbers already given out, so a rebuild keeps every printed QR code and shared link. */
export interface KnownIds {
  byQid: Map<string, { slug: string; no: string }>;
  bySlug: Map<string, string>; // slug → passport number
}

export interface PublishPlan {
  next: Archive;
  newTraditions: Tradition[];
  newSources: Map<string, Source>;
  newMedia: MediaAsset[];
  touchedCountries: Set<string>;
  countries: Map<string, CountryRecord>;
  decisions: { id: string; draftId: string }[];
  duplicates: { id: string; slug: string }[];
  skipped: number;
  warnings: string[];
}

// Names already in the archive (e.g. hand-written passports such as Kolhapuri Chappal), compared
// loosely: case, punctuation, plurals and words like "painting" or "art" are ignored.
export const nameKey = (n: string) =>
  n
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !/^(paintings?|arts?|crafts?|work|ware|the|of|and|sarees?|saris?)$/.test(w))
    .map((w) => w.replace(/s$/, ""))
    .join(" ");

export function planPublish(
  archive: Archive,
  queue: (ResearchCandidate & { draftId?: string })[],
  opts: { today: string; known?: KnownIds; idFor?: (c: ResearchCandidate) => string },
): PublishPlan {
  const existingNames = new Map(archive.traditions.flatMap((t) => [t.name, t.displayTitle, ...(t.alternateNames ?? [])].map((n) => [nameKey(n), t.slug] as const)));
  const existingWd = new Set(archive.sources.filter((s) => s.id.startsWith("research-") && s.id.endsWith("-wikidata")).map((s) => s.id));
  const known = opts.known;
  // Addresses that belong to known candidates; a new candidate must not take one.
  const reserved = new Set([...(known?.byQid.values() ?? [])].map((k) => k.slug));
  const usedNos = new Set(archive.traditions.map((t) => t.passportNo));
  let nextNo =
    Math.max(0, ...archive.traditions.map((t) => Number(t.passportNo)), ...[...(known?.byQid.values() ?? [])].map((k) => Number(k.no)), ...[...(known?.bySlug.values() ?? [])].map(Number)) + 1;
  const slugs = new Set(archive.traditions.flatMap((t) => [t.slug, ...(t.slugHistory ?? [])]));
  const countries = new Map(archive.countries.map((c) => [c.iso2, structuredClone(c)]));
  const plan: PublishPlan = {
    next: archive,
    newTraditions: [],
    newSources: new Map(),
    newMedia: [],
    touchedCountries: new Set(),
    countries,
    decisions: [],
    duplicates: [],
    skipped: 0,
    warnings: [],
  };

  // Candidates with a known address first, so a new candidate can never take one of theirs.
  const ordered = [...queue].sort((a, b) => Number(!!known?.byQid.get(b.wikidataId)) - Number(!!known?.byQid.get(a.wikidataId)));
  for (const c of ordered) {
    const wdSource = `research-${c.wikidataId.toLowerCase()}-wikidata`;
    if (existingWd.has(wdSource) || (c.draftId && archive.traditions.some((t) => t.id === c.draftId))) {
      plan.skipped++;
      continue;
    }
    const dup = [c.name, c.gi?.goods ?? "", ...c.aliases].map(nameKey).find((k) => k && existingNames.has(k));
    if (dup) {
      plan.duplicates.push({ id: c.id, slug: existingNames.get(dup)! });
      continue;
    }
    // Country: add it to the atlas, or upgrade a "documenting" country now that it has passports.
    let country = countries.get(c.country.iso2);
    if (!country) {
      if (!c.country.centroid) {
        plan.warnings.push(`skip ${c.name}: no coordinates for ${c.country.name}`);
        continue;
      }
      country = { ...countryRecordFor(c.country), status: "introductory", headline: RESEARCH_HEADLINE, intro: RESEARCH_INTRO };
      countries.set(country.iso2, country);
      plan.touchedCountries.add(country.iso2);
    } else if (country.status === "documenting" || country.status === "shared") {
      Object.assign(country, { status: "introductory", headline: RESEARCH_HEADLINE, intro: RESEARCH_INTRO } satisfies Partial<CountryRecord>);
      plan.touchedCountries.add(country.iso2);
    }

    // Keep an address and number already given out; otherwise take the next free ones.
    const prior = known?.byQid.get(c.wikidataId);
    let slug = prior?.slug ?? (slugify(c.name) || c.wikidataId.toLowerCase());
    if (!prior) for (let n = 2; slugs.has(slug) || reserved.has(slug); n++) slug = `${slugify(c.name)}-${n}`;
    if (slugs.has(slug)) {
      plan.warnings.push(`skip ${c.name}: address /passport/${slug} is already taken`);
      continue;
    }
    slugs.add(slug);
    let no = prior?.no ?? known?.bySlug.get(slug);
    if (!no || usedNos.has(no)) {
      while (usedNos.has(String(nextNo).padStart(3, "0"))) nextNo++;
      no = String(nextNo++).padStart(3, "0");
    }
    usedNos.add(no);
    const draft = candidateToDraft(c, {
      id: opts.idFor?.(c) ?? `trad-${c.wikidataId.toLowerCase()}`,
      slug,
      passportNo: no,
      editor: RESEARCH_BY,
      today: opts.today,
      publish: true,
    });
    plan.newTraditions.push(draft.tradition);
    for (const s of draft.sources) if (!archive.sources.some((x) => x.id === s.id)) plan.newSources.set(s.id, s);
    if (draft.media) plan.newMedia.push(draft.media, ...draft.gallery);
    plan.decisions.push({ id: c.id, draftId: draft.tradition.id });

    // Country-page lead with its UNESCO reference.
    if (c.ich) {
      const lead = { name: draft.tradition.name, note: `UNESCO ${c.ich.id}${c.ich.year ? ` · ${c.ich.year}` : ""} · ${c.ich.listLabel}`, sources: [`research-${c.wikidataId.toLowerCase()}-unesco`] };
      if (!country.candidates.some((x) => x.name.toLowerCase() === lead.name.toLowerCase())) {
        country.candidates = [...country.candidates, lead];
        plan.touchedCountries.add(country.iso2);
      }
    }
  }

  plan.next = {
    ...archive,
    traditions: [...archive.traditions, ...plan.newTraditions].sort((a, b) => a.passportNo.localeCompare(b.passportNo)),
    sources: [...archive.sources, ...plan.newSources.values()],
    media: [...archive.media, ...plan.newMedia],
    countries: [...countries.values()],
  };
  return plan;
}
