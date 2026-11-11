"use client";

import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import vayucast from "@/content/vayucast.json";
import { APPS, type AppId, type Win, closeApp, focusApp, openApp } from "@/lib/desktop";
import { haptic } from "@/lib/haptics";

/**
 * sahaj.os on a phone: a status bar beside the island, a home screen with two widgets, an
 * app grid and a dock of favourites, Control Centre from the island, and an app switcher (hold the home bar in any app).
 * Apps open full screen, zooming out of their icon.
 */

const GRID: AppId[] = ["welcome", "notes", "photos", "settings", "pie", "harika", "vayucast", "about"];
const DOCK: AppId[] = ["finder", "terminal", "float", "contact"];

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function PhoneStatus() {
  const now = useClock();
  return (
    <div className="phone-status" aria-hidden="true">
      <span className="ps-time">{now?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M$/i, "")}</span>
      <span className="ps-icons">
        <i className="ps-signal" />
        <i className="ps-wifi" />
        <i className="ps-battery" />
      </span>
    </div>
  );
}

function AppIcon({ app }: { app: AppId }) {
  return (
    <button type="button" className="phone-app" data-dock-app={app} onClick={() => (haptic("light"), openApp(app))}>
      <i className={`dock-icon di-${app}`} aria-hidden="true" />
      <span>{APPS[app].name}</span>
    </button>
  );
}

/** The CPCB category for an AQI value, matching the VayuCast app. */
function band(aqi: number) {
  if (aqi <= 50) return { name: "Good", bg: "#55a84f", ink: "#0b1a09" };
  if (aqi <= 100) return { name: "Satisfactory", bg: "#a3c853", ink: "#142007" };
  if (aqi <= 200) return { name: "Moderate", bg: "#f6dd3b", ink: "#2a2400" };
  if (aqi <= 300) return { name: "Poor", bg: "#f29c33", ink: "#2b1600" };
  return { name: "Very poor", bg: "#e93f33", ink: "#ffffff" };
}

function Widgets() {
  const now = useClock();
  const city = (vayucast.cities as Record<string, { days: { date: string; aqi: number }[] }>).belagavi;
  const next = city?.days[0];
  const b = next ? band(next.aqi) : null;
  return (
    <div className="widgets">
      <div className="widget w-clock" aria-label="Today">
        <p className="wc-day">{now?.toLocaleDateString([], { weekday: "long" })}</p>
        <p className="wc-date">{now?.getDate()}</p>
        <p className="wc-month">{now?.toLocaleDateString([], { month: "long" })}</p>
      </div>
      {next && b && (
        <button type="button" className="widget w-aqi" onClick={() => openApp("vayucast")} aria-label={`VayuCast: Belagavi AQI ${next.aqi}, ${b.name}`}>
          <span className="wa-label">Belagavi</span>
          <span className="wa-aqi">{next.aqi}</span>
          <span className="wa-band"><i style={{ background: b.bg }} />{b.name}</span>
          <span className="wa-note">AQI forecast · VayuCast</span>
        </button>
      )}
    </div>
  );
}

export function PhoneHome() {
  return (
    <div className="phone-home">
      <Widgets />
      <ul className="phone-grid">
        {GRID.map((app) => (
          <li key={app}>
            <AppIcon app={app} />
          </li>
        ))}
      </ul>
      <p className="phone-hint">Tap the island for Control Centre</p>
      <nav className="phone-dock" aria-label="Favourites">
        {DOCK.map((app) => (
          <AppIcon key={app} app={app} />
        ))}
      </nav>
    </div>
  );
}

/** Recent apps as cards: tap one to open it, swipe it up to close it. */
export function AppSwitcher({ windows, onClose }: { windows: Win[]; onClose: () => void }) {
  const list = [...windows].filter((w) => !w.closing).sort((a, b) => b.z - a.z);
  const drag = useRef<{ app: AppId; y: number } | null>(null);
  const [lift, setLift] = useState<{ app: AppId; dy: number } | null>(null);

  useEffect(() => {
    haptic("firm");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const down = (app: AppId) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    drag.current = { app, y: e.clientY };
  };
  const move = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const dy = Math.min(0, e.clientY - d.y);
    if (dy < -6) setLift({ app: d.app, dy });
  };
  const up = (app: AppId) => () => {
    const dy = lift?.app === app ? lift.dy : 0;
    drag.current = null;
    setLift(null);
    if (dy < -80) {
      haptic("light");
      closeApp(app);
      if (list.length <= 1) onClose();
    } else if (dy > -6) {
      focusApp(app);
      onClose();
    }
  };

  return (
    <div className="switcher-phone" role="dialog" aria-label="Recent apps" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {list.length === 0 ? (
        <p className="sp-empty">No apps open</p>
      ) : (
        <ul className="sp-cards">
          {list.map((w) => (
            <li key={w.app}>
              <p className="sp-name">
                <i className={`dock-icon di-${w.app}`} aria-hidden="true" />
                {APPS[w.app].name}
              </p>
              <button
                type="button"
                className="sp-card"
                aria-label={`Open ${APPS[w.app].name}. Swipe up to close.`}
                style={lift?.app === w.app ? { transform: `translateY(${lift.dy}px)`, opacity: 1 + lift.dy / 300 } : undefined}
                onPointerDown={down(w.app)}
                onPointerMove={move}
                onPointerUp={up(w.app)}
                onPointerCancel={() => (drag.current = null, setLift(null))}
              >
                <span className="sp-bar">{APPS[w.app].title}</span>
                <i className={`dock-icon di-${w.app} sp-big`} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="sp-hint">Tap to open · swipe up to close</p>
    </div>
  );
}
