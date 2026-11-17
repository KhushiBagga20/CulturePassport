"use client";

import { useState } from "react";
import type { EvidenceLevel } from "@/lib/types";
import { EVIDENCE } from "@/lib/labels";

export interface ChronoEvent {
  id: string;
  date: string;
  title: string;
  body: string;
  tag?: string;
  level: EvidenceLevel;
  sources: { id: string; n: number }[];
}

/** Phase colours for case events, by the event's own tag. */
const PHASE: Record<string, { label: string; color: string; ink: string }> = {
  origin: { label: "Origin", color: "#27703F", ink: "#F6F0E3" },
  recognition: { label: "Recognition", color: "#1F4E9F", ink: "#F6F0E3" },
  runway: { label: "On the runway", color: "#E04A2C", ink: "#1B1616" },
  response: { label: "Response", color: "#EEA53A", ink: "#1B1616" },
  collaboration: { label: "Afterwards", color: "#0F6E67", ink: "#F6F0E3" },
};
const OTHER = { label: "Event", color: "#ECE2CA", ink: "#1B1616" };

/** The attribution sequence as a numbered flow, colour-coded by phase, with details on demand. */
export function CaseChronology({ events }: { events: ChronoEvent[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const phases = Array.from(new Set(events.map((e) => e.tag ?? "other"))).map((k) => [k, PHASE[k] ?? OTHER] as const);
  return (
    <div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Phases">
        {phases.map(([k, p]) => (
          <li key={k} className="label-sm flex items-center gap-2 text-bone/80">
            <span className="h-3 w-3" style={{ background: p.color }} /> {p.label}
          </li>
        ))}
      </ul>
      <ol className="relative mt-6 grid gap-3 md:grid-cols-3 lg:grid-cols-6 lg:gap-0">
        <span aria-hidden className="absolute left-0 right-0 top-[1.35rem] hidden h-1 bg-bone/30 lg:block" />
        {events.map((e, i) => {
          const p = PHASE[e.tag ?? ""] ?? OTHER;
          const isOpen = open === e.id;
          return (
            <li key={e.id} className="relative flex flex-col lg:pr-3">
              <span
                className="font-display relative z-10 flex h-11 w-11 items-center justify-center border-2 border-ink text-2xl"
                style={{ background: p.color, color: p.ink }}
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="mt-3 flex flex-1 flex-col border-t-4 bg-bone p-4 text-ink" style={{ borderColor: p.color }}>
                <p className="label-sm text-ink-mute">
                  {e.date} · {p.label}
                </p>
                <p className="font-title mt-2 text-[1.4rem] leading-[1.05]">{e.title}</p>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : e.id)}
                  aria-expanded={isOpen}
                  aria-controls={`ce-${e.id}`}
                  className="label mt-auto inline-flex items-center gap-2 self-start pt-3 hover:text-brick"
                >
                  <span className="border-b-2 border-ink pb-0.5">{isOpen ? "Hide" : "What happened"}</span>
                  <span aria-hidden>{isOpen ? "−" : "+"}</span>
                </button>
                <div id={`ce-${e.id}`} hidden={!isOpen}>
                  <p className="mt-2 text-sm text-ink-soft">{e.body}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="label-sm" style={{ color: EVIDENCE[e.level].color }}>
                      {EVIDENCE[e.level].glyph} {EVIDENCE[e.level].label}
                    </span>
                    {e.sources.map((s) => (
                      <a key={s.id} href={`#source-${s.id}`} className="font-ui text-[0.7rem] font-bold text-brick no-underline hover:underline" aria-label={`Source ${s.n}`}>
                        [{s.n}]
                      </a>
                    ))}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
