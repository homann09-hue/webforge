export type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";
export type ProposalStatus = "none" | "draft" | "sent" | "accepted" | "rejected";

export type Lead = {
  id: number;
  company: string;
  email: string;
  website: string | null;
  status: LeadStatus;
  notes: string | null;
  last_contacted_at: string | null;
  archived_at: string | null;
  created_at: string;
  contact_name: string | null;
  phone: string | null;
  package_name: string | null;
  setup_price_cents: number;
  monthly_price_cents: number;
  proposal_status: ProposalStatus;
  customer_since: string | null;
};

const SUPABASE_URL = "https://jplqdaxtnrqimlgzwuaw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_nZGbQRfpyHgjTyZ9XJBKRg_OBKT8R1V";

function headers() {
  return { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`, "Content-Type": "application/json" };
}

async function rpc(name: string, body: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, { method: "POST", headers: headers(), body: JSON.stringify(body), cache: "no-store" });
  if (!response.ok) {
    const detail = await response.text();
    console.error(`WEBFORGE_RPC_${name}`, response.status, detail);
    if (response.status === 400 || response.status === 401 || response.status === 403) throw new Error("UNAUTHORIZED");
    throw new Error("RPC_FAILED");
  }
  return response;
}

export function isLeadStoreConfigured() { return true; }
export async function createLead(input: { company: string; email: string; website?: string }) { await rpc("submit_lead", { p_company: input.company, p_email: input.email, p_website: input.website || null }); }
export async function listLeads(password: string, limit = 100): Promise<Lead[]> { const response = await rpc("admin_list_leads", { p_password: password, p_limit: Math.min(Math.max(limit, 1), 200) }); return (await response.json()) as Lead[]; }
export async function updateLeadStatus(password: string, leadId: number, status: LeadStatus) { await rpc("admin_update_lead_status", { p_password: password, p_lead_id: leadId, p_status: status }); }
export async function updateLeadNotes(password: string, leadId: number, notes: string) { await rpc("admin_update_lead_notes", { p_password: password, p_lead_id: leadId, p_notes: notes }); }
export async function markLeadContacted(password: string, leadId: number): Promise<string> { const response = await rpc("admin_mark_lead_contacted", { p_password: password, p_lead_id: leadId }); return await response.json() as string; }
export async function archiveLead(password: string, leadId: number, archived: boolean) { await rpc("admin_archive_lead", { p_password: password, p_lead_id: leadId, p_archived: archived }); }
export async function deleteLead(password: string, leadId: number) { await rpc("admin_delete_lead", { p_password: password, p_lead_id: leadId }); }
export async function updateLeadCommercial(password: string, leadId: number, input: { contactName: string; phone: string; packageName: string; setupPriceCents: number; monthlyPriceCents: number; proposalStatus: ProposalStatus }) {
  await rpc("admin_update_lead_commercial", {
    p_password: password,
    p_lead_id: leadId,
    p_contact_name: input.contactName,
    p_phone: input.phone,
    p_package_name: input.packageName,
    p_setup_price_cents: input.setupPriceCents,
    p_monthly_price_cents: input.monthlyPriceCents,
    p_proposal_status: input.proposalStatus,
  });
}
