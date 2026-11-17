"use client";

import { useEffect, useState } from "react";

export interface ChapterLink {
  id: string;
  n: string;
  label: string;
}

/** Sticky chapter navigation with scroll-spy: a vertical rail on desktop, a chip bar on mobile. */
export function ChapterRail({ chapters, passportNo }: { chapters: ChapterLink[]; passportNo: string }) {
  const [active, setActive] = useState(chapters[0]?.id);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const els = chapters.map((c) => document.getElementById(c.id)).filter((e): e is HTMLElement => !!e);
    let frame = 0;
    const update = () => {
      frame = 0;
      const h = document.documentElement;
      setProgress(Math.min(1, h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)));
      const line = window.innerHeight * 0.32;
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

  return (
    <>
      {/* Desktop rail */}
      <nav aria-label="Passport chapters" className="no-print sticky top-24 hidden self-start xl:block">
        <p className="label-sm text-ink-mute">Passport No. {passportNo}</p>
        <div className="relative mt-4 pl-4">
          <span className="absolute left-0 top-0 h-full w-px bg-ink/15" aria-hidden />
          <span className="absolute left-0 top-0 w-px bg-[var(--accent)] transition-[height] duration-300" style={{ height: `${progress * 100}%` }} aria-hidden />
          <ol className="space-y-3">
            {chapters.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  aria-current={active === c.id ? "location" : undefined}
                  className={`group flex items-baseline gap-3 no-underline transition-colors ${active === c.id ? "text-ink" : "text-ink-mute hover:text-ink"}`}
                >
                  <span className={`font-mono text-[0.7rem] ${active === c.id ? "text-[var(--accent)]" : ""}`}>{c.n}</span>
                  <span className="label">{c.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </nav>

      {/* Mobile / tablet chip bar */}
      <nav aria-label="Passport chapters" className="no-print sticky top-14 z-30 -mx-4 border-b rule bg-ivory/95 backdrop-blur-sm sm:-mx-6 xl:hidden">
        <ol className="no-scrollbar flex gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {chapters.map((c) => (
            <li key={c.id} className="shrink-0">
              <a
                href={`#${c.id}`}
                aria-current={active === c.id ? "location" : undefined}
                className={`label-sm flex items-center gap-1.5 rounded-full border px-3 py-1.5 no-underline ${active === c.id ? "border-ink bg-ink text-ivory" : "border-ink/20 text-ink-soft"}`}
              >
                <span className="font-mono">{c.n}</span> {c.label}
              </a>
            </li>
          ))}
        </ol>
        <span className="block h-0.5 bg-[var(--accent)] transition-[width] duration-300" style={{ width: `${progress * 100}%` }} aria-hidden />
      </nav>
    </>
  );
}
