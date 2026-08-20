import { NextResponse } from "next/server";
import {
  AdminUnauthorized,
  ADMIN_COOKIE,
  clearAdminCookie,
  exchangePasswordForToken,
  requireAdminSession,
  revokeAdminSession,
  setAdminCookie,
} from "@/lib/admin-session";
import { cookies } from "next/headers";

/** Login: swaps the shared admin password for a session token in an httpOnly cookie. */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const password = String(body.password || "");
    if (!password || password.length > 200) {
      return NextResponse.json({ ok: false, error: "Passwort fehlt." }, { status: 400 });
    }

    const token = await exchangePasswordForToken(password);
    return setAdminCookie(NextResponse.json({ ok: true }), token);
  } catch (error) {
    if (error instanceof AdminUnauthorized) {
      return NextResponse.json({ ok: false, error: "Ungültiges Passwort." }, { status: 401 });
    }
    console.error("WEBFORGE_ADMIN_LOGIN_ERROR", error);
    return NextResponse.json({ ok: false, error: "Anmeldung fehlgeschlagen." }, { status: 500 });
  }
}

/** Tells the admin UI whether the browser already holds a usable session. */
export async function GET() {
  try {
    await requireAdminSession();
    return NextResponse.json({ ok: true, authenticated: true });
  } catch {
    return NextResponse.json({ ok: true, authenticated: false });
  }
}

/** Logout: revoke the token server side, then drop the cookie. */
export async function DELETE() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value ?? "";
  await revokeAdminSession(token);
  return clearAdminCookie(NextResponse.json({ ok: true }));
}
