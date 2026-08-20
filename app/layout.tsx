import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://webforge-virid.vercel.app";

const title = "WebForge — Websites, die verkaufen";
const description =
  "Moderne Websites für lokale Unternehmen. Schnell, hochwertig und ohne klassische Agenturpreise. " +
  "Handwerk, Gastronomie und Einzelhandel — mit Live-Demos und transparenten Festpreisen.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s — WebForge" },
  description,
  alternates: { canonical: "/" },
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
