"use client";

/**
 * Browser-side helpers for the admin area.
 *
 * The admin session lives in an httpOnly cookie that JavaScript cannot read.
 * Every call below therefore sends no credential of its own — the browser
 * attaches the cookie automatically. This replaces the previous approach of
 * keeping a token in sessionStorage and rewriting request bodies from a
 * global `window.fetch` patch.
 */

export class AdminSessionExpired extends Error {
  constructor(message = "Sitzung abgelaufen. Bitte erneut anmelden.") {
    super(message);
    this.name = "AdminSessionExpired";
  }
}

type JsonRecord = Record<string, unknown>;

/** POSTs to an /api/admin/* route and unwraps the `{ ok, ... }` envelope. */
export async function adminFetch<T = JsonRecord>(path: string, body: JsonRecord = {}): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as JsonRecord & { ok?: boolean; error?: string };

  // Only 401 means "log in again". A 400 is a business error and a 429 is a
  // rate limit; treating those as an expired session used to throw the admin
  // out of a filled-in form.
  if (response.status === 401) throw new AdminSessionExpired();
  if (!response.ok || !data.ok) throw new Error(data.error || "Änderung fehlgeschlagen.");
  return data as T;
}

/** Exchanges user credentials (or the temporary shared password) for a session cookie. */
export async function adminLogin(email: string, password: string): Promise<void> {
  const response = await fetch("/api/admin/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ email, password }),
  });
  const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!response.ok || !data.ok) throw new Error(data.error || "Anmeldung fehlgeschlagen.");
}

/**
 * Logs out. Resolves to false when the server could not revoke the session, so
 * the caller can say so instead of claiming success.
 */
export async function adminLogout(): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/session", { method: "DELETE", credentials: "same-origin" });
    // Without this check a 500 with an HTML body parsed to {} and reported
    // success — from the one function whose job is to tell the difference.
    if (!response.ok) return false;
    const data = (await response.json().catch(() => ({}))) as { revoked?: boolean };
    return data.revoked === true;
  } catch {
    return false;
  }
}

/**
 * Wraps an action handler so an expired session lands the user back on the
 * login form instead of leaving them clicking a dead UI.
 *
 * Without this, only the initial load reset `authenticated`; every button
 * afterwards just set an error string on a fully rendered admin page.
 */
export function handleAdminError(
  error: unknown,
  setError: (message: string) => void,
  setAuthenticated: (value: boolean) => void,
  fallback: string,
): void {
  if (error instanceof AdminSessionExpired) {
    setAuthenticated(false);
    setError(error.message);
    return;
  }
  setError(error instanceof Error ? error.message : fallback);
}

/** True when the browser already holds a valid session cookie. */
export async function adminSessionActive(): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/session", { credentials: "same-origin", cache: "no-store" });
    const data = (await response.json()) as { authenticated?: boolean };
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
}
