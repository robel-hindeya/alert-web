import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  UserCheck,
  Building2,
  BarChart3,
  Settings,
  HeartPulse,
  UsersRound,
  X,
} from "lucide-react";
import logo from "@/assets/alert-logo.png.asset.json";

const items: { label: string; icon: LucideIcon; to?: string }[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" as const },
  { label: "Coordinators", icon: UsersRound, to: "/cordineters" as const },
  { label: "QMT Officer", icon: UserCheck, to: "/qmt-officer" as const },
  { label: "Departments", icon: Building2, to: "/departments" as const },
  { label: "Reports", icon: BarChart3, to: "/reports" as const },
  { label: "Settings", icon: Settings, to: "/settings" as const },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export function Sidebar({ mobileOpen, onMobileOpenChange }: SidebarProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = mobileOpen !== undefined ? mobileOpen : internalOpen;
  const setIsOpen = onMobileOpenChange || setInternalOpen;

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [active, setActive] = useState("");

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
      {items.map(({ label, icon: Icon, to }) => {
        const base =
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors";
        const activeCls = "bg-sidebar-primary/90 font-semibold text-sidebar-primary-foreground";
        const idleCls = "text-sidebar-foreground/85 hover:bg-sidebar-accent/50";
        const isActive = to
          ? pathname === to || (to !== "/" && pathname.startsWith(to))
          : active === label;

        if (to) {
          return (
            <Link
              key={label}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className={`${base} ${isActive ? activeCls : idleCls}`}
              onClick={() => setIsOpen(false)}
            >
              <Icon className="size-[18px] shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        }

        return (
          <button
            key={label}
            onClick={() => setActive(label)}
            className={`${base} ${isActive ? activeCls : idleCls}`}
          >
            <Icon className="size-[18px] shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="sidebar-surface fixed inset-y-0 left-0 z-40 hidden w-64 flex-col lg:flex">
        <div className="border-b border-sidebar-border/70 bg-card/90 px-3.5 py-4">
          <Link
            to="/"
            className="group block transition-transform active:scale-98"
            title="ALERT Comprehensive Specialized Hospital"
          >
            <div className="flex items-center justify-center rounded-xl bg-white p-2 shadow-xs border border-border/50 group-hover:border-primary/40 group-hover:shadow-sm transition-all">
              <img
                src={logo.url || "/alert-logo.png"}
                alt="ALERT Comprehensive Specialized Hospital logo"
                className="h-14 w-auto max-w-full object-contain transition-transform group-hover:scale-[1.02]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/alert-logo.png";
                }}
              />
            </div>
          </Link>
        </div>
        {nav}
        <div className="flex items-center gap-3 px-5 py-6 text-sidebar-foreground/80">
          <HeartPulse className="size-6 shrink-0 text-sidebar-primary" />
          <div className="min-w-0 text-xs leading-tight">
            <p className="truncate">Better Care</p>
            <p className="truncate">Healthier Tomorrow</p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden
          />
          <aside className="sidebar-surface absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col shadow-2xl transition-transform">
            <div className="flex items-center justify-between border-b border-sidebar-border/70 bg-card/95 px-4 py-3">
              <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
                <div className="rounded-lg bg-white p-1.5 shadow-xs border border-border/40">
                  <img
                    src={logo.url || "/alert-logo.png"}
                    alt="ALERT Comprehensive Specialized Hospital logo"
                    className="h-9 w-auto max-w-[170px] object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/alert-logo.png";
                    }}
                  />
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid size-9 place-items-center rounded-xl text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            {nav}
            <div className="mt-auto border-t border-sidebar-border flex items-center gap-3 px-5 py-5 text-sidebar-foreground/80">
              <HeartPulse className="size-6 shrink-0 text-sidebar-primary" />
              <div className="min-w-0 text-xs leading-tight">
                <p className="font-semibold text-sidebar-foreground truncate">ALERT Hospital</p>
                <p className="text-[11px] text-sidebar-foreground/70 truncate">
                  Better Care · Healthier Tomorrow
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
