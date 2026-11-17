"use client";

import { useEffect, useState } from "react";
import { clearArrival, consumeArrival } from "@/lib/arrival";

/** Continues the globe's "opening the chapter" transition when arriving from the atlas. */
export function ArrivalCurtain({ slug, color, title }: { slug: string; color: string; title: string }) {
  // Only true after a client-side hand-off from the globe; false on server render and direct visits.
  const [arrived] = useState(() => typeof window !== "undefined" && consumeArrival(slug));
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!arrived) return;
    const t = setTimeout(() => {
      clearArrival();
      setDone(true);
    }, 1300);
    return () => clearTimeout(t);
  }, [arrived]);
  if (!arrived || done) return null;
  return (
    <div aria-hidden className="curtain pointer-events-none fixed inset-0 z-[70] flex items-center justify-center" style={{ background: color }}>
      <p className="font-display text-[clamp(2.73rem,9.36vw,7.6rem)] text-ivory">{title}</p>
    </div>
  );
}
