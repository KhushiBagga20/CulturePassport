import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { sessionClient, supabaseConfigured } from "./supabase/clients";

/**
 * Editor authentication.
 *  - Supabase mode: Supabase Auth session + membership in the `editors` table (enforced again by RLS).
 *  - Local demo mode: a passcode from DEMO_ADMIN_PASSWORD (never hard-coded), exchanged for a
 *    signed, httpOnly session cookie. If the variable is unset, the editorial desk stays locked.
 */
export interface Editor {
  id: string;
  name: string;
  mode: "supabase" | "local";
}

const COOKIE = "cp_editor";
const TTL_SECONDS = 60 * 60 * 8;

function secret(): string | null {
  const pass = process.env.DEMO_ADMIN_PASSWORD?.trim();
  if (!pass) return null;
  return `${pass}::${process.env.DEMO_SESSION_SECRET ?? "culture-passport-local"}`;
}

function sign(payload: string, key: string) {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function localAdminConfigured() {
  return secret() !== null;
}

export function checkPasscode(input: string): boolean {
  const pass = process.env.DEMO_ADMIN_PASSWORD?.trim();
  if (!pass) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(pass);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createLocalSession(name: string) {
  const key = secret();
  if (!key) throw new Error("DEMO_ADMIN_PASSWORD is not set");
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
  if (supabaseConfigured()) await (await sessionClient()).auth.signOut();
}

export async function getEditor(): Promise<Editor | null> {
  if (supabaseConfigured()) {
    const client = await sessionClient();
    const { data } = await client.auth.getUser();
    if (!data.user) return null;
    const { data: row } = await client.from("editors").select("user_id").eq("user_id", data.user.id).maybeSingle();
    if (!row) return null;
    return { id: data.user.id, name: data.user.email ?? "Editor", mode: "supabase" };
  }
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
    return { id: `local:${name}`, name, mode: "local" };
  } catch {
    return null;
  }
}

export async function requireEditor(): Promise<Editor> {
  const e = await getEditor();
  if (!e) throw new Error("Not signed in as an editor");
  return e;
}
