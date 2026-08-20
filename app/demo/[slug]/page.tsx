import { notFound } from "next/navigation";
import DemoHandwerk from "@/components/demo-handwerk";
import DemoGastro from "@/components/demo-gastro";
import DemoBlumen from "@/components/demo-blumen";
import styles from "../demo.module.css";

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
