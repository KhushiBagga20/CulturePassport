import type { Metadata } from "next";
import { getArchive } from "@/lib/data/archive";
import { mediaUrl } from "@/lib/media";
import { uploadMediaAction } from "../../actions";
import { ActionForm, Field, inputClass } from "@/components/admin/ActionForm";
import { requireEditorPage } from "@/lib/auth";

export const metadata: Metadata = { title: "Media", robots: { index: false } };

export default async function MediaPage() {
  await requireEditorPage();
  const archive = await getArchive();
  return (
    <div>
      <p className="label text-terracotta">Media</p>
      <h1 className="font-display mt-2 text-5xl">Images · {archive.media.length}</h1>

      <section className="paper-card mt-8 p-5">
        <h2 className="font-title text-2xl">Upload a permitted image</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Only images you have the right to publish. Every image needs a credit and licence; generated images may never be marked documentary.
        </p>
        <ActionForm action={uploadMediaAction} submitLabel="Upload" className="mt-4" resetOnSuccess>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Image (JPEG, PNG, WebP, AVIF · max 4 MB)">
              <input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required className={inputClass} />
            </Field>
            <Field label="Licence">
              <select name="license" required className={inputClass} defaultValue="">
                <option value="" disabled>
                  Choose…
                </option>
                {["CC0 1.0", "Public domain", "CC BY 2.0", "CC BY 4.0", "CC BY-SA 3.0", "CC BY-SA 4.0", "Used with written permission"].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Credit (photographer / rights holder)">
              <input name="credit" required className={inputClass} placeholder="Photo: …" />
            </Field>
            <Field label="Source page or permission record (URL)">
              <input name="sourcePage" type="url" className={inputClass} />
            </Field>
            <Field label="Alt text (what is in the image)">
              <input name="alt" required className={inputClass} />
            </Field>
            <Field label="Caption">
              <input name="caption" required className={inputClass} />
            </Field>
            <Field label="Kind">
              <select name="kind" className={inputClass}>
                <option value="photograph">Photograph</option>
                <option value="museum-object">Museum object</option>
                <option value="archival">Archival</option>
                <option value="artwork">Artwork</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Width (px)">
                <input name="width" type="number" min={1} defaultValue={1600} className={inputClass} />
              </Field>
              <Field label="Height (px)">
                <input name="height" type="number" min={1} defaultValue={1200} className={inputClass} />
              </Field>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="documentary" /> Documentary photograph (a real record that can serve as evidence)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="rights" required /> I confirm we may publish this image under the licence above.
          </label>
        </ActionForm>
      </section>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {archive.media.map((m) => (
          <li key={m.id} className="border rule bg-ivory">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
            <img src={mediaUrl(m, 500)} alt={m.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
            <div className="p-3 text-sm">
              <p className="font-mono text-xs text-ink-mute">{m.id}</p>
              <p className="mt-1">{m.caption}</p>
              <p className="label-sm mt-1 text-ink-mute">
                {m.credit} · {m.license} {m.documentary ? "· documentary" : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
