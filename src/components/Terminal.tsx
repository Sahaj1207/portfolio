"use client";

import { useRouter } from "next/navigation";
import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";
import gitlog from "@/content/gitlog.json";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import { type Activity, clearActivity, showActivity } from "@/lib/islandBus";
import { haptic, setHapticsOn } from "@/lib/haptics";
import { setSoundOn } from "@/lib/sound";
import { setViewMode } from "@/lib/viewMode";
import { enterDesktop, exitDesktop, isDesktopOn } from "@/lib/desktop";
import { setThemePref } from "@/lib/theme";

/**
 * A small shell. It answers questions about Sahaj, opens projects, prints the site's real
 * git history — and drives the Dynamic Island at the top of the page.
 */

type Line = { id: number; node: ReactNode };

const OWNER = "terminal";
const PROMPT = (
  <>
    <span className="p">sahaj@github</span> <span className="k">~ %</span>{" "}
  </>
);

const ISLAND: Record<string, { activity: Activity; ms: number; say: string }> = {
  play: { activity: { kind: "float" }, ms: 6000, say: "▶ now playing on the island" },
  orb: { activity: { kind: "orb" }, ms: 4000, say: "island shrunk to its ambient orb" },
  harika: { activity: { kind: "harika" }, ms: 6000, say: "HARIKA is thinking on the island" },
  book: { activity: { kind: "mothertongue" }, ms: 6000, say: "turning a page in Telugu" },
  pie: { activity: { kind: "pie" }, ms: 6000, say: "PIE is fixing a typo" },
};

const COMMANDS = [
  "help",
  "whoami",
  "about",
  "projects",
  "open",
  "stack",
  "contact",
  "resume",
  "git log",
  "island",
  "portrait",
  "view",
  "sound",
  "haptics",
  "neofetch",
  "sudo hire-me",
  "echo",
  "date",
  "history",
  "clear",
  "cat profile.txt",
  "sudo mode --developer",
  "startx",
  "logout",
  "theme",
];

const a = (href: string, label: string) => (
  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
    {label}
  </a>
);

/** The professional side — pane ①. */
const profileLines = () => [
  <><span className="k">name     </span> <span className="v">{site.name}</span></>,
  <><span className="k">role     </span> <span className="v">Full-stack &amp; AI engineer</span></>,
  <><span className="k">ships    </span> <span className="v">desktop · mobile · web · AI</span></>,
  <><span className="k">stack    </span> <span className="v">TypeScript · Python · Rust</span></>,
  <><span className="k">status   </span> <span className="g">● open to work</span></>,
];

/** The developer side — pane ②; also printed by `sudo mode --developer`. */
const developerMode = () => [
  <><span className="k">sleep          </span> <span className="r">command not found</span></>,
  <><span className="k">coffee         </span> <span className="g">■■■■■■■■</span><span className="k">■■</span> <span className="v">80%</span></>,
  <><span className="k">side_projects  </span> <span className="v">11 and counting</span></>,
  <><span className="k">built_for_fun  </span> <span className="v">a Dynamic Island for Windows</span></>,
  <><span className="k">ideas.queue    </span> <span className="y">overflow ⚠</span></>,
  <><span className="k">git push -f    </span> <span className="v">never on main</span></>,
];

/**
 * One tmux-style pane. Its lines type in one after another; changing `run` replays them.
 */
function Pane({
  index,
  title,
  badge,
  tone,
  command,
  lines,
  run,
  active,
  onFocus,
}: {
  index: number;
  title: string;
  badge?: string;
  tone: "pro" | "dev";
  command: string;
  lines: ReactNode[];
  run: number;
  active: boolean;
  onFocus: () => void;
}) {
  return (
    <section className={`pane pane-${tone}`} data-active={active} aria-label={title} onClick={onFocus}>
      <header className="pane-head">
        <span className="pane-index">{index}</span>
        <span>{title}</span>
        {badge && <span className="pane-badge">{badge}</span>}
      </header>
      <div className="pane-body" key={run}>
        <div className="shell-line type-in" style={{ animationDelay: "0ms" }}>
          {PROMPT}
          <span className="v">{command}</span>
        </div>
        {lines.map((node, i) => (
          <div key={i} className="shell-line type-in" style={{ animationDelay: `${160 + i * 140}ms` }}>
            {node}
          </div>
        ))}
        <div className="shell-line type-in" style={{ animationDelay: `${200 + lines.length * 140}ms` }}>
          {PROMPT}
          <span className="pane-caret" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

export function Terminal({ hasResume }: { hasResume: boolean }) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const history = useRef<string[]>([]);
  const cursor = useRef(-1);
  const nextId = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  // Replay counters for panes ① and ②, the focused pane, and the phone tab.
  const [runs, setRuns] = useState({ pro: 0, dev: 0 });
  const [focus, setFocus] = useState<"pro" | "dev" | "shell">("shell");
  const [tab, setTab] = useState<"pro" | "dev">("pro");
  // The panes type themselves in the first time the terminal scrolls into view.
  const root = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setSeen(true);
        io.disconnect();
      }
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const replay = (pane: "pro" | "dev") => {
    setRuns((r) => ({ ...r, [pane]: r[pane] + 1 }));
    setTab(pane);
    setFocus(pane);
  };

  const print = (...nodes: ReactNode[]) =>
    setLines((ls) => [...ls, ...nodes.map((node) => ({ id: nextId.current++, node }))]);

  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    print(
      <span className="k">Type <b className="v">help</b> to look around. Try <b className="v">island notify hello</b>.</span>,
    );
  }, []);
  useEffect(() => () => clearActivity(OWNER), []);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const island = (args: string[]) => {
    const [sub, ...rest] = args;
    if (sub === "notify") {
      const body = rest.join(" ").trim() || "Hello from the terminal";
      showActivity({ kind: "notify", title: "Terminal", body: body.slice(0, 60) }, OWNER, 4500);
      return print(<span className="g">notification sent to the island ↑</span>);
    }
    if (sub === "reset") {
      clearActivity(OWNER);
      return print(<span className="k">island back to normal</span>);
    }
    const preset = sub && ISLAND[sub];
    if (preset) {
      showActivity(preset.activity, OWNER, preset.ms);
      return print(<span className="g">{preset.say} ↑</span>);
    }
    print(
      <span className="k">usage: island &lt;notify &quot;text&quot; | play | orb | harika | book | pie | reset&gt;</span>,
    );
  };

  const run = (raw: string) => {
    const cmd = raw.trim();
    print(<>{PROMPT}<span className="v">{cmd}</span></>);
    if (!cmd) return;
    history.current.push(cmd);
    cursor.current = -1;
    const [name, ...args] = cmd.split(/\s+/);
    const lower = name.toLowerCase();

    switch (lower) {
      case "help":
        return print(
          ...[
            ["whoami", "who is this"],
            ["about", "the short version"],
            ["projects", "what I've built"],
            ["open <project>", "read a case study"],
            ["stack", "languages and tools"],
            ["contact", "where to reach me"],
            ["resume", "my resume"],
            ["git log", "this site's real commit history"],
            ["island …", "control the Dynamic Island ↑"],
            ["portrait", "jump to the code portrait"],
            ["view plain|live", "switch the site's view"],
            ["theme light|dark", "light or dark mode"],
            ["sound on|off", "the sound of sahaj.os"],
            ["haptics on|off", "feel it, on phones"],
            ["startx", "boot the desktop: windows, dock, the lot"],
            ["clear", "clear the screen"],
          ].map(([c, d]) => (
            <><span className="v">{c.padEnd(16)}</span> <span className="k">{d}</span></>
          )),
          <span className="k">…and a few things that aren&rsquo;t listed.</span>,
        );
      case "whoami":
        return print(<span className="v">{site.name} — software engineer</span>);
      case "about":
        return print(
          <span className="v">
            I build across the stack: desktop apps in Rust and Tauri, mobile apps in React Native and C++, AI systems in
            Python, and the web. I care about software that feels fast, native and effortless to use.
          </span>,
        );
      case "projects":
      case "ls":
        return print(
          ...projects.map((p) => (
            <><span className="g">{p.slug.padEnd(20)}</span> <span className="k">{p.tagline}</span></>
          )),
          <span className="k">open &lt;name&gt; to read one, e.g. <b className="v">open float</b></span>,
        );
      case "open":
      case "cd": {
        const q = (args[0] ?? "").toLowerCase();
        const p = projects.find((x) => x.slug === q || x.slug.startsWith(q) || x.name.toLowerCase() === q);
        if (!q || !p) return print(<span className="r">open: no such project. Try <b>projects</b>.</span>);
        print(<span className="g">opening {p.name}…</span>);
        return router.push(`/work/${p.slug}`);
      }
      case "stack":
      case "skills":
        return print(<span className="v">{site.stack.join(" · ")}</span>);
      case "contact":
      case "socials":
        return print(
          <>GitHub   {a(site.links.github, "github.com/Sahaj1207")}</>,
          <>LinkedIn {a(site.links.linkedin, "linkedin.com/in/sahaj-alatage")}</>,
          <>X        {a(site.links.x, "x.com/sahaj0712")}</>,
          ...(site.links.email ? [<>Email    {a(`mailto:${site.links.email}`, site.links.email)}</>] : []),
        );
      case "resume":
      case "cv":
        if (hasResume) {
          window.open("/resume.pdf", "_blank", "noopener");
          return print(<span className="g">opening resume.pdf…</span>);
        }
        return print(<span className="k">The resume is on its way. Meanwhile: {a(site.links.linkedin, "LinkedIn")}</span>);
      case "git":
        if (args[0] !== "log") return print(<span className="r">git: only &lsquo;git log&rsquo; is allowed here. (and never push -f on main)</span>);
        return print(
          ...gitlog.slice(0, 8).map((c) => (
            <><span className="y">{c.hash}</span> <span className="k">{c.date}</span> <span className="v">{c.subject}</span></>
          )),
        );
      case "island":
        return island(args);
      case "portrait":
        document.querySelector("[data-island-slot=portrait]")?.scrollIntoView({ behavior: "smooth" });
        return print(<span className="g">scrolling to the portrait…</span>);
      case "view":
        if (args[0] === "plain" || args[0] === "live") {
          setViewMode(args[0]);
          return print(<span className="g">switched to {args[0]} view</span>);
        }
        return print(<span className="k">usage: view plain | live</span>);
      case "sound":
        if (args[0] === "on" || args[0] === "off") {
          setSoundOn(args[0] === "on");
          return print(<span className="g">sound {args[0]}{args[0] === "on" ? " — welcome to sahaj.os" : ""}</span>);
        }
        return print(<span className="k">usage: sound on | off</span>);
      case "haptics":
        if (args[0] === "on" || args[0] === "off") {
          setHapticsOn(args[0] === "on");
          return print(<span className="g">haptics {args[0]}</span>);
        }
        return print(<span className="k">usage: haptics on | off (phones)</span>);
      case "neofetch":
        return print(
          <span className="p">   ▄▄▄▄▄▄▄     </span>,
          <><span className="p"> ▄█████████▄   </span> <span className="v">sahaj@github</span></>,
          <><span className="p"> ███ ▀▀▀ ███   </span> <span className="k">OS      </span> <span className="v">Windows, Android, iOS, web</span></>,
          <><span className="p"> ▀█████████▀   </span> <span className="k">Shell   </span> <span className="v">this one, in your browser</span></>,
          <><span className="p">   ▀▀▀▀▀▀▀     </span> <span className="k">Uptime  </span> <span className="v">11 projects and counting</span></>,
          <><span className="p">               </span> <span className="k">GPU     </span> <span className="v">yours — the island runs on it</span></>,
        );
      case "sudo":
        if (args.join(" ") === "hire-me") {
          showActivity({ kind: "notify", title: "Permission granted", body: "Let's talk — LinkedIn is open" }, OWNER, 4500);
          window.open(site.links.linkedin, "_blank", "noopener");
          return print(<span className="g">[sudo] permission granted. Opening LinkedIn…</span>);
        }
        if (args.join(" ") === "mode --developer") {
          replay("dev");
          return print(<span className="g">→ refreshed pane ② developer mode</span>);
        }
        return print(<span className="r">sahaj is not in the sudoers file. This incident will be reported.</span>);
      case "cat":
        if (!args[0] || args[0] === "profile.txt") {
          replay("pro");
          return print(<span className="g">→ refreshed pane ① profile.txt</span>);
        }
        return print(<span className="r">cat: {args[0]}: no such file. Try <b>cat profile.txt</b>.</span>);
      case "echo":
        return print(<span className="v">{args.join(" ")}</span>);
      case "date":
        return print(<span className="v">{new Date().toString()}</span>);
      case "history":
        return print(...history.current.map((h, i) => <span className="k">{String(i + 1).padStart(3)}  {h}</span>));
      case "clear":
        return setLines([]);
      case "theme": {
        const t = args[0]?.toLowerCase();
        if (t !== "light" && t !== "dark" && t !== "auto") return print(<span className="k">usage: theme &lt;light | dark | auto&gt;</span>);
        setThemePref(t);
        return print(<span className="g">{t === "auto" ? "following your device" : `${t} mode on`}</span>);
      }
      case "startx":
        if (isDesktopOn()) return print(<span className="k">already on the desktop. <b className="v">logout</b> to go back to the page.</span>);
        enterDesktop("finder");
        return print(<span className="g">starting sahaj.os desktop…</span>);
      case "logout":
        if (!isDesktopOn()) return print(<span className="k">not on the desktop. Try <b className="v">startx</b>.</span>);
        exitDesktop();
        return print(<span className="k">logged out. Back to the page.</span>);
      case "exit":
        return print(<span className="k">There is no exit. Only more projects.</span>);
      case "rm":
        return print(<span className="r">Nice try.</span>);
      default:
        return print(<span className="r">command not found: {name}. Type <b>help</b>.</span>);
    }
  };

  const complete = () => {
    const parts = input.split(" ");
    if (parts.length === 1) {
      const hit = COMMANDS.filter((c) => c.startsWith(parts[0].toLowerCase()));
      if (hit.length === 1) setInput(hit[0] + " ");
      else if (hit.length > 1) print(<span className="k">{hit.join("   ")}</span>);
      return;
    }
    if (parts[0] === "open") {
      const hit = projects.map((p) => p.slug).filter((s) => s.startsWith(parts[1] ?? ""));
      if (hit.length === 1) setInput(`open ${hit[0]}`);
      else if (hit.length > 1) print(<span className="k">{hit.join("   ")}</span>);
      return;
    }
    if (parts[0] === "island") {
      const subs = ["notify ", ...Object.keys(ISLAND), "reset"];
      const hit = subs.filter((s) => s.startsWith(parts[1] ?? ""));
      if (hit.length === 1) setInput(`island ${hit[0]}`);
      else if (hit.length > 1) print(<span className="k">{hit.join("   ")}</span>);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      haptic("light");
      run(input);
      setInput("");
    } else if (e.key === "Tab") {
      e.preventDefault();
      complete();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const h = history.current;
      if (!h.length) return;
      e.preventDefault();
      const c = cursor.current;
      const next = e.key === "ArrowUp" ? (c === -1 ? h.length - 1 : Math.max(0, c - 1)) : c === -1 ? -1 : c + 1;
      cursor.current = next >= h.length ? -1 : next;
      setInput(cursor.current === -1 ? "" : h[cursor.current]);
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div ref={root} className="terminal shell tmux" data-tab={tab} data-seen={seen || undefined}>
      <div className="terminal-bar">
        <span className="terminal-lights" aria-hidden="true"><i /><i /><i /></span>
        <span aria-hidden="true">~/sahaj — tmux</span>
        <span className="pane-tabs" role="tablist" aria-label="Panes">
          <button type="button" role="tab" aria-selected={tab === "pro"} onClick={() => { setTab("pro"); setFocus("pro"); }}>profile</button>
          <button type="button" role="tab" aria-selected={tab === "dev"} onClick={() => { setTab("dev"); setFocus("dev"); }}>developer</button>
        </span>
      </div>
      <div className="panes">
        <Pane index={1} title="profile.txt" tone="pro" command="cat profile.txt" lines={profileLines()} run={runs.pro} active={focus === "pro"} onFocus={() => setFocus("pro")} />
        <Pane index={2} title="developer mode" badge="DEV" tone="dev" command="sudo mode --developer" lines={developerMode()} run={runs.dev} active={focus === "dev"} onFocus={() => setFocus("dev")} />
      </div>
      <section
        className="pane pane-shell"
        data-active={focus === "shell"}
        aria-label="Shell"
        onClick={() => field.current?.focus({ preventScroll: true })}
      >
        <header className="pane-head">
          <span className="pane-index">3</span>
          <span>shell</span>
          <span className="pane-hint">type here</span>
        </header>
        <div className="shell-body" ref={scroller} role="log" aria-live="polite" aria-label="Terminal output">
          {lines.map((l) => (
            <div key={l.id} className="shell-line">{l.node}</div>
          ))}
          <label className="shell-input">
            <span className="shell-prompt">{PROMPT}</span>
            <input
              ref={field}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              onFocus={() => setFocus("shell")}
              aria-label="Terminal command"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
            />
          </label>
        </div>
      </section>
    </div>
  );
}
