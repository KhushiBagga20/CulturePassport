/**
 * Pure mapping between the Culture Passport content model and the normalised
 * Postgres tables in supabase/migrations. Used by:
 *   - scripts/generate-seed-sql.mts  (archive → rows → SQL)
 *   - the Supabase adapter           (rows → archive, tradition → rows on save)
 *   - scripts/test-db-roundtrip.mts  (archive → SQL → Postgres → rows → archive)
 * No runtime imports other than types, so Node can run it with type stripping.
 */
import type {
  Archive,
  CaseStudy,
  Claim,
  CountryRecord,
  MediaAsset,
  Organization,
  Relationship,
  Source,
  TextBlock,
  TimelineEvent,
  Tradition,
  Trail,
} from "../types.ts";

type Row = Record<string, unknown>;
export type Rows = Record<string, Row[]>;

/** Tables that belong to a single tradition, in insert order. */
export const TRADITION_CHILD_TABLES = [
  "tradition_slug_history",
  "tradition_names",
  "tradition_countries",
  "tradition_places",
  "tradition_communities",
  "tradition_sections",
  "tradition_translations",
  "claims",
  "claim_sources",
  "case_studies",
  "case_sources",
  "case_questions",
  "case_question_sources",
  "events",
  "event_sources",
  "influences",
  "influence_sources",
  "materials",
  "material_sources",
  "process_steps",
  "process_step_sources",
  "practitioners",
  "practitioner_sources",
  "tradition_organizations",
  "resources",
  "related_traditions",
] as const;

/** Global tables, in dependency order. */
export const GLOBAL_TABLES = [
  "sources",
  "countries",
  "places",
  "communities",
  "community_sources",
  "organizations",
  "organization_sources",
  "media_assets",
] as const;

export const LATE_TABLES = ["relationships", "relationship_sources", "trails", "trail_steps"] as const;

const n = <T,>(v: T | undefined): T | null => (v === undefined ? null : v);
const link = (table: string, key: string, owner: string, ids: string[], out: Rows) =>
  ids.forEach((source_id, position) => out[table].push({ [key]: owner, source_id, position }));

function emptyRows(tables: readonly string[]): Rows {
  return Object.fromEntries(tables.map((t) => [t, [] as Row[]]));
}

// ───────────────────────────── archive → rows ─────────────────────────────

export function sourceToRow(s: Source): Row {
  return {
    id: s.id,
    title: s.title,
    publisher: s.publisher,
    author: n(s.author),
    date: n(s.date),
    url: s.url,
    type: s.type,
    accessed: s.accessed,
    notes: n(s.notes),
  };
}

export function mediaToRow(m: MediaAsset): Row {
  return {
    id: m.id,
    commons_file: n(m.commonsFile),
    commons_hash: n(m.commonsHash),
    url: n(m.url),
    width: m.width,
    height: m.height,
    alt: m.alt,
    caption: m.caption,
    credit: m.credit,
    license: m.license,
    license_url: n(m.licenseUrl),
    source_page: m.sourcePage,
    kind: m.kind,
    documentary: m.documentary,
  };
}

function eventRow(e: TimelineEvent, traditionId: string, caseId: string | null, id: string, position: number): Row {
  return {
    id,
    tradition_id: traditionId,
    case_id: caseId,
    year: e.date.year,
    month: n(e.date.month),
    day: n(e.date.day),
    approx: e.date.approx ?? false,
    date_label: e.date.label,
    title: e.title,
    body: e.body,
    level: e.level,
    place_id: n(e.place),
    tag: n(e.tag),
    media_id: n(e.media),
    position,
  };
}

export function traditionToRows(t: Tradition, slugToId: (slug: string) => string): Rows {
  const out = emptyRows(["traditions", ...TRADITION_CHILD_TABLES]);
  const tid = t.id;
  out.traditions.push({
    id: tid,
    slug: t.slug,
    passport_no: t.passportNo,
    status: t.status,
    maturity: t.maturity,
    name: t.name,
    display_title: t.displayTitle,
    tagline: t.tagline,
    category: t.category,
    techniques: t.techniques,
    collection_iso2: t.collection,
    region_label: t.regionLabel,
    summary: t.summary,
    intro: t.intro,
    accent: t.accent,
    motif: t.motif,
    hero_media_id: n(t.hero),
    gallery: t.gallery,
    periods: t.periods,
    voices_note: t.makers.voicesNote,
    collaboration_notes: t.keepAlive.collaborationNotes,
    editorial: t.editorial,
  });
  (t.slugHistory ?? []).forEach((old_slug) => out.tradition_slug_history.push({ old_slug, tradition_id: tid }));
  t.nativeNames.forEach((nm, i) =>
    out.tradition_names.push({ id: `${tid}:native:${i}`, tradition_id: tid, kind: "native", name: nm.text, script: nm.script, lang: nm.lang, note: n(nm.note), position: i }),
  );
  t.alternateNames.forEach((nm, i) =>
    out.tradition_names.push({ id: `${tid}:alt:${i}`, tradition_id: tid, kind: "alternate", name: nm, script: null, lang: null, note: null, position: i }),
  );
  t.countries.forEach((c, position) => out.tradition_countries.push({ tradition_id: tid, country_iso2: c, position }));
  t.places.forEach((p, position) => out.tradition_places.push({ tradition_id: tid, place_id: p.place, role: p.role, note: n(p.note), position }));
  t.communities.forEach((c, position) => out.tradition_communities.push({ tradition_id: tid, community_id: c.community, role: c.role, position }));
  const sections: [string, TextBlock[]][] = [
    ["origins", t.origins],
    ["significance", t.significance],
    ["makers", t.makers.intro],
    ["travels", t.travels.intro],
  ];
  for (const [chapter, blocks] of sections) out.tradition_sections.push({ tradition_id: tid, chapter, locale: "en", blocks });
  for (const [locale, tr] of Object.entries(t.translations ?? {})) {
    if (!tr) continue;
    out.tradition_translations.push({ tradition_id: tid, locale, name: n(tr.name), tagline: n(tr.tagline), summary: n(tr.summary), reviewed: tr.reviewed });
  }
  t.claims.forEach((c: Claim, position) => {
    out.claims.push({ id: c.id, tradition_id: tid, text: c.text, level: c.level, note: n(c.note), position });
    link("claim_sources", "claim_id", c.id, c.sources, out);
  });
  t.timeline.forEach((e, i) => {
    out.events.push(eventRow(e, tid, null, e.id, i));
    link("event_sources", "event_id", e.id, e.sources, out);
  });
  t.travels.cases.forEach((cs: CaseStudy, position) => {
    out.case_studies.push({
      id: cs.id,
      tradition_id: tid,
      slug: cs.slug,
      code: cs.code,
      title: cs.title,
      kind: cs.kind,
      parties: cs.parties,
      summary: cs.summary,
      status: cs.status,
      travelled: cs.travelled,
      left_behind: cs.leftBehind,
      legal_note: n(cs.legalNote?.text),
      comparison: n(cs.comparison),
      open_questions: cs.openQuestions,
      position,
    });
    (cs.legalNote?.sources ?? []).forEach((source_id, p) => out.case_sources.push({ case_id: cs.id, source_id, purpose: "legal", position: p }));
    cs.questions.forEach((q, qi) => {
      const qid = `${cs.id}:q${qi}`;
      out.case_questions.push({ id: qid, case_id: cs.id, q: q.q, a: q.a, level: q.level, position: qi });
      link("case_question_sources", "question_id", qid, q.sources, out);
    });
    cs.events.forEach((e, ei) => {
      const eid = `${cs.id}:${e.id}`;
      out.events.push(eventRow(e, tid, cs.id, eid, ei));
      link("event_sources", "event_id", eid, e.sources, out);
    });
  });
  t.travels.influences.forEach((inf, i) => {
    const id = `${tid}:inf:${i}`;
    out.influences.push({ id, tradition_id: tid, title: inf.title, body: inf.body, level: inf.level, position: i });
    link("influence_sources", "influence_id", id, inf.sources, out);
  });
  t.makers.materials.forEach((m, i) => {
    const id = `${tid}:mat:${i}`;
    out.materials.push({ id, tradition_id: tid, name: m.name, detail: m.detail, level: m.level, position: i });
    link("material_sources", "material_id", id, m.sources, out);
  });
  t.makers.process.forEach((s, i) => {
    const id = `${tid}:step:${i}`;
    out.process_steps.push({ id, tradition_id: tid, title: s.title, detail: s.detail, level: s.level, position: i });
    link("process_step_sources", "step_id", id, s.sources, out);
  });
  t.makers.practitioners.forEach((p, i) => {
    const id = `${tid}:pr:${i}`;
    out.practitioners.push({ id, tradition_id: tid, name: p.name, note: p.note, position: i });
    link("practitioner_sources", "practitioner_id", id, p.sources, out);
  });
  t.keepAlive.organizations.forEach((organization_id, position) => out.tradition_organizations.push({ tradition_id: tid, organization_id, position }));
  t.keepAlive.resources.forEach((r, i) =>
    out.resources.push({ id: `${tid}:res:${i}`, tradition_id: tid, title: r.title, url: r.url, note: r.note, source_id: n(r.source), position: i }),
  );
  t.related.forEach((r, position) => out.related_traditions.push({ tradition_id: tid, related_id: slugToId(r.slug), reason: r.reason, position }));
  return out;
}

function countryToRow(c: CountryRecord): Row {
  return {
    iso2: c.iso2,
    iso_numeric: c.isoNumeric,
    slug: c.slug,
    name: c.name,
    status: c.status,
    plate: c.plate,
    headline: c.headline,
    intro: c.intro,
    candidates: c.candidates,
    shared_traditions: c.sharedTraditions ?? [],
    centroid_lon: c.centroid[0],
    centroid_lat: c.centroid[1],
  };
}

export function archiveToRows(a: Omit<Archive, "backend">): Rows {
  const out = emptyRows([...GLOBAL_TABLES, "traditions", ...TRADITION_CHILD_TABLES, ...LATE_TABLES]);
  const bySlug = new Map(a.traditions.map((t) => [t.slug, t.id]));
  const slugToId = (s: string) => bySlug.get(s) ?? s;
  out.sources = a.sources.map(sourceToRow);
  out.countries = a.countries.map(countryToRow);
  out.places = a.places.map((p) => ({ id: p.id, name: p.name, kind: p.kind, lat: p.lat, lon: p.lon, country_iso2: p.country, note: n(p.note) }));
  a.communities.forEach((c) => {
    out.communities.push({ id: c.id, name: c.name, description: c.description });
    link("community_sources", "community_id", c.id, c.sources ?? [], out);
  });
  a.organizations.forEach((o: Organization) => {
    out.organizations.push({ id: o.id, name: o.name, kind: o.kind, role: o.role, url: n(o.url), place_id: n(o.placeId), verified: o.verified });
    link("organization_sources", "organization_id", o.id, o.sources, out);
  });
  out.media_assets = a.media.map(mediaToRow);
  for (const t of a.traditions) {
    const rows = traditionToRows(t, slugToId);
    for (const [table, list] of Object.entries(rows)) out[table].push(...list);
  }
  a.relationships.forEach((r: Relationship) => {
    out.relationships.push({
      id: r.id,
      tradition_id: slugToId(r.tradition),
      from_place: r.from,
      to_place: r.to,
      kind: r.kind,
      title: r.title,
      description: r.description,
      level: r.level,
      year: n(r.year),
    });
    link("relationship_sources", "relationship_id", r.id, r.sources, out);
  });
  a.trails.forEach((tr: Trail, position) => {
    out.trails.push({ slug: tr.slug, title: tr.title, kicker: tr.kicker, intro: tr.intro, accent: tr.accent, position });
    tr.steps.forEach((s, i) => out.trail_steps.push({ trail_slug: tr.slug, tradition_id: slugToId(s.tradition), note: s.note, position: i }));
  });
  return out;
}

// ───────────────────────────── rows → archive ─────────────────────────────

const byPos = (a: Row, b: Row) => Number(a.position ?? 0) - Number(b.position ?? 0);
const s = (v: unknown) => (v === null || v === undefined ? undefined : String(v));
function group(rows: Row[] | undefined, key: string): Map<string, Row[]> {
  const m = new Map<string, Row[]>();
  for (const r of [...(rows ?? [])].sort(byPos)) {
    const k = String(r[key]);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(r);
  }
  return m;
}
const ids = (m: Map<string, Row[]>, k: string) => (m.get(k) ?? []).map((r) => String(r.source_id));
function opt<T extends object>(obj: T): T {
  for (const k of Object.keys(obj) as (keyof T)[]) if (obj[k] === undefined) delete obj[k];
  return obj;
}

function rowToEvent(r: Row, sources: Map<string, Row[]>, stripPrefix?: string): TimelineEvent {
  const id = String(r.id);
  return opt({
    id: stripPrefix && id.startsWith(stripPrefix) ? id.slice(stripPrefix.length) : id,
    date: opt({
      year: Number(r.year),
      month: r.month === null || r.month === undefined ? undefined : Number(r.month),
      day: r.day === null || r.day === undefined ? undefined : Number(r.day),
      approx: r.approx ? true : undefined,
      label: String(r.date_label),
    }),
    title: String(r.title),
    body: String(r.body),
    level: r.level as TimelineEvent["level"],
    sources: ids(sources, id),
    place: s(r.place_id),
    tag: s(r.tag) as TimelineEvent["tag"],
    media: s(r.media_id),
  });
}

export function rowsToArchive(rows: Rows): Omit<Archive, "backend"> {
  const R = (t: string) => rows[t] ?? [];
  const idToSlug = new Map(R("traditions").map((t) => [String(t.id), String(t.slug)]));

  const sources: Source[] = R("sources").map((r) =>
    opt({
      id: String(r.id),
      title: String(r.title),
      publisher: String(r.publisher),
      author: s(r.author),
      date: s(r.date),
      url: String(r.url),
      type: r.type as Source["type"],
      accessed: String(r.accessed).slice(0, 10),
      notes: s(r.notes),
    }),
  );
  const media: MediaAsset[] = R("media_assets").map((r) =>
    opt({
      id: String(r.id),
      commonsFile: s(r.commons_file),
      commonsHash: s(r.commons_hash),
      url: s(r.url),
      width: Number(r.width),
      height: Number(r.height),
      alt: String(r.alt),
      caption: String(r.caption),
      credit: String(r.credit),
      license: String(r.license),
      licenseUrl: s(r.license_url),
      sourcePage: String(r.source_page),
      kind: r.kind as MediaAsset["kind"],
      documentary: Boolean(r.documentary),
    }),
  );
  const comSrc = group(R("community_sources"), "community_id");
  const orgSrc = group(R("organization_sources"), "organization_id");

  const g = {
    names: group(R("tradition_names"), "tradition_id"),
    hist: group(R("tradition_slug_history"), "tradition_id"),
    countries: group(R("tradition_countries"), "tradition_id"),
    places: group(R("tradition_places"), "tradition_id"),
    comms: group(R("tradition_communities"), "tradition_id"),
    sections: group(R("tradition_sections"), "tradition_id"),
    translations: group(R("tradition_translations"), "tradition_id"),
    claims: group(R("claims"), "tradition_id"),
    claimSrc: group(R("claim_sources"), "claim_id"),
    events: group(R("events").filter((e) => e.case_id === null || e.case_id === undefined), "tradition_id"),
    caseEvents: group(R("events").filter((e) => e.case_id !== null && e.case_id !== undefined), "case_id"),
    eventSrc: group(R("event_sources"), "event_id"),
    cases: group(R("case_studies"), "tradition_id"),
    caseSrc: group(R("case_sources"), "case_id"),
    questions: group(R("case_questions"), "case_id"),
    questionSrc: group(R("case_question_sources"), "question_id"),
    influences: group(R("influences"), "tradition_id"),
    influenceSrc: group(R("influence_sources"), "influence_id"),
    materials: group(R("materials"), "tradition_id"),
    materialSrc: group(R("material_sources"), "material_id"),
    steps: group(R("process_steps"), "tradition_id"),
    stepSrc: group(R("process_step_sources"), "step_id"),
    practitioners: group(R("practitioners"), "tradition_id"),
    practitionerSrc: group(R("practitioner_sources"), "practitioner_id"),
    orgs: group(R("tradition_organizations"), "tradition_id"),
    resources: group(R("resources"), "tradition_id"),
    related: group(R("related_traditions"), "tradition_id"),
  };

  const traditions: Tradition[] = [...R("traditions")]
    .sort((a, b) => String(a.passport_no).localeCompare(String(b.passport_no)))
    .map((r) => {
      const id = String(r.id);
      const section = (chapter: string) =>
        ((g.sections.get(id) ?? []).find((x) => x.chapter === chapter && x.locale === "en")?.blocks as TextBlock[]) ?? [];
      const names = g.names.get(id) ?? [];
      const translations = Object.fromEntries(
        (g.translations.get(id) ?? []).map((tr) => [
          String(tr.locale),
          opt({ name: s(tr.name), tagline: s(tr.tagline), summary: s(tr.summary), reviewed: Boolean(tr.reviewed) }),
        ]),
      );
      const t: Tradition = opt({
        id,
        slug: String(r.slug),
        slugHistory: (g.hist.get(id) ?? []).map((h) => String(h.old_slug)),
        passportNo: String(r.passport_no),
        status: r.status as Tradition["status"],
        maturity: r.maturity as Tradition["maturity"],
        name: String(r.name),
        displayTitle: String(r.display_title),
        tagline: String(r.tagline),
        nativeNames: names
          .filter((x) => x.kind === "native")
          .map((x) => opt({ text: String(x.name), script: String(x.script), lang: String(x.lang), note: s(x.note) })),
        alternateNames: names.filter((x) => x.kind === "alternate").map((x) => String(x.name)),
        category: r.category as Tradition["category"],
        techniques: (r.techniques as string[]) ?? [],
        countries: (g.countries.get(id) ?? []).map((x) => String(x.country_iso2)),
        regionLabel: String(r.region_label ?? ""),
        collection: String(r.collection_iso2),
        places: (g.places.get(id) ?? []).map((x) =>
          opt({ place: String(x.place_id), role: x.role as Tradition["places"][number]["role"], note: s(x.note) }),
        ),
        communities: (g.comms.get(id) ?? []).map((x) => ({ community: String(x.community_id), role: String(x.role) })),
        summary: String(r.summary),
        intro: String(r.intro),
        accent: r.accent as Tradition["accent"],
        motif: r.motif as Tradition["motif"],
        hero: s(r.hero_media_id),
        gallery: (r.gallery as string[]) ?? [],
        periods: (r.periods as string[]) ?? [],
        origins: section("origins"),
        significance: section("significance"),
        makers: {
          intro: section("makers"),
          materials: (g.materials.get(id) ?? []).map((x) => ({
            name: String(x.name),
            detail: String(x.detail),
            level: x.level as Tradition["claims"][number]["level"],
            sources: ids(g.materialSrc, String(x.id)),
          })),
          process: (g.steps.get(id) ?? []).map((x) => ({
            title: String(x.title),
            detail: String(x.detail),
            level: x.level as Tradition["claims"][number]["level"],
            sources: ids(g.stepSrc, String(x.id)),
          })),
          practitioners: (g.practitioners.get(id) ?? []).map((x) => ({
            name: String(x.name),
            note: String(x.note),
            sources: ids(g.practitionerSrc, String(x.id)),
          })),
          voicesNote: String(r.voices_note ?? ""),
        },
        timeline: (g.events.get(id) ?? []).map((e) => rowToEvent(e, g.eventSrc)),
        travels: {
          intro: section("travels"),
          influences: (g.influences.get(id) ?? []).map((x) => ({
            title: String(x.title),
            body: String(x.body),
            level: x.level as Tradition["claims"][number]["level"],
            sources: ids(g.influenceSrc, String(x.id)),
          })),
          cases: (g.cases.get(id) ?? []).map((c) => {
            const cid = String(c.id);
            const legal = (g.caseSrc.get(cid) ?? []).filter((x) => x.purpose === "legal").map((x) => String(x.source_id));
            return opt({
              id: cid,
              slug: String(c.slug),
              code: String(c.code),
              title: String(c.title),
              kind: c.kind as CaseStudy["kind"],
              parties: (c.parties as string[]) ?? [],
              summary: String(c.summary),
              status: String(c.status),
              events: (g.caseEvents.get(cid) ?? []).map((e) => rowToEvent(e, g.eventSrc, `${cid}:`)),
              questions: (g.questions.get(cid) ?? []).map((q) => ({
                q: String(q.q),
                a: String(q.a),
                level: q.level as CaseStudy["questions"][number]["level"],
                sources: ids(g.questionSrc, String(q.id)),
              })),
              travelled: (c.travelled as string[]) ?? [],
              leftBehind: (c.left_behind as string[]) ?? [],
              legalNote: c.legal_note ? { text: String(c.legal_note), sources: legal } : undefined,
              comparison: (c.comparison as CaseStudy["comparison"]) ?? undefined,
              openQuestions: (c.open_questions as string[]) ?? [],
            });
          }),
        },
        claims: (g.claims.get(id) ?? []).map((c) =>
          opt({
            id: String(c.id),
            text: String(c.text),
            level: c.level as Claim["level"],
            sources: ids(g.claimSrc, String(c.id)),
            note: s(c.note),
          }),
        ),
        keepAlive: {
          organizations: (g.orgs.get(id) ?? []).map((x) => String(x.organization_id)),
          resources: (g.resources.get(id) ?? []).map((x) =>
            opt({ title: String(x.title), url: String(x.url), note: String(x.note), source: s(x.source_id) }),
          ),
          collaborationNotes: (r.collaboration_notes as string[]) ?? [],
        },
        related: (g.related.get(id) ?? []).map((x) => ({ slug: idToSlug.get(String(x.related_id)) ?? String(x.related_id), reason: String(x.reason) })),
        editorial: r.editorial as Tradition["editorial"],
        translations: Object.keys(translations).length ? (translations as Tradition["translations"]) : undefined,
      });
      if (!t.slugHistory?.length) delete t.slugHistory;
      return t;
    });

  const relSrc = group(R("relationship_sources"), "relationship_id");
  const steps = group(R("trail_steps"), "trail_slug");

  return {
    traditions,
    sources,
    places: R("places").map((p) =>
      opt({
        id: String(p.id),
        name: String(p.name),
        kind: p.kind as Archive["places"][number]["kind"],
        lat: Number(p.lat),
        lon: Number(p.lon),
        country: String(p.country_iso2),
        note: s(p.note),
      }),
    ),
    communities: R("communities").map((c) => {
      const srcs = ids(comSrc, String(c.id));
      return opt({ id: String(c.id), name: String(c.name), description: String(c.description), sources: srcs.length ? srcs : undefined });
    }),
    organizations: R("organizations").map((o) =>
      opt({
        id: String(o.id),
        name: String(o.name),
        kind: o.kind as Organization["kind"],
        role: String(o.role),
        url: s(o.url),
        placeId: s(o.place_id),
        verified: Boolean(o.verified),
        sources: ids(orgSrc, String(o.id)),
      }),
    ),
    media,
    countries: R("countries").map((c) => {
      const shared = (c.shared_traditions as string[]) ?? [];
      return opt({
        iso2: String(c.iso2),
        isoNumeric: String(c.iso_numeric),
        slug: String(c.slug),
        name: String(c.name),
        status: c.status as CountryRecord["status"],
        plate: String(c.plate),
        headline: String(c.headline),
        intro: String(c.intro),
        candidates: (c.candidates as CountryRecord["candidates"]) ?? [],
        sharedTraditions: shared.length ? shared : undefined,
        centroid: [Number(c.centroid_lon), Number(c.centroid_lat)] as [number, number],
      });
    }),
    relationships: R("relationships").map((r) =>
      opt({
        id: String(r.id),
        tradition: idToSlug.get(String(r.tradition_id)) ?? String(r.tradition_id),
        from: String(r.from_place),
        to: String(r.to_place),
        kind: r.kind as Relationship["kind"],
        title: String(r.title),
        description: String(r.description),
        level: r.level as Relationship["level"],
        sources: ids(relSrc, String(r.id)),
        year: s(r.year),
      }),
    ),
    trails: [...R("trails")].sort(byPos).map((tr) => ({
      slug: String(tr.slug),
      title: String(tr.title),
      kicker: String(tr.kicker),
      intro: String(tr.intro),
      accent: tr.accent as Trail["accent"],
      steps: (steps.get(String(tr.slug)) ?? []).map((st) => ({
        tradition: idToSlug.get(String(st.tradition_id)) ?? String(st.tradition_id),
        note: String(st.note),
      })),
    })),
  };
}
