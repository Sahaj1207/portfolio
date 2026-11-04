"use client";

import { useEffect, useState } from "react";

/**
 * Reports which `[data-island-slot]` section is crossing the middle of the viewport,
 * plus that element so callers can read its data attributes.
 */
export function useActiveSlot(routeKey: string) {
  const [active, setActive] = useState<{ slot: string; el: HTMLElement | null }>({ slot: "hero", el: null });

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-island-slot]"));
    if (!els.length) return;
    setActive({ slot: els[0].dataset.islandSlot!, el: els[0] });

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            setActive({ slot: el.dataset.islandSlot!, el });
          }
        }
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [routeKey]);

  return active;
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}
