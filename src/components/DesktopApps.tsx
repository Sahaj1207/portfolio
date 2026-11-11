"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import gitlog from "@/content/gitlog.json";
import { alsoBuilt, projects, timeline } from "@/content/projects";
import { site } from "@/content/site";
import { haptic, setHapticsOn, useHapticsOn, useHapticsSupported } from "@/lib/haptics";
import { setMotionPaused, useMotionPaused } from "@/lib/motion";
import { setViewMode, useViewMode } from "@/lib/viewMode";
import { WALLPAPERS, setWallpaper, useWallpaper } from "@/lib/wallpaper";
import { type ThemePref, setThemePref, useThemePref } from "@/lib/theme";
import { DEMOS, openApp } from "@/lib/desktop";

/** The apps on the sahaj.os desktop. Everything they show comes from the same content as the page. */

export function Finder() {
  const router = useRouter();
  const [place, setPlace] = useState<"work" | "web">("work");
  const [picked, setPicked] = useState(projects[0].slug);
  const project = projects.find((p) => p.slug === picked) ?? projects[0];
  const open = (slug: string) => router.push(`/work/${slug}`);

  return (
    <div className="finder">
      <nav className="finder-side" aria-label="Places">
        <p>Favourites</p>
        <button type="button" aria-pressed={place === "work"} onClick={() => setPlace("work")}>
          <i className="fi fi-folder" aria-hidden="true" /> work
        </button>
        <button type="button" aria-pressed={place === "web"} onClick={() => setPlace("web")}>
          <i className="fi fi-folder" aria-hidden="true" /> on the web
        </button>
        <p>Locations</p>
        <a href={site.links.github} target="_blank" rel="noreferrer">
          <i className="fi fi-disk" aria-hidden="true" /> github.com/Sahaj1207
        </a>
      </nav>

      {place === "work" ? (
        <>
          <ul className="finder-grid" aria-label="Projects">
            {projects.map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  aria-pressed={p.slug === picked}
                  onClick={() => {
                    setPicked(p.slug);
                    haptic("tick");
                  }}
                  onDoubleClick={() => open(p.slug)}
                >
                  <i className="fi fi-project" aria-hidden="true">{p.name.slice(0, 1)}</i>
                  <span>{p.name}</span>
                </button>
              </li>
            ))}
          </ul>
          <aside className="finder-preview" aria-live="polite">
            <i className="fi fi-project big" aria-hidden="true">{project.name.slice(0, 1)}</i>
            <h3>{project.name}</h3>
            {project.fullName && <p className="full-name">{project.fullName}</p>}
            <p className="tagline">{project.tagline}</p>
            <dl>
              {project.highlights.slice(0, 2).map((h) => (
                <div key={h.label}>
                  <dt>{h.value}</dt>
                  <dd>{h.label}</dd>
                </div>
              ))}
            </dl>
            <ul className="chips" aria-label="Stack">
              {project.stack.slice(0, 5).map((s) => <li key={s}>{s}</li>)}
            </ul>
            <div className="finder-actions">
              {DEMOS[project.slug] && (
                <button type="button" className="pill-link primary" onClick={() => openApp(DEMOS[project.slug]!)}>
                  Try it
                </button>
              )}
              <button type="button" className={`pill-link${DEMOS[project.slug] ? "" : " primary"}`} onClick={() => open(project.slug)}>
                Case study
              </button>
            </div>
          </aside>
        </>
      ) : (
        <ul className="finder-list" aria-label="On the web">
          {alsoBuilt.map((a) => (
            <li key={a.name}>
              <strong>{a.name}</strong>
              <span>{a.what}</span>
              <span className="row">
                {a.live && <a href={a.live} target="_blank" rel="noreferrer">Live</a>}
                <a href={a.href} target="_blank" rel="noreferrer">Code</a>
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="finder-path" aria-hidden="true">
        sahaj HD › Users › sahaj › {place === "work" ? `work › ${project.slug}` : "web"}
      </p>
    </div>
  );
}

export function Photos() {
  return (
    <figure className="photos">
      <img src="/portrait.webp" alt="Sahaj Alatage in a dark suit, hand on chin" width={800} height={1000} />
      <figcaption>
        <strong>portrait.webp</strong>
        <span>800 × 1000 · on the page, drawn from tens of thousands of tokens of this site&rsquo;s own code</span>
      </figcaption>
    </figure>
  );
}

export function Notes() {
  return (
    <article className="notes">
      <p className="notes-date">Last edited {gitlog[0]?.date ? new Date(gitlog[0].date).toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" }) : "recently"}</p>
      <h2>Professional by default. <em>Developer at heart.</em></h2>
      <p>
        I&rsquo;m a software engineer who builds across the stack: desktop apps in Rust and Tauri, mobile apps in React
        Native and C++, AI systems in Python, and the web. I care about software that feels fast, native and effortless to
        use.
      </p>
      <ul className="chips" aria-label="Stack">
        {site.stack.map((s) => <li key={s}>{s}</li>)}
      </ul>
      <h3>The story so far</h3>
      <ol>
        {timeline.map((t) => (
          <li key={t.title}>
            <time>{t.date}</time> <strong>{t.title}</strong> — {t.detail}
          </li>
        ))}
      </ol>
    </article>
  );
}

export function Contact({ hasResume }: { hasResume: boolean }) {
  const { github, linkedin, x, email } = site.links;
  const rows: [string, string, string][] = [
    ...(hasResume ? [["Resume", "PDF", "/resume.pdf"] as [string, string, string]] : []),
    ["GitHub", "Sahaj1207", github],
    ["LinkedIn", "Sahaj Alatage", linkedin],
    ["X", "@sahaj0712", x],
    ...(email ? [["Email", email, `mailto:${email}`] as [string, string, string]] : []),
  ];
  return (
    <div className="contact-app">
      <div className="contact-card">
        <img src="/portrait.webp" alt="" width={72} height={90} />
        <div>
          <h3>{site.name}</h3>
          <p>{site.role} · open to work</p>
        </div>
      </div>
      <ul>
        {rows.map(([label, value, href]) => (
          <li key={label}>
            <span>{label}</span>
            <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{value}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Toggle({ label, hint, on, set }: { label: string; hint: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <li>
      <span>
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      <button type="button" role="switch" aria-checked={on} aria-label={label} className="switch" onClick={() => set(!on)} />
    </li>
  );
}

export function Settings() {
  const view = useViewMode();
  const paused = useMotionPaused();
  const hapticsOn = useHapticsOn();
  const hapticsSupported = useHapticsSupported();
  const wallpaper = useWallpaper();
  const themePref = useThemePref();
  return (
    <div className="settings">
      <h3>Appearance</h3>
      <div className="segmented" role="radiogroup" aria-label="Appearance">
        {(["auto", "light", "dark"] as ThemePref[]).map((t) => (
          <button key={t} type="button" role="radio" aria-checked={themePref === t} onClick={() => setThemePref(t)}>
            {t === "auto" ? "Auto" : t === "light" ? "Light" : "Dark"}
          </button>
        ))}
      </div>
      <h3>Wallpaper</h3>
      <ul className="wallpapers">
        {WALLPAPERS.map((w) => (
          <li key={w.id}>
            <button type="button" aria-pressed={wallpaper === w.id} onClick={() => setWallpaper(w.id)} className={`wp wp-${w.id}`}>
              <span>{w.name}</span>
            </button>
          </li>
        ))}
      </ul>
      <h3>System</h3>
      <ul className="toggles">
        <Toggle label="Live view" hint="The WebGL island and the code portrait" on={view === "live"} set={(v) => setViewMode(v ? "live" : "plain")} />
        <Toggle label="Motion" hint="Animations across sahaj.os" on={!paused} set={(v) => setMotionPaused(!v)} />
        {hapticsSupported && <Toggle label="Haptics" hint="Taps you can feel" on={hapticsOn} set={setHapticsOn} />}
      </ul>
    </div>
  );
}

function useUptime() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const start = performance.timeOrigin;
    const tick = () => setT(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(t / 60);
  return m ? `${m} min ${t % 60} s` : `${t} s`;
}

export function About() {
  const uptime = useUptime();
  const build = gitlog[0]?.hash ?? "dev";
  return (
    <div className="about-os">
      <span className="about-logo" aria-hidden="true" />
      <h2>
        sahaj<em>.os</em>
      </h2>
      <p className="about-ver">Build {build} · {gitlog.length} commits</p>
      <dl>
        <div><dt>Made by</dt><dd>{site.name}</dd></div>
        <div><dt>Engine</dt><dd>Next.js · raw WebGL2 · Web Audio</dd></div>
        <div><dt>Processor</dt><dd>One human, coffee-cooled</dd></div>
        <div><dt>Memory</dt><dd>11 side projects and counting</dd></div>
        <div><dt>Uptime</dt><dd>{uptime}</dd></div>
      </dl>
      <a className="pill-link" href="https://github.com/Sahaj1207/portfolio" target="_blank" rel="noreferrer">
        View source
      </a>
    </div>
  );
}
