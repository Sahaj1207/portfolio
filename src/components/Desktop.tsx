"use client";

import { type ReactNode, useEffect, useState } from "react";
import { About, Contact, Finder, Notes, Photos, Settings } from "@/components/DesktopApps";
import { DesktopWindow, type Rect } from "@/components/DesktopWindow";
import { Terminal } from "@/components/Terminal";
import { APPS, type AppId, DOCK, type Snap, TOP, exitDesktop, focusApp, minimiseApp, openApp, setMission, useDesktop } from "@/lib/desktop";
import { haptic } from "@/lib/haptics";

/**
 * The sahaj.os desktop: icons, windows and a dock over the atmosphere, with the page
 * hidden underneath. Mission Control (F3 or Ctrl + ↑) lays every open window side by side.
 */

const DOCK_APPS: AppId[] = ["finder", "terminal", "photos", "notes", "contact", "settings"];

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
  }
}

function DockIcon({ app }: { app: AppId | "mission" | "exit" }) {
  return <i className={`dock-icon di-${app}`} aria-hidden="true" />;
}

export function Desktop({ hasResume }: { hasResume: boolean }) {
  const { on, windows, mission, focused } = useDesktop();
  const { vw, vh } = useViewport();
  const [preview, setPreview] = useState<Snap>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const narrow = vw < 720;

  // Mission Control and its keys; Esc also leaves it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F3" || (e.ctrlKey && e.key === "ArrowUp")) {
        e.preventDefault();
        setMission(!mission);
      } else if (e.key === "Escape" && mission) {
        setMission(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mission]);

  // The page underneath can't be reached while the desktop is up.
  useEffect(() => {
    const main = document.getElementById("main");
    const footer = document.querySelector("footer");
    main?.toggleAttribute("inert", on);
    footer?.toggleAttribute("inert", on);
  }, [on]);

  if (!on) return null;

  const visible = windows.filter((w) => !w.min);
  const cells = mission ? missionCells(DOCK_APPS.concat("about").filter((a) => visible.some((w) => w.app === a)), vw, vh) : null;

  const icons: { id: string; label: string; kind: string; open: () => void }[] = [
    { id: "work", label: "work", kind: "folder", open: () => openApp("finder") },
    { id: "readme", label: "README.md", kind: "doc", open: () => openApp("notes") },
    { id: "portrait", label: "portrait.webp", kind: "image", open: () => openApp("photos") },
    ...(hasResume ? [{ id: "resume", label: "resume.pdf", kind: "pdf", open: () => window.open("/resume.pdf", "_blank", "noopener") }] : []),
  ];

  const previewRect =
    preview === "max"
      ? { left: 8, top: TOP, width: vw - 16, height: vh - TOP - DOCK }
      : preview
        ? { left: preview === "left" ? 8 : (vw + 8) / 2, top: TOP, width: (vw - 24) / 2, height: vh - TOP - DOCK }
        : null;

  return (
    <div className="desktop" role="region" aria-label="sahaj.os desktop" data-mission={mission || undefined}>
      <div
        className="desktop-surface"
        onPointerDown={(e) => e.target === e.currentTarget && setSelected(null)}
        onClick={(e) => mission && e.target === e.currentTarget && setMission(false)}
      >
        <ul className="desktop-icons" aria-label="Desktop">
          {icons.map((ic) => (
            <li key={ic.id}>
              <button
                type="button"
                aria-pressed={selected === ic.id}
                onClick={() => {
                  setSelected(ic.id);
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
        {visible.length === 0 && !mission && (
          <p className="desktop-hint">
            Double-click an icon, or pick an app from the dock. <kbd>F3</kbd> shows every window.
          </p>
        )}
        {mission && visible.length === 0 && <p className="desktop-hint">No open windows.</p>}
      </div>

      {previewRect && <div className="snap-preview" style={previewRect} aria-hidden="true" />}

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

      <nav className="dock" aria-label="Dock">
        <ul>
          {DOCK_APPS.map((app) => {
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
          })}
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
    </div>
  );
}
