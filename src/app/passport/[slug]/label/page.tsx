import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { countryEntries, entryLabel, findTradition, getArchive, isPublic, lookups } from "@/lib/data/archive";
import { passportPath, requestOrigin } from "@/lib/site";
import { qrSvg } from "@/lib/qr";
import { ACCENT, CATEGORY } from "@/lib/labels";
import { PrintButton } from "@/components/passport/PrintButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/passport/[slug]/label">): Promise<Metadata> {
  const { slug } = await params;
  const t = findTradition(await getArchive(), slug)?.tradition;
  return t ? { title: `${t.name} — QR label`, robots: { index: false } } : {};
}

/** A print-ready museum / market label with the passport's QR code. */
export default async function LabelPage({ params }: PageProps<"/passport/[slug]/label">) {
  const { slug } = await params;
  const archive = await getArchive();
  const found = findTradition(archive, slug);
  if (!found || !isPublic(found.tradition)) notFound();
  const t = found.tradition;
  const L = lookups(archive);
  const origin = await requestOrigin();
  const url = `${origin}${passportPath(t.slug)}`;
  const svg = await qrSvg(url, { light: "#FFFFFF", margin: 1 });
  const communities = t.communities.map((c) => L.community.get(c.community)?.name).filter(Boolean).join("; ");
  const accent = ACCENT[t.accent].hex;
  const entry = entryLabel(countryEntries(archive).get(t.slug));
  const isLocal = /localhost|127\.0\.0\.1/.test(origin);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 print:p-0">
      <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href={`/passport/${t.slug}`} className="label-sm text-ink-mute hover:text-terracotta">
            ← Back to the passport
          </Link>
          <h1 className="font-display mt-2 text-4xl">Print a QR label</h1>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            Two sizes on one sheet: a gallery label and a small tag for products and market stalls. Print at 100% scale. Test the code with a phone before
            displaying it.
          </p>
          {isLocal && (
            <p className="mt-3 max-w-xl border-l-4 border-mustard bg-mustard/15 p-3 text-sm">
              This code points to <code>{origin}</code>, which phones cannot reach. Set <code>NEXT_PUBLIC_SITE_URL</code> to your public address — or open
              this page via your computer&rsquo;s network address — before printing.
            </p>
          )}
        </div>
        <PrintButton />
      </div>

      <div className="grid gap-10 print:gap-6">
        {/* Gallery label — 148 × 105 mm (A6 landscape) */}
        <article
          className="grid grid-cols-[1fr_auto] gap-6 border-2 bg-white p-6 text-ink print:break-inside-avoid"
          style={{ borderColor: accent, width: "148mm", minHeight: "105mm", maxWidth: "100%" }}
          aria-label="Gallery label"
        >
          <div className="flex flex-col">
            <p className="label-sm" style={{ color: accent }}>
              Culture Passport · No. {t.passportNo}
              {entry && ` · ${entry}`}
            </p>
            <p className="font-display mt-2 text-[1.92rem]">{t.name}</p>
            {t.nativeNames[0] && <p className="text-lg">{t.nativeNames.map((n) => n.text).join(" · ")}</p>}
            <p className="mt-2 text-[0.8rem] leading-snug">
              <strong>{CATEGORY[t.category]}</strong> · {t.regionLabel}
              {communities ? ` · ${communities}` : ""}
            </p>
            <p className="mt-2 text-[0.8rem] leading-snug text-ink-soft">{t.summary}</p>
            <p className="label-sm mt-auto pt-3 text-ink-mute">When culture travels, let its story travel with it.</p>
          </div>
          <div className="flex w-[34mm] flex-col items-center justify-center gap-1">
            <div className="w-[34mm]" dangerouslySetInnerHTML={{ __html: svg }} />
            <p className="label-sm text-center" style={{ color: accent }}>
              Scan for its story
            </p>
            <p className="font-ui break-all text-center text-[7px] leading-tight text-ink-mute">{url.replace(/^https?:\/\//, "")}</p>
          </div>
        </article>

        {/* Product / stall tag — 85 × 55 mm */}
        <article
          className="grid grid-cols-[auto_1fr] items-center gap-3 border bg-white p-3 text-ink print:break-inside-avoid"
          style={{ borderColor: accent, width: "85mm", height: "55mm", maxWidth: "100%" }}
          aria-label="Product tag"
        >
          <div className="w-[30mm]" dangerouslySetInnerHTML={{ __html: svg }} />
          <div>
            <p className="label-sm" style={{ color: accent }}>
              No. {t.passportNo}
              {entry && ` · ${entry}`}
            </p>
            <p className="font-display text-xl leading-none">{t.name}</p>
            <p className="mt-1 text-[0.62rem] leading-snug">{t.regionLabel}</p>
            <p className="label-sm mt-2 text-ink-mute">Scan: its makers, place &amp; sources</p>
          </div>
        </article>
      </div>
    </div>
  );
}
