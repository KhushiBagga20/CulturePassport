import type { Metadata } from "next";
import Link from "next/link";
import { getArchive, isPublic } from "@/lib/data/archive";
import { passportPath, requestOrigin } from "@/lib/site";
import { qrSvg } from "@/lib/qr";
import { recordQr } from "@/lib/data/mutations";

export const metadata: Metadata = { title: "QR labels", robots: { index: false } };

export default async function QrAdminPage() {
  const archive = await getArchive();
  const origin = await requestOrigin();
  const published = archive.traditions.filter(isPublic);
  const items = await Promise.all(
    published.map(async (t) => {
      const url = `${origin}${passportPath(t.slug)}`;
      await recordQr(t.id, url, "svg");
      return { t, url, svg: await qrSvg(url, { light: "#FFFFFF", margin: 1 }) };
    }),
  );
  const local = /localhost|127\.0\.0\.1/.test(origin);

  return (
    <div>
      <p className="label text-terracotta">QR passport system</p>
      <h1 className="font-display mt-2 text-5xl">QR labels</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Each published passport has one permanent URL. Codes encode that URL; renamed passports keep their old slugs as redirects, and{" "}
        <code className="font-mono text-sm">/p/NNN</code> short links never change.
      </p>
      {local && (
        <p className="mt-4 max-w-2xl border-l-4 border-mustard bg-mustard/15 p-3 text-sm">
          These codes point to <code>{origin}</code>. Set <code>NEXT_PUBLIC_SITE_URL</code> to the public address before printing real labels.
        </p>
      )}
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {items.map(({ t, url, svg }) => (
          <li key={t.id} className="paper-card p-5">
            <div className="flex items-start gap-4">
              <div className="w-28 shrink-0" dangerouslySetInnerHTML={{ __html: svg }} />
              <div className="min-w-0">
                <p className="font-mono text-xs text-ink-mute">No. {t.passportNo}</p>
                <p className="font-display text-2xl">{t.name}</p>
                <p className="mt-1 break-all font-mono text-[0.65rem] text-ink-mute">{url}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a className="label-sm rounded-full border rule px-3 py-1.5 hover:border-ink" href={`/api/qr/${t.slug}?format=svg&download=1`}>
                SVG
              </a>
              <a className="label-sm rounded-full border rule px-3 py-1.5 hover:border-ink" href={`/api/qr/${t.slug}?format=png&size=1200&download=1`}>
                PNG
              </a>
              <Link className="label-sm rounded-full bg-ink px-3 py-1.5 text-ivory" href={`/passport/${t.slug}/label`}>
                Print label
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
