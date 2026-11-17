import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findTradition, getArchive, isPublic, lookups } from "@/lib/data/archive";
import { shareCaption } from "@/lib/share";
import { ACCENT } from "@/lib/labels";
import { ShareWithCredit } from "@/components/passport/SharePanel";

export const revalidate = 300;

export async function generateStaticParams() {
  const a = await getArchive();
  return a.traditions.filter(isPublic).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/passport/[slug]/card">): Promise<Metadata> {
  const { slug } = await params;
  const t = findTradition(await getArchive(), slug)?.tradition;
  return t ? { title: `${t.name} — identity card`, robots: { index: false } } : {};
}

export default async function CardPage({ params }: PageProps<"/passport/[slug]/card">) {
  const { slug } = await params;
  const archive = await getArchive();
  const found = findTradition(archive, slug);
  if (!found || !isPublic(found.tradition)) notFound();
  const t = found.tradition;
  const L = lookups(archive);
  const communities = t.communities.map((c) => L.community.get(c.community)?.name ?? "").filter(Boolean);

  return (
    <div style={{ ["--accent" as string]: ACCENT[t.accent].hex }} className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-16">
      <nav aria-label="Breadcrumb" className="label-sm flex flex-wrap gap-2 text-ink-mute">
        <Link href={`/passport/${t.slug}`} className="hover:text-terracotta">
          ← Passport No. {t.passportNo} · {t.name}
        </Link>
      </nav>
      <div className="mt-8 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="label text-[var(--accent)]">Cultural fingerprint</p>
          <h1 className="font-display mt-3 text-[clamp(3rem,7vw,6rem)]">Identity card</h1>
          <p className="mt-4 max-w-lg text-ink-soft">
            A collectible card for {t.name}, carrying its passport number, region, community, a short story, and a QR code back to its sources.
            Share it with its caption so the story travels with it.
          </p>
          {t.nativeNames.length > 0 && (
            <p className="mt-6 text-3xl">
              {t.nativeNames.map((n) => n.text).join("  ·  ")}
            </p>
          )}
          <div className="mt-8">
            <ShareWithCredit slug={t.slug} passportNo={t.passportNo} name={t.name} captionTemplate={shareCaption(t, "{url}", communities)} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <a href={`/api/card/${t.slug}?layout=landscape&download=1`} className="label-sm rounded-full border rule px-3 py-2 hover:border-ink">
              Download landscape (1200×630)
            </a>
            <Link href={`/passport/${t.slug}/label`} className="label-sm rounded-full border rule px-3 py-2 hover:border-ink">
              Print a QR label
            </Link>
          </div>
          <p className="mt-6 text-xs text-ink-mute">
            The passport number is an archive reference. It is not a government certification, a geographical-indication certificate, or proof of
            ownership.
          </p>
        </div>
        <div className="lg:col-span-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG card */}
          <img
            src={`/api/card/${t.slug}`}
            alt={`Culture Passport identity card for ${t.name}, No. ${t.passportNo}, with a QR code`}
            width={1080}
            height={1350}
            className="mx-auto h-auto w-full max-w-[540px] shadow-[0_40px_80px_-40px_rgba(33,28,25,.6)]"
          />
        </div>
      </div>
    </div>
  );
}
