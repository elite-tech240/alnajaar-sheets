import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Read-only public client for server components (no session). */
export function publicClient(): SupabaseClient {
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

let browser: SupabaseClient | null = null;

/** Browser client: keeps the admin session in localStorage. */
export function browserClient(): SupabaseClient {
  if (!browser) browser = createClient(url, key);
  return browser;
}

export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${url}/storage/v1/object/public/product-images/${path}`;
}
