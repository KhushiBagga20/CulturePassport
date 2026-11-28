import { feature, mesh } from "topojson-client";
import { geoBounds, geoCentroid, geoContains, geoEquirectangular, geoGraticule10, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry, MultiLineString } from "geojson";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { CountryStatus } from "@/lib/types";

export interface GlobeCountry {
  isoNumeric: string;
  iso2: string;
  slug: string;
  name: string;
  status: CountryStatus;
  headline: string;
  intro: string;
  passports: { slug: string; name: string; no: string }[];
  shared: { slug: string; name: string; no: string }[];
  candidates: string[];
  href: string;
}

export interface WorldFeature {
  index: number;
  id: string;
  name: string;
  feature: Feature<Geometry, { name: string }>;
  bounds: [[number, number], [number, number]];
  centroid: [number, number];
}

export interface World {
  features: WorldFeature[];
  borders: MultiLineString;
}

let worldPromise: Promise<World> | null = null;

/** Bump when public/geo changes: browsers cache these files for a week. v3: India's full boundary, other countries untouched. */
const GEO_VERSION = "3";

/** Natural Earth 1:50m admin-0 countries (via world-atlas), served from /public/geo. */
export function loadWorld(resolution: "50m" | "110m" = "50m"): Promise<World> {
  if (worldPromise && resolution === "50m") return worldPromise;
  const p = fetch(`/geo/countries-${resolution}.json?v=${GEO_VERSION}`)
    .then((r) => {
      if (!r.ok) throw new Error(`Could not load country boundaries (${r.status})`);
      return r.json() as Promise<Topology<{ countries: GeometryCollection<{ name: string }> }>>;
    })
    .then((topo) => {
      const fc = feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>;
      const features: WorldFeature[] = fc.features
        .filter((f) => f.geometry)
        .map((f, index) => ({
          index,
          id: String(f.id ?? `x${index}`).padStart(3, "0"),
          name: f.properties?.name ?? "Unknown",
          feature: f,
          bounds: geoBounds(f) as [[number, number], [number, number]],
          centroid: geoCentroid(f) as [number, number],
        }));
      const borders = mesh(topo, topo.objects.countries, (a, b) => a !== b) as MultiLineString;
      return { features, borders };
    });
  if (resolution === "50m") worldPromise = p;
  return p;
}

function inBounds(b: WorldFeature["bounds"], lon: number, lat: number) {
  const [[w, s], [e, n]] = b;
  if (lat < s - 0.5 || lat > n + 0.5) return false;
  if (w <= e) return lon >= w - 0.5 && lon <= e + 0.5;
  return lon >= w - 0.5 || lon <= e + 0.5; // crosses the antimeridian
}

export function pickCountry(world: World, lon: number, lat: number): WorldFeature | null {
  for (const f of world.features) {
    if (inBounds(f.bounds, lon, lat) && geoContains(f.feature, [lon, lat])) return f;
  }
  return null;
}

/** Unit sphere position for a lon/lat, matching three.js SphereGeometry UVs. */
export function lonLatToVec(lon: number, lat: number, r = 1): [number, number, number] {
  const phi = (lat * Math.PI) / 180;
  const lam = (lon * Math.PI) / 180;
  return [r * Math.cos(phi) * Math.cos(lam), r * Math.sin(phi), -r * Math.cos(phi) * Math.sin(lam)];
}

export function vecToLonLat(x: number, y: number, z: number): [number, number] {
  const r = Math.hypot(x, y, z) || 1;
  const lat = (Math.asin(y / r) * 180) / Math.PI;
  const lon = (Math.atan2(-z, x) * 180) / Math.PI;
  return [lon, lat];
}

const STATUS_FILL: Record<CountryStatus, string> = {
  active: "#B84B30",
  introductory: "#4e2b4c",
  documenting: "#E2A62E",
  shared: "#8C4257",
};

function hashTone(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const t = ((h >>> 0) % 1000) / 1000;
  const base = [221, 205, 172];
  const k = 0.94 + t * 0.09;
  return `rgb(${Math.round(base[0] * k)}, ${Math.round(base[1] * k)}, ${Math.round(base[2] * k)})`;
}

function hatchPattern(ctx: CanvasRenderingContext2D, color: string, bg: string, spacing = 7) {
  const c = document.createElement("canvas");
  c.width = c.height = spacing * 2;
  const g = c.getContext("2d")!;
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = color;
  g.lineWidth = 1.6;
  g.beginPath();
  for (let i = -c.width; i < c.width * 2; i += spacing) {
    g.moveTo(i, 0);
    g.lineTo(i + c.width, c.height);
  }
  g.stroke();
  return ctx.createPattern(c, "repeat")!;
}

/** Paints the archival atlas texture (equirectangular). */
export function paintBaseTexture(world: World, statusById: Map<string, CountryStatus>, width: number): HTMLCanvasElement {
  const W = width;
  const H = width / 2;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const k = W / 4096;
  const proj = geoEquirectangular()
    .scale(W / (2 * Math.PI))
    .translate([W / 2, H / 2])
    .precision(0.2);
  const path = geoPath(proj, ctx);
  const land: FeatureCollection = { type: "FeatureCollection", features: world.features.map((f) => f.feature) };

  // Sea
  ctx.fillStyle = "#E9DDC4";
  ctx.fillRect(0, 0, W, H);
  // Coastal ripple lines, as on engraved charts
  ctx.lineJoin = "round";
  const ripples = [46, 38, 30, 22, 14];
  ripples.forEach((w, i) => {
    ctx.beginPath();
    path(land);
    ctx.lineWidth = w * k;
    ctx.strokeStyle = i % 2 === 0 ? "#DCCDAE" : "#E9DDC4";
    ctx.stroke();
  });
  // Graticule
  ctx.beginPath();
  path(geoGraticule10());
  ctx.setLineDash([2 * k, 7 * k]);
  ctx.lineWidth = 1.4 * k;
  ctx.strokeStyle = "rgba(33, 28, 25, 0.22)";
  ctx.stroke();
  ctx.setLineDash([]);
  // Equator and tropics a touch stronger
  for (const lat of [0, 23.44, -23.44]) {
    ctx.beginPath();
    path({ type: "LineString", coordinates: Array.from({ length: 361 }, (_, i) => [i - 180, lat]) });
    ctx.lineWidth = (lat === 0 ? 2 : 1.2) * k;
    ctx.setLineDash(lat === 0 ? [] : [6 * k, 6 * k]);
    ctx.strokeStyle = "rgba(88, 29, 48, 0.28)";
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Land
  const sharedHatch = hatchPattern(ctx, "rgba(88,29,48,0.55)", "#D9B9C0", 8 * Math.max(k, 0.5));
  const docHatch = hatchPattern(ctx, "rgba(150,100,10,0.55)", "#F2DCA5", 8 * Math.max(k, 0.5));
  for (const f of world.features) {
    const status = statusById.get(f.id);
    ctx.beginPath();
    path(f.feature);
    ctx.fillStyle =
      status === "shared" ? sharedHatch : status === "documenting" ? docHatch : status ? STATUS_FILL[status] : hashTone(f.id);
    ctx.fill();
  }
  // Coastline
  ctx.beginPath();
  path(land);
  ctx.lineWidth = 2.2 * k;
  ctx.strokeStyle = "rgba(33, 28, 25, 0.55)";
  ctx.stroke();

  // Paper speckle
  const speckles = Math.round(90000 * k * k);
  for (let i = 0; i < speckles; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(33,28,25,0.05)" : "rgba(255,255,255,0.08)";
    ctx.fillRect(x, y, 1.4 * k + 0.6, 1.4 * k + 0.6);
  }
  return canvas;
}

/** Repaints the transparent highlight layer for the hovered / selected country. */
export function paintHighlight(
  canvas: HTMLCanvasElement,
  world: World,
  hovered: WorldFeature | null,
  selected: WorldFeature | null,
) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  const proj = geoEquirectangular()
    .scale(W / (2 * Math.PI))
    .translate([W / 2, H / 2])
    .precision(0.2);
  const path = geoPath(proj, ctx);
  const k = W / 2048;
  const draw = (f: WorldFeature, fill: string, stroke: string) => {
    ctx.beginPath();
    path(f.feature);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 3 * k;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  };
  if (selected) draw(selected, "rgba(228, 170, 41, 0.55)", "rgba(33, 28, 25, 0.9)");
  if (hovered && hovered !== selected) draw(hovered, "rgba(246, 240, 227, 0.55)", "rgba(33, 28, 25, 0.85)");
  void world;
}

/** Flat Float32Array of line segment endpoints for internal borders on the sphere. */
export function borderSegments(world: World, r = 1.0015): Float32Array {
  const pts: number[] = [];
  for (const line of world.borders.coordinates) {
    for (let i = 0; i < line.length - 1; i++) {
      const a = lonLatToVec(line[i][0], line[i][1], r);
      const b = lonLatToVec(line[i + 1][0], line[i + 1][1], r);
      pts.push(...a, ...b);
    }
  }
  return new Float32Array(pts);
}

export function supportsWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
