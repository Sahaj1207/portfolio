"use client";

import type React from "react";
import { type PointerEvent as ReactPointerEvent, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  APPS,
  type AppId,
  DOCK,
  type Snap,
  TOP,
  type Win,
  closeApp,
  focusApp,
  minimiseApp,
  moveApp,
  resizeApp,
  setMission,
  snapApp,
  toggleMax,
} from "@/lib/desktop";

export type Rect = { x: number; y: number; w: number; h: number };

/** Holding a phone app's home bar opens the app switcher. */
export const SWITCHER = "sahaj:app-switcher";

const MIN_W = 340;
const MIN_H = 240;
const GAP = 8;

/** Where a window actually sits: its own rect, or the half / whole screen it is snapped to. */
export function snapRect(snap: Exclude<Snap, null>, vw: number, vh: number): Rect {
  const h = vh - TOP - DOCK;
  const halfW = (vw - GAP * 3) / 2;
  const halfH = (h - GAP) / 2;
  const right = (vw + GAP) / 2;
  switch (snap) {
    case "max":
      return { x: GAP, y: TOP, w: vw - GAP * 2, h };
    case "left":
      return { x: GAP, y: TOP, w: halfW, h };
    case "right":
      return { x: right, y: TOP, w: halfW, h };
    case "tl":
      return { x: GAP, y: TOP, w: halfW, h: halfH };
    case "tr":
      return { x: right, y: TOP, w: halfW, h: halfH };
    case "bl":
      return { x: GAP, y: TOP + halfH + GAP, w: halfW, h: halfH };
    case "br":
      return { x: right, y: TOP + halfH + GAP, w: halfW, h: halfH };
  }
}

export function frameOf(win: Win, vw: number, vh: number): Rect {
  return win.snap ? snapRect(win.snap, vw, vh) : { x: win.x, y: win.y, w: win.w, h: win.h };
}

/** Windows-style snap layouts, shown when the pointer rests on the green button. */
const LAYOUTS: { label: string; cells: [Exclude<Snap, null>, string][] }[] = [
  { label: "Halves", cells: [["left", "1 / 1 / 3 / 2"], ["right", "1 / 2 / 3 / 3"]] },
  { label: "Full", cells: [["max", "1 / 1 / 3 / 3"]] },
  { label: "Quarters", cells: [["tl", "1 / 1 / 2 / 2"], ["tr", "1 / 2 / 2 / 3"], ["bl", "2 / 1 / 3 / 2"], ["br", "2 / 2 / 3 / 3"]] },
];

function SnapFlyout({ app, onDone }: { app: AppId; onDone: () => void }) {
  return (
    <div className="snap-flyout" role="menu" aria-label="Snap layouts" onPointerDown={(e) => e.stopPropagation()}>
      {LAYOUTS.map((l) => (
        <div key={l.label} className="snap-layout" aria-label={l.label}>
          {l.cells.map(([snap, area]) => (
            <button
              key={snap}
              type="button"
              role="menuitem"
              aria-label={`Snap to ${snap === "max" ? "full screen" : snap === "left" ? "left half" : snap === "right" ? "right half" : `${snap[0] === "t" ? "top" : "bottom"} ${snap[1] === "l" ? "left" : "right"} quarter`}`}
              style={{ gridArea: area }}
              onClick={() => (snapApp(app, snap), onDone())}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** The edge snap a drag would land on, from where the pointer is. */
function snapAt(x: number, y: number, vw: number): Snap {
  if (y <= 40) return "max";
  if (x <= 6) return "left";
  if (x >= vw - 6) return "right";
  return null;
}

type Props = {
  win: Win;
  vw: number;
  vh: number;
  focused: boolean;
  /** Mission Control: the cell this window shrinks into, or null on the normal desktop. */
  cell: Rect | null;
  narrow: boolean;
  onSnapPreview: (snap: Snap) => void;
  children: ReactNode;
};

/**
 * One desktop window. Drag it by the title bar, resize it from the edges, double-click
 * the title to fill the screen, drag to an edge to snap. Yellow sends it to the dock.
 */
export function DesktopWindow({ win, vw, vh, focused, cell, narrow, onSnapPreview, children }: Props) {
  const { app } = win;
  // Phones: every app fills the screen under the island, with a home bar at the bottom.
  const frame = narrow ? { x: 6, y: TOP, w: vw - 12, h: vh - TOP - 6 } : frameOf(win, vw, vh);
  const [flyout, setFlyout] = useState(false);
  const flyoutTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(flyoutTimer.current), []);
  const showFlyout = () => {
    clearTimeout(flyoutTimer.current);
    flyoutTimer.current = setTimeout(() => setFlyout(true), 420);
  };
  const hideFlyout = () => {
    clearTimeout(flyoutTimer.current);
    flyoutTimer.current = setTimeout(() => setFlyout(false), 260);
  };
  const swipe = useRef<number | null>(null);
  const hold = useRef<ReturnType<typeof setTimeout>>(undefined);
  const el = useRef<HTMLElement>(null);

  // Opening zooms out of the app's icon (dock, or home screen on phones), like macOS.
  useLayoutEffect(() => {
    const node = el.current;
    if (!node || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const icon = document.querySelector(`[data-dock-app="${app}"]`)?.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    node.style.transition = "none";
    node.style.transform = icon
      ? `translate(${icon.x - r.x}px, ${icon.y - r.y}px) scale(${icon.width / r.width}, ${icon.height / r.height})`
      : `translate(${r.width * 0.04}px, ${r.height * 0.04}px) scale(0.92)`;
    node.style.opacity = "0";
    // Force layout at the icon, then animate to the window's own place.
    node.getBoundingClientRect();
    node.style.transition = "transform 0.48s cubic-bezier(0.2, 0.85, 0.25, 1), opacity 0.22s ease";
    node.style.transform = "";
    node.style.opacity = "";
    const done = () => (node.style.transition = "");
    const id = setTimeout(done, 600);
    return () => clearTimeout(id);
    // Only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const drag = useRef<{ dx: number; dy: number; snap: Snap } | null>(null);
  const size = useRef<{ edge: string; x0: number; y0: number; w0: number; h0: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const onBarDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || narrow || cell || (e.target as HTMLElement).closest("button")) return;
    focusApp(app);
    let { x, y } = frame;
    // Pulling a snapped window off its edge restores its own size under the pointer.
    if (win.snap) {
      x = e.clientX - win.w * ((e.clientX - frame.x) / frame.w);
      y = frame.y;
      moveApp(app, x, y);
    }
    drag.current = { dx: e.clientX - x, dy: e.clientY - y, snap: null };
    e.currentTarget.setPointerCapture(e.pointerId);
    setBusy(true);
  };

  const onBarMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const x = Math.min(Math.max(e.clientX - d.dx, 120 - win.w), vw - 120);
    const y = Math.min(Math.max(e.clientY - d.dy, TOP), vh - 80);
    const snap = snapAt(e.clientX, e.clientY, vw);
    if (snap !== d.snap) {
      d.snap = snap;
      onSnapPreview(snap);
    }
    moveApp(app, x, y);
  };

  const onBarUp = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    setBusy(false);
    onSnapPreview(null);
    if (d.snap) moveApp(app, win.x, win.y, d.snap);
  };

  const onEdgeDown = (edge: string) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || narrow || cell) return;
    e.stopPropagation();
    focusApp(app);
    if (win.snap) moveApp(app, frame.x, frame.y);
    size.current = { edge, x0: e.clientX, y0: e.clientY, w0: frame.w, h0: frame.h };
    if (win.snap) resizeApp(app, frame.w, frame.h);
    e.currentTarget.setPointerCapture(e.pointerId);
    setBusy(true);
  };

  const onEdgeMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = size.current;
    if (!s) return;
    const w = s.edge.includes("e") ? Math.max(MIN_W, Math.min(s.w0 + e.clientX - s.x0, vw - win.x - GAP)) : s.w0;
    const h = s.edge.includes("s") ? Math.max(MIN_H, Math.min(s.h0 + e.clientY - s.y0, vh - win.y - GAP)) : s.h0;
    resizeApp(app, w, h);
  };

  const onEdgeUp = () => {
    size.current = null;
    setBusy(false);
  };

  // Minimised windows fall into their dock icon; Mission Control shrinks each into a cell.
  let transform: string | undefined;
  let scale = 1;
  if (win.min) {
    const icon = typeof document !== "undefined" ? document.querySelector(`[data-dock-app="${app}"]`)?.getBoundingClientRect() : null;
    const box = icon ?? { x: vw / 2 - 24, y: vh - 60, width: 48, height: 48 };
    // transform-origin is the top-left corner, so this lands the window exactly on the icon.
    transform = `translate(${box.x - frame.x}px, ${box.y - frame.y}px) scale(${box.width / frame.w}, ${box.height / frame.h})`;
  } else if (cell) {
    const s = (scale = Math.min(cell.w / frame.w, cell.h / frame.h, 1));
    const tx = cell.x + (cell.w - frame.w * s) / 2 - frame.x;
    const ty = cell.y + (cell.h - frame.h * s) / 2 - frame.y;
    transform = `translate(${tx}px, ${ty}px) scale(${s})`;
  }

  const edges = ["e", "s", "se"];

  return (
    <section
      ref={el}
      className="dwin"
      role="dialog"
      aria-label={APPS[app].name}
      data-app={app}
      data-focused={focused || undefined}
      data-min={win.min || undefined}
      data-closing={win.closing || undefined}
      data-busy={busy || undefined}
      data-overview={cell ? "on" : undefined}
      style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h, zIndex: win.z, transform, "--s": scale } as React.CSSProperties}
      onPointerDownCapture={() => !cell && focusApp(app)}
      onClick={cell ? () => (focusApp(app), setMission(false)) : undefined}
    >
      <div
        className="dwin-bar"
        onPointerDown={onBarDown}
        onPointerMove={onBarMove}
        onPointerUp={onBarUp}
        onPointerCancel={onBarUp}
        onDoubleClick={() => !narrow && toggleMax(app)}
      >
        <div className="window-lights">
          <button type="button" className="light red" onClick={() => closeApp(app)} aria-label={`Close ${APPS[app].name}`} />
          <button type="button" className="light yellow" onClick={() => minimiseApp(app)} aria-label={`Minimise ${APPS[app].name} to the dock`} />
          <span className="light-wrap" onPointerEnter={() => !narrow && !cell && showFlyout()} onPointerLeave={hideFlyout}>
            <button type="button" className="light green" onClick={() => toggleMax(app)} aria-label={win.snap === "max" ? "Restore size" : "Fill the screen"} />
            {flyout && <SnapFlyout app={app} onDone={() => setFlyout(false)} />}
          </span>
        </div>
        <span className="dwin-title">{APPS[app].title}</span>
        <span />
      </div>
      <div className="dwin-body">{children}</div>
      {cell && <span className="dwin-label">{APPS[app].name}</span>}
      {narrow && (
        <button
          type="button"
          className="home-bar"
          aria-label="Go home"
          // A tap or a swipe up goes home; Enter or Space too.
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), minimiseApp(app))}
          onPointerDown={(e) => {
            swipe.current = e.clientY;
            hold.current = setTimeout(() => {
              swipe.current = null;
              window.dispatchEvent(new Event(SWITCHER));
            }, 450);
          }}
          onPointerUp={(e) => {
            clearTimeout(hold.current);
            const start = swipe.current;
            swipe.current = null;
            if (start !== null && (start - e.clientY > 30 || Math.abs(start - e.clientY) < 10)) minimiseApp(app);
          }}
          onPointerCancel={() => clearTimeout(hold.current)}
        />
      )}
      {!narrow &&
        edges.map((edge) => (
          <div
            key={edge}
            className={`dwin-edge dwin-edge-${edge}`}
            aria-hidden="true"
            onPointerDown={onEdgeDown(edge)}
            onPointerMove={onEdgeMove}
            onPointerUp={onEdgeUp}
            onPointerCancel={onEdgeUp}
          />
        ))}
    </section>
  );
}
