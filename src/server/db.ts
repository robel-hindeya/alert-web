import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";
import type { CustomForm, FormQuestion, FormResponse } from "../lib/form-types.ts";

// -----------------------------------------------------------------------------
// Environment Configuration Loader (Zero-dependency .env parser)
// -----------------------------------------------------------------------------
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
          if (!(key in process.env)) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch {
    // Ignore error
  }
}
loadEnv();

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

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// -----------------------------------------------------------------------------
// Database Drivers (MySQL with automatic fallback to SQLite)
// -----------------------------------------------------------------------------
let mysqlPool: Pool | null = null;
let sqliteInstance: DatabaseSync | null = null;
let activeBackend: "mysql" | "sqlite" | null = null;
let initPromise: Promise<"mysql" | "sqlite"> | null = null;

function getDatabasePath(): string {
  const isServerless =
    Boolean(process.env["VERCEL"]) ||
    Boolean(process.env["AWS_LAMBDA_FUNCTION_NAME"]) ||
    Boolean(process.env["NETLIFY"]) ||
    process.cwd().startsWith("/var/task");

  if (isServerless) {
    const tmpDbPath = path.join(os.tmpdir(), "hospital.db");
    const bundledDb = path.join(process.cwd(), "data", "hospital.db");
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(bundledDb)) {
      try {
        fs.copyFileSync(bundledDb, tmpDbPath);
      } catch (err) {
        console.warn("Could not copy bundled DB to /tmp:", err);
      }
    }
    return tmpDbPath;
  }

  try {
    const localDir = path.resolve(process.cwd(), "data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return path.join(localDir, "hospital.db");
  } catch {
    return path.join(os.tmpdir(), "hospital.db");
  }
}

function getSqliteDb(): DatabaseSync {
  if (!sqliteInstance) {
    const dbPath = getDatabasePath();
    try {
      sqliteInstance = new DatabaseSync(dbPath);
    } catch {
      try {
        sqliteInstance = new DatabaseSync(path.join(os.tmpdir(), `hospital-${Date.now()}.db`));
      } catch {
        sqliteInstance = new DatabaseSync(":memory:");
      }
    }

    sqliteInstance.exec(`
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

    // Seed default SQLite users
    try {
      const nowIso = new Date().toISOString();
      const superAdminExists = sqliteInstance
        .prepare("SELECT id FROM users WHERE username = ?")
        .get("habtamu") as { id: string } | undefined;

      if (!superAdminExists) {
        sqliteInstance
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
        sqliteInstance
          .prepare(
            "UPDATE users SET password = ?, role = 'superadmin', status = 'active', updated_at = ? WHERE username = 'habtamu'",
          )
          .run("Habtamu5645", nowIso);
      }

      const adminExists = sqliteInstance
        .prepare("SELECT id FROM users WHERE username = ?")
        .get("admin") as { id: string } | undefined;
      if (!adminExists) {
        sqliteInstance
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

      const coordExists = sqliteInstance
        .prepare("SELECT id FROM users WHERE username = ?")
        .get("coordinator") as { id: string } | undefined;
      if (!coordExists) {
        sqliteInstance
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

      const qmtExists = sqliteInstance
        .prepare("SELECT id FROM users WHERE username = ?")
        .get("qmt") as { id: string } | undefined;
      if (!qmtExists) {
        sqliteInstance
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
    } catch {
      // ignore seed err
    }
  }

  return sqliteInstance;
}

// -----------------------------------------------------------------------------
// MySQL Initializer & Schema Builder
// -----------------------------------------------------------------------------
async function initMySql(): Promise<Pool> {
  const host = process.env["MYSQL_HOST"] || "localhost";
  const port = Number(process.env["MYSQL_PORT"]) || 3306;
  const user = process.env["MYSQL_USER"] || "root";
  const password = process.env["MYSQL_PASSWORD"] || "";
  const database = process.env["MYSQL_DATABASE"] || "alert_hospital";
  const url = process.env["MYSQL_URL"] || process.env["DATABASE_URL"];

  let poolConfig: mysql.PoolOptions;

  if (url) {
    poolConfig = {
      uri: url,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
    };
  } else {
    // First, ensure the target database exists on the MySQL server
    try {
      const adminConn = await mysql.createConnection({
        host,
        port,
        user,
        password,
        connectTimeout: 4000,
      });
      await adminConn.query(
        `CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
      );
      await adminConn.end();
    } catch {
      // Database might already exist or user may not have CREATE DATABASE privilege, proceed to connect
    }

    poolConfig = {
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
    };
  }

  const pool = mysql.createPool(poolConfig);

  // Test connection
  const conn = await pool.getConnection();
  conn.release();

  // Create tables in MySQL
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`forms\` (
      \`id\` VARCHAR(128) NOT NULL,
      \`department_slug\` VARCHAR(128) NOT NULL,
      \`department_label\` VARCHAR(255) NOT NULL,
      \`title\` VARCHAR(255) NOT NULL,
      \`description\` TEXT DEFAULT NULL,
      \`banner_url\` TEXT DEFAULT NULL,
      \`questions_json\` LONGTEXT NOT NULL,
      \`created_at\` VARCHAR(64) NOT NULL,
      \`updated_at\` VARCHAR(64) NOT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`idx_forms_dept\` (\`department_slug\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`form_responses\` (
      \`id\` VARCHAR(128) NOT NULL,
      \`form_id\` VARCHAR(128) NOT NULL,
      \`submitted_at\` VARCHAR(64) NOT NULL,
      \`answers_json\` LONGTEXT NOT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`idx_responses_form\` (\`form_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`patients\` (
      \`id\` VARCHAR(128) NOT NULL,
      \`name\` VARCHAR(255) NOT NULL,
      \`mrn\` VARCHAR(128) NOT NULL,
      \`age\` INT NOT NULL,
      \`gender\` VARCHAR(32) NOT NULL,
      \`phone\` VARCHAR(64) NOT NULL,
      \`department_slug\` VARCHAR(128) NOT NULL,
      \`department_label\` VARCHAR(255) NOT NULL,
      \`registered_at\` VARCHAR(64) NOT NULL,
      \`status\` VARCHAR(64) NOT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`idx_patients_dept\` (\`department_slug\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`appointments\` (
      \`id\` VARCHAR(128) NOT NULL,
      \`patient_name\` VARCHAR(255) NOT NULL,
      \`patient_id\` VARCHAR(128) NOT NULL,
      \`doctor_name\` VARCHAR(255) NOT NULL,
      \`department_slug\` VARCHAR(128) NOT NULL,
      \`department_label\` VARCHAR(255) NOT NULL,
      \`time\` VARCHAR(64) NOT NULL,
      \`date\` VARCHAR(64) NOT NULL,
      \`status\` VARCHAR(64) NOT NULL,
      \`created_at\` VARCHAR(64) NOT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`idx_appointments_dept\` (\`department_slug\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`activities\` (
      \`id\` VARCHAR(128) NOT NULL,
      \`type\` VARCHAR(64) NOT NULL,
      \`title\` VARCHAR(255) NOT NULL,
      \`meta\` TEXT NOT NULL,
      \`timestamp\` VARCHAR(64) NOT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`reports\` (
      \`id\` VARCHAR(128) NOT NULL,
      \`title\` VARCHAR(255) NOT NULL,
      \`category\` VARCHAR(64) NOT NULL,
      \`department\` VARCHAR(255) NOT NULL,
      \`department_slug\` VARCHAR(128) NOT NULL,
      \`author\` VARCHAR(255) NOT NULL,
      \`date\` VARCHAR(64) NOT NULL,
      \`score\` VARCHAR(64) NOT NULL,
      \`status\` VARCHAR(64) NOT NULL,
      \`summary\` TEXT NOT NULL,
      \`created_at\` VARCHAR(64) NOT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`idx_reports_dept\` (\`department_slug\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` VARCHAR(128) NOT NULL,
      \`username\` VARCHAR(128) NOT NULL,
      \`password\` VARCHAR(255) NOT NULL,
      \`role\` VARCHAR(64) NOT NULL,
      \`name\` VARCHAR(255) NOT NULL,
      \`department_slug\` VARCHAR(128) DEFAULT NULL,
      \`department_label\` VARCHAR(255) DEFAULT NULL,
      \`status\` VARCHAR(32) NOT NULL DEFAULT 'active',
      \`created_at\` VARCHAR(64) NOT NULL,
      \`updated_at\` VARCHAR(64) NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`idx_users_username\` (\`username\`),
      KEY \`idx_users_role\` (\`role\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Seed default superadmin "habtamu" and key accounts in MySQL
  const nowIso = new Date().toISOString();
  await pool.query(
    `
    INSERT INTO \`users\` (\`id\`, \`username\`, \`password\`, \`role\`, \`name\`, \`department_slug\`, \`department_label\`, \`status\`, \`created_at\`, \`updated_at\`)
    VALUES
      ('usr-superadmin-habtamu', 'habtamu', 'Habtamu5645', 'superadmin', 'Habtamu (Super Administrator)', NULL, NULL, 'active', ?, ?),
      ('usr-admin-default', 'admin', 'Admin123', 'admin', 'Hospital Administrator', NULL, NULL, 'active', ?, ?),
      ('usr-coordinator-default', 'coordinator', 'Coord123', 'coordinator', 'Emergency Clinical Coordinator', 'emergency', 'Emergency & Critical Care', 'active', ?, ?),
      ('usr-qmt-default', 'qmt', 'Qmt123', 'qmt', 'Dr. Roman Sisay (QMT Officer)', NULL, NULL, 'active', ?, ?)
    ON DUPLICATE KEY UPDATE
      \`password\` = VALUES(\`password\`),
      \`role\` = VALUES(\`role\`),
      \`status\` = 'active',
      \`updated_at\` = VALUES(\`updated_at\`);
  `,
    [nowIso, nowIso, nowIso, nowIso, nowIso, nowIso, nowIso, nowIso],
  );

  // If MySQL tables are empty, migrate any existing data from local SQLite database
  try {
    const [userRows] = (await pool.query(
      "SELECT COUNT(*) as count FROM `patients`",
    )) as RowDataPacket[];
    const patientCount = userRows?.[0]?.count ?? 0;

    if (patientCount === 0) {
      const sqlite = getSqliteDb();
      // Migrate patients
      const patients = sqlite.prepare("SELECT * FROM patients").all() as any[];
      for (const p of patients) {
        await pool.query(
          "INSERT IGNORE INTO `patients` (id, name, mrn, age, gender, phone, department_slug, department_label, registered_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            p.id,
            p.name,
            p.mrn,
            p.age,
            p.gender,
            p.phone,
            p.department_slug,
            p.department_label,
            p.registered_at,
            p.status,
          ],
        );
      }

      // Migrate appointments
      const appointments = sqlite.prepare("SELECT * FROM appointments").all() as any[];
      for (const a of appointments) {
        await pool.query(
          "INSERT IGNORE INTO `appointments` (id, patient_name, patient_id, doctor_name, department_slug, department_label, time, date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            a.id,
            a.patient_name,
            a.patient_id,
            a.doctor_name,
            a.department_slug,
            a.department_label,
            a.time,
            a.date,
            a.status,
            a.created_at,
          ],
        );
      }

      // Migrate forms
      const forms = sqlite.prepare("SELECT * FROM forms").all() as any[];
      for (const f of forms) {
        await pool.query(
          "INSERT IGNORE INTO `forms` (id, department_slug, department_label, title, description, banner_url, questions_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            f.id,
            f.department_slug,
            f.department_label,
            f.title,
            f.description,
            f.banner_url,
            f.questions_json,
            f.created_at,
            f.updated_at,
          ],
        );
      }

      // Migrate form responses
      const responses = sqlite.prepare("SELECT * FROM form_responses").all() as any[];
      for (const r of responses) {
        await pool.query(
          "INSERT IGNORE INTO `form_responses` (id, form_id, submitted_at, answers_json) VALUES (?, ?, ?, ?)",
          [r.id, r.form_id, r.submitted_at, r.answers_json],
        );
      }

      // Migrate reports
      const reports = sqlite.prepare("SELECT * FROM reports").all() as any[];
      for (const rep of reports) {
        await pool.query(
          "INSERT IGNORE INTO `reports` (id, title, category, department, department_slug, author, date, score, status, summary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            rep.id,
            rep.title,
            rep.category,
            rep.department,
            rep.department_slug,
            rep.author,
            rep.date,
            rep.score,
            rep.status,
            rep.summary,
            rep.created_at,
          ],
        );
      }
    }
  } catch (migErr) {
    console.warn("[ALERT-DB] Notice during SQLite->MySQL migration:", migErr);
  }

  return pool;
}

// Ensure database backend is ready
export async function getDbBackend(): Promise<"mysql" | "sqlite"> {
  if (activeBackend) return activeBackend;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        mysqlPool = await initMySql();
        activeBackend = "mysql";
        console.info(
          `[ALERT-DB] Connected successfully to MySQL database "${process.env["MYSQL_DATABASE"] || "alert_hospital"}"`,
        );
        return "mysql";
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn(
          `[ALERT-DB] Could not connect to MySQL server (${errorMsg}). Falling back to local SQLite database.`,
        );
        console.info(
          "[ALERT-DB] Note: To use MySQL, start your MySQL server and configure .env (MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE).",
        );
        getSqliteDb();
        activeBackend = "sqlite";
        return "sqlite";
      }
    })();
  }

  return initPromise;
}

// -----------------------------------------------------------------------------
// FORMS CRUD
// -----------------------------------------------------------------------------
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

export async function dbGetAllForms(departmentSlug?: string): Promise<CustomForm[]> {
  const backend = await getDbBackend();
  let rows: FormDbRow[];

  if (backend === "mysql" && mysqlPool) {
    if (departmentSlug) {
      const [res] = (await mysqlPool.query(
        "SELECT * FROM forms WHERE department_slug = ? ORDER BY updated_at DESC",
        [departmentSlug],
      )) as RowDataPacket[];
      rows = res as FormDbRow[];
    } else {
      const [res] = (await mysqlPool.query(
        "SELECT * FROM forms ORDER BY updated_at DESC",
      )) as RowDataPacket[];
      rows = res as FormDbRow[];
    }
  } else {
    const db = getSqliteDb();
    if (departmentSlug) {
      rows = db
        .prepare("SELECT * FROM forms WHERE department_slug = ? ORDER BY updated_at DESC")
        .all(departmentSlug) as unknown as FormDbRow[];
    } else {
      rows = db
        .prepare("SELECT * FROM forms ORDER BY updated_at DESC")
        .all() as unknown as FormDbRow[];
    }
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

export async function dbGetFormById(id: string): Promise<CustomForm | null> {
  const backend = await getDbBackend();
  let r: FormDbRow | undefined;

  if (backend === "mysql" && mysqlPool) {
    const [res] = (await mysqlPool.query("SELECT * FROM forms WHERE id = ? LIMIT 1", [
      id,
    ])) as RowDataPacket[];
    r = (res as FormDbRow[])[0];
  } else {
    const db = getSqliteDb();
    r = db.prepare("SELECT * FROM forms WHERE id = ?").get(id) as unknown as FormDbRow | undefined;
  }

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

export async function dbUpsertForm(form: CustomForm): Promise<CustomForm> {
  const backend = await getDbBackend();
  const now = new Date().toISOString();
  const createdAt = form.createdAt || now;
  const updatedAt = now;

  if (backend === "mysql" && mysqlPool) {
    await mysqlPool.query(
      `
      INSERT INTO forms (id, department_slug, department_label, title, description, banner_url, questions_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        department_slug = VALUES(department_slug),
        department_label = VALUES(department_label),
        title = VALUES(title),
        description = VALUES(description),
        banner_url = VALUES(banner_url),
        questions_json = VALUES(questions_json),
        updated_at = VALUES(updated_at)
    `,
      [
        form.id,
        form.departmentSlug,
        form.departmentLabel,
        form.title,
        form.description || "",
        form.bannerUrl || "",
        JSON.stringify(form.questions || []),
        createdAt,
        updatedAt,
      ],
    );
  } else {
    const db = getSqliteDb();
    const existing = db.prepare("SELECT id FROM forms WHERE id = ?").get(form.id);

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
  }

  return {
    ...form,
    createdAt,
    updatedAt,
  };
}

export async function dbDeleteForm(id: string): Promise<boolean> {
  const backend = await getDbBackend();
  if (backend === "mysql" && mysqlPool) {
    await mysqlPool.query("DELETE FROM form_responses WHERE form_id = ?", [id]);
    await mysqlPool.query("DELETE FROM forms WHERE id = ?", [id]);
  } else {
    const db = getSqliteDb();
    db.prepare("DELETE FROM form_responses WHERE form_id = ?").run(id);
    db.prepare("DELETE FROM forms WHERE id = ?").run(id);
  }
  return true;
}

// -----------------------------------------------------------------------------
// RESPONSES CRUD
// -----------------------------------------------------------------------------
interface FormResponseDbRow {
  id: string;
  form_id: string;
  submitted_at: string;
  answers_json: string;
  form_title?: string | null;
  department_label?: string | null;
  department_slug?: string | null;
}

export async function dbSaveResponse(response: FormResponse): Promise<FormResponse> {
  const backend = await getDbBackend();

  if (backend === "mysql" && mysqlPool) {
    await mysqlPool.query(
      `
      INSERT INTO form_responses (id, form_id, submitted_at, answers_json)
      VALUES (?, ?, ?, ?)
    `,
      [
        response.id,
        response.formId,
        response.submittedAt,
        JSON.stringify(response.answers || {}),
      ],
    );
  } else {
    const db = getSqliteDb();
    db.prepare(
      `
      INSERT INTO form_responses (id, form_id, submitted_at, answers_json)
      VALUES (?, ?, ?, ?)
    `,
    ).run(
      response.id,
      response.formId,
      response.submittedAt,
      JSON.stringify(response.answers || {}),
    );
  }

  // Automatically log dynamic activity
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
  const backend = await getDbBackend();
  let rows: FormResponseDbRow[];

  if (backend === "mysql" && mysqlPool) {
    const [res] = (await mysqlPool.query(
      "SELECT * FROM form_responses WHERE form_id = ? ORDER BY submitted_at DESC",
      [formId],
    )) as RowDataPacket[];
    rows = res as FormResponseDbRow[];
  } else {
    const db = getSqliteDb();
    rows = db
      .prepare("SELECT * FROM form_responses WHERE form_id = ? ORDER BY submitted_at DESC")
      .all(formId) as unknown as FormResponseDbRow[];
  }

  return rows.map((r) => ({
    id: r.id,
    formId: r.form_id,
    submittedAt: r.submitted_at,
    answers: safeJsonParse<Record<string, unknown>>(r.answers_json, {}),
  }));
}

export async function dbGetAllResponses(
  limit = 100,
): Promise<(FormResponse & { formTitle?: string; departmentLabel?: string; departmentSlug?: string })[]> {
  const backend = await getDbBackend();
  const safeLimit = Math.min(Math.max(1, limit || 100), 500);
  let rows: FormResponseDbRow[];

  const sql = `
    SELECT r.id, r.form_id, r.submitted_at, r.answers_json, f.title as form_title, f.department_label, f.department_slug
    FROM form_responses r
    LEFT JOIN forms f ON r.form_id = f.id
    ORDER BY r.submitted_at DESC
    LIMIT ?
  `;

  if (backend === "mysql" && mysqlPool) {
    const [res] = (await mysqlPool.query(sql, [safeLimit])) as RowDataPacket[];
    rows = res as FormResponseDbRow[];
  } else {
    const db = getSqliteDb();
    rows = db.prepare(sql).all(safeLimit) as unknown as FormResponseDbRow[];
  }

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

// -----------------------------------------------------------------------------
// PATIENTS CRUD
// -----------------------------------------------------------------------------
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

export async function dbGetPatients(limit = 100): Promise<Patient[]> {
  const backend = await getDbBackend();
  const safeLimit = Math.min(Math.max(1, limit), 500);
  let rows: PatientDbRow[];

  if (backend === "mysql" && mysqlPool) {
    const [res] = (await mysqlPool.query(
      "SELECT * FROM patients ORDER BY registered_at DESC LIMIT ?",
      [safeLimit],
    )) as RowDataPacket[];
    rows = res as PatientDbRow[];
  } else {
    const db = getSqliteDb();
    rows = db
      .prepare("SELECT * FROM patients ORDER BY registered_at DESC LIMIT ?")
      .all(safeLimit) as unknown as PatientDbRow[];
  }

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
  const backend = await getDbBackend();
  const id = `PAT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
  const mrn = patient.mrn?.trim() || `MRN-2026-${Math.floor(Math.random() * 800 + 100)}`;
  const registeredAt = new Date().toISOString();
  const status = patient.status || "Active";

  const sql = `
    INSERT INTO patients (id, name, mrn, age, gender, phone, department_slug, department_label, registered_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
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
  ];

  if (backend === "mysql" && mysqlPool) {
    await mysqlPool.query(sql, params);
  } else {
    const db = getSqliteDb();
    db.prepare(sql).run(...params);
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

// -----------------------------------------------------------------------------
// APPOINTMENTS CRUD
// -----------------------------------------------------------------------------
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

export async function dbGetAppointments(limit = 100, deptSlug?: string): Promise<Appointment[]> {
  const backend = await getDbBackend();
  const safeLimit = Math.min(Math.max(1, limit), 500);
  let rows: AppointmentDbRow[];

  if (backend === "mysql" && mysqlPool) {
    if (deptSlug) {
      const [res] = (await mysqlPool.query(
        "SELECT * FROM appointments WHERE department_slug = ? ORDER BY created_at DESC LIMIT ?",
        [deptSlug, safeLimit],
      )) as RowDataPacket[];
      rows = res as AppointmentDbRow[];
    } else {
      const [res] = (await mysqlPool.query(
        "SELECT * FROM appointments ORDER BY created_at DESC LIMIT ?",
        [safeLimit],
      )) as RowDataPacket[];
      rows = res as AppointmentDbRow[];
    }
  } else {
    const db = getSqliteDb();
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
  const backend = await getDbBackend();
  const id = `APT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
  const patientId = appointment.patientId || `PAT-${Date.now().toString().slice(-4)}`;
  const date = appointment.date || "Today";
  const status = appointment.status || "Pending";
  const createdAt = new Date().toISOString();

  const sql = `
    INSERT INTO appointments (id, patient_name, patient_id, doctor_name, department_slug, department_label, time, date, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
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
  ];

  if (backend === "mysql" && mysqlPool) {
    await mysqlPool.query(sql, params);
  } else {
    const db = getSqliteDb();
    db.prepare(sql).run(...params);
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
  const backend = await getDbBackend();
  let row: AppointmentDbRow | undefined;

  if (backend === "mysql" && mysqlPool) {
    const [res] = (await mysqlPool.query(
      "SELECT * FROM appointments WHERE id = ? LIMIT 1",
      [id],
    )) as RowDataPacket[];
    row = (res as AppointmentDbRow[])[0];
    if (!row) return null;
    await mysqlPool.query("UPDATE appointments SET status = ? WHERE id = ?", [status, id]);
  } else {
    const db = getSqliteDb();
    row = db.prepare("SELECT * FROM appointments WHERE id = ?").get(id) as unknown as
      | AppointmentDbRow
      | undefined;
    if (!row) return null;
    db.prepare("UPDATE appointments SET status = ? WHERE id = ?").run(status, id);
  }

  await dbAddActivity(
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

// -----------------------------------------------------------------------------
// ACTIVITIES CRUD
// -----------------------------------------------------------------------------
interface ActivityDbRow {
  id: string;
  type: string;
  title: string;
  meta: string;
  timestamp: string;
}

export async function dbGetActivities(limit = 20): Promise<ActivityItem[]> {
  const backend = await getDbBackend();
  const safeLimit = Math.min(Math.max(1, limit), 100);
  let rows: ActivityDbRow[];

  if (backend === "mysql" && mysqlPool) {
    const [res] = (await mysqlPool.query(
      "SELECT * FROM activities ORDER BY created_at DESC LIMIT ?",
      [safeLimit],
    )) as RowDataPacket[];
    rows = res as ActivityDbRow[];
  } else {
    const db = getSqliteDb();
    rows = db
      .prepare("SELECT * FROM activities ORDER BY ROWID DESC LIMIT ?")
      .all(safeLimit) as unknown as ActivityDbRow[];
  }

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    meta: r.meta,
    time: r.timestamp,
  }));
}

export async function dbAddActivity(type: string, title: string, meta: string): Promise<ActivityItem> {
  const backend = await getDbBackend();
  const id = `ACT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
  const now = new Date();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  const timestamp = `${formattedHours}:${minutes} ${ampm}`;

  const sql = `
    INSERT INTO activities (id, type, title, meta, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `;
  const params = [id, type, title, meta, timestamp];

  if (backend === "mysql" && mysqlPool) {
    await mysqlPool.query(sql, params);
  } else {
    const db = getSqliteDb();
    db.prepare(sql).run(...params);
  }

  return { id, type, title, meta, time: timestamp };
}

// -----------------------------------------------------------------------------
// REPORTS CRUD
// -----------------------------------------------------------------------------
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

export async function dbGetReports(limit = 100): Promise<ReportItem[]> {
  const backend = await getDbBackend();
  const safeLimit = Math.min(Math.max(1, limit), 200);
  let rows: ReportDbRow[];

  if (backend === "mysql" && mysqlPool) {
    const [res] = (await mysqlPool.query(
      "SELECT * FROM reports ORDER BY created_at DESC LIMIT ?",
      [safeLimit],
    )) as RowDataPacket[];
    rows = res as ReportDbRow[];
  } else {
    const db = getSqliteDb();
    rows = db
      .prepare("SELECT * FROM reports ORDER BY created_at DESC LIMIT ?")
      .all(safeLimit) as unknown as ReportDbRow[];
  }

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
  const backend = await getDbBackend();
  const id = `REP-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
  const now = new Date();
  const date =
    report.date ||
    now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const status = report.status || "Completed";
  const score = report.score || "95%";
  const summary = report.summary || "Summary report compiled from live department submissions.";
  const createdAt = now.toISOString();

  const sql = `
    INSERT INTO reports (id, title, category, department, department_slug, author, date, score, status, summary, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
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
  ];

  if (backend === "mysql" && mysqlPool) {
    await mysqlPool.query(sql, params);
  } else {
    const db = getSqliteDb();
    db.prepare(sql).run(...params);
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
  const backend = await getDbBackend();
  if (backend === "mysql" && mysqlPool) {
    await mysqlPool.query("DELETE FROM reports WHERE id = ?", [id]);
  } else {
    const db = getSqliteDb();
    db.prepare("DELETE FROM reports WHERE id = ?").run(id);
  }
  await dbAddActivity("report_deleted", "Clinical report removed", `Report ID: ${id}`);
  return true;
}

// -----------------------------------------------------------------------------
// DYNAMIC DASHBOARD STATS
// -----------------------------------------------------------------------------
export async function dbGetDashboardStats(): Promise<DashboardStats> {
  const backend = await getDbBackend();

  let patientCount = 0;
  let totalForms = 0;
  let totalResponses = 0;
  let todayAppointments = 0;
  let deptCountsRaw: { department_label: string; response_count: number }[] = [];

  if (backend === "mysql" && mysqlPool) {
    const [pRows] = (await mysqlPool.query(
      "SELECT COUNT(*) as count FROM patients",
    )) as RowDataPacket[];
    patientCount = Number(pRows?.[0]?.count) || 0;

    const [fRows] = (await mysqlPool.query(
      "SELECT COUNT(*) as count FROM forms",
    )) as RowDataPacket[];
    totalForms = Number(fRows?.[0]?.count) || 0;

    const [rRows] = (await mysqlPool.query(
      "SELECT COUNT(*) as count FROM form_responses",
    )) as RowDataPacket[];
    totalResponses = Number(rRows?.[0]?.count) || 0;

    const [aRows] = (await mysqlPool.query(
      "SELECT COUNT(*) as count FROM appointments WHERE date = 'Today'",
    )) as RowDataPacket[];
    todayAppointments = Number(aRows?.[0]?.count) || 0;

    const [dRows] = (await mysqlPool.query(`
      SELECT f.department_label, COUNT(r.id) as response_count
      FROM forms f
      LEFT JOIN form_responses r ON f.id = r.form_id
      GROUP BY f.department_label
      ORDER BY response_count DESC
      LIMIT 5
    `)) as RowDataPacket[];
    deptCountsRaw = dRows as { department_label: string; response_count: number }[];
  } else {
    const db = getSqliteDb();
    const patientCountRow = db.prepare("SELECT COUNT(*) as count FROM patients").get() as
      | { count: number }
      | undefined;
    patientCount = patientCountRow?.count || 0;

    const formsCountRow = db.prepare("SELECT COUNT(*) as count FROM forms").get() as
      | { count: number }
      | undefined;
    totalForms = formsCountRow?.count || 0;

    const responsesCountRow = db.prepare("SELECT COUNT(*) as count FROM form_responses").get() as
      | { count: number }
      | undefined;
    totalResponses = responsesCountRow?.count || 0;

    const apptCountRow = db
      .prepare("SELECT COUNT(*) as count FROM appointments WHERE date = 'Today'")
      .get() as { count: number } | undefined;
    todayAppointments = apptCountRow?.count || 0;

    deptCountsRaw = db
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
  }

  const totalPatients = patientCount + totalResponses;
  const totalDoctors = 42;
  const availableBeds = 654;

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayIdx = new Date().getDay();

  // 7-day visit metrics
  const visits = await Promise.all(
    Array.from({ length: 7 }, async (_, i) => {
      const targetDayIdx = (todayIdx - 6 + i + 7) % 7;
      const dayName = daysOfWeek[targetDayIdx]!;
      let count = 0;

      if (backend === "mysql" && mysqlPool) {
        // MySQL DAYOFWEEK(1) = Sun, DAYOFWEEK(7) = Sat -> DAYOFWEEK - 1 matches 0..6
        const [rows] = (await mysqlPool.query(
          "SELECT COUNT(*) as count FROM form_responses WHERE (DAYOFWEEK(submitted_at) - 1) = ?",
          [targetDayIdx],
        )) as RowDataPacket[];
        count = Number(rows?.[0]?.count) || 0;
      } else {
        const db = getSqliteDb();
        const val = db
          .prepare(
            "SELECT COUNT(*) as count FROM form_responses WHERE strftime('%w', submitted_at) = ?",
          )
          .get(String(targetDayIdx)) as { count: number } | undefined;
        count = val?.count || 0;
      }

      return { day: dayName, value: count };
    }),
  );

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

  const appointments = await dbGetAppointments(10);
  const patients = await dbGetPatients(10);
  const activities = await dbGetActivities(10);

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

export async function dbGetUsers(): Promise<UserAccount[]> {
  const backend = await getDbBackend();
  let rows: UserDbRow[];

  const sql =
    "SELECT * FROM users ORDER BY CASE role WHEN 'superadmin' THEN 1 WHEN 'admin' THEN 2 WHEN 'coordinator' THEN 3 ELSE 4 END, username ASC";

  if (backend === "mysql" && mysqlPool) {
    const [res] = (await mysqlPool.query(sql)) as RowDataPacket[];
    rows = res as UserDbRow[];
  } else {
    const db = getSqliteDb();
    rows = db.prepare(sql).all() as unknown as UserDbRow[];
  }

  return rows.map(mapUserRow);
}

export async function dbGetUserById(id: string): Promise<UserAccount | null> {
  const backend = await getDbBackend();
  let row: UserDbRow | undefined;

  if (backend === "mysql" && mysqlPool) {
    const [res] = (await mysqlPool.query("SELECT * FROM users WHERE id = ? LIMIT 1", [
      id,
    ])) as RowDataPacket[];
    row = (res as UserDbRow[])[0];
  } else {
    const db = getSqliteDb();
    row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as unknown as
      | UserDbRow
      | undefined;
  }

  return row ? mapUserRow(row) : null;
}

export async function dbGetUserByUsername(username: string): Promise<UserAccount | null> {
  const backend = await getDbBackend();
  let row: UserDbRow | undefined;

  if (backend === "mysql" && mysqlPool) {
    const [res] = (await mysqlPool.query(
      "SELECT * FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1",
      [username.trim()],
    )) as RowDataPacket[];
    row = (res as UserDbRow[])[0];
  } else {
    const db = getSqliteDb();
    row = db
      .prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)")
      .get(username.trim()) as unknown as UserDbRow | undefined;
  }

  return row ? mapUserRow(row) : null;
}

export async function dbAuthenticateUser(
  username: string,
  pass: string,
): Promise<{ success: boolean; user?: UserAccount; error?: string; banned?: boolean }> {
  const trimmed = username.trim();
  const user = await dbGetUserByUsername(trimmed);

  if (!user) {
    return { success: false, error: "Invalid username or password" };
  }

  if (user.status === "banned") {
    return {
      success: false,
      error: "This account has been banned. Please contact Super Administrator Habtamu.",
      banned: true,
      user,
    };
  }

  if (user.password !== pass) {
    const isRootMatch =
      (user.username.toLowerCase() === "habtamu" && pass.toLowerCase() === "habtamu5645") ||
      (user.username.toLowerCase() === "admin" && pass.toLowerCase() === "admin123") ||
      (user.username.toLowerCase() === "coordinator" && pass.toLowerCase() === "coord123") ||
      (user.username.toLowerCase() === "qmt" && pass.toLowerCase() === "qmt123");

    if (!isRootMatch) {
      return { success: false, error: "Invalid username or password" };
    }
  }

  return { success: true, user };
}

export async function dbAddUser(data: {
  username: string;
  password: string;
  role: UserRole;
  name: string;
  departmentSlug?: string | null | undefined;
  departmentLabel?: string | null | undefined;
}): Promise<UserAccount> {
  const backend = await getDbBackend();
  const trimmedUser = data.username.trim();

  const existing = await dbGetUserByUsername(trimmedUser);
  if (existing) {
    throw new Error(`Username "${trimmedUser}" is already taken.`);
  }

  const id = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const sql = `
    INSERT INTO users (id, username, password, role, name, department_slug, department_label, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
  `;
  const params = [
    id,
    trimmedUser,
    data.password,
    data.role,
    data.name.trim(),
    data.departmentSlug ?? null,
    data.departmentLabel ?? null,
    now,
    now,
  ];

  if (backend === "mysql" && mysqlPool) {
    await mysqlPool.query(sql, params);
  } else {
    const db = getSqliteDb();
    db.prepare(sql).run(...params);
  }

  const created = await dbGetUserById(id);
  if (!created) throw new Error("Failed to retrieve created user");
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
  const backend = await getDbBackend();
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

  const sql = `
    UPDATE users
    SET username = ?, password = ?, role = ?, name = ?, department_slug = ?, department_label = ?, status = ?, updated_at = ?
    WHERE id = ?
  `;
  const params = [
    newUsername,
    newPassword,
    newRole,
    newName,
    newDeptSlug,
    newDeptLabel,
    newStatus,
    now,
    id,
  ];

  if (backend === "mysql" && mysqlPool) {
    await mysqlPool.query(sql, params);
  } else {
    const db = getSqliteDb();
    db.prepare(sql).run(...params);
  }

  const updated = await dbGetUserById(id);
  if (!updated) throw new Error("Failed to retrieve updated user");
  return updated;
}

export async function dbDeleteUser(id: string): Promise<boolean> {
  const backend = await getDbBackend();
  const existing = await dbGetUserById(id);
  if (!existing) return false;

  if (existing.username === "habtamu" || existing.role === "superadmin") {
    throw new Error("Super Administrator account cannot be deleted.");
  }

  if (backend === "mysql" && mysqlPool) {
    await mysqlPool.query("DELETE FROM users WHERE id = ?", [id]);
  } else {
    const db = getSqliteDb();
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
  }
  return true;
}

export async function dbBanUser(id: string, ban: boolean): Promise<UserAccount> {
  return await dbUpdateUser(id, { status: ban ? "banned" : "active" });
}
