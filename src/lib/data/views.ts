import type { Archive, Tradition } from "../types";
import type { GlobeCountry } from "@/components/globe/geo";
import { countryEntries, entryLabel, isPublic, lookups } from "./archive";

/** Where a tradition is, in a few words — always naming every country it belongs to. */
export function whereLine(t: Tradition, a: Archive): string {
  if (t.regionLabel) return t.regionLabel;
  const L = lookups(a);
  return t.countries.map((c) => L.country.get(c)?.name ?? c).join(" · ");
}

export function globeCountries(a: Archive): GlobeCountry[] {
  const pub = a.traditions.filter(isPublic);
  const bySlug = new Map(pub.map((t) => [t.slug, t]));
  const entries = countryEntries(a);
  return a.countries.map((c) => {
    const passports = pub
      .filter((t) => t.collection === c.iso2)
      .map((t) => ({ slug: t.slug, name: t.name, no: t.passportNo, entry: entries.get(t.slug)?.n }));
    const shared = (c.sharedTraditions ?? [])
      .map((s) => bySlug.get(s))
      .filter((t): t is Tradition => !!t && t.collection !== c.iso2)
      .map((t) => ({ slug: t.slug, name: t.name, no: t.passportNo }));
    return {
      isoNumeric: c.isoNumeric,
      iso2: c.iso2,
      slug: c.slug,
      name: c.name,
      status: c.status,
      headline: c.headline,
      intro: c.intro,
      passports,
      shared,
      candidates: c.candidates.map((x) => x.name),
      href: `/country/${c.slug}`,
    };
  });
}

export function passportIndex(a: Archive) {
  const entries = countryEntries(a);
  return a.traditions
    .filter(isPublic)
    .map((t) => ({ no: t.passportNo, slug: t.slug, name: t.name, where: whereLine(t, a), entry: entryLabel(entries.get(t.slug)) }));
}
