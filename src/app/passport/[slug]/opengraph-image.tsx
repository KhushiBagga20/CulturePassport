import { findTradition, getArchive } from "@/lib/data/archive";
import { renderCard } from "@/lib/card-image";
import { passportPath, staticOrigin } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Culture Passport identity card";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const archive = await getArchive();
  const t = findTradition(archive, slug)?.tradition ?? archive.traditions[0];
  return renderCard(t, archive, `${staticOrigin()}${passportPath(t.slug)}`, "landscape");
}
