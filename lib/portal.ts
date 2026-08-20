import { adminRpc } from "@/lib/admin-rpc";

export type PortalTask = {
  id: number;
  title: string;
  category: string;
  required: boolean;
  completed: boolean;
  due_date: string | null;
  notes: string | null;
};
export type PortalSubmission = {
  id: number;
  kind: "text" | "link" | "file";
  label: string;
  content: string | null;
  file_name: string | null;
  created_at: string;
};
export type PortalProject = {
  project_id: number;
  project_number: string;
  name: string;
  status: string;
  progress: number;
  target_launch_date: string | null;
  content_deadline: string | null;
  onboarding_status: string;
  logo_received: boolean;
  images_received: boolean;
  texts_received: boolean;
  domain_access_received: boolean;
  legal_info_received: boolean;
  company: string;
  contact_name: string | null;
  portal_expires_at?: string | null;
  tasks: PortalTask[];
  submissions: PortalSubmission[];
};
const URL = "https://jplqdaxtnrqimlgzwuaw.supabase.co";
const KEY = "sb_publishable_nZGbQRfpyHgjTyZ9XJBKRg_OBKT8R1V";
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
async function portalGateway(body: Record<string, unknown>) {
  const r = await fetch(`${URL}/functions/v1/portal-gateway`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data?.ok)
    throw new Error(
      r.status === 401 ? "PORTAL_UNAUTHORIZED" : r.status === 429 ? "PORTAL_RATE_LIMITED" : "PORTAL_RPC_FAILED",
    );
  return data;
}
export async function getPortalProject(token: string) {
  const data = await portalGateway({ action: "get", token });
  return data.project as PortalProject;
}
export async function submitPortal(token: string, kind: "text" | "link", label: string, content: string) {
  await portalGateway({ action: "submit", token, kind, label, content });
}
export async function rotatePortalToken(password: string, projectId: number) {
  const r = await adminRpc("admin_rotate_project_portal_token", { p_password: password, p_project_id: projectId });
  return (await r.json()) as string;
}
export async function disablePortal(password: string, projectId: number) {
  await adminRpc("admin_disable_project_portal", { p_password: password, p_project_id: projectId });
}
export const portalUploadUrl = "https://jplqdaxtnrqimlgzwuaw.supabase.co/functions/v1/portal-upload";
