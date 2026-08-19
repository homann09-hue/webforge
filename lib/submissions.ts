export type SubmissionReviewStatus = "new" | "reviewed" | "incorporated";

export type PortalSubmissionAdmin = {
  id: number;
  project_id: number;
  project_number?: string;
  project_name?: string;
  company?: string;
  kind: string;
  label: string;
  content: string | null;
  file_path: string | null;
  file_name: string | null;
  created_at: string;
  review_status: SubmissionReviewStatus;
  reviewed_at: string | null;
  reviewed_note: string | null;
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
    console.error(`WEBFORGE_SUBMISSION_RPC_${name}`, response.status, detail);
    if ([400,401,403].includes(response.status)) throw new Error("UNAUTHORIZED");
    throw new Error("SUBMISSION_RPC_FAILED");
  }
  return response;
}

export async function listAllSubmissions(password: string): Promise<PortalSubmissionAdmin[]> {
  const response = await rpc("admin_list_all_submissions", { p_password: password });
  return (await response.json()) as PortalSubmissionAdmin[];
}

export async function setSubmissionReview(password: string, submissionId: number, status: SubmissionReviewStatus, note: string) {
  await rpc("admin_set_submission_review", { p_password: password, p_submission_id: submissionId, p_status: status, p_note: note || null });
}

export async function getSubmissionFileUrl(password: string, submissionId: number): Promise<string> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-portal-file-url`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ password, submissionId }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok || !data?.url) {
    if (response.status === 401 || response.status === 403) throw new Error("UNAUTHORIZED");
    throw new Error("FILE_URL_FAILED");
  }
  return String(data.url);
}
