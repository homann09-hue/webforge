import { edgeFunctionUrl, supabaseHeaders } from "@/lib/supabase-env";

/**
 * Calls an admin RPC through the Supabase `admin-gateway` Edge Function.
 *
 * `credential` is the caller's admin session token (see lib/admin-session.ts).
 * It is never read from the request body: route handlers take it from the
 * httpOnly session cookie, so a token cannot be injected by a caller.
 */
export async function adminRpc(name: string, credential: string, args: Record<string, unknown> = {}) {
  const response = await fetch(edgeFunctionUrl("admin-gateway"), {
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify({ password: credential, function: name, args }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error(`WEBFORGE_ADMIN_GATEWAY_${name}`, response.status, detail);

    // These must stay distinct. Lumping 400 and 429 in with 401 meant an
    // ordinary business error — deleting an invoice that has payments, say —
    // logged the admin out and threw away their unsaved work, under the
    // message "session expired".
    if (response.status === 401 || response.status === 403) throw new Error("UNAUTHORIZED");
    if (response.status === 429) throw new Error("RATE_LIMITED");
    if (response.status === 400) throw new Error("INVALID_REQUEST");
    throw new Error("ADMIN_RPC_FAILED");
  }

  return response;
}
