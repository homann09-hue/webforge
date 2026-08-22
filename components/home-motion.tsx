"use client";

import { useEffect } from "react";

const realisticOverrides = `
[data-home] [class*="hero"]::before {
  display: none !important;
}

[data-home] [class*="heroStage"] {
  min-height: 650px !important;
  border: 1px solid rgba(255,255,255,.12) !important;
  border-radius: 34px !important;
  overflow: hidden !important;
  background-image: url('/demo/ai-roofers.webp') !important;
  background-size: cover !important;
  background-position: center !important;
  box-shadow: 0 36px 90px rgba(0,0,0,.34) !important;
}

[data-home] [class*="heroStage"] > * {
  display: none !important;
}

[data-home] [class*="capCard"]::after {
  display: none !important;
}

[data-home] [class*="demoVisual"] {
  background-color: #171a1d !important;
  background-size: cover !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
}

[data-home] [class*="demoVisual"]::before,
[data-home] [class*="demoVisual"]::after {
  display: none !important;
}

[data-home] [class*="craftVisual"] {
  background-image: url('/demo/ai-roofers.webp') !important;
}

[data-home] [class*="foodVisual"] {
  background-image: url('/demo/ai-restaurant.webp') !important;
}

[data-home] [class*="flowerVisual"] {
  background-image: url('/demo/ai-florist.webp') !important;
}

@media (max-width: 700px) {
  [data-home] [class*="heroStage"] {
    min-height: 500px !important;
    background-position: 54% center !important;
  }

  [data-home] [class*="demoVisual"] {
    min-height: 430px !important;
  }
}
`;

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

  return <style>{realisticOverrides}</style>;
}
