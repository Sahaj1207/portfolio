"use client";

import { useSyncExternalStore } from "react";

/**
 * The sound of sahaj.os, synthesised live with the Web Audio API — no audio files.
 * Apple's lesson: silent until you act, and every sound short, quiet and from one family.
 * Off by default; the visitor's choice is remembered. Browsers only allow audio after a
 * gesture, so a remembered "on" waits for the first click or key.
 *
 *   tock       the island changes shape — a soft wooden key
 *   open       a window or the palette opens — two glassy notes a fifth apart, rising
 *   close      it closes — the same notes, gliding down
 *   chime      a notification — two soft bell notes
 *   welcome    sound is turned on — a warm chord that opens up
 *   heartbeat  the code becomes the photo — lub… dub, then a warm note
 */

export type Cue = "tock" | "open" | "close" | "chime" | "welcome" | "heartbeat";

const KEY = "sahaj:sound";
const listeners = new Set<() => void>();
let on = false;
let started = false;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let lastTock = 0;

const emit = () => listeners.forEach((l) => l());

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.85;
  master.connect(ctx.destination);
  return ctx;
}

function noise(seconds: number) {
  const c = ctx!;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/** One enveloped oscillator; `attack` defaults to a near-instant pluck. */
function tone(freq: number, at: number, dur: number, gain: number, opts: { type?: OscillatorType; to?: number; attack?: number } = {}) {
  const c = ctx!;
  const o = c.createOscillator();
  o.type = opts.type ?? "sine";
  o.frequency.setValueAtTime(freq, at);
  if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, at + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + (opts.attack ?? Math.min(0.008, dur / 5)));
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(master!);
  o.start(at);
  o.stop(at + dur + 0.05);
}

/** A short filtered noise burst. */
function burst(at: number, dur: number, gain: number, freq: number, q = 1, type: BiquadFilterType = "bandpass") {
  const c = ctx!;
  const src = c.createBufferSource();
  src.buffer = noise(dur + 0.05);
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(master!);
  src.start(at);
  src.stop(at + dur + 0.05);
}

const thump = (at: number, gain: number) => {
  tone(70, at, 0.22, gain, { to: 42 });
  burst(at, 0.06, gain * 0.5, 160, 1, "lowpass");
};

/** Plays a cue if sound is on. Cheap to call freely; tocks are rate-limited. */
export function play(cue: Cue) {
  if (!on || !ctx || ctx.state !== "running") return;
  const t = ctx.currentTime + 0.01;
  switch (cue) {
    case "tock": {
      const now = performance.now();
      if (now - lastTock < 90) return;
      lastTock = now;
      burst(t, 0.045, 0.35, 1900, 4);
      tone(1700, t, 0.05, 0.12, { to: 900 });
      break;
    }
    case "open":
      tone(880, t, 0.38, 0.07, { to: 900 });
      tone(1320, t + 0.03, 0.34, 0.05, { to: 1340 });
      tone(2640, t + 0.05, 0.22, 0.015);
      break;
    case "close":
      tone(1320, t, 0.22, 0.05, { to: 1250 });
      tone(880, t + 0.05, 0.26, 0.06, { to: 830 });
      break;
    case "chime":
      tone(1046.5, t, 0.7, 0.07);
      tone(1046.5, t, 0.5, 0.02, { type: "triangle" });
      tone(1568, t + 0.13, 0.9, 0.06);
      tone(1568, t + 0.13, 0.6, 0.015, { type: "triangle" });
      break;
    case "welcome":
      [220, 329.6, 440, 659.3].forEach((f, i) => tone(f, t, 2.1, 0.045 / (1 + i * 0.3), { attack: 0.45 + i * 0.05 }));
      break;
    case "heartbeat":
      thump(t, 0.55);
      thump(t + 0.22, 0.38);
      tone(392, t + 0.75, 1.6, 0.05, { attack: 0.18 });
      tone(587.3, t + 0.82, 1.5, 0.03, { attack: 0.2 });
      tone(784, t + 0.9, 1.3, 0.015, { attack: 0.25 });
      break;
  }
}

async function apply(next: boolean, greet: boolean) {
  on = next;
  emit();
  if (!next) return;
  const c = ensureContext();
  if (!c) return;
  if (c.state !== "running") await c.resume().catch(() => {});
  if (greet) play("welcome");
}

/** Called from a click or key, so the browser lets audio start. */
export function setSoundOn(next: boolean) {
  try {
    if (next) localStorage.setItem(KEY, "on");
    else localStorage.removeItem(KEY);
  } catch {
    /* not remembered in private mode */
  }
  void apply(next, next);
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  let remembered = false;
  try {
    remembered = localStorage.getItem(KEY) === "on";
  } catch {
    /* ignore */
  }
  if (!remembered) return;
  on = true;
  // Audio may only start after a gesture: resume quietly on the first click or key.
  const wake = () => {
    removeEventListener("pointerdown", wake);
    removeEventListener("keydown", wake);
    void apply(true, false);
  };
  addEventListener("pointerdown", wake);
  addEventListener("keydown", wake);
}

export const isSoundOn = () => on;

export function useSoundOn(): boolean {
  return useSyncExternalStore(
    (cb) => {
      start();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => on,
    () => false,
  );
}
