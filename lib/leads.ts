import { adminRpc } from "@/lib/admin-rpc";

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
const publicHeaders = { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`, "Content-Type": "application/json" };

export function isLeadStoreConfigured() { return true; }
export async function createLead(input: { company: string; email: string; website?: string }) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/lead-submit`, {
    method: "POST",
    headers: publicHeaders,
    body: JSON.stringify({ company: input.company, email: input.email, website: input.website || null }),
    cache: "no-store",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(String(data?.error || "LEAD_SUBMIT_FAILED"));
  }
}
export async function listLeads(password: string, limit = 100): Promise<Lead[]> { const response = await adminRpc("admin_list_leads", { p_password: password, p_limit: Math.min(Math.max(limit, 1), 200) }); return (await response.json()) as Lead[]; }
export async function updateLeadStatus(password: string, leadId: number, status: LeadStatus) { await adminRpc("admin_update_lead_status", { p_password: password, p_lead_id: leadId, p_status: status }); }
export async function updateLeadNotes(password: string, leadId: number, notes: string) { await adminRpc("admin_update_lead_notes", { p_password: password, p_lead_id: leadId, p_notes: notes }); }
export async function markLeadContacted(password: string, leadId: number): Promise<string> { const response = await adminRpc("admin_mark_lead_contacted", { p_password: password, p_lead_id: leadId }); return await response.json() as string; }
export async function archiveLead(password: string, leadId: number, archived: boolean) { await adminRpc("admin_archive_lead", { p_password: password, p_lead_id: leadId, p_archived: archived }); }
export async function deleteLead(password: string, leadId: number) { await adminRpc("admin_delete_lead", { p_password: password, p_lead_id: leadId }); }
export async function updateLeadCommercial(password: string, leadId: number, input: { contactName: string; phone: string; packageName: string; setupPriceCents: number; monthlyPriceCents: number; proposalStatus: ProposalStatus }) {
  await adminRpc("admin_update_lead_commercial", {
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
