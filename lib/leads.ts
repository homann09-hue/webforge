export type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";

export type Lead = {
  id: string;
  company: string;
  email: string;
  website: string | null;
  status: LeadStatus;
  created_at: string;
};

const SUPABASE_URL = "https://jplqdaxtnrqimlgzwuaw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_nZGbQRfpyHgjTyZ9XJBKRg_OBKT8R1V";

function headers() {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    "Content-Type": "application/json",
  };
}

export function isLeadStoreConfigured() {
  return true;
}

export async function createLead(input: {
  company: string;
  email: string;
  website?: string;
}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_lead`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      p_company: input.company,
      p_email: input.email,
      p_website: input.website || null,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("WEBFORGE_LEAD_STORE_ERROR", response.status, detail);
    throw new Error("LEAD_STORE_WRITE_FAILED");
  }
}

export async function listLeads(password: string, limit = 50): Promise<Lead[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_list_leads`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ p_password: password, p_limit: safeLimit }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("WEBFORGE_LEAD_LIST_ERROR", response.status, detail);
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error("LEAD_STORE_READ_FAILED");
  }

  return (await response.json()) as Lead[];
}

export async function updateLeadStatus(password: string, leadId: string, status: LeadStatus) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_update_lead_status`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      p_password: password,
      p_lead_id: leadId,
      p_status: status,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("WEBFORGE_LEAD_STATUS_ERROR", response.status, detail);
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error("LEAD_STATUS_UPDATE_FAILED");
  }
}
