import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin-session";
import { rotatePortalToken, disablePortal } from "@/lib/portal";

export async function POST(req: Request) {
  try {
    const session = await requireAdminSession();
    const body = await req.json();
    const projectId = Number(body.projectId);
    const action = String(body.action || "");
    if (!Number.isSafeInteger(projectId) || projectId <= 0)
      return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
    if (action === "rotate") {
      const token = await rotatePortalToken(session, projectId);
      return NextResponse.json({ ok: true, token });
    }
    if (action === "disable") {
      await disablePortal(session, projectId);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) {
    return adminErrorResponse(error, "Portal konnte nicht geändert werden.");
  }
}
