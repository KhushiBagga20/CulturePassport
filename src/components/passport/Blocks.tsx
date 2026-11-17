import type { Claim, EvidenceLevel, MediaAsset, MotifKey, TextBlock } from "@/lib/types";
import { EvidenceBadge, SourceMarks } from "@/components/site/Evidence";
import { ArchiveImage } from "@/components/site/ArchiveImage";
import { More } from "./More";

export interface BlockContext {
  claims: Map<string, Claim>;
  numbering: Map<string, number>;
  media: Map<string, MediaAsset>;
  motif: MotifKey;
}

function claimMeta(ids: string[] | undefined, ctx: BlockContext) {
  const claims = (ids ?? []).map((id) => ctx.claims.get(id)).filter((c): c is Claim => !!c);
  const sources = Array.from(new Set(claims.flatMap((c) => c.sources)));
  const levels = Array.from(new Set(claims.map((c) => c.level))) as EvidenceLevel[];
  return { claims, sources, levels };
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * Renders editorial text blocks. With `progressive`, the lead paragraph and every image and
 * pull quote stay visible, and the remaining paragraphs and notes fold into "Keep reading".
 * Nothing is removed; it is only disclosed on request.
 */
export function Blocks({
  blocks,
  ctx,
  large = false,
  progressive = false,
  tone = "light",
}: {
  blocks: TextBlock[];
  ctx: BlockContext;
  large?: boolean;
  progressive?: boolean;
  tone?: "light" | "dark";
}) {
  if (!progressive) {
    return (
      <div className="space-y-7">
        {blocks.map((b, i) => (
          <Block key={i} b={b} ctx={ctx} large={large} tone={tone} />
        ))}
      </div>
    );
  }
  const leadIndex = blocks.findIndex((b) => b.type === "p");
  const shown = blocks.filter((b, i) => i === leadIndex || b.type === "pull" || b.type === "figure");
  const rest = blocks.filter((b, i) => i !== leadIndex && (b.type === "p" || b.type === "note"));
  const paras = rest.filter((b) => b.type === "p").length;
  const notes = rest.filter((b) => b.type === "note").length;
  const summary = [paras && plural(paras, "more paragraph"), notes && plural(notes, "archive note")].filter(Boolean).join(" and ");
  return (
    <div className="space-y-7">
      {shown.map((b, i) => (
        <Block key={i} b={b} ctx={ctx} large={large && b.type === "p"} lead={b.type === "p"} tone={tone} />
      ))}
      {rest.length > 0 && (
        <More label="Keep reading" detail={summary} tone={tone}>
          <div className="space-y-7 pt-2">
            {rest.map((b, i) => (
              <Block key={i} b={b} ctx={ctx} tone={tone} />
            ))}
          </div>
        </More>
      )}
    </div>
  );
}

function Block({ b, ctx, large = false, lead = false, tone }: { b: TextBlock; ctx: BlockContext; large?: boolean; lead?: boolean; tone: "light" | "dark" }) {
  const soft = tone === "dark" ? "opacity-85" : "text-ink-soft";
  if (b.type === "p") {
    const m = claimMeta(b.claims, ctx);
    return (
      <div className="group relative">
        <p className={`max-w-[62ch] text-pretty ${lead ? "lead" : ""} ${large && !lead ? "text-[1.12rem] leading-[1.7]" : ""}`}>
          {b.text}
          <SourceMarks ids={m.sources} numbering={ctx.numbering} />
        </p>
        {m.levels.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.levels.map((l) => (
              <a key={l} href={`#claim-${m.claims.find((c) => c.level === l)?.id}`} data-jump className="no-underline">
                <EvidenceBadge level={l} compact className={tone === "dark" ? "bg-bone" : ""} />
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }
  if (b.type === "pull") {
    return (
      <blockquote className="relative my-10 max-w-[30ch]">
        <span aria-hidden className="font-display absolute -left-1 -top-8 text-[4.8rem] leading-none text-[var(--accent)] opacity-90">
          &ldquo;
        </span>
        <p className="font-display relative text-[clamp(1.56rem,3.12vw,2.58rem)] leading-[0.95]">{b.text}</p>
        {b.attribution && <footer className={`label-sm mt-3 ${soft}`}>— {b.attribution}</footer>}
      </blockquote>
    );
  }
  if (b.type === "note") {
    const m = claimMeta(b.claims, ctx);
    return (
      <aside className="relative max-w-[62ch] border-2 border-ink bg-bone p-5 text-ink">
        <span aria-hidden className="tab-down absolute -top-0.5 right-6 h-4 w-6 bg-[var(--accent)]" />
        <p className="label text-[var(--accent-text)]">Archive note · {b.title}</p>
        <p className="mt-2 text-[0.97rem] text-ink-soft">
          {b.text}
          <SourceMarks ids={m.sources} numbering={ctx.numbering} />
        </p>
        {m.levels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {m.levels.map((l) => (
              <EvidenceBadge key={l} level={l} compact />
            ))}
          </div>
        )}
      </aside>
    );
  }
  const media = ctx.media.get(b.media);
  if (!media) return null;
  return (
    <figure className="my-10">
      <div className="print-shadow-sm max-w-[62ch] border-2 border-ink" style={{ ["--shadow-color" as string]: "var(--accent)" }}>
        <ArchiveImage
          media={media}
          fallbackMotif={ctx.motif}
          className="aspect-[4/3] w-full sm:aspect-[16/10]"
          sizes="(min-width:1024px) 45vw, 100vw"
          cover={media.kind !== "archival"}
        />
      </div>
      <figcaption className={`mt-3 max-w-[62ch] text-sm ${soft}`}>{media.caption}</figcaption>
    </figure>
  );
}

/** Poster-like chapter opener: an oversized number, a condensed title and a one-line kicker. */
export function ChapterHeading({
  n,
  id,
  title,
  kicker,
  intro,
  tone = "light",
}: {
  n: string;
  id: string;
  title: string;
  kicker: string;
  intro?: string;
  tone?: "light" | "dark" | "accent";
}) {
  const num = tone === "light" ? "text-[var(--accent)]" : tone === "accent" ? "text-ink" : "text-yellow";
  const kick = tone === "light" ? "text-ink-mute" : "opacity-80";
  return (
    <header className="relative mb-12 grid items-end gap-x-8 gap-y-3 sm:grid-cols-[auto_1fr] lg:mb-16">
      <span aria-hidden className={`font-display text-[clamp(4.68rem,11.7vw,9.5rem)] leading-[0.74] ${num}`}>
        {n}
      </span>
      <div className="pb-1">
        <p className={`label ${kick}`}>
          Chapter {n} · {kicker}
        </p>
        <h2 id={id} className="font-display mt-2 text-[clamp(2.26rem,5.46vw,4.71rem)]">
          {title}
        </h2>
        {intro && <p className={`mt-4 max-w-2xl ${tone === "light" ? "text-ink-soft" : "opacity-90"}`}>{intro}</p>}
      </div>
    </header>
  );
}
