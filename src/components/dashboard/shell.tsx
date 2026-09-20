import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Repeat, CircleUser } from "lucide-react";
import { Sidebar } from "./sidebar";
import logo from "@/assets/alert-logo.png.asset.json";

export function DashboardShell({
  children,
  bare = false,
}: {
  children: React.ReactNode;
  bare?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  if (bare) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* Mobile / Department Top Bar in bare mode */}
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-card/95 px-3.5 backdrop-blur-sm sm:px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src={logo.url}
              alt="ALERT Hospital Logo"
              className="h-8 w-auto object-contain"
            />
            <div className="min-w-0">
              <span className="block text-xs font-bold leading-tight text-foreground truncate">
                ALERT Hospital
              </span>
              <span className="block text-[10px] text-muted-foreground leading-none truncate">
                Department Workspace
              </span>
            </div>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Repeat className="size-3.5 text-primary" />
            <span className="hidden sm:inline">Switch</span> Dept
          </Link>
        </header>

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        {/* Mobile top bar (sticky on < lg viewports) */}
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-card/95 px-3.5 backdrop-blur-sm sm:px-5 lg:hidden">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid size-9 place-items-center rounded-xl border border-border bg-card text-foreground shadow-xs hover:bg-muted active:scale-95 transition-all"
              aria-label="Open navigation menu"
            >
              <Menu className="size-5 text-foreground" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img
                src={logo.url}
                alt="ALERT Hospital Logo"
                className="h-8 w-auto object-contain"
              />
              <div className="min-w-0">
                <span className="block text-xs font-bold leading-tight text-foreground truncate">
                  ALERT Hospital
                </span>
                <span className="block text-[10px] text-muted-foreground leading-none truncate">
                  Management System
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
              title="Switch to Department Workspace"
            >
              <Repeat className="size-3 text-primary" />
              <span>Dept</span>
            </Link>
            <div className="flex items-center gap-1 text-xs font-medium text-foreground">
              <CircleUser className="size-7 text-primary" />
            </div>
          </div>
        </header>

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
