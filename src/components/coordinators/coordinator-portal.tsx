import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Home,
  History,
  User,
  Clock,
  ClipboardCheck,
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Share2,
  Trash2,
  Eye,
  Download,
  Building2,
  Sparkles,
  ShieldCheck,
  Phone,
  Mail,
  Calendar,
  Award,
  ArrowRight,
  ExternalLink,
  Layers,
  ArrowLeft,
  X,
  Send,
  Printer,
  ChevronRight,
  UserCheck,
  Briefcase,
  MapPin,
  FileQuestion,
  Info,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/alert-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useDepartmentForms,
  useAllResponses,
  saveFormResponse,
  CustomForm,
  FormResponse,
  FormQuestion,
} from "@/lib/form-store";
import { departments } from "@/routes/departments.$slug";
import { useDeptSession, saveDeptSession } from "@/lib/dept-session";

export type NavTab = "home" | "history" | "profile";

export interface CoordinatorProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  departmentSlug: string;
  email: string;
  phone: string;
  shift: string;
  certified: boolean;
  certificationTitle: string;
  hospital: string;
  office: string;
  bio: string;
  duties: string[];
}

const DEFAULT_PROFILE: CoordinatorProfile = {
  id: "CRD-001",
  name: "Dr. Alem Tesfaye",
  role: "Lead Clinical Audit Coordinator",
  department: "Emergency Corridor",
  departmentSlug: "emergency-corridor",
  email: "alem.tesfaye@alert.gov.et",
  phone: "+251 911 224 551",
  shift: "Day Shift (08:00 - 16:00)",
  certified: true,
  certificationTitle: "Certified Clinical Quality Auditor (CCQA)",
  hospital: "ALERT Comprehensive Specialized Hospital",
  office: "Block B, Room 204 — Quality & Audit Directorate",
  bio: "Lead Clinical Audit Coordinator overseeing continuous quality improvement, emergency triage protocol audits, and clinical documentation compliance across ALERT Hospital.",
  duties: [
    "Daily clinical triage & audit rounds",
    "Chart completeness verification",
    "Sentinel incident reporting & root-cause analysis",
    "Departmental clinical checklist governance",
    "Monthly quality assurance compliance reports",
  ],
};

const PROFILE_STORAGE_KEY = "alert_coordinator_profile";

export function CoordinatorPortal() {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const { session } = useDeptSession();

  // Coordinator Profile state
  const [profile, setProfile] = useState<CoordinatorProfile>(() => {
    if (typeof window === "undefined") return DEFAULT_PROFILE;
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return DEFAULT_PROFILE;
  });

  // Active department for viewing forms
  const [selectedDeptSlug, setSelectedDeptSlug] = useState<string>(() => {
    return session?.slug || profile.departmentSlug || "emergency-corridor";
  });

  // Find department label
  const activeDept = useMemo(() => {
    return (
      departments.find((d) => d.slug === selectedDeptSlug) || {
        slug: selectedDeptSlug,
        label: profile.department || "Emergency Corridor",
      }
    );
  }, [selectedDeptSlug, profile.department]);

  // Forms hook for active department
  const { forms, refresh: refreshForms } = useDepartmentForms(selectedDeptSlug);

  // All responses hook for history
  const { responses: allResponses, loading: loadingResponses, refresh: refreshResponses } = useAllResponses();

  // Modals state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState<CoordinatorProfile>(profile);

  const [fillModalOpen, setFillModalOpen] = useState(false);
  const [formToFill, setFormToFill] = useState<CustomForm | null>(null);

  const [viewResponseModalOpen, setViewResponseModalOpen] = useState(false);
  const [viewingResponse, setViewingResponse] = useState<any | null>(null);

  // Filters
  const [formSearch, setFormSearch] = useState("");
  const [formTypeFilter, setFormTypeFilter] = useState("all");

  const [historySearch, setHistorySearch] = useState("");
  const [historyFormFilter, setHistoryFormFilter] = useState("all");

  // Keep profile in sync
  const saveProfileChanges = () => {
    setProfile(profileDraft);
    if (typeof window !== "undefined") {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileDraft));
      // If department changed, update dept session
      if (profileDraft.departmentSlug !== profile.departmentSlug) {
        saveDeptSession({
          slug: profileDraft.departmentSlug,
          label: profileDraft.department,
        });
        setSelectedDeptSlug(profileDraft.departmentSlug);
      }
    }
    setEditProfileOpen(false);
    toast.success("Coordinator profile updated successfully!");
  };

  // Filtered department forms
  const filteredForms = useMemo(() => {
    return forms.filter((f) => {
      const matchesSearch =
        f.title.toLowerCase().includes(formSearch.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(formSearch.toLowerCase()));
      if (!matchesSearch) return false;

      if (formTypeFilter === "all") return true;
      const lowerTitle = f.title.toLowerCase();
      if (formTypeFilter === "audit") return lowerTitle.includes("audit") || lowerTitle.includes("checklist");
      if (formTypeFilter === "consent") return lowerTitle.includes("consent");
      if (formTypeFilter === "report") return lowerTitle.includes("report") || lowerTitle.includes("incident");
      if (formTypeFilter === "survey") return lowerTitle.includes("survey") || lowerTitle.includes("quality");
      return true;
    });
  }, [forms, formSearch, formTypeFilter]);

  // Filtered history responses
  const filteredResponses = useMemo(() => {
    return allResponses.filter((r) => {
      if (historyFormFilter !== "all" && r.formId !== historyFormFilter) {
        return false;
      }
      if (!historySearch.trim()) return true;
      const q = historySearch.toLowerCase();
      if (r.id.toLowerCase().includes(q)) return true;
      if (r.formTitle && r.formTitle.toLowerCase().includes(q)) return true;
      if (r.departmentLabel && r.departmentLabel.toLowerCase().includes(q)) return true;
      // Search in answers
      for (const val of Object.values(r.answers || {})) {
        if (typeof val === "string" && val.toLowerCase().includes(q)) return true;
        if (Array.isArray(val) && val.some((v) => String(v).toLowerCase().includes(q))) return true;
      }
      return false;
    });
  }, [allResponses, historySearch, historyFormFilter]);

  // Handle Form Actions
  const handleOpenFill = (form: CustomForm) => {
    setFormToFill(form);
    setFillModalOpen(true);
  };

  const handleCopyLink = (formId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/forms/${formId}`;
    navigator.clipboard.writeText(url);
    toast.success("Form link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* ============================================================ */}
      {/* PC / DESKTOP SIDEBAR (Visible on md and larger screens)        */}
      {/* ============================================================ */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-border bg-card shrink-0 sticky top-0 h-screen select-none z-30">
        {/* Hospital Branding */}
        <div className="p-4 border-b border-border bg-card/50">
          <div className="flex items-center gap-3">
            <img
              src={logo.url}
              alt="ALERT Hospital Logo"
              className="h-10 w-auto object-contain shrink-0"
            />
            <div className="min-w-0">
              <span className="block text-sm font-bold leading-tight text-foreground truncate">
                ALERT Hospital
              </span>
              <span className="block text-[11px] font-semibold text-primary truncate">
                Coordinator Portal
              </span>
            </div>
          </div>
        </div>

        {/* 3 Main Navigation Buttons in PC Sidebar */}
        <div className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </div>

          {/* 1. HOME BUTTON */}
          <button
            onClick={() => setActiveTab("home")}
            className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === "home"
                ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                : "text-foreground hover:bg-muted/70"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Home className={`size-4.5 shrink-0 ${activeTab === "home" ? "text-primary-foreground" : "text-primary"}`} />
              <div className="text-left min-w-0">
                <div className="truncate">Home</div>
                <div className={`text-[11px] font-normal truncate ${activeTab === "home" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  Department Forms
                </div>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === "home"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {forms.length}
            </Badge>
          </button>

          {/* 2. HISTORY BUTTON */}
          <button
            onClick={() => setActiveTab("history")}
            className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === "history"
                ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                : "text-foreground hover:bg-muted/70"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <History className={`size-4.5 shrink-0 ${activeTab === "history" ? "text-primary-foreground" : "text-primary"}`} />
              <div className="text-left min-w-0">
                <div className="truncate">History</div>
                <div className={`text-[11px] font-normal truncate ${activeTab === "history" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  My Submit History
                </div>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === "history"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {allResponses.length}
            </Badge>
          </button>

          {/* 3. PROFILE BUTTON */}
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === "profile"
                ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                : "text-foreground hover:bg-muted/70"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <User className={`size-4.5 shrink-0 ${activeTab === "profile" ? "text-primary-foreground" : "text-primary"}`} />
              <div className="text-left min-w-0">
                <div className="truncate">Profile</div>
                <div className={`text-[11px] font-normal truncate ${activeTab === "profile" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  My Info & Credentials
                </div>
              </div>
            </div>
            <span className="flex size-2 rounded-full bg-emerald-500" title="Online" />
          </button>
        </div>

        {/* Department Switcher in PC Sidebar */}
        <div className="px-4 py-3 mx-3 my-2 rounded-xl bg-muted/40 border border-border/60">
          <Label className="text-[11px] font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">
            Active Department
          </Label>
          <Select
            value={selectedDeptSlug}
            onValueChange={(slug) => {
              setSelectedDeptSlug(slug);
              const found = departments.find((d) => d.slug === slug);
              if (found) {
                saveDeptSession({ slug: found.slug, label: found.label });
              }
            }}
          >
            <SelectTrigger className="w-full text-xs h-9 bg-background">
              <Building2 className="size-3.5 text-primary shrink-0 mr-1" />
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

        {/* Sidebar Footer: Coordinator Mini Info & Exit */}
        <div className="mt-auto border-t border-border p-3 space-y-2 bg-card/30">
          <div
            onClick={() => setActiveTab("profile")}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
          >
            <div className="size-9 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-xs shrink-0">
              {profile.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-foreground truncate">{profile.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{profile.department}</div>
            </div>
          </div>

          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors border border-border/60"
          >
            <ArrowLeft className="size-3.5" />
            <span>Hospital Dashboard</span>
          </Link>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* PHONE TOP HEADER (Mobile < md)                                */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-30 flex md:hidden h-14 w-full items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={logo.url}
            alt="ALERT Hospital Logo"
            className="h-7 w-auto object-contain shrink-0"
          />
          <div className="min-w-0">
            <span className="block text-xs font-bold leading-tight text-foreground truncate">
              ALERT Hospital
            </span>
            <span className="block text-[10px] text-primary font-semibold leading-none truncate">
              Coordinator · {activeDept.label}
            </span>
          </div>
        </div>

        {/* Mobile current active tab badge */}
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[11px] capitalize font-medium px-2 py-0.5 border-primary/30 text-primary bg-primary/5">
            {activeTab === "home" ? "Forms" : activeTab === "history" ? "History" : "Profile"}
          </Badge>
          <Link
            to="/"
            className="grid size-7 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
            title="Main Dashboard"
          >
            <ArrowLeft className="size-3.5" />
          </Link>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN CONTENT AREA (Scrollable, responsive)                   */}
      {/* ============================================================ */}
      <main className="flex-1 min-w-0 pb-24 md:pb-8 flex flex-col">
        {/* TAB 1: HOME (MY DEPARTMENT FORMS) */}
        {activeTab === "home" && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full mx-auto animate-in fade-in duration-200">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                  <Building2 className="size-3.5" />
                  <span>{activeDept.label}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  My Department Forms
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Clinical checklists and intake forms assigned to {activeDept.label}.
                </p>
              </div>
            </div>

            {/* Quick KPI stats banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs">
                <span className="text-[11px] font-semibold text-muted-foreground block">Available Forms</span>
                <span className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 block">{forms.length}</span>
                <span className="text-[10px] text-primary font-medium">Ready to fill</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs">
                <span className="text-[11px] font-semibold text-muted-foreground block">Department</span>
                <span className="text-sm font-bold text-foreground mt-1 truncate block">{activeDept.label}</span>
                <span className="text-[10px] text-muted-foreground">ALERT Hospital</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs">
                <span className="text-[11px] font-semibold text-muted-foreground block">Coordinator</span>
                <span className="text-sm font-bold text-foreground mt-1 truncate block">{profile.name}</span>
                <span className="text-[10px] text-primary font-medium">{profile.role}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs">
                <span className="text-[11px] font-semibold text-muted-foreground block">Shift</span>
                <span className="text-xs sm:text-sm font-bold text-foreground mt-1 truncate block">{profile.shift}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Active Duty</span>
              </div>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search department forms by title..."
                  value={formSearch}
                  onChange={(e) => setFormSearch(e.target.value)}
                  className="pl-9 text-xs sm:text-sm h-10 rounded-xl bg-card"
                />
              </div>

              {/* Form Type Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: "all", label: "All Forms" },
                  { id: "audit", label: "Audits & Checklists" },
                  { id: "consent", label: "Consents" },
                  { id: "report", label: "Incident Reports" },
                  { id: "survey", label: "Surveys" },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setFormTypeFilter(chip.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      formTypeFilter === chip.id
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Cards List */}
            {filteredForms.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-dashed border-border bg-card/40 space-y-3">
                <div className="size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto">
                  <ClipboardCheck className="size-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">No forms found</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  {formSearch
                    ? "No forms match your search query. Try clearing your filter."
                    : "No forms have been assigned to this department yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredForms.map((form) => {
                  return (
                    <div
                      key={form.id}
                      className="group rounded-2xl border border-border/80 bg-card p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-primary/40 transition-all"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <Badge
                            variant="secondary"
                            className="text-[11px] font-semibold bg-primary/10 text-primary border-transparent"
                          >
                            {form.questions?.length || 0} Questions
                          </Badge>
                          <button
                            onClick={(e) => handleCopyLink(form.id, e)}
                            className="size-7 grid place-items-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy Share Link"
                          >
                            <Share2 className="size-3.5" />
                          </button>
                        </div>

                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                            {form.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {form.description || "Standard department audit and clinical data collection form."}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer: Fill Form Button */}
                      <div className="pt-4 mt-3 border-t border-border/70">
                        <Button
                          onClick={() => handleOpenFill(form)}
                          size="sm"
                          className="w-full gap-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                        >
                          <Send className="size-3.5" />
                          <span>Fill & Submit Form</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HISTORY (MY LAST SUBMIT HISTORY) */}
        {activeTab === "history" && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full mx-auto animate-in fade-in duration-200">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                  <Clock className="size-3.5" />
                  <span>Audit Logs & Entries</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  My Submit History
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Review your recent clinical form submissions, incident reports, and audit entries.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshResponses()}
                  className="gap-1.5 text-xs rounded-xl"
                >
                  <History className="size-3.5" />
                  <span>Refresh</span>
                </Button>
                <Button
                  onClick={() => setActiveTab("home")}
                  size="sm"
                  className="gap-1.5 text-xs font-semibold rounded-xl"
                >
                  <Plus className="size-3.5" />
                  <span>Fill New Form</span>
                </Button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-medium block">Total Entries Recorded</span>
                  <span className="text-2xl font-bold text-foreground mt-0.5 block">{allResponses.length}</span>
                </div>
                <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <CheckCircle2 className="size-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-medium block">Latest Submission</span>
                  <span className="text-xs sm:text-sm font-bold text-foreground mt-1 block">
                    {allResponses[0]
                      ? new Date(allResponses[0].submittedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          month: "short",
                          day: "numeric",
                        })
                      : "None yet"}
                  </span>
                </div>
                <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center">
                  <Clock className="size-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-medium block">Submitter ID</span>
                  <span className="text-sm font-bold text-foreground mt-0.5 block">{profile.id}</span>
                  <span className="text-[11px] text-muted-foreground truncate block">{profile.name}</span>
                </div>
                <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 grid place-items-center">
                  <ShieldCheck className="size-5" />
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search submissions by keyword, MRN, answer..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-9 text-xs sm:text-sm h-10 rounded-xl bg-card"
                />
              </div>

              <div className="flex items-center gap-2">
                <Select value={historyFormFilter} onValueChange={setHistoryFormFilter}>
                  <SelectTrigger className="w-[200px] text-xs h-10 bg-card rounded-xl">
                    <SelectValue placeholder="Filter by form" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Forms</SelectItem>
                    {forms.map((f) => (
                      <SelectItem key={f.id} value={f.id} className="text-xs">
                        {f.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submissions List */}
            {filteredResponses.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 space-y-3">
                <div className="size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto">
                  <History className="size-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">No submissions found</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  {historySearch
                    ? "No submission records match your search filter."
                    : "You haven't submitted any forms yet. Go to Home to fill your first checklist or triage sheet!"}
                </p>
                <Button onClick={() => setActiveTab("home")} size="sm" className="gap-1.5">
                  <Plus className="size-3.5" />
                  Fill a Form
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredResponses.map((item) => {
                  const dateObj = new Date(item.submittedAt);
                  const formattedDate = dateObj.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const formattedTime = dateObj.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  // Extract key preview answers
                  const answerEntries = Object.entries(item.answers || {});
                  const previewAnswers = answerEntries.slice(0, 3);

                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-xs transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="size-8 rounded-lg bg-primary/10 text-primary font-bold grid place-items-center text-xs shrink-0">
                            <FileText className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-sm sm:text-base font-bold text-foreground truncate">
                              {item.formTitle || "Department Checklist Submission"}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="font-mono text-primary/80">{item.id}</span>
                              <span>·</span>
                              <span>{item.departmentLabel || activeDept.label}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1">
                            <CheckCircle2 className="size-3" />
                            <span>Submitted</span>
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formattedDate} at {formattedTime}
                          </span>
                        </div>
                      </div>

                      {/* Answers Snapshot */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                        {previewAnswers.map(([qKey, val]) => {
                          const displayVal = Array.isArray(val)
                            ? val.join(", ")
                            : typeof val === "object"
                            ? JSON.stringify(val)
                            : String(val);

                          return (
                            <div key={qKey} className="p-2.5 rounded-xl bg-muted/30 border border-border/50 text-xs">
                              <span className="text-[10px] text-muted-foreground uppercase font-semibold block truncate">
                                {qKey.replace(/^q-/, "").replace(/-/g, " ")}
                              </span>
                              <span className="font-medium text-foreground truncate block mt-0.5">
                                {displayVal || "—"}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setViewingResponse(item);
                            setViewResponseModalOpen(true);
                          }}
                          className="text-xs gap-1.5 h-8 rounded-lg"
                        >
                          <Eye className="size-3.5" />
                          <span>View Full Response</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROFILE (MY INFO) */}
        {activeTab === "profile" && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl w-full mx-auto animate-in fade-in duration-200">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                  <User className="size-3.5" />
                  <span>Coordinator Credentials</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  My Profile & Information
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Personal audit credentials, assigned department, and hospital duties.
                </p>
              </div>

              <Button
                onClick={() => {
                  setProfileDraft(profile);
                  setEditProfileOpen(true);
                }}
                className="gap-1.5 font-semibold text-xs sm:text-sm rounded-xl shadow-xs"
              >
                <UserCheck className="size-4" />
                <span>Edit Profile</span>
              </Button>
            </div>

            {/* Profile Overview Card */}
            <div className="p-6 rounded-3xl border border-border/80 bg-card shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="size-20 sm:size-24 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/30 border-2 border-primary/20 text-primary font-bold text-2xl sm:text-3xl flex items-center justify-center shrink-0 shadow-xs">
                  {profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>

                <div className="text-center sm:text-left space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">{profile.name}</h2>
                    <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold text-xs">
                      {profile.id}
                    </Badge>
                    {profile.certified && (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold text-xs border-emerald-500/30 gap-1">
                        <Award className="size-3" />
                        <span>Certified Auditor</span>
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-primary">{profile.role}</p>
                  <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              </div>

              {/* Badges / Metrics in Profile Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border/70">
                <div className="p-3 rounded-xl bg-muted/40">
                  <span className="text-[11px] text-muted-foreground font-medium block">Department</span>
                  <span className="text-xs sm:text-sm font-bold text-foreground mt-0.5 truncate block">
                    {profile.department}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-muted/40">
                  <span className="text-[11px] text-muted-foreground font-medium block">Shift Schedule</span>
                  <span className="text-xs sm:text-sm font-bold text-foreground mt-0.5 truncate block">
                    {profile.shift}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-muted/40">
                  <span className="text-[11px] text-muted-foreground font-medium block">Total Submissions</span>
                  <span className="text-xs sm:text-sm font-bold text-foreground mt-0.5 truncate block">
                    {allResponses.length} Logs
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-muted/40">
                  <span className="text-[11px] text-muted-foreground font-medium block">Account Status</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                    <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                    Active Duty
                  </span>
                </div>
              </div>
            </div>

            {/* Information Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contact Information */}
              <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4">
                <div className="flex items-center gap-2 border-b border-border/70 pb-3">
                  <Mail className="size-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Contact & Office</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Official Email</span>
                    <span className="font-semibold text-foreground mt-0.5 block">{profile.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Direct Phone</span>
                    <span className="font-semibold text-foreground mt-0.5 block">{profile.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Facility Location</span>
                    <span className="font-semibold text-foreground mt-0.5 block">{profile.hospital}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Office Room</span>
                    <span className="font-semibold text-foreground mt-0.5 block">{profile.office}</span>
                  </div>
                </div>
              </div>

              {/* Professional Duties & Governance */}
              <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4">
                <div className="flex items-center gap-2 border-b border-border/70 pb-3">
                  <Briefcase className="size-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Assigned Duties & Audit Scope</h3>
                </div>

                <div className="space-y-2 text-xs">
                  {profile.duties.map((duty, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-muted/30">
                      <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="font-medium text-foreground">{duty}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* PHONE BOTTOM NAVBAR (Mobile < md)                             */}
      {/* EXACTLY 3 BUTTONS: Home, History, Profile                      */}
      {/* ============================================================ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-lg border-t border-border z-40 px-3 py-2 shadow-2xl safe-area-bottom">
        <div className="grid grid-cols-3 gap-1 max-w-md mx-auto">
          {/* 1. HOME BUTTON */}
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all ${
              activeTab === "home"
                ? "bg-primary text-primary-foreground font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home className="size-5 shrink-0" />
            <span className="text-[11px] mt-1 font-medium">Home</span>
          </button>

          {/* 2. HISTORY BUTTON */}
          <button
            onClick={() => setActiveTab("history")}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all relative ${
              activeTab === "history"
                ? "bg-primary text-primary-foreground font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="size-5 shrink-0" />
            <span className="text-[11px] mt-1 font-medium">History</span>
            {allResponses.length > 0 && activeTab !== "history" && (
              <span className="absolute top-1.5 right-6 size-2 rounded-full bg-primary" />
            )}
          </button>

          {/* 3. PROFILE BUTTON */}
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all ${
              activeTab === "profile"
                ? "bg-primary text-primary-foreground font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="size-5 shrink-0" />
            <span className="text-[11px] mt-1 font-medium">Profile</span>
          </button>
        </div>
      </nav>

      {/* ============================================================ */}
      {/* MODAL: EDIT COORDINATOR PROFILE                              */}
      {/* ============================================================ */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Coordinator Info</DialogTitle>
            <DialogDescription className="text-xs">
              Update your personal credentials, assigned department, and contact details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Full Name *</Label>
              <Input
                value={profileDraft.name}
                onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })}
                className="mt-1 text-xs"
                placeholder="e.g. Dr. Alem Tesfaye"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Professional Role</Label>
              <Input
                value={profileDraft.role}
                onChange={(e) => setProfileDraft({ ...profileDraft, role: e.target.value })}
                className="mt-1 text-xs"
                placeholder="e.g. Lead Clinical Audit Coordinator"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Assigned Department *</Label>
              <Select
                value={profileDraft.departmentSlug}
                onValueChange={(slug) => {
                  const d = departments.find((dept) => dept.slug === slug);
                  setProfileDraft({
                    ...profileDraft,
                    departmentSlug: slug,
                    department: d?.label || slug,
                  });
                }}
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Email Address</Label>
                <Input
                  type="email"
                  value={profileDraft.email}
                  onChange={(e) => setProfileDraft({ ...profileDraft, email: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Phone Number</Label>
                <Input
                  value={profileDraft.phone}
                  onChange={(e) => setProfileDraft({ ...profileDraft, phone: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Shift Schedule</Label>
              <Select
                value={profileDraft.shift}
                onValueChange={(shift) => setProfileDraft({ ...profileDraft, shift })}
              >
                <SelectTrigger className="mt-1 text-xs">
                  <SelectValue placeholder="Select Shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Day Shift (08:00 - 16:00)" className="text-xs">
                    Day Shift (08:00 - 16:00)
                  </SelectItem>
                  <SelectItem value="Night Shift (16:00 - 08:00)" className="text-xs">
                    Night Shift (16:00 - 08:00)
                  </SelectItem>
                  <SelectItem value="Rotating Shifts" className="text-xs">
                    Rotating Shifts
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Professional Bio / Notes</Label>
              <Textarea
                value={profileDraft.bio}
                onChange={(e) => setProfileDraft({ ...profileDraft, bio: e.target.value })}
                className="mt-1 text-xs min-h-[70px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setEditProfileOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveProfileChanges}>
              Save Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL: INTERACTIVE FORM FILLER                               */}
      {/* ============================================================ */}
      {formToFill && (
        <InteractiveFormFillerDialog
          open={fillModalOpen}
          onOpenChange={(isOpen) => {
            setFillModalOpen(isOpen);
            if (!isOpen) setFormToFill(null);
          }}
          form={formToFill}
          onSuccess={() => {
            refreshResponses();
            setActiveTab("history");
          }}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL: VIEW SINGLE RESPONSE DETAILS                          */}
      {/* ============================================================ */}
      <Dialog open={viewResponseModalOpen} onOpenChange={setViewResponseModalOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold">
              {viewingResponse?.formTitle || "Form Submission Details"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              ID: {viewingResponse?.id} · Submitted on{" "}
              {viewingResponse?.submittedAt && new Date(viewingResponse.submittedAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {viewingResponse?.answers &&
              Object.entries(viewingResponse.answers).map(([key, val]) => {
                const formattedKey = key.replace(/^q-/, "").replace(/-/g, " ");
                const formattedVal = Array.isArray(val)
                  ? val.join(", ")
                  : typeof val === "object"
                  ? JSON.stringify(val)
                  : String(val);

                return (
                  <div key={key} className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      {formattedKey}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-foreground mt-1 block">
                      {formattedVal || "—"}
                    </span>
                  </div>
                );
              })}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewResponseModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ----------------------------------------------------------------------------
// INTERACTIVE FORM FILLER DIALOG COMPONENT
// ----------------------------------------------------------------------------
function InteractiveFormFillerDialog({
  open,
  onOpenChange,
  form,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: CustomForm;
  onSuccess?: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleTextChange = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
    if (errors[qId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }
  };

  const handleCheckboxChange = (qId: string, option: string, checked: boolean) => {
    setAnswers((prev) => {
      const list: string[] = Array.isArray(prev[qId]) ? prev[qId] : [];
      const updated = checked ? [...list, option] : list.filter((i) => i !== option);
      return { ...prev, [qId]: updated };
    });
    if (errors[qId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }
  };

  const handleSubmit = () => {
    // Validate required questions
    const nextErrors: Record<string, string> = {};
    for (const q of form.questions || []) {
      if (q.required) {
        const val = answers[q.id];
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          nextErrors[q.id] = "This question is required";
        }
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Please answer all required questions marked with *");
      return;
    }

    setSubmitting(true);
    try {
      saveFormResponse(form.id, answers);
      toast.success("Form response recorded successfully!");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit form response");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6">
        <DialogHeader className="border-b border-border/80 pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase">
            <Building2 className="size-3.5" />
            <span>{form.departmentLabel}</span>
          </div>
          <DialogTitle className="text-lg sm:text-xl font-bold">{form.title}</DialogTitle>
          <DialogDescription className="text-xs">
            {form.description || "Fill out the fields below to record this audit entry."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {(form.questions || []).map((q, idx) => (
            <div
              key={q.id || idx}
              className={`p-4 rounded-2xl border ${
                errors[q.id] ? "border-destructive/60 bg-destructive/5" : "border-border/70 bg-card"
              } space-y-2`}
            >
              <Label className="text-xs font-bold text-foreground block">
                {idx + 1}. {q.title}
                {q.required && <span className="text-destructive ml-1">*</span>}
              </Label>

              {/* Text Input */}
              {q.type === "text" && (
                <Input
                  placeholder={q.placeholder || "Your answer"}
                  value={answers[q.id] || ""}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  className="text-xs h-9 bg-background"
                />
              )}

              {/* Paragraph Input */}
              {q.type === "paragraph" && (
                <Textarea
                  placeholder={q.placeholder || "Your detailed answer"}
                  value={answers[q.id] || ""}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  className="text-xs min-h-[70px] bg-background"
                />
              )}

              {/* Multiple Choice */}
              {q.type === "multiple_choice" && (
                <RadioGroup
                  value={answers[q.id] || ""}
                  onValueChange={(val) => handleTextChange(q.id, val)}
                  className="space-y-1.5 pt-1"
                >
                  {(q.options || []).map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-xs cursor-pointer py-1">
                      <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </RadioGroup>
              )}

              {/* Checkboxes */}
              {q.type === "checkboxes" && (
                <div className="space-y-1.5 pt-1">
                  {(q.options || []).map((opt) => {
                    const checked = Array.isArray(answers[q.id]) && answers[q.id].includes(opt);
                    return (
                      <label key={opt} className="flex items-center gap-2 text-xs cursor-pointer py-1">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) => handleCheckboxChange(q.id, opt, c === true)}
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Rating */}
              {q.type === "rating" && (
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const selected = answers[q.id] === star;
                    return (
                      <button
                        type="button"
                        key={star}
                        onClick={() => handleTextChange(q.id, String(star))}
                        className={`size-9 rounded-xl text-xs font-bold transition-all ${
                          selected
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {star}
                      </button>
                    );
                  })}
                </div>
              )}

              {errors[q.id] && (
                <p className="text-[11px] font-medium text-destructive mt-1">{errors[q.id]}</p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="border-t border-border/80 pt-3 gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={submitting} onClick={handleSubmit} className="gap-1.5 font-semibold">
            <Send className="size-3.5" />
            <span>Submit Response</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
