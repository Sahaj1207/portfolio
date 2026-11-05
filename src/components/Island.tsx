"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { IslandRenderer, type Shape } from "@/lib/islandGL";
import { Spring, SpringLoop, calmSpring, ghostSpring, heroSpring, islandSpring, nubSpring, rippleSpring } from "@/lib/spring";
import { useActiveSlot, useReducedMotion } from "@/lib/useActiveSlot";
import { useDesktop } from "@/lib/desktop";
import { openPalette } from "@/components/Palette";
import { type Activity, useActivity } from "@/lib/islandBus";
import { useMotionPaused } from "@/lib/motion";
import { haptic } from "@/lib/haptics";
import { play } from "@/lib/sound";
import { fallBackToPlain, useViewMode } from "@/lib/viewMode";

/**
 * The island. Plain view renders it as a DOM capsule whose size is driven by springs;
 * each page chapter (a `[data-island-slot]` section) gives it a different state.
 * Hover, focus or tap always opens the navigation state.
 */

type View =
  | "nav"
  | "work"
  | "float-media"
  | "float-banner"
  | "float-orb"
  | "portrait"
  | "timeline"
  | "terminal"
  | "case"
  | "act-harika"
  | "act-mtb"
  | "act-pie"
  | "notify";

const VIEWS: View[] = [
  "nav",
  "work",
  "float-media",
  "float-banner",
  "float-orb",
  "portrait",
  "timeline",
  "terminal",
  "case",
  "act-harika",
  "act-mtb",
  "act-pie",
  "notify",
];

/** Island views for activities sent from elsewhere on the page (see lib/islandBus). */
const ACTIVITY_VIEW: Record<Activity["kind"], View> = {
  float: "float-media",
  harika: "act-harika",
  mothertongue: "act-mtb",
  pie: "act-pie",
  orb: "float-orb",
  notify: "notify",
};

const SLOT_VIEW: Record<string, View> = {
  hero: "nav",
  contact: "nav",
  work: "work",
  float: "float-media",
  portrait: "portrait",
  timeline: "timeline",
  terminal: "terminal",
  case: "case",
};

/** FLOAT's own rhythm: media, then a notification that holds ~3.5 s, then the ambient orb. */
const FLOAT_CYCLE: { view: View; ms: number }[] = [
  { view: "float-media", ms: 2600 },
  { view: "float-banner", ms: 3500 },
  { view: "float-media", ms: 1800 },
  { view: "float-orb", ms: 2200 },
];

const INITIAL = { w: 236, h: 44 };
const TOP = 14;
/** Canvas around the island, CSS px. Wide enough for the widest state plus FLOAT's media bubble. */
const CANVAS = { w: 760, h: 150 };
const BUBBLE_R = 22;

export function Island() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const mode = useViewMode();
  const paused = useMotionPaused();
  const active = useActiveSlot(pathname);
  // On the desktop the page is hidden, so the island rests in its nav pill.
  const desktop = useDesktop().on;
  const slot = desktop ? "desktop" : active.slot;
  const slotEl = desktop ? null : active.el;

  const [expanded, setExpanded] = useState(false);
  const [floatStep, setFloatStep] = useState(0);

  const shellRef = useRef<HTMLElement>(null);
  const layerRefs = useRef<Partial<Record<View, HTMLDivElement | null>>>({});
  const sizes = useRef<Partial<Record<View, { w: number; h: number }>>>({});

  const springs = useRef({
    w: new Spring(INITIAL.w, islandSpring),
    h: new Spring(INITIAL.h, islandSpring),
    s: new Spring(1, islandSpring),
    // Live view only: a slower copy of the island that the shader melts into the real one,
    // and FLOAT's split media bubble.
    gw: new Spring(INITIAL.w, ghostSpring),
    gh: new Spring(INITIAL.h, ghostSpring),
    bubble: new Spring(0, islandSpring),
    // Cursor gravity: a gooey nub that reaches toward the pointer, the surface bulge,
    // and a ripple that spreads from a click or tap.
    nx: new Spring(CANVAS.w / 2, nubSpring),
    ny: new Spring(TOP + INITIAL.h / 2, nubSpring),
    nr: new Spring(0, nubSpring),
    pull: new Spring(0, nubSpring),
    ripple: new Spring(1, rippleSpring),
    // Home hero (live view): the island as a slab around the name, docking into the nav
    // pill as you scroll — centre and half size, plus a lagging ghost for the liquid trail.
    hx: new Spring(0, heroSpring),
    hy: new Spring(0, heroSpring),
    hw: new Spring(0, heroSpring),
    hh: new Spring(0, heroSpring),
    gx: new Spring(0, ghostSpring),
    gy: new Spring(0, ghostSpring),
    gw2: new Spring(0, ghostSpring),
    gh2: new Spring(0, ghostSpring),
  });
  const pointer = useRef({ x: -999, y: -999, rx: 0, ry: 0, dragging: false });
  const loop = useRef<SpringLoop | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<IslandRenderer | null>(null);
  const canvasWidth = useRef(CANVAS.w);
  const canvasHeight = useRef(CANVAS.h);
  /** True while the canvas covers the viewport for the hero slab. */
  const heroMode = useRef(false);
  /** Scroll progress from slab (0) to docked pill (1). */
  const heroT = useRef(1);
  const resizeCanvas = useRef<(() => void) | null>(null);
  const retargetHeroRef = useRef<(() => void) | null>(null);
  const expandedRef = useRef(false);
  const [glReady, setGlReady] = useState(false);

  // Which view the island should show right now.
  const activity = useActivity();
  const slotView = SLOT_VIEW[slot] ?? "nav";
  const view: View = expanded
    ? "nav"
    : activity
      ? ACTIVITY_VIEW[activity.kind]
      : slotView === "float-media"
        ? FLOAT_CYCLE[floatStep].view
        : slotView;
  const caseTitle = slotEl?.dataset.islandTitle ?? "";
  const notice = activity?.kind === "notify" ? activity : null;

  // Write spring values straight to the element — no React re-render per frame.
  const paint = useCallback(() => {
    const el = shellRef.current;
    if (!el) return;
    const { w, h, s, gw, gh, bubble, nx, ny, nr, pull, ripple } = springs.current;
    el.style.width = `${w.value}px`;
    el.style.height = `${h.value}px`;
    el.style.borderRadius = `${Math.min(h.value / 2, 26)}px`;
    el.style.transform = `translateX(-50%) scale(${s.value})`;

    const gl = renderer.current;
    if (!gl) return;
    const cx = canvasWidth.current / 2;
    const radius = (hh: number) => Math.min(hh, 26);
    const smooth = (x: number) => x * x * (3 - 2 * x);

    if (heroMode.current) {
      const { hx, hy, hw, hh, gx, gy, gw2, gh2 } = springs.current;
      const slab: Shape = { cx: hx.value, cy: hy.value, hw: hw.value, hh: hh.value, r: Math.min(hh.value, 30), k: 0 };
      const lag = Math.abs(gx.value - hx.value) + Math.abs(gy.value - hy.value) + Math.abs(gw2.value - hw.value) + Math.abs(gh2.value - hh.value);
      const trail: Shape = { cx: gx.value, cy: gy.value, hw: gw2.value, hh: gh2.value, r: Math.min(gh2.value, 30), k: 34 * smooth(Math.min(lag / 70, 1)) };
      const none: Shape = { cx: slab.cx, cy: slab.cy, hw: 0, hh: 0, r: 0, k: 0 };
      gl.render([slab, trail, none, none]);

      // Hand back to the small canvas once the slab has settled onto the docked pill.
      const settled = Math.abs(hy.value - (TOP + h.value / 2)) < 0.6 && Math.abs(hw.value - w.value / 2) < 0.6 && lag < 1;
      if (heroT.current >= 1 && settled) {
        heroMode.current = false;
        resizeCanvas.current?.();
      }
      return;
    }
    // Squash and stretch: widening fast makes the island a little flatter, like a liquid.
    const stretch = Math.max(-0.08, Math.min(0.08, w.velocity / 6000));
    const main: Shape = {
      cx,
      cy: TOP + h.value / 2,
      hw: (w.value / 2) * s.value,
      hh: (h.value / 2) * s.value * (1 - stretch),
      r: 0,
      k: 0,
    };
    main.r = radius(main.hh);

    // The ghost melts in only while it differs from the island, so a settled island never swells.
    const diff = Math.abs(gw.value - w.value) + Math.abs(gh.value - h.value);
    const ghost: Shape = {
      cx,
      cy: TOP + gh.value / 2,
      hw: gw.value / 2,
      hh: gh.value / 2,
      r: radius(gh.value / 2),
      k: 26 * smooth(Math.min(diff / 40, 1)),
    };

    // FLOAT's split media bubble buds out of the island's right edge and sits beside it.
    const b = Math.min(Math.max(bubble.value, 0), 1.2);
    const right = cx + main.hw;
    const bubbleR = BUBBLE_R * Math.min(1, b * 1.2);
    const bubbleShape: Shape =
      b < 0.01
        ? { cx, cy: main.cy, hw: 0, hh: 0, r: 0, k: 0 }
        : { cx: right - BUBBLE_R + (BUBBLE_R + 30) * b, cy: TOP + BUBBLE_R, hw: bubbleR, hh: bubbleR, r: bubbleR, k: 18 * Math.min(b, 1) };

    const r = Math.max(nr.value, 0);
    const nub: Shape =
      r < 0.5
        ? { cx, cy: main.cy, hw: 0, hh: 0, r: 0, k: 0 }
        : { cx: nx.value, cy: ny.value, hw: r, hh: r, r, k: 24 * Math.min(r / 6, 1) };

    const p = pointer.current;
    gl.render([main, ghost, bubbleShape, nub], { px: p.x, py: p.y, pull: pull.value, rx: p.rx, ry: p.ry, rp: ripple.value });
  }, []);

  /**
   * Retargets the cursor-gravity springs from a pointer position (canvas CSS px).
   * Uses the island's spring geometry, never the DOM, so it cannot force layout.
   */
  const aim = useCallback((px: number, py: number) => {
    const { w, h, nx, ny, nr, pull } = springs.current;
    const p = pointer.current;
    p.x = px;
    p.y = py;
    const cx = canvasWidth.current / 2;
    const hw = w.value / 2;
    const ex = Math.min(Math.max(px, cx - hw), cx + hw);
    const ey = Math.min(Math.max(py, TOP), TOP + h.value);
    const dx = px - ex;
    const dy = py - ey;
    const dist = Math.hypot(dx, dy);
    const range = p.dragging ? 260 : 150;

    if (dist > 0 && dist < range) {
      const near = 1 - dist / range;
      const reach = Math.min(dist, p.dragging ? 72 : 30) * Math.sqrt(near);
      const radius = (p.dragging ? 9 : 5) + 9 * near;
      nx.target = ex + (dx / dist) * reach;
      ny.target = Math.min(ey + (dy / dist) * reach, canvasHeight.current - radius - 6);
      nr.target = radius;
      pull.target = near;
    } else {
      // Retract into the nearest edge.
      nx.target = ex;
      ny.target = ey;
      nr.target = 0;
      pull.target = 0;
    }
    loop.current?.kick();
  }, []);

  useEffect(() => {
    const sp = springs.current;
    loop.current = new SpringLoop(Object.values(sp), paint);
    return () => loop.current?.stop();
  }, [paint]);

  useEffect(() => {
    const sp = springs.current;
    for (const s of [sp.w, sp.h, sp.s, sp.bubble]) s.config = reduced ? calmSpring : islandSpring;
    for (const s of [sp.gw, sp.gh]) s.config = reduced ? calmSpring : ghostSpring;
  }, [reduced]);

  // Cursor gravity (live view, full motion only). Touch gets the same physics by dragging.
  const physics = mode === "live" && !reduced;
  useEffect(() => {
    if (!physics) {
      const p = pointer.current;
      p.dragging = false;
      aim(-999, -999);
      return;
    }
    const toCanvas = (e: PointerEvent) => [e.clientX - (window.innerWidth - canvasWidth.current) / 2, e.clientY] as const;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && !pointer.current.dragging) return;
      // Light ticks under the finger while the liquid stretches.
      if (pointer.current.dragging) haptic("tick");
      aim(...toCanvas(e));
    };
    const onUp = () => {
      if (!pointer.current.dragging) return;
      pointer.current.dragging = false;
      aim(-999, -999);
    };
    const onLeave = () => aim(-999, -999);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [physics, aim]);

  const touchDown = (e: React.PointerEvent) => {
    if (!physics) return;
    const p = pointer.current;
    const x = e.clientX - (window.innerWidth - canvasWidth.current) / 2;
    p.rx = x;
    p.ry = e.clientY;
    const { ripple } = springs.current;
    ripple.value = 0;
    ripple.velocity = 0;
    ripple.target = 1;
    if (e.pointerType !== "mouse") {
      p.dragging = true;
      haptic("light");
    }
    loop.current?.kick();
  };

  // Live view: start the WebGL renderer once the browser is idle after load, so shader
  // compilation stays off the critical path. Until then the CSS island is shown; any
  // failure drops back to it for good.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (mode !== "live" || !canvas) return;
    const root = document.documentElement;
    let r: IslandRenderer | null = null;
    // Small canvas around the docked island, or the whole viewport while the hero slab is out.
    const size = () => {
      if (!r) return;
      const hero = heroMode.current;
      canvasWidth.current = hero ? window.innerWidth : Math.min(CANVAS.w, window.innerWidth);
      canvasHeight.current = hero ? window.innerHeight : CANVAS.h;
      canvas.style.width = `${canvasWidth.current}px`;
      canvas.style.height = `${canvasHeight.current}px`;
      r.resize(canvasWidth.current, canvasHeight.current, hero ? 1.5 : 2);
      paint();
    };
    resizeCanvas.current = size;
    const onLost = (e: Event) => {
      e.preventDefault();
      fallBackToPlain();
    };
    const init = () => {
      try {
        r = new IslandRenderer(canvas);
      } catch {
        fallBackToPlain();
        return;
      }
      renderer.current = r;
      size();
      root.dataset.islandGl = "on";
      setGlReady(true);
    };
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(init, { timeout: 1500 })
      : window.setTimeout(init, 600);
    window.addEventListener("resize", size);
    canvas.addEventListener("webglcontextlost", onLost);
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      window.removeEventListener("resize", size);
      canvas.removeEventListener("webglcontextlost", onLost);
      delete root.dataset.islandGl;
      renderer.current = null;
      resizeCanvas.current = null;
      heroMode.current = false;
      setGlReady(false);
      r?.dispose();
    };
  }, [mode, paint]);

  // Home hero: the island drops down and wraps the name, then docks into the nav pill as
  // you scroll. Geometry comes from a cached page-space rect plus scrollY — no per-frame
  // layout reads.
  const heroOn = glReady && physics && pathname === "/" && !desktop;
  useEffect(() => {
    const slotEl = document.querySelector<HTMLElement>("[data-island-hero]");
    const root = document.documentElement;
    const shell = shellRef.current;
    if (!heroOn || !slotEl || !shell) {
      root.removeAttribute("data-hero");
      if (slotEl) slotEl.style.opacity = "";
      heroT.current = 1;
      return;
    }

    let rect = { x: 0, y: 0, w: 0, h: 0 };
    const measureSlot = () => {
      const r = slotEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const padX = Math.min(34, vw * 0.05);
      const padY = Math.min(18, vw * 0.035);
      // Keep the slab on screen, with a small margin.
      const left = Math.max(8, r.left - padX);
      const right = Math.min(vw - 8, r.right + padX);
      rect = { x: left, y: r.top + window.scrollY - padY, w: right - left, h: r.height + 2 * padY };
    };
    const smooth = (a: number, b: number, x: number) => {
      const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
      return t * t * (3 - 2 * t);
    };

    const sp = springs.current;
    const retargetHero = () => {
      const t = expandedRef.current ? 1 : Math.min(Math.max(window.scrollY / (window.innerHeight * 0.55), 0), 1);
      heroT.current = t;
      const e = smooth(0, 1, t);
      const navCy = TOP + sp.h.target / 2;
      const mix = (a: number, b: number) => a + (b - a) * e;
      const cx = mix(rect.x + rect.w / 2, window.innerWidth / 2);
      const cy = mix(rect.y + rect.h / 2 - window.scrollY, navCy);
      const hw = mix(rect.w / 2, sp.w.target / 2);
      const hh = mix(rect.h / 2, sp.h.target / 2);
      sp.hx.target = sp.gx.target = cx;
      sp.hy.target = sp.gy.target = cy;
      sp.hw.target = sp.gw2.target = hw;
      sp.hh.target = sp.gh2.target = hh;

      // The real nav fades in as the slab docks; the name fades as the slab leaves it.
      root.style.setProperty("--nav-reveal", smooth(0.8, 1, t).toFixed(3));
      shell.style.pointerEvents = t > 0.9 ? "" : "none";
      slotEl.style.opacity = (1 - smooth(0.12, 0.45, t)).toFixed(3);

      if (t < 1 && !heroMode.current) {
        heroMode.current = true;
        resizeCanvas.current?.();
      }
      loop.current?.kick();
    };

    measureSlot();
    root.dataset.hero = "on";
    // Intro: start the slab as the docked pill and let it drop onto the name.
    sp.hx.snap(window.innerWidth / 2);
    sp.hy.snap(TOP + sp.h.value / 2);
    sp.hw.snap(sp.w.value / 2);
    sp.hh.snap(sp.h.value / 2);
    for (const [g, s] of [[sp.gx, sp.hx], [sp.gy, sp.hy], [sp.gw2, sp.hw], [sp.gh2, sp.hh]] as const) g.snap(s.value);
    retargetHero();

    let raf = 0;
    const onScroll = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          retargetHero();
        });
    };
    const onResize = () => {
      measureSlot();
      if (heroMode.current) resizeCanvas.current?.();
      retargetHero();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(onResize);
    retargetHeroRef.current = retargetHero;
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      retargetHeroRef.current = null;
      root.removeAttribute("data-hero");
      root.style.removeProperty("--nav-reveal");
      shell.style.pointerEvents = "";
      slotEl.style.opacity = "";
      heroT.current = 1;
      if (heroMode.current) {
        heroMode.current = false;
        resizeCanvas.current?.();
      }
    };
  }, [heroOn]);

  // Opening the nav (focus, tap) docks the slab immediately so the nav is never orphaned.
  useEffect(() => {
    expandedRef.current = expanded;
    retargetHeroRef.current?.();
  }, [expanded]);

  const measure = useCallback(() => {
    for (const v of VIEWS) {
      const node = layerRefs.current[v]?.firstElementChild as HTMLElement | null;
      if (node) sizes.current[v] = { w: Math.ceil(node.offsetWidth), h: Math.ceil(node.offsetHeight) };
    }
  }, []);

  const retarget = useCallback(
    (snap = false) => {
      const size = sizes.current[view];
      if (!size) return;
      const max = window.innerWidth - 24;
      const { w, h, gw, gh, bubble } = springs.current;
      w.target = gw.target = Math.min(size.w, max);
      h.target = gh.target = size.h;
      // Only show the bubble where there is room beside the banner.
      const roomForBubble = window.innerWidth / 2 + w.target / 2 + 2 * BUBBLE_R + 40 < window.innerWidth;
      bubble.target = view === "float-banner" && roomForBubble ? 1 : 0;
      if (snap || reduced) {
        for (const s of [w, h, gw, gh, bubble]) s.snap();
        paint();
      } else {
        loop.current?.kick();
      }
    },
    [view, reduced, paint],
  );

  // First measurement, a frame after hydration so its forced layout doesn't extend React's
  // startup task; it snaps into place without animating from the placeholder size.
  const measured = useRef(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      measure();
      retarget(true);
      measured.current = true;
    });
    document.fonts?.ready.then(() => {
      measure();
      retarget(true);
    });
    const onResize = () => {
      measure();
      retarget();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []); // mount only; later changes go through the effect below

  // Content of the case view changes with the route, so re-measure it.
  useLayoutEffect(() => {
    if (!measured.current) return;
    measure();
    retarget();
  }, [view, caseTitle, notice?.title, notice?.body, measure, retarget]);

  // FLOAT chapter: cycle through FLOAT's states while the section is on screen.
  useEffect(() => {
    if (slotView !== "float-media" || reduced || paused) {
      setFloatStep(0);
      return;
    }
    const t = setTimeout(() => setFloatStep((i) => (i + 1) % FLOAT_CYCLE.length), FLOAT_CYCLE[floatStep].ms);
    return () => clearTimeout(t);
  }, [slotView, floatStep, reduced, paused]);

  // Timeline chapter: the bar fills with scroll progress through the section.
  useEffect(() => {
    if (slot !== "timeline" || !slotEl) return;
    const shell = shellRef.current;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = slotEl.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.5 - r.top) / r.height));
      shell?.style.setProperty("--p", p.toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [slot, slotEl]);

  // A tap opens the nav; scrolling or a few seconds of idling closes it again.
  useEffect(() => {
    if (!expanded) return;
    const close = () => {
      if (!shellRef.current?.matches(":hover, :focus-within")) setExpanded(false);
    };
    const t = setTimeout(close, 5000);
    window.addEventListener("scroll", close, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", close);
    };
  }, [expanded]);

  // Close the nav after navigating.
  useEffect(() => setExpanded(false), [pathname]);

  // A tiny click each time the island changes shape (when sound is on).
  const firstView = useRef(true);
  useEffect(() => {
    if (firstView.current) {
      firstView.current = false;
      return;
    }
    play("tock");
  }, [view]);

  const press = (down: boolean) => {
    if (reduced) return;
    springs.current.s.target = down ? 0.96 : 1;
    loop.current?.kick();
  };

  const layer = (v: View, content: React.ReactNode, decorative = true) => (
    <div
      key={v}
      ref={(node) => {
        layerRefs.current[v] = node;
      }}
      className="island-layer"
      data-on={view === v}
      aria-hidden={decorative ? true : undefined}
    >
      {content}
    </div>
  );

  return (
    <>
    {mode === "live" && <canvas ref={canvasRef} className="island-canvas" aria-hidden="true" />}
    <header
      ref={shellRef}
      className="island"
      data-island
      data-view={view}
      style={{ width: INITIAL.w, height: INITIAL.h }}
      onPointerEnter={(e) => e.pointerType === "mouse" && setExpanded(true)}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setExpanded(false);
        press(false);
      }}
      onPointerDown={(e) => {
        press(true);
        touchDown(e);
      }}
      onPointerUp={() => press(false)}
      onClick={() => !expanded && setExpanded(true)}
      onFocus={() => setExpanded(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setExpanded(false);
      }}
    >
      {layer(
        "nav",
        <div className="island-content">
          <Link href="/" className="island-mark" aria-label="Sahaj Alatage — home">S</Link>
          <nav className="island-nav" aria-label="Primary">
            <Link href="/#work">Work</Link>
            <Link href="/#about">About</Link>
            <Link href="/#contact">Contact</Link>
          </nav>
          <button type="button" className="island-search" onClick={openPalette} aria-label="Open command palette (Ctrl or Command + K)">
            <kbd>⌘K</kbd>
          </button>
        </div>,
        false,
      )}

      {layer(
        "work",
        <div className="island-content">
          <span className="island-mark" />
          <span className="i-label">Selected work</span>
          <span className="i-meta">5 projects</span>
        </div>,
      )}

      {layer(
        "float-media",
        <div className="island-content">
          <span className="i-art" />
          <span className="i-stack">
            <span className="i-label">Now playing</span>
            <span className="i-meta">FLOAT · Dynamic Island</span>
          </span>
          <span className="i-eq"><i /><i /><i /><i /><i /></span>
        </div>,
      )}

      {layer(
        "float-banner",
        <div className="island-content i-banner">
          <span className="island-mark">S</span>
          <span className="i-stack">
            <span className="i-label">New notification</span>
            <span className="i-meta">The island restores its last state after 3.5 s</span>
          </span>
        </div>,
      )}

      {layer("float-orb", <div className="island-content i-orb"><span className="island-mark" /></div>)}

      {layer(
        "portrait",
        <div className="island-content">
          <img className="i-avatar" src="/portrait.webp" alt="" width={30} height={30} />
          <span className="i-label">Sahaj Alatage</span>
          <span className="i-meta">made this world</span>
        </div>,
      )}

      {layer(
        "timeline",
        <div className="island-content i-timeline">
          <span className="i-track"><span className="i-fill" /></span>
          <span className="i-beads"><i /><i /><i /><i /><i /></span>
        </div>,
      )}

      {layer(
        "terminal",
        <div className="island-content i-term">
          <span className="i-prompt">~ %</span>
          <span className="i-type">whoami</span>
          <span className="i-caret" />
        </div>,
      )}

      {layer(
        "case",
        <div className="island-content">
          <span className="i-meta">← All work</span>
          <span className="i-label">{caseTitle}</span>
        </div>,
      )}

      {/* Project activities, shown while a project card is hovered or focused. */}
      {layer(
        "act-harika",
        <div className="island-content">
          <span className="i-core" />
          <span className="i-stack">
            <span className="i-label">HARIKA</span>
            <span className="i-meta i-cycle">
              <span>Remembering you…</span>
              <span>Planning the task…</span>
              <span>Acting on it.</span>
            </span>
          </span>
        </div>,
      )}

      {layer(
        "act-mtb",
        <div className="island-content">
          <span className="i-book"><i /><i /></span>
          <span className="i-stack">
            <span className="i-label">MotherTongue Books</span>
            <span className="i-meta" lang="te">ఒకప్పుడు, ఒక అడవిలో…</span>
          </span>
        </div>,
      )}

      {layer(
        "act-pie",
        <div className="island-content">
          <span className="i-doc" />
          <span className="i-stack">
            <span className="i-label">PIE</span>
            <span className="i-meta i-fix">
              Please <s>recieve</s> <b>receive</b> the signed PDF
            </span>
          </span>
        </div>,
      )}

      {layer(
        "notify",
        <div className="island-content i-banner">
          <span className="island-mark">S</span>
          <span className="i-stack">
            <span className="i-label">{notice?.title ?? ""}</span>
            <span className="i-meta">{notice?.body ?? ""}</span>
          </span>
        </div>,
      )}
    </header>
    </>
  );
}
