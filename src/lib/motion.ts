"use client";

import { useSyncExternalStore } from "react";

/**
 * "Pause motion" (WCAG 2.2.2 Pause, Stop, Hide): stops everything that moves on its own —
 * the FLOAT cycle, equaliser, typing caret and the portrait's breathing. Motion the visitor
 * drives (scrolling, the cursor) keeps working. The choice is remembered.
 */

const KEY = "sahaj:motion";
const listeners = new Set<() => void>();
let paused = false;
let started = false;

function apply(next: boolean) {
  paused = next;
  if (next) document.documentElement.dataset.motion = "paused";
  else delete document.documentElement.dataset.motion;
  listeners.forEach((l) => l());
}

function start() {
  if (started) return;
  started = true;
  try {
    apply(localStorage.getItem(KEY) === "paused");
  } catch {
    apply(false);
  }
}

export function setMotionPaused(next: boolean) {
  try {
    if (next) localStorage.setItem(KEY, "paused");
    else localStorage.removeItem(KEY);
  } catch {
    /* not remembered in private mode */
  }
  apply(next);
}

/** Non-hook read for render loops. */
export const isMotionPaused = () => paused;

export function useMotionPaused(): boolean {
  return useSyncExternalStore(
    (cb) => {
      start();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => paused,
    () => false,
  );
}
