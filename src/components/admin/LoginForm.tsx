"use client";

import { useActionState } from "react";
import { loginAction, type ActionResult } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(loginAction, null);
  return (
    <form action={action} className="grid gap-4">
      <Field label="Your name (for the audit log)" name="name" autoComplete="name" />
      <Field label="Editor passcode" name="passcode" type="password" autoComplete="current-password" />
      <p className="text-xs text-ink-mute">The passcode is set in EDITOR_PASSCODE on the server.</p>
      {state && !state.ok && (
        <p className="text-sm text-terracotta" role="alert">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="label rounded-full bg-ink px-5 py-3 text-ivory hover:bg-burgundy disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function Field({ label, name, type = "text", autoComplete }: { label: string; name: string; type?: string; autoComplete?: string }) {
  return (
    <label className="grid gap-1">
      <span className="label-sm text-ink-mute">{label}</span>
      <input name={name} type={type} required={name !== "name"} autoComplete={autoComplete} className="border rule bg-ivory px-3 py-2.5 outline-none focus:border-ink" />
    </label>
  );
}
