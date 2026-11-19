/**
 * Culture Passport content model.
 *
 * The same shapes are used by the local seed archive and by the PostgreSQL adapter
 * (see db/migrations/0001_schema.sql for the normalised tables they map to).
 * Keep this file free of runtime code so the seed generator can strip types with Node.
 */

export type Locale = "en" | "hi" | "mr" | "pa" | "gu" | "ar";

/** Editorial evidence labels. Applied per claim by an editor, never automatically. */
export type EvidenceLevel =
  | "documented" // supported by a primary record or two independent credible sources
  | "community" // community testimony / oral tradition, recorded as such
  | "interpretation" // historical interpretation by scholars, curators or press
  | "disputed" // credible sources disagree
  | "unverified"; // further verification needed

export type PublicationStatus = "draft" | "review" | "published";

/** How complete the research behind a passport is. Shown to readers. */
export type ContentMaturity = "researched" | "starter" | "editorial-draft";

export type Category =
  | "footwear"
  | "painting"
  | "textile"
  | "embroidery"
  | "weaving"
  | "handicraft"
  | "ceramics"
  | "jewelry"
  | "architecture"
  | "folk-art"
  | "decorative-technique";

export type SourceType =
  | "official-record"
  | "government"
  | "unesco"
  | "court-report"
  | "museum"
  | "academic"
  | "news"
  | "magazine"
  | "brand-statement"
  | "organization"
  | "reference"
  | "oral-history"
  | "media-record";

export interface Source {
  id: string;
  title: string;
  publisher: string;
  author?: string;
  /** ISO date (YYYY, YYYY-MM or YYYY-MM-DD) when known */
  date?: string;
  url: string;
  type: SourceType;
  /** date the editor last checked the link */
  accessed: string;
  /** limitations, conflicts with other sources, retrieval problems */
  notes?: string;
}

export interface Claim {
  id: string;
  text: string;
  level: EvidenceLevel;
  sources: string[];
  /** editorial note on conflicts, gaps or limitations */
  note?: string;
}

export type PlaceKind =
  | "district"
  | "state"
  | "province"
  | "cultural-region"
  | "city"
  | "village"
  | "country"
  | "museum"
  | "archaeological-site";

export interface Place {
  id: string;
  name: string;
  kind: PlaceKind;
  lat: number;
  lon: number;
  /** ISO 3166-1 alpha-2 */
  country: string;
  note?: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  sources?: string[];
}

export interface Organization {
  id: string;
  name: string;
  kind:
    | "gi-proprietor"
    | "government-body"
    | "museum"
    | "cooperative"
    | "ngo"
    | "education"
    | "cultural-body";
  role: string;
  url?: string;
  placeId?: string;
  /** existence and role confirmed by the cited sources — not an endorsement */
  verified: boolean;
  sources: string[];
}

export interface MediaAsset {
  id: string;
  /** Wikimedia Commons file name (with underscores) when hosted there */
  commonsFile?: string;
  /** two-level hash path used by upload.wikimedia.org, e.g. "8/8a" */
  commonsHash?: string;
  /** direct URL for images uploaded through the editorial desk (/api/media/…) */
  url?: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  credit: string;
  license: string;
  licenseUrl?: string;
  sourcePage: string;
  kind: "photograph" | "museum-object" | "archival" | "artwork";
  /** true only for real photographs/records usable as evidence; never for illustrations */
  documentary: boolean;
}

export type TextBlock =
  | { type: "p"; text: string; claims?: string[] }
  | { type: "pull"; text: string; attribution?: string }
  | { type: "figure"; media: string }
  | { type: "note"; title: string; text: string; claims?: string[] };

export interface DateSpec {
  /** sortable year (use the midpoint/start for ranges, negative for BCE) */
  year: number;
  month?: number;
  day?: number;
  approx?: boolean;
  /** human label exactly as it should be shown, e.g. "c. 12th–13th century (claimed)" */
  label: string;
}

export type EventTag =
  | "origin"
  | "patronage"
  | "recognition"
  | "exchange"
  | "migration"
  | "exhibition"
  | "runway"
  | "response"
  | "legal"
  | "collaboration"
  | "craft"
  | "disruption";

export interface TimelineEvent {
  id: string;
  date: DateSpec;
  title: string;
  body: string;
  level: EvidenceLevel;
  sources: string[];
  place?: string;
  tag?: EventTag;
  media?: string;
}

export interface CaseQuestion {
  q: string;
  a: string;
  level: EvidenceLevel;
  sources: string[];
}

export interface CaseStudy {
  id: string;
  slug: string;
  code: string; // e.g. "001-A"
  title: string;
  kind:
    | "misattribution"
    | "adaptation"
    | "acknowledged-inspiration"
    | "collaboration"
    | "renaming"
    | "disputed";
  parties: string[];
  summary: string;
  status: string;
  events: TimelineEvent[];
  questions: CaseQuestion[];
  travelled: string[];
  leftBehind: string[];
  legalNote?: { text: string; sources: string[] };
  comparison?: {
    traditional: { title: string; media?: string; points: string[] };
    adaptation: { title: string; media?: string; points: string[]; mediaNote: string };
  };
  openQuestions: string[];
}

export interface Influence {
  title: string;
  body: string;
  level: EvidenceLevel;
  sources: string[];
}

export interface ProcessStep {
  title: string;
  detail: string;
  level: EvidenceLevel;
  sources: string[];
}

export interface Material {
  name: string;
  detail: string;
  level: EvidenceLevel;
  sources: string[];
}

export interface Practitioner {
  name: string;
  note: string;
  sources: string[];
}

export interface NativeName {
  text: string;
  script: string;
  lang: string;
  note?: string;
}

export type MotifKey = "kolhapuri" | "madhubani" | "phulkari" | "warli" | "ajrakh" | "sadu";
export type AccentKey = "terracotta" | "burgundy" | "indigo" | "forest" | "teal" | "mustard";

export interface TraditionPlace {
  place: string;
  role: "origin" | "gi-area" | "production" | "shared" | "historic-centre" | "community-home";
  note?: string;
}

export interface Tradition {
  id: string;
  slug: string;
  /** previous slugs, kept so printed QR codes never break */
  slugHistory?: string[];
  passportNo: string;
  status: PublicationStatus;
  maturity: ContentMaturity;
  name: string;
  displayTitle: string;
  tagline: string;
  nativeNames: NativeName[];
  alternateNames: string[];
  category: Category;
  techniques: string[];
  /** short "where" line shown on cards, naming every country involved */
  regionLabel: string;
  /** ISO alpha-2 codes of every modern country the tradition is associated with */
  countries: string[];
  /** the collection it is filed under on the globe */
  collection: string;
  places: TraditionPlace[];
  communities: { community: string; role: string }[];
  summary: string;
  intro: string;
  accent: AccentKey;
  motif: MotifKey;
  hero?: string;
  gallery: string[];
  periods: string[];
  origins: TextBlock[];
  significance: TextBlock[];
  makers: {
    intro: TextBlock[];
    materials: Material[];
    process: ProcessStep[];
    practitioners: Practitioner[];
    voicesNote: string;
  };
  timeline: TimelineEvent[];
  travels: {
    intro: TextBlock[];
    influences: Influence[];
    cases: CaseStudy[];
  };
  claims: Claim[];
  keepAlive: {
    organizations: string[];
    resources: { title: string; url: string; note: string; source?: string }[];
    collaborationNotes: string[];
  };
  related: { slug: string; reason: string }[];
  editorial: {
    lastReviewed: string;
    reviewedBy: string;
    notes: string;
    openQuestions: string[];
  };
  /** Human-reviewed translations. Machine translation is never published unreviewed. */
  translations?: Partial<Record<Locale, { name?: string; tagline?: string; summary?: string; reviewed: boolean }>>;
}

export type CountryStatus = "active" | "introductory" | "documenting" | "shared";

export interface CountryRecord {
  iso2: string;
  /** ISO 3166-1 numeric, used to match Natural Earth features */
  isoNumeric: string;
  slug: string;
  name: string;
  status: CountryStatus;
  plate: string;
  headline: string;
  intro: string;
  candidates: { name: string; note: string; sources?: string[] }[];
  /** traditions listed here even though filed under another collection */
  sharedTraditions?: string[];
  centroid: [number, number]; // [lon, lat]
}

export type RelationshipKind =
  | "shared-practice"
  | "migration"
  | "exhibition"
  | "commercial-adaptation"
  | "collaboration"
  | "recognition"
  | "scholarship"
  | "visual-similarity";

export interface Relationship {
  id: string;
  tradition: string;
  from: string; // place id
  to: string; // place id
  kind: RelationshipKind;
  title: string;
  description: string;
  level: EvidenceLevel;
  sources: string[];
  year?: string;
}

export interface Trail {
  slug: string;
  title: string;
  kicker: string;
  intro: string;
  accent: AccentKey;
  steps: { tradition: string; note: string }[];
}

export interface Archive {
  traditions: Tradition[];
  sources: Source[];
  places: Place[];
  communities: Community[];
  organizations: Organization[];
  media: MediaAsset[];
  countries: CountryRecord[];
  relationships: Relationship[];
  trails: Trail[];
  /** which backend produced this archive */
  backend: "local-seed" | "local-store" | "postgres";
}

export interface Revision {
  id: string;
  entity: "tradition" | "source" | "media" | "country";
  entityId: string;
  editor: string;
  at: string;
  summary: string;
  /** names of the fields that changed */
  fields: string[];
}

export interface CorrectionRequest {
  id: string;
  tradition: string;
  claim?: string;
  message: string;
  evidenceUrl?: string;
  contact?: string;
  status: "open" | "accepted" | "dismissed";
  createdAt: string;
  resolution?: string;
}
