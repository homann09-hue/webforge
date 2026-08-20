import { NextResponse } from "next/server";
import { rotatePortalToken, disablePortal } from "@/lib/portal";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = String(body.password || "");
    const projectId = Number(body.projectId);
    const action = String(body.action || "");
    if (!password || !Number.isSafeInteger(projectId) || projectId <= 0)
      return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
    if (action === "rotate") {
      const token = await rotatePortalToken(password, projectId);
      return NextResponse.json({ ok: true, token });
    }
    if (action === "disable") {
      await disablePortal(password, projectId);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: "Unbekannte Aktion." }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, error: "Portal konnte nicht geändert werden." }, { status: 400 });
  }
}
