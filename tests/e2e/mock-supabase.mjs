/**
 * Isolated backend stand-in for browser end-to-end tests.
 *
 * Production uses Neon directly. This mock implements only the backend
 * contracts the app actually calls and is reachable only through the
 * localhost-only WEBFORGE_E2E_MODE transport adapter.
 *
 * Important invariants:
 * - admin-login issues a token matching /^wfs_[0-9a-f]{64}$/
 * - admin-gateway refuses raw passwords and only accepts issued session tokens
 * - 401/429 semantics match the production contract
 */
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";

const PASSWORD = process.env.MOCK_ADMIN_PASSWORD || "test-password";
const TOKEN_PATTERN = /^wfs_[0-9a-f]{64}$/;
const sessions = new Map();

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
let nextOfferId = 1;
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

function money(items, discountPercent, taxPercent) {
  const lines = items.map((item) => Math.round(item.quantity * item.unit_price_cents));
  const subtotal = lines.reduce((sum, value) => sum + value, 0);
  const discount = Math.round((subtotal * (discountPercent || 0)) / 100);
  const net = subtotal - discount;
  const tax = Math.round((net * (taxPercent || 0)) / 100);
  return { lines, subtotal, discount, net, tax, gross: net + tax };
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
      return offers;

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
      if (offer) offer.status = args.p_status;
      return null;
    }

    case "admin_delete_offer":
      offers = offers.filter((item) => item.id !== args.p_offer_id);
      return null;

    case "admin_list_projects":
    case "admin_list_invoices":
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
      if (body.password !== PASSWORD) return json(res, 401, { ok: false, error: "unauthorized" });
      const token = `wfs_${randomBytes(32).toString("hex")}`;
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

    if (url.pathname === "/__test__/state") {
      return json(res, 200, {
        calls,
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
