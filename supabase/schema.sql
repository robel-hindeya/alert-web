-- =============================================================================
-- ALERT Hospital Management System - Supabase PostgreSQL Schema
-- =============================================================================

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  department_slug TEXT,
  department_label TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users (lower(username));
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

-- 2. Forms Table
CREATE TABLE IF NOT EXISTS public.forms (
  id TEXT PRIMARY KEY,
  department_slug TEXT NOT NULL,
  department_label TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  questions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_forms_dept ON public.forms (department_slug);
CREATE INDEX IF NOT EXISTS idx_forms_updated ON public.forms (updated_at DESC);

-- 3. Form Responses Table (with strict ON DELETE CASCADE)
CREATE TABLE IF NOT EXISTS public.form_responses (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL REFERENCES public.forms (id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  answers_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_responses_form ON public.form_responses (form_id);
CREATE INDEX IF NOT EXISTS idx_responses_submitted ON public.form_responses (submitted_at DESC);

-- 4. Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mrn TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  phone TEXT NOT NULL,
  department_slug TEXT NOT NULL,
  department_label TEXT NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  status TEXT NOT NULL DEFAULT 'Active'
);

CREATE INDEX IF NOT EXISTS idx_patients_dept ON public.patients (department_slug);
CREATE INDEX IF NOT EXISTS idx_patients_registered ON public.patients (registered_at DESC);

-- 5. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_id TEXT,
  doctor_name TEXT NOT NULL,
  department_slug TEXT NOT NULL,
  department_label TEXT NOT NULL,
  time TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_appointments_dept ON public.appointments (department_slug);
CREATE INDEX IF NOT EXISTS idx_appointments_created ON public.appointments (created_at DESC);

-- 6. Activities Table
CREATE TABLE IF NOT EXISTS public.activities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  meta TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_activities_created ON public.activities (created_at DESC);

-- 7. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  department TEXT NOT NULL,
  department_slug TEXT NOT NULL,
  author TEXT NOT NULL,
  date TEXT NOT NULL,
  score TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Completed',
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reports_dept ON public.reports (department_slug);
CREATE INDEX IF NOT EXISTS idx_reports_created ON public.reports (created_at DESC);

-- 8. Officers & Coordinators Table
CREATE TABLE IF NOT EXISTS public.officers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  department_slug TEXT,
  type TEXT NOT NULL DEFAULT 'QMT Officer',
  base_audits INTEGER NOT NULL DEFAULT 0,
  compliance_rate TEXT NOT NULL DEFAULT '98.0%',
  rating NUMERIC(3, 1) NOT NULL DEFAULT 5.0,
  status TEXT NOT NULL DEFAULT 'Active',
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_officers_type ON public.officers (type);
CREATE INDEX IF NOT EXISTS idx_officers_status ON public.officers (status);

-- Row Level Security (RLS) Setup
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DO $$
BEGIN
  -- Forms
  DROP POLICY IF EXISTS "Public forms read" ON public.forms;
  DROP POLICY IF EXISTS "Public forms all" ON public.forms;
  DROP POLICY IF EXISTS "Service role forms full access" ON public.forms;

  -- Form Responses
  DROP POLICY IF EXISTS "Public form_responses insert" ON public.form_responses;
  DROP POLICY IF EXISTS "Public form_responses select" ON public.form_responses;
  DROP POLICY IF EXISTS "Public form_responses all" ON public.form_responses;
  DROP POLICY IF EXISTS "Service role form_responses full access" ON public.form_responses;

  -- Patients
  DROP POLICY IF EXISTS "Public patients select" ON public.patients;
  DROP POLICY IF EXISTS "Public patients insert" ON public.patients;
  DROP POLICY IF EXISTS "Public patients all" ON public.patients;
  DROP POLICY IF EXISTS "Service role patients full access" ON public.patients;

  -- Appointments
  DROP POLICY IF EXISTS "Public appointments select" ON public.appointments;
  DROP POLICY IF EXISTS "Public appointments insert" ON public.appointments;
  DROP POLICY IF EXISTS "Public appointments update" ON public.appointments;
  DROP POLICY IF EXISTS "Public appointments all" ON public.appointments;
  DROP POLICY IF EXISTS "Service role appointments full access" ON public.appointments;

  -- Activities
  DROP POLICY IF EXISTS "Public activities select" ON public.activities;
  DROP POLICY IF EXISTS "Public activities insert" ON public.activities;
  DROP POLICY IF EXISTS "Public activities all" ON public.activities;
  DROP POLICY IF EXISTS "Service role activities full access" ON public.activities;

  -- Reports
  DROP POLICY IF EXISTS "Public reports select" ON public.reports;
  DROP POLICY IF EXISTS "Public reports insert" ON public.reports;
  DROP POLICY IF EXISTS "Public reports delete" ON public.reports;
  DROP POLICY IF EXISTS "Public reports all" ON public.reports;
  DROP POLICY IF EXISTS "Service role reports full access" ON public.reports;

  -- Officers
  DROP POLICY IF EXISTS "Public officers select" ON public.officers;
  DROP POLICY IF EXISTS "Public officers insert" ON public.officers;
  DROP POLICY IF EXISTS "Public officers update" ON public.officers;
  DROP POLICY IF EXISTS "Public officers all" ON public.officers;
  DROP POLICY IF EXISTS "Service role officers full access" ON public.officers;

  -- Users
  DROP POLICY IF EXISTS "Public users select" ON public.users;
  DROP POLICY IF EXISTS "Public users all" ON public.users;
  DROP POLICY IF EXISTS "Service role users full access" ON public.users;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Policies allowing full API CRUD access
CREATE POLICY "Public forms all" ON public.forms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public form_responses all" ON public.form_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public patients all" ON public.patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public appointments all" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public activities all" ON public.activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public reports all" ON public.reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public officers all" ON public.officers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public users all" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- Seed initial Super Administrator account
INSERT INTO public.users (id, username, email, password, role, name, department_slug, department_label, status, created_at, updated_at)
VALUES
  ('usr-superadmin-habtamu', 'habtamu', 'habtamu@alert.gov.et', 'scrypt:2a9d82f7e01b4c3e8a1d7f6c5b4a3928:77e8a93e5a5fbc40d24f0c4c478a8bc8fbe84e9c3e9a59bc84b912f27b9c02d137ca25da95191c956950fbc05c93d90fbdc714c77ef1be25c8eb3ad90dcf3f08', 'superadmin', 'Habtamu (Super Administrator)', NULL, NULL, 'active', now(), now())
ON CONFLICT (username) DO UPDATE
SET role = 'superadmin', email = EXCLUDED.email, status = 'active', updated_at = now();

-- Seed initial Top 5 QMT Officers & Coordinators
INSERT INTO public.officers (id, name, role, department, department_slug, type, base_audits, compliance_rate, rating, status, email, phone, created_at, updated_at)
VALUES
  ('top-1', 'Dr. Habtamu Girma', 'Lead QMT Quality Director', 'Emergency & Triage Corridor', 'emergency-corridor', 'QMT Officer', 384, '99.4%', 5.0, 'Active', 'dr.girma@alert.et', '+251 911 23 4567', now(), now()),
  ('top-2', 'Sr. Tigist Alemu', 'Senior Clinical Audit Coordinator', 'Intensive Care Unit (ICU)', 'icu', 'Coordinator', 326, '98.7%', 4.9, 'In Audit', 'sr.alemu@alert.et', '+251 911 34 5678', now(), now()),
  ('top-3', 'Dr. Yonas Bekele', 'Surgical Safety Audit Officer', 'Major Surgical Theatre', 'surgical-service', 'QMT Officer', 295, '98.2%', 4.9, 'Active', 'dr.bekele@alert.et', '+251 911 45 6789', now(), now()),
  ('top-4', 'Sr. Meron Haile', 'Inpatient Care Coordinator', 'Inpatient Medical Ward', 'inpatient', 'Coordinator', 258, '97.6%', 4.8, 'Active', 'sr.haile@alert.et', '+251 911 56 7890', now(), now()),
  ('top-5', 'Dr. Dawit Abebe', 'Pharmacovigilance Audit Officer', 'Central Pharmacy & OPD', 'opd', 'QMT Officer', 231, '97.1%', 4.8, 'Reviewing', 'dr.abebe@alert.et', '+251 911 67 8901', now(), now())
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  department_slug = EXCLUDED.department_slug,
  type = EXCLUDED.type,
  compliance_rate = EXCLUDED.compliance_rate,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  updated_at = now();

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
