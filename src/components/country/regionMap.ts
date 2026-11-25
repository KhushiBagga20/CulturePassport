import { geoBounds, geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Archive, Tradition } from "@/lib/types";
import { ACCENT } from "@/lib/labels";

export interface MapLand {
  d: string;
  iso: string;
  name: string;
  focus: boolean;
  shared: boolean;
}
export interface MapMarker {
  key: string;
  x: number;
  y: number;
  place: string;
  tradition: string;
  color: string;
  role: string;
}
export interface MapLink {
  key: string;
  d: string;
  tradition: string;
  label: string;
  dashed: boolean;
}
export interface RegionMapData {
  width: number;
  height: number;
  lands: MapLand[];
  markers: MapMarker[];
  links: MapLink[];
  focusName: string;
}

/**
 * Projects a country (plus every place its traditions touch) into an SVG map.
 * Runs on the server; the client only handles interaction.
 */
export function buildRegionMap(
  countries: FeatureCollection<Geometry, { name: string }>,
  focusIso: string,
  sharedIsos: string[],
  traditions: Tradition[],
  archive: Archive,
  size: { width: number; height: number } = { width: 640, height: 720 },
  fit: "country" | "places" = "country",
  /** Lighter outlines (1:110m) for the surrounding countries; the focus and shared countries keep full detail. */
  background?: FeatureCollection<Geometry, { name: string }>,
): RegionMapData {
  const { width, height } = size;
  const places = new Map(archive.places.map((p) => [p.id, p]));
  const focus = countries.features.find((f) => String(f.id).padStart(3, "0") === focusIso);
  const pts: [number, number][] = [];
  for (const t of traditions)
    for (const tp of t.places) {
      const p = places.get(tp.place);
      if (p && ["IN", "PK", "NP", "AE", "BD"].includes(p.country)) pts.push([p.lon, p.lat]);
    }
  let fitTarget: FeatureCollection = {
    type: "FeatureCollection",
    features: [
      ...(focus ? [focus as Feature] : []),
      ...(pts.length ? [{ type: "Feature", properties: {}, geometry: { type: "MultiPoint", coordinates: pts } } as Feature] : []),
    ],
  };
  if (fit === "places" && pts.length) {
    // Zoom to the places themselves, but never tighter than ~9° × 7° so context survives.
    const lons = pts.map((p) => p[0]);
    const lats = pts.map((p) => p[1]);
    const cx = (Math.min(...lons) + Math.max(...lons)) / 2;
    const cy = (Math.min(...lats) + Math.max(...lats)) / 2;
    const hw = Math.max(4.5, (Math.max(...lons) - Math.min(...lons)) / 2 + 1.5);
    const hh = Math.max(3.5, (Math.max(...lats) - Math.min(...lats)) / 2 + 1.2);
    fitTarget = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: { type: "MultiPoint", coordinates: [[cx - hw, cy - hh], [cx + hw, cy + hh]] },
        } as Feature,
      ],
    };
  }
  const pad = 24;
  const proj = geoMercator().fitExtent(
    [
      [pad, pad],
      [width - pad, height - pad],
    ],
    fitTarget,
  );
  // One decimal place is sub-pixel at this size and keeps the map markup small.
  const path = geoPath(proj).digits(1);
  const topLeft = proj.invert?.([0, 0]) ?? [-180, 90];
  const bottomRight = proj.invert?.([width, height]) ?? [180, -90];
  const [w, n] = topLeft;
  const [e, s] = bottomRight;

  const lands: MapLand[] = [];
  const detailed = (iso: string) => iso === focusIso || sharedIsos.includes(iso);
  const features = background
    ? [
        // Background first, so the detailed borders are drawn on top of the coarser ones.
        ...background.features.filter((f) => !detailed(String(f.id).padStart(3, "0"))),
        ...countries.features.filter((f) => detailed(String(f.id).padStart(3, "0"))),
      ]
    : countries.features;
  for (const f of features) {
    const [[fw, fs], [fe, fn]] = geoBounds(f);
    if (fe < w - 2 || fw > e + 2 || fn < s - 2 || fs > n + 2) continue;
    const iso = String(f.id).padStart(3, "0");
    lands.push({
      d: path(f) ?? "",
      iso,
      name: f.properties?.name ?? "",
      focus: iso === focusIso,
      shared: sharedIsos.includes(iso),
    });
  }

  const markers: MapMarker[] = [];
  for (const t of traditions) {
    for (const tp of t.places) {
      const p = places.get(tp.place);
      if (!p) continue;
      const xy = proj([p.lon, p.lat]);
      if (!xy || xy[0] < 0 || xy[0] > width || xy[1] < 0 || xy[1] > height) continue;
      markers.push({ key: `${t.slug}:${p.id}`, x: xy[0], y: xy[1], place: p.name, tradition: t.slug, color: ACCENT[t.accent].hex, role: tp.role });
    }
  }

  const links: MapLink[] = [];
  const slugs = new Set(traditions.map((t) => t.slug));
  for (const r of archive.relationships) {
    if (!slugs.has(r.tradition)) continue;
    const a = places.get(r.from);
    const b = places.get(r.to);
    if (!a || !b) continue;
    const pa = proj([a.lon, a.lat]);
    const pb = proj([b.lon, b.lat]);
    if (!pa || !pb) continue;
    const inside = (p: [number, number]) => p[0] >= 0 && p[0] <= width && p[1] >= 0 && p[1] <= height;
    if (!inside(pa) || !inside(pb)) continue;
    const mx = (pa[0] + pb[0]) / 2;
    const my = (pa[1] + pb[1]) / 2 - Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) * 0.25;
    links.push({
      key: r.id,
      d: `M${pa[0].toFixed(1)},${pa[1].toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${pb[0].toFixed(1)},${pb[1].toFixed(1)}`,
      tradition: r.tradition,
      label: r.title,
      dashed: r.level !== "documented",
    });
  }
  return { width, height, lands, markers, links, focusName: focus?.properties?.name ?? "" };
}
