import Link from "next/link";
import { Suspense } from "react";
import type { Archive, Tradition } from "@/lib/types";
import { citedSources, isPublic, lookups } from "@/lib/data/archive";
import { publicChangeLog } from "@/lib/data/mutations";
import { ACCENT, CATEGORY, MATURITY, RELATIONSHIP, SOURCE_TYPE, accentVars, formatSourceDate } from "@/lib/labels";
import { shareCaption } from "@/lib/share";
import { ArchiveImage } from "@/components/site/ArchiveImage";
import { DiamondBadge, RotatingSeal } from "@/components/site/Seal";
import { EvidenceBadge, SourceMarks } from "@/components/site/Evidence";
import { Ticker } from "@/components/site/Ticker";
import { Motif } from "@/components/motifs/Motif";
import { Blocks, ChapterHeading, type BlockContext } from "./Blocks";
import { ChapterBar } from "./ChapterBar";
import { Timeline, type TimelineItem } from "./Timeline";
import { CaseFile } from "./CaseFile";
import { SourcesReferences, type NumberedSource } from "./SourcesReferences";
import { SourceDrawer, type DrawerSource } from "./SourceDrawer";
import { QrPanel, ShareWithCredit } from "./SharePanel";
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
  const ctx: BlockContext = { claims: new Map(t.claims.map((c) => [c.id, c])), numbering, media: L.media, motif: t.motif };
  const hero = t.hero ? L.media.get(t.hero) : undefined;
  const communities = t.communities.map((c) => L.community.get(c.community)).filter((c): c is NonNullable<typeof c> => !!c);
  const country = L.country.get(t.collection);
  const changeLog = preview ? [] : await publicChangeLog(t.id);

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
    .map((s) => ({ ...s, n: numbering.get(s.id)!, supports: Array.from(new Set(supports.get(s.id) ?? [])) }));
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
          sub: `Passport No. ${o.passportNo}`,
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
  const captionTemplate = shareCaption(
    t,
    "{url}",
    communities.map((c) => c.name),
  );
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
          {back && (
            <Link href={back.href} className="label inline-flex items-center gap-2 border-b-2 border-ink pb-0.5 hover:text-brick">
              <span aria-hidden>←</span> Back to the {back.label}
            </Link>
          )}
        </div>

        <div className={`${WRAP} relative grid gap-x-12 gap-y-10 pb-16 pt-8 lg:grid-cols-12 lg:pb-20`}>
          <div className="lg:col-span-7 lg:row-start-1">
            <DiamondBadge top="CULTURE PASSPORT" center={`No. ${t.passportNo}`} className="h-auto w-44 text-[var(--accent-text)] sm:w-60" />
            <h1 className="font-display reveal-rise mt-6 text-[clamp(3.4rem,10.5vw,9.6rem)]">{t.displayTitle}</h1>
            <p className="font-title mt-3 text-[clamp(1.7rem,3.4vw,2.8rem)] italic text-[var(--accent-text)]">{t.tagline}</p>
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
              <RotatingSeal
                id={`hero-${t.passportNo}`}
                text={`CULTURE PASSPORT · ${t.name.toUpperCase()} · WHEN CULTURE TRAVELS · `}
                center={t.passportNo}
                className="absolute -bottom-8 -left-6 h-32 w-32 rounded-full border-2 border-ink bg-yellow text-ink sm:h-36 sm:w-36"
              />
            </div>
            {hero && <p className="mt-12 max-w-md text-sm text-ink-mute sm:mt-6 sm:pl-36">{hero.caption}</p>}
          </div>

          <div className="lg:col-span-7 lg:row-start-2">
            <p className="lead max-w-2xl text-ink-soft">{t.intro}</p>
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
              <a href="#evidence" className="btn btn-cream">
                {order.length} sources
              </a>
            </div>
          </div>

        </div>
      </section>

      <Ticker
        items={[`Culture Passport No. ${t.passportNo}`, t.name, t.regionLabel, CATEGORY[t.category], `${order.length} sources`, `Reviewed ${formatSourceDate(t.editorial.lastReviewed)}`]}
        className="border-y-2 border-ink bg-ink py-2.5 font-display text-[1.6rem] uppercase text-bone"
        dotClassName="text-[var(--accent)]"
      />

      {/* ─────────── At a glance ─────────── */}
      <section aria-label="At a glance" className="border-b-2 border-ink bg-cream">
        <dl className={`${WRAP} grid gap-3 py-8 sm:grid-cols-2 lg:grid-cols-4`}>
          {[
            ["Category", CATEGORY[t.category], t.techniques.slice(0, 3).join(" · "), "bg-orange text-ink"],
            ["Where", t.regionLabel, country ? `Collection: ${country.name}` : "", "bg-cobalt text-bone"],
            ["Communities", communities.map((c) => c.name).join(" · ") || "Not yet recorded", "", "bg-green text-bone"],
            ["Also known as", t.alternateNames.join(" · ") || "—", MATURITY[t.maturity].label, "border-2 border-ink bg-bone text-ink"],
          ].map(([k, v, sub, cls]) => (
            <div key={k} className={`relative flex min-h-36 flex-col p-5 ${cls}`}>
              <dt className="label opacity-80">{k}</dt>
              <dd className="font-title mt-2 text-[1.6rem] leading-[1.05]">{v}</dd>
              {sub && <dd className="label-sm mt-auto pt-3 opacity-80">{sub}</dd>}
            </div>
          ))}
        </dl>
      </section>

      {t.maturity !== "researched" && (
        <div className="border-b-2 border-ink bg-yellow">
          <p className={`${WRAP} py-3 text-sm`}>
            <strong className="label mr-2">{MATURITY[t.maturity].label}.</strong>
            {MATURITY[t.maturity].description} {t.editorial.notes}
          </p>
        </div>
      )}

      <ChapterBar chapters={CHAPTERS} passportNo={t.passportNo} back={back} />

      {/* ─────────── 01 Where It Began ─────────── */}
      <section aria-labelledby="h-origins" id="origins" className="bg-cream py-20 outline-none lg:py-28">
        <div className={WRAP}>
          <ChapterHeading n="01" id="h-origins" title={CHAPTERS[0].label} kicker="Places, communities, first records" />
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="order-2 lg:order-1 lg:col-span-6">
              <Blocks blocks={t.origins} ctx={ctx} large progressive />
            </div>
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
          </div>
        </div>
      </section>

      {t.significance.length > 0 && (
        <section aria-label="Why it matters" className="border-y-2 border-ink bg-orange py-16 text-ink lg:py-20">
          <div className={`${WRAP} grid gap-8 lg:grid-cols-12`}>
            <div className="lg:col-span-4">
              <p className="label">Why it matters</p>
              <p className="font-display mt-3 text-[clamp(2.6rem,5vw,4.4rem)]">Meaning &amp; significance</p>
            </div>
            <div className="lg:col-span-8">
              <Blocks blocks={t.significance} ctx={ctx} />
            </div>
          </div>
        </section>
      )}

      {/* ─────────── 02 The People Behind It ─────────── */}
      <section aria-labelledby="h-makers" id="makers" className="bg-cream pt-20 outline-none lg:pt-28">
        <div className={WRAP}>
          <ChapterHeading n="02" id="h-makers" title={CHAPTERS[1].label} kicker="Made by people, not by an aesthetic" />
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

        <div className="mt-16 border-y-2 border-ink bg-cobalt py-14 text-bone lg:mt-20">
          <div className={WRAP}>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="label text-yellow">How it is made</p>
                <p className="font-display mt-2 text-[clamp(2.4rem,5vw,4.2rem)]">From material to object</p>
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
      </section>

      {/* ─────────── 03 A Journey Through Time ─────────── */}
      <section aria-labelledby="h-time" id="through-time" className="border-b-2 border-ink bg-orange py-20 text-ink outline-none lg:py-28">
        <div className={WRAP}>
          <ChapterHeading
            n="03"
            id="h-time"
            title={CHAPTERS[2].label}
            kicker="Milestones, with their certainty"
            intro="Dates appear exactly as the evidence allows: precise where a record exists, approximate where it doesn't, and dashed where a claim is disputed or unverified."
            tone="accent"
          />
          <Timeline items={timeline} motif={t.motif} />
        </div>
      </section>

      {/* ─────────── 04 Across Borders ─────────── */}
      <section aria-labelledby="h-travels" id="travels" className="bg-cream py-20 outline-none lg:py-28">
        <div className={WRAP}>
          <ChapterHeading n="04" id="h-travels" title={CHAPTERS[3].label} kicker="Influence, adaptation, attribution" />
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <Blocks blocks={t.travels.intro} ctx={ctx} large progressive />
            </div>
            <div className="lg:col-span-6">
              <p className="label text-ink-mute">Documented journeys</p>
              <ol className="mt-3 grid gap-3">
                {t.travels.influences.map((inf, i) => (
                  <li key={inf.title} className="grid grid-cols-[auto_1fr] gap-4 border-2 border-ink bg-bone p-4">
                    <span className="font-display text-5xl leading-[0.8] text-[var(--accent-text)]">{String(i + 1).padStart(2, "0")}</span>
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
          </div>

          {web.length > 0 && (
            <div className="mt-16">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="label text-[var(--accent-text)]">Connections</p>
                  <p className="font-display mt-2 text-[clamp(2.4rem,5vw,4.2rem)]">Who and where it touches</p>
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
          {t.travels.cases.length === 0 && (
            <p className="mt-14 max-w-3xl border-2 border-dashed border-ink/40 p-6 text-ink-soft">
              No attribution case is documented for {t.name} yet. We record a case only when there is a sourced sequence of events — never on resemblance
              or rumour.
            </p>
          )}
        </div>
      </section>

      {/* ─────────── 05 Sources & References ─────────── */}
      <section aria-labelledby="h-evidence" id="evidence" className="border-t-2 border-ink bg-bone py-20 outline-none lg:py-28">
        <div className={WRAP}>
          <ChapterHeading
            n="05"
            id="h-evidence"
            title={CHAPTERS[4].label}
            kicker="Every claim, traceable"
            intro="Each statement in this passport carries an evidence label and points to the sources behind it — including where those sources disagree."
          />
          <SourcesReferences claims={t.claims} sources={numbered} />
        </div>
      </section>

      {/* ─────────── 06 Meet the Makers ─────────── */}
      <section aria-labelledby="h-keep" id="keep-alive" className="outline-none">
        <div className="border-y-2 border-ink bg-green pt-20 text-bone lg:pt-28">
          <div className={WRAP}>
            <ChapterHeading n="06" id="h-keep" title={CHAPTERS[5].label} kicker="Connect, credit, collaborate" tone="dark" />
          </div>
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
                    {o.verified && <p className="label-sm mt-auto pt-3 text-green">✓ Role confirmed by cited sources · not an endorsement</p>}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="bg-cream py-16 lg:py-20">
          <div className={`${WRAP} grid gap-10 lg:grid-cols-12`}>
            <div className="lg:col-span-7">
              <div className="border-2 border-dashed border-ink/50 p-5">
                <p className="label text-ink-mute">Artisan profiles</p>
                <p className="mt-2 text-sm text-ink-soft">
                  None published yet. Profiles will appear only with a maker&rsquo;s consent and after verification — we will not list private individuals
                  from press coverage or invent workshops.
                </p>
              </div>

              <p className="label mt-10 text-ink-mute">Working with this tradition?</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {t.keepAlive.collaborationNotes.map((n) => (
                  <li key={n} className="flex gap-3 border-2 border-ink bg-bone p-3 text-sm">
                    <span aria-hidden className="font-display text-xl leading-none text-green">
                      ✓
                    </span>
                    {n}
                  </li>
                ))}
              </ul>

              <p className="label mt-10 text-ink-mute">Learn more</p>
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
              <ShareWithCredit slug={t.slug} passportNo={t.passportNo} name={t.name} captionTemplate={captionTemplate} />
            </div>
          </div>

          <div className={`${WRAP} mt-12 grid items-start gap-4 lg:grid-cols-2`}>
            <CorrectionForm traditionId={t.id} claims={t.claims.map((c) => ({ id: c.id, text: c.text }))} />
            <More label="Editorial record" detail={`Reviewed ${formatSourceDate(t.editorial.lastReviewed)} · change log`}>
              <div className="grid gap-6 border-2 border-ink bg-bone p-5 sm:grid-cols-3">
                <div>
                  <p className="label text-ink-mute">Last review</p>
                  <p className="mt-2 text-sm">
                    {formatSourceDate(t.editorial.lastReviewed)} by {t.editorial.reviewedBy}.
                  </p>
                  <p className="mt-2 text-sm text-ink-soft">{t.editorial.notes}</p>
                </div>
                <div>
                  <p className="label text-ink-mute">Open research questions</p>
                  <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                    {t.editorial.openQuestions.map((q) => (
                      <li key={q}>? {q}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="label text-ink-mute">Change log</p>
                  {changeLog.length ? (
                    <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                      {changeLog.map((c, i) => (
                        <li key={i}>
                          <span className="font-ui text-xs">{c.at.slice(0, 10)}</span> — {c.summary}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-ink-soft">No edits since the seed research of {formatSourceDate(t.editorial.lastReviewed)}.</p>
                  )}
                </div>
              </div>
            </More>
          </div>
        </div>
      </section>

      {/* ─────────── Related & next ─────────── */}
      <section aria-label="More stories" className="border-t-2 border-ink bg-sand">
        <div className={`${WRAP} py-16 lg:py-20`}>
          <p className="label text-brick">Related stories</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {t.related.map((r) => {
              const o = L.tradition.get(r.slug);
              if (!o || !isPublic(o)) return null;
              return (
                <Link key={r.slug} href={`/passport/${o.slug}`} className="group flex gap-4 border-2 border-ink bg-bone p-4 transition-transform hover:-translate-y-1">
                  <span className="h-24 w-20 shrink-0 overflow-hidden border-2 border-ink">
                    <Motif motif={o.motif} className="h-full w-full" />
                  </span>
                  <span>
                    <span className="font-ui text-xs font-bold text-ink-mute">No. {o.passportNo}</span>
                    <span className="font-display block text-3xl group-hover:text-brick">{o.name}</span>
                    <span className="mt-1 block text-sm text-ink-soft">{r.reason}</span>
                  </span>
                </Link>
              );
            })}
          </div>
          {trails.length > 0 && (
            <p className="mt-8 text-sm text-ink-soft">
              <span className="label-sm text-ink-mute">On the trails: </span>
              {trails.map((tr, i) => (
                <span key={tr.slug}>
                  {i > 0 && " · "}
                  <Link href={`/trails/${tr.slug}`} className="font-semibold underline hover:text-brick">
                    {tr.title}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>
        <nav aria-label="Passport register" className="grid border-t-2 border-ink sm:grid-cols-2">
          {prev && prev.slug !== t.slug && (
            <Link
              href={`/passport/${prev.slug}`}
              className="group border-b-2 border-ink p-6 sm:border-b-0 sm:border-r-2 lg:px-10 lg:py-10"
              style={{ background: ACCENT[prev.accent].text, color: "#F6F0E3" }}
            >
              <span className="label-sm opacity-80">← Previous passport · No. {prev.passportNo}</span>
              <span className="font-display mt-1 block text-[clamp(2.4rem,5vw,4rem)] transition-transform group-hover:-translate-x-1">{prev.name}</span>
            </Link>
          )}
          {next && next.slug !== t.slug && (
            <Link
              href={`/passport/${next.slug}`}
              className="group p-6 text-right lg:px-10 lg:py-10"
              style={{ background: ACCENT[next.accent].text, color: "#F6F0E3" }}
            >
              <span className="label-sm opacity-80">Next passport · No. {next.passportNo} →</span>
              <span className="font-display mt-1 block text-[clamp(2.4rem,5vw,4rem)] transition-transform group-hover:translate-x-1">{next.name}</span>
            </Link>
          )}
        </nav>
      </section>

      <SourceDrawer sources={drawer} />
    </div>
  );
}
