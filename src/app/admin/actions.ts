"use server";

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPasscode, createLocalSession, endSession, getEditor, localAdminConfigured, requireEditor } from "@/lib/auth";
import { getArchive } from "@/lib/data/archive";
import { recordQr, resolveCorrection, saveMedia, saveSource, saveTradition } from "@/lib/data/mutations";
import { UPLOAD_DIR } from "@/lib/data/local-store";
import { validateArchive } from "@/lib/data/seed";
import { sessionClient, supabaseConfigured } from "@/lib/supabase/clients";
import type { MediaAsset, Source, Tradition } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  message: string;
  fields?: string[];
}

// ───────────────────────────── session ─────────────────────────────

export async function loginAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  if (supabaseConfigured()) {
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const client = await sessionClient();
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: error.message };
    if (!(await getEditor())) {
      await client.auth.signOut();
      return { ok: false, message: "Signed in, but this account is not on the editors list. Ask an admin to add you to the `editors` table." };
    }
    redirect("/admin");
  }
  if (!localAdminConfigured()) return { ok: false, message: "Set DEMO_ADMIN_PASSWORD in .env.local to enable the local editorial desk." };
  const passcode = String(form.get("passcode") ?? "");
  const name = String(form.get("name") ?? "Editor").trim();
  if (!checkPasscode(passcode)) return { ok: false, message: "That passcode is not correct." };
  await createLocalSession(name || "Editor");
  redirect("/admin");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login");
}

function refresh(t?: Tradition) {
  revalidatePath("/", "layout");
  if (t) revalidatePath(`/passport/${t.slug}`);
}

// ───────────────────────────── traditions ─────────────────────────────

function checkTradition(t: Tradition, all: Tradition[]): string[] {
  const errors: string[] = [];
  if (!t.name.trim()) errors.push("Name is required.");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.slug)) errors.push("Slug must be lowercase words joined by hyphens.");
  if (!/^\d{3,}$/.test(t.passportNo)) errors.push("Passport number must be at least three digits.");
  if (all.some((x) => x.id !== t.id && x.slug === t.slug)) errors.push("Another passport already uses that slug.");
  if (all.some((x) => x.id !== t.id && x.passportNo === t.passportNo)) errors.push("Another passport already uses that number.");
  if (all.some((x) => x.id !== t.id && x.slugHistory?.includes(t.slug))) errors.push("That slug is reserved by another passport's history.");
  if (t.status === "published") {
    if (!t.summary.trim()) errors.push("A published passport needs a summary.");
    if (!t.claims.length) errors.push("A published passport needs at least one sourced claim.");
  }
  return errors;
}

export async function saveTraditionAction(json: string, summary: string): Promise<ActionResult> {
  const editor = await requireEditor();
  let t: Tradition;
  try {
    t = JSON.parse(json) as Tradition;
  } catch {
    return { ok: false, message: "The passport data could not be read." };
  }
  if (!summary.trim()) return { ok: false, message: "Describe the change in a few words — it goes into the audit log." };
  const archive = await getArchive();
  const before = archive.traditions.find((x) => x.id === t.id);
  // Renames keep the old slug so printed QR codes continue to resolve.
  if (before && before.slug !== t.slug && before.status === "published") {
    t.slugHistory = Array.from(new Set([...(t.slugHistory ?? []), before.slug]));
  }
  const problems = checkTradition(t, archive.traditions);
  const next = { ...archive, traditions: archive.traditions.map((x) => (x.id === t.id ? t : x)) };
  if (!before) next.traditions.push(t);
  problems.push(...validateArchive(next).filter((e) => e.includes(`tradition ${t.slug}`)));
  if (problems.length) return { ok: false, message: problems.join(" ") };
  try {
    const fields = await saveTradition(t, editor.name, summary.trim());
    refresh(t);
    if (before && before.slug !== t.slug) revalidatePath(`/passport/${before.slug}`);
    return { ok: true, message: fields.length ? `Saved. Changed: ${fields.join(", ")}.` : "No changes to save.", fields };
  } catch (e) {
    return { ok: false, message: `Could not save: ${(e as Error).message}` };
  }
}

export async function createTraditionAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const editor = await requireEditor();
  const archive = await getArchive();
  const name = String(form.get("name") ?? "").trim();
  const slug =
    String(form.get("slug") ?? "").trim() ||
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const nextNo = String(Math.max(0, ...archive.traditions.map((t) => Number(t.passportNo))) + 1).padStart(3, "0");
  const collection = String(form.get("collection") ?? "IN");
  const t: Tradition = {
    id: `trad-${randomUUID().slice(0, 8)}`,
    slug,
    passportNo: nextNo,
    status: "draft",
    maturity: "editorial-draft",
    name,
    displayTitle: name,
    tagline: String(form.get("tagline") ?? "").trim(),
    nativeNames: [],
    alternateNames: [],
    category: (String(form.get("category") ?? "handicraft") as Tradition["category"]) || "handicraft",
    techniques: [],
    regionLabel: String(form.get("regionLabel") ?? "").trim(),
    countries: [collection],
    collection,
    places: [],
    communities: [],
    summary: String(form.get("summary") ?? "").trim(),
    intro: "",
    accent: "terracotta",
    motif: "kolhapuri",
    gallery: [],
    periods: [],
    origins: [],
    significance: [],
    makers: { intro: [], materials: [], process: [], practitioners: [], voicesNote: "No interviews have been recorded yet." },
    timeline: [],
    travels: { intro: [], influences: [], cases: [] },
    claims: [],
    keepAlive: { organizations: [], resources: [], collaborationNotes: [] },
    related: [],
    editorial: { lastReviewed: new Date().toISOString().slice(0, 10), reviewedBy: editor.name, notes: "New draft.", openQuestions: [] },
  };
  const problems = checkTradition(t, archive.traditions);
  if (problems.length) return { ok: false, message: problems.join(" ") };
  try {
    await saveTradition(t, editor.name, `Created draft passport No. ${t.passportNo}`);
  } catch (e) {
    return { ok: false, message: `Could not create: ${(e as Error).message}` };
  }
  refresh();
  redirect(`/admin/passports/${t.id}`);
}

// ───────────────────────────── sources & media ─────────────────────────────

export async function saveSourceAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const editor = await requireEditor();
  const s: Source = {
    id: String(form.get("id") ?? "").trim(),
    title: String(form.get("title") ?? "").trim(),
    publisher: String(form.get("publisher") ?? "").trim(),
    author: String(form.get("author") ?? "").trim() || undefined,
    date: String(form.get("date") ?? "").trim() || undefined,
    url: String(form.get("url") ?? "").trim(),
    type: String(form.get("type") ?? "news") as Source["type"],
    accessed: String(form.get("accessed") ?? "").trim() || new Date().toISOString().slice(0, 10),
    notes: String(form.get("notes") ?? "").trim() || undefined,
  };
  if (!/^[a-z0-9][a-z0-9-]*$/.test(s.id)) return { ok: false, message: "ID must be lowercase letters, numbers and hyphens." };
  if (!s.title || !s.publisher) return { ok: false, message: "Title and publisher are required." };
  if (!/^https?:\/\/\S+$/.test(s.url)) return { ok: false, message: "Every source needs a real link (http:// or https://). Placeholder links are not allowed." };
  if (s.date && !/^-?\d{4}(-\d{2}(-\d{2})?)?$/.test(s.date)) return { ok: false, message: "Date must be YYYY, YYYY-MM or YYYY-MM-DD." };
  try {
    await saveSource(s, editor.name);
    refresh();
    return { ok: true, message: `Saved source “${s.title}”.` };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
const LICENSES = ["CC0 1.0", "Public domain", "CC BY 2.0", "CC BY 4.0", "CC BY-SA 3.0", "CC BY-SA 4.0", "Used with written permission"];

export async function uploadMediaAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const editor = await requireEditor();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return { ok: false, message: "Choose an image to upload." };
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { ok: false, message: "Only JPEG, PNG, WebP or AVIF images are accepted." };
  if (file.size > 8 * 1024 * 1024) return { ok: false, message: "Images must be 8 MB or smaller." };
  const license = String(form.get("license") ?? "");
  if (!LICENSES.includes(license)) return { ok: false, message: "Choose the image's licence. Unlicensed images cannot be published." };
  const credit = String(form.get("credit") ?? "").trim();
  const alt = String(form.get("alt") ?? "").trim();
  const caption = String(form.get("caption") ?? "").trim();
  const sourcePage = String(form.get("sourcePage") ?? "").trim();
  if (!credit || !alt || !caption) return { ok: false, message: "Credit, alt text and caption are required." };
  if (!form.get("rights")) return { ok: false, message: "Confirm you have the right to publish this image under that licence." };
  const width = Number(form.get("width")) || 1600;
  const height = Number(form.get("height")) || 1200;
  const id = `upload-${randomUUID().slice(0, 8)}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  let url: string;
  try {
    if (supabaseConfigured()) {
      const client = await sessionClient();
      const objectPath = `${id}.${ext}`;
      const { error } = await client.storage.from("media").upload(objectPath, bytes, { contentType: file.type, upsert: false });
      if (error) return { ok: false, message: `Upload failed: ${error.message}` };
      url = client.storage.from("media").getPublicUrl(objectPath).data.publicUrl;
    } else {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      await fs.writeFile(path.join(UPLOAD_DIR, `${id}.${ext}`), bytes);
      url = `/api/media/${id}.${ext}`;
    }
    const m: MediaAsset = {
      id,
      url,
      width,
      height,
      alt,
      caption,
      credit,
      license,
      sourcePage: sourcePage || url,
      kind: (String(form.get("kind") ?? "photograph") as MediaAsset["kind"]) || "photograph",
      documentary: Boolean(form.get("documentary")),
    };
    await saveMedia(m, editor.name);
  } catch (e) {
    return { ok: false, message: `Upload failed: ${(e as Error).message}` };
  }
  refresh();
  return { ok: true, message: `Uploaded as “${id}”. Attach it to a passport in the editor.` };
}

// ───────────────────────────── review & QR ─────────────────────────────

export async function resolveCorrectionAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireEditor();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as "accepted" | "dismissed";
  const resolution = String(form.get("resolution") ?? "").trim();
  if (!["accepted", "dismissed"].includes(status)) return { ok: false, message: "Choose accept or dismiss." };
  if (resolution.length < 5) return { ok: false, message: "Write a short resolution note." };
  await resolveCorrection(id, status, resolution);
  revalidatePath("/admin/review");
  return { ok: true, message: `Marked as ${status}.` };
}

export async function recordQrAction(traditionId: string, url: string, format: "svg" | "png" | "label") {
  await requireEditor();
  await recordQr(traditionId, url, format);
}
