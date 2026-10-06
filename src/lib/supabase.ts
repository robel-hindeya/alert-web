import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getEnvVar(key: string): string {
  // Check import.meta.env (client/Vite)
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
    return String(import.meta.env[key]).trim();
  }
  // Check process.env (Node / Nitro server)
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return String(process.env[key]).trim();
  }
  return "";
}

export function getSupabaseUrl(): string {
  return (
    getEnvVar("VITE_SUPABASE_URL") ||
    getEnvVar("NEXT_PUBLIC_SUPABASE_URL") ||
    getEnvVar("SUPABASE_URL") ||
    ""
  );
}

export function getSupabaseAnonKey(): string {
  return (
    getEnvVar("VITE_SUPABASE_ANON_KEY") ||
    getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    getEnvVar("SUPABASE_ANON_KEY") ||
    ""
  );
}

export function getSupabaseServiceRoleKey(): string {
  return (
    getEnvVar("SUPABASE_SERVICE_ROLE_KEY") ||
    getEnvVar("SUPABASE_SERVICE_KEY") ||
    getEnvVar("SUPABASE_SECRET_KEY") ||
    ""
  );
}

// Client for public/browser usage (uses anon key)
let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return browserClient;
}

// Client for server-side usage (prefers service role key to manage hospital records, falls back to anon key)
let serverClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();
  const anonKey = getSupabaseAnonKey();
  const key = serviceKey || anonKey;

  if (!url || !key) {
    throw new Error(
      "[Supabase] Configuration missing: Please set VITE_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and VITE_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) in your .env file.",
    );
  }

  if (!serverClient) {
    serverClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serverClient;
}
