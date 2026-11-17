import type { Metadata } from "next";
import Link from "next/link";
import { getArchive, citedSources } from "@/lib/data/archive";
import { listCorrections, listRevisions } from "@/lib/data/mutations";
import { validateArchive } from "@/lib/data/seed";
import { MATURITY, STATUS } from "@/lib/labels";

export const metadata: Metadata = { title: "Editorial desk", robots: { index: false } };

export default async function AdminDashboard() {
  const archive = await getArchive();
  const [corrections, revisions] = await Promise.all([listCorrections(), listRevisions()]);
  const problems = validateArchive(archive);
  const open = corrections.filter((c) => c.status === "open");
  const inReview = archive.traditions.filter((t) => t.status === "review");

  return (
    <div>
      <p className="label text-terracotta">Editorial desk</p>
      <h1 className="font-display mt-2 text-6xl">Dashboard</h1>

      <dl className="mt-8 grid grid-cols-2 gap-px border rule bg-ink/10 sm:grid-cols-4">
        {[
          ["Passports", archive.traditions.length],
          ["Published", archive.traditions.filter((t) => t.status === "published").length],
          ["Open corrections", open.length],
          ["Sources", archive.sources.length],
        ].map(([k, v]) => (
          <div key={k} className="bg-ivory p-4">
            <dt className="label-sm text-ink-mute">{k}</dt>
            <dd className="font-display mt-1 text-5xl">{v}</dd>
          </div>
        ))}
      </dl>

      <div className={`mt-6 border-l-4 p-4 text-sm ${problems.length ? "border-terracotta bg-terracotta/10" : "border-forest bg-forest/10"}`}>
        <p className="label">{problems.length ? `${problems.length} integrity problem(s)` : "Archive integrity: every reference resolves"}</p>
        {problems.length > 0 && (
          <ul className="mt-2 list-disc pl-5">
            {problems.slice(0, 12).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        <p className="mt-1 text-ink-soft">
          Backend: <strong>{archive.backend === "supabase" ? "Supabase" : archive.backend === "local-store" ? "Local demo (seed + your edits)" : "Local demo (seed only)"}</strong>
        </p>
      </div>

      {(open.length > 0 || inReview.length > 0) && (
        <section className="mt-10">
          <h2 className="font-title text-3xl">Needs attention</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {inReview.map((t) => (
              <li key={t.id}>
                <Link href={`/admin/passports/${t.id}`} className="underline">
                  No. {t.passportNo} {t.name}
                </Link>{" "}
                is awaiting review.
              </li>
            ))}
            {open.length > 0 && (
              <li>
                <Link href="/admin/review" className="underline">
                  {open.length} correction request(s)
                </Link>{" "}
                waiting.
              </li>
            )}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-title text-3xl">Passports</h2>
          <Link href="/admin/passports/new" className="label rounded-full bg-ink px-4 py-2 text-ivory hover:bg-burgundy">
            + New passport
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="label-sm border-b-2 border-ink text-ink-mute">
              <tr>
                <th className="py-2 pr-4">No.</th>
                <th className="py-2 pr-4">Tradition</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Research</th>
                <th className="py-2 pr-4">Claims</th>
                <th className="py-2 pr-4">Sources</th>
                <th className="py-2 pr-4">Reviewed</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {archive.traditions.map((t) => (
                <tr key={t.id} className="border-b rule">
                  <td className="py-3 pr-4 font-mono">{t.passportNo}</td>
                  <td className="py-3 pr-4">
                    <Link href={`/admin/passports/${t.id}`} className="font-medium hover:text-terracotta">
                      {t.name}
                    </Link>
                    <span className="block text-xs text-ink-mute">/{t.slug}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`label-sm rounded-full px-2 py-0.5 ${t.status === "published" ? "bg-forest/15 text-forest" : t.status === "review" ? "bg-mustard/30" : "bg-ink/10"}`}
                    >
                      {STATUS[t.status]}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{MATURITY[t.maturity].label}</td>
                  <td className="py-3 pr-4">{t.claims.length}</td>
                  <td className="py-3 pr-4">{citedSources(t).length}</td>
                  <td className="py-3 pr-4">{t.editorial.lastReviewed}</td>
                  <td className="py-3 text-right">
                    <Link href={t.status === "published" ? `/passport/${t.slug}` : `/admin/preview/${t.slug}`} className="label-sm underline">
                      {t.status === "published" ? "View" : "Preview"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-title text-3xl">Recent edits</h2>
        {revisions.length ? (
          <ul className="mt-3 divide-y divide-ink/10 border-y rule text-sm">
            {revisions.slice(0, 8).map((r) => (
              <li key={r.id} className="py-2">
                <span className="font-mono text-xs text-ink-mute">{r.at.slice(0, 16).replace("T", " ")}</span> · {r.editor} · {r.summary}
                {r.fields.length > 0 && <span className="text-ink-mute"> ({r.fields.slice(0, 6).join(", ")})</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">No edits yet — the archive is exactly as seeded.</p>
        )}
      </section>
    </div>
  );
}
