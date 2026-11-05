"use client";

import { usePathname, useRouter } from "next/navigation";
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import { showActivity } from "@/lib/islandBus";
import { isMotionPaused, setMotionPaused } from "@/lib/motion";
import { haptic, setHapticsOn, useHapticsOn, useHapticsSupported } from "@/lib/haptics";
import { play, setSoundOn, useSoundOn } from "@/lib/sound";
import { setViewMode, useViewMode } from "@/lib/viewMode";
import { enterDesktop, exitDesktop, openApp, setMission, useDesktop } from "@/lib/desktop";
import { shutDown, toggleNotices } from "@/components/System";

/**
 * Command palette: Ctrl/⌘ + K (or the search chip in the island) expands the island into a
 * search box — like FLOAT's expanded surface — for jumping anywhere or running an action.
 */

type Item = { id: string; group: "Go to" | "Projects" | "Links" | "Actions"; label: string; hint?: string; keywords?: string; run: () => void };

export const OPEN_PALETTE = "sahaj:open-palette";

/** Opens the palette from anywhere (e.g. the island's search chip). */
export const openPalette = () => window.dispatchEvent(new Event(OPEN_PALETTE));

export function Palette({ hasResume }: { hasResume: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const mode = useViewMode();
  const soundOn = useSoundOn();
  const hapticsOn = useHapticsOn();
  const hapticsSupported = useHapticsSupported();
  const desktop = useDesktop().on;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const field = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const close = () => setOpen(false);

  const go = (hash: string) => {
    close();
    if (pathname === "/") document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    else router.push(`/#${hash}`);
  };

  const external = (href: string) => {
    close();
    window.open(href, "_blank", "noopener");
  };

  const items = useMemo<Item[]>(() => {
    const sections: [string, string, string][] = [
      ["work", "Work", "projects selected"],
      ["float", "FLOAT chapter", "dynamic island windows"],
      ["portrait", "Code portrait", "particles photo who made this"],
      ["timeline", "Timeline", "history year"],
      ["about", "About & terminal", "shell bio"],
      ["contact", "Contact", "email reach hire"],
    ];
    return [
      ...sections.map(([id, label, keywords]): Item => ({ id: `go-${id}`, group: "Go to", label, keywords, run: () => go(id) })),
      ...projects.map(
        (p): Item => ({
          id: `p-${p.slug}`,
          group: "Projects",
          label: p.name,
          hint: p.tagline,
          keywords: p.stack.join(" "),
          run: () => {
            close();
            router.push(`/work/${p.slug}`);
          },
        }),
      ),
      ...(hasResume ? [{ id: "resume", group: "Links" as const, label: "Resume (PDF)", keywords: "cv", run: () => external("/resume.pdf") }] : []),
      { id: "github", group: "Links", label: "GitHub", hint: "github.com/Sahaj1207", run: () => external(site.links.github) },
      { id: "linkedin", group: "Links", label: "LinkedIn", run: () => external(site.links.linkedin) },
      { id: "x", group: "Links", label: "X", hint: "@sahaj0712", keywords: "twitter", run: () => external(site.links.x) },
      {
        id: "desktop",
        group: "Actions",
        label: desktop ? "Back to the page" : "Open the desktop",
        keywords: "os windows dock startx finder",
        run: () => {
          close();
          if (desktop) exitDesktop();
          else enterDesktop("finder");
        },
      },
      ...(
        [
          ["terminal", "Open Terminal window", "shell tmux"],
          ["finder", "Open Finder", "files projects"],
          ["settings", "System Settings", "wallpaper preferences"],
          ["about", "About sahaj.os", "version build"],
        ] as const
      ).map(([app, label, keywords]): Item => ({ id: `app-${app}`, group: "Actions", label, keywords, run: () => (close(), openApp(app)) })),
      { id: "mission", group: "Actions", label: "Mission Control", hint: "F3", keywords: "windows overview expose", run: () => (close(), setMission(true)) },
      { id: "notices", group: "Actions", label: "Notification centre", keywords: "history alerts", run: () => (close(), toggleNotices()) },
      { id: "shutdown", group: "Actions", label: "Shut down…", keywords: "power off restart", run: () => (close(), shutDown()) },
      {
        id: "view",
        group: "Actions",
        label: mode === "live" ? "Switch to plain view" : "Switch to live view",
        keywords: "theme webgl accessibility",
        run: () => {
          setViewMode(mode === "live" ? "plain" : "live");
          close();
        },
      },
      {
        id: "motion",
        group: "Actions",
        label: isMotionPaused() ? "Resume motion" : "Pause motion",
        keywords: "animation reduce",
        run: () => {
          setMotionPaused(!isMotionPaused());
          close();
        },
      },
      {
        id: "sound",
        group: "Actions",
        label: soundOn ? "Turn sound off" : "Turn sound on",
        keywords: "audio ambience music mute",
        run: () => {
          setSoundOn(!soundOn);
          close();
        },
      },
      ...(hapticsSupported
        ? [
            {
              id: "haptics",
              group: "Actions" as const,
              label: hapticsOn ? "Turn haptics off" : "Turn haptics on",
              keywords: "vibration feel touch",
              run: () => {
                setHapticsOn(!hapticsOn);
                close();
              },
            },
          ]
        : []),
      {
        id: "copy",
        group: "Actions",
        label: "Copy link to this site",
        keywords: "share url",
        run: () => {
          navigator.clipboard?.writeText(site.url).catch(() => {});
          close();
          showActivity({ kind: "notify", title: "Link copied", body: site.url.replace("https://", "") }, "palette", 3500);
        },
      },
      {
        id: "play",
        group: "Actions",
        label: "Make the island play",
        keywords: "float music fun",
        run: () => {
          close();
          showActivity({ kind: "float" }, "palette", 6000);
        },
      },
    ];
    // Rebuilt when the route or view changes, so labels stay current.
  }, [pathname, mode, hasResume, soundOn, hapticsOn, hapticsSupported, desktop]);

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return items;
    return items.filter((it) => {
      const hay = `${it.label} ${it.hint ?? ""} ${it.keywords ?? ""} ${it.group}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [items, query]);

  // Global shortcut and the island's search chip.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE, onOpen);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (open) {
      play("open");
      haptic("firm");
      returnFocus.current = document.activeElement as HTMLElement | null;
      root.dataset.palette = "on";
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => field.current?.focus());
    } else {
      delete root.dataset.palette;
      returnFocus.current?.focus?.({ preventScroll: true });
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => close(), [pathname]);

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[active]?.run();
    } else if (e.key === "Tab") {
      // The input is the only stop; keep focus inside the dialog.
      e.preventDefault();
    }
  };

  if (!open) return null;

  let lastGroup = "";
  return (
    <div className="palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette" onKeyDown={onKey}>
        <div className="palette-search">
          <span className="island-mark" aria-hidden="true">S</span>
          <input
            ref={field}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, sections, actions…"
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results[active] ? `pal-${results[active].id}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd>esc</kbd>
        </div>
        <ul id="palette-list" ref={list} className="palette-list" role="listbox" aria-label="Results">
          {results.length === 0 && <li className="palette-empty">No matches. Try “float” or “contact”.</li>}
          {results.map((it, i) => {
            const header = it.group !== lastGroup ? it.group : null;
            lastGroup = it.group;
            return (
              <li key={it.id} role="presentation">
                {header && <p className="palette-group" aria-hidden="true">{header}</p>}
                <div
                  id={`pal-${it.id}`}
                  role="option"
                  aria-selected={i === active}
                  data-index={i}
                  className="palette-item"
                  onMouseMove={() => setActive(i)}
                  onClick={() => it.run()}
                >
                  <span>{it.label}</span>
                  {it.hint && <span className="palette-hint">{it.hint}</span>}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="palette-foot" aria-hidden="true">
          <kbd>↑</kbd> <kbd>↓</kbd> to move · <kbd>↵</kbd> to open · <kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>K</kbd> to toggle
        </p>
      </div>
    </div>
  );
}
