import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Mail, Phone, Users, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { DashboardShell } from "@/components/dashboard/shell";
import { departments } from "@/routes/departments.$slug";

export const Route = createFileRoute("/coordinators")({
  head: () => ({
    meta: [
      { title: "Coordinators | ALERT Hospital Management System" },
      {
        name: "description",
        content:
          "Manage audit coordinators at ALERT Comprehensive Specialized Hospital and record new coordinator data.",
      },
      { property: "og:title", content: "Coordinators | ALERT Hospital Management System" },
      {
        property: "og:description",
        content: "Manage audit coordinators and record new coordinator data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoordinatorsPage,
});

type Coordinator = {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  shift: string;
  certified: boolean;
  duties: string[];
  notes: string;
};

const DUTIES = [
  "Daily audit rounds",
  "Chart verification",
  "Staff scheduling",
  "Incident reporting",
  "Monthly report",
];

const ROLES = ["Lead Coordinator", "Coordinator", "Assistant Coordinator", "Data Clerk"];
const SHIFTS = ["Day", "Night", "Rotating"];

const seedData: Coordinator[] = [
  {
    id: "CRD-001",
    name: "Dr. Alem Tesfaye",
    role: "Lead Coordinator",
    department: "Emergency Corridor",
    email: "alem.t@alert.gov.et",
    phone: "+251 911 224 551",
    shift: "Day",
    certified: true,
    duties: ["Daily audit rounds", "Monthly report"],
    notes: "",
  },
  {
    id: "CRD-002",
    name: "Nurse Sara Mekonnen",
    role: "Coordinator",
    department: "Inpatient",
    email: "sara.m@alert.gov.et",
    phone: "+251 911 778 102",
    shift: "Night",
    certified: true,
    duties: ["Chart verification"],
    notes: "",
  },
  {
    id: "CRD-003",
    name: "Dr. Yonas Girma",
    role: "Coordinator",
    department: "Surgical Service",
    email: "yonas.g@alert.gov.et",
    phone: "+251 911 330 918",
    shift: "Rotating",
    certified: false,
    duties: ["Incident reporting", "Staff scheduling"],
    notes: "",
  },
];

const emptyDraft = {
  name: "",
  role: "",
  department: "",
  email: "",
  phone: "",
  shift: "",
  certified: false,
  duties: [] as string[],
  notes: "",
};

function CoordinatorsPage() {
  const [list, setList] = useState<Coordinator[]>(seedData);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const toggleDuty = (d: string) =>
    setDraft((p) => ({
      ...p,
      duties: p.duties.includes(d) ? p.duties.filter((x) => x !== d) : [...p.duties, d],
    }));

  const submit = () => {
    if (!draft.name.trim() || !draft.department || !draft.role) {
      setError("Please fill the required questions marked with *");
      return;
    }
    setList((l) => [
      ...l,
      {
        ...draft,
        id: `CRD-${String(l.length + 1).padStart(3, "0")}`,
        email: draft.email || "coordinator@alert.gov.et",
        phone: draft.phone || "+251 911 000 000",
        shift: draft.shift || "Day",
      },
    ]);
    setDraft(emptyDraft);
    setError("");
    setSaved(true);
    setOpen(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <DashboardShell>
      <main className="flex-1 space-y-6 p-5 pt-20 lg:pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="grid size-12 place-items-center rounded-2xl text-primary-foreground shadow-lg"
              style={{ backgroundImage: "var(--gradient-sidebar)" }}
            >
              <Users className="size-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Coordinators</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {list.length} coordinators across all audit modules
              </p>
            </div>
          </div>
          <Button onClick={() => setOpen((o) => !o)}>
            {open ? <X className="size-4" /> : <Plus className="size-4" />}
            {open ? "Close form" : "Add Data"}
          </Button>
        </div>

        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
            <CheckCircle2 className="size-4" /> Response recorded.
          </div>
        )}

        {/* Google-Form style entry form */}
        {open && (
          <section className="mx-auto w-full max-w-2xl space-y-4">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="h-2.5 w-full" style={{ backgroundImage: "var(--gradient-sidebar)" }} />
              <div className="space-y-2 p-6">
                <h2 className="text-2xl font-bold text-foreground">Coordinator Registration</h2>
                <p className="text-sm text-muted-foreground">
                  ALERT Comprehensive Specialized Hospital — audit coordinator data collection.
                </p>
                <p className="pt-2 text-xs font-medium text-destructive">* Required</p>
              </div>
            </div>

            <FormCard label="Full name" required>
              <Input
                placeholder="Your answer"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </FormCard>

            <FormCard label="Role" required>
              <Select value={draft.role} onValueChange={(v) => setDraft({ ...draft, role: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormCard>

            <FormCard label="Department / audit module" required>
              <Select
                value={draft.department}
                onValueChange={(v) => setDraft({ ...draft, department: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.slug} value={d.label}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormCard>

            <FormCard label="Email address">
              <Input
                type="email"
                placeholder="Your answer"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </FormCard>

            <FormCard label="Phone number">
              <Input
                placeholder="Your answer"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </FormCard>

            <FormCard label="Shift">
              <Select value={draft.shift} onValueChange={(v) => setDraft({ ...draft, shift: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {SHIFTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormCard>

            <FormCard label="Assigned duties (select all that apply)">
              <div className="space-y-2.5">
                {DUTIES.map((d) => (
                  <label key={d} className="flex items-center gap-2.5 text-sm text-foreground">
                    <Checkbox checked={draft.duties.includes(d)} onCheckedChange={() => toggleDuty(d)} />
                    {d}
                  </label>
                ))}
                <label className="flex items-center gap-2.5 border-t border-border pt-2.5 text-sm text-foreground">
                  <Checkbox
                    checked={draft.certified}
                    onCheckedChange={(v) => setDraft({ ...draft, certified: v === true })}
                  />
                  Certified auditor
                </label>
              </div>
            </FormCard>

            <FormCard label="Additional notes">
              <Textarea
                placeholder="Your answer"
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </FormCard>

            {error && <p className="text-sm font-medium text-destructive">{error}</p>}

            <div className="flex items-center gap-3">
              <Button onClick={submit}>Submit</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setDraft(emptyDraft);
                  setError("");
                }}
              >
                Clear form
              </Button>
            </div>
          </section>
        )}

        {/* Coordinator list */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <article key={c.id} className="card-soft p-4">
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
                  <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.role} · {c.department}
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5 truncate">
                  <Mail className="size-3.5 shrink-0" /> {c.email}
                </p>
                <p className="flex items-center gap-1.5 truncate">
                  <Phone className="size-3.5 shrink-0" /> {c.phone}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  {c.shift} shift
                </span>
                {c.certified && (
                  <span className="rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    Certified
                  </span>
                )}
                {c.duties.slice(0, 2).map((d) => (
                  <span
                    key={d}
                    className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </main>
    </DashboardShell>
  );
}

function FormCard({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <Label className="mb-3 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
