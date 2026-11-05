"use client";

import { useSyncExternalStore } from "react";

/**
 * Light or dark. "auto" follows the device; picking light or dark is remembered. The
 * inline script in World.tsx sets `data-theme` before first paint, so there is no flash.
 */
export type Theme = "light" | "dark";
export type ThemePref = Theme | "auto";

const KEY = "sahaj:theme";
const listeners = new Set<() => void>();
let pref: ThemePref = "auto";
let theme: Theme = "dark";
let started = false;

const system = (): Theme => (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

function apply() {
  theme = pref === "auto" ? system() : pref;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#f4f1eb" : "#0c1626");
  listeners.forEach((l) => l());
}

function start() {
  if (started) return;
  started = true;
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark") pref = v;
  } catch {
    /* storage blocked: follow the device */
  }
  matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => pref === "auto" && apply());
  apply();
}

export function setThemePref(next: ThemePref) {
  start();
  pref = next;
  try {
    if (next === "auto") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch {
    /* private mode: not remembered */
  }
  apply();
}

/** Flips to the other theme and remembers it. */
export const toggleTheme = () => setThemePref(theme === "light" ? "dark" : "light");

const subscribe = (cb: () => void) => {
  start();
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, () => theme, () => "dark");
}

export function useThemePref(): ThemePref {
  return useSyncExternalStore(subscribe, () => pref, () => "auto");
}
