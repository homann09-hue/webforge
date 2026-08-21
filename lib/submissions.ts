import { backendFunctionFetch } from "@/lib/backend-transport";
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
  const response = await backendFunctionFetch(
    "admin-portal-file-url",
    { password: session, submissionId },
    { cache: "no-store" },
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok || !data?.url) {
    if (response.status === 401 || response.status === 403) throw new Error("UNAUTHORIZED");
    if (response.status === 429) throw new Error("RATE_LIMITED");
    if (response.status === 404) throw new Error("FILE_NOT_FOUND");
    if (response.status === 400) throw new Error("INVALID_REQUEST");
    throw new Error("FILE_URL_FAILED");
  }
  return String(data.url);
}
