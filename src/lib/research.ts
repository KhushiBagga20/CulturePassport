/**
 * Research pipeline — shared, dependency-free logic.
 *
 * The pipeline (pipeline/run.mts) turns open data into *research candidates*: dossiers that sit in a
 * review queue and are never shown to the public. An editor can then reject a candidate or turn it
 * into a *draft* passport, in which every claim is labelled "Further verification needed".
 * Nothing here publishes anything.
 *
 * Used by both the Node CLI and the Next.js app, so it imports types only.
 */
import type { AccentKey, Category, Claim, CountryRecord, MediaAsset, NativeName, Source, SourceType, Tradition } from "./types.ts";

export type CandidateStatus = "new" | "rejected" | "drafted";

/** Local review queue (demo mode), relative to the project root. With DATABASE_URL it is the research_candidates table. */
export const RESEARCH_FILE = ".data/research.json";
export interface ResearchFile {
  candidates: Record<string, ResearchCandidate>;
}

/** Keeps an editor's decision when the pipeline refreshes a candidate's data. */
export function mergeCandidate(existing: ResearchCandidate | undefined, fresh: ResearchCandidate): ResearchCandidate {
  if (!existing) return fresh;
  return { ...fresh, status: existing.status, reviewedBy: existing.reviewedBy, reviewedAt: existing.reviewedAt, note: existing.note, draftId: existing.draftId };
}

export interface CandidateSource {
  key: string;
  type: SourceType;
  title: string;
  publisher: string;
  url: string;
  date?: string;
  accessed: string;
  note?: string;
}

export interface CandidateFact {
  text: string;
  sources: string[]; // CandidateSource keys
}

export interface CandidateCountry {
  iso2: string;
  isoNumeric: string;
  name: string;
  wikidataId: string;
  centroid?: [number, number]; // [lon, lat]
}

export interface ResearchCandidate {
  id: string; // "wd-Q963061"
  wikidataId: string;
  country: CandidateCountry;
  name: string;
  description?: string;
  aliases: string[];
  nativeNames: { text: string; lang: string; script: string }[];
  ich?: { id: string; list: "representative" | "urgent" | "other"; listLabel: string; year?: string; url: string };
  /** India's Geographical Indications registry, as listed on Wikipedia (which cites the GI Registry). */
  gi?: GiEntry;
  /** "instance of" labels, e.g. "textile", "musical genre" */
  kinds: string[];
  /** true when the element looks like material culture (craft, textile, painting…) rather than music, dance or food */
  materialCulture: boolean;
  places: { name: string; wikidataId: string; lon?: number; lat?: number }[];
  image?: {
    file: string; // Commons file name with underscores
    hash: string; // upload.wikimedia.org two-level path, e.g. "8/8a"
    width: number;
    height: number;
    sourcePage: string;
    license: string;
    licenseUrl?: string;
    credit: string;
    description?: string;
    /** CC0, public domain, CC BY or CC BY-SA only */
    free: boolean;
  };
  wikipedia?: string;
  facts: CandidateFact[];
  sources: CandidateSource[];
  fetchedAt: string;
  status: CandidateStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  note?: string;
  draftId?: string;
}

// ───────────────────────────── India: Geographical Indications ─────────────────────────────

export const GI_LIST_PAGE = "Geographical_indications_in_India";
export const GI_LIST_URL = `https://en.wikipedia.org/wiki/${GI_LIST_PAGE}`;
export const GI_REGISTRY_URL = "https://search.ipindia.gov.in/GIRPublic/";

export interface GiEntry {
  applicationNo: string;
  goods: string; // the GI as registered, e.g. "Channapatna toys and dolls"
  type: "Handicraft" | "Food stuff";
  state: string;
  year?: string;
}

/** A row of the GI table that links to its own Wikipedia article. */
export interface GiRow extends GiEntry {
  article: string; // Wikipedia title
  stateArticle?: string;
}

const linkParts = (cell: string) => {
  const m = cell.match(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/);
  return m ? { target: m[1].trim(), text: (m[2] ?? m[1]).trim() } : null;
};
const plain = (cell: string) =>
  cell
    .replace(/<ref[^>]*\/>|<ref[^>]*>.*?<\/ref>/g, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, "$1")
    .replace(/'{2,}/g, "")
    .replace(/\{\{[^}]*\}\}/g, "")
    .trim();

/**
 * Parses the table on Wikipedia's "Geographical indications in India" page. Keeps handicrafts
 * (including textiles) and food stuffs that link to an article; agricultural, manufactured and
 * natural goods are left out.
 */
export function parseGiTable(wikitext: string): GiRow[] {
  const out: GiRow[] = [];
  for (const row of wikitext.split(/\n\|-/).slice(1)) {
    const cells = row
      .split("\n")
      .filter((l) => l.startsWith("|") && !l.startsWith("|}") && !l.startsWith("|+"))
      .map((l) => l.replace(/^\|+\s*/, "").trim());
    if (cells.length < 5) continue;
    const [, appNo, goodsCell, typeCell, stateCell, yearCell] = cells;
    const t = plain(typeCell).toLowerCase();
    const type = /handi|textile/.test(t) ? "Handicraft" : /food/.test(t) ? "Food stuff" : null;
    const link = linkParts(goodsCell);
    if (!type || !link || /^(file|image|category):/i.test(link.target)) continue;
    out.push({
      applicationNo: plain(appNo),
      goods: plain(goodsCell),
      type,
      state: plain(stateCell),
      stateArticle: linkParts(stateCell)?.target,
      year: plain(yearCell ?? "") || undefined,
      article: link.target,
    });
  }
  return out;
}

/** Adds the GI registration to a candidate built from the article's Wikidata item. */
export function addGi(
  c: ResearchCandidate,
  gi: GiEntry,
  accessed: string,
  state?: { name: string; wikidataId: string; lon?: number; lat?: number },
): ResearchCandidate {
  const sources: CandidateSource[] = [
    ...c.sources,
    {
      key: "gi-list",
      type: "reference",
      title: "Geographical indications in India — Wikipedia",
      publisher: "Wikipedia",
      url: GI_LIST_URL,
      accessed,
      note: "Table of registered GIs compiled from the GI Registry's journals. A lead: confirm the entry on the registry.",
    },
    {
      key: "gi-registry",
      type: "government",
      title: "Geographical Indications Registry: public search",
      publisher: "Geographical Indications Registry, Government of India",
      url: GI_REGISTRY_URL,
      accessed,
      note: `Search for application no. ${gi.applicationNo} to read the registered specification.`,
    },
  ];
  const fact: CandidateFact = {
    text: `“${gi.goods}” is registered in India as a Geographical Indication (${gi.type.toLowerCase()}) for ${gi.state}, application no. ${gi.applicationNo}${gi.year ? `, ${gi.year}` : ""}.`,
    sources: ["gi-list", "gi-registry"],
  };
  const places = c.places.length || !state ? c.places : [state];
  return { ...c, gi, places, sources, facts: [fact, ...c.facts] };
}

// ───────────────────────────── Wikidata vocabulary ─────────────────────────────

/** Wikidata items and properties used by the pipeline (checked against the live Wikidata API). */
export const WD = {
  representativeList: "Q110319947",
  urgentList: "Q17323370",
  ichStatus: "P3259",
  unescoIchId: "P10221",
  country: "P17",
  countryOfOrigin: "P495",
  instanceOf: "P31",
  image: "P18",
  coordinates: "P625",
  locatedIn: "P131",
  location: "P276",
  startTime: "P580",
  isoAlpha2: "P297",
  isoNumeric: "P299",
  officialLanguage: "P37",
  wikimediaLanguageCode: "P424",
} as const;

export const unescoUrl = (ichId: string) => `https://ich.unesco.org/en/${ichId}`;

/** SPARQL: every item with a UNESCO ICH ID or a UNESCO-list status, tied to the country. */
export function candidatesQuery(countryQid: string, limit: number) {
  return `SELECT DISTINCT ?item WHERE {
  { ?item wdt:${WD.country} wd:${countryQid} } UNION { ?item wdt:${WD.countryOfOrigin} wd:${countryQid} }
  { ?item wdt:${WD.unescoIchId} ?ich } UNION { ?item wdt:${WD.ichStatus} ?s . VALUES ?s { wd:${WD.representativeList} wd:${WD.urgentList} } }
} LIMIT ${limit}`;
}

// ───────────────────────────── entity parsing ─────────────────────────────

/** The parts of a wbgetentities response the pipeline reads. */
export interface WdSnak {
  snaktype?: string;
  datavalue?: { value: unknown };
}
export interface WdStatement {
  mainsnak: WdSnak;
  qualifiers?: Record<string, WdSnak[]>;
  rank?: string;
}
export interface WdEntity {
  id: string;
  labels?: Record<string, { value: string }>;
  descriptions?: Record<string, { value: string }>;
  aliases?: Record<string, { value: string }[]>;
  claims?: Record<string, WdStatement[]>;
  sitelinks?: Record<string, { title: string }>;
}

const values = (e: WdEntity, pid: string) =>
  (e.claims?.[pid] ?? []).filter((s) => s.rank !== "deprecated" && s.mainsnak.datavalue).map((s) => s.mainsnak.datavalue!.value);
export const itemIds = (e: WdEntity, pid: string) => values(e, pid).map((v) => (v as { id: string }).id).filter(Boolean);
export const strings = (e: WdEntity, pid: string) => values(e, pid).filter((v): v is string => typeof v === "string");
export const label = (e: WdEntity | undefined, lang = "en") => e?.labels?.[lang]?.value ?? e?.labels?.en?.value;

function coord(e: WdEntity): { lon: number; lat: number } | undefined {
  const v = values(e, WD.coordinates)[0] as { latitude: number; longitude: number } | undefined;
  return v ? { lon: Math.round(v.longitude * 1e4) / 1e4, lat: Math.round(v.latitude * 1e4) / 1e4 } : undefined;
}

function yearOf(time?: unknown): string | undefined {
  const m = typeof time === "object" && time && "time" in time ? String((time as { time: string }).time).match(/^[+-]?(\d{4})/) : null;
  return m?.[1];
}

/** Best guess at the writing system, for native-name labels. */
export function scriptOf(text: string): string {
  const tests: [RegExp, string][] = [
    [/[ऀ-ॿ]/, "Devanagari"],
    [/[؀-ۿ]/, "Arabic"],
    [/[぀-ヿ]/, "Japanese kana"],
    [/[一-鿿]/, "Han"],
    [/[가-힯]/, "Hangul"],
    [/[Ѐ-ӿ]/, "Cyrillic"],
    [/[Ͱ-Ͽ]/, "Greek"],
    [/[ሀ-፿]/, "Ethiopic"],
    [/[฀-๿]/, "Thai"],
    [/[֐-׿]/, "Hebrew"],
    [/[ঀ-৿]/, "Bengali"],
    [/[઀-૿]/, "Gujarati"],
    [/[஀-௿]/, "Tamil"],
  ];
  return tests.find(([re]) => re.test(text))?.[1] ?? "Latin";
}

const MATERIAL = /craft|textile|weav|embroider|pottery|ceramic|potter|paint|\bart\b|folk art|visual art|carv|lacquer|basket|jewel|metalwork|woodwork|leather|dye|print|cloth|fabric|paper|calligraph|architect|building|mask|doll|instrument making|technique|making/i;
const PERFORMANCE = /music|song|danc|cuisine|food|dish|festival|ritual|ceremony|theatre|theater|drama|game|sport|poetry|recit|carnival|pilgrimage|procession|feast|performing art|martial art|culinary/i;

/** Rough triage for the review queue (crafts and visual arts first); editors can still draft anything. */
export function isMaterialCulture(kinds: string[], name: string, description = ""): boolean {
  const k = kinds.join(" ");
  if (MATERIAL.test(k) && !/performing art|martial art|culinary art/i.test(k)) return true;
  if (PERFORMANCE.test(k)) return false;
  const text = `${name} ${description}`;
  return MATERIAL.test(text) && !PERFORMANCE.test(text);
}

export function categoryFor(c: Pick<ResearchCandidate, "kinds" | "name" | "description">): Category {
  const t = [...c.kinds, c.name, c.description ?? ""].join(" ").toLowerCase();
  if (/embroider/.test(t)) return "embroidery";
  if (/weav|loom|carpet|rug/.test(t)) return "weaving";
  if (/textile|cloth|fabric|dye|print/.test(t)) return "textile";
  if (/pottery|ceramic|potter|clay/.test(t)) return "ceramics";
  if (/paint/.test(t)) return "painting";
  if (/jewel|silver|gold/.test(t)) return "jewelry";
  if (/architect|building|house|bridge/.test(t)) return "architecture";
  if (/footwear|shoe|sandal/.test(t)) return "footwear";
  if (/craft|carv|lacquer|basket|woodwork|metalwork|leather|paper|making|technique/.test(t)) return "handicraft";
  if (/music|song|danc|theatre|theater|drama|puppet|perform|genre|recit|poetry|chant/.test(t)) return "performing-arts";
  if (/cuisine|food|dish|culinary|cook|drink|bread/.test(t)) return "food";
  if (/festival|ritual|ceremony|carnival|pilgrimage|procession|feast|celebration|parade/.test(t)) return "festival";
  return "knowledge";
}

/**
 * Builds a candidate from a Wikidata entity. `labels` resolves referenced items (lists, kinds, places)
 * and `languages` lists the country's Wikimedia language codes for native names.
 */
export function entityToCandidate(
  e: WdEntity,
  ctx: {
    country: CandidateCountry;
    labels: Map<string, WdEntity>;
    languages: string[];
    image?: ResearchCandidate["image"];
    accessed: string; // YYYY-MM-DD
    fetchedAt: string;
  },
): ResearchCandidate | null {
  const name = label(e);
  if (!name) return null;
  const description = e.descriptions?.en?.value;
  const wdUrl = `https://www.wikidata.org/wiki/${e.id}`;

  // UNESCO listing: prefer a status statement with its own qualifiers, fall back to the bare ID.
  let ich: ResearchCandidate["ich"];
  for (const st of e.claims?.[WD.ichStatus] ?? []) {
    const listId = (st.mainsnak.datavalue?.value as { id?: string } | undefined)?.id;
    if (!listId) continue;
    const list = listId === WD.representativeList ? "representative" : listId === WD.urgentList ? "urgent" : "other";
    const qualId = st.qualifiers?.[WD.unescoIchId]?.[0]?.datavalue?.value;
    const id = typeof qualId === "string" ? qualId : strings(e, WD.unescoIchId)[0];
    if (!id) continue;
    ich = { id, list, listLabel: label(ctx.labels.get(listId)) ?? "UNESCO Intangible Cultural Heritage list", year: yearOf(st.qualifiers?.[WD.startTime]?.[0]?.datavalue?.value), url: unescoUrl(id) };
    if (list !== "other") break;
  }
  if (!ich) {
    const id = strings(e, WD.unescoIchId)[0];
    if (id) ich = { id, list: "other", listLabel: "UNESCO Intangible Cultural Heritage", url: unescoUrl(id) };
  }

  const kinds = itemIds(e, WD.instanceOf).map((q) => label(ctx.labels.get(q))).filter((x): x is string => !!x);
  const placeIds = [...itemIds(e, WD.locatedIn), ...itemIds(e, WD.location)];
  const places = Array.from(new Set(placeIds)).flatMap((q) => {
    const p = ctx.labels.get(q);
    const n = label(p);
    return n ? [{ name: n, wikidataId: q, ...(p ? coord(p) : {}) }] : [];
  });
  const nativeNames = Array.from(
    new Map(
      ctx.languages
        .filter((l) => l !== "en")
        .map((l) => e.labels?.[l]?.value)
        .filter((t): t is string => !!t && t !== name)
        .map((t) => [t, { text: t, lang: ctx.languages.find((l) => e.labels?.[l]?.value === t)!, script: scriptOf(t) }]),
    ).values(),
  );
  const aliases = (e.aliases?.en ?? []).map((a) => a.value).filter((a) => a !== name).slice(0, 6);
  const wikipedia = e.sitelinks?.enwiki ? `https://en.wikipedia.org/wiki/${encodeURIComponent(e.sitelinks.enwiki.title.replace(/ /g, "_"))}` : undefined;

  const sources: CandidateSource[] = [
    { key: "wikidata", type: "reference", title: `${name} (${e.id})`, publisher: "Wikidata", url: wdUrl, accessed: ctx.accessed, note: "Community-edited open data (CC0). Treat as a lead; confirm each statement at its cited source." },
  ];
  if (ich)
    sources.push({
      key: "unesco",
      type: "unesco",
      title: `${ich.listLabel}: ${name}`,
      publisher: "UNESCO Intangible Cultural Heritage",
      url: ich.url,
      date: ich.year,
      accessed: ctx.accessed,
      note: "Listing details as recorded on Wikidata; confirm the element title, year and list on the UNESCO page.",
    });
  if (ctx.image)
    sources.push({ key: "commons", type: "media-record", title: ctx.image.file.replace(/_/g, " "), publisher: "Wikimedia Commons", url: ctx.image.sourcePage, accessed: ctx.accessed, note: `Licence: ${ctx.image.license}. Credit: ${ctx.image.credit}.` });
  if (wikipedia)
    sources.push({ key: "wikipedia", type: "reference", title: `${name} — Wikipedia`, publisher: "Wikipedia", url: wikipedia, accessed: ctx.accessed, note: "Lead for further reading only. Do not copy its text; follow its references instead." });

  const facts: CandidateFact[] = [];
  if (ich)
    facts.push({
      text: `${name} appears on UNESCO's ${ich.listLabel}${ich.year ? `, recorded on Wikidata as inscribed in ${ich.year}` : ""}.`,
      sources: ["unesco", "wikidata"],
    });
  if (description) facts.push({ text: `Wikidata describes it as "${description}".`, sources: ["wikidata"] });
  if (places.length) facts.push({ text: `Wikidata associates it with ${places.map((p) => p.name).join(", ")}.`, sources: ["wikidata"] });
  if (kinds.length) facts.push({ text: `Wikidata classifies it as: ${kinds.join(", ")}.`, sources: ["wikidata"] });

  return {
    id: `wd-${e.id}`,
    wikidataId: e.id,
    country: ctx.country,
    name,
    description,
    aliases,
    nativeNames,
    ich,
    kinds,
    materialCulture: isMaterialCulture(kinds, name, description),
    places,
    image: ctx.image,
    wikipedia,
    facts,
    sources,
    fetchedAt: ctx.fetchedAt,
    status: "new",
  };
}

/** Commons files are served from a two-level path made of the MD5 of the file name. */
export function commonsHash(md5hex: string) {
  return `${md5hex[0]}/${md5hex.slice(0, 2)}`;
}

export interface CommonsPage {
  title: string;
  imageinfo?: { width: number; height: number; descriptionurl: string; extmetadata?: Record<string, { value: string }> }[];
}

const stripHtml = (s = "") => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/** Reads a Commons imageinfo page (size, licence, credit). `md5` hashes the underscored file name. */
export function imageFromInfo(page: CommonsPage, md5: (file: string) => string): ResearchCandidate["image"] | undefined {
  const info = page.imageinfo?.[0];
  if (!info) return undefined;
  const file = page.title.replace(/^File:/, "").replace(/ /g, "_");
  const meta = info.extmetadata ?? {};
  const license = stripHtml(meta.LicenseShortName?.value) || "Unknown licence";
  return {
    file,
    hash: commonsHash(md5(file)),
    width: info.width,
    height: info.height,
    sourcePage: info.descriptionurl,
    license,
    licenseUrl: meta.LicenseUrl?.value,
    credit: stripHtml(meta.Artist?.value) || stripHtml(meta.Credit?.value) || "See the file page",
    description: stripHtml(meta.ImageDescription?.value).slice(0, 280) || undefined,
    free: isFreeLicence(license),
  };
}

const FREE = /^(cc0|cc[- ]by(-sa)?[- ]\d|cc[- ]by(-sa)?$|public domain|pd\b|pd-)/i;
export function isFreeLicence(short: string) {
  return FREE.test(short.trim()) && !/nc|nd/i.test(short.replace(/^public domain/i, ""));
}

// ───────────────────────────── candidate → draft passport ─────────────────────────────

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
    .replace(/-+$/, ""); // cutting a long name can leave a trailing hyphen
}

/** A public "stories being documented" record for a country that is new to the atlas. */
export function countryRecordFor(c: CandidateCountry): CountryRecord {
  return {
    iso2: c.iso2,
    isoNumeric: c.isoNumeric,
    slug: slugify(c.name),
    name: c.name,
    status: "documenting",
    plate: "",
    headline: "Stories being documented",
    intro: "Traditions from here are being researched. Nothing is published until its sources have been verified and the communities involved have been consulted.",
    candidates: [],
    centroid: c.centroid ?? [0, 0],
  };
}

/**
 * Turns a reviewed candidate into a *draft* passport plus the sources (and, if freely licensed, the image)
 * it cites. Every claim is "Further verification needed"; the editorial notes say what to check.
 */
export function candidateToDraft(
  c: ResearchCandidate,
  ctx: { id: string; slug: string; passportNo: string; editor: string; today: string; publish?: boolean },
): { tradition: Tradition; sources: Source[]; media?: MediaAsset } {
  const publish = !!ctx.publish;
  const sid = (key: string) => `research-${c.wikidataId.toLowerCase()}-${key}`;
  const sources: Source[] = c.sources.map((s) => ({
    id: sid(s.key),
    title: s.title,
    publisher: s.publisher,
    url: s.url,
    type: s.type,
    date: s.date,
    accessed: s.accessed,
    notes: s.note,
  }));
  const claims: Claim[] = c.facts.map((f, i) => ({
    id: `${c.wikidataId.toLowerCase()}-c${i + 1}`,
    text: f.text,
    level: "unverified",
    sources: f.sources.map(sid),
    note: "Imported by the research pipeline. Check the cited source and rewrite in our own words before changing this label.",
  }));
  const media: MediaAsset | undefined =
    c.image?.free
      ? {
          id: `research-${c.wikidataId.toLowerCase()}-image`,
          commonsFile: c.image.file,
          commonsHash: c.image.hash,
          width: c.image.width,
          height: c.image.height,
          alt: c.image.description ? c.image.description.slice(0, 200) : `Photograph from Wikimedia Commons associated with ${c.name}.`,
          caption: c.image.description || `${c.image.file.replace(/_/g, " ").replace(/\.[a-z]+$/i, "")} (Wikimedia Commons).`,
          credit: c.image.credit,
          license: c.image.license,
          licenseUrl: c.image.licenseUrl,
          sourcePage: c.image.sourcePage,
          kind: "photograph",
          documentary: false,
        }
      : undefined;
  const where = c.places.length
    ? `${c.places.slice(0, 2).map((p) => p.name).join(", ")} — ${c.country.name}`
    : c.gi
      ? `${c.gi.state} — ${c.country.name}`
      : c.country.name;
  const native: NativeName[] = c.nativeNames.map((n) => ({ text: n.text, lang: n.lang, script: n.script, note: "From Wikidata; confirm spelling and language with the community." }));
  const summary = c.description ? c.description[0].toUpperCase() + c.description.slice(1) + "." : "";
  const category = categoryFor(c);
  const accent: AccentKey =
    category === "performing-arts" ? "indigo" : category === "food" ? "mustard" : category === "festival" ? "terracotta" : category === "knowledge" ? "teal" : "forest";
  const country = c.country.name === "United Arab Emirates" ? "the UAE" : c.country.name;

  const tradition: Tradition = {
    id: ctx.id,
    slug: ctx.slug,
    passportNo: ctx.passportNo,
    status: publish ? "published" : "draft",
    maturity: "editorial-draft",
    name: c.name[0].toUpperCase() + c.name.slice(1),
    displayTitle: c.name[0].toUpperCase() + c.name.slice(1),
    tagline: c.gi
      ? `A Geographical Indication of ${c.gi.state}, India.`
      : c.ich
        ? `A UNESCO-listed tradition of ${country}.`
        : `A tradition of ${country}.`,
    nativeNames: native,
    alternateNames: c.aliases,
    category,
    techniques: [],
    regionLabel: where,
    countries: [c.country.iso2],
    collection: c.country.iso2,
    places: [],
    communities: [],
    summary: summary || `A tradition of ${country}.`,
    intro: `${summary ? `${summary} ` : ""}This passport was compiled from ${c.gi ? "India's Geographical Indications register" : "UNESCO listings"} and Wikidata and has not yet been reviewed by an editor; every claim below is marked "Further verification needed" and links to its source.`,
    accent,
    motif: "atlas",
    hero: media?.id,
    gallery: [],
    periods: [],
    origins: claims.map((cl) => ({ type: "p" as const, text: cl.text, claims: [cl.id] })),
    significance: [],
    makers: { intro: [], materials: [], process: [], practitioners: [], voicesNote: "No interviews have been recorded yet." },
    timeline: [],
    travels: { intro: [], influences: [], cases: [] },
    claims,
    keepAlive: {
      organizations: [],
      resources: [
        ...(c.ich ? [{ title: `UNESCO: ${c.name}`, url: c.ich.url, note: "The official listing.", source: sid("unesco") }] : []),
        ...(c.gi ? [{ title: "GI Registry search", url: GI_REGISTRY_URL, note: `Application no. ${c.gi.applicationNo}.`, source: sid("gi-registry") }] : []),
        ...(c.wikipedia ? [{ title: "Wikipedia (further reading)", url: c.wikipedia, note: "Follow its references; do not copy its text." }] : []),
      ],
      collaborationNotes: [],
    },
    related: [],
    editorial: {
      lastReviewed: ctx.today,
      reviewedBy: ctx.editor,
      notes: publish
        ? `Compiled automatically from ${c.gi ? "India's GI register (via Wikipedia)" : "UNESCO listings"} and Wikidata (${c.wikidataId}, fetched ${c.fetchedAt.slice(0, 10)}). Not yet reviewed by an editor.`
        : `Drafted from research candidate ${c.wikidataId} (fetched ${c.fetchedAt.slice(0, 10)}). All text is placeholder and every claim is unverified.`,
      openQuestions: [
        ...(c.ich ? ["Confirm the element title, list and inscription year on the UNESCO page."] : []),
        ...(c.gi ? [`Confirm GI application no. ${c.gi.applicationNo} and read its registered specification on the GI Registry.`] : []),
        "Identify the communities and makers involved, and ask for their consent before naming anyone.",
        "Rewrite the summary and origins in our own words from primary sources.",
        "Choose an illustration motif and accent; the defaults do not represent this tradition.",
        ...(media ? ["Describe the photograph accurately (alt text and caption) and confirm what it shows."] : []),
        ...(c.places.length ? [] : ["Record where the tradition is practised."]),
      ],
    },
  };
  return { tradition, sources, media };
}
