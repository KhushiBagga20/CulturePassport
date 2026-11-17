import type { MediaAsset } from "./types";

/** Thumbnail widths Wikimedia serves without on-the-fly rendering. */
const STEPS = [250, 330, 500, 960, 1280, 1920] as const;
export type MediaWidth = (typeof STEPS)[number];

export function mediaUrl(m: MediaAsset, width: MediaWidth = 960): string {
  if (m.url) return m.url;
  if (!m.commonsFile || !m.commonsHash) return "";
  const file = encodeURIComponent(m.commonsFile);
  const base = `https://upload.wikimedia.org/wikipedia/commons`;
  if (width >= m.width) return `${base}/${m.commonsHash}/${file}`;
  return `${base}/thumb/${m.commonsHash}/${file}/${width}px-${file}`;
}

export function mediaSrcSet(m: MediaAsset): string | undefined {
  if (m.url) return undefined;
  const widths = STEPS.filter((w) => w >= 330 && w < m.width);
  const parts = widths.map((w) => `${mediaUrl(m, w)} ${w}w`);
  if (widths.length < STEPS.length) parts.push(`${mediaUrl(m, 1920)} ${m.width}w`);
  return parts.join(", ");
}

export function creditLine(m: MediaAsset): string {
  return `${m.credit} · ${m.license}`;
}
