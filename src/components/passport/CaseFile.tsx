import type { CaseStudy, MediaAsset, MotifKey } from "@/lib/types";
import { EvidenceBadge, SourceMarks } from "@/components/site/Evidence";
import { CompareSlider } from "./CompareSlider";
import { Reveal } from "@/components/site/Motion";

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
  return (
    <article aria-labelledby={`case-${c.id}`} className="relative mt-16 bg-ink text-ivory">
      <div className="strip-weave" />
      <div className="px-5 py-10 sm:px-10 sm:py-14">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="label text-mustard">Case file {c.code}</p>
            <h3 id={`case-${c.id}`} className="font-display mt-3 text-[clamp(2.6rem,6vw,5.2rem)]">
              {c.title}
            </h3>
          </div>
          <div className="accession max-w-xs bg-ivory p-4 text-ink">
            <p className="label-sm text-ink-mute">Status</p>
            <p className="mt-1 text-sm">{c.status}</p>
            <p className="label-sm mt-3 text-ink-mute">Parties</p>
            <p className="mt-1 text-sm">{c.parties.join(" · ")}</p>
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-lg text-ivory/85">{c.summary}</p>

        {/* Chronology */}
        <ol className="mt-12 grid gap-0 border-t border-ivory/20 md:grid-cols-3 lg:grid-cols-6">
          {c.events.map((e, i) => (
            <Reveal as="li" key={e.id} delay={i * 0.05} className="relative border-b border-ivory/15 py-5 md:border-b-0 md:border-r md:px-4 md:first:pl-0 md:last:border-r-0">
              <span className="font-mono text-xs text-mustard">0{i + 1}</span>
              <p className="label-sm mt-2 text-ivory/60">{e.date.label}</p>
              <p className="font-serif mt-2 text-xl leading-tight">{e.title}</p>
              <p className="mt-2 text-sm text-ivory/75">
                {e.body}
                <SourceMarks ids={e.sources} numbering={numbering} />
              </p>
            </Reveal>
          ))}
        </ol>

        {/* Comparison */}
        {c.comparison && (
          <div className="mt-14 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="label text-mustard">Interactive comparison</p>
              <p className="font-serif mt-3 text-3xl leading-tight">Side by side — with the credits showing.</p>
              <p className="mt-3 text-sm text-ivory/70">
                The left side is a museum object photographed under a public-domain licence. We have not licensed runway photography, so we will not
                reproduce it; the right side says so rather than showing a look-alike.
              </p>
            </div>
            <div className="text-ink lg:col-span-8">
              <CompareSlider
                motif={motif}
                traditional={{
                  title: c.comparison.traditional.title,
                  points: c.comparison.traditional.points,
                  media: c.comparison.traditional.media ? media.get(c.comparison.traditional.media) : undefined,
                }}
                adaptation={{
                  title: c.comparison.adaptation.title,
                  points: c.comparison.adaptation.points,
                  media: c.comparison.adaptation.media ? media.get(c.comparison.adaptation.media) : undefined,
                  mediaNote: c.comparison.adaptation.mediaNote,
                }}
              />
            </div>
          </div>
        )}

        {/* What travelled, and what was left behind? */}
        <div className="mt-16">
          <h4 className="font-serif text-[clamp(2rem,4vw,3.4rem)] leading-tight">
            What travelled, <em className="text-mustard">and what was left behind?</em>
          </h4>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="border border-ivory/25 p-6">
              <p className="label text-ivory/60">What travelled</p>
              <ul className="mt-4 space-y-2">
                {c.travelled.map((x) => (
                  <li key={x} className="font-display text-2xl">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-2 border-dashed border-mustard/70 p-6">
              <p className="label text-mustard">What was left behind</p>
              <ul className="mt-4 space-y-2">
                {c.leftBehind.map((x) => (
                  <li key={x} className="font-display text-2xl text-mustard">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="mt-14 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="label text-mustard">Six questions</p>
            <p className="mt-3 text-sm text-ivory/70">
              The same questions we will ask of every case — so that {traditionName} is judged by a method, not by a mood.
            </p>
          </div>
          <div className="divide-y divide-ivory/15 border-y border-ivory/15 lg:col-span-8">
            {c.questions.map((q, i) => (
              <details key={q.q} className="group py-4" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-baseline gap-4">
                  <span className="font-mono text-xs text-mustard">Q{i + 1}</span>
                  <span className="font-serif flex-1 text-2xl leading-tight">{q.q}</span>
                  <span aria-hidden className="text-mustard transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="mt-3 pl-9">
                  <p className="text-ivory/85">
                    {q.a}
                    <SourceMarks ids={q.sources} numbering={numbering} />
                  </p>
                  <div className="mt-2">
                    <EvidenceBadge level={q.level} className="bg-ivory" />
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>

        {c.legalNote && (
          <aside className="mt-12 border-l-4 border-mustard bg-ivory/5 p-6">
            <p className="label text-mustard">A note on the law</p>
            <p className="mt-2 max-w-3xl text-ivory/85">
              {c.legalNote.text}
              <SourceMarks ids={c.legalNote.sources} numbering={numbering} />
            </p>
          </aside>
        )}

        {c.openQuestions.length > 0 && (
          <div className="mt-12">
            <p className="label text-ivory/60">Still open</p>
            <ul className="mt-3 space-y-2 text-ivory/80">
              {c.openQuestions.map((q) => (
                <li key={q} className="flex gap-3">
                  <span aria-hidden className="text-mustard">?</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
