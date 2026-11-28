/**
 * Automated fact checks for the research passports in the snapshot (src/lib/data/snapshot.json).
 *
 *   npm run check:research               writes data/research-checks.md and prints a summary
 *
 * For every research passport it checks, against the live sources:
 *   - UNESCO: the element page opens and its title matches the passport;
 *   - India GIs: the application number, state and year still match the GI table;
 *   - images: the Commons file still exists under a free licence (CC0, public domain, CC BY, CC BY-SA);
 *   - Wikidata and Wikipedia: the records still exist.
 * It changes nothing; problems are listed for an editor.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { GI_LIST_PAGE, isFreeLicence, parseGiTable } from "../../src/lib/research.ts";
import type { Archive } from "../../src/lib/types.ts";

const root = new URL("../..", import.meta.url).pathname;
const UA = "CulturePassportResearchPipeline/0.1 (open-source educational archive)";
const snapshot = JSON.parse(await fs.readFile(path.join(root, "src/lib/data/snapshot.json"), "utf8")) as Omit<Archive, "backend">;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string, accept = "application/json"): Promise<Response | null> {
  for (let a = 0; a < 5; a++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: accept }, redirect: "follow" });
      if (r.status === 429 || r.status >= 500) {
        await sleep(Number(r.headers.get("retry-after")) * 1000 || 2000 * 2 ** a);
        continue;
      }
      return r;
    } catch {
      await sleep(3000 * (a + 1));
    }
  }
  return null;
}
const json = async <T,>(url: string): Promise<T | null> => {
  const r = await get(url);
  return r?.ok ? ((await r.json()) as T) : null;
};

const research = snapshot.traditions.filter((t) => t.editorial.reviewedBy.startsWith("Research pipeline"));
const src = new Map(snapshot.sources.map((s) => [s.id, s]));
const media = new Map(snapshot.media.map((m) => [m.id, m]));
const qidOf = (t: (typeof research)[number]) => t.id.match(/^trad-(q\d+)$/)?.[1]?.toUpperCase() ?? t.claims[0]?.id.split("-")[0]?.toUpperCase();
const problems: { slug: string; check: string; detail: string }[] = [];
const flag = (slug: string, check: string, detail: string) => problems.push({ slug, check, detail });
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ");
const words = (s: string) => new Set(norm(s).split(/\s+/).filter((w) => w.length > 3));
const checked = { unesco: 0, gi: 0, images: 0, wikidata: 0, wikipedia: 0 };

// ── UNESCO element pages ──
const unesco = research.flatMap((t) => {
  const s = src.get(`research-${qidOf(t)?.toLowerCase()}-unesco`);
  return s ? [{ t, s }] : [];
});
for (let i = 0; i < unesco.length; i += 4) {
  await Promise.all(
    unesco.slice(i, i + 4).map(async ({ t, s }) => {
      const r = await get(s.url, "text/html");
      checked.unesco++;
      if (!r || !r.ok) return flag(t.slug, "UNESCO page", `${s.url} → ${r?.status ?? "no response"}`);
      const title = (await r.text()).match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
      // The source records UNESCO's official title ("<title> — <list>"); it must match the page.
      const recorded = s.title.split(" — ")[0];
      const overlap = [...words(recorded)].some((w) => words(title).has(w));
      if (!overlap) flag(t.slug, "UNESCO page", `page title "${title.slice(0, 100)}" does not match the recorded element "${recorded.slice(0, 100)}"`);
    }),
  );
  await sleep(300);
}

// ── India GIs: compare with the current table ──
const giPage = await json<{ parse: { wikitext: string } }>(
  `https://en.wikipedia.org/w/api.php?action=parse&page=${GI_LIST_PAGE}&prop=wikitext&format=json&formatversion=2`,
);
if (giPage) {
  const rows = parseGiTable(giPage.parse.wikitext);
  for (const t of research) {
    const claim = t.claims.find((c) => /Geographical Indication .*application no\./.test(c.text));
    if (!claim) continue;
    checked.gi++;
    const app = claim.text.match(/application no\. ([^,]+?)(?:, |\.$)/)?.[1];
    const row = rows.find((r) => r.applicationNo === app);
    if (!row) {
      flag(t.slug, "GI register", `application no. ${app} is no longer in the GI table`);
      continue;
    }
    if (!claim.text.includes(`for ${row.state},`)) flag(t.slug, "GI register", `state differs: table says ${row.state}`);
    if (row.year && !claim.text.includes(row.year)) flag(t.slug, "GI register", `year differs: table says ${row.year}`);
  }
} else flag("—", "GI register", "could not load the GI table");

// ── Images on Wikimedia Commons ──
const files = research.flatMap((t) => (t.hero && media.get(t.hero)?.commonsFile ? [{ t, m: media.get(t.hero)! }] : []));
for (let i = 0; i < files.length; i += 40) {
  const batch = files.slice(i, i + 40);
  const q = new URLSearchParams({ action: "query", titles: batch.map((b) => `File:${b.m.commonsFile}`).join("|"), prop: "imageinfo", iiprop: "extmetadata", format: "json" });
  const data = await json<{ query?: { normalized?: { from: string; to: string }[]; pages?: Record<string, { title: string; missing?: string; imageinfo?: { extmetadata?: Record<string, { value: string }> }[] }> } }>(
    `https://commons.wikimedia.org/w/api.php?${q}`,
  );
  const pages = Object.values(data?.query?.pages ?? {});
  for (const { t, m } of batch) {
    checked.images++;
    const want = `File:${m.commonsFile}`.replace(/_/g, " ");
    const title = data?.query?.normalized?.find((n) => n.from.replace(/_/g, " ") === want)?.to ?? want;
    const p = pages.find((x) => x.title === title);
    if (!p || "missing" in p) {
      flag(t.slug, "image", `Commons file ${m.commonsFile} no longer exists`);
      continue;
    }
    const lic = p.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value ?? "";
    if (!isFreeLicence(lic)) flag(t.slug, "image", `licence is now "${lic}" (not free)`);
  }
  await sleep(300);
}

// ── Wikidata and Wikipedia records ──
const qids = research.map((t) => ({ t, q: qidOf(t) })).filter((x): x is { t: typeof x.t; q: string } => !!x.q);
for (let i = 0; i < qids.length; i += 50) {
  const batch = qids.slice(i, i + 50);
  const data = await json<{ entities: Record<string, { missing?: string; redirects?: unknown }> }>(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${batch.map((b) => b.q).join("|")}&props=info&format=json`,
  );
  for (const { t, q } of batch) {
    checked.wikidata++;
    if (!data || !data.entities?.[q] || "missing" in data.entities[q]) flag(t.slug, "Wikidata", `${q} not found`);
  }
  await sleep(300);
}
const wp = research.flatMap((t) => {
  const s = src.get(`research-${qidOf(t)?.toLowerCase()}-wikipedia`);
  return s ? [{ t, title: decodeURIComponent(s.url.split("/wiki/")[1] ?? "").replace(/_/g, " ") }] : [];
});
for (let i = 0; i < wp.length; i += 50) {
  const batch = wp.slice(i, i + 50);
  const q = new URLSearchParams({ action: "query", titles: batch.map((b) => b.title).join("|"), redirects: "1", format: "json" });
  const data = await json<{ query?: { normalized?: { from: string; to: string }[]; redirects?: { from: string; to: string }[]; pages?: Record<string, { title: string; missing?: string }> } }>(
    `https://en.wikipedia.org/w/api.php?${q}`,
  );
  const missing = new Set(Object.values(data?.query?.pages ?? {}).filter((p) => "missing" in p).map((p) => p.title));
  for (const { t, title } of batch) {
    checked.wikipedia++;
    let cur = data?.query?.normalized?.find((n) => n.from === title)?.to ?? title;
    cur = data?.query?.redirects?.find((r) => r.from === cur)?.to ?? cur;
    if (!data || missing.has(cur)) flag(t.slug, "Wikipedia", `article "${title}" not found`);
  }
  await sleep(300);
}

// ── Report ──
const today = new Date().toISOString().slice(0, 10);
const lines = [
  `# Research passport checks — ${today}`,
  "",
  `${research.length} research passports checked against live sources: ${checked.unesco} UNESCO pages, ${checked.gi} GI registrations, ${checked.images} images, ${checked.wikidata} Wikidata records, ${checked.wikipedia} Wikipedia articles.`,
  "",
  problems.length ? `## ${problems.length} problem(s)` : "No problems found.",
  "",
  ...problems.map((p) => `- \`${p.slug}\` — **${p.check}**: ${p.detail}`),
  "",
];
await fs.writeFile(path.join(root, "backend/data/research-checks.md"), lines.join("\n"));
console.log(lines.slice(0, 5).join("\n"));
for (const p of problems.slice(0, 40)) console.log(`  ${p.slug} · ${p.check}: ${p.detail}`);
process.exitCode = problems.some((p) => p.check !== "UNESCO page") ? 1 : 0;
