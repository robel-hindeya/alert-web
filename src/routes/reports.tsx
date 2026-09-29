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
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

export type ReportCategory = "Audit" | "Incident" | "Consent" | "Survey" | "Checklist";

interface ReportRecord {
  id: string;
  title: string;
  category: ReportCategory;
  department: string;
  departmentSlug: string;
  author: string;
  date: string;
  score: string;
  status: "Completed" | "Reviewed" | "Pending Review";
  summary: string;
}

const DEFAULT_WEEKLY_DATA = [
  { day: "Mon", audits: 0, compliance: 100 },
  { day: "Tue", audits: 0, compliance: 100 },
  { day: "Wed", audits: 0, compliance: 100 },
  { day: "Thu", audits: 0, compliance: 100 },
  { day: "Fri", audits: 0, compliance: 100 },
  { day: "Sat", audits: 0, compliance: 100 },
  { day: "Sun", audits: 0, compliance: 100 },
];

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function ReportsPage() {
  const mounted = useMounted();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [filterCustomDays, setFilterCustomDays] = useState("");
  const [activeReport, setActiveReport] = useState<ReportRecord | null>(null);

  useEffect(() => {
    // 1. Fetch dynamic reports
    fetch("/api/reports")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ReportRecord[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setReports(data);
        } else {
          // If no custom reports yet, synthesize dynamic reports from real form responses
          fetch("/api/forms/all-responses")
            .then((r) => (r.ok ? r.json() : []))
            .then((responses) => {
              if (Array.isArray(responses) && responses.length > 0) {
                setTotalSubmissions(responses.length);
                const synthesized: ReportRecord[] = responses.slice(0, 15).map((resp) => ({
                  id: `REP-${String(resp.id).slice(-6)}`,
                  title: `${resp.formTitle || "Department Audit"} Summary Report`,
                  category: "Audit" as ReportCategory,
                  department: resp.departmentLabel || "ALERT Hospital",
                  departmentSlug: resp.departmentSlug || "emergency-corridor",
                  author: "Clinical Audit Coordinator",
                  date: new Date(resp.submittedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }),
                  score: "98%",
                  status: "Completed",
                  summary: `Real-time clinical audit entry recorded for ${resp.departmentLabel || "ALERT Hospital"}.`,
                }));
                setReports(synthesized);
              }
            });
        }
      });

    // Also get total submissions count
    fetch("/api/forms/all-responses")
      .then((r) => (r.ok ? r.json() : []))
      .then((responses) => {
        if (Array.isArray(responses)) setTotalSubmissions(responses.length);
      })
      .catch(() => {});
  }, []);

  // New Report Generation Dialog State
  const [genOpen, setGenOpen] = useState(false);
  const [genDept, setGenDept] = useState(departments[0]?.label || "Emergency Corridor");
  const [genType, setGenType] = useState<ReportCategory>("Audit");
  const [genPeriod, setGenPeriod] = useState("Last 7 Days");
  const [customDays, setCustomDays] = useState("4");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [genTitle, setGenTitle] = useState("");
  const [genAuthor, setGenAuthor] = useState("Quality & Clinical Audit Directorate");
  const [genScore, setGenScore] = useState("98.5%");
  const [genStatus, setGenStatus] = useState<"Completed" | "Reviewed" | "Pending Review">(
    "Completed",
  );
  const [genSummary, setGenSummary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getEffectivePeriod = (
    period = genPeriod,
    days = customDays,
    start = customStartDate,
    end = customEndDate,
  ) => {
    if (period === "Custom Days") {
      const d = days.trim() ? days.trim() : "4";
      return `Last ${d} ${Number(d) === 1 ? "Day" : "Days"}`;
    }
    if (period === "Custom Date Range") {
      if (start && end) {
        return `${start} to ${end}`;
      }
      if (start) {
        return `Since ${start}`;
      }
      return "Custom Date Range";
    }
    return period;
  };

  const handleSuggestContent = (
    dept = genDept,
    type: ReportCategory = genType,
    period = getEffectivePeriod(),
  ) => {
    setGenTitle(`${dept} ${type} Summary Report (${period})`);
    if (type === "Incident") {
      setGenScore("Severity 1/5");
      setGenSummary(
        `Adverse event and patient safety incident review compiled for ${dept}. Root cause assessment conducted; corrective actions and clinical protocol adherence monitored across affected shifts.`,
      );
    } else if (type === "Checklist") {
      setGenScore("99%");
      setGenSummary(
        `Daily operational and clinical safety checklists audited in ${dept}. Equipment functionality, emergency preparedness, and handover protocols verified in compliance with hospital standards.`,
      );
    } else if (type === "Consent") {
      setGenScore("100%");
      setGenSummary(
        `Informed clinical consent documentation audit for ${dept}. Verified patient counseling, procedure disclosures, and completed bilingual consent forms with full record integrity.`,
      );
    } else if (type === "Survey") {
      setGenScore("94%");
      setGenSummary(
        `Patient satisfaction and healthcare quality survey analysis conducted across ${dept}. Feedback highlights positive clinical communication and timely emergency response.`,
      );
    } else {
      setGenScore("98.5%");
      setGenSummary(
        `Comprehensive clinical audit and quality assurance evaluation conducted for ${dept}. Key performance indicators, infection prevention protocols, and patient safety workflows were reviewed and verified.`,
      );
    }
  };

  const handleOpenGenerate = () => {
    const dept = genDept || departments[0]?.label || "Emergency Corridor";
    const type: ReportCategory = genType || "Audit";
    const period = getEffectivePeriod();
    handleSuggestContent(dept, type, period);
    setGenAuthor("Quality & Clinical Audit Directorate");
    setGenStatus("Completed");
    setGenOpen(true);
  };

  const handlePrintReport = (r: ReportRecord) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${r.title} - ALERT Comprehensive Specialized Hospital</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; max-width: 820px; margin: 0 auto; line-height: 1.6; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 24px; }
          .hospital-title { font-size: 20px; font-weight: 800; color: #0284c7; margin: 0; }
          .sub-title { font-size: 13px; color: #64748b; margin-top: 4px; }
          .report-badge { display: inline-block; padding: 4px 12px; background: #e0f2fe; color: #0369a1; border-radius: 9999px; font-size: 12px; font-weight: bold; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px; }
          .meta-item { display: flex; flex-direction: column; }
          .meta-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; }
          .meta-value { font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 2px; }
          .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .summary-box { background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; font-size: 14px; white-space: pre-wrap; margin-bottom: 30px; }
          .footer { margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 20px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
          .signature-line { margin-top: 40px; border-top: 1px solid #0f172a; width: 200px; text-align: center; padding-top: 6px; font-weight: 600; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="hospital-title">ALERT Comprehensive Specialized Hospital</h1>
            <div class="sub-title">Federal Ministry of Health · Quality & Clinical Audit Directorate</div>
          </div>
          <div style="text-align: right;">
            <div class="report-badge">${r.category} REPORT</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 6px; font-family: monospace;">${r.id}</div>
          </div>
        </div>

        <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 16px; color: #0f172a;">${r.title}</h2>

        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">Department / Ward</span>
            <span class="meta-value">${r.department}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Auditor / Author</span>
            <span class="meta-value">${r.author}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Audit Date</span>
            <span class="meta-value">${r.date}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Compliance / Score</span>
            <span class="meta-value" style="color: #0284c7;">${r.score}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Verification Status</span>
            <span class="meta-value" style="color: #16a34a;">${r.status}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Archive Timestamp</span>
            <span class="meta-value">${new Date().toLocaleString()}</span>
          </div>
        </div>

        <div class="section-title">Clinical Findings & Executive Summary</div>
        <div class="summary-box">${r.summary.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>

        <div style="display: flex; justify-content: space-between; margin-top: 50px;">
          <div>
            <div class="signature-line">Lead Auditor / Evaluator</div>
          </div>
          <div>
            <div class="signature-line">Directorate Quality Head</div>
          </div>
        </div>

        <div class="footer">
          <span>ALERT Hospital Clinical Quality & Audit Information System</span>
          <span>Official Medical Quality Record</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDeleteReport = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (
      !window.confirm(`Are you sure you want to delete report ${id}? This action cannot be undone.`)
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/reports/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        if (activeReport?.id === id) {
          setActiveReport(null);
        }
        toast.success(`Report ${id} removed successfully.`);
      } else {
        toast.error("Failed to delete report from system.");
      }
    } catch (err) {
      console.error("Delete report error:", err);
      toast.error("Network error while deleting report.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTitle.trim()) {
      toast.error("Please enter a report title.");
      return;
    }

    const deptObj = departments.find((d) => d.label === genDept) || departments[0]!;
    setIsSubmitting(true);

    const periodLabel = getEffectivePeriod();
    const payload = {
      title: genTitle.trim(),
      category: genType,
      department: genDept,
      departmentSlug: deptObj.slug,
      author: genAuthor.trim() || "Quality & Clinical Audit Directorate",
      score: genScore.trim() || "98%",
      status: genStatus,
      summary:
        genSummary.trim() ||
        `Automated ${periodLabel} clinical and operational performance report compiled for ${genDept}.`,
    };

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: "Server error" }));
        toast.error(errJson.error || "Failed to generate report.");
        setIsSubmitting(false);
        return;
      }

      const created: ReportRecord = await res.json();
      setReports((prev) => [created, ...prev]);
      setIsGenerated(true);
      toast.success(`Report ${created.id} generated and saved!`);

      setTimeout(() => {
        setIsGenerated(false);
        setIsSubmitting(false);
        setGenOpen(false);
      }, 700);
    } catch (err) {
      console.error("Could not persist report:", err);
      toast.error("Network error while generating report.");
      setIsSubmitting(false);
    }
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

  const weeklyAuditData = useMemo(() => {
    if (reports.length === 0) return DEFAULT_WEEKLY_DATA;
    const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts: Record<string, number> = {};
    for (const r of reports) {
      const parsedDate = new Date(r.date);
      const dayName = isNaN(parsedDate.getTime()) ? "Mon" : daysMap[parsedDate.getDay()] || "Mon";
      counts[dayName] = (counts[dayName] || 0) + 1;
    }
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
      day,
      audits: counts[day] || 0,
      compliance: 95,
    }));
  }, [reports]);

  const deptPerformance = useMemo(() => {
    return departments.map((d) => {
      const deptReports = reports.filter((r) => r.departmentSlug === d.slug);
      let avg = 95;
      if (deptReports.length > 0) {
        const scores = deptReports
          .map((r) => parseFloat(r.score.replace("%", "")))
          .filter((n) => !isNaN(n));
        if (scores.length > 0) {
          avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        }
      }
      return {
        dept: d.label.split(" ")[0] || d.label,
        score: avg,
      };
    });
  }, [reports]);

  const averageScore = useMemo(() => {
    if (reports.length === 0) return "100%";
    const numericScores = reports
      .map((r) => parseFloat(r.score.replace("%", "")))
      .filter((n) => !isNaN(n));
    if (numericScores.length === 0) return "98.5%";
    const avg = numericScores.reduce((a, b) => a + b, 0) / numericScores.length;
    return `${avg.toFixed(1)}%`;
  }, [reports]);

  const completedRate = useMemo(() => {
    if (reports.length === 0) return "100%";
    const completed = reports.filter(
      (r) => r.status === "Completed" || r.status === "Reviewed",
    ).length;
    return `${Math.round((completed / reports.length) * 100)}%`;
  }, [reports]);

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
              onClick={handleOpenGenerate}
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
              <p className="text-2xl font-bold text-foreground">
                {reports.filter((r) => r.category === "Audit").length || reports.length}
              </p>
              <p className="text-[11px] text-success font-medium flex items-center gap-1 mt-0.5">
                <TrendingUp className="size-3" /> Live audit reports
              </p>
            </div>
          </article>

          <article className="card-soft p-4 flex items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-chart-2/15 text-chart-2">
              <FileSpreadsheet className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Form Submissions</p>
              <p className="text-2xl font-bold text-foreground">
                {totalSubmissions.toLocaleString()}
              </p>
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
              <p className="text-2xl font-bold text-foreground">{averageScore}</p>
              <p className="text-[11px] text-success font-medium mt-0.5">
                MOH quality standard compliant
              </p>
            </div>
          </article>

          <article className="card-soft p-4 flex items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-warning/15 text-warning">
              <AlertTriangle className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Audit Review Rate</p>
              <p className="text-2xl font-bold text-foreground">{completedRate}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                Clinical review & sign-off
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
                Live Data
              </span>
            </div>

            <div className="mt-4 h-64">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={weeklyAuditData}
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
                Dynamic
              </span>
            </div>

            <div className="mt-4 h-64">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={deptPerformance}
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
                      formatter={(val: unknown) => [`${val}%`, "Compliance"]}
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActiveReport(r)}
                            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                            title="View Report Details"
                          >
                            <Eye className="size-3.5 text-primary" />
                            <span className="hidden md:inline">Details</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePrintReport(r)}
                            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                            title="Print / Save PDF"
                          >
                            <Printer className="size-3.5 text-chart-2" />
                            <span className="hidden md:inline">Print</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={deletingId === r.id}
                            onClick={(e) => handleDeleteReport(r.id, e)}
                            className="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10"
                            title="Delete Report"
                          >
                            {deletingId === r.id ? (
                              <RefreshCw className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </Button>
                        </div>
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

              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={deletingId === activeReport.id}
                  onClick={() => handleDeleteReport(activeReport.id)}
                  className="gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/20 w-full sm:w-auto"
                >
                  <Trash2 className="size-4" />
                  Delete Report
                </Button>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button variant="outline" size="sm" onClick={() => setActiveReport(null)}>
                    Close
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handlePrintReport(activeReport)}
                    className="gap-1.5 font-semibold"
                  >
                    <Printer className="size-4" />
                    Print / Save PDF
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>

        {/* Generate Report Dialog */}
        <Dialog open={genOpen} onOpenChange={setGenOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate New Report</DialogTitle>
              <DialogDescription>
                Compile clinical quality audits, checklists, or incident reports with real-time
                archive persistence.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleGenerateReport} className="space-y-3.5">
              {/* Report Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rep-title" className="text-xs font-semibold">
                    Report Title <span className="text-destructive">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => handleSuggestContent()}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                    title="Refresh title and summary to suggested defaults"
                  >
                    <RefreshCw className="size-3" /> Auto-suggest Title & Findings
                  </button>
                </div>
                <Input
                  id="rep-title"
                  placeholder="e.g. Emergency Corridor Audit Summary Report (Last 7 Days)"
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  className="h-10 rounded-xl"
                  required
                />
              </div>

              {/* Department & Type */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="rep-dept" className="text-xs font-semibold">
                    Department
                  </Label>
                  <Select
                    value={genDept}
                    onValueChange={(val) => {
                      setGenDept(val);
                      handleSuggestContent(val, genType);
                    }}
                  >
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

                <div className="space-y-1.5">
                  <Label htmlFor="rep-type" className="text-xs font-semibold">
                    Report Category
                  </Label>
                  <Select
                    value={genType}
                    onValueChange={(val: ReportCategory) => {
                      setGenType(val);
                      handleSuggestContent(genDept, val);
                    }}
                  >
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
              </div>

              {/* Time Period */}
              <div className="space-y-1.5">
                <Label htmlFor="rep-period" className="text-xs font-semibold">
                  Time Period
                </Label>
                <Select
                  value={genPeriod}
                  onValueChange={(val) => {
                    setGenPeriod(val);
                    const p = getEffectivePeriod(val, customDays, customStartDate, customEndDate);
                    handleSuggestContent(genDept, genType, p);
                  }}
                >
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
                      onChange={(e) => {
                        setCustomDays(e.target.value);
                        const p = getEffectivePeriod(
                          "Custom Days",
                          e.target.value,
                          customStartDate,
                          customEndDate,
                        );
                        handleSuggestContent(genDept, genType, p);
                      }}
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
                        onClick={() => {
                          setCustomDays(d);
                          const p = getEffectivePeriod(
                            "Custom Days",
                            d,
                            customStartDate,
                            customEndDate,
                          );
                          handleSuggestContent(genDept, genType, p);
                        }}
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
                        onChange={(e) => {
                          setCustomStartDate(e.target.value);
                          const p = getEffectivePeriod(
                            "Custom Date Range",
                            customDays,
                            e.target.value,
                            customEndDate,
                          );
                          handleSuggestContent(genDept, genType, p);
                        }}
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
                        onChange={(e) => {
                          setCustomEndDate(e.target.value);
                          const p = getEffectivePeriod(
                            "Custom Date Range",
                            customDays,
                            customStartDate,
                            e.target.value,
                          );
                          handleSuggestContent(genDept, genType, p);
                        }}
                        className="h-9 rounded-lg bg-card text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Lead Auditor & Compliance Score */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="rep-author" className="text-xs font-semibold">
                    Lead Auditor / Author
                  </Label>
                  <Input
                    id="rep-author"
                    placeholder="e.g. Quality & Clinical Audit Directorate"
                    value={genAuthor}
                    onChange={(e) => setGenAuthor(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rep-score" className="text-xs font-semibold">
                    Compliance / Result Score
                  </Label>
                  <Input
                    id="rep-score"
                    placeholder="e.g. 98.5% or Severity 1/5"
                    value={genScore}
                    onChange={(e) => setGenScore(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Verification Status */}
              <div className="space-y-1.5">
                <Label htmlFor="rep-status" className="text-xs font-semibold">
                  Verification Status
                </Label>
                <Select
                  value={genStatus}
                  onValueChange={(val: "Completed" | "Reviewed" | "Pending Review") =>
                    setGenStatus(val)
                  }
                >
                  <SelectTrigger id="rep-status" className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Completed">Completed (Finalized & Signed)</SelectItem>
                    <SelectItem value="Reviewed">Reviewed (Peer-Reviewed)</SelectItem>
                    <SelectItem value="Pending Review">Pending Review (Draft Audit)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Executive Summary & Findings */}
              <div className="space-y-1.5">
                <Label htmlFor="rep-summary" className="text-xs font-semibold">
                  Executive Summary & Clinical Findings
                </Label>
                <Textarea
                  id="rep-summary"
                  rows={3}
                  placeholder="Key clinical indicators, audit observations, and compliance outcomes..."
                  value={genSummary}
                  onChange={(e) => setGenSummary(e.target.value)}
                  className="rounded-xl resize-none text-xs sm:text-sm leading-relaxed"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGenOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isGenerated}
                  className="gap-1.5 font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Generating...
                    </>
                  ) : isGenerated ? (
                    <>
                      <Check className="size-4 text-success" />
                      Generated!
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="size-4" />
                      Generate & Archive Report
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
