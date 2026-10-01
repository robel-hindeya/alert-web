import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { CustomForm, FormQuestion, FormResponse } from "../lib/form-types.ts";

function getDatabasePath(): string {
  const isServerless =
    Boolean(process.env["VERCEL"]) ||
    Boolean(process.env["AWS_LAMBDA_FUNCTION_NAME"]) ||
    Boolean(process.env["NETLIFY"]) ||
    process.cwd().startsWith("/var/task");

  if (isServerless) {
    const tmpDbPath = path.join(os.tmpdir(), "hospital.db");
    const bundledDb = path.join(process.cwd(), "data", "hospital.db");

    // Copy bundled seed DB to writable /tmp on first run if available
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(bundledDb)) {
      try {
        fs.copyFileSync(bundledDb, tmpDbPath);
      } catch (err) {
        console.warn("Could not copy bundled DB to /tmp, will initialize directly in /tmp:", err);
      }
    }
    return tmpDbPath;
  }

  // Local development / persistent server environment
  try {
    const localDir = path.resolve(process.cwd(), "data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return path.join(localDir, "hospital.db");
  } catch (err) {
    console.warn("Failed to create local data directory, falling back to /tmp:", err);
    return path.join(os.tmpdir(), "hospital.db");
  }
}

let dbInstance: DatabaseSync | null = null;

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

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = getDatabasePath();

    try {
      dbInstance = new DatabaseSync(dbPath);
    } catch (err) {
      console.warn(`Failed to open SQLite database at ${dbPath}, falling back to in-memory:`, err);
      try {
        dbInstance = new DatabaseSync(path.join(os.tmpdir(), `hospital-${Date.now()}.db`));
      } catch {
        dbInstance = new DatabaseSync(":memory:");
      }
    }

    // Initialize tables
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS forms (
        id TEXT PRIMARY KEY,
        department_slug TEXT NOT NULL,
        department_label TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        banner_url TEXT,
        questions_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS form_responses (
        id TEXT PRIMARY KEY,
        form_id TEXT NOT NULL,
        submitted_at TEXT NOT NULL,
        answers_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        mrn TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        phone TEXT NOT NULL,
        department_slug TEXT NOT NULL,
        department_label TEXT NOT NULL,
        registered_at TEXT NOT NULL,
        status TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        patient_name TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        doctor_name TEXT NOT NULL,
        department_slug TEXT NOT NULL,
        department_label TEXT NOT NULL,
        time TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        meta TEXT NOT NULL,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        department TEXT NOT NULL,
        department_slug TEXT NOT NULL,
        author TEXT NOT NULL,
        date TEXT NOT NULL,
        score TEXT NOT NULL,
        status TEXT NOT NULL,
        summary TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT NOT NULL,
        department_slug TEXT,
        department_label TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_forms_dept ON forms (department_slug);
      CREATE INDEX IF NOT EXISTS idx_responses_form ON form_responses (form_id);
      CREATE INDEX IF NOT EXISTS idx_patients_dept ON patients (department_slug);
      CREATE INDEX IF NOT EXISTS idx_appointments_dept ON appointments (department_slug);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
    `);

    // Ensure superadmin "habtamu" with password "Habtamu5645" is seeded
    try {
      const superAdminExists = dbInstance
        .prepare("SELECT id FROM users WHERE username = ?")
        .get("habtamu") as { id: string } | undefined;

      const nowIso = new Date().toISOString();

      if (!superAdminExists) {
        dbInstance
          .prepare(
            `INSERT INTO users (id, username, password, role, name, department_slug, department_label, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            "usr-superadmin-habtamu",
            "habtamu",
            "Habtamu5645",
            "superadmin",
            "Habtamu (Super Administrator)",
            null,
            null,
            "active",
            nowIso,
            nowIso,
          );
      } else {
        // Enforce latest required password and superadmin role
        dbInstance
          .prepare(
            "UPDATE users SET password = ?, role = 'superadmin', status = 'active', updated_at = ? WHERE username = 'habtamu'",
          )
          .run("Habtamu5645", nowIso);
      }

      // Seed default admin if not exists
      const adminExists = dbInstance
        .prepare("SELECT id FROM users WHERE username = ?")
        .get("admin") as { id: string } | undefined;
      if (!adminExists) {
        dbInstance
          .prepare(
            `INSERT INTO users (id, username, password, role, name, department_slug, department_label, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            "usr-admin-default",
            "admin",
            "Admin123",
            "admin",
            "Hospital Administrator",
            null,
            null,
            "active",
            nowIso,
            nowIso,
          );
      }

      // Seed default coordinator if not exists
      const coordExists = dbInstance
        .prepare("SELECT id FROM users WHERE username = ?")
        .get("coordinator") as { id: string } | undefined;
      if (!coordExists) {
        dbInstance
          .prepare(
            `INSERT INTO users (id, username, password, role, name, department_slug, department_label, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            "usr-coordinator-default",
            "coordinator",
            "Coord123",
            "coordinator",
            "Emergency Clinical Coordinator",
            "emergency",
            "Emergency & Critical Care",
            "active",
            nowIso,
            nowIso,
          );
      }

      // Seed default QMT officer if not exists
      const qmtExists = dbInstance.prepare("SELECT id FROM users WHERE username = ?").get("qmt") as
        { id: string } | undefined;
      if (!qmtExists) {
        dbInstance
          .prepare(
            `INSERT INTO users (id, username, password, role, name, department_slug, department_label, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            "usr-qmt-default",
            "qmt",
            "Qmt123",
            "qmt",
            "Dr. Roman Sisay (QMT Officer)",
            null,
            null,
            "active",
            nowIso,
            nowIso,
          );
      }
    } catch (seedErr) {
      console.warn("User seeding notice:", seedErr);
    }

    // Purge any legacy static default forms to keep forms 100% dynamic
    try {
      dbInstance
        .prepare(
          "DELETE FROM forms WHERE id IN ('emergency-triage-assessment', 'corridor-handover-checklist')",
        )
        .run();
      dbInstance
        .prepare(
          "DELETE FROM form_responses WHERE form_id IN ('emergency-triage-assessment', 'corridor-handover-checklist')",
        )
        .run();
    } catch {
      // ignore table empty/clean errors
    }
  }

  return dbInstance;
}

interface FormDbRow {
  id: string;
  department_slug: string;
  department_label: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  questions_json: string;
  created_at: string;
  updated_at: string;
}

interface FormResponseDbRow {
  id: string;
  form_id: string;
  submitted_at: string;
  answers_json: string;
  form_title?: string | null;
  department_label?: string | null;
  department_slug?: string | null;
}

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function dbGetAllForms(departmentSlug?: string): CustomForm[] {
  const db = getDb();
  let rows: FormDbRow[];
  if (departmentSlug) {
    rows = db
      .prepare("SELECT * FROM forms WHERE department_slug = ? ORDER BY updated_at DESC")
      .all(departmentSlug) as unknown as FormDbRow[];
  } else {
    rows = db
      .prepare("SELECT * FROM forms ORDER BY updated_at DESC")
      .all() as unknown as FormDbRow[];
  }

  return rows.map((r) => ({
    id: r.id,
    departmentSlug: r.department_slug,
    departmentLabel: r.department_label,
    title: r.title,
    description: r.description || "",
    bannerUrl: r.banner_url || undefined,
    questions: safeJsonParse<FormQuestion[]>(r.questions_json, []),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function dbGetFormById(id: string): CustomForm | null {
  const db = getDb();
  const r = db.prepare("SELECT * FROM forms WHERE id = ?").get(id) as unknown as
    FormDbRow | undefined;
  if (!r) return null;

  return {
    id: r.id,
    departmentSlug: r.department_slug,
    departmentLabel: r.department_label,
    title: r.title,
    description: r.description || "",
    bannerUrl: r.banner_url || undefined,
    questions: safeJsonParse<FormQuestion[]>(r.questions_json, []),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function dbUpsertForm(form: CustomForm): CustomForm {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM forms WHERE id = ?").get(form.id);

  const now = new Date().toISOString();
  const createdAt = form.createdAt || now;
  const updatedAt = now;

  if (existing) {
    db.prepare(
      `
      UPDATE forms
      SET department_slug = ?, department_label = ?, title = ?, description = ?, banner_url = ?, questions_json = ?, updated_at = ?
      WHERE id = ?
    `,
    ).run(
      form.departmentSlug,
      form.departmentLabel,
      form.title,
      form.description || "",
      form.bannerUrl || "",
      JSON.stringify(form.questions || []),
      updatedAt,
      form.id,
    );
  } else {
    db.prepare(
      `
      INSERT INTO forms (id, department_slug, department_label, title, description, banner_url, questions_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      form.id,
      form.departmentSlug,
      form.departmentLabel,
      form.title,
      form.description || "",
      form.bannerUrl || "",
      JSON.stringify(form.questions || []),
      createdAt,
      updatedAt,
    );
  }

  return {
    ...form,
    createdAt,
    updatedAt,
  };
}

export function dbDeleteForm(id: string): boolean {
  const db = getDb();
  db.prepare("DELETE FROM forms WHERE id = ?").run(id);
  db.prepare("DELETE FROM form_responses WHERE form_id = ?").run(id);
  return true;
}

export function dbSaveResponse(response: FormResponse): FormResponse {
  const db = getDb();
  db.prepare(
    `
    INSERT INTO form_responses (id, form_id, submitted_at, answers_json)
    VALUES (?, ?, ?, ?)
  `,
  ).run(response.id, response.formId, response.submittedAt, JSON.stringify(response.answers || {}));

  // Automatically log dynamic activity
  try {
    const form = dbGetFormById(response.formId);
    const formTitle = form?.title || "Clinical Form";
    const deptLabel = form?.departmentLabel || "ALERT Hospital";
    dbAddActivity(
      "form_submitted",
      "Clinical audit response submitted",
      `${formTitle} (${deptLabel})`,
    );
  } catch (err) {
    console.warn("Could not log activity for response:", err);
  }

  return response;
}

export function dbGetResponses(formId: string): FormResponse[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM form_responses WHERE form_id = ? ORDER BY submitted_at DESC")
    .all(formId) as unknown as FormResponseDbRow[];
  return rows.map((r) => ({
    id: r.id,
    formId: r.form_id,
    submittedAt: r.submitted_at,
    answers: safeJsonParse<Record<string, unknown>>(r.answers_json, {}),
  }));
}

export function dbGetAllResponses(
  limit = 100,
): (FormResponse & { formTitle?: string; departmentLabel?: string; departmentSlug?: string })[] {
  const db = getDb();
  const safeLimit = Math.min(Math.max(1, limit || 100), 500);
  const rows = db
    .prepare(
      `
    SELECT r.id, r.form_id, r.submitted_at, r.answers_json, f.title as form_title, f.department_label, f.department_slug
    FROM form_responses r
    LEFT JOIN forms f ON r.form_id = f.id
    ORDER BY r.submitted_at DESC
    LIMIT ?
  `,
    )
    .all(safeLimit) as unknown as FormResponseDbRow[];

  return rows.map((r) => ({
    id: r.id,
    formId: r.form_id,
    submittedAt: r.submitted_at,
    answers: safeJsonParse<Record<string, unknown>>(r.answers_json, {}),
    formTitle: r.form_title || "Department Form",
    departmentLabel: r.department_label || "ALERT Hospital",
    departmentSlug: r.department_slug || "",
  }));
}

// ---------------------------------------------------------------------------
// PATIENTS CRUD
// ---------------------------------------------------------------------------
interface PatientDbRow {
  id: string;
  name: string;
  mrn: string;
  age: number;
  gender: "Male" | "Female";
  phone: string;
  department_slug: string;
  department_label: string;
  registered_at: string;
  status: "Active" | "Discharged" | "Admitted";
}

export function dbGetPatients(limit = 100): Patient[] {
  const db = getDb();
  const safeLimit = Math.min(Math.max(1, limit), 500);
  const rows = db
    .prepare("SELECT * FROM patients ORDER BY registered_at DESC LIMIT ?")
    .all(safeLimit) as unknown as PatientDbRow[];

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    mrn: r.mrn,
    age: r.age,
    gender: r.gender,
    phone: r.phone,
    departmentSlug: r.department_slug,
    departmentLabel: r.department_label,
    registeredAt: r.registered_at,
    status: r.status,
  }));
}

export function dbAddPatient(patient: {
  name: string;
  mrn?: string | undefined;
  age: number;
  gender: "Male" | "Female";
  phone: string;
  departmentSlug: string;
  departmentLabel: string;
  status?: ("Active" | "Discharged" | "Admitted") | undefined;
}): Patient {
  const db = getDb();
  const id = `PAT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
  const mrn = patient.mrn?.trim() || `MRN-2026-${Math.floor(Math.random() * 800 + 100)}`;
  const registeredAt = new Date().toISOString();
  const status = patient.status || "Active";

  db.prepare(
    `
    INSERT INTO patients (id, name, mrn, age, gender, phone, department_slug, department_label, registered_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    patient.name.trim(),
    mrn,
    patient.age,
    patient.gender,
    patient.phone.trim(),
    patient.departmentSlug,
    patient.departmentLabel,
    registeredAt,
    status,
  );

  dbAddActivity(
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

// ---------------------------------------------------------------------------
// APPOINTMENTS CRUD
// ---------------------------------------------------------------------------
interface AppointmentDbRow {
  id: string;
  patient_name: string;
  patient_id: string;
  doctor_name: string;
  department_slug: string;
  department_label: string;
  time: string;
  date: string;
  status: "Completed" | "In Progress" | "Pending" | "Confirmed";
  created_at: string;
}

export function dbGetAppointments(limit = 100, deptSlug?: string): Appointment[] {
  const db = getDb();
  const safeLimit = Math.min(Math.max(1, limit), 500);
  let rows: AppointmentDbRow[];
  if (deptSlug) {
    rows = db
      .prepare(
        "SELECT * FROM appointments WHERE department_slug = ? ORDER BY created_at DESC LIMIT ?",
      )
      .all(deptSlug, safeLimit) as unknown as AppointmentDbRow[];
  } else {
    rows = db
      .prepare("SELECT * FROM appointments ORDER BY created_at DESC LIMIT ?")
      .all(safeLimit) as unknown as AppointmentDbRow[];
  }

  return rows.map((r) => ({
    id: r.id,
    patientName: r.patient_name,
    patientId: r.patient_id,
    doctorName: r.doctor_name,
    departmentSlug: r.department_slug,
    departmentLabel: r.department_label,
    time: r.time,
    date: r.date,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export function dbAddAppointment(appointment: {
  patientName: string;
  patientId?: string | undefined;
  doctorName: string;
  departmentSlug: string;
  departmentLabel: string;
  time: string;
  date?: string | undefined;
  status?: ("Completed" | "In Progress" | "Pending" | "Confirmed") | undefined;
}): Appointment {
  const db = getDb();
  const id = `APT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
  const patientId = appointment.patientId || `PAT-${Date.now().toString().slice(-4)}`;
  const date = appointment.date || "Today";
  const status = appointment.status || "Pending";
  const createdAt = new Date().toISOString();

  db.prepare(
    `
    INSERT INTO appointments (id, patient_name, patient_id, doctor_name, department_slug, department_label, time, date, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    appointment.patientName.trim(),
    patientId,
    appointment.doctorName.trim(),
    appointment.departmentSlug,
    appointment.departmentLabel,
    appointment.time.trim(),
    date,
    status,
    createdAt,
  );

  dbAddActivity(
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

export function dbUpdateAppointmentStatus(
  id: string,
  status: "Completed" | "In Progress" | "Pending" | "Confirmed",
): Appointment | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM appointments WHERE id = ?").get(id) as unknown as
    AppointmentDbRow | undefined;
  if (!row) return null;

  db.prepare("UPDATE appointments SET status = ? WHERE id = ?").run(status, id);

  dbAddActivity(
    status === "Completed" ? "appointment_completed" : "appointment_status",
    `Appointment status updated to ${status}`,
    `${row.patient_name} (${row.doctor_name})`,
  );

  return {
    id: row.id,
    patientName: row.patient_name,
    patientId: row.patient_id,
    doctorName: row.doctor_name,
    departmentSlug: row.department_slug,
    departmentLabel: row.department_label,
    time: row.time,
    date: row.date,
    status,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// ACTIVITIES CRUD
// ---------------------------------------------------------------------------
interface ActivityDbRow {
  id: string;
  type: string;
  title: string;
  meta: string;
  timestamp: string;
}

export function dbGetActivities(limit = 20): ActivityItem[] {
  const db = getDb();
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const rows = db
    .prepare("SELECT * FROM activities ORDER BY ROWID DESC LIMIT ?")
    .all(safeLimit) as unknown as ActivityDbRow[];

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    meta: r.meta,
    time: r.timestamp,
  }));
}

export function dbAddActivity(type: string, title: string, meta: string): ActivityItem {
  const db = getDb();
  const id = `ACT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
  const now = new Date();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  const timestamp = `${formattedHours}:${minutes} ${ampm}`;

  db.prepare(
    `
    INSERT INTO activities (id, type, title, meta, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `,
  ).run(id, type, title, meta, timestamp);

  return { id, type, title, meta, time: timestamp };
}

// ---------------------------------------------------------------------------
// REPORTS CRUD
// ---------------------------------------------------------------------------
interface ReportDbRow {
  id: string;
  title: string;
  category: "Audit" | "Incident" | "Consent" | "Survey" | "Checklist";
  department: string;
  department_slug: string;
  author: string;
  date: string;
  score: string;
  status: "Completed" | "Reviewed" | "Pending Review";
  summary: string;
  created_at: string;
}

export function dbGetReports(limit = 100): ReportItem[] {
  const db = getDb();
  const safeLimit = Math.min(Math.max(1, limit), 200);
  const rows = db
    .prepare("SELECT * FROM reports ORDER BY created_at DESC LIMIT ?")
    .all(safeLimit) as unknown as ReportDbRow[];

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    department: r.department,
    departmentSlug: r.department_slug,
    author: r.author,
    date: r.date,
    score: r.score,
    status: r.status,
    summary: r.summary,
    createdAt: r.created_at,
  }));
}

export function dbAddReport(report: {
  title: string;
  category: "Audit" | "Incident" | "Consent" | "Survey" | "Checklist";
  department: string;
  departmentSlug: string;
  author: string;
  date?: string | undefined;
  score?: string | undefined;
  status?: ("Completed" | "Reviewed" | "Pending Review") | undefined;
  summary?: string | undefined;
}): ReportItem {
  const db = getDb();
  const id = `REP-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
  const now = new Date();
  const date =
    report.date ||
    now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const status = report.status || "Completed";
  const score = report.score || "95%";
  const summary = report.summary || "Summary report compiled from live department submissions.";
  const createdAt = now.toISOString();

  db.prepare(
    `
    INSERT INTO reports (id, title, category, department, department_slug, author, date, score, status, summary, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    report.title.trim(),
    report.category,
    report.department.trim(),
    report.departmentSlug.trim(),
    report.author.trim(),
    date,
    score,
    status,
    summary.trim(),
    createdAt,
  );

  dbAddActivity(
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

export function dbDeleteReport(id: string): boolean {
  const db = getDb();
  db.prepare("DELETE FROM reports WHERE id = ?").run(id);
  dbAddActivity("report_deleted", "Clinical report removed", `Report ID: ${id}`);
  return true;
}

// ---------------------------------------------------------------------------
// DYNAMIC DASHBOARD STATS
// ---------------------------------------------------------------------------
export function dbGetDashboardStats(): DashboardStats {
  const db = getDb();

  // Patients count
  const patientCountRow = db.prepare("SELECT COUNT(*) as count FROM patients").get() as
    | {
        count: number;
      }
    | undefined;
  const patientCount = patientCountRow?.count || 0;

  // Forms count
  const formsCountRow = db.prepare("SELECT COUNT(*) as count FROM forms").get() as
    | {
        count: number;
      }
    | undefined;
  const totalForms = formsCountRow?.count || 0;

  // Responses count
  const responsesCountRow = db.prepare("SELECT COUNT(*) as count FROM form_responses").get() as
    | {
        count: number;
      }
    | undefined;
  const totalResponses = responsesCountRow?.count || 0;

  // Today's appointments count
  const apptCountRow = db
    .prepare("SELECT COUNT(*) as count FROM appointments WHERE date = 'Today'")
    .get() as { count: number } | undefined;
  const todayAppointments = apptCountRow?.count || 0;

  // Total patients: real registered patients + audit entries recorded
  const totalPatients = patientCount + totalResponses;

  // Doctor headcount & bed metrics
  const totalDoctors = 42;
  const availableBeds = 654;

  // Dynamic 7-day visit trend based on real submissions & appointments
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayIdx = new Date().getDay();
  const visits = Array.from({ length: 7 }, (_, i) => {
    const dayName = daysOfWeek[(todayIdx - 6 + i + 7) % 7]!;
    // Count responses submitted on this day
    const val = db
      .prepare(
        "SELECT COUNT(*) as count FROM form_responses WHERE strftime('%w', submitted_at) = ?",
      )
      .get(String((todayIdx - 6 + i + 7) % 7)) as { count: number } | undefined;
    return {
      day: dayName,
      value: val?.count || 0,
    };
  });

  // Dynamic department breakdown from real forms and responses in DB
  const deptCountsRaw = db
    .prepare(
      `
    SELECT f.department_label, COUNT(r.id) as response_count
    FROM forms f
    LEFT JOIN form_responses r ON f.id = r.form_id
    GROUP BY f.department_label
    ORDER BY response_count DESC
    LIMIT 5
  `,
    )
    .all() as { department_label: string; response_count: number }[];

  const colors = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ];

  const totalDeptResponses = deptCountsRaw.reduce((acc, row) => acc + (row.response_count || 0), 0);

  const departments = deptCountsRaw.map((d, idx) => ({
    name: d.department_label,
    value: totalDeptResponses > 0 ? Math.round((d.response_count / totalDeptResponses) * 100) : 0,
    color: colors[idx % colors.length] || "var(--color-chart-1)",
  }));

  const appointments = dbGetAppointments(10);
  const patients = dbGetPatients(10);
  const activities = dbGetActivities(10);

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
    appointments,
    patients,
    activities,
  };
}

// -----------------------------------------------------------------------------
// USER MANAGEMENT & AUTHENTICATION DB METHODS
// -----------------------------------------------------------------------------

interface UserDbRow {
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

function mapUserRow(row: UserDbRow): UserAccount {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    role: row.role as UserRole,
    name: row.name,
    departmentSlug: row.department_slug,
    departmentLabel: row.department_label,
    status: row.status as "active" | "banned",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function dbGetUsers(): UserAccount[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM users ORDER BY CASE role WHEN 'superadmin' THEN 1 WHEN 'admin' THEN 2 WHEN 'coordinator' THEN 3 ELSE 4 END, username ASC",
    )
    .all() as unknown as UserDbRow[];
  return rows.map(mapUserRow);
}

export function dbGetUserById(id: string): UserAccount | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as unknown as
    UserDbRow | undefined;
  return row ? mapUserRow(row) : null;
}

export function dbGetUserByUsername(username: string): UserAccount | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)")
    .get(username.trim()) as unknown as UserDbRow | undefined;
  return row ? mapUserRow(row) : null;
}

export function dbAuthenticateUser(
  username: string,
  pass: string,
): { success: boolean; user?: UserAccount; error?: string; banned?: boolean } {
  const trimmed = username.trim();
  const user = dbGetUserByUsername(trimmed);

  if (!user) {
    return { success: false, error: "Invalid username or password" };
  }

  // Check ban status
  if (user.status === "banned") {
    return {
      success: false,
      error: "This account has been banned. Please contact Super Administrator Habtamu.",
      banned: true,
      user,
    };
  }

  // Check password
  if (user.password !== pass) {
    return { success: false, error: "Invalid username or password" };
  }

  return { success: true, user };
}

export function dbAddUser(data: {
  username: string;
  password: string;
  role: UserRole;
  name: string;
  departmentSlug?: string | null | undefined;
  departmentLabel?: string | null | undefined;
}): UserAccount {
  const db = getDb();
  const trimmedUser = data.username.trim();

  // Check uniqueness
  const existing = dbGetUserByUsername(trimmedUser);
  if (existing) {
    throw new Error(`Username "${trimmedUser}" is already taken.`);
  }

  const id = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO users (id, username, password, role, name, department_slug, department_label, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
  ).run(
    id,
    trimmedUser,
    data.password,
    data.role,
    data.name.trim(),
    data.departmentSlug ?? null,
    data.departmentLabel ?? null,
    now,
    now,
  );

  return dbGetUserById(id)!;
}

export function dbUpdateUser(
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
): UserAccount {
  const db = getDb();
  const existing = dbGetUserById(id);
  if (!existing) {
    throw new Error("User not found");
  }

  // Root superadmin protection: cannot ban or change role away from superadmin
  if (existing.username === "habtamu") {
    if (updates.status === "banned") {
      throw new Error("Super Administrator account cannot be banned.");
    }
    if (updates.role && updates.role !== "superadmin") {
      throw new Error("Super Administrator role cannot be changed.");
    }
  }

  // Check username uniqueness if changed
  if (
    updates.username &&
    updates.username.trim().toLowerCase() !== existing.username.toLowerCase()
  ) {
    const check = dbGetUserByUsername(updates.username.trim());
    if (check && check.id !== id) {
      throw new Error(`Username "${updates.username}" is already taken.`);
    }
  }

  const newUsername = (updates.username ? updates.username.trim() : existing.username) ?? "";
  const newPassword = (updates.password !== undefined ? updates.password : existing.password) ?? "";
  const newRole = updates.role || existing.role;
  const newName = (updates.name !== undefined ? updates.name.trim() : existing.name) ?? "";
  const newDeptSlug =
    (updates.departmentSlug !== undefined ? updates.departmentSlug : existing.departmentSlug) ??
    null;
  const newDeptLabel =
    (updates.departmentLabel !== undefined ? updates.departmentLabel : existing.departmentLabel) ??
    null;
  const newStatus = updates.status || existing.status;
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE users
     SET username = ?, password = ?, role = ?, name = ?, department_slug = ?, department_label = ?, status = ?, updated_at = ?
     WHERE id = ?`,
  ).run(newUsername, newPassword, newRole, newName, newDeptSlug, newDeptLabel, newStatus, now, id);

  return dbGetUserById(id)!;
}

export function dbDeleteUser(id: string): boolean {
  const db = getDb();
  const existing = dbGetUserById(id);
  if (!existing) return false;

  if (existing.username === "habtamu" || existing.role === "superadmin") {
    throw new Error("Super Administrator account cannot be deleted.");
  }

  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  return true;
}

export function dbBanUser(id: string, ban: boolean): UserAccount {
  return dbUpdateUser(id, { status: ban ? "banned" : "active" });
}
