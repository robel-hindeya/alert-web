# ALERT Quality Management System

ALERT Comprehensive Specialized Hospital Clinical Audit & Management Platform.

**Live app**: https://alert-web-zeta.vercel.app/

---

## Database Configuration (MySQL)

This system is configured to connect to a **MySQL** database.

### 1. Database Environment Variables (`.env`)

Copy `.env.example` to `.env` or set the following environment variables:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=alert_hospital
```

Alternatively, you can provide a full connection URL:

```env
DATABASE_URL=mysql://user:password@localhost:3306/alert_hospital
```

### 2. Schema and Tables

- The server will **automatically create the database and tables** if they don't exist when it starts.
- If you prefer to manually import the database schema, run the included `schema.sql` script into MySQL or phpMyAdmin.
- Default Super Administrator account:
  - **Username**: `habtamu`
  - **Password**: `Habtamu5645`

### 3. Graceful SQLite Fallback

If your MySQL server is temporarily stopped or offline during local development, the application automatically falls back to the embedded SQLite database (`data/hospital.db`) so your workflow is never interrupted.

---

## Development

```sh
npm install
npm run dev
```
