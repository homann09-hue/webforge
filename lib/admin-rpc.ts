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
    if ([400, 401, 403, 429].includes(response.status)) throw new Error("UNAUTHORIZED");
    throw new Error("ADMIN_RPC_FAILED");
  }

  return response;
}
