import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import type { CustomForm, FormQuestion, FormResponse } from "../lib/form-types.ts";
import { INITIAL_DEFAULT_FORMS } from "../lib/form-types.ts";

const DB_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "hospital.db");

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    dbInstance = new DatabaseSync(DB_PATH);

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

      CREATE INDEX IF NOT EXISTS idx_forms_dept ON forms (department_slug);
      CREATE INDEX IF NOT EXISTS idx_responses_form ON form_responses (form_id);
    `);

    // Seed default forms if table is empty
    seedInitialForms(dbInstance);
  }

  return dbInstance;
}

function seedInitialForms(db: DatabaseSync) {
  const row = db.prepare("SELECT COUNT(*) as count FROM forms").get() as { count: number };
  if (row && row.count === 0) {
    const insert = db.prepare(`
      INSERT INTO forms (id, department_slug, department_label, title, description, banner_url, questions_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const form of INITIAL_DEFAULT_FORMS) {
      insert.run(
        form.id,
        form.departmentSlug,
        form.departmentLabel,
        form.title,
        form.description || "",
        form.bannerUrl || "",
        JSON.stringify(form.questions || []),
        form.createdAt || new Date().toISOString(),
        form.updatedAt || new Date().toISOString()
      );
    }
  }
}

export function dbGetAllForms(departmentSlug?: string): CustomForm[] {
  const db = getDb();
  let rows: any[];
  if (departmentSlug) {
    rows = db.prepare("SELECT * FROM forms WHERE department_slug = ? ORDER BY updated_at DESC").all(departmentSlug);
  } else {
    rows = db.prepare("SELECT * FROM forms ORDER BY updated_at DESC").all();
  }

  return rows.map((r) => ({
    id: r.id,
    departmentSlug: r.department_slug,
    departmentLabel: r.department_label,
    title: r.title,
    description: r.description || "",
    bannerUrl: r.banner_url || undefined,
    questions: JSON.parse(r.questions_json || "[]") as FormQuestion[],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function dbGetFormById(id: string): CustomForm | null {
  const db = getDb();
  const r = db.prepare("SELECT * FROM forms WHERE id = ?").get(id) as any;
  if (!r) return null;

  return {
    id: r.id,
    departmentSlug: r.department_slug,
    departmentLabel: r.department_label,
    title: r.title,
    description: r.description || "",
    bannerUrl: r.banner_url || undefined,
    questions: JSON.parse(r.questions_json || "[]") as FormQuestion[],
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
    db.prepare(`
      UPDATE forms
      SET department_slug = ?, department_label = ?, title = ?, description = ?, banner_url = ?, questions_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      form.departmentSlug,
      form.departmentLabel,
      form.title,
      form.description || "",
      form.bannerUrl || "",
      JSON.stringify(form.questions || []),
      updatedAt,
      form.id
    );
  } else {
    db.prepare(`
      INSERT INTO forms (id, department_slug, department_label, title, description, banner_url, questions_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      form.id,
      form.departmentSlug,
      form.departmentLabel,
      form.title,
      form.description || "",
      form.bannerUrl || "",
      JSON.stringify(form.questions || []),
      createdAt,
      updatedAt
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
  db.prepare(`
    INSERT INTO form_responses (id, form_id, submitted_at, answers_json)
    VALUES (?, ?, ?, ?)
  `).run(
    response.id,
    response.formId,
    response.submittedAt,
    JSON.stringify(response.answers || {})
  );
  return response;
}

export function dbGetResponses(formId: string): FormResponse[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM form_responses WHERE form_id = ? ORDER BY submitted_at DESC").all(formId) as any[];
  return rows.map((r) => ({
    id: r.id,
    formId: r.form_id,
    submittedAt: r.submitted_at,
    answers: JSON.parse(r.answers_json || "{}"),
  }));
}
