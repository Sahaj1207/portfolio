"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Spring, SpringLoop, calmSpring, islandSpring } from "@/lib/spring";
import { useActiveSlot, useReducedMotion } from "@/lib/useActiveSlot";

/**
 * The island. Plain view renders it as a DOM capsule whose size is driven by springs;
 * each page chapter (a `[data-island-slot]` section) gives it a different state.
 * Hover, focus or tap always opens the navigation state.
 */

type View = "nav" | "work" | "float-media" | "float-banner" | "float-orb" | "portrait" | "timeline" | "terminal" | "case";

const VIEWS: View[] = ["nav", "work", "float-media", "float-banner", "float-orb", "portrait", "timeline", "terminal", "case"];

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

export function Island() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
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
  });
  const loop = useRef<SpringLoop | null>(null);

  // Which view the island should show right now.
  const slotView = SLOT_VIEW[slot] ?? "nav";
  const view: View = expanded ? "nav" : slotView === "float-media" ? FLOAT_CYCLE[floatStep].view : slotView;
  const caseTitle = slotEl?.dataset.islandTitle ?? "";

  // Write spring values straight to the element — no React re-render per frame.
  const paint = useCallback(() => {
    const el = shellRef.current;
    if (!el) return;
    const { w, h, s } = springs.current;
    el.style.width = `${w.value}px`;
    el.style.height = `${h.value}px`;
    el.style.borderRadius = `${Math.min(h.value / 2, 26)}px`;
    el.style.transform = `translateX(-50%) scale(${s.value})`;
  }, []);

  useEffect(() => {
    const { w, h, s } = springs.current;
    loop.current = new SpringLoop([w, h, s], paint);
    return () => loop.current?.stop();
  }, [paint]);

  useEffect(() => {
    const config = reduced ? calmSpring : islandSpring;
    Object.values(springs.current).forEach((sp) => (sp.config = config));
  }, [reduced]);

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
      const { w, h } = springs.current;
      w.target = Math.min(size.w, max);
      h.target = size.h;
      if (snap || reduced) {
        w.snap();
        h.snap();
        paint();
      } else {
        loop.current?.kick();
      }
    },
    [view, reduced, paint],
  );

  // First measurement: snap into place without animating from the placeholder size.
  useLayoutEffect(() => {
    measure();
    retarget(true);
    document.fonts?.ready.then(() => {
      measure();
      retarget(true);
    });
    const onResize = () => {
      measure();
      retarget();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []); // mount only; later changes go through the effect below

  // Content of the case view changes with the route, so re-measure it.
  useLayoutEffect(() => {
    measure();
    retarget();
  }, [view, caseTitle, measure, retarget]);

  // FLOAT chapter: cycle through FLOAT's states while the section is on screen.
  useEffect(() => {
    if (slotView !== "float-media" || reduced) {
      setFloatStep(0);
      return;
    }
    const t = setTimeout(() => setFloatStep((i) => (i + 1) % FLOAT_CYCLE.length), FLOAT_CYCLE[floatStep].ms);
    return () => clearTimeout(t);
  }, [slotView, floatStep, reduced]);

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
      onPointerDown={() => press(true)}
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
    </header>
  );
}
