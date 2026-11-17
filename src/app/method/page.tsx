import type { Metadata } from "next";
import Link from "next/link";
import { getArchive } from "@/lib/data/archive";
import { EVIDENCE, EVIDENCE_ORDER, MATURITY } from "@/lib/labels";
import { EvidenceBadge } from "@/components/site/Evidence";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "About — how we work",
  description: "How Culture Passport labels evidence, handles disputes and corrections, credits images, and what it will never do.",
};

export default async function MethodPage() {
  const archive = await getArchive();
  const media = archive.media;
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
      <p className="label text-brick">About · how we work</p>
      <h1 className="font-display mt-3 text-[clamp(2.65rem,7.02vw,6.08rem)]">How we know what we say</h1>
      <p className="font-title mt-6 max-w-3xl border-l-8 border-orange pl-5 text-[clamp(1.5rem,2.6vw,2.2rem)] leading-snug">
        Culture Passport is an education, documentation and attribution project. It is not a legal ownership registry, and a passport number is an
        archive reference — not a certificate.
      </p>
      <nav aria-label="On this page" className="mt-10 flex flex-wrap gap-2">
        {[
          ["principles", "Principles"],
          ["evidence", "Evidence labels"],
          ["process", "From draft to passport"],
          ["corrections", "Corrections"],
          ["languages", "Languages"],
          ["maps", "Maps"],
          ["credits", "Image credits"],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="chip bg-bone">
            {label}
          </a>
        ))}
      </nav>

      <section id="principles" className="mt-16 grid gap-10 border-t-2 border-ink pt-8 lg:grid-cols-12">
        <h2 className="font-display text-4xl lg:col-span-4">Principles</h2>
        <ol className="space-y-4 lg:col-span-8">
          {[
            ["We are not against cultural exchange.", "Inspiration, adaptation and collaboration are how culture lives. We document when context disappears — the origin, the makers, the meaning, the source."],
            ["Shared traditions stay shared.", "Phulkari belongs to Punjab, on both sides of a border. Mithila spans India and Nepal. We file a passport under one collection for navigation only and name every country involved."],
            ["Resemblance is not evidence.", "Visual similarity is never presented as historical influence. Where a resemblance is popularly claimed, we show it — labelled as a claim."],
            ["No invented people, quotes or dates.", "We name practitioners only from public records, never paraphrase artisans from press coverage, and leave a timeline empty rather than fill it with guesses."],
            ["No legal conclusions.", "We report what courts, registries and parties have said. A geographical indication protects a name for goods from a place; it is not worldwide ownership of a design."],
            ["Generated images are never evidence.", "Photographs are credited and licensed. Our geometric motifs are labelled as archive illustrations, not traditional artworks."],
          ].map(([h, p], i) => (
            <li key={h} className="grid grid-cols-[2.5rem_1fr] gap-3">
              <span className="font-display text-2xl leading-none text-brick">{String(i + 1).padStart(2, "0")}</span>
              <span>
                <strong className="font-medium">{h}</strong> <span className="text-ink-soft">{p}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section id="evidence" className="mt-16 grid gap-10 border-t-2 border-ink pt-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 className="font-display text-4xl">Evidence labels</h2>
          <p className="mt-3 text-sm text-ink-soft">
            Applied to every claim, milestone, material and answer by an editor — never automatically — and shown to readers next to the text.
          </p>
        </div>
        <dl className="space-y-6 lg:col-span-8">
          {EVIDENCE_ORDER.map((l) => (
            <div key={l} className="grid gap-2 sm:grid-cols-[14rem_1fr]">
              <dt>
                <EvidenceBadge level={l} />
              </dt>
              <dd className="text-ink-soft">
                {EVIDENCE[l].description}
                {l === "documented" && " Primary records (registries, UNESCO decisions, court reporting) are preferred over secondary accounts."}
                {l === "disputed" && " We present each account with its source rather than choosing silently."}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="process" className="mt-16 grid gap-10 border-t-2 border-ink pt-8 lg:grid-cols-12">
        <h2 className="font-display text-4xl lg:col-span-4">From draft to passport</h2>
        <div className="lg:col-span-8">
          <ol className="grid gap-4 sm:grid-cols-2">
            {[
              ["Research", "Primary records first: geographical-indication registries, UNESCO decisions, museum catalogues, court reporting. Then scholarship and long-form journalism."],
              ["Label", "Each statement becomes a claim with sources and an evidence label. Conflicts are written into editor's notes."],
              ["Consult", "Practitioners and community organisations review what is said about them, with consent. Until then, process and meaning stay marked for verification."],
              ["Publish & correct", "Passports move from draft to review to published. Every significant edit is logged; public corrections are reviewed against sources."],
            ].map(([h, p], i) => (
              <li key={h} className="border-2 border-ink bg-bone p-5">
                <span className="font-display text-4xl text-brick">{i + 1}</span>
                <p className="font-title mt-2 text-2xl">{h}</p>
                <p className="mt-1 text-sm text-ink-soft">{p}</p>
              </li>
            ))}
          </ol>
          <dl className="mt-8 space-y-3">
            {Object.entries(MATURITY).map(([k, v]) => (
              <div key={k} className="grid gap-1 sm:grid-cols-[12rem_1fr]">
                <dt className="label">{v.label}</dt>
                <dd className="text-sm text-ink-soft">{v.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="corrections" className="mt-16 grid gap-10 border-t-2 border-ink pt-8 lg:grid-cols-12">
        <h2 className="font-display text-4xl lg:col-span-4">Corrections</h2>
        <div className="space-y-3 text-ink-soft lg:col-span-8">
          <p>
            Every passport ends with a &ldquo;Suggest a correction&rdquo; form. Notes go to the editorial queue — never straight onto the page. Editors check
            them against sources, accept or decline them with a written resolution, and accepted changes appear in the passport&rsquo;s change log.
          </p>
          <p>The archive is meant to become more accurate as it grows. If we have something wrong, we want to know.</p>
        </div>
      </section>

      <section id="languages" className="mt-16 grid gap-10 border-t-2 border-ink pt-8 lg:grid-cols-12">
        <h2 className="font-display text-4xl lg:col-span-4">Languages</h2>
        <p className="text-ink-soft lg:col-span-8">
          Passports store traditional names in their own scripts, and the content model holds per-language versions of names, taglines and summaries.
          Translations are published only after human review — culturally sensitive interpretation is never left to machine translation alone.
        </p>
      </section>

      <section id="maps" className="mt-16 grid gap-10 border-t-2 border-ink pt-8 lg:grid-cols-12">
        <h2 className="font-display text-4xl lg:col-span-4">Maps</h2>
        <p className="text-ink-soft lg:col-span-8">
          Country boundaries come from Natural Earth (via the world-atlas dataset) and are shown for orientation only. They do not represent a position
          on any disputed territory. Places are plotted at approximate district, town or site centres.
        </p>
      </section>

      <section id="credits" className="mt-16 grid gap-10 border-t-2 border-ink pt-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 className="font-display text-4xl">Image credits</h2>
          <p className="mt-3 text-sm text-ink-soft">All photographs are from Wikimedia Commons under the licences shown. Follow each link for the original file.</p>
        </div>
        <ul className="divide-y divide-ink/15 border-y-2 border-ink text-sm lg:col-span-8">
          {media.map((m) => (
            <li key={m.id} className="grid gap-1 py-3 sm:grid-cols-[1fr_auto] sm:gap-6">
              <span>
                {m.caption} <span className="text-ink-mute">— {m.credit}</span>
              </span>
              <a href={m.sourcePage} target="_blank" rel="noreferrer" className="label-sm text-ink-mute hover:text-brick">
                {m.license} ↗
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-16 text-sm text-ink-mute">
        Visual identity adapted from the &ldquo;When Culture Travels&rdquo; campaign. Built with open data and open-source software.{" "}
        <Link href="/" className="underline">
          Back to the globe
        </Link>
        .
      </p>
    </div>
  );
}
