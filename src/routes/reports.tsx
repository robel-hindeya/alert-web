import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  TrendingUp,
  Building2,
  Users,
  Search,
  ArrowUpDown,
  Eye,
  Check,
  RefreshCw,
  Plus,
  FileCheck2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { departments } from "@/routes/departments.$slug";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Clinical & Operational Reports | ALERT Hospital" },
      {
        name: "description",
        content:
          "Comprehensive clinical reports, audit records, and departmental analytics at ALERT Comprehensive Specialized Hospital.",
      },
      { property: "og:title", content: "Reports | ALERT Hospital Management System" },
      {
        property: "og:description",
        content:
          "Comprehensive clinical reports, audit records, and departmental analytics at ALERT Comprehensive Specialized Hospital.",
      },
    ],
  }),
  component: ReportsPage,
});

interface ReportRecord {
  id: string;
  title: string;
  category: "Audit" | "Incident" | "Consent" | "Survey" | "Checklist";
  department: string;
  departmentSlug: string;
  author: string;
  date: string;
  score: string;
  status: "Completed" | "Reviewed" | "Pending Review";
  summary: string;
}

const INITIAL_REPORTS: ReportRecord[] = [
  {
    id: "REP-2026-081",
    title: "Daily Emergency Corridor Triage Audit",
    category: "Audit",
    department: "Emergency Corridor",
    departmentSlug: "emergency-corridor",
    author: "Dr. Alem Tesfaye",
    date: "Sep 15, 2026",
    score: "98%",
    status: "Completed",
    summary: "Crash cart verified, rapid triage protocol followed for all 42 corridor admissions.",
  },
  {
    id: "REP-2026-080",
    title: "Medication Verification Adverse Incident",
    category: "Incident",
    department: "Inpatient",
    departmentSlug: "inpatient",
    author: "Nurse Sara Mekonnen",
    date: "Sep 15, 2026",
    score: "Severity 2/5",
    status: "Reviewed",
    summary:
      "Near-miss dose discrepancy identified during shift handover; corrected prior to administration.",
  },
  {
    id: "REP-2026-079",
    title: "Pre-Operative Preparation Checklist Report",
    category: "Checklist",
    department: "Preoperative Preparation",
    departmentSlug: "preoperative-preparation",
    author: "Dr. Hana Seyoum",
    date: "Sep 14, 2026",
    score: "100%",
    status: "Completed",
    summary:
      "All 18 surgical patients verified with fasting times, cross-match, and anesthesia clearance.",
  },
  {
    id: "REP-2026-078",
    title: "Informed Surgical Consent Audit Review",
    category: "Consent",
    department: "Surgical Service",
    departmentSlug: "surgical-service",
    author: "Dr. Yonas Girma",
    date: "Sep 14, 2026",
    score: "96%",
    status: "Completed",
    summary:
      "Audit of 24 operating consent forms; legal guardian authorization verified for pediatric cases.",
  },
  {
    id: "REP-2026-077",
    title: "OR Cancellation Rate & Root-Cause Summary",
    category: "Audit",
    department: "OR Cancellation",
    departmentSlug: "or-cancellation",
    author: "Dr. Solomon Bekele",
    date: "Sep 13, 2026",
    score: "92%",
    status: "Completed",
    summary:
      "2 cancellations documented due to acute medical instability; rescheduled within 48 hours.",
  },
  {
    id: "REP-2026-076",
    title: "Maternal Health Clinic Patient Experience Survey",
    category: "Survey",
    department: "MCH",
    departmentSlug: "mch",
    author: "Dr. Bethlehem Arega",
    date: "Sep 13, 2026",
    score: "4.8/5.0",
    status: "Completed",
    summary:
      "50 postnatal patient responses compiled with 96% overall satisfaction with nurse care.",
  },
  {
    id: "REP-2026-075",
    title: "Weekly Medical Chart Completeness Evaluation",
    category: "Audit",
    department: "Chart Completeness",
    departmentSlug: "chart-completeness",
    author: "Nurse Betel Assefa",
    date: "Sep 12, 2026",
    score: "89%",
    status: "Pending Review",
    summary: "Routine discharge summary completeness check; 4 charts pending consultant sign-off.",
  },
  {
    id: "REP-2026-074",
    title: "Postoperative Care Vital Signs Stability Log",
    category: "Checklist",
    department: "Postoperative Care",
    departmentSlug: "postoperative-care",
    author: "Dr. Netsanet Arega",
    date: "Sep 12, 2026",
    score: "97%",
    status: "Completed",
    summary: "Post-anesthesia recovery room protocol confirmed for 31 surgical transfers.",
  },
  {
    id: "REP-2026-073",
    title: "OPD Triage & Specialist Turnaround Audit",
    category: "Audit",
    department: "OPD",
    departmentSlug: "opd",
    author: "Dr. Fitsum Alemayehu",
    date: "Sep 11, 2026",
    score: "94%",
    status: "Completed",
    summary:
      "Average consultation wait time monitored across dermatology, ENT, and ophthalmology clinics.",
  },
];

const WEEKLY_AUDIT_DATA = [
  { day: "Mon", audits: 32, compliance: 95 },
  { day: "Tue", audits: 45, compliance: 97 },
  { day: "Wed", audits: 38, compliance: 94 },
  { day: "Thu", audits: 52, compliance: 98 },
  { day: "Fri", audits: 48, compliance: 96 },
  { day: "Sat", audits: 29, compliance: 93 },
  { day: "Sun", audits: 24, compliance: 95 },
];

const DEPT_PERFORMANCE = [
  { dept: "Emergency", score: 96 },
  { dept: "Inpatient", score: 92 },
  { dept: "MCH", score: 98 },
  { dept: "Surgical", score: 94 },
  { dept: "Pre-op", score: 97 },
  { dept: "Chart Comp.", score: 89 },
  { dept: "Post-op", score: 95 },
  { dept: "OPD", score: 93 },
];

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function ReportsPage() {
  const mounted = useMounted();
  const [reports, setReports] = useState<ReportRecord[]>(INITIAL_REPORTS);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [filterCustomDays, setFilterCustomDays] = useState("");
  const [activeReport, setActiveReport] = useState<ReportRecord | null>(null);

  // New Report Generation Dialog State
  const [genOpen, setGenOpen] = useState(false);
  const [genDept, setGenDept] = useState(departments[0]?.label || "Emergency Corridor");
  const [genType, setGenType] = useState("Audit");
  const [genPeriod, setGenPeriod] = useState("Last 7 Days");
  const [customDays, setCustomDays] = useState("4");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [genNotes, setGenNotes] = useState("");
  const [isGenerated, setIsGenerated] = useState(false);

  const getEffectivePeriod = () => {
    if (genPeriod === "Custom Days") {
      const days = customDays.trim() ? customDays.trim() : "4";
      return `Last ${days} ${Number(days) === 1 ? "Day" : "Days"}`;
    }
    if (genPeriod === "Custom Date Range") {
      if (customStartDate && customEndDate) {
        return `${customStartDate} to ${customEndDate}`;
      }
      if (customStartDate) {
        return `Since ${customStartDate}`;
      }
      return "Custom Date Range";
    }
    return genPeriod;
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchSearch =
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.author.toLowerCase().includes(search.toLowerCase()) ||
        r.department.toLowerCase().includes(search.toLowerCase());

      const matchDept = selectedDept === "all" || r.departmentSlug === selectedDept;
      const matchCat = selectedCategory === "all" || r.category === selectedCategory;
      const matchStatus = selectedStatus === "all" || r.status === selectedStatus;

      let matchPeriod = true;
      if (selectedPeriod !== "all") {
        const days =
          selectedPeriod === "custom" ? Number(filterCustomDays) : Number(selectedPeriod);
        if (days && !isNaN(days)) {
          const reportDate = new Date(r.date);
          if (!isNaN(reportDate.getTime())) {
            const now = new Date();
            const diffDays = Math.floor(
              (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24),
            );
            matchPeriod = diffDays >= 0 && diffDays <= days;
          }
        }
      }

      return matchSearch && matchDept && matchCat && matchStatus && matchPeriod;
    });
  }, [
    reports,
    search,
    selectedDept,
    selectedCategory,
    selectedStatus,
    selectedPeriod,
    filterCustomDays,
  ]);

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    const deptObj = departments.find((d) => d.label === genDept) || departments[0]!;
    const periodLabel = getEffectivePeriod();
    const newRecord: ReportRecord = {
      id: `REP-2026-${String(reports.length + 82).padStart(3, "0")}`,
      title: `${genDept} ${genType} Summary Report (${periodLabel})`,
      category: genType as any,
      department: genDept,
      departmentSlug: deptObj.slug,
      author: "Quality & Clinical Audit Directorate",
      date: "Sep 20, 2026",
      score: genType === "Incident" ? "Severity 1/5" : "97%",
      status: "Completed",
      summary:
        genNotes.trim() ||
        `Automated ${periodLabel} clinical and operational performance report compiled for ${genDept}.`,
    };

    setReports([newRecord, ...reports]);
    setIsGenerated(true);
    setTimeout(() => {
      setIsGenerated(false);
      setGenOpen(false);
      setGenNotes("");
    }, 1200);
  };

  return (
    <DashboardShell>
      <main className="flex-1 space-y-4 sm:space-y-6 p-3.5 sm:p-5 lg:p-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 sm:size-10 place-items-center rounded-xl bg-primary/12 text-primary shrink-0">
                <BarChart3 className="size-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Clinical & Operational Reports
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  ALERT Comprehensive Specialized Hospital · Continuous Quality Improvement &
                  Clinical Audits
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 shadow-xs"
            >
              <Printer className="size-4" />
              <span className="hidden sm:inline">Print /</span> Export
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => setGenOpen(true)}
              className="gap-1.5 font-semibold shadow-xs"
            >
              <Plus className="size-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Top KPI Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="card-soft p-4 flex items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
              <FileCheck2 className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Total Audits Completed</p>
              <p className="text-2xl font-bold text-foreground">1,482</p>
              <p className="text-[11px] text-success font-medium flex items-center gap-1 mt-0.5">
                <TrendingUp className="size-3" /> +8.4% vs last month
              </p>
            </div>
          </article>

          <article className="card-soft p-4 flex items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-chart-2/15 text-chart-2">
              <FileSpreadsheet className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Form Submissions</p>
              <p className="text-2xl font-bold text-foreground">3,240</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                Across 10 clinical wards
              </p>
            </div>
          </article>

          <article className="card-soft p-4 flex items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
              <CheckCircle2 className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Average Quality Score</p>
              <p className="text-2xl font-bold text-foreground">95.4%</p>
              <p className="text-[11px] text-success font-medium mt-0.5">
                Exceeds MOH 90% benchmark
              </p>
            </div>
          </article>

          <article className="card-soft p-4 flex items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-warning/15 text-warning">
              <AlertTriangle className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Incident Closure Rate</p>
              <p className="text-2xl font-bold text-foreground">98.6%</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                24-hr resolution protocol
              </p>
            </div>
          </article>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-5 xl:grid-cols-5">
          {/* Weekly Audit Activity Area Chart */}
          <section className="card-soft p-5 xl:col-span-3 min-w-0">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Weekly Clinical Audit Volume
                </h2>
                <p className="text-xs text-muted-foreground">
                  Daily audit rounds conducted this week
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Current Week
              </span>
            </div>

            <div className="mt-4 h-64">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={WEEKLY_AUDIT_DATA}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="auditGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        borderColor: "var(--color-border)",
                        borderRadius: "12px",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="audits"
                      name="Audits Completed"
                      stroke="var(--color-primary)"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#auditGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full animate-pulse bg-muted/20 rounded-xl" />
              )}
            </div>
          </section>

          {/* Department Compliance Bar Chart */}
          <section className="card-soft p-5 xl:col-span-2 min-w-0">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Compliance by Department</h2>
                <p className="text-xs text-muted-foreground">Percentage meeting safety standard</p>
              </div>
              <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                Avg 95%
              </span>
            </div>

            <div className="mt-4 h-64">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={DEPT_PERFORMANCE}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      domain={[80, 100]}
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="dept"
                      type="category"
                      tick={{ fontSize: 11, fill: "var(--color-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, "Compliance"]}
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        borderColor: "var(--color-border)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="score"
                      name="Compliance"
                      fill="var(--color-chart-2)"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full animate-pulse bg-muted/20 rounded-xl" />
              )}
            </div>
          </section>
        </div>

        {/* Filter Controls */}
        <section className="card-soft p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reports by ID, title, author..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl border-border bg-card"
              />
            </div>

            {/* Department Filter */}
            <div className="w-full sm:w-48">
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="h-10 rounded-xl border-border">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.slug} value={d.slug}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="w-full sm:w-40">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-10 rounded-xl border-border">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Audit">Audit</SelectItem>
                  <SelectItem value="Incident">Incident</SelectItem>
                  <SelectItem value="Checklist">Checklist</SelectItem>
                  <SelectItem value="Consent">Consent</SelectItem>
                  <SelectItem value="Survey">Survey</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-36">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-10 rounded-xl border-border">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Reviewed">Reviewed</SelectItem>
                  <SelectItem value="Pending Review">Pending Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Period Filter */}
            <div className="w-full sm:w-44">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="h-10 rounded-xl border-border">
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time Periods</SelectItem>
                  <SelectItem value="4">Last 4 Days</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="14">Last 14 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="67">Last 67 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="custom">Custom Days...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedPeriod === "custom" && (
              <div className="flex items-center gap-1.5 w-full sm:w-36">
                <Input
                  type="number"
                  min="1"
                  placeholder="Days (e.g. 67)"
                  value={filterCustomDays}
                  onChange={(e) => setFilterCustomDays(e.target.value)}
                  className="h-10 rounded-xl border-border bg-card text-xs"
                />
              </div>
            )}

            {/* Reset Filters */}
            {(search ||
              selectedDept !== "all" ||
              selectedCategory !== "all" ||
              selectedStatus !== "all" ||
              selectedPeriod !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSelectedDept("all");
                  setSelectedCategory("all");
                  setSelectedStatus("all");
                  setSelectedPeriod("all");
                  setFilterCustomDays("");
                }}
                className="h-10 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset
              </Button>
            )}
          </div>
        </section>

        {/* Reports Table / List */}
        <section className="card-soft overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-border/80 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                Hospital Reports Log
              </h2>
              <p className="text-xs text-muted-foreground">
                Showing {filteredReports.length} of {reports.length} total reports
              </p>
            </div>
            <span className="text-[11px] text-primary/80 font-medium sm:hidden">
              Scroll table horizontally →
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead className="border-b border-border/70 bg-secondary/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Report ID & Title</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Auditor / Author</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Result / Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No reports found matching the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {r.title}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">{r.id}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          to="/departments/$slug"
                          params={{ slug: r.departmentSlug }}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-primary transition-colors"
                        >
                          <Building2 className="size-3.5 text-muted-foreground" />
                          {r.department}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            r.category === "Incident"
                              ? "bg-destructive/12 text-destructive"
                              : r.category === "Audit"
                                ? "bg-primary/12 text-primary"
                                : r.category === "Consent"
                                  ? "bg-chart-2/15 text-chart-2"
                                  : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {r.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">{r.author}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">{r.date}</td>
                      <td className="px-4 py-3.5 text-xs font-bold text-foreground">{r.score}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                            r.status === "Completed"
                              ? "bg-success/12 text-success"
                              : r.status === "Reviewed"
                                ? "bg-primary/12 text-primary"
                                : "bg-warning/15 text-warning"
                          }`}
                        >
                          {r.status === "Completed" && <CheckCircle2 className="size-3" />}
                          {r.status === "Reviewed" && <Check className="size-3" />}
                          {r.status === "Pending Review" && <AlertCircle className="size-3" />}
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveReport(r)}
                          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="size-3.5 text-primary" />
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* View Details Dialog */}
        <Dialog open={!!activeReport} onOpenChange={(o) => !o && setActiveReport(null)}>
          {activeReport && (
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {activeReport.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{activeReport.id}</span>
                </div>
                <DialogTitle className="text-lg mt-1">{activeReport.title}</DialogTitle>
                <DialogDescription>
                  {activeReport.department} · {activeReport.date}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 text-sm py-2">
                <div className="rounded-xl bg-muted/40 p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Author / Auditor:</span>
                    <span className="font-semibold text-foreground">{activeReport.author}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Compliance / Score:</span>
                    <span className="font-bold text-primary">{activeReport.score}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Verification Status:</span>
                    <span className="font-medium text-success">{activeReport.status}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Summary & Findings
                  </h4>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed bg-card p-3 rounded-xl border border-border">
                    {activeReport.summary}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setActiveReport(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    alert(`Report ${activeReport.id} downloaded.`);
                    setActiveReport(null);
                  }}
                  className="gap-1.5"
                >
                  <Download className="size-4" />
                  Download PDF
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>

        {/* Generate Report Dialog */}
        <Dialog open={genOpen} onOpenChange={setGenOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate New Report</DialogTitle>
              <DialogDescription>
                Compile automated clinical quality, audit, or incident report data.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleGenerateReport} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="rep-dept">Department</Label>
                <Select value={genDept} onValueChange={setGenDept}>
                  <SelectTrigger id="rep-dept" className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.slug} value={d.label}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="rep-type">Report Type</Label>
                  <Select value={genType} onValueChange={setGenType}>
                    <SelectTrigger id="rep-type" className="h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Audit">Audit</SelectItem>
                      <SelectItem value="Incident">Incident</SelectItem>
                      <SelectItem value="Checklist">Checklist</SelectItem>
                      <SelectItem value="Consent">Consent</SelectItem>
                      <SelectItem value="Survey">Survey</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rep-period">Time Period</Label>
                  <Select value={genPeriod} onValueChange={setGenPeriod}>
                    <SelectTrigger id="rep-period" className="h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Today">Today</SelectItem>
                      <SelectItem value="Last 4 Days">Last 4 Days</SelectItem>
                      <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                      <SelectItem value="Last 14 Days">Last 14 Days</SelectItem>
                      <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                      <SelectItem value="Last 67 Days">Last 67 Days</SelectItem>
                      <SelectItem value="This Month">This Month</SelectItem>
                      <SelectItem value="Quarter to Date">Quarter to Date</SelectItem>
                      <SelectItem value="Custom Days">Custom Days (Enter any number)</SelectItem>
                      <SelectItem value="Custom Date Range">
                        Custom Date Range (Pick dates)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dynamic Custom Days Section */}
              {genPeriod === "Custom Days" && (
                <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5 space-y-2.5 transition-all">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="custom-days-input"
                      className="text-xs font-semibold text-foreground"
                    >
                      Enter Number of Days
                    </Label>
                    <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                      Last {customDays.trim() || "0"} {Number(customDays) === 1 ? "Day" : "Days"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap pl-1">
                      Last
                    </span>
                    <Input
                      id="custom-days-input"
                      type="number"
                      min="1"
                      max="3650"
                      placeholder="e.g. 4 or 67"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      className="h-10 rounded-xl bg-card"
                    />
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap pr-1">
                      {Number(customDays) === 1 ? "Day" : "Days"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-muted-foreground">Quick pick:</span>
                    {["4", "7", "14", "30", "60", "67", "90"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setCustomDays(d)}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                          customDays === d
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "bg-card border border-border text-foreground/80 hover:bg-muted"
                        }`}
                      >
                        Last {d} Days
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Custom Date Range Section */}
              {genPeriod === "Custom Date Range" && (
                <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5 space-y-2.5 transition-all">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      Pick Specific Date Range
                    </Label>
                    {customStartDate && customEndDate && (
                      <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                        {customStartDate} to {customEndDate}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="start-date" className="text-[11px] text-muted-foreground">
                        From Date
                      </Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="h-9 rounded-lg bg-card text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="end-date" className="text-[11px] text-muted-foreground">
                        To Date
                      </Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="h-9 rounded-lg bg-card text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="rep-notes">Additional Focus Notes (Optional)</Label>
                <Input
                  id="rep-notes"
                  placeholder="e.g. Focus on hand hygiene and crash cart logs"
                  value={genNotes}
                  onChange={(e) => setGenNotes(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setGenOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isGenerated} className="gap-1.5 font-semibold">
                  {isGenerated ? (
                    <>
                      <Check className="size-4 text-success" />
                      Generated!
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="size-4" />
                      Generate
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </DashboardShell>
  );
}
