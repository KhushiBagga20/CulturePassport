/**
 * One-off fix applied to public/geo/countries-{50m,110m}.json (world-atlas / Natural Earth):
 * draws India with its official boundary, including all of Jammu & Kashmir, Ladakh and Aksai Chin.
 * India's outline comes from Natural Earth's India point-of-view file; the matching areas are
 * removed from Pakistan and China, and the Siachen Glacier unit is merged into India.
 *
 * Only those shapes go through mapshaper. Every other country is copied from the original file
 * unchanged: mapshaper's planar processing distorts shapes that cross the date line or the poles
 * (Russia, Fiji, Antarctica), which showed as stray lines on the globe.
 *
 *   git show 7364d94~1:public/geo/countries-50m.json  > public/geo/countries-50m.json
 *   git show 7364d94~1:public/geo/countries-110m.json > public/geo/countries-110m.json
 *   curl -LO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries_ind.geojson
 *   npm i --no-save mapshaper@0.6 topojson-server@3
 *   node scripts/india-boundary.mjs ne_10m_admin_0_countries_ind.geojson
 */
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const repo = new URL("../..", import.meta.url).pathname;
const { feature } = require("topojson-client");
const { topology } = require("topojson-server");
const { geoArea } = require("d3-geo");
const ms = require("mapshaper");

const IN = "356", PK = "586", CN = "156";
const ind = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const india10 = {
  type: "FeatureCollection",
  features: ind.features.filter((f) => f.properties.ADMIN === "India").map((f) => ({ type: "Feature", properties: {}, geometry: f.geometry })),
};

for (const [res, interval] of [["50m", 3000], ["110m", 15000]]) {
  const file = `${repo}public/geo/countries-${res}.json`;
  const topo = JSON.parse(fs.readFileSync(file, "utf8"));
  const quantization = Math.round(360 / topo.transform.scale[0]) + 1;
  const all = feature(topo, topo.objects.countries).features;
  const isSiachen = (f) => f.properties.name === "Siachen Glacier";
  const pick = (id) => all.find((f) => f.id === id);
  const local = {
    type: "FeatureCollection",
    features: [pick(IN), pick(PK), pick(CN), ...all.filter(isSiachen)].map((f) => ({ type: "Feature", properties: { cid: f.id ?? "siachen" }, geometry: f.geometry })),
  };
  const out = await ms.applyCommands(
    [
      `-i local.json name=local`,
      `-i india10.json name=india10`,
      `-simplify interval=${interval} target=india10`,
      // Only the Kashmir region changes; elsewhere India's outline stays exactly as it was.
      `-clip bbox=72.4,32.3,80.9,37.2 target=india10`,
      `-filter "cid !== '${IN}'" target=local + name=disp`,
      `-filter "cid === '${IN}'" target=local + name=oldindia`,
      `-clip india10 target=disp + name=pieces`,
      `-each "cid='${IN}'" target=pieces`,
      `-erase india10 target=disp`,
      `-merge-layers target=oldindia,pieces force name=newindia`,
      `-dissolve2 cid target=newindia`,
      `-filter-slivers min-area=20km2 target=newindia,disp`,
      `-merge-layers target=newindia,disp force name=out`,
      `-o out.json format=geojson precision=0.000001 target=out`,
    ].join(" "),
    { "local.json": local, "india10.json": india10 },
  );
  // d3 (and so the globe) expects clockwise outer rings; a ring wound the other way would cover
  // the whole sphere except the country.
  const rewind = (g) => {
    const f = { type: "Feature", properties: {}, geometry: g };
    if (geoArea(f) <= 2 * Math.PI) return g;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
    const flipped = polys.map((rings) => rings.map((r) => [...r].reverse()));
    return g.type === "Polygon" ? { type: "Polygon", coordinates: flipped[0] } : { type: "MultiPolygon", coordinates: flipped };
  };
  // Snap every vertex back onto the original file's exact coordinates where one is within reach,
  // so India keeps sharing its borders with Nepal, Bangladesh, Bhutan and Myanmar.
  const grid = new Map();
  const cell = (x, y) => `${Math.round(x * 1000)}:${Math.round(y * 1000)}`;
  const visit = (c, fn) => (typeof c[0] === "number" ? fn(c) : c.forEach((x) => visit(x, fn)));
  for (const f of all) if (f.geometry) visit(f.geometry.coordinates, (p) => grid.set(cell(p[0], p[1]), p));
  const snap = (g) => {
    const near = (p) => {
      let best = null, d = 2e-3 ** 2;
      for (let i = -1; i <= 1; i++)
        for (let j = -1; j <= 1; j++) {
          const q = grid.get(`${Math.round(p[0] * 1000) + i}:${Math.round(p[1] * 1000) + j}`);
          if (q && (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 < d) {
            best = q;
            d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
          }
        }
      return best ? [best[0], best[1]] : p;
    };
    const map = (c) => (typeof c[0] === "number" ? near(c) : c.map(map));
    return { ...g, coordinates: map(g.coordinates) };
  };
  const shapes = new Map(JSON.parse(out["out.json"]).features.filter((f) => f.geometry).map((f) => [f.properties.cid, rewind(snap(f.geometry))]));
  const features = all
    .filter((f) => !isSiachen(f))
    .map((f) => (shapes.has(f.id) && [IN, PK, CN].includes(f.id) ? { ...f, geometry: shapes.get(f.id) } : f));
  const t = topology({ countries: { type: "FeatureCollection", features } }, quantization);
  t.transform = topo.transform; // identical grid; avoids a last-digit rounding difference
  fs.writeFileSync(file, JSON.stringify(t));
  console.log(res, features.length, "countries written");
}
