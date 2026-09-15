import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { departments } from "./departments.$slug";

export const Route = createFileRoute("/departments/")({
  head: () => ({
    meta: [
      { title: "Audit Modules | ALERT Hospital Management System" },
      {
        name: "description",
        content:
          "Hierarchy of the 10 clinical audit modules managed under the Super Admin at ALERT Comprehensive Specialized Hospital.",
      },
      { property: "og:title", content: "Audit Modules | ALERT Hospital Management System" },
      {
        property: "og:description",
        content:
          "Hierarchy of the 10 clinical audit modules managed under the Super Admin at ALERT Comprehensive Specialized Hospital.",
      },
    ],
  }),
  component: DepartmentsPage,
});

function DepartmentsPage() {
  return (
    <DashboardShell>
      <main className="flex-1 space-y-6 p-5 pt-20 lg:pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Audit Modules</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                All 10 audit modules organised under the Super Admin.
              </p>
            </div>
            <Link
              to="/"
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <ArrowLeft className="size-4 text-primary" />
              Back to Dashboard
            </Link>
          </div>

          <section className="card-soft overflow-hidden p-6">
            {/* Root node */}
            <div className="flex flex-col items-center">
              <div
                className="flex items-center gap-3 rounded-2xl px-6 py-4 text-primary-foreground shadow-lg"
                style={{ backgroundImage: "var(--gradient-sidebar)" }}
              >
                <span className="grid size-11 place-items-center rounded-full bg-white/15">
                  <ShieldCheck className="size-6" />
                </span>
                <span className="text-left leading-tight">
                  <span className="block text-base font-semibold">Super Admin</span>
                  <span className="block text-xs opacity-80">Quality &amp; Audit Oversight</span>
                </span>
              </div>

              {/* Trunk */}
              <span className="h-8 w-px bg-border" aria-hidden />
              <span className="h-px w-[85%] bg-border" aria-hidden />
            </div>

            {/* Branches */}
            <ul className="grid gap-4 pt-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {departments.map(({ slug, label, icon: Icon }, i) => (
                <li key={slug} className="flex flex-col items-center">
                  <span className="h-6 w-px bg-border" aria-hidden />
                  <Link
                    to="/departments/$slug"
                    params={{ slug }}
                    className="group w-full rounded-2xl border border-border bg-secondary/35 p-4 transition-all hover:-translate-y-1 hover:border-primary/40 hover:bg-card hover:shadow-[var(--shadow-card)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="size-5" />
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-snug text-foreground">
                      {label}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Open dashboard →</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </main>
    </DashboardShell>
  );
}
