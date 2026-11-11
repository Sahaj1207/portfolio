"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { showActivity } from "@/lib/islandBus";
import { haptic } from "@/lib/haptics";

/**
 * An OS window over the page, grown from the island at the top. Red closes, yellow
 * minimises back into the island, green opens the full page. Esc closes; focus moves in
 * and returns to where it was.
 */
export function Window({ title, slug, children }: { title: string; slug: string; children: ReactNode }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState<null | "close" | "minimise">(null);
  const panel = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  // Drag the window around by its title bar (pointer devices with room to spare).
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const onBarDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || window.innerWidth < 720 || (e.target as HTMLElement).closest("button")) return;
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onBarMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const limX = window.innerWidth / 2;
    setOffset({
      x: Math.max(-limX, Math.min(limX, d.ox + e.clientX - d.x)),
      y: Math.max(-40, Math.min(window.innerHeight - 140, d.oy + e.clientY - d.y)),
    });
  };
  const onBarUp = () => {
    drag.current = null;
  };

  const leave = (how: "close" | "minimise") => {
    if (leaving) return;
    setLeaving(how);
    haptic("light");
    if (how === "minimise") showActivity({ kind: "notify", title: "Minimised", body: `${title} — tap ⌘K to reopen` }, "window", 3200);
    setTimeout(() => router.back(), how === "minimise" ? 380 : 260);
  };

  // Lock the page behind the window, focus the window, restore both on close.
  useEffect(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    root.dataset.window = "on";
    haptic("firm");
    panel.current?.focus({ preventScroll: true });
    return () => {
      delete root.dataset.window;
      returnFocus.current?.focus?.({ preventScroll: true });
    };
  }, []);

  // Each new project starts at the top of the window.
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") leave("close");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="window-backdrop" data-leaving={leaving ?? undefined} onMouseDown={(e) => e.target === e.currentTarget && leave("close")}>
      <div
        ref={panel}
        className="window"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={{ "--dx": `${offset.x}px`, "--dy": `${offset.y}px` } as React.CSSProperties}
      >
        <div
          className="window-bar"
          onPointerDown={onBarDown}
          onPointerMove={onBarMove}
          onPointerUp={onBarUp}
          onPointerCancel={onBarUp}
          onDoubleClick={() => setOffset({ x: 0, y: 0 })}
        >
          <div className="window-lights">
            <button type="button" className="light red" onClick={() => leave("close")} aria-label="Close window" />
            <button type="button" className="light yellow" onClick={() => leave("minimise")} aria-label="Minimise into the island" />
            <button
              type="button"
              className="light green"
              onClick={() => window.location.assign(`/work/${slug}`)}
              aria-label="Open as a full page"
            />
          </div>
          <span className="window-title">~/work/{slug}</span>
          <span className="window-esc" aria-hidden="true">esc</span>
        </div>
        <div ref={body} className="window-body">{children}</div>
      </div>
    </div>
  );
}
