import type { Metadata } from "next";
import Link from "next/link";
import { getArchive, isPublic, lookups } from "@/lib/data/archive";
import { ACCENT, CATEGORY, MATURITY } from "@/lib/labels";
import { Motif } from "@/components/motifs/Motif";
import { Reveal } from "@/components/site/Motion";

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
    <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
      <p className="label text-terracotta">The register</p>
      <h1 className="font-display mt-3 text-[clamp(3.4rem,10vw,9rem)]">Passports</h1>
      <p className="mt-4 max-w-xl text-ink-soft">
        Every published passport, in the order it entered the archive. Numbers are permanent: a printed QR code or a short link like{" "}
        <code className="font-mono text-sm">/p/001</code> will always find its passport.
      </p>
      {missing && (
        <p className="mt-6 max-w-xl border-l-4 border-terracotta bg-terracotta/10 p-3 text-sm" role="alert">
          No published passport has the number “{String(missing)}”. It may not exist yet, or it may still be in editorial review.
        </p>
      )}

      <ol className="mt-12 border-t-2 border-ink">
        {published.map((t, i) => (
          <Reveal as="li" key={t.slug} delay={i * 0.04}>
            <Link
              href={`/passport/${t.slug}`}
              className="group grid grid-cols-[3.5rem_1fr] items-center gap-4 border-b rule py-5 transition-colors hover:bg-paper sm:grid-cols-[5rem_5rem_1fr_auto] sm:gap-6"
            >
              <span className="font-mono text-sm text-ink-mute">No. {t.passportNo}</span>
              <span className="hidden h-20 w-16 overflow-hidden border border-ink/20 sm:block">
                <Motif motif={t.motif} className="h-full w-full transition-transform duration-700 group-hover:scale-110" />
              </span>
              <span className="min-w-0">
                <span className="font-display block text-[clamp(2rem,4vw,3.4rem)] group-hover:text-terracotta">{t.name}</span>
                <span className="mt-1 block text-sm text-ink-soft">
                  {CATEGORY[t.category]} · {t.regionLabel} · {t.communities.map((c) => L.community.get(c.community)?.name).join(", ")}
                </span>
              </span>
              <span className="col-span-2 flex flex-wrap gap-2 sm:col-span-1 sm:justify-end">
                <span className="label-sm rounded-full px-2.5 py-1" style={{ background: ACCENT[t.accent].soft }}>
                  {MATURITY[t.maturity].label}
                </span>
                {t.travels.cases.length > 0 && <span className="label-sm rounded-full bg-terracotta px-2.5 py-1 text-ivory">Attribution case</span>}
                <span className="label-sm rounded-full border rule px-2.5 py-1">{t.claims.length} claims</span>
              </span>
            </Link>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
