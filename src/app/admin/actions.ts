"use server";

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPasscode, createLocalSession, endSession, localAdminConfigured, requireEditor } from "@/lib/auth";
import { getEditorArchive } from "@/lib/data/archive";
import { recordQr, resolveCorrection, saveCountry, saveMedia, saveSource, saveTradition } from "@/lib/data/mutations";
import { getCandidate, recordDecision } from "@/lib/data/research-store";
import { candidateToDraft, countryRecordFor, slugify } from "@/lib/research";
import { UPLOAD_DIR } from "@/lib/data/local-store";
import { validateArchive } from "@/lib/data/seed";
import { db } from "@/lib/db";
import { useDatabase as dbConfigured, storeMode } from "@/lib/data/store-mode";
import { putFile, UPLOADS_PATH } from "@/lib/data/github-store";
import type { MediaAsset, Source, Tradition } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  message: string;
  fields?: string[];
}

// ───────────────────────────── session ─────────────────────────────

export async function loginAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  if (!localAdminConfigured()) return { ok: false, message: "Set EDITOR_PASSCODE in .env.local to enable the editorial desk." };
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
  const archive = await getEditorArchive();
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
  const archive = await getEditorArchive();
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
  if (file.size > 4 * 1024 * 1024) return { ok: false, message: "Images must be 4 MB or smaller." };
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
    if (dbConfigured()) {
      // Stored in the database and served by /api/media/[file]; no separate file storage needed.
      await db()`insert into media_files (id, content_type, bytes) values (${`${id}.${ext}`}, ${file.type}, ${bytes})`;
      url = `/api/media/${id}.${ext}`;
    } else if (storeMode() === "github") {
      // Committed to the repository and served by /api/media/[file].
      await putFile(`${UPLOADS_PATH}/${id}.${ext}`, bytes, `Editorial desk: uploaded ${id}.${ext} (${editor.name})`);
      url = `/api/media/${id}.${ext}`;
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
  const editor = await requireEditor();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as "accepted" | "dismissed";
  const resolution = String(form.get("resolution") ?? "").trim();
  if (!["accepted", "dismissed"].includes(status)) return { ok: false, message: "Choose accept or dismiss." };
  if (resolution.length < 5) return { ok: false, message: "Write a short resolution note." };
  await resolveCorrection(id, status, resolution, editor.name);
  revalidatePath("/admin/review");
  return { ok: true, message: `Marked as ${status}.` };
}

export async function recordQrAction(traditionId: string, url: string, format: "svg" | "png" | "label") {
  const editor = await requireEditor();
  await recordQr(traditionId, url, format, editor.name);
}

// ───────────────────────────── research queue ─────────────────────────────
// Candidates come from `npm run research`. Nothing here publishes: a candidate can be rejected,
// reopened, or turned into a *draft* passport whose claims are all "Further verification needed".

export async function rejectCandidateAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const editor = await requireEditor();
  const id = String(form.get("id") ?? "");
  const note = String(form.get("note") ?? "").trim();
  try {
    await recordDecision(id, { status: "rejected", reviewedBy: editor.name, note: note || undefined });
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
  revalidatePath("/admin/research");
  return { ok: true, message: "Rejected. A later pipeline run will keep this decision." };
}

export async function reopenCandidateAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const editor = await requireEditor();
  try {
    await recordDecision(String(form.get("id") ?? ""), { status: "new", reviewedBy: editor.name });
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
  revalidatePath("/admin/research");
  return { ok: true, message: "Back in the queue." };
}

export async function addCountryFromCandidateAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const editor = await requireEditor();
  const c = await getCandidate(String(form.get("id") ?? ""));
  if (!c) return { ok: false, message: "Candidate not found." };
  const archive = await getEditorArchive();
  if (archive.countries.some((x) => x.iso2 === c.country.iso2)) return { ok: true, message: `${c.country.name} is already on the atlas.` };
  if (!c.country.centroid) return { ok: false, message: "Wikidata gave no coordinates for this country; it cannot be placed on the globe yet." };
  try {
    await saveCountry(countryRecordFor(c.country), editor.name);
  } catch (e) {
    return { ok: false, message: `Could not add the country: ${(e as Error).message}` };
  }
  refresh();
  return { ok: true, message: `${c.country.name} is now on the atlas as "Stories being documented". Nothing about it is published yet.` };
}

export async function draftFromCandidateAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const editor = await requireEditor();
  const c = await getCandidate(String(form.get("id") ?? ""));
  if (!c) return { ok: false, message: "Candidate not found." };
  if (c.status === "drafted" && c.draftId) redirect(`/admin/passports/${c.draftId}`);
  const archive = await getEditorArchive();
  if (!archive.countries.some((x) => x.iso2 === c.country.iso2)) return { ok: false, message: `Add ${c.country.name} to the atlas first.` };

  let slug = slugify(c.name) || c.wikidataId.toLowerCase();
  const taken = (s: string) => archive.traditions.some((t) => t.slug === s || t.slugHistory?.includes(s));
  for (let n = 2; taken(slug); n++) slug = `${slugify(c.name)}-${n}`;
  const passportNo = String(Math.max(0, ...archive.traditions.map((t) => Number(t.passportNo))) + 1).padStart(3, "0");
  const draft = candidateToDraft(c, { id: `trad-${randomUUID().slice(0, 8)}`, slug, passportNo, editor: editor.name, today: new Date().toISOString().slice(0, 10) });

  const next = {
    ...archive,
    traditions: [...archive.traditions, draft.tradition],
    sources: [...archive.sources.filter((s) => !draft.sources.some((d) => d.id === s.id)), ...draft.sources],
    media: [...archive.media, ...(draft.media ? [draft.media, ...draft.gallery] : [])],
  };
  const problems = [...checkTradition(draft.tradition, archive.traditions), ...validateArchive(next).filter((e) => e.includes(`tradition ${slug}`))];
  if (problems.length) return { ok: false, message: problems.join(" ") };
  try {
    for (const s of draft.sources) await saveSource(s, editor.name);
    if (draft.media) for (const m of [draft.media, ...draft.gallery]) await saveMedia(m, editor.name);
    await saveTradition(draft.tradition, editor.name, `Drafted from research candidate ${c.wikidataId}`);
    await recordDecision(c.id, { status: "drafted", reviewedBy: editor.name, draftId: draft.tradition.id });
  } catch (e) {
    return { ok: false, message: `Could not create the draft: ${(e as Error).message}` };
  }
  refresh();
  redirect(`/admin/passports/${draft.tradition.id}`);
}
