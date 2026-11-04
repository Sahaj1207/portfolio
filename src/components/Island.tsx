"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { IslandRenderer, type Shape } from "@/lib/islandGL";
import { Spring, SpringLoop, calmSpring, ghostSpring, islandSpring, nubSpring, rippleSpring } from "@/lib/spring";
import { useActiveSlot, useReducedMotion } from "@/lib/useActiveSlot";
import { type Activity, useActivity } from "@/lib/islandBus";
import { useMotionPaused } from "@/lib/motion";
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
  const { slot, el: slotEl } = useActiveSlot(pathname);

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
  });
  const pointer = useRef({ x: -999, y: -999, rx: 0, ry: 0, dragging: false });
  const loop = useRef<SpringLoop | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<IslandRenderer | null>(null);
  const canvasWidth = useRef(CANVAS.w);

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
      ny.target = Math.min(ey + (dy / dist) * reach, CANVAS.h - radius - 6);
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
    if (e.pointerType !== "mouse") p.dragging = true;
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
    const size = () => {
      if (!r) return;
      canvasWidth.current = Math.min(CANVAS.w, window.innerWidth);
      canvas.style.width = `${canvasWidth.current}px`;
      canvas.style.height = `${CANVAS.h}px`;
      r.resize(canvasWidth.current, CANVAS.h);
      paint();
    };
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
      r?.dispose();
    };
  }, [mode, paint]);

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
          <span className="i-meta">Behind the island</span>
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
