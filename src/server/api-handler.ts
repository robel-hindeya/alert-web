import {
  dbGetAllForms,
  dbGetFormById,
  dbUpsertForm,
  dbDeleteForm,
  dbSaveResponse,
  dbGetResponses,
} from "./db.ts";
import type { CustomForm, FormResponse } from "../lib/form-types.ts";

export async function handleApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (!pathname.startsWith("/api/forms")) {
    return null;
  }

  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // GET /api/forms?dept=<slug>
    if (pathname === "/api/forms" && request.method === "GET") {
      const dept = url.searchParams.get("dept") || undefined;
      const forms = dbGetAllForms(dept);
      return new Response(JSON.stringify(forms), { status: 200, headers: corsHeaders });
    }

    // POST /api/forms
    if (pathname === "/api/forms" && request.method === "POST") {
      const body = (await request.json()) as CustomForm;
      if (!body.id || !body.title) {
        return new Response(JSON.stringify({ error: "id and title are required" }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      const saved = dbUpsertForm(body);
      return new Response(JSON.stringify(saved), { status: 200, headers: corsHeaders });
    }

    // Endpoints with /api/forms/:id/...
    const matchResponses = pathname.match(/^\/api\/forms\/([^/]+)\/responses$/);
    if (matchResponses) {
      const formId = decodeURIComponent(matchResponses[1]);

      if (request.method === "GET") {
        const responses = dbGetResponses(formId);
        return new Response(JSON.stringify(responses), { status: 200, headers: corsHeaders });
      }

      if (request.method === "POST") {
        const body = (await request.json()) as { answers: Record<string, any> };
        const newResponse: FormResponse = {
          id: `RESP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          formId,
          submittedAt: new Date().toISOString(),
          answers: body.answers || {},
        };
        const saved = dbSaveResponse(newResponse);
        return new Response(JSON.stringify(saved), { status: 201, headers: corsHeaders });
      }
    }

    const matchSingle = pathname.match(/^\/api\/forms\/([^/]+)$/);
    if (matchSingle) {
      const formId = decodeURIComponent(matchSingle[1]);

      if (request.method === "GET") {
        const form = dbGetFormById(formId);
        if (!form) {
          return new Response(JSON.stringify({ error: "Form not found" }), {
            status: 404,
            headers: corsHeaders,
          });
        }
        return new Response(JSON.stringify(form), { status: 200, headers: corsHeaders });
      }

      if (request.method === "DELETE") {
        dbDeleteForm(formId);
        return new Response(JSON.stringify({ success: true, id: formId }), {
          status: 200,
          headers: corsHeaders,
        });
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: corsHeaders,
    });
  } catch (err: any) {
    console.error("API error in handleApiRequest:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
