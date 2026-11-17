"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { AccentKey, Category, Claim, EvidenceLevel, MotifKey, TimelineEvent, Tradition, TraditionPlace } from "@/lib/types";
import { CATEGORY, EVIDENCE, EVIDENCE_ORDER, MATURITY, PLACE_ROLE, STATUS } from "@/lib/labels";
import { blocksToMarkup, markupToBlocks } from "@/lib/blocks-markup";
import { saveTraditionAction, type ActionResult } from "@/app/admin/actions";

interface Opt {
  id: string;
  label: string;
}

const TABS = ["Identity", "Story", "Claims", "Timeline", "Places & people", "Advanced JSON", "Publish"] as const;
type Tab = (typeof TABS)[number];
const ACCENTS: AccentKey[] = ["terracotta", "burgundy", "indigo", "forest", "teal", "mustard"];
const MOTIFS: MotifKey[] = ["kolhapuri", "madhubani", "phulkari", "warli", "ajrakh", "sadu"];

const input = "w-full border rule bg-ivory px-2.5 py-2 text-sm outline-none focus:border-ink";
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

export function TraditionEditor(props: {
  initial: Tradition;
  sources: Opt[];
  media: Opt[];
  places: Opt[];
  communities: Opt[];
  organizations: Opt[];
  countries: Opt[];
  traditions: Opt[];
}) {
  const [t, setT] = useState<Tradition>(props.initial);
  const [tab, setTab] = useState<Tab>("Identity");
  const [summary, setSummary] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const [markup, setMarkup] = useState(() => ({
    origins: blocksToMarkup(props.initial.origins),
    significance: blocksToMarkup(props.initial.significance),
    makers: blocksToMarkup(props.initial.makers.intro),
    travels: blocksToMarkup(props.initial.travels.intro),
  }));
  const [json, setJson] = useState<string | null>(null);
  const dirty = useMemo(() => JSON.stringify(t) !== JSON.stringify(props.initial), [t, props.initial]);
  const up = (patch: Partial<Tradition>) => setT((prev) => ({ ...prev, ...patch }));

  const applyMarkup = (key: keyof typeof markup, value: string) => {
    setMarkup((m) => ({ ...m, [key]: value }));
    const blocks = markupToBlocks(value);
    setT((prev) => {
      if (key === "origins") return { ...prev, origins: blocks };
      if (key === "significance") return { ...prev, significance: blocks };
      if (key === "makers") return { ...prev, makers: { ...prev.makers, intro: blocks } };
      return { ...prev, travels: { ...prev.travels, intro: blocks } };
    });
  };

  const save = () => {
    setResult(null);
    start(async () => {
      const toSave = { ...t, editorial: { ...t.editorial, lastReviewed: new Date().toISOString().slice(0, 10) } };
      const r = await saveTraditionAction(JSON.stringify(toSave), summary);
      setResult(r);
      if (r.ok) {
        setT(toSave);
        setSummary("");
      }
    });
  };

  return (
    <div className="mt-6">
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b-2 border-ink" role="tablist">
        {TABS.map((x) => (
          <button
            key={x}
            type="button"
            role="tab"
            aria-selected={tab === x}
            onClick={() => {
              if (x === "Advanced JSON") setJson(JSON.stringify(t, null, 2));
              setTab(x);
            }}
            className={`label shrink-0 px-3 py-2 ${tab === x ? "bg-ink text-ivory" : "hover:bg-paper"}`}
          >
            {x}
          </button>
        ))}
      </div>

      <div className="py-6">
        {tab === "Identity" && (
          <div className="grid gap-5 md:grid-cols-2">
            <F label="Name">
              <input className={input} value={t.name} onChange={(e) => up({ name: e.target.value })} />
            </F>
            <F label="Display title (hero)">
              <input className={input} value={t.displayTitle} onChange={(e) => up({ displayTitle: e.target.value })} />
            </F>
            <F label="Tagline">
              <input className={input} value={t.tagline} onChange={(e) => up({ tagline: e.target.value })} />
            </F>
            <F label="Region line (names every country involved)">
              <input className={input} value={t.regionLabel} onChange={(e) => up({ regionLabel: e.target.value })} />
            </F>
            <F label="Slug (URL)" hint="Renaming a published passport keeps the old slug as a redirect, so printed QR codes keep working.">
              <input className={input} value={t.slug} onChange={(e) => up({ slug: e.target.value.toLowerCase() })} />
            </F>
            <F label="Passport number">
              <input className={input} value={t.passportNo} onChange={(e) => up({ passportNo: e.target.value })} />
            </F>
            <F label="Category">
              <select className={input} value={t.category} onChange={(e) => up({ category: e.target.value as Category })}>
                {Object.entries(CATEGORY).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </F>
            <F label="Techniques (comma separated)">
              <input className={input} value={t.techniques.join(", ")} onChange={(e) => up({ techniques: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            </F>
            <F label="Alternate names (one per line)">
              <textarea className={input} rows={3} value={t.alternateNames.join("\n")} onChange={(e) => up({ alternateNames: lines(e.target.value) })} />
            </F>
            <F label="Native names — text | script | language (one per line)">
              <textarea
                className={input}
                rows={3}
                value={t.nativeNames.map((n) => `${n.text} | ${n.script} | ${n.lang}`).join("\n")}
                onChange={(e) =>
                  up({
                    nativeNames: lines(e.target.value).map((l) => {
                      const [text, script = "", lang = ""] = l.split("|").map((s) => s.trim());
                      return { text, script, lang };
                    }),
                  })
                }
              />
            </F>
            <F label="Associated countries" hint="A tradition may belong to several countries.">
              <div className="flex flex-wrap gap-3">
                {props.countries.map((c) => (
                  <label key={c.id} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={t.countries.includes(c.id)}
                      onChange={(e) => up({ countries: e.target.checked ? [...t.countries, c.id] : t.countries.filter((x) => x !== c.id) })}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </F>
            <F label="Filed under collection">
              <select className={input} value={t.collection} onChange={(e) => up({ collection: e.target.value })}>
                {props.countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </F>
            <F label="Hero image">
              <select className={input} value={t.hero ?? ""} onChange={(e) => up({ hero: e.target.value || undefined })}>
                <option value="">None — use the archive illustration</option>
                {props.media.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </F>
            <F label="Gallery (media ids, comma separated)">
              <input className={input} value={t.gallery.join(", ")} onChange={(e) => up({ gallery: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            </F>
            <F label="Accent colour">
              <select className={input} value={t.accent} onChange={(e) => up({ accent: e.target.value as AccentKey })}>
                {ACCENTS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </F>
            <F label="Archive illustration">
              <select className={input} value={t.motif} onChange={(e) => up({ motif: e.target.value as MotifKey })}>
                {MOTIFS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </F>
          </div>
        )}

        {tab === "Story" && (
          <div className="grid gap-6">
            <F label="Summary (cards, search, share captions)">
              <textarea className={input} rows={3} value={t.summary} onChange={(e) => up({ summary: e.target.value })} />
            </F>
            <F label="Introduction (hero)">
              <textarea className={input} rows={4} value={t.intro} onChange={(e) => up({ intro: e.target.value })} />
            </F>
            <div className="paper-card p-4 text-xs text-ink-soft">
              <p className="label-sm text-ink">Chapter markup</p>
              <p className="mt-1">
                Separate blocks with a blank line. End a paragraph with claim ids in double brackets, e.g. <code>[[kol-gi-area, kol-gi-dates]]</code>. Notes:{" "}
                <code>&gt; Note: Title | text</code>. Pull quotes start with <code>&quot;</code>. Images: <code>![media-id]</code>.
              </p>
            </div>
            {(
              [
                ["origins", "Chapter 01 — Origins"],
                ["significance", "Significance & meaning"],
                ["makers", "Chapter 02 — Makers (introduction)"],
                ["travels", "Chapter 04 — When culture travels (introduction)"],
              ] as const
            ).map(([k, label]) => (
              <F key={k} label={label}>
                <textarea className={`${input} font-mono`} rows={8} value={markup[k]} onChange={(e) => applyMarkup(k, e.target.value)} />
              </F>
            ))}
            <F label="Voices note (Makers chapter)">
              <textarea className={input} rows={2} value={t.makers.voicesNote} onChange={(e) => up({ makers: { ...t.makers, voicesNote: e.target.value } })} />
            </F>
            <ListEditor
              title="Materials"
              items={t.makers.materials}
              blank={() => ({ name: "", detail: "", level: "unverified" as EvidenceLevel, sources: [] })}
              onChange={(materials) => up({ makers: { ...t.makers, materials } })}
              render={(m, set) => (
                <div className="grid gap-2 md:grid-cols-[12rem_1fr_11rem]">
                  <input className={input} placeholder="Material" value={m.name} onChange={(e) => set({ ...m, name: e.target.value })} />
                  <input className={input} placeholder="Detail" value={m.detail} onChange={(e) => set({ ...m, detail: e.target.value })} />
                  <LevelSelect value={m.level} onChange={(level) => set({ ...m, level })} />
                  <SourcePicker className="md:col-span-3" options={props.sources} value={m.sources} onChange={(sources) => set({ ...m, sources })} />
                </div>
              )}
            />
            <ListEditor
              title="Process steps"
              items={t.makers.process}
              blank={() => ({ title: "", detail: "", level: "unverified" as EvidenceLevel, sources: [] })}
              onChange={(process) => up({ makers: { ...t.makers, process } })}
              render={(s, set) => (
                <div className="grid gap-2 md:grid-cols-[12rem_1fr_11rem]">
                  <input className={input} placeholder="Step" value={s.title} onChange={(e) => set({ ...s, title: e.target.value })} />
                  <input className={input} placeholder="Detail" value={s.detail} onChange={(e) => set({ ...s, detail: e.target.value })} />
                  <LevelSelect value={s.level} onChange={(level) => set({ ...s, level })} />
                  <SourcePicker className="md:col-span-3" options={props.sources} value={s.sources} onChange={(sources) => set({ ...s, sources })} />
                </div>
              )}
            />
          </div>
        )}

        {tab === "Claims" && (
          <ListEditor<Claim>
            title="Claims — every one needs at least one source"
            items={t.claims}
            blank={() => ({ id: `${t.slug.split("-")[0]}-${Date.now().toString(36)}`, text: "", level: "unverified", sources: [] })}
            onChange={(claims) => up({ claims })}
            render={(c, set) => (
              <div className="grid gap-2">
                <div className="grid gap-2 md:grid-cols-[10rem_1fr_12rem]">
                  <input className={`${input} font-mono`} value={c.id} onChange={(e) => set({ ...c, id: e.target.value })} aria-label="Claim id" />
                  <textarea className={input} rows={2} value={c.text} onChange={(e) => set({ ...c, text: e.target.value })} aria-label="Claim text" />
                  <LevelSelect value={c.level} onChange={(level) => set({ ...c, level })} />
                </div>
                <SourcePicker options={props.sources} value={c.sources} onChange={(sources) => set({ ...c, sources })} />
                <input
                  className={input}
                  placeholder="Editor's note: conflicts, limitations…"
                  value={c.note ?? ""}
                  onChange={(e) => set({ ...c, note: e.target.value || undefined })}
                />
              </div>
            )}
          />
        )}

        {tab === "Timeline" && (
          <ListEditor<TimelineEvent>
            title="Milestones — never invent a date; mark approximate dates as such"
            items={t.timeline}
            blank={() => ({ id: `ev-${Date.now().toString(36)}`, date: { year: new Date().getFullYear(), label: String(new Date().getFullYear()) }, title: "", body: "", level: "unverified", sources: [] })}
            onChange={(timeline) => up({ timeline })}
            render={(e, set) => (
              <div className="grid gap-2">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-[6rem_5rem_5rem_7rem_1fr]">
                  <input type="number" className={input} value={e.date.year} onChange={(x) => set({ ...e, date: { ...e.date, year: Number(x.target.value) } })} aria-label="Year (negative for BCE)" />
                  <input type="number" className={input} placeholder="Month" value={e.date.month ?? ""} onChange={(x) => set({ ...e, date: { ...e.date, month: x.target.value ? Number(x.target.value) : undefined } })} />
                  <input type="number" className={input} placeholder="Day" value={e.date.day ?? ""} onChange={(x) => set({ ...e, date: { ...e.date, day: x.target.value ? Number(x.target.value) : undefined } })} />
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" checked={!!e.date.approx} onChange={(x) => set({ ...e, date: { ...e.date, approx: x.target.checked || undefined } })} /> Approx.
                  </label>
                  <input className={input} placeholder="Label shown, e.g. c. 1910s" value={e.date.label} onChange={(x) => set({ ...e, date: { ...e.date, label: x.target.value } })} />
                </div>
                <div className="grid gap-2 md:grid-cols-[1fr_12rem_12rem]">
                  <input className={input} placeholder="Title" value={e.title} onChange={(x) => set({ ...e, title: x.target.value })} />
                  <LevelSelect value={e.level} onChange={(level) => set({ ...e, level })} />
                  <select className={input} value={e.place ?? ""} onChange={(x) => set({ ...e, place: x.target.value || undefined })}>
                    <option value="">No place</option>
                    {props.places.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea className={input} rows={2} placeholder="What happened" value={e.body} onChange={(x) => set({ ...e, body: x.target.value })} />
                <SourcePicker options={props.sources} value={e.sources} onChange={(sources) => set({ ...e, sources })} />
              </div>
            )}
          />
        )}

        {tab === "Places & people" && (
          <div className="grid gap-8">
            <ListEditor<TraditionPlace>
              title="Places"
              items={t.places}
              blank={() => ({ place: props.places[0]?.id ?? "", role: "production" })}
              onChange={(places) => up({ places })}
              render={(p, set) => (
                <div className="grid gap-2 md:grid-cols-3">
                  <select className={input} value={p.place} onChange={(e) => set({ ...p, place: e.target.value })}>
                    {props.places.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <select className={input} value={p.role} onChange={(e) => set({ ...p, role: e.target.value as TraditionPlace["role"] })}>
                    {Object.entries(PLACE_ROLE).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <input className={input} placeholder="Note" value={p.note ?? ""} onChange={(e) => set({ ...p, note: e.target.value || undefined })} />
                </div>
              )}
            />
            <ListEditor
              title="Communities"
              items={t.communities}
              blank={() => ({ community: props.communities[0]?.id ?? "", role: "" })}
              onChange={(communities) => up({ communities })}
              render={(c, set) => (
                <div className="grid gap-2 md:grid-cols-2">
                  <select className={input} value={c.community} onChange={(e) => set({ ...c, community: e.target.value })}>
                    {props.communities.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <input className={input} placeholder="Role" value={c.role} onChange={(e) => set({ ...c, role: e.target.value })} />
                </div>
              )}
            />
            <ListEditor
              title="Makers on record (public records only — never invented)"
              items={t.makers.practitioners}
              blank={() => ({ name: "", note: "", sources: [] })}
              onChange={(practitioners) => up({ makers: { ...t.makers, practitioners } })}
              render={(p, set) => (
                <div className="grid gap-2 md:grid-cols-[14rem_1fr]">
                  <input className={input} placeholder="Name" value={p.name} onChange={(e) => set({ ...p, name: e.target.value })} />
                  <input className={input} placeholder="Note (e.g. Padma Shri, 2011)" value={p.note} onChange={(e) => set({ ...p, note: e.target.value })} />
                  <SourcePicker className="md:col-span-2" options={props.sources} value={p.sources} onChange={(sources) => set({ ...p, sources })} />
                </div>
              )}
            />
            <F label="Organisations (Keep the story alive)">
              <SourcePicker options={props.organizations} value={t.keepAlive.organizations} onChange={(organizations) => up({ keepAlive: { ...t.keepAlive, organizations } })} />
            </F>
            <F label="Collaboration guidance (one per line)">
              <textarea
                className={input}
                rows={4}
                value={t.keepAlive.collaborationNotes.join("\n")}
                onChange={(e) => up({ keepAlive: { ...t.keepAlive, collaborationNotes: lines(e.target.value) } })}
              />
            </F>
          </div>
        )}

        {tab === "Advanced JSON" && (
          <div>
            <p className="text-sm text-ink-soft">
              The whole passport as JSON — for case files, influences, related stories and resources. Changes apply when you press “Apply JSON”, then save
              as usual. References are validated on save.
            </p>
            <textarea className={`${input} mt-3 font-mono text-xs`} rows={28} value={json ?? ""} onChange={(e) => setJson(e.target.value)} spellCheck={false} />
            <button
              type="button"
              className="label mt-3 rounded-full border rule px-4 py-2 hover:border-ink"
              onClick={() => {
                try {
                  const parsed = JSON.parse(json ?? "") as Tradition;
                  if (parsed.id !== t.id) throw new Error("The id cannot be changed.");
                  setT(parsed);
                  setMarkup({
                    origins: blocksToMarkup(parsed.origins),
                    significance: blocksToMarkup(parsed.significance),
                    makers: blocksToMarkup(parsed.makers.intro),
                    travels: blocksToMarkup(parsed.travels.intro),
                  });
                  setResult({ ok: true, message: "JSON applied — review and save." });
                } catch (e) {
                  setResult({ ok: false, message: `Invalid JSON: ${(e as Error).message}` });
                }
              }}
            >
              Apply JSON
            </button>
          </div>
        )}

        {tab === "Publish" && (
          <div className="grid gap-5 md:grid-cols-2">
            <F label="Publication status">
              <select className={input} value={t.status} onChange={(e) => up({ status: e.target.value as Tradition["status"] })}>
                {Object.entries(STATUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </F>
            <F label="Research maturity (shown to readers)">
              <select className={input} value={t.maturity} onChange={(e) => up({ maturity: e.target.value as Tradition["maturity"] })}>
                {Object.entries(MATURITY).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </F>
            <F label="Editorial notes (shown on drafts)">
              <textarea className={input} rows={3} value={t.editorial.notes} onChange={(e) => up({ editorial: { ...t.editorial, notes: e.target.value } })} />
            </F>
            <F label="Open research questions (one per line)">
              <textarea
                className={input}
                rows={3}
                value={t.editorial.openQuestions.join("\n")}
                onChange={(e) => up({ editorial: { ...t.editorial, openQuestions: lines(e.target.value) } })}
              />
            </F>
            <F label="Reviewed by">
              <input className={input} value={t.editorial.reviewedBy} onChange={(e) => up({ editorial: { ...t.editorial, reviewedBy: e.target.value } })} />
            </F>
            <div className="text-sm text-ink-soft">
              <p>Readers see the maturity label and editorial notes. A published passport must have a summary and sourced claims.</p>
              <p className="mt-2">
                <Link href={t.status === "published" ? `/passport/${t.slug}` : `/admin/preview/${t.slug}`} className="underline">
                  {t.status === "published" ? "View the live passport" : "Preview this draft"}
                </Link>{" "}
                (shows the last saved version).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Save bar */}
      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-t-2 border-ink bg-ivory px-4 py-3 sm:mx-0">
        <label className="min-w-[16rem] flex-1">
          <span className="sr-only">Change summary</span>
          <input
            className={input}
            placeholder="Describe this change (required — goes into the audit log)"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </label>
        <button type="button" onClick={save} disabled={pending || !dirty} className="label rounded-full bg-ink px-5 py-2.5 text-ivory hover:bg-burgundy disabled:opacity-50">
          {pending ? "Saving…" : dirty ? "Save changes" : "Saved"}
        </button>
        {result && (
          <p className={`w-full text-sm ${result.ok ? "text-forest" : "text-terracotta"}`} role="status">
            {result.message}
          </p>
        )}
      </div>
    </div>
  );
}

function F({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid content-start gap-1">
      <span className="label-sm text-ink-mute">{label}</span>
      {children}
      {hint && <span className="text-xs text-ink-mute">{hint}</span>}
    </div>
  );
}

function LevelSelect({ value, onChange }: { value: EvidenceLevel; onChange: (l: EvidenceLevel) => void }) {
  return (
    <select className={input} value={value} onChange={(e) => onChange(e.target.value as EvidenceLevel)} style={{ color: EVIDENCE[value].color }} aria-label="Evidence label">
      {EVIDENCE_ORDER.map((l) => (
        <option key={l} value={l}>
          {EVIDENCE[l].glyph} {EVIDENCE[l].label}
        </option>
      ))}
    </select>
  );
}

function SourcePicker({ options, value, onChange, className = "" }: { options: Opt[]; value: string[]; onChange: (v: string[]) => void; className?: string }) {
  const [q, setQ] = useState("");
  const found = q.length > 1 ? options.filter((o) => !value.includes(o.id) && (o.label.toLowerCase().includes(q.toLowerCase()) || o.id.includes(q.toLowerCase()))).slice(0, 6) : [];
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <div className="flex flex-wrap gap-1.5">
        {value.map((id) => (
          <span key={id} className="label-sm flex items-center gap-1 rounded-full bg-ink/10 px-2 py-1">
            {id}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== id))} aria-label={`Remove ${id}`} className="hover:text-terracotta">
              ×
            </button>
          </span>
        ))}
        {!value.length && <span className="text-xs text-terracotta">No sources attached</span>}
      </div>
      <div className="relative">
        <input className={input} placeholder="Add a source — type to search…" value={q} onChange={(e) => setQ(e.target.value)} />
        {found.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full border rule bg-ivory shadow-lg">
            {found.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  className="w-full px-2.5 py-1.5 text-left text-sm hover:bg-paper"
                  onClick={() => {
                    onChange([...value, o.id]);
                    setQ("");
                  }}
                >
                  <span className="font-mono text-xs text-ink-mute">{o.id}</span> {o.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ListEditor<T>({
  title,
  items,
  blank,
  onChange,
  render,
}: {
  title: string;
  items: T[];
  blank: () => T;
  onChange: (items: T[]) => void;
  render: (item: T, set: (v: T) => void) => React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="label text-ink-mute">
          {title} · {items.length}
        </p>
        <button type="button" onClick={() => onChange([...items, blank()])} className="label-sm rounded-full border rule px-3 py-1.5 hover:border-ink">
          + Add
        </button>
      </div>
      <ol className="mt-3 space-y-3">
        {items.map((item, i) => (
          <li key={i} className="border rule bg-paper/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs text-ink-mute">#{i + 1}</span>
              <span className="flex gap-1">
                <button type="button" disabled={i === 0} onClick={() => onChange(move(items, i, i - 1))} className="label-sm px-2 disabled:opacity-30" aria-label="Move up">
                  ↑
                </button>
                <button type="button" disabled={i === items.length - 1} onClick={() => onChange(move(items, i, i + 1))} className="label-sm px-2 disabled:opacity-30" aria-label="Move down">
                  ↓
                </button>
                <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="label-sm px-2 text-terracotta" aria-label="Remove">
                  Remove
                </button>
              </span>
            </div>
            {render(item, (v) => onChange(items.map((x, j) => (j === i ? v : x))))}
          </li>
        ))}
      </ol>
    </div>
  );
}

function move<T>(arr: T[], from: number, to: number): T[] {
  const copy = [...arr];
  const [x] = copy.splice(from, 1);
  copy.splice(to, 0, x);
  return copy;
}
