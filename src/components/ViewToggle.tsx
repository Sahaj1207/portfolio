"use client";

import { setMotionPaused, useMotionPaused } from "@/lib/motion";
import { setHapticsOn, useHapticsOn, useHapticsSupported } from "@/lib/haptics";
import { setViewMode, useViewMode } from "@/lib/viewMode";
import { toggleTheme, useTheme } from "@/lib/theme";

export function ThemeToggle({ className = "view-toggle" }: { className?: string }) {
  const theme = useTheme();
  return (
    <button type="button" className={className} onClick={toggleTheme} aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"} data-theme-icon={theme}>
      {theme === "light" ? "Dark mode" : "Light mode"}
    </button>
  );
}

export function ViewToggle() {
  const mode = useViewMode();
  const next = mode === "live" ? "plain" : "live";
  return (
    <button type="button" className="view-toggle" onClick={() => setViewMode(next)}>
      {mode === "live" ? "Switch to plain view" : "Switch to live view"}
    </button>
  );
}

export function MotionToggle() {
  const paused = useMotionPaused();
  return (
    <button type="button" className="view-toggle" aria-pressed={paused} onClick={() => setMotionPaused(!paused)}>
      Pause motion
    </button>
  );
}


/** Only shown on devices that can produce haptics (phones). */
export function HapticsToggle() {
  const supported = useHapticsSupported();
  const on = useHapticsOn();
  if (!supported) return null;
  return (
    <>
      {" · "}
      <button type="button" className="view-toggle" aria-pressed={on} onClick={() => setHapticsOn(!on)}>
        {on ? "Haptics on" : "Haptics off"}
      </button>
    </>
  );
}
