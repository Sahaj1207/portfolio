"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { showActivity } from "@/lib/islandBus";
import { play } from "@/lib/sound";

/**
 * An OS window over the page, grown from the island at the top. Red closes, yellow
 * minimises back into the island, green opens the full page. Esc closes; focus moves in
 * and returns to where it was.
 */
export function Window({ title, slug, children }: { title: string; slug: string; children: ReactNode }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState<null | "close" | "minimise">(null);
  const panel = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const leave = (how: "close" | "minimise") => {
    if (leaving) return;
    setLeaving(how);
    play("close");
    if (how === "minimise") showActivity({ kind: "notify", title: "Minimised", body: `${title} — tap ⌘K to reopen` }, "window", 3200);
    setTimeout(() => router.back(), how === "minimise" ? 380 : 260);
  };

  // Lock the page behind the window, focus the window, restore both on close.
  useEffect(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    root.dataset.window = "on";
    play("whoosh");
    panel.current?.focus({ preventScroll: true });
    return () => {
      delete root.dataset.window;
      returnFocus.current?.focus?.({ preventScroll: true });
    };
  }, []);

  // Each new project starts at the top of the window.
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") leave("close");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="window-backdrop" data-leaving={leaving ?? undefined} onMouseDown={(e) => e.target === e.currentTarget && leave("close")}>
      <div ref={panel} className="window" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <div className="window-bar">
          <div className="window-lights">
            <button type="button" className="light red" onClick={() => leave("close")} aria-label="Close window" />
            <button type="button" className="light yellow" onClick={() => leave("minimise")} aria-label="Minimise into the island" />
            <button
              type="button"
              className="light green"
              onClick={() => window.location.assign(`/work/${slug}`)}
              aria-label="Open as a full page"
            />
          </div>
          <span className="window-title">~/work/{slug}</span>
          <span className="window-esc" aria-hidden="true">esc</span>
        </div>
        <div ref={body} className="window-body">{children}</div>
      </div>
    </div>
  );
}
