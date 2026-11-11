"use client";

/**
 * The only sound in sahaj.os: a soft transition between the page and the desktop,
 * synthesised with the Web Audio API (no audio files). It always follows a click or a key,
 * so browsers allow it. "in" rises and opens up; "out" settles back down.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.7;
  master.connect(ctx.destination);
  return ctx;
}

/** One enveloped oscillator with a slow attack. */
function tone(freq: number, at: number, dur: number, gain: number, attack: number, to?: number) {
  const c = ctx!;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(freq, at);
  if (to) o.frequency.exponentialRampToValueAtTime(to, at + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(master!);
  o.start(at);
  o.stop(at + dur + 0.05);
}

/** A breath of filtered noise whose colour sweeps up or down. */
function air(at: number, dur: number, gain: number, from: number, to: number) {
  const c = ctx!;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * (dur + 0.05)), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 0.8;
  f.frequency.setValueAtTime(from, at);
  f.frequency.exponentialRampToValueAtTime(to, at + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + dur * 0.45);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(master!);
  src.start(at);
  src.stop(at + dur + 0.05);
}

export function transition(direction: "in" | "out") {
  const c = ensureContext();
  if (!c) return;
  const go = () => {
    const t = c.currentTime + 0.02;
    if (direction === "in") {
      air(t, 0.7, 0.05, 500, 3200);
      [261.6, 392, 523.3, 784].forEach((f, i) => tone(f, t + 0.08 + i * 0.04, 1.4, 0.035 / (1 + i * 0.35), 0.25));
    } else {
      air(t, 0.55, 0.04, 2600, 420);
      [523.3, 392, 261.6].forEach((f, i) => tone(f, t + i * 0.05, 0.9, 0.03 / (1 + i * 0.3), 0.08, f * 0.94));
    }
  };
  if (c.state === "running") go();
  else void c.resume().then(go, () => {});
}
