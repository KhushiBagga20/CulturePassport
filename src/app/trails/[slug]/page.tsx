import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArchive, isPublic, lookups } from "@/lib/data/archive";
import { ACCENT, CATEGORY, accentVars } from "@/lib/labels";
import { ArchiveImage } from "@/components/site/ArchiveImage";
import { Motif } from "@/components/motifs/Motif";
import { Reveal } from "@/components/site/Motion";
import { StoriesNav } from "@/components/site/StoriesNav";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getArchive()).trails.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/trails/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tr = (await getArchive()).trails.find((t) => t.slug === slug);
  return tr ? { title: `${tr.title} — trail`, description: tr.intro } : {};
}

export default async function TrailPage({ params }: PageProps<"/trails/[slug]">) {
  const { slug } = await params;
  const archive = await getArchive();
  const tr = archive.trails.find((t) => t.slug === slug);
  if (!tr) notFound();
  const L = lookups(archive);
  const steps = tr.steps.map((s) => ({ ...s, t: L.tradition.get(s.tradition) })).filter((s) => s.t && isPublic(s.t));
  const accent = ACCENT[tr.accent].hex;

  return (
    <>
    <StoriesNav current="trails" />
    <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-10 lg:py-20" style={accentVars(tr.accent)}>
      <Link href="/trails" className="label inline-flex items-center gap-2 border-b-2 border-ink pb-0.5 hover:text-brick">
        ← All trails
      </Link>
      <p className="label mt-8 inline-block px-2 py-1" style={{ background: accent, color: ACCENT[tr.accent].ink }}>
        {tr.kicker} · {steps.length} stops
      </p>
      <h1 className="font-display mt-3 text-[clamp(2.5rem,7.02vw,6.08rem)]">{tr.title}</h1>
      <p className="font-title mt-4 max-w-2xl text-2xl leading-snug">{tr.intro}</p>
      {steps[0] && (
        <Link href={`/passport/${steps[0].tradition}?trail=${tr.slug}`} className="btn btn-ink mt-8">
          Begin the trail →
        </Link>
      )}

      <ol className="relative mt-16">
        <span aria-hidden className="absolute bottom-10 left-[1.65rem] top-10 w-1 -translate-x-1/2 bg-ink sm:left-[2.2rem]" />
        {steps.map((s, i) => {
          const t = s.t!;
          const hero = t.hero ? L.media.get(t.hero) : undefined;
          return (
            <Reveal as="li" key={s.tradition} delay={i * 0.06} className="relative grid grid-cols-[3.4rem_1fr] gap-4 pb-14 sm:grid-cols-[4.4rem_1fr] sm:gap-8">
              <span className="font-display relative z-10 flex h-14 w-14 items-center justify-center border-2 border-ink bg-[var(--accent)] text-2xl text-[var(--accent-ink)] sm:h-[4.4rem] sm:w-[4.4rem] sm:text-2xl">
                {i + 1}
              </span>
              <Link href={`/passport/${t.slug}?trail=${tr.slug}`} className="group grid gap-6 border-2 border-ink bg-bone p-5 transition-transform hover:-translate-y-0.5 md:grid-cols-[1fr_16rem]">
                <div>
                  <p className="label-sm text-ink-mute">
                    No. {t.passportNo} · {CATEGORY[t.category]} · {t.regionLabel}
                  </p>
                  <p className="font-display mt-2 text-4xl group-hover:text-brick">{t.name}</p>
                  <p className="font-title mt-2 text-2xl italic text-[var(--accent-text)]">{s.note}</p>
                  <p className="mt-3 text-ink-soft">{t.summary}</p>
                </div>
                <div className="aspect-[4/3] overflow-hidden border-2 border-ink md:aspect-square">
                  {hero ? (
                    <ArchiveImage media={hero} fallbackMotif={t.motif} linkCredit={false} className="h-full w-full" sizes="16rem" width={500} />
                  ) : (
                    <Motif motif={t.motif} className="h-full w-full" />
                  )}
                </div>
              </Link>
            </Reveal>
          );
        })}
      </ol>
    </div>
    </>
  );
}
