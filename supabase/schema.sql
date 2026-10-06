-- =============================================================================
-- ALERT Hospital Quality Management System - Supabase PostgreSQL Schema
-- =============================================================================

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
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

-- Row Level Security (RLS) Setup
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public forms read" ON public.forms;
  DROP POLICY IF EXISTS "Service role forms full access" ON public.forms;
  DROP POLICY IF EXISTS "Public form_responses insert" ON public.form_responses;
  DROP POLICY IF EXISTS "Public form_responses select" ON public.form_responses;
  DROP POLICY IF EXISTS "Service role form_responses full access" ON public.form_responses;
  DROP POLICY IF EXISTS "Public patients select" ON public.patients;
  DROP POLICY IF EXISTS "Public patients insert" ON public.patients;
  DROP POLICY IF EXISTS "Service role patients full access" ON public.patients;
  DROP POLICY IF EXISTS "Public appointments select" ON public.appointments;
  DROP POLICY IF EXISTS "Public appointments insert" ON public.appointments;
  DROP POLICY IF EXISTS "Public appointments update" ON public.appointments;
  DROP POLICY IF EXISTS "Service role appointments full access" ON public.appointments;
  DROP POLICY IF EXISTS "Public activities select" ON public.activities;
  DROP POLICY IF EXISTS "Public activities insert" ON public.activities;
  DROP POLICY IF EXISTS "Service role activities full access" ON public.activities;
  DROP POLICY IF EXISTS "Public reports select" ON public.reports;
  DROP POLICY IF EXISTS "Public reports insert" ON public.reports;
  DROP POLICY IF EXISTS "Public reports delete" ON public.reports;
  DROP POLICY IF EXISTS "Service role reports full access" ON public.reports;
  DROP POLICY IF EXISTS "Public users select" ON public.users;
  DROP POLICY IF EXISTS "Service role users full access" ON public.users;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Policies for public and service role access
CREATE POLICY "Public forms read" ON public.forms FOR SELECT USING (true);
CREATE POLICY "Service role forms full access" ON public.forms FOR ALL USING (true);

CREATE POLICY "Public form_responses insert" ON public.form_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public form_responses select" ON public.form_responses FOR SELECT USING (true);
CREATE POLICY "Service role form_responses full access" ON public.form_responses FOR ALL USING (true);

CREATE POLICY "Public patients select" ON public.patients FOR SELECT USING (true);
CREATE POLICY "Public patients insert" ON public.patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role patients full access" ON public.patients FOR ALL USING (true);

CREATE POLICY "Public appointments select" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Public appointments insert" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public appointments update" ON public.appointments FOR UPDATE USING (true);
CREATE POLICY "Service role appointments full access" ON public.appointments FOR ALL USING (true);

CREATE POLICY "Public activities select" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Public activities insert" ON public.activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role activities full access" ON public.activities FOR ALL USING (true);

CREATE POLICY "Public reports select" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Public reports insert" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public reports delete" ON public.reports FOR DELETE USING (true);
CREATE POLICY "Service role reports full access" ON public.reports FOR ALL USING (true);

CREATE POLICY "Public users select" ON public.users FOR SELECT USING (true);
CREATE POLICY "Service role users full access" ON public.users FOR ALL USING (true);

-- Seed initial Super Administrator and essential administrative staff accounts
INSERT INTO public.users (id, username, password, role, name, department_slug, department_label, status, created_at, updated_at)
VALUES
  ('usr-superadmin-habtamu', 'habtamu', 'scrypt:2a9d82f7e01b4c3e8a1d7f6c5b4a3928:77e8a93e5a5fbc40d24f0c4c478a8bc8fbe84e9c3e9a59bc84b912f27b9c02d137ca25da95191c956950fbc05c93d90fbdc714c77ef1be25c8eb3ad90dcf3f08', 'superadmin', 'Habtamu (Super Administrator)', NULL, NULL, 'active', now(), now()),
  ('usr-admin-default', 'admin', 'scrypt:81d0e5170d10c8c366ff40cf6112d7c9:2fa02dc7b00ea3c2ca98ef9f8724d2cf9ea1496a928ba57008316f731a5be02334861214309a47d2eb22424fa7aa9369bd65a91eece1dfd9a4641973b0fcadfc', 'admin', 'Hospital Administrator', NULL, NULL, 'active', now(), now()),
  ('usr-coordinator-default', 'coordinator', 'scrypt:d314050dca0fcfa0b7d72856f6ba3a8c:6ad85d95fa72c2196fb995648f5da0e7193b04c818b2c4e61aa6189bf718cb6c1737be704ec327e57c6b453e920d3d526274431f47f23c945fa6bf85d8bb63a7', 'coordinator', 'Emergency Clinical Coordinator', 'emergency-corridor', 'Emergency Corridor', 'active', now(), now()),
  ('usr-qmt-default', 'qmt', 'scrypt:989df03d3c8c734b07da702bdf6c7eb2:b8a4f653457a3e75a6113c59cfaf443ecb0ec9c33965db0118596660f588c7f39845db884b6f131a40306122d25089c890776bdfa66699195b0577ad45e7f09d', 'qmt', 'Dr. Roman Sisay (QMT Officer)', NULL, NULL, 'active', now(), now())
ON CONFLICT (username) DO UPDATE
SET role = EXCLUDED.role, status = 'active', updated_at = now();
