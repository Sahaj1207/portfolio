import Link from "next/link";
import { TryDemo } from "@/components/TryDemo";
import { type Project, hackathonBuilds, mainWork } from "@/content/projects";

/** Case studies page through main work, then hackathon builds. */
const order = [...mainWork, ...hackathonBuilds];

/**
 * A project's case study. Rendered as a full page at /work/[slug], and inside a window
 * over the home page when opened from there (`inWindow`), so both read identically.
 */
export function CaseStudy({ p, inWindow = false }: { p: Project; inWindow?: boolean }) {
  const i = order.indexOf(p);
  const prev = order[(i - 1 + order.length) % order.length];
  const next = order[(i + 1) % order.length];

  return (
    <article className={inWindow ? "case case-in-window" : "wrap case"} data-island-slot="case" data-island-title={p.name}>
      <header className="case-hero">
        {!inWindow && <Link href="/#work" className="case-back">← All work</Link>}
        <p className="eyebrow">
          {p.status === "building" && <span className="live-dot" aria-hidden="true" />}
          {p.context ?? p.year}
        </p>
        <h1 className="display">{p.name}</h1>
        {p.fullName && <p className="full-name">{p.fullName}</p>}
        <p className="lede" style={{ maxWidth: "30ch" }}>{p.tagline}</p>
        <ul className="chips" aria-label="Stack">
          {p.stack.map((s) => <li key={s}>{s}</li>)}
        </ul>
        <TryDemo slug={p.slug} />
        <div className="bento">
          {p.highlights.map((h) => (
            <div key={h.label}>
              <strong>{h.value}</strong>
              <span>{h.label}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="case-body">
        <section className="case-section">
          <h2>Problem</h2>
          <div className="body"><p>{p.problem}</p></div>
        </section>
        <section className="case-section">
          <h2>Approach</h2>
          <div className="body"><ul>{p.approach.map((a) => <li key={a}>{a}</li>)}</ul></div>
        </section>
        <section className="case-section">
          <h2>Architecture</h2>
          <div className="body"><ul>{p.architecture.map((a) => <li key={a}>{a}</li>)}</ul></div>
        </section>
        <section className="case-section">
          <h2>Decisions</h2>
          <div className="body">
            {p.decisions.map((d) => (
              <div className="decision" key={d.title}>
                <h3>{d.title}</h3>
                <p>{d.body}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="case-section">
          <h2>My role</h2>
          <div className="body"><p>{p.role}</p></div>
        </section>
        <section className="case-section">
          <h2>Links</h2>
          <div className="body">
            <ul className="hero-links">
              {p.links.map((l, k) => (
                <li key={l.href}>
                  <a className={`pill-link${k === 0 ? " primary" : ""}`} href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <nav className="case-nav" aria-label="More work">
        <Link href={`/work/${prev.slug}`} replace={inWindow}><span>← Previous</span><strong>{prev.name}</strong></Link>
        <Link href={`/work/${next.slug}`} replace={inWindow}><span>Next →</span><strong>{next.name}</strong></Link>
      </nav>
    </article>
  );
}
