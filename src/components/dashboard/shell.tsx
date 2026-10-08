import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Sidebar } from "./sidebar";
import { NotificationMenu } from "./notification-menu";
import { AdminMenu } from "./admin-menu";
import { MobileBottomNav } from "./bottom-nav";
import { useAuthUser } from "@/lib/auth-session";
import logo from "@/assets/alert-logo.png.asset.json";

export function DashboardShell({
  children,
  bare = false,
}: {
  children: React.ReactNode;
  bare?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, ready } = useAuthUser();

  useEffect(() => {
    if (ready && !user) {
      navigate({ to: "/login" });
    }
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs font-medium text-muted-foreground">
            Authenticating session...
          </span>
        </div>
      </div>
    );
  }

  if (bare) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* Mobile / Department Top Bar in bare mode */}
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-card/95 px-3.5 backdrop-blur-sm sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-white p-1 border border-border/50 shadow-xs">
              <img
                src={logo.url || "/alert-logo.png"}
                alt="ALERT Hospital Logo"
                className="h-7 w-auto object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/alert-logo.png";
                }}
              />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold leading-tight text-foreground truncate">
                ALERT Hospital
              </span>
              <span className="block text-[10px] text-muted-foreground leading-none truncate">
                Department Workspace
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <NotificationMenu />
            <AdminMenu compact />
          </div>
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
            <Link
              to={(user?.role === "qmt" || user?.role === "coordinator" ? "/coordinators" : "/") as any}
              className="flex items-center gap-2"
            >
              <div className="rounded-lg bg-white p-1 border border-border/50 shadow-xs">
                <img
                  src={logo.url || "/alert-logo.png"}
                  alt="ALERT Hospital Logo"
                  className="h-7 w-auto object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/alert-logo.png";
                  }}
                />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold leading-tight text-foreground truncate">
                  ALERT Hospital
                </span>
                <span className="block text-[10px] text-muted-foreground leading-none truncate">
                  {user?.role === "qmt" || user?.role === "coordinator"
                    ? "Coordinator Portal"
                    : "QMT System"}
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <NotificationMenu />
            <AdminMenu compact />
          </div>
        </header>

        <div className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">{children}</div>

        {/* Phone app bottom navigation bar */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
