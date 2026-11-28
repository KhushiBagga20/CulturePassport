/**
 * Remembers the page this browser session started on (the header reports each pathname), so a
 * page can tell an in-site navigation from a fresh visit — even when its content streams in
 * after the header has mounted.
 */
let first: string | null = null;

export function notePageView(pathname: string) {
  first ??= pathname;
}

export function arrivedByNavigation(pathname: string) {
  return typeof window !== "undefined" && first !== null && pathname !== first;
}
