import type { Metadata } from "next";
import Link from "next/link";
import { getArchive, lookups } from "@/lib/data/archive";
import { ACCENT } from "@/lib/labels";
import { Motif } from "@/components/motifs/Motif";
import { Reveal } from "@/components/site/Motion";
import { StoriesNav } from "@/components/site/StoriesNav";

export const revalidate = 300;
export const metadata: Metadata = { title: "Cultural trails", description: "Thematic journeys through several Culture Passports." };

export default async function TrailsPage() {
  const archive = await getArchive();
  const L = lookups(archive);
  return (
    <>
      <StoriesNav current="trails" />
      <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="label text-brick">Cultural trails</p>
            <h1 className="font-display mt-3 text-[clamp(3.6rem,10vw,9rem)]">Follow a thread</h1>
          </div>
          <p className="max-w-md text-ink-soft">
            Journeys across several passports, each linked by an editorial reason — a technique, a border, a market — never by resemblance alone.
          </p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {archive.trails.map((tr, i) => (
            <Reveal key={tr.slug} delay={i * 0.05}>
              <Link href={`/trails/${tr.slug}`} className="group flex h-full flex-col border-2 border-ink bg-bone transition-transform hover:-translate-y-1">
                <span className="flex items-center justify-between px-5 py-3" style={{ background: ACCENT[tr.accent].hex, color: ACCENT[tr.accent].ink }}>
                  <span className="label">{tr.kicker}</span>
                  <span className="label">{tr.steps.length} stops</span>
                </span>
                <span className="flex flex-1 flex-col p-6">
                  <h2 className="font-display text-[clamp(2.6rem,5vw,4.2rem)] group-hover:text-brick">{tr.title}</h2>
                  <p className="mt-3 max-w-lg text-ink-soft">{tr.intro}</p>
                  <span className="mt-6 flex items-center">
                    {tr.steps.map((s, j) => {
                      const t = L.tradition.get(s.tradition);
                      return t ? (
                        <span key={s.tradition} className="flex items-center">
                          <span className="h-16 w-16 overflow-hidden border-2 border-ink" title={t.name}>
                            <Motif motif={t.motif} className="h-full w-full" />
                          </span>
                          {j < tr.steps.length - 1 && <span aria-hidden className="h-0.5 w-6 bg-ink sm:w-10" />}
                        </span>
                      ) : null;
                    })}
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
}
