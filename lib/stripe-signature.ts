/**
 * Verification of Stripe's `Stripe-Signature` header.
 *
 * Kept in its own module so it can be tested without a running server, and
 * because the comparison needs to be constant time: a `===` on the hex digest
 * leaks, through its timing, how many leading characters of a forged signature
 * were correct.
 */

/** How far a webhook timestamp may drift before the request is rejected. */
export const DEFAULT_TOLERANCE_SECONDS = 300;

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Length-independent, value-constant-time string comparison. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function parseSignatureHeader(header: string): { timestamp: string | null; signatures: string[] } {
  const parts = header.split(",").map((part) => part.trim());
  return {
    timestamp: parts.find((part) => part.startsWith("t="))?.slice(2) ?? null,
    signatures: parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3)),
  };
}

export async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
  options: { toleranceSeconds?: number; nowSeconds?: number } = {},
): Promise<boolean> {
  if (!secret) return false;

  const { timestamp, signatures } = parseSignatureHeader(signatureHeader);
  if (!timestamp || signatures.length === 0) return false;

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;

  const now = options.nowSeconds ?? Date.now() / 1000;
  const tolerance = options.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  if (Math.abs(now - timestampSeconds) > tolerance) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = toHex(digest);

  // Compare against every candidate so the work done does not depend on which
  // one matches. `some` would short-circuit; the reduce deliberately does not.
  return signatures.reduce((matched, candidate) => timingSafeEqual(candidate, expected) || matched, false);
}
