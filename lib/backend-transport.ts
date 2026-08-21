import { neonBackendFunctionFetch } from "@/lib/neon-backend";
import { edgeFunctionUrl, supabaseHeaders } from "@/lib/supabase-env";

const NEON_FUNCTIONS = new Set(["admin-login", "admin-logout", "lead-submit", "admin-gateway", "portal-gateway"]);

function shouldUseNeonBackend(name: string): boolean {
  return process.env.WEBFORGE_BACKEND === "neon" && NEON_FUNCTIONS.has(name);
}

/**
 * Provider-neutral backend transport used during the Supabase -> Neon migration.
 * Only explicitly migrated functions switch to Neon; the rest stay on Supabase
 * until their provider-specific dependencies are removed.
 */
export async function backendFunctionFetch(
  name: string,
  body: Record<string, unknown>,
  init: Omit<RequestInit, "method" | "headers" | "body"> = {},
): Promise<Response> {
  if (shouldUseNeonBackend(name)) return neonBackendFunctionFetch(name, body);

  return fetch(edgeFunctionUrl(name), {
    ...init,
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify(body),
  });
}

/** Legacy raw Edge Function URL helper kept only for non-migrated endpoints. */
export function backendFunctionUrl(name: string): string {
  return edgeFunctionUrl(name);
}
