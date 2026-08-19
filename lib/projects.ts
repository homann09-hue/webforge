export type ProjectStatus = "planning" | "waiting_content" | "design" | "development" | "review" | "live" | "paused" | "cancelled";

export type CustomerProject = {
  id: number;
  lead_id: number;
  offer_id: number | null;
  project_number: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  domain: string | null;
  live_url: string | null;
  target_launch_date: string | null;
  notes: string | null;
  launched_at: string | null;
  created_at: string;
  updated_at: string;
  company: string;
  contact_name: string | null;
  email: string;
  offer_number: string | null;
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
    console.error(`WEBFORGE_PROJECT_RPC_${name}`, response.status, detail);
    if (response.status === 400 || response.status === 401 || response.status === 403) throw new Error("UNAUTHORIZED");
    throw new Error("PROJECT_RPC_FAILED");
  }
  return response;
}

export async function listProjects(password: string): Promise<CustomerProject[]> {
  const response = await rpc("admin_list_projects", { p_password: password });
  return (await response.json()) as CustomerProject[];
}

export async function updateProject(password: string, projectId: number, input: {
  status: ProjectStatus;
  progress: number;
  domain: string;
  liveUrl: string;
  targetLaunchDate: string;
  notes: string;
}) {
  await rpc("admin_update_project", {
    p_password: password,
    p_project_id: projectId,
    p_status: input.status,
    p_progress: input.progress,
    p_domain: input.domain || null,
    p_live_url: input.liveUrl || null,
    p_target_launch_date: input.targetLaunchDate || null,
    p_notes: input.notes || null,
  });
}
