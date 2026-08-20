import { NextRequest, NextResponse } from "next/server";

/**
 * Nonce-based Content-Security-Policy for the sensitive routes.
 *
 * Why only these routes: a nonce has to be different on every response, so it
 * cannot be baked into a statically generated page — the cached HTML would
 * carry one nonce and the response header another, and every script would be
 * blocked. The marketing pages and demos are prerendered and keep the static
 * CSP from next.config.ts, which is scoped to exclude these two prefixes so
 * the two policies never both apply to one response.
 *
 * /admin and /portal lose nothing by being dynamic: they are already
 * Cache-Control: no-store, and they are where the customer data is.
 */
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jplqdaxtnrqimlgzwuaw.supabase.co";

export function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, "");

  const csp = [
    "default-src 'self'",
    // 'strict-dynamic' lets the nonced Next.js bootstrap load the rest of the
    // chunks, so no inline script runs without the nonce.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // Styles still need unsafe-inline: React sets style attributes and Next
    // injects a style tag, and neither carries a nonce.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${supabaseOrigin}`,
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js reads this back and stamps the nonce onto its own script tags.
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"],
};
