"use client";

import Link from "next/link";
import { type Activity, clearActivity, showActivity } from "@/lib/islandBus";

/** Projects that can demonstrate themselves in the island. */
const ACTIVITY: Partial<Record<string, Activity>> = {
  float: { kind: "float" },
  harika: { kind: "harika" },
  "mothertongue-books": { kind: "mothertongue" },
  pie: { kind: "pie" },
};

/**
 * A work card that hands the island to its project while hovered or focused:
 * FLOAT plays, HARIKA thinks, MotherTongue Books turns a page, PIE fixes a typo.
 */
export function ProjectCard({ slug, className, children }: { slug: string; className: string; children: React.ReactNode }) {
  const activity = ACTIVITY[slug];
  const owner = `card:${slug}`;
  const on = () => activity && showActivity(activity, owner);
  const off = () => clearActivity(owner);
  return (
    <Link
      href={`/work/${slug}`}
      className={className}
      onPointerEnter={on}
      onPointerLeave={off}
      onFocus={on}
      onBlur={off}
    >
      {children}
    </Link>
  );
}
