/**
 * Finds more freely licensed photographs for every research candidate and records them in
 * .data/research.json (`image` for the cover, `gallery` for the rest).
 *
 *   node scripts/research-images.mts
 *
 * Pictures come only from places that are about the tradition itself, in this order:
 *   1. the item's own Wikidata image(s) (P18);
 *   2. the lead image of its English Wikipedia article;
 *   3. its own Wikimedia Commons category (P373);
 *   4. other pictures in its Wikipedia article, but only when the file's name, description or
 *      categories mention the tradition (so portraits, maps and unrelated scenes are left out).
 * Every file must be a photo-sized JPEG or PNG under CC0, public domain, CC BY or CC BY-SA, and
 * not a map, flag, logo, diagram or icon. It also writes .data/research-wiki.json (each article's
 * introduction, used to judge which passports have enough to say).
 */
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { imageFromInfo, RESEARCH_FILE, type CommonsPage, type ResearchCandidate, type ResearchFile } from "../src/lib/research.ts";

const root = new URL("..", import.meta.url).pathname;
const file = path.join(root, RESEARCH_FILE);
const data: ResearchFile = JSON.parse(await fs.readFile(file, "utf8"));
const UA = "CulturePassportResearchPipeline/0.1 (open-source educational archive)";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const md5 = (f: string) => createHash("md5").update(f).digest("hex");
const MAX = 6;

// Wikimedia allows clients without contact details 10 requests a minute, so requests go one at a time.
let last = 0;
async function json<T>(url: string): Promise<T | null> {
  for (let a = 0; a < 8; a++) {
    const wait = last + 6500 - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (r.status === 429 || r.status >= 500) {
        await sleep(Math.max(Number(r.headers.get("retry-after")) * 1000 || 0, 10000 * 2 ** a));
        continue;
      }
      return r.ok ? ((await r.json()) as T) : null;
    } catch {
      await sleep(3000 * (a + 1));
    }
  }
  return null;
}
async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

const BAD_NAME = /(^|[^a-z])(map|maps|locator|location|flag|logo|icon|emblem|coat[_ ]of[_ ]arms|seal[_ ]of|signature|diagram|chart|graph|symbol|wordmark|banner|stamp|button|sound|audio|commons-logo|wiki)([^a-z]|$)/i;
const BAD_CAT = /\b(maps|flags|logos|icons|coats of arms|diagrams|charts|signatures|locator)\b/i;
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ");
const STOP = new Set(["the", "and", "of", "in", "art", "arts", "craft", "india", "indian", "traditional", "culture", "festival", "making", "from", "with", "sari","saree","saris","sarees","silk","shawl","shawls","painting","paintings","dance","dances","dancing","cloth","textile","textiles","pottery","mask","masks","furniture","embroidery","leather","goods","stone","carving","plate","lamp","cuisine","theatre","theater","matsuri","music","songs","song","ritual","rituals","practices","knowledge","skills","traditions","tradition","related","associated","craftsmanship","ceremony","festivals","japan","japanese","mexico","mexican","peru","peruvian","egypt","egyptian","morocco","moroccan","algeria","algerian","nigeria","ghana","mali","bengal","odisha","assam","gujarat","rajasthan","kashmir","kashmiri","karnataka","tamil","nadu","andhra","pradesh","west","sweet","laddu"]); // generic words do not identify a tradition
const keyWords = (c: ResearchCandidate) =>
  new Set([c.name, ...c.aliases, c.ich?.title ?? "", c.gi?.goods ?? ""].flatMap((s) => norm(s).split(" ")).filter((w) => w.length > 3 && !STOP.has(w)));

const stem = (f: string) => norm(f.replace(/\.[a-z]+$/i, "").replace(/[\d_()\-–.,]+/g, " ")).trim();
type Origin = "wikidata" | "lead" | "category" | "article";
const wanted = new Map<string, { origin: Origin; file: string }[]>(); // candidate id → ordered files
const add = (c: ResearchCandidate, origin: Origin, f: string) => {
  const name = f.replace(/^File:/i, "").replace(/ /g, "_");
  const list = wanted.get(c.id) ?? [];
  if (!list.some((x) => x.file === name)) list.push({ origin, file: name });
  wanted.set(c.id, list);
};
const cands = Object.values(data.candidates);
for (const c of cands) if (c.image) add(c, "wikidata", c.image.file);

// 1 + 3: Wikidata P18 values and P373 (Commons category)
const commonsCat = new Map<string, string>();
for (let i = 0; i < cands.length; i += 50) {
  const batch = cands.slice(i, i + 50);
  const r = await json<{ entities: Record<string, { claims?: Record<string, { mainsnak: { datavalue?: { value: string } } }[]> }> }>(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${batch.map((c) => c.wikidataId).join("|")}&props=claims&format=json`,
  );
  for (const c of batch) {
    const cl = r?.entities?.[c.wikidataId]?.claims ?? {};
    for (const s of cl.P18 ?? []) if (s.mainsnak.datavalue) add(c, "wikidata", s.mainsnak.datavalue.value);
    const cat = cl.P373?.[0]?.mainsnak.datavalue?.value;
    if (cat) commonsCat.set(c.id, cat);
  }
  }
console.log(`Wikidata read; ${commonsCat.size} Commons categories.`);

// 2 + 4: Wikipedia lead image, article images and introduction
const wiki: Record<string, { title: string; extract: string }> = {};
const articleFiles = new Map<string, string[]>();
const withArticle = cands.filter((c) => c.wikipedia);
const titleOf = (c: ResearchCandidate) => decodeURIComponent(c.wikipedia!.split("/wiki/")[1]).replace(/_/g, " ");
for (let i = 0; i < withArticle.length; i += 20) {
  const batch = withArticle.slice(i, i + 20);
  type Page = { title: string; pageimage?: string; images?: { title: string }[]; extract?: string; missing?: boolean };
  const pages = new Map<string, Page>();
  const map = new Map<string, string>(); // asked title → final title
  let cont: Record<string, string> = {};
  for (let round = 0; round < 15; round++) {
    const q = new URLSearchParams({ action: "query", titles: batch.map(titleOf).join("|"), redirects: "1", prop: "pageimages|images|extracts", piprop: "name", imlimit: "max", exintro: "1", explaintext: "1", exlimit: "20", format: "json", formatversion: "2", ...cont });
    const r = await json<{ continue?: Record<string, string>; query?: { normalized?: { from: string; to: string }[]; redirects?: { from: string; to: string }[]; pages?: Page[] } }>(`https://en.wikipedia.org/w/api.php?${q}`);
    for (const n of [...(r?.query?.normalized ?? []), ...(r?.query?.redirects ?? [])]) map.set(n.from, n.to);
    for (const p of r?.query?.pages ?? []) {
      const prev = pages.get(p.title);
      pages.set(p.title, { ...prev, ...p, images: [...(prev?.images ?? []), ...(p.images ?? [])], extract: p.extract ?? prev?.extract, pageimage: p.pageimage ?? prev?.pageimage });
    }
    if (!r?.continue) break;
    cont = r.continue;
  }
  for (const c of batch) {
    let t = titleOf(c);
    for (let k = 0; k < 3 && map.has(t); k++) t = map.get(t)!;
    const p = pages.get(t);
    if (!p || p.missing) continue;
    wiki[c.id] = { title: p.title, extract: p.extract ?? "" };
    if (p.pageimage) add(c, "lead", p.pageimage);
    articleFiles.set(c.id, (p.images ?? []).map((x) => x.title));
  }
  console.log(`  Wikipedia ${Math.min(i + 20, withArticle.length)}/${withArticle.length}`);
}
console.log(`Wikipedia read for ${Object.keys(wiki).length} articles.`);

await pool(cands.filter((c) => commonsCat.has(c.id)), 1, async (c) => {
  const q = new URLSearchParams({ action: "query", list: "categorymembers", cmtitle: `Category:${commonsCat.get(c.id)}`, cmtype: "file", cmlimit: "40", format: "json" });
  const r = await json<{ query?: { categorymembers?: { title: string }[] } }>(`https://commons.wikimedia.org/w/api.php?${q}`);
  for (const m of r?.query?.categorymembers ?? []) add(c, "category", m.title);
});
for (const c of cands) for (const f of articleFiles.get(c.id) ?? []) add(c, "article", f);

// File details from Commons
const allFiles = [...new Set([...wanted.values()].flat().map((x) => x.file).filter((f) => /\.(jpe?g|png)$/i.test(f) && !BAD_NAME.test(f.replace(/_/g, " "))))];
console.log(`Reading ${allFiles.length} Commons files…`);
const info = new Map<string, { page: CommonsPage; mime: string; categories: string }>();
for (let i = 0; i < allFiles.length; i += 50) {
  const batch = allFiles.slice(i, i + 50);
  const q = new URLSearchParams({ action: "query", titles: batch.map((f) => `File:${f}`).join("|"), prop: "imageinfo", iiprop: "size|url|mime|extmetadata", format: "json", formatversion: "2" });
  const r = await json<{ query?: { normalized?: { from: string; to: string }[]; pages?: (CommonsPage & { missing?: boolean; imageinfo?: (NonNullable<CommonsPage["imageinfo"]>[number] & { mime: string })[] })[] } }>(
    `https://commons.wikimedia.org/w/api.php?${q}`,
  );
  for (const p of r?.query?.pages ?? []) {
    if (p.missing || !p.imageinfo?.[0]) continue;
    const key = p.title.replace(/^File:/, "").replace(/ /g, "_");
    info.set(key, { page: p, mime: p.imageinfo[0].mime, categories: p.imageinfo[0].extmetadata?.Categories?.value ?? "" });
  }
  if ((i / 50) % 10 === 0) console.log(`  Commons files ${i}/${allFiles.length}`);
}

// Choose
let withCover = 0;
let total = 0;
for (const c of cands) {
  const words = keyWords(c);
  const chosen: NonNullable<ResearchCandidate["image"]>[] = [];
  for (const { origin, file: f } of wanted.get(c.id) ?? []) {
    if (chosen.length >= MAX) break;
    const x = info.get(f);
    if (!x || !/^image\/(jpeg|png)$/.test(x.mime) || BAD_CAT.test(x.categories)) continue;
    const img = imageFromInfo(x.page, md5);
    if (!img?.free || img.width < 640 || img.height < 420 || img.width / img.height > 3.2 || img.height / img.width > 3.2) continue;
    // Beyond the item's own image and its article's lead image, a picture must name the tradition
    // in its file name or description (categories and articles also hold loosely related pictures).
    if (origin === "category" || origin === "article") {
      const text = norm(`${f} ${img.description ?? ""}`);
      if (![...words].some((w) => text.includes(w))) continue;
    }
    // One picture per numbered series ("Dance_01.jpg", "Dance_02.jpg"…).
    if (chosen.some((x) => stem(x.file) === stem(img.file))) continue;
    chosen.push(img);
  }
  if (!chosen.length) {
    delete c.gallery;
    continue;
  }
  c.image = chosen[0];
  c.gallery = chosen.slice(1);
  withCover++;
  total += chosen.length;
}
await fs.writeFile(file, JSON.stringify(data, null, 2));
await fs.writeFile(path.join(root, ".data/research-wiki.json"), JSON.stringify(wiki, null, 1));
console.log(`${withCover} of ${cands.length} candidates have a picture; ${total} pictures in all.`);
