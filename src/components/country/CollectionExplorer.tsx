"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import type { MediaAsset, MotifKey } from "@/lib/types";
import type { RegionMapData } from "./regionMap";
import { ArchiveImage } from "@/components/site/ArchiveImage";
import { Motif } from "@/components/motifs/Motif";

export interface ExplorerCard {
  slug: string;
  no: string;
  name: string;
  nativeName?: string;
  where: string;
  community: string;
  category: string;
  categoryKey: string;
  summary: string;
  maturity: string;
  motif: MotifKey;
  accent: string;
  accentSoft: string;
  media?: MediaAsset;
  crossBorder: boolean;
  hasCase: boolean;
}

const SHAPES = ["aspect-[4/5]", "aspect-[5/4]", "aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[16/11]"];

export function CollectionExplorer({ cards, map }: { cards: ExplorerCard[]; map: RegionMapData | null }) {
  const reduce = useReducedMotion();
  const [category, setCategory] = useState<string>("all");
  const [region, setRegion] = useState<"all" | "border">("all");
  const [active, setActive] = useState<string | null>(null);

  const categories = useMemo(() => {
    const m = new Map<string, { label: string; count: number }>();
    for (const c of cards) m.set(c.categoryKey, { label: c.category, count: (m.get(c.categoryKey)?.count ?? 0) + 1 });
    return [...m.entries()];
  }, [cards]);

  const visible = cards.filter((c) => (category === "all" || c.categoryKey === category) && (region === "all" || c.crossBorder));
  const visibleSet = new Set(visible.map((c) => c.slug));

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      {/* Map */}
      {map && (
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-20">
            <figure className="relative border rule bg-paper/70">
              <svg viewBox={`0 0 ${map.width} ${map.height}`} className="h-auto w-full" role="img" aria-label={`Map of ${map.focusName} showing where each tradition is made`}>
                <defs>
                  <pattern id="hatch-shared" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="6" height="6" fill="#EADCC9" />
                    <line x1="0" y1="0" x2="0" y2="6" stroke="#581D30" strokeOpacity="0.35" strokeWidth="1.4" />
                  </pattern>
                </defs>
                <rect width={map.width} height={map.height} fill="#E9DDC4" />
                {map.lands.map((l) => (
                  <path
                    key={l.iso + l.name}
                    d={l.d}
                    fill={l.focus ? "#F6F0E3" : l.shared ? "url(#hatch-shared)" : "#DDCDAE"}
                    stroke="#211C19"
                    strokeOpacity={l.focus ? 0.7 : 0.3}
                    strokeWidth={l.focus ? 1.2 : 0.6}
                  >
                    <title>{l.name}</title>
                  </path>
                ))}
                {map.links.map((ln) => {
                  const on = !active || active === ln.tradition;
                  return (
                    <path
                      key={ln.key}
                      d={ln.d}
                      fill="none"
                      stroke="#211C19"
                      strokeOpacity={on ? 0.75 : 0.12}
                      strokeWidth={1.3}
                      strokeDasharray={ln.dashed ? "2 5" : "5 4"}
                      className={reduce ? "" : "route-line"}
                    >
                      <title>{ln.label}</title>
                    </path>
                  );
                })}
                {map.markers.map((m) => {
                  const on = (!active || active === m.tradition) && visibleSet.has(m.tradition);
                  return (
                    <g
                      key={m.key}
                      transform={`translate(${m.x} ${m.y})`}
                      style={{ opacity: on ? 1 : 0.18, transition: "opacity .4s" }}
                      onPointerEnter={() => setActive(m.tradition)}
                      onPointerLeave={() => setActive(null)}
                    >
                      <circle r={active === m.tradition ? 9 : 6} fill={m.color} fillOpacity={0.22} />
                      <circle r={3.6} fill={m.color} stroke="#F6F0E3" strokeWidth={1.4} />
                      <title>{`${m.place}`}</title>
                    </g>
                  );
                })}
              </svg>
              <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t rule px-3 py-2">
                <span className="label-sm text-ink-mute">Fig. — Where each tradition is made · hatched: shared across a border</span>
                <span className="label-sm text-ink-mute">Boundaries: Natural Earth</span>
              </figcaption>
            </figure>
            {active && (
              <p className="label mt-3 text-ink-soft" aria-live="polite">
                {cards.find((c) => c.slug === active)?.name} — {map.markers.filter((m) => m.tradition === active).map((m) => m.place).join(", ")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Gallery */}
      <div className={map ? "lg:col-span-7" : "lg:col-span-12"}>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter traditions">
          <span className="label-sm mr-2 text-ink-mute">Filter</span>
          <Chip on={category === "all" && region === "all"} onClick={() => (setCategory("all"), setRegion("all"))}>
            All · {cards.length}
          </Chip>
          {categories.map(([key, v]) => (
            <Chip key={key} on={category === key} onClick={() => setCategory(category === key ? "all" : key)}>
              {v.label} · {v.count}
            </Chip>
          ))}
          {cards.some((c) => c.crossBorder) && (
            <Chip on={region === "border"} onClick={() => setRegion(region === "border" ? "all" : "border")}>
              Crosses a border · {cards.filter((c) => c.crossBorder).length}
            </Chip>
          )}
        </div>

        <ul className="mt-8 columns-1 gap-6 sm:columns-2 [&>li]:mb-6">
          <AnimatePresence initial={false}>
            {visible.map((c) => (
              <motion.li
                key={c.slug}
                layout={!reduce}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="break-inside-avoid"
                onPointerEnter={() => setActive(c.slug)}
                onPointerLeave={() => setActive(null)}
              >
                <Link
                  href={`/passport/${c.slug}`}
                  className={`group block border bg-ivory transition-[border-color,box-shadow] duration-500 hover:shadow-[0_30px_60px_-35px_rgba(33,28,25,.55)] ${active === c.slug ? "border-ink" : "border-ink/15"}`}
                  onFocus={() => setActive(c.slug)}
                  onBlur={() => setActive(null)}
                >
                  <div className={`relative overflow-hidden ${SHAPES[cards.indexOf(c) % SHAPES.length]}`}>
                    {c.media ? (
                      <ArchiveImage
                        media={c.media}
                        fallbackMotif={c.motif}
                        sizes="(min-width:1024px) 28vw, (min-width:640px) 45vw, 100vw"
                        className="h-full w-full"
                        linkCredit={false}
                        imgClassName="transition-transform duration-[1.4s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]"
                      />
                    ) : (
                      <Motif motif={c.motif} className="h-full w-full" />
                    )}
                    <span className="label-sm absolute left-3 top-3 rounded-full bg-ivory/90 px-2 py-1 text-ink">No. {c.no}</span>
                    {c.hasCase && <span className="label-sm absolute right-3 top-3 rounded-full bg-terracotta px-2 py-1 text-ivory">Attribution case</span>}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-[2.1rem] group-hover:text-terracotta">{c.name}</p>
                        {c.nativeName && <p className="mt-0.5 text-sm text-ink-mute">{c.nativeName}</p>}
                      </div>
                      <span className="mt-1 h-10 w-10 shrink-0 overflow-hidden rounded-full border border-ink/20">
                        <Motif motif={c.motif} className="h-full w-full" />
                      </span>
                    </div>
                    <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                      <dt className="label-sm pt-0.5 text-ink-mute">Where</dt>
                      <dd>{c.where}</dd>
                      <dt className="label-sm pt-0.5 text-ink-mute">Who</dt>
                      <dd>{c.community}</dd>
                      <dt className="label-sm pt-0.5 text-ink-mute">What</dt>
                      <dd>{c.category}</dd>
                    </dl>
                    <p className="mt-4 text-[0.95rem] text-ink-soft">{c.summary}</p>
                    <div className="mt-5 flex items-center justify-between border-t rule pt-3">
                      <span className="label-sm rounded-full px-2 py-0.5" style={{ background: c.accentSoft }}>
                        {c.maturity}
                      </span>
                      <span className="label group-hover:text-terracotta">Open passport →</span>
                    </div>
                  </div>
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {visible.length === 0 && <p className="text-ink-soft">No passports match these filters.</p>}
      </div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`label-sm rounded-full border px-3 py-1.5 transition-colors ${on ? "border-ink bg-ink text-ivory" : "border-ink/25 hover:border-ink"}`}
    >
      {children}
    </button>
  );
}
