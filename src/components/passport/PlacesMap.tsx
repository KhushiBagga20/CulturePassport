import type { Archive, Tradition } from "@/lib/types";
import { loadCountries } from "@/lib/geo-server";
import { buildRegionMap } from "@/components/country/regionMap";
import { PLACE_ROLE } from "@/lib/labels";
import { PlacesMapView } from "./PlacesMapView";

/** Server-side projection of every place a tradition is associated with; the interaction is client-side. */
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
  const legend = t.places.map((tp, i) => ({ n: i + 1, name: places.get(tp.place)?.name ?? tp.place, role: PLACE_ROLE[tp.role], note: tp.note }));
  const markerIndex = new Map(t.places.map((tp, i) => [places.get(tp.place)?.name, i + 1]));

  return (
    <PlacesMapView
      slug={t.slug}
      name={t.name}
      width={map.width}
      height={map.height}
      lands={map.lands.map((l) => ({ key: l.iso + l.name, d: l.d, focus: l.focus, shared: l.shared }))}
      links={map.links.map((l) => ({ key: l.key, d: l.d, dashed: l.dashed }))}
      markers={map.markers.map((m) => ({ key: m.key, x: m.x, y: m.y, n: markerIndex.get(m.place) ?? 0, place: m.place }))}
      legend={legend}
    />
  );
}
