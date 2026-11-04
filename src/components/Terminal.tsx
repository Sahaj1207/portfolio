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
];

const a = (href: string, label: string) => (
  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
    {label}
  </a>
);

export function Terminal({ hasResume }: { hasResume: boolean }) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const history = useRef<string[]>([]);
  const cursor = useRef(-1);
  const nextId = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  const print = (...nodes: ReactNode[]) =>
    setLines((ls) => [...ls, ...nodes.map((node) => ({ id: nextId.current++, node }))]);

  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    print(
      <>{PROMPT}<span className="v">cat profile.txt</span></>,
      <><span className="k">name     </span> <span className="v">{site.name}</span></>,
      <><span className="k">role     </span> <span className="v">Full-stack &amp; AI engineer</span></>,
      <><span className="k">ships    </span> <span className="v">desktop · mobile · web · AI</span></>,
      <><span className="k">status   </span> <span className="g">● open to work</span></>,
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
            ["sound on|off", "the sound of sahaj.os"],
            ["haptics on|off", "feel it, on phones"],
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
          return print(
            <><span className="k">sleep          </span> <span className="r">command not found</span></>,
            <><span className="k">side_projects  </span> <span className="v">11 and counting</span></>,
            <><span className="k">built_for_fun  </span> <span className="v">a Dynamic Island for Windows</span></>,
            <><span className="k">git push -f    </span> <span className="v">never on main</span></>,
          );
        }
        return print(<span className="r">sahaj is not in the sudoers file. This incident will be reported.</span>);
      case "echo":
        return print(<span className="v">{args.join(" ")}</span>);
      case "date":
        return print(<span className="v">{new Date().toString()}</span>);
      case "history":
        return print(...history.current.map((h, i) => <span className="k">{String(i + 1).padStart(3)}  {h}</span>));
      case "clear":
        return setLines([]);
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
    <div className="terminal shell" onClick={() => field.current?.focus({ preventScroll: true })}>
      <div className="terminal-bar" aria-hidden="true"><i /><i /><i /><span>~/sahaj — zsh</span></div>
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
            aria-label="Terminal command"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
          />
        </label>
      </div>
    </div>
  );
}
