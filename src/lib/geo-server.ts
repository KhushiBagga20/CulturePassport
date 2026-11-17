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
