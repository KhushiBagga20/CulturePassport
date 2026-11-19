/**
 * Offline tests for the research pipeline, using a recorded Wikidata/Commons snapshot of
 * "kente cloth" (pipeline/fixtures, CC0 data plus the image's licence metadata).
 *   npm run test:research
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  candidateToDraft,
  entityToCandidate,
  imageFromInfo,
  isFreeLicence,
  mergeCandidate,
  scriptOf,
  type CommonsPage,
  type WdEntity,
} from "../src/lib/research.ts";
import { seedArchive, validateArchive } from "../src/lib/data/seed/index.ts";

let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${ok || !detail ? "" : ` — ${detail}`}`);
  if (!ok) failed++;
}
const load = (f: string) => JSON.parse(readFileSync(new URL(`./fixtures/${f}`, import.meta.url), "utf8"));

const entity = Object.values(load("kente-entity.json").entities)[0] as WdEntity;
const labels = new Map(Object.entries(load("kente-refs.json").entities as Record<string, WdEntity>));
const page = Object.values(load("kente-image.json").query.pages)[0] as CommonsPage;
const image = imageFromInfo(page, (f) => createHash("md5").update(f).digest("hex"));

check("Commons licence and credit are read", image?.license === "CC BY-SA 3.0" && image.credit === "ZSM" && image.free === true, JSON.stringify(image));
check("Commons hash path matches upload.wikimedia.org layout", /^[0-9a-f]\/[0-9a-f]{2}$/.test(image?.hash ?? ""));

const country = { iso2: "GH", isoNumeric: "288", name: "Ghana", wikidataId: "Q117", centroid: [-1.2, 7.9] as [number, number] };
const c = entityToCandidate(entity, { country, labels, languages: ["en"], image, accessed: "2026-11-19", fetchedAt: "2026-11-19T10:00:00Z" });
check("candidate is created", !!c);
if (!c) process.exit(1);
check("name and description come from Wikidata", c.name === "kente cloth" && /woven/.test(c.description ?? ""));
check("UNESCO Representative List entry is preferred over the national register", c.ich?.list === "representative" && c.ich.id === "RL/02130", JSON.stringify(c.ich));
check("inscription year is read from the statement qualifier", c.ich?.year === "2024", c.ich?.year);
check("UNESCO link points at ich.unesco.org", c.ich?.url === "https://ich.unesco.org/en/RL/02130");
check("triaged as material culture", c.materialCulture === true, c.kinds.join(", "));
check("places carry coordinates", c.places.some((p) => p.name === "Ashanti Region" && typeof p.lat === "number"), JSON.stringify(c.places));
const keys = new Set(c.sources.map((s) => s.key));
check("every fact cites known sources", c.facts.length >= 3 && c.facts.every((f) => f.sources.length && f.sources.every((k) => keys.has(k))));
check("Wikipedia is kept as a lead, not as text", keys.has("wikipedia") && !c.facts.some((f) => f.text.includes("Wikipedia")));

// candidate → draft passport, checked against the archive's own integrity rules
const draft = candidateToDraft(c, { id: "trad-test", slug: "kente-cloth", passportNo: "999", editor: "Test", today: "2026-11-19" });
const archive = {
  ...seedArchive,
  traditions: [...seedArchive.traditions, draft.tradition],
  sources: [...seedArchive.sources, ...draft.sources],
  media: [...seedArchive.media, ...(draft.media ? [draft.media] : [])],
};
const problems = validateArchive(archive).filter((e) => e.includes("kente-cloth") || e.includes("research-"));
check("draft passes archive validation", problems.length === 0, problems.join("; "));
check("draft is never published", draft.tradition.status === "draft" && draft.tradition.maturity === "editorial-draft");
check("every imported claim is 'needs verification'", draft.tradition.claims.length > 0 && draft.tradition.claims.every((cl) => cl.level === "unverified"));
check("draft is filed under the candidate's country", draft.tradition.collection === "GH" && draft.tradition.countries.join() === "GH");
check("freely licensed image becomes the hero, flagged as not yet documentary", draft.media?.id === draft.tradition.hero && draft.media?.documentary === false);
check("editor checklist is attached", draft.tradition.editorial.openQuestions.length >= 3);

// licences, merging, scripts
check("free licences accepted", ["CC0", "CC BY 4.0", "CC BY-SA 3.0", "Public domain"].every(isFreeLicence));
check("non-free licences rejected", !["CC BY-NC 4.0", "CC BY-ND 2.0", "CC BY-NC-SA 3.0", "Fair use", "Unknown licence"].some(isFreeLicence));
const kept = mergeCandidate({ ...c, status: "rejected", note: "Not a craft", reviewedBy: "A" }, { ...c, name: "kente (refreshed)" });
check("refreshing a candidate keeps the editor's decision", kept.status === "rejected" && kept.note === "Not a craft" && kept.name === "kente (refreshed)");
check("scripts are detected", scriptOf("ケンテ") === "Japanese kana" && scriptOf("कोल्हापुरी") === "Devanagari" && scriptOf("Kente") === "Latin");

console.log(failed ? `\n${failed} check(s) failed` : "\nAll research pipeline checks passed");
process.exit(failed ? 1 : 0);
