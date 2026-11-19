import { readFile } from "node:fs/promises";
import path from "node:path";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Topology, GeometryCollection } from "topojson-specification";
import { cache } from "react";

type Countries = FeatureCollection<Geometry, { name: string }>;

/** Natural Earth countries read on the server, for static SVG maps. */
export const loadCountries = cache(async (resolution: "50m" | "110m"): Promise<Countries> => {
  const file = path.join(process.cwd(), "public", "geo", `countries-${resolution}.json`);
  const topo = JSON.parse(await readFile(file, "utf8")) as Topology<{ countries: GeometryCollection<{ name: string }> }>;
  return feature(topo, topo.objects.countries) as Countries;
});

export function byIso(fc: Countries, isoNumeric: string): Feature<Geometry, { name: string }> | undefined {
  return fc.features.find((f) => String(f.id).padStart(3, "0") === isoNumeric);
}

/** URL slug for any Natural Earth country name. */
export function countrySlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * A country silhouette (or several, for traditions shared across borders) fitted into a 100×100 box,
 * for the passport's identity mark. The projection is centred on the shapes themselves, so countries
 * that cross the antimeridian still draw correctly. Coordinates are rounded to keep the markup small.
 */
export async function countryShape(isoNumerics: string[]): Promise<{ primary: string[]; shared: string[] } | null> {
  const { geoAzimuthalEqualArea, geoCentroid, geoPath } = await import("d3-geo");
  const fc = await loadCountries("50m");
  const feats = isoNumerics.map((iso) => byIso(fc, iso)).filter((f): f is Feature<Geometry, { name: string }> => !!f);
  if (!feats.length) return null;
  const all: FeatureCollection = { type: "FeatureCollection", features: feats };
  const [lon, lat] = geoCentroid(all);
  const proj = geoAzimuthalEqualArea().rotate([-lon, -lat]).fitExtent(
    [
      [4, 4],
      [96, 96],
    ],
    all,
  );
  const path = geoPath(proj);
  const round = (d: string | null) => (d ?? "").replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n) * 10) / 10));
  return { primary: [round(path(feats[0]))], shared: feats.slice(1).map((f) => round(path(f))) };
}
