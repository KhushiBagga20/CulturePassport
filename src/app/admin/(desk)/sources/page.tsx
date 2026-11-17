import type { Metadata } from "next";
import { getArchive } from "@/lib/data/archive";
import { SOURCE_TYPE, formatSourceDate } from "@/lib/labels";
import { saveSourceAction } from "../../actions";
import { ActionForm, Field, inputClass } from "@/components/admin/ActionForm";

export const metadata: Metadata = { title: "Sources", robots: { index: false } };

export default async function SourcesPage({ searchParams }: PageProps<"/admin/sources">) {
  const { edit } = await searchParams;
  const archive = await getArchive();
  const editing = archive.sources.find((s) => s.id === edit);
  const usage = new Map<string, number>();
  for (const t of archive.traditions) for (const c of t.claims) for (const s of c.sources) usage.set(s, (usage.get(s) ?? 0) + 1);

  return (
    <div>
      <p className="label text-terracotta">Evidence</p>
      <h1 className="font-display mt-2 text-5xl">Sources · {archive.sources.length}</h1>

      <section className="paper-card mt-8 p-5" id="form">
        <h2 className="font-title text-2xl">{editing ? `Edit “${editing.title}”` : "Add a source"}</h2>
        <p className="mt-1 text-sm text-ink-soft">Real, checkable links only. Note conflicts and retrieval problems — readers see them.</p>
        <ActionForm action={saveSourceAction} submitLabel={editing ? "Save source" : "Add source"} className="mt-4" key={editing?.id ?? "new"}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="ID (stable, lowercase)">
              <input name="id" required defaultValue={editing?.id} readOnly={!!editing} className={inputClass} placeholder="publisher-topic-year" />
            </Field>
            <Field label="Type">
              <select name="type" defaultValue={editing?.type ?? "news"} className={inputClass}>
                {Object.entries(SOURCE_TYPE).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input name="title" required defaultValue={editing?.title} className={inputClass} />
            </Field>
            <Field label="Publisher or institution">
              <input name="publisher" required defaultValue={editing?.publisher} className={inputClass} />
            </Field>
            <Field label="Author (optional)">
              <input name="author" defaultValue={editing?.author} className={inputClass} />
            </Field>
            <Field label="Publication date (YYYY, YYYY-MM or YYYY-MM-DD)">
              <input name="date" defaultValue={editing?.date} className={inputClass} />
            </Field>
            <Field label="URL">
              <input name="url" type="url" required defaultValue={editing?.url} className={inputClass} />
            </Field>
            <Field label="Last checked">
              <input name="accessed" type="date" defaultValue={editing?.accessed ?? new Date().toISOString().slice(0, 10)} className={inputClass} />
            </Field>
          </div>
          <Field label="Notes: conflicts, limitations, retrieval problems">
            <textarea name="notes" rows={2} defaultValue={editing?.notes} className={inputClass} />
          </Field>
        </ActionForm>
      </section>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="label-sm border-b-2 border-ink text-ink-mute">
            <tr>
              <th className="py-2 pr-3">Source</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Claims</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {archive.sources.map((s) => (
              <tr key={s.id} className="border-b rule align-top">
                <td className="py-2.5 pr-3">
                  <a href={s.url} target="_blank" rel="noreferrer" className="font-medium hover:text-terracotta">
                    {s.title} ↗
                  </a>
                  <span className="block text-xs text-ink-mute">
                    {s.id} · {s.publisher}
                  </span>
                </td>
                <td className="py-2.5 pr-3">{SOURCE_TYPE[s.type]}</td>
                <td className="py-2.5 pr-3 whitespace-nowrap">{formatSourceDate(s.date)}</td>
                <td className="py-2.5 pr-3">{usage.get(s.id) ?? 0}</td>
                <td className="py-2.5 text-right">
                  <a href={`/admin/sources?edit=${s.id}#form`} className="label-sm underline">
                    Edit
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
