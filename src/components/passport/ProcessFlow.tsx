import type { EvidenceLevel, MediaAsset, MotifKey } from "@/lib/types";
import { EVIDENCE } from "@/lib/labels";
import { SourceMarks } from "@/components/site/Evidence";
import { ArchiveImage } from "@/components/site/ArchiveImage";
import { Motif } from "@/components/motifs/Motif";

interface Material {
  name: string;
  detail: string;
  level: EvidenceLevel;
  sources: string[];
}
interface Step {
  title: string;
  detail: string;
  level: EvidenceLevel;
  sources: string[];
}

/**
 * Generic action pictograms (tools and gestures, not cultural symbols), chosen from words
 * in the step's own title. Steps that match nothing get their number only.
 */
const ICONS: [RegExp, string][] = [
  [/clean|wash/i, "M5 13c3-3 5 3 8 0s5 3 8 0 5 3 6 1M5 20c3-3 5 3 8 0s5 3 8 0 5 3 6 1M14 4c-2 3-3 4.5-3 6a3 3 0 006 0c0-1.5-1-3-3-6z"],
  [/dye|indigo/i, "M16 3c-3 5-5 7.5-5 10a5 5 0 0010 0c0-2.5-2-5-5-10zM5 20h22l-2 9H7z"],
  [/skiv|thin/i, "M4 22h24M4 26h24M8 18L22 6l4 3-12 11z"],
  [/shear|cut|pattern/i, "M9 9a3.5 3.5 0 110 .1M9 23a3.5 3.5 0 110 .1M12 11l15 12M12 21l15-12"],
  [/layer|sole/i, "M4 12l12-6 12 6-12 6zM4 17l12 6 12-6M4 22l12 6 12-6"],
  [/stitch|darn|sew/i, "M6 26L24 8M24 8a2 2 0 103 3 2 2 0 00-3-3M4 18c3 0 4 3 7 3s4-3 7-3 4 3 7 3"],
  [/braid|punch/i, "M8 4c8 4-8 8 0 12s-8 8 0 12M16 4c8 4-8 8 0 12s-8 8 0 12M24 4c-8 4 8 8 0 12s8 8 0 12"],
  [/finish|polish/i, "M16 4l2.5 7.5L26 14l-7.5 2.5L16 24l-2.5-7.5L6 14l7.5-2.5zM25 22l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"],
  [/border/i, "M5 5h22v22H5zM9 9h14v14H9z"],
  [/outline/i, "M16 5c6 0 10 5 10 11s-4 11-10 11S6 22 6 16 10 5 16 5zM16 9c4 0 6.5 3 6.5 7S20 23 16 23s-6.5-3-6.5-7S12 9 16 9z"],
  [/empty|fill/i, "M5 5h22v22H5zM5 12h22M5 19h22M12 5v22M19 5v22"],
  [/count|weave|loom/i, "M6 5v22M11 5v22M16 5v22M21 5v22M26 5v22M4 10h24M4 16h24M4 22h24"],
  [/print|block|resist/i, "M8 4h16v10H8zM12 14h8v4h-8zM4 24h24v4H4zM12 9h8"],
  [/spin/i, "M16 3v26M10 10h12M12 14c0 4 8 4 8 0M8 20c4-3 12-3 16 0"],
  [/garden|flower/i, "M16 16m-3 0a3 3 0 106 0 3 3 0 10-6 0M16 13c-2-5 2-9 0-9s2 4 0 9M19 16c5-2 9 2 9 0s-4 2-9 0M16 19c2 5-2 9 0 9s-2-4 0-9M13 16c-5 2-9-2-9 0s4-2 9 0"],
  [/prepare|cloth/i, "M5 8h22v6H5zM7 14v12h18V14M10 18h12"],
];

function iconFor(title: string) {
  return ICONS.find(([re]) => re.test(title))?.[1];
}

export function ProcessFlow({
  materials,
  steps,
  numbering,
  finished,
  finishedLabel,
  motif,
}: {
  materials: Material[];
  steps: Step[];
  numbering: Map<string, number>;
  finished?: MediaAsset;
  finishedLabel: string;
  motif: MotifKey;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,15rem)_1fr_minmax(0,13rem)] lg:items-stretch lg:gap-4">
      {/* 1 · Raw materials */}
      <div className="border-2 border-bone/70 p-4">
        <p className="label text-yellow">Raw materials</p>
        <ul className="mt-3 space-y-3">
          {materials.map((m) => (
            <li key={m.name}>
              <p className="flex items-baseline justify-between gap-2">
                <span className="font-title text-xl">{m.name}</span>
                <span title={EVIDENCE[m.level].label} className="text-xs">
                  {EVIDENCE[m.level].glyph}
                  <span className="sr-only"> {EVIDENCE[m.level].label}</span>
                </span>
              </p>
              <p className="text-[0.82rem] leading-snug opacity-80">
                {m.detail}
                <SourceMarks ids={m.sources} numbering={numbering} tone="dark" />
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* 2 · The steps */}
      {steps.length > 0 ? (
        <ol className="grid gap-2 sm:grid-cols-2 lg:flex lg:gap-0" aria-label="Making process, in order">
          {steps.map((s, i) => {
            const d = iconFor(s.title);
            const firm = s.level === "documented";
            return (
              <li
                key={s.title}
                className={`relative flex min-w-0 flex-1 flex-col bg-bone p-4 text-ink lg:py-5 lg:pl-8 lg:pr-7 ${i === 0 ? "lg:chevron-first lg:pl-5" : "lg:chevron lg:-ml-3"} ${firm ? "" : "bg-[repeating-linear-gradient(135deg,#F6F0E3_0_8px,#ECE2CA_8px_10px)]"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-4xl leading-none text-[var(--accent-text)]">{String(i + 1).padStart(2, "0")}</span>
                  {d && (
                    <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
                      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <p className="font-title mt-3 text-xl leading-tight">{s.title}</p>
                <p className="mt-1 text-[0.8rem] leading-snug text-ink-soft">
                  {s.detail}
                  <SourceMarks ids={s.sources} numbering={numbering} />
                </p>
                <p className="label-sm mt-auto pt-3 text-ink-mute" title={EVIDENCE[s.level].description}>
                  {EVIDENCE[s.level].glyph} {firm ? "Documented" : EVIDENCE[s.level].short === "VER" ? "Awaiting makers' review" : EVIDENCE[s.level].label}
                </p>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="flex items-center border-2 border-dashed border-bone/50 p-6">
          <p className="max-w-md text-sm opacity-85">
            The making process has not been documented step by step in this passport yet. We add steps only when a source describes them.
          </p>
        </div>
      )}

      {/* 3 · Finished object */}
      <figure className="flex flex-col border-2 border-bone/70 p-3">
        <p className="label text-yellow">Finished object</p>
        <div className="mt-2 flex-1 overflow-hidden border-2 border-bone/70">
          {finished ? (
            <ArchiveImage media={finished} fallbackMotif={motif} className="aspect-square h-full w-full" sizes="220px" width={500} linkCredit={false} />
          ) : (
            <Motif motif={motif} className="aspect-square h-full w-full" title="Archive illustration" />
          )}
        </div>
        <figcaption className="font-title mt-2 text-lg leading-tight">{finishedLabel}</figcaption>
      </figure>
    </div>
  );
}
