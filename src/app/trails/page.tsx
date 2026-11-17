import type { Metadata } from "next";
import Link from "next/link";
import { getArchive, lookups } from "@/lib/data/archive";
import { ACCENT } from "@/lib/labels";
import { Motif } from "@/components/motifs/Motif";
import { Reveal } from "@/components/site/Motion";

export const revalidate = 300;
export const metadata: Metadata = { title: "Cultural trails", description: "Thematic journeys through several Culture Passports." };

export default async function TrailsPage() {
  const archive = await getArchive();
  const L = lookups(archive);
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
      <p className="label text-terracotta">Cultural trails</p>
      <h1 className="font-display mt-3 text-[clamp(3.4rem,10vw,9rem)]">Follow a thread</h1>
      <p className="mt-4 max-w-xl text-ink-soft">
        Journeys across several passports, each linked by an editorial reason — a technique, a border, a market — never by resemblance alone.
      </p>
      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        {archive.trails.map((tr, i) => (
          <Reveal key={tr.slug} delay={i * 0.05}>
            <Link href={`/trails/${tr.slug}`} className="group block border-t-4 pt-6" style={{ borderColor: ACCENT[tr.accent].hex }}>
              <p className="label-sm text-ink-mute">
                {tr.kicker} · {tr.steps.length} stops
              </p>
              <h2 className="font-display mt-2 text-[clamp(2.6rem,5vw,4.2rem)] group-hover:text-terracotta">{tr.title}</h2>
              <p className="mt-3 max-w-lg text-ink-soft">{tr.intro}</p>
              <div className="mt-6 flex items-center">
                {tr.steps.map((s, j) => {
                  const t = L.tradition.get(s.tradition);
                  return t ? (
                    <span key={s.tradition} className="flex items-center">
                      <span className="h-16 w-16 overflow-hidden rounded-full border-2 border-ivory shadow" title={t.name}>
                        <Motif motif={t.motif} className="h-full w-full" />
                      </span>
                      {j < tr.steps.length - 1 && <span aria-hidden className="w-6 border-t-2 border-dotted border-ink/50 sm:w-10" />}
                    </span>
                  ) : null;
                })}
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
