"use client";

import Link from "next/link";
import { useEffect } from "react";
import styles from "./demo-showcase-bar.module.css";

type Cleanup = () => void;

export default function DemoMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".demo");
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Cleanup[] = [];

    const setScrollState = () => {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(window.scrollY / max, 0), 1);
      root.style.setProperty("--demo-scroll", progress.toFixed(4));
      if (window.scrollY > 18) root.dataset.scrolled = "true";
      else delete root.dataset.scrolled;
    };

    setScrollState();
    window.addEventListener("scroll", setScrollState, { passive: true });
    cleanups.push(() => window.removeEventListener("scroll", setScrollState));

    const revealTargets = Array.from(
      root.querySelectorAll<HTMLElement>(
        ".demo-section, .craft-projects, .craft-contact, .gastro-story, .flower-occasions, .flower-contact, .demo-footer",
      ),
    );
    revealTargets.forEach((node) => node.setAttribute("data-demo-reveal", reduceMotion ? "visible" : "pending"));

    if (!reduceMotion && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            (entry.target as HTMLElement).setAttribute("data-demo-reveal", "visible");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -7%" },
      );
      revealTargets.forEach((node) => observer.observe(node));
      cleanups.push(() => observer.disconnect());
    }

    const staggerTargets = Array.from(
      root.querySelectorAll<HTMLElement>(
        ".craft-service-grid article, .project-card, .process-grid article, .food-grid article, .info-grid article, .bouquet-grid article, .occasion-grid article",
      ),
    );
    staggerTargets.forEach((node, index) => {
      node.style.setProperty("--demo-delay", `${Math.min(index % 8, 7) * 55}ms`);
    });

    if (!reduceMotion && window.matchMedia("(pointer:fine)").matches) {
      const hero = root.querySelector<HTMLElement>(".craft-visual, .pizza-stage, .flower-visual");
      const onPointerMove = (event: PointerEvent) => {
        const x = event.clientX / window.innerWidth;
        const y = event.clientY / window.innerHeight;
        root.style.setProperty("--demo-mx", `${event.clientX}px`);
        root.style.setProperty("--demo-my", `${event.clientY}px`);
        root.style.setProperty("--demo-tilt-x", `${(x - 0.5) * 5.5}deg`);
        root.style.setProperty("--demo-tilt-y", `${(0.5 - y) * 4.5}deg`);
      };
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      cleanups.push(() => window.removeEventListener("pointermove", onPointerMove));

      if (hero) {
        const reset = () => {
          root.style.setProperty("--demo-tilt-x", "0deg");
          root.style.setProperty("--demo-tilt-y", "0deg");
        };
        hero.addEventListener("pointerleave", reset);
        cleanups.push(() => hero.removeEventListener("pointerleave", reset));
      }

      const tiltCards = Array.from(
        root.querySelectorAll<HTMLElement>(
          ".craft-service-grid article, .project-card, .food-grid article, .bouquet-grid article, .occasion-grid article, .info-grid article",
        ),
      );
      tiltCards.forEach((card) => {
        const move = (event: PointerEvent) => {
          const rect = card.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width;
          const py = (event.clientY - rect.top) / rect.height;
          card.style.setProperty("--card-x", `${px * 100}%`);
          card.style.setProperty("--card-y", `${py * 100}%`);
          card.style.setProperty("--card-rx", `${(0.5 - py) * 3.5}deg`);
          card.style.setProperty("--card-ry", `${(px - 0.5) * 4.5}deg`);
        };
        const leave = () => {
          card.style.setProperty("--card-rx", "0deg");
          card.style.setProperty("--card-ry", "0deg");
        };
        card.addEventListener("pointermove", move);
        card.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          card.removeEventListener("pointermove", move);
          card.removeEventListener("pointerleave", leave);
        });
      });
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return (
    <aside className={styles.bar} aria-label="WebForge Demo Navigation">
      <Link href="/">← WebForge</Link>
      <span><i /> Live Demo</span>
    </aside>
  );
}
