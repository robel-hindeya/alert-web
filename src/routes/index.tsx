import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Repeat } from "lucide-react";
import {
  Search,
  Bell,
  ChevronDown,
  Users,
  CalendarPlus,
  Stethoscope,
  BedDouble,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  UserPlus,
  UserRound,
  FileText,
  ReceiptText,
  CalendarDays,
  CircleUser,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { VisitsChart, DepartmentsChart } from "@/components/dashboard/charts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | ALERT Hospital Management System" },
      {
        name: "description",
        content:
          "Live overview of patients, appointments, doctors and beds at ALERT Comprehensive Specialized Hospital.",
      },
      { property: "og:title", content: "Dashboard | ALERT Hospital Management System" },
      {
        property: "og:description",
        content:
          "Live overview of patients, appointments, doctors and beds at ALERT Comprehensive Specialized Hospital.",
      },
    ],
  }),
  component: Dashboard,
});

const stats = [
  {
    label: "Total Patients",
    value: "1,248",
    delta: "12%",
    up: true,
    note: "vs last month",
    icon: Users,
  },
  {
    label: "Today's Appointments",
    value: "86",
    delta: "8%",
    up: true,
    note: "vs last week",
    icon: CalendarPlus,
  },
  {
    label: "Total Doctors",
    value: "42",
    delta: "2%",
    up: true,
    note: "vs last month",
    icon: Stethoscope,
  },
  {
    label: "Available Beds",
    value: "18",
    delta: "5%",
    up: false,
    note: "vs last week",
    icon: BedDouble,
  },
];

const quickActions = [
  { label: "Book Appointment", icon: CalendarPlus },
  { label: "Register Patient", icon: UserPlus },
  { label: "View Medical Records", icon: FileText, highlight: true },
  { label: "Generate Bill", icon: ReceiptText },
];

const appointments = [
  {
    initials: "TB",
    patient: "Tsefaye Bekele",
    doctor: "Dr. Alemu",
    dept: "Internal Medicine",
    time: "10:30 AM",
    status: "Completed",
  },
  {
    initials: "MS",
    patient: "Mekdes Shiferaw",
    doctor: "Dr. Sara",
    dept: "Pediatrics",
    time: "11:00 AM",
    status: "In Progress",
  },
  {
    initials: "KD",
    patient: "Kebede Desale",
    doctor: "Dr. Philips",
    dept: "Cardiology",
    time: "11:30 AM",
    status: "Pending",
  },
  {
    initials: "HA",
    patient: "Habtamu Abebe",
    doctor: "Dr. Lina",
    dept: "Orthopedics",
    time: "12:00 PM",
    status: "Pending",
  },
  {
    initials: "SA",
    patient: "Selam Awoke",
    doctor: "Dr. Tesfaye",
    dept: "General Surgery",
    time: "01:00 PM",
    status: "Confirmed",
  },
];

const statusStyles: Record<string, string> = {
  Completed: "bg-success/12 text-success",
  "In Progress": "bg-primary/12 text-primary",
  Pending: "bg-warning/15 text-warning",
  Confirmed: "bg-success/12 text-success",
};

const activities = [
  {
    icon: UserRound,
    title: "New patient registered",
    meta: "Mekdes Shiferaw",
    time: "10:45 AM",
  },
  {
    icon: CalendarDays,
    title: "Appointment completed",
    meta: "Tsefaye Bekele",
    time: "10:30 AM",
  },
  {
    icon: FileText,
    title: "Medical record updated",
    meta: "Patient ID: #P-1024",
    time: "09:50 AM",
  },
  {
    icon: ReceiptText,
    title: "Bill generated",
    meta: "Patient ID: #P-0897",
    time: "09:20 AM",
  },
];

function AdminMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-foreground"
      >
        <CircleUser className="size-8 text-primary" />
        Admin
        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Repeat className="size-4 text-primary" />
              Switch to Department
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function Dashboard() {
  return (
    <DashboardShell>
      <header className="flex items-center gap-2.5 sm:gap-4 border-b border-border bg-card px-3.5 py-2.5 sm:px-5 sm:py-3.5">
        <div className="relative flex-1 min-w-0 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search patients, doctors..."
            className="w-full rounded-full bg-muted py-2 pl-9 pr-3 sm:py-2.5 sm:pl-10 sm:pr-4 text-xs sm:text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            type="button"
            className="relative rounded-full p-2 text-muted-foreground hover:bg-muted"
            aria-label="View notifications"
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
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Good Afternoon, Admin</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
              Here&apos;s what&apos;s happening at Alert Comprehensive Specialized Hospital today.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <CalendarDays className="size-4 sm:size-5 text-primary" />
            <div className="leading-tight">
              <p className="font-medium text-foreground">Thu, Apr 24, 2025</p>
              <p className="text-xs text-muted-foreground">14:33</p>
            </div>
          </div>
        </div>

        <section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, delta, up, note, icon: Icon }) => (
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
                      {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                      {delta}
                    </span>
                    <span className="text-muted-foreground">{note}</span>
                  </p>
                </div>
              </article>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <div className="card-soft p-5 xl:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">Patient Visits</h2>
                <select className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground outline-none">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
              <VisitsChart />
            </div>

            <div className="card-soft p-5">
              <h2 className="mb-4 text-base font-semibold text-foreground">Quick Actions</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {quickActions.map(({ label, icon: Icon, highlight }) => (
                  <button
                    key={label}
                    className={`group flex flex-col gap-6 rounded-xl border p-4 text-left transition-colors ${
                      highlight
                        ? "border-primary/30 bg-primary/8 hover:bg-primary/15"
                        : "border-border bg-secondary/40 hover:bg-secondary"
                    }`}
                  >
                    <Icon className="size-6 text-primary" />
                    <span className="flex items-center justify-between text-sm font-medium text-foreground">
                      {label}
                      <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[2.1fr_1fr_1.15fr]">
            <div className="card-soft min-w-0 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Recent Appointments</h2>
                <button className="flex items-center gap-1 text-sm font-medium text-primary">
                  View All <ArrowRight className="size-4" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] min-w-[520px]">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Patient</th>
                      <th className="py-2 pr-3 font-medium">Doctor</th>
                      <th className="py-2 pr-3 font-medium">Department</th>
                      <th className="py-2 pr-3 font-medium">Time</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr key={a.patient} className="border-b border-border/60 last:border-0">
                        <td className="py-3 pr-3">
                          <span className="flex items-center gap-2">
                            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-primary">
                              {a.initials}
                            </span>
                            <span className="whitespace-nowrap text-foreground">{a.patient}</span>
                          </span>
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap text-muted-foreground">
                          {a.doctor}
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap text-muted-foreground">
                          {a.dept}
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap text-muted-foreground">
                          {a.time}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[a.status]}`}
                          >
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card-soft min-w-0 p-5">
              <h2 className="mb-4 text-base font-semibold text-foreground">
                Patients by Department
              </h2>
              <DepartmentsChart />
            </div>

            <div className="card-soft min-w-0 p-5">
              <h2 className="mb-4 text-base font-semibold text-foreground">Recent Activities</h2>
              <ul className="space-y-4">
                {activities.map(({ icon: Icon, title, meta, time }) => (
                  <li key={title} className="flex items-start gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground">{meta}</p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">{time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>
    </DashboardShell>
  );
}
