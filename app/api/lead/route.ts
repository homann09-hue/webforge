import { NextResponse } from "next/server";
import { createLead, LeadRateLimitError } from "@/lib/leads";
import { clientIpFrom, validateLeadInput } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const validated = validateLeadInput(body as Record<string, unknown>);

    if (!validated.ok) {
      // A tripped honeypot gets the same 201 a real submission gets, so a bot
      // cannot tell that it was filtered. Nothing is stored.
      if (validated.error === "SPAM") {
        console.warn("WEBFORGE_LEAD_HONEYPOT_TRIPPED");
        return NextResponse.json({ ok: true }, { status: 201 });
      }
      return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
    }

    await createLead({ ...validated.value, clientIp: clientIpFrom(req.headers) });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof LeadRateLimitError) {
      return NextResponse.json(
        { ok: false, error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
        { status: 429 },
      );
    }
    console.error("WEBFORGE_LEAD_REQUEST_ERROR", error);
    return NextResponse.json({ ok: false, error: "Anfrage konnte nicht gespeichert werden." }, { status: 500 });
  }
}
