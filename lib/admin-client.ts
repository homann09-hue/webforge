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
  if (response.status === 401) throw new AdminSessionExpired();
  if (!response.ok || !data.ok) throw new Error(data.error || "Änderung fehlgeschlagen.");
  return data as T;
}

/** Exchanges the password for a session cookie. Throws on a wrong password. */
export async function adminLogin(password: string): Promise<void> {
  const response = await fetch("/api/admin/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ password }),
  });
  const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!response.ok || !data.ok) throw new Error(data.error || "Anmeldung fehlgeschlagen.");
}

export async function adminLogout(): Promise<void> {
  await fetch("/api/admin/session", { method: "DELETE", credentials: "same-origin" }).catch(() => {});
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
