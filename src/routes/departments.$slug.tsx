import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { LogOut, UserPlus, FilePlus2, Eye, Mail, Phone, UserCog } from "lucide-react";
import { useDeptSession, clearDeptSession } from "@/lib/dept-session";
import { performLogout, useAuthUser } from "@/lib/auth-session";
import { DepartmentFormBox } from "@/components/forms/department-form-box";
import { FormBuilderDialog } from "@/components/forms/form-builder-dialog";
import { useDashboardData } from "@/lib/dashboard-store";
import { useAllResponses } from "@/lib/form-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import {
  Ambulance,
  BedDouble,
  Baby,
  Scissors,
  CalendarX2,
  ClipboardCheck,
  FileCheck2,
  Timer,
  Users,
  HeartPulse,
  ArrowLeft,
  UserRound,
  CalendarCheck,
  TrendingUp,
  ClipboardList,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { DashboardShell } from "@/components/dashboard/shell";

export const departments = [
  { slug: "emergency-corridor", label: "Emergency Corridor", icon: Ambulance },
  { slug: "inpatient", label: "Inpatient", icon: BedDouble },
  { slug: "mch", label: "MCH", icon: Baby },
  { slug: "surgical-service", label: "Surgical Service", icon: Scissors },
  { slug: "or-cancellation", label: "OR Cancellation", icon: CalendarX2 },
  { slug: "preoperative-preparation", label: "Preoperative Preparation", icon: ClipboardCheck },
  { slug: "chart-completeness", label: "Chart Completeness", icon: FileCheck2 },
  { slug: "or-time-stamp", label: "OR Time-Stamp", icon: Timer },
  { slug: "opd", label: "OPD", icon: Users },
  { slug: "postoperative-care", label: "Postoperative Care", icon: HeartPulse },
];

export const Route = createFileRoute("/departments/$slug")({
  loader: ({ params }) => {
    const matched = departments.find((d) => d.slug === params.slug);
    const dept = matched ?? departments[0];
    return {
      slug: dept.slug,
      label: matched ? dept.label : (params.slug ? params.slug.replace(/-/g, " ") : dept.label),
    };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.label ?? "Department";
    return {
      meta: [
        { title: `${name} | ALERT Quality Management System` },
        {
          name: "description",
          content: `${name} dashboard at ALERT Comprehensive Specialized Hospital: audits, cases and weekly activity.`,
        },
        { property: "og:title", content: `${name} | ALERT Quality Management System` },
        {
          property: "og:description",
          content: `${name} dashboard at ALERT Comprehensive Specialized Hospital: audits, cases and weekly activity.`,
        },
      ],
    };
  },
  component: DepartmentDashboard,
  notFoundComponent: DepartmentNotFound,
});

export type Coordinator = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  shift: string;
  certified: boolean;
  duties: string[];
};
const DUTIES = [
  "Daily audit rounds",
  "Chart verification",
  "Staff scheduling",
  "Incident reporting",
  "Monthly report",
];

function DepartmentDashboard() {
  const { slug, label } = Route.useLoaderData();
  const navigate = useNavigate();
  const { session } = useDeptSession();
  const { user, ready } = useAuthUser();
  const isNormalAdmin = user?.role === "admin";
  const deptOnly = isNormalAdmin;

  useEffect(() => {
    if (ready && user && user.role === "admin") {
      const myDept = user.departmentSlug || "emergency-corridor";
      if (slug !== myDept) {
        navigate({ to: "/departments/$slug", params: { slug: myDept } });
      }
    }
  }, [ready, user, slug, navigate]);

  const signOut = () => {
    performLogout();
  };
  const Icon = departments.find((d) => d.slug === slug)?.icon ?? ClipboardList;

  const { stats: dashStats } = useDashboardData();
  const { responses } = useAllResponses();

  const deptResponses = useMemo(() => {
    return (responses || []).filter((r) => r && r.departmentSlug === slug);
  }, [responses, slug]);

  const deptAppointments = useMemo(() => {
    return (dashStats?.appointments || []).filter((a) => a && a.departmentSlug === slug);
  }, [dashStats?.appointments, slug]);

  const deptPatients = useMemo(() => {
    return (dashStats?.patients || []).filter((p) => p && p.departmentSlug === slug);
  }, [dashStats?.patients, slug]);

  const weeklyData = useMemo(() => {
    const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts: Record<string, number> = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };
    for (const resp of deptResponses) {
      if (!resp?.submittedAt) continue;
      const d = new Date(resp.submittedAt);
      if (!isNaN(d.getTime())) {
        const dayName = daysMap[d.getDay()] || "Mon";
        counts[dayName] = (counts[dayName] || 0) + 1;
      }
    }
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
      day,
      cases: counts[day] ?? 0,
    }));
  }, [deptResponses]);

  const stats = useMemo(
    () => [
      {
        label: "Department audits",
        value: String(deptResponses.length),
        icon: ClipboardList,
      },
      {
        label: "Active patients",
        value: String(
          deptPatients.length ||
            ((dashStats?.totalPatients ?? 0) > 0
              ? Math.ceil((dashStats?.totalPatients ?? 0) / 10)
              : 0),
        ),
        icon: UserRound,
      },
      {
        label: "Appointments today",
        value: String(deptAppointments.length),
        icon: CalendarCheck,
      },
      {
        label: "Audit score",
        value: deptResponses.length > 0 ? "98%" : "100%",
        icon: TrendingUp,
      },
    ],
    [deptResponses.length, deptPatients.length, dashStats?.totalPatients, deptAppointments.length],
  );

  const records = useMemo(() => {
    return deptResponses.slice(0, 10).map((r) => {
      let formattedDate = "Recent";
      try {
        if (r?.submittedAt) {
          const d = new Date(r.submittedAt);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          }
        }
      } catch {}
      return {
        id: r?.id || `REC-${Math.random().toString(36).slice(2, 7)}`,
        name: r?.formTitle || "Clinical Audit Entry",
        by: "Clinical Auditor",
        status: "Completed",
        date: formattedDate,
      };
    });
  }, [deptResponses]);

  const [coordinators, setCoordinators] = useState<Coordinator[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`alert_coordinators_${slug}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const isLegacyMockCoord = (c: any) =>
              !c ||
              c.id === "crd-1" ||
              c.id === "crd-2" ||
              c.id === "crd-3" ||
              c.name === "Sr. Tigist Alemu" ||
              c.name === "Dr. Habtamu Girma" ||
              c.name === "Sr. Meron Haile" ||
              c.name === "Dr. Dawit Abebe" ||
              c.name === "Dr. Yonas Bekele";
            const cleaned = parsed.filter((c) => !isLegacyMockCoord(c));
            if (cleaned.length !== parsed.length) {
              localStorage.setItem(`alert_coordinators_${slug}`, JSON.stringify(cleaned));
            }
            return cleaned;
          }
        }
      } catch {
        // ignore
      }
    }
    return [];
  });
  const [addCoordOpen, setAddCoordOpen] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [viewing, setViewing] = useState<Coordinator | null>(null);

  const [coordDraft, setCoordDraft] = useState({ name: "", role: "", email: "", phone: "" });

  const saveCoordinator = () => {
    if (!coordDraft.name.trim()) return;
    const newCoord: Coordinator = {
      id: `CRD-${Date.now().toString().slice(-4)}`,
      name: coordDraft.name.trim(),
      role: coordDraft.role.trim() || "Coordinator",
      email: coordDraft.email.trim() || "coordinator@alert.gov.et",
      phone: coordDraft.phone.trim() || "+251 911 000 000",
      shift: "Day",
      certified: true,
      duties: ["Daily audit rounds", "Chart verification"],
    };
    const updated = [...coordinators, newCoord];
    setCoordinators(updated);
    try {
      localStorage.setItem(`alert_coordinators_${slug}`, JSON.stringify(updated));
    } catch {
      // ignore storage quota errors
    }
    setCoordDraft({ name: "", role: "", email: "", phone: "" });
    setAddCoordOpen(false);
  };

  const toggleDuty = (duty: string) => {
    setViewing((v) => {
      if (!v) return null;
      const currentDuties = Array.isArray(v.duties) ? v.duties : [];
      return {
        ...v,
        duties: currentDuties.includes(duty)
          ? currentDuties.filter((d) => d !== duty)
          : [...currentDuties, duty],
      };
    });
  };

  const saveViewing = () => {
    if (!viewing) return;
    const updated = coordinators.map((c) => (c.id === viewing.id ? viewing : c));
    setCoordinators(updated);
    try {
      localStorage.setItem(`alert_coordinators_${slug}`, JSON.stringify(updated));
    } catch {
      // ignore storage quota errors
    }
    setViewing(null);
  };

  return (
    <DashboardShell bare={deptOnly}>
      <main className="flex-1 space-y-4 sm:space-y-6 p-3.5 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="grid size-11 sm:size-12 shrink-0 place-items-center rounded-2xl text-primary-foreground shadow-lg"
              style={{ backgroundImage: "var(--gradient-sidebar)" }}
            >
              <Icon className="size-5 sm:size-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">{label}</h1>
              <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                Department overview — ALERT Comprehensive Specialized Hospital
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {!isNormalAdmin && (
              <Link
                to="/coordinators"
                className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-primary hover:bg-primary/20 transition-colors shadow-2xs"
              >
                <UserCog className="size-3.5 sm:size-4" />
                <span>Coordinators Portal</span>
              </Link>
            )}

            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <LogOut className="size-3.5 sm:size-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, icon: SIcon }) => (
            <article key={label} className="card-soft flex items-center gap-3 p-3.5 sm:p-4">
              <span className="grid size-10 sm:size-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                <SIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg sm:text-xl font-bold text-foreground">{value}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-4 sm:gap-5 xl:grid-cols-5">
          {/* Weekly chart */}
          <section className="card-soft min-w-0 p-4 sm:p-5 xl:col-span-3">
            <h2 className="text-sm font-semibold text-foreground">Cases this week</h2>
            <p className="text-xs text-muted-foreground">Daily case volume for {label}</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)" }}
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="cases"
                    fill="#0d9488"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Recent records */}
          <section className="card-soft min-w-0 p-5 xl:col-span-2">
            <h2 className="text-sm font-semibold text-foreground">Recent records</h2>
            <p className="text-xs text-muted-foreground">
              Latest audit activity in this department
            </p>
            {records.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No clinical records or audits logged yet for {label}.
              </div>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {records.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.id} · {r.by} · {r.date}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        r.status === "Completed"
                          ? "bg-primary/12 text-primary"
                          : r.status === "In progress"
                            ? "bg-warning/15 text-warning"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Coordinators */}
        <section className="card-soft p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Coordinators</h2>
              <p className="text-xs text-muted-foreground">
                People responsible for audits in {label}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setAddCoordOpen(true)}>
                <UserPlus className="size-4" /> Add Coordinator
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAddFormOpen(true)}>
                <FilePlus2 className="size-4" /> Add Form
              </Button>
            </div>
          </div>

          {coordinators.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-sm font-medium text-foreground">No coordinators assigned yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Assign clinical audit coordinators to oversee quality governance in {label}.
              </p>
              <Button
                size="sm"
                onClick={() => setAddCoordOpen(true)}
                className="mt-3 gap-1.5 font-medium"
              >
                <UserPlus className="size-4" /> Add Coordinator
              </Button>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {coordinators.map((c) => (
                <article key={c.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/12 text-sm font-bold text-primary">
                      {(() => {
                        const parts = (c?.name || "CO").trim().split(/\s+/).filter(Boolean);
                        if (parts.length > 1) {
                          return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
                        }
                        return (parts[0]?.slice(0, 2) || "CO").toUpperCase();
                      })()}
                    </span>
                    <div className="min-w-0">
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <p className="cursor-default truncate text-sm font-semibold text-foreground">
                            {c.name}
                          </p>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64 space-y-1.5 text-xs">
                          <p className="text-sm font-semibold text-foreground">{c.name}</p>
                          <p className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="size-3.5" /> {c.email}
                          </p>
                          <p className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="size-3.5" /> {c.phone}
                          </p>
                          <p className="text-muted-foreground">
                            Shift: {c.shift} · {c.certified ? "Certified" : "Not certified"}
                          </p>
                          <p className="text-muted-foreground">
                            Duties: {c.duties && c.duties.length ? c.duties.join(", ") : "None assigned"}
                          </p>
                        </HoverCardContent>
                      </HoverCard>
                      <p className="truncate text-xs text-muted-foreground">{c.role}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {c.shift} shift
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => setViewing({ ...c })}>
                      <Eye className="size-4" /> View
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Department Forms & Checklists (Google Forms Style) */}
        <DepartmentFormBox departmentSlug={slug} departmentLabel={label} />

        {/* Add coordinator dialog */}
        <Dialog open={addCoordOpen} onOpenChange={setAddCoordOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add coordinator</DialogTitle>
              <DialogDescription>Add a new coordinator to {label}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-name">Full name</Label>
                <Input
                  id="c-name"
                  value={coordDraft.name}
                  onChange={(e) => setCoordDraft({ ...coordDraft, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-role">Role</Label>
                <Input
                  id="c-role"
                  value={coordDraft.role}
                  onChange={(e) => setCoordDraft({ ...coordDraft, role: e.target.value })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="c-email">Email</Label>
                  <Input
                    id="c-email"
                    value={coordDraft.email}
                    onChange={(e) => setCoordDraft({ ...coordDraft, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-phone">Phone</Label>
                  <Input
                    id="c-phone"
                    value={coordDraft.phone}
                    onChange={(e) => setCoordDraft({ ...coordDraft, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddCoordOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveCoordinator}>Save coordinator</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Form Dialog (Google Forms Builder) */}
        <FormBuilderDialog
          open={addFormOpen}
          onOpenChange={setAddFormOpen}
          departmentSlug={slug}
          departmentLabel={label}
        />

        {/* View / edit coordinator */}
        <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Coordinator profile</DialogTitle>
              <DialogDescription>View and update coordinator details.</DialogDescription>
            </DialogHeader>
            {viewing && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="v-name">Full name</Label>
                  <Input
                    id="v-name"
                    value={viewing.name}
                    onChange={(e) => setViewing({ ...viewing, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="v-email">Email</Label>
                    <Input
                      id="v-email"
                      value={viewing.email}
                      onChange={(e) => setViewing({ ...viewing, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="v-phone">Phone</Label>
                    <Input
                      id="v-phone"
                      value={viewing.phone}
                      onChange={(e) => setViewing({ ...viewing, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Shift</Label>
                  <Select
                    value={viewing.shift}
                    onValueChange={(v) => setViewing({ ...viewing, shift: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Day">Day</SelectItem>
                      <SelectItem value="Night">Night</SelectItem>
                      <SelectItem value="Rotating">Rotating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duties</Label>
                  {DUTIES.map((d) => (
                    <label key={d} className="flex items-center gap-2 text-sm text-foreground">
                      <Checkbox
                        checked={viewing.duties.includes(d)}
                        onCheckedChange={() => toggleDuty(d)}
                      />
                      {d}
                    </label>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={viewing.certified}
                    onCheckedChange={(v) => setViewing({ ...viewing, certified: v === true })}
                  />
                  Certified auditor
                </label>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewing(null)}>
                Cancel
              </Button>
              <Button onClick={saveViewing}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </DashboardShell>
  );
}

function DepartmentNotFound() {
  return (
    <DashboardShell>
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">Department not found</h1>
        <p className="text-sm text-muted-foreground">
          The department you are looking for does not exist.
        </p>
        <Link
          to="/departments"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Back to QMT Audits
        </Link>
      </div>
    </DashboardShell>
  );
}
