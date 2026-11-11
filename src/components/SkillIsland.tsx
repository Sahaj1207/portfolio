"use client";

import Link from "next/link";
import { type CSSProperties, type KeyboardEvent, useLayoutEffect, useRef, useState } from "react";
import { skillAreas } from "@/content/journey";
import { projects } from "@/content/projects";
import { haptic } from "@/lib/haptics";

/**
 * Skills as a dock of eight areas. Picking one morphs a black island open underneath, the
 * same shape language as the island at the top of the page, listing that area's skills and
 * the projects each one was used in. One area at a time, so nothing crowds.
 */

const NAME = Object.fromEntries(projects.map((p) => [p.slug, p.name]));

export function SkillIsland() {
  const [active, setActive] = useState(0);
  const [height, setHeight] = useState<number | null>(null);
  const [notch, setNotch] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const hover = useRef<ReturnType<typeof setTimeout>>(undefined);
  const area = skillAreas[active];

  // The island's height follows its content, so switching areas morphs it.
  useLayoutEffect(() => {
    const el = content.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [active]);

  // The notch sits under the active icon.
  useLayoutEffect(() => {
    const place = () => {
      const tab = tabs.current[active];
      const box = root.current;
      if (!tab || !box) return;
      const t = tab.getBoundingClientRect();
      setNotch(t.left + t.width / 2 - box.getBoundingClientRect().left);
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [active]);

  const pick = (i: number) => {
    if (i === active) return;
    setActive(i);
    haptic("tick");
  };

  const onKey = (e: KeyboardEvent) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (active + step + skillAreas.length) % skillAreas.length;
    pick(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="skill-island" ref={root}>
      <div className="si-dock" role="tablist" aria-label="Skill areas" onKeyDown={onKey}>
        {skillAreas.map((a, i) => (
          <button
            key={a.id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`si-tab-${a.id}`}
            aria-selected={i === active}
            aria-controls="si-panel"
            tabIndex={i === active ? 0 : -1}
            onClick={() => pick(i)}
            onPointerEnter={(e) => {
              if (e.pointerType !== "mouse") return;
              clearTimeout(hover.current);
              hover.current = setTimeout(() => pick(i), 90);
            }}
            onPointerLeave={() => clearTimeout(hover.current)}
          >
            <i className="si-icon" style={{ "--a": a.tint[0], "--b": a.tint[1] } as CSSProperties} aria-hidden="true">
              {a.mark}
            </i>
            <span className="si-area">{a.area}</span>
            <small className="si-count">{a.items.length}</small>
          </button>
        ))}
      </div>

      <div
        id="si-panel"
        className="si-island"
        role="tabpanel"
        aria-labelledby={`si-tab-${area.id}`}
        style={{ height: height ?? undefined, "--notch": notch == null ? "50%" : `${notch}px` } as CSSProperties}
      >
        <div ref={content} key={area.id} className="si-content">
          <div className="si-head">
            <i className="si-icon small" style={{ "--a": area.tint[0], "--b": area.tint[1] } as CSSProperties} aria-hidden="true">
              {area.mark}
            </i>
            <p className="si-title">{area.area}</p>
            <p className="si-sub">{area.items.length} skills · where each one was used</p>
          </div>
          <ul className="si-list">
            {area.items.map((s, i) => (
              <li key={s.name} style={{ "--i": i } as CSSProperties}>
                <span className="si-name">{s.name}</span>
                <span className="si-used">
                  {s.used.map((u) =>
                    NAME[u] ? (
                      <Link key={u} href={`/work/${u}`}>
                        {NAME[u]}
                      </Link>
                    ) : (
                      <em key={u}>{u}</em>
                    ),
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
