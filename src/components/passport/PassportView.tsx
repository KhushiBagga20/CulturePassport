import Link from "next/link";
import { Suspense } from "react";
import type { Archive, Tradition } from "@/lib/types";
import { citedSources, isPublic, lookups } from "@/lib/data/archive";
import { publicChangeLog } from "@/lib/data/mutations";
import { ACCENT, CATEGORY, MATURITY, formatSourceDate } from "@/lib/labels";
import { shareCaption } from "@/lib/share";
import { ArchiveImage } from "@/components/site/ArchiveImage";
import { RotatingSeal } from "@/components/site/Seal";
import { EvidenceBadge, SourceMarks } from "@/components/site/Evidence";
import { Reveal } from "@/components/site/Motion";
import { Motif } from "@/components/motifs/Motif";
import { Blocks, ChapterHeading, type BlockContext } from "./Blocks";
import { ChapterRail } from "./ChapterRail";
import { Timeline, type TimelineItem } from "./Timeline";
import { CaseFile } from "./CaseFile";
import { EvidenceRoom, type NumberedSource } from "./EvidenceRoom";
import { QrPanel, ShareWithCredit } from "./SharePanel";
import { CorrectionForm } from "./CorrectionForm";
import { PlacesMap } from "./PlacesMap";
import { TrailBar } from "./TrailBar";

const CHAPTERS = [
  { id: "origins", n: "01", label: "Origins" },
  { id: "makers", n: "02", label: "Makers" },
  { id: "through-time", n: "03", label: "Through time" },
  { id: "travels", n: "04", label: "When culture travels" },
  { id: "evidence", n: "05", label: "Evidence room" },
  { id: "keep-alive", n: "06", label: "Keep it alive" },
];

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

  return (
    <div style={{ ["--accent" as string]: accent.hex }}>
      <Suspense fallback={null}>
        <TrailBar trails={trails} current={t.slug} />
      </Suspense>
      {preview && (
        <div className="bg-mustard px-4 py-2 text-center text-sm text-ink">
          <strong>Editor preview</strong> — status: {t.status}. This page is not visible to the public until it is published.
        </div>
      )}

      {/* ─────────── Hero ─────────── */}
      <section className="relative overflow-hidden border-b rule">
        <div aria-hidden className="contour-bg absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid max-w-[1500px] gap-x-12 gap-y-8 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-12 lg:px-10 lg:pb-20 lg:pt-12">
          <div className="lg:col-span-7 lg:row-start-1">
            <nav aria-label="Breadcrumb" className="label-sm flex flex-wrap gap-2 text-ink-mute">
              <Link href="/" className="hover:text-terracotta">
                The globe
              </Link>
              <span>/</span>
              {L.country.get(t.collection) && (
                <>
                  <Link href={`/country/${L.country.get(t.collection)!.slug}`} className="hover:text-terracotta">
                    {L.country.get(t.collection)!.name}
                  </Link>
                  <span>/</span>
                </>
              )}
              <span aria-current="page">Passport No. {t.passportNo}</span>
            </nav>
            <p className="label mt-8 flex items-center gap-3 text-[var(--accent)]">
              <span className="h-px w-8 bg-[var(--accent)]" /> Culture Passport No. {t.passportNo}
            </p>
            <h1 className="font-display reveal-rise mt-4 text-[clamp(3.6rem,10vw,9rem)] text-ink balance">{t.displayTitle}</h1>
            <p className="font-serif mt-4 text-[clamp(1.7rem,3.2vw,2.7rem)] italic leading-tight text-[var(--accent)]">{t.tagline}</p>
          </div>

          <div className="relative lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
            <div className="relative">
              {hero ? (
                <ArchiveImage
                  media={hero}
                  fallbackMotif={t.motif}
                  priority
                  width={1280}
                  sizes="(min-width:1024px) 40vw, 100vw"
                  className="aspect-[4/5] w-full border border-ink/20 shadow-[0_40px_80px_-40px_rgba(33,28,25,.6)]"
                />
              ) : (
                <Motif motif={t.motif} className="aspect-[4/5] w-full" />
              )}
              <RotatingSeal
                id={`hero-${t.passportNo}`}
                text={`CULTURE PASSPORT · ${t.name.toUpperCase()} · WHEN CULTURE TRAVELS · `}
                center={t.passportNo}
                className="absolute -bottom-10 -left-8 h-36 w-36 rounded-full bg-ivory/90 text-[var(--accent)] shadow-lg backdrop-blur-sm sm:h-40 sm:w-40"
              />
            </div>
            {hero && <p className="mt-14 max-w-md text-sm text-ink-mute sm:mt-12 sm:pl-36">{hero.caption}</p>}
            <div className="mt-6 flex flex-wrap gap-2 sm:pl-36">
              <span className="label-sm rounded-full px-2.5 py-1" style={{ background: accent.soft }}>
                {MATURITY[t.maturity].label}
              </span>
              <span className="label-sm rounded-full border rule px-2.5 py-1">Reviewed {formatSourceDate(t.editorial.lastReviewed)}</span>
              <a href="#evidence" className="label-sm rounded-full border rule px-2.5 py-1 hover:border-ink">
                {order.length} sources →
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 lg:row-start-2">
            <p className="max-w-2xl text-[1.08rem] text-ink-soft">{t.intro}</p>

            <dl className="mt-8 grid grid-cols-1 border-t rule text-sm sm:grid-cols-2">
              {[
                ["Category", `${CATEGORY[t.category]} · ${t.techniques.slice(0, 2).join(", ")}`],
                ["Associated regions", t.regionLabel],
                ["Communities", communities.map((c) => c.name).join("; ") || "—"],
                ["Also known as", t.alternateNames.join(" · ") || "—"],
              ].map(([k, v]) => (
                <div key={k} className="border-b rule py-3 sm:odd:pr-6">
                  <dt className="label-sm text-ink-mute">{k}</dt>
                  <dd className="mt-1">{v}</dd>
                </div>
              ))}
            </dl>
            {t.nativeNames.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                {t.nativeNames.map((n) => (
                  <div key={n.text} lang={n.lang.startsWith("Marathi") ? "mr" : undefined}>
                    <p className="text-3xl leading-none">{n.text}</p>
                    <p className="label-sm mt-1 text-ink-mute">
                      {n.lang} · {n.script}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {t.maturity !== "researched" && (
        <div className="border-b rule bg-mustard/25">
          <p className="mx-auto max-w-[1500px] px-4 py-3 text-sm sm:px-6 lg:px-10">
            <strong className="label mr-2">{MATURITY[t.maturity].label}.</strong>
            {MATURITY[t.maturity].description} {t.editorial.notes}
          </p>
        </div>
      )}

      {/* ─────────── Body ─────────── */}
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 xl:grid xl:grid-cols-[200px_1fr] xl:gap-12 xl:px-10">
        <ChapterRail chapters={CHAPTERS} passportNo={t.passportNo} />

        <div className="min-w-0 pb-16">
          {/* 01 Origins */}
          <section aria-labelledby="h-origins" id="origins" className="scroll-mt-24 pt-16 lg:pt-24">
            <ChapterHeading n="01" id="h-origins" title="The origins" kicker="Where it comes from" />
            <div className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <Blocks blocks={t.origins} ctx={ctx} large />
              </div>
              <div className="lg:col-span-5">
                <div className="lg:sticky lg:top-24">
                  <PlacesMap t={t} archive={archive} />
                  {communities.length > 0 && (
                    <div className="mt-6 border-l-2 border-[var(--accent)] pl-4">
                      <p className="label-sm text-ink-mute">Associated communities</p>
                      {communities.map((c) => (
                        <div key={c.id} className="mt-2">
                          <p className="font-serif text-xl">{c.name}</p>
                          <p className="text-sm text-ink-soft">
                            {c.description}
                            {c.sources && <SourceMarks ids={c.sources} numbering={numbering} />}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {t.significance.length > 0 && (
              <div className="mt-16 grid gap-8 border-t rule pt-10 lg:grid-cols-12">
                <p className="label text-ink-mute lg:col-span-3">Significance &amp; meaning</p>
                <div className="lg:col-span-9">
                  <Blocks blocks={t.significance} ctx={ctx} />
                </div>
              </div>
            )}
          </section>

          {/* 02 Makers */}
          <section aria-labelledby="h-makers" id="makers" className="scroll-mt-24 pt-24">
            <ChapterHeading n="02" id="h-makers" title="The makers" kicker="Made by people, not by an aesthetic" />
            <div className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <Blocks blocks={t.makers.intro} ctx={ctx} large />
              </div>
              <div className="lg:col-span-5">
                <p className="label text-ink-mute">Materials</p>
                <ul className="mt-3 divide-y divide-ink/10 border-y rule">
                  {t.makers.materials.map((m) => (
                    <li key={m.name} className="py-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-serif text-xl">{m.name}</span>
                        <EvidenceBadge level={m.level} compact />
                      </div>
                      <p className="mt-1 text-sm text-ink-soft">
                        {m.detail}
                        <SourceMarks ids={m.sources} numbering={numbering} />
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {t.makers.process.length > 0 && (
              <div className="mt-14">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <p className="label text-ink-mute">The process, step by step</p>
                  <p className="label-sm text-ink-mute">Steps marked VER await review by makers</p>
                </div>
                <ol className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
                  {t.makers.process.map((s, i) => (
                    <Reveal as="li" key={s.title} delay={i * 0.04} className="w-[260px] shrink-0 snap-start sm:w-[280px]">
                      <div className={`h-full p-5 ${s.level === "documented" ? "paper-card" : "border border-dashed border-ink/35"}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-display text-5xl text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</span>
                          <EvidenceBadge level={s.level} compact />
                        </div>
                        <p className="font-serif mt-3 text-2xl">{s.title}</p>
                        <p className="mt-1 text-sm text-ink-soft">
                          {s.detail}
                          <SourceMarks ids={s.sources} numbering={numbering} />
                        </p>
                      </div>
                    </Reveal>
                  ))}
                </ol>
              </div>
            )}

            <div className="mt-12 grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <p className="label text-ink-mute">Makers on record</p>
                {t.makers.practitioners.length ? (
                  <ul className="mt-3 grid gap-px border rule bg-ink/10 sm:grid-cols-2">
                    {t.makers.practitioners.map((p) => (
                      <li key={p.name} className="bg-ivory p-4">
                        <p className="font-serif text-xl">{p.name}</p>
                        <p className="mt-1 text-sm text-ink-soft">
                          {p.note}
                          <SourceMarks ids={p.sources} numbering={numbering} />
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-ink-soft">No individual makers are named in this passport&rsquo;s public record yet.</p>
                )}
              </div>
              <aside className="accession p-5 lg:col-span-5">
                <p className="label text-[var(--accent)]">Voices</p>
                <p className="mt-2 text-sm text-ink-soft">{t.makers.voicesNote}</p>
              </aside>
            </div>
          </section>

          {/* 03 Through time */}
          <section aria-labelledby="h-time" id="through-time" className="scroll-mt-24 pt-24">
            <ChapterHeading
              n="03"
              id="h-time"
              title="Through time"
              kicker="Milestones, with their certainty"
              intro="Dates appear exactly as the evidence allows: precise where a record exists, approximate where it doesn't, and dashed where the claim is disputed or unverified."
            />
            <Timeline items={timeline} motif={t.motif} />
          </section>

          {/* 04 When culture travels */}
          <section aria-labelledby="h-travels" id="travels" className="scroll-mt-24 pt-24">
            <ChapterHeading n="04" id="h-travels" title="When culture travels" kicker="Influence, adaptation, attribution" />
            <div className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <Blocks blocks={t.travels.intro} ctx={ctx} large />
              </div>
              <div className="lg:col-span-5">
                <p className="label text-ink-mute">Documented journeys</p>
                <ul className="mt-3 space-y-4">
                  {t.travels.influences.map((i) => (
                    <li key={i.title} className="border-l-2 border-[var(--accent)] pl-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-serif text-xl">{i.title}</p>
                        <EvidenceBadge level={i.level} compact />
                      </div>
                      <p className="mt-1 text-sm text-ink-soft">
                        {i.body}
                        <SourceMarks ids={i.sources} numbering={numbering} />
                      </p>
                    </li>
                  ))}
                </ul>
                <Link href={`/routes?tradition=${t.slug}`} className="label mt-6 inline-block underline hover:text-terracotta">
                  See its routes on the map →
                </Link>
              </div>
            </div>
            {t.travels.cases.map((c) => (
              <CaseFile key={c.id} c={c} numbering={numbering} media={L.media} motif={t.motif} traditionName={t.name} />
            ))}
            {t.travels.cases.length === 0 && (
              <p className="paper-card mt-12 p-6 text-ink-soft">
                No attribution case is documented for {t.name} yet. We record a case only when there is a sourced sequence of events — never on
                resemblance or rumour.
              </p>
            )}
          </section>

          {/* 05 Evidence room */}
          <section aria-labelledby="h-evidence" id="evidence" className="scroll-mt-24 pt-24">
            <ChapterHeading
              n="05"
              id="h-evidence"
              title="The evidence room"
              kicker="Every claim, traceable"
              intro="Each statement in this passport carries an evidence label applied by an editor, and points to the sources behind it — including where those sources disagree."
            />
            <EvidenceRoom claims={t.claims} sources={numbered} />
          </section>

          {/* 06 Keep the story alive */}
          <section aria-labelledby="h-keep" id="keep-alive" className="scroll-mt-24 pt-24">
            <ChapterHeading n="06" id="h-keep" title="Keep the story alive" kicker="Connect, credit, collaborate" />
            <div className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <p className="label text-ink-mute">Organisations &amp; collections</p>
                <ul className="mt-3 divide-y divide-ink/10 border-y rule">
                  {t.keepAlive.organizations.map((id) => {
                    const o = L.organization.get(id);
                    if (!o) return null;
                    return (
                      <li key={id} className="py-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-serif text-xl">
                            {o.url ? (
                              <a href={o.url} target="_blank" rel="noreferrer" className="hover:text-terracotta">
                                {o.name} ↗
                              </a>
                            ) : (
                              o.name
                            )}
                          </p>
                          <span className="label-sm text-ink-mute">{o.kind.replace("-", " ")}</span>
                        </div>
                        <p className="mt-1 text-sm text-ink-soft">
                          {o.role}
                          <SourceMarks ids={o.sources} numbering={numbering} />
                        </p>
                        {o.verified && <p className="label-sm mt-1 text-forest">✓ Role confirmed by cited sources · not an endorsement</p>}
                      </li>
                    );
                  })}
                </ul>

                <p className="label mt-10 text-ink-mute">Learn more</p>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {t.keepAlive.resources.map((r) => (
                    <li key={r.url}>
                      <a href={r.url} target="_blank" rel="noreferrer" className="paper-card block h-full p-4 hover:border-ink">
                        <p className="font-medium">{r.title} ↗</p>
                        <p className="mt-1 text-sm text-ink-soft">{r.note}</p>
                      </a>
                    </li>
                  ))}
                </ul>

                <div className="mt-10 border-2 border-dashed border-ink/30 p-5">
                  <p className="label text-ink-mute">Verified artisan profiles</p>
                  <p className="mt-2 text-sm text-ink-soft">
                    None published yet. Profiles will appear only with a maker&rsquo;s consent and after verification — we will not list private individuals
                    from press coverage or invent workshops.
                  </p>
                </div>
              </div>
              <div className="space-y-6 lg:col-span-5">
                <div className="paper-card p-5">
                  <p className="label text-[var(--accent)]">Working with this tradition?</p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {t.keepAlive.collaborationNotes.map((n) => (
                      <li key={n} className="flex gap-2">
                        <span aria-hidden className="text-[var(--accent)]">✓</span>
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
                <QrPanel slug={t.slug} passportNo={t.passportNo} name={t.name} />
                <ShareWithCredit slug={t.slug} passportNo={t.passportNo} name={t.name} captionTemplate={captionTemplate} />
              </div>
            </div>

            <div className="mt-12">
              <CorrectionForm traditionId={t.id} claims={t.claims.map((c) => ({ id: c.id, text: c.text }))} />
            </div>
          </section>

          {/* Editorial record */}
          <section className="mt-20 grid gap-8 border-t-2 border-ink pt-8 lg:grid-cols-12" aria-label="Editorial record">
            <div className="lg:col-span-4">
              <p className="label text-ink-mute">Editorial record</p>
              <p className="mt-2 text-sm">
                Last reviewed {formatSourceDate(t.editorial.lastReviewed)} by {t.editorial.reviewedBy}.
              </p>
              <p className="mt-2 text-sm text-ink-soft">{t.editorial.notes}</p>
            </div>
            <div className="lg:col-span-4">
              <p className="label text-ink-mute">Open research questions</p>
              <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                {t.editorial.openQuestions.map((q) => (
                  <li key={q}>? {q}</li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-4">
              <p className="label text-ink-mute">Change log</p>
              {changeLog.length ? (
                <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                  {changeLog.map((c, i) => (
                    <li key={i}>
                      <span className="font-mono text-xs">{c.at.slice(0, 10)}</span> — {c.summary}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-ink-soft">No edits since the seed research of {formatSourceDate(t.editorial.lastReviewed)}.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ─────────── Related & next ─────────── */}
      <section className="border-t rule bg-paper/60">
        <div className="mx-auto max-w-[1500px] px-4 py-20 sm:px-6 lg:px-10">
          <p className="label text-terracotta">Related stories</p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {t.related.map((r) => {
              const o = L.tradition.get(r.slug);
              if (!o || !isPublic(o)) return null;
              return (
                <Link key={r.slug} href={`/passport/${o.slug}`} className="group flex gap-4 border-t-2 border-ink pt-4">
                  <span className="h-20 w-16 shrink-0 overflow-hidden border border-ink/20">
                    <Motif motif={o.motif} className="h-full w-full" />
                  </span>
                  <span>
                    <span className="font-mono text-xs text-ink-mute">No. {o.passportNo}</span>
                    <span className="font-display block text-3xl group-hover:text-terracotta">{o.name}</span>
                    <span className="mt-1 block text-sm text-ink-soft">{r.reason}</span>
                  </span>
                </Link>
              );
            })}
          </div>
          {trails.length > 0 && (
            <p className="mt-10 text-sm text-ink-soft">
              <span className="label-sm text-ink-mute">On the trails: </span>
              {trails.map((tr, i) => (
                <span key={tr.slug}>
                  {i > 0 && " · "}
                  <Link href={`/trails/${tr.slug}`} className="underline hover:text-terracotta">
                    {tr.title}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>
        <nav aria-label="Passport register" className="grid border-t rule sm:grid-cols-2">
          {prev && prev.slug !== t.slug && (
            <Link href={`/passport/${prev.slug}`} className="group border-b rule p-6 hover:bg-ivory sm:border-b-0 sm:border-r lg:px-10">
              <span className="label-sm text-ink-mute">← Previous passport · No. {prev.passportNo}</span>
              <span className="font-display mt-1 block text-4xl group-hover:text-terracotta">{prev.name}</span>
            </Link>
          )}
          {next && next.slug !== t.slug && (
            <Link href={`/passport/${next.slug}`} className="group p-6 text-right hover:bg-ivory lg:px-10">
              <span className="label-sm text-ink-mute">Next passport · No. {next.passportNo} →</span>
              <span className="font-display mt-1 block text-4xl group-hover:text-terracotta">{next.name}</span>
            </Link>
          )}
        </nav>
      </section>
    </div>
  );
}
