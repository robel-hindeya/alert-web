import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type {
  CustomForm,
  FormResponse,
} from "../lib/form-types.ts";
import type {
  UserAccount,
  UserRole,
  Patient,
  Appointment,
  ActivityItem,
  ReportItem,
  DashboardStats,
} from "./db.ts";

export interface LocalDbData {
  users: UserAccount[];
  forms: CustomForm[];
  responses: FormResponse[];
  patients: Patient[];
  appointments: Appointment[];
  activities: ActivityItem[];
  reports: ReportItem[];
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.resolve(DATA_DIR, "alert-hospital-db.json");

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

const INITIAL_USERS: UserAccount[] = [
  {
    id: "usr-superadmin-habtamu",
    username: "habtamu",
    email: "habtamu@alert.gov.et",
    password: hashPassword("Habtamu5645"),
    displayPassword: "Habtamu5645",
    role: "superadmin",
    name: "Habtamu (Super Administrator)",
    departmentSlug: null,
    departmentLabel: null,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_FORMS: CustomForm[] = [
  {
    id: "frm-emergency-triage-audit",
    departmentSlug: "emergency-corridor",
    departmentLabel: "Emergency Corridor",
    title: "Emergency Triage & Clinical Assessment Audit",
    description: "Standardized quality audit protocol for emergency intake, patient acuity scoring, and critical intervention timing at ALERT Hospital.",
    bannerUrl: "linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #0d9488 100%)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: "q-patient-name",
        title: "Patient Full Legal Name",
        type: "text",
        required: true,
        options: [],
        placeholder: "e.g. Abebech Tadesse",
      },
      {
        id: "q-mrn",
        title: "Medical Record Number (MRN)",
        type: "text",
        required: true,
        options: [],
        placeholder: "e.g. MRN-EM-2026-8819",
      },
      {
        id: "q-triage-level",
        title: "Emergency Acuity Category (ESI Triage Scale)",
        type: "multiple_choice",
        required: true,
        options: [
          "Red (Resuscitation / Immediate)",
          "Orange (Emergent / Very Urgent)",
          "Yellow (Urgent / Multi-resource)",
          "Green (Less Urgent / Single resource)",
          "Blue (Non-Urgent)",
        ],
      },
      {
        id: "q-vitals-complete",
        title: "Vital Signs Completeness Verification",
        type: "checkboxes",
        required: true,
        options: [
          "Blood Pressure (Systolic & Diastolic Recorded)",
          "Pulse Rate & Rhythm documented",
          "Respiratory Rate & SpO2 documented",
          "Core Body Temperature recorded",
          "Glasgow Coma Scale (GCS) or AVPU verified",
        ],
      },
      {
        id: "q-time-to-doctor",
        title: "Time from Arrival to Physician Evaluation (Minutes)",
        type: "number",
        required: true,
        options: [],
        placeholder: "e.g. 12",
      },
      {
        id: "q-clinical-notes",
        title: "Coordinator Audit Findings & Clinical Observations",
        type: "paragraph",
        required: false,
        options: [],
        placeholder: "Detail any protocol compliance gaps, delays in consultation, or immediate corrective actions taken...",
      },
    ],
  },
  {
    id: "frm-inpatient-ward-audit",
    departmentSlug: "inpatient",
    departmentLabel: "Inpatient",
    title: "Inpatient Ward Daily Clinical Round & Safety Checklist",
    description: "Daily clinical audit for admitted patients: medication reconciliation, IV access surveillance, and chart completeness.",
    bannerUrl: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 60%, #2563eb 100%)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: "q-ward-bed",
        title: "Ward Name & Bed Identifier",
        type: "text",
        required: true,
        options: [],
        placeholder: "e.g. Ward 3B - Bed 14",
      },
      {
        id: "q-med-reconciliation",
        title: "Medication Charting & Administration Compliance",
        type: "multiple_choice",
        required: true,
        options: [
          "Fully Compliant (100% charted and signed)",
          "Minor Gap (Resolved bedside during audit)",
          "Non-Compliant (Escalated to Head Nurse)",
        ],
      },
      {
        id: "q-safety-checks",
        title: "Patient Safety Affirmations",
        type: "checkboxes",
        required: true,
        options: [
          "Patient ID Wristband verified and legible",
          "Fall Risk assessment updated in past 24 hours",
          "IV cannula site inspected and dressed cleanly",
          "Informed consent present for active treatment plan",
        ],
      },
      {
        id: "q-coordinator-rating",
        title: "Overall Department Quality Compliance Score (1-5)",
        type: "rating",
        required: true,
        options: [],
      },
    ],
  },
  {
    id: "frm-surgical-safety-checklist",
    departmentSlug: "surgical-service",
    departmentLabel: "Surgical Service",
    title: "WHO Surgical Safety Checklist Verification",
    description: "Surgical quality audit assessing adherence to Sign-in, Time-out, and Sign-out procedures in operating theatres.",
    bannerUrl: "linear-gradient(135deg, #991b1b 0%, #ef4444 60%, #b91c1c 100%)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: "q-or-number",
        title: "Operating Room (OR Number)",
        type: "dropdown",
        required: true,
        options: ["OR 1 (Main General)", "OR 2 (Orthopedics)", "OR 3 (Trauma)", "OR 4 (Plastic & Reconstructive)", "OR 5 (Obstetric Emergency)"],
      },
      {
        id: "q-who-timeout",
        title: "WHO Time-Out Performed Verbally Before Incision?",
        type: "multiple_choice",
        required: true,
        options: ["Yes — Full Team Participation", "Partial — Completed with Gaps", "No — Checklist Omitted"],
      },
      {
        id: "q-sponge-count",
        title: "Sponge, Needle & Instrument Count Verified Correct",
        type: "checkboxes",
        required: true,
        options: [
          "Initial count recorded prior to surgery",
          "Second count verified during cavity closure",
          "Final count confirmed before wound dressing",
          "Specimen labeling verified by circulator & surgeon",
        ],
      },
    ],
  },
  {
    id: "frm-mch-triage-survey",
    departmentSlug: "mch",
    departmentLabel: "MCH",
    title: "Maternal & Child Health Triage Quality Audit",
    description: "Quality monitoring of maternal admissions, neonatal stabilization, and emergency obstetric care pathways.",
    bannerUrl: "linear-gradient(135deg, #78350f 0%, #f59e0b 60%, #d97706 100%)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: "q-patient-name",
        title: "Mother Full Legal Name",
        type: "text",
        required: true,
        options: [],
        placeholder: "e.g. Almaz Bekele",
      },
      {
        id: "q-admission-status",
        title: "Obstetric Admission Category",
        type: "multiple_choice",
        required: true,
        options: ["Active Labor (Term)", "High-Risk Pregnancy Evaluation", "Postnatal Monitoring", "Emergency Obstetric Complication"],
      },
      {
        id: "q-partograph",
        title: "Partograph Documentation Up to Date",
        type: "multiple_choice",
        required: true,
        options: ["Yes — Active & Plotted", "Not Applicable (Elective C-Section)", "Pending Update"],
      },
    ],
  },
];

const INITIAL_PATIENTS: Patient[] = [
  {
    id: "PAT-001",
    name: "Almaz Bekele",
    mrn: "MRN-2026-0041",
    age: 34,
    gender: "Female",
    phone: "+251 911 234 567",
    departmentSlug: "mch",
    departmentLabel: "MCH",
    registeredAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: "Active",
  },
  {
    id: "PAT-002",
    name: "Dawit Haile",
    mrn: "MRN-2026-0092",
    age: 48,
    gender: "Male",
    phone: "+251 912 345 678",
    departmentSlug: "emergency-corridor",
    departmentLabel: "Emergency Corridor",
    registeredAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    status: "Active",
  },
  {
    id: "PAT-003",
    name: "Fatima Mohammed",
    mrn: "MRN-2026-0115",
    age: 27,
    gender: "Female",
    phone: "+251 913 456 789",
    departmentSlug: "surgical-service",
    departmentLabel: "Surgical Service",
    registeredAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    status: "Admitted",
  },
  {
    id: "PAT-004",
    name: "Kassahun Tilahun",
    mrn: "MRN-2026-0204",
    age: 62,
    gender: "Male",
    phone: "+251 914 567 890",
    departmentSlug: "inpatient",
    departmentLabel: "Inpatient",
    registeredAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: "Active",
  },
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "APT-101",
    patientName: "Dawit Haile",
    patientId: "PAT-002",
    doctorName: "Dr. Alemu Tesfaye",
    departmentSlug: "emergency-corridor",
    departmentLabel: "Emergency Corridor",
    time: "09:30 AM",
    date: "Today",
    status: "Completed",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "APT-102",
    patientName: "Fatima Mohammed",
    patientId: "PAT-003",
    doctorName: "Dr. Selamawit Desta",
    departmentSlug: "surgical-service",
    departmentLabel: "Surgical Service",
    time: "11:00 AM",
    date: "Today",
    status: "In Progress",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "APT-103",
    patientName: "Almaz Bekele",
    patientId: "PAT-001",
    doctorName: "Dr. Roman Sisay",
    departmentSlug: "mch",
    departmentLabel: "MCH",
    time: "02:00 PM",
    date: "Today",
    status: "Confirmed",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: "ACT-001",
    type: "form_submitted",
    title: "Clinical audit response submitted",
    meta: "Emergency Triage & Clinical Assessment Audit (Emergency Corridor)",
    time: "08:45 AM",
  },
  {
    id: "ACT-002",
    type: "appointment_booked",
    title: "New appointment booked",
    meta: "Almaz Bekele with Dr. Roman Sisay (02:00 PM)",
    time: "09:15 AM",
  },
  {
    id: "ACT-003",
    type: "appointment_status",
    title: "Appointment status updated to Completed",
    meta: "Dawit Haile (Dr. Alemu Tesfaye)",
    time: "10:30 AM",
  },
];

const INITIAL_REPORTS: ReportItem[] = [
  {
    id: "REP-001",
    title: "Emergency Corridor Clinical Triage Weekly Audit",
    category: "Audit",
    department: "Emergency Corridor",
    departmentSlug: "emergency-corridor",
    author: "Dr. Alem Tesfaye",
    date: "Oct 6, 2026",
    score: "96.4%",
    status: "Completed",
    summary: "Comprehensive triage protocol compliance verified across 142 emergency intakes.",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "REP-002",
    title: "WHO Surgical Safety Sign-In Audit Review",
    category: "Checklist",
    department: "Surgical Service",
    departmentSlug: "surgical-service",
    author: "Dr. Selamawit Desta",
    date: "Oct 7, 2026",
    score: "98.2%",
    status: "Reviewed",
    summary: "Operating theatre checklist compliance monitored across 38 surgical interventions.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

let inMemoryData: LocalDbData | null = null;

export function loadLocalData(): LocalDbData {
  if (inMemoryData) {
    return inMemoryData;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Partial<LocalDbData>;
      inMemoryData = {
        users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : INITIAL_USERS,
        forms: Array.isArray(parsed.forms) && parsed.forms.length > 0 ? parsed.forms : INITIAL_FORMS,
        responses: Array.isArray(parsed.responses) ? parsed.responses : [],
        patients: Array.isArray(parsed.patients) && parsed.patients.length > 0 ? parsed.patients : INITIAL_PATIENTS,
        appointments: Array.isArray(parsed.appointments) && parsed.appointments.length > 0 ? parsed.appointments : INITIAL_APPOINTMENTS,
        activities: Array.isArray(parsed.activities) && parsed.activities.length > 0 ? parsed.activities : INITIAL_ACTIVITIES,
        reports: Array.isArray(parsed.reports) && parsed.reports.length > 0 ? parsed.reports : INITIAL_REPORTS,
      };
      return inMemoryData;
    }
  } catch (err) {
    console.warn("Could not read local DB file, initializing defaults:", err);
  }

  inMemoryData = {
    users: INITIAL_USERS,
    forms: INITIAL_FORMS,
    responses: [],
    patients: INITIAL_PATIENTS,
    appointments: INITIAL_APPOINTMENTS,
    activities: INITIAL_ACTIVITIES,
    reports: INITIAL_REPORTS,
  };

  saveLocalData(inMemoryData);
  return inMemoryData;
}

export function saveLocalData(data: LocalDbData): void {
  inMemoryData = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error("Failed to write local database file:", err);
  }
}

// -----------------------------------------------------------------------------
// LOCAL FORMS OPERATIONS
// -----------------------------------------------------------------------------
export function localGetAllForms(departmentSlug?: string): CustomForm[] {
  const db = loadLocalData();
  let list = db.forms;
  if (departmentSlug) {
    list = list.filter((f) => f.departmentSlug === departmentSlug);
  }
  return list;
}

export function localGetFormById(id: string): CustomForm | null {
  const db = loadLocalData();
  return db.forms.find((f) => f.id === id) || null;
}

export function localUpsertForm(form: CustomForm): CustomForm {
  const db = loadLocalData();
  const idx = db.forms.findIndex((f) => f.id === form.id);
  const now = new Date().toISOString();
  const updatedForm = {
    ...form,
    createdAt: form.createdAt || now,
    updatedAt: now,
  };

  if (idx >= 0) {
    db.forms[idx] = updatedForm;
  } else {
    db.forms.unshift(updatedForm);
  }

  saveLocalData(db);
  return updatedForm;
}

export function localDeleteForm(id: string): boolean {
  const db = loadLocalData();
  db.forms = db.forms.filter((f) => f.id !== id);
  db.responses = db.responses.filter((r) => r.formId !== id);
  saveLocalData(db);
  return true;
}

// -----------------------------------------------------------------------------
// LOCAL RESPONSES OPERATIONS
// -----------------------------------------------------------------------------
export function localSaveResponse(response: FormResponse): FormResponse {
  const db = loadLocalData();
  db.responses.unshift(response);
  saveLocalData(db);
  return response;
}

export function localGetResponses(formId: string): FormResponse[] {
  const db = loadLocalData();
  return db.responses.filter((r) => r.formId === formId);
}

export function localGetAllResponses(limit = 100): (FormResponse & {
  formTitle?: string;
  departmentLabel?: string;
  departmentSlug?: string;
})[] {
  const db = loadLocalData();
  return db.responses.slice(0, limit).map((r) => {
    const form = db.forms.find((f) => f.id === r.formId);
    return {
      ...r,
      formTitle: form?.title || "Department Form",
      departmentLabel: form?.departmentLabel || "ALERT Hospital",
      departmentSlug: form?.departmentSlug || "",
    };
  });
}

// -----------------------------------------------------------------------------
// LOCAL USERS OPERATIONS
// -----------------------------------------------------------------------------
export function localGetUsers(): UserAccount[] {
  const db = loadLocalData();
  return db.users;
}

export function localGetUserById(id: string): UserAccount | null {
  const db = loadLocalData();
  return db.users.find((u) => u.id === id) || null;
}

export function localGetUserByUsernameOrEmail(identifier: string): UserAccount | null {
  const db = loadLocalData();
  const trimmed = identifier.trim().toLowerCase();

  const found = db.users.find((u) => {
    const matchUsername = u.username.toLowerCase() === trimmed;
    const matchEmail = u.email ? u.email.toLowerCase() === trimmed : false;
    return matchUsername || matchEmail;
  });

  if (found) return found;

  // Built-in system portals fallback accounts:
  if (trimmed === "admin" || trimmed === "admin@alert.gov.et") {
    return {
      id: "usr-admin-hospital",
      username: "admin",
      email: "admin@alert.gov.et",
      password: "Admin123",
      displayPassword: "Admin123",
      role: "admin",
      name: "Hospital Administrator",
      departmentSlug: "emergency-corridor",
      departmentLabel: "Emergency Corridor",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  if (
    trimmed === "qmtofficer" ||
    trimmed === "qmt" ||
    trimmed === "qmt officer" ||
    trimmed === "coordinator" ||
    trimmed === "cordineter" ||
    trimmed === "qmtofficer@alert.gov.et" ||
    trimmed === "qmt@alert.gov.et" ||
    trimmed === "coordinator@alert.gov.et"
  ) {
    return {
      id: "usr-qmt-officer",
      username: "qmtofficer",
      email: "qmtofficer@alert.gov.et",
      password: "Coordinator123",
      displayPassword: "Coordinator123",
      role: "qmt",
      name: "Dr. Roman Sisay (QMT Officer)",
      departmentSlug: "emergency-corridor",
      departmentLabel: "Emergency Corridor",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  if (
    trimmed === "habtamu" ||
    trimmed === "superadmin" ||
    trimmed === "habtamu@alert.gov.et" ||
    trimmed === "superadmin@alert.gov.et"
  ) {
    return {
      id: "usr-superadmin-habtamu",
      username: "habtamu",
      email: "habtamu@alert.gov.et",
      password: "Habtamu5645",
      displayPassword: "Habtamu5645",
      role: "superadmin",
      name: "Habtamu (Super Administrator)",
      departmentSlug: null,
      departmentLabel: null,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return null;
}

export function localUpsertUser(user: UserAccount): UserAccount {
  const db = loadLocalData();
  const idx = db.users.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    db.users[idx] = user;
  } else {
    db.users.push(user);
  }
  saveLocalData(db);
  return user;
}

export function localDeleteUser(id: string): boolean {
  const db = loadLocalData();
  db.users = db.users.filter((u) => u.id !== id);
  saveLocalData(db);
  return true;
}

// -----------------------------------------------------------------------------
// LOCAL PATIENTS, APPOINTMENTS, REPORTS, STATS
// -----------------------------------------------------------------------------
export function localGetPatients(limit = 100): Patient[] {
  const db = loadLocalData();
  return db.patients.slice(0, limit);
}

export function localAddPatient(patient: Patient): Patient {
  const db = loadLocalData();
  db.patients.unshift(patient);
  saveLocalData(db);
  return patient;
}

export function localDeletePatient(id: string): boolean {
  const db = loadLocalData();
  db.patients = db.patients.filter((p) => p.id !== id);
  saveLocalData(db);
  return true;
}

export function localGetAppointments(limit = 100, departmentSlug?: string): Appointment[] {
  const db = loadLocalData();
  let list = db.appointments;
  if (departmentSlug) {
    list = list.filter((a) => a.departmentSlug === departmentSlug);
  }
  return list.slice(0, limit);
}

export function localAddAppointment(apt: Appointment): Appointment {
  const db = loadLocalData();
  db.appointments.unshift(apt);
  saveLocalData(db);
  return apt;
}

export function localUpdateAppointmentStatus(id: string, status: "Completed" | "In Progress" | "Pending" | "Confirmed"): Appointment | null {
  const db = loadLocalData();
  const item = db.appointments.find((a) => a.id === id);
  if (!item) return null;
  item.status = status;
  saveLocalData(db);
  return item;
}

export function localDeleteAppointment(id: string): boolean {
  const db = loadLocalData();
  db.appointments = db.appointments.filter((a) => a.id !== id);
  saveLocalData(db);
  return true;
}

export function localGetActivities(limit = 20): ActivityItem[] {
  const db = loadLocalData();
  return db.activities.slice(0, limit);
}

export function localAddActivity(type: string, title: string, meta: string): ActivityItem {
  const db = loadLocalData();
  const now = new Date();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  const time = `${formattedHours}:${minutes} ${ampm}`;

  const item: ActivityItem = {
    id: `ACT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
    type,
    title,
    meta,
    time,
  };
  db.activities.unshift(item);
  if (db.activities.length > 50) db.activities.pop();
  saveLocalData(db);
  return item;
}

export function localGetReports(limit = 100): ReportItem[] {
  const db = loadLocalData();
  return db.reports.slice(0, limit);
}

export function localAddReport(report: ReportItem): ReportItem {
  const db = loadLocalData();
  db.reports.unshift(report);
  saveLocalData(db);
  return report;
}

export function localDeleteReport(id: string): boolean {
  const db = loadLocalData();
  db.reports = db.reports.filter((r) => r.id !== id);
  saveLocalData(db);
  return true;
}

export function localGetDashboardStats(): DashboardStats {
  const db = loadLocalData();
  const totalPatients = db.patients.length + db.responses.length;
  const todayAppointments = db.appointments.filter((a) => a.date === "Today").length;
  const totalForms = db.forms.length;
  const totalResponses = db.responses.length;

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const visits = daysOfWeek.map((dayName) => ({
    day: dayName,
    value: Math.floor(totalResponses / 7) + 2,
  }));

  const colors = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ];

  const deptCounts: Record<string, number> = {};
  for (const f of db.forms) {
    deptCounts[f.departmentLabel] = (deptCounts[f.departmentLabel] || 0) + 1;
  }

  const departments = Object.entries(deptCounts).slice(0, 5).map(([name, count], idx) => ({
    name,
    value: Math.round((count / (db.forms.length || 1)) * 100),
    color: colors[idx % colors.length] || "var(--color-chart-1)",
  }));

  return {
    totalPatients,
    totalPatientsDelta: totalPatients > 0 ? "+100%" : "0%",
    todayAppointments,
    todayAppointmentsDelta: todayAppointments > 0 ? `+${todayAppointments}` : "0",
    totalDoctors: 42,
    availableBeds: 654,
    totalForms,
    totalResponses,
    visits,
    departments,
    appointments: db.appointments.slice(0, 10),
    patients: db.patients.slice(0, 10),
    activities: db.activities.slice(0, 10),
  };
}
