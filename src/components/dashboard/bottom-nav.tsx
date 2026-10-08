import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, UserCheck, Building2, BarChart3, Settings, ClipboardCheck } from "lucide-react";
import { useAuthUser } from "@/lib/auth-session";

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuthUser();

  const isQmt = user?.role === "qmt" || user?.role === "coordinator";

  const items = isQmt
    ? [
        { label: "Coordinator Portal", shortLabel: "Portal", icon: ClipboardCheck, to: "/coordinators" as const },
        { label: "Department Audits", shortLabel: "Audits", icon: Building2, to: "/departments" as const },
        { label: "Reports", shortLabel: "Reports", icon: BarChart3, to: "/reports" as const },
        { label: "Profile", shortLabel: "Profile", icon: UserCheck, to: "/coordinators" as const },
      ]
    : [
        { label: "Admin Overview", shortLabel: "Admin", icon: LayoutDashboard, to: "/" as const },
        { label: "Coordinator Portal", shortLabel: "Portal", icon: ClipboardCheck, to: "/coordinators" as const },
        { label: "QMT Audits", shortLabel: "Audits", icon: Building2, to: "/departments" as const },
        { label: "Reports", shortLabel: "Reports", icon: BarChart3, to: "/reports" as const },
        { label: "Settings", shortLabel: "Settings", icon: Settings, to: "/settings" as const },
      ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))]"
    >
      <div className={`grid ${isQmt ? "grid-cols-4" : "grid-cols-5"} gap-1 max-w-md mx-auto`}>
        {items.map(({ label, shortLabel, icon: Icon, to }) => {
          const isActive =
            to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to);

          return (
            <Link
              key={label}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all select-none active:scale-95 ${
                isActive
                  ? "bg-primary/15 text-primary font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`size-5 shrink-0 transition-transform ${isActive ? "scale-110" : ""}`}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-[10px] mt-1 font-semibold tracking-tight leading-none truncate max-w-full">
                {shortLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
