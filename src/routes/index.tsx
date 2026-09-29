import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  Bell,
  ChevronDown,
  Users,
  CalendarPlus,
  Stethoscope,
  BedDouble,
  ArrowUp,
  ArrowRight,
  UserPlus,
  FileText,
  CalendarDays,
  CircleUser,
  Repeat,
  CheckCircle2,
  AlertCircle,
  Activity,
  Plus,
  Clock,
  LogOut,
  Settings,
  Award,
  Star,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { useAuthUser } from "@/lib/auth-session";
import { VisitsChart, DepartmentsChart } from "@/components/dashboard/charts";
import {
  useDashboardData,
  bookAppointment,
  registerPatient,
  updateAppointmentStatus,
} from "@/lib/dashboard-store";
import { departments } from "@/routes/departments.$slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | ALERT Quality Management System" },
      {
        name: "description",
        content:
          "Live overview of patients, appointments, doctors and beds at ALERT Comprehensive Specialized Hospital.",
      },
      { property: "og:title", content: "Dashboard | ALERT Quality Management System" },
      {
        property: "og:description",
        content:
          "Live overview of patients, appointments, doctors and beds at ALERT Comprehensive Specialized Hospital.",
      },
    ],
  }),
  component: Dashboard,
});

const statusStyles: Record<string, string> = {
  Completed: "bg-success/12 text-success",
  "In Progress": "bg-primary/12 text-primary",
  Pending: "bg-warning/15 text-warning",
  Confirmed: "bg-success/12 text-success",
};

interface TopOfficerLeader {
  id: string;
  name: string;
  role: string;
  department: string;
  type: "QMT Officer" | "Coordinator";
  auditsCompleted: number;
  complianceRate: string;
  rating: number;
  status: "Active" | "In Audit" | "Reviewing";
}

const DEFAULT_TOP_OFFICERS: TopOfficerLeader[] = [
  {
    id: "top-1",
    name: "Dr. Habtamu Girma",
    role: "Lead QMT Quality Director",
    department: "Emergency & Triage Corridor",
    type: "QMT Officer",
    auditsCompleted: 384,
    complianceRate: "99.4%",
    rating: 5.0,
    status: "Active",
  },
  {
    id: "top-2",
    name: "Sr. Tigist Alemu",
    role: "Senior Clinical Audit Coordinator",
    department: "Intensive Care Unit (ICU)",
    type: "Coordinator",
    auditsCompleted: 326,
    complianceRate: "98.7%",
    rating: 4.9,
    status: "In Audit",
  },
  {
    id: "top-3",
    name: "Dr. Yonas Bekele",
    role: "Surgical Safety Audit Officer",
    department: "Major Surgical Theatre",
    type: "QMT Officer",
    auditsCompleted: 295,
    complianceRate: "98.2%",
    rating: 4.9,
    status: "Active",
  },
  {
    id: "top-4",
    name: "Sr. Meron Haile",
    role: "Inpatient Care Coordinator",
    department: "Inpatient Medical Ward",
    type: "Coordinator",
    auditsCompleted: 258,
    complianceRate: "97.6%",
    rating: 4.8,
    status: "Active",
  },
  {
    id: "top-5",
    name: "Dr. Dawit Abebe",
    role: "Pharmacovigilance Audit Officer",
    department: "Central Pharmacy & OPD",
    type: "QMT Officer",
    auditsCompleted: 231,
    complianceRate: "97.1%",
    rating: 4.8,
    status: "Reviewing",
  },
];

function AdminMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthUser();
  const displayName = user?.name || "Habtamu (Superadmin)";
  const displayRole =
    user?.role === "superadmin"
      ? "Super Administrator"
      : user?.role === "admin"
        ? "Hospital Admin"
        : "Administrator";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-foreground hover:opacity-85 transition-opacity"
      >
        <div className="size-8 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="text-left hidden sm:block">
          <span className="block text-xs font-semibold leading-tight text-foreground truncate max-w-[140px]">
            {user?.name ? user.name.split(" ")[0] : "Habtamu"}
          </span>
          <span className="block text-[10px] text-muted-foreground leading-none capitalize">
            {user?.role || "superadmin"}
          </span>
        </div>
        <ChevronDown
          className={`size-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-xl p-1.5 space-y-1">
            <div className="px-3 py-2 border-b border-border/60">
              <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
              <p className="text-[11px] text-primary font-medium">{displayRole}</p>
            </div>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="size-4 text-primary" />
              Settings &amp; Role Accounts
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
                window.location.href = "/login";
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Dashboard() {
  const { stats, loading, refresh } = useDashboardData();
  const [search, setSearch] = useState("");

  // Book Appointment Dialog
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookDraft, setBookDraft] = useState({
    patientName: "",
    doctorName: "Dr. Alemu Tesfaye",
    departmentSlug: departments[0]?.slug || "emergency-corridor",
    time: "10:30 AM",
    date: "Today",
  });
  const [bookSubmitting, setBookSubmitting] = useState(false);

  // Register Patient Dialog
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerDraft, setRegisterDraft] = useState({
    name: "",
    age: "35",
    gender: "Male" as "Male" | "Female",
    phone: "+251 911 000 000",
    departmentSlug: departments[0]?.slug || "emergency-corridor",
  });
  const [registerSubmitting, setRegisterSubmitting] = useState(false);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookDraft.patientName.trim()) {
      toast.error("Please enter patient name");
      return;
    }
    setBookSubmitting(true);
    const deptObj = departments.find((d) => d.slug === bookDraft.departmentSlug);
    const res = await bookAppointment({
      ...bookDraft,
      departmentLabel: deptObj?.label || bookDraft.departmentSlug,
      status: "Confirmed",
    });
    setBookSubmitting(false);
    if (res) {
      toast.success("Appointment booked successfully!");
      setBookModalOpen(false);
      setBookDraft({
        patientName: "",
        doctorName: "Dr. Alemu Tesfaye",
        departmentSlug: departments[0]?.slug || "emergency-corridor",
        time: "10:30 AM",
        date: "Today",
      });
      void refresh();
    } else {
      toast.error("Failed to book appointment");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerDraft.name.trim()) {
      toast.error("Please enter patient name");
      return;
    }
    setRegisterSubmitting(true);
    const deptObj = departments.find((d) => d.slug === registerDraft.departmentSlug);
    const res = await registerPatient({
      name: registerDraft.name,
      age: Number(registerDraft.age) || 30,
      gender: registerDraft.gender,
      phone: registerDraft.phone,
      departmentSlug: registerDraft.departmentSlug,
      departmentLabel: deptObj?.label || registerDraft.departmentSlug,
      status: "Active",
    });
    setRegisterSubmitting(false);
    if (res) {
      toast.success("Patient registered successfully!");
      setRegisterModalOpen(false);
      setRegisterDraft({
        name: "",
        age: "35",
        gender: "Male",
        phone: "+251 911 000 000",
        departmentSlug: departments[0]?.slug || "emergency-corridor",
      });
      void refresh();
    } else {
      toast.error("Failed to register patient");
    }
  };

  const handleStatusChange = async (
    id: string,
    newStatus: "Completed" | "In Progress" | "Pending" | "Confirmed",
  ) => {
    const res = await updateAppointmentStatus(id, newStatus);
    if (res) {
      toast.success(`Status updated to ${newStatus}`);
      void refresh();
    }
  };

  const topOfficers = useMemo(() => {
    let list = [...DEFAULT_TOP_OFFICERS];
    try {
      const stored = localStorage.getItem("alert_qmt_officers_list");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const custom = parsed.map(
            (
              o: {
                id?: string;
                name: string;
                specialty?: string;
                dept?: string;
                exp?: number;
                rating?: number;
                status?: string;
              },
              idx: number,
            ) => ({
              id: o.id || `custom-${idx}`,
              name: o.name,
              role: o.specialty || "Quality Management Officer",
              department: o.dept || "General Ward",
              type: "QMT Officer" as const,
              auditsCompleted: Math.max(120, (o.exp || 1) * 45 + ((idx * 17) % 80)),
              complianceRate: `${(96 + ((idx * 3) % 4) + 0.5).toFixed(1)}%`,
              rating: o.rating || 5.0,
              status: o.status === "In Audit" ? ("In Audit" as const) : ("Active" as const),
            }),
          );
          const combined = [...list, ...custom];
          const seen = new Set<string>();
          const unique = combined.filter((item) => {
            const key = item.name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          unique.sort((a, b) => b.auditsCompleted - a.auditsCompleted);
          list = unique.slice(0, 5);
        }
      }
    } catch {
      // ignore
    }

    if (!search.trim()) return list.slice(0, 5);
    const q = search.toLowerCase();
    return list
      .filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.role.toLowerCase().includes(q) ||
          o.department.toLowerCase().includes(q) ||
          o.type.toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [search]);

  const statCards = [
    {
      label: "Total Patient Records",
      value: stats.totalPatients.toLocaleString(),
      delta: stats.totalPatientsDelta,
      up: true,
      note: "registered + audits",
      icon: Users,
    },
    {
      label: "Today's Appointments",
      value: stats.todayAppointments.toLocaleString(),
      delta: stats.todayAppointmentsDelta,
      up: true,
      note: "active scheduled",
      icon: CalendarPlus,
    },
    {
      label: "Clinical Forms & Audits",
      value: stats.totalForms.toLocaleString(),
      delta: `${stats.totalResponses} responses`,
      up: true,
      note: "total submissions",
      icon: Stethoscope,
    },
    {
      label: "Available Inpatient Beds",
      value: String(stats.availableBeds),
      delta: "Active",
      up: true,
      note: "current capacity",
      icon: BedDouble,
    },
  ];

  return (
    <DashboardShell>
      <header className="flex items-center gap-2.5 sm:gap-4 border-b border-border bg-card px-3.5 py-2.5 sm:px-5 sm:py-3.5">
        <div className="relative flex-1 min-w-0 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients, doctors, departments..."
            className="w-full rounded-full bg-muted py-2 pl-9 pr-3 sm:py-2.5 sm:pl-10 sm:pr-4 text-xs sm:text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={() => void refresh()}
            className="relative rounded-full p-2 text-muted-foreground hover:bg-muted"
            aria-label="Refresh live data"
            title="Refresh live data"
          >
            <Bell className="size-5" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
          </button>
          <AdminMenu />
        </div>
      </header>

      <main className="flex-1 space-y-4 sm:space-y-5 p-3.5 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              ALERT Hospital Overview
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
              Dynamic real-time clinical audit and patient monitoring dashboard.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <CalendarDays className="size-4 sm:size-5 text-primary" />
            <div className="leading-tight">
              <p className="font-medium text-foreground">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-muted-foreground">Live Database Sync</p>
            </div>
          </div>
        </div>

        {/* Dynamic Stat Cards */}
        <section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ label, value, delta, up, note, icon: Icon }) => (
            <article key={label} className="card-soft flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                <Icon className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs">
                  <span
                    className={`inline-flex items-center gap-0.5 font-semibold ${
                      up ? "text-success" : "text-destructive"
                    }`}
                  >
                    <ArrowUp className="size-3" />
                    {delta}
                  </span>
                  <span className="text-muted-foreground">{note}</span>
                </p>
              </div>
            </article>
          ))}
        </section>

        {/* Dynamic Charts & Quick Actions */}
        <section className="grid gap-4 xl:grid-cols-3">
          <div className="card-soft p-5 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Clinical Activity & Submissions
                </h2>
                <p className="text-xs text-muted-foreground">
                  Live 7-day submission and audit frequency
                </p>
              </div>
              <span className="rounded-lg border border-border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
                Last 7 Days
              </span>
            </div>
            <VisitsChart data={stats.visits} />
          </div>

          <div className="card-soft p-5">
            <h2 className="mb-4 text-base font-semibold text-foreground">Quick Actions</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setBookModalOpen(true)}
                className="group flex flex-col justify-between gap-3 rounded-xl border border-primary/30 bg-primary/8 p-4 text-left transition-colors hover:bg-primary/15"
              >
                <div className="flex items-center justify-between">
                  <CalendarPlus className="size-6 text-primary" />
                  <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">500,000+ OPD Visit</p>
                  <p className="text-xs text-muted-foreground">per yr</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRegisterModalOpen(true)}
                className="group flex flex-col justify-between gap-3 rounded-xl border border-border bg-secondary/40 p-4 text-left transition-colors hover:bg-secondary"
              >
                <div className="flex items-center justify-between">
                  <UserPlus className="size-6 text-primary" />
                  <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">7,000+ Delivery Services</p>
                  <p className="text-xs text-muted-foreground">per yr</p>
                </div>
              </button>

              <Link
                to="/reports"
                className="group flex flex-col justify-between gap-3 rounded-xl border border-border bg-secondary/40 p-4 text-left transition-colors hover:bg-secondary"
              >
                <div className="flex items-center justify-between">
                  <FileText className="size-6 text-primary" />
                  <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">2,000+ Staff</p>
                  <p className="text-xs text-muted-foreground">Clinical &amp; Support</p>
                </div>
              </Link>

              <Link
                to="/departments"
                className="group flex flex-col justify-between gap-3 rounded-xl border border-border bg-secondary/40 p-4 text-left transition-colors hover:bg-secondary"
              >
                <div className="flex items-center justify-between">
                  <Activity className="size-6 text-primary" />
                  <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    35+ Speciality &amp; Subspeciality
                  </p>
                  <p className="text-xs text-muted-foreground">Clinical Departments</p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Dynamic QMT Officers Leaderboard and Department Share */}
        <section className="grid gap-4 xl:grid-cols-3">
          {/* Most Work QMT Officers & Coordinators (Top 5) - Expanded space (2 columns) */}
          <div className="card-soft min-w-0 p-5 xl:col-span-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Award className="size-4" />
                  </span>
                  <h2 className="text-base font-semibold text-foreground">
                    Most Work QMT Officers &amp; Coordinators
                  </h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Top 5 most active quality officers and coordinators across ALERT Hospital
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/qmt-officer"
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Users className="size-3.5 text-primary" />
                  <span>All Officers</span>
                </Link>
                <Link
                  to="/cordineters"
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <ShieldCheck className="size-3.5 text-primary" />
                  <span>Coordinators</span>
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[13px] min-w-[560px]">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2.5 pr-3 font-medium">Rank &amp; Name</th>
                    <th className="py-2.5 pr-3 font-medium">Role</th>
                    <th className="py-2.5 pr-3 font-medium">Department</th>
                    <th className="py-2.5 pr-3 font-medium text-right">Work Completed</th>
                    <th className="py-2.5 pr-3 font-medium text-center">Compliance</th>
                    <th className="py-2.5 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topOfficers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-xs text-muted-foreground">
                        <Users className="mx-auto size-7 mb-2 text-muted-foreground/50" />
                        No matching officers or coordinators found.
                      </td>
                    </tr>
                  ) : (
                    topOfficers.map((officer, index) => {
                      const initials = officer.name
                        .replace(/^Dr\.\s*|^Sr\.\s*/i, "")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                      const rankBadges = [
                        "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
                        "bg-slate-400/15 text-slate-700 dark:text-slate-300 border-slate-400/30",
                        "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
                        "bg-muted text-muted-foreground border-border",
                        "bg-muted text-muted-foreground border-border",
                      ];

                      return (
                        <tr
                          key={officer.id}
                          className="border-b border-border/60 last:border-0 hover:bg-muted/40 transition-colors"
                        >
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold ${
                                  rankBadges[index] ||
                                  "bg-muted text-muted-foreground border-border"
                                }`}
                              >
                                {index + 1}
                              </span>
                              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {initials || "OF"}
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground whitespace-nowrap">
                                  {officer.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                                  {officer.role}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                officer.type === "QMT Officer"
                                  ? "bg-primary/10 text-primary border border-primary/20"
                                  : "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                              }`}
                            >
                              {officer.type}
                            </span>
                          </td>
                          <td className="py-3 pr-3 whitespace-nowrap text-muted-foreground">
                            {officer.department}
                          </td>
                          <td className="py-3 pr-3 whitespace-nowrap text-right">
                            <span className="font-bold text-foreground">
                              {officer.auditsCompleted.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-muted-foreground ml-1">audits</span>
                          </td>
                          <td className="py-3 pr-3 whitespace-nowrap text-center">
                            <div className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md text-xs">
                              <Star className="size-3 fill-emerald-600 dark:fill-emerald-400" />
                              <span>{officer.complianceRate}</span>
                            </div>
                          </td>
                          <td className="py-3 whitespace-nowrap text-right">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                officer.status === "Active"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : officer.status === "In Audit"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {officer.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dynamic Department Distribution - 1 column */}
          <div className="card-soft min-w-0 p-5 xl:col-span-1">
            <h2 className="mb-1 text-base font-semibold text-foreground">Department Submissions</h2>
            <p className="mb-4 text-xs text-muted-foreground">Audit volume by clinical unit</p>
            <DepartmentsChart departments={stats.departments} totalPatients={stats.totalPatients} />
          </div>
        </section>

        {/* Dynamic Recent Activities - Moved under all */}
        <section className="card-soft min-w-0 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Recent Activities</h2>
              <p className="text-xs text-muted-foreground">
                Real-time audit log, patient registrations, and clinical documentation
              </p>
            </div>
            <span className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Live Hospital Feed
            </span>
          </div>

          {stats.activities.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              <Activity className="mx-auto size-7 mb-2 text-muted-foreground/50" />
              No activity logged yet. Submitting forms or appointments records here.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {stats.activities.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex items-start gap-3 rounded-xl border border-border/70 bg-card p-3.5 hover:bg-muted/40 transition-colors shadow-2xs"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    {item.type === "patient_registered" ? (
                      <UserPlus className="size-4" />
                    ) : item.type === "form_submitted" ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : (
                      <CalendarDays className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{item.meta}</p>
                    <p className="text-[11px] font-medium text-primary/80 mt-1 flex items-center gap-1">
                      <Clock className="size-3" />
                      <span>{item.time}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Book Appointment Modal */}
      <Dialog open={bookModalOpen} onOpenChange={setBookModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Book Patient Appointment</DialogTitle>
            <DialogDescription>
              Schedule a patient consultation or department audit check-in.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBookSubmit} className="space-y-3.5 pt-2">
            <div>
              <Label className="text-xs">Patient Full Name</Label>
              <Input
                required
                placeholder="e.g. Abebe Tsegaye"
                value={bookDraft.patientName}
                onChange={(e) => setBookDraft({ ...bookDraft, patientName: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Assigned Clinician / Doctor</Label>
              <Input
                required
                placeholder="e.g. Dr. Sara Mekonnen"
                value={bookDraft.doctorName}
                onChange={(e) => setBookDraft({ ...bookDraft, doctorName: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Department</Label>
              <Select
                value={bookDraft.departmentSlug}
                onValueChange={(val) => setBookDraft({ ...bookDraft, departmentSlug: val })}
              >
                <SelectTrigger className="mt-1 text-xs">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.slug} value={d.slug} className="text-xs">
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Time</Label>
                <Input
                  required
                  placeholder="e.g. 10:30 AM"
                  value={bookDraft.time}
                  onChange={(e) => setBookDraft({ ...bookDraft, time: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input
                  required
                  placeholder="e.g. Today"
                  value={bookDraft.date}
                  onChange={(e) => setBookDraft({ ...bookDraft, date: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBookModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={bookSubmitting}>
                {bookSubmitting ? "Booking..." : "Confirm Appointment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Register Patient Modal */}
      <Dialog open={registerModalOpen} onOpenChange={setRegisterModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Register New Patient</DialogTitle>
            <DialogDescription>
              Record a patient entry into the ALERT Hospital database.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 pt-2">
            <div>
              <Label className="text-xs">Patient Full Name</Label>
              <Input
                required
                placeholder="e.g. Mekdes Shiferaw"
                value={registerDraft.name}
                onChange={(e) => setRegisterDraft({ ...registerDraft, name: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Age</Label>
                <Input
                  type="number"
                  required
                  value={registerDraft.age}
                  onChange={(e) => setRegisterDraft({ ...registerDraft, age: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Gender</Label>
                <Select
                  value={registerDraft.gender}
                  onValueChange={(val: "Male" | "Female") =>
                    setRegisterDraft({ ...registerDraft, gender: val })
                  }
                >
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male" className="text-xs">
                      Male
                    </SelectItem>
                    <SelectItem value="Female" className="text-xs">
                      Female
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Phone Number</Label>
              <Input
                required
                placeholder="+251 911 000 000"
                value={registerDraft.phone}
                onChange={(e) => setRegisterDraft({ ...registerDraft, phone: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Admitting / Primary Department</Label>
              <Select
                value={registerDraft.departmentSlug}
                onValueChange={(val) => setRegisterDraft({ ...registerDraft, departmentSlug: val })}
              >
                <SelectTrigger className="mt-1 text-xs">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.slug} value={d.slug} className="text-xs">
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRegisterModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={registerSubmitting}>
                {registerSubmitting ? "Registering..." : "Save Patient"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
