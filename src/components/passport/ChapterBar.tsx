"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

export interface ChapterLink {
  id: string;
  n: string;
  label: string;
}

/**
 * Sticky chapter navigation with scroll-spy.
 * Desktop: a horizontal bar of every chapter. Mobile: a compact selector with previous/next.
 */
export function ChapterBar({
  chapters,
  passportNo,
  back,
}: {
  chapters: ChapterLink[];
  passportNo: string;
  back?: { href: string; label: string };
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(chapters[0]?.id);
  const [progress, setProgress] = useState(0);
  const [menu, setMenu] = useState(false);
  const rail = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const els = chapters.map((c) => document.getElementById(c.id)).filter((e): e is HTMLElement => !!e);
    let frame = 0;
    const update = () => {
      frame = 0;
      const first = els[0];
      const last = els[els.length - 1];
      if (first && last) {
        const start = first.getBoundingClientRect().top + window.scrollY - 140;
        const end = last.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
        setProgress(Math.min(1, Math.max(0, (window.scrollY - start) / Math.max(1, end - start))));
      }
      const line = Math.min(260, window.innerHeight * 0.32);
      let current = els[0]?.id;
      for (const el of els) if (el.getBoundingClientRect().top <= line) current = el.id;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [chapters]);

  // Keep the active chapter visible when the desktop bar overflows.
  useEffect(() => {
    const el = rail.current?.querySelector<HTMLElement>(`[data-chapter="${active}"]`);
    const box = rail.current;
    if (!el || !box || box.scrollWidth <= box.clientWidth) return;
    box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const go = (e: React.MouseEvent, id: string) => {
    const el = document.getElementById(id);
    if (!el || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    setMenu(false);
    history.replaceState(null, "", `#${id}`);
    // Move focus to the chapter for keyboard and screen-reader users. Focus before scrolling:
    // in Chrome, moving focus cancels a smooth scroll already in progress.
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const i = Math.max(0, chapters.findIndex((c) => c.id === active));
  const cur = chapters[i];
  const prev = chapters[i - 1];
  const next = chapters[i + 1];

  return (
    <nav aria-label="Passport chapters" className="no-print sticky top-14 z-30 border-b-2 border-ink bg-ink text-bone">
      {/* Desktop */}
      {/* Spans the full screen width; every chapter gets an equal share, so none is ever cut off. */}
      <div className="hidden w-full items-stretch lg:flex">
        <span className="label flex shrink-0 items-center border-r border-bone/20 px-4 text-yellow xl:px-6">No. {passportNo}</span>
        <ol ref={rail} className="grid min-w-0 flex-1 grid-cols-6">
          {chapters.map((c) => {
            const on = active === c.id;
            return (
              <li key={c.id} data-chapter={c.id} className="min-w-0 border-r border-bone/15 last:border-r-0">
                <a
                  href={`#${c.id}`}
                  onClick={(e) => go(e, c.id)}
                  aria-current={on ? "location" : undefined}
                  className={`flex h-full min-h-12 items-center gap-2 px-3 py-2 font-ui text-[0.68rem] font-bold uppercase leading-tight tracking-[0.03em] no-underline transition-colors xl:px-4 xl:text-[0.72rem] ${on ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "text-bone/75 hover:bg-bone/10 hover:text-bone"}`}
                >
                  <span className={on ? "" : "text-yellow"}>{c.n}</span>
                  {c.label}
                </a>
              </li>
            );
          })}
        </ol>
        {back && (
          <Link href={back.href} className="label flex shrink-0 items-center gap-2 border-l border-bone/20 px-4 text-bone/80 hover:text-yellow xl:px-6">
            <span aria-hidden>←</span> {back.label}
          </Link>
        )}
      </div>

      {/* Mobile / tablet */}
      <div className="flex items-stretch lg:hidden">
        <button
          type="button"
          onClick={() => setMenu((m) => !m)}
          aria-expanded={menu}
          aria-controls="chapter-menu"
          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left sm:px-6"
        >
          <span className="font-display shrink-0 text-2xl leading-none text-yellow">{cur?.n}</span>
          <span className="min-w-0">
            <span className="label-sm block text-bone/60">
              Chapter {i + 1} of {chapters.length} · No. {passportNo}
            </span>
            <span className="block truncate font-ui text-[0.8rem] font-bold uppercase tracking-[0.08em]">{cur?.label}</span>
          </span>
          <span aria-hidden className={`ml-auto shrink-0 text-lg transition-transform ${menu ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>
        <a
          href={prev ? `#${prev.id}` : undefined}
          onClick={(e) => prev && go(e, prev.id)}
          aria-disabled={!prev}
          aria-label={prev ? `Previous chapter: ${prev.label}` : "No previous chapter"}
          className={`flex w-11 items-center justify-center border-l border-bone/20 text-lg ${prev ? "" : "pointer-events-none opacity-30"}`}
        >
          ↑
        </a>
        <a
          href={next ? `#${next.id}` : undefined}
          onClick={(e) => next && go(e, next.id)}
          aria-disabled={!next}
          aria-label={next ? `Next chapter: ${next.label}` : "No next chapter"}
          className={`flex w-11 items-center justify-center border-l border-bone/20 text-lg ${next ? "" : "pointer-events-none opacity-30"}`}
        >
          ↓
        </a>
      </div>
      {menu && (
        <div id="chapter-menu" className="border-t border-bone/20 bg-ink lg:hidden">
          <ol>
            {chapters.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  onClick={(e) => go(e, c.id)}
                  aria-current={active === c.id ? "location" : undefined}
                  className={`flex items-baseline gap-3 border-b border-bone/10 px-4 py-3 no-underline sm:px-6 ${active === c.id ? "bg-[var(--accent)] text-[var(--accent-ink)]" : ""}`}
                >
                  <span className={`font-display text-xl ${active === c.id ? "" : "text-yellow"}`}>{c.n}</span>
                  <span className="font-ui text-sm font-bold uppercase tracking-[0.08em]">{c.label}</span>
                </a>
              </li>
            ))}
          </ol>
          {back && (
            <Link href={back.href} className="label flex items-center gap-2 px-4 py-3 text-yellow sm:px-6">
              <span aria-hidden>←</span> {back.label}
            </Link>
          )}
        </div>
      )}
      <span aria-hidden className="block h-1 bg-bone/10">
        <span className="block h-full bg-yellow transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
      </span>
    </nav>
  );
}
