import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Stethoscope,
  Building2,
  BarChart3,
  Settings,
  HeartPulse,
  Menu,
  X,
  Users,
} from "lucide-react";
import logo from "@/assets/alert-logo.png.asset.json";

const items = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" as const },
  { label: "Doctors", icon: Stethoscope, to: "/doctors" as const },
  { label: "Departments", icon: Building2, to: "/departments" as const },
  { label: "Coordinators", icon: Users, to: "/coordinators" as const },
  { label: "Reports", icon: BarChart3, to: "/reports" as const },
  { label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [active, setActive] = useState("");

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
      {items.map(({ label, icon: Icon, to }) => {
        const base = "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors";
        const activeCls = "bg-sidebar-primary/90 font-semibold text-sidebar-primary-foreground";
        const idleCls = "text-sidebar-foreground/85 hover:bg-sidebar-accent/50";
        const isActive = to ? pathname === to || (to !== "/" && pathname.startsWith(to)) : active === label;

        if (to) {
          return (
            <Link
              key={label}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className={`${base} ${isActive ? activeCls : idleCls}`}
              onClick={() => setMobileOpen(false)}
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
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 grid size-10 place-items-center rounded-xl bg-card text-foreground shadow-md lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      {/* Desktop fixed sidebar */}
      <aside className="sidebar-surface fixed inset-y-0 left-0 z-40 hidden w-64 flex-col lg:flex">
        <div className="bg-card px-4 py-5">
          <img
            src={logo.url}
            alt="ALERT Comprehensive Specialized Hospital logo"
            className="mx-auto h-28 w-auto object-contain"
          />
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

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="sidebar-surface absolute inset-y-0 left-0 flex w-64 flex-col">
            <div className="flex items-center justify-between bg-card px-4 py-5">
              <img
                src={logo.url}
                alt="ALERT Comprehensive Specialized Hospital logo"
                className="h-20 w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="grid size-9 place-items-center rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
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
        </div>
      )}
    </>
  );
}
