export type Lead = {
  id: string;
  company: string;
  email: string;
  website: string | null;
  status: "new" | "contacted" | "qualified" | "won" | "lost";
  created_at: string;
};

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

function headers(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export function isLeadStoreConfigured() {
  return Boolean(config());
}

export async function createLead(input: {
  company: string;
  email: string;
  website?: string;
}) {
  const cfg = config();
  if (!cfg) throw new Error("LEAD_STORE_NOT_CONFIGURED");

  const response = await fetch(`${cfg.url}/rest/v1/leads`, {
    method: "POST",
    headers: {
      ...headers(cfg.key),
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      company: input.company,
      email: input.email,
      website: input.website || null,
      status: "new",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("WEBFORGE_LEAD_STORE_ERROR", response.status, detail);
    throw new Error("LEAD_STORE_WRITE_FAILED");
  }
}

export async function listLeads(limit = 50): Promise<Lead[]> {
  const cfg = config();
  if (!cfg) return [];

  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const response = await fetch(
    `${cfg.url}/rest/v1/leads?select=id,company,email,website,status,created_at&order=created_at.desc&limit=${safeLimit}`,
    {
      headers: headers(cfg.key),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    console.error("WEBFORGE_LEAD_LIST_ERROR", response.status, detail);
    throw new Error("LEAD_STORE_READ_FAILED");
  }

  return (await response.json()) as Lead[];
}
