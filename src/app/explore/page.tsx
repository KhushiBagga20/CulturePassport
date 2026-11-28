import type { Metadata } from "next";
import Link from "next/link";
import { getArchive, isPublic } from "@/lib/data/archive";
import { countrySlug, loadCountries } from "@/lib/geo-server";
import { COUNTRY_STATUS } from "@/lib/labels";
import { CONTINENTS, continentOf } from "@/lib/continents";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Countries",
  description: "Every country on the Culture Passport atlas, with what is documented, being documented, or shared across borders.",
};

/** The accessible, text-first alternative to the globe. */
export default async function ExplorePage() {
  const archive = await getArchive();
  const published = archive.traditions.filter(isPublic);
  const fc = await loadCountries("110m");
  const curatedIso = new Set(archive.countries.map((c) => c.isoNumeric));
  const others = fc.features
    .map((f) => ({ name: f.properties?.name ?? "", iso: String(f.id).padStart(3, "0") }))
    .filter((c) => c.name && !curatedIso.has(c.iso))
    .sort((a, b) => a.name.localeCompare(b.name));
  const counts = (c: (typeof archive.countries)[number]) => {
    const own = published.filter((t) => t.collection === c.iso2).length;
    const shared = published.filter((t) => (c.sharedTraditions ?? []).includes(t.slug) && t.collection !== c.iso2).length;
    return { own, shared };
  };
  const countLine = (c: (typeof archive.countries)[number]) => {
    const { own, shared } = counts(c);
    return [
      own && `${own} passport${own === 1 ? "" : "s"}`,
      shared && `${shared} shared`,
      own + shared === 0 && c.candidates.length && `${c.candidates.length} being documented`,
    ]
      .filter(Boolean)
      .join(" · ");
  };
  const featured = archive.countries.filter((c) => c.status === "active");
  const rest = archive.countries.filter((c) => c.status !== "active");
  const regions = [...CONTINENTS, "Elsewhere"]
    .map((name) => ({ name, countries: rest.filter((c) => continentOf(c.iso2) === name).sort((a, b) => a.name.localeCompare(b.name)) }))
    .filter((r) => r.countries.length > 0);

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="label text-brick">The atlas, as a list</p>
          <h1 className="font-display mt-3 text-[clamp(2.81rem,7.8vw,6.84rem)]">Countries</h1>
        </div>
        <div className="flex max-w-md flex-col items-start gap-3 sm:items-end">
          <p className="text-ink-soft sm:text-right">
            The same atlas as the globe. A country appears as documented only when its sources have been verified.
          </p>
          <Link href="/" className="btn btn-cream">
            ← Back to the globe
          </Link>
        </div>
      </div>

      {featured.map((c) => {
        const { own } = counts(c);
        const crossBorder = published.filter((t) => t.collection === c.iso2 && t.countries.length > 1).length;
        const inDepth = published.filter((t) => t.collection === c.iso2 && t.maturity !== "editorial-draft").length;
        return (
          <Link
            key={c.slug}
            href={`/country/${c.slug}`}
            className="print-shadow group mt-12 grid gap-6 border-2 border-ink bg-orange p-6 text-ink sm:p-8 lg:grid-cols-12 lg:items-end"
          >
            <div className="min-w-0 lg:col-span-7">
              <p className="label">{COUNTRY_STATUS.active.label}</p>
              <p className="font-display mt-2 text-[clamp(3rem,9vw,7rem)] leading-[0.9] [overflow-wrap:anywhere]">{c.name}</p>
              <p className="mt-3 max-w-xl text-lg">{c.headline}</p>
            </div>
            <dl className="grid grid-cols-3 gap-3 lg:col-span-5">
              {[
                ["Passports", own],
                ["In depth", inDepth],
                ["Across borders", crossBorder],
              ].map(([k, v]) => (
                <div key={k} className="flex min-w-0 flex-col-reverse border-2 border-ink bg-bone p-3">
                  <dt className="label-sm mt-2 text-ink-mute">{k}</dt>
                  <dd className="font-display text-[clamp(1.8rem,4vw,3rem)] leading-none">{v}</dd>
                </div>
              ))}
            </dl>
            <span className="label lg:col-span-12">
              Open the collection <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </span>
          </Link>
        );
      })}

      {regions.map((r) => (
        <section key={r.name} aria-labelledby={`r-${r.name}`} className="mt-14">
          <div className="flex items-baseline justify-between gap-4 border-b-2 border-ink pb-2">
            <h2 id={`r-${r.name}`} className="font-display text-[clamp(1.9rem,3.5vw,2.8rem)]">
              {r.name}
            </h2>
            <p className="label-sm text-ink-mute">
              {r.countries.length} {r.countries.length === 1 ? "country" : "countries"}
            </p>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {r.countries.map((c) => (
              <li key={c.slug} className="min-w-0">
                <Link
                  href={`/country/${c.slug}`}
                  className={`group flex h-full items-center justify-between gap-3 border-2 bg-bone px-3 py-2.5 text-ink hover:bg-yellow sm:px-4 sm:py-3 ${c.status === "introductory" ? "border-ink" : "border-dashed border-ink"}`}
                >
                  <span className="min-w-0">
                    <span className="font-title block text-[1.1rem] leading-[1.05] sm:text-[1.45rem] [overflow-wrap:anywhere]">{c.name}</span>
                    <span className="label-sm mt-1 block text-ink-mute">
                      {countLine(c)}
                      {c.status !== "introductory" && ` · ${COUNTRY_STATUS[c.status].label}`}
                    </span>
                  </span>
                  <span aria-hidden className="font-display hidden shrink-0 text-xl transition-transform sm:inline group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-16 border-t-2 border-ink pt-8" aria-labelledby="others">
        <h2 id="others" className="label text-ink-mute">
          Not yet in the archive · {others.length} countries
        </h2>
        <ul className="mt-4 columns-2 gap-8 text-sm sm:columns-3 lg:columns-5">
          {others.map((c) => (
            <li key={c.iso + c.name} className="break-inside-avoid py-0.5">
              <Link href={`/country/${countrySlug(c.name)}`} className="text-ink-soft hover:text-brick">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
