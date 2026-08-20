import type { ReactNode } from "react";

/**
 * Portal links are handed out by mail and must never be indexed. The response
 * headers in next.config.ts already say so; this stops the page itself from
 * carrying the root layout's `robots: index, follow` and contradicting them.
 */
export const metadata = {
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
