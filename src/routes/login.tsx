import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Lock,
  LogIn,
  User,
  Eye,
  EyeOff,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Building2,
} from "lucide-react";
import logo from "@/assets/alert-logo.png.asset.json";
import { saveDeptSession } from "@/lib/dept-session";
import { saveAuthUser } from "@/lib/auth-session";
import { departments } from "./departments.$slug";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "ALERT Hospital | Quality Management System" },
      {
        name: "description",
        content:
          "Sign in to ALERT Comprehensive Specialized Hospital Quality Management System. Super Admin, Clinical Admin, and Coordinator authentication.",
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
  const [selectedRole, setSelectedRole] = useState<"admin" | "superadmin" | "coordinator">("admin");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin123");
  const [selectedDept, setSelectedDept] = useState("emergency-corridor");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBanned, setIsBanned] = useState(false);

  const showDeptWorkspace =
    selectedRole === "admin" &&
    username.toLowerCase() !== "habtamu" &&
    username.toLowerCase() !== "coordinator";

  const fillCredentials = (
    role: "admin" | "superadmin" | "coordinator",
    u: string,
    p: string,
    dept = "emergency-corridor",
  ) => {
    setSelectedRole(role);
    setUsername(u);
    setPassword(p);
    setSelectedDept(dept);
    setError(null);
    setIsBanned(false);
  };

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

        // Super Administrator -> Central Dashboard
        if (u.role === "superadmin") {
          toast.success(`Welcome back, ${u.name}!`);
          navigate({ to: "/" });
          return;
        }

        // Coordinator -> Coordinators Portal
        if (u.role === "coordinator") {
          toast.success(`Signed in as Coordinator ${u.name}`);
          navigate({ to: "/cordineters" });
          return;
        }

        if (u.role === "qmt") {
          navigate({ to: "/qmt-officer" });
          return;
        }

        // Clinical Admin -> Direct to selected department workspace
        const dept = departments.find((d) => d.slug === selectedDept) || departments[0]!;
        saveDeptSession({
          slug: dept.slug,
          label: dept.label,
        });
        toast.success(`Signed in as ${u.name}. Opening ${dept.label}...`);
        navigate({
          to: "/departments/$slug",
          params: { slug: dept.slug },
        });
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
        <div className="card-soft p-6 sm:p-8 border border-border/80 shadow-lg bg-card">
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
              Sign in with your role credentials and select your department workspace.
            </p>
          </div>

          {/* Quick Demo Credentials helper buttons */}
          <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
              <Sparkles className="size-3.5" />
              <span>Quick Login (Select Role):</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => fillCredentials("admin", "admin", "Admin123", "emergency-corridor")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border ${
                  selectedRole === "admin"
                    ? "bg-primary/15 text-primary border-primary/30 font-semibold shadow-2xs"
                    : "bg-card text-foreground hover:bg-muted border-border"
                }`}
              >
                <span>🛡️ Admin (Emergency Corridor)</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials("superadmin", "habtamu", "Habtamu5645")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border ${
                  selectedRole === "superadmin"
                    ? "bg-primary/15 text-primary border-primary/30 font-semibold shadow-2xs"
                    : "bg-card text-foreground hover:bg-muted border-border"
                }`}
              >
                <span>👑 Superadmin</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials("coordinator", "coordinator", "Coord123")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border ${
                  selectedRole === "coordinator"
                    ? "bg-primary/15 text-primary border-primary/30 font-semibold shadow-2xs"
                    : "bg-card text-foreground hover:bg-muted border-border"
                }`}
              >
                <span>📋 Coordinator</span>
              </button>
            </div>
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
            {/* Department Workspace Selector - Only shown for Clinical Admin */}
            {showDeptWorkspace && (
              <div>
                <label
                  htmlFor="dept-select"
                  className="text-xs font-semibold text-foreground flex items-center justify-between"
                >
                  <span>Department Workspace</span>
                  <span className="text-[11px] font-normal text-primary">Target View</span>
                </label>
                <div className="relative mt-1.5">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    id="dept-select"
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all cursor-pointer font-medium"
                  >
                    {departments.map((d) => (
                      <option key={d.slug} value={d.slug}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Clinical Admin logins will open the selected department workspace directly.
                </p>
              </div>
            )}

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
                    const val = e.target.value;
                    setUsername(val);
                    if (val.toLowerCase() === "habtamu") {
                      setSelectedRole("superadmin");
                    } else if (val.toLowerCase() === "coordinator") {
                      setSelectedRole("coordinator");
                    } else if (val.toLowerCase() === "admin") {
                      setSelectedRole("admin");
                    }
                    setError(null);
                    setIsBanned(false);
                  }}
                  placeholder="admin, habtamu, coordinator..."
                  autoComplete="username"
                  required
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
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
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 shadow-xs mt-2"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <LogIn className="size-4" />
                  <span>Sign In &amp; Open Workspace</span>
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
