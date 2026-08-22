import { neonBackendFunctionFetch } from "@/lib/neon-backend";

function e2eBackendUrl(): URL | null {
  if (process.env.WEBFORGE_E2E_MODE !== "1") return null;
  const raw = process.env.WEBFORGE_E2E_BACKEND_URL;
  if (!raw) throw new Error("WEBFORGE_E2E_BACKEND_URL fehlt im E2E-Modus");

  const url = new URL(raw);
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new Error("WEBFORGE_E2E_BACKEND_URL muss auf localhost zeigen");
  }
  return url;
}

async function e2eBackendFunctionFetch(
  baseUrl: URL,
  name: string,
  body: Record<string, unknown>,
  init: Omit<RequestInit, "method" | "headers" | "body">,
): Promise<Response> {
  const target = new URL(`/functions/v1/${name}`, baseUrl);
  return fetch(target, {
    ...init,
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

/**
 * Provider-neutral backend transport.
 *
 * Production runs backend functions directly against Neon. Tests may opt into
 * a localhost-only adapter with WEBFORGE_E2E_MODE=1; this keeps browser tests
 * isolated from the real database without re-introducing a production fallback.
 */
export async function backendFunctionFetch(
  name: string,
  body: Record<string, unknown>,
  init: Omit<RequestInit, "method" | "headers" | "body"> = {},
): Promise<Response> {
  const testBackend = e2eBackendUrl();
  if (testBackend) return e2eBackendFunctionFetch(testBackend, name, body, init);
  return neonBackendFunctionFetch(name, body);
}
