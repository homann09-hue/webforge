import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DemoHandwerk from "@/components/demo-handwerk";
import DemoGastro from "@/components/demo-gastro";
import DemoBlumen from "@/components/demo-blumen";
import styles from "../demo.module.css";
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
    // A child openGraph replaces the parent's wholesale; twitter is separate
    // and would otherwise keep advertising the homepage.
    twitter: { card: "summary_large_image", title, description },
  };
}

export function generateStaticParams() {
  return [{ slug: "handwerk" }, { slug: "gastro" }, { slug: "blumen" }];
}

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "handwerk")
    return (
      <div className={styles.demoScope}>
        <DemoHandwerk />
      </div>
    );
  if (slug === "gastro")
    return (
      <div className={styles.demoScope}>
        <DemoGastro />
      </div>
    );
  if (slug === "blumen")
    return (
      <div className={styles.demoScope}>
        <DemoBlumen />
      </div>
    );
  notFound();
}
