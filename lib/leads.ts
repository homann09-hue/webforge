import { backendFunctionFetch } from "@/lib/backend-transport";
import { adminRpc } from "@/lib/admin-rpc";

export type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";
export type ProposalStatus = "none" | "draft" | "sent" | "accepted" | "rejected";

export class LeadRateLimitError extends Error {
  constructor() {
    super("RATE_LIMITED");
    this.name = "LeadRateLimitError";
  }
}

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

export async function createLead(input: {
  company: string;
  email: string;
  website?: string;
  /** Real visitor address — the backend keys its rate limit on it. */
  clientIp?: string | null;
}) {
  const response = await backendFunctionFetch(
    "lead-submit",
    {
      company: input.company,
      email: input.email,
      website: input.website || null,
      clientIp: input.clientIp || null,
    },
    { cache: "no-store" },
  );
  if (!response.ok) {
    if (response.status === 429) throw new LeadRateLimitError();
    const data = await response.json().catch(() => ({}));
    throw new Error(String(data?.error || "LEAD_SUBMIT_FAILED"));
  }
}
export async function listLeads(session: string, limit = 100): Promise<Lead[]> {
  const response = await adminRpc("admin_list_leads", session, { p_limit: Math.min(Math.max(limit, 1), 200) });
  return (await response.json()) as Lead[];
}
export async function updateLeadStatus(session: string, leadId: number, status: LeadStatus) {
  await adminRpc("admin_update_lead_status", session, { p_lead_id: leadId, p_status: status });
}
export async function updateLeadNotes(session: string, leadId: number, notes: string) {
  await adminRpc("admin_update_lead_notes", session, { p_lead_id: leadId, p_notes: notes });
}
export async function markLeadContacted(session: string, leadId: number): Promise<string> {
  const response = await adminRpc("admin_mark_lead_contacted", session, { p_lead_id: leadId });
  return (await response.json()) as string;
}
export async function archiveLead(session: string, leadId: number, archived: boolean) {
  await adminRpc("admin_archive_lead", session, { p_lead_id: leadId, p_archived: archived });
}
export async function deleteLead(session: string, leadId: number) {
  await adminRpc("admin_delete_lead", session, { p_lead_id: leadId });
}
export async function updateLeadCommercial(
  session: string,
  leadId: number,
  input: {
    contactName: string;
    phone: string;
    packageName: string;
    setupPriceCents: number;
    monthlyPriceCents: number;
    proposalStatus: ProposalStatus;
  },
) {
  await adminRpc("admin_update_lead_commercial", session, {
    p_lead_id: leadId,
    p_contact_name: input.contactName,
    p_phone: input.phone,
    p_package_name: input.packageName,
    p_setup_price_cents: input.setupPriceCents,
    p_monthly_price_cents: input.monthlyPriceCents,
    p_proposal_status: input.proposalStatus,
  });
}
