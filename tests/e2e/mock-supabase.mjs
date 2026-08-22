/**
 * Isolated backend stand-in for browser end-to-end tests.
 *
 * Production uses Neon directly. This mock implements only the backend
 * contracts the app actually calls and is reachable only through the
 * localhost-only WEBFORGE_E2E_MODE transport adapter.
 */
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";

const PASSWORD = process.env.MOCK_ADMIN_PASSWORD || "test-password";
const EMAIL = process.env.MOCK_ADMIN_EMAIL || "admin@example.test";
const TOKEN_PATTERN = /^wf[su]_[0-9a-f]{64}$/;
const sessions = new Map();
const portalTokens = new Map();

let leads = [
  {
    id: 1,
    company: "Mustermann GmbH",
    email: "info@mustermann.de",
    website: "mustermann.de",
    status: "new",
    notes: null,
    last_contacted_at: null,
    archived_at: null,
    created_at: "2026-08-01T09:00:00Z",
    contact_name: "Erika Muster",
    phone: "0511 123456",
    package_name: "Business",
    setup_price_cents: 0,
    monthly_price_cents: 0,
    proposal_status: "none",
    customer_since: null,
  },
  {
    id: 2,
    company: "Nordwerk Handwerk",
    email: "kontakt@nordwerk.de",
    website: null,
    status: "contacted",
    notes: "Rückruf vereinbart",
    last_contacted_at: "2026-08-10T10:00:00Z",
    archived_at: null,
    created_at: "2026-08-05T11:00:00Z",
    contact_name: null,
    phone: null,
    package_name: null,
    setup_price_cents: 0,
    monthly_price_cents: 0,
    proposal_status: "none",
    customer_since: null,
  },
];

let offers = [];
let projects = [];
let invoices = [];
const projectTasks = new Map();
let nextOfferId = 1;
let nextProjectId = 1;
let nextTaskId = 1;
let nextInvoiceId = 1;
let nextPaymentId = 1;
export const calls = [];

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

function money(items, discountPercent = 0, taxPercent = 0) {
  const lines = items.map((item) => Math.round(item.quantity * item.unit_price_cents));
  const subtotal = lines.reduce((sum, value) => sum + value, 0);
  const discount = Math.round((subtotal * discountPercent) / 100);
  const net = subtotal - discount;
  const tax = Math.round((net * taxPercent) / 100);
  return { lines, subtotal, discount, net, tax, gross: net + tax };
}

function createProjectForAcceptedOffer(offer) {
  if (projects.some((project) => project.offer_id === offer.id)) return;
  const lead = leads.find((item) => item.id === offer.lead_id);
  const id = nextProjectId++;
  projects.push({
    id,
    lead_id: offer.lead_id,
    offer_id: offer.id,
    project_number: `PR-2026-${String(id).padStart(3, "0")}`,
    name: offer.title,
    status: "planning",
    progress: 0,
    domain: null,
    live_url: null,
    target_launch_date: null,
    notes: null,
    launched_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    onboarding_status: "not_started",
    content_deadline: null,
    logo_received: false,
    images_received: false,
    texts_received: false,
    domain_access_received: false,
    legal_data_received: false,
    company: lead?.company || "Kunde",
    contact_name: lead?.contact_name || null,
    email: lead?.email || "",
    offer_number: offer.offer_number,
  });
  projectTasks.set(id, []);
}

function publicProject(project) {
  return {
    project_id: project.id,
    project_number: project.project_number,
    name: project.name,
    status: project.status,
    progress: project.progress,
    target_launch_date: project.target_launch_date,
    content_deadline: project.content_deadline,
    onboarding_status: project.onboarding_status,
    logo_received: project.logo_received,
    images_received: project.images_received,
    texts_received: project.texts_received,
    domain_access_received: project.domain_access_received,
    legal_info_received: project.legal_data_received,
    company: project.company,
    contact_name: project.contact_name,
    tasks: projectTasks.get(project.id) || [],
    submissions: [],
  };
}

function runRpc(name, args) {
  switch (name) {
    case "admin_list_leads":
      return leads.filter((lead) => !lead.archived_at);

    case "admin_update_lead_status": {
      const lead = leads.find((item) => item.id === args.p_lead_id);
      if (lead) lead.status = args.p_status;
      return null;
    }

    case "admin_update_lead_notes": {
      const lead = leads.find((item) => item.id === args.p_lead_id);
      if (lead) lead.notes = args.p_notes;
      return null;
    }

    case "admin_update_lead_commercial": {
      const lead = leads.find((item) => item.id === args.p_lead_id);
      if (lead) {
        lead.contact_name = args.p_contact_name;
        lead.phone = args.p_phone;
        lead.package_name = args.p_package_name;
        lead.setup_price_cents = args.p_setup_price_cents;
        lead.monthly_price_cents = args.p_monthly_price_cents;
        lead.proposal_status = args.p_proposal_status;
      }
      return null;
    }

    case "admin_mark_lead_contacted": {
      const lead = leads.find((item) => item.id === args.p_lead_id);
      const now = new Date().toISOString();
      if (lead) lead.last_contacted_at = now;
      return now;
    }

    case "admin_archive_lead": {
      const lead = leads.find((item) => item.id === args.p_lead_id);
      if (lead) lead.archived_at = args.p_archived ? new Date().toISOString() : null;
      return null;
    }

    case "admin_delete_lead":
      leads = leads.filter((item) => item.id !== args.p_lead_id);
      return null;

    case "admin_list_offers":
      return args.p_lead_id ? offers.filter((offer) => offer.lead_id === args.p_lead_id) : offers;

    case "admin_create_offer": {
      const lead = leads.find((item) => item.id === args.p_lead_id) || leads[0];
      const items = (args.p_items || []).map((item, index) => ({
        id: index + 1,
        position: index + 1,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price_cents: item.unit_price_cents,
        line_total_cents: Math.round(item.quantity * item.unit_price_cents),
      }));
      const totals = money(items, args.p_discount_percent, args.p_tax_percent);
      const id = nextOfferId++;
      offers.push({
        id,
        lead_id: lead.id,
        offer_number: `AN-2026-${String(id).padStart(3, "0")}`,
        title: args.p_title,
        status: "draft",
        discount_percent: args.p_discount_percent,
        tax_percent: args.p_tax_percent,
        valid_until: args.p_valid_until,
        notes: args.p_notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        company: lead.company,
        contact_name: lead.contact_name,
        email: lead.email,
        items,
        subtotal_cents: totals.subtotal,
        discount_cents: totals.discount,
        net_cents: totals.net,
        tax_cents: totals.tax,
        gross_cents: totals.gross,
      });
      return id;
    }

    case "admin_update_offer_status": {
      const offer = offers.find((item) => item.id === args.p_offer_id);
      if (offer) {
        offer.status = args.p_status;
        offer.updated_at = new Date().toISOString();
        if (args.p_status === "accepted") createProjectForAcceptedOffer(offer);
      }
      return null;
    }

    case "admin_delete_offer":
      offers = offers.filter((item) => item.id !== args.p_offer_id);
      return null;

    case "admin_list_projects":
      return projects;

    case "admin_update_project": {
      const project = projects.find((item) => item.id === args.p_project_id);
      if (project) {
        project.status = args.p_status;
        project.progress = args.p_progress;
        project.domain = args.p_domain;
        project.live_url = args.p_live_url;
        project.target_launch_date = args.p_target_launch_date;
        project.notes = args.p_notes;
        project.updated_at = new Date().toISOString();
        if (args.p_status === "live" && !project.launched_at) project.launched_at = new Date().toISOString();
      }
      return null;
    }

    case "admin_save_project_onboarding": {
      const project = projects.find((item) => item.id === args.p_project_id);
      if (project) {
        project.onboarding_status = args.p_onboarding_status;
        project.content_deadline = args.p_content_deadline;
        project.logo_received = args.p_logo_received;
        project.images_received = args.p_images_received;
        project.texts_received = args.p_texts_received;
        project.domain_access_received = args.p_domain_access_received;
        project.legal_data_received = args.p_legal_data_received;
        project.updated_at = new Date().toISOString();
      }
      return null;
    }

    case "admin_project_tasks":
      return projectTasks.get(args.p_project_id) || [];

    case "admin_upsert_project_task": {
      const tasks = projectTasks.get(args.p_project_id) || [];
      const existing = tasks.find((task) => task.id === args.p_task_id);
      if (existing) {
        Object.assign(existing, {
          title: args.p_title,
          category: args.p_category,
          required: args.p_required,
          completed: args.p_completed,
          due_date: args.p_due_date,
          completed_at: args.p_completed ? new Date().toISOString() : null,
          notes: args.p_notes,
          sort_order: args.p_sort_order,
        });
        return existing.id;
      }
      const id = nextTaskId++;
      tasks.push({
        id,
        project_id: args.p_project_id,
        title: args.p_title,
        category: args.p_category,
        required: args.p_required,
        completed: args.p_completed,
        due_date: args.p_due_date,
        completed_at: args.p_completed ? new Date().toISOString() : null,
        notes: args.p_notes,
        sort_order: args.p_sort_order,
      });
      projectTasks.set(args.p_project_id, tasks);
      return id;
    }

    case "admin_delete_project_task": {
      const tasks = projectTasks.get(args.p_project_id) || [];
      projectTasks.set(
        args.p_project_id,
        tasks.filter((task) => task.id !== args.p_task_id),
      );
      return null;
    }

    case "admin_rotate_project_portal_token": {
      const project = projects.find((item) => item.id === args.p_project_id);
      if (!project) return null;
      const token = `wfp_${randomBytes(32).toString("hex")}`;
      portalTokens.set(token, project.id);
      return token;
    }

    case "admin_disable_project_portal": {
      for (const [token, projectId] of portalTokens) {
        if (projectId === args.p_project_id) portalTokens.delete(token);
      }
      return null;
    }

    case "admin_list_invoices":
      return invoices;

    case "admin_create_invoice": {
      const lead = leads.find((item) => item.id === args.p_lead_id) || leads[0];
      const project = projects.find((item) => item.id === args.p_project_id) || null;
      const items = (args.p_items || []).map((item, index) => ({
        id: index + 1,
        position: index + 1,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price_cents: item.unit_price_cents,
        line_total_cents: Math.round(item.quantity * item.unit_price_cents),
      }));
      const totals = money(items, 0, args.p_tax_percent);
      const id = nextInvoiceId++;
      invoices.push({
        id,
        lead_id: lead.id,
        project_id: project?.id || null,
        invoice_number: `RE-2026-${String(id).padStart(3, "0")}`,
        invoice_type: args.p_invoice_type,
        title: args.p_title,
        status: "draft",
        issue_date: args.p_issue_date || new Date().toISOString().slice(0, 10),
        due_date: args.p_due_date,
        tax_percent: args.p_tax_percent,
        notes: args.p_notes,
        company: lead.company,
        contact_name: lead.contact_name,
        email: lead.email,
        project_number: project?.project_number || null,
        project_name: project?.name || null,
        net_cents: totals.net,
        tax_cents: totals.tax,
        gross_cents: totals.gross,
        paid_cents: 0,
        balance_cents: totals.gross,
        created_at: new Date().toISOString(),
        items,
        payments: [],
      });
      return id;
    }

    case "admin_set_invoice_status": {
      const invoice = invoices.find((item) => item.id === args.p_invoice_id);
      if (invoice) invoice.status = args.p_status;
      return null;
    }

    case "admin_add_payment": {
      const invoice = invoices.find((item) => item.id === args.p_invoice_id);
      if (invoice) {
        invoice.payments.push({
          id: nextPaymentId++,
          amount_cents: args.p_amount_cents,
          method: args.p_method,
          reference: args.p_reference,
          paid_at: args.p_paid_at || new Date().toISOString(),
        });
        invoice.paid_cents += args.p_amount_cents;
        invoice.balance_cents = Math.max(0, invoice.gross_cents - invoice.paid_cents);
        if (invoice.balance_cents === 0) invoice.status = "paid";
      }
      return null;
    }

    case "admin_delete_invoice":
      invoices = invoices.filter((item) => item.id !== args.p_invoice_id);
      return null;

    case "admin_list_billing_subscriptions":
    case "admin_list_all_submissions":
      return [];

    default:
      return null;
  }
}

export function startMockBackend(port = 54321) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const body = await readBody(req);

    if (url.pathname === "/backend/admin-login") {
      const userLogin = body.email === EMAIL;
      const sharedLogin = !body.email;
      if ((!userLogin && !sharedLogin) || body.password !== PASSWORD) {
        return json(res, 401, { ok: false, error: "unauthorized" });
      }
      const token = `${userLogin ? "wfu" : "wfs"}_${randomBytes(32).toString("hex")}`;
      sessions.set(token, { revoked: false });
      return json(res, 200, { ok: true, token, expiresIn: 28800 });
    }

    if (url.pathname === "/backend/admin-logout") {
      const session = sessions.get(body.token);
      if (session) session.revoked = true;
      return json(res, 200, { ok: true });
    }

    if (url.pathname === "/backend/admin-gateway") {
      const credential = String(body.password || "");
      calls.push({ function: body.function, credential, args: body.args });

      if (!TOKEN_PATTERN.test(credential)) {
        return json(res, 401, { error: "expected a session token, got something else" });
      }
      const session = sessions.get(credential);
      if (!session || session.revoked) return json(res, 401, { error: "unauthorized" });
      return json(res, 200, runRpc(body.function, body.args || {}));
    }

    if (url.pathname === "/backend/portal-gateway") {
      const projectId = portalTokens.get(String(body.token || ""));
      if (!projectId) return json(res, 401, { ok: false, error: "unauthorized" });
      const project = projects.find((item) => item.id === projectId);
      if (!project) return json(res, 404, { ok: false, error: "not_found" });
      if (body.action === "get") return json(res, 200, { ok: true, project: publicProject(project) });
      if (body.action === "submit") return json(res, 201, { ok: true, id: 1 });
      return json(res, 400, { ok: false, error: "invalid_action" });
    }

    if (url.pathname === "/__test__/state") {
      return json(res, 200, {
        calls,
        leads,
        offers,
        projects,
        invoices,
        portals: [...portalTokens.entries()].map(([token, projectId]) => ({ token, projectId })),
        sessions: [...sessions.entries()].map(([token, session]) => ({ token, revoked: session.revoked })),
      });
    }

    if (url.pathname === "/backend/lead-submit") {
      if (!body.company || !body.email) return json(res, 400, { ok: false, error: "invalid" });
      return json(res, 201, { ok: true, id: 99, receivedClientIp: body.clientIp ?? null });
    }

    return json(res, 404, { error: "not_found" });
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve({ server, port, password: PASSWORD, calls, sessions }));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { port } = await startMockBackend(Number(process.env.MOCK_PORT) || 54321);
  console.log(`Mock-Backend laeuft auf http://localhost:${port}`);
}
