import type { ReactNode } from "react";

export const metadata = {
  robots: { index: false, follow: false },
};

/**
 * The nonce in the CSP differs per response, so these pages must not be
 * prerendered — a cached page would carry a stale nonce and every script on it
 * would be blocked. Nothing is lost: the admin area is already no-store.
 */
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
