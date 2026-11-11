"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/haptics";

/**
 * FLOAT, playable: the island's real states and rules on a small Windows desktop.
 * Untouched for 3 s it shrinks to an orb; a notification previews for 3.5 s and then
 * restores the exact previous state; scrolling on it changes volume; click to expand.
 */

type Mode = "pill" | "media" | "orb" | "banner" | "expanded";
type Toast = { app: string; title: string; body: string };

const TOASTS: Toast[] = [
  { app: "R", title: "Riya", body: "Lunch at 1?" },
  { app: "G", title: "GitHub", body: "CI passed on FLOAT · v3.1" },
  { app: "C", title: "Calendar", body: "Standup in 5 minutes" },
  { app: "M", title: "Mail", body: "Your build artifacts are ready" },
];
const TRACKS = ["Midnight Drive", "Paper Planes", "Slow Static", "Neon Rain"];

export function FloatDemo() {
  const [mode, setMode] = useState<Mode>("pill");
  const [playing, setPlaying] = useState(false);
  const [track, setTrack] = useState(0);
  const [volume, setVolume] = useState(64);
  const [showVolume, setShowVolume] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [history, setHistory] = useState<Toast[]>([]);
  const [log, setLog] = useState<string[]>(["pill"]);
  const nextToast = useRef(0);
  const before = useRef<Mode>("pill");
  const idle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const bannerTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const volTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const rest: Mode = playing ? "media" : "pill";

  const go = useCallback((m: Mode) => {
    setMode(m);
    setLog((l) => (l.at(-1) === m ? l : [...l.slice(-5), m]));
  }, []);

  // Untouched for ~3 s, the pill (or media pill) shrinks into the ambient orb.
  const armIdle = useCallback(() => {
    clearTimeout(idle.current);
    idle.current = setTimeout(() => setMode((m) => {
      if (m === "pill" || m === "media") {
        setLog((l) => [...l.slice(-5), "orb"]);
        return "orb";
      }
      return m;
    }), 3000);
  }, []);

  useEffect(() => {
    armIdle();
    return () => [idle, bannerTimer, volTimer].forEach((t) => clearTimeout(t.current));
  }, [armIdle]);

  // Starting or stopping music moves a resting island between pill and media.
  useEffect(() => {
    setMode((m) => (m === "pill" || m === "media" ? (playing ? "media" : "pill") : m));
  }, [playing]);

  const wake = () => {
    if (mode === "orb") go(rest);
    armIdle();
  };

  const notify = () => {
    const t = TOASTS[nextToast.current++ % TOASTS.length];
    clearTimeout(bannerTimer.current);
    if (mode !== "banner") before.current = mode === "orb" ? "orb" : mode === "expanded" ? "expanded" : rest;
    setToast(t);
    setHistory((h) => [t, ...h].slice(0, 4));
    go("banner");
    haptic("success");
    // After ~3.5 s the island restores exactly what it was doing.
    bannerTimer.current = setTimeout(() => {
      go(before.current === "pill" || before.current === "media" ? (playing ? "media" : "pill") : before.current);
      armIdle();
    }, 3500);
  };

  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
      if (playing) setTrack((t) => (t + (e.deltaX + e.deltaY > 0 ? 1 : TRACKS.length - 1)) % TRACKS.length);
      return;
    }
    setVolume((v) => Math.max(0, Math.min(100, v + (e.deltaY < 0 ? 4 : -4))));
    setShowVolume(true);
    clearTimeout(volTimer.current);
    volTimer.current = setTimeout(() => setShowVolume(false), 900);
    wake();
  };

  // The clock is set in the browser only, so the server's time never disagrees with the visitor's.
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  const eq = (
    <span className={`fd-eq${playing ? " on" : ""}`} aria-hidden="true">
      <i /><i /><i /><i />
    </span>
  );

  return (
    <div className="demo float-demo">
      <div
        className="fd-stage"
        onPointerDown={(e) => {
          if (!(e.target as HTMLElement).closest(".fd-island") && mode === "expanded") {
            go(rest);
            armIdle();
          }
        }}
      >
        <div
          className="fd-island"
          data-mode={mode}
          role="button"
          tabIndex={0}
          aria-label={`FLOAT island: ${mode}. Click to expand, scroll for volume.`}
          onPointerEnter={wake}
          onClick={() => {
            if (mode !== "expanded") {
              go("expanded");
              clearTimeout(idle.current);
              haptic("light");
            }
          }}
          onKeyDown={(e) => e.key === "Enter" && go(mode === "expanded" ? rest : "expanded")}
          onWheel={onWheel}
        >
          {showVolume && mode !== "expanded" ? (
            <span className="fd-row">
              <span className="fd-vol-icon" aria-hidden="true" />
              <span className="fd-vol"><i style={{ width: `${volume}%` }} /></span>
              <b>{volume}%</b>
            </span>
          ) : mode === "pill" ? (
            <span className="fd-row"><span className="fd-dot" />{time}</span>
          ) : mode === "media" ? (
            <span className="fd-row">
              <span className="fd-art" />
              <span className="fd-marquee"><span>{TRACKS[track]} — Lo-fi Radio</span></span>
              {eq}
            </span>
          ) : mode === "orb" ? (
            <span className="fd-orb-core">{playing && eq}</span>
          ) : mode === "banner" && toast ? (
            <span className="fd-row fd-banner">
              <span className="fd-app">{toast.app}</span>
              <span className="fd-text"><b>{toast.title}</b><span>{toast.body}</span></span>
            </span>
          ) : (
            <span className="fd-expanded">
              <span className="fd-media">
                <span className="fd-art big" />
                <span className="fd-text"><b>{playing ? TRACKS[track] : "Nothing playing"}</b><span>Lo-fi Radio</span></span>
                <span className="fd-controls">
                  <button type="button" aria-label="Previous" onClick={(e) => (e.stopPropagation(), setTrack((t) => (t + TRACKS.length - 1) % TRACKS.length))}>‹</button>
                  <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={(e) => (e.stopPropagation(), setPlaying((p) => !p))}>{playing ? "❚❚" : "▶"}</button>
                  <button type="button" aria-label="Next" onClick={(e) => (e.stopPropagation(), setTrack((t) => (t + 1) % TRACKS.length))}>›</button>
                </span>
              </span>
              <span className="fd-list">
                {history.length === 0 ? <span className="fd-empty">No notifications</span> : history.slice(0, 2).map((h, i) => (
                  <span key={i} className="fd-note"><span className="fd-app small">{h.app}</span><b>{h.title}</b> {h.body}</span>
                ))}
              </span>
              <span className="fd-quick">
                <span>Focus</span><span>Mic</span><span>Wi-Fi</span><span>{volume}%</span>
              </span>
            </span>
          )}
        </div>
        {mode === "banner" && playing && <span className="fd-bubble" aria-hidden="true">{eq}</span>}
        <div className="fd-taskbar" aria-hidden="true">
          <span className="fd-start" />
          <span /><span /><span />
          <span className="fd-clock">{time}</span>
        </div>
      </div>

      <div className="demo-side">
        <p className="demo-label">Try it</p>
        <div className="demo-buttons">
          <button type="button" onClick={() => (setPlaying((p) => !p), wake())}>{playing ? "Pause music" : "Play music"}</button>
          <button type="button" onClick={notify}>Send a notification</button>
          <button type="button" onClick={() => go("orb")}>Let it idle</button>
          <button type="button" onClick={() => (clearTimeout(bannerTimer.current), setPlaying(false), setHistory([]), go("pill"), armIdle())}>Reset</button>
        </div>
        <ul className="demo-notes">
          <li>Leave it for 3 s and it shrinks to an orb; hover to bring it back.</li>
          <li>A notification shows for 3.5 s, then the island returns to exactly what it was doing, music and all.</li>
          <li>Scroll on the island for volume; scroll sideways to skip a track. Click to expand.</li>
        </ul>
        <p className="demo-label">State</p>
        <p className="fd-log" aria-live="polite">{log.join(" → ")}</p>
      </div>
    </div>
  );
}
