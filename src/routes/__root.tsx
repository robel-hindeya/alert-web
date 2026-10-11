import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Root Route Error Boundary:", error);
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  const handleHardReset = () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("alert.auth.user");
        window.sessionStorage.clear();
      }
    } catch {}
    router.invalidate();
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto shadow-xs">
          <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            This page didn't load
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Something went wrong while rendering this page. You can try refreshing or returning to the dashboard.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            Go home
          </a>
          <button
            onClick={handleHardReset}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            Reset Session & Login
          </button>
        </div>

        {error?.message && (
          <div className="pt-2 text-left">
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="text-[11px] text-muted-foreground/80 hover:text-foreground underline underline-offset-2 mx-auto block cursor-pointer"
            >
              {showDetails ? "Hide technical details" : "Show technical details"}
            </button>
            {showDetails && (
              <pre className="mt-2 p-3 text-[11px] bg-muted/60 border border-border/80 rounded-lg text-foreground font-mono overflow-auto max-h-40 whitespace-pre-wrap break-all">
                {error.stack || error.message}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ALERT QMT - Quality Management System" },
      {
        name: "description",
        content: "Quality management dashboard for ALERT Comprehensive Specialized Hospital.",
      },
      { name: "author", content: "ALERT Comprehensive Specialized Hospital" },
      { property: "og:title", content: "ALERT QMT - Quality Management System" },
      {
        property: "og:description",
        content: "Quality management dashboard for ALERT Comprehensive Specialized Hospital.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { Toaster } from "@/components/ui/sonner";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    // Initial sync across devices & PCs
    import("@/lib/sync-engine").then((mod) => {
      mod.syncAllDevicesNow().catch(() => {});
    });

    // Re-sync whenever the user focuses the window
    const handleFocus = () => {
      import("@/lib/sync-engine").then((mod) => {
        mod.syncAllDevicesNow().catch(() => {});
      });
    };
    window.addEventListener("focus", handleFocus);

    // Periodic sync every 45 seconds to keep all PCs unified
    const interval = setInterval(() => {
      import("@/lib/sync-engine").then((mod) => {
        mod.syncAllDevicesNow().catch(() => {});
      });
    }, 45000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
