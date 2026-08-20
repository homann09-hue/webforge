import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { edgeFunctionUrl, supabaseHeaders } from "@/lib/supabase-env";

export const ADMIN_COOKIE = "webforge_admin_session";

/** Shape produced by the Supabase `admin-login` Edge Function. */
const TOKEN_PATTERN = /^wfs_[0-9a-f]{64}$/;

/**
 * Session lifetime. The Edge Function enforces its own expiry server side;
 * this only controls how long the browser keeps sending the cookie.
 */
const MAX_AGE_SECONDS = 60 * 60 * 8;

export class AdminUnauthorized extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "AdminUnauthorized";
  }
}

/**
 * Exchanges the shared admin password for a short lived session token.
 * Runs server side only, so the password never reaches the browser's storage.
 */
export async function exchangePasswordForToken(password: string): Promise<string> {
  const response = await fetch(edgeFunctionUrl("admin-login"), {
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify({ password }),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as { ok?: boolean; token?: unknown };
  if (!response.ok || !data?.ok || typeof data.token !== "string" || !TOKEN_PATTERN.test(data.token)) {
    throw new AdminUnauthorized();
  }
  return data.token;
}

/**
 * Reads the admin session token from the httpOnly cookie.
 * Throws `AdminUnauthorized` when there is no usable session, so route
 * handlers can treat "not logged in" and "rejected by the gateway" alike.
 */
export async function requireAdminSession(): Promise<string> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value ?? "";
  if (!TOKEN_PATTERN.test(token)) throw new AdminUnauthorized();
  return token;
}

export function setAdminCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return response;
}

/**
 * Revokes the session server side.
 *
 * Clearing the cookie only stops *this* browser from presenting the token —
 * the token itself stayed valid in private.admin_sessions for its full eight
 * hours. Anything that had captured it kept working after "logout". This
 * closes that window.
 *
 * Never throws: a failed revoke must not stop the user from logging out
 * locally, and there is nothing useful they could do about it.
 */
export async function revokeAdminSession(token: string): Promise<void> {
  if (!TOKEN_PATTERN.test(token)) return;
  try {
    const response = await fetch(edgeFunctionUrl("admin-logout"), {
      method: "POST",
      headers: supabaseHeaders(),
      body: JSON.stringify({ token }),
      cache: "no-store",
    });
    if (!response.ok) console.error("WEBFORGE_ADMIN_LOGOUT_FAILED", response.status);
  } catch (error) {
    console.error("WEBFORGE_ADMIN_LOGOUT_FAILED", error);
  }
}

export function clearAdminCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

/**
 * Maps a thrown error onto an HTTP response. Keeps the German wording that the
 * admin UI already displays and never leaks internals to the client.
 */
export function adminErrorResponse(error: unknown, fallback: string): NextResponse {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  if (message === "UNAUTHORIZED") {
    return NextResponse.json({ ok: false, error: "Nicht angemeldet." }, { status: 401 });
  }
  console.error("WEBFORGE_ADMIN_ROUTE_ERROR", error);
  return NextResponse.json({ ok: false, error: fallback }, { status: 500 });
}
