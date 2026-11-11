"use client";

import { type PointerEvent as ReactPointerEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { About, Contact, Finder, Notes, Photos, Settings, Welcome } from "@/components/DesktopApps";
import { DesktopWindow, type Rect, SWITCHER, snapRect } from "@/components/DesktopWindow";
import { AppSwitcher, PhoneHome, PhoneStatus } from "@/components/PhoneOS";
import { BootLog, LockScreen, ScreenSaver } from "@/components/DesktopSession";
import { Terminal } from "@/components/Terminal";
import { FloatDemo } from "@/components/demos/FloatDemo";
import { HarikaDemo } from "@/components/demos/HarikaDemo";
import { PieDemo } from "@/components/demos/PieDemo";
import { VayuCastDemo } from "@/components/demos/VayuCastDemo";
import { APPS, type AppId, DOCK, type Snap, TOP, exitDesktop, focusApp, minimiseApp, openApp, setMission, useDesktop } from "@/lib/desktop";
import { haptic } from "@/lib/haptics";

/**
 * The sahaj.os desktop: icons you can arrange, windows and a dock over the atmosphere,
 * with the page hidden underneath. Mission Control (F3 or Ctrl + ↑) lays every window side
 * by side; Alt + ` switches between them. Left alone it falls asleep into a screensaver and
 * a lock screen. On phones it becomes a home screen of apps that open full screen.
 */

const SYSTEM_APPS: AppId[] = ["finder", "terminal", "photos", "notes", "contact", "settings"];
/** Project demos sit in their own group on the dock. */
const DEMO_APPS: AppId[] = ["float", "pie", "harika", "vayucast"];
const ALL_APPS: AppId[] = ["welcome", ...SYSTEM_APPS, ...DEMO_APPS, "about"];

const ICON_W = 92;
const ICON_H = 88;
const ICONS_KEY = "sahaj:icons";
const IDLE_MS = 75_000;

function useViewport() {
  const [size, setSize] = useState({ vw: 1280, vh: 800 });
  useEffect(() => {
    const read = () => setSize({ vw: window.innerWidth, vh: window.innerHeight });
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);
  return size;
}

/** Mission Control grid: one cell per open window, filling the space between bar and dock. */
function missionCells(apps: AppId[], vw: number, vh: number): Map<AppId, Rect> {
  const cells = new Map<AppId, Rect>();
  const n = apps.length;
  if (!n) return cells;
  const area = { x: 40, y: TOP + 40, w: vw - 80, h: vh - TOP - DOCK - 70 };
  const cols = Math.ceil(Math.sqrt(n * (area.w / area.h) / 1.4));
  const rows = Math.ceil(n / cols);
  const cw = area.w / cols;
  const ch = area.h / rows;
  apps.forEach((app, i) => {
    const r = Math.floor(i / cols);
    const inRow = r === rows - 1 ? n - r * cols : cols;
    const offset = (area.w - inRow * cw) / 2;
    cells.set(app, { x: area.x + offset + (i % cols) * cw + 18, y: area.y + r * ch + 18, w: cw - 36, h: ch - 54 });
  });
  return cells;
}

function AppBody({ app, hasResume }: { app: AppId; hasResume: boolean }): ReactNode {
  switch (app) {
    case "welcome":
      return <Welcome />;
    case "finder":
      return <Finder />;
    case "terminal":
      return <Terminal hasResume={hasResume} />;
    case "photos":
      return <Photos />;
    case "notes":
      return <Notes />;
    case "contact":
      return <Contact hasResume={hasResume} />;
    case "settings":
      return <Settings />;
    case "about":
      return <About />;
    case "float":
      return <FloatDemo />;
    case "pie":
      return <PieDemo />;
    case "harika":
      return <HarikaDemo />;
    case "vayucast":
      return <VayuCastDemo />;
  }
}

function DockIcon({ app }: { app: AppId | "mission" | "exit" }) {
  return <i className={`dock-icon di-${app}`} aria-hidden="true" />;
}

type Icon = { id: string; label: string; kind: string; open: () => void };
type Pos = Record<string, { x: number; y: number }>;

/** Saved icon positions, kept on screen; new icons line up down the right edge. */
function useIconPositions(icons: Icon[], vw: number, vh: number) {
  const [saved, setSaved] = useState<Pos>({});
  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem(ICONS_KEY) ?? "{}"));
    } catch {
      /* none saved */
    }
  }, []);
  const positions: Pos = {};
  icons.forEach((ic, i) => {
    const p = saved[ic.id] ?? { x: vw - ICON_W - 24, y: 84 + i * (ICON_H + 10) };
    positions[ic.id] = { x: Math.min(Math.max(8, p.x), vw - ICON_W - 8), y: Math.min(Math.max(TOP, p.y), vh - DOCK - ICON_H) };
  });
  const save = (next: Pos) => {
    setSaved(next);
    try {
      localStorage.setItem(ICONS_KEY, JSON.stringify(next));
    } catch {
      /* not remembered */
    }
  };
  return [positions, save] as const;
}

export function Desktop({ hasResume }: { hasResume: boolean }) {
  const { on, windows, mission, focused, booting } = useDesktop();
  const { vw, vh } = useViewport();
  const [preview, setPreview] = useState<Snap>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lasso, setLasso] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [dragging, setDragging] = useState<Pos | null>(null);
  const [switcher, setSwitcher] = useState<{ list: AppId[]; index: number } | null>(null);
  const [sleep, setSleep] = useState<null | "saver" | "locked">(null);
  const [recents, setRecents] = useState(false);
  const drag = useRef<{ id: string; x: number; y: number; start: Pos; moved: boolean } | null>(null);
  const narrow = vw < 720;

  const icons: Icon[] = [
    { id: "work", label: "work", kind: "folder", open: () => openApp("finder") },
    { id: "readme", label: "README.md", kind: "doc", open: () => openApp("notes") },
    { id: "portrait", label: "portrait.webp", kind: "image", open: () => openApp("photos") },
    { id: "demos", label: "try-these", kind: "demos", open: () => openApp("float") },
    ...(hasResume ? [{ id: "resume", label: "resume.pdf", kind: "pdf", open: () => window.open("/resume.pdf", "_blank", "noopener") }] : []),
  ];
  const [positions, savePositions] = useIconPositions(icons, vw, vh);
  const shown = dragging ?? positions;

  // Mission Control, the window switcher (Alt + `) and their keys.
  useEffect(() => {
    if (!on) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F3" || (e.ctrlKey && e.key === "ArrowUp")) {
        e.preventDefault();
        setMission(!mission);
      } else if (e.key === "Escape" && mission) {
        setMission(false);
      } else if (e.altKey && e.code === "Backquote") {
        e.preventDefault();
        setSwitcher((sw) => {
          const list = sw?.list ?? [...windows].sort((a, b) => (a.min === b.min ? b.z - a.z : a.min ? 1 : -1)).map((w) => w.app);
          if (!list.length) return null;
          const step = e.shiftKey ? -1 : 1;
          const index = sw ? (sw.index + step + list.length) % list.length : Math.min(1, list.length - 1);
          haptic("tick");
          return { list, index };
        });
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key !== "Alt") return;
      setSwitcher((sw) => {
        if (sw) focusApp(sw.list[sw.index]);
        return null;
      });
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onUp);
    };
  }, [on, mission, windows]);

  // Left alone, the desktop falls asleep: a screensaver, then a lock screen on the next touch.
  useEffect(() => {
    if (!on || narrow || booting) return;
    let id: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(id);
      id = setTimeout(() => setSleep((s) => s ?? (matchMedia("(prefers-reduced-motion: reduce)").matches ? "locked" : "saver")), IDLE_MS);
    };
    const wake = () => {
      setSleep((s) => (s === "saver" ? "locked" : s));
      arm();
    };
    const events = ["pointermove", "pointerdown", "keydown", "wheel"] as const;
    events.forEach((t) => window.addEventListener(t, wake, { passive: true }));
    arm();
    return () => {
      clearTimeout(id);
      events.forEach((t) => window.removeEventListener(t, wake));
    };
  }, [on, narrow, booting]);

  // Phones: holding an app's home bar opens recent apps.
  useEffect(() => {
    const open = () => setRecents(true);
    window.addEventListener(SWITCHER, open);
    return () => window.removeEventListener(SWITCHER, open);
  }, []);

  // The page underneath can't be reached while the desktop is up.
  useEffect(() => {
    const main = document.getElementById("main");
    const footer = document.querySelector("footer");
    main?.toggleAttribute("inert", on);
    footer?.toggleAttribute("inert", on);
    if (!on) setSleep(null);
  }, [on]);

  if (!on) return null;

  const visible = windows.filter((w) => !w.min);
  const cells = mission && !narrow ? missionCells(ALL_APPS.filter((a) => visible.some((w) => w.app === a)), vw, vh) : null;
  const previewRect = preview ? snapRect(preview, vw, vh) : null;

  // Icons: drag one (or the whole selection) to arrange them; click selects, double-click opens.
  const onIconDown = (id: string) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    const group = selected.has(id) ? selected : new Set([id]);
    if (!selected.has(id)) setSelected(group);
    drag.current = { id, x: e.clientX, y: e.clientY, start: positions, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onIconMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    d.moved = true;
    const group = selected.has(d.id) ? selected : new Set([d.id]);
    const next: Pos = { ...d.start };
    group.forEach((g) => (next[g] = { x: d.start[g].x + dx, y: d.start[g].y + dy }));
    setDragging(next);
  };
  const onIconUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.moved && dragging) {
      savePositions(dragging);
      haptic("tick");
    }
    setDragging(null);
  };

  // Lasso: drag across the empty desktop to select several icons.
  const onSurfaceDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.button !== 0 || narrow) return;
    setSelected(new Set());
    if (mission) return;
    setLasso({ x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onSurfaceMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!lasso) return;
    const next = { ...lasso, x1: e.clientX, y1: e.clientY };
    setLasso(next);
    const [l, r] = [Math.min(next.x0, next.x1), Math.max(next.x0, next.x1)];
    const [t, b] = [Math.min(next.y0, next.y1), Math.max(next.y0, next.y1)];
    setSelected(new Set(icons.filter((ic) => {
      const p = positions[ic.id];
      return p.x < r && p.x + ICON_W > l && p.y < b && p.y + ICON_H > t;
    }).map((ic) => ic.id)));
  };

  const dockItem = (app: AppId) => {
    const win = windows.find((w) => w.app === app);
    return (
      <li key={app}>
        <button
          type="button"
          data-dock-app={app}
          data-running={win ? "on" : undefined}
          aria-label={`${APPS[app].name}${win ? (win.min ? " (minimised)" : " (open)") : ""}`}
          onClick={() => {
            if (!win) openApp(app);
            else if (!win.min && focused === app) minimiseApp(app);
            else focusApp(app);
          }}
        >
          <DockIcon app={app} />
          <span className="dock-tip" aria-hidden="true">{APPS[app].name}</span>
        </button>
      </li>
    );
  };

  return (
    <div className="desktop" role="region" aria-label="sahaj.os desktop" data-mission={mission || undefined} data-narrow={narrow || undefined}>
      <div
        className="desktop-surface"
        onPointerDown={onSurfaceDown}
        onPointerMove={onSurfaceMove}
        onPointerUp={() => setLasso(null)}
        onPointerCancel={() => setLasso(null)}
        onClick={(e) => mission && e.target === e.currentTarget && setMission(false)}
      >
        {narrow ? (
          <PhoneHome />
        ) : (
          <ul className="desktop-icons" aria-label="Desktop">
            {icons.map((ic) => (
              <li key={ic.id} style={{ left: shown[ic.id].x, top: shown[ic.id].y }} data-dragging={dragging && selected.has(ic.id) ? "on" : undefined}>
                <button
                  type="button"
                  aria-pressed={selected.has(ic.id)}
                  onPointerDown={onIconDown(ic.id)}
                  onPointerMove={onIconMove}
                  onPointerUp={onIconUp}
                  onPointerCancel={onIconUp}
                  onClick={() => {
                    if (!selected.has(ic.id)) setSelected(new Set([ic.id]));
                    haptic("tick");
                    // One tap opens on touch screens; a mouse double-clicks like a desktop.
                    if (matchMedia("(pointer: coarse)").matches) ic.open();
                  }}
                  onDoubleClick={ic.open}
                  onKeyDown={(e) => e.key === "Enter" && ic.open()}
                >
                  <i className={`file-icon fx-${ic.kind}`} aria-hidden="true" />
                  <span>{ic.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {lasso && (
          <div
            className="lasso"
            aria-hidden="true"
            style={{ left: Math.min(lasso.x0, lasso.x1), top: Math.min(lasso.y0, lasso.y1), width: Math.abs(lasso.x1 - lasso.x0), height: Math.abs(lasso.y1 - lasso.y0) }}
          />
        )}
        {!narrow && visible.length === 0 && !mission && (
          <p className="desktop-hint">
            Double-click an icon or pick an app from the dock. <kbd>F3</kbd> shows every window, <kbd>Alt</kbd> <kbd>`</kbd> switches.
          </p>
        )}
        {mission && visible.length === 0 && <p className="desktop-hint">No open windows.</p>}
      </div>

      {previewRect && (
        <div className="snap-preview" style={{ left: previewRect.x, top: previewRect.y, width: previewRect.w, height: previewRect.h }} aria-hidden="true" />
      )}

      {windows.map((w) => (
        <DesktopWindow
          key={w.app}
          win={w}
          vw={vw}
          vh={vh}
          focused={focused === w.app}
          cell={cells?.get(w.app) ?? null}
          narrow={narrow}
          onSnapPreview={setPreview}
        >
          <AppBody app={w.app} hasResume={hasResume} />
        </DesktopWindow>
      ))}

      {!narrow && (
        <nav className="dock" aria-label="Dock">
          <ul>
            {SYSTEM_APPS.map(dockItem)}
            <li className="dock-sep" aria-hidden="true" />
            {DEMO_APPS.map(dockItem)}
            <li className="dock-sep" aria-hidden="true" />
            <li>
              <button type="button" aria-label="Mission Control" aria-pressed={mission} onClick={() => setMission(!mission)}>
                <DockIcon app="mission" />
                <span className="dock-tip" aria-hidden="true">Mission Control</span>
              </button>
            </li>
            <li>
              <button type="button" aria-label="Back to the page" onClick={exitDesktop}>
                <DockIcon app="exit" />
                <span className="dock-tip" aria-hidden="true">Back to the page</span>
              </button>
            </li>
          </ul>
        </nav>
      )}

      {switcher && (
        <div className="switcher" role="listbox" aria-label="Switch window">
          {switcher.list.map((app, i) => (
            <button
              key={app}
              type="button"
              role="option"
              aria-selected={i === switcher.index}
              onClick={() => (focusApp(app), setSwitcher(null))}
            >
              <DockIcon app={app} />
              <span>{APPS[app].name}</span>
            </button>
          ))}
        </div>
      )}

      {narrow && <PhoneStatus />}
      {narrow && recents && <AppSwitcher windows={windows} onClose={() => setRecents(false)} />}

      {/* Above everything, the island and menu bar included. */}
      {sleep === "saver" && createPortal(<ScreenSaver />, document.body)}
      {sleep === "locked" && createPortal(<LockScreen onUnlock={() => setSleep(null)} />, document.body)}
      {booting && createPortal(<BootLog />, document.body)}
    </div>
  );
}
