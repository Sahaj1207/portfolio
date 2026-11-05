"use client";

import { useSyncExternalStore } from "react";

/** The colour of the light behind sahaj.os. Remembered per browser. */

export const WALLPAPERS = [
  { id: "aurora", name: "Aurora" },
  { id: "ember", name: "Ember" },
  { id: "tide", name: "Tide" },
  { id: "night", name: "Night" },
] as const;
export type Wallpaper = (typeof WALLPAPERS)[number]["id"];

const KEY = "sahaj:wallpaper";
const listeners = new Set<() => void>();
let current: Wallpaper = "aurora";
let started = false;

function apply(next: Wallpaper) {
  current = next;
  const root = document.documentElement;
  if (next === "aurora") delete root.dataset.wallpaper;
  else root.dataset.wallpaper = next;
  listeners.forEach((l) => l());
}

function start() {
  if (started) return;
  started = true;
  try {
    const v = localStorage.getItem(KEY);
    if (WALLPAPERS.some((w) => w.id === v)) apply(v as Wallpaper);
  } catch {
    /* storage blocked: default wallpaper */
  }
}

export function setWallpaper(next: Wallpaper) {
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* private mode: not remembered */
  }
  apply(next);
}

/** The next wallpaper in the list, for the right-click menu. */
export function cycleWallpaper() {
  const i = WALLPAPERS.findIndex((w) => w.id === current);
  setWallpaper(WALLPAPERS[(i + 1) % WALLPAPERS.length].id);
  return WALLPAPERS[(i + 1) % WALLPAPERS.length].name;
}

export function useWallpaper(): Wallpaper {
  return useSyncExternalStore(
    (cb) => {
      start();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => "aurora",
  );
}
