"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";
import { markArrival } from "@/lib/arrival";
import type { CountryStatus } from "@/lib/types";
import { COUNTRY_STATUS } from "@/lib/labels";
import { loadWorld, supportsWebGL, type GlobeCountry, type World, type WorldFeature } from "./geo";
import type { Flight, GlobeLabel } from "./GlobeCanvas";
import { FlatAtlas } from "./FlatAtlas";
import { Magnetic, SplitHeadline } from "@/components/site/Motion";
import { RotatingSeal } from "@/components/site/Seal";

const GlobeCanvas = dynamic(() => import("./GlobeCanvas"), { ssr: false });

interface PassportEntry {
  no: string;
  slug: string;
  name: string;
  where: string;
}

const ARC_ORDER = ["356", "784"]; // India → UAE, then UAE → the documenting collections

const noopSubscribe = () => () => {};
let detectedMode: "3d" | "2d" | null = null;
function detectMode(): "3d" | "2d" {
  detectedMode ??= supportsWebGL() ? "3d" : "2d";
  return detectedMode;
}

export function GlobeExperience({ countries, passports }: { countries: GlobeCountry[]; passports: PassportEntry[] }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion() ?? false;
  const curated = useMemo(() => new Map(countries.map((c) => [c.isoNumeric, c])), [countries]);
  const statusById = useMemo(() => new Map<string, CountryStatus>(countries.map((c) => [c.isoNumeric, c.status])), [countries]);

  // Renderer: detected on the client (null while server rendering), overridable by the visitor.
  const detected = useSyncExternalStore(noopSubscribe, detectMode, () => null);
  const [override, setMode] = useState<"3d" | "2d" | null>(null);
  const mode = override ?? detected;
  const [worlds, setWorlds] = useState<{ "50m"?: World; "110m"?: World }>({});
  const resolution = mode === "3d" ? "50m" : "110m";
  const world = mode ? (worlds[resolution] ?? null) : null;
  const [error, setError] = useState<string | null>(null);
  const [canvasReady, setReady] = useState(false);
  const ready = mode === "3d" ? canvasReady && !!world : !!world;
  const [hovered, setHovered] = useState<WorldFeature | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<WorldFeature | null>(null);
  const [lonLat, setLonLat] = useState<[number, number] | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [entering, setEntering] = useState<GlobeCountry | null>(null);
  const flightCallbacks = useRef(new Map<number, () => void>());
  const flightId = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const labelRefs = useRef(new Map<string, HTMLElement>());
  const indexDialog = useRef<HTMLDialogElement>(null);
  const passportDialog = useRef<HTMLDialogElement>(null);

  // Load boundaries at a resolution that suits the renderer (cached per resolution).
  useEffect(() => {
    if (!mode || worlds[resolution]) return;
    let live = true;
    loadWorld(resolution)
      .then((w) => live && setWorlds((prev) => ({ ...prev, [resolution]: w })))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [mode, resolution, worlds]);

  const featureById = useMemo(() => new Map(world?.features.map((f) => [f.id, f]) ?? []), [world]);

  const labels: GlobeLabel[] = useMemo(
    () =>
      countries
        .filter((c) => c.status !== "shared")
        .map((c) => {
          const f = featureById.get(c.isoNumeric);
          const [lon, lat] = f?.centroid ?? [0, 0];
          return { key: c.isoNumeric, lon, lat };
        }),
    [countries, featureById],
  );

  const arcs = useMemo(() => {
    const at = (id: string) => featureById.get(id)?.centroid;
    const india = at(ARC_ORDER[0]);
    const uae = at(ARC_ORDER[1]);
    if (!india || !uae) return [];
    const out: [number, number][][] = [[india, uae]];
    for (const c of countries) if (c.status === "documenting") {
      const p = at(c.isoNumeric);
      if (p) out.push([uae, p]);
    }
    return out;
  }, [featureById, countries]);

  const fly = useCallback((lon: number, lat: number, dist: number, duration: number, done?: () => void) => {
    const id = ++flightId.current;
    if (done) flightCallbacks.current.set(id, done);
    setFlight({ id, lon, lat, dist, duration });
  }, []);

  const onFlightDone = useCallback((id: number) => {
    const cb = flightCallbacks.current.get(id);
    flightCallbacks.current.delete(id);
    cb?.();
  }, []);

  const pauseRotation = useCallback(() => {
    setAutoRotate(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setAutoRotate(true), 9000);
  }, []);

  const enter = useCallback(
    (c: GlobeCountry) => {
      router.prefetch(c.href);
      setEntering(c);
      markArrival(c.slug);
      const f = featureById.get(c.isoNumeric);
      const go = () => router.push(c.href);
      if (mode === "3d" && f) fly(f.centroid[0], f.centroid[1], 1.45, 1.25, go);
      else setTimeout(go, reduceMotion ? 0 : 650);
    },
    [router, featureById, fly, mode, reduceMotion],
  );

  const select = useCallback(
    (f: WorldFeature, viaTouch: boolean) => {
      pauseRotation();
      setSelected(f);
      setHovered(null);
      const c = curated.get(f.id);
      const direct = !viaTouch && c && (c.status === "active" || c.status === "introductory");
      if (mode === "3d") fly(f.centroid[0], f.centroid[1], 2.7, 1.1, direct && c ? () => enter(c) : undefined);
      else if (direct && c) enter(c);
    },
    [curated, enter, fly, mode, pauseRotation],
  );

  const selectById = (id: string, viaTouch = true) => {
    const f = featureById.get(id);
    if (f) select(f, viaTouch);
    indexDialog.current?.close();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onHover = useCallback((f: WorldFeature | null, pos: { x: number; y: number } | null) => {
    setHovered((prev) => (prev?.id === f?.id ? prev : f));
    setHoverPos(pos);
  }, []);
  const onReady = useCallback(() => setReady(true), []);

  const hoveredCountry = hovered ? curated.get(hovered.id) : undefined;
  const selectedCountry = selected ? curated.get(selected.id) : undefined;
  const glow = hoveredCountry ? COUNTRY_STATUS[hoveredCountry.status].color : selectedCountry ? COUNTRY_STATUS[selectedCountry.status].color : "#E4AA29";

  const sortedAll = useMemo(
    () => [...(world?.features ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [world],
  );

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate min-h-[max(100svh,680px)] overflow-hidden bg-ivory"
      style={{ ["--glow" as string]: glow }}
    >
      {/* reactive lighting behind the globe */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 transition-[background] duration-700"
        style={{
          background:
            "radial-gradient(60% 55% at 64% 52%, color-mix(in oklab, var(--glow) 22%, transparent) 0%, transparent 70%), radial-gradient(120% 90% at 0% 100%, #EEE5D1 0%, transparent 60%)",
        }}
      />
      <div aria-hidden className="contour-bg pointer-events-none absolute inset-0 -z-10 opacity-70" />
      {/* veil so the globe recedes beneath the headline on wide screens */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-[52%] bg-gradient-to-r from-ivory via-ivory/80 to-transparent lg:block"
      />

      {/* Globe stage */}
      <div className="absolute inset-x-0 top-14 bottom-[44%] sm:bottom-[38%] lg:inset-y-0 lg:left-[30%] lg:right-0 lg:top-0">
        {mode === "3d" && world && !error && (
          <GlobeCanvas
            world={world}
            statusById={statusById}
            hovered={hovered}
            selected={selected}
            onHover={onHover}
            onPointerLonLat={setLonLat}
            onSelect={select}
            flight={flight}
            onFlightDone={onFlightDone}
            autoRotate={autoRotate && !selected}
            reduceMotion={reduceMotion}
            labels={labels}
            labelRefs={labelRefs}
            arcs={arcs}
            onReady={onReady}
            onUserInteract={pauseRotation}
            initial={[62, 16]}
          />
        )}
        {mode === "2d" && world && (
          <div className="flex h-full items-center px-2 lg:px-8">
            <FlatAtlas world={world} curated={curated} hovered={hovered} selected={selected} onHover={onHover} onSelect={select} />
          </div>
        )}

        {/* projected labels for collections */}
        {mode === "3d" &&
          countries
            .filter((c) => c.status !== "shared")
            .map((c) => (
              <button
                key={c.isoNumeric}
                ref={(el) => {
                  if (el) labelRefs.current.set(c.isoNumeric, el);
                  else labelRefs.current.delete(c.isoNumeric);
                }}
                type="button"
                tabIndex={-1}
                onClick={() => selectById(c.isoNumeric, false)}
                className="label-sm absolute left-0 top-0 -translate-x-1/2 whitespace-nowrap opacity-0 transition-opacity"
                style={{ willChange: "transform" }}
              >
                <span className="relative -left-1/2 -top-7 flex items-center gap-1.5 rounded-full border border-ink/30 bg-ivory/90 px-2 py-1 shadow-sm backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: COUNTRY_STATUS[c.status].color }} />
                  {c.name === "United Arab Emirates" ? "UAE" : c.name}
                  <span className="text-ink-mute">
                    {c.passports.length ? `· ${c.passports.length}` : "· soon"}
                  </span>
                </span>
              </button>
            ))}

        {/* archival loader */}
        {!ready && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" role="status">
            <RotatingSeal id="loader" text="UNFOLDING THE ATLAS · WHEN CULTURE TRAVELS · " center="···" className="h-28 w-28 text-burgundy" />
            <span className="label text-ink-mute">Unfolding the atlas…</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center" role="alert">
            <div className="paper-card max-w-sm p-6">
              <p className="label text-terracotta">The atlas could not load</p>
              <p className="mt-2 text-sm text-ink-soft">{error}. You can still browse every country and passport as a list.</p>
              <Link href="/explore" className="label mt-4 inline-block underline">
                Open the country index
              </Link>
            </div>
          </div>
        )}

        {/* instrument readout */}
        <div className="pointer-events-none absolute right-4 top-4 hidden text-right sm:block lg:right-10 lg:top-20">
          <p className="label-sm text-ink-mute">Fig. 1 — The living globe</p>
          <p className="label-sm mt-1 text-ink-mute">
            {mode === "2d" ? "Hover or tab to a country" : "Drag to turn · Scroll to zoom · Click a country"}
          </p>
          <p className="label mt-3 tabular-nums text-ink-soft" aria-hidden>
            {lonLat ? `${Math.abs(lonLat[1]).toFixed(2)}° ${lonLat[1] >= 0 ? "N" : "S"} · ${Math.abs(lonLat[0]).toFixed(2)}° ${lonLat[0] >= 0 ? "E" : "W"}` : "— · —"}
          </p>
        </div>
      </div>

      {/* Hover card (pointer devices) */}
      {hovered && hoverPos && !selected && (
        <div
          className="pointer-events-none fixed z-40 hidden -translate-y-full md:block"
          style={{ left: hoverPos.x + 18, top: hoverPos.y - 14 }}
          aria-hidden
        >
          <div className="accession min-w-48 max-w-64 px-3 py-2.5">
            <p className="font-display text-2xl">{hovered.name}</p>
            {hoveredCountry ? (
              <>
                <p className="label-sm mt-1" style={{ color: COUNTRY_STATUS[hoveredCountry.status].color }}>
                  {COUNTRY_STATUS[hoveredCountry.status].label}
                </p>
                <p className="mt-1.5 text-xs leading-snug text-ink-soft">
                  {hoveredCountry.passports.length
                    ? `${hoveredCountry.passports.length} passport${hoveredCountry.passports.length > 1 ? "s" : ""} · click to enter`
                    : hoveredCountry.shared.length
                      ? `Shared traditions: ${hoveredCountry.shared.map((s) => s.name).join(", ")}`
                      : `Candidate: ${hoveredCountry.candidates.join(", ")}`}
                </p>
              </>
            ) : (
              <p className="label-sm mt-1 text-ink-mute">Not yet in the archive</p>
            )}
          </div>
        </div>
      )}

      {/* Editorial column */}
      <div className="pointer-events-none relative z-10 mx-auto flex min-h-[max(100svh,680px)] max-w-[1500px] flex-col justify-end px-4 pb-8 pt-20 sm:px-6 lg:justify-center lg:px-10 lg:pb-16">
        <div className="pointer-events-auto max-w-[34rem] lg:max-w-[38rem]">
          <p className="label flex items-center gap-3 text-terracotta">
            <span className="h-px w-8 bg-terracotta" /> Plate I · The living globe
          </p>
          <h1 id="hero-title" className="font-display mt-4 text-[clamp(3.4rem,10.5vw,9.6rem)] text-burgundy">
            <SplitHeadline text="When culture travels" />
          </h1>
          <p className="font-serif mt-4 text-[clamp(1.6rem,3.2vw,2.6rem)] italic leading-tight text-ink">Let its story travel with it.</p>
          <p className="mt-4 max-w-md text-[0.98rem] text-ink-soft max-sm:hidden">
            A living atlas of culture. Every tradition gets a passport: its names, its places, the people who make it, how it has travelled — and
            the sources for all of it.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Magnetic>
              <button
                type="button"
                onClick={() => selectById("356", true)}
                disabled={!world}
                className="group inline-flex items-center gap-3 rounded-full bg-terracotta px-6 py-3.5 text-ivory shadow-[0_10px_30px_-12px_rgba(184,75,48,.8)] transition-colors hover:bg-burgundy disabled:opacity-60"
              >
                <span className="label">Explore the world</span>
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </Magnetic>
            <button
              type="button"
              onClick={() => passportDialog.current?.showModal()}
              className="label rounded-full border border-ink/40 bg-ivory/70 px-5 py-3.5 backdrop-blur-sm transition-colors hover:border-ink hover:bg-ivory"
            >
              Enter a Culture Passport
            </button>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
            <button type="button" onClick={() => indexDialog.current?.showModal()} className="label-sm text-ink-soft underline decoration-dotted hover:text-ink">
              Browse countries as a list
            </button>
            {mode && detected === "3d" && (
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setReady(false);
                  setMode(mode === "3d" ? "2d" : detectMode());
                }}
                className="label-sm text-ink-soft underline decoration-dotted hover:text-ink"
              >
                {mode === "3d" ? "Switch to flat atlas" : "Switch to 3D globe"}
              </button>
            )}
          </div>
          {/* Legend */}
          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t rule pt-4 max-sm:hidden" aria-label="Map legend">
            {(Object.keys(COUNTRY_STATUS) as CountryStatus[]).map((s) => (
              <li key={s} className="label-sm flex items-center gap-2 text-ink-soft">
                <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: COUNTRY_STATUS[s].color }} />
                {COUNTRY_STATUS[s].label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Selected-country panel */}
      {selected && (
        <aside
          aria-label={`${selected.name} details`}
          className="fixed inset-x-0 bottom-0 z-40 max-h-[72svh] overflow-y-auto rounded-t-2xl border-t border-ink/20 bg-ivory p-5 shadow-[0_-20px_60px_-20px_rgba(33,28,25,.45)] sm:p-6 lg:absolute lg:inset-x-auto lg:bottom-10 lg:right-10 lg:w-[400px] lg:rounded-none lg:border lg:shadow-[0_30px_60px_-30px_rgba(33,28,25,.6)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="label-sm text-ink-mute">{selectedCountry?.status ? `${COUNTRY_STATUS[selectedCountry.status].label}` : "Not yet in the archive"}</p>
              <h2 className="font-display mt-1 text-5xl">{selected.name}</h2>
            </div>
            <button type="button" onClick={() => setSelected(null)} className="label-sm rounded-full border rule px-3 py-1.5 hover:border-ink" aria-label="Close panel">
              Close
            </button>
          </div>
          {selectedCountry ? (
            <>
              <p className="font-serif mt-3 text-2xl leading-tight">{selectedCountry.headline}</p>
              <p className="mt-2 text-sm text-ink-soft">{selectedCountry.intro}</p>
              {selectedCountry.passports.length > 0 && (
                <ul className="mt-4 divide-y divide-ink/10 border-y rule">
                  {selectedCountry.passports.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/passport/${p.slug}`} className="flex items-baseline justify-between gap-3 py-2 hover:text-terracotta">
                        <span>{p.name}</span>
                        <span className="label-sm text-ink-mute">No. {p.no}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {selectedCountry.shared.length > 0 && (
                <p className="mt-4 text-sm">
                  <span className="label-sm text-ink-mute">Shared traditions: </span>
                  {selectedCountry.shared.map((p, i) => (
                    <span key={p.slug}>
                      {i > 0 && ", "}
                      <Link className="underline hover:text-terracotta" href={`/passport/${p.slug}`}>
                        {p.name}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
              {selectedCountry.candidates.length > 0 && selectedCountry.passports.length === 0 && (
                <p className="mt-3 text-sm">
                  <span className="label-sm text-ink-mute">Candidate: </span>
                  {selectedCountry.candidates.join(", ")}
                </p>
              )}
              <button
                type="button"
                onClick={() => enter(selectedCountry)}
                className="group mt-5 inline-flex w-full items-center justify-between rounded-full bg-ink px-5 py-3 text-ivory hover:bg-burgundy"
              >
                <span className="label">
                  {selectedCountry.status === "active" || selectedCountry.status === "introductory" ? `Enter the ${selectedCountry.name === "United Arab Emirates" ? "UAE" : selectedCountry.name} archive` : "Open this chapter"}
                </span>
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-ink-soft">
                No stories from {selected.name} have been documented yet. We publish a collection only after its sources are verified and the communities
                involved have been consulted — so this page stays empty rather than pretending.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/passports" className="label rounded-full border rule px-4 py-2 hover:border-ink">
                  See published passports
                </Link>
                <Link href="/method" className="label rounded-full border rule px-4 py-2 hover:border-ink">
                  How we choose
                </Link>
              </div>
            </>
          )}
        </aside>
      )}

      {/* Transition curtain into a country chapter */}
      {entering && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          style={{
            background: COUNTRY_STATUS[entering.status].color,
            animation: reduceMotion ? undefined : "curtain-in 1.2s cubic-bezier(.7,0,.2,1) both",
          }}
          role="status"
        >
          <style>{`@keyframes curtain-in { from { clip-path: circle(0% at 64% 52%); } to { clip-path: circle(150% at 64% 52%); } }`}</style>
          <div className="text-center text-ivory">
            <p className="label">Opening the chapter</p>
            <p className="font-display mt-2 text-[clamp(3.5rem,12vw,10rem)]">{entering.name === "United Arab Emirates" ? "UAE" : entering.name}</p>
          </div>
        </div>
      )}

      {/* Country index (accessible alternative to the globe) */}
      <dialog
        ref={indexDialog}
        className="m-auto max-h-[85svh] w-[min(640px,calc(100vw-2rem))] overflow-hidden border border-ink/30 bg-ivory p-0 text-ink backdrop:bg-ink/50"
        aria-labelledby="index-title"
      >
        <div className="flex items-center justify-between border-b rule px-5 py-4">
          <h2 id="index-title" className="font-display text-3xl">
            Country index
          </h2>
          <button type="button" onClick={() => indexDialog.current?.close()} className="label-sm rounded-full border rule px-3 py-1.5">
            Close
          </button>
        </div>
        <div className="max-h-[70svh] overflow-y-auto px-5 py-4">
          <p className="label-sm text-ink-mute">Collections</p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {countries.map((c) => (
              <li key={c.isoNumeric}>
                <button type="button" onClick={() => selectById(c.isoNumeric)} className="flex w-full items-center gap-2 py-1 text-left hover:text-terracotta">
                  <span className="h-2 w-2 rounded-full" style={{ background: COUNTRY_STATUS[c.status].color }} />
                  {c.name}
                  <span className="label-sm ml-auto text-ink-mute">{COUNTRY_STATUS[c.status].label}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="label-sm mt-6 text-ink-mute">All countries</p>
          <ul className="mt-2 columns-2 gap-6 text-sm sm:columns-3">
            {sortedAll.map((f) => (
              <li key={f.index} className="break-inside-avoid">
                <button type="button" onClick={() => selectById(f.id)} className="py-0.5 text-left hover:text-terracotta">
                  {f.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </dialog>

      {/* Passport picker */}
      <PassportPicker dialogRef={passportDialog} passports={passports} />
    </section>
  );
}

function PassportPicker({ dialogRef, passports }: { dialogRef: React.RefObject<HTMLDialogElement | null>; passports: PassportEntry[] }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim().toLowerCase().replace(/^no\.?\s*/, "");
    const byNo = passports.find((p) => p.no === q.padStart(3, "0"));
    const byName = passports.find((p) => p.name.toLowerCase().includes(q) || p.slug.includes(q));
    const hit = byNo ?? byName;
    if (hit) {
      dialogRef.current?.close();
      router.push(`/passport/${hit.slug}`);
    } else setMsg(`No passport matches “${value}”. Try a number like 001, or a name.`);
  };
  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-[min(560px,calc(100vw-2rem))] border border-ink/30 bg-ivory p-0 text-ink backdrop:bg-ink/50"
      aria-labelledby="picker-title"
    >
      <div className="strip-weave" />
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="label text-terracotta">Passport register</p>
            <h2 id="picker-title" className="font-display mt-1 text-4xl">
              Enter a Culture Passport
            </h2>
          </div>
          <button type="button" onClick={() => dialogRef.current?.close()} className="label-sm rounded-full border rule px-3 py-1.5">
            Close
          </button>
        </div>
        <form onSubmit={submit} className="mt-5 flex gap-2">
          <label htmlFor="passport-no" className="sr-only">
            Passport number or name
          </label>
          <input
            id="passport-no"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setMsg(null);
            }}
            placeholder="No. 001 or a name"
            className="font-mono min-w-0 flex-1 border-b-2 border-ink bg-transparent px-1 py-2 text-xl tracking-widest outline-none placeholder:text-ink-mute/60 focus:border-terracotta"
            autoComplete="off"
          />
          <button type="submit" className="label rounded-full bg-ink px-5 text-ivory hover:bg-burgundy">
            Open
          </button>
        </form>
        {msg && (
          <p className="mt-2 text-sm text-terracotta" role="alert">
            {msg}
          </p>
        )}
        <ul className="mt-5 divide-y divide-ink/10 border-y rule">
          {passports.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/passport/${p.slug}`}
                onClick={() => dialogRef.current?.close()}
                className="flex items-baseline gap-4 py-2.5 hover:text-terracotta"
              >
                <span className="font-mono text-sm text-ink-mute">No. {p.no}</span>
                <span className="flex-1">{p.name}</span>
                <span className="label-sm text-ink-mute">{p.where}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
