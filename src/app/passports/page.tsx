import type { Metadata } from "next";
import Link from "next/link";
import { getArchive, isPublic, lookups } from "@/lib/data/archive";
import { ACCENT, CATEGORY, MATURITY } from "@/lib/labels";
import { Motif } from "@/components/motifs/Motif";
import { Reveal } from "@/components/site/Motion";
import { StoriesNav } from "@/components/site/StoriesNav";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Passport register",
  description: "Every published Culture Passport, by number: its tradition, region, community and research status.",
};

export default async function PassportsPage({ searchParams }: PageProps<"/passports">) {
  const { missing } = await searchParams;
  const archive = await getArchive();
  const L = lookups(archive);
  const published = archive.traditions.filter(isPublic);

  return (
    <>
      <StoriesNav current="passports" />
      <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="label text-brick">The register</p>
            <h1 className="font-display mt-3 text-[clamp(3.6rem,10vw,9rem)]">Passports</h1>
          </div>
          <p className="max-w-md text-ink-soft">
            In the order each entered the archive. Numbers are permanent: a printed QR code or a short link like{" "}
            <code className="font-ui bg-ink px-1.5 py-0.5 text-sm text-bone">/p/001</code> will always find its passport.
          </p>
        </div>
        {missing && (
          <p className="mt-6 max-w-xl border-l-4 border-brick bg-bone p-3 text-sm" role="alert">
            No published passport has the number “{String(missing)}”. It may not exist yet, or it may still be in editorial review.
          </p>
        )}

        <ol className="mt-12 grid gap-3">
          {published.map((t, i) => (
            <Reveal as="li" key={t.slug} delay={i * 0.04}>
              <Link
                href={`/passport/${t.slug}`}
                className="group grid grid-cols-[4.5rem_1fr] items-center gap-4 border-2 border-ink bg-bone pr-4 transition-transform hover:-translate-y-0.5 sm:grid-cols-[6rem_5.5rem_1fr_auto] sm:gap-6"
              >
                <span className="font-display flex h-full items-center justify-center self-stretch text-4xl sm:text-5xl" style={{ background: ACCENT[t.accent].hex, color: ACCENT[t.accent].ink }}>
                  {t.passportNo}
                </span>
                <span className="my-3 hidden h-20 w-16 overflow-hidden border-2 border-ink sm:block">
                  <Motif motif={t.motif} className="h-full w-full transition-transform duration-700 group-hover:scale-110" />
                </span>
                <span className="min-w-0 py-4">
                  <span className="font-display block text-[clamp(2rem,4vw,3.4rem)] group-hover:text-brick">{t.name}</span>
                  <span className="mt-1 block text-sm text-ink-soft">
                    {CATEGORY[t.category]} · {t.regionLabel} · {t.communities.map((c) => L.community.get(c.community)?.name).join(", ")}
                  </span>
                </span>
                <span className="col-span-2 flex flex-wrap gap-2 pb-4 pl-4 sm:col-span-1 sm:justify-end sm:p-0">
                  <span className="label-sm px-2.5 py-1" style={{ background: ACCENT[t.accent].soft }}>
                    {MATURITY[t.maturity].label}
                  </span>
                  {t.travels.cases.length > 0 && <span className="label-sm bg-brick px-2.5 py-1 text-bone">Attribution case</span>}
                  <span className="label-sm border-2 border-ink px-2.5 py-0.5">{t.claims.length} claims</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ol>
      </div>
    </>
  );
}
