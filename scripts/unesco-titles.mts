/**
 * Reads each research candidate's UNESCO element page and records the element's official title,
 * so passports quote UNESCO's own wording. Many traditions are listed under another name, or as
 * one part of a grouped element (for example 33 Japanese float festivals form "Yama, Hoko, Yatai,
 * float festivals in Japan"); the claim then says exactly that.
 *
 *   node scripts/unesco-titles.mts       updates .data/research.json in place
 *
 * Broken element links are repaired when the element is found under another list prefix.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { RESEARCH_FILE, type ResearchFile } from "../src/lib/research.ts";

const root = new URL("..", import.meta.url).pathname;
const file = path.join(root, RESEARCH_FILE);
const data: ResearchFile = JSON.parse(await fs.readFile(file, "utf8"));
const UA = "CulturePassportResearchPipeline/0.1 (open-source educational archive)";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const decode = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .trim();

async function titleOf(url: string): Promise<string | null> {
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(String(r.status));
      const t = (await r.text()).match(/<title>([^<]*)<\/title>/i)?.[1];
      const title = t ? decode(t).replace(/\s*-\s*UNESCO Intangible Cultural Heritage\s*$/i, "") : null;
      return title && !/^(Browse|UNESCO|Page not found)/i.test(title) ? title : null;
    } catch {
      await sleep(4000 * (a + 1));
    }
  }
  return null;
}

let updated = 0;
const failed: string[] = [];
const cands = Object.values(data.candidates).filter((c) => c.ich);
for (const c of cands) {
  const ich = c.ich!;
  const num = ich.id.match(/(\d{5})$/)?.[1];
  const tries = [ich.url, ...(num ? ["RL", "USL", "BSP"].map((p) => `https://ich.unesco.org/en/${p}/${num}`) : [])];
  let title: string | null = null;
  let url = ich.url;
  for (const u of [...new Set(tries)]) {
    title = await titleOf(u);
    if (title) {
      url = u;
      break;
    }
  }
  await sleep(250);
  if (!title) {
    failed.push(`${c.name} (${ich.url})`);
    continue;
  }
  ich.url = url;
  ich.title = title;
  const year = ich.year ? ` (inscribed ${ich.year}, as recorded on Wikidata)` : "";
  const fact = c.facts.find((f) => f.sources.includes("unesco"));
  if (fact) fact.text = `It is listed on UNESCO's ${ich.listLabel} in the element “${title}”${year}.`;
  const src = c.sources.find((s) => s.key === "unesco");
  if (src) {
    src.title = `${title} — ${ich.listLabel}`;
    src.url = url;
  }
  updated++;
}
await fs.writeFile(file, JSON.stringify(data, null, 2));
console.log(`UNESCO titles recorded for ${updated} of ${cands.length} candidates.`);
if (failed.length) console.log(`Could not read: ${failed.join("; ")}`);
