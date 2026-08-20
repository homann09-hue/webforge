import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin-session";
import { archiveLead, deleteLead, markLeadContacted, updateLeadNotes } from "@/lib/leads";

export async function POST(req: Request) {
  try {
    const session = await requireAdminSession();
    const body = await req.json();
    const leadId = Number(body.leadId);
    const action = String(body.action || "");

    if (!Number.isInteger(leadId) || leadId <= 0) {
      return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
    }

    if (action === "notes") {
      const notes = String(body.notes || "");
      if (notes.length > 5000) return NextResponse.json({ ok: false, error: "Notiz ist zu lang." }, { status: 400 });
      await updateLeadNotes(session, leadId, notes);
      return NextResponse.json({ ok: true });
    }

    if (action === "contacted") {
      const lastContactedAt = await markLeadContacted(session, leadId);
      return NextResponse.json({ ok: true, lastContactedAt });
    }

    if (action === "archive") {
      await archiveLead(session, leadId, Boolean(body.archived));
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      await deleteLead(session, leadId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) {
    return adminErrorResponse(error, "Änderung konnte nicht gespeichert werden.");
  }
}
