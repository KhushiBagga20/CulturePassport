import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Editor authentication: a passcode from EDITOR_PASSCODE (or the older DEMO_ADMIN_PASSWORD), never
 * hard-coded, exchanged for a signed, httpOnly session cookie that lasts eight hours. If neither
 * variable is set, the editorial desk stays locked. Every write checks this session (requireEditor);
 * the database itself is reachable only from the server.
 */
export interface Editor {
  id: string;
  name: string;
  mode: "passcode";
}

const COOKIE = "cp_editor";
const TTL_SECONDS = 60 * 60 * 8;

const passcode = () => (process.env.EDITOR_PASSCODE ?? process.env.DEMO_ADMIN_PASSWORD)?.trim() || null;

function secret(): string | null {
  const pass = passcode();
  if (!pass) return null;
  return `${pass}::${process.env.EDITOR_SESSION_SECRET ?? process.env.DEMO_SESSION_SECRET ?? "culture-passport-local"}`;
}

function sign(payload: string, key: string) {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function localAdminConfigured() {
  return secret() !== null;
}

export function checkPasscode(input: string): boolean {
  const pass = passcode();
  if (!pass) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(pass);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createLocalSession(name: string) {
  const key = secret();
  if (!key) throw new Error("EDITOR_PASSCODE is not set");
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ name: name.slice(0, 60) || "Editor", exp })).toString("base64url");
  const store = await cookies();
  store.set(COOKIE, `${payload}.${sign(payload, key)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getEditor(): Promise<Editor | null> {
  const key = secret();
  if (!key) return null;
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload, key);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const { name, exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { name: string; exp: number };
    if (exp < Date.now() / 1000) return null;
    return { id: `editor:${name}`, name, mode: "passcode" };
  } catch {
    return null;
  }
}

export async function requireEditor(): Promise<Editor> {
  const e = await getEditor();
  if (!e) throw new Error("Not signed in as an editor");
  return e;
}

/**
 * Guard for editor pages. Call it first in every page under /admin: Next renders layouts and pages
 * in parallel, so a check in the layout alone would still let a page's data stream to the browser.
 */
export async function requireEditorPage(): Promise<Editor> {
  const e = await getEditor();
  if (!e) redirect("/admin/login");
  return e;
}
