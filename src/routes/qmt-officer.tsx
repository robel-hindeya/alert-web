import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  ArrowLeft,
  UserCheck,
  Mail,
  Phone,
  Star,
  CalendarDays,
  Clock,
  MapPin,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
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
import { departments } from "@/routes/departments.$slug";

export const Route = createFileRoute("/qmt-officer")({
  head: () => ({
    meta: [
      { title: "QMT Officer | ALERT Hospital Management System" },
      {
        name: "description",
        content:
          "Browse Quality Management Team (QMT) officers at ALERT Comprehensive Specialized Hospital.",
      },
      { property: "og:title", content: "QMT Officer | ALERT Hospital Management System" },
      {
        property: "og:description",
        content:
          "Browse Quality Management Team (QMT) officers at ALERT Comprehensive Specialized Hospital.",
      },
    ],
  }),
  component: QmtOfficerPage,
});

export type QmtOfficer = {
  id: string;
  name: string;
  specialty: string;
  dept: string;
  exp: number;
  rating: number;
  status: "Active" | "In Audit" | "On Leave";
  email: string;
  phone: string;
};

const STORAGE_KEY = "alert_qmt_officers_list";

const statusStyles: Record<string, string> = {
  Active: "bg-success/12 text-success",
  "In Audit": "bg-primary/12 text-primary",
  "On Leave": "bg-warning/15 text-warning",
};

const emptyDraft = {
  name: "",
  specialty: "",
  dept: "",
  status: "Active" as "Active" | "In Audit" | "On Leave",
  exp: "",
  email: "",
  phone: "",
};

function QmtOfficerPage() {
  const [officers, setOfficers] = useState<QmtOfficer[]>([]);
  const [search, setSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formDraft, setFormDraft] = useState(emptyDraft);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setOfficers(parsed);
        }
      }
    } catch {
      // ignore JSON parse or storage errors
    }
  }, []);

  const handleSaveOfficer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDraft.name.trim()) {
      setFormError("Please enter the officer's full name.");
      return;
    }
    if (!formDraft.dept.trim()) {
      setFormError("Please select a department.");
      return;
    }

    const newOfficer: QmtOfficer = {
      id: `qmt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: formDraft.name.trim(),
      specialty: formDraft.specialty.trim() || "Quality Management Officer",
      dept: formDraft.dept.trim(),
      status: formDraft.status,
      exp: Number(formDraft.exp) >= 0 && formDraft.exp !== "" ? Number(formDraft.exp) : 1,
      rating: 5.0,
      email:
        formDraft.email.trim() ||
        `${formDraft.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, ".")
          .replace(/\.+/g, ".")}@alert.et`,
      phone: formDraft.phone.trim() || "+251 911 00 0000",
    };

    const updated = [newOfficer, ...officers];
    setOfficers(updated);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage quota errors
    }

    toast.success(`QMT Officer ${newOfficer.name} added successfully.`);
    setFormDraft(emptyDraft);
    setFormError("");
    setAddModalOpen(false);
  };

  const filteredOfficers = useMemo(() => {
    if (!search.trim()) return officers;
    const query = search.toLowerCase();
    return officers.filter(
      (o) =>
        o.name.toLowerCase().includes(query) ||
        o.specialty.toLowerCase().includes(query) ||
        o.dept.toLowerCase().includes(query),
    );
  }, [officers, search]);

  const activeCount = useMemo(
    () => officers.filter((o) => o.status === "Active").length,
    [officers],
  );

  return (
    <DashboardShell>
      <main className="flex-1 space-y-4 sm:space-y-5 p-3.5 sm:p-5 lg:p-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">QMT Officer</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
              {officers.length === 1
                ? "1 Quality Management Team officer profile."
                : `${officers.length} Quality Management Team officer profiles across all hospital departments.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => {
                setFormError("");
                setAddModalOpen(true);
              }}
              className="gap-1.5 font-semibold shadow-xs"
            >
              <Plus className="size-4" />
              QMT Add
            </Button>
            <Link
              to="/"
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="size-3.5 sm:size-4 text-primary" />
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Search & Active Counter */}
        <section className="card-soft flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4">
          <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search QMT officers by name, specialty, or department..."
              className="w-full rounded-full bg-muted py-2 pl-9 pr-3 sm:py-2.5 sm:pl-10 sm:pr-4 text-xs sm:text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-success" />
            <span>{activeCount} active</span>
          </div>
        </section>

        {/* Officers Grid or Empty State */}
        {filteredOfficers.length === 0 ? (
          <div className="card-soft flex flex-col items-center justify-center py-16 px-4 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary mb-3">
              <UserCheck className="size-7" />
            </span>
            <h2 className="text-base font-semibold text-foreground">
              {search ? "No matching officers found" : "No QMT Officers Registered"}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm">
              {search
                ? `No QMT officers matched "${search}". Try adjusting your search query.`
                : 'No Quality Management Team officers have been registered yet. Click "QMT Add" to add a new officer.'}
            </p>
            {!search && (
              <Button
                onClick={() => {
                  setFormError("");
                  setAddModalOpen(true);
                }}
                className="mt-4 gap-1.5 font-semibold"
              >
                <Plus className="size-4" />
                QMT Add
              </Button>
            )}
          </div>
        ) : (
          <section className="grid gap-3.5 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredOfficers.map((officer) => {
              const initials =
                officer.name
                  .split(" ")
                  .filter(Boolean)
                  .slice(officer.name.startsWith("Dr.") ? 1 : 0)
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "QM";

              return (
                <article
                  key={officer.id}
                  className="card-soft group flex flex-col p-5 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/12 text-lg font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      {initials}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        statusStyles[officer.status] || "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Clock className="size-3" />
                      {officer.status}
                    </span>
                  </div>

                  <div className="mt-4 min-w-0">
                    <h2 className="truncate text-base font-semibold text-foreground">
                      {officer.name}
                    </h2>
                    <p className="text-sm text-primary truncate">
                      {officer.specialty || "QMT Officer"}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-1">
                      <UserCheck className="size-3" />
                      {officer.dept}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-1">
                      <CalendarDays className="size-3" />
                      {officer.exp} yrs
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-1">
                      <Star className="size-3 fill-warning text-warning" />
                      {officer.rating.toFixed(1)}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <MapPin className="size-3.5 text-primary" />
                      ALERT Hospital, Addis Ababa
                    </p>
                    {officer.email && (
                      <p className="flex items-center gap-2">
                        <Mail className="size-3.5 text-primary" />
                        <span className="truncate">{officer.email}</span>
                      </p>
                    )}
                    {officer.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="size-3.5 text-primary" />
                        {officer.phone}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto pt-4">
                    <button className="w-full rounded-xl bg-primary/10 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                      View Profile
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* Add QMT Officer Dialog */}
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="size-5 text-primary" />
                Add QMT Officer
              </DialogTitle>
              <DialogDescription>
                Register a new Quality Management Team officer at ALERT Comprehensive Specialized
                Hospital.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveOfficer} className="space-y-3.5 py-1">
              <div className="space-y-1.5">
                <Label htmlFor="qmt-name" className="text-xs font-semibold">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="qmt-name"
                  placeholder="e.g. Dr. Abebe Tadesse"
                  value={formDraft.name}
                  onChange={(e) => setFormDraft({ ...formDraft, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="qmt-specialty" className="text-xs font-semibold">
                    Role / Specialty
                  </Label>
                  <Input
                    id="qmt-specialty"
                    placeholder="e.g. Clinical Audit Lead"
                    value={formDraft.specialty}
                    onChange={(e) => setFormDraft({ ...formDraft, specialty: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="qmt-dept" className="text-xs font-semibold">
                    Department <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formDraft.dept}
                    onValueChange={(v) => setFormDraft({ ...formDraft, dept: v })}
                  >
                    <SelectTrigger id="qmt-dept">
                      <SelectValue placeholder="Select department" />
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
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="qmt-status" className="text-xs font-semibold">
                    Status
                  </Label>
                  <Select
                    value={formDraft.status}
                    onValueChange={(v: "Active" | "In Audit" | "On Leave") =>
                      setFormDraft({ ...formDraft, status: v })
                    }
                  >
                    <SelectTrigger id="qmt-status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="In Audit">In Audit</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="qmt-exp" className="text-xs font-semibold">
                    Experience (years)
                  </Label>
                  <Input
                    id="qmt-exp"
                    type="number"
                    min="0"
                    max="60"
                    placeholder="e.g. 5"
                    value={formDraft.exp}
                    onChange={(e) => setFormDraft({ ...formDraft, exp: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="qmt-email" className="text-xs font-semibold">
                    Email
                  </Label>
                  <Input
                    id="qmt-email"
                    type="email"
                    placeholder="officer@alert.et"
                    value={formDraft.email}
                    onChange={(e) => setFormDraft({ ...formDraft, email: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="qmt-phone" className="text-xs font-semibold">
                    Phone
                  </Label>
                  <Input
                    id="qmt-phone"
                    type="tel"
                    placeholder="+251 911 00 0000"
                    value={formDraft.phone}
                    onChange={(e) => setFormDraft({ ...formDraft, phone: e.target.value })}
                  />
                </div>
              </div>

              {formError && <p className="text-xs font-medium text-destructive">{formError}</p>}

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="font-semibold">
                  Add Officer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </DashboardShell>
  );
}
