import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Lock,
  LogIn,
  User,
  Eye,
  EyeOff,
  ShieldAlert,
  CheckCircle2,
  Building2,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import logo from "@/assets/alert-logo.png.asset.json";
import { saveDeptSession } from "@/lib/dept-session";
import { saveAuthUser, useAuthUser } from "@/lib/auth-session";
import { departments } from "./departments.$slug";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "ALERT Hospital | Quality Management System" },
      {
        name: "description",
        content:
          "Sign in to ALERT Comprehensive Specialized Hospital Quality Management System. Direct portal access for Admin, Superadmin, and QMT Officer.",
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

export type LoginRole = "admin" | "superadmin" | "qmtofficer";

export function LoginPage() {
  const navigate = useNavigate();
  const { user, ready } = useAuthUser();

  // Redirect to role workspace if already authenticated
  useEffect(() => {
    if (ready && user) {
      if (user.role === "admin") {
        const targetSlug = user.departmentSlug || "emergency-corridor";
        navigate({ to: "/departments/$slug", params: { slug: targetSlug } });
      } else if (user.role === "qmt" || user.role === "coordinator") {
        navigate({ to: "/coordinators" });
      } else {
        navigate({ to: "/" });
      }
    }
  }, [ready, user, navigate]);

  const [selectedRole, setSelectedRole] = useState<LoginRole>("admin");
  const [username, setUsername] = useState(""); // Kept completely empty - no prefilled value in box
  const [password, setPassword] = useState(""); // Kept completely empty - no prefilled password in box
  const [selectedDept, setSelectedDept] = useState("emergency-corridor");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBanned, setIsBanned] = useState(false);

  const handleSelectRole = (role: LoginRole) => {
    setSelectedRole(role);
    setError(null);
    setIsBanned(false);
    // Keep username and password input boxes completely empty ("remove in the box value")
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsBanned(false);

    try {
      // Determine target user based on input or selected role
      let targetUser = username.trim();
      let effectivePassword = password;

      if (!targetUser) {
        if (selectedRole === "superadmin") {
          targetUser = "habtamu";
        } else if (selectedRole === "qmtofficer") {
          targetUser = "qmtofficer";
        } else {
          targetUser = "admin";
        }
      }

      const trimmedLower = targetUser.toLowerCase();

      // Auto-fallback password for rapid one-click testing without cluttering input box
      if (!effectivePassword) {
        if (trimmedLower === "habtamu" || trimmedLower === "superadmin") {
          effectivePassword = "Habtamu5645";
        } else if (trimmedLower === "admin") {
          effectivePassword = "Admin123";
        } else if (
          trimmedLower === "coordinator" ||
          trimmedLower === "cordineter" ||
          trimmedLower === "qmtofficer" ||
          trimmedLower === "qmt"
        ) {
          effectivePassword = "Coordinator123";
        } else {
          effectivePassword = "password123";
        }
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: targetUser,
          password: effectivePassword,
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
          setError(data?.error || "Invalid username, email, or password.");
        }
        setLoading(false);
        return;
      }

      if (data?.success && data?.user) {
        const u = data.user;
        saveAuthUser(u);

        // Store active department context if selected
        const deptSlug =
          selectedRole === "admin"
            ? selectedDept
            : u.departmentSlug || selectedDept || "emergency-corridor";
        const dept = departments.find((d) => d.slug === deptSlug);
        if (dept) {
          saveDeptSession({
            slug: dept.slug,
            label: dept.label,
          });
        }

        toast.success(`Welcome back, ${u.name}!`);

        // Routing:
        // Admin -> Chosen Department page (/departments/$slug) - NOT superadmin dashboard
        // QMT Officer & Coordinator -> Coordinator Page (/coordinators)
        // Superadmin -> Super Administrator Dashboard (/)
        if (selectedRole === "admin" || u.role === "admin") {
          navigate({
            to: "/departments/$slug",
            params: { slug: deptSlug },
          });
        } else if (
          selectedRole === "qmtofficer" ||
          u.role === "qmt" ||
          u.role === "coordinator"
        ) {
          navigate({ to: "/coordinators" });
        } else {
          navigate({ to: "/" });
        }
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
      <div className="w-full max-w-lg">
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
              Sign in with your hospital credentials or select your role.
            </p>
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
            {/* 3 Role Selection: admin, superadmin, qmtofficer */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">
                Select Account Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* Admin Button */}
                <button
                  type="button"
                  id="role-btn-admin"
                  onClick={() => handleSelectRole("admin")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer text-center ${
                    selectedRole === "admin"
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/40 font-bold shadow-xs"
                      : "border-border bg-background hover:bg-secondary/60 text-muted-foreground hover:text-foreground font-medium"
                  }`}
                >
                  <Building2
                    className={`size-5 mb-1 ${
                      selectedRole === "admin" ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span className="text-xs">admin</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 font-normal">
                    Clinical Admin
                  </span>
                </button>

                {/* Superadmin Button */}
                <button
                  type="button"
                  id="role-btn-superadmin"
                  onClick={() => handleSelectRole("superadmin")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer text-center ${
                    selectedRole === "superadmin"
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/40 font-bold shadow-xs"
                      : "border-border bg-background hover:bg-secondary/60 text-muted-foreground hover:text-foreground font-medium"
                  }`}
                >
                  <ShieldCheck
                    className={`size-5 mb-1 ${
                      selectedRole === "superadmin" ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span className="text-xs">superadmin</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 font-normal">
                    System Master
                  </span>
                </button>

                {/* QMT Officer Button */}
                <button
                  type="button"
                  id="role-btn-qmtofficer"
                  onClick={() => handleSelectRole("qmtofficer")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer text-center ${
                    selectedRole === "qmtofficer"
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/40 font-bold shadow-xs"
                      : "border-border bg-background hover:bg-secondary/60 text-muted-foreground hover:text-foreground font-medium"
                  }`}
                >
                  <UserCog
                    className={`size-5 mb-1 ${
                      selectedRole === "qmtofficer" ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span className="text-xs">qmtofficer</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 font-normal">
                    QMT Officer
                  </span>
                </button>
              </div>
            </div>

            {/* In Admin: Choose Department */}
            {selectedRole === "admin" && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label
                  htmlFor="dept-select"
                  className="text-xs font-semibold text-foreground flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-primary" />
                    Choose Department
                  </span>
                  <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    Admin Workspace
                  </span>
                </label>
                <div className="relative">
                  <select
                    id="dept-select"
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all cursor-pointer font-medium"
                  >
                    {departments.map((d) => (
                      <option key={d.slug} value={d.slug}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Username input box - Empty by default */}
            <div>
              <label htmlFor="username" className="text-xs font-semibold text-foreground">
                Username or Email
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
                  placeholder={
                    selectedRole === "admin"
                      ? "Enter admin username (or leave empty)"
                      : selectedRole === "superadmin"
                      ? "Enter superadmin username (or leave empty)"
                      : "Enter qmtofficer username (or leave empty)"
                  }
                  autoComplete="username"
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
                />
              </div>
            </div>

            {/* Password input box - Empty by default */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold text-foreground">
                  Password
                </label>
                <span className="text-[11px] text-muted-foreground font-normal">
                  Optional (Leave empty to sign in)
                </span>
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
                  placeholder="Enter password (or leave empty)"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
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
                <span>Signing in...</span>
              ) : (
                <>
                  <LogIn className="size-4" />
                  <span>
                    Sign In as{" "}
                    {selectedRole === "admin"
                      ? "Admin"
                      : selectedRole === "superadmin"
                      ? "Superadmin"
                      : "QMT Officer"}
                  </span>
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
