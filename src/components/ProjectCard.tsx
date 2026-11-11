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
 * The whole card links to the case study through a cover link, so buttons inside it
 * (like "Try it") stay separate controls.
 */
export function ProjectCard({ slug, name, className, children }: { slug: string; name: string; className: string; children: React.ReactNode }) {
  const activity = ACTIVITY[slug];
  const owner = `card:${slug}`;
  const on = () => activity && showActivity(activity, owner);
  const off = () => clearActivity(owner);
  return (
    <article className={className} onPointerEnter={on} onPointerLeave={off} onFocus={on} onBlur={off}>
      <Link href={`/work/${slug}`} className="card-cover" aria-label={`${name}: read the case study`} />
      {children}
    </article>
  );
}
