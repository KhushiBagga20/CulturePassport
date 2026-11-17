import type { EvidenceLevel } from "@/lib/types";
import { EVIDENCE } from "@/lib/labels";

export function EvidenceBadge({ level, compact = false, className = "" }: { level: EvidenceLevel; compact?: boolean; className?: string }) {
  const e = EVIDENCE[level];
  return (
    <span
      className={`label-sm inline-flex items-center gap-1.5 whitespace-nowrap border-[1.5px] px-1.5 py-0.5 ${className}`}
      style={{ borderColor: e.color, color: e.color, background: `color-mix(in oklab, ${e.color} 7%, #F6F0E3)` }}
      title={e.description}
    >
      <span aria-hidden>{e.glyph}</span>
      {compact ? e.label.replace("Further verification needed", "Needs verification").replace("Historical interpretation", "Interpretation").replace("Community testimony", "Community") : e.label}
    </span>
  );
}

/**
 * Superscript citation markers. On passport pages they open the source drawer;
 * without JavaScript (or with a modified click) they jump to Sources & References.
 */
export function SourceMarks({ ids, numbering, tone = "light" }: { ids: string[]; numbering: Map<string, number>; tone?: "light" | "dark" }) {
  if (!ids.length) return null;
  return (
    <span className="ml-0.5 inline-flex gap-0.5 align-super">
      {ids.map((id) => {
        const n = numbering.get(id);
        if (!n) return null;
        return (
          <a
            key={id}
            href={`#source-${id}`}
            className={`font-ui text-[0.66rem] font-bold leading-none no-underline hover:underline ${tone === "dark" ? "text-yellow" : "text-brick"}`}
            aria-label={`Source ${n}`}
          >
            [{n}]
          </a>
        );
      })}
    </span>
  );
}
