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

export const DEFAULT_ADMIN_USER: UserAccount = {
  id: "usr-admin-emergency",
  username: "admin",
  email: "admin@alert.gov.et",
  displayPassword: "Admin123",
  role: "admin",
  name: "Emergency Corridor Admin",
  departmentSlug: "emergency-corridor",
  departmentLabel: "Emergency Corridor",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const DEFAULT_COORDINATOR_USER: UserAccount = {
  id: "usr-coordinator-lead",
  username: "coordinator",
  email: "coordinator@alert.gov.et",
  displayPassword: "Coordinator123",
  role: "coordinator",
  name: "Dr. Alem Tesfaye (Clinical Coordinator)",
  departmentSlug: "emergency-corridor",
  departmentLabel: "Emergency Corridor",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export function getLocalUsers(): UserAccount[] {
  if (typeof window === "undefined") {
    return [DEFAULT_SUPERADMIN_USER, DEFAULT_ADMIN_USER, DEFAULT_COORDINATOR_USER];
  }
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      const init = [DEFAULT_SUPERADMIN_USER, DEFAULT_ADMIN_USER, DEFAULT_COORDINATOR_USER];
      window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [DEFAULT_SUPERADMIN_USER, DEFAULT_ADMIN_USER, DEFAULT_COORDINATOR_USER];
    }
    // Ensure default system accounts are always present
    const map = new Map<string, UserAccount>();
    map.set("habtamu", DEFAULT_SUPERADMIN_USER);
    map.set("admin", DEFAULT_ADMIN_USER);
    map.set("coordinator", DEFAULT_COORDINATOR_USER);

    for (const u of parsed) {
      if (u && u.username) {
        map.set(u.username.toLowerCase(), u);
      }
    }
    return Array.from(map.values());
  } catch {
    return [DEFAULT_SUPERADMIN_USER, DEFAULT_ADMIN_USER, DEFAULT_COORDINATOR_USER];
  }
}

export function saveLocalUsers(users: UserAccount[]): void {
  if (typeof window === "undefined") return;
  try {
    // Ensure Superadmin Habtamu is preserved
    const hasHabtamu = users.some((u) => u.username?.toLowerCase() === "habtamu");
    const safeList = hasHabtamu ? users : [DEFAULT_SUPERADMIN_USER, ...users];
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(safeList));
    window.dispatchEvent(new Event("alert-users-updated"));
  } catch (err) {
    console.error("Failed to save local users:", err);
  }
}

export function addLocalUser(newUser: UserAccount): UserAccount[] {
  const current = getLocalUsers();
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

export function deleteLocalUser(id: string): UserAccount[] {
  const current = getLocalUsers();
  const updated = current.filter((u) => u.id !== id && u.username !== "habtamu");
  saveLocalUsers(updated);
  return updated;
}

export function mergeServerAndLocalUsers(
  serverUsers: UserAccount[],
  localUsers: UserAccount[],
): UserAccount[] {
  const map = new Map<string, UserAccount>();

  // Add default system accounts first
  map.set("habtamu", DEFAULT_SUPERADMIN_USER);
  map.set("admin", DEFAULT_ADMIN_USER);
  map.set("coordinator", DEFAULT_COORDINATOR_USER);

  // Add local users
  for (const u of localUsers) {
    if (u && u.username) {
      map.set(u.username.toLowerCase(), u);
    }
  }

  // Add or update with server users
  for (const u of serverUsers) {
    if (u && u.username) {
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
