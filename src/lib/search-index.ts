import type { Archive, EvidenceLevel } from "./types";
import { isPublic, lookups } from "./data/archive";
import { CATEGORY } from "./labels";

export type DocType = "passport" | "case" | "event" | "claim" | "country" | "place" | "source" | "trail";

export interface SearchDoc {
  id: string;
  type: DocType;
  title: string;
  subtitle: string;
  text: string;
  href: string;
  /** passport this belongs to, for grouping */
  passport?: string;
  countries: string[];
  category?: string;
  level?: EvidenceLevel;
  year?: number;
}

/** Builds a compact search index of everything public. Runs on the server. */
export function buildSearchIndex(a: Archive): SearchDoc[] {
  const L = lookups(a);
  const docs: SearchDoc[] = [];
  const pub = a.traditions.filter(isPublic);
  for (const t of pub) {
    const communities = t.communities.map((c) => L.community.get(c.community)?.name ?? "");
    const places = t.places.map((p) => L.place.get(p.place)?.name ?? "");
    const countries = t.countries.map((c) => L.country.get(c)?.name ?? c);
    docs.push({
      id: `p:${t.slug}`,
      type: "passport",
      title: t.name,
      subtitle: `No. ${t.passportNo} · ${CATEGORY[t.category]} · ${t.regionLabel}`,
      text: [
        t.displayTitle,
        t.tagline,
        t.summary,
        ...t.nativeNames.map((n) => n.text),
        ...t.alternateNames,
        ...t.techniques,
        ...communities,
        ...places,
        ...countries,
        ...t.periods,
        CATEGORY[t.category],
      ].join(" · "),
      href: `/passport/${t.slug}`,
      passport: t.name,
      countries: t.countries,
      category: t.category,
    });
    for (const c of t.travels.cases) {
      docs.push({
        id: `c:${c.id}`,
        type: "case",
        title: `${c.title}`,
        subtitle: `Case file ${c.code} · ${t.name}`,
        text: [c.summary, c.status, ...c.parties, ...c.travelled, ...c.leftBehind, "attribution misattribution acknowledgement runway fashion"].join(" · "),
        href: `/passport/${t.slug}#travels`,
        passport: t.name,
        countries: t.countries,
        category: t.category,
      });
    }
    for (const e of t.timeline) {
      docs.push({
        id: `e:${e.id}`,
        type: "event",
        title: e.title,
        subtitle: `${e.date.label} · ${t.name}`,
        text: [e.body, e.place ? L.place.get(e.place)?.name : "", e.tag ?? "", String(e.date.year)].join(" · "),
        href: `/passport/${t.slug}#through-time`,
        passport: t.name,
        countries: t.countries,
        category: t.category,
        level: e.level,
        year: e.date.year,
      });
    }
    for (const c of t.claims) {
      docs.push({
        id: `cl:${c.id}`,
        type: "claim",
        title: c.text.length > 110 ? `${c.text.slice(0, 108)}…` : c.text,
        subtitle: `Claim · ${t.name}`,
        text: [c.text, c.note ?? ""].join(" · "),
        href: `/passport/${t.slug}#claim-${c.id}`,
        passport: t.name,
        countries: t.countries,
        category: t.category,
        level: c.level,
      });
    }
  }
  for (const c of a.countries) {
    docs.push({
      id: `k:${c.slug}`,
      type: "country",
      title: c.name,
      subtitle: c.headline,
      text: [c.intro, ...c.candidates.map((x) => `${x.name} ${x.note}`)].join(" · "),
      href: `/country/${c.slug}`,
      countries: [c.iso2],
    });
  }
  for (const p of a.places) {
    const ts = pub.filter((t) => t.places.some((tp) => tp.place === p.id) || t.timeline.some((e) => e.place === p.id));
    if (!ts.length) continue;
    docs.push({
      id: `pl:${p.id}`,
      type: "place",
      title: p.name,
      subtitle: `Place · ${ts.map((t) => t.name).join(", ")}`,
      text: [p.note ?? "", p.kind, L.country.get(p.country)?.name ?? p.country].join(" · "),
      href: `/passport/${ts[0].slug}#origins`,
      countries: [p.country],
    });
  }
  for (const s of a.sources) {
    const t = pub.find((x) => x.claims.some((c) => c.sources.includes(s.id)) || x.timeline.some((e) => e.sources.includes(s.id)));
    if (!t) continue;
    docs.push({
      id: `s:${s.id}`,
      type: "source",
      title: s.title,
      subtitle: `${s.publisher}${s.date ? ` · ${s.date}` : ""}`,
      text: [s.author ?? "", s.notes ?? "", s.type].join(" · "),
      href: `/passport/${t.slug}#source-${s.id}`,
      passport: t.name,
      countries: t.countries,
    });
  }
  for (const tr of a.trails) {
    docs.push({
      id: `t:${tr.slug}`,
      type: "trail",
      title: tr.title,
      subtitle: `${tr.kicker} · ${tr.steps.length} stops`,
      text: [tr.intro, ...tr.steps.map((s) => `${L.tradition.get(s.tradition)?.name ?? ""} ${s.note}`)].join(" · "),
      href: `/trails/${tr.slug}`,
      countries: [],
    });
  }
  return docs;
}
