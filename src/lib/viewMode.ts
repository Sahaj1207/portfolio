"use client";

import { useSyncExternalStore } from "react";

/**
 * "live" renders the island (and later the particle portrait) with WebGL.
 * "plain" is the designed navy/serif fallback: CSS-only, no canvas.
 *
 * Plain is chosen automatically for reduced motion, Save-Data or no WebGL2,
 * and either mode can be chosen explicitly; the choice is remembered.
 */
export type ViewMode = "live" | "plain";

const KEY = "sahaj:view";
const listeners = new Set<() => void>();
let mode: ViewMode = "plain";
let started = false;

function supportsWebGL2() {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

function autoMode(): ViewMode {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  return !reduced && !saveData && supportsWebGL2() ? "live" : "plain";
}

function readStored(): ViewMode | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "live" || v === "plain" ? v : null;
  } catch {
    return null;
  }
}

function apply(next: ViewMode) {
  mode = next;
  document.documentElement.dataset.view = next;
  listeners.forEach((l) => l());
}

function start() {
  if (started) return;
  started = true;
  const stored = readStored();
  apply(stored === "live" && !supportsWebGL2() ? "plain" : (stored ?? autoMode()));
}

export function setViewMode(next: ViewMode) {
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* private mode: the choice just isn't remembered */
  }
  apply(next);
}

/** Drops to plain view without remembering it, e.g. after a lost WebGL context. */
export function fallBackToPlain() {
  apply("plain");
}

export function useViewMode(): ViewMode {
  return useSyncExternalStore(
    (cb) => {
      start();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => mode,
    () => "plain",
  );
}
