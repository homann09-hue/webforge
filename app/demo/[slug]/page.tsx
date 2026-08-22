import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DemoHandwerk from "@/components/demo-handwerk";
import DemoGastro from "@/components/demo-gastro";
import DemoBlumen from "@/components/demo-blumen";
import DemoMotion from "@/components/demo-motion";
import styles from "../demo.module.css";
import motionStyles from "../demo-motion.module.css";
import polishStyles from "../demo-polish.module.css";
import { sites } from "@/lib/site-config";

/**
 * Without this the three demos inherited the homepage title, description and
 * canonical URL — while sitemap.ts submits each of them as its own page.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = sites[slug as keyof typeof sites];
  if (!site) return {};

  const title = `${site.business} — ${site.category}-Demo`;
  const description =
    `Live-Demo einer ${site.category}-Website von WebForge: vollständiger Auftritt mit ` +
    `Leistungen, Vertrauensaufbau und Anfragestrecke. Beispielinhalte, kein echtes Unternehmen.`;

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
  return [{ slug: "handwerk" }, { slug: "gastro" }, { slug: "blumen" }];
}

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content =
    slug === "handwerk" ? (
      <DemoHandwerk />
    ) : slug === "gastro" ? (
      <DemoGastro />
    ) : slug === "blumen" ? (
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
