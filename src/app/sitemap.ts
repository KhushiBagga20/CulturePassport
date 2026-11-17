import type { MetadataRoute } from "next";
import { getArchive, isPublic } from "@/lib/data/archive";
import { staticOrigin } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const a = await getArchive();
  const base = staticOrigin();
  const fixed = ["", "/passports", "/explore", "/routes", "/trails", "/search", "/method"].map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const }));
  return [
    ...fixed,
    ...a.countries.map((c) => ({ url: `${base}/country/${c.slug}`, changeFrequency: "weekly" as const })),
    ...a.traditions.filter(isPublic).map((t) => ({ url: `${base}/passport/${t.slug}`, lastModified: t.editorial.lastReviewed, changeFrequency: "monthly" as const, priority: 0.9 })),
    ...a.trails.map((t) => ({ url: `${base}/trails/${t.slug}`, changeFrequency: "monthly" as const })),
  ];
}
