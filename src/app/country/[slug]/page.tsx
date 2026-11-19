import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { geoMercator, geoPath } from "d3-geo";
import { getArchive, isPublic, lookups } from "@/lib/data/archive";
import { whereLine } from "@/lib/data/views";
import { byIso, countrySlug, loadCountries } from "@/lib/geo-server";
import { buildRegionMap } from "@/components/country/regionMap";
import { CollectionExplorer, type ExplorerCard } from "@/components/country/CollectionExplorer";
import { ArrivalCurtain } from "@/components/country/ArrivalCurtain";
import { EvidenceBadge } from "@/components/site/Evidence";
import { ACCENT, CATEGORY, COUNTRY_STATUS, MATURITY } from "@/lib/labels";
import type { Archive, CountryRecord, Tradition } from "@/lib/types";

export const revalidate = 300;

export async function generateStaticParams() {
  const a = await getArchive();
  return a.countries.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/country/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArchive();
  const c = a.countries.find((x) => x.slug === slug);
  if (c) return { title: c.name, description: `${c.headline} ${c.intro}` };
  const fc = await loadCountries("110m");
  const f = fc.features.find((x) => countrySlug(x.properties?.name ?? "") === slug);
  return f ? { title: `${f.properties.name} — not yet documented` } : {};
}

export default async function CountryPage({ params }: PageProps<"/country/[slug]">) {
  const { slug } = await params;
  const archive = await getArchive();
  const country = archive.countries.find((c) => c.slug === slug);

  if (!country) {
    const fc = await loadCountries("110m");
    const f = fc.features.find((x) => countrySlug(x.properties?.name ?? "") === slug);
    if (!f) notFound();
    return <UndocumentedCountry name={f.properties.name} isoNumeric={String(f.id).padStart(3, "0")} archive={archive} />;
  }

  const published = archive.traditions.filter(isPublic);
  const own = published.filter((t) => t.collection === country.iso2);
  const shared = published.filter((t) => t.collection !== country.iso2 && (country.sharedTraditions ?? []).includes(t.slug));
  const L = lookups(archive);
  const status = COUNTRY_STATUS[country.status];

  const cardFor = (t: Tradition): ExplorerCard => ({
    slug: t.slug,
    no: t.passportNo,
    name: t.name,
    nativeName: t.nativeNames[0]?.text,
    where: whereLine(t, archive),
    community: t.communities.map((c) => L.community.get(c.community)?.name ?? c.community).join(", "),
    category: CATEGORY[t.category],
    categoryKey: t.category,
    summary: t.summary,
    maturity: MATURITY[t.maturity].label,
    motif: t.motif,
    accent: ACCENT[t.accent].hex,
    accentSoft: ACCENT[t.accent].soft,
    media: t.hero ? L.media.get(t.hero) : undefined,
    crossBorder: t.countries.length > 1,
    hasCase: t.travels.cases.length > 0,
  });

  const mapTraditions = [...own, ...shared];
  const countriesGeo = await loadCountries("50m");
  const sharedIsos = Array.from(
    new Set(mapTraditions.flatMap((t) => t.countries).filter((c) => c !== country.iso2).map((iso2) => archive.countries.find((c) => c.iso2 === iso2)?.isoNumeric ?? "")),
  ).filter(Boolean);
  const map = mapTraditions.length
    ? buildRegionMap(countriesGeo, country.isoNumeric, sharedIsos, mapTraditions, archive, country.iso2 === "AE" ? { width: 640, height: 520 } : undefined)
    : null;


  if (country.status === "documenting" || (country.status === "shared" && own.length === 0)) {
    return <DocumentingCountry country={country} archive={archive} shared={shared} outline={await outlinePath(country.isoNumeric)} />;
  }

  return (
    <>
      <ArrivalCurtain slug={country.slug} color={status.color} title={country.iso2 === "AE" ? "UAE" : country.name} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-cream">
        <div className="relative mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-6 lg:px-10">
          <nav aria-label="Breadcrumb" className="label-sm flex gap-2 text-ink-mute">
            <Link href="/" className="hover:text-brick">
              Explore
            </Link>
            <span aria-hidden>/</span>
            <span aria-current="page" className="text-ink">
              {country.name}
            </span>
          </nav>
          <Link href="/" className="btn btn-cream">
            ← Back to the globe
          </Link>
        </div>
        <div className="relative mx-auto grid max-w-[1500px] gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-12 lg:px-10 lg:pb-20">
          <div className="lg:col-span-7">
            <p className="label inline-flex items-center gap-2 bg-ink px-2.5 py-1.5 text-bone">
              <span aria-hidden style={{ color: status.color }}>
                ●
              </span>
              {country.plate} · {status.label}
            </p>
            <h1 className={`font-display reveal-rise mt-4 text-[clamp(3.51rem,13.26vw,11.4rem)] ${country.iso2 === "IN" ? "text-brick" : "text-teal"}`}>
              {country.iso2 === "AE" ? "UAE" : country.name}
            </h1>
            <p className="font-title mt-2 max-w-2xl text-[clamp(1.8rem,3.4vw,2.9rem)] leading-[1.05]">{country.headline}</p>
            <p className="lead mt-5 max-w-xl text-ink-soft">{country.intro}</p>
          </div>
          <div className="relative self-end lg:col-span-4 lg:col-start-9">
            <dl className="grid grid-cols-3 gap-3 lg:grid-cols-1">
              {[
                ["Passports", own.length, "bg-orange text-ink"],
                ["Shared across borders", own.filter((t) => t.countries.length > 1).length, "bg-cobalt text-bone"],
                ["Awaiting documentation", country.candidates.length, "bg-green text-bone"],
              ].map(([k, v, c]) => (
                <div key={k as string} className={`${c} flex min-w-0 flex-col-reverse justify-end p-3 sm:p-4`}>
                  <dt className="label-sm mt-2 hyphens-auto [overflow-wrap:anywhere]">{k}</dt>
                  <dd className="font-display text-5xl leading-none">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm text-ink-soft">
              Every passport labels its claims — <EvidenceBadge level="documented" compact /> <EvidenceBadge level="disputed" compact />{" "}
              <EvidenceBadge level="unverified" compact /> — and drafts say so.
            </p>
          </div>
        </div>
      </section>

      {/* Gallery + map */}
      <section aria-labelledby="gallery-title" className="mx-auto max-w-[1500px] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 id="gallery-title" className="font-display text-[clamp(2.34rem,5.07vw,4.26rem)]">
            The collection
          </h2>
          <p className="max-w-sm text-sm text-ink-soft">Filter by craft, pick a place on the map, or open a card for the full passport.</p>
        </div>
        <CollectionExplorer cards={[...own, ...shared].map(cardFor)} map={map} />
      </section>

      {/* Awaiting documentation */}
      {country.candidates.length > 0 && (
        <section className="mx-auto max-w-[1500px] px-4 py-20 sm:px-6 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label text-terracotta">Stories being documented</p>
              <h2 className="font-display mt-3 text-4xl">Not yet in the archive</h2>
            </div>
            <p className="max-w-md text-sm text-ink-soft">
              Each has a place, a community and people behind it. None will be published until its sources are verified.
            </p>
          </div>
          <ul className="mt-10 grid border-t rule sm:grid-cols-2 lg:grid-cols-3">
            {country.candidates.map((c, i) => (
              <li key={c.name} className="flex items-baseline gap-4 border-b rule py-4 sm:pr-6">
                <span className="font-display text-2xl text-brick">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-title text-2xl">{c.name}</span>
                <span className="label-sm ml-auto text-right text-ink-mute">{c.note}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mx-auto max-w-[1500px] px-4 pb-12 text-xs text-ink-mute sm:px-6 lg:px-10">
        Maps use Natural Earth boundaries and do not represent a position on any disputed territory. Places are plotted at approximate district or
        town centres.
      </p>
    </>
  );
}

async function outlinePath(isoNumeric: string): Promise<string | null> {
  const fc = await loadCountries("50m");
  const f = byIso(fc, isoNumeric);
  if (!f) return null;
  const proj = geoMercator().fitExtent(
    [
      [20, 20],
      [480, 480],
    ],
    f,
  );
  return geoPath(proj)(f);
}

function DocumentingCountry({ country, archive, shared, outline }: { country: CountryRecord; archive: Archive; shared: Tradition[]; outline: string | null }) {
  const status = COUNTRY_STATUS[country.status];
  const sources = new Map(archive.sources.map((s) => [s.id, s]));
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="contour-bg absolute inset-0 opacity-60" />
      <div className="relative mx-auto grid max-w-[1500px] gap-12 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:px-10 lg:py-24">
        <div className="lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav aria-label="Breadcrumb" className="label-sm flex gap-2 text-ink-mute">
              <Link href="/" className="hover:text-brick">
                Explore
              </Link>
              <span aria-hidden>/</span>
              <span aria-current="page" className="text-ink">
                {country.name}
              </span>
            </nav>
            <Link href="/" className="btn btn-cream">
              ← Back to the globe
            </Link>
          </div>
          <p className="label mt-8" style={{ color: status.color }}>
            {country.plate} · {status.label}
          </p>
          <h1 className="font-display reveal-rise mt-4 text-[clamp(3.12rem,10.92vw,9.12rem)] text-ink">{country.name}</h1>
          <p className="font-title mt-4 text-[clamp(1.8rem,3.4vw,3rem)] italic leading-tight text-brick">{country.headline}</p>
          <p className="mt-5 max-w-xl text-ink-soft">{country.intro}</p>

          {country.candidates.length > 0 && (
            <div className="mt-10 border-t rule pt-6">
              <p className="label text-ink-mute">Candidate {country.candidates.length > 1 ? "traditions" : "tradition"}</p>
              <ul className="mt-4 space-y-5">
                {country.candidates.map((c) => (
                  <li key={c.name}>
                    <p className="font-display text-3xl">{c.name}</p>
                    <p className="mt-1 max-w-xl text-ink-soft">{c.note}</p>
                    {c.sources?.map((id) => {
                      const s = sources.get(id);
                      return s ? (
                        <a key={id} href={s.url} target="_blank" rel="noreferrer" className="label-sm mt-2 inline-block text-ink-mute underline hover:text-brick">
                          Source: {s.publisher}, {s.date} ↗
                        </a>
                      ) : null;
                    })}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {shared.length > 0 && (
            <div className="mt-10 border-t rule pt-6">
              <p className="label text-ink-mute">{country.status === "shared" ? "Traditions shared with this country" : "Already connected to this archive"}</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {shared.map((t) => (
                  <li key={t.slug}>
                    <Link href={`/passport/${t.slug}`} className="group flex items-center gap-4 border-2 border-ink bg-bone p-4 transition-transform hover:-translate-y-0.5">
                      <span className="h-14 w-14 shrink-0 overflow-hidden border border-ink/20">
                        {/* motif thumbnails keep this page light */}
                        <span className="block h-full w-full" style={{ background: ACCENT[t.accent].hex }} />
                      </span>
                      <span>
                        <span className="font-ui text-xs text-ink-mute">No. {t.passportNo}</span>
                        <span className="font-display block text-2xl group-hover:text-brick">{t.name}</span>
                        <span className="label-sm text-ink-mute">{t.regionLabel}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="lg:col-span-5">
          {outline && (
            <svg viewBox="0 0 500 500" className="w-full max-w-md" role="img" aria-label={`Outline of ${country.name}`}>
              <defs>
                <pattern id="doc-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="8" stroke={status.color} strokeWidth="2" strokeOpacity="0.6" />
                </pattern>
              </defs>
              <path d={outline} fill="url(#doc-hatch)" stroke="#1B1616" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
          )}
          <div className="mt-8 border-2 border-ink bg-bone p-6">
            <p className="label text-brick">Before anything is published here</p>
            <ol className="mt-4 space-y-2 text-sm text-ink-soft">
              <li>1 · Research primary records, museum holdings and scholarship.</li>
              <li>2 · Speak with practitioners and community organisations, with consent.</li>
              <li>3 · Label every claim by its evidence; mark what is uncertain.</li>
              <li>4 · Credit and licence every image; use no generated imagery as evidence.</li>
              <li>5 · Editorial review, then publication — and corrections when we are wrong.</li>
            </ol>
            <Link href="/method" className="btn btn-ink mt-5">
              Read how we work →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

async function UndocumentedCountry({ name, isoNumeric, archive }: { name: string; isoNumeric: string; archive: Archive }) {
  const outline = await outlinePath(isoNumeric);
  const collections = archive.countries.filter((c) => c.status === "active" || c.status === "introductory");
  return (
    <section className="mx-auto grid max-w-[1500px] gap-12 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:px-10 lg:py-24">
      <div className="lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="label-sm flex gap-2 text-ink-mute">
            <Link href="/" className="hover:text-brick">
              Explore
            </Link>
            <span aria-hidden>/</span>
            <span aria-current="page" className="text-ink">
              {name}
            </span>
          </nav>
          <Link href="/" className="btn btn-cream">
            ← Back to the globe
          </Link>
        </div>
        <p className="label mt-8 text-ink-mute">Not yet in the archive</p>
        <h1 className="font-display mt-4 text-[clamp(2.73rem,9.36vw,7.6rem)]">{name}</h1>
        <p className="mt-5 max-w-xl text-ink-soft">
          No stories from {name} have been documented yet. Culture Passport publishes a collection only after its sources are verified and the
          communities involved have been consulted — so this page stays honest rather than full.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {collections.map((c) => (
            <Link key={c.slug} href={`/country/${c.slug}`} className="btn btn-cream">
              Visit {c.name} →
            </Link>
          ))}
          <Link href="/method" className="btn btn-cream">
            How we choose
          </Link>
        </div>
      </div>
      <div className="lg:col-span-5">
        {outline && (
          <svg viewBox="0 0 500 500" className="w-full max-w-md opacity-80" role="img" aria-label={`Outline of ${name}`}>
            <path d={outline} fill="#E1D4B5" stroke="#1B1616" strokeWidth="2" strokeDasharray="3 5" />
          </svg>
        )}
      </div>
    </section>
  );
}
