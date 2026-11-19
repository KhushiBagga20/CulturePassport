/**
 * Culture Passport research pipeline.
 *
 *   npm run research -- --country GH --country MX [--limit 40] [--dry-run] [--target local|supabase]
 *
 * For each country (ISO 3166-1 alpha-2) it finds UNESCO-listed intangible heritage on Wikidata,
 * fetches each element's record, image licence (Wikimedia Commons) and the country's languages,
 * and writes *research candidates* to a review queue. It never creates or publishes passports:
 * an editor reviews candidates at /admin/research and can turn one into a draft.
 *
 * Targets
 *   local     .data/research.json (default when no Supabase service credentials are set)
 *   supabase  research_candidates table, using SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from
 *             pipeline/.env. That key bypasses row-level security, so it lives only here and must
 *             never be given a NEXT_PUBLIC_ name or be put in the web app's environment.
 */
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  RESEARCH_FILE,
  WD,
  candidatesQuery,
  entityToCandidate,
  imageFromInfo,
  itemIds,
  label,
  mergeCandidate,
  strings,
  type CandidateCountry,
  type CommonsPage,
  type ResearchCandidate,
  type ResearchFile,
  type WdEntity,
} from "../src/lib/research.ts";

// Generic client name, per Wikimedia's User-Agent policy; no personal contact details.
const UA = "CulturePassportResearchPipeline/0.1 (open-source educational archive)";
const WIKIDATA = "https://www.wikidata.org/w/api.php";
const SPARQL = "https://query.wikidata.org/sparql";
const COMMONS = "https://commons.wikimedia.org/w/api.php";

// ───────────────────────────── arguments ─────────────────────────────

const argv = process.argv.slice(2);
const opt = (name: string) => argv.flatMap((a, i) => (a === `--${name}` ? [argv[i + 1]] : a.startsWith(`--${name}=`) ? [a.split("=")[1]] : []));
const countries = opt("country").flatMap((c) => c.split(",")).map((c) => c.trim().toUpperCase()).filter(Boolean);
const limit = Number(opt("limit")[0] ?? 60);
const dryRun = argv.includes("--dry-run");
const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const target = (opt("target")[0] ?? (hasSupabase ? "supabase" : "local")) as "local" | "supabase";

if (!countries.length || countries.some((c) => !/^[A-Z]{2}$/.test(c))) {
  console.error("Usage: npm run research -- --country GH [--country MX] [--limit 60] [--dry-run] [--target local|supabase]");
  process.exit(1);
}
if (target === "supabase" && !hasSupabase) {
  console.error("--target supabase needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in pipeline/.env (see pipeline/README.md).");
  process.exit(1);
}

// ───────────────────────────── polite HTTP ─────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson<T>(url: string, params: Record<string, string>, accept = "application/json"): Promise<T> {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(u, { headers: { "User-Agent": UA, Accept: accept } });
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

// ───────────────────────────── writers ─────────────────────────────

async function writeLocal(cands: ResearchCandidate[]) {
  const file = path.join(process.cwd(), RESEARCH_FILE);
  let data: ResearchFile = { candidates: {} };
  try {
    data = JSON.parse(await fs.readFile(file, "utf8")) as ResearchFile;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
  for (const c of cands) data.candidates[c.id] = mergeCandidate(data.candidates[c.id], c);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
  console.log(`\nWrote ${cands.length} candidates to ${RESEARCH_FILE} (editor decisions were kept).`);
}

async function writeSupabase(cands: ResearchCandidate[]) {
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  // Status and review columns are not sent, so an editor's decision survives a refresh.
  const rows = cands.map((c) => ({ id: c.id, country_iso2: c.country.iso2, wikidata_id: c.wikidataId, name: c.name, data: c, fetched_at: c.fetchedAt }));
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await db.from("research_candidates").upsert(rows.slice(i, i + 100), { onConflict: "id" });
    if (error) throw new Error(`Supabase: ${error.message}`);
  }
  console.log(`\nUpserted ${cands.length} candidates into research_candidates.`);
}

// ───────────────────────────── main ─────────────────────────────

const all: ResearchCandidate[] = [];
for (const c of countries) {
  try {
    all.push(...(await research(c)));
  } catch (e) {
    console.error(`  ${c}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}
if (dryRun) {
  for (const c of all.slice(0, 15)) console.log(`  · ${c.country.iso2} ${c.name}${c.ich ? ` [${c.ich.id}${c.ich.year ? `, ${c.ich.year}` : ""}]` : ""}${c.materialCulture ? " ◆ craft" : ""}`);
  console.log(`\nDry run: ${all.length} candidates, nothing written.`);
} else if (all.length) {
  if (target === "supabase") await writeSupabase(all);
  else await writeLocal(all);
}
