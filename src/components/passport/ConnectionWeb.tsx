"use client";

import Link from "next/link";
import { useState } from "react";
import type { EvidenceLevel, RelationshipKind } from "@/lib/types";
import { RELATIONSHIP } from "@/lib/labels";
import { EvidenceBadge } from "@/components/site/Evidence";

export interface WebNode {
  id: string;
  type: "passport" | "route";
  label: string;
  sub: string;
  description: string;
  color: string;
  kind?: RelationshipKind;
  level?: EvidenceLevel;
  year?: string;
  href?: string;
  sources: { id: string; title: string; url: string; publisher: string; n?: number }[];
}

const W = 640;
const H = 480;
const CX = W / 2;
const CY = H / 2;

function wrap(text: string, max = 15) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max && line) {
      lines.push(line);
      line = w;
    } else line = (line + " " + w).trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

/**
 * A node-and-line diagram of one tradition's connections: related passports (editorial links)
 * and documented routes (each with its relationship kind and evidence label).
 * Visual similarity is drawn grey and dotted, and always carries its caution.
 */
export function ConnectionWeb({ center, nodes }: { center: { name: string; color: string }; nodes: WebNode[] }) {
  const [sel, setSel] = useState(nodes[0]?.id ?? null);
  const passports = nodes.filter((n) => n.type === "passport");
  const routes = nodes.filter((n) => n.type === "route");
  const both = passports.length > 0 && routes.length > 0;
  // Related passports on the left arc, routes on the right — or spread around if only one kind.
  const place = (list: WebNode[], from: number, to: number) =>
    list.map((n, i) => {
      const t = list.length === 1 ? (from + to) / 2 : from + ((to - from) * i) / (list.length - 1);
      const a = (t * Math.PI) / 180;
      // Rounded so server and browser trigonometry produce identical markup.
      return { n, x: Math.round(CX + Math.cos(a) * 225), y: Math.round(CY + Math.sin(a) * 185) };
    });
  const laid = both
    ? [...place(passports, 220, 140), ...place(routes, -75, 75)]
    : place(nodes, -90, nodes.length > 1 ? 270 - 360 / nodes.length : -90);
  const active = nodes.find((n) => n.id === sel);

  if (!nodes.length) return null;
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <figure className="border-2 border-ink bg-bone lg:col-span-7">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Diagram of ${center.name}'s documented connections`}>
          <rect width={W} height={H} fill="#F6F0E3" />
          <g opacity="0.5">
            {Array.from({ length: 13 }, (_, i) => (
              <line key={i} x1={i * 52} y1="0" x2={i * 52} y2={H} stroke="#1B1616" strokeOpacity="0.06" />
            ))}
          </g>
          {both && (
            <>
              <text x="24" y="30" style={{ fontFamily: "var(--font-ui)", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em" }} fill="#6B5F55">
                RELATED PASSPORTS
              </text>
              <text x={W - 24} y="30" textAnchor="end" style={{ fontFamily: "var(--font-ui)", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em" }} fill="#6B5F55">
                DOCUMENTED ROUTES
              </text>
            </>
          )}
          {laid.map(({ n, x, y }) => {
            const sim = n.kind === "visual-similarity";
            const dash = n.kind ? RELATIONSHIP[n.kind].dash : "0";
            const on = sel === n.id;
            return (
              <line
                key={`l-${n.id}`}
                x1={CX}
                y1={CY}
                x2={x}
                y2={y}
                stroke={sim ? "#8C8178" : n.type === "passport" ? n.color : "#1B1616"}
                strokeWidth={on ? 4.5 : 2.5}
                strokeDasharray={dash === "0" ? undefined : dash.split(" ").map((v) => Number(v) * 1.6).join(" ")}
                strokeLinecap="round"
              />
            );
          })}
          {/* centre */}
          <g>
            <circle cx={CX} cy={CY} r="64" fill={center.color} stroke="#1B1616" strokeWidth="3" />
            {wrap(center.name, 10).map((l, i, all) => (
              <text
                key={l}
                x={CX}
                y={CY + 8 + (i - (all.length - 1) / 2) * 24}
                textAnchor="middle"
                fill="#F6F0E3"
                style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" }}
              >
                {l}
              </text>
            ))}
          </g>
          {laid.map(({ n, x, y }) => {
            const on = sel === n.id;
            const lines = wrap(n.label);
            const sim = n.kind === "visual-similarity";
            return (
              <g
                key={n.id}
                role="button"
                tabIndex={0}
                aria-pressed={on}
                aria-label={`${n.label} — ${n.sub}`}
                onClick={() => setSel(n.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSel(n.id);
                  }
                }}
                className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-[#4e2b4c]"
              >
                {n.type === "passport" ? (
                  <rect x={x - 62} y={y - 30} width="124" height="60" fill={on ? n.color : "#F6F0E3"} stroke="#1B1616" strokeWidth={on ? 4 : 2.5} />
                ) : (
                  <rect
                    x={x - 64}
                    y={y - 30}
                    width="128"
                    height="60"
                    rx="30"
                    fill={on ? "#F4BA2E" : sim ? "#ECE2CA" : "#F6F0E3"}
                    stroke={sim ? "#8C8178" : "#1B1616"}
                    strokeWidth={on ? 4 : 2.5}
                    strokeDasharray={sim ? "3 4" : undefined}
                  />
                )}
                {lines.map((l, i) => (
                  <text
                    key={i}
                    x={x}
                    y={y + 5 + (i - (lines.length - 1) / 2) * 15}
                    textAnchor="middle"
                    fill={on && n.type === "passport" ? "#F6F0E3" : "#1B1616"}
                    style={{ fontFamily: "var(--font-ui)", fontSize: 12, fontWeight: 600 }}
                  >
                    {l}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
        <figcaption className="flex flex-wrap gap-x-5 gap-y-2 border-t-2 border-ink px-4 py-3">
          {passports.length > 0 && (
            <span className="label-sm flex items-center gap-2">
              <span className="h-3 w-5 border-2 border-ink bg-[var(--accent)]" /> Related passport (editorial link)
            </span>
          )}
          {Array.from(new Set(routes.map((r) => r.kind!))).map((k) => (
            <span key={k} className="label-sm flex items-center gap-2">
              <svg width="28" height="8" aria-hidden>
                <line
                  x1="0"
                  y1="4"
                  x2="28"
                  y2="4"
                  stroke={k === "visual-similarity" ? "#8C8178" : "#1B1616"}
                  strokeWidth="2.5"
                  strokeDasharray={RELATIONSHIP[k].dash === "0" ? undefined : RELATIONSHIP[k].dash}
                />
              </svg>
              {RELATIONSHIP[k].label}
            </span>
          ))}
        </figcaption>
      </figure>

      <div className="lg:col-span-5">
        <p className="label text-ink-mute">Select a connection</p>
        <ul className="mt-3 flex flex-wrap gap-1.5" role="list">
          {nodes.map((n) => (
            <li key={n.id}>
              <button type="button" onClick={() => setSel(n.id)} aria-pressed={sel === n.id} className="chip">
                {n.type === "passport" ? "◆" : n.kind === "visual-similarity" ? "≈" : "→"} {n.label}
              </button>
            </li>
          ))}
        </ul>
        {active && (
          <div className="mt-5 border-2 border-ink bg-bone p-5" aria-live="polite">
            <div className="flex flex-wrap items-center gap-2">
              <span className="label-sm bg-ink px-2 py-1 text-bone">{active.sub}</span>
              {active.year && <span className="label-sm text-ink-mute">{active.year}</span>}
              {active.level && <EvidenceBadge level={active.level} compact />}
            </div>
            <p className="font-title mt-3 text-3xl leading-none">{active.label}</p>
            <p className="mt-3 text-[0.95rem] text-ink-soft">{active.description}</p>
            {active.kind && RELATIONSHIP[active.kind].caution && (
              <p className="mt-3 border-l-4 border-brick pl-3 text-sm font-semibold text-brick">{RELATIONSHIP[active.kind].caution}</p>
            )}
            {active.sources.length > 0 && (
              <ul className="mt-4 space-y-1 border-t border-ink/20 pt-3">
                {active.sources.map((s) => (
                  <li key={s.id}>
                    <a
                      href={s.n ? `#source-${s.id}` : s.url}
                      target={s.n ? undefined : "_blank"}
                      rel={s.n ? undefined : "noreferrer"}
                      className="font-ui text-xs font-semibold text-brick no-underline hover:underline"
                    >
                      {s.n ? `[${s.n}] ` : "↗ "}
                      {s.publisher} — {s.title.length > 56 ? `${s.title.slice(0, 54)}…` : s.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {active.href && (
              <Link href={active.href} className="btn btn-ink mt-4">
                Open this passport →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
