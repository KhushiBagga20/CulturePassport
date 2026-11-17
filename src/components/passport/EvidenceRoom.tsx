"use client";

import { useState } from "react";
import type { Claim, EvidenceLevel, Source } from "@/lib/types";
import { EVIDENCE, EVIDENCE_ORDER, SOURCE_TYPE, formatSourceDate } from "@/lib/labels";
import { EvidenceBadge } from "@/components/site/Evidence";

export interface NumberedSource extends Source {
  n: number;
  supports: string[];
}

export function EvidenceRoom({ claims, sources }: { claims: Claim[]; sources: NumberedSource[] }) {
  const [level, setLevel] = useState<EvidenceLevel | "all">("all");
  const [type, setType] = useState<string>("all");
  const byId = new Map(sources.map((s) => [s.id, s]));
  const counts = EVIDENCE_ORDER.map((l) => [l, claims.filter((c) => c.level === l).length] as const).filter(([, n]) => n > 0);
  const shown = claims.filter((c) => level === "all" || c.level === level);
  const types = Array.from(new Set(sources.map((s) => s.type)));

  return (
    <div className="grid gap-14 lg:grid-cols-12">
      {/* Claims */}
      <div className="lg:col-span-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="font-serif text-3xl">Claims, and what supports them</h3>
          <span className="label-sm text-ink-mute">{claims.length} claims</span>
        </div>
        {/* distribution bar */}
        <div className="mt-5 flex h-2 overflow-hidden rounded-full" aria-hidden>
          {counts.map(([l, n]) => (
            <span key={l} style={{ width: `${(n / claims.length) * 100}%`, background: EVIDENCE[l].color }} />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter claims by evidence">
          <button
            type="button"
            aria-pressed={level === "all"}
            onClick={() => setLevel("all")}
            className={`label-sm rounded-full border px-3 py-1.5 ${level === "all" ? "border-ink bg-ink text-ivory" : "border-ink/25 hover:border-ink"}`}
          >
            All · {claims.length}
          </button>
          {counts.map(([l, n]) => (
            <button
              key={l}
              type="button"
              aria-pressed={level === l}
              onClick={() => setLevel(level === l ? "all" : l)}
              className={`label-sm rounded-full border px-3 py-1.5 ${level === l ? "text-ivory" : "hover:border-ink"}`}
              style={level === l ? { background: EVIDENCE[l].color, borderColor: EVIDENCE[l].color } : { borderColor: `${EVIDENCE[l].color}55`, color: EVIDENCE[l].color }}
            >
              {EVIDENCE[l].glyph} {EVIDENCE[l].label} · {n}
            </button>
          ))}
        </div>
        <ol className="mt-6 divide-y divide-ink/10 border-y rule">
          {shown.map((c) => (
            <li key={c.id} id={`claim-${c.id}`} className="scroll-mt-28 py-5 target:bg-mustard/10">
              <div className="flex flex-wrap items-center gap-2">
                <EvidenceBadge level={c.level} />
                <span className="font-mono text-[0.65rem] text-ink-mute">#{c.id}</span>
              </div>
              <p className="mt-2 max-w-[62ch]">{c.text}</p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {c.sources.map((id) => {
                  const s = byId.get(id);
                  return s ? (
                    <li key={id}>
                      <a href={`#source-${id}`} className="font-mono text-xs text-terracotta no-underline hover:underline">
                        [{s.n}] {s.publisher}
                        {s.date ? `, ${formatSourceDate(s.date)}` : ""}
                      </a>
                    </li>
                  ) : null;
                })}
              </ul>
              {c.note && (
                <p className="mt-2 max-w-[62ch] border-l-2 border-mustard pl-3 text-sm text-ink-soft">
                  <span className="label-sm text-ink-mute">Editor&rsquo;s note · </span>
                  {c.note}
                </p>
              )}
            </li>
          ))}
        </ol>
        <dl className="mt-8 grid gap-3 sm:grid-cols-2">
          {EVIDENCE_ORDER.map((l) => (
            <div key={l} className="text-sm">
              <dt>
                <EvidenceBadge level={l} />
              </dt>
              <dd className="mt-1 text-ink-soft">{EVIDENCE[l].description}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Source library */}
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-24">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-serif text-3xl">Source library</h3>
            <label className="label-sm flex items-center gap-2 text-ink-mute">
              Type
              <select value={type} onChange={(e) => setType(e.target.value)} className="label-sm rounded border rule bg-ivory px-2 py-1 text-ink">
                <option value="all">All</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {SOURCE_TYPE[t]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <ol className="mt-5 max-h-none space-y-0 border-t rule lg:max-h-[75vh] lg:overflow-y-auto lg:pr-2">
            {sources
              .filter((s) => type === "all" || s.type === type)
              .map((s) => (
                <li key={s.id} id={`source-${s.id}`} className="scroll-mt-28 border-b rule py-4 target:bg-mustard/15">
                  <div className="flex gap-3">
                    <span className="font-mono text-sm text-terracotta">[{s.n}]</span>
                    <div className="min-w-0">
                      <a href={s.url} target="_blank" rel="noreferrer" className="font-medium leading-snug hover:text-terracotta">
                        {s.title} <span aria-hidden>↗</span>
                      </a>
                      <p className="mt-1 text-sm text-ink-soft">
                        {s.author ? `${s.author} · ` : ""}
                        {s.publisher} · {formatSourceDate(s.date)}
                      </p>
                      <p className="label-sm mt-1 text-ink-mute">
                        {SOURCE_TYPE[s.type]} · checked {formatSourceDate(s.accessed)}
                      </p>
                      {s.supports.length > 0 && (
                        <p className="mt-2 text-xs text-ink-mute">
                          <span className="label-sm">Supports: </span>
                          {s.supports.join(" · ")}
                        </p>
                      )}
                      {s.notes && <p className="mt-2 border-l-2 border-ink/20 pl-2 text-xs text-ink-soft">{s.notes}</p>}
                    </div>
                  </div>
                </li>
              ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
