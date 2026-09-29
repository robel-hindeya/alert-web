import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  CheckCheck,
  RefreshCw,
  ClipboardCheck,
  FileText,
  AlertTriangle,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Info,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDashboardData } from "@/lib/dashboard-store";

interface NotificationItem {
  id: string;
  type: "audit" | "report" | "alert" | "system" | "delete";
  title: string;
  description: string;
  time: string;
  link?: string;
  isRead: boolean;
}

const READ_STORAGE_KEY = "alert_read_notifications_v1";

export function NotificationMenu({ className }: { className?: string }) {
  const { stats, refresh } = useDashboardData();
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "audit" | "alert">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(READ_STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save readIds to localStorage
  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.warn("Could not save read notification state", e);
      }
      return next;
    });
  }, []);

  // Build structured notifications combining activities & system critical alerts
  const items: NotificationItem[] = useMemo(() => {
    const list: NotificationItem[] = [];

    // 1. System Bed Capacity & Operational Alert
    list.push({
      id: "sys-bed-capacity-alert",
      type: "alert",
      title: "Bed Capacity Watch",
      description: "654 inpatient beds tracked across all clinical departments.",
      time: "Live",
      link: "/",
      isRead: readIds.has("sys-bed-capacity-alert"),
    });

    // 2. High-priority QMT standard alert
    list.push({
      id: "sys-qmt-audit-cycle",
      type: "system",
      title: "QMT Audit Schedule Active",
      description: "Daily clinical documentation and triage audit cycle underway.",
      time: "Today",
      link: "/departments",
      isRead: readIds.has("sys-qmt-audit-cycle"),
    });

    // 3. Dynamic Activity logs from server DB
    if (stats?.activities && stats.activities.length > 0) {
      stats.activities.forEach((act) => {
        let type: NotificationItem["type"] = "audit";
        let link = "/departments";

        if (act.type.includes("report_generated")) {
          type = "report";
          link = "/reports";
        } else if (act.type.includes("report_deleted")) {
          type = "delete";
          link = "/reports";
        } else if (act.type.includes("form_submitted")) {
          type = "audit";
          link = "/departments";
        }

        list.push({
          id: act.id,
          type,
          title: act.title,
          description: act.meta,
          time: act.time,
          link,
          isRead: readIds.has(act.id),
        });
      });
    }

    return list;
  }, [stats?.activities, readIds]);

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      items.forEach((item) => next.add(item.id));
      try {
        localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.warn("Could not save read notification state", e);
      }
      return next;
    });
  }, [items]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const unreadCount = useMemo(() => {
    return items.filter((item) => !item.isRead).length;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeFilter === "audit") {
      return items.filter((i) => i.type === "audit" || i.type === "report");
    }
    if (activeFilter === "alert") {
      return items.filter((i) => i.type === "alert" || i.type === "system" || i.type === "delete");
    }
    return items;
  }, [items, activeFilter]);

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "audit":
        return <ClipboardCheck className="size-4 text-emerald-600 dark:text-emerald-400" />;
      case "report":
        return <FileText className="size-4 text-blue-600 dark:text-blue-400" />;
      case "alert":
        return <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />;
      case "delete":
        return <Trash2 className="size-4 text-rose-600 dark:text-rose-400" />;
      default:
        return <Info className="size-4 text-primary" />;
    }
  };

  const getIconBg = (type: NotificationItem["type"]) => {
    switch (type) {
      case "audit":
        return "bg-emerald-500/15 border-emerald-500/20";
      case "report":
        return "bg-blue-500/15 border-blue-500/20";
      case "alert":
        return "bg-amber-500/15 border-amber-500/20";
      case "delete":
        return "bg-rose-500/15 border-rose-500/20";
      default:
        return "bg-primary/15 border-primary/20";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 ${className || ""}`}
          aria-label="View notifications"
          title={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="size-5" />
          {unreadCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-xs animate-in zoom-in-75">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-muted-foreground/40" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[340px] sm:w-[380px] p-0 rounded-2xl shadow-2xl border border-border bg-card text-card-foreground overflow-hidden z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <Bell className="size-4.5 text-primary" />
            <span className="font-semibold text-sm text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleManualRefresh}
              className={`p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${
                isRefreshing ? "animate-spin text-primary" : ""
              }`}
              title="Refresh notifications"
            >
              <RefreshCw className="size-3.5" />
            </button>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="size-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/60 bg-card">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              activeFilter === "all"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("audit")}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              activeFilter === "audit"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Audits &amp; Reports
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("alert")}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              activeFilter === "alert"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Alerts
          </button>
        </div>

        {/* Notification List */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-border/50">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">No notifications in this filter</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={`flex items-start gap-3 p-3 sm:p-3.5 transition-colors cursor-pointer hover:bg-muted/50 ${
                  !item.isRead ? "bg-primary/5" : ""
                }`}
              >
                <div
                  className={`size-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${getIconBg(
                    item.type,
                  )}`}
                >
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p
                      className={`text-xs truncate ${
                        !item.isRead
                          ? "font-bold text-foreground"
                          : "font-medium text-foreground/90"
                      }`}
                    >
                      {item.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                      {item.time}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {item.link && (
                    <div className="mt-1.5 flex items-center justify-between">
                      <Link
                        to={item.link}
                        onClick={() => {
                          markAsRead(item.id);
                          setOpen(false);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                      >
                        <span>Open details</span>
                        <ExternalLink className="size-3" />
                      </Link>
                      {!item.isRead && (
                        <span className="size-2 rounded-full bg-primary shrink-0" title="Unread" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-2.5 bg-muted/20 flex items-center justify-between text-xs">
          <Link
            to="/reports"
            onClick={() => setOpen(false)}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Audit Reports Center →
          </Link>
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            View Live QMT Board
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
