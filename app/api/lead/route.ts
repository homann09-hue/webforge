import { NextResponse } from "next/server";
import { createLead, isLeadStoreConfigured } from "@/lib/leads";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const company = String(body.company || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const website = String(body.website || "").trim();

    if (
      company.length < 2 ||
      company.length > 120 ||
      !validEmail(email) ||
      email.length > 254 ||
      website.length > 300
    ) {
      return NextResponse.json({ ok: false, error: "Bitte Unternehmen und gültige E-Mail angeben." }, { status: 400 });
    }

    if (!isLeadStoreConfigured()) {
      console.error("WEBFORGE_LEAD_STORE_NOT_CONFIGURED");
      return NextResponse.json(
        { ok: false, error: "Anfragen können gerade nicht gespeichert werden. Bitte später erneut versuchen." },
        { status: 503 },
      );
    }

    await createLead({ company, email, website });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("WEBFORGE_LEAD_REQUEST_ERROR", error);
    return NextResponse.json({ ok: false, error: "Anfrage konnte nicht gespeichert werden." }, { status: 500 });
  }
}
