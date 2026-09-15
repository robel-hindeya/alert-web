import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Lock, LogIn, ArrowLeft } from "lucide-react";
import logo from "@/assets/alert-logo.png.asset.json";
import { departments } from "./departments.$slug";
import { saveDeptSession } from "@/lib/dept-session";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Department Login | ALERT Hospital Management System" },
      {
        name: "description",
        content:
          "Sign in to a single department workspace at ALERT Comprehensive Specialized Hospital.",
      },
      { property: "og:title", content: "Department Login | ALERT Hospital Management System" },
      {
        property: "og:description",
        content:
          "Sign in to a single department workspace at ALERT Comprehensive Specialized Hospital.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [slug, setSlug] = useState(departments[0]!.slug);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim().length < 4) {
      setError("Enter a password with at least 4 characters.");
      return;
    }
    const dept = departments.find((d) => d.slug === slug)!;
    saveDeptSession({ slug: dept.slug, label: dept.label });
    navigate({ to: "/departments/$slug", params: { slug: dept.slug } });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="card-soft p-6">
          <img
            src={logo.url}
            alt="ALERT Comprehensive Specialized Hospital logo"
            className="mx-auto h-24 w-auto object-contain"
          />
          <h1 className="mt-4 text-center text-xl font-bold text-foreground">Department Login</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Sign in to open your department workspace.
          </p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div>
              <label htmlFor="dept" className="text-xs font-medium text-foreground">
                Department
              </label>
              <select
                id="dept"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/40"
              >
                {departments.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pw" className="text-xs font-medium text-foreground">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="pw"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="••••••"
                  className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
                />
              </div>
            </div>

            {error && <p className="text-xs font-medium text-destructive">{error}</p>}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <LogIn className="size-4" />
              Sign in
            </button>
          </form>
        </div>

        <Link
          to="/"
          className="mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Admin dashboard
        </Link>
      </div>
    </div>
  );
}
