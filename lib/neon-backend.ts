import { getNeonSql } from "@/lib/neon-db";

const ADMIN_FUNCTIONS = new Set([
  "admin_add_payment",
  "admin_archive_lead",
  "admin_create_billing_subscription",
  "admin_create_invoice",
  "admin_create_offer",
  "admin_delete_invoice",
  "admin_delete_lead",
  "admin_delete_offer",
  "admin_delete_project_task",
  "admin_disable_project_portal",
  "admin_generate_due_recurring_invoices",
  "admin_list_all_submissions",
  "admin_list_billing_subscriptions",
  "admin_list_invoices",
  "admin_list_leads",
  "admin_list_offers",
  "admin_list_project_submissions",
  "admin_list_projects",
  "admin_mark_lead_contacted",
  "admin_project_tasks",
  "admin_rotate_project_portal_token",
  "admin_save_project_onboarding",
  "admin_set_billing_subscription_status",
  "admin_set_billing_subscription_stripe",
  "admin_set_invoice_status",
  "admin_set_submission_review",
  "admin_update_lead_commercial",
  "admin_update_lead_notes",
  "admin_update_lead_status",
  "admin_update_offer_status",
  "admin_update_project",
  "admin_upsert_project_task",
]);

const TABLE_FUNCTIONS = new Set(["admin_list_leads", "admin_project_tasks"]);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes("rate_limited")) return jsonResponse({ ok: false, error: "rate_limited" }, 429);
  if (message.includes("unauthorized")) return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  if (
    message.includes("invalid_") ||
    message.includes("not_found") ||
    message.includes("cannot_delete") ||
    message.includes("notes_too_long")
  ) {
    return jsonResponse({ ok: false, error: "invalid_request" }, 400);
  }

  console.error("WEBFORGE_NEON_BACKEND_FAILED", error);
  return jsonResponse({ ok: false, error: "backend_failed" }, 500);
}

async function adminLogin(body: Record<string, unknown>): Promise<Response> {
  try {
    const password = typeof body.password === "string" ? body.password : "";
    const sql = getNeonSql();
    const rows = await sql`select public.internal_admin_create_session(${password}) as token`;
    const token = rows[0]?.token;
    if (typeof token !== "string") return jsonResponse({ ok: false }, 401);
    return jsonResponse({ ok: true, token, expiresIn: 60 * 60 * 8 });
  } catch (error) {
    return errorResponse(error);
  }
}

async function adminLogout(body: Record<string, unknown>): Promise<Response> {
  try {
    const token = typeof body.token === "string" ? body.token : "";
    const sql = getNeonSql();
    await sql`select public.internal_admin_revoke_session(${token})`;
    return jsonResponse({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

async function leadSubmit(body: Record<string, unknown>): Promise<Response> {
  try {
    const company = typeof body.company === "string" ? body.company : "";
    const email = typeof body.email === "string" ? body.email : "";
    const website = typeof body.website === "string" ? body.website : null;
    const clientIp = typeof body.clientIp === "string" ? body.clientIp : null;
    const sql = getNeonSql();
    const rows = await sql`
      select public.internal_submit_lead(
        ${company},
        ${email},
        ${website},
        ${clientIp}::inet
      ) as id
    `;
    return jsonResponse({ ok: true, id: Number(rows[0]?.id) }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

async function adminGateway(body: Record<string, unknown>): Promise<Response> {
  const credential = typeof body.password === "string" ? body.password : "";
  const name = typeof body.function === "string" ? body.function : "";
  const args = body.args && typeof body.args === "object" && !Array.isArray(body.args)
    ? (body.args as Record<string, unknown>)
    : {};

  if (!ADMIN_FUNCTIONS.has(name)) return jsonResponse({ ok: false, error: "invalid_request" }, 400);

  const entries = Object.entries(args);
  for (const [key] of entries) {
    if (!/^p_[a-z0-9_]+$/.test(key)) return jsonResponse({ ok: false, error: "invalid_request" }, 400);
  }

  try {
    const sql = getNeonSql();
    const values = [credential, ...entries.map(([, value]) => value)];
    const named = ["p_password => $1", ...entries.map(([key], index) => `${key} => $${index + 2}`)].join(", ");

    if (TABLE_FUNCTIONS.has(name)) {
      const rows = await sql.query(`select * from public.${name}(${named})`, values);
      return jsonResponse(rows);
    }

    const rows = await sql.query(`select public.${name}(${named}) as result`, values);
    return jsonResponse(rows[0]?.result ?? null);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function neonBackendFunctionFetch(name: string, body: Record<string, unknown>): Promise<Response> {
  switch (name) {
    case "admin-login":
      return adminLogin(body);
    case "admin-logout":
      return adminLogout(body);
    case "lead-submit":
      return leadSubmit(body);
    case "admin-gateway":
      return adminGateway(body);
    default:
      return jsonResponse({ ok: false, error: "not_migrated" }, 501);
  }
}
