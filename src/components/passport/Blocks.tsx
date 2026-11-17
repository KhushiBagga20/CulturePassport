import type { Claim, EvidenceLevel, MediaAsset, MotifKey, TextBlock } from "@/lib/types";
import { EvidenceBadge, SourceMarks } from "@/components/site/Evidence";
import { ArchiveImage } from "@/components/site/ArchiveImage";

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

export function Blocks({ blocks, ctx, large = false }: { blocks: TextBlock[]; ctx: BlockContext; large?: boolean }) {
  return (
    <div className="space-y-7">
      {blocks.map((b, i) => {
        if (b.type === "p") {
          const m = claimMeta(b.claims, ctx);
          return (
            <div key={i} className="group relative">
              <p className={`max-w-[64ch] text-pretty ${large ? "text-[1.18rem] leading-[1.7]" : ""}`}>
                {b.text}
                <SourceMarks ids={m.sources} numbering={ctx.numbering} />
              </p>
              {m.levels.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.levels.map((l) => (
                    <a key={l} href={`#claim-${m.claims.find((c) => c.level === l)?.id}`} className="no-underline">
                      <EvidenceBadge level={l} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        }
        if (b.type === "pull") {
          return (
            <blockquote key={i} className="relative my-10 border-l-4 border-[var(--accent)] py-1 pl-6">
              <p className="font-serif text-[clamp(1.7rem,3vw,2.5rem)] italic leading-[1.12] text-ink">{b.text}</p>
              {b.attribution && <footer className="label-sm mt-3 text-ink-mute">— {b.attribution}</footer>}
            </blockquote>
          );
        }
        if (b.type === "note") {
          const m = claimMeta(b.claims, ctx);
          return (
            <aside key={i} className="accession relative max-w-[64ch] p-5">
              <span aria-hidden className="absolute -left-px -top-px h-3 w-3 border-l-2 border-t-2 border-[var(--accent)]" />
              <span aria-hidden className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-[var(--accent)]" />
              <p className="label text-[var(--accent)]">Archive note · {b.title}</p>
              <p className="mt-2 text-[0.97rem] text-ink-soft">
                {b.text}
                <SourceMarks ids={m.sources} numbering={ctx.numbering} />
              </p>
              {m.levels.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.levels.map((l) => (
                    <EvidenceBadge key={l} level={l} />
                  ))}
                </div>
              )}
            </aside>
          );
        }
        const media = ctx.media.get(b.media);
        if (!media) return null;
        return (
          <figure key={i} className="my-10">
            <ArchiveImage
              media={media}
              fallbackMotif={ctx.motif}
              className="aspect-[4/3] w-full max-w-[64ch] sm:aspect-[16/10]"
              sizes="(min-width:1024px) 45vw, 100vw"
              cover={media.kind !== "archival"}
            />
            <figcaption className="mt-2 max-w-[64ch] text-sm text-ink-mute">{media.caption}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}

export function ChapterHeading({ n, id, title, kicker, intro }: { n: string; id: string; title: string; kicker: string; intro?: string }) {
  return (
    <header className="relative mb-12 grid gap-4 border-t-2 border-ink pt-6 sm:grid-cols-[auto_1fr] sm:gap-10">
      <span aria-hidden className="font-display text-[clamp(5rem,13vw,10rem)] leading-[0.78] text-[var(--accent)]">
        {n}
      </span>
      <div className="self-end">
        <p className="label text-ink-mute">Chapter {n} · {kicker}</p>
        <h2 id={id} className="font-serif mt-2 text-[clamp(2.4rem,5.4vw,4.6rem)] leading-[0.98] balance">
          {title}
        </h2>
        {intro && <p className="mt-4 max-w-2xl text-ink-soft">{intro}</p>}
      </div>
    </header>
  );
}
