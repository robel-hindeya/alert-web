# ALERT Hospital Quality Management System

ALERT Comprehensive Specialized Hospital Clinical Audit & Management Platform.

**Live application**: https://alert-web-zeta.vercel.app/

---

## Database Architecture: Supabase PostgreSQL

This platform uses **Supabase (PostgreSQL)** as its sole, reliable database engine. MySQL, Hostinger, and local SQLite databases are completely replaced by Supabase.

---

### Step 1: Create Your Supabase Project

1. Log in to [Supabase](https://supabase.com) and click **New project**.
2. Set your Project Name (e.g. `alert-hospital`) and generate a secure database password.
3. Choose your nearest region and click **Create new project**.

---

### Step 2: Create the Database Schema

1. Open your Supabase Dashboard and navigate to the **SQL Editor** tab on the left sidebar.
2. Open the file [`schema.sql`](./schema.sql) from the root of this repository.
3. Paste the entire SQL script into the Supabase SQL editor and click **Run**.
4. This script sets up:
   - `users` (Staff, Coordinators & Administrators)
   - `forms` (Clinical checklists & audit forms with native PostgreSQL `JSONB`)
   - `form_responses` (Submissions linked via `FOREIGN KEY ... ON DELETE CASCADE`)
   - `patients` (Registered hospital patients)
   - `appointments` (Patient appointment scheduling)
   - `activities` (Live hospital activity timeline)
   - `reports` (Departmental quality audit reports)
   - Row Level Security (RLS) policies for secure access.
   - Initial seed accounts including Super Administrator `habtamu`.

---

### Step 3: Configure Environment Variables

1. In your Supabase Dashboard, go to **Project Settings** ➔ **API**.
2. Copy your **Project URL** and **anon public** API key, as well as the **service_role secret** key.
3. Copy `.env.example` to `.env` (or update `.env`):

```env
# Client-accessible Supabase variables (Vite / Next.js compatible)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

# Server-Side Supabase Service Role Key (NEVER commit to Git or expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
```

> **Security Note**: Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code. It is only utilized on the secure server layer to execute administrative operations safely.

---

### Step 4: Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` (or the port indicated in your terminal).

Default Super Administrator login:
* **Username**: `habtamu`
* **Password**: `Habtamu5645`

---

### Step 5: Deploying to Production (e.g. Vercel)

1. Connect your repository to Vercel, Cloudflare Pages, or your deployment provider.
2. Under **Project Settings** ➔ **Environment Variables**, add:
   * `VITE_SUPABASE_URL` (and/or `NEXT_PUBLIC_SUPABASE_URL`)
   * `VITE_SUPABASE_ANON_KEY` (and/or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   * `SUPABASE_SERVICE_ROLE_KEY`
3. Trigger a deployment. Your production instance will be connected to Supabase PostgreSQL.
