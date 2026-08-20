import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin-session";
import { updateLeadStatus, type LeadStatus } from "@/lib/leads";

const allowedStatuses: LeadStatus[] = ["new", "contacted", "qualified", "won", "lost"];

export async function POST(req: Request) {
  try {
    const session = await requireAdminSession();
    const body = await req.json();
    const leadId = Number(body.leadId);
    const status = String(body.status || "") as LeadStatus;

    if (!Number.isSafeInteger(leadId) || leadId <= 0 || !allowedStatuses.includes(status)) {
      return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
    }

    await updateLeadStatus(session, leadId, status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error, "Status konnte nicht gespeichert werden.");
  }
}
