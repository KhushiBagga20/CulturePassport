"use client";

import { useActionState, useRef, useEffect } from "react";
import type { ActionResult } from "@/app/admin/actions";

/** A form bound to a server action, with inline success / error feedback. */
export function ActionForm({
  action,
  children,
  submitLabel,
  className = "",
  resetOnSuccess = false,
  encType,
}: {
  action: (prev: ActionResult | null, form: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
  resetOnSuccess?: boolean;
  encType?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} encType={encType} className={`grid gap-4 ${className}`}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="label rounded-full bg-ink px-5 py-2.5 text-ivory hover:bg-burgundy disabled:opacity-60">
          {pending ? "Working…" : submitLabel}
        </button>
        {state && (
          <p className={`text-sm ${state.ok ? "text-forest" : "text-terracotta"}`} role="status">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

export const inputClass = "w-full border rule bg-ivory px-2.5 py-2 text-sm outline-none focus:border-ink";

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="grid content-start gap-1">
      <span className="label-sm text-ink-mute">{label}</span>
      {children}
      {hint && <span className="text-xs text-ink-mute">{hint}</span>}
    </label>
  );
}
