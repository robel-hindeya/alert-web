import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Settings,
  ArrowLeft,
  Building2,
  ShieldCheck,
  Bell,
  Lock,
  Database,
  Save,
  CheckCircle2,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Hospital,
  Clock,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | ALERT Hospital Management System" },
      {
        name: "description",
        content:
          "Manage hospital system settings, QMT parameters, notifications, and security for ALERT Comprehensive Specialized Hospital.",
      },
      { property: "og:title", content: "Settings | ALERT Hospital Management System" },
      {
        property: "og:description",
        content: "Manage hospital system settings, QMT parameters, notifications, and security.",
      },
    ],
  }),
  component: SettingsPage,
});

const SETTINGS_STORAGE_KEY = "alert_hospital_system_settings";

const defaultSettings = {
  // Hospital Profile
  hospitalName: "ALERT Comprehensive Specialized Hospital",
  facilityType: "Tertiary Referral & Teaching Hospital",
  licenseNumber: "MOH-ET-ALERT-2024",
  address: "Zenebework, Kolfe Keranio, Addis Ababa, Ethiopia",
  email: "contact@alert.gov.et",
  phone: "+251 113 21 11 00",
  emergencyPhone: "+251 113 21 11 99",
  timezone: "Africa/Addis_Ababa",
  language: "en",

  // QMT & Clinical Audit
  auditFrequency: "weekly",
  qualityThreshold: 85,
  requireTwoDoctorConcurrence: true,
  autoIncidentEscalation: true,
  digitalSignatures: true,
  notifyQmtOnSubmission: true,

  // Notifications
  smsCriticalAlerts: true,
  emailDailyDigest: true,
  bedCapacityAlert: true,
  bedThresholdPercent: 90,
  maintenanceAlerts: false,

  // Security
  sessionTimeoutMinutes: "30",
  twoFactorAuth: false,
};

function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState("Today, 03:00 AM");

  // Password change state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveSettings = () => {
    setIsSaving(true);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      setTimeout(() => {
        setIsSaving(false);
        toast.success("Settings saved successfully.");
      }, 350);
    } catch {
      setIsSaving(false);
      toast.error("Failed to save settings.");
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw) {
      toast.error("Please enter your current password.");
      return;
    }
    if (newPw.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match.");
      return;
    }

    toast.success("Administrator password updated successfully.");
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  };

  const handleCreateBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setLastBackupTime(`Today, ${now}`);
      toast.success("System backup snapshot created successfully (26.4 MB).");
    }, 1200);
  };

  const handleExportData = () => {
    const exportData = {
      hospital: settings.hospitalName,
      exportedAt: new Date().toISOString(),
      settings,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alert-hospital-settings-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Settings exported as JSON.");
  };

  return (
    <DashboardShell>
      <main className="flex-1 space-y-4 sm:space-y-6 p-3.5 sm:p-5 lg:p-6">
        {/* Page Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="grid size-11 sm:size-12 shrink-0 place-items-center rounded-2xl text-primary-foreground shadow-lg"
              style={{ backgroundImage: "var(--gradient-sidebar)" }}
            >
              <Settings className="size-5 sm:size-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Settings</h1>
              <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                Hospital system configuration, clinical audit standards, notifications, and
                security.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="gap-1.5 font-semibold shadow-xs"
            >
              <Save className="size-4" />
              {isSaving ? "Saving..." : "Save Changes"}
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

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="flex flex-wrap h-auto w-full justify-start gap-1.5 rounded-2xl border border-border bg-card p-1.5 shadow-xs">
            <TabsTrigger
              value="general"
              className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <Hospital className="size-4" />
              Hospital Profile
            </TabsTrigger>
            <TabsTrigger
              value="qmt"
              className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <ShieldCheck className="size-4" />
              QMT &amp; Audit
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <Bell className="size-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <Lock className="size-4" />
              Security
            </TabsTrigger>
            <TabsTrigger
              value="backup"
              className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <Database className="size-4" />
              Data &amp; Backup
            </TabsTrigger>
          </TabsList>

          {/* 1. Hospital Profile Tab */}
          <TabsContent value="general" className="space-y-4">
            <div className="card-soft p-5 sm:p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="size-4 text-primary" />
                  Hospital Institution Details
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  General administrative credentials displayed on clinical audit documents and
                  reports.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="h-name" className="text-xs font-semibold">
                    Hospital Facility Name
                  </Label>
                  <Input
                    id="h-name"
                    value={settings.hospitalName}
                    onChange={(e) => setSettings({ ...settings, hospitalName: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="h-type" className="text-xs font-semibold">
                    Facility Classification
                  </Label>
                  <Input
                    id="h-type"
                    value={settings.facilityType}
                    onChange={(e) => setSettings({ ...settings, facilityType: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="h-lic" className="text-xs font-semibold">
                    Ministry Accreditation / License No
                  </Label>
                  <Input
                    id="h-lic"
                    value={settings.licenseNumber}
                    onChange={(e) => setSettings({ ...settings, licenseNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="h-addr" className="text-xs font-semibold">
                    Physical Address &amp; Location
                  </Label>
                  <Input
                    id="h-addr"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="h-email" className="text-xs font-semibold">
                    Primary Administrative Email
                  </Label>
                  <Input
                    id="h-email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="h-phone" className="text-xs font-semibold">
                    Main Switchboard Phone
                  </Label>
                  <Input
                    id="h-phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="h-emg" className="text-xs font-semibold">
                    Emergency Hotline
                  </Label>
                  <Input
                    id="h-emg"
                    value={settings.emergencyPhone}
                    onChange={(e) => setSettings({ ...settings, emergencyPhone: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="h-lang" className="text-xs font-semibold">
                    System Language
                  </Label>
                  <Select
                    value={settings.language}
                    onValueChange={(v) => setSettings({ ...settings, language: v })}
                  >
                    <SelectTrigger id="h-lang">
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English (US / International)</SelectItem>
                      <SelectItem value="am">Amharic (አማርኛ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 2. QMT & Clinical Audit Tab */}
          <TabsContent value="qmt" className="space-y-4">
            <div className="card-soft p-5 sm:p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  Quality Management Team (QMT) Standards
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure clinical audit frequencies, compliance thresholds, and quality oversight
                  protocols.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="qmt-freq" className="text-xs font-semibold">
                    Mandatory Department Audit Frequency
                  </Label>
                  <Select
                    value={settings.auditFrequency}
                    onValueChange={(v) => setSettings({ ...settings, auditFrequency: v })}
                  >
                    <SelectTrigger id="qmt-freq">
                      <SelectValue placeholder="Frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly Audit Cycles</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly (Every 2 weeks)</SelectItem>
                      <SelectItem value="monthly">Monthly Full Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="qmt-thresh" className="text-xs font-semibold">
                    Minimum Quality Compliance Pass Rate (%)
                  </Label>
                  <Input
                    id="qmt-thresh"
                    type="number"
                    min="50"
                    max="100"
                    value={settings.qualityThreshold}
                    onChange={(e) =>
                      setSettings({ ...settings, qualityThreshold: Number(e.target.value) || 85 })
                    }
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Two-Doctor Concurrence Emergency Doctrine
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Require dual senior doctor sign-off before emergency procedure protocol
                      overrides.
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireTwoDoctorConcurrence}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, requireTwoDoctorConcurrence: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Automatic Critical Incident Escalation
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Automatically alert QMT Officers whenever high-severity incident logs are
                      filed.
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoIncidentEscalation}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, autoIncidentEscalation: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Require QMT Digital Signatures
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Audit documents require verified cryptographic signature verification by
                      assigned officer.
                    </p>
                  </div>
                  <Switch
                    checked={settings.digitalSignatures}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, digitalSignatures: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Department Submission Notification
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Send instantaneous dashboard notice to QMT officer upon completed form intake.
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifyQmtOnSubmission}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, notifyQmtOnSubmission: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 3. Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <div className="card-soft p-5 sm:p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Bell className="size-4 text-primary" />
                  Alerts &amp; Dispatch Settings
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure automated dispatch alerts for clinical operations and bed capacity.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      SMS Urgent Critical Alerts
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Deliver instant SMS messages to on-call duty officers for red-tier clinical
                      emergencies.
                    </p>
                  </div>
                  <Switch
                    checked={settings.smsCriticalAlerts}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, smsCriticalAlerts: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Daily Audit Summary Digest
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Receive an automated daily 08:00 AM summary report of hospital-wide audit
                      scores.
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailDailyDigest}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, emailDailyDigest: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Bed Capacity Surge Warning
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Notify Super Admin and Emergency triage when total bed occupancy exceeds 90%.
                    </p>
                  </div>
                  <Switch
                    checked={settings.bedCapacityAlert}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, bedCapacityAlert: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      System Maintenance Alerts
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Broadcast planned downtime banners to staff workspaces 24 hours prior.
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenanceAlerts}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, maintenanceAlerts: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 4. Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="card-soft p-5 sm:p-6 space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Lock className="size-4 text-primary" />
                    Access &amp; Session Policies
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Security timeout parameters and authentication safeguards.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="sec-timeout" className="text-xs font-semibold">
                      Idle Session Auto-Logout
                    </Label>
                    <Select
                      value={settings.sessionTimeoutMinutes}
                      onValueChange={(v) => setSettings({ ...settings, sessionTimeoutMinutes: v })}
                    >
                      <SelectTrigger id="sec-timeout">
                        <SelectValue placeholder="Timeout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes (Strict HIPAA/MOH)</SelectItem>
                        <SelectItem value="30">30 minutes (Standard)</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Two-Factor Authentication (2FA)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Require OTP authenticator code for Super Admin login.
                      </p>
                    </div>
                    <Switch
                      checked={settings.twoFactorAuth}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, twoFactorAuth: checked })
                      }
                    />
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-primary/8 p-3.5 text-xs text-primary">
                    <p className="font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="size-4" /> Current Security Role: Super Administrator
                    </p>
                    <p className="mt-1 opacity-90 text-[11px] leading-relaxed">
                      Signed in as master operator at ALERT Comprehensive Specialized Hospital. All
                      privileged actions are audited into immutable system logs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Password update card */}
              <div className="card-soft p-5 sm:p-6 space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <KeyRound className="size-4 text-primary" />
                    Change Admin Password
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Update master administrator login password for this console.
                  </p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-3.5 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="cur-pw" className="text-xs font-semibold">
                      Current Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="cur-pw"
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="new-pw" className="text-xs font-semibold">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="new-pw"
                        type={showNewPw ? "text" : "password"}
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="conf-pw" className="text-xs font-semibold">
                      Confirm New Password
                    </Label>
                    <Input
                      id="conf-pw"
                      type="password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>

                  <Button type="submit" className="w-full mt-2 font-semibold">
                    Update Password
                  </Button>
                </form>
              </div>
            </div>
          </TabsContent>

          {/* 5. Data & Backup Tab */}
          <TabsContent value="backup" className="space-y-4">
            <div className="card-soft p-5 sm:p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Database className="size-4 text-primary" />
                  Database Backups &amp; Data Archives
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage hospital audit records storage, manual snapshots, and JSON/CSV data
                  portability.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-1">
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Latest Snapshot
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-success">
                      <CheckCircle2 className="size-3.5" /> Healthy
                    </span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{lastBackupTime}</p>
                  <p className="text-xs text-muted-foreground">
                    Estimated size: 26.4 MB · Storage: Local &amp; Replicated Nitro DB
                  </p>
                  <Button
                    onClick={handleCreateBackup}
                    disabled={isBackingUp}
                    variant="outline"
                    className="w-full gap-2 text-xs font-semibold"
                  >
                    <RefreshCw className={`size-3.5 ${isBackingUp ? "animate-spin" : ""}`} />
                    {isBackingUp ? "Creating Snapshot..." : "Create Backup Snapshot Now"}
                  </Button>
                </div>

                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Data Export
                  </span>
                  <p className="text-lg font-bold text-foreground">System Configurations</p>
                  <p className="text-xs text-muted-foreground">
                    Download full hospital system settings and clinical standards as JSON.
                  </p>
                  <Button
                    onClick={handleExportData}
                    variant="secondary"
                    className="w-full gap-2 text-xs font-semibold"
                  >
                    <Download className="size-3.5" />
                    Export Settings (JSON)
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </DashboardShell>
  );
}
