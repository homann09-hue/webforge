import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CustomerSite from "@/components/customer-site";
import { getSiteConfig, siteConfigs } from "@/lib/site-config";

export function generateStaticParams() {
  return siteConfigs.map((site) => ({ slug: site.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = getSiteConfig(slug);
  if (!site) return {};

  return {
    title: `${site.business} — WebForge Site Engine Preview`,
    description: site.seo.description,
    robots: { index: false, follow: false },
  };
}

export default async function CustomerSitePreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = getSiteConfig(slug);
  if (!site) notFound();

  return <CustomerSite site={site} />;
}
