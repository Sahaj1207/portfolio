"use client";

import { setMotionPaused, useMotionPaused } from "@/lib/motion";
import { setSoundOn, useSoundOn } from "@/lib/sound";
import { setViewMode, useViewMode } from "@/lib/viewMode";

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

export function SoundToggle({ className = "view-toggle" }: { className?: string }) {
  const on = useSoundOn();
  return (
    <button type="button" className={className} aria-pressed={on} onClick={() => setSoundOn(!on)}>
      {on ? "Sound on" : "Sound off"}
    </button>
  );
}
