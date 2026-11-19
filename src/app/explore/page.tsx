import type { Metadata } from "next";
import Link from "next/link";
import { getArchive, isPublic } from "@/lib/data/archive";
import { countrySlug, loadCountries } from "@/lib/geo-server";
import { COUNTRY_STATUS } from "@/lib/labels";
import type { CountryStatus } from "@/lib/types";

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
  const groups = (["active", "introductory", "shared", "documenting"] as CountryStatus[]).map((s) => ({
    status: s,
    countries: archive.countries.filter((c) => c.status === s),
  }));

  const tone: Record<CountryStatus, string> = {
    active: "bg-orange text-ink",
    introductory: "bg-cobalt text-bone",
    shared: "bg-bone text-ink border-2 border-ink",
    documenting: "bg-green text-bone",
  };

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

      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        {groups.map(
          (g) =>
            g.countries.length > 0 && (
              <section key={g.status} aria-labelledby={`g-${g.status}`} className={`p-5 sm:p-6 ${tone[g.status]}`}>
                <h2 id={`g-${g.status}`} className="label flex items-center gap-2">
                  <span className="h-3 w-3 border border-current" style={{ background: COUNTRY_STATUS[g.status].color }} />
                  {COUNTRY_STATUS[g.status].label}
                </h2>
                <p className="mt-1 text-sm opacity-80">{COUNTRY_STATUS[g.status].description}</p>
                <ul className="mt-4 grid gap-2">
                  {g.countries.map((c) => {
                    const own = published.filter((t) => t.collection === c.iso2);
                    const shared = published.filter((t) => (c.sharedTraditions ?? []).includes(t.slug) && t.collection !== c.iso2);
                    return (
                      <li key={c.slug} className="border-2 border-ink bg-bone p-4 text-ink">
                        <Link href={`/country/${c.slug}`} className="group flex items-baseline justify-between gap-3">
                          <span className="font-display text-3xl group-hover:text-brick">{c.name}</span>
                          <span aria-hidden className="font-display text-2xl transition-transform group-hover:translate-x-1">
                            →
                          </span>
                        </Link>
                        <p className="mt-1 text-sm text-ink-soft">{c.headline}</p>
                        {/* Counts only: the passports themselves live on the country page and in Stories. */}
                        <p className="label-sm mt-3 text-ink-mute">
                          {[
                            own.length && `${own.length} passport${own.length === 1 ? "" : "s"}`,
                            shared.length && `${shared.length} shared across a border`,
                            own.length + shared.length === 0 && c.candidates.length && `${c.candidates.length} being documented`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ),
        )}
      </div>

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
