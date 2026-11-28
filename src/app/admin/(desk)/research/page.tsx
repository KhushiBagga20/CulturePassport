import type { Metadata } from "next";
import Link from "next/link";
import { getEditorArchive } from "@/lib/data/archive";
import { listCandidates } from "@/lib/data/research-store";
import { mediaUrl } from "@/lib/media";
import type { MediaAsset } from "@/lib/types";
import { addCountryFromCandidateAction, draftFromCandidateAction, rejectCandidateAction, reopenCandidateAction } from "../../actions";
import { ActionForm, inputClass } from "@/components/admin/ActionForm";
import { requireEditorPage } from "@/lib/auth";

export const metadata: Metadata = { title: "Research queue", robots: { index: false } };

const STATUS = { new: "To review", rejected: "Rejected", drafted: "Drafted" } as const;

export default async function ResearchPage({ searchParams }: PageProps<"/admin/research">) {
  await requireEditorPage();
  const sp = await searchParams;
  const country = typeof sp.country === "string" ? sp.country : "all";
  const status = (typeof sp.status === "string" ? sp.status : "new") as keyof typeof STATUS | "all";
  const craftsOnly = sp.all !== "1";

  const [archive, all] = await Promise.all([getEditorArchive(), listCandidates()]);
  const onAtlas = new Set(archive.countries.map((c) => c.iso2));
  const countries = Array.from(new Map(all.map((c) => [c.country.iso2, c.country.name])).entries()).sort((a, b) => a[1].localeCompare(b[1]));
  const shown = all
    .filter((c) => country === "all" || c.country.iso2 === country)
    .filter((c) => status === "all" || c.status === status)
    .filter((c) => !craftsOnly || c.materialCulture)
    .sort((a, b) => a.country.name.localeCompare(b.country.name) || a.name.localeCompare(b.name));
  const q = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(country !== "all" ? { country } : {}), ...(status !== "new" ? { status } : {}), ...(craftsOnly ? {} : { all: "1" }), ...patch });
    for (const [k, v] of [...p.entries()]) if (v === "") p.delete(k);
    const s = p.toString();
    return `/admin/research${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <p className="label text-brick">Research queue</p>
      <h1 className="font-display mt-2 text-5xl">Candidates for new passports</h1>
      <p className="mt-3 max-w-3xl text-ink-soft">
        Leads gathered by the research pipeline from Wikidata, UNESCO listings and Wikimedia Commons. None of this is public. Turning a candidate into a
        passport creates a <strong>draft</strong> in which every claim is marked &ldquo;Further verification needed&rdquo;. Rewrite it from primary
        sources and consult the communities involved before publishing.
      </p>

      {all.length === 0 ? (
        <div className="mt-8 border-2 border-dashed border-ink/40 p-6">
          <p className="font-title text-2xl">The queue is empty.</p>
          <p className="mt-2 text-sm text-ink-soft">Run the pipeline for one or more countries (ISO codes), then reload this page:</p>
          <pre className="mt-3 overflow-x-auto bg-ink p-3 text-xs text-bone">npm run research -- --country GH --country MX</pre>
        </div>
      ) : (
        <>
          <nav aria-label="Filters" className="mt-8 grid gap-3">
            <div className="flex flex-wrap gap-1.5">
              <Link href={q({ country: "" })} className="chip" aria-current={country === "all" ? "true" : undefined}>
                All countries
              </Link>
              {countries.map(([iso, name]) => (
                <Link key={iso} href={q({ country: iso })} className="chip" aria-current={country === iso ? "true" : undefined}>
                  {name} · {all.filter((c) => c.country.iso2 === iso && c.status === "new").length}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["new", "drafted", "rejected", "all"] as const).map((s) => (
                <Link key={s} href={q({ status: s === "new" ? "" : s })} className="chip" aria-current={status === s ? "true" : undefined}>
                  {s === "all" ? "Any status" : STATUS[s]}
                </Link>
              ))}
              <Link href={q({ all: craftsOnly ? "1" : "" })} className="chip" aria-current={craftsOnly ? "true" : undefined}>
                Crafts &amp; visual arts only
              </Link>
            </div>
          </nav>

          <p className="label-sm mt-6 text-ink-mute">
            {shown.length} of {all.length} candidates
          </p>
          <ul className="mt-3 grid gap-4">
            {shown.map((c) => {
              const img: MediaAsset | undefined = c.image
                ? { id: c.id, commonsFile: c.image.file, commonsHash: c.image.hash, width: c.image.width, height: c.image.height, alt: "", caption: "", credit: c.image.credit, license: c.image.license, sourcePage: c.image.sourcePage, kind: "photograph", documentary: false }
                : undefined;
              const src = new Map(c.sources.map((s) => [s.key, s]));
              return (
                <li key={c.id} className="grid gap-5 border-2 border-ink bg-bone p-5 md:grid-cols-[10rem_1fr]">
                  <div>
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Commons thumbnail for review only
                      <img src={mediaUrl(img, 330)} alt="" className="aspect-square w-full border-2 border-ink object-cover" loading="lazy" />
                    ) : (
                      <div className="flex aspect-square items-center justify-center border-2 border-dashed border-ink/40 text-xs text-ink-mute">No image</div>
                    )}
                    {c.image && (
                      <p className={`mt-1 text-xs ${c.image.free ? "text-umber" : "text-brick"}`}>
                        {c.image.license} · {c.image.free ? "usable" : "not usable"}
                      </p>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="label-sm bg-ink px-2 py-0.5 text-bone">{c.country.name}</span>
                      <span className="label-sm border border-ink/30 px-2 py-0.5">{STATUS[c.status]}</span>
                      {c.materialCulture ? <span className="label-sm bg-yellow px-2 py-0.5">Craft / visual art</span> : <span className="label-sm text-ink-mute">{c.kinds.slice(0, 2).join(", ")}</span>}
                    </div>
                    <h2 className="font-title mt-2 text-2xl">{c.name}</h2>
                    {c.nativeNames.length > 0 && <p className="text-sm text-ink-mute">{c.nativeNames.map((n) => `${n.text} (${n.lang})`).join(" · ")}</p>}
                    {c.ich && (
                      <p className="mt-1 text-sm">
                        <a href={c.ich.url} target="_blank" rel="noreferrer" className="underline">
                          UNESCO {c.ich.id}
                        </a>{" "}
                        · {c.ich.listLabel}
                        {c.ich.year ? ` · ${c.ich.year}` : ""}
                      </p>
                    )}
                    <ul className="mt-3 space-y-1 text-sm">
                      {c.facts.map((f) => (
                        <li key={f.text}>
                          {f.text}{" "}
                          {f.sources.map((k) =>
                            src.get(k) ? (
                              <a key={k} href={src.get(k)!.url} target="_blank" rel="noreferrer" className="label-sm text-brick underline">
                                {src.get(k)!.publisher}
                              </a>
                            ) : null,
                          )}
                        </li>
                      ))}
                    </ul>
                    {c.note && <p className="mt-2 border-l-4 border-yellow pl-2 text-sm">{c.note}</p>}
                    <p className="label-sm mt-2 text-ink-mute">
                      Fetched {c.fetchedAt.slice(0, 10)}
                      {c.reviewedBy ? ` · reviewed by ${c.reviewedBy}` : ""}
                    </p>

                    <div className="mt-4 flex flex-wrap items-start gap-6 border-t border-ink/15 pt-4">
                      {c.status === "drafted" && c.draftId ? (
                        <Link href={`/admin/passports/${c.draftId}`} className="btn btn-ink">
                          Open the draft →
                        </Link>
                      ) : c.status === "new" ? (
                        <>
                          {onAtlas.has(c.country.iso2) ? (
                            <ActionForm action={draftFromCandidateAction} submitLabel="Create draft passport">
                              <input type="hidden" name="id" value={c.id} />
                            </ActionForm>
                          ) : (
                            <ActionForm action={addCountryFromCandidateAction} submitLabel={`Add ${c.country.name} to the atlas`}>
                              <input type="hidden" name="id" value={c.id} />
                              <p className="max-w-xs text-xs text-ink-mute">Shows it on the globe as &ldquo;Stories being documented&rdquo;. Then you can draft passports for it.</p>
                            </ActionForm>
                          )}
                          <ActionForm action={rejectCandidateAction} submitLabel="Reject">
                            <input type="hidden" name="id" value={c.id} />
                            <input name="note" placeholder="Reason (optional)" className={`${inputClass} max-w-xs`} />
                          </ActionForm>
                        </>
                      ) : (
                        <ActionForm action={reopenCandidateAction} submitLabel="Return to the queue">
                          <input type="hidden" name="id" value={c.id} />
                        </ActionForm>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
