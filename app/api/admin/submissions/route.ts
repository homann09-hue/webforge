import { NextResponse } from "next/server";
import {
  getSubmissionFileUrl,
  listAllSubmissions,
  setSubmissionReview,
  type SubmissionReviewStatus,
} from "@/lib/submissions";

const allowed: SubmissionReviewStatus[] = ["new", "reviewed", "incorporated"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = String(body.password || "");
    const action = String(body.action || "list");
    if (!password) return NextResponse.json({ ok: false, error: "Passwort fehlt." }, { status: 400 });

    if (action === "list") {
      const submissions = await listAllSubmissions(password);
      return NextResponse.json({ ok: true, submissions });
    }

    if (action === "review") {
      const submissionId = Number(body.submissionId);
      const status = String(body.status || "") as SubmissionReviewStatus;
      const note = String(body.note || "").trim();
      if (!Number.isSafeInteger(submissionId) || submissionId <= 0 || !allowed.includes(status) || note.length > 2000) {
        return NextResponse.json({ ok: false, error: "Ungültige Abgabe." }, { status: 400 });
      }
      await setSubmissionReview(password, submissionId, status, note);
      return NextResponse.json({ ok: true });
    }

    if (action === "file-url") {
      const submissionId = Number(body.submissionId);
      if (!Number.isSafeInteger(submissionId) || submissionId <= 0)
        return NextResponse.json({ ok: false, error: "Ungültige Datei." }, { status: 400 });
      const url = await getSubmissionFileUrl(password, submissionId);
      return NextResponse.json({ ok: true, url });
    }

    return NextResponse.json({ ok: false, error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED")
      return NextResponse.json({ ok: false, error: "Ungültiges Passwort." }, { status: 401 });
    console.error("WEBFORGE_SUBMISSIONS_API_ERROR", error);
    return NextResponse.json({ ok: false, error: "Kundenabgaben konnten nicht verarbeitet werden." }, { status: 500 });
  }
}
