import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ovara.de";

const title = "Ovara — Technologie. Innovation. Zukunft.";
const description =
  "Ovara entwickelt moderne Websites, Web-Apps, Mobile-Lösungen, Cloud-Systeme und KI-Automationen für Unternehmen.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s — Ovara" },
  description,
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: siteUrl,
    siteName: "Ovara",
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
