import crypto from "node:crypto";
import { getSupabaseServerClient } from "../lib/supabase.ts";
import type { CustomForm, FormQuestion, FormResponse } from "../lib/form-types.ts";

// -----------------------------------------------------------------------------
// Type Definitions
// -----------------------------------------------------------------------------
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

export interface ReportItem {
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
  createdAt: string;
}

export type UserRole = "superadmin" | "admin" | "coordinator" | "qmt" | "doctor" | "staff";

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  name: string;
  departmentSlug?: string | null;
  departmentLabel?: string | null;
  status: "active" | "banned";
  createdAt: string;
  updatedAt: string;
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
}

export interface FormDbRow {
  id: string;
  department_slug: string;
  department_label: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  questions_json: unknown;
  created_at: string;
  updated_at: string;
}

export interface FormResponseDbRow {
  id: string;
  form_id: string;
  submitted_at: string;
  answers_json: unknown;
  forms?: {
    title?: string;
    department_label?: string;
    department_slug?: string;
  } | null;
}

export interface PatientDbRow {
  id: string;
  name: string;
  mrn: string;
  age: number;
  gender: string;
  phone: string;
  department_slug: string;
  department_label: string;
  registered_at: string;
  status: string;
}

export interface AppointmentDbRow {
  id: string;
  patient_name: string;
  patient_id: string | null;
  doctor_name: string;
  department_slug: string;
  department_label: string;
  time: string;
  date: string;
  status: string;
  created_at: string;
}

export interface ActivityDbRow {
  id: string;
  type: string;
  title: string;
  meta: string;
  timestamp: string;
  created_at: string;
}

export interface ReportDbRow {
  id: string;
  title: string;
  category: string;
  department: string;
  department_slug: string;
  author: string;
  date: string;
  score: string;
  status: string;
  summary: string;
  created_at: string;
}

export interface UserDbRow {
  id: string;
  username: string;
  password: string;
  role: string;
  name: string;
  department_slug: string | null;
  department_label: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Secure Cryptographic Password Hashing & Verification
// -----------------------------------------------------------------------------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  if (stored.startsWith("scrypt:")) {
    const parts = stored.split(":");
    if (parts.length !== 3) return false;
    const [, salt, hash] = parts;
    if (!salt || !hash) return false;
    try {
      const computed = crypto.scryptSync(password, salt, 64).toString("hex");
      return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(computed, "hex"));
    } catch {
      return false;
    }
  }
  if (password.length !== stored.length) return false;
  return crypto.timingSafeEqual(Buffer.from(password), Buffer.from(stored));
}

function parseJsonValue<T>(val: unknown, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "object") return val as T;
  if (typeof val === "string") {
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

// -----------------------------------------------------------------------------
// Backend Status Checker
// -----------------------------------------------------------------------------
export async function getDbBackend(): Promise<"supabase"> {
  return "supabase";
}

// -----------------------------------------------------------------------------
// FORMS CRUD (Supabase PostgreSQL)
// -----------------------------------------------------------------------------
export async function dbGetAllForms(departmentSlug?: string): Promise<CustomForm[]> {
  const supabase = getSupabaseServerClient();
  let query = supabase.from("forms").select("*").order("updated_at", { ascending: false });

  if (departmentSlug) {
    query = query.eq("department_slug", departmentSlug);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[Supabase dbGetAllForms error]:", error.message);
    throw new Error(`Failed to fetch forms: ${error.message}`);
  }

  const rows = (data || []) as FormDbRow[];
  return rows.map((r) => ({
    id: r.id,
    departmentSlug: r.department_slug,
    departmentLabel: r.department_label,
    title: r.title,
    description: r.description || "",
    bannerUrl: r.banner_url || undefined,
    questions: parseJsonValue<FormQuestion[]>(r.questions_json, []),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function dbGetFormById(id: string): Promise<CustomForm | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("forms").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error(`[Supabase dbGetFormById error for ${id}]:`, error.message);
    return null;
  }

  if (!data) return null;
  const r = data as FormDbRow;

  return {
    id: r.id,
    departmentSlug: r.department_slug,
    departmentLabel: r.department_label,
    title: r.title,
    description: r.description || "",
    bannerUrl: r.banner_url || undefined,
    questions: parseJsonValue<FormQuestion[]>(r.questions_json, []),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function dbUpsertForm(form: CustomForm): Promise<CustomForm> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();
  const createdAt = form.createdAt || now;
  const updatedAt = now;

  const row = {
    id: form.id,
    department_slug: form.departmentSlug,
    department_label: form.departmentLabel,
    title: form.title,
    description: form.description || "",
    banner_url: form.bannerUrl || null,
    questions_json: form.questions || [],
    created_at: createdAt,
    updated_at: updatedAt,
  };

  const { error } = await supabase.from("forms").upsert(row, { onConflict: "id" });
  if (error) {
    console.error("[Supabase dbUpsertForm error]:", error.message);
    throw new Error(`Failed to save form: ${error.message}`);
  }

  return {
    ...form,
    createdAt,
    updatedAt,
  };
}

export async function dbDeleteForm(id: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  // With ON DELETE CASCADE in PostgreSQL, deleting the form deletes responses automatically.
  // Explicitly deleting form_responses first as a safeguard:
  await supabase.from("form_responses").delete().eq("form_id", id);
  const { error } = await supabase.from("forms").delete().eq("id", id);

  if (error) {
    console.error(`[Supabase dbDeleteForm error for ${id}]:`, error.message);
    throw new Error(`Failed to delete form from Supabase: ${error.message}`);
  }

  return true;
}

// -----------------------------------------------------------------------------
// RESPONSES CRUD (Supabase PostgreSQL)
// -----------------------------------------------------------------------------
export async function dbSaveResponse(response: FormResponse): Promise<FormResponse> {
  const supabase = getSupabaseServerClient();
  const row = {
    id: response.id,
    form_id: response.formId,
    submitted_at: response.submittedAt || new Date().toISOString(),
    answers_json: response.answers || {},
  };

  const { error } = await supabase.from("form_responses").insert(row);
  if (error) {
    console.error("[Supabase dbSaveResponse error]:", error.message);
    throw new Error(`Failed to save response to Supabase: ${error.message}`);
  }

  // Log activity
  try {
    const form = await dbGetFormById(response.formId);
    const formTitle = form?.title || "Clinical Form";
    const deptLabel = form?.departmentLabel || "ALERT Hospital";
    await dbAddActivity(
      "form_submitted",
      "Clinical audit response submitted",
      `${formTitle} (${deptLabel})`,
    );
  } catch (err) {
    console.warn("Could not log activity for response:", err);
  }

  return response;
}

export async function dbGetResponses(formId: string): Promise<FormResponse[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("form_responses")
    .select("*")
    .eq("form_id", formId)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error(`[Supabase dbGetResponses error for ${formId}]:`, error.message);
    return [];
  }

  const rows = (data || []) as FormResponseDbRow[];
  return rows.map((r) => ({
    id: r.id,
    formId: r.form_id,
    submittedAt: r.submitted_at,
    answers: parseJsonValue<Record<string, unknown>>(r.answers_json, {}),
  }));
}

export async function dbGetAllResponses(limit = 100): Promise<
  (FormResponse & {
    formTitle?: string;
    departmentLabel?: string;
    departmentSlug?: string;
  })[]
> {
  const supabase = getSupabaseServerClient();
  const safeLimit = Math.min(Math.max(1, limit || 100), 500);

  const { data, error } = await supabase
    .from("form_responses")
    .select(
      `
      id,
      form_id,
      submitted_at,
      answers_json,
      forms (
        title,
        department_label,
        department_slug
      )
    `,
    )
    .order("submitted_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    console.error("[Supabase dbGetAllResponses error]:", error.message);
    return [];
  }

  const rows = (data || []) as FormResponseDbRow[];
  return rows.map((r) => {
    const formObj = Array.isArray(r.forms) ? r.forms[0] : r.forms;
    return {
      id: r.id,
      formId: r.form_id,
      submittedAt: r.submitted_at,
      answers: parseJsonValue<Record<string, unknown>>(r.answers_json, {}),
      formTitle: formObj?.title || "Department Form",
      departmentLabel: formObj?.department_label || "ALERT Hospital",
      departmentSlug: formObj?.department_slug || "",
    };
  });
}

// -----------------------------------------------------------------------------
// PATIENTS CRUD (Supabase PostgreSQL)
// -----------------------------------------------------------------------------
export async function dbGetPatients(limit = 100): Promise<Patient[]> {
  const supabase = getSupabaseServerClient();
  const safeLimit = Math.min(Math.max(1, limit), 500);

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("registered_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    console.error("[Supabase dbGetPatients error]:", error.message);
    return [];
  }

  const rows = (data || []) as PatientDbRow[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    mrn: r.mrn,
    age: r.age,
    gender: (r.gender === "Female" ? "Female" : "Male") as "Male" | "Female",
    phone: r.phone,
    departmentSlug: r.department_slug,
    departmentLabel: r.department_label,
    registeredAt: r.registered_at,
    status: (r.status as "Active" | "Discharged" | "Admitted") || "Active",
  }));
}

export async function dbAddPatient(patient: {
  name: string;
  mrn?: string | undefined;
  age: number;
  gender: "Male" | "Female";
  phone: string;
  departmentSlug: string;
  departmentLabel: string;
  status?: ("Active" | "Discharged" | "Admitted") | undefined;
}): Promise<Patient> {
  const supabase = getSupabaseServerClient();
  const id = `PAT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
  const mrn = patient.mrn?.trim() || `MRN-2026-${Math.floor(Math.random() * 800 + 100)}`;
  const registeredAt = new Date().toISOString();
  const status = patient.status || "Active";

  const row = {
    id,
    name: patient.name.trim(),
    mrn,
    age: patient.age,
    gender: patient.gender,
    phone: patient.phone.trim(),
    department_slug: patient.departmentSlug,
    department_label: patient.departmentLabel,
    registered_at: registeredAt,
    status,
  };

  const { error } = await supabase.from("patients").insert(row);
  if (error) {
    console.error("[Supabase dbAddPatient error]:", error.message);
    throw new Error(`Failed to add patient to Supabase: ${error.message}`);
  }

  await dbAddActivity(
    "patient_registered",
    "New patient registered",
    `${patient.name} (${patient.departmentLabel})`,
  );

  return {
    id,
    name: patient.name,
    mrn,
    age: patient.age,
    gender: patient.gender,
    phone: patient.phone,
    departmentSlug: patient.departmentSlug,
    departmentLabel: patient.departmentLabel,
    registeredAt,
    status,
  };
}

export async function dbDeletePatient(id: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("patients").delete().eq("id", id);
  if (error) {
    console.error(`[Supabase dbDeletePatient error for ${id}]:`, error.message);
    throw new Error(`Failed to delete patient from Supabase: ${error.message}`);
  }
  return true;
}

// -----------------------------------------------------------------------------
// APPOINTMENTS CRUD (Supabase PostgreSQL)
// -----------------------------------------------------------------------------
export async function dbGetAppointments(limit = 100, deptSlug?: string): Promise<Appointment[]> {
  const supabase = getSupabaseServerClient();
  const safeLimit = Math.min(Math.max(1, limit), 500);

  let query = supabase
    .from("appointments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (deptSlug) {
    query = query.eq("department_slug", deptSlug);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[Supabase dbGetAppointments error]:", error.message);
    return [];
  }

  const rows = (data || []) as AppointmentDbRow[];
  return rows.map((r) => ({
    id: r.id,
    patientName: r.patient_name,
    patientId: r.patient_id || "",
    doctorName: r.doctor_name,
    departmentSlug: r.department_slug,
    departmentLabel: r.department_label,
    time: r.time,
    date: r.date,
    status: (r.status as "Completed" | "In Progress" | "Pending" | "Confirmed") || "Confirmed",
    createdAt: r.created_at,
  }));
}

export async function dbAddAppointment(appointment: {
  patientName: string;
  patientId?: string | undefined;
  doctorName: string;
  departmentSlug: string;
  departmentLabel: string;
  time: string;
  date?: string | undefined;
  status?: ("Completed" | "In Progress" | "Pending" | "Confirmed") | undefined;
}): Promise<Appointment> {
  const supabase = getSupabaseServerClient();
  const id = `APT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
  const patientId = appointment.patientId || `PAT-${Date.now().toString().slice(-4)}`;
  const date = appointment.date || "Today";
  const status = appointment.status || "Pending";
  const createdAt = new Date().toISOString();

  const row = {
    id,
    patient_name: appointment.patientName.trim(),
    patient_id: patientId,
    doctor_name: appointment.doctorName.trim(),
    department_slug: appointment.departmentSlug,
    department_label: appointment.departmentLabel,
    time: appointment.time.trim(),
    date,
    status,
    created_at: createdAt,
  };

  const { error } = await supabase.from("appointments").insert(row);
  if (error) {
    console.error("[Supabase dbAddAppointment error]:", error.message);
    throw new Error(`Failed to add appointment to Supabase: ${error.message}`);
  }

  await dbAddActivity(
    "appointment_booked",
    "New appointment booked",
    `${appointment.patientName} with ${appointment.doctorName} (${appointment.time})`,
  );

  return {
    id,
    patientName: appointment.patientName,
    patientId,
    doctorName: appointment.doctorName,
    departmentSlug: appointment.departmentSlug,
    departmentLabel: appointment.departmentLabel,
    time: appointment.time,
    date,
    status,
    createdAt,
  };
}

export async function dbUpdateAppointmentStatus(
  id: string,
  status: "Completed" | "In Progress" | "Pending" | "Confirmed",
): Promise<Appointment | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    console.error(`[Supabase dbUpdateAppointmentStatus error for ${id}]:`, error?.message);
    return null;
  }

  const row = data as AppointmentDbRow;
  await dbAddActivity(
    status === "Completed" ? "appointment_completed" : "appointment_status",
    `Appointment status updated to ${status}`,
    `${row.patient_name} (${row.doctor_name})`,
  );

  return {
    id: row.id,
    patientName: row.patient_name,
    patientId: row.patient_id || "",
    doctorName: row.doctor_name,
    departmentSlug: row.department_slug,
    departmentLabel: row.department_label,
    time: row.time,
    date: row.date,
    status,
    createdAt: row.created_at,
  };
}

export async function dbDeleteAppointment(id: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) {
    console.error(`[Supabase dbDeleteAppointment error for ${id}]:`, error.message);
    throw new Error(`Failed to delete appointment from Supabase: ${error.message}`);
  }
  return true;
}

// -----------------------------------------------------------------------------
// ACTIVITIES CRUD (Supabase PostgreSQL)
// -----------------------------------------------------------------------------
export async function dbGetActivities(limit = 20): Promise<ActivityItem[]> {
  const supabase = getSupabaseServerClient();
  const safeLimit = Math.min(Math.max(1, limit), 100);

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    console.error("[Supabase dbGetActivities error]:", error.message);
    return [];
  }

  const rows = (data || []) as ActivityDbRow[];
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    meta: r.meta,
    time: r.timestamp,
  }));
}

export async function dbAddActivity(
  type: string,
  title: string,
  meta: string,
): Promise<ActivityItem> {
  const supabase = getSupabaseServerClient();
  const id = `ACT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
  const now = new Date();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  const timestamp = `${formattedHours}:${minutes} ${ampm}`;

  const row = {
    id,
    type,
    title,
    meta,
    timestamp,
    created_at: now.toISOString(),
  };

  const { error } = await supabase.from("activities").insert(row);
  if (error) {
    console.warn("[Supabase dbAddActivity error]:", error.message);
  }

  return { id, type, title, meta, time: timestamp };
}

// -----------------------------------------------------------------------------
// REPORTS CRUD (Supabase PostgreSQL)
// -----------------------------------------------------------------------------
export async function dbGetReports(limit = 100): Promise<ReportItem[]> {
  const supabase = getSupabaseServerClient();
  const safeLimit = Math.min(Math.max(1, limit), 200);

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    console.error("[Supabase dbGetReports error]:", error.message);
    return [];
  }

  const rows = (data || []) as ReportDbRow[];
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    category: (r.category as ReportItem["category"]) || "Audit",
    department: r.department,
    departmentSlug: r.department_slug,
    author: r.author,
    date: r.date,
    score: r.score,
    status: (r.status as ReportItem["status"]) || "Completed",
    summary: r.summary,
    createdAt: r.created_at,
  }));
}

export async function dbAddReport(report: {
  title: string;
  category: "Audit" | "Incident" | "Consent" | "Survey" | "Checklist";
  department: string;
  departmentSlug: string;
  author: string;
  date?: string | undefined;
  score?: string | undefined;
  status?: ("Completed" | "Reviewed" | "Pending Review") | undefined;
  summary?: string | undefined;
}): Promise<ReportItem> {
  const supabase = getSupabaseServerClient();
  const id = `REP-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
  const now = new Date();
  const date =
    report.date ||
    now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const status = report.status || "Completed";
  const score = report.score || "95%";
  const summary = report.summary || "Summary report compiled from live department submissions.";
  const createdAt = now.toISOString();

  const row = {
    id,
    title: report.title.trim(),
    category: report.category,
    department: report.department.trim(),
    department_slug: report.departmentSlug.trim(),
    author: report.author.trim(),
    date,
    score,
    status,
    summary: summary.trim(),
    created_at: createdAt,
  };

  const { error } = await supabase.from("reports").insert(row);
  if (error) {
    console.error("[Supabase dbAddReport error]:", error.message);
    throw new Error(`Failed to add report to Supabase: ${error.message}`);
  }

  await dbAddActivity(
    "report_generated",
    "Audit summary report compiled",
    `${report.title} (${report.department})`,
  );

  return {
    id,
    title: report.title,
    category: report.category,
    department: report.department,
    departmentSlug: report.departmentSlug,
    author: report.author,
    date,
    score,
    status,
    summary,
    createdAt,
  };
}

export async function dbDeleteReport(id: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) {
    console.error(`[Supabase dbDeleteReport error for ${id}]:`, error.message);
    throw new Error(`Failed to delete report from Supabase: ${error.message}`);
  }
  await dbAddActivity("report_deleted", "Clinical report removed", `Report ID: ${id}`);
  return true;
}

// -----------------------------------------------------------------------------
// DYNAMIC DASHBOARD STATS (Supabase PostgreSQL)
// -----------------------------------------------------------------------------
export async function dbGetDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabaseServerClient();

  const [
    patientCountRes,
    formsCountRes,
    responsesCountRes,
    todayApptsRes,
    appointmentsRes,
    patientsRes,
    activitiesRes,
  ] = await Promise.all([
    supabase.from("patients").select("*", { count: "exact", head: true }),
    supabase.from("forms").select("*", { count: "exact", head: true }),
    supabase.from("form_responses").select("*", { count: "exact", head: true }),
    supabase.from("appointments").select("*", { count: "exact", head: true }).eq("date", "Today"),
    dbGetAppointments(10),
    dbGetPatients(10),
    dbGetActivities(10),
  ]);

  const patientCount = patientCountRes.count || 0;
  const totalForms = formsCountRes.count || 0;
  const totalResponses = responsesCountRes.count || 0;
  const todayAppointments = todayApptsRes.count || 0;

  // Department distribution
  const { data: deptForms } = await supabase
    .from("forms")
    .select("department_label, form_responses(count)");

  const deptCountsRaw: { department_label: string; response_count: number }[] = [];
  if (Array.isArray(deptForms)) {
    for (const f of deptForms) {
      const respCount =
        Array.isArray(f.form_responses) && f.form_responses[0]
          ? (f.form_responses[0] as { count: number }).count
          : 0;
      deptCountsRaw.push({
        department_label: f.department_label,
        response_count: respCount || 0,
      });
    }
  }

  const totalPatients = patientCount + totalResponses;
  const totalDoctors = 42;
  const availableBeds = 654;

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayIdx = new Date().getDay();

  // 7-day visit metrics based on form responses
  const visits = daysOfWeek.map((dayName) => ({
    day: dayName,
    value: Math.floor(totalResponses / 7) || 0,
  }));

  const colors = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ];

  const totalDeptResponses = deptCountsRaw.reduce((acc, row) => acc + (row.response_count || 0), 0);
  const departments = deptCountsRaw.slice(0, 5).map((d, idx) => ({
    name: d.department_label,
    value: totalDeptResponses > 0 ? Math.round((d.response_count / totalDeptResponses) * 100) : 0,
    color: colors[idx % colors.length] || "var(--color-chart-1)",
  }));

  return {
    totalPatients,
    totalPatientsDelta: totalPatients > 0 ? "+100%" : "0%",
    todayAppointments,
    todayAppointmentsDelta: todayAppointments > 0 ? `+${todayAppointments}` : "0",
    totalDoctors,
    availableBeds,
    totalForms,
    totalResponses,
    visits,
    departments,
    appointments: appointmentsRes,
    patients: patientsRes,
    activities: activitiesRes,
  };
}

// -----------------------------------------------------------------------------
// USER MANAGEMENT & AUTHENTICATION (Supabase PostgreSQL)
// -----------------------------------------------------------------------------
function mapUserRow(row: UserDbRow): UserAccount {
  return {
    id: row.id,
    username: row.username,
    role: row.role as UserRole,
    name: row.name,
    departmentSlug: row.department_slug,
    departmentLabel: row.department_label,
    status: (row.status as "active" | "banned") || "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function dbGetUsers(): Promise<UserAccount[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("username", { ascending: true });

  if (error) {
    console.error("[Supabase dbGetUsers error]:", error.message);
    return [];
  }

  const rows = (data || []) as UserDbRow[];
  return rows.map(mapUserRow);
}

export async function dbGetUserById(id: string): Promise<UserAccount | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();

  if (error || !data) return null;
  return mapUserRow(data as UserDbRow);
}

export async function dbGetUserByUsername(username: string): Promise<UserAccount | null> {
  const supabase = getSupabaseServerClient();
  const trimmed = username.trim().toLowerCase();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("username", trimmed)
    .maybeSingle();

  if (error || !data) return null;
  return mapUserRow(data as UserDbRow);
}

export async function dbAuthenticateUser(
  username: string,
  pass: string,
): Promise<{ success: boolean; user?: UserAccount; error?: string; banned?: boolean }> {
  const trimmed = username.trim().toLowerCase();
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("username", trimmed)
    .maybeSingle();

  if (error || !data) {
    return { success: false, error: "Invalid username or password" };
  }

  const storedUserRow = data as UserDbRow;

  if (storedUserRow.status === "banned") {
    return {
      success: false,
      error: "This account has been banned. Please contact Super Administrator Habtamu.",
      banned: true,
      user: mapUserRow(storedUserRow),
    };
  }

  if (!verifyPassword(pass, storedUserRow.password)) {
    return { success: false, error: "Invalid username or password" };
  }

  // Transparently upgrade legacy plaintext password to secure scrypt hash in Supabase
  if (!storedUserRow.password.startsWith("scrypt:")) {
    const newHash = hashPassword(pass);
    await supabase.from("users").update({ password: newHash }).eq("id", storedUserRow.id);
  }

  return { success: true, user: mapUserRow(storedUserRow) };
}

export async function dbAddUser(data: {
  username: string;
  password: string;
  role: UserRole;
  name: string;
  departmentSlug?: string | null | undefined;
  departmentLabel?: string | null | undefined;
}): Promise<UserAccount> {
  const supabase = getSupabaseServerClient();
  const trimmedUser = data.username.trim();

  const existing = await dbGetUserByUsername(trimmedUser);
  if (existing) {
    throw new Error(`Username "${trimmedUser}" is already taken.`);
  }

  const id = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  const securePassword = hashPassword(data.password);

  const row = {
    id,
    username: trimmedUser,
    password: securePassword,
    role: data.role,
    name: data.name.trim(),
    department_slug: data.departmentSlug ?? null,
    department_label: data.departmentLabel ?? null,
    status: "active",
    created_at: now,
    updated_at: now,
  };

  const { error } = await supabase.from("users").insert(row);
  if (error) {
    console.error("[Supabase dbAddUser error]:", error.message);
    throw new Error(`Failed to create user in Supabase: ${error.message}`);
  }

  const created = await dbGetUserById(id);
  if (!created) throw new Error("Failed to retrieve created user from Supabase");
  return created;
}

export async function dbUpdateUser(
  id: string,
  updates: {
    username?: string | undefined;
    password?: string | undefined;
    role?: UserRole | undefined;
    name?: string | undefined;
    departmentSlug?: string | null | undefined;
    departmentLabel?: string | null | undefined;
    status?: "active" | "banned" | undefined;
  },
): Promise<UserAccount> {
  const supabase = getSupabaseServerClient();
  const existing = await dbGetUserById(id);
  if (!existing) {
    throw new Error("User not found");
  }

  if (existing.username === "habtamu") {
    if (updates.status === "banned") {
      throw new Error("Super Administrator account cannot be banned.");
    }
    if (updates.role && updates.role !== "superadmin") {
      throw new Error("Super Administrator role cannot be changed.");
    }
  }

  if (
    updates.username &&
    updates.username.trim().toLowerCase() !== existing.username.toLowerCase()
  ) {
    const check = await dbGetUserByUsername(updates.username.trim());
    if (check && check.id !== id) {
      throw new Error(`Username "${updates.username}" is already taken.`);
    }
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.username) updatePayload["username"] = updates.username.trim();
  if (updates.password !== undefined) updatePayload["password"] = hashPassword(updates.password);
  if (updates.role) updatePayload["role"] = updates.role;
  if (updates.name !== undefined) updatePayload["name"] = updates.name.trim();
  if (updates.departmentSlug !== undefined)
    updatePayload["department_slug"] = updates.departmentSlug;
  if (updates.departmentLabel !== undefined)
    updatePayload["department_label"] = updates.departmentLabel;
  if (updates.status) updatePayload["status"] = updates.status;

  const { error } = await supabase.from("users").update(updatePayload).eq("id", id);
  if (error) {
    console.error(`[Supabase dbUpdateUser error for ${id}]:`, error.message);
    throw new Error(`Failed to update user in Supabase: ${error.message}`);
  }

  const updated = await dbGetUserById(id);
  if (!updated) throw new Error("Failed to retrieve updated user");
  return updated;
}

export async function dbDeleteUser(id: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const existing = await dbGetUserById(id);
  if (!existing) return false;

  if (existing.username === "habtamu" || existing.role === "superadmin") {
    throw new Error("Super Administrator account cannot be deleted.");
  }

  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) {
    console.error(`[Supabase dbDeleteUser error for ${id}]:`, error.message);
    throw new Error(`Failed to delete user from Supabase: ${error.message}`);
  }

  return true;
}

export async function dbBanUser(id: string, ban: boolean): Promise<UserAccount> {
  return await dbUpdateUser(id, { status: ban ? "banned" : "active" });
}
