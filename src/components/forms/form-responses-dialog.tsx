import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CustomForm,
  FormResponse,
  useFormResponses,
} from "@/lib/form-store";
import {
  BarChart3,
  User,
  Table as TableIcon,
  Download,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Inbox,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { toast } from "sonner";

interface FormResponsesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: CustomForm;
}

type TabType = "summary" | "individual" | "table";

const CHART_COLORS = [
  "#0f766e", // teal
  "#2563eb", // blue
  "#dc2626", // red
  "#d97706", // amber
  "#7c3aed", // violet
  "#059669", // emerald
  "#db2777", // pink
  "#4b5563", // gray
];

export function FormResponsesDialog({
  open,
  onOpenChange,
  form,
}: FormResponsesDialogProps) {
  const { responses, loading, refresh } = useFormResponses(form.id);
  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [individualIndex, setIndividualIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered responses based on search query
  const filteredResponses = useMemo(() => {
    if (!searchQuery.trim()) return responses;
    const q = searchQuery.toLowerCase();
    return responses.filter((r) => {
      // search in submission date
      if (new Date(r.submittedAt).toLocaleDateString().toLowerCase().includes(q)) return true;
      if (new Date(r.submittedAt).toLocaleTimeString().toLowerCase().includes(q)) return true;
      if (r.id.toLowerCase().includes(q)) return true;
      // search in answers
      for (const val of Object.values(r.answers || {})) {
        if (typeof val === "string" && val.toLowerCase().includes(q)) return true;
        if (Array.isArray(val) && val.some((v) => String(v).toLowerCase().includes(q))) return true;
      }
      return false;
    });
  }, [responses, searchQuery]);

  // Timeline analytics (responses over time)
  const timelineData = useMemo(() => {
    const countsByDate: Record<string, number> = {};
    for (const r of responses) {
      const dateStr = new Date(r.submittedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
    }

    return Object.entries(countsByDate).map(([date, count]) => ({
      date,
      submissions: count,
    }));
  }, [responses]);

  // Per-question analytics
  const questionAnalytics = useMemo(() => {
    return form.questions.map((q) => {
      const isChoice =
        q.type === "multiple_choice" ||
        q.type === "checkboxes" ||
        q.type === "dropdown";

      if (isChoice) {
        const optionCounts: Record<string, number> = {};
        for (const opt of q.options || []) {
          optionCounts[opt] = 0;
        }

        let totalAnswered = 0;
        for (const r of responses) {
          const val = r.answers?.[q.id];
          if (val !== undefined && val !== null && val !== "") {
            totalAnswered++;
            if (Array.isArray(val)) {
              for (const item of val) {
                optionCounts[item] = (optionCounts[item] || 0) + 1;
              }
            } else {
              optionCounts[String(val)] = (optionCounts[String(val)] || 0) + 1;
            }
          }
        }

        const chartData = Object.entries(optionCounts).map(([option, count]) => ({
          name: option.length > 28 ? option.slice(0, 25) + "..." : option,
          fullName: option,
          count,
          percentage: totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0,
        }));

        return {
          question: q,
          totalAnswered,
          chartData,
        };
      }

      // Text / Paragraph / other types: collect answers list
      const answersList: Array<{ id: string; text: string; date: string }> = [];
      for (const r of responses) {
        const val = r.answers?.[q.id];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          answersList.push({
            id: r.id,
            text: String(val),
            date: new Date(r.submittedAt).toLocaleString(),
          });
        }
      }

      return {
        question: q,
        totalAnswered: answersList.length,
        answersList,
      };
    });
  }, [form, responses]);

  // Export responses to CSV
  const handleExportCSV = () => {
    if (responses.length === 0) {
      toast.error("No responses to export yet.");
      return;
    }

    const headers = ["Response ID", "Submitted At", ...form.questions.map((q) => q.title)];
    const rows = responses.map((r) => {
      const row = [
        r.id,
        new Date(r.submittedAt).toISOString(),
        ...form.questions.map((q) => {
          const ans = r.answers?.[q.id];
          if (ans === undefined || ans === null) return "";
          if (Array.isArray(ans)) return `"${ans.join("; ")}"`;
          return `"${String(ans).replace(/"/g, '""')}"`;
        }),
      ];
      return row.join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-responses.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Responses exported to CSV!");
  };

  const currentIndividual = filteredResponses[individualIndex] || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] w-[calc(100vw-1rem)] sm:w-full max-w-5xl overflow-hidden p-0 flex flex-col sm:rounded-2xl border-border bg-background shadow-2xl">
        {/* Google Forms Top Color Accent Bar */}
        <div className="h-2.5 w-full bg-gradient-to-r from-primary via-teal-600 to-emerald-500 shrink-0" />

        {/* Header Bar */}
        <div className="border-b border-border px-3.5 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-card pr-12 sm:pr-14">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary truncate max-w-[120px] sm:max-w-none">
                {form.departmentLabel}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">Responses Dashboard</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate mt-0.5">
              {form.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground flex items-center gap-1.5">
              <Inbox className="size-3.5 text-primary" />
              <span>{responses.length}</span>
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
              className="gap-1.5 text-xs h-8 px-2 sm:px-3"
              title="Refresh database responses"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary/10 px-2.5 sm:px-3"
              title="Download CSV spreadsheet"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
          </div>
        </div>

        {/* Sub-Header: Google Forms Style Tabs & Search */}
        <div className="px-3.5 sm:px-6 py-2 sm:py-2.5 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab("summary")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                activeTab === "summary"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="size-3.5" />
              <span>Summary <span className="hidden sm:inline">&amp; Analytics</span></span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("individual")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                activeTab === "individual"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="size-3.5" />
              <span>Individual ({responses.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("table")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                activeTab === "table"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TableIcon className="size-3.5" />
              <span>Table <span className="hidden sm:inline">View</span></span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIndividualIndex(0);
              }}
              placeholder="Search answers, dates, names..."
              className="h-8 pl-8 text-xs bg-card border-border w-full"
            />
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/20 space-y-6">
          {responses.length === 0 ? (
            /* Empty State */
            <div className="rounded-2xl border-2 border-dashed border-border bg-card p-12 text-center space-y-3">
              <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto">
                <Inbox className="size-7" />
              </div>
              <h3 className="text-base font-bold text-foreground">Waiting for responses</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No submissions have been recorded for <strong>{form.title}</strong> yet. Once staff or patients fill out the public form, their real database records and analytics will show up here automatically.
              </p>
            </div>
          ) : (
            <>
              {/* ============================================================ */}
              {/* TAB 1: SUMMARY & ANALYTICS */}
              {/* ============================================================ */}
              {activeTab === "summary" && (
                <div className="space-y-6">
                  {/* Top Stats Overview */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="card-soft p-4 flex items-center gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                        <Inbox className="size-5" />
                      </span>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Total Responses</p>
                        <p className="text-2xl font-bold text-foreground">{responses.length}</p>
                      </div>
                    </div>

                    <div className="card-soft p-4 flex items-center gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                        <Clock className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground font-medium">Latest Submission</p>
                        <p className="text-sm font-bold text-foreground truncate">
                          {new Date(responses[0]?.submittedAt || "").toLocaleDateString()}{" "}
                          {new Date(responses[0]?.submittedAt || "").toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="card-soft p-4 flex items-center gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-500/12 text-teal-600 dark:text-teal-400">
                        <Layers className="size-5" />
                      </span>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Questions Configured</p>
                        <p className="text-2xl font-bold text-foreground">{form.questions.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Submissions Over Time Chart */}
                  {timelineData.length > 0 && (
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-foreground">Responses Over Time</h3>
                          <p className="text-xs text-muted-foreground">Volume of submissions by date</p>
                        </div>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                          Real Database Data
                        </span>
                      </div>

                      <div className="h-48 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              allowDecimals={false}
                              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: 12,
                                border: "1px solid hsl(var(--border))",
                                fontSize: 12,
                                backgroundColor: "hsl(var(--card))",
                                color: "hsl(var(--foreground))",
                              }}
                            />
                            <Bar
                              dataKey="submissions"
                              fill="var(--primary)"
                              radius={[6, 6, 0, 0]}
                              maxBarSize={40}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Question-by-Question Analytics Cards */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Question Breakdown ({form.questions.length} questions)
                    </h3>

                    {questionAnalytics.map(({ question: q, totalAnswered, chartData, answersList }, qIdx) => {
                      return (
                        <div
                          key={q.id}
                          className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                                {qIdx + 1}
                              </span>
                              <h4 className="text-sm font-bold text-foreground">{q.title}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {totalAnswered} / {responses.length} answered
                              </span>
                              <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground uppercase">
                                {q.type.replace("_", " ")}
                              </span>
                            </div>
                          </div>

                          {/* Chart for choice-based questions */}
                          {chartData && chartData.length > 0 && (
                            <div className="grid gap-6 md:grid-cols-2 items-center">
                              {/* Chart visual */}
                              <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={chartData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                                    <YAxis
                                      type="category"
                                      dataKey="name"
                                      width={95}
                                      tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
                                    />
                                    <Tooltip
                                      formatter={(val, name, item) => [
                                        `${val} responses (${item.payload.percentage}%)`,
                                        item.payload.fullName,
                                      ]}
                                    />
                                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                      {chartData.map((_, idx) => (
                                        <Cell
                                          key={idx}
                                          fill={CHART_COLORS[idx % CHART_COLORS.length]}
                                        />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>

                              {/* Percentages and counts breakdown */}
                              <div className="space-y-2.5 text-xs">
                                {chartData.map((item, optIdx) => (
                                  <div key={optIdx} className="space-y-1">
                                    <div className="flex justify-between font-medium">
                                      <span className="text-foreground truncate max-w-[200px]">
                                        {item.fullName}
                                      </span>
                                      <span className="text-muted-foreground font-semibold">
                                        {item.count} ({item.percentage}%)
                                      </span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{
                                          width: `${item.percentage}%`,
                                          backgroundColor: CHART_COLORS[optIdx % CHART_COLORS.length],
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Text/Paragraph responses list */}
                          {answersList && (
                            <div className="space-y-2">
                              {answersList.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">No answers recorded yet</p>
                              ) : (
                                <div className="max-h-48 overflow-y-auto divide-y divide-border/60 rounded-xl border border-border bg-muted/20">
                                  {answersList.slice(0, 10).map((ans, aIdx) => (
                                    <div key={aIdx} className="p-3 text-xs flex justify-between gap-3">
                                      <p className="text-foreground font-medium flex-1">{ans.text}</p>
                                      <span className="text-[11px] text-muted-foreground shrink-0">
                                        {ans.date}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 2: INDIVIDUAL RESPONSE VIEW */}
              {/* ============================================================ */}
              {activeTab === "individual" && (
                <div className="space-y-5 max-w-3xl mx-auto">
                  {/* Pager Bar */}
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setIndividualIndex((prev) => Math.max(0, prev - 1))}
                        disabled={individualIndex === 0}
                        className="size-8"
                        title="Previous response"
                      >
                        <ChevronLeft className="size-4" />
                      </Button>

                      <span className="text-sm font-semibold text-foreground px-2">
                        Response {individualIndex + 1} of {filteredResponses.length}
                      </span>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setIndividualIndex((prev) =>
                            Math.min(filteredResponses.length - 1, prev + 1)
                          )
                        }
                        disabled={individualIndex >= filteredResponses.length - 1}
                        className="size-8"
                        title="Next response"
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>

                    {currentIndividual && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="size-3.5" />
                        <span>
                          Submitted on {new Date(currentIndividual.submittedAt).toLocaleDateString()} at{" "}
                          {new Date(currentIndividual.submittedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Individual Question & Answer Cards */}
                  {currentIndividual ? (
                    <div className="space-y-4">
                      {form.questions.map((q, qIdx) => {
                        const rawAnswer = currentIndividual.answers?.[q.id];
                        const isAnswered =
                          rawAnswer !== undefined &&
                          rawAnswer !== null &&
                          rawAnswer !== "" &&
                          !(Array.isArray(rawAnswer) && rawAnswer.length === 0);

                        return (
                          <div
                            key={q.id}
                            className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold text-muted-foreground">
                                Question {qIdx + 1} {q.required && <span className="text-destructive">*</span>}
                              </span>
                              <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground uppercase">
                                {q.type.replace("_", " ")}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-foreground">{q.title}</h4>

                            {/* Render Answer */}
                            <div className="pt-2 border-t border-border/60">
                              {isAnswered ? (
                                Array.isArray(rawAnswer) ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {rawAnswer.map((item, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                                      >
                                        <CheckCircle2 className="size-3" />
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="rounded-xl bg-muted/40 p-3 text-sm font-medium text-foreground whitespace-pre-line border border-border/40">
                                    {String(rawAnswer)}
                                  </div>
                                )
                              ) : (
                                <p className="text-xs text-muted-foreground italic">
                                  No answer submitted
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      No matching individual response found for your search.
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 3: TABLE VIEW (SPREADSHEET STYLE) */}
              {/* ============================================================ */}
              {activeTab === "table" && (
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="p-3 border-b border-border/80 flex items-center justify-between sm:hidden text-[11px] text-primary/80 font-medium">
                    <span>Scroll table horizontally →</span>
                  </div>
                  <div className="overflow-x-auto max-h-[60vh]">
                    <table className="w-full text-left text-xs min-w-[550px]">
                      <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm border-b border-border z-10">
                        <tr>
                          <th className="p-3 font-bold text-foreground shrink-0">#</th>
                          <th className="p-3 font-bold text-foreground whitespace-nowrap">Submitted At</th>
                          {form.questions.map((q) => (
                            <th key={q.id} className="p-3 font-bold text-foreground min-w-[160px]">
                              {q.title}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {filteredResponses.map((resp, rIdx) => (
                          <tr key={resp.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-mono text-muted-foreground font-semibold">
                              {rIdx + 1}
                            </td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap font-medium">
                              {new Date(resp.submittedAt).toLocaleDateString()}{" "}
                              {new Date(resp.submittedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            {form.questions.map((q) => {
                              const ans = resp.answers?.[q.id];
                              let displayVal = "-";
                              if (ans !== undefined && ans !== null) {
                                if (Array.isArray(ans)) {
                                  displayVal = ans.join(", ");
                                } else {
                                  displayVal = String(ans);
                                }
                              }
                              return (
                                <td key={q.id} className="p-3 text-foreground line-clamp-2 max-w-xs">
                                  {displayVal}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-border px-3.5 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3 shrink-0 bg-card">
          <p className="text-xs text-muted-foreground">
            {responses.length} total database records
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
