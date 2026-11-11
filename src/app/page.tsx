import Link from "next/link";
import { ContactLinks, hasResume } from "@/components/ContactLinks";
import { PortraitParticles } from "@/components/PortraitParticles";
import { Activity } from "@/components/Activity";
import { ProjectCard } from "@/components/ProjectCard";
import { SkillIsland } from "@/components/SkillIsland";
import { TryDemo } from "@/components/TryDemo";
import { FloatDemo } from "@/components/demos/FloatDemo";
import { Terminal } from "@/components/Terminal";
import { education, experience, recognition } from "@/content/journey";
import { type Project, alsoBuilt, hackathonBuilds, internshipWork, mainWork, projects, timeline } from "@/content/projects";
import { site } from "@/content/site";

const flagships = ["float", "harika", "vayucast"].map((s) => projects.find((p) => p.slug === s)!);

/**
 * FLOAT and the Meta hackathon span the row; other cards are halves. A hackathon card with
 * an `event` leads with the event, with the project underneath.
 */
function WorkCard({ p }: { p: Project }) {
  const wide = p.slug === "float" || !!p.event;
  return (
    <ProjectCard slug={p.slug} name={p.name} className={`work-card${wide ? " wide" : ""}${p.event ? " event" : ""}`}>
      {p.event ? (
        <div className="card-event">
          <p className="card-meta">{p.event.detail}</p>
          <p className="event-name">{p.event.name}</p>
        </div>
      ) : (
        <p className="card-meta">
          {p.status === "building" && <span className="live-dot" aria-hidden="true" />}
          {p.context ?? p.stack.slice(0, 3).join(" · ")}
        </p>
      )}
      <div className="card-head">
        <h3>{p.name}</h3>
        {p.fullName && <p className="full-name">{p.fullName}</p>}
        <p className="tagline">{p.tagline}</p>
      </div>
      <div className="stat-row">
        {p.highlights.slice(0, wide ? 3 : 2).map((h) => (
          <div className="stat" key={h.label}>
            <strong>{h.value}</strong>
            <span>{h.label}</span>
          </div>
        ))}
      </div>
      <div className="card-actions">
        <span className="more">Read the case study <i aria-hidden="true">→</i></span>
        <TryDemo slug={p.slug} small />
      </div>
    </ProjectCard>
  );
}

function JourneyEntry({ e }: { e: (typeof recognition)[number] }) {
  const body = (
    <>
      <p className="entry-kicker">{e.kicker}</p>
      <p className="entry-title">{e.title}</p>
      <p className="entry-place">{e.place}</p>
      {e.detail && <p className="entry-detail">{e.detail}</p>}
    </>
  );
  return <li className="entry">{e.href ? <a href={e.href}>{body}</a> : body}</li>;
}

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
            <p className="eyebrow">a software engineer</p>
            <h1 id="hero-title" className="display" data-island-hero>
              Sahaj <em>Alatage</em>
            </h1>
            <p className="lede">{site.positioning}</p>
            <ContactLinks />
            <Activity />
          </div>
          <div className="hero-side">
            <p className="eyebrow">the ones I&rsquo;m proudest of</p>
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
            <p className="eyebrow">the work</p>
            <h2 id="work-title" className="headline">
              Things I&rsquo;ve <em>made</em>.
            </h2>
          </div>
          <div className="work-grid">
            {mainWork.map((p) => <WorkCard key={p.slug} p={p} />)}
          </div>
          <div className="chapter-head group-head">
            <p className="eyebrow">internship</p>
            <h3 className="headline group-title">
              Intern at <em>Antmark</em>.
            </h3>
          </div>
          <div className="work-grid">
            {internshipWork.map((p) => <WorkCard key={p.slug} p={p} />)}
          </div>
          <div className="chapter-head group-head">
            <p className="eyebrow">made against the clock</p>
            <h3 className="headline group-title">
              Hackathon <em>builds</em>.
            </h3>
          </div>
          <div className="work-grid">
            {hackathonBuilds.map((p) => <WorkCard key={p.slug} p={p} />)}
          </div>
        </div>
      </section>

      {/* 3 · FLOAT — the island's own origin story */}
      <section id="float" className="chapter" data-island-slot="float" aria-labelledby="float-title">
        <div className="wrap">
          <div className="chapter-head">
            <p className="eyebrow">where the island began</p>
            <h2 id="float-title" className="headline">
              The island at the top of this page <em>started on Windows</em>.
            </h2>
            <p className="lede">
              FLOAT is a Dynamic Island for Windows. This is its state machine, running here: play music, send a
              notification, or leave it alone.
            </p>
          </div>
          <div className="inline-demo">
            <FloatDemo />
          </div>
          <p className="chapter-more">
            <Link className="more" href="/work/float">How FLOAT works →</Link>
          </p>
        </div>
      </section>

      {/* 4 · Portrait — in live view the island dissolves into this site's own code and becomes the portrait */}
      <section id="portrait" className="chapter portrait-scroll" data-island-slot="portrait" aria-labelledby="portrait-title">
        <div className="portrait-sticky">
          <div className="wrap portrait-grid">
            <div className="portrait-frame" data-portrait-target>
              <img src="/portrait.webp" alt="Sahaj Alatage in a dark suit, hand on chin" width={800} height={1000} loading="lazy" decoding="async" />
            </div>
            <div className="chapter-head" style={{ marginBottom: 0 }}>
              <p className="eyebrow">who made all this</p>
              <h2 id="portrait-title" className="headline">
                One person. <em>Every layer.</em>
              </h2>
              <p className="lede">
                Rust and Tauri on the desktop, C++ under React Native on mobile, multi-agent pipelines in Python, and
                the web on top — designed, engineered and shipped myself.
              </p>
              <p className="portrait-note">
                This portrait is drawn from tens of thousands of tokens of the code that renders this page — keep scrolling and the code turns into the photo.{" "}
                <a href="#timeline">Skip animation</a>
              </p>
            </div>
          </div>
        </div>
        <PortraitParticles />
      </section>

      {/* 5 · Where I've been: experience, education, recognition */}
      <section id="timeline" className="chapter" data-island-slot="timeline" aria-labelledby="journey-title">
        <div className="wrap">
          <div className="chapter-head">
            <p className="eyebrow">the story so far</p>
            <h2 id="journey-title" className="headline">Where I&rsquo;ve <em>been</em>.</h2>
          </div>
          <div className="journey">
            <div className="journey-col">
              <h3 className="journey-label">Experience</h3>
              <ul className="entries">
                {experience.map((e) => <JourneyEntry key={e.title + e.place} e={e} />)}
              </ul>
              <h3 className="journey-label">Education</h3>
              <ul className="entries">
                {education.map((e) => <JourneyEntry key={e.title} e={e} />)}
              </ul>
            </div>
            <div className="journey-col">
              <h3 className="journey-label">Recognition &amp; hackathons</h3>
              <ul className="entries">
                {recognition.map((e) => <JourneyEntry key={e.title} e={e} />)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5b · The year, in order */}
      <section className="chapter year" aria-labelledby="year-title">
        <div className="wrap">
          <div className="chapter-head">
            <p className="eyebrow">the year, in order</p>
            <h2 id="year-title" className="headline group-title">A <em>busy</em> year.</h2>
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
            <p className="eyebrow">a little about me</p>
            <h2 id="about-title" className="headline" style={{ color: "var(--ink)" }}>
              Professional by default. <em>Developer at heart.</em>
            </h2>
            <p>
              I&rsquo;m a software engineer who builds across the stack: desktop apps in Rust and Tauri, mobile apps in
              React Native and C++, AI systems in Python, and the web. I care about software that feels fast, native and
              effortless to use.
            </p>
          </div>
          <SkillIsland />
          <Terminal hasResume={hasResume} />
        </div>
      </section>

      {/* Also built */}
      <section className="chapter" aria-labelledby="also-title">
        <div className="wrap">
          <div className="chapter-head">
            <p className="eyebrow">and a few more</p>
            <h2 id="also-title" className="headline group-title">Smaller builds.</h2>
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
          <p className="eyebrow">say hello</p>
          <h2 id="contact-title" className="headline">
            Let&rsquo;s build something <em>that feels effortless</em>.
          </h2>
          <ContactLinks />
        </div>
      </section>
    </>
  );
}
