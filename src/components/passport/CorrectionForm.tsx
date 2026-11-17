"use client";

import { useActionState } from "react";
import { submitCorrectionAction, type CorrectionState } from "@/app/actions/corrections";

export function CorrectionForm({ traditionId, claims }: { traditionId: string; claims: { id: string; text: string }[] }) {
  const [state, action, pending] = useActionState<CorrectionState | null, FormData>(submitCorrectionAction, null);
  return (
    <details className="group border-2 border-ink bg-bone" id="corrections">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
        <span>
          <span className="label text-terracotta">Suggest a correction</span>
          <span className="mt-1 block text-sm text-ink-soft">Found an error, a missing source, or a better account? Tell the editors.</span>
        </span>
        <span aria-hidden className="font-display text-2xl transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      {state?.ok ? (
        <p className="border-t-2 border-ink p-5 text-green" role="status">
          {state.message}
        </p>
      ) : (
        <form action={action} className="grid gap-4 border-t-2 border-ink p-5">
          <input type="hidden" name="tradition" value={traditionId} />
          <div className="hidden" aria-hidden>
            <label>
              Website <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <label className="grid gap-1">
            <span className="label-sm text-ink-mute">Which claim? (optional)</span>
            <select name="claim" className="w-full min-w-0 border-2 border-ink/30 bg-cream px-2 py-2 text-sm">
              <option value="">The passport in general</option>
              {claims.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.text.length > 90 ? `${c.text.slice(0, 88)}…` : c.text}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="label-sm text-ink-mute">What should change, and why?</span>
            <textarea name="message" required minLength={10} maxLength={4000} rows={4} className="border-2 border-ink/30 bg-cream p-2 text-sm" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="label-sm text-ink-mute">Link to evidence (optional)</span>
              <input name="evidenceUrl" type="url" placeholder="https://" className="border-2 border-ink/30 bg-cream px-2 py-2 text-sm" />
            </label>
            <label className="grid gap-1">
              <span className="label-sm text-ink-mute">How can we reach you? (optional)</span>
              <input name="contact" maxLength={200} className="border-2 border-ink/30 bg-cream px-2 py-2 text-sm" />
            </label>
          </div>
          <p className="text-xs text-ink-mute">Notes are read by editors only and are never published automatically. Contact details are used only to follow up.</p>
          {state && !state.ok && (
            <p className="text-sm text-terracotta" role="alert">
              {state.message}
            </p>
          )}
          <button type="submit" disabled={pending} className="btn btn-ink justify-self-start disabled:opacity-60">
            {pending ? "Sending…" : "Send to the editors"}
          </button>
        </form>
      )}
    </details>
  );
}
