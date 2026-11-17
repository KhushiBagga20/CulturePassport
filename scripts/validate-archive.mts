// Run: node scripts/validate-archive.ts — checks every reference in the seed archive resolves.
import { seedArchive, validateArchive } from "../src/lib/data/seed/index.ts";

const errors = validateArchive(seedArchive);
const claims = seedArchive.traditions.reduce((n, t) => n + t.claims.length, 0);
const events = seedArchive.traditions.reduce((n, t) => n + t.timeline.length, 0);
console.log(`${seedArchive.traditions.length} passports · ${claims} claims · ${events} timeline events · ${seedArchive.sources.length} sources · ${seedArchive.relationships.length} connections`);
const used = new Set<string>();
const walk = (v: unknown) => {
  if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) { if ((k === "sources") && Array.isArray(x)) x.forEach((s) => used.add(String(s))); else if (k === "source" && typeof x === "string") used.add(x); else walk(x); }
};
walk(seedArchive);
const unused = seedArchive.sources.filter((s) => !used.has(s.id)).map((s) => s.id);
if (unused.length) console.log("Sources not cited anywhere:", unused.join(", "));
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("Archive integrity: OK");
