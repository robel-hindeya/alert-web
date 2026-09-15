import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { LogOut, UserPlus, FilePlus2, Eye, Mail, Phone } from "lucide-react";
import { useDeptSession, clearDeptSession } from "@/lib/dept-session";
import { saveCustomDepartmentForm } from "@/lib/form-store";
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
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
    const dept = departments.find((d) => d.slug === params.slug);
    if (!dept) throw notFound();
    return { slug: dept.slug, label: dept.label };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.label ?? "Department";
    return {
      meta: [
        { title: `${name} | ALERT Hospital Management System` },
        {
          name: "description",
          content: `${name} dashboard at ALERT Comprehensive Specialized Hospital: audits, cases and weekly activity.`,
        },
        { property: "og:title", content: `${name} | ALERT Hospital Management System` },
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

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

export type DeptForm = {
  id: string;
  title: string;
  type: string;
  notes?: string | undefined;
  departmentSlug?: string | undefined;
};

export const DUTIES = [
  "Daily audit rounds",
  "Chart verification",
  "Staff scheduling",
  "Incident reporting",
  "Monthly report",
];

const FIRST_NAMES = [
  "Dr. Alem Tesfaye",
  "Nurse Sara Mekonnen",
  "Dr. Yonas Girma",
  "Nurse Betel Assefa",
];

function initialCoordinators(slug: string, base: number): Coordinator[] {
  return FIRST_NAMES.slice(0, 3).map((name, i) => ({
    id: `CRD-${base}${i + 1}`,
    name,
    role: i === 0 ? "Lead Coordinator" : "Coordinator",
    email: `${name.split(" ").pop()!.toLowerCase()}@alert.gov.et`,
    phone: `+251 911 ${100 + ((base + i) % 800)} ${10 + ((base + i) % 80)}`,
    shift: i % 2 === 0 ? "Day" : "Night",
    certified: i !== 2,
    duties: DUTIES.slice(0, (i % 3) + 1),
  }));
}

function initialForms(base: number, slug?: string): DeptForm[] {
  const list: DeptForm[] = [
    { id: `FRM-${base}1`, title: "Daily audit checklist", type: "Checklist", departmentSlug: slug },
    { id: `FRM-${base}2`, title: "Incident report", type: "Report", departmentSlug: slug },
    { id: `FRM-${base}3`, title: "Patient consent", type: "Consent", departmentSlug: slug },
  ];
  if (slug === "emergency-corridor") {
    list.push(
      {
        id: "emergency-triage-assessment",
        title: "Emergency Corridor Triage & Assessment Form",
        type: "Assessment",
        departmentSlug: slug,
      },
      {
        id: "corridor-handover-checklist",
        title: "Corridor Bed Handover & Safety Checklist",
        type: "Checklist",
        departmentSlug: slug,
      },
    );
  }
  return list;
}

function getStoredDepartmentForms(slug: string, base: number): DeptForm[] {
  const defaults = initialForms(base, slug);
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(`alert_dept_forms_${slug}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const ids = new Set(parsed.map((p: DeptForm) => p.id));
        const merged = [...parsed];
        for (const item of defaults) {
          if (!ids.has(item.id)) {
            merged.push(item);
          }
        }
        return merged;
      }
    }
  } catch {
    // ignore
  }
  return defaults;
}

// Deterministic mock data per department
function seed(slug: string, salt: number) {
  let h = salt;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) % 997;
  return h;
}

function weeklyCases(slug: string) {
  return days.map((d, i) => ({
    day: d,
    cases: 8 + ((seed(slug, i + 3) * (i + 2)) % 22),
  }));
}

function DepartmentDashboard() {
  const { slug, label } = Route.useLoaderData();
  const navigate = useNavigate();
  const { session } = useDeptSession();
  const deptOnly = session?.slug === slug;

  const signOut = () => {
    clearDeptSession();
    navigate({ to: "/login" });
  };
  const Icon = departments.find((d) => d.slug === slug)?.icon ?? ClipboardList;
  const data = weeklyCases(slug);
  const total = data.reduce((s, d) => s + d.cases, 0);
  const base = seed(slug, 7);

  const stats = [
    { label: "Cases this week", value: String(total), icon: ClipboardList },
    { label: "Active patients", value: String(12 + (base % 26)), icon: UserRound },
    { label: "Appointments today", value: String(4 + (base % 12)), icon: CalendarCheck },
    { label: "Audit score", value: `${82 + (base % 15)}%`, icon: TrendingUp },
  ];

  const records = [
    { id: `AUD-${base}01`, name: "Routine audit", by: "Dr. Alem T.", status: "Completed", date: "Sep 8, 2026" },
    { id: `AUD-${base}02`, name: "Chart review", by: "Nurse Sara M.", status: "In progress", date: "Sep 9, 2026" },
    { id: `AUD-${base}03`, name: "Case follow-up", by: "Dr. Yonas G.", status: "Completed", date: "Sep 9, 2026" },
    { id: `AUD-${base}04`, name: "Safety checklist", by: "Dr. Hana K.", status: "Pending", date: "Sep 10, 2026" },
    { id: `AUD-${base}05`, name: "Discharge review", by: "Nurse Betel A.", status: "In progress", date: "Sep 10, 2026" },
  ];

  const [coordinators, setCoordinators] = useState<Coordinator[]>(() =>
    initialCoordinators(slug, base),
  );
  const [forms, setForms] = useState<DeptForm[]>(() =>
    getStoredDepartmentForms(slug, base),
  );
  const [addCoordOpen, setAddCoordOpen] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [viewing, setViewing] = useState<Coordinator | null>(null);

  const [coordDraft, setCoordDraft] = useState({ name: "", role: "", email: "", phone: "" });
  const [formDraft, setFormDraft] = useState({ title: "", type: "Checklist", notes: "" });

  const saveCoordinator = () => {
    if (!coordDraft.name.trim()) return;
    setCoordinators((c) => [
      ...c,
      {
        id: `CRD-${base}${c.length + 1}`,
        name: coordDraft.name,
        role: coordDraft.role || "Coordinator",
        email: coordDraft.email || "coordinator@alert.gov.et",
        phone: coordDraft.phone || "+251 911 000 000",
        shift: "Day",
        certified: false,
        duties: [],
      },
    ]);
    setCoordDraft({ name: "", role: "", email: "", phone: "" });
    setAddCoordOpen(false);
  };

  const saveForm = () => {
    if (!formDraft.title.trim()) return;
    const newFormId = `FRM-${base}${forms.length + 1}`;
    const newForm: DeptForm = {
      id: newFormId,
      title: formDraft.title.trim(),
      type: formDraft.type,
      notes: formDraft.notes.trim(),
      departmentSlug: slug,
    };
    const updated = [...forms, newForm];
    setForms(updated);

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(`alert_dept_forms_${slug}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }

    saveCustomDepartmentForm({
      id: newFormId,
      departmentSlug: slug,
      departmentLabel: label,
      title: newForm.title,
      type: newForm.type,
      notes: formDraft.notes.trim(),
      description: formDraft.notes.trim() || `${newForm.type} form for ${label} department.`,
    });

    setFormDraft({ title: "", type: "Checklist", notes: "" });
    setAddFormOpen(false);
  };

  const toggleDuty = (duty: string) => {
    setViewing((v) =>
      v
        ? {
            ...v,
            duties: v.duties.includes(duty)
              ? v.duties.filter((d) => d !== duty)
              : [...v.duties, duty],
          }
        : v,
    );
  };

  const saveViewing = () => {
    if (!viewing) return;
    setCoordinators((list) => list.map((c) => (c.id === viewing.id ? viewing : c)));
    setViewing(null);
  };

  return (
    <DashboardShell bare={deptOnly}>
      <main className={`flex-1 space-y-6 p-5 ${deptOnly ? "lg:p-6" : "pt-20 lg:pt-5"}`}>
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className="grid size-12 place-items-center rounded-2xl text-primary-foreground shadow-lg"
                style={{ backgroundImage: "var(--gradient-sidebar)" }}
              >
                <Icon className="size-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{label}</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Department overview — ALERT Comprehensive Specialized Hospital
                </p>
              </div>
            </div>
            {deptOnly ? (
              <button
                type="button"
                onClick={signOut}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <LogOut className="size-4 text-primary" />
                Sign out to login
              </button>
            ) : (
              <Link
                to="/departments"
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <ArrowLeft className="size-4 text-primary" />
                All Departments
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ label, value, icon: SIcon }) => (
              <article key={label} className="card-soft flex items-center gap-3 p-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                  <SIcon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold text-foreground">{value}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-5">
            {/* Weekly chart */}
            <section className="card-soft min-w-0 p-5 xl:col-span-3">
              <h2 className="text-sm font-semibold text-foreground">Cases this week</h2>
              <p className="text-xs text-muted-foreground">Daily case volume for {label}</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid hsl(var(--border))",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="cases" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Recent records */}
            <section className="card-soft min-w-0 p-5 xl:col-span-2">
              <h2 className="text-sm font-semibold text-foreground">Recent records</h2>
              <p className="text-xs text-muted-foreground">Latest audit activity in this department</p>
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

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {coordinators.map((c) => (
                <article key={c.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/12 text-sm font-bold text-primary">
                      {c.name
                        .split(" ")
                        .slice(1)
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
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
                            Duties: {c.duties.length ? c.duties.join(", ") : "None assigned"}
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
          </section>

          {/* Forms */}
          <section className="card-soft p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Department forms</h2>
                <p className="text-xs text-muted-foreground">Forms used by this department</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddFormOpen(true)}
                className="gap-1.5 font-medium"
              >
                <FilePlus2 className="size-4" /> Add Form
              </Button>
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {forms.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5 shadow-xs hover:border-primary/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.id}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-semibold text-primary">
                      {f.type}
                    </span>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 px-3 text-xs font-semibold text-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Link
                        to="/forms/$formId"
                        params={{ formId: f.id }}
                        search={{ dept: slug }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="size-3.5 text-primary" />
                        See
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

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

          {/* Add form dialog */}
          <Dialog open={addFormOpen} onOpenChange={setAddFormOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add form</DialogTitle>
                <DialogDescription>Create a new form for {label}.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="f-title">Form title</Label>
                  <Input
                    id="f-title"
                    value={formDraft.title}
                    onChange={(e) => setFormDraft({ ...formDraft, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select
                    value={formDraft.type}
                    onValueChange={(v) => setFormDraft({ ...formDraft, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Checklist">Checklist</SelectItem>
                      <SelectItem value="Report">Report</SelectItem>
                      <SelectItem value="Consent">Consent</SelectItem>
                      <SelectItem value="Survey">Survey</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="f-notes">Notes</Label>
                  <Textarea
                    id="f-notes"
                    value={formDraft.notes}
                    onChange={(e) => setFormDraft({ ...formDraft, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddFormOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveForm}>Save form</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 p-6 pt-20 text-center lg:pt-6">
        <h1 className="text-2xl font-bold text-foreground">Department not found</h1>
        <p className="text-sm text-muted-foreground">
          The department you are looking for does not exist.
        </p>
        <Link
          to="/departments"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Back to Departments
        </Link>
      </div>
    </DashboardShell>
  );
}
