import {
  dbGetAllForms,
  dbGetFormById,
  dbUpsertForm,
  dbDeleteForm,
  dbSaveResponse,
  dbGetResponses,
  dbGetAllResponses,
  dbGetPatients,
  dbAddPatient,
  dbGetAppointments,
  dbAddAppointment,
  dbUpdateAppointmentStatus,
  dbDeleteAppointment,
  dbDeletePatient,
  dbGetActivities,
  dbGetReports,
  dbAddReport,
  dbDeleteReport,
  dbGetDashboardStats,
  dbGetTopOfficers,
  dbAddOfficer,
  dbUpdateOfficerStatus,
  type TopOfficerLeader,
  dbGetUsers,
  dbGetUserById,
  dbGetUserByUsername,
  dbAuthenticateUser,
  dbAddUser,
  dbUpdateUser,
  dbDeleteUser,
  dbBanUser,
  type UserRole,
} from "./db.ts";
import type { CustomForm, FormResponse } from "../lib/form-types.ts";

export async function handleApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (!pathname.startsWith("/api/")) {
    return null;
  }

  const corsHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // -------------------------------------------------------------------------
    // ALERT LOGO STATIC PROXY: /alert-logo.png or Lovable asset URL
    // -------------------------------------------------------------------------
    if (
      pathname === "/alert-logo.png" ||
      pathname.includes("alert-logo") ||
      pathname.startsWith("/__l5e/")
    ) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const filePath = path.resolve(process.cwd(), "public", "alert-logo.png");
        if (fs.existsSync(filePath)) {
          const buffer = fs.readFileSync(filePath);
          return new Response(buffer, {
            status: 200,
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "public, max-age=31536000, immutable",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } catch (err) {
        console.error("Error serving alert logo:", err);
      }
    }

    // -------------------------------------------------------------------------
    // DASHBOARD STATS: GET /api/dashboard/stats
    // -------------------------------------------------------------------------
    if (pathname === "/api/dashboard/stats") {
      if (request.method !== "GET") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: corsHeaders,
        });
      }
      const stats = await dbGetDashboardStats();
      return new Response(JSON.stringify(stats), { status: 200, headers: corsHeaders });
    }

    // -------------------------------------------------------------------------
    // TOP OFFICERS LEADERBOARD: GET /api/leaderboard/top-officers OR /api/officers
    // -------------------------------------------------------------------------
    if (pathname === "/api/leaderboard/top-officers" || pathname === "/api/officers") {
      if (request.method === "GET") {
        const limitParam = url.searchParams.get("limit");
        const limit = limitParam ? parseInt(limitParam, 10) : 10;
        const top = await dbGetTopOfficers(Number.isNaN(limit) ? 10 : limit);
        return new Response(JSON.stringify(top), { status: 200, headers: corsHeaders });
      }

      if (request.method === "POST") {
        const body = (await request.json().catch(() => null)) as {
          name?: string;
          role?: string;
          department?: string;
          departmentSlug?: string;
          type?: "QMT Officer" | "Coordinator";
          auditsCompleted?: number;
          complianceRate?: string;
          rating?: number;
          status?: "Active" | "In Audit" | "Reviewing";
          email?: string;
          phone?: string;
        } | null;

        if (!body || !body.name || !body.department) {
          return new Response(
            JSON.stringify({ error: "Name and department are required." }),
            { status: 400, headers: corsHeaders },
          );
        }

        const created = await dbAddOfficer({
          name: body.name,
          role: body.role || "Quality Management Officer",
          department: body.department,
          departmentSlug: body.departmentSlug,
          type: body.type || "QMT Officer",
          auditsCompleted: body.auditsCompleted,
          complianceRate: body.complianceRate,
          rating: body.rating,
          status: body.status || "Active",
          email: body.email,
          phone: body.phone,
        });

        return new Response(JSON.stringify(created), { status: 201, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    // -------------------------------------------------------------------------
    // OFFICER STATUS / UPDATE: PATCH /api/officers/:id
    // -------------------------------------------------------------------------
    if (pathname.startsWith("/api/officers/") && request.method === "PATCH") {
      const officerId = pathname.slice("/api/officers/".length);
      const body = (await request.json().catch(() => null)) as {
        status?: "Active" | "In Audit" | "Reviewing";
      } | null;

      if (!body || !body.status) {
        return new Response(
          JSON.stringify({ error: "Status is required." }),
          { status: 400, headers: corsHeaders },
        );
      }

      const ok = await dbUpdateOfficerStatus(officerId, body.status);
      return new Response(JSON.stringify({ success: ok }), { status: 200, headers: corsHeaders });
    }

    // -------------------------------------------------------------------------
    // AUTH LOGIN: POST /api/auth/login
    // -------------------------------------------------------------------------
    if (pathname === "/api/auth/login") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: corsHeaders,
        });
      }

      const raw = (await request.json().catch(() => null)) as {
        username?: string;
        email?: string;
        identifier?: string;
        password?: string;
      } | null;

      const identifier = (raw?.identifier || raw?.username || raw?.email || "").trim();
      if (!raw || !identifier) {
        return new Response(
          JSON.stringify({ error: "Username or email is required." }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const pass = raw.password ?? "";
      const authRes = await dbAuthenticateUser(identifier, pass);
      if (!authRes.success || !authRes.user) {
        const isBanned = authRes.banned;
        return new Response(
          JSON.stringify({
            error: authRes.error || "Invalid username or password.",
            banned: Boolean(isBanned),
          }),
          { status: isBanned ? 403 : 401, headers: corsHeaders },
        );
      }

      const u = authRes.user;
      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: u.id,
            username: u.username,
            email: u.email || `${u.username}@alert.gov.et`,
            role: u.role,
            name: u.name,
            departmentSlug: u.departmentSlug,
            departmentLabel: u.departmentLabel,
            status: u.status,
          },
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    // -------------------------------------------------------------------------
    // USERS MANAGEMENT: /api/users
    // -------------------------------------------------------------------------
    if (pathname === "/api/users") {
      if (request.method === "GET") {
        const users = await dbGetUsers();
        const usersWithDisplayPassword = users.map((u) => ({
          ...u,
          password:
            u.displayPassword ||
            (u.username === "habtamu"
              ? "Habtamu5645"
              : u.password && !u.password.startsWith("scrypt:")
              ? u.password
              : undefined),
        }));
        return new Response(JSON.stringify(usersWithDisplayPassword), {
          status: 200,
          headers: corsHeaders,
        });
      }

      if (request.method === "POST") {
        const raw = (await request.json().catch(() => null)) as {
          username?: string;
          password?: string;
          role?: UserRole;
          name?: string;
          departmentSlug?: string | null;
          departmentLabel?: string | null;
        } | null;

        if (!raw || !raw.username || !raw.password || !raw.role || !raw.name) {
          return new Response(
            JSON.stringify({ error: "Username, password, role, and name are required." }),
            { status: 400, headers: corsHeaders },
          );
        }

        try {
          const newUser = await dbAddUser({
            username: raw.username,
            password: raw.password,
            role: raw.role,
            name: raw.name,
            departmentSlug: raw.departmentSlug,
            departmentLabel: raw.departmentLabel,
          });
          const pass =
            newUser.displayPassword || (newUser.username === "habtamu" ? "Habtamu5645" : undefined);
          return new Response(JSON.stringify({ ...newUser, password: pass }), {
            status: 201,
            headers: corsHeaders,
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Failed to create user";
          return new Response(JSON.stringify({ error: msg }), {
            status: 400,
            headers: corsHeaders,
          });
        }
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    // /api/users/:id
    const userMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
    if (userMatch && userMatch[1]) {
      const userId = decodeURIComponent(userMatch[1]).trim();

      if (request.method === "GET") {
        const user = await dbGetUserById(userId);
        if (!user) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: corsHeaders,
          });
        }
        const pass =
          user.displayPassword || (user.username === "habtamu" ? "Habtamu5645" : undefined);
        return new Response(JSON.stringify({ ...user, password: pass }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      if (request.method === "PATCH") {
        const raw = (await request.json().catch(() => null)) as {
          username?: string;
          password?: string;
          role?: UserRole;
          name?: string;
          departmentSlug?: string | null;
          departmentLabel?: string | null;
          status?: "active" | "banned";
        } | null;

        if (!raw || typeof raw !== "object") {
          return new Response(JSON.stringify({ error: "Update body required" }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        try {
          const updated = await dbUpdateUser(userId, raw);
          const pass =
            updated.displayPassword || (updated.username === "habtamu" ? "Habtamu5645" : undefined);
          return new Response(JSON.stringify({ ...updated, password: pass }), {
            status: 200,
            headers: corsHeaders,
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Failed to update user";
          return new Response(JSON.stringify({ error: msg }), {
            status: 400,
            headers: corsHeaders,
          });
        }
      }

      if (request.method === "DELETE") {
        try {
          const ok = await dbDeleteUser(userId);
          if (!ok) {
            return new Response(JSON.stringify({ error: "User not found" }), {
              status: 404,
              headers: corsHeaders,
            });
          }
          return new Response(JSON.stringify({ success: true, id: userId }), {
            status: 200,
            headers: corsHeaders,
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Failed to delete user";
          return new Response(JSON.stringify({ error: msg }), {
            status: 400,
            headers: corsHeaders,
          });
        }
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    // -------------------------------------------------------------------------
    // APPOINTMENTS: /api/appointments
    // -------------------------------------------------------------------------
    if (pathname === "/api/appointments") {
      if (request.method === "GET") {
        const dept = url.searchParams.get("dept")?.trim() || undefined;
        const limit = Number(url.searchParams.get("limit")) || 50;
        const appts = await dbGetAppointments(limit, dept);
        return new Response(JSON.stringify(appts), { status: 200, headers: corsHeaders });
      }

      if (request.method === "POST") {
        const rawBody = (await request.json().catch(() => null)) as unknown;
        if (!rawBody || typeof rawBody !== "object") {
          return new Response(JSON.stringify({ error: "Valid appointment payload required" }), {
            status: 400,
            headers: corsHeaders,
          });
        }
        const b = rawBody as {
          patientName?: string;
          patientId?: string;
          doctorName?: string;
          departmentSlug?: string;
          departmentLabel?: string;
          time?: string;
          date?: string;
          status?: "Completed" | "In Progress" | "Pending" | "Confirmed";
        };

        if (!b.patientName || !b.doctorName || !b.departmentSlug) {
          return new Response(
            JSON.stringify({ error: "patientName, doctorName, and departmentSlug are required" }),
            {
              status: 400,
              headers: corsHeaders,
            },
          );
        }

        const appt = await dbAddAppointment({
          patientName: String(b.patientName).trim().slice(0, 100),
          patientId: b.patientId ? String(b.patientId).trim().slice(0, 50) : undefined,
          doctorName: String(b.doctorName).trim().slice(0, 100),
          departmentSlug: String(b.departmentSlug).trim().slice(0, 80),
          departmentLabel: String(b.departmentLabel || b.departmentSlug)
            .trim()
            .slice(0, 100),
          time: String(b.time || "10:00 AM")
            .trim()
            .slice(0, 50),
          date: String(b.date || "Today")
            .trim()
            .slice(0, 50),
          status: b.status || "Confirmed",
        });

        return new Response(JSON.stringify(appt), { status: 201, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    // PATCH /api/appointments/:id/status
    const matchApptStatus = pathname.match(/^\/api\/appointments\/([^/]+)\/status$/);
    if (matchApptStatus && matchApptStatus[1]) {
      const apptId = decodeURIComponent(matchApptStatus[1]);
      if (request.method === "PATCH") {
        const rawBody = (await request.json().catch(() => null)) as {
          status?: "Completed" | "In Progress" | "Pending" | "Confirmed";
        } | null;
        if (!rawBody?.status) {
          return new Response(JSON.stringify({ error: "status required" }), {
            status: 400,
            headers: corsHeaders,
          });
        }
        const updated = await dbUpdateAppointmentStatus(apptId, rawBody.status);
        if (!updated) {
          return new Response(JSON.stringify({ error: "Appointment not found" }), {
            status: 404,
            headers: corsHeaders,
          });
        }
        return new Response(JSON.stringify(updated), { status: 200, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    // DELETE /api/appointments/:id
    const matchApptDelete = pathname.match(/^\/api\/appointments\/([^/]+)$/);
    if (matchApptDelete && matchApptDelete[1]) {
      const apptId = decodeURIComponent(matchApptDelete[1]);
      if (request.method === "DELETE") {
        await dbDeleteAppointment(apptId);
        return new Response(JSON.stringify({ success: true, id: apptId }), {
          status: 200,
          headers: corsHeaders,
        });
      }
    }

    // -------------------------------------------------------------------------
    // PATIENTS: /api/patients
    // -------------------------------------------------------------------------
    if (pathname === "/api/patients") {
      if (request.method === "GET") {
        const limit = Number(url.searchParams.get("limit")) || 100;
        const patients = await dbGetPatients(limit);
        return new Response(JSON.stringify(patients), { status: 200, headers: corsHeaders });
      }

      if (request.method === "POST") {
        const rawBody = (await request.json().catch(() => null)) as unknown;
        if (!rawBody || typeof rawBody !== "object") {
          return new Response(JSON.stringify({ error: "Valid patient payload required" }), {
            status: 400,
            headers: corsHeaders,
          });
        }
        const b = rawBody as {
          name?: string;
          mrn?: string;
          age?: number;
          gender?: "Male" | "Female";
          phone?: string;
          departmentSlug?: string;
          departmentLabel?: string;
          status?: "Active" | "Discharged" | "Admitted";
        };

        if (!b.name || !b.phone || !b.departmentSlug) {
          return new Response(
            JSON.stringify({ error: "name, phone, and departmentSlug are required" }),
            {
              status: 400,
              headers: corsHeaders,
            },
          );
        }

        const patient = await dbAddPatient({
          name: String(b.name).trim().slice(0, 100),
          mrn: b.mrn ? String(b.mrn).trim().slice(0, 50) : undefined,
          age: Number(b.age) || 30,
          gender: b.gender === "Female" ? "Female" : "Male",
          phone: String(b.phone).trim().slice(0, 30),
          departmentSlug: String(b.departmentSlug).trim().slice(0, 80),
          departmentLabel: String(b.departmentLabel || b.departmentSlug)
            .trim()
            .slice(0, 100),
          status: b.status || "Active",
        });

        return new Response(JSON.stringify(patient), { status: 201, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    // DELETE /api/patients/:id
    const matchPatientDelete = pathname.match(/^\/api\/patients\/([^/]+)$/);
    if (matchPatientDelete && matchPatientDelete[1]) {
      const patientId = decodeURIComponent(matchPatientDelete[1]);
      if (request.method === "DELETE") {
        await dbDeletePatient(patientId);
        return new Response(JSON.stringify({ success: true, id: patientId }), {
          status: 200,
          headers: corsHeaders,
        });
      }
    }

    // -------------------------------------------------------------------------
    // ACTIVITIES: /api/activities
    // -------------------------------------------------------------------------
    if (pathname === "/api/activities") {
      if (request.method === "GET") {
        const limit = Number(url.searchParams.get("limit")) || 20;
        const activities = await dbGetActivities(limit);
        return new Response(JSON.stringify(activities), { status: 200, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    // -------------------------------------------------------------------------
    // REPORTS: /api/reports
    // -------------------------------------------------------------------------
    if (pathname === "/api/reports") {
      if (request.method === "GET") {
        const limit = Number(url.searchParams.get("limit")) || 100;
        const reports = await dbGetReports(limit);
        return new Response(JSON.stringify(reports), { status: 200, headers: corsHeaders });
      }

      if (request.method === "POST") {
        const rawBody = (await request.json().catch(() => null)) as unknown;
        if (!rawBody || typeof rawBody !== "object") {
          return new Response(JSON.stringify({ error: "Valid report payload required" }), {
            status: 400,
            headers: corsHeaders,
          });
        }
        const b = rawBody as {
          title?: string;
          category?: "Audit" | "Incident" | "Consent" | "Survey" | "Checklist";
          department?: string;
          departmentSlug?: string;
          author?: string;
          date?: string;
          score?: string;
          status?: "Completed" | "Reviewed" | "Pending Review";
          summary?: string;
        };

        if (!b.title || !b.department) {
          return new Response(JSON.stringify({ error: "title and department are required" }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const report = await dbAddReport({
          title: String(b.title).trim().slice(0, 200),
          category: b.category || "Audit",
          department: String(b.department).trim().slice(0, 100),
          departmentSlug: String(b.departmentSlug || "emergency-corridor")
            .trim()
            .slice(0, 80),
          author: String(b.author || "Clinical Quality Directorate")
            .trim()
            .slice(0, 100),
          date: b.date ? String(b.date).slice(0, 50) : undefined,
          score: b.score ? String(b.score).slice(0, 30) : undefined,
          status: b.status || "Completed",
          summary: b.summary ? String(b.summary).slice(0, 1000) : undefined,
        });

        return new Response(JSON.stringify(report), { status: 201, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    if (pathname.startsWith("/api/reports/")) {
      const id = decodeURIComponent(pathname.replace("/api/reports/", ""));
      if (request.method === "DELETE") {
        await dbDeleteReport(id);
        return new Response(JSON.stringify({ success: true, id }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    // -------------------------------------------------------------------------
    // FORMS & RESPONSES: /api/forms...
    // -------------------------------------------------------------------------
    // GET /api/forms/all-responses
    if (pathname === "/api/forms/all-responses") {
      if (request.method !== "GET") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: corsHeaders,
        });
      }
      const rawLimit = Number(url.searchParams.get("limit"));
      const limit = Number.isInteger(rawLimit) && rawLimit > 0 && rawLimit <= 500 ? rawLimit : 100;
      const responses = await dbGetAllResponses(limit);
      return new Response(JSON.stringify(responses), { status: 200, headers: corsHeaders });
    }

    // GET /api/forms?dept=<slug> or POST /api/forms
    if (pathname === "/api/forms") {
      if (request.method === "GET") {
        const dept = url.searchParams.get("dept")?.trim() || undefined;
        const forms = await dbGetAllForms(dept);
        return new Response(JSON.stringify(forms), { status: 200, headers: corsHeaders });
      }

      if (request.method === "POST") {
        const rawBody = (await request.json().catch(() => null)) as unknown;
        if (!rawBody || typeof rawBody !== "object") {
          return new Response(JSON.stringify({ error: "Valid JSON object required" }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const body = rawBody as {
          id?: string;
          title?: string;
          departmentSlug?: string;
          departmentLabel?: string;
          department?: string;
          description?: string;
          bannerUrl?: string;
          questions?: any[];
          createdAt?: string;
          updatedAt?: string;
        };
        const rawTitle = typeof body.title === "string" ? body.title.trim() : "";
        if (!rawTitle) {
          return new Response(JSON.stringify({ error: "Form title is required" }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const formId =
          typeof body.id === "string" && body.id.trim()
            ? body.id.trim().slice(0, 128)
            : `frm-${rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "form"}-${Date.now().toString(36)}`;

        const deptSlug =
          typeof body.departmentSlug === "string" && body.departmentSlug.trim()
            ? body.departmentSlug.trim()
            : typeof body.department === "string" && body.department.trim()
            ? body.department.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
            : "emergency-corridor";

        const deptLabel =
          typeof body.departmentLabel === "string" && body.departmentLabel.trim()
            ? body.departmentLabel.trim()
            : typeof body.department === "string" && body.department.trim()
            ? body.department.trim()
            : "ALERT Hospital";

        const rawQuestions = Array.isArray(body.questions) ? body.questions : [];
        const sanitizedQuestions = rawQuestions.map((q: any, idx: number) => ({
          id: String(q?.id || `q-${idx + 1}`),
          title: String(q?.title || q?.text || `Question ${idx + 1}`),
          type: (q?.type || "text") as any,
          required: Boolean(q?.required),
          options: Array.isArray(q?.options) ? q.options.map(String) : [],
          placeholder: q?.placeholder ? String(q.placeholder) : undefined,
          description: q?.description ? String(q.description) : undefined,
        }));

        const sanitizedForm: CustomForm = {
          id: formId,
          departmentSlug: deptSlug,
          departmentLabel: deptLabel,
          title: rawTitle.slice(0, 300),
          description: typeof body.description === "string" ? body.description.slice(0, 2000) : "",
          bannerUrl: body.bannerUrl ? String(body.bannerUrl).slice(0, 500) : undefined,
          questions: sanitizedQuestions,
          createdAt: typeof body.createdAt === "string" ? body.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const saved = await dbUpsertForm(sanitizedForm);
        return new Response(JSON.stringify({ ok: true, data: saved, ...saved }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    // Endpoints with /api/forms/:id/responses
    const matchResponses = pathname.match(/^\/api\/forms\/([^/]+)\/responses$/);
    if (matchResponses && matchResponses[1]) {
      const formId = decodeURIComponent(matchResponses[1]).trim().slice(0, 128);

      if (request.method === "GET") {
        const responses = await dbGetResponses(formId);
        return new Response(JSON.stringify(responses), { status: 200, headers: corsHeaders });
      }

      if (request.method === "POST") {
        const form = await dbGetFormById(formId);
        if (!form) {
          return new Response(JSON.stringify({ error: "Target form does not exist" }), {
            status: 404,
            headers: corsHeaders,
          });
        }

        const rawBody = (await request.json().catch(() => null)) as unknown;
        const body = (rawBody && typeof rawBody === "object" ? rawBody : {}) as {
          answers?: Record<string, unknown>;
        };

        const newResponse: FormResponse = {
          id: `RESP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          formId,
          submittedAt: new Date().toISOString(),
          answers: body.answers && typeof body.answers === "object" ? body.answers : {},
        };
        const saved = await dbSaveResponse(newResponse);
        return new Response(JSON.stringify({ ok: true, data: saved, ...saved }), { status: 201, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    // Endpoints with /api/forms/:id
    const matchSingle = pathname.match(/^\/api\/forms\/([^/]+)$/);
    if (matchSingle && matchSingle[1]) {
      const formId = decodeURIComponent(matchSingle[1]).trim().slice(0, 128);

      if (request.method === "GET") {
        const form = await dbGetFormById(formId);
        if (!form) {
          return new Response(JSON.stringify({ error: "Form not found" }), {
            status: 404,
            headers: corsHeaders,
          });
        }
        return new Response(JSON.stringify(form), { status: 200, headers: corsHeaders });
      }

      if (request.method === "DELETE") {
        const form = await dbGetFormById(formId);
        if (!form) {
          return new Response(JSON.stringify({ error: "Form not found" }), {
            status: 404,
            headers: corsHeaders,
          });
        }
        await dbDeleteForm(formId);
        return new Response(JSON.stringify({ success: true, id: formId }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: corsHeaders,
    });
  } catch (err: unknown) {
    console.error("API error in handleApiRequest:", err);
    return new Response(JSON.stringify({ error: "Internal server error. Please try again." }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
