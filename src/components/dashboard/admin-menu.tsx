import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Settings, LogOut, ChevronDown, ShieldCheck } from "lucide-react";
import { useAuthUser } from "@/lib/auth-session";

export function AdminMenu({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthUser();

  // Strip redundant role suffixes from display name if already present in user.name (e.g. "Habtamu (Super Administrator)")
  const rawName = user?.name || "Habtamu";
  const cleanName = rawName
    .replace(/\s*\((Superadmin|Super Administrator|Admin|Hospital Admin|Administrator)\)/i, "")
    .trim();

  const isSuper = user?.role === "superadmin";
  const displayRole = isSuper
    ? "Super Administrator"
    : user?.role === "admin"
      ? "Hospital Admin"
      : user?.role === "coordinator"
        ? "Clinical Coordinator"
        : user?.role === "qmt"
          ? "QMT Officer"
          : "Administrator";

  const initial = (cleanName || "H").charAt(0).toUpperCase();

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 sm:gap-2 text-sm font-medium text-foreground hover:opacity-85 transition-opacity focus:outline-none"
        aria-label="User account menu"
        title={`${cleanName} (${displayRole})`}
      >
        <div className="size-8 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/25 shadow-2xs">
          {initial}
        </div>
        {!compact && (
          <div className="text-left hidden sm:block">
            <span className="block text-xs font-semibold leading-tight text-foreground truncate max-w-[120px]">
              {cleanName}
            </span>
            <span className="block text-[10px] text-muted-foreground leading-none capitalize">
              {user?.role || "superadmin"}
            </span>
          </div>
        )}
        <ChevronDown
          className={`size-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-xl p-1.5 space-y-1 animate-in fade-in-50 zoom-in-95">
            <div className="px-3 py-2 border-b border-border/60">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold text-foreground truncate">{cleanName}</p>
                {isSuper && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[9px] font-bold uppercase tracking-wider">
                    <ShieldCheck className="size-2.5" />
                    Super
                  </span>
                )}
              </div>
              <p className="text-[11px] text-primary font-medium mt-0.5">{displayRole}</p>
            </div>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="size-4 text-primary" />
              Settings &amp; Role Accounts
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
                window.location.href = "/login";
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
