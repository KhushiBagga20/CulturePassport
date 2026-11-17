"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

export interface DrawerSource {
  id: string;
  n: number;
  title: string;
  publisher: string;
  author?: string;
  date: string;
  type: string;
  url: string;
  accessed: string;
  notes?: string;
  supports: string[];
}

/** Asks filterable lists to show everything, so a target that was filtered out can be revealed. */
export const RESET_FILTERS_EVENT = "cp:reset-filters";

/** Opens any folded <details> around an element, then scrolls to it and focuses it. */
function reveal(id: string, smooth: boolean) {
  const el = document.getElementById(id);
  if (!el) return false;
  let d = el.closest("details");
  while (d) {
    d.open = true;
    d = d.parentElement?.closest("details") ?? null;
  }
  // Focus first: in Chrome, moving focus cancels a smooth scroll already in progress.
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
  el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "center" });
  return true;
}

function revealSoon(id: string, smooth: boolean) {
  if (reveal(id, smooth)) return;
  window.dispatchEvent(new CustomEvent(RESET_FILTERS_EVENT));
  requestAnimationFrame(() => requestAnimationFrame(() => reveal(id, smooth)));
}

/**
 * Citation markers ([n]) open this drawer instead of jumping away from the text being read.
 * "Show in Sources & References" still takes the reader to the full library entry.
 * Modified clicks (new tab, etc.) keep the browser's normal behaviour.
 */
export function SourceDrawer({ sources }: { sources: DrawerSource[] }) {
  const reduce = useReducedMotion();
  const [id, setId] = useState<string | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const byId = new Map(sources.map((s) => [s.id, s]));
  const s = id ? byId.get(id) : undefined;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#source-"]');
      if (!a || a.dataset.jump !== undefined) return;
      const target = a.getAttribute("href")!.slice("#source-".length);
      e.preventDefault();
      returnFocus.current = a;
      setId(target);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setId(null);
    };
    // Deep links and in-page links to folded entries (#source-…, #claim-…) still land on them.
    const onHash = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      if (h.startsWith("source-") || h.startsWith("claim-")) revealSoon(h, false);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", onHash);
    const first = setTimeout(onHash, 60);
    return () => {
      clearTimeout(first);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  useEffect(() => {
    if (id) heading.current?.focus();
  }, [id]);

  const close = () => {
    setId(null);
    returnFocus.current?.focus();
  };

  const showInLibrary = () => {
    if (!s) return;
    setId(null);
    history.replaceState(null, "", `#source-${s.id}`);
    revealSoon(`source-${s.id}`, !reduce);
  };

  if (!s) return null;
  return (
    <>
      <button type="button" aria-label="Close source" onClick={close} className="no-print fixed inset-0 z-[55] cursor-default bg-ink/25" />
      <aside
        role="dialog"
        aria-modal="false"
        aria-labelledby="drawer-title"
        className="no-print fixed inset-x-0 bottom-0 z-[56] max-h-[78svh] overflow-y-auto border-t-4 border-ink bg-bone sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[430px] sm:border-4"
        style={{ animation: reduce ? undefined : "drawer-in .28s cubic-bezier(.16,1,.3,1) both" }}
      >
        <div className="flex items-center justify-between gap-3 bg-ink px-5 py-3 text-bone">
          <span className="font-display text-2xl text-yellow">[{s.n}]</span>
          <span className="label-sm text-bone/70">{s.type}</span>
          <button type="button" onClick={close} className="label ml-auto border border-bone/40 px-3 py-1.5 hover:bg-bone hover:text-ink">
            Close
          </button>
        </div>
        <div className="p-5">
          <h2 id="drawer-title" ref={heading} tabIndex={-1} className="font-title text-2xl leading-tight outline-none">
            {s.title}
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            {s.author ? `${s.author} · ` : ""}
            {s.publisher} · {s.date}
          </p>
          {s.supports.length > 0 && (
            <div className="mt-4">
              <p className="label-sm text-ink-mute">Supports</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {s.supports.map((x) => (
                  <li key={x} className="border border-ink/25 px-2 py-0.5 text-xs">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {s.notes && <p className="mt-4 border-l-4 border-yellow pl-3 text-sm text-ink-soft">{s.notes}</p>}
          <p className="label-sm mt-4 text-ink-mute">Checked {s.accessed}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={s.url} target="_blank" rel="noreferrer" className="btn btn-ink">
              Open source ↗
            </a>
            <button type="button" onClick={showInLibrary} className="btn btn-cream">
              Show in Sources &amp; References
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
