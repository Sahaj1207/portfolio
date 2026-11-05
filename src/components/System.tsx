"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { openPalette } from "@/components/Palette";
import { enterDesktop, exitDesktop, openApp, setMission, useDesktop } from "@/lib/desktop";
import { clearNotices, showActivity, useNotices } from "@/lib/islandBus";
import { haptic } from "@/lib/haptics";
import { setMotionPaused, useMotionPaused } from "@/lib/motion";
import { play, setSoundOn, useSoundOn } from "@/lib/sound";
import { cycleWallpaper, useWallpaper } from "@/lib/wallpaper";

/**
 * The system layer of sahaj.os: the sahaj.os menu, the right-click menu, the notification
 * centre, shutting down (and starting up again), and a "welcome back" for returning visitors.
 */

const SYSTEM_MENU = "sahaj:system-menu";
const NOTICES = "sahaj:notices";
const SHUTDOWN = "sahaj:shutdown";
const REPO = "https://github.com/Sahaj1207/portfolio";

export const openSystemMenu = (x: number, y: number) => window.dispatchEvent(new CustomEvent(SYSTEM_MENU, { detail: { x, y } }));
export const toggleNotices = () => window.dispatchEvent(new Event(NOTICES));
export const shutDown = () => window.dispatchEvent(new Event(SHUTDOWN));

type Entry = { label: string; hint?: string; run: () => void } | "-";

function Menu({ x, y, items, label, onClose, foot }: { x: number; y: number; items: Entry[]; label: string; onClose: () => void; foot?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  // Keep the menu on screen and put focus on its first item.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ x: Math.min(x, window.innerWidth - r.width - 8), y: Math.min(y, window.innerHeight - r.height - 8) });
    el.querySelector<HTMLElement>("[role=menuitem]")?.focus();
  }, [x, y]);

  useEffect(() => {
    const away = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && onClose();
    const blur = () => onClose();
    window.addEventListener("pointerdown", away, true);
    window.addEventListener("blur", blur);
    window.addEventListener("resize", blur);
    return () => {
      window.removeEventListener("pointerdown", away, true);
      window.removeEventListener("blur", blur);
      window.removeEventListener("resize", blur);
    };
  }, [onClose]);

  const onKey = (e: KeyboardEvent) => {
    const all = Array.from(ref.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? []);
    const i = all.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") all[(i + 1) % all.length]?.focus();
    else if (e.key === "ArrowUp") all[(i - 1 + all.length) % all.length]?.focus();
    else if (e.key === "Tab") onClose();
    else return;
    e.preventDefault();
  };

  return (
    <div ref={ref} className="os-menu" role="menu" aria-label={label} style={{ left: pos.x, top: pos.y }} onKeyDown={onKey}>
      {items.map((it, i) =>
        it === "-" ? (
          <hr key={i} />
        ) : (
          <button
            key={it.label}
            type="button"
            role="menuitem"
            onClick={() => {
              onClose();
              haptic("tick");
              it.run();
            }}
          >
            <span>{it.label}</span>
            {it.hint && <kbd>{it.hint}</kbd>}
          </button>
        ),
      )}
      {foot && <p className="os-menu-foot">{foot}</p>}
    </div>
  );
}

function ago(ms: number) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function NotificationCentre({ onClose }: { onClose: () => void }) {
  const notices = useNotices();
  const sound = useSoundOn();
  const paused = useMotionPaused();
  const { on: desktop } = useDesktop();
  const wallpaper = useWallpaper();
  const ref = useRef<HTMLElement>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    const away = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (!ref.current?.contains(t) && !t.closest("[data-notices-toggle]")) onClose();
    };
    const esc = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("pointerdown", away, true);
    window.addEventListener("keydown", esc);
    ref.current?.focus();
    return () => {
      clearInterval(id);
      window.removeEventListener("pointerdown", away, true);
      window.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  const date = new Date(now);
  return (
    <aside ref={ref} className="notices" aria-label="Notification centre" tabIndex={-1}>
      <header>
        <p>{date.toLocaleDateString([], { weekday: "long" })}</p>
        <h2>{date.toLocaleDateString([], { day: "numeric", month: "long" })}</h2>
      </header>
      <div className="notices-controls">
        <button type="button" aria-pressed={sound} onClick={() => setSoundOn(!sound)}>
          <strong>Sound</strong>
          <span>{sound ? "On" : "Off"}</span>
        </button>
        <button type="button" aria-pressed={!paused} onClick={() => setMotionPaused(!paused)}>
          <strong>Motion</strong>
          <span>{paused ? "Paused" : "On"}</span>
        </button>
        <button type="button" aria-pressed={desktop} onClick={() => (desktop ? exitDesktop() : enterDesktop("finder"))}>
          <strong>Desktop</strong>
          <span>{desktop ? "On" : "Off"}</span>
        </button>
        <button type="button" onClick={() => cycleWallpaper()}>
          <strong>Wallpaper</strong>
          <span style={{ textTransform: "capitalize" }}>{wallpaper}</span>
        </button>
      </div>
      <div className="notices-head">
        <h3>Notifications</h3>
        {notices.length > 0 && (
          <button type="button" onClick={clearNotices}>
            Clear
          </button>
        )}
      </div>
      {notices.length === 0 ? (
        <p className="notices-empty">
          Nothing yet. Try <code>island notify hi</code> in the terminal.
        </p>
      ) : (
        <ul>
          {notices.map((n) => (
            <li key={n.id}>
              <span className="island-mark" aria-hidden="true">S</span>
              <div>
                <strong>{n.title}</strong>
                <p>{n.body}</p>
              </div>
              <time>{now - n.at < 60000 ? "now" : ago(now - n.at)}</time>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

type Power = null | "closing" | "off" | "booting";

function PowerScreen({ phase, onStart }: { phase: Exclude<Power, null>; onStart: () => void }) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (phase !== "off") return;
    button.current?.focus();
    const start = (e: globalThis.KeyboardEvent) => {
      e.preventDefault();
      onStart();
    };
    window.addEventListener("keydown", start, { once: true });
    return () => window.removeEventListener("keydown", start);
  }, [phase, onStart]);

  return (
    <div className="power" data-phase={phase} role="dialog" aria-modal="true" aria-label="sahaj.os is shut down">
      {phase === "closing" && <p className="power-text">Shutting down sahaj<em>.os</em>…</p>}
      {phase === "off" && (
        <button ref={button} type="button" className="power-button" onClick={onStart}>
          <span className="power-glyph" aria-hidden="true" />
          <span>Press any key to start</span>
        </button>
      )}
      {phase === "booting" && (
        <div className="power-boot">
          <span className="about-logo" aria-hidden="true" />
          <span className="power-bar" />
        </div>
      )}
    </div>
  );
}

export function System() {
  const { on: desktop } = useDesktop();
  const [menu, setMenu] = useState<null | { kind: "system" | "context"; x: number; y: number }>(null);
  const [notices, setNotices] = useState(false);
  const [power, setPower] = useState<Power>(null);
  const close = useRef(() => setMenu(null)).current;
  const closeNotices = useRef(() => setNotices(false)).current;
  useWallpaper();

  useEffect(() => {
    const onSystem = (e: Event) => {
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
      setMenu((m) => (m?.kind === "system" ? null : { kind: "system", x, y }));
    };
    const onNotices = () => setNotices((n) => !n);
    const onShutdown = () => setPower("closing");
    // Right-click on the background opens the sahaj.os menu. Links, images, fields,
    // windows' contents, selected text and Shift keep the browser's own menu.
    const onContext = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (e.shiftKey || window.getSelection()?.toString()) return;
      if (t.closest("a, button, input, textarea, select, img, video, [contenteditable], .dwin-body, .terminal, .os-menu")) return;
      e.preventDefault();
      setMenu({ kind: "context", x: e.clientX, y: e.clientY });
    };
    window.addEventListener(SYSTEM_MENU, onSystem);
    window.addEventListener(NOTICES, onNotices);
    window.addEventListener(SHUTDOWN, onShutdown);
    window.addEventListener("contextmenu", onContext);
    return () => {
      window.removeEventListener(SYSTEM_MENU, onSystem);
      window.removeEventListener(NOTICES, onNotices);
      window.removeEventListener(SHUTDOWN, onShutdown);
      window.removeEventListener("contextmenu", onContext);
    };
  }, []);

  // Welcome back: returning visitors hear from the island how long they've been away.
  useEffect(() => {
    const KEY = "sahaj:last-visit";
    let last = 0;
    try {
      last = Number(localStorage.getItem(KEY)) || 0;
      localStorage.setItem(KEY, String(Date.now()));
    } catch {
      return;
    }
    const save = () => {
      try {
        localStorage.setItem(KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("pagehide", save);
    const away = Date.now() - last;
    const id = last && away > 30 * 60_000 ? setTimeout(() => showActivity({ kind: "notify", title: "Welcome back", body: `Last here ${ago(away)}` }, "system", 4200), 2600) : undefined;
    return () => {
      clearTimeout(id);
      window.removeEventListener("pagehide", save);
    };
  }, []);

  // Shutting down: fade out, go dark, wait for a key; then boot back up.
  useEffect(() => {
    const root = document.documentElement;
    if (power) root.dataset.power = power;
    else delete root.dataset.power;
    if (power === "closing") {
      play("close");
      haptic("firm");
      setMenu(null);
      setNotices(false);
      const id = setTimeout(() => {
        exitDesktop();
        setPower("off");
      }, 1500);
      return () => clearTimeout(id);
    }
    if (power === "booting") {
      play("welcome");
      haptic("success");
      const id = setTimeout(() => {
        setPower(null);
        showActivity({ kind: "notify", title: "sahaj.os", body: "Back online. Nothing was lost." }, "system", 3600);
      }, 1700);
      return () => clearTimeout(id);
    }
  }, [power]);

  const about = () => openApp("about");
  const systemItems: Entry[] = [
    { label: "About sahaj.os", run: about },
    "-",
    desktop ? { label: "Back to the page", run: exitDesktop } : { label: "Open the desktop", run: () => enterDesktop("finder") },
    { label: "Mission Control", hint: "F3", run: () => setMission(true) },
    { label: "Command palette", hint: "Ctrl K", run: openPalette },
    { label: "Notification centre", run: () => setNotices(true) },
    { label: "System Settings…", run: () => openApp("settings") },
    "-",
    { label: "Shut down…", run: shutDown },
  ];
  const contextItems: Entry[] = [
    ...(desktop
      ? [
          { label: "New Terminal window", run: () => openApp("terminal") },
          { label: "Open Finder", run: () => openApp("finder") },
          { label: "Mission Control", hint: "F3", run: () => setMission(true) },
        ]
      : [
          { label: "Open the desktop", run: () => enterDesktop("finder") },
          { label: "Open a Terminal window", run: () => enterDesktop("terminal") },
        ]),
    "-",
    {
      label: "Change wallpaper",
      run: () => showActivity({ kind: "notify", title: "Wallpaper", body: cycleWallpaper() }, "system", 2400),
    },
    { label: "Notification centre", run: () => setNotices(true) },
    { label: "View source on GitHub", run: () => window.open(REPO, "_blank", "noopener") },
    "-",
    { label: "About sahaj.os", run: about },
    ...(desktop ? [{ label: "Back to the page", run: exitDesktop }] : []),
  ];

  return (
    <>
      {menu && (
        <Menu
          x={menu.x}
          y={menu.y}
          label={menu.kind === "system" ? "sahaj.os" : "Desktop menu"}
          items={menu.kind === "system" ? systemItems : contextItems}
          onClose={close}
          foot={menu.kind === "context" ? "Shift + right-click for the browser's menu" : undefined}
        />
      )}
      {notices && <NotificationCentre onClose={closeNotices} />}
      {power && <PowerScreen phase={power} onStart={() => setPower("booting")} />}
    </>
  );
}
