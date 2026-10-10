import { useState, useEffect, useCallback } from "react";

export interface Patient {
  id: string;
  name: string;
  mrn: string;
  age: number;
  gender: "Male" | "Female";
  phone: string;
  departmentSlug: string;
  departmentLabel: string;
  registeredAt: string;
  status: "Active" | "Discharged" | "Admitted";
}

export interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  departmentSlug: string;
  departmentLabel: string;
  time: string;
  date: string;
  status: "Completed" | "In Progress" | "Pending" | "Confirmed";
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  meta: string;
  time: string;
}

export interface TopOfficerLeader {
  id: string;
  name: string;
  role: string;
  department: string;
  departmentSlug?: string | undefined;
  type: "QMT Officer" | "Coordinator";
  auditsCompleted: number;
  complianceRate: string;
  rating: number;
  status: "Active" | "In Audit" | "Reviewing";
  email?: string | undefined;
  phone?: string | undefined;
}

export interface DashboardStats {
  totalPatients: number;
  totalPatientsDelta: string;
  todayAppointments: number;
  todayAppointmentsDelta: string;
  totalDoctors: number;
  availableBeds: number;
  totalForms: number;
  totalResponses: number;
  visits: { day: string; value: number }[];
  departments: { name: string; value: number; color: string }[];
  appointments: Appointment[];
  patients: Patient[];
  activities: ActivityItem[];
  topOfficers?: TopOfficerLeader[];
}

const DASHBOARD_CACHE_KEY = "alert_dashboard_stats_cache";

export const DEFAULT_DASHBOARD_STATS: DashboardStats = {
  totalPatients: 0,
  totalPatientsDelta: "0%",
  todayAppointments: 0,
  todayAppointmentsDelta: "0",
  totalDoctors: 42,
  availableBeds: 654,
  totalForms: 0,
  totalResponses: 0,
  visits: [
    { day: "Mon", value: 0 },
    { day: "Tue", value: 0 },
    { day: "Wed", value: 0 },
    { day: "Thu", value: 0 },
    { day: "Fri", value: 0 },
    { day: "Sat", value: 0 },
    { day: "Sun", value: 0 },
  ],
  departments: [],
  appointments: [],
  patients: [],
  activities: [],
  topOfficers: [],
};

export function getCachedDashboardStats(): DashboardStats {
  if (typeof window === "undefined") return DEFAULT_DASHBOARD_STATS;
  try {
    const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
    return raw ? (JSON.parse(raw) as DashboardStats) : DEFAULT_DASHBOARD_STATS;
  } catch {
    return DEFAULT_DASHBOARD_STATS;
  }
}

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats>(getCachedDashboardStats);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = (await res.json()) as DashboardStats;
        setStats(data);
        if (typeof window !== "undefined") {
          localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(data));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch dynamic dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const handleUpdate = () => {
      void refresh();
    };

    window.addEventListener("alert-dashboard-updated", handleUpdate);
    window.addEventListener("alert-form-responses-updated", handleUpdate);
    window.addEventListener("alert-appointment-added", handleUpdate);
    window.addEventListener("alert-patient-added", handleUpdate);

    return () => {
      window.removeEventListener("alert-dashboard-updated", handleUpdate);
      window.removeEventListener("alert-form-responses-updated", handleUpdate);
      window.removeEventListener("alert-appointment-added", handleUpdate);
      window.removeEventListener("alert-patient-added", handleUpdate);
    };
  }, [refresh]);

  return { stats, loading, refresh };
}

export async function bookAppointment(data: {
  patientName: string;
  patientId?: string;
  doctorName: string;
  departmentSlug: string;
  departmentLabel: string;
  time: string;
  date?: string;
  status?: "Completed" | "In Progress" | "Pending" | "Confirmed";
}): Promise<Appointment | null> {
  try {
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to book appointment");
    const created = (await res.json()) as Appointment;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("alert-appointment-added"));
      window.dispatchEvent(new Event("alert-dashboard-updated"));
    }
    return created;
  } catch (err) {
    console.error("bookAppointment error:", err);
    return null;
  }
}

export async function updateAppointmentStatus(
  id: string,
  status: "Completed" | "In Progress" | "Pending" | "Confirmed",
): Promise<Appointment | null> {
  try {
    const res = await fetch(`/api/appointments/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update status");
    const updated = (await res.json()) as Appointment;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("alert-dashboard-updated"));
    }
    return updated;
  } catch (err) {
    console.error("updateAppointmentStatus error:", err);
    return null;
  }
}

export async function registerPatient(data: {
  name: string;
  mrn?: string;
  age: number;
  gender: "Male" | "Female";
  phone: string;
  departmentSlug: string;
  departmentLabel: string;
  status?: "Active" | "Discharged" | "Admitted";
}): Promise<Patient | null> {
  try {
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to register patient");
    const created = (await res.json()) as Patient;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("alert-patient-added"));
      window.dispatchEvent(new Event("alert-dashboard-updated"));
    }
    return created;
  } catch (err) {
    console.error("registerPatient error:", err);
    return null;
  }
}

export async function deleteAppointment(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/appointments/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete appointment");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("alert-dashboard-updated"));
    }
    return true;
  } catch (err) {
    console.error("deleteAppointment error:", err);
    return false;
  }
}

export async function deletePatient(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/patients/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete patient");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("alert-dashboard-updated"));
    }
    return true;
  } catch (err) {
    console.error("deletePatient error:", err);
    return false;
  }
}

