"use client";

import { useSyncExternalStore } from "react";

/**
 * The sound of sahaj.os, synthesised live with the Web Audio API — no audio files.
 * Off by default; the visitor's choice is remembered. Browsers only allow audio after a
 * gesture, so a remembered "on" waits for the first click or key before it starts.
 *
 *   ambience  a low, slowly breathing drone with a little air
 *   open      the world opening: a rising swell and a soft bloom
 *   tick      the island changing shape: a tiny wooden click
 *   chime     a notification: two soft notes
 *   whoosh    a window or the palette opening; `close` is its reverse
 */

type Cue = "open" | "tick" | "chime" | "whoosh" | "close";

const KEY = "sahaj:sound";
const listeners = new Set<() => void>();
let on = false;
let started = false;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambience: { stop: () => void } | null = null;
let lastTick = 0;

function emit() {
  listeners.forEach((l) => l());
}

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);
  return ctx;
}

function noiseBuffer(c: AudioContext, seconds: number) {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function startAmbience() {
  const c = ensureContext();
  if (!c || !master || ambience) return;
  const out = c.createGain();
  out.gain.value = 0;
  out.gain.linearRampToValueAtTime(0.05, c.currentTime + 3);
  out.connect(master);

  // Two slightly detuned low sines beat slowly against each other.
  const oscs = [55, 55.35, 82.5].map((f, i) => {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.value = i === 2 ? 0.25 : 0.5;
    o.connect(g).connect(out);
    o.start();
    return o;
  });

  // A little filtered air, its brightness breathing on a slow LFO.
  const air = c.createBufferSource();
  air.buffer = noiseBuffer(c, 4);
  air.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 420;
  lp.Q.value = 0.7;
  const airGain = c.createGain();
  airGain.gain.value = 0.18;
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoDepth = c.createGain();
  lfoDepth.gain.value = 180;
  lfo.connect(lfoDepth).connect(lp.frequency);
  air.connect(lp).connect(airGain).connect(out);
  air.start();
  lfo.start();

  ambience = {
    stop: () => {
      const t = c.currentTime;
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(out.gain.value, t);
      out.gain.linearRampToValueAtTime(0, t + 0.8);
      setTimeout(() => {
        [...oscs, air, lfo].forEach((n) => n.stop());
        out.disconnect();
      }, 900);
    },
  };
}

function tone(freq: number, at: number, dur: number, gain: number, type: OscillatorType = "sine", to?: number) {
  const c = ctx!;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (to) o.frequency.exponentialRampToValueAtTime(to, at + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + Math.min(0.012, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(master!);
  o.start(at);
  o.stop(at + dur + 0.05);
}

function sweep(from: number, to: number, at: number, dur: number, gain: number) {
  const c = ctx!;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, dur + 0.1);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(from, at);
  bp.frequency.exponentialRampToValueAtTime(to, at + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + dur * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(bp).connect(g).connect(master!);
  src.start(at);
  src.stop(at + dur + 0.1);
}

/** Plays a cue if sound is on. Cheap enough to call freely; ticks are rate-limited. */
export function play(cue: Cue) {
  if (!on || !ctx || ctx.state !== "running") return;
  const t = ctx.currentTime + 0.01;
  switch (cue) {
    case "open":
      sweep(120, 2400, t, 1.4, 0.16);
      tone(110, t, 2.2, 0.12, "sine", 220);
      tone(329.6, t + 0.9, 1.6, 0.05);
      tone(493.9, t + 1.05, 1.6, 0.04);
      break;
    case "tick": {
      const now = performance.now();
      if (now - lastTick < 90) return;
      lastTick = now;
      tone(1500, t, 0.05, 0.035, "triangle", 700);
      break;
    }
    case "chime":
      tone(659.3, t, 0.9, 0.05);
      tone(987.8, t + 0.12, 1.1, 0.04);
      break;
    case "whoosh":
      sweep(300, 1800, t, 0.35, 0.09);
      break;
    case "close":
      sweep(1600, 260, t, 0.3, 0.07);
      break;
  }
}

async function apply(next: boolean, withIntro: boolean) {
  on = next;
  emit();
  if (!next) {
    ambience?.stop();
    ambience = null;
    return;
  }
  const c = ensureContext();
  if (!c) return;
  if (c.state !== "running") await c.resume().catch(() => {});
  if (c.state !== "running") return;
  startAmbience();
  if (withIntro) play("open");
}

/** Called from a click or key, so the browser lets audio start. */
export function setSoundOn(next: boolean) {
  try {
    if (next) localStorage.setItem(KEY, "on");
    else localStorage.removeItem(KEY);
  } catch {
    /* not remembered in private mode */
  }
  void apply(next, true);
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
  // Audio may only start after a gesture: wait for the visitor's first click or key.
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
