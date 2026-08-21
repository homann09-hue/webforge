import { edgeFunctionUrl, supabaseHeaders } from "@/lib/supabase-env";

/**
 * Temporary transport boundary for the Supabase -> Neon/Vercel migration.
 *
 * Application modules should call backendFunctionFetch() instead of importing
 * Supabase URL/header helpers directly. Phase 1 deliberately preserves the
 * production behavior; later phases can replace this implementation with
 * direct Vercel route handlers + Neon without touching every business module.
 */
export async function backendFunctionFetch(
  name: string,
  body: Record<string, unknown>,
  init: Omit<RequestInit, "method" | "headers" | "body"> = {},
): Promise<Response> {
  return fetch(edgeFunctionUrl(name), {
    ...init,
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify(body),
  });
}

/**
 * Temporary raw endpoint escape hatch for browser multipart uploads.
 * This exists only until portal-upload moves to a native Next.js/Vercel route.
 */
export function backendFunctionUrl(name: string): string {
  return edgeFunctionUrl(name);
}
