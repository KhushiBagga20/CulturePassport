import type { Metadata } from "next";
import { listRevisions } from "@/lib/data/mutations";
import { requireEditorPage } from "@/lib/auth";

export const metadata: Metadata = { title: "History", robots: { index: false } };

export default async function HistoryPage() {
  await requireEditorPage();
  const revisions = await listRevisions();
  return (
    <div>
      <p className="label text-terracotta">Audit trail</p>
      <h1 className="font-display mt-2 text-5xl">Change history</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">Every save records who changed what, when, and why. Summaries of passport edits also appear on the public change log.</p>
      {revisions.length ? (
        <table className="mt-8 w-full text-left text-sm">
          <thead className="label-sm border-b-2 border-ink text-ink-mute">
            <tr>
              <th className="py-2 pr-3">When</th>
              <th className="py-2 pr-3">Editor</th>
              <th className="py-2 pr-3">Entity</th>
              <th className="py-2 pr-3">Summary</th>
              <th className="py-2">Fields</th>
            </tr>
          </thead>
          <tbody>
            {revisions.map((r) => (
              <tr key={r.id} className="border-b rule align-top">
                <td className="py-2 pr-3 font-mono text-xs whitespace-nowrap">{r.at.slice(0, 16).replace("T", " ")}</td>
                <td className="py-2 pr-3">{r.editor}</td>
                <td className="py-2 pr-3">
                  {r.entity} · <span className="font-mono text-xs">{r.entityId}</span>
                </td>
                <td className="py-2 pr-3">{r.summary}</td>
                <td className="py-2 text-xs text-ink-mute">{r.fields.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-8 text-ink-soft">No edits yet.</p>
      )}
    </div>
  );
}
