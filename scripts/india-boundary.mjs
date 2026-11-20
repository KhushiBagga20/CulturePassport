/**
 * One-off fix applied to public/geo/countries-{50m,110m}.json (world-atlas / Natural Earth):
 * draws India with its official boundary, including all of Jammu & Kashmir, Ladakh and Aksai Chin.
 * The India outline comes from Natural Earth's India point-of-view file; the matching areas are
 * removed from Pakistan and China, and the Siachen Glacier unit is merged into India.
 *
 *   curl -LO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries_ind.geojson
 *   npm i --no-save mapshaper@0.6 && node scripts/india-boundary.mjs ne_10m_admin_0_countries_ind.geojson
 *
 * Running it again on files that are already fixed is harmless.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const repo = new URL("..", import.meta.url).pathname;
const { feature } = require(`${repo}/node_modules/topojson-client`);
const ms = require("mapshaper");
const ind = JSON.parse(fs.readFileSync(process.argv[2]));
const india10 = { type: "FeatureCollection", features: ind.features.filter((f) => f.properties.ADMIN === "India").map((f) => ({ type: "Feature", properties: { cid: "356", name: "India" }, geometry: f.geometry })) };
for (const [res, interval] of [["50m", 3000], ["110m", 15000]]) {
  const topo = JSON.parse(fs.readFileSync(`${repo}/public/geo/countries-${res}.json`));
  const fc = feature(topo, topo.objects.countries);
  const base = { type: "FeatureCollection", features: fc.features.map((f, i) => ({ type: "Feature", properties: { cid: f.id ?? `x${i}`, name: f.properties.name }, geometry: f.geometry })) };
  const out = await ms.applyCommands(
    [
      `-i base.json name=base`,
      `-i india10.json name=india10`,
      `-simplify interval=${interval} target=india10`,
      // the parts of Pakistan, China and Siachen that India's official boundary includes
      `-filter "['586','156'].includes(cid) || name==='Siachen Glacier'" target=base + name=disp`,
      `-clip india10 target=disp + name=pieces`,
      `-each "cid='356'; name='India'" target=pieces`,
      `-erase india10 target=disp`,
      `-filter "!(['586','156'].includes(cid) || name==='Siachen Glacier')" target=base`,
      `-merge-layers target=base,disp,pieces force name=countries`,
      `-filter "!!this.area" target=countries`,
      `-dissolve2 cid copy-fields=name target=countries`,
      `-filter-slivers min-area=20km2 target=countries`,
      `-o countries.json format=topojson id-field=cid quantization=100000 target=countries`,
    ].join(" "),
    { "base.json": base, "india10.json": india10 },
  );
  const t = JSON.parse(out["countries.json"]);
  for (const g of t.objects.countries.geometries) { delete g.properties.cid; if (/^x\d+$/.test(g.id)) delete g.id; }
  fs.writeFileSync(`${repo}/public/geo/countries-${res}.json`, JSON.stringify(t));
  console.log(res, t.objects.countries.geometries.length, "geoms", "written", "bytes");
}
