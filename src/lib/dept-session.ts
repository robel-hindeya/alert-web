import { useEffect, useState } from "react";

const KEY = "alert.dept.session";

export type DeptSession = { slug: string; label: string };

export function readDeptSession(): DeptSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DeptSession) : null;
  } catch {
    return null;
  }
}

export function saveDeptSession(session: DeptSession) {
  window.localStorage.setItem(KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("alert-dept-session"));
}

export function clearDeptSession() {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("alert-dept-session"));
}

/** Client-only session read (null during SSR / first paint). */
export function useDeptSession() {
  const [session, setSession] = useState<DeptSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSession(readDeptSession());
    sync();
    setReady(true);
    window.addEventListener("alert-dept-session", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("alert-dept-session", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { session, ready };
}
