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
