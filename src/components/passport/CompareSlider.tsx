"use client";

import { useRef, useState } from "react";
import type { MediaAsset, MotifKey } from "@/lib/types";
import { mediaUrl } from "@/lib/media";
import { Motif } from "@/components/motifs/Motif";

interface Side {
  title: string;
  points: string[];
  media?: MediaAsset;
  mediaNote?: string;
}

/**
 * Before/after comparison. Each side shows a properly licensed image when one exists;
 * otherwise an explicit "image not licensed" card — never a stand-in photograph.
 */
export function CompareSlider({ traditional, adaptation, motif }: { traditional: Side; adaptation: Side; motif: MotifKey }) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromClient = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.min(96, Math.max(4, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <div>
      <div
        ref={box}
        className="relative aspect-[4/3] w-full touch-pan-y select-none overflow-hidden border border-ink/25 bg-ink sm:aspect-[16/9]"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          setFromClient(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && setFromClient(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        {/* Right: adaptation */}
        <Panel side={adaptation} motif={motif} align="right" dark />
        {/* Left: traditional, clipped */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <Panel side={traditional} motif={motif} align="left" />
        </div>
        {/* Handle */}
        <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }} aria-hidden>
          <span className="absolute inset-y-0 -left-px w-0.5 bg-mustard" />
          <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ink bg-yellow text-ink">
            ⟷
          </span>
        </div>
      </div>
      <label className="mt-3 flex items-center gap-3">
        <span className="label-sm shrink-0 text-ink-mute">Compare</span>
        <input
          type="range"
          min={4}
          max={96}
          value={Math.round(pos)}
          onChange={(e) => setPos(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
          aria-label={`Slide between ${traditional.title} and ${adaptation.title}`}
        />
      </label>
    </div>
  );
}

function Panel({ side, motif, align, dark = false }: { side: Side; motif: MotifKey; align: "left" | "right"; dark?: boolean }) {
  return (
    <div className={`absolute inset-0 ${dark ? "bg-ink text-ivory" : "bg-parchment text-ink"}`}>
      {side.media ? (
        // eslint-disable-next-line @next/next/no-img-element -- credited archival photograph
        <img src={mediaUrl(side.media, 1280)} alt={side.media.alt} className="h-full w-full object-cover" draggable={false} />
      ) : (
        <div className={`flex h-full w-full ${align === "right" ? "justify-end" : ""}`}>
          <div className="flex h-full w-1/2 flex-col justify-center gap-4 p-6 sm:p-10">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-current opacity-70" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-7 w-7">
                <rect x="3" y="5" width="18" height="14" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 5l18 14" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
            <p className="label">Image not licensed</p>
            <p className="text-sm opacity-80">{side.mediaNote}</p>
            <div className="h-20 w-20 opacity-40">
              <Motif motif={motif} className="h-full w-full" title="Archive illustration, not the runway design" />
            </div>
          </div>
        </div>
      )}
      <div className={`absolute bottom-0 ${align === "left" ? "left-0" : "right-0"} max-w-[48%] p-3 sm:p-5`}>
        <p className={`label-sm inline-block px-2 py-1 ${dark ? "bg-ivory text-ink" : "bg-ink text-ivory"}`}>{side.title}</p>
        <ul className={`mt-2 hidden space-y-1 text-xs sm:block ${side.media ? "text-ivory drop-shadow-[0_1px_2px_rgba(0,0,0,.8)]" : ""}`}>
          {side.points.map((p) => (
            <li key={p}>— {p}</li>
          ))}
        </ul>
      </div>
      {side.media && (
        <a
          href={side.media.sourcePage}
          target="_blank"
          rel="noreferrer"
          className={`label-sm absolute top-0 ${align === "left" ? "left-0" : "right-0"} bg-ink/70 px-2 py-1 text-ivory`}
        >
          {side.media.credit} · {side.media.license}
        </a>
      )}
    </div>
  );
}
