"use client";

import { useSyncExternalStore } from "react";
import { haptic } from "@/lib/haptics";
import { transition } from "@/lib/sound";

/**
 * Desktop mode: the page becomes a desktop with a dock and real windows you can drag,
 * resize, snap, minimise and stack. Off by default, so the page stays the professional
 * view; the menu bar, the palette, the right-click menu or `startx` turn it on. The layout
 * survives a reload in the same tab.
 */

export type AppId =
  | "finder" | "terminal" | "photos" | "notes" | "contact" | "settings" | "about"
  | "float" | "pie" | "harika" | "vayucast";
/** Halves, quarters or the whole screen. */
export type Snap = "left" | "right" | "max" | "tl" | "tr" | "bl" | "br" | null;

export type Win = {
  app: AppId;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  min: boolean;
  snap: Snap;
  /** Playing its close animation; removed once that finishes. */
  closing?: boolean;
};

export type DesktopState = { on: boolean; windows: Win[]; mission: boolean; focused: AppId | null; booting: boolean };

export const APPS: Record<AppId, { name: string; title: string; w: number; h: number }> = {
  finder: { name: "Finder", title: "~/work", w: 860, h: 540 },
  terminal: { name: "Terminal", title: "~/sahaj — tmux", w: 820, h: 600 },
  photos: { name: "Photos", title: "portrait.webp", w: 560, h: 640 },
  notes: { name: "Notes", title: "README.md", w: 640, h: 580 },
  contact: { name: "Contact", title: "Say hello", w: 460, h: 420 },
  settings: { name: "Settings", title: "System Settings", w: 560, h: 520 },
  about: { name: "About", title: "About sahaj.os", w: 420, h: 440 },
  float: { name: "FLOAT", title: "FLOAT — try the island", w: 860, h: 500 },
  pie: { name: "PIE", title: "PIE — edit the text in a photo", w: 900, h: 520 },
  harika: { name: "HARIKA", title: "HARIKA — ask it something", w: 900, h: 560 },
  vayucast: { name: "VayuCast", title: "VayuCast — tomorrow's air", w: 820, h: 620 },
};

/** Projects with a playable demo on the desktop, by project slug. */
export const DEMOS: Partial<Record<string, AppId>> = { float: "float", pie: "pie", harika: "harika", vayucast: "vayucast" };

/** Top of the usable area (below the menu bar) and the room the dock takes at the bottom. */
export const TOP = 64;
export const DOCK = 92;
const KEY = "sahaj:desktop";

const listeners = new Set<() => void>();
let state: DesktopState = { on: false, windows: [], mission: false, focused: null, booting: false };
let topZ = 1;
let restored = false;

function set(next: Partial<DesktopState>) {
  state = { ...state, ...next };
  if (next.on !== undefined) {
    const root = document.documentElement;
    if (state.on) root.dataset.desktop = "on";
    else delete root.dataset.desktop;
  }
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ on: state.on, windows: state.windows.filter((w) => !w.closing) }));
  } catch {
    /* private mode: the layout just isn't kept */
  }
  listeners.forEach((l) => l());
}

function restore() {
  if (restored) return;
  restored = true;
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null") as Pick<DesktopState, "on" | "windows"> | null;
    if (!saved?.on) return;
    topZ = Math.max(1, ...saved.windows.map((w) => w.z));
    const front = [...saved.windows].filter((w) => !w.min).sort((a, b) => b.z - a.z)[0];
    set({ on: true, windows: saved.windows, focused: front?.app ?? null, booting: false });
  } catch {
    /* corrupt or missing: start fresh */
  }
}

/** Opening position: centred, cascading a little for each window already open. */
function place(app: AppId): Win {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spec = APPS[app];
  const w = Math.min(spec.w, vw - 32);
  const h = Math.min(spec.h, vh - TOP - DOCK - 16);
  const n = state.windows.length;
  const x = Math.max(16, Math.round((vw - w) / 2 + (n - 1) * 28));
  const y = Math.max(TOP, Math.round(TOP + (vh - TOP - DOCK - h) / 2 + (n - 1) * 24));
  return { app, x: Math.min(x, vw - w - 16), y, w, h, z: ++topZ, min: false, snap: null };
}

const update = (app: AppId, patch: Partial<Win>) =>
  set({ windows: state.windows.map((w) => (w.app === app ? { ...w, ...patch } : w)) });

/**
 * Turns the desktop on. `boot` plays the short boot log first (from `startx` or the
 * first-visit "Boot the desktop"), unless the visitor prefers reduced motion.
 */
export function enterDesktop(app?: AppId, { boot = false } = {}) {
  if (!state.on) {
    const booting = boot && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!booting) {
      transition("in");
      haptic("firm");
    }
    set({ on: true, mission: false, booting });
  }
  if (app) openApp(app);
}

/** The boot log has finished (or was skipped). */
export function endBoot() {
  if (!state.booting) return;
  transition("in");
  haptic("firm");
  set({ booting: false });
}

/** Snaps a window to a half, a quarter or the whole screen. */
export function snapApp(app: AppId, snap: Snap) {
  haptic("tick");
  update(app, { snap, z: ++topZ, min: false });
  set({ focused: app });
}

export function exitDesktop() {
  if (!state.on) return;
  transition("out");
  haptic("light");
  set({ on: false, mission: false });
}

export function openApp(app: AppId) {
  if (!state.on) set({ on: true });
  if (state.windows.some((w) => w.app === app && w.closing)) set({ windows: state.windows.filter((w) => w.app !== app) });
  const existing = state.windows.find((w) => w.app === app);
  if (existing) return focusApp(app);
  haptic("light");
  set({ windows: [...state.windows, place(app)], focused: app, mission: false });
}

/** How long a window takes to close (matches .dwin[data-closing] in the CSS). */
const CLOSE_MS = 220;

export function closeApp(app: AppId) {
  const win = state.windows.find((w) => w.app === app);
  if (!win || win.closing) return;
  haptic("light");
  const remaining = state.windows.filter((w) => w.app !== app);
  const front = remaining.filter((w) => !w.min).sort((a, b) => b.z - a.z)[0];
  const remove = () => set({ windows: state.windows.filter((w) => w.app !== app) });
  // Let it shrink and fade first, like macOS; then it's gone.
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    set({ windows: remaining, focused: front?.app ?? null });
    return;
  }
  set({ windows: state.windows.map((w) => (w.app === app ? { ...w, closing: true } : w)), focused: front?.app ?? null });
  setTimeout(remove, CLOSE_MS);
}

export function focusApp(app: AppId) {
  const win = state.windows.find((w) => w.app === app);
  if (!win) return;
  if (state.focused === app && win.z === topZ && !win.min) return;
  set({
    windows: state.windows.map((w) => (w.app === app ? { ...w, z: ++topZ, min: false } : w)),
    focused: app,
  });
}

export function minimiseApp(app: AppId) {
  haptic("light");
  const windows = state.windows.map((w) => (w.app === app ? { ...w, min: true } : w));
  const front = windows.filter((w) => !w.min).sort((a, b) => b.z - a.z)[0];
  set({ windows, focused: front?.app ?? null });
}

export function toggleMax(app: AppId) {
  const win = state.windows.find((w) => w.app === app);
  if (!win) return;
  haptic("tick");
  update(app, { snap: win.snap ? null : "max", z: ++topZ });
}

export const moveApp = (app: AppId, x: number, y: number, snap: Snap = null) => update(app, { x, y, snap });
export const resizeApp = (app: AppId, w: number, h: number) => update(app, { w, h, snap: null });

/** Mission Control: every open window, side by side. */
export function setMission(on: boolean) {
  if (on === state.mission) return;
  if (on && !state.on) set({ on: true });
  haptic("light");
  set({ mission: on });
}

export const isDesktopOn = () => state.on;

export function useDesktop(): DesktopState {
  return useSyncExternalStore(
    (cb) => {
      restore();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => SERVER,
  );
}
const SERVER: DesktopState = { on: false, windows: [], mission: false, focused: null, booting: false };
