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
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function firstRow(result: unknown): Record<string, unknown> | undefined {
  return Array.isArray(result) && result.length > 0 && result[0] && typeof result[0] === "object"
    ? (result[0] as Record<string, unknown>)
    : undefined;
}

function rowArray(result: unknown): Record<string, unknown>[] {
  return Array.isArray(result) ? (result as Record<string, unknown>[]) : [];
}

function errorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("rate_limited")) return jsonResponse({ ok: false, error: "rate_limited" }, 429);
  if (message.includes("unauthorized") || message.includes("invalid_portal_token")) {
    return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  }
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

function entityType(name: string): string {
  if (name.includes("lead")) return "lead";
  if (name.includes("offer")) return "offer";
  if (name.includes("project")) return "project";
  if (name.includes("invoice") || name.includes("payment")) return "billing";
  if (name.includes("subscription")) return "subscription";
  if (name.includes("submission")) return "submission";
  return "admin";
}

async function writeAuditLog(name: string, args: Record<string, unknown>): Promise<void> {
  try {
    const sql = getNeonSql();
    const idEntry = Object.entries(args).find(([key, value]) => key.endsWith("_id") && value != null);
    const metadata = { keys: Object.keys(args), status: args.p_status ?? null };
    await sql`
      insert into public.admin_audit_log(action, entity_type, entity_id, actor, metadata)
      values (${name}, ${entityType(name)}, ${idEntry ? String(idEntry[1]) : null}, 'admin', ${JSON.stringify(metadata)}::jsonb)
    `;
  } catch (error) {
    console.error("WEBFORGE_NEON_AUDIT_LOG_FAILED", error);
  }
}

async function adminLogin(body: Record<string, unknown>): Promise<Response> {
  try {
    const password = typeof body.password === "string" ? body.password : "";
    const sql = getNeonSql();
    const result = await sql`select public.internal_admin_create_session(${password}) as token`;
    const token = firstRow(result)?.token;
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
    const result = await sql`
      select public.internal_submit_lead(${company}, ${email}, ${website}, ${clientIp}::inet) as id
    `;
    return jsonResponse({ ok: true, id: Number(firstRow(result)?.id) }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

async function portalGateway(body: Record<string, unknown>): Promise<Response> {
  const action = typeof body.action === "string" ? body.action : "";
  const token = typeof body.token === "string" ? body.token : "";
  if (token.length < 40 || token.length > 128) return jsonResponse({ ok: false, error: "invalid_portal_token" }, 401);

  try {
    const sql = getNeonSql();
    if (action === "get") {
      const result = await sql`select public.portal_get_project(${token}) as project`;
      return jsonResponse({ ok: true, project: firstRow(result)?.project ?? null });
    }
    if (action === "submit") {
      const kind = typeof body.kind === "string" ? body.kind : "";
      const label = typeof body.label === "string" ? body.label : "";
      const content = typeof body.content === "string" ? body.content : "";
      if (kind !== "text" && kind !== "link") return jsonResponse({ ok: false, error: "invalid_submission" }, 400);
      const result = await sql`select public.portal_submit(${token}, ${kind}, ${label}, ${content}) as id`;
      return jsonResponse({ ok: true, id: firstRow(result)?.id ?? null }, 201);
    }
    return jsonResponse({ ok: false, error: "invalid_action" }, 400);
  } catch (error) {
    return errorResponse(error);
  }
}

async function adminGateway(body: Record<string, unknown>): Promise<Response> {
  const credential = typeof body.password === "string" ? body.password : "";
  const name = typeof body.function === "string" ? body.function : "";
  const args =
    body.args && typeof body.args === "object" && !Array.isArray(body.args)
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
      const result = await sql.query(`select * from public.${name}(${named})`, values);
      await writeAuditLog(name, args);
      return jsonResponse(rowArray(result));
    }
    const result = await sql.query(`select public.${name}(${named}) as result`, values);
    await writeAuditLog(name, args);
    return jsonResponse(firstRow(result)?.result ?? null);
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
    case "portal-gateway":
      return portalGateway(body);
    case "admin-gateway":
      return adminGateway(body);
    default:
      return jsonResponse({ ok: false, error: "not_migrated" }, 501);
  }
}
