import { getLocalUsers, saveLocalUsers, mergeServerAndLocalUsers } from "./user-store";
import { getAllForms, isLegacySeedId } from "./form-store";
import type { CustomForm, FormResponse } from "./form-types";
import type { UserAccount } from "@/server/db";

const FORMS_STORAGE_KEY = "alert_hospital_forms";
const RESPONSES_STORAGE_KEY = "alert_hospital_form_responses";

export interface DatabaseStatus {
  connected: boolean;
  supabaseUrl: string;
  tables: Record<string, boolean>;
  allTablesReady: boolean;
  message: string;
}

export interface SyncResult {
  success: boolean;
  usersCount: number;
  formsCount: number;
  responsesCount: number;
  message?: string;
}

/**
 * Perform a full two-way synchronization between this browser / PC
 * and the central server / Supabase PostgreSQL database.
 */
export async function syncAllDevicesNow(): Promise<SyncResult> {
  if (typeof window === "undefined") {
    return { success: false, usersCount: 0, formsCount: 0, responsesCount: 0 };
  }

  try {
    const localUsers = getLocalUsers();
    const localForms = getAllForms();

    let localResponses: FormResponse[] = [];
    try {
      const raw = window.localStorage.getItem(RESPONSES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) localResponses = parsed;
      }
    } catch {}

    const payload = {
      users: localUsers,
      forms: localForms,
      responses: localResponses,
    };

    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Sync API responded with status ${res.status}`);
    }

    const data = (await res.json()) as {
      users?: UserAccount[];
      forms?: CustomForm[];
      responses?: FormResponse[];
    };

    // 1. Update Users
    if (Array.isArray(data.users) && data.users.length > 0) {
      const mergedUsers = mergeServerAndLocalUsers(data.users, localUsers);
      saveLocalUsers(mergedUsers);
    }

    // 2. Update Forms
    if (Array.isArray(data.forms)) {
      const formMap = new Map<string, CustomForm>();
      for (const f of data.forms) {
        if (f && f.id && !isLegacySeedId(f.id)) formMap.set(f.id, f);
      }
      for (const f of localForms) {
        if (f && f.id && !isLegacySeedId(f.id) && !formMap.has(f.id)) formMap.set(f.id, f);
      }
      const mergedForms = Array.from(formMap.values());
      window.localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(mergedForms));
      window.dispatchEvent(new Event("alert-forms-updated"));
    }

    // 3. Update Responses
    if (Array.isArray(data.responses)) {
      const respMap = new Map<string, FormResponse>();
      for (const r of data.responses) {
        if (r && r.id && !isLegacySeedId(r.id) && !isLegacySeedId(r.formId)) respMap.set(r.id, r);
      }
      for (const r of localResponses) {
        if (r && r.id && !isLegacySeedId(r.id) && !isLegacySeedId(r.formId) && !respMap.has(r.id)) respMap.set(r.id, r);
      }
      const mergedResponses = Array.from(respMap.values());
      window.localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(mergedResponses));
      window.dispatchEvent(new Event("alert-form-responses-updated"));
    }

    return {
      success: true,
      usersCount: data.users?.length ?? localUsers.length,
      formsCount: data.forms?.length ?? localForms.length,
      responsesCount: data.responses?.length ?? localResponses.length,
      message: "Synchronized successfully across all devices and database.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    console.warn("Cross-device sync error (will continue with local cache):", msg);
    return {
      success: false,
      usersCount: 0,
      formsCount: 0,
      responsesCount: 0,
      message: msg,
    };
  }
}

/**
 * Fetch database connection health and table readiness.
 */
export async function getDatabaseStatus(): Promise<DatabaseStatus | null> {
  try {
    const res = await fetch("/api/database/status");
    if (!res.ok) return null;
    return (await res.json()) as DatabaseStatus;
  } catch {
    return null;
  }
}

/**
 * Fetch the SQL schema to initialize tables in Supabase SQL editor.
 */
export async function getDatabaseSchema(): Promise<string> {
  try {
    const res = await fetch("/api/database/schema");
    if (!res.ok) return "";
    const data = await res.json();
    return data.schema || "";
  } catch {
    return "";
  }
}
