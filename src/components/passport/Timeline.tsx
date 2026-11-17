"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { EvidenceLevel, MediaAsset, MotifKey } from "@/lib/types";
import { EvidenceBadge } from "@/components/site/Evidence";
import { ArchiveImage } from "@/components/site/ArchiveImage";

export interface TimelineItem {
  id: string;
  year: number;
  label: string;
  approx: boolean;
  title: string;
  body: string;
  level: EvidenceLevel;
  place?: string;
  tag?: string;
  media?: MediaAsset;
  sources: { n: number; id: string; title: string }[];
}

const UNCERTAIN: EvidenceLevel[] = ["disputed", "unverified", "community"];

function gapLabel(years: number) {
  if (years >= 1000) return `≈ ${Math.round(years / 100) / 10}k years`;
  if (years >= 100) return `≈ ${Math.round(years / 50) * 50} years`;
  return `${years} years`;
}

export function Timeline({ items, motif }: { items: TimelineItem[]; motif: MotifKey }) {
  const reduce = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [current, setCurrent] = useState(0);

  const onScroll = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const p = el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth);
    setProgress(p);
    const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-tl-card]"));
    const mid = el.scrollLeft + el.clientWidth * 0.35;
    let idx = 0;
    cards.forEach((c, i) => {
      if (c.offsetLeft <= mid) idx = i;
    });
    setCurrent(idx);
  }, []);

  useEffect(() => {
    onScroll();
  }, [onScroll]);

  const scrollToIndex = (i: number) => {
    const el = track.current;
    const card = el?.querySelectorAll<HTMLElement>("[data-tl-card]")[i];
    if (el && card) el.scrollTo({ left: card.offsetLeft - 24, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div>
      {/* ── Desktop: horizontal, draggable ── */}
      <div className="hidden md:block">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Jump to a milestone">
            {items.map((it, i) => (
              <button
                key={it.id}
                type="button"
                role="tab"
                aria-selected={current === i}
                onClick={() => scrollToIndex(i)}
                className={`font-mono rounded-full border px-2.5 py-1 text-[0.7rem] transition-colors ${current === i ? "border-ink bg-ink text-ivory" : "border-ink/20 text-ink-soft hover:border-ink"}`}
              >
                {it.approx ? "c. " : ""}
                {it.year < 0 ? `${-it.year} BCE` : it.year}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => scrollToIndex(Math.max(0, current - 1))} className="label-sm rounded-full border rule px-3 py-1.5 hover:border-ink" aria-label="Previous milestone">
              ← Earlier
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex(Math.min(items.length - 1, current + 1))}
              className="label-sm rounded-full border rule px-3 py-1.5 hover:border-ink"
              aria-label="Next milestone"
            >
              Later →
            </button>
          </div>
        </div>

        <div
          ref={track}
          tabIndex={0}
          role="region"
          aria-label="Timeline — drag, scroll or use the arrow keys"
          onScroll={onScroll}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              scrollToIndex(Math.min(items.length - 1, current + 1));
            }
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              scrollToIndex(Math.max(0, current - 1));
            }
          }}
          onPointerDown={(e) => {
            if (e.pointerType !== "mouse" || !track.current) return;
            drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d || !track.current) return;
            const dx = e.clientX - d.x;
            if (Math.abs(dx) > 4) {
              d.moved = true;
              setDragging(true);
            }
            track.current.scrollLeft = d.left - dx;
          }}
          onPointerUp={() => {
            drag.current = null;
            setTimeout(() => setDragging(false), 0);
          }}
          onPointerLeave={() => {
            drag.current = null;
            setDragging(false);
          }}
          onClickCapture={(e) => {
            if (dragging) e.preventDefault();
          }}
          className={`no-scrollbar relative flex overflow-x-auto pb-6 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${dragging ? "cursor-grabbing select-none" : "cursor-grab snap-x snap-mandatory"}`}
        >
          {items.map((it, i) => {
            const prev = items[i - 1];
            const gap = prev ? it.year - prev.year : 0;
            const uncertain = UNCERTAIN.includes(it.level);
            return (
              <Fragment key={it.id}>
                {gap > 60 && (
                  <div className="flex w-28 shrink-0 flex-col items-center pt-[3.35rem]" aria-label={`${gapLabel(gap)} pass`}>
                    <svg width="112" height="14" viewBox="0 0 112 14" aria-hidden>
                      <path d="M0 7 H40 l4 -6 l6 12 l6 -12 l6 12 l4 -6 H112" fill="none" stroke="#211C19" strokeOpacity="0.45" strokeWidth="1.3" />
                    </svg>
                    <span className="label-sm mt-2 text-ink-mute">{gapLabel(gap)}</span>
                  </div>
                )}
                <motion.article
                  data-tl-card
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, root: track, amount: 0.3 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="w-[340px] shrink-0 snap-start pr-6 lg:w-[380px]"
                  aria-labelledby={`tl-${it.id}`}
                >
                  <p className={`font-display text-5xl leading-none ${uncertain ? "text-ink-mute" : "text-[var(--accent)]"}`}>{it.label}</p>
                  <div className="relative my-4 h-4" aria-hidden>
                    <span className={`absolute inset-x-0 top-1/2 h-px ${uncertain ? "border-t border-dashed border-ink/40" : "bg-ink/40"}`} />
                    <span
                      className={`absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-[var(--accent)] ${uncertain ? "bg-ivory" : "bg-[var(--accent)]"}`}
                    />
                  </div>
                  <div className={`h-full p-5 ${uncertain ? "border border-dashed border-ink/35" : "paper-card"}`}>
                    {it.media && (
                      <ArchiveImage media={it.media} fallbackMotif={motif} className="mb-4 aspect-[4/3] w-full" sizes="380px" width={500} showCredit />
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <EvidenceBadge level={it.level} />
                      {it.place && <span className="label-sm text-ink-mute">{it.place}</span>}
                    </div>
                    <h3 id={`tl-${it.id}`} className="font-serif mt-3 text-[1.7rem] leading-tight">
                      {it.title}
                    </h3>
                    <p className="mt-2 text-[0.95rem] text-ink-soft">{it.body}</p>
                    <SourceList sources={it.sources} />
                  </div>
                </motion.article>
              </Fragment>
            );
          })}
          <div className="w-[20vw] shrink-0" aria-hidden />
        </div>
        <div className="relative h-0.5 bg-ink/10" aria-hidden>
          <span className="absolute inset-y-0 left-0 bg-[var(--accent)]" style={{ width: `${Math.max(4, progress * 100)}%` }} />
        </div>
        <p className="label-sm mt-3 text-ink-mute">Drag, scroll or use ← → · dashed entries are disputed, oral or awaiting verification</p>
      </div>

      {/* ── Mobile: vertical ── */}
      <ol className="relative space-y-8 border-l border-ink/25 pl-6 md:hidden">
        {items.map((it, i) => {
          const prev = items[i - 1];
          const gap = prev ? it.year - prev.year : 0;
          const uncertain = UNCERTAIN.includes(it.level);
          return (
            <li key={it.id} className="relative">
              {gap > 60 && <p className="label-sm -mt-3 mb-5 text-ink-mute">⋯ {gapLabel(gap)} ⋯</p>}
              <span
                aria-hidden
                className={`absolute -left-[33px] top-2 h-4 w-4 rounded-full border-2 border-[var(--accent)] ${uncertain ? "bg-ivory" : "bg-[var(--accent)]"}`}
              />
              <p className={`font-display text-4xl leading-none ${uncertain ? "text-ink-mute" : "text-[var(--accent)]"}`}>{it.label}</p>
              <div className={`mt-3 p-4 ${uncertain ? "border border-dashed border-ink/35" : "paper-card"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <EvidenceBadge level={it.level} />
                  {it.place && <span className="label-sm text-ink-mute">{it.place}</span>}
                </div>
                <h3 className="font-serif mt-2 text-2xl leading-tight">{it.title}</h3>
                <p className="mt-1.5 text-[0.95rem] text-ink-soft">{it.body}</p>
                <SourceList sources={it.sources} />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function SourceList({ sources }: { sources: TimelineItem["sources"] }) {
  if (!sources.length) return null;
  return (
    <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t rule pt-2">
      {sources.map((s) => (
        <a key={s.id} href={`#source-${s.id}`} className="font-mono text-[0.68rem] text-ink-mute no-underline hover:text-terracotta" title={s.title}>
          [{s.n}] {s.title.length > 38 ? `${s.title.slice(0, 36)}…` : s.title}
        </a>
      ))}
    </p>
  );
}
