import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Lock,
  LogIn,
  User,
  Eye,
  EyeOff,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import logo from "@/assets/alert-logo.png.asset.json";
import { saveDeptSession } from "@/lib/dept-session";
import { saveAuthUser, useAuthUser } from "@/lib/auth-session";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "ALERT Hospital | Quality Management System" },
      {
        name: "description",
        content:
          "Sign in to ALERT Comprehensive Specialized Hospital Quality Management System. Super Administrator, Admin, and QMT Officer authentication.",
      },
      { property: "og:title", content: "ALERT Hospital | Quality Management System" },
      {
        property: "og:description",
        content: "Sign in to ALERT Comprehensive Specialized Hospital Quality Management System.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, ready } = useAuthUser();

  // Redirect to main website if already authenticated
  useEffect(() => {
    if (ready && user) {
      navigate({ to: "/" });
    }
  }, [ready, user, navigate]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBanned, setIsBanned] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    setError(null);
    setIsBanned(false);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 403 || data?.banned) {
          setIsBanned(true);
          setError(
            data?.error ||
              "This account has been banned by Super Administrator. Access is revoked.",
          );
        } else {
          setError(data?.error || "Invalid username or password.");
        }
        setLoading(false);
        return;
      }

      if (data?.success && data?.user) {
        const u = data.user;
        saveAuthUser(u);

        // Store active department context if user has assigned department
        if (u.departmentSlug) {
          saveDeptSession({
            slug: u.departmentSlug,
            label: u.departmentLabel || u.departmentSlug,
          });
        }

        toast.success(`Welcome back, ${u.name}!`);
        // All roles see the website after identifying / logging in
        navigate({ to: "/" });
        return;
      } else {
        setError("Unexpected response from server.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setError(`Login failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="card-soft p-6 sm:p-8 border border-border/80 shadow-lg bg-card rounded-2xl">
          {/* Hospital Logo */}
          <div className="mx-auto flex justify-center rounded-xl bg-white p-2.5 shadow-xs border border-border/50 max-w-[240px]">
            <img
              src={logo.url || "/alert-logo.png"}
              alt="ALERT Comprehensive Specialized Hospital logo"
              className="h-14 w-auto object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/alert-logo.png";
              }}
            />
          </div>

          <div className="mt-4 text-center">
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Quality Management System
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Sign in with your credentials to access the ALERT hospital portal.
            </p>
          </div>

          {/* Universal Role Indicator */}
          <div className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 py-2 px-3 text-[11px] font-medium text-primary">
            <ShieldCheck className="size-3.5 shrink-0" />
            <span>All Roles Access: Superadmin, Hospital Admin &amp; Coordinators</span>
          </div>

          {/* Banned / Deactivated Alert */}
          {isBanned && (
            <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5 animate-shake">
              <ShieldAlert className="size-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Account Banned / Deactivated</p>
                <p className="text-[11px] leading-relaxed opacity-95">
                  {error ||
                    "This account has been banned by Super Administrator. Please contact Habtamu."}
                </p>
              </div>
            </div>
          )}

          {/* Standard error */}
          {!isBanned && error && (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <ShieldAlert className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="mt-5 space-y-4" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="text-xs font-semibold text-foreground">
                Username
              </label>
              <div className="relative mt-1.5">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                    setIsBanned(false);
                  }}
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold text-foreground">
                  Password
                </label>
              </div>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                    setIsBanned(false);
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 shadow-xs mt-3 cursor-pointer"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <LogIn className="size-4" />
                  <span>Sign In &amp; Open Website</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-border/60 text-center">
            <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
              <CheckCircle2 className="size-3 text-emerald-500" />
              <span>ALERT Comprehensive Specialized Hospital · Security Console</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
