import type { Archive, Tradition } from "../../types.ts";
import { sources } from "./sources.ts";
import { places, communities, organizations, media, countries } from "./registry.ts";
import { relationships, trails } from "./connections.ts";
import { kolhapuri } from "./kolhapuri.ts";
import { madhubani } from "./madhubani.ts";
import { phulkari } from "./phulkari.ts";
import { warli } from "./warli.ts";
import { ajrakh } from "./ajrakh.ts";
import { sadu } from "./sadu.ts";

export const seedTraditions: Tradition[] = [kolhapuri, madhubani, phulkari, warli, ajrakh, sadu];

export const seedArchive: Omit<Archive, "backend"> = {
  traditions: seedTraditions,
  sources,
  places,
  communities,
  organizations,
  media,
  countries,
  relationships,
  trails,
};

/**
 * Referential-integrity check for the archive. Returns a list of human-readable problems.
 * Used by the seed generator, the admin dashboard and the test script.
 */
export function validateArchive(a: Omit<Archive, "backend">): string[] {
  const errors: string[] = [];
  const src = new Set(a.sources.map((s) => s.id));
  const plc = new Set(a.places.map((p) => p.id));
  const com = new Set(a.communities.map((c) => c.id));
  const org = new Set(a.organizations.map((o) => o.id));
  const med = new Set(a.media.map((m) => m.id));
  const slugs = new Set(a.traditions.map((t) => t.slug));
  const nos = new Set<string>();

  const needSources = (where: string, ids: string[] | undefined) => {
    for (const id of ids ?? []) if (!src.has(id)) errors.push(`${where}: unknown source "${id}"`);
  };

  for (const t of a.traditions) {
    const w = `tradition ${t.slug}`;
    if (nos.has(t.passportNo)) errors.push(`${w}: duplicate passport number ${t.passportNo}`);
    nos.add(t.passportNo);
    const claimIds = new Set(t.claims.map((c) => c.id));
    for (const c of t.claims) {
      if (!c.sources.length) errors.push(`${w}: claim ${c.id} has no sources`);
      needSources(`${w} claim ${c.id}`, c.sources);
    }
    for (const p of t.places) if (!plc.has(p.place)) errors.push(`${w}: unknown place "${p.place}"`);
    for (const c of t.communities) if (!com.has(c.community)) errors.push(`${w}: unknown community "${c.community}"`);
    for (const m of [t.hero, ...t.gallery]) if (m && !med.has(m)) errors.push(`${w}: unknown media "${m}"`);
    const blocks = [...t.origins, ...t.significance, ...t.makers.intro, ...t.travels.intro];
    for (const b of blocks) {
      if (b.type === "figure" && !med.has(b.media)) errors.push(`${w}: figure uses unknown media "${b.media}"`);
      if ((b.type === "p" || b.type === "note") && b.claims)
        for (const c of b.claims) if (!claimIds.has(c)) errors.push(`${w}: block references unknown claim "${c}"`);
    }
    for (const e of t.timeline) {
      needSources(`${w} event ${e.id}`, e.sources);
      if (e.place && !plc.has(e.place)) errors.push(`${w} event ${e.id}: unknown place "${e.place}"`);
      if (e.media && !med.has(e.media)) errors.push(`${w} event ${e.id}: unknown media "${e.media}"`);
    }
    for (const m of t.makers.materials) needSources(`${w} material ${m.name}`, m.sources);
    for (const s of t.makers.process) needSources(`${w} step ${s.title}`, s.sources);
    for (const p of t.makers.practitioners) needSources(`${w} practitioner ${p.name}`, p.sources);
    for (const i of t.travels.influences) needSources(`${w} influence ${i.title}`, i.sources);
    for (const cs of t.travels.cases) {
      for (const e of cs.events) needSources(`${w} case ${cs.code} event ${e.id}`, e.sources);
      for (const q of cs.questions) needSources(`${w} case ${cs.code} question`, q.sources);
      needSources(`${w} case ${cs.code} legal note`, cs.legalNote?.sources);
      const cm = cs.comparison;
      if (cm?.traditional.media && !med.has(cm.traditional.media)) errors.push(`${w}: comparison media unknown`);
      if (cm?.adaptation.media && !med.has(cm.adaptation.media)) errors.push(`${w}: comparison media unknown`);
    }
    for (const o of t.keepAlive.organizations) if (!org.has(o)) errors.push(`${w}: unknown organisation "${o}"`);
    for (const r of t.keepAlive.resources) if (r.source) needSources(`${w} resource`, [r.source]);
    for (const r of t.related) if (!slugs.has(r.slug)) errors.push(`${w}: related to unknown passport "${r.slug}"`);
  }
  for (const c of a.communities) needSources(`community ${c.id}`, c.sources);
  for (const o of a.organizations) {
    needSources(`organisation ${o.id}`, o.sources);
    if (o.placeId && !plc.has(o.placeId)) errors.push(`organisation ${o.id}: unknown place`);
  }
  for (const r of a.relationships) {
    if (!slugs.has(r.tradition)) errors.push(`relationship ${r.id}: unknown tradition`);
    if (!plc.has(r.from) || !plc.has(r.to)) errors.push(`relationship ${r.id}: unknown place`);
    if (!r.sources.length) errors.push(`relationship ${r.id}: no sources`);
    needSources(`relationship ${r.id}`, r.sources);
  }
  for (const tr of a.trails) for (const s of tr.steps) if (!slugs.has(s.tradition)) errors.push(`trail ${tr.slug}: unknown passport ${s.tradition}`);
  for (const c of a.countries) {
    for (const s of c.sharedTraditions ?? []) if (!slugs.has(s)) errors.push(`country ${c.slug}: unknown shared tradition ${s}`);
    for (const cand of c.candidates) needSources(`country ${c.slug} candidate`, cand.sources);
  }
  return errors;
}
