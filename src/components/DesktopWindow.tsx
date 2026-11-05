"use client";

import type React from "react";
import { type PointerEvent as ReactPointerEvent, type ReactNode, useRef, useState } from "react";
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
  toggleMax,
} from "@/lib/desktop";

export type Rect = { x: number; y: number; w: number; h: number };

const MIN_W = 340;
const MIN_H = 240;
const GAP = 8;

/** Where a window actually sits: its own rect, or the half / whole screen it is snapped to. */
export function frameOf(win: Win, vw: number, vh: number): Rect {
  const h = vh - TOP - DOCK;
  if (win.snap === "max") return { x: GAP, y: TOP, w: vw - GAP * 2, h };
  if (win.snap === "left") return { x: GAP, y: TOP, w: (vw - GAP * 3) / 2, h };
  if (win.snap === "right") return { x: (vw + GAP) / 2, y: TOP, w: (vw - GAP * 3) / 2, h };
  return { x: win.x, y: win.y, w: win.w, h: win.h };
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
  const frame = narrow ? { x: GAP, y: TOP, w: vw - GAP * 2, h: vh - TOP - DOCK } : frameOf(win, vw, vh);
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
    const tx = (icon ? icon.x + icon.width / 2 : vw / 2) - (frame.x + frame.w / 2);
    const ty = (icon ? icon.y + icon.height / 2 : vh - 40) - (frame.y + frame.h / 2);
    transform = `translate(${tx}px, ${ty}px) scale(0.06)`;
  } else if (cell) {
    const s = (scale = Math.min(cell.w / frame.w, cell.h / frame.h, 1));
    const tx = cell.x + (cell.w - frame.w * s) / 2 - frame.x;
    const ty = cell.y + (cell.h - frame.h * s) / 2 - frame.y;
    transform = `translate(${tx}px, ${ty}px) scale(${s})`;
  }

  const edges = ["e", "s", "se"];

  return (
    <section
      className="dwin"
      role="dialog"
      aria-label={APPS[app].name}
      data-app={app}
      data-focused={focused || undefined}
      data-min={win.min || undefined}
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
          <button type="button" className="light green" onClick={() => toggleMax(app)} aria-label={win.snap === "max" ? "Restore size" : "Fill the screen"} />
        </div>
        <span className="dwin-title">{APPS[app].title}</span>
        <span />
      </div>
      <div className="dwin-body">{children}</div>
      {cell && <span className="dwin-label">{APPS[app].name}</span>}
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
