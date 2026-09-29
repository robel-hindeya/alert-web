import { useState, useEffect, useMemo } from "react";
import {
  UsersRound,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Ban,
  KeyRound,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  Trash2,
  Building2,
  Crown,
  Sparkles,
  RefreshCw,
  UserCog,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { UserAccount, UserRole } from "@/server/db";
import { departments } from "@/routes/departments.$slug";

export function UserManagementTab() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Edit Credentials Modal state
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // Add User Modal state
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("coordinator");
  const [newUserDept, setNewUserDept] = useState("emergency-corridor");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [addSaving, setAddSaving] = useState(false);

  // State to reveal password per-card
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const toggleRevealPassword = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
      toast.error("Failed to load users list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter === "admin" && u.role !== "admin") return false;
      if (roleFilter === "coordinator" && u.role !== "coordinator") return false;
      if (roleFilter === "banned" && u.status !== "banned") return false;
      if (
        roleFilter === "other" &&
        (u.role === "admin" || u.role === "coordinator" || u.role === "superadmin")
      )
        return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesUser = u.username.toLowerCase().includes(q);
        const matchesRole = u.role.toLowerCase().includes(q);
        const matchesDept = (u.departmentLabel || "").toLowerCase().includes(q);
        return matchesName || matchesUser || matchesRole || matchesDept;
      }

      return true;
    });
  }, [users, roleFilter, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role === "admin").length,
      coordinators: users.filter((u) => u.role === "coordinator").length,
      banned: users.filter((u) => u.status === "banned").length,
      superadmin: users.filter((u) => u.role === "superadmin").length,
    };
  }, [users]);

  // Edit Credentials handler
  const handleOpenEditCredentials = (u: UserAccount) => {
    setEditingUser(u);
    setEditUsername(u.username);
    setEditPassword(u.password || "");
    setShowEditPassword(false);
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editUsername.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    if (!editPassword) {
      toast.error("Password cannot be empty");
      return;
    }

    setEditSaving(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editUsername.trim(),
          password: editPassword,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Failed to update credentials");
        return;
      }

      toast.success(
        `Credentials successfully updated for ${editingUser.name} (@${data.username})!`,
      );
      setEditingUser(null);
      loadUsers();
    } catch {
      toast.error("Network error while updating credentials");
    } finally {
      setEditSaving(false);
    }
  };

  // Toggle Ban handler
  const handleToggleBan = async (u: UserAccount) => {
    if (u.username === "habtamu" || u.role === "superadmin") {
      toast.error("Super Administrator account cannot be banned.");
      return;
    }

    const willBan = u.status !== "banned";
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: willBan ? "banned" : "active",
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Failed to change user status");
        return;
      }

      if (willBan) {
        toast.error(
          `Account @${u.username} (${u.role}) has been BANNED. Access is blocked immediately.`,
        );
      } else {
        toast.success(`Account @${u.username} has been UNBANNED. Login access is restored.`);
      }
      loadUsers();
    } catch {
      toast.error("Network error while changing ban status");
    }
  };

  // Create User handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPassword) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setAddSaving(true);
    try {
      const deptObj = departments.find((d) => d.slug === newUserDept);
      const isDeptRole =
        newUserRole === "coordinator" || newUserRole === "doctor" || newUserRole === "staff";

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName.trim(),
          username: newUserUsername.trim(),
          password: newUserPassword,
          role: newUserRole,
          departmentSlug: isDeptRole ? newUserDept : null,
          departmentLabel: isDeptRole ? deptObj?.label || newUserDept : null,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Failed to create user account");
        return;
      }

      toast.success(`User @${data.username} created with role ${data.role}!`);
      setAddUserOpen(false);
      setNewUserName("");
      setNewUserUsername("");
      setNewUserPassword("");
      loadUsers();
    } catch {
      toast.error("Network error while creating account");
    } finally {
      setAddSaving(false);
    }
  };

  // Delete User handler
  const handleDeleteUser = async (u: UserAccount) => {
    if (u.username === "habtamu" || u.role === "superadmin") {
      toast.error("Super Administrator cannot be deleted.");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete user @${u.username} (${u.name})? This action is permanent.`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Account @${u.username} has been deleted.`);
        loadUsers();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Failed to delete user");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "superadmin":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 font-semibold text-[11px]">
            <Crown className="size-3" /> Super Admin
          </Badge>
        );
      case "admin":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 gap-1 font-semibold text-[11px]">
            <ShieldCheck className="size-3" /> Clinical Admin
          </Badge>
        );
      case "coordinator":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 font-semibold text-[11px]">
            <Building2 className="size-3" /> Coordinator
          </Badge>
        );
      case "qmt":
        return (
          <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 gap-1 font-semibold text-[11px]">
            <UserCog className="size-3" /> QMT Officer
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[11px] capitalize">
            {role}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Action */}
      <div className="card-soft p-5 sm:p-6 border border-border/80 bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
              <UsersRound className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  User Accounts &amp; Role Access Control
                </h2>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">
                  Superadmin Console
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set usernames and passwords, assign roles, and toggle instant Ban / Unban for Admin
                and Coordinator accounts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={loadUsers}
              variant="outline"
              size="sm"
              disabled={loading}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setAddUserOpen(true)}
              size="sm"
              className="gap-1.5 text-xs font-semibold shadow-xs"
            >
              <UserPlus className="size-3.5" />
              Add User Account
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-4 border-t border-border/60">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Total Accounts
            </span>
            <p className="text-xl font-bold text-foreground mt-0.5">{counts.total}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Admins
            </span>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              {counts.admins}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Coordinators
            </span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {counts.coordinators}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Banned Users
            </span>
            <p
              className={`text-xl font-bold mt-0.5 ${counts.banned > 0 ? "text-destructive" : "text-foreground"}`}
            >
              {counts.banned}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant={roleFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("all")}
            className="text-xs h-8 rounded-lg"
          >
            All Accounts ({counts.total})
          </Button>
          <Button
            type="button"
            variant={roleFilter === "admin" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("admin")}
            className="text-xs h-8 rounded-lg"
          >
            Admins ({counts.admins})
          </Button>
          <Button
            type="button"
            variant={roleFilter === "coordinator" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("coordinator")}
            className="text-xs h-8 rounded-lg"
          >
            Coordinators ({counts.coordinators})
          </Button>
          <Button
            type="button"
            variant={roleFilter === "banned" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("banned")}
            className="text-xs h-8 rounded-lg"
          >
            Banned ({counts.banned})
          </Button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="h-8 pl-8 text-xs rounded-lg"
          />
        </div>
      </div>

      {/* Users List Grid */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            <UsersRound className="size-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">No users found</p>
            <p className="text-xs mt-0.5">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isRootSuperadmin = u.username === "habtamu" || u.role === "superadmin";
            const isBanned = u.status === "banned";
            const isRevealed = Boolean(revealedPasswords[u.id]);

            return (
              <div
                key={u.id}
                className={`card-soft p-4 sm:p-5 border transition-all flex flex-col justify-between ${
                  isBanned
                    ? "border-destructive/40 bg-destructive/5"
                    : isRootSuperadmin
                      ? "border-amber-500/30 bg-amber-500/5 shadow-xs"
                      : "border-border/80 bg-card hover:border-border"
                }`}
              >
                <div>
                  {/* Card Header: Avatar, Name, Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`size-10 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                          isRootSuperadmin
                            ? "bg-amber-500 text-white shadow-xs"
                            : isBanned
                              ? "bg-destructive/20 text-destructive"
                              : u.role === "admin"
                                ? "bg-blue-500/15 text-blue-600"
                                : "bg-primary/15 text-primary"
                        }`}
                      >
                        {u.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-bold text-foreground truncate">{u.name}</p>
                          {isRootSuperadmin && (
                            <span title="Master Super Administrator">
                              <Crown className="size-3.5 text-amber-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          @{u.username}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isBanned ? (
                        <Badge variant="destructive" className="animate-pulse gap-1 text-[10px]">
                          <Ban className="size-3" /> BANNED
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Metadata: Role and Department */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-3 border-t border-border/50 text-xs">
                    <div>{getRoleBadge(u.role)}</div>

                    {u.departmentLabel && (
                      <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
                        <Building2 className="size-3" />
                        {u.departmentLabel}
                      </Badge>
                    )}
                  </div>

                  {/* Password Preview Row */}
                  <div className="mt-3 rounded-lg bg-muted/40 p-2.5 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 min-w-0">
                      <KeyRound className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground text-[11px]">Password:</span>
                      <span className="font-semibold text-foreground truncate">
                        {isRevealed ? u.password || "••••••••" : "••••••••••••"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRevealPassword(u.id)}
                      className="text-muted-foreground hover:text-foreground text-[11px] shrink-0 ml-2"
                      title={isRevealed ? "Hide Password" : "Show Password"}
                    >
                      {isRevealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Set Username & Password Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditCredentials(u)}
                      className="text-xs h-8 gap-1.5 border-border hover:bg-muted font-medium"
                    >
                      <KeyRound className="size-3 text-primary" />
                      Set Credentials
                    </Button>

                    {/* Ban / Unban Button (disabled for root superadmin) */}
                    {!isRootSuperadmin && (
                      <Button
                        type="button"
                        variant={isBanned ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => handleToggleBan(u)}
                        className={`text-xs h-8 gap-1.5 ${
                          isBanned
                            ? "border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                            : ""
                        }`}
                      >
                        {isBanned ? (
                          <>
                            <ShieldCheck className="size-3.5" />
                            Unban
                          </>
                        ) : (
                          <>
                            <Ban className="size-3.5" />
                            Ban
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Delete button (only for non-superadmin) */}
                  {!isRootSuperadmin && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteUser(u)}
                      className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Delete User Account"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================ */}
      {/* DIALOG: Edit Username & Password (Superadmin capability)    */}
      {/* ============================================================ */}
      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <KeyRound className="size-4 text-primary" />
              Set Username &amp; Password
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update login credentials for {editingUser?.name} ({editingUser?.role}). Changes take
              effect immediately.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCredentials} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-username" className="text-xs font-semibold">
                Username
              </Label>
              <Input
                id="edit-username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Enter username..."
                className="text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-password" className="text-xs font-semibold">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showEditPassword ? "text" : "password"}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password..."
                  className="pr-10 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showEditPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Set the password that this user will use to sign in.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingUser(null)}
                disabled={editSaving}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editSaving} className="text-xs font-semibold">
                {editSaving ? "Saving..." : "Save Credentials"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* DIALOG: Add New User Account (Admin, Coordinator, etc.)     */}
      {/* ============================================================ */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <UserPlus className="size-4 text-primary" />
              Create New Role Account
            </DialogTitle>
            <DialogDescription className="text-xs">
              Add a new account for an Admin, Coordinator, or clinical team member.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-role" className="text-xs font-semibold">
                Account Role
              </Label>
              <Select value={newUserRole} onValueChange={(val) => setNewUserRole(val as UserRole)}>
                <SelectTrigger id="new-role" className="text-xs h-9">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">🛡️ Clinical Admin</SelectItem>
                  <SelectItem value="coordinator">📋 Department Coordinator</SelectItem>
                  <SelectItem value="qmt">📊 QMT Officer</SelectItem>
                  <SelectItem value="doctor">🩺 Doctor / Clinician</SelectItem>
                  <SelectItem value="staff">🏥 Department Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-name" className="text-xs font-semibold">
                Full Name
              </Label>
              <Input
                id="new-name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="e.g. Dr. Abebe Bikila"
                className="text-sm h-9"
                required
              />
            </div>

            {(newUserRole === "coordinator" ||
              newUserRole === "doctor" ||
              newUserRole === "staff") && (
              <div className="space-y-1.5">
                <Label htmlFor="new-dept" className="text-xs font-semibold">
                  Assigned Department
                </Label>
                <Select value={newUserDept} onValueChange={setNewUserDept}>
                  <SelectTrigger id="new-dept" className="text-xs h-9">
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
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-username" className="text-xs font-semibold">
                  Username
                </Label>
                <Input
                  id="new-username"
                  value={newUserUsername}
                  onChange={(e) => setNewUserUsername(e.target.value)}
                  placeholder="e.g. coord_er"
                  className="text-sm h-9 font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-xs font-semibold">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="text-sm h-9 pr-8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddUserOpen(false)}
                disabled={addSaving}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addSaving} className="text-xs font-semibold">
                {addSaving ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
