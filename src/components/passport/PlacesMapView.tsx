"use client";

import { useState } from "react";

export interface PlacesMapProps {
  slug: string;
  name: string;
  width: number;
  height: number;
  lands: { key: string; d: string; focus: boolean; shared: boolean }[];
  links: { key: string; d: string; dashed: boolean }[];
  markers: { key: string; x: number; y: number; n: number; place: string }[];
  legend: { n: number; name: string; role: string; note?: string }[];
}

/** Interactive map of a tradition's places: pick a number on the map or in the list to read about it. */
export function PlacesMapView({ slug, name, width, height, lands, links, markers, legend }: PlacesMapProps) {
  const [active, setActive] = useState<number | null>(legend[0]?.n ?? null);
  const cur = legend.find((l) => l.n === active);
  const curMarker = markers.find((m) => m.n === active);
  return (
    <figure className="border-2 border-ink bg-bone">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`Map of places associated with ${name}`}>
        <defs>
          <pattern id={`pm-hatch-${slug}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#F2C2AE" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#B0351E" strokeOpacity="0.55" strokeWidth="1.6" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="#1F4E9F" />
        {lands.map((l) => (
          <path
            key={l.key}
            d={l.d}
            fill={l.focus ? "#F6F0E3" : l.shared ? `url(#pm-hatch-${slug})` : "#E1D4B5"}
            stroke="#1B1616"
            strokeOpacity={l.focus || l.shared ? 0.75 : 0.35}
            strokeWidth={l.focus ? 1.3 : 0.7}
          />
        ))}
        {links.map((ln) => (
          <path key={ln.key} d={ln.d} fill="none" stroke="#1B1616" strokeWidth={1.6} strokeDasharray={ln.dashed ? "2 5" : "6 4"} />
        ))}
        {markers.map((m) => {
          const on = active === m.n;
          return (
            <g
              key={m.key}
              transform={`translate(${m.x.toFixed(1)} ${m.y.toFixed(1)})`}
              onPointerEnter={() => setActive(m.n)}
              onClick={() => setActive(m.n)}
              className="cursor-pointer"
            >
              <circle r={on ? 15 : 11} fill="var(--accent)" fillOpacity={0.22} />
              <circle r={on ? 10 : 8} fill={on ? "#1B1616" : "var(--accent)"} stroke="#F6F0E3" strokeWidth={1.8} />
              <text y={3.4} textAnchor="middle" fill="#F6F0E3" style={{ fontFamily: "var(--font-ui)", fontSize: on ? 10.5 : 9, fontWeight: 700 }}>
                {m.n}
              </text>
            </g>
          );
        })}
        {curMarker && (
          <g transform={`translate(${curMarker.x.toFixed(1)} ${curMarker.y.toFixed(1)})`} pointerEvents="none">
            <text
              x={16}
              y={-12}
              fill="#1B1616"
              stroke="#F6F0E3"
              strokeWidth={4}
              paintOrder="stroke"
              style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" }}
            >
              {curMarker.place}
            </text>
          </g>
        )}
      </svg>
      <figcaption className="border-t-2 border-ink">
        {legend.length === 0 && <p className="border-b border-ink/15 px-3 py-2 text-sm text-ink-soft">Shown at country level: no specific places are recorded yet.</p>}
        <ol className="grid sm:grid-cols-2">
          {legend.map((l) => (
            <li key={l.n} className="border-b border-ink/15 sm:odd:border-r">
              <button
                type="button"
                onClick={() => setActive(l.n)}
                onPointerEnter={() => setActive(l.n)}
                onFocus={() => setActive(l.n)}
                aria-pressed={active === l.n}
                className={`flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm transition-colors ${active === l.n ? "bg-ink text-bone" : "hover:bg-sand"}`}
              >
                <span className={`font-ui w-5 shrink-0 text-xs font-bold ${active === l.n ? "text-yellow" : "text-[var(--accent-text)]"}`}>{l.n}</span>
                <span className="font-semibold">{l.name}</span>
                <span className={`label-sm ml-auto shrink-0 ${active === l.n ? "text-bone/70" : "text-ink-mute"}`}>{l.role}</span>
              </button>
            </li>
          ))}
        </ol>
        {cur?.note && (
          <p className="border-b border-ink/15 bg-yellow/40 px-3 py-2 text-sm" aria-live="polite">
            <strong className="font-semibold">{cur.name}:</strong> {cur.note}
          </p>
        )}
        <p className="label-sm px-3 py-2 text-ink-mute">Approximate centres · hatched: shared across a border · boundaries: Natural Earth</p>
      </figcaption>
    </figure>
  );
}
