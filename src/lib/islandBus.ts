"use client";

import { useSyncExternalStore } from "react";
import { haptic } from "@/lib/haptics";

/**
 * Lets anything on the page take over the island for a moment — project cards show
 * their project's live activity, the terminal sends notifications. The island shows
 * the latest activity until it is cleared or its timer runs out, then returns to the
 * chapter's own state.
 */

export type Activity =
  | { kind: "float" }
  | { kind: "harika" }
  | { kind: "mothertongue" }
  | { kind: "pie" }
  | { kind: "orb" }
  | { kind: "notify"; title: string; body: string };

type Entry = { activity: Activity; owner: string };
export type Notice = { id: number; title: string; body: string; at: number };

const listeners = new Set<() => void>();
let current: Entry | null = null;
/** Every notification the island has shown, newest first, for the notification centre. */
let notices: Notice[] = [];
let noticeId = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

function emit() {
  listeners.forEach((l) => l());
}

/** Shows an activity; `owner` lets the same source clear only what it set. */
export function showActivity(activity: Activity, owner: string, ms?: number) {
  clearTimeout(timer);
  current = { activity, owner };
  if (activity.kind === "notify") {
    haptic("success");
    notices = [{ id: noticeId++, title: activity.title, body: activity.body, at: Date.now() }, ...notices].slice(0, 30);
  }
  if (ms) timer = setTimeout(() => clearActivity(owner), ms);
  emit();
}

export function clearActivity(owner?: string) {
  if (!current || (owner && current.owner !== owner)) return;
  clearTimeout(timer);
  current = null;
  emit();
}

export function useActivity(): Activity | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current?.activity ?? null,
    () => null,
  );
}

export function clearNotices() {
  notices = [];
  emit();
}

export function useNotices(): Notice[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => notices,
    () => NO_NOTICES,
  );
}
const NO_NOTICES: Notice[] = [];
