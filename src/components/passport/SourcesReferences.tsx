"use client";

import { useEffect, useState } from "react";
import type { Claim, EvidenceLevel, Source, SourceType } from "@/lib/types";
import { EVIDENCE, EVIDENCE_ORDER, SOURCE_TYPE, formatSourceDate } from "@/lib/labels";
import { EvidenceBadge } from "@/components/site/Evidence";
import { RESET_FILTERS_EVENT } from "./SourceDrawer";

export interface NumberedSource extends Source {
  n: number;
  supports: string[];
}

/** Source types grouped for the "where the sources come from" chart (counts only, no weighting). */
const GROUPS: { key: string; label: string; color: string; types: SourceType[] }[] = [
  { key: "official", label: "Registries, courts & UNESCO", color: "#4e2b4c", types: ["official-record", "government", "unesco", "court-report"] },
  { key: "museum", label: "Museums & scholarship", color: "#6e4520", types: ["museum", "academic"] },
  { key: "press", label: "News & magazines", color: "#EEA53A", types: ["news", "magazine"] },
  { key: "brand", label: "Brand statements", color: "#E04A2C", types: ["brand-statement"] },
  { key: "other", label: "Reference, organisations & records", color: "#B8935C", types: ["organization", "reference", "oral-history", "media-record"] },
];
const groupOf = (t: SourceType) => GROUPS.find((g) => g.types.includes(t)) ?? GROUPS[GROUPS.length - 1];

const CLAIMS_SHOWN = 4;
const SOURCES_SHOWN = 6;

/**
 * `compact`: for passports whose claims are already shown in full above (research passports), only
 * the source library is shown.
 */
export function SourcesReferences({ claims, sources, compact = false }: { claims: Claim[]; sources: NumberedSource[]; compact?: boolean }) {
  const [level, setLevel] = useState<EvidenceLevel | "all">("all");
  const [group, setGroup] = useState<string>("all");
  useEffect(() => {
    const reset = () => {
      setLevel("all");
      setGroup("all");
    };
    window.addEventListener(RESET_FILTERS_EVENT, reset);
    return () => window.removeEventListener(RESET_FILTERS_EVENT, reset);
  }, []);

  const byId = new Map(sources.map((s) => [s.id, s]));
  const counts = EVIDENCE_ORDER.map((l) => [l, claims.filter((c) => c.level === l).length] as const).filter(([, n]) => n > 0);
  const groups = GROUPS.map((g) => ({ ...g, n: sources.filter((s) => g.types.includes(s.type)).length })).filter((g) => g.n > 0);
  const shownClaims = claims.filter((c) => level === "all" || c.level === level);
  const shownSources = sources.filter((s) => group === "all" || groupOf(s.type).key === group);

  const claimItem = (c: Claim) => (
    <li key={c.id} id={`claim-${c.id}`} className="py-5 outline-none target:bg-yellow/30 focus:bg-yellow/30">
      <div className="flex flex-wrap items-center gap-2">
        <EvidenceBadge level={c.level} />
        <span className="font-ui text-[0.68rem] text-ink-mute">#{c.id}</span>
      </div>
      <p className="mt-2 max-w-[62ch]">{c.text}</p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {c.sources.map((id) => {
          const s = byId.get(id);
          return s ? (
            <li key={id}>
              <a href={`#source-${id}`} className="font-ui text-xs font-semibold text-brick no-underline hover:underline">
                [{s.n}] {s.publisher}
                {s.date ? `, ${formatSourceDate(s.date)}` : ""}
              </a>
            </li>
          ) : null;
        })}
      </ul>
      {c.note && (
        <p className="mt-2 max-w-[62ch] border-l-4 border-yellow pl-3 text-sm text-ink-soft">
          <span className="label-sm text-ink-mute">Editor&rsquo;s note · </span>
          {c.note}
        </p>
      )}
    </li>
  );

  const sourceItem = (s: NumberedSource) => (
    <li key={s.id} id={`source-${s.id}`} className="border-b border-ink/15 py-4 outline-none target:bg-yellow/30 focus:bg-yellow/30">
      <div className="flex gap-3">
        <span className="font-display w-9 shrink-0 text-2xl leading-none" style={{ color: groupOf(s.type).color === "#EEA53A" ? "#8A5A12" : groupOf(s.type).color }}>
          {s.n}
        </span>
        <div className="min-w-0">
          <a href={s.url} target="_blank" rel="noreferrer" className="font-semibold leading-snug hover:text-brick">
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
          {s.notes && <p className="mt-2 border-l-2 border-ink/25 pl-2 text-xs text-ink-soft">{s.notes}</p>}
        </div>
      </div>
    </li>
  );

  if (compact)
    return (
      <div className="max-w-3xl">
        <ol className="border-t-2 border-ink">{sources.map(sourceItem)}</ol>
      </div>
    );

  return (
    <div>
      {/* ── At a glance: three real counts ── */}
      <div className="grid gap-3 md:grid-cols-[auto_1fr_1fr]">
        <div className="flex flex-col justify-between bg-ink p-5 text-bone md:w-56">
          <p className="label text-yellow">In this passport</p>
          <p className="mt-3">
            <span className="font-display block text-[4.4rem] leading-[0.8]">{sources.length}</span>
            <span className="font-ui text-sm font-bold uppercase tracking-[0.08em]">sources</span>
          </p>
          <p className="mt-3 text-sm text-bone/75">supporting {claims.length} labelled claims</p>
        </div>

        <div className="border-2 border-ink bg-bone p-5">
          <p className="label">How certain are the claims?</p>
          <div className="mt-4 flex h-9 overflow-hidden border-2 border-ink" role="img" aria-label={counts.map(([l, n]) => `${EVIDENCE[l].label}: ${n}`).join(", ")}>
            {counts.map(([l, n]) => (
              <span key={l} className="flex items-center justify-center border-r-2 border-ink text-xs font-bold text-bone last:border-r-0" style={{ width: `${(n / claims.length) * 100}%`, background: EVIDENCE[l].color }}>
                {n}
              </span>
            ))}
          </div>
          <ul className="mt-3 space-y-1">
            {counts.map(([l, n]) => (
              <li key={l} className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 shrink-0" style={{ background: EVIDENCE[l].color }} />
                <span className="flex-1">{EVIDENCE[l].label}</span>
                <span className="font-ui font-bold">{n}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-2 border-ink bg-bone p-5">
          <p className="label">Where the sources come from</p>
          <ul className="mt-4 flex flex-wrap gap-1" role="img" aria-label={groups.map((g) => `${g.label}: ${g.n}`).join(", ")}>
            {sources.map((s) => (
              <li key={s.id} className="h-5 w-5 border border-ink/40" style={{ background: groupOf(s.type).color }} title={`[${s.n}] ${SOURCE_TYPE[s.type]}`} />
            ))}
          </ul>
          <ul className="mt-3 space-y-1">
            {groups.map((g) => (
              <li key={g.key} className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 shrink-0 border border-ink/40" style={{ background: g.color }} />
                <span className="flex-1">{g.label}</span>
                <span className="font-ui font-bold">{g.n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-14 grid gap-14 lg:grid-cols-12">
        {/* ── Claims ── */}
        <div className="lg:col-span-7">
          <h3 className="font-display text-[2.08rem]">Claims &amp; their evidence</h3>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter claims by evidence">
            <button type="button" aria-pressed={level === "all"} onClick={() => setLevel("all")} className="chip">
              All · {claims.length}
            </button>
            {counts.map(([l, n]) => (
              <button
                key={l}
                type="button"
                aria-pressed={level === l}
                onClick={() => setLevel(level === l ? "all" : l)}
                className="chip"
                style={level === l ? { background: EVIDENCE[l].color, borderColor: EVIDENCE[l].color } : { borderColor: EVIDENCE[l].color, color: EVIDENCE[l].color }}
              >
                {EVIDENCE[l].glyph} {EVIDENCE[l].label} · {n}
              </button>
            ))}
          </div>
          <ol className="mt-4 divide-y divide-ink/15 border-y-2 border-ink">{shownClaims.slice(0, CLAIMS_SHOWN).map(claimItem)}</ol>
          {shownClaims.length > CLAIMS_SHOWN && (
            <details className="more mt-4">
              <summary className="inline-flex items-center gap-3 border-2 border-ink bg-bone px-4 py-2.5 hover:bg-yellow">
                <span aria-hidden className="more-icon font-display text-2xl leading-none transition-transform">
                  +
                </span>
                <span className="font-ui text-[0.74rem] font-bold uppercase tracking-[0.1em]">
                  <span className="more-closed">Show all {shownClaims.length} claims</span>
                  <span className="more-open">Show fewer claims</span>
                </span>
              </summary>
              <ol className="mt-2 divide-y divide-ink/15 border-b-2 border-ink">{shownClaims.slice(CLAIMS_SHOWN).map(claimItem)}</ol>
            </details>
          )}
          <details className="more mt-8">
            <summary className="label inline-flex items-center gap-2 border-b-2 border-ink pb-0.5">
              <span aria-hidden className="more-icon inline-block transition-transform">
                +
              </span>
              What the evidence labels mean
            </summary>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {EVIDENCE_ORDER.map((l) => (
                <div key={l} className="text-sm">
                  <dt>
                    <EvidenceBadge level={l} />
                  </dt>
                  <dd className="mt-1 text-ink-soft">{EVIDENCE[l].description}</dd>
                </div>
              ))}
            </dl>
          </details>
        </div>

        {/* ── Source library ── */}
        <div className="lg:col-span-5">
          <h3 className="font-display text-[2.08rem]">Source library</h3>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter sources by kind">
            <button type="button" aria-pressed={group === "all"} onClick={() => setGroup("all")} className="chip">
              All · {sources.length}
            </button>
            {groups.map((g) => (
              <button key={g.key} type="button" aria-pressed={group === g.key} onClick={() => setGroup(group === g.key ? "all" : g.key)} className="chip">
                <span className="h-2.5 w-2.5 border border-ink/40" style={{ background: g.color }} />
                {g.label.split(" ")[0].replace(",", "")} · {g.n}
              </button>
            ))}
          </div>
          <ol className="mt-4 border-t-2 border-ink">{shownSources.slice(0, SOURCES_SHOWN).map(sourceItem)}</ol>
          {shownSources.length > SOURCES_SHOWN && (
            <details className="more mt-4">
              <summary className="inline-flex items-center gap-3 border-2 border-ink bg-bone px-4 py-2.5 hover:bg-yellow">
                <span aria-hidden className="more-icon font-display text-2xl leading-none transition-transform">
                  +
                </span>
                <span className="font-ui text-[0.74rem] font-bold uppercase tracking-[0.1em]">
                  <span className="more-closed">Show all {shownSources.length} sources</span>
                  <span className="more-open">Show fewer sources</span>
                </span>
              </summary>
              <ol className="mt-2">{shownSources.slice(SOURCES_SHOWN).map(sourceItem)}</ol>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
