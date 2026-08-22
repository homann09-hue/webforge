import { NextResponse } from "next/server";
import { setAdminCookie } from "@/lib/admin-session";
import { getNeonSql } from "@/lib/neon-db";

const RESET_PATTERN = /^wfr_[0-9a-f]{64}$/;

function page(token: string, message = "", status = 200): Response {
  const feedback = message ? `<p role="alert" style="color:#b42318">${message}</p>` : "";
  const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>WebForge Passwort setzen</title><style>
body{font-family:system-ui,sans-serif;background:#f4f3ef;color:#161616;margin:0;padding:32px}main{max-width:520px;margin:8vh auto;background:white;padding:32px;border-radius:18px;box-shadow:0 12px 40px #0001}label{display:grid;gap:6px;margin:18px 0}input,button{font:inherit;padding:13px;border-radius:10px;border:1px solid #bbb}button{background:#161616;color:white;border:0;cursor:pointer;width:100%}small{color:#555}h1{margin-top:0}
</style></head><body><main><p>WEBFORGE CONTROL</p><h1>Neues Passwort setzen</h1>
<p>Das Passwort wird direkt gespeichert und du wirst anschließend automatisch angemeldet.</p>${feedback}
<form method="post" action="/api/admin/password-reset">
<input type="hidden" name="token" value="${token}">
<label>Neues Passwort<input type="password" name="password" minlength="14" maxlength="200" autocomplete="new-password" required></label>
<label>Passwort wiederholen<input type="password" name="confirmation" minlength="14" maxlength="200" autocomplete="new-password" required></label>
<button type="submit">Passwort speichern und anmelden</button></form>
<p><small>Der Link ist einmalig und höchstens 15 Minuten gültig.</small></p></main></body></html>`;
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!RESET_PATTERN.test(token)) return page("", "Dieser Passwort-Link ist ungültig.", 400);
  return page(token);
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const token = String(form?.get("token") || "");
  const password = String(form?.get("password") || "");
  const confirmation = String(form?.get("confirmation") || "");

  if (!RESET_PATTERN.test(token)) return page("", "Dieser Passwort-Link ist ungültig.", 400);
  if (password !== confirmation) return page(token, "Die Passwörter stimmen nicht überein.", 400);
  if (password.length < 14 || password.length > 200) {
    return page(token, "Das Passwort muss 14–200 Zeichen lang sein.", 400);
  }

  try {
    const sql = getNeonSql();
    const result = await sql`select public.internal_user_complete_password_reset(${token}, ${password}) as token`;
    const session = Array.isArray(result) ? (result[0] as { token?: unknown } | undefined)?.token : undefined;
    if (typeof session !== "string" || !/^wfu_[0-9a-f]{64}$/.test(session)) {
      return page("", "Dieser Passwort-Link ist abgelaufen oder wurde bereits verwendet.", 401);
    }
    return setAdminCookie(NextResponse.redirect(new URL("/admin", request.url), 303), session);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("invalid_reset")) {
      return page("", "Dieser Passwort-Link ist abgelaufen oder wurde bereits verwendet.", 401);
    }
    console.error("WEBFORGE_PASSWORD_RESET_FAILED", error);
    return page(token, "Das Passwort konnte nicht gespeichert werden. Bitte erneut versuchen.", 500);
  }
}
