import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WebForge — Websites, die verkaufen",
  description: "Moderne Websites für lokale Unternehmen. Schnell, hochwertig und ohne klassische Agenturpreise.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
