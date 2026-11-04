"use client";

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
