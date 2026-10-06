import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Helper to ensure server-side process.env has .env values loaded
function ensureServerEnvLoaded() {
  if (typeof process === "undefined" || !process.cwd) return;
  try {
    // Dynamic import to avoid client bundle issues
    const fs = "node:fs";
    const path = "node:path";
    const fsMod = (globalThis as unknown as { [key: string]: unknown })[fs] || require(fs);
    const pathMod = (globalThis as unknown as { [key: string]: unknown })[path] || require(path);
    const envPath = pathMod.resolve(process.cwd(), ".env");
    if (fsMod.existsSync(envPath)) {
      const content = fsMod.readFileSync(envPath, "utf-8") as string;
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed
            .slice(eqIdx + 1)
            .trim()
            .replace(/^["']|["']$/g, "");
          if (!(key in process.env) || !process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch {
    // Ignore in browser or environments without node filesystem
  }
}
ensureServerEnvLoaded();

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
    getEnvVar("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ||
    getEnvVar("VITE_SUPABASE_PUBLISHABLE_KEY") ||
    getEnvVar("SUPABASE_PUBLISHABLE_KEY") ||
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

// Client for public/browser usage (uses anon / publishable key)
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

// Client for server-side usage (prefers service role key, falls back to anon / publishable key)
let serverClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  ensureServerEnvLoaded();
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();
  const anonKey = getSupabaseAnonKey();
  const key = serviceKey || anonKey;

  if (!url || !key) {
    throw new Error(
      "[Supabase] Configuration missing: Please set VITE_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and VITE_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in your .env file.",
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
