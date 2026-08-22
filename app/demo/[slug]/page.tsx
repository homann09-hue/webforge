import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DemoHandwerk from "@/components/demo-handwerk";
import DemoGastro from "@/components/demo-gastro";
import DemoBlumen from "@/components/demo-blumen";
import DemoMotion from "@/components/demo-motion";
import styles from "../demo.module.css";
import motionStyles from "../demo-motion.module.css";
import polishStyles from "../demo-polish.module.css";
import { getSiteConfig, siteConfigs } from "@/lib/site-config";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = getSiteConfig(slug);
  if (!site) return {};

  const { title, description } = site.seo;

  return {
    title,
    description,
    alternates: { canonical: `/demo/${site.slug}` },
    openGraph: {
      title,
      description,
      url: `/demo/${site.slug}`,
      type: "website",
      locale: "de_DE",
      siteName: "WebForge",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function generateStaticParams() {
  return siteConfigs.map((site) => ({ slug: site.slug }));
}

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = getSiteConfig(slug);
  if (!site) notFound();

  const content =
    site.industry === "handwerk" ? (
      <DemoHandwerk />
    ) : site.industry === "gastro" ? (
      <DemoGastro />
    ) : site.industry === "retail" ? (
      <DemoBlumen />
    ) : null;

  if (!content) notFound();

  return (
    <div className={`${styles.demoScope} ${motionStyles.motionScope} ${polishStyles.polishScope}`}>
      <DemoMotion />
      {content}
    </div>
  );
}
