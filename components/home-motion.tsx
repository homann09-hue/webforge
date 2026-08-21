"use client";

import { useEffect } from "react";

export default function HomeMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-home]");
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealNodes = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));

    if (reduceMotion) {
      revealNodes.forEach((node) => node.setAttribute("data-visible", "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).setAttribute("data-visible", "true");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6%" },
    );

    revealNodes.forEach((node) => observer.observe(node));

    const onPointerMove = (event: PointerEvent) => {
      root.style.setProperty("--mx", `${event.clientX}px`);
      root.style.setProperty("--my", `${event.clientY}px`);
    };

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      root.style.setProperty("--scroll", String(progress));
      root.toggleAttribute("data-scrolled", window.scrollY > 24);
    };

    const tiltCleanups: Array<() => void> = [];
    root.querySelectorAll<HTMLElement>("[data-tilt]").forEach((node) => {
      const move = (event: PointerEvent) => {
        const rect = node.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        node.style.setProperty("--tilt-x", `${x * 7}deg`);
        node.style.setProperty("--tilt-y", `${y * -7}deg`);
        node.style.setProperty("--shine-x", `${(x + 0.5) * 100}%`);
        node.style.setProperty("--shine-y", `${(y + 0.5) * 100}%`);
      };
      const leave = () => {
        node.style.setProperty("--tilt-x", "0deg");
        node.style.setProperty("--tilt-y", "0deg");
      };
      node.addEventListener("pointermove", move);
      node.addEventListener("pointerleave", leave);
      tiltCleanups.push(() => {
        node.removeEventListener("pointermove", move);
        node.removeEventListener("pointerleave", leave);
      });
    });

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      tiltCleanups.forEach((cleanup) => cleanup());
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
