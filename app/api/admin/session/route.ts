import { NextResponse } from "next/server";
import {
  AdminRateLimited,
  AdminUnauthorized,
  ADMIN_COOKIE,
  clearAdminCookie,
  exchangeCredentialsForToken,
  requireAdminSession,
  revokeAdminSession,
  setAdminCookie,
} from "@/lib/admin-session";
import { cookies } from "next/headers";

/** Login: swaps user credentials or the temporary shared password for an httpOnly session cookie. */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "E-Mail-Adresse ist ungültig." }, { status: 400 });
    }
    if (!password || password.length > 200 || email.length > 254) {
      return NextResponse.json({ ok: false, error: "Passwort fehlt." }, { status: 400 });
    }

    const token = await exchangeCredentialsForToken(email, password);
    return setAdminCookie(NextResponse.json({ ok: true }), token);
  } catch (error) {
    if (error instanceof AdminRateLimited) {
      return NextResponse.json(
        { ok: false, error: "Zu viele Anmeldeversuche. Bitte eine Minute warten." },
        { status: 429 },
      );
    }
    if (error instanceof AdminUnauthorized) {
      return NextResponse.json(
        { ok: false, error: "E-Mail oder Passwort stimmt nicht. Bitte gespeicherte Browser-Zugangsdaten prüfen." },
        { status: 401 },
      );
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
  const revoked = await revokeAdminSession(token);

  // The cookie goes either way — the user asked to leave. But saying "logged
  // out" when the token is still valid server side for eight hours would be a
  // lie, and this is the one place that can tell.
  return clearAdminCookie(
    NextResponse.json(
      revoked
        ? { ok: true, revoked: true }
        : { ok: true, revoked: false, warning: "Sitzung konnte serverseitig nicht widerrufen werden." },
    ),
  );
}
