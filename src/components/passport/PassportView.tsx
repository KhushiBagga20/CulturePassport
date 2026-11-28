import Link from "next/link";
import { Suspense } from "react";
import type { Archive, Tradition } from "@/lib/types";
import { citedSources, isPublic, lookups } from "@/lib/data/archive";
import { ACCENT, CATEGORY, MATURITY, RELATIONSHIP, SOURCE_TYPE, accentVars, formatSourceDate } from "@/lib/labels";
import { ArchiveImage } from "@/components/site/ArchiveImage";
import { CountryMark } from "@/components/site/Seal";
import { countryShape } from "@/lib/geo-server";
import { EvidenceBadge, SourceMarks } from "@/components/site/Evidence";
import { Motif } from "@/components/motifs/Motif";
import { Blocks, ChapterHeading, type BlockContext } from "./Blocks";
import { ChapterBar } from "./ChapterBar";
import { Timeline, type TimelineItem } from "./Timeline";
import { CaseFile } from "./CaseFile";
import { SourcesReferences, type NumberedSource } from "./SourcesReferences";
import { SourceDrawer, type DrawerSource } from "./SourceDrawer";
import { QrPanel } from "./SharePanel";
import { CorrectionForm } from "./CorrectionForm";
import { PlacesMap } from "./PlacesMap";
import { ProcessFlow } from "./ProcessFlow";
import { ConnectionWeb, type WebNode } from "./ConnectionWeb";
import { More } from "./More";
import { TrailBar } from "./TrailBar";

/** Chapter names, used identically in the chapter bar and the headings. Ids are stable deep links. */
export const CHAPTERS = [
  { id: "origins", n: "01", label: "Where It Began" },
  { id: "makers", n: "02", label: "The People Behind It" },
  { id: "through-time", n: "03", label: "A Journey Through Time" },
  { id: "travels", n: "04", label: "Across Borders" },
  { id: "evidence", n: "05", label: "Sources & References" },
  { id: "keep-alive", n: "06", label: "Meet the Makers" },
];

const WRAP = "mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10";

export async function PassportView({ t, archive, preview = false }: { t: Tradition; archive: Archive; preview?: boolean }) {
  const L = lookups(archive);
  const accent = ACCENT[t.accent];
  const order = citedSources(t);
  const extra = [
    ...t.communities.flatMap((c) => L.community.get(c.community)?.sources ?? []),
    ...t.keepAlive.organizations.flatMap((o) => L.organization.get(o)?.sources ?? []),
  ];
  for (const id of extra) if (!order.includes(id)) order.push(id);
  const numbering = new Map(order.map((id, i) => [id, i + 1]));
  // Research passports state each claim once, as a paragraph: no separate claims list or badges.
  const originClaims = new Set(t.origins.flatMap((b) => (b.type === "p" ? (b.claims ?? []) : [])));
  const compact = t.maturity === "editorial-draft" && t.claims.length > 0 && t.claims.every((c) => originClaims.has(c.id) && c.level === "unverified");
  const ctx: BlockContext = { claims: new Map(t.claims.map((c) => [c.id, c])), numbering, media: L.media, motif: t.motif, anchors: compact };
  const hero = t.hero ? L.media.get(t.hero) : undefined;
  // Gallery pictures that are not already shown in the chapters.
  const shownElsewhere = JSON.stringify({ ...t, gallery: [] });
  const pictures = t.gallery
    .filter((id) => id !== t.hero && !shownElsewhere.includes(`"${id}"`))
    .map((id) => L.media.get(id))
    .filter((m): m is NonNullable<typeof m> => !!m);
  const communities = t.communities.map((c) => L.community.get(c.community)).filter((c): c is NonNullable<typeof c> => !!c);
  const country = L.country.get(t.collection);
  // The passport's identity mark: its country (and any country it is shared with) instead of a number.
  const isoOrder = [t.collection, ...t.countries.filter((c) => c !== t.collection)];
  const shape = await countryShape(isoOrder.map((iso) => L.country.get(iso)?.isoNumeric).filter((x): x is string => !!x));
  const countryNames = isoOrder.map((iso) => L.country.get(iso)?.name ?? iso).map((n) => (n === "United Arab Emirates" ? "UAE" : n)).join(" · ");

  // Which claims/events/answers each source supports, for the source library.
  const supports = new Map<string, string[]>();
  const add = (ids: string[], label: string) => ids.forEach((id) => supports.set(id, [...(supports.get(id) ?? []), label]));
  t.claims.forEach((c) => add(c.sources, `claim #${c.id}`));
  t.timeline.forEach((e) => add(e.sources, `timeline: ${e.date.label}`));
  t.travels.cases.forEach((c) => {
    c.events.forEach((e) => add(e.sources, `case ${c.code}: ${e.title}`));
    c.questions.forEach((q, i) => add(q.sources, `case ${c.code} Q${i + 1}`));
    if (c.legalNote) add(c.legalNote.sources, `case ${c.code}: legal note`);
  });
  t.makers.materials.forEach((m) => add(m.sources, `material: ${m.name}`));
  t.makers.process.forEach((p) => add(p.sources, `process: ${p.title}`));
  t.makers.practitioners.forEach((p) => add(p.sources, `maker: ${p.name}`));
  t.travels.influences.forEach((i) => add(i.sources, `travels: ${i.title}`));
  t.communities.forEach((c) => add(L.community.get(c.community)?.sources ?? [], `community: ${L.community.get(c.community)?.name}`));
  t.keepAlive.organizations.forEach((o) => add(L.organization.get(o)?.sources ?? [], `organisation: ${L.organization.get(o)?.name}`));
  const numbered: NumberedSource[] = order
    .map((id) => L.source.get(id))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((s) => ({ ...s, n: numbering.get(s.id)!, supports: compact ? [] : Array.from(new Set(supports.get(s.id) ?? [])) }));
  const drawer: DrawerSource[] = numbered.map((s) => ({
    id: s.id,
    n: s.n,
    title: s.title,
    publisher: s.publisher,
    author: s.author,
    date: formatSourceDate(s.date),
    type: SOURCE_TYPE[s.type],
    url: s.url,
    accessed: formatSourceDate(s.accessed),
    notes: s.notes,
    supports: s.supports,
  }));

  const timeline: TimelineItem[] = [...t.timeline]
    .sort((a, b) => a.date.year - b.date.year || (a.date.month ?? 0) - (b.date.month ?? 0) || (a.date.day ?? 0) - (b.date.day ?? 0))
    .map((e) => ({
      id: e.id,
      year: e.date.year,
      label: e.date.label,
      approx: !!e.date.approx,
      title: e.title,
      body: e.body,
      level: e.level,
      place: e.place ? L.place.get(e.place)?.name : undefined,
      tag: e.tag,
      media: e.media ? L.media.get(e.media) : undefined,
      sources: e.sources.map((id) => ({ n: numbering.get(id) ?? 0, id, title: L.source.get(id)?.title ?? id })),
    }));

  // Connections: related passports (editorial links) and this tradition's documented routes.
  const web: WebNode[] = [
    ...t.related.flatMap((r): WebNode[] => {
      const o = L.tradition.get(r.slug);
      if (!o || !isPublic(o)) return [];
      return [
        {
          id: `p-${o.slug}`,
          type: "passport",
          label: o.name,
          sub: `Passport · ${o.regionLabel}`,
          description: r.reason,
          color: ACCENT[o.accent].hex,
          href: `/passport/${o.slug}`,
          sources: [],
        },
      ];
    }),
    ...archive.relationships
      .filter((r) => r.tradition === t.slug)
      .map(
        (r): WebNode => ({
          id: r.id,
          type: "route",
          label: r.title,
          sub: RELATIONSHIP[r.kind].label,
          description: `${L.place.get(r.from)?.name ?? r.from} → ${L.place.get(r.to)?.name ?? r.to}. ${r.description}`,
          color: "#1B1616",
          kind: r.kind,
          level: r.level,
          year: r.year,
          sources: r.sources.flatMap((id) => {
            const s = L.source.get(id);
            return s ? [{ id, title: s.title, url: s.url, publisher: s.publisher, n: numbering.get(id) }] : [];
          }),
        }),
      ),
  ];

  const published = archive.traditions.filter(isPublic);
  const idx = published.findIndex((x) => x.slug === t.slug);
  const prev = idx > 0 ? published[idx - 1] : published[published.length - 1];
  const next = idx >= 0 && idx < published.length - 1 ? published[idx + 1] : published[0];
  const trails = archive.trails
    .filter((tr) => tr.steps.some((s) => s.tradition === t.slug))
    .map((tr) => ({
      slug: tr.slug,
      title: tr.title,
      steps: tr.steps.map((s) => ({ slug: s.tradition, name: L.tradition.get(s.tradition)?.name ?? s.tradition })),
    }));
  // Chapters with nothing recorded yet are left out (research passports start short), and the
  // remaining ones are numbered in order.
  const hasMakers = t.makers.intro.length > 0 || t.makers.practitioners.length > 0 || t.makers.materials.length > 0 || t.makers.process.length > 0;
  const hasTravels = t.travels.intro.length > 0 || t.travels.influences.length > 0 || t.travels.cases.length > 0 || web.length > 0;
  const hasPlaces = t.places.length > 0 || communities.length > 0;
  const hasKeepAlive = t.keepAlive.organizations.length > 0;
  const present: Record<string, boolean> = { origins: true, makers: hasMakers, "through-time": timeline.length > 0, travels: hasTravels, evidence: true, "keep-alive": hasKeepAlive };
  const chapters = CHAPTERS.filter((c) => present[c.id]).map((c, i) => ({ ...c, n: String(i + 1).padStart(2, "0") }));
  const ch = (id: string) => chapters.find((c) => c.id === id)!;
  const back = country ? { href: `/country/${country.slug}`, label: `${country.name === "United Arab Emirates" ? "UAE" : country.name} collection` } : undefined;

  return (
    <div style={accentVars(t.accent)}>
      <Suspense fallback={null}>
        <TrailBar trails={trails} current={t.slug} />
      </Suspense>
      {preview && (
        <div className="bg-yellow px-4 py-2 text-center text-sm text-ink">
          <strong>Editor preview</strong> — status: {t.status}. This page is not visible to the public until it is published.
        </div>
      )}

      {/* ─────────── Hero ─────────── */}
      <section className="relative overflow-hidden bg-cream">
        <div className={`${WRAP} relative flex flex-wrap items-center justify-between gap-3 pt-5`}>
          <nav aria-label="Breadcrumb" className="label-sm flex flex-wrap items-center gap-2 text-ink-mute">
            <Link href="/" className="hover:text-brick">
              Explore
            </Link>
            <span aria-hidden>/</span>
            {country && (
              <>
                <Link href={`/country/${country.slug}`} className="hover:text-brick">
                  {country.name}
                </Link>
                <span aria-hidden>/</span>
              </>
            )}
            <span aria-current="page" className="text-ink">
              {t.name}
            </span>
          </nav>
        </div>

        <div className={`${WRAP} relative grid gap-x-12 gap-y-10 pb-16 pt-8 lg:grid-cols-12 lg:pb-20`}>
          <div className="relative lg:col-span-7 lg:row-start-1">
            {shape && (
              <CountryMark
                shape={shape}
                id={`hero-${t.slug}`}
                className="pointer-events-none absolute -top-4 right-0 h-48 w-48 text-[var(--accent)] opacity-[0.16] sm:h-64 sm:w-64 lg:-right-6"
              />
            )}
            <h1 className="font-display reveal-rise relative mt-2 text-[clamp(2.65rem,8.19vw,7.3rem)] hyphens-auto [overflow-wrap:anywhere]">{t.displayTitle}</h1>
            <p className="font-title relative mt-3 text-[clamp(1.7rem,3.4vw,2.8rem)] italic text-[var(--accent-text)]">{t.tagline}</p>
          </div>

          {/* On phones the photograph sits between the title and the introduction. */}
          <div className="relative lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
            <div className="relative mb-3 mr-3">
              <span aria-hidden className="absolute -bottom-3 -right-3 left-3 top-3 bg-[var(--accent)]" />
              {hero ? (
                <ArchiveImage
                  media={hero}
                  fallbackMotif={t.motif}
                  priority
                  width={1280}
                  sizes="(min-width:1024px) 40vw, 100vw"
                  className="relative aspect-[4/3] w-full border-2 border-ink sm:aspect-[4/5]"
                />
              ) : (
                <Motif motif={t.motif} className="relative aspect-[4/3] w-full border-2 border-ink sm:aspect-[4/5]" />
              )}
            </div>
            {hero && <p className="mt-3 max-w-md text-sm text-ink-mute">{hero.caption}</p>}
          </div>

          <div className="lg:col-span-7 lg:row-start-2">
            {t.intro && <p className="lead max-w-2xl text-ink-soft">{t.intro}</p>}
            {t.nativeNames.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 border-t-2 border-ink pt-4">
                {t.nativeNames.map((n) => (
                  <div key={n.text} lang={n.lang.startsWith("Marathi") ? "mr" : undefined}>
                    <p className="text-3xl leading-none">{n.text}</p>
                    <p className="label-sm mt-1.5 text-ink-mute">
                      {n.lang} · {n.script}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#origins" className="btn btn-ink">
                Start the story ↓
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────── At a glance ─────────── */}
      <section aria-label="At a glance" className="border-b-2 border-ink bg-cream">
        <dl className={`${WRAP} grid gap-3 py-8 ${t.alternateNames.length ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {[
            ["Category", CATEGORY[t.category], t.techniques.slice(0, 3).join(" · "), "bg-orange text-ink"],
            ["Where", t.regionLabel, "", "bg-plum text-bone"],
            ...(t.alternateNames.length ? [["Also known as", t.alternateNames.join(" · "), "", "border-2 border-ink bg-bone text-ink"]] : []),
          ].map(([k, v, sub, cls]) => (
            <div key={k} className={`relative flex min-w-0 flex-col p-5 sm:min-h-36 ${cls}`}>
              <dt className="label opacity-80">{k}</dt>
              <dd className="font-title mt-2 text-[1.6rem] leading-[1.05] [overflow-wrap:anywhere]">{v}</dd>
              {sub && <dd className="label-sm mt-auto pt-3 opacity-80">{sub}</dd>}
            </div>
          ))}
        </dl>
      </section>

      {t.maturity !== "researched" && (
        <div className="border-b-2 border-ink bg-yellow">
          <p className={`${WRAP} py-3 text-sm`}>
            {compact ? (
              <>
                <strong className="label mr-2">Research passport.</strong>
                {t.editorial.notes}
              </>
            ) : (
              <>
                <strong className="label mr-2">{MATURITY[t.maturity].label}.</strong>
                {MATURITY[t.maturity].description} {t.editorial.notes}
              </>
            )}
          </p>
        </div>
      )}

      {!compact && <ChapterBar chapters={chapters} shape={shape} place={countryNames} back={back} />}

      {/* ─────────── 01 Where It Began ─────────── */}
      <section aria-labelledby="h-origins" id="origins" className={`bg-cream outline-none ${compact ? "py-14 lg:py-20" : "py-20 lg:py-28"}`}>
        <div className={WRAP}>
          {compact ? (
            <h2 id="h-origins" className="label text-ink-mute">
              What the records say
            </h2>
          ) : (
            <ChapterHeading n={ch("origins").n} id="h-origins" title={ch("origins").label} kicker="Places, communities, first records" />
          )}
          <div className={`grid gap-12 lg:grid-cols-12 ${compact ? "mt-4" : ""}`}>
            <div className={`order-2 lg:order-1 ${hasPlaces ? "lg:col-span-6" : "lg:col-span-8"}`}>
              <Blocks blocks={t.origins} ctx={ctx} large progressive={!compact} />
            </div>
            {hasPlaces && (
            <div className="order-1 lg:order-2 lg:col-span-6">
              <div className="lg:sticky lg:top-32">
                <PlacesMap t={t} archive={archive} />
                {communities.length > 0 && (
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {communities.map((c) => (
                      <li key={c.id} className="border-2 border-ink bg-bone p-4">
                        <p className="label-sm text-ink-mute">Community</p>
                        <p className="font-title mt-1 text-2xl leading-none">{c.name}</p>
                        <p className="mt-2 text-sm text-ink-soft">
                          {c.description}
                          {c.sources && <SourceMarks ids={c.sources} numbering={numbering} />}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
      </section>

      {t.significance.length > 0 && (
        <section aria-label="Why it matters" className="border-y-2 border-ink bg-orange py-16 text-ink lg:py-20">
          <div className={`${WRAP} grid gap-8 lg:grid-cols-12`}>
            <div className="lg:col-span-4">
              <p className="label">Why it matters</p>
              <p className="font-display mt-3 text-[clamp(2.03rem,3.9vw,3.34rem)]">Meaning &amp; significance</p>
            </div>
            <div className="lg:col-span-8">
              <Blocks blocks={t.significance} ctx={ctx} />
            </div>
          </div>
        </section>
      )}

      {pictures.length > 0 && (
        <section aria-labelledby="h-pictures" id="pictures" className="border-t-2 border-ink bg-bone py-16 lg:py-24">
          <div className={WRAP}>
            <p className="label text-ink-mute">In pictures</p>
            <h2 id="h-pictures" className="font-display mt-2 text-[clamp(2.03rem,3.9vw,3.34rem)]">
              {t.name}, seen up close
            </h2>
            <ul className="mt-8 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {pictures.map((m) => (
                <li key={m.id} className="min-w-0">
                  <ArchiveImage media={m} fallbackMotif={t.motif} width={500} sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 100vw" className="aspect-[4/3] w-full border-2 border-ink" />
                  <p className="mt-2 line-clamp-3 text-sm text-ink-soft [overflow-wrap:anywhere]">{m.caption}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ─────────── The People Behind It ─────────── */}
      {hasMakers && (
      <section aria-labelledby="h-makers" id="makers" className="bg-cream pt-20 outline-none lg:pt-28">
        <div className={WRAP}>
          <ChapterHeading n={ch("makers").n} id="h-makers" title={ch("makers").label} kicker="Made by people, not by an aesthetic" />
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <Blocks blocks={t.makers.intro} ctx={ctx} large progressive />
              <aside className="mt-8 border-l-4 border-[var(--accent)] pl-4">
                <p className="label text-[var(--accent-text)]">Voices</p>
                <p className="mt-1 text-sm text-ink-soft">{t.makers.voicesNote}</p>
              </aside>
            </div>
            <div className="lg:col-span-6">
              <p className="label text-ink-mute">Makers on record</p>
              {t.makers.practitioners.length ? (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {t.makers.practitioners.map((p, i) => (
                    <li key={p.name} className={`notched px-6 py-4 ${["bg-yellow", "bg-bone", "bg-sand"][i % 3]} text-ink`}>
                      <p className="font-title text-2xl leading-none">{p.name}</p>
                      <p className="mt-1.5 text-sm text-ink-soft">
                        {p.note}
                        <SourceMarks ids={p.sources} numbering={numbering} />
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 border-2 border-dashed border-ink/40 p-5 text-ink-soft">
                  No individual makers are named in this passport&rsquo;s public record yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {(t.makers.materials.length > 0 || t.makers.process.length > 0) && (
        <div className="mt-16 border-y-2 border-ink bg-plum py-14 text-bone lg:mt-20">
          <div className={WRAP}>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="label text-yellow">How it is made</p>
                <p className="font-display mt-2 text-[clamp(1.87rem,3.9vw,3.19rem)]">From material to object</p>
              </div>
              <p className="max-w-sm text-sm text-bone/80">
                Steps are listed only as far as sources describe them. Striped steps still await review by makers themselves.
              </p>
            </div>
            <ProcessFlow
              materials={t.makers.materials}
              steps={t.makers.process}
              numbering={numbering}
              finished={hero}
              finishedLabel={t.name}
              motif={t.motif}
            />
          </div>
        </div>
        )}
      </section>
      )}

      {/* ─────────── A Journey Through Time ─────────── */}
      {timeline.length > 0 && (
      <section aria-labelledby="h-time" id="through-time" className="border-b-2 border-ink bg-orange py-20 text-ink outline-none lg:py-28">
        <div className={WRAP}>
          <ChapterHeading
            n={ch("through-time").n}
            id="h-time"
            title={ch("through-time").label}
            kicker="Milestones, with their certainty"
            intro="Dates appear exactly as the evidence allows: precise where a record exists, approximate where it doesn't, and dashed where a claim is disputed or unverified."
            tone="accent"
          />
          <Timeline items={timeline} motif={t.motif} />
        </div>
      </section>
      )}

      {/* ─────────── Across Borders ─────────── */}
      {hasTravels && (
      <section aria-labelledby="h-travels" id="travels" className="bg-cream py-20 outline-none lg:py-28">
        <div className={WRAP}>
          <ChapterHeading n={ch("travels").n} id="h-travels" title={ch("travels").label} kicker="Influence, adaptation, attribution" />
          {(t.travels.intro.length > 0 || t.travels.influences.length > 0) && (
          <div className="grid gap-12 lg:grid-cols-12">
            {t.travels.intro.length > 0 && (
            <div className="lg:col-span-6">
              <Blocks blocks={t.travels.intro} ctx={ctx} large progressive />
            </div>
            )}
            {t.travels.influences.length > 0 && (
            <div className="lg:col-span-6">
              <p className="label text-ink-mute">Documented journeys</p>
              <ol className="mt-3 grid gap-3">
                {t.travels.influences.map((inf, i) => (
                  <li key={inf.title} className="grid grid-cols-[auto_1fr] gap-4 border-2 border-ink bg-bone p-4">
                    <span className="font-display text-4xl leading-[0.8] text-[var(--accent-text)]">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-title text-2xl leading-tight">{inf.title}</p>
                        <EvidenceBadge level={inf.level} compact />
                      </div>
                      <p className="mt-1 text-sm text-ink-soft">
                        {inf.body}
                        <SourceMarks ids={inf.sources} numbering={numbering} />
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            )}
          </div>
          )}

          {web.length > 0 && (
            <div className="mt-16">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="label text-[var(--accent-text)]">Connections</p>
                  <p className="font-display mt-2 text-[clamp(1.87rem,3.9vw,3.19rem)]">Who and where it touches</p>
                </div>
                <Link href={`/routes?tradition=${t.slug}`} className="btn btn-cream">
                  Open on the Roots &amp; Routes map →
                </Link>
              </div>
              <ConnectionWeb center={{ name: t.name, color: accent.hex }} nodes={web} />
            </div>
          )}

          {t.travels.cases.map((c) => (
            <CaseFile key={c.id} c={c} numbering={numbering} media={L.media} motif={t.motif} traditionName={t.name} />
          ))}
        </div>
      </section>
      )}

      {/* ─────────── 05 Sources & References ─────────── */}
      <section aria-labelledby="h-evidence" id="evidence" className={`border-t-2 border-ink bg-bone outline-none ${compact ? "py-12 lg:py-16" : "py-20 lg:py-28"}`}>
        <div className={WRAP}>
          {compact ? (
            <h2 id="h-evidence" className="label text-ink-mute">
              Sources
            </h2>
          ) : (
          <ChapterHeading
            n={ch("evidence").n}
            id="h-evidence"
            title={ch("evidence").label}
            kicker="Every claim, traceable"
            intro={
              compact
                ? "Every statement above links to the record it comes from. None has been checked by an editor yet."
                : "Each statement in this passport carries an evidence label and points to the sources behind it — including where those sources disagree."
            }
          />
          )}
          <SourcesReferences claims={t.claims} sources={numbered} compact={compact} />
        </div>
      </section>

      {/* ─────────── 06 Meet the Makers ─────────── */}
      <section aria-labelledby={hasKeepAlive ? "h-keep" : undefined} aria-label={hasKeepAlive ? undefined : "Learn more and share"} id="keep-alive" className="outline-none">
        {hasKeepAlive && (
        <div className="border-y-2 border-ink bg-umber pt-20 text-bone lg:pt-28">
          <div className={`${WRAP} ${t.keepAlive.organizations.length ? "" : "pb-6"}`}>
            <ChapterHeading n={ch("keep-alive").n} id="h-keep" title={ch("keep-alive").label} kicker="Connect, credit, collaborate" tone="dark" />
          </div>
          {t.keepAlive.organizations.length > 0 && (
          <div className={`${WRAP} pb-16`}>
            <p className="label text-yellow">Organisations &amp; collections</p>
            <ul className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {t.keepAlive.organizations.map((id) => {
                const o = L.organization.get(id);
                if (!o) return null;
                return (
                  <li key={id} className="notched flex flex-col bg-bone px-7 py-5 text-ink">
                    <span className="label-sm text-ink-mute">{o.kind.replace("-", " ")}</span>
                    <p className="font-title mt-1 text-2xl leading-tight">
                      {o.url ? (
                        <a href={o.url} target="_blank" rel="noreferrer" className="hover:text-brick">
                          {o.name} ↗
                        </a>
                      ) : (
                        o.name
                      )}
                    </p>
                    <p className="mt-2 text-sm text-ink-soft">
                      {o.role}
                      <SourceMarks ids={o.sources} numbering={numbering} />
                    </p>
                    {o.verified && <p className="label-sm mt-auto pt-3 text-umber">✓ Role confirmed by cited sources · not an endorsement</p>}
                  </li>
                );
              })}
            </ul>
          </div>
          )}
        </div>
        )}

        <div className={`bg-cream py-16 lg:py-20 ${hasKeepAlive ? "" : "border-t-2 border-ink"}`}>
          <div className={`${WRAP} grid gap-10 lg:grid-cols-12`}>
            <div className="lg:col-span-7">
              {t.keepAlive.collaborationNotes.length > 0 && <p className="label text-ink-mute">Working with this tradition?</p>}
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {t.keepAlive.collaborationNotes.map((n) => (
                  <li key={n} className="flex gap-3 border-2 border-ink bg-bone p-3 text-sm">
                    <span aria-hidden className="font-display text-xl leading-none text-umber">
                      ✓
                    </span>
                    {n}
                  </li>
                ))}
              </ul>

              {t.keepAlive.resources.length > 0 && <p className={`label text-ink-mute ${t.keepAlive.collaborationNotes.length ? "mt-10" : ""}`}>Learn more</p>}
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {t.keepAlive.resources.map((r) => (
                  <li key={r.url}>
                    <a href={r.url} target="_blank" rel="noreferrer" className="block h-full border-2 border-ink bg-bone p-4 transition-colors hover:bg-yellow">
                      <p className="font-semibold">{r.title} ↗</p>
                      <p className="mt-1 text-sm text-ink-soft">{r.note}</p>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6 lg:col-span-5">
              <QrPanel slug={t.slug} passportNo={t.passportNo} name={t.name} />
              <Link href={`/passport/${t.slug}/card`} className="group flex items-center justify-between gap-4 border-2 border-ink bg-yellow p-5 transition-transform hover:-translate-y-0.5">
                <span>
                  <span className="label block">Share with credit</span>
                  <span className="font-title mt-1 block text-xl">Identity card, image and a caption that carries the source</span>
                </span>
                <span aria-hidden className="font-display text-3xl transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>

          <div className={`${WRAP} mt-12 grid items-start gap-4 lg:grid-cols-2`}>
            <CorrectionForm traditionId={t.id} claims={t.claims.map((c) => ({ id: c.id, text: c.text }))} />
            {!compact && (
            <More label="Editorial record" detail={`Reviewed ${formatSourceDate(t.editorial.lastReviewed)}`}>
              <div className="grid gap-6 border-2 border-ink bg-bone p-5 sm:grid-cols-2">
                <div>
                  <p className="label text-ink-mute">Last review</p>
                  <p className="mt-2 text-sm">
                    {formatSourceDate(t.editorial.lastReviewed)} by {t.editorial.reviewedBy}.
                  </p>
                  {t.maturity === "researched" && <p className="mt-2 text-sm text-ink-soft">{t.editorial.notes}</p>}
                </div>
                <div>
                  <p className="label text-ink-mute">Open research questions</p>
                  <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                    {t.editorial.openQuestions.map((q) => (
                      <li key={q}>? {q}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </More>
            )}
          </div>
        </div>
      </section>

      {/* ─────────── Related & next ─────────── */}
      <section aria-label="More stories" className="border-t-2 border-ink bg-sand">
        {trails.length > 0 && (
          <div className={`${WRAP} py-8`}>
            <p className="text-sm text-ink-soft">
              <span className="label-sm text-ink-mute">This passport is a stop on: </span>
              {trails.map((tr, i) => (
                <span key={tr.slug}>
                  {i > 0 && " · "}
                  <Link href={`/trails/${tr.slug}`} className="font-semibold underline hover:text-brick">
                    {tr.title}
                  </Link>
                </span>
              ))}
            </p>
          </div>
        )}
        <nav aria-label="Passport register" className={`grid sm:grid-cols-2 ${trails.length > 0 ? "border-t-2 border-ink" : ""}`}>
          {prev && prev.slug !== t.slug && (
            <Link
              href={`/passport/${prev.slug}`}
              className="group border-b-2 border-ink p-6 sm:border-b-0 sm:border-r-2 lg:px-10 lg:py-10"
              style={{ background: ACCENT[prev.accent].text, color: "#F6F0E3" }}
            >
              <span className="label-sm opacity-80">← Previous passport</span>
              <span className="font-display mt-1 block text-[clamp(1.87rem,3.9vw,3.04rem)] transition-transform group-hover:-translate-x-1">{prev.name}</span>
            </Link>
          )}
          {next && next.slug !== t.slug && (
            <Link
              href={`/passport/${next.slug}`}
              className="group p-6 text-right lg:px-10 lg:py-10"
              style={{ background: ACCENT[next.accent].text, color: "#F6F0E3" }}
            >
              <span className="label-sm opacity-80">Next passport →</span>
              <span className="font-display mt-1 block text-[clamp(1.87rem,3.9vw,3.04rem)] transition-transform group-hover:translate-x-1">{next.name}</span>
            </Link>
          )}
        </nav>
      </section>

      <SourceDrawer sources={drawer} />
    </div>
  );
}
