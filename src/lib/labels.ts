import type {
  AccentKey,
  Category,
  ContentMaturity,
  CountryStatus,
  EvidenceLevel,
  PublicationStatus,
  RelationshipKind,
  SourceType,
  TraditionPlace,
} from "./types";

export const EVIDENCE: Record<EvidenceLevel, { label: string; short: string; description: string; color: string; glyph: string }> = {
  documented: {
    label: "Documented",
    short: "DOC",
    description: "Supported by a primary record (registry, official decision, court report) or by credible published reporting, with no credible contradiction.",
    color: "#23613A",
    glyph: "●",
  },
  community: {
    label: "Community testimony",
    short: "COM",
    description: "Oral tradition or practitioners' own accounts, recorded as such — valuable, but not the same as a written record.",
    color: "#0F6E67",
    glyph: "◐",
  },
  interpretation: {
    label: "Historical interpretation",
    short: "INT",
    description: "A reading of the evidence by historians, curators or journalists. Reasonable people may read it differently.",
    color: "#1F4E9F",
    glyph: "◒",
  },
  disputed: {
    label: "Disputed",
    short: "DIS",
    description: "Credible sources disagree, or a popular claim is not supported by the evidence we have found.",
    color: "#B0351E",
    glyph: "◇",
  },
  unverified: {
    label: "Further verification needed",
    short: "VER",
    description: "Plausible, but resting on uncited, tertiary or commercial sources. Awaiting confirmation.",
    color: "#7E5A10",
    glyph: "○",
  },
};

export const EVIDENCE_ORDER: EvidenceLevel[] = ["documented", "community", "interpretation", "disputed", "unverified"];

export const CATEGORY: Record<Category, string> = {
  footwear: "Traditional footwear",
  painting: "Painting",
  textile: "Textiles",
  embroidery: "Embroidery",
  weaving: "Weaving",
  handicraft: "Handicraft",
  ceramics: "Ceramics",
  jewelry: "Jewellery",
  architecture: "Architecture & ornament",
  "folk-art": "Folk art",
  "decorative-technique": "Decorative technique",
};

export const MATURITY: Record<ContentMaturity, { label: string; description: string }> = {
  researched: { label: "Researched", description: "Core history, makers and evidence have been researched and sourced." },
  starter: { label: "Starter passport", description: "Key facts are sourced; some chapters are still short." },
  "editorial-draft": {
    label: "Editorial draft",
    description: "Published to show the tradition exists in the archive. Many claims await verification with practitioners and are labelled as such.",
  },
};

export const STATUS: Record<PublicationStatus, string> = { draft: "Draft", review: "In review", published: "Published" };

export const COUNTRY_STATUS: Record<CountryStatus, { label: string; description: string; color: string }> = {
  active: { label: "Active collection", description: "A curated, published collection.", color: "#B84B30" },
  introductory: { label: "Introductory collection", description: "A first, carefully sourced passport.", color: "#146D68" },
  documenting: { label: "Stories being documented", description: "Candidate traditions under research. Nothing published yet.", color: "#E4AA29" },
  shared: { label: "Shared traditions", description: "No collection of its own yet; appears through traditions shared across borders.", color: "#581D30" },
};

export const RELATIONSHIP: Record<RelationshipKind, { label: string; dash: string; caution?: string }> = {
  "shared-practice": { label: "Shared practice", dash: "0" },
  migration: { label: "Migration of makers", dash: "6 4" },
  exhibition: { label: "Museum & exhibition", dash: "1 5" },
  "commercial-adaptation": { label: "Commercial adaptation", dash: "10 5" },
  collaboration: { label: "Collaboration", dash: "0" },
  recognition: { label: "Recognition", dash: "2 3" },
  scholarship: { label: "Scholarship", dash: "2 3" },
  "visual-similarity": {
    label: "Visual similarity only",
    dash: "1 7",
    caution: "Resemblance is not evidence of historical influence.",
  },
};

export const SOURCE_TYPE: Record<SourceType, string> = {
  "official-record": "Official record",
  government: "Government",
  unesco: "UNESCO",
  "court-report": "Court reporting",
  museum: "Museum",
  academic: "Scholarship",
  news: "News",
  magazine: "Magazine / feature",
  "brand-statement": "Brand statement",
  organization: "Organisation",
  reference: "Reference work",
  "oral-history": "Oral history",
  "media-record": "Photographic record",
};

export const PLACE_ROLE: Record<TraditionPlace["role"], string> = {
  origin: "Place of origin",
  "gi-area": "Registered GI area",
  production: "Centre of production",
  shared: "Shared region",
  "historic-centre": "Historic centre",
  "community-home": "Community home",
};

/**
 * Tradition accents. Keys are stored content values; only the colours follow the design language.
 * hex: blocks and large type · ink: text on a hex block · text: small text on cream (AA) · soft: tints.
 */
export const ACCENT: Record<AccentKey, { hex: string; ink: string; text: string; soft: string }> = {
  terracotta: { hex: "#E04A2C", ink: "#F6F0E3", text: "#B0351E", soft: "#F2C2AE" },
  burgundy: { hex: "#B32A3C", ink: "#F6F0E3", text: "#B32A3C", soft: "#EBC0C2" },
  indigo: { hex: "#1F4E9F", ink: "#F6F0E3", text: "#1F4E9F", soft: "#BCCBE6" },
  forest: { hex: "#27703F", ink: "#F6F0E3", text: "#23613A", soft: "#BFD9C3" },
  teal: { hex: "#0F6E67", ink: "#F6F0E3", text: "#0F6E67", soft: "#B4D8D2" },
  mustard: { hex: "#EEA53A", ink: "#1B1616", text: "#8A5A12", soft: "#F6DDA6" },
};

/** CSS custom properties that theme a page section with a tradition's accent. */
export function accentVars(key: AccentKey): Record<string, string> {
  const a = ACCENT[key];
  return { "--accent": a.hex, "--accent-ink": a.ink, "--accent-text": a.text, "--accent-soft": a.soft };
}

export function formatSourceDate(d?: string): string {
  if (!d) return "Undated";
  const [y, m, day] = d.split("-").map(Number);
  if (!m) return String(y);
  const month = new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return day ? `${day} ${month} ${y}` : `${month} ${y}`;
}
