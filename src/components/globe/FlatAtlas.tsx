"use client";

import { useMemo } from "react";
import { geoNaturalEarth1, geoPath, geoGraticule10 } from "d3-geo";
import type { CountryStatus } from "@/lib/types";
import type { GlobeCountry, World, WorldFeature } from "./geo";

const FILL: Record<CountryStatus, string> = {
  active: "#B84B30",
  introductory: "#146D68",
  documenting: "#E2A62E",
  shared: "#8C4257",
};

/**
 * The 2D atlas: used when WebGL is unavailable, or when a visitor prefers a flat,
 * keyboard-navigable map. Curated countries are focusable buttons.
 */
export function FlatAtlas({
  world,
  curated,
  hovered,
  selected,
  onHover,
  onSelect,
}: {
  world: World;
  curated: Map<string, GlobeCountry>;
  hovered: WorldFeature | null;
  selected: WorldFeature | null;
  onHover: (f: WorldFeature | null, client: { x: number; y: number } | null) => void;
  onSelect: (f: WorldFeature, viaTouch: boolean) => void;
}) {
  const W = 960;
  const H = 500;
  const { paths, grat, sphere } = useMemo(() => {
    const proj = geoNaturalEarth1().fitExtent(
      [
        [8, 8],
        [W - 8, H - 8],
      ],
      { type: "Sphere" },
    );
    const p = geoPath(proj);
    return {
      paths: world.features.map((f) => ({ f, d: p(f.feature) ?? "" })),
      grat: p(geoGraticule10()) ?? "",
      sphere: p({ type: "Sphere" }) ?? "",
    };
  }, [world]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="group" aria-label="World map of Culture Passport collections">
      <path d={sphere} fill="#E9DDC4" stroke="#211C19" strokeOpacity={0.4} />
      <path d={grat} fill="none" stroke="#211C19" strokeOpacity={0.14} strokeDasharray="1 4" />
      {paths.map(({ f, d }) => {
        const c = curated.get(f.id);
        const isHover = hovered?.id === f.id;
        const isSel = selected?.id === f.id;
        const fill = isSel ? "#E4AA29" : c ? FILL[c.status] : "#D9C7A3";
        return (
          <path
            key={f.index}
            d={d}
            fill={fill}
            fillOpacity={isHover && !isSel ? 0.75 : 1}
            stroke="#211C19"
            strokeOpacity={isHover || isSel ? 0.9 : 0.35}
            strokeWidth={isHover || isSel ? 1.2 : 0.4}
            tabIndex={c ? 0 : -1}
            role={c ? "button" : undefined}
            aria-label={c ? `${c.name} — ${c.passports.length} passports` : undefined}
            className="cursor-pointer outline-none transition-[fill-opacity] focus-visible:stroke-[2]"
            onPointerEnter={(e) => onHover(f, { x: e.clientX, y: e.clientY })}
            onPointerMove={(e) => e.pointerType !== "touch" && onHover(f, { x: e.clientX, y: e.clientY })}
            onPointerLeave={() => onHover(null, null)}
            onClick={(e) => onSelect(f, (e.nativeEvent as PointerEvent).pointerType === "touch")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(f, true);
              }
            }}
          />
        );
      })}
    </svg>
  );
}
