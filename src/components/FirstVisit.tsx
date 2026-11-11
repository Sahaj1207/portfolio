"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enterDesktop, isDesktopOn } from "@/lib/desktop";
import { haptic } from "@/lib/haptics";

/**
 * Asks a first-time visitor how they'd like to look around: read the portfolio, or boot the
 * desktop. Shown once per browser, after the entrance has opened. Esc, a click outside or
 * "Read" all keep the page.
 */

const KEY = "sahaj:welcomed";

export function FirstVisit() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (pathname !== "/" || isDesktopOn()) return;
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      return;
    }
    const root = document.documentElement;
    let id: ReturnType<typeof setTimeout>;
    // Wait for the entrance to finish (it removes data-enter), then a beat more.
    const check = () => {
      if (root.dataset.enter) id = setTimeout(check, 200);
      else id = setTimeout(() => setOpen(true), 500);
    };
    check();
    return () => clearTimeout(id);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    first.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && choose("page");
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const choose = (how: "page" | "desktop") => {
    try {
      localStorage.setItem(KEY, how);
    } catch {
      /* not remembered */
    }
    setOpen(false);
    haptic("light");
    if (how === "desktop") enterDesktop("finder");
  };

  if (!open) return null;

  return (
    <div className="welcome-backdrop" onMouseDown={(e) => e.target === e.currentTarget && choose("page")}>
      <div className="welcome" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
        <p className="eyebrow">welcome to sahaj.os</p>
        <h2 id="welcome-title">
          How would you like to <em>look around</em>?
        </h2>
        <div className="welcome-choices">
          <button ref={first} type="button" onClick={() => choose("page")}>
            <strong>Read the portfolio</strong>
            <span>Scroll through the work and the story. About two minutes.</span>
          </button>
          <button type="button" onClick={() => choose("desktop")}>
            <strong>Boot the desktop</strong>
            <span>Windows, a dock and live demos of the projects. Best on a laptop.</span>
          </button>
        </div>
        <p className="welcome-foot">You can switch any time from the menu bar, ⌘K or the terminal.</p>
      </div>
    </div>
  );
}
