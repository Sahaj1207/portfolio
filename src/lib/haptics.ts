"use client";

import { useSyncExternalStore } from "react";

/**
 * Haptics on phones, Apple-style: a small vocabulary, only when the visitor acts.
 * On by default where supported; the choice to turn them off is remembered.
 *
 * - Android and other browsers with the Vibration API get short, precise pulses.
 * - iOS Safari has no Vibration API, but since iOS 18 toggling a native
 *   `<input type="checkbox" switch>` plays the system haptic. A hidden one is clicked
 *   for each pulse. Older iPhones simply stay silent.
 * - Desktops have no haptics; calls do nothing.
 */

export type Haptic = "tick" | "light" | "firm" | "success" | "heartbeat";

/** Vibration patterns in ms: on, off, on… */
const PATTERN: Record<Haptic, number[]> = {
  tick: [5],
  light: [8],
  firm: [16],
  success: [10, 70, 14],
  heartbeat: [18, 200, 12],
};

/** iOS gets one system tap per pulse; these are the gaps between taps, in ms. */
const IOS_TAPS: Record<Haptic, number[]> = {
  tick: [0],
  light: [0],
  firm: [0],
  success: [0, 90],
  heartbeat: [0, 220],
};

const KEY = "sahaj:haptics";
const listeners = new Set<() => void>();
let on = true;
let started = false;
let iosSwitch: HTMLLabelElement | null = null;
let lastTick = 0;

const emit = () => listeners.forEach((l) => l());

const canVibrate = () => typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
const isTouch = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
const isIOS = () => typeof navigator !== "undefined" && /iP(hone|ad|od)/.test(navigator.userAgent);

/** Whether this device can produce haptics at all. */
export const hapticsSupported = () => isTouch() && (canVibrate() || isIOS());

function iosTap() {
  if (!iosSwitch) {
    iosSwitch = document.createElement("label");
    iosSwitch.setAttribute("aria-hidden", "true");
    iosSwitch.style.cssText = "position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;left:-99px;top:0";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    input.tabIndex = -1;
    iosSwitch.appendChild(input);
    document.body.appendChild(iosSwitch);
  }
  iosSwitch.click();
}

/** Plays a haptic if haptics are on and the device supports them. */
export function haptic(kind: Haptic) {
  if (!on || !isTouch()) return;
  if (kind === "tick") {
    const now = performance.now();
    if (now - lastTick < 110) return;
    lastTick = now;
  }
  if (canVibrate()) {
    try {
      navigator.vibrate(PATTERN[kind]);
    } catch {
      /* blocked before the first user gesture */
    }
  } else if (isIOS()) {
    for (const delay of IOS_TAPS[kind]) delay ? setTimeout(iosTap, delay) : iosTap();
  }
}

export function setHapticsOn(next: boolean) {
  on = next;
  try {
    if (next) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, "off");
  } catch {
    /* not remembered in private mode */
  }
  emit();
  if (next) haptic("success");
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    on = localStorage.getItem(KEY) !== "off";
  } catch {
    on = true;
  }
}

export function useHapticsOn(): boolean {
  return useSyncExternalStore(
    (cb) => {
      start();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => on,
    () => true,
  );
}

export function useHapticsSupported(): boolean {
  return useSyncExternalStore(
    () => () => {},
    hapticsSupported,
    () => false,
  );
}

if (typeof window !== "undefined") start();
