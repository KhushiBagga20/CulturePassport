import { headers } from "next/headers";

export const SITE_NAME = "Culture Passport";
export const CAMPAIGN = "When Culture Travels";
export const TAGLINE = "When culture travels, let its story travel with it.";

/**
 * Turns "culture-passport.vercel.app", "https://example.org/" or "example.org/path" into a bare
 * origin like "https://culture-passport.vercel.app". Returns null for anything that isn't a URL.
 */
export function normaliseOrigin(raw: string | undefined | null): string | null {
  const v = raw?.trim().replace(/^["']|["']$/g, "");
  if (!v) return null;
  try {
    const local = /^(localhost|127\.|\[::1\])/.test(v);
    return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `${local ? "http" : "https"}://${v}`).origin;
  } catch {
    return null;
  }
}

/** Canonical origin from configuration, if any. Never includes a trailing slash. */
export function configuredOrigin(): string | null {
  return normaliseOrigin(process.env.NEXT_PUBLIC_SITE_URL);
}

/** Used where no request is available (static generation, metadata base). On Vercel, falls back to the production domain. */
export function staticOrigin(): string {
  return (
    configuredOrigin() ??
    normaliseOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL) ??
    `http://localhost:${process.env.PORT ?? 3000}`
  );
}

/**
 * The origin to encode in QR codes and share links.
 * Prefers NEXT_PUBLIC_SITE_URL; otherwise uses the host the visitor actually reached,
 * so a phone on the same network gets a code that works on that network.
 */
export async function requestOrigin(): Promise<string> {
  const configured = configuredOrigin();
  if (configured) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const local = !!host && /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\]|[^.]+\.local)/.test(host);
  const proto = h.get("x-forwarded-proto") ?? (local ? "http" : "https");
  return host ? `${proto}://${host}` : staticOrigin();
}

export function passportPath(slug: string) {
  return `/passport/${slug}`;
}
