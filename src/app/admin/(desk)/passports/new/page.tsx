import type { Metadata } from "next";
import { getArchive } from "@/lib/data/archive";
import { CATEGORY } from "@/lib/labels";
import { createTraditionAction } from "../../../actions";
import { ActionForm, Field, inputClass } from "@/components/admin/ActionForm";

export const metadata: Metadata = { title: "New passport", robots: { index: false } };

export default async function NewPassportPage() {
  const archive = await getArchive();
  const nextNo = String(Math.max(0, ...archive.traditions.map((t) => Number(t.passportNo))) + 1).padStart(3, "0");
  return (
    <div className="max-w-3xl">
      <p className="label text-terracotta">New passport · No. {nextNo}</p>
      <h1 className="font-display mt-2 text-5xl">Start a draft</h1>
      <p className="mt-3 text-ink-soft">
        New passports begin as private drafts marked &ldquo;editorial draft&rdquo;. Add sourced claims, a timeline and makers in the editor, then move it to
        review and publish.
      </p>
      <ActionForm action={createTraditionAction} submitLabel="Create draft" className="mt-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tradition name">
            <input name="name" required className={inputClass} placeholder="e.g. Pattachitra" />
          </Field>
          <Field label="Slug (optional)" hint="Generated from the name if empty.">
            <input name="slug" className={inputClass} placeholder="pattachitra" />
          </Field>
          <Field label="Collection">
            <select name="collection" className={inputClass} defaultValue="IN">
              {archive.countries.map((c) => (
                <option key={c.iso2} value={c.iso2}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category">
            <select name="category" className={inputClass} defaultValue="painting">
              {Object.entries(CATEGORY).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Region line" hint="Name every country involved.">
            <input name="regionLabel" className={inputClass} placeholder="Odisha, India" />
          </Field>
          <Field label="Tagline">
            <input name="tagline" className={inputClass} />
          </Field>
        </div>
        <Field label="Summary">
          <textarea name="summary" rows={3} className={inputClass} />
        </Field>
      </ActionForm>
    </div>
  );
}
