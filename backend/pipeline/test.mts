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
  parseGiTable,
  addGi,
  scriptOf,
  type CommonsPage,
  type WdEntity,
} from "../../src/lib/research.ts";
import { seedArchive, validateArchive } from "../../src/lib/data/seed/index.ts";

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
check("open research questions are attached", draft.tradition.editorial.openQuestions.length >= 2);
check("editor-only to-dos are not shown publicly", !draft.tradition.editorial.openQuestions.some((q) => /motif|alt text|own words/i.test(q)));
{
  const img = c.image!;
  const withMore = candidateToDraft(
    { ...c, overview: "Kente is a woven cloth of strips sewn together.", gallery: [{ ...img, file: "Kente_2.jpg" }, { ...img, file: "Kente_nc.jpg", free: false }], sources: [...c.sources, { key: "wikipedia", type: "reference", title: "Kente cloth — Wikipedia", publisher: "Wikipedia", url: "https://en.wikipedia.org/wiki/Kente_cloth", accessed: "2026-11-28" }] },
    { id: "trad-test2", slug: "kente-cloth", passportNo: "998", editor: "Test", today: "2026-11-28" },
  );
  check("the overview comes first, cited to Wikipedia", withMore.tradition.claims[0]?.text.startsWith("Kente is a woven") && withMore.tradition.claims[0].sources.some((s) => s.endsWith("-wikipedia")));
  check("free gallery pictures become the passport gallery", withMore.gallery.length === 1 && withMore.tradition.gallery.join() === withMore.gallery[0].id);
  const arch2 = { ...seedArchive, traditions: [...seedArchive.traditions, withMore.tradition], sources: [...seedArchive.sources, ...withMore.sources], media: [...seedArchive.media, withMore.media!, ...withMore.gallery] };
  const p2 = validateArchive(arch2).filter((e) => e.includes("kente-cloth") || e.includes("research-"));
  check("a passport with overview and gallery passes validation", p2.length === 0, p2.join("; "));
}
check("the intro is the description alone (no repeated notice)", !/compiled from/i.test(draft.tradition.intro) && !draft.tradition.claims.some((cl) => cl.text.startsWith("Wikidata describes")));

// licences, merging, scripts
check("free licences accepted", ["CC0", "CC BY 4.0", "CC BY-SA 3.0", "Public domain"].every(isFreeLicence));
check("non-free licences rejected", !["CC BY-NC 4.0", "CC BY-ND 2.0", "CC BY-NC-SA 3.0", "Fair use", "Unknown licence"].some(isFreeLicence));
const kept = mergeCandidate({ ...c, status: "rejected", note: "Not a craft", reviewedBy: "A" }, { ...c, name: "kente (refreshed)" });
check("refreshing a candidate keeps the editor's decision", kept.status === "rejected" && kept.note === "Not a craft" && kept.name === "kente (refreshed)");
check("scripts are detected", scriptOf("ケンテ") === "Japanese kana" && scriptOf("कोल्हापुरी") === "Devanagari" && scriptOf("Kente") === "Latin");


// ── India: Geographical Indications table ──
const giWikitext = `{| class="sortable wikitable"
! Serial no.
! Application no.
! [[Geographical indication]]
! Type
! State
! Year
|-
| 18
| 23
| [[Channapatna toys|Channapatna toys and dolls]]
| Handicraft
| [[Karnataka]]
| 2004–05
|-
|1
|1 & 2
|[[Darjeeling Tea]]
|Agricultural
|[[West Bengal]]
|2004–05
|-
|200
|410
|Mysore Pak<ref>x</ref>
|Food stuff
|[[Karnataka]]
|2013–14
|-
|300
|500
|[[Bikaneri Bhujia]]
|Food stuff
|[[Rajasthan]]
|2010–11
|}`;
const gi = parseGiTable(giWikitext);
check("GI table: keeps linked handicrafts and foods only", gi.length === 2 && gi[0].article === "Channapatna toys" && gi[1].article === "Bikaneri Bhujia", JSON.stringify(gi));
check("GI table: reads application no., registered name, state and year", gi[0].applicationNo === "23" && gi[0].goods === "Channapatna toys and dolls" && gi[0].state === "Karnataka" && gi[0].year === "2004–05" && gi[0].type === "Handicraft");
const giCand = addGi({ ...c, country: { ...c.country, iso2: "IN", isoNumeric: "356", name: "India" }, places: [] }, gi[0], "2026-11-25", { name: "Karnataka", wikidataId: "Q1185", lon: 76, lat: 15 });
const giKeys = new Set(giCand.sources.map((s) => s.key));
check("GI candidate cites the registry and the list", giKeys.has("gi-registry") && giKeys.has("gi-list") && giCand.facts[0].sources.join() === "gi-list,gi-registry");
check("GI candidate falls back to the state as its place", giCand.places[0]?.name === "Karnataka");
const giDraft = candidateToDraft(giCand, { id: "trad-gi", slug: "channapatna-toys", passportNo: "998", editor: "Test", today: "2026-11-25" });
check("GI passport says where it is registered", giDraft.tradition.tagline === "A Geographical Indication of Karnataka, India.", giDraft.tradition.tagline);
check("GI passport asks an editor to confirm the application", giDraft.tradition.editorial.openQuestions.some((q) => q.includes("application no. 23")));

console.log(failed ? `\n${failed} check(s) failed` : "\nAll research pipeline checks passed");
process.exit(failed ? 1 : 0);
