import type { Tradition } from "./types";

/**
 * A source-linked caption, so a shared image never travels without its story.
 * Kept short enough for most social platforms.
 */
export function shareCaption(t: Tradition, url: string, communities: string[]): string {
  const native = t.nativeNames[0]?.text;
  const who = communities.length ? ` Made by ${communities.join(", ")}.` : "";
  const firstSentence = t.summary.split(/(?<=[.!?])\s/)[0];
  return [
    `${t.name}${native ? ` (${native})` : ""} — ${t.regionLabel}.${who}`,
    firstSentence,
    `Its story, makers and sources: ${url}`,
    `Culture Passport No. ${t.passportNo} · #CulturePassport #WhenCultureTravels #CreditTheCraft`,
  ].join("\n\n");
}
