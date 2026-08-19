import { NextResponse } from "next/server";
import { updateLeadStatus, type LeadStatus } from "@/lib/leads";

const allowedStatuses: LeadStatus[] = ["new", "contacted", "qualified", "won", "lost"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = String(body.password || "");
    const leadId = String(body.leadId || "");
    const status = String(body.status || "") as LeadStatus;

    if (!password || !leadId || !allowedStatuses.includes(status)) {
      return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
    }

    await updateLeadStatus(password, leadId, status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: "Ungültiges Passwort." }, { status: 401 });
    }
    console.error("WEBFORGE_ADMIN_STATUS_ERROR", error);
    return NextResponse.json({ ok: false, error: "Status konnte nicht gespeichert werden." }, { status: 500 });
  }
}
