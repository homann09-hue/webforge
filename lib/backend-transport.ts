import { neonBackendFunctionFetch } from "@/lib/neon-backend";

/**
 * Provider-neutral backend transport.
 *
 * WebForge now runs its backend functions directly against Neon. The transport
 * layer remains so callers do not need to know which backend implementation is
 * used, but there is no Supabase fallback anymore.
 */
export async function backendFunctionFetch(
  name: string,
  body: Record<string, unknown>,
  _init: Omit<RequestInit, "method" | "headers" | "body"> = {},
): Promise<Response> {
  return neonBackendFunctionFetch(name, body);
}
