import { useEffect, useState } from "react";
import type { UserRole } from "@/server/db";

const AUTH_STORAGE_KEY = "alert.auth.user";

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  name: string;
  departmentSlug?: string | null;
  departmentLabel?: string | null;
  status: "active" | "banned";
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveAuthUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event("alert-auth-user"));
  } catch (e) {
    console.error("Failed to save auth user:", e);
  }
}

export function clearAuthUser(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem("alert_dept_session");
    window.sessionStorage.clear();
    window.dispatchEvent(new Event("alert-auth-user"));
  } catch (e) {
    console.error("Failed to clear auth user:", e);
  }
}

export function performLogout(): void {
  clearAuthUser();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem("alert_dept_session");
    window.sessionStorage.clear();
    window.location.href = "/login";
  }
}

/**
 * React hook to access current authenticated user and reactive logout handler.
 */
export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setUser(getAuthUser());
    };
    sync();
    setReady(true);

    window.addEventListener("alert-auth-user", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("alert-auth-user", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const logout = () => {
    performLogout();
  };

  return { user, ready, logout };
}
