"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DocType, SearchDoc } from "@/lib/search-index";
import { EvidenceBadge } from "@/components/site/Evidence";

const TYPES: { key: DocType | "all"; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "passport", label: "Passports" },
  { key: "case", label: "Attribution cases" },
  { key: "event", label: "Timeline" },
  { key: "claim", label: "Claims" },
  { key: "country", label: "Countries" },
  { key: "place", label: "Places" },
  { key: "source", label: "Sources" },
  { key: "trail", label: "Trails" },
];

const fold = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function score(doc: SearchDoc, tokens: string[]): number {
  if (!tokens.length) return 0;
  const title = fold(doc.title);
  const sub = fold(doc.subtitle);
  const text = fold(doc.text);
  let s = 0;
  for (const tok of tokens) {
    let hit = 0;
    if (title === tok) hit = 12;
    else if (title.startsWith(tok)) hit = 9;
    else if (new RegExp(`\\b${tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(title)) hit = 7;
    else if (title.includes(tok)) hit = 5;
    else if (sub.includes(tok)) hit = 3;
    else if (text.includes(tok)) hit = 1.5;
    if (!hit) return 0; // every word must match somewhere
    s += hit;
  }
  const typeBoost: Record<DocType, number> = { passport: 4, case: 3, country: 2.5, trail: 2, event: 1, place: 1.5, claim: 0.5, source: 0.5 };
  return s + typeBoost[doc.type];
}

function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
  if (!tokens.length) return <>{text}</>;
  const folded = fold(text);
  const marks: [number, number][] = [];
  for (const t of tokens) {
    let i = folded.indexOf(t);
    while (i >= 0 && marks.length < 20) {
      marks.push([i, i + t.length]);
      i = folded.indexOf(t, i + t.length);
    }
  }
  if (!marks.length) return <>{text}</>;
  marks.sort((a, b) => a[0] - b[0]);
  const out: React.ReactNode[] = [];
  let pos = 0;
  marks.forEach(([a, b], k) => {
    if (a < pos) return;
    out.push(text.slice(pos, a));
    out.push(
      <mark key={k} className="bg-mustard/50 text-ink">
        {text.slice(a, b)}
      </mark>,
    );
    pos = b;
  });
  out.push(text.slice(pos));
  return <>{out}</>;
}

function snippet(text: string, tokens: string[]) {
  const f = fold(text);
  const i = tokens.map((t) => f.indexOf(t)).filter((x) => x >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, i - 70);
  return (start > 0 ? "…" : "") + text.slice(start, start + 200) + (start + 200 < text.length ? "…" : "");
}

export function SearchClient({ docs, countries }: { docs: SearchDoc[]; countries: { iso2: string; name: string }[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [type, setType] = useState<DocType | "all">((params.get("type") as DocType) ?? "all");
  const [country, setCountry] = useState(params.get("country") ?? "all");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (type !== "all") sp.set("type", type);
    if (country !== "all") sp.set("country", country);
    const t = setTimeout(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false }), 250);
    return () => clearTimeout(t);
  }, [q, type, country, pathname, router]);

  const tokens = useMemo(() => fold(q).split(/\s+/).filter((t) => t.length > 1), [q]);
  const results = useMemo(() => {
    const pool = docs.filter((d) => (type === "all" || d.type === type) && (country === "all" || d.countries.includes(country)));
    if (!tokens.length) return pool.filter((d) => d.type === "passport" || d.type === "case" || d.type === "trail");
    return pool
      .map((d) => ({ d, s: score(d, tokens) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.d);
  }, [docs, tokens, type, country]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    if (!tokens.length) return m;
    for (const d of docs) if ((country === "all" || d.countries.includes(country)) && score(d, tokens) > 0) m.set(d.type, (m.get(d.type) ?? 0) + 1);
    return m;
  }, [docs, tokens, country]);

  const suggestions = ["Kolhapuri", "Prada", "geographical indication", "Sindh", "Mithila", "UNESCO", "1947", "museum", "disputed", "Japan"];

  return (
    <div>
      <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
        <label htmlFor="q" className="sr-only">
          Search the archive
        </label>
        <input
          ref={input}
          id="q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="A tradition, place, community, year, name…"
          className="font-display w-full border-b-[3px] border-ink bg-transparent py-3 pr-14 text-[clamp(2rem,6vw,4.6rem)] normal-case tracking-tight outline-none placeholder:text-ink/20 focus:border-terracotta"
          style={{ textTransform: "none" }}
          autoComplete="off"
          spellCheck={false}
        />
        {q && (
          <button type="button" onClick={() => setQ("")} className="label-sm absolute right-0 top-1/2 -translate-y-1/2 rounded-full border rule px-3 py-1.5">
            Clear
          </button>
        )}
      </form>

      {!q && (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
          <span className="label-sm text-ink-mute">Try</span>
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => setQ(s)} className="rounded-full border rule px-3 py-1 hover:border-ink">
              {s}
            </button>
          ))}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-2" role="group" aria-label="Result type">
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={type === t.key}
            onClick={() => setType(t.key)}
            className={`label-sm rounded-full border px-3 py-1.5 ${type === t.key ? "border-ink bg-ink text-ivory" : "border-ink/20 hover:border-ink"}`}
          >
            {t.label}
            {tokens.length > 0 && t.key !== "all" && <span className="ml-1 opacity-60">{counts.get(t.key) ?? 0}</span>}
          </button>
        ))}
        <label className="label-sm ml-auto flex items-center gap-2 text-ink-mute">
          Country
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="label-sm rounded border rule bg-ivory px-2 py-1.5 text-ink">
            <option value="all">All</option>
            {countries.map((c) => (
              <option key={c.iso2} value={c.iso2}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="label-sm mt-6 text-ink-mute" aria-live="polite">
        {tokens.length ? `${results.length} result${results.length === 1 ? "" : "s"} for “${q}”` : "Browse — or type to search everything"}
      </p>
      <ol className="mt-3 divide-y divide-ink/10 border-y rule">
        {results.slice(0, 80).map((d) => (
          <li key={d.id}>
            <Link href={d.href} className="group grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
              <span className="label-sm pt-1 text-ink-mute">{TYPES.find((t) => t.key === d.type)?.label.replace(/s$/, "")}</span>
              <span className="min-w-0">
                <span className={`block group-hover:text-terracotta ${d.type === "passport" || d.type === "country" || d.type === "trail" ? "font-display text-3xl" : "font-serif text-xl leading-snug"}`}>
                  <Highlight text={d.title} tokens={tokens} />
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-ink-mute">
                  <Highlight text={d.subtitle} tokens={tokens} />
                  {d.level && <EvidenceBadge level={d.level} compact />}
                </span>
                {tokens.length > 0 && (
                  <span className="mt-1 block text-sm text-ink-soft">
                    <Highlight text={snippet(d.text, tokens)} tokens={tokens} />
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {tokens.length > 0 && results.length === 0 && (
        <div className="paper-card mt-6 p-6">
          <p className="font-serif text-2xl">Nothing in the archive matches “{q}” yet.</p>
          <p className="mt-2 text-sm text-ink-soft">
            The archive is small and growing carefully. Try a broader word, a region, or a year — or browse the{" "}
            <Link href="/passports" className="underline">
              passport register
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
