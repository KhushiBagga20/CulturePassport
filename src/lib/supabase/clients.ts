import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Only the public URL and the anon/publishable key are used by this app.
 * Row-level security (supabase/migrations/0002_policies.sql) decides what each request may do;
 * a service-role key is never read, so it cannot leak to the browser.
 */
export function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  return url && key ? { url, key } : null;
}

export const supabaseConfigured = () => supabaseEnv() !== null;

/** Anonymous client: sees published content only. Safe during static generation. */
export function publicClient(): SupabaseClient {
  const env = supabaseEnv();
  if (!env) throw new Error("Supabase is not configured");
  return createClient(env.url, env.key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Cookie-bound client for the signed-in editor (server components, actions, route handlers). */
export async function sessionClient(): Promise<SupabaseClient> {
  const env = supabaseEnv();
  if (!env) throw new Error("Supabase is not configured");
  const store = await cookies();
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a server component, where cookies are read-only; proxy.ts refreshes them.
        }
      },
    },
  });
}
