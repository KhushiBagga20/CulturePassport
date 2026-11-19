import Link from "next/link";
import { getArchive, isPublic, lookups } from "@/lib/data/archive";
import { globeCountries, passportIndex } from "@/lib/data/views";
import { GlobeExperience } from "@/components/globe/GlobeExperience";
import { Reveal } from "@/components/site/Motion";
import { ArchiveImage } from "@/components/site/ArchiveImage";
import { Motif } from "@/components/motifs/Motif";

export const revalidate = 300;

const WRAP = "mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10";

export default async function HomePage() {
  const archive = await getArchive();
  const L = lookups(archive);
  const published = archive.traditions.filter(isPublic);
  const flagship = published.find((t) => t.slug === "kolhapuri-chappal") ?? published[0];
  const flagshipCase = flagship?.travels.cases[0];
  const hero = flagship?.hero ? L.media.get(flagship.hero) : undefined;
  const count = (iso: string) => published.filter((t) => t.collection === iso).length;
  const plural = (n: number) => `${n} passport${n === 1 ? "" : "s"}`;

  return (
    <>
      <GlobeExperience countries={globeCountries(archive)} passports={passportIndex(archive)} />

      {/* ─────────── The gap ─────────── */}
      <section className="border-b-2 border-ink bg-orange">
        <div className={`${WRAP} grid gap-12 py-20 lg:grid-cols-12 lg:py-28`}>
          <Reveal className="lg:col-span-5">
            <p className="label">The gap</p>
            <h2 className="font-display mt-4 text-[clamp(2.34rem,4.68vw,4.26rem)]">
              The image travels. <span className="text-bone [-webkit-text-stroke:2px_#1B1616]">Does the story?</span>
            </h2>
            <p className="lead mt-6 max-w-md">
              A craft made in one place can reach millions in seconds. What arrives is a pattern, a product, a post. What is often left behind is the
              origin, the maker, the community and the meaning.
            </p>
            <p className="mt-4 max-w-md font-semibold">We are not against inspiration, adaptation or exchange. We are against cultural context disappearing.</p>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-6">
              <div className="print-shadow bg-cobalt p-5 text-bone sm:p-7">
                <p className="label text-yellow">What travelled fast</p>
                <ul className="font-display mt-5 space-y-1 text-[clamp(1.25rem,2.65vw,2.2rem)]">
                  <li>Artwork</li>
                  <li>Viral post</li>
                  <li>Global reach</li>
                </ul>
              </div>
              <div className="hidden flex-col items-center justify-center gap-2 sm:flex" aria-hidden>
                <span className="font-display text-3xl">→</span>
                <span className="vertical-label label-sm">The gap</span>
                <span className="w-0 flex-1 border-l-2 border-dashed border-ink" />
              </div>
              <div className="border-4 border-dashed border-ink bg-bone/40 p-5 sm:p-7">
                <p className="label text-brick">What got left behind</p>
                <ul className="font-display mt-5 space-y-1 text-[clamp(1.25rem,2.65vw,2.2rem)] text-ink/70">
                  <li>Origin?</li>
                  <li>Maker?</li>
                  <li>Community?</li>
                  <li>Meaning?</li>
                  <li>Source?</li>
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────── Flagship case ─────────── */}
      {flagship && flagshipCase && (
        <section className="border-b-2 border-ink bg-ink text-bone">
          <div className={`${WRAP} grid gap-12 py-20 lg:grid-cols-12 lg:py-28`}>
            <Reveal className="relative lg:col-span-5">
              <div className="relative mb-4 mr-4">
                <span aria-hidden className="absolute -bottom-4 -right-4 left-4 top-4 bg-vermilion" />
                {hero ? (
                  <ArchiveImage media={hero} fallbackMotif={flagship.motif} className="relative aspect-[4/5] w-full border-2 border-bone" sizes="(min-width:1024px) 40vw, 100vw" />
                ) : (
                  <Motif motif={flagship.motif} className="relative aspect-square w-full" />
                )}
              </div>
              <p className="label-sm mt-4 text-bone/60">{hero?.caption}</p>
            </Reveal>
            <Reveal delay={0.1} className="flex flex-col justify-center lg:col-span-6 lg:col-start-7">
              <p className="label inline-flex self-start bg-yellow px-2 py-1 text-ink">
                Case file {flagshipCase.code} · Passport No. {flagship.passportNo}
              </p>
              <h2 className="font-display mt-5 text-[clamp(2.5rem,5.85vw,5.32rem)]">{flagship.name}</h2>
              <p className="font-title mt-2 text-3xl italic text-yellow">{flagship.tagline}</p>
              <p className="lead mt-6 max-w-xl text-bone/85">{flagshipCase.summary}</p>
              <dl className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {[
                  ["Made in", "8 districts, 2 states", "bg-cobalt"],
                  ["On the runway", "Milan, June 2025", "bg-brick"],
                  ["Status", "Inspiration acknowledged", "bg-green"],
                ].map(([k, v, c]) => (
                  <div key={k} className={`${c} p-4`}>
                    <dt className="label-sm opacity-80">{k}</dt>
                    <dd className="font-title mt-1 text-xl leading-tight">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={`/passport/${flagship.slug}#travels`} className="btn btn-yellow">
                  Read the case file →
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ─────────── How it works ─────────── */}
      <section className="border-b-2 border-ink bg-green text-bone">
        <div className={`${WRAP} grid gap-12 py-20 lg:grid-cols-12 lg:py-28`}>
          <Reveal className="lg:col-span-4">
            <p className="label text-yellow">How it works</p>
            <h2 className="font-display mt-4 text-[clamp(2.18rem,3.9vw,3.5rem)]">A QR code beside the object.</h2>
            <p className="font-title mt-2 text-3xl italic text-yellow">The whole story behind it.</p>
            <p className="mt-5 max-w-sm text-bone/85">In a museum, a workshop, a market stall or on a product: scan, and the passport opens — no app, no account.</p>
            {flagship && (
              <Link href={`/passport/${flagship.slug}/label`} className="mt-8 inline-flex items-center gap-4 border-2 border-ink bg-bone p-3 pr-5 text-ink transition-transform hover:-translate-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element -- generated SVG QR code */}
                <img src={`/api/qr/${flagship.slug}?format=svg`} alt={`QR code for the ${flagship.name} passport`} className="h-20 w-20" width={80} height={80} />
                <span>
                  <span className="label-sm block text-ink-mute">Try it with your phone</span>
                  <span className="font-display text-2xl">Print a label</span>
                </span>
              </Link>
            )}
          </Reveal>
          <ol className="grid gap-2 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3" aria-label="From object to story, in five steps">
            {[
              ["See", "You spot a traditional object, pattern or product."],
              ["Scan", "Its Culture Passport QR opens a stable public page."],
              ["Understand", "Where it comes from, what it means, how it's made."],
              ["Credit", "Meet the makers and community behind it."],
              ["Connect", "Support or collaborate — responsibly."],
            ].map(([title, text], i) => (
              <Reveal
                as="li"
                key={title}
                delay={i * 0.06}
                className={`flex min-w-0 flex-col bg-bone p-5 text-ink ${i === 4 ? "sm:col-span-2 lg:col-span-1" : ""}`}
              >
                <span className="font-display text-4xl leading-none text-green">{i + 1}</span>
                <p className="font-display mt-3 text-[1.52rem]">{title}</p>
                <p className="mt-1 text-sm text-ink-soft">{text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ─────────── The habit ─────────── */}
      <section className="border-b-2 border-ink bg-cream">
        <div className={`${WRAP} py-20 lg:py-28`}>
          <Reveal>
            <p className="label text-brick">The habit we want</p>
            <h2 className="font-display mt-3 max-w-5xl text-[clamp(2.34rem,5.85vw,5.47rem)]">Before you share culture, pause.</h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              ["Stop", "Don't share blindly.", "bg-brick text-bone"],
              ["Check", "Is the information reliable?", "bg-cobalt text-bone"],
              ["Understand", "Know the origin and meaning.", "bg-orange text-ink"],
              ["Credit", "Recognise the people behind it.", "bg-green text-bone"],
              ["Share", "Now help the story travel too.", "bg-ink text-bone"],
            ].map(([w, t, c], i) => (
              <Reveal key={w} delay={i * 0.05} className={`${c} flex min-h-48 flex-col p-5`}>
                <span className="font-display text-5xl leading-none opacity-40">0{i + 1}</span>
                <p className="font-display mt-auto break-words text-[clamp(1.35rem,6vw,1.95rem)]">{w}</p>
                <p className="mt-1 text-sm opacity-90">{t}</p>
              </Reveal>
            ))}
          </div>
          <p className="label mt-6 text-ink-mute">A small human habit. No app needed.</p>
        </div>
      </section>

      {/* ─────────── India → UAE → World ─────────── */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-cobalt text-bone">
        <div className={`${WRAP} grid gap-12 py-20 lg:grid-cols-12 lg:py-28`}>
          <Reveal className="lg:col-span-6">
            <p className="label text-yellow">India → UAE → World</p>
            <h2 className="font-display mt-4 text-[clamp(2.18rem,4.29vw,3.8rem)]">The UAE is not only a destination.</h2>
            <p className="font-title mt-2 text-3xl italic text-yellow">It can be a bridge.</p>
            <p className="mt-6 max-w-lg text-bone/85">
              India gives us the starting point. The UAE is a place where many cultures already meet — and where Al Sadu, its first passport, was moved to
              UNESCO&rsquo;s Representative List at a committee meeting held in New Delhi in 2025. Then the idea travels further.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-6">
            <ol className="grid gap-3">
              {[
                ["India", "The starting point", `${plural(count("IN"))} · pilot collection`, "/country/india", "bg-orange text-ink"],
                ["UAE", "Where many cultures already meet", `${plural(count("AE"))} · introductory`, "/country/united-arab-emirates", "bg-bone text-ink"],
                ["World", "The idea travels further", "Ghana · Japan · Mexico — being documented", "/explore", "bg-yellow text-ink"],
              ].map(([name, line, meta, href, c], i) => (
                <li key={name} className="relative">
                  <Link href={href} className={`group flex items-center gap-5 border-2 border-ink p-5 transition-transform hover:translate-x-1 ${c}`}>
                    <span className="font-display text-4xl leading-none opacity-40">{i + 1}</span>
                    <span className="flex-1">
                      <span className="font-display block text-4xl">{name}</span>
                      <span className="mt-1 block font-semibold">{line}</span>
                      <span className="label-sm mt-1 block opacity-75">{meta}</span>
                    </span>
                    <span aria-hidden className="font-display text-3xl transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

    </>
  );
}
