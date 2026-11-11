"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import gitlog from "@/content/gitlog.json";
import { openSystemMenu, toggleNotices } from "@/components/System";
import { ThemeToggle } from "@/components/ViewToggle";
import { APPS, enterDesktop, exitDesktop, useDesktop } from "@/lib/desktop";
import { useActiveSlot } from "@/lib/useActiveSlot";

/**
 * The OS menu bar, either side of the island: the sahaj.os menu and the focused app on the
 * left; the desktop switch, light/dark, the live build and the clock (notification centre) on the right.
 */

const BUILD = gitlog[0]?.hash ?? "dev";
const REPO = "https://github.com/Sahaj1207/portfolio";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function MenuBar() {
  const now = useClock();
  const time = now?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? "";
  const day = now?.toLocaleDateString([], { weekday: "short" }) ?? "";

  const { on: desktop, focused } = useDesktop();
  // Over the portrait chapter (dark in both themes) the bar switches to light ink.
  const { slot } = useActiveSlot(usePathname());
  const dark = slot === "portrait" && !desktop;

  return (
    <div className="menubar" role="navigation" aria-label="System" data-stage={dark ? "dark" : undefined}>
      <div className="menubar-left">
        <button
          type="button"
          className="menubar-os"
          aria-haspopup="menu"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            openSystemMenu(r.left, r.bottom + 6);
          }}
        >
          <span className="menubar-logo" aria-hidden="true" />
          sahaj<em>.os</em>
        </button>
        {desktop && <strong className="menubar-app">{focused ? APPS[focused].name : "Finder"}</strong>}
      </div>
      <div className="menubar-tray">
        <button
          type="button"
          className="menubar-desk"
          aria-pressed={desktop}
          onClick={() => (desktop ? exitDesktop() : enterDesktop("finder"))}
          title={desktop ? "Back to the page" : "Open the sahaj.os desktop"}
        >
          {desktop ? "page" : "desktop"}
        </button>
        <ThemeToggle className="menubar-theme" />
        <a href={`${REPO}/commit/${BUILD}`} target="_blank" rel="noreferrer" title="This build on GitHub">
          <span className="menubar-dot" aria-hidden="true" />
          build {BUILD}
        </a>
        <button type="button" className="menubar-clock" data-notices-toggle onClick={toggleNotices} aria-label="Notification centre">
          <time suppressHydrationWarning>
            {day} {time}
          </time>
        </button>
      </div>
    </div>
  );
}
