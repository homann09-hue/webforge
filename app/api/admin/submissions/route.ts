import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin-session";
import {
  getSubmissionFileUrl,
  listAllSubmissions,
  setSubmissionReview,
  type SubmissionReviewStatus,
} from "@/lib/submissions";

const allowed: SubmissionReviewStatus[] = ["new", "reviewed", "incorporated"];

export async function POST(req: Request) {
  try {
    const session = await requireAdminSession();
    const body = await req.json();
    const action = String(body.action || "list");

    if (action === "list") {
      const submissions = await listAllSubmissions(session);
      return NextResponse.json({ ok: true, submissions });
    }

    if (action === "review") {
      const submissionId = Number(body.submissionId);
      const status = String(body.status || "") as SubmissionReviewStatus;
      const note = String(body.note || "").trim();
      if (!Number.isSafeInteger(submissionId) || submissionId <= 0 || !allowed.includes(status) || note.length > 2000) {
        return NextResponse.json({ ok: false, error: "Ungültige Abgabe." }, { status: 400 });
      }
      await setSubmissionReview(session, submissionId, status, note);
      return NextResponse.json({ ok: true });
    }

    if (action === "file-url") {
      const submissionId = Number(body.submissionId);
      if (!Number.isSafeInteger(submissionId) || submissionId <= 0)
        return NextResponse.json({ ok: false, error: "Ungültige Datei." }, { status: 400 });
      const url = await getSubmissionFileUrl(session, submissionId);
      return NextResponse.json({ ok: true, url });
    }

    return NextResponse.json({ ok: false, error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) {
    return adminErrorResponse(error, "Kundenabgaben konnten nicht verarbeitet werden.");
  }
}
