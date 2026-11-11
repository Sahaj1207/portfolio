"use client";

import { useEffect, useState } from "react";
import github from "@/content/github.json";

/**
 * "Recently shipped", from GitHub at build time (scripts/github.mjs). This site itself is
 * left out, since every change to it is a push. Times are relative to the visitor's clock.
 */

/** Display names for repos whose names differ from the project. */
export const REPO_NAMES: Record<string, string> = {
  "HARIKA-Human-Aware-Responsive-Intelligent-Kernel-Anima": "HARIKA",
  vayucast: "VayuCast",
  "mothertongue-books": "MotherTongue Books",
  crumb: "Crumb",
  "ResumePilot-AI": "ResumePilot AI",
  "aurelis-estates": "Aurelis Estates",
};

function ago(iso: string, now: number) {
  const m = Math.max(1, Math.round((now - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

export function Activity() {
  const recent = github.recent.filter((r) => r.repo !== "portfolio").slice(0, 2);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  if (!recent.length) return null;
  return (
    <p className="activity">
      <span className="live-dot" aria-hidden="true" />
      <span className="activity-label">Recently pushed</span>
      {recent.map((r, i) => (
        <span key={r.repo}>
          {i > 0 && <span aria-hidden="true"> · </span>}
          <a href={r.url} target="_blank" rel="noreferrer">{REPO_NAMES[r.repo] ?? r.repo}</a>
          {now && <span className="activity-when"> {ago(r.pushedAt, now)}</span>}
        </span>
      ))}
      <span className="activity-count"> · {github.publicRepos} public repos</span>
    </p>
  );
}
