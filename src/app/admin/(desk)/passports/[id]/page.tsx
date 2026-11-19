import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArchive } from "@/lib/data/archive";
import { listRevisions } from "@/lib/data/mutations";
import { TraditionEditor } from "@/components/admin/TraditionEditor";
import { requireEditorPage } from "@/lib/auth";

export const metadata: Metadata = { title: "Edit passport", robots: { index: false } };

export default async function EditPassportPage({ params }: PageProps<"/admin/passports/[id]">) {
  await requireEditorPage();
  const { id } = await params;
  const archive = await getArchive();
  const t = archive.traditions.find((x) => x.id === id);
  if (!t) notFound();
  const revisions = await listRevisions(t.id);
  return (
    <div>
      <Link href="/admin" className="label-sm text-ink-mute hover:text-terracotta">
        ← Dashboard
      </Link>
      <h1 className="font-display mt-2 text-5xl">
        No. {t.passportNo} · {t.name}
      </h1>
      <TraditionEditor
        initial={t}
        sources={archive.sources.map((s) => ({ id: s.id, label: `${s.publisher} — ${s.title}`.slice(0, 120) }))}
        media={archive.media.map((m) => ({ id: m.id, label: `${m.id} — ${m.caption}`.slice(0, 100) }))}
        places={archive.places.map((p) => ({ id: p.id, label: `${p.name} (${p.country})` }))}
        communities={archive.communities.map((c) => ({ id: c.id, label: c.name }))}
        organizations={archive.organizations.map((o) => ({ id: o.id, label: o.name }))}
        countries={archive.countries.map((c) => ({ id: c.iso2, label: c.name }))}
        traditions={archive.traditions.filter((x) => x.id !== t.id).map((x) => ({ id: x.slug, label: x.name }))}
      />
      <section className="mt-12">
        <h2 className="font-title text-3xl">Change history</h2>
        {revisions.length ? (
          <ul className="mt-3 divide-y divide-ink/10 border-y rule text-sm">
            {revisions.map((r) => (
              <li key={r.id} className="py-2">
                <span className="font-mono text-xs text-ink-mute">{r.at.slice(0, 16).replace("T", " ")}</span> · {r.editor} · {r.summary}
                {r.fields.length > 0 && <span className="text-ink-mute"> — {r.fields.join(", ")}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">No edits since seeding.</p>
        )}
      </section>
    </div>
  );
}
