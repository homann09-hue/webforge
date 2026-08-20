import { NextResponse } from "next/server";
import { archiveLead, deleteLead, markLeadContacted, updateLeadNotes } from "@/lib/leads";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = String(body.password || "");
    const leadId = Number(body.leadId);
    const action = String(body.action || "");

    if (!password || !Number.isInteger(leadId) || leadId <= 0) {
      return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
    }

    if (action === "notes") {
      const notes = String(body.notes || "");
      if (notes.length > 5000) return NextResponse.json({ ok: false, error: "Notiz ist zu lang." }, { status: 400 });
      await updateLeadNotes(password, leadId, notes);
      return NextResponse.json({ ok: true });
    }

    if (action === "contacted") {
      const lastContactedAt = await markLeadContacted(password, leadId);
      return NextResponse.json({ ok: true, lastContactedAt });
    }

    if (action === "archive") {
      await archiveLead(password, leadId, Boolean(body.archived));
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      await deleteLead(password, leadId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED")
      return NextResponse.json({ ok: false, error: "Ungültiges Passwort." }, { status: 401 });
    console.error("WEBFORGE_ADMIN_MANAGE_ERROR", error);
    return NextResponse.json({ ok: false, error: "Änderung konnte nicht gespeichert werden." }, { status: 500 });
  }
}
