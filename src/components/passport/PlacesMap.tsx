import type { Archive, Tradition } from "@/lib/types";
import { loadCountries } from "@/lib/geo-server";
import { buildRegionMap } from "@/components/country/regionMap";
import { PLACE_ROLE } from "@/lib/labels";

/** A static, server-rendered map of every place a tradition is associated with. */
export async function PlacesMap({ t, archive }: { t: Tradition; archive: Archive }) {
  const countries = await loadCountries("50m");
  const collection = archive.countries.find((c) => c.iso2 === t.collection);
  if (!collection) return null;
  const sharedIsos = t.countries
    .filter((c) => c !== t.collection)
    .map((iso2) => archive.countries.find((c) => c.iso2 === iso2)?.isoNumeric)
    .filter((x): x is string => !!x);
  const map = buildRegionMap(countries, collection.isoNumeric, sharedIsos, [t], archive, { width: 560, height: 480 }, "places");
  const places = new Map(archive.places.map((p) => [p.id, p]));
  const legend = t.places.map((tp, i) => ({ n: i + 1, place: places.get(tp.place), role: tp.role, note: tp.note }));
  const markerIndex = new Map(t.places.map((tp, i) => [places.get(tp.place)?.name, i + 1]));

  return (
    <figure className="border rule bg-paper/60">
      <svg viewBox={`0 0 ${map.width} ${map.height}`} className="h-auto w-full" role="img" aria-label={`Map of places associated with ${t.name}`}>
        <defs>
          <pattern id={`pm-hatch-${t.slug}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#EADCC9" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#581D30" strokeOpacity="0.35" strokeWidth="1.4" />
          </pattern>
        </defs>
        <rect width={map.width} height={map.height} fill="#E9DDC4" />
        {map.lands.map((l) => (
          <path
            key={l.iso + l.name}
            d={l.d}
            fill={l.focus ? "#F6F0E3" : l.shared ? `url(#pm-hatch-${t.slug})` : "#DDCDAE"}
            stroke="#211C19"
            strokeOpacity={l.focus || l.shared ? 0.6 : 0.25}
            strokeWidth={l.focus ? 1.1 : 0.6}
          />
        ))}
        {map.links.map((ln) => (
          <path key={ln.key} d={ln.d} fill="none" stroke="var(--accent)" strokeWidth={1.4} strokeDasharray={ln.dashed ? "2 5" : "6 4"} />
        ))}
        {map.markers.map((m) => (
          <g key={m.key} transform={`translate(${m.x.toFixed(1)} ${m.y.toFixed(1)})`}>
            <circle r={9} fill="var(--accent)" fillOpacity={0.18} />
            <circle r={6.5} fill="var(--accent)" stroke="#F6F0E3" strokeWidth={1.4} />
            <text y={2.6} textAnchor="middle" fill="#F6F0E3" style={{ fontFamily: "var(--font-mono)", fontSize: 7.5, fontWeight: 500 }}>
              {markerIndex.get(m.place) ?? ""}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="border-t rule p-4">
        <ol className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {legend.map((l) => (
            <li key={`${l.n}-${l.place?.id}`} className="flex items-baseline gap-2">
              <span className="font-mono text-[0.68rem] text-[var(--accent)]">{l.n}</span>
              <span>
                {l.place?.name}
                <span className="label-sm ml-2 text-ink-mute">{PLACE_ROLE[l.role]}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="label-sm mt-3 text-ink-mute">Approximate centres · hatched: shared across a border · boundaries: Natural Earth</p>
      </figcaption>
    </figure>
  );
}
