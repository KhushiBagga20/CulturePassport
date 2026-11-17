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

/** Year markers are as large as the label allows; long, hedged labels stay legible. */
function yearSize(label: string, mobile = false) {
  if (label.length <= 11) return mobile ? "text-4xl" : "text-[3.6rem]";
  if (label.length <= 18) return mobile ? "text-3xl" : "text-[2.6rem]";
  return mobile ? "text-2xl" : "text-[1.9rem]";
}

function gapLabel(years: number) {
  if (years >= 1000) return `≈ ${Math.round(years / 100) / 10}k years`;
  if (years >= 100) return `≈ ${Math.round(years / 50) * 50} years`;
  return `${years} years`;
}

/** Editorial timeline: an overview ruler, a draggable track of milestones, and details on demand. */
export function Timeline({ items, motif }: { items: TimelineItem[]; motif: MotifKey }) {
  const reduce = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const onScroll = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setProgress(el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth));
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
    if (el && card && el.offsetParent) {
      el.scrollTo({ left: card.offsetLeft - 24, behavior: reduce ? "auto" : "smooth" });
      return;
    }
    // Mobile: the vertical list is showing instead of the track.
    document.getElementById(`tlm-${items[i]?.id}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  };

  const first = items[0];
  const last = items[items.length - 1];

  return (
    <div>
      {/* ── Overview ruler: every milestone at a glance, with the gaps between them ── */}
      <div className="mb-8 border-2 border-ink bg-bone px-4 pb-4 pt-3 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="label text-ink">
            {items.length} milestones · {first?.label} → {last?.label}
          </p>
          <p className="label-sm text-ink-mute">Filled: documented · Hollow: disputed, oral or awaiting verification</p>
        </div>
        <ol className="no-scrollbar mt-4 flex items-start overflow-x-auto pb-1" aria-label="Jump to a milestone">
          {items.map((it, i) => {
            const prev = items[i - 1];
            const gap = prev ? it.year - prev.year : 0;
            const uncertain = UNCERTAIN.includes(it.level);
            return (
              <li key={it.id} className="flex shrink-0 items-start">
                {i > 0 && (
                  <span aria-hidden className="relative mt-[11px] flex w-10 flex-col items-center sm:w-14">
                    <span className={`block h-0.5 w-full ${gap > 60 ? "bg-[repeating-linear-gradient(90deg,#1B1616_0_4px,transparent_4px_8px)]" : "bg-ink"}`} />
                    {gap > 60 && <span className="label-sm mt-1.5 whitespace-nowrap text-[0.56rem] text-ink-mute">{gapLabel(gap)}</span>}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => scrollToIndex(i)}
                  aria-current={current === i ? "step" : undefined}
                  aria-label={`${it.label}: ${it.title}`}
                  className="group flex flex-col items-center gap-1 px-0.5"
                >
                  <span
                    className={`block h-6 w-6 rounded-full border-[3px] border-ink transition-transform ${uncertain ? "bg-bone" : "bg-[var(--accent)]"} ${current === i ? "scale-125 ring-4 ring-yellow" : "group-hover:scale-110"}`}
                  />
                  <span className={`font-ui whitespace-nowrap text-[0.7rem] font-bold ${current === i ? "text-ink" : "text-ink-mute"}`}>
                    {it.year < 0 ? `${-it.year} BCE` : `${it.approx ? "c." : ""}${it.year}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* ── Desktop: horizontal, draggable ── */}
      <div className="hidden md:block">
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
            if ((e.target as HTMLElement).closest("button, a")) return;
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
          className={`no-scrollbar relative flex items-start overflow-x-auto pb-4 outline-none focus-visible:ring-4 focus-visible:ring-ink ${dragging ? "cursor-grabbing select-none" : "cursor-grab snap-x snap-mandatory"}`}
        >
          {items.map((it, i) => {
            const prev = items[i - 1];
            const gap = prev ? it.year - prev.year : 0;
            const uncertain = UNCERTAIN.includes(it.level);
            const isOpen = open.has(it.id);
            return (
              <Fragment key={it.id}>
                {gap > 60 && (
                  <div className="flex w-24 shrink-0 flex-col items-center pt-[7.15rem]" aria-label={`${gapLabel(gap)} pass`}>
                    <svg width="96" height="14" viewBox="0 0 96 14" aria-hidden>
                      <path d="M0 7 H32 l4 -6 l6 12 l6 -12 l6 12 l4 -6 H96" fill="none" stroke="#1B1616" strokeWidth="2" />
                    </svg>
                    <span className="label-sm mt-2 text-ink">{gapLabel(gap)}</span>
                  </div>
                )}
                <motion.article
                  data-tl-card
                  initial={reduce ? false : { opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, root: track, amount: 0.3 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="w-[320px] shrink-0 snap-start pr-5 lg:w-[350px]"
                  aria-labelledby={`tl-${it.id}`}
                >
                  <p className={`font-display flex min-h-[6rem] items-end leading-[0.84] ${yearSize(it.label)} ${uncertain ? "text-ink/60" : "text-ink"}`}>{it.label}</p>
                  <div className="relative my-4 h-5" aria-hidden>
                    <span className={`absolute inset-x-0 top-1/2 -translate-y-1/2 ${uncertain ? "h-0 border-t-2 border-dashed border-ink" : "h-1 bg-ink"}`} />
                    <span className={`absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-[3px] border-ink ${uncertain ? "bg-bone" : "bg-[var(--accent)]"}`} />
                  </div>
                  <div className={`bg-bone ${uncertain ? "border-2 border-dashed border-ink" : "print-shadow-sm border-2 border-ink"}`}>
                    {it.media && (
                      <ArchiveImage media={it.media} fallbackMotif={motif} className="aspect-[16/10] w-full border-b-2 border-ink" sizes="350px" width={500} />
                    )}
                    <div className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <EvidenceBadge level={it.level} compact />
                        {it.place && <span className="label-sm text-ink-mute">{it.place}</span>}
                      </div>
                      <h3 id={`tl-${it.id}`} className="font-title mt-2.5 text-[1.55rem] leading-[1.05]">
                        {it.title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => toggle(it.id)}
                        aria-expanded={isOpen}
                        aria-controls={`tl-body-${it.id}`}
                        className="label mt-3 inline-flex items-center gap-2 border-b-2 border-ink pb-0.5 hover:text-brick"
                      >
                        {isOpen ? "Hide details" : "Details & sources"}
                        <span aria-hidden className={`inline-block transition-transform ${isOpen ? "rotate-45" : ""}`}>
                          +
                        </span>
                      </button>
                      <div id={`tl-body-${it.id}`} hidden={!isOpen}>
                        <p className="mt-3 text-[0.93rem] text-ink-soft">{it.body}</p>
                        <SourceList sources={it.sources} />
                      </div>
                    </div>
                  </div>
                </motion.article>
              </Fragment>
            );
          })}
          <div className="w-[20vw] shrink-0" aria-hidden />
        </div>
        <div className="mt-3 flex items-center gap-4">
          <button type="button" onClick={() => scrollToIndex(Math.max(0, current - 1))} className="btn btn-cream" aria-label="Previous milestone">
            ← Earlier
          </button>
          <div className="relative h-1.5 flex-1 bg-ink/15" aria-hidden>
            <span className="absolute inset-y-0 left-0 bg-ink" style={{ width: `${Math.max(4, progress * 100)}%` }} />
          </div>
          <button type="button" onClick={() => scrollToIndex(Math.min(items.length - 1, current + 1))} className="btn btn-ink" aria-label="Next milestone">
            Later →
          </button>
        </div>
      </div>

      {/* ── Mobile: vertical ── */}
      <ol className="relative space-y-7 border-l-4 border-ink pl-6 md:hidden">
        {items.map((it, i) => {
          const prev = items[i - 1];
          const gap = prev ? it.year - prev.year : 0;
          const uncertain = UNCERTAIN.includes(it.level);
          const isOpen = open.has(it.id);
          return (
            <li key={it.id} id={`tlm-${it.id}`} className="relative">
              {gap > 60 && <p className="label-sm -mt-2 mb-4 text-ink">⋯ {gapLabel(gap)} ⋯</p>}
              <span
                aria-hidden
                className={`absolute -left-[37px] top-3 h-5 w-5 rounded-full border-[3px] border-ink ${uncertain ? "bg-bone" : "bg-[var(--accent)]"}`}
              />
              <p className={`font-display leading-[0.9] ${yearSize(it.label, true)} ${uncertain ? "text-ink/60" : "text-ink"}`}>{it.label}</p>
              <div className={`mt-3 bg-bone p-4 ${uncertain ? "border-2 border-dashed border-ink" : "border-2 border-ink"}`}>
                {it.media && (
                  <ArchiveImage media={it.media} fallbackMotif={motif} className="-mx-4 -mt-4 mb-3 aspect-[16/10] border-b-2 border-ink" sizes="100vw" width={500} />
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <EvidenceBadge level={it.level} compact />
                  {it.place && <span className="label-sm text-ink-mute">{it.place}</span>}
                </div>
                <h3 className="font-title mt-2 text-2xl leading-tight">{it.title}</h3>
                <button
                  type="button"
                  onClick={() => toggle(it.id)}
                  aria-expanded={isOpen}
                  aria-controls={`tlm-body-${it.id}`}
                  className="label mt-2 inline-flex items-center gap-2 border-b-2 border-ink pb-0.5"
                >
                  {isOpen ? "Hide details" : "Details & sources"} <span aria-hidden>{isOpen ? "−" : "+"}</span>
                </button>
                <div id={`tlm-body-${it.id}`} hidden={!isOpen}>
                  <p className="mt-2 text-[0.95rem] text-ink-soft">{it.body}</p>
                  <SourceList sources={it.sources} />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="label-sm mt-4 hidden text-ink md:block">Solid line: documented · Dashed: disputed, oral or awaiting verification · Drag, scroll or use ← →</p>
    </div>
  );
}

function SourceList({ sources }: { sources: TimelineItem["sources"] }) {
  if (!sources.length) return null;
  return (
    <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-ink/20 pt-2">
      {sources.map((s) => (
        <a key={s.id} href={`#source-${s.id}`} className="font-ui text-[0.7rem] font-semibold text-brick no-underline hover:underline" title={s.title}>
          [{s.n}] {s.title.length > 38 ? `${s.title.slice(0, 36)}…` : s.title}
        </a>
      ))}
    </p>
  );
}
