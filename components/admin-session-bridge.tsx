"use client";

import { useEffect } from "react";

const SUPABASE_URL = "https://jplqdaxtnrqimlgzwuaw.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_nZGbQRfpyHgjTyZ9XJBKRg_OBKT8R1V";
const LEGACY_KEY = "webforge_admin_password";
const SESSION_KEY = "webforge_admin_session";

async function exchangePassword(password: string, originalFetch: typeof window.fetch) {
  const response = await originalFetch(`${SUPABASE_URL}/functions/v1/admin-login`, {
    method: "POST",
    headers: {
      apikey: PUBLISHABLE_KEY,
      Authorization: `Bearer ${PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok || typeof data?.token !== "string") throw new Error("ADMIN_LOGIN_FAILED");
  return data.token as string;
}

export default function AdminSessionBridge() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    let sessionToken = sessionStorage.getItem(SESSION_KEY) || "";
    let exchangePromise: Promise<string> | null = null;

    async function ensureSession(credential: string) {
      if (/^wfs_[0-9a-f]{64}$/.test(credential)) {
        sessionToken = credential;
        sessionStorage.setItem(SESSION_KEY, credential);
        return credential;
      }
      if (/^wfs_[0-9a-f]{64}$/.test(sessionToken)) return sessionToken;
      if (!exchangePromise) {
        exchangePromise = exchangePassword(credential, originalFetch)
          .then((token) => {
            sessionToken = token;
            sessionStorage.setItem(SESSION_KEY, token);
            return token;
          })
          .finally(() => {
            exchangePromise = null;
          });
      }
      return exchangePromise;
    }

    window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (!url.startsWith("/api/admin/")) return originalFetch(input, init);
      if (!init?.body || typeof init.body !== "string") return originalFetch(input, init);

      try {
        const parsed = JSON.parse(init.body) as Record<string, unknown>;
        const credential = typeof parsed.password === "string" ? parsed.password : "";
        if (!credential) return originalFetch(input, init);
        const token = await ensureSession(credential);
        const response = await originalFetch(input, { ...init, body: JSON.stringify({ ...parsed, password: token }) });
        setTimeout(() => {
          sessionStorage.setItem(SESSION_KEY, token);
          sessionStorage.setItem(LEGACY_KEY, token);
        }, 0);
        return response;
      } catch {
        return originalFetch(input, init);
      }
    }) as typeof window.fetch;

    const stored = sessionStorage.getItem(LEGACY_KEY);
    if (stored && !/^wfs_[0-9a-f]{64}$/.test(stored)) {
      void ensureSession(stored)
        .then((token) => {
          sessionStorage.setItem(LEGACY_KEY, token);
        })
        .catch(() => {});
    }

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
