import { edgeFunctionUrl, supabaseHeaders } from "@/lib/supabase-env";
import { adminRpc } from "@/lib/admin-rpc";

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

export async function listAllSubmissions(session: string): Promise<PortalSubmissionAdmin[]> {
  const response = await adminRpc("admin_list_all_submissions", session);
  return (await response.json()) as PortalSubmissionAdmin[];
}

export async function setSubmissionReview(
  session: string,
  submissionId: number,
  status: SubmissionReviewStatus,
  note: string,
) {
  await adminRpc("admin_set_submission_review", session, {
    p_submission_id: submissionId,
    p_status: status,
    p_note: note || null,
  });
}

export async function getSubmissionFileUrl(session: string, submissionId: number): Promise<string> {
  const response = await fetch(edgeFunctionUrl("admin-portal-file-url"), {
    method: "POST",
    headers: supabaseHeaders(),
    // The Edge Function still names the credential field "password";
    // it accepts a session token in that field.
    body: JSON.stringify({ password: session, submissionId }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok || !data?.url) {
    if (response.status === 401 || response.status === 403) throw new Error("UNAUTHORIZED");
    throw new Error("FILE_URL_FAILED");
  }
  return String(data.url);
}
