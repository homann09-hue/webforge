import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://webforge-virid.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The admin area and customer portals must never appear in an index.
      // The headers in next.config.ts say the same thing; this is the polite
      // half of the pair.
      disallow: ["/admin", "/admin/", "/portal/", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
