import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { findTradition, getArchive, isPublic, lookups } from "@/lib/data/archive";
import { PassportView } from "@/components/passport/PassportView";
import { CATEGORY } from "@/lib/labels";

export const revalidate = 300;

export async function generateStaticParams() {
  const a = await getArchive();
  return a.traditions.filter(isPublic).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/passport/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArchive();
  const found = findTradition(a, slug);
  if (!found || !isPublic(found.tradition)) return { title: "Passport not found" };
  const t = found.tradition;
  const title = `${t.name} — Culture Passport No. ${t.passportNo}`;
  const description = `${t.tagline} ${t.summary}`;
  return {
    title,
    description,
    alternates: { canonical: `/passport/${t.slug}` },
    openGraph: { title, description, type: "article", url: `/passport/${t.slug}` },
    twitter: { card: "summary_large_image", title, description },
    other: { "cp:passport-no": t.passportNo, "cp:category": CATEGORY[t.category] },
  };
}

export default async function PassportPage({ params }: PageProps<"/passport/[slug]">) {
  const { slug } = await params;
  const archive = await getArchive();
  const found = findTradition(archive, slug);
  if (!found || !isPublic(found.tradition)) notFound();
  if (!found.canonical) permanentRedirect(`/passport/${found.tradition.slug}`);
  const t = found.tradition;
  const L = lookups(archive);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `${t.name} — Culture Passport No. ${t.passportNo}`,
    alternateName: [...t.nativeNames.map((n) => n.text), ...t.alternateNames],
    about: t.name,
    description: t.summary,
    genre: CATEGORY[t.category],
    spatialCoverage: t.places.map((p) => L.place.get(p.place)?.name).filter(Boolean),
    citation: t.claims.flatMap((c) => c.sources).filter((v, i, arr) => arr.indexOf(v) === i).map((id) => L.source.get(id)?.url).filter(Boolean),
    dateModified: t.editorial.lastReviewed,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PassportView t={t} archive={archive} />
    </>
  );
}
