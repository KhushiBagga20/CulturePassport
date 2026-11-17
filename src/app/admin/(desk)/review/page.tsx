import type { Metadata } from "next";
import Link from "next/link";
import { getArchive } from "@/lib/data/archive";
import { listCorrections } from "@/lib/data/mutations";
import { resolveCorrectionAction } from "../../actions";
import { ActionForm, inputClass } from "@/components/admin/ActionForm";

export const metadata: Metadata = { title: "Review queue", robots: { index: false } };

export default async function ReviewPage() {
  const archive = await getArchive();
  const corrections = await listCorrections();
  const byId = new Map(archive.traditions.map((t) => [t.id, t]));
  const pending = archive.traditions.filter((t) => t.status === "review");
  const open = corrections.filter((c) => c.status === "open");
  const closed = corrections.filter((c) => c.status !== "open");

  return (
    <div>
      <p className="label text-terracotta">Review queue</p>
      <h1 className="font-display mt-2 text-5xl">Pending content</h1>

      <section className="mt-8">
        <h2 className="font-title text-3xl">Passports awaiting review · {pending.length}</h2>
        {pending.length ? (
          <ul className="mt-3 space-y-2">
            {pending.map((t) => (
              <li key={t.id}>
                <Link href={`/admin/passports/${t.id}`} className="underline">
                  No. {t.passportNo} {t.name}
                </Link>{" "}
                ·{" "}
                <Link href={`/admin/preview/${t.slug}`} className="text-sm underline">
                  preview
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">No passports are in review. Set a draft&rsquo;s status to “In review” to queue it here.</p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-title text-3xl">Correction requests · {open.length} open</h2>
        {open.length === 0 && <p className="mt-3 text-sm text-ink-soft">Nothing waiting. Public notes from passport pages will appear here.</p>}
        <ul className="mt-4 space-y-4">
          {open.map((c) => {
            const t = byId.get(c.tradition);
            const claim = t?.claims.find((x) => x.id === c.claim);
            return (
              <li key={c.id} className="paper-card p-5">
                <p className="label-sm text-ink-mute">
                  {new Date(c.createdAt).toLocaleString("en-GB")} · {t ? `No. ${t.passportNo} ${t.name}` : c.tradition}
                </p>
                {claim && <p className="mt-2 border-l-2 border-mustard pl-3 text-sm text-ink-soft">On claim #{claim.id}: {claim.text}</p>}
                <p className="mt-2 whitespace-pre-wrap">{c.message}</p>
                {c.evidenceUrl && (
                  <a href={c.evidenceUrl} target="_blank" rel="noreferrer noopener" className="mt-2 inline-block text-sm underline">
                    Evidence link ↗
                  </a>
                )}
                {c.contact && <p className="label-sm mt-2 text-ink-mute">Contact: {c.contact}</p>}
                <ActionForm action={resolveCorrectionAction} submitLabel="Resolve" className="mt-4 border-t rule pt-4">
                  <input type="hidden" name="id" value={c.id} />
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center gap-1.5">
                      <input type="radio" name="status" value="accepted" required /> Accept — I will update the passport
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input type="radio" name="status" value="dismissed" /> Dismiss
                    </label>
                  </div>
                  <textarea name="resolution" rows={2} required placeholder="Resolution note — what was checked, what changed" className={inputClass} />
                </ActionForm>
              </li>
            );
          })}
        </ul>
        {closed.length > 0 && (
          <details className="mt-8">
            <summary className="label cursor-pointer">Resolved · {closed.length}</summary>
            <ul className="mt-3 divide-y divide-ink/10 border-y rule text-sm">
              {closed.map((c) => (
                <li key={c.id} className="py-2">
                  <span className="label-sm">{c.status}</span> · {byId.get(c.tradition)?.name} · {c.message.slice(0, 120)} — <em>{c.resolution}</em>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}
