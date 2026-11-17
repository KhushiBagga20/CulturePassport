import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getEditor, localAdminConfigured } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/clients";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editor sign-in", robots: { index: false } };

export default async function LoginPage() {
  if (await getEditor()) redirect("/admin");
  const mode = supabaseConfigured() ? "supabase" : localAdminConfigured() ? "local" : "locked";
  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
      <div>
        <p className="label text-terracotta">Editorial desk</p>
        <h1 className="font-display mt-3 text-[clamp(3rem,8vw,6rem)]">Editors only</h1>
        <p className="mt-4 text-ink-soft">
          Public content is read-only for everyone. Editors create passports, attach sources to claims, manage publication and review corrections.
          Every significant edit is logged.
        </p>
        <dl className="mt-8 space-y-3 text-sm">
          <div>
            <dt className="label-sm text-ink-mute">Backend</dt>
            <dd>{mode === "supabase" ? "Supabase (PostgreSQL + Auth, row-level security)" : "Local demo mode — seed archive + .data/store.json"}</dd>
          </div>
        </dl>
      </div>
      <div className="paper-card p-6 sm:p-8">
        {mode === "locked" ? (
          <div>
            <p className="label text-terracotta">The desk is locked</p>
            <p className="mt-3 text-sm text-ink-soft">
              No editor credentials are configured. For local demo mode, add a passcode to <code className="font-mono">.env.local</code>:
            </p>
            <pre className="mt-3 overflow-x-auto bg-ink p-3 font-mono text-xs text-ivory">DEMO_ADMIN_PASSWORD=choose-a-long-passcode</pre>
            <p className="mt-3 text-sm text-ink-soft">Then restart the dev server. For production, configure Supabase — see the README.</p>
          </div>
        ) : (
          <LoginForm mode={mode} />
        )}
      </div>
    </div>
  );
}
