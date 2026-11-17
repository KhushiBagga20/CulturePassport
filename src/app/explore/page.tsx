import type { Metadata } from "next";
import Link from "next/link";
import { getArchive, isPublic } from "@/lib/data/archive";
import { countrySlug, loadCountries } from "@/lib/geo-server";
import { COUNTRY_STATUS } from "@/lib/labels";
import type { CountryStatus } from "@/lib/types";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Country index",
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

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
      <p className="label text-terracotta">Atlas · text edition</p>
      <h1 className="font-display mt-3 text-[clamp(3.4rem,10vw,9rem)]">Country index</h1>
      <p className="mt-4 max-w-xl text-ink-soft">
        The same atlas as the globe, as a list. Collections are grown slowly: a country appears as &ldquo;documented&rdquo; only when its sources have
        been verified.{" "}
        <Link href="/" className="underline hover:text-terracotta">
          Return to the globe
        </Link>
        .
      </p>

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        {groups.map(
          (g) =>
            g.countries.length > 0 && (
              <section key={g.status} aria-labelledby={`g-${g.status}`}>
                <h2 id={`g-${g.status}`} className="label flex items-center gap-2" style={{ color: COUNTRY_STATUS[g.status].color }}>
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COUNTRY_STATUS[g.status].color }} />
                  {COUNTRY_STATUS[g.status].label}
                </h2>
                <p className="mt-1 text-sm text-ink-mute">{COUNTRY_STATUS[g.status].description}</p>
                <ul className="mt-4 divide-y divide-ink/10 border-y rule">
                  {g.countries.map((c) => {
                    const own = published.filter((t) => t.collection === c.iso2);
                    const shared = published.filter((t) => (c.sharedTraditions ?? []).includes(t.slug) && t.collection !== c.iso2);
                    return (
                      <li key={c.slug} className="py-4">
                        <Link href={`/country/${c.slug}`} className="font-display text-4xl hover:text-terracotta">
                          {c.name}
                        </Link>
                        <p className="mt-1 text-sm text-ink-soft">{c.headline}</p>
                        <p className="mt-2 text-sm">
                          {own.map((t) => (
                            <Link key={t.slug} href={`/passport/${t.slug}`} className="mr-3 underline hover:text-terracotta">
                              No. {t.passportNo} {t.name}
                            </Link>
                          ))}
                          {shared.map((t) => (
                            <Link key={t.slug} href={`/passport/${t.slug}`} className="mr-3 underline decoration-dotted hover:text-terracotta">
                              shared: {t.name}
                            </Link>
                          ))}
                          {own.length + shared.length === 0 &&
                            c.candidates.map((x) => (
                              <span key={x.name} className="mr-3 text-ink-mute">
                                candidate: {x.name}
                              </span>
                            ))}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ),
        )}
      </div>

      <section className="mt-20" aria-labelledby="others">
        <h2 id="others" className="label text-ink-mute">
          Not yet in the archive · {others.length} countries
        </h2>
        <ul className="mt-4 columns-2 gap-8 text-sm sm:columns-3 lg:columns-5">
          {others.map((c) => (
            <li key={c.iso + c.name} className="break-inside-avoid py-0.5">
              <Link href={`/country/${countrySlug(c.name)}`} className="text-ink-soft hover:text-terracotta">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
