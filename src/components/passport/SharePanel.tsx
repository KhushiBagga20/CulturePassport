"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

const noop = () => () => {};
/** The origin the visitor is actually on (empty during server rendering). */
function useOrigin() {
  return useSyncExternalStore(noop, () => window.location.origin, () => "");
}

/** The passport's QR code and permanent link, with downloads and a print label. */
export function QrPanel({ slug, passportNo, name }: { slug: string; passportNo: string; name: string }) {
  const origin = useOrigin();
  const url = origin ? `${origin}/passport/${slug}` : `/passport/${slug}`;
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid gap-5 border-2 border-ink bg-bone p-5 sm:grid-cols-[auto_1fr] sm:p-6">
      <div className="relative mx-auto w-40 sm:mx-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated QR code */}
        <img src={`/api/qr/${slug}?format=svg`} alt={`QR code that opens the ${name} passport`} width={160} height={160} className="h-40 w-40" />
        <span className="label-sm absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-ink px-2 py-0.5 text-bone">No. {passportNo}</span>
      </div>
      <div className="min-w-0">
        <p className="label text-ink-mute">Scan to open the story</p>
        <p className="font-title mt-1 text-2xl leading-tight">A stable link for a museum label, a market stall or a product tag.</p>
        <div className="mt-3 flex items-center gap-2">
          <code className="font-ui min-w-0 flex-1 truncate border-2 border-ink/30 bg-cream px-2 py-1.5 text-xs">{url}</code>
          <button
            type="button"
            className="chip shrink-0"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="label-sm mt-2 text-ink-mute">Short link: {origin ? `${origin}/p/${passportNo}` : `/p/${passportNo}`}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={`/api/qr/${slug}?format=svg&download=1`} className="chip">
            Download SVG
          </a>
          <a href={`/api/qr/${slug}?format=png&size=1200&download=1`} className="chip">
            Download PNG
          </a>
          <Link href={`/passport/${slug}/label`} className="chip border-ink bg-ink text-bone hover:bg-brick">
            Print a label
          </Link>
        </div>
      </div>
    </div>
  );
}

/** "Share with Credit": a caption that carries the source with the image. */
/** `captionTemplate` contains "{url}", replaced with this site's real origin in the browser. */
export function ShareWithCredit({ slug, passportNo, name, captionTemplate }: { slug: string; passportNo: string; name: string; captionTemplate: string }) {
  const origin = useOrigin();
  const url = origin ? `${origin}/passport/${slug}` : "";
  const [edited, setEdited] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const text = edited ?? (url ? captionTemplate.replaceAll("{url}", url) : "");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Caption copied — paste it with the image.");
    } catch {
      setStatus("Copy failed — select the text and copy it manually.");
    }
  };

  const share = async (withImage: boolean) => {
    try {
      if (withImage) {
        const blob = await fetch(`/api/card/${slug}`).then((r) => r.blob());
        const file = new File([blob], `culture-passport-${passportNo}.png`, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], text, title: `${name} — Culture Passport` });
          return;
        }
        setStatus("This device can't share images directly — download the card and copy the caption.");
        return;
      }
      if (navigator.share) await navigator.share({ title: `${name} — Culture Passport`, text, url });
      else await copy();
    } catch (e) {
      if ((e as Error).name !== "AbortError") setStatus("Sharing didn't work here — copy the caption instead.");
    }
  };

  return (
    <div className="border-2 border-ink bg-bone p-5 sm:p-6">
      <p className="label text-[var(--accent-text)]">Share with credit</p>
      <p className="font-title mt-1 text-2xl leading-tight">Share the image — and the story with it.</p>
      <label htmlFor={`caption-${slug}`} className="label-sm mt-4 block text-ink-mute">
        Caption (editable)
      </label>
      <textarea
        id={`caption-${slug}`}
        value={text}
        onChange={(e) => setEdited(e.target.value)}
        rows={7}
        className="mt-1 w-full resize-y border-2 border-ink/30 bg-cream p-3 font-ui text-xs leading-relaxed outline-none focus:border-ink"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className="btn btn-ink">
          Copy caption
        </button>
        <button type="button" onClick={() => share(false)} className="btn btn-cream">
          Share link
        </button>
        <button type="button" onClick={() => share(true)} className="btn btn-cream">
          Share card image
        </button>
        <a href={`/api/card/${slug}?download=1`} className="btn btn-cream">
          Download card
        </a>
        <Link href={`/passport/${slug}/card`} className="btn btn-cream">
          View identity card
        </Link>
      </div>
      {status && (
        <p className="mt-3 text-sm text-ink-soft" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
