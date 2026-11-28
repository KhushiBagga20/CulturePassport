/**
 * Culture Passport research pipeline.
 *
 *   npm run research -- --country GH --country MX [--limit 40] [--dry-run] [--target local|postgres]
 *   npm run research -- --india-gi [--limit 400]     India's registered Geographical Indications
 *
 * For each country (ISO 3166-1 alpha-2) it finds UNESCO-listed intangible heritage on Wikidata,
 * fetches each element's record, image licence (Wikimedia Commons) and the country's languages,
 * and writes *research candidates* to a review queue. With --india-gi it reads the table of India's
 * registered Geographical Indications (handicrafts, textiles and foods) from Wikipedia, which cites
 * the GI Registry, and builds a candidate from each GI's linked article and its Wikidata item. It never creates or publishes passports:
 * an editor reviews candidates at /admin/research and can turn one into a draft.
 *
 * Targets
 *   local     .data/research.json (default when DATABASE_URL is not set)
 *   postgres  the research_candidates table, using DATABASE_URL from .env.local (or pipeline/.env).
 *             That connection string is server-only: never give it a NEXT_PUBLIC_ name.
 */
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  GI_LIST_PAGE,
  RESEARCH_FILE,
  WD,
  addGi,
  candidatesQuery,
  entityToCandidate,
  imageFromInfo,
  itemIds,
  label,
  mergeCandidate,
  parseGiTable,
  strings,
  type CandidateCountry,
  type CommonsPage,
  type ResearchCandidate,
  type ResearchFile,
  type WdEntity,
} from "../../src/lib/research.ts";

// Generic client name, per Wikimedia's User-Agent policy; no personal contact details.
const UA = "CulturePassportResearchPipeline/0.1 (open-source educational archive)";
const WIKIDATA = "https://www.wikidata.org/w/api.php";
const SPARQL = "https://query.wikidata.org/sparql";
const COMMONS = "https://commons.wikimedia.org/w/api.php";
const WIKIPEDIA = "https://en.wikipedia.org/w/api.php";

// ───────────────────────────── arguments ─────────────────────────────

const argv = process.argv.slice(2);
const opt = (name: string) => argv.flatMap((a, i) => (a === `--${name}` ? [argv[i + 1]] : a.startsWith(`--${name}=`) ? [a.split("=")[1]] : []));
const countries = opt("country").flatMap((c) => c.split(",")).map((c) => c.trim().toUpperCase()).filter(Boolean);
const indiaGi = argv.includes("--india-gi");
const limit = Number(opt("limit")[0] ?? (indiaGi ? 400 : 60));
const dryRun = argv.includes("--dry-run");
const hasDb = !!process.env.DATABASE_URL?.trim();
const target = (opt("target")[0] ?? (hasDb ? "postgres" : "local")) as "local" | "postgres";

if ((!countries.length && !indiaGi) || countries.some((c) => !/^[A-Z]{2}$/.test(c))) {
  console.error("Usage: npm run research -- --country GH [--country MX] [--india-gi] [--limit 60] [--dry-run] [--target local|postgres]");
  process.exit(1);
}
if (target === "postgres" && !hasDb) {
  console.error("--target postgres needs DATABASE_URL (in .env.local or pipeline/.env).");
  process.exit(1);
}

// ───────────────────────────── polite HTTP ─────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson<T>(url: string, params: Record<string, string>, accept = "application/json"): Promise<T> {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  for (let attempt = 0; attempt < 5; attempt++) {
    let res: Response;
    try {
      res = await fetch(u, { headers: { "User-Agent": UA, Accept: accept } });
    } catch (e) {
      // Network dropped (DNS, reset): wait and try again rather than losing the run.
      const wait = 5000 * 2 ** attempt;
      console.warn(`  network error (${(e as Error).message}); retrying in ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    if (res.ok) {
      await sleep(250);
      return (await res.json()) as T;
    }
    if (res.status === 429 || res.status >= 500) {
      const wait = Number(res.headers.get("retry-after")) * 1000 || 1500 * 2 ** attempt;
      console.warn(`  ${res.status} from ${u.host}; retrying in ${Math.round(wait / 1000)}s`);
      await sleep(wait);
      continue;
    }
    throw new Error(`${res.status} ${res.statusText} for ${u.host}${u.pathname}`);
  }
  throw new Error(`Gave up after retries: ${u.host}${u.pathname}`);
}

async function sparql(query: string): Promise<{ results: { bindings: Record<string, { value: string }>[] } }> {
  return getJson(SPARQL, { query, format: "json" }, "application/sparql-results+json");
}

async function entities(ids: string[], props: string, languages: string[]): Promise<Map<string, WdEntity>> {
  const out = new Map<string, WdEntity>();
  const unique = Array.from(new Set(ids));
  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50);
    const data = await getJson<{ entities: Record<string, WdEntity> }>(WIKIDATA, {
      action: "wbgetentities",
      ids: batch.join("|"),
      props,
      languages: Array.from(new Set(["en", ...languages])).join("|"),
      format: "json",
    });
    for (const [id, e] of Object.entries(data.entities ?? {})) if (!("missing" in e)) out.set(id, e);
  }
  return out;
}

// ───────────────────────────── steps ─────────────────────────────

async function resolveCountry(iso2: string): Promise<{ country: CandidateCountry; languages: string[] }> {
  const res = await sparql(`SELECT ?c WHERE { ?c wdt:${WD.isoAlpha2} "${iso2}" . } LIMIT 1`);
  const qid = res.results.bindings[0]?.c.value.split("/").pop();
  if (!qid) throw new Error(`No Wikidata country has ISO code ${iso2}`);
  const e = (await entities([qid], "labels|claims", []))!.get(qid)!;
  const isoNumeric = strings(e, WD.isoNumeric)[0];
  if (!isoNumeric) throw new Error(`${iso2}: Wikidata has no ISO numeric code`);
  const c = (e.claims?.[WD.coordinates]?.[0]?.mainsnak.datavalue?.value ?? undefined) as { latitude: number; longitude: number } | undefined;
  const langItems = itemIds(e, WD.officialLanguage);
  const langs = langItems.length ? await entities(langItems, "claims", []) : new Map<string, WdEntity>();
  const languages = Array.from(langs.values())
    .flatMap((l) => strings(l, WD.wikimediaLanguageCode))
    .filter((code) => /^[a-z-]{2,12}$/.test(code));
  return {
    country: {
      iso2,
      isoNumeric: isoNumeric.padStart(3, "0"),
      name: label(e) ?? iso2,
      wikidataId: qid,
      centroid: c ? [Math.round(c.longitude * 100) / 100, Math.round(c.latitude * 100) / 100] : undefined,
    },
    languages,
  };
}

async function images(files: string[]): Promise<Map<string, ResearchCandidate["image"]>> {
  const out = new Map<string, ResearchCandidate["image"]>();
  for (let i = 0; i < files.length; i += 40) {
    const batch = files.slice(i, i + 40);
    const data = await getJson<{ query?: { pages?: Record<string, CommonsPage> } }>(COMMONS, {
      action: "query",
      titles: batch.map((f) => `File:${f}`).join("|"),
      prop: "imageinfo",
      iiprop: "size|url|extmetadata",
      format: "json",
    });
    for (const page of Object.values(data.query?.pages ?? {})) {
      const img = imageFromInfo(page as CommonsPage, (f) => createHash("md5").update(f).digest("hex"));
      if (img) out.set(img.file, img);
    }
  }
  return out;
}

async function research(iso2: string): Promise<ResearchCandidate[]> {
  console.log(`\n${iso2}: resolving country…`);
  const { country, languages } = await resolveCountry(iso2);
  console.log(`  ${country.name} (${country.wikidataId}), languages: ${languages.join(", ") || "—"}`);

  const ids = (await sparql(candidatesQuery(country.wikidataId, limit))).results.bindings.map((b) => b.item.value.split("/").pop()!);
  console.log(`  ${ids.length} UNESCO-listed element${ids.length === 1 ? "" : "s"} on Wikidata`);
  if (!ids.length) return [];

  const items = await entities(ids, "labels|descriptions|aliases|claims|sitelinks", languages);
  const refs = Array.from(items.values()).flatMap((e) => [
    ...itemIds(e, WD.ichStatus),
    ...itemIds(e, WD.instanceOf),
    ...itemIds(e, WD.locatedIn),
    ...itemIds(e, WD.location),
  ]);
  const labels = await entities(refs, "labels|claims", []);
  const files = Array.from(items.values())
    .map((e) => strings(e, WD.image)[0])
    .filter((f): f is string => !!f)
    .map((f) => f.replace(/ /g, "_"));
  const imgs = files.length ? await images(files) : new Map();

  const now = new Date();
  const out: ResearchCandidate[] = [];
  for (const e of items.values()) {
    const file = strings(e, WD.image)[0]?.replace(/ /g, "_");
    const c = entityToCandidate(e, {
      country,
      labels,
      languages,
      image: file ? imgs.get(file) : undefined,
      accessed: now.toISOString().slice(0, 10),
      fetchedAt: now.toISOString(),
    });
    if (c) out.push(c);
  }
  out.sort((a, b) => Number(b.materialCulture) - Number(a.materialCulture) || a.name.localeCompare(b.name));
  const crafts = out.filter((c) => c.materialCulture).length;
  const freeImages = out.filter((c) => c.image?.free).length;
  console.log(`  ${out.length} candidates · ${crafts} look like crafts or visual arts · ${freeImages} with a freely licensed image`);
  return out;
}

/** Wikipedia titles → Wikidata items, following redirects. */
async function wikidataIdsForTitles(titles: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const unique = Array.from(new Set(titles));
  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50);
    const data = await getJson<{
      query?: {
        normalized?: { from: string; to: string }[];
        redirects?: { from: string; to: string }[];
        pages?: Record<string, { title: string; pageprops?: { wikibase_item?: string } }>;
      };
    }>(WIKIPEDIA, { action: "query", titles: batch.join("|"), redirects: "1", prop: "pageprops", ppprop: "wikibase_item", format: "json" });
    const q = data.query ?? {};
    const byTitle = new Map(Object.values(q.pages ?? {}).flatMap((p) => (p.pageprops?.wikibase_item ? [[p.title, p.pageprops.wikibase_item] as const] : [])));
    for (const t of batch) {
      let cur = t;
      cur = q.normalized?.find((n) => n.from === cur)?.to ?? cur;
      cur = q.redirects?.find((r) => r.from === cur)?.to ?? cur;
      const id = byTitle.get(cur);
      if (id) out.set(t, id);
    }
  }
  return out;
}

/** Things the GI table sometimes links to instead of the craft itself. */
const NOT_A_TRADITION = /\b(city|town|village|district|human settlement|municipality|state of india|union territory|region|river|company|business|organization|person|human|taluk|neighbourhood|census town|ethnic group|people|temple complex|temple|monument|mountain|archaeological site|language)\b/i;

async function researchIndiaGi(): Promise<ResearchCandidate[]> {
  console.log("\nIN: India's Geographical Indications…");
  const { country, languages } = await resolveCountry("IN");
  const page = await getJson<{ parse: { wikitext: string } }>(WIKIPEDIA, { action: "parse", page: GI_LIST_PAGE, prop: "wikitext", format: "json", formatversion: "2" });
  const rows = parseGiTable(page.parse.wikitext).slice(0, limit);
  console.log(`  ${rows.length} handicraft and food GIs that link to an article`);

  const ids = await wikidataIdsForTitles([...rows.map((r) => r.article), ...rows.flatMap((r) => (r.stateArticle ? [r.stateArticle] : []))]);
  const itemIdsForRows = Array.from(new Set(rows.flatMap((r) => (ids.get(r.article) ? [ids.get(r.article)!] : []))));
  const stateIds = Array.from(new Set(rows.flatMap((r) => (r.stateArticle && ids.get(r.stateArticle) ? [ids.get(r.stateArticle)!] : []))));
  const items = await entities(itemIdsForRows, "labels|descriptions|aliases|claims|sitelinks", languages);
  const refs = Array.from(items.values()).flatMap((e) => [...itemIds(e, WD.ichStatus), ...itemIds(e, WD.instanceOf), ...itemIds(e, WD.locatedIn), ...itemIds(e, WD.location)]);
  const labels = await entities([...refs, ...stateIds], "labels|claims", []);
  const files = Array.from(items.values())
    .map((e) => strings(e, WD.image)[0])
    .filter((f): f is string => !!f)
    .map((f) => f.replace(/ /g, "_"));
  const imgs = files.length ? await images(files) : new Map();

  const now = new Date();
  const accessed = now.toISOString().slice(0, 10);
  const seen = new Set<string>();
  const out: ResearchCandidate[] = [];
  let skipped = 0;
  for (const r of rows) {
    const qid = ids.get(r.article);
    const e = qid ? items.get(qid) : undefined;
    if (!e || seen.has(e.id)) {
      if (!e) skipped++;
      continue;
    }
    const file = strings(e, WD.image)[0]?.replace(/ /g, "_");
    const c = entityToCandidate(e, { country, labels, languages, image: file ? imgs.get(file) : undefined, accessed, fetchedAt: now.toISOString() });
    if (!c) continue;
    if (c.kinds.some((k) => NOT_A_TRADITION.test(k))) {
      console.log(`  skip ${c.name}: Wikidata says ${c.kinds.join(", ")}`);
      continue;
    }
    const stateQ = r.stateArticle ? ids.get(r.stateArticle) : undefined;
    const st = stateQ ? labels.get(stateQ) : undefined;
    const stCoord = st?.claims?.[WD.coordinates]?.[0]?.mainsnak.datavalue?.value as { latitude: number; longitude: number } | undefined;
    const state = st && stateQ ? { name: label(st) ?? r.state, wikidataId: stateQ, ...(stCoord ? { lon: stCoord.longitude, lat: stCoord.latitude } : {}) } : undefined;
    seen.add(e.id);
    out.push(addGi(c, r, accessed, state));
  }
  const freeImages = out.filter((c) => c.image?.free).length;
  console.log(`  ${out.length} candidates · ${freeImages} with a freely licensed image · ${skipped} rows without a Wikidata item`);
  return out;
}

// ───────────────────────────── writers ─────────────────────────────

async function writeLocal(cands: ResearchCandidate[]) {
  const file = path.join(process.cwd(), RESEARCH_FILE);
  let data: ResearchFile = { candidates: {} };
  try {
    data = JSON.parse(await fs.readFile(file, "utf8")) as ResearchFile;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
  for (const c of cands) {
    const prev = data.candidates[c.id];
    // As in Postgres: a shared element stays with the first country that found it.
    data.candidates[c.id] = mergeCandidate(prev, prev ? { ...c, country: prev.country } : c);
  }
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
  console.log(`\nWrote ${cands.length} candidates to ${RESEARCH_FILE} (editor decisions were kept).`);
}

async function writePostgres(cands: ResearchCandidate[]) {
  const { db } = await import("../../src/lib/db.ts");
  const sql = db();
  // Status and review columns are not touched on conflict, so an editor's decision survives a refresh.
  // An element shared by several countries stays with the first country that found it (list the
  // country you want it filed under first).
  for (const c of cands) {
    await sql`
      insert into research_candidates (id, country_iso2, wikidata_id, name, data, fetched_at)
      values (${c.id}, ${c.country.iso2}, ${c.wikidataId}, ${c.name}, ${sql.json(c as never)}, ${c.fetchedAt})
      on conflict (id) do update set wikidata_id = excluded.wikidata_id, name = excluded.name,
        data = jsonb_set(excluded.data, '{country}', research_candidates.data->'country'), fetched_at = excluded.fetched_at`;
  }
  console.log(`\nUpserted ${cands.length} candidates into research_candidates (editor decisions were kept).`);
}

// ───────────────────────────── main ─────────────────────────────

const all: ResearchCandidate[] = [];
// Each country is saved as soon as it is done, so a dropped connection later on loses nothing.
const save = async (cands: ResearchCandidate[]) => {
  if (dryRun || !cands.length) return;
  if (target === "postgres") await writePostgres(cands);
  else await writeLocal(cands);
};
for (const c of countries) {
  try {
    const found = await research(c);
    await save(found);
    all.push(...found);
  } catch (e) {
    console.error(`  ${c}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}
// After the country runs, so a GI's record (with its registration) wins over the same item's UNESCO-only record.
if (indiaGi) {
  try {
    const found = await researchIndiaGi();
    await save(found);
    all.push(...found);
  } catch (e) {
    console.error(`  IN GI: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}
if (dryRun) {
  for (const c of all.slice(0, 15)) console.log(`  · ${c.country.iso2} ${c.name}${c.ich ? ` [${c.ich.id}${c.ich.year ? `, ${c.ich.year}` : ""}]` : ""}${c.gi ? ` [GI ${c.gi.applicationNo}, ${c.gi.state}]` : ""}${c.materialCulture ? " ◆ craft" : ""}`);
  console.log(`\nDry run: ${all.length} candidates, nothing written.`);
} else {
  console.log(`\nDone: ${all.length} candidates saved.`);
}
if (target === "postgres" && !dryRun) await (await import("../../src/lib/db.ts")).db().end();
