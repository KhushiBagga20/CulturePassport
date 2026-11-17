"use server";

import { getArchive, isPublic } from "@/lib/data/archive";
import { submitCorrection } from "@/lib/data/mutations";

export interface CorrectionState {
  ok: boolean;
  message: string;
}

/** Public correction requests. Stored for editorial review; never published automatically. */
export async function submitCorrectionAction(_prev: CorrectionState | null, form: FormData): Promise<CorrectionState> {
  // Honeypot: real visitors never see or fill this field.
  if (String(form.get("website") ?? "").trim()) return { ok: true, message: "Thank you — your note has been received." };

  const tradition = String(form.get("tradition") ?? "");
  const claim = String(form.get("claim") ?? "").trim() || undefined;
  const message = String(form.get("message") ?? "").trim();
  const evidenceUrl = String(form.get("evidenceUrl") ?? "").trim() || undefined;
  const contact = String(form.get("contact") ?? "").trim() || undefined;

  const archive = await getArchive();
  const t = archive.traditions.find((x) => x.id === tradition);
  if (!t || !isPublic(t)) return { ok: false, message: "That passport could not be found." };
  if (message.length < 10) return { ok: false, message: "Please describe the correction in at least a sentence." };
  if (message.length > 4000) return { ok: false, message: "Please keep the note under 4,000 characters." };
  if (evidenceUrl && !/^https?:\/\/\S+$/i.test(evidenceUrl)) return { ok: false, message: "The evidence link should start with http:// or https://." };
  if (contact && contact.length > 200) return { ok: false, message: "Contact details are too long." };
  if (claim && !t.claims.some((c) => c.id === claim)) return { ok: false, message: "Please choose a claim from the list." };

  try {
    await submitCorrection({ tradition, claim, message, evidenceUrl, contact });
    return { ok: true, message: "Thank you. An editor will review this against the sources — corrections are logged on the passport." };
  } catch (e) {
    return { ok: false, message: `We couldn't save that just now (${(e as Error).message}). Please try again later.` };
  }
}
