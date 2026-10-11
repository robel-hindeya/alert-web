import type { UserAccount, UserRole } from "@/server/db";

const USERS_STORAGE_KEY = "alert_hospital_users";

export const DEFAULT_SUPERADMIN_USER: UserAccount = {
  id: "usr-superadmin-habtamu",
  username: "habtamu",
  email: "habtamu@alert.gov.et",
  displayPassword: "Habtamu5645",
  role: "superadmin",
  name: "Habtamu (Super Administrator)",
  departmentSlug: null,
  departmentLabel: null,
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export function getLocalUsers(): UserAccount[] {
  if (typeof window === "undefined") {
    return [DEFAULT_SUPERADMIN_USER];
  }
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      const init = [DEFAULT_SUPERADMIN_USER];
      window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [DEFAULT_SUPERADMIN_USER];
    }
    // Ensure master superadmin account is always present
    const map = new Map<string, UserAccount>();
    map.set("habtamu", DEFAULT_SUPERADMIN_USER);

    for (const u of parsed) {
      if (
        u &&
        u.username &&
        u.username.toLowerCase() !== "habtamu" &&
        u.id !== "usr-admin-emergency" &&
        u.id !== "usr-coordinator-lead" &&
        u.username.toLowerCase() !== "admin" &&
        u.username.toLowerCase() !== "coordinator"
      ) {
        map.set(u.username.toLowerCase(), u);
      }
    }
    const result = Array.from(map.values());
    if (result.length !== parsed.length) {
      window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(result));
    }
    return result;
  } catch {
    return [DEFAULT_SUPERADMIN_USER];
  }
}

const DELETED_USERS_KEY = "alert_deleted_usernames";

export function getDeletedUsernames(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DELETED_USERS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markUsernameDeleted(username: string): void {
  if (typeof window === "undefined" || !username) return;
  try {
    const set = getDeletedUsernames();
    set.add(username.toLowerCase().trim());
    window.localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export function saveLocalUsers(users: UserAccount[]): void {
  if (typeof window === "undefined") return;
  try {
    const deletedSet = getDeletedUsernames();
    // Ensure Superadmin Habtamu is preserved and deleted accounts are excluded
    const filtered = users.filter(
      (u) => u && u.username && !deletedSet.has(u.username.toLowerCase())
    );
    const hasHabtamu = filtered.some((u) => u.username?.toLowerCase() === "habtamu");
    const safeList = hasHabtamu ? filtered : [DEFAULT_SUPERADMIN_USER, ...filtered];
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(safeList));
    window.dispatchEvent(new Event("alert-users-updated"));
  } catch (err) {
    console.error("Failed to save local users:", err);
  }
}

export function addLocalUser(newUser: UserAccount): UserAccount[] {
  const current = getLocalUsers();
  // If previously deleted, unmark deleted since we are explicitly creating/adding it
  if (typeof window !== "undefined" && newUser.username) {
    try {
      const set = getDeletedUsernames();
      set.delete(newUser.username.toLowerCase().trim());
      window.localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(Array.from(set)));
    } catch {}
  }

  const existingIdx = current.findIndex(
    (u) =>
      u.id === newUser.id ||
      u.username.toLowerCase() === newUser.username.toLowerCase(),
  );

  let updated: UserAccount[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...current[existingIdx], ...newUser };
  } else {
    updated = [newUser, ...current];
  }

  saveLocalUsers(updated);
  return updated;
}

export function updateLocalUser(
  id: string,
  updates: Partial<UserAccount>,
): UserAccount[] {
  const current = getLocalUsers();
  const updated = current.map((u) => (u.id === id ? { ...u, ...updates } : u));
  saveLocalUsers(updated);
  return updated;
}

export function deleteLocalUser(id: string, username?: string): UserAccount[] {
  const current = getLocalUsers();
  const targetUser = current.find(
    (u) => u.id === id || (username && u.username.toLowerCase() === username.toLowerCase()),
  );
  if (targetUser?.username) {
    markUsernameDeleted(targetUser.username);
  }
  if (username) {
    markUsernameDeleted(username);
  }

  const deletedSet = getDeletedUsernames();
  const updated = current.filter(
    (u) =>
      u.id !== id &&
      !deletedSet.has(u.username.toLowerCase()) &&
      (username ? u.username.toLowerCase() !== username.toLowerCase() : true) &&
      u.username.toLowerCase() !== "habtamu" ? true : u.username.toLowerCase() === "habtamu"
  ).filter((u) => u.id !== id && (username ? u.username.toLowerCase() !== username.toLowerCase() : true));

  saveLocalUsers(updated);
  return updated;
}

export function mergeServerAndLocalUsers(
  serverUsers: UserAccount[],
  localUsers: UserAccount[],
): UserAccount[] {
  const deletedSet = getDeletedUsernames();
  const map = new Map<string, UserAccount>();

  // Always keep master superadmin
  map.set("habtamu", DEFAULT_SUPERADMIN_USER);

  // Add local users (skip deleted)
  for (const u of localUsers) {
    if (u && u.username && !deletedSet.has(u.username.toLowerCase())) {
      map.set(u.username.toLowerCase(), u);
    }
  }

  // Add or update with server users (skip deleted)
  for (const u of serverUsers) {
    if (u && u.username && !deletedSet.has(u.username.toLowerCase())) {
      const lower = u.username.toLowerCase();
      const existing = map.get(lower);
      if (existing) {
        map.set(lower, {
          ...existing,
          ...u,
          displayPassword: u.displayPassword || existing.displayPassword,
        });
      } else {
        map.set(lower, u);
      }
    }
  }

  return Array.from(map.values());
}
