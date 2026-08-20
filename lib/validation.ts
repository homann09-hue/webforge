/**
 * Input validation shared between route handlers and their tests.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LeadInput = { company: string; email: string; website: string };

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}

/**
 * Validates a public lead submission.
 *
 * `honeypot` is a field hidden from real users by CSS. A bot that fills in
 * every input it finds will set it, and we reject the submission — quietly,
 * from the caller's perspective, so the bot gets no signal to adapt.
 */
export function validateLeadInput(body: Record<string, unknown>): ValidationResult<LeadInput> {
  const honeypot = String(body.website_url ?? "").trim();
  if (honeypot) return { ok: false, error: "SPAM" };

  const company = String(body.company ?? "").trim();
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const website = String(body.website ?? "").trim();

  if (company.length < 2 || company.length > 120) {
    return { ok: false, error: "Bitte Unternehmen und gültige E-Mail angeben." };
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: "Bitte Unternehmen und gültige E-Mail angeben." };
  }
  if (website.length > 300) {
    return { ok: false, error: "Bitte Unternehmen und gültige E-Mail angeben." };
  }

  return { ok: true, value: { company, email, website } };
}

/** Shape of an admin session token issued by the `admin-login` Edge Function. */
export const ADMIN_TOKEN_PATTERN = /^wfs_[0-9a-f]{64}$/;

export function isAdminSessionToken(value: unknown): value is string {
  return typeof value === "string" && ADMIN_TOKEN_PATTERN.test(value);
}

/**
 * Extracts the originating client address from proxy headers.
 *
 * This matters more than it looks. The lead rate limit lives in
 * `internal_submit_lead` and is keyed on the IP the Edge Function sees. Our
 * route handler calls that function from the server, so without forwarding
 * the real address every visitor shares one bucket of five submissions per
 * hour — five leads and the form is closed for everybody.
 *
 * `x-forwarded-for` is a comma-separated chain; the left-most entry is the
 * original client. It is attacker-controllable in general, but on Vercel the
 * platform rewrites it, and the downside here is limited to someone evading
 * their own rate limit.
 */
export function clientIpFrom(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  for (const header of ["x-real-ip", "cf-connecting-ip", "x-vercel-forwarded-for"]) {
    const value = headers.get(header)?.trim();
    if (value) return value;
  }
  return null;
}
