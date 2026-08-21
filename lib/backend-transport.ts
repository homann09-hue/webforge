import { neonBackendFunctionFetch } from "@/lib/neon-backend";
import { edgeFunctionUrl, supabaseHeaders } from "@/lib/supabase-env";

const NEON_FUNCTIONS = new Set(["admin-login", "admin-logout", "lead-submit", "admin-gateway"]);

function shouldUseNeonBackend(name: string): boolean {
  return process.env.WEBFORGE_BACKEND === "neon" && NEON_FUNCTIONS.has(name);
}

/**
 * Provider-neutral backend transport used during the Supabase -> Neon migration.
 *
 * Only functions explicitly listed in NEON_FUNCTIONS switch to Neon. Everything
 * else keeps using Supabase until its storage/portal dependency has also moved.
 */
export async function backendFunctionFetch(
  name: string,
  body: Record<string, unknown>,
  init: Omit<RequestInit, "method" | "headers" | "body"> = {},
): Promise<Response> {
  if (shouldUseNeonBackend(name)) {
    return neonBackendFunctionFetch(name, body);
  }

  return fetch(edgeFunctionUrl(name), {
    ...init,
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify(body),
  });
}

/**
 * Raw endpoint escape hatch for browser multipart uploads.
 * Portal uploads remain on Supabase Storage until the Vercel Blob phase.
 */
export function backendFunctionUrl(name: string): string {
  return edgeFunctionUrl(name);
}
