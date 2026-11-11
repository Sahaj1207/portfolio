"use client";

import { useEffect, useRef, useState } from "react";
import gitlog from "@/content/gitlog.json";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import { endBoot } from "@/lib/desktop";
import { haptic } from "@/lib/haptics";

/**
 * The desktop's session screens: the boot log `startx` plays, the screensaver it falls into
 * when left alone (this site's own code, drifting), and the lock screen that follows.
 */

const BOOT = [
  `sahaj.os · build ${gitlog[0]?.hash ?? "dev"}`,
  `[ ok ] mounting ~/work · ${projects.length} projects`,
  "[ ok ] starting the island compositor · WebGL2",
  "[ ok ] loading the dock · Finder, Terminal, FLOAT, PIE, HARIKA, VayuCast",
  "[ ok ] recent commits:",
  ...gitlog.slice(0, 4).map((c) => `       ${c.hash}  ${c.subject.slice(0, 60)}`),
  "[ ok ] welcome, guest",
];

export function BootLog() {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const ids = BOOT.map((_, i) => setTimeout(() => setShown(i + 1), 110 * (i + 1)));
    const done = setTimeout(endBoot, 110 * BOOT.length + 500);
    const skip = () => endBoot();
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    return () => {
      ids.forEach(clearTimeout);
      clearTimeout(done);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, []);
  return (
    <div className="boot-log" role="status" aria-label="Starting sahaj.os">
      <pre>
        {BOOT.slice(0, shown).map((l) => (
          <span key={l} className={l.startsWith("[ ok ]") ? "ok" : undefined}>
            {l}
            {"\n"}
          </span>
        ))}
        <span className="boot-caret" aria-hidden="true" />
      </pre>
      <p className="boot-skip">press any key to skip</p>
    </div>
  );
}

const TOKENS = [
  "const", "useEffect", "spring.step(dt)", "smin(a, b, k)", "vec3 ramp", "islandGL", "=>", "return",
  "WebGL2RenderingContext", "outColor", "haptic(\"tick\")", "enterDesktop()", "sahaj.os", "openApp",
  "useSyncExternalStore", "uniform vec4 uBox", "requestAnimationFrame", "showActivity", "<Island />",
  "float sdBox", "mix(violet, cyan, t)", "export function", "type Snap", "focusApp", "data-theme",
];

/** This site's own code drifting upward in the dark, until you move. */
export function ScreenSaver() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      el.width = window.innerWidth * dpr;
      el.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const glyphs = Array.from({ length: 70 }, () => ({
      t: TOKENS[Math.floor(Math.random() * TOKENS.length)],
      x: Math.random() * W(),
      y: Math.random() * H(),
      v: 8 + Math.random() * 22,
      s: 11 + Math.random() * 12,
      hue: Math.random(),
    }));
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.fillStyle = "#04050b";
      ctx.fillRect(0, 0, W(), H());
      for (const g of glyphs) {
        g.y -= g.v * dt;
        if (g.y < -30) {
          g.y = H() + 20;
          g.x = Math.random() * W();
        }
        const fade = Math.min(1, g.y / (H() * 0.25), (H() - g.y) / (H() * 0.25));
        const r = Math.round(124 + (0 - 124) * g.hue);
        const gr = Math.round(92 + (212 - 92) * g.hue);
        ctx.fillStyle = `rgba(${r}, ${gr}, 255, ${0.15 + 0.55 * Math.max(0, fade)})`;
        ctx.font = `${g.s}px ui-monospace, Consolas, monospace`;
        ctx.fillText(g.t, g.x, g.y);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas ref={canvas} className="screensaver" aria-hidden="true" />;
}

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [now, setNow] = useState(() => new Date());
  const [leaving, setLeaving] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    button.current?.focus();
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);
  const unlock = () => {
    if (leaving) return;
    setLeaving(true);
    haptic("success");
    setTimeout(onUnlock, 420);
  };
  useEffect(() => {
    const onKey = () => unlock();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  return (
    <div className="lock" data-leaving={leaving || undefined} role="dialog" aria-modal="true" aria-label="sahaj.os is locked">
      <p className="lock-date">{now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}</p>
      <p className="lock-time">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
      <button ref={button} type="button" className="lock-user" onClick={unlock}>
        <img src="/portrait.webp" alt="" width={72} height={72} />
        <strong>{site.name}</strong>
        <span>Click or press any key to unlock</span>
      </button>
    </div>
  );
}
