import type { MetadataRoute } from "next";
import { sites } from "@/lib/site-config";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://webforge-virid.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: siteUrl, lastModified: now, changeFrequency: "monthly", priority: 1 },
    ...Object.values(sites).map((site) => ({
      url: `${siteUrl}/demo/${site.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${siteUrl}/impressum`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.2 },
    { url: `${siteUrl}/datenschutz`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.2 },
  ];
}
