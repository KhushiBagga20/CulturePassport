import Link from "next/link";
import { getArchive, isPublic, lookups } from "@/lib/data/archive";
import { globeCountries, passportIndex, whereLine } from "@/lib/data/views";
import { GlobeExperience } from "@/components/globe/GlobeExperience";
import { Reveal } from "@/components/site/Motion";
import { ArchiveImage } from "@/components/site/ArchiveImage";
import { Motif } from "@/components/motifs/Motif";
import { ACCENT, CATEGORY } from "@/lib/labels";

export const revalidate = 300;

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
      <section className="relative border-t rule bg-paper/60">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-4 py-24 sm:px-6 lg:grid-cols-12 lg:px-10 lg:py-32">
          <Reveal className="lg:col-span-5">
            <p className="label text-terracotta">Part II · The gap</p>
            <h2 className="font-serif mt-4 text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.02] balance">
              The image travels.
              <br />
              <em className="text-terracotta">Does the story travel with it?</em>
            </h2>
            <p className="mt-6 max-w-md text-ink-soft">
              A craft made in one place can reach millions in seconds. What arrives is a pattern, a product, a post. What is often left behind is the
              origin, the maker, the community and the meaning.
            </p>
            <p className="mt-4 max-w-md text-ink-soft">
              We are not against inspiration, adaptation or exchange. We are against cultural context disappearing.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-4 sm:gap-8">
              <div className="paper-card p-5 sm:p-7">
                <p className="label text-indigo">What travelled fast</p>
                <ul className="font-display mt-5 space-y-2 text-[clamp(1.6rem,3.4vw,2.8rem)] text-indigo">
                  <li>Artwork</li>
                  <li>Viral post</li>
                  <li>Global reach</li>
                </ul>
              </div>
              <div className="flex flex-col items-center justify-center gap-2" aria-hidden>
                <span className="vertical-label label-sm text-ink-mute">The gap</span>
                <span className="w-px flex-1 border-l-2 border-dotted border-ink/40" />
              </div>
              <div className="border-2 border-dashed border-terracotta/60 p-5 sm:p-7">
                <p className="label text-terracotta">What got left behind</p>
                <ul className="font-display mt-5 space-y-2 text-[clamp(1.6rem,3.4vw,2.8rem)] text-terracotta/80">
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
        <section className="bg-ink text-ivory">
          <div className="strip-dots" />
          <div className="mx-auto grid max-w-[1500px] gap-10 px-4 py-24 sm:px-6 lg:grid-cols-12 lg:px-10">
            <Reveal className="relative lg:col-span-5">
              {hero ? (
                <ArchiveImage media={hero} fallbackMotif={flagship.motif} className="aspect-[4/5] w-full" sizes="(min-width:1024px) 40vw, 100vw" />
              ) : (
                <Motif motif={flagship.motif} className="aspect-square w-full" />
              )}
              <p className="label-sm mt-3 text-ivory/60">{hero?.caption}</p>
            </Reveal>
            <Reveal delay={0.1} className="flex flex-col justify-center lg:col-span-6 lg:col-start-7">
              <p className="label text-mustard">Case file {flagshipCase.code} · Culture Passport No. {flagship.passportNo}</p>
              <h2 className="font-display mt-5 text-[clamp(3rem,7vw,6.5rem)]">{flagship.name}</h2>
              <p className="font-serif mt-3 text-3xl italic text-mustard">{flagship.tagline}</p>
              <p className="mt-6 max-w-xl text-ivory/80">{flagshipCase.summary}</p>
              <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 border-t border-ivory/15 pt-6 text-sm sm:grid-cols-3">
                <div>
                  <dt className="label-sm text-ivory/50">Made in</dt>
                  <dd className="mt-1">8 districts, 2 states</dd>
                </div>
                <div>
                  <dt className="label-sm text-ivory/50">On the runway</dt>
                  <dd className="mt-1">Milan, June 2025</dd>
                </div>
                <div>
                  <dt className="label-sm text-ivory/50">Status</dt>
                  <dd className="mt-1">Inspiration acknowledged</dd>
                </div>
              </dl>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={`/passport/${flagship.slug}#travels`} className="label rounded-full bg-mustard px-5 py-3 text-ink hover:bg-ivory">
                  Read the case file →
                </Link>
                <Link href={`/passport/${flagship.slug}`} className="label rounded-full border border-ivory/40 px-5 py-3 hover:border-ivory">
                  Open the passport
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ─────────── The register ─────────── */}
      <section className="mx-auto max-w-[1500px] px-4 py-24 sm:px-6 lg:px-10">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="label text-terracotta">The register</p>
            <h2 className="font-display mt-3 text-[clamp(2.8rem,6vw,5.5rem)]">{plural(published.length)}, so far</h2>
          </div>
          <p className="max-w-sm text-ink-soft">
            Each passport carries its evidence on its sleeve. Some are researched; some are honestly marked as drafts. The archive grows more accurate as
            it grows.
          </p>
        </Reveal>
        <ol className="mt-12 grid gap-px overflow-hidden border rule bg-ink/15 sm:grid-cols-2 lg:grid-cols-3">
          {published.map((t, i) => (
            <Reveal as="li" key={t.slug} delay={i * 0.05} className="bg-ivory">
              <Link href={`/passport/${t.slug}`} className="group flex h-full gap-5 p-5 transition-colors hover:bg-paper sm:p-6">
                <div className="relative h-28 w-24 shrink-0 overflow-hidden border border-ink/20">
                  <Motif motif={t.motif} className="h-full w-full transition-transform duration-700 group-hover:scale-110" />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="font-mono text-xs text-ink-mute">No. {t.passportNo}</span>
                  <span className="font-display mt-1 text-3xl group-hover:text-terracotta">{t.name}</span>
                  <span className="label-sm mt-1 text-ink-mute">{CATEGORY[t.category]}</span>
                  <span className="mt-auto pt-3 text-sm text-ink-soft">{whereLine(t, archive)}</span>
                </div>
                <span aria-hidden className="ml-auto self-start rounded-full px-2 py-0.5 text-[10px]" style={{ background: ACCENT[t.accent].soft }}>
                  {t.maturity === "editorial-draft" ? "Draft" : t.maturity === "starter" ? "Starter" : "Researched"}
                </span>
              </Link>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ─────────── How it works ─────────── */}
      <section className="border-y rule bg-paper/60">
        <div className="mx-auto max-w-[1500px] px-4 py-24 sm:px-6 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <p className="label text-terracotta">Part V · How it works</p>
              <h2 className="font-serif mt-4 text-[clamp(2.4rem,4.6vw,4rem)] leading-[1.02]">
                A QR code beside the object. <em>The whole story behind it.</em>
              </h2>
              <p className="mt-5 max-w-sm text-ink-soft">
                In a museum, a workshop, a market stall or on a product: scan, and the passport opens in seconds — no app, no account.
              </p>
              {flagship && (
                <Link href={`/passport/${flagship.slug}/label`} className="mt-8 inline-flex items-center gap-4 border rule bg-ivory p-3 pr-5 hover:border-ink">
                  {/* eslint-disable-next-line @next/next/no-img-element -- generated SVG QR code */}
                  <img src={`/api/qr/${flagship.slug}?format=svg`} alt={`QR code for the ${flagship.name} passport`} className="h-20 w-20" width={80} height={80} />
                  <span>
                    <span className="label-sm block text-ink-mute">Try it with your phone</span>
                    <span className="font-display text-xl">Print a label</span>
                  </span>
                </Link>
              )}
            </Reveal>
            <ol className="grid gap-4 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-5">
              {[
                ["See", "You spot a traditional object, pattern or product."],
                ["Scan", "Its Culture Passport QR opens a stable public page."],
                ["Understand", "Where it comes from, what it means, how it's made."],
                ["Credit", "Meet the makers and community behind it."],
                ["Connect", "Support or collaborate — responsibly."],
              ].map(([title, text], i) => (
                <Reveal as="li" key={title} delay={i * 0.06} className="relative border-t-2 border-ink pt-4">
                  <span className="font-mono text-xs text-ink-mute">Step {i + 1}</span>
                  <p className="font-display mt-2 text-3xl">{title}</p>
                  <p className="mt-2 text-sm text-ink-soft">{text}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ─────────── The habit ─────────── */}
      <section className="mx-auto max-w-[1500px] px-4 py-24 sm:px-6 lg:px-10">
        <Reveal>
          <p className="label text-terracotta">The habit we want</p>
          <h2 className="font-display mt-3 text-[clamp(2.6rem,7vw,6.8rem)] text-burgundy">Before you share culture, pause.</h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-px border rule bg-ink/15 sm:grid-cols-3 lg:grid-cols-5">
          {[
            ["Stop", "Don't share blindly.", "#581D30"],
            ["Check", "Is the information reliable?", "#25346E"],
            ["Understand", "Know the origin and meaning.", "#146D68"],
            ["Credit", "Recognise the people behind it.", "#B84B30"],
            ["Share", "Now help the story travel too.", "#28563F"],
          ].map(([w, t, c], i) => (
            <Reveal key={w} delay={i * 0.05} className="bg-ivory p-6">
              <span className="font-mono text-xs" style={{ color: c }}>
                0{i + 1}
              </span>
              <p className="font-display mt-6 text-4xl" style={{ color: c }}>
                {w}
              </p>
              <p className="mt-2 text-sm text-ink-soft">{t}</p>
            </Reveal>
          ))}
        </div>
        <p className="label mt-6 text-ink-mute">A small human habit. No app needed.</p>
      </section>

      {/* ─────────── India → UAE → World ─────────── */}
      <section className="relative overflow-hidden bg-indigo text-ivory">
        <div className="strip-weave" />
        <div className="mx-auto grid max-w-[1500px] gap-12 px-4 py-24 sm:px-6 lg:grid-cols-12 lg:px-10">
          <Reveal className="lg:col-span-6">
            <p className="label text-mustard">Part VII · India → UAE → World</p>
            <h2 className="font-serif mt-4 text-[clamp(2.4rem,5vw,4.6rem)] leading-[1.02]">
              The UAE is not only a destination. <em className="text-mustard">It can be a bridge.</em>
            </h2>
            <p className="mt-6 max-w-lg text-ivory/75">
              India gives us the starting point. The UAE is a place where many cultures already meet — and where Al Sadu, its first passport, was moved to
              UNESCO&rsquo;s Representative List at a committee meeting held in New Delhi in 2025. Then the idea travels further.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/country/united-arab-emirates" className="label rounded-full bg-mustard px-5 py-3 text-ink hover:bg-ivory">
                The UAE bridge →
              </Link>
              <Link href="/explore" className="label rounded-full border border-ivory/40 px-5 py-3 hover:border-ivory">
                Stories being documented
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-6">
            <ol className="relative grid gap-6">
              {[
                ["India", "The starting point", `${plural(count("IN"))} · pilot collection`, "/country/india"],
                ["UAE", "Where many cultures already meet", `${plural(count("AE"))} · introductory`, "/country/united-arab-emirates"],
                ["World", "The idea travels further", "Ghana · Japan · Mexico — being documented", "/explore"],
              ].map(([name, line, meta, href], i) => (
                <li key={name} className="relative flex gap-6">
                  <span className="flex flex-col items-center" aria-hidden>
                    <span className="h-4 w-4 rounded-full border-2 border-mustard bg-indigo" />
                    {i < 2 && <span className="w-px flex-1 border-l border-dashed border-mustard/60" />}
                  </span>
                  <Link href={href} className="group pb-6">
                    <span className="font-display text-5xl group-hover:text-mustard">{name}</span>
                    <span className="mt-1 block text-ivory/80">{line}</span>
                    <span className="label-sm mt-1 block text-ivory/50">{meta}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* ─────────── Trails teaser ─────────── */}
      <section className="mx-auto max-w-[1500px] px-4 py-24 sm:px-6 lg:px-10">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-display text-[clamp(2.6rem,6vw,5rem)]">Follow a trail</h2>
          <Link href="/trails" className="label underline hover:text-terracotta">
            All trails →
          </Link>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {archive.trails.map((tr, i) => (
            <Reveal key={tr.slug} delay={i * 0.06}>
              <Link href={`/trails/${tr.slug}`} className="group block h-full border-t-4 pt-5" style={{ borderColor: ACCENT[tr.accent].hex }}>
                <span className="label-sm text-ink-mute">{tr.kicker}</span>
                <span className="font-display mt-2 block text-3xl group-hover:text-terracotta">{tr.title}</span>
                <span className="mt-2 block text-sm text-ink-soft">{tr.intro}</span>
                <span className="label-sm mt-4 block text-ink-mute">{tr.steps.length} stops</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
