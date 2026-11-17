"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export interface TrailInfo {
  slug: string;
  title: string;
  steps: { slug: string; name: string }[];
}

/** Shown when a visitor arrives from a cultural trail (?trail=slug). */
export function TrailBar({ trails, current }: { trails: TrailInfo[]; current: string }) {
  const params = useSearchParams();
  const trail = trails.find((t) => t.slug === params.get("trail"));
  if (!trail) return null;
  const i = trail.steps.findIndex((s) => s.slug === current);
  if (i < 0) return null;
  const prev = trail.steps[i - 1];
  const next = trail.steps[i + 1];
  return (
    <div className="no-print border-b rule bg-ink text-ivory">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-10">
        <Link href={`/trails/${trail.slug}`} className="label-sm text-mustard hover:underline">
          Trail · {trail.title} — stop {i + 1} of {trail.steps.length}
        </Link>
        <div className="flex gap-4">
          {prev && (
            <Link href={`/passport/${prev.slug}?trail=${trail.slug}`} className="label-sm hover:text-mustard">
              ← {prev.name}
            </Link>
          )}
          {next ? (
            <Link href={`/passport/${next.slug}?trail=${trail.slug}`} className="label-sm hover:text-mustard">
              Next stop: {next.name} →
            </Link>
          ) : (
            <Link href={`/trails/${trail.slug}`} className="label-sm hover:text-mustard">
              End of trail ↺
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
