"use client";

import { useSyncExternalStore } from "react";

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

const listeners = new Set<() => void>();
let current: Entry | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

function emit() {
  listeners.forEach((l) => l());
}

/** Shows an activity; `owner` lets the same source clear only what it set. */
export function showActivity(activity: Activity, owner: string, ms?: number) {
  clearTimeout(timer);
  current = { activity, owner };
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
