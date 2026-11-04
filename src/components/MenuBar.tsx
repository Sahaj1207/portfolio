"use client";

import { useEffect, useState } from "react";
import gitlog from "@/content/gitlog.json";
import { openPalette } from "@/components/Palette";

/**
 * The OS menu bar, either side of the island: the sahaj.os menu (opens the command palette)
 * on the left; the live build and the visitor's clock on the right.
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

  return (
    <div className="menubar" role="navigation" aria-label="System">
      <button type="button" className="menubar-os" onClick={openPalette} aria-label="sahaj.os menu — open command palette">
        <span className="menubar-logo" aria-hidden="true" />
        sahaj<em>.os</em>
      </button>
      <div className="menubar-tray">
        <a href={`${REPO}/commit/${BUILD}`} target="_blank" rel="noreferrer" title="This build on GitHub">
          <span className="menubar-dot" aria-hidden="true" />
          build {BUILD}
        </a>
        <time suppressHydrationWarning>
          {day} {time}
        </time>
      </div>
    </div>
  );
}
