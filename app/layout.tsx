import type { Metadata } from "next";
import "./globals.css";
import "./a11y-overrides.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://webforge-virid.vercel.app";

const title = "WebForge — Websites, die verkaufen";
const description =
  "Moderne Websites für lokale Unternehmen. Schnell, hochwertig und ohne klassische Agenturpreise. " +
  "Handwerk, Gastronomie und Einzelhandel — mit Live-Demos und transparenten Festpreisen.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s — WebForge" },
  description,
  // Deliberately no `alternates` here: Next.js inherits it into every child
  // segment, so a canonical set on the root layout points the demos, the
  // imprint and the privacy policy at the homepage — while sitemap.ts submits
  // those very URLs. Each page sets its own.
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: siteUrl,
    siteName: "WebForge",
    title,
    description,
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
