import type { Metadata } from "next";
import { geoGraticule10, geoInterpolate, geoNaturalEarth1, geoPath } from "d3-geo";
import { getArchive, isPublic, lookups } from "@/lib/data/archive";
import { loadCountries } from "@/lib/geo-server";
import { ACCENT } from "@/lib/labels";
import { StoriesNav } from "@/components/site/StoriesNav";
import { RoutesExplorer, type RouteArc, type RouteNode } from "@/components/routes/RoutesExplorer";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Roots & Routes",
  description: "An evidence-labelled map of how traditions are shared, exhibited, adapted and connected across places.",
};

export default async function RoutesPage({ searchParams }: PageProps<"/routes">) {
  const { tradition } = await searchParams;
  const archive = await getArchive();
  const L = lookups(archive);
  const pub = archive.traditions.filter(isPublic);
  const pubSlugs = new Set(pub.map((t) => t.slug));
  const W = 1000;
  const H = 520;
  const proj = geoNaturalEarth1().fitExtent(
    [
      [6, 6],
      [W - 6, H - 6],
    ],
    { type: "Sphere" },
  );
  const path = geoPath(proj);
  const countries = await loadCountries("110m");
  const land = countries.features.map((f, i) => ({ key: `${f.id ?? i}`, d: path(f) ?? "" }));

  const rels = archive.relationships.filter((r) => pubSlugs.has(r.tradition));
  const arcs: RouteArc[] = rels.flatMap((r) => {
    const a = L.place.get(r.from);
    const b = L.place.get(r.to);
    if (!a || !b) return [];
    const line = { type: "LineString" as const, coordinates: [[a.lon, a.lat], [b.lon, b.lat]] };
    const mid = proj(geoInterpolate([a.lon, a.lat], [b.lon, b.lat])(0.5)) ?? [0, 0];
    return [
      {
        id: r.id,
        tradition: r.tradition,
        d: path(line) ?? "",
        kind: r.kind,
        title: r.title,
        description: r.description,
        level: r.level,
        year: r.year,
        from: a.name,
        to: b.name,
        mid: [mid[0], mid[1]] as [number, number],
        sources: r.sources.map((id) => L.source.get(id)).filter((s): s is NonNullable<typeof s> => !!s).map((s) => ({ title: s.title, url: s.url, publisher: s.publisher })),
      },
    ];
  });
  const nodeIds = new Set(rels.flatMap((r) => [r.from, r.to]));
  const nodes: RouteNode[] = [...nodeIds].flatMap((id) => {
    const p = L.place.get(id);
    const xy = p ? proj([p.lon, p.lat]) : null;
    return p && xy ? [{ id: p.name, name: p.name, x: xy[0], y: xy[1], traditions: rels.filter((r) => r.from === id || r.to === id).map((r) => r.tradition) }] : [];
  });

  return (
    <>
    <StoriesNav current="routes" />
    <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="label text-brick">Roots &amp; Routes</p>
          <h1 className="font-display mt-3 text-[clamp(3.2rem,9vw,8rem)]">The connection map</h1>
        </div>
        <div className="self-end lg:col-span-5">
          <p className="text-ink-soft">
            Traditions are rarely tied to a single point. This map shows documented exchanges — shared practice across borders, migrations of makers,
            museum journeys, commercial adaptations — each with its evidence label and sources.
          </p>
          <p className="mt-3 border-l-4 border-brick bg-bone p-3 text-sm">
            <strong>Visual similarity is never shown as influence.</strong> Where a resemblance is popularly claimed, it appears as a faint dotted line,
            labelled as such.
          </p>
        </div>
      </div>
      <div className="mt-10">
        <RoutesExplorer
          width={W}
          height={H}
          land={land}
          sphere={path({ type: "Sphere" }) ?? ""}
          graticule={path(geoGraticule10()) ?? ""}
          arcs={arcs}
          nodes={nodes}
          traditions={pub.filter((t) => rels.some((r) => r.tradition === t.slug)).map((t) => ({ slug: t.slug, name: t.name, color: ACCENT[t.accent].hex, no: t.passportNo }))}
          initial={typeof tradition === "string" ? tradition : undefined}
        />
      </div>
      <p className="mt-8 text-xs text-ink-mute">Boundaries: Natural Earth 1:110m; no position is implied on disputed territories. Places are plotted at approximate centres.</p>
    </div>
    </>
  );
}
