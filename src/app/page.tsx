import Link from "next/link";
import { ContactLinks, hasResume } from "@/components/ContactLinks";
import { PortraitParticles } from "@/components/PortraitParticles";
import { ProjectCard } from "@/components/ProjectCard";
import { Terminal } from "@/components/Terminal";
import { alsoBuilt, projects, timeline } from "@/content/projects";
import { site } from "@/content/site";

const flagships = ["float", "pie", "verity"].map((s) => projects.find((p) => p.slug === s)!);
const cardSize: Record<string, string> = { float: "wide" };

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  jobTitle: site.role,
  url: site.url,
  sameAs: [site.links.github, site.links.linkedin, site.links.x],
  knowsAbout: site.stack,
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />

      {/* 1 · Hero — everything a reviewer needs, before any animation */}
      <section className="hero" data-island-slot="hero" aria-labelledby="hero-title">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{site.role}</p>
            <h1 id="hero-title" className="display">
              Sahaj <em>Alatage</em>
            </h1>
            <p className="lede">{site.positioning}</p>
            <ContactLinks />
          </div>
          <div>
            <p className="eyebrow" style={{ marginBottom: 14 }}>Selected work</p>
            <ul className="flagships">
              {flagships.map((p) => (
                <li key={p.slug}>
                  <Link href={`/work/${p.slug}`}>
                    <strong>{p.name}</strong>
                    <span>{p.tagline}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 2 · Work */}
      <section id="work" className="chapter" data-island-slot="work" aria-labelledby="work-title">
        <div className="wrap">
          <div className="chapter-head">
            <p className="eyebrow">Work</p>
            <h2 id="work-title" className="headline">
              Things I&rsquo;ve <em>built</em>.
            </h2>
          </div>
          <div className="work-grid">
            {projects.map((p) => (
              <ProjectCard key={p.slug} slug={p.slug} className={`work-card ${cardSize[p.slug] ?? ""}`}>
                <div>
                  <h3>{p.name}</h3>
                  <p className="tagline">{p.tagline}</p>
                  {p.context && <p className="context">{p.context}</p>}
                </div>
                <div className="stat-row">
                  {p.highlights.slice(0, cardSize[p.slug] ? 3 : 2).map((h) => (
                    <div className="stat" key={h.label}>
                      <strong>{h.value}</strong>
                      <span>{h.label}</span>
                    </div>
                  ))}
                </div>
                <span className="more">Read the case study →</span>
              </ProjectCard>
            ))}
          </div>
        </div>
      </section>

      {/* 3 · FLOAT — the island's own origin story */}
      <section className="chapter" data-island-slot="float" aria-labelledby="float-title">
        <div className="wrap">
          <div className="chapter-head">
            <p className="eyebrow">FLOAT</p>
            <h2 id="float-title" className="headline">
              The island at the top of this page <em>started on Windows</em>.
            </h2>
            <p className="lede">
              FLOAT is a Dynamic Island for Windows. It lives in four states and moves between them on its own.
            </p>
          </div>
          <div className="states">
            <article className="state">
              <div className="state-stage" aria-hidden="true">
                <div className="mini pill"><span className="dot" /> 9:41</div>
              </div>
              <h3>Compact pill</h3>
              <p>Hangs from the top of the screen, always within reach.</p>
            </article>
            <article className="state">
              <div className="state-stage" aria-hidden="true">
                <div className="mini orb" />
              </div>
              <h3>Ambient orb</h3>
              <p>After about three seconds untouched it shrinks to a 48×48 orb.</p>
            </article>
            <article className="state">
              <div className="state-stage" aria-hidden="true">
                <div className="mini banner">
                  <span className="dot" />
                  <span style={{ display: "grid", gap: 4, flex: 1 }}>
                    <span className="bar" style={{ width: "70%" }} />
                    <span className="bar" style={{ width: "45%" }} />
                  </span>
                </div>
              </div>
              <h3>Notification banner</h3>
              <p>A toast previews for about 3.5 s, then the exact previous state returns.</p>
            </article>
            <article className="state">
              <div className="state-stage" aria-hidden="true">
                <div className="mini expanded">
                  <span className="dot" />
                  <span className="bar" style={{ width: "80%" }} />
                  <span className="bar" style={{ width: "55%" }} />
                </div>
              </div>
              <h3>Expanded surface</h3>
              <p>Media, notifications and settings, one click away.</p>
            </article>
          </div>
          <p style={{ marginTop: 32 }}>
            <Link className="more" href="/work/float">How FLOAT works →</Link>
          </p>
        </div>
      </section>

      {/* 4 · Portrait — in live view the island dissolves into this site's own code and becomes the portrait */}
      <section className="chapter portrait-scroll" data-island-slot="portrait" aria-labelledby="portrait-title">
        <div className="portrait-sticky">
          <div className="wrap portrait-grid">
            <div className="portrait-frame" data-portrait-target>
              <img src="/portrait.webp" alt="Sahaj Alatage in a dark suit, hand on chin" width={800} height={1000} loading="lazy" decoding="async" />
            </div>
            <div className="chapter-head" style={{ marginBottom: 0 }}>
              <p className="eyebrow">Behind the island</p>
              <h2 id="portrait-title" className="headline">
                Built by one person, <em>end to end</em>.
              </h2>
              <p className="lede">
                Rust and Tauri on the desktop, C++ under React Native on mobile, multi-agent pipelines in Python, and
                the web on top — designed, engineered and shipped myself.
              </p>
              <p className="portrait-note">
                This portrait is drawn from tens of thousands of tokens of the code that renders this page.{" "}
                <a href="#timeline">Skip animation</a>
              </p>
            </div>
          </div>
        </div>
        <PortraitParticles />
      </section>

      {/* 5 · Timeline */}
      <section id="timeline" className="chapter" data-island-slot="timeline" aria-labelledby="timeline-title">
        <div className="wrap">
          <div className="chapter-head">
            <p className="eyebrow">Timeline</p>
            <h2 id="timeline-title" className="headline">A busy year.</h2>
          </div>
          <ol className="timeline">
            {timeline.map((t) => (
              <li key={t.title}>
                <time>{t.date}</time>
                <span className="node" aria-hidden="true" />
                <div>
                  <h3>{t.title}</h3>
                  <p>{t.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 6 · About — the terminal */}
      <section id="about" className="chapter" data-island-slot="terminal" aria-labelledby="about-title">
        <div className="wrap about-grid">
          <div className="about-copy">
            <p className="eyebrow">About</p>
            <h2 id="about-title" className="headline" style={{ color: "var(--ink)" }}>
              Professional by default. <em>Developer at heart.</em>
            </h2>
            <p>
              I&rsquo;m a software engineer who builds across the stack: desktop apps in Rust and Tauri, mobile apps in
              React Native and C++, AI systems in Python, and the web. I care about software that feels fast, native and
              effortless to use.
            </p>
            <ul className="chips" aria-label="Stack">
              {site.stack.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
          <Terminal hasResume={hasResume} />
        </div>
      </section>

      {/* Also built */}
      <section className="chapter" aria-labelledby="also-title">
        <div className="wrap">
          <div className="chapter-head">
            <p className="eyebrow">Also built</p>
            <h2 id="also-title" className="headline" style={{ fontSize: "clamp(28px, 3.6vw, 44px)" }}>On the web.</h2>
          </div>
          <ul className="also">
            {alsoBuilt.map((a) => (
              <li key={a.name}>
                <strong>{a.name}</strong>
                <p>{a.what}</p>
                <div className="row">
                  {a.live && <a href={a.live}>Live</a>}
                  <a href={a.href}>Code</a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 7 · Contact — the island closes back into a capsule */}
      <section id="contact" className="chapter" data-island-slot="contact" aria-labelledby="contact-title">
        <div className="wrap contact">
          <p className="eyebrow">Contact</p>
          <h2 id="contact-title" className="headline">
            Let&rsquo;s build something <em>that feels effortless</em>.
          </h2>
          <ContactLinks />
        </div>
      </section>
    </>
  );
}
