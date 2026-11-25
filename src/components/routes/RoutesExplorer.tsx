"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { EvidenceLevel, RelationshipKind } from "@/lib/types";
import { EVIDENCE, RELATIONSHIP } from "@/lib/labels";
import { EvidenceBadge } from "@/components/site/Evidence";

export interface RouteArc {
  id: string;
  tradition: string;
  d: string;
  kind: RelationshipKind;
  title: string;
  description: string;
  level: EvidenceLevel;
  year?: string;
  from: string;
  to: string;
  sources: { title: string; url: string; publisher: string }[];
  mid: [number, number];
}
export interface RouteNode {
  id: string;
  name: string;
  x: number;
  y: number;
  traditions: string[];
}

export function RoutesExplorer({
  width,
  height,
  land,
  sphere,
  graticule,
  arcs,
  nodes,
  traditions,
}: {
  width: number;
  height: number;
  land: { d: string; key: string }[];
  sphere: string;
  graticule: string;
  arcs: RouteArc[];
  nodes: RouteNode[];
  traditions: { slug: string; name: string; color: string; no: string }[];
}) {
  const reduce = useReducedMotion();
  const [tradition, setTradition] = useState<string>("all");
  // ?tradition=… is read in the browser so the page itself can be prebuilt.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("tradition");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL after hydration
    if (q && traditions.some((t) => t.slug === q)) setTradition(q);
  }, [traditions]);
  const [hideSimilarity, setHideSimilarity] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const color = useMemo(() => new Map(traditions.map((t) => [t.slug, t.color])), [traditions]);
  const visible = arcs.filter((a) => (tradition === "all" || a.tradition === tradition) && !(hideSimilarity && a.kind === "visual-similarity"));
  const visibleNodes = new Set(visible.flatMap((a) => [a.from, a.to]));
  const focused = arcs.find((a) => a.id === focus);

  // Zoom to the selected tradition's places (keeping the map's aspect ratio).
  const target = useMemo<[number, number, number, number]>(() => {
    if (tradition === "all") return [0, 0, width, height];
    const pts = nodes.filter((n) => visibleNodes.has(n.id));
    if (!pts.length) return [0, 0, width, height];
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    let w = Math.max(140, (Math.max(...xs) - Math.min(...xs)) * 1.6);
    let h = Math.max(140 * (height / width), (Math.max(...ys) - Math.min(...ys)) * 1.6);
    if (w / h > width / height) h = w * (height / width);
    else w = h * (width / height);
    w = Math.min(w, width);
    h = Math.min(h, height);
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
    const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    const x = Math.min(Math.max(0, cx - w / 2), width - w);
    const y = Math.min(Math.max(0, cy - h / 2), height - h);
    return [x, y, w, h];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradition, hideSimilarity, nodes, width, height]);
  const [vb, setVb] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    const dur = reduce ? 0 : 750;
    let raf = 0;
    const tick = (now: number) => {
      const t = dur ? Math.min(1, (now - start) / dur) : 1;
      const e = 1 - Math.pow(1 - t, 3);
      const next = a.map((v, i) => v + (target[i] - v) * e) as [number, number, number, number];
      from.current = next;
      setVb(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduce]);
  const k = vb[2] / width;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Choose a tradition">
        <button
          type="button"
          aria-pressed={tradition === "all"}
          onClick={() => setTradition("all")}
          className="chip"
        >
          All traditions
        </button>
        {traditions.map((t) => (
          <button
            key={t.slug}
            type="button"
            aria-pressed={tradition === t.slug}
            onClick={() => setTradition(t.slug)}
            className="chip"
            style={tradition === t.slug ? { background: t.color, borderColor: "#1B1616", color: "#F6F0E3" } : undefined}
          >
            <span className="h-2.5 w-2.5 border border-ink/40" style={{ background: tradition === t.slug ? "#F6F0E3" : t.color }} />
            {t.name}
          </button>
        ))}
        <label className="label-sm ml-auto flex items-center gap-2 text-ink-soft">
          <input type="checkbox" checked={hideSimilarity} onChange={(e) => setHideSimilarity(e.target.checked)} className="h-4 w-4 accent-[#B0351E]" />
          Hide visual-similarity links
        </label>
      </div>

      <figure className="relative mt-6 overflow-hidden border-2 border-ink bg-sand">
        <svg viewBox={vb.map((v) => v.toFixed(2)).join(" ")} className="h-auto w-full" role="img" aria-label="World map of documented cultural connections">
          <path d={sphere} fill="#E1D4B5" />
          <path d={graticule} fill="none" stroke="#1B1616" strokeOpacity={0.14} strokeDasharray="1 4" vectorEffect="non-scaling-stroke" />
          {land.map((l) => (
            <path key={l.key} d={l.d} fill="#F6F0E3" stroke="#1B1616" strokeOpacity={0.35} strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
          ))}
          {visible.map((a) => {
            const on = !focus || focus === a.id;
            const c = color.get(a.tradition) ?? "#211C19";
            return (
              <g key={a.id}>
                <path d={a.d} fill="none" stroke="transparent" strokeWidth={14} vectorEffect="non-scaling-stroke" onPointerEnter={() => setFocus(a.id)} onPointerLeave={() => setFocus(null)} />
                <path
                  d={a.d}
                  fill="none"
                  stroke={a.kind === "visual-similarity" ? "#7A6D62" : c}
                  strokeWidth={focus === a.id ? 3 : 1.8}
                  strokeOpacity={on ? 0.95 : 0.15}
                  strokeDasharray={RELATIONSHIP[a.kind].dash === "0" ? undefined : RELATIONSHIP[a.kind].dash}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  className={reduce || RELATIONSHIP[a.kind].dash === "0" ? "" : "route-line"}
                  pointerEvents="none"
                />
              </g>
            );
          })}
          {nodes
            .filter((n) => visibleNodes.has(n.id))
            .map((n) => (
              <g key={n.id} transform={`translate(${n.x.toFixed(1)} ${n.y.toFixed(1)}) scale(${k.toFixed(4)})`}>
                <circle r={4.6} fill="#F4BA2E" stroke="#1B1616" strokeWidth={1.6} />
                <circle r={1.6} fill="#1B1616" />
                <text x={6} y={-6} style={{ fontFamily: "var(--font-ui)", fontSize: 10, letterSpacing: "0.06em" }} fill="#1B1616" fillOpacity={0.9} paintOrder="stroke" stroke="#F6F0E3" strokeWidth={3}>
                  {n.name}
                </text>
              </g>
            ))}
        </svg>
        {focused && (
          <div
            className="accession print-shadow-sm pointer-events-none absolute max-w-xs p-3"
            style={{
              left: `min(${((focused.mid[0] - vb[0]) / vb[2]) * 100}%, calc(100% - 20rem))`,
              top: `${((focused.mid[1] - vb[1]) / vb[3]) * 100}%`,
            }}
          >
            <p className="label-sm text-ink-mute">{RELATIONSHIP[focused.kind].label}</p>
            <p className="font-title text-lg leading-tight">{focused.title}</p>
          </div>
        )}
        <figcaption className="flex flex-wrap gap-x-5 gap-y-2 border-t-2 border-ink bg-bone px-3 py-2">
          {(Object.keys(RELATIONSHIP) as RelationshipKind[]).map((k) => (
            <span key={k} className="label-sm flex items-center gap-2 text-ink-soft">
              <svg width="28" height="6" aria-hidden>
                <line x1="0" y1="3" x2="28" y2="3" stroke="#1B1616" strokeWidth="2" strokeDasharray={RELATIONSHIP[k].dash === "0" ? undefined : RELATIONSHIP[k].dash} />
              </svg>
              {RELATIONSHIP[k].label}
            </span>
          ))}
        </figcaption>
      </figure>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {visible.map((a) => (
          <article
            key={a.id}
            onPointerEnter={() => setFocus(a.id)}
            onPointerLeave={() => setFocus(null)}
            className={`border-2 border-l-8 border-ink bg-bone p-5 transition-transform ${focus === a.id ? "-translate-y-1" : ""}`}
            style={{ borderLeftColor: a.kind === "visual-similarity" ? "#8C8178" : color.get(a.tradition) }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="label-sm text-ink-mute">{RELATIONSHIP[a.kind].label}</span>
              {a.year && <span className="label-sm text-ink-mute">· {a.year}</span>}
              <EvidenceBadge level={a.level} />
            </div>
            <h3 className="font-title mt-2 text-2xl leading-tight">{a.title}</h3>
            <p className="label-sm mt-1 text-ink-mute">
              {a.from} → {a.to} ·{" "}
              <Link href={`/passport/${a.tradition}`} className="underline hover:text-brick">
                {traditions.find((t) => t.slug === a.tradition)?.name}
              </Link>
            </p>
            <p className="mt-2 text-sm text-ink-soft">{a.description}</p>
            {RELATIONSHIP[a.kind].caution && (
              <p className="mt-2 border-l-4 border-brick pl-2 text-sm font-semibold text-brick">{RELATIONSHIP[a.kind].caution}</p>
            )}
            <ul className="mt-3 space-y-1">
              {a.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="font-ui text-xs font-semibold text-ink-mute hover:text-brick">
                    ↗ {s.publisher} — {s.title.length > 60 ? `${s.title.slice(0, 58)}…` : s.title}
                  </a>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className="mt-6 text-xs text-ink-mute">
        Evidence key: {Object.values(EVIDENCE).map((e) => `${e.glyph} ${e.label}`).join(" · ")}
      </p>
    </div>
  );
}
