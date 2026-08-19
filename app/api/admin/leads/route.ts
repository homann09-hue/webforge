import { NextResponse } from "next/server";
import { listLeads } from "@/lib/leads";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = String(body.password || "");
    if (!password) {
      return NextResponse.json({ ok: false, error: "Passwort fehlt." }, { status: 400 });
    }

    const leads = await listLeads(password, 50);
    return NextResponse.json({ ok: true, leads });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: "Ungültiges Passwort." }, { status: 401 });
    }
    console.error("WEBFORGE_ADMIN_LEADS_ERROR", error);
    return NextResponse.json({ ok: false, error: "Leads konnten nicht geladen werden." }, { status: 500 });
  }
}
