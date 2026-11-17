/**
 * Hand-off between the globe and a country chapter during client-side navigation.
 * The globe marks an arrival; the chapter consumes it within a short window
 * (idempotent so React's double-invoked initialisers in development agree).
 */
let pending: { slug: string; at: number } | null = null;

export function markArrival(slug: string) {
  pending = { slug, at: Date.now() };
}

export function consumeArrival(slug: string): boolean {
  if (!pending || pending.slug !== slug) return false;
  if (Date.now() - pending.at > 8000) {
    pending = null;
    return false;
  }
  return true;
}

export function clearArrival() {
  pending = null;
}
