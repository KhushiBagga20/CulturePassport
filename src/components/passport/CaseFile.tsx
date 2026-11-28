import type { CaseStudy, MediaAsset, MotifKey } from "@/lib/types";
import { EvidenceBadge, SourceMarks } from "@/components/site/Evidence";
import { ArchiveImage } from "@/components/site/ArchiveImage";
import { Motif } from "@/components/motifs/Motif";
import { CompareSlider } from "./CompareSlider";
import { CaseChronology } from "./CaseChronology";

/** An attribution case: what happened, side by side, what travelled, and the same six questions every time. */
export function CaseFile({
  c,
  numbering,
  media,
  motif,
  traditionName,
}: {
  c: CaseStudy;
  numbering: Map<string, number>;
  media: Map<string, MediaAsset>;
  motif: MotifKey;
  traditionName: string;
}) {
  const trad = c.comparison?.traditional;
  const adapt = c.comparison?.adaptation;
  const tradMedia = trad?.media ? media.get(trad.media) : undefined;
  const adaptMedia = adapt?.media ? media.get(adapt.media) : undefined;

  return (
    <article aria-labelledby={`case-${c.id}`} className="relative mt-20 border-2 border-ink bg-ink text-bone">
      {/* Header band */}
      <div className="grid gap-px bg-bone/15 lg:grid-cols-[1fr_auto]">
        <div className="bg-ink px-5 py-8 sm:px-10 sm:py-10">
          <p className="label inline-block bg-yellow px-2 py-1 text-ink">Case file {c.code}</p>
          <h3 id={`case-${c.id}`} className="font-display mt-4 text-[clamp(2.18rem,5.07vw,4.26rem)]">
            {c.title}
          </h3>
          <p className="lead mt-5 max-w-3xl text-bone/90">{c.summary}</p>
        </div>
        <dl className="flex flex-col gap-px bg-bone/15 lg:w-80">
          <div className="bg-orange p-5 text-ink">
            <dt className="label-sm">Status</dt>
            <dd className="font-title mt-1 text-xl leading-tight">{c.status}</dd>
          </div>
          <div className="flex-1 bg-ink p-5">
            <dt className="label-sm text-bone/60">Parties</dt>
            <dd className="mt-2 flex flex-wrap gap-1.5">
              {c.parties.map((p) => (
                <span key={p} className="border border-bone/40 px-2 py-0.5 text-xs">
                  {p}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </div>
      <div className="strip-checker" style={{ ["--strip-bg" as string]: "#F4BA2E" }} />

      <div className="px-5 py-10 sm:px-10 sm:py-14">
        {/* Chronology */}
        <p className="label text-yellow">How it unfolded</p>
        <div className="mt-4">
          <CaseChronology
            events={c.events.map((e) => ({
              id: e.id,
              date: e.date.label,
              title: e.title,
              body: e.body,
              tag: e.tag,
              level: e.level,
              sources: e.sources.map((id) => ({ id, n: numbering.get(id) ?? 0 })).filter((s) => s.n),
            }))}
          />
        </div>

        {/* Comparison */}
        {trad && adapt && (
          <div className="mt-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="label text-yellow">Side by side</p>
                <p className="font-display mt-2 text-[clamp(1.72rem,3.51vw,2.74rem)]">The object and the interpretation</p>
              </div>
              <p className="max-w-sm text-sm text-bone/75">
                Only licensed images are shown. Where no licensed photograph exists, the panel says so instead of showing a look-alike.
              </p>
            </div>
            {tradMedia && adaptMedia ? (
              <div className="mt-6 text-ink">
                <CompareSlider
                  motif={motif}
                  traditional={{ title: trad.title, points: trad.points, media: tradMedia }}
                  adaptation={{ title: adapt.title, points: adapt.points, media: adaptMedia, mediaNote: adapt.mediaNote }}
                />
              </div>
            ) : (
              <div className="mt-6 grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
                <ComparePanel title={trad.title} points={trad.points} media={tradMedia} motif={motif} tone="cream" />
                <div className="flex items-center justify-center" aria-hidden>
                  <span className="font-display flex h-16 w-16 rotate-45 items-center justify-center border-2 border-bone bg-yellow text-2xl text-ink">
                    <span className="-rotate-45">→</span>
                  </span>
                </div>
                <ComparePanel title={adapt.title} points={adapt.points} media={adaptMedia} note={adapt.mediaNote} motif={motif} tone="red" />
              </div>
            )}
          </div>
        )}

        {/* What travelled, and what was left behind? */}
        <div className="mt-16">
          <h4 className="font-display text-[clamp(1.72rem,3.74vw,3.04rem)]">
            What travelled, <span className="text-yellow">and what was left behind?</span>
          </h4>
          <div className="mt-8 grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
            <div className="bg-cream p-6 text-ink">
              <p className="label">What travelled</p>
              <ul className="mt-4 space-y-2">
                {c.travelled.map((x) => (
                  <li key={x} className="flex items-baseline gap-3">
                    <span aria-hidden className="font-display text-xl text-umber">✓</span>
                    <span className="font-title text-2xl leading-tight">{x}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden flex-col items-center justify-center gap-2 md:flex" aria-hidden>
              <span className="font-display text-4xl text-yellow">⇆</span>
              <span className="label-sm vertical-label text-bone/60">The gap</span>
            </div>
            <div className="border-4 border-dashed border-yellow p-6">
              <p className="label text-yellow">What was left behind</p>
              <ul className="mt-4 space-y-2">
                {c.leftBehind.map((x) => (
                  <li key={x} className="flex items-baseline gap-3">
                    <span aria-hidden className="font-display text-xl text-yellow">?</span>
                    <span className="font-title text-2xl leading-tight text-yellow">{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Six questions */}
        <div className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label text-yellow">{c.questions.length === 6 ? "Six questions" : "Our questions"}</p>
              <p className="font-display mt-2 text-[clamp(1.72rem,3.51vw,2.74rem)]">Asked of every case</p>
            </div>
            <p className="max-w-sm text-sm text-bone/75">
              The same questions, every time — so that {traditionName} is judged by a method, not by a mood. Open one to read the answer.
            </p>
          </div>
          <ol className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {c.questions.map((q, i) => (
              <li key={q.q}>
                <details className="more group h-full border-2 border-bone/40 bg-ink p-5 open:border-yellow open:bg-bone open:text-ink">
                  <summary className="flex items-start gap-4">
                    <span className="font-display text-4xl leading-[0.8] text-yellow group-open:text-brick">{i + 1}</span>
                    <span className="font-title flex-1 text-xl leading-tight">{q.q}</span>
                    <span aria-hidden className="more-icon font-display text-2xl leading-none text-yellow transition-transform group-open:text-ink">
                      +
                    </span>
                  </summary>
                  <div className="mt-4 pl-10">
                    <p className="text-[0.95rem] text-ink-soft">
                      {q.a}
                      <SourceMarks ids={q.sources} numbering={numbering} />
                    </p>
                    <div className="mt-3">
                      <EvidenceBadge level={q.level} compact />
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {c.legalNote && (
            <aside className="bg-yellow p-6 text-ink">
              <p className="label">A note on the law</p>
              <p className="mt-2 text-[0.97rem]">
                {c.legalNote.text}
                <SourceMarks ids={c.legalNote.sources} numbering={numbering} />
              </p>
            </aside>
          )}
          {c.openQuestions.length > 0 && (
            <div className="border-2 border-bone/40 p-6">
              <p className="label text-bone/70">Still open</p>
              <ul className="mt-3 space-y-2 text-bone/90">
                {c.openQuestions.map((q) => (
                  <li key={q} className="flex gap-3">
                    <span aria-hidden className="font-display text-xl leading-none text-yellow">
                      ?
                    </span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ComparePanel({
  title,
  points,
  media,
  note,
  motif,
  tone,
}: {
  title: string;
  points: string[];
  media?: MediaAsset;
  note?: string;
  motif: MotifKey;
  tone: "cream" | "red";
}) {
  const red = tone === "red";
  return (
    <figure className={`flex flex-col border-2 ${red ? "border-bone/40 bg-brick text-bone" : "border-bone bg-cream text-ink"}`}>
      <div className={`relative aspect-[4/3] border-b-2 ${red ? "border-bone/40" : "border-ink"}`}>
        {media ? (
          <ArchiveImage media={media} fallbackMotif={motif} className="h-full w-full" sizes="(min-width:768px) 40vw, 100vw" width={960} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center border-2 border-dashed border-current" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-8 w-8">
                <rect x="3" y="5" width="18" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M3 5l18 14" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>
            <p className="label">Image not licensed</p>
            <p className="max-w-xs text-sm opacity-90">{note}</p>
            <div className="h-10 w-10 opacity-40">
              <Motif motif={motif} className="h-full w-full" title="Archive illustration, not the runway design" />
            </div>
          </div>
        )}
      </div>
      <figcaption className="p-5">
        <p className="font-title text-2xl leading-tight">{title}</p>
        <ol className="mt-3 space-y-1.5">
          {points.map((p, i) => (
            <li key={p} className="flex items-baseline gap-3 text-sm">
              <span className={`font-ui text-xs font-bold ${red ? "text-yellow" : "text-brick"}`}>{String(i + 1).padStart(2, "0")}</span>
              {p}
            </li>
          ))}
        </ol>
      </figcaption>
    </figure>
  );
}
