import Link from "next/link";
import type { EvidenceLevel } from "@/lib/types";
import { EVIDENCE } from "@/lib/labels";

export function EvidenceBadge({ level, compact = false, className = "" }: { level: EvidenceLevel; compact?: boolean; className?: string }) {
  const e = EVIDENCE[level];
  return (
    <span
      className={`label-sm inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 ${className}`}
      style={{ borderColor: `${e.color}66`, color: e.color, background: `${e.color}0f` }}
      title={e.description}
    >
      <span aria-hidden>{e.glyph}</span>
      {compact ? e.short : e.label}
    </span>
  );
}

/** Superscript citation markers that jump to the Evidence Room. */
export function SourceMarks({ ids, numbering }: { ids: string[]; numbering: Map<string, number> }) {
  if (!ids.length) return null;
  return (
    <span className="ml-0.5 inline-flex gap-0.5 align-super">
      {ids.map((id) => {
        const n = numbering.get(id);
        if (!n) return null;
        return (
          <Link
            key={id}
            href={`#source-${id}`}
            className="font-mono text-[0.62rem] leading-none text-terracotta no-underline hover:underline"
            aria-label={`Source ${n}`}
          >
            [{n}]
          </Link>
        );
      })}
    </span>
  );
}
