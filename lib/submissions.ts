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

export async function getSubmissionFileUrl(_session: string, submissionId: number): Promise<string> {
  return `/api/admin/submissions/file/${submissionId}`;
}
