"use client";

import { useEffect, useRef } from "react";
import { haptic } from "@/lib/haptics";
import { isMotionPaused } from "@/lib/motion";
import { play } from "@/lib/sound";
import { type ParticleRenderer, revealAt } from "@/lib/particlesGL";
import { useReducedMotion } from "@/lib/useActiveSlot";
import { useViewMode } from "@/lib/viewMode";

/**
 * Live view only: drives the code-token portrait from scroll progress through the
 * portrait chapter. The engine and its data load only when the chapter is near, and
 * any failure leaves the plain photo in place.
 */

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

/** Starting particle count from coarse device hints; the frame-time monitor refines it. */
function initialCount() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (window.innerWidth < 768 || (nav.deviceMemory ?? 8) <= 4) return 12_000;
  if ((nav.hardwareConcurrency ?? 8) <= 4) return 24_000;
  return 40_000;
}

const MIN_COUNT = 8_000;

export function PortraitParticles() {
  const mode = useViewMode();
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enabled = mode === "live" && !reduced;

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.closest("section");
    const frame = section?.querySelector<HTMLElement>("[data-portrait-target]");
    if (!enabled || !canvas || !section || !frame) return;

    const root = document.documentElement;
    let renderer: ParticleRenderer | null = null;
    let loading = false;
    let disposed = false;
    let visible = false;
    let raf = 0;
    let count = initialCount();
    const frameTimes: number[] = [];
    let last = 0;
    let clock = 0;
    // The heartbeat plays once each time the photo starts to come through the code.
    let beat = false;

    const size = () => renderer?.resize(window.innerWidth, window.innerHeight);

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      root.style.setProperty("--dissolve", "0");
      renderer?.render({ progress: 0, time: 0, island: { cx: 0, cy: 0, hw: 0, hh: 0 }, target: { x: 0, y: 0, w: 0, h: 0 }, count: 0 });
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!renderer) return;

      // Reads first (no writes have happened this frame), then one style write.
      const s = section.getBoundingClientRect();
      const box = frame.getBoundingClientRect();
      const island = document.querySelector<HTMLElement>("[data-island]")?.getBoundingClientRect();
      const progress = Math.min(Math.max(-s.top / (s.height - window.innerHeight), 0), 1);

      root.style.setProperty("--dissolve", (smooth(0.05, 0.14, progress) * (1 - smooth(0.93, 0.99, progress))).toFixed(3));

      if (!isMotionPaused()) clock = now / 1000;
      const showing = revealAt(progress).photo;
      if (!beat && showing > 0.08) {
        beat = true;
        play("heartbeat");
        haptic("heartbeat");
      } else if (beat && showing < 0.02) {
        beat = false;
      }
      renderer.render({
        progress,
        time: clock,
        island: island
          ? { cx: island.left + island.width / 2, cy: island.top + island.height / 2, hw: island.width / 2, hh: island.height / 2 }
          : { cx: window.innerWidth / 2, cy: 36, hw: 110, hh: 22 },
        target: renderer.fit({ x: box.left, y: box.top, w: box.width, h: box.height }),
        count,
      });

      // Adaptive quality: drop 25% of particles while frames run long.
      if (last && progress > 0 && progress < 1) {
        frameTimes.push(now - last);
        if (frameTimes.length >= 45) {
          const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
          frameTimes.length = 0;
          if (avg > 21 && count > MIN_COUNT) count = Math.max(MIN_COUNT, Math.round(count * 0.75));
        }
      }
      last = now;
    };

    const start = () => {
      if (raf || !renderer) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };

    const load = async () => {
      if (loading) return;
      loading = true;
      try {
        const { ParticleRenderer, loadParticleData } = await import("@/lib/particlesGL");
        const data = await loadParticleData();
        if (disposed) return;
        renderer = new ParticleRenderer(canvas, data);
        size();
        root.dataset.particles = "on";
        if (visible) start();
      } catch (err) {
        console.warn("Particle portrait unavailable; showing the photo instead.", err);
      }
    };

    const near = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && load(), { rootMargin: "150% 0px" });
    const onScreen = new IntersectionObserver((e) => {
      visible = e.some((x) => x.isIntersecting);
      if (visible) start();
      else stop();
    });
    near.observe(section);
    onScreen.observe(section);

    const onLost = (e: Event) => {
      e.preventDefault();
      stop();
      renderer = null;
      delete root.dataset.particles;
    };
    canvas.addEventListener("webglcontextlost", onLost);
    window.addEventListener("resize", size);

    return () => {
      disposed = true;
      near.disconnect();
      onScreen.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      window.removeEventListener("resize", size);
      stop();
      renderer?.dispose();
      renderer = null;
      delete root.dataset.particles;
      root.style.removeProperty("--dissolve");
    };
  }, [enabled]);

  if (!enabled) return null;
  return <canvas ref={canvasRef} className="particles-canvas" aria-hidden="true" />;
}
