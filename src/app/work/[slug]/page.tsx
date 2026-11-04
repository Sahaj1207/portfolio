import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, projects } from "@/content/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProject((await params).slug);
  if (!p) return {};
  return {
    title: p.name,
    description: `${p.tagline} ${p.summary}`,
    alternates: { canonical: `/work/${p.slug}` },
  };
}

export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProject((await params).slug);
  if (!p) notFound();

  const i = projects.indexOf(p);
  const prev = projects[(i - 1 + projects.length) % projects.length];
  const next = projects[(i + 1) % projects.length];

  return (
    <article className="wrap" data-island-slot="case" data-island-title={p.name}>
      <header className="case-hero">
        <Link href="/#work" className="case-back">← All work</Link>
        <p className="eyebrow">{p.context ?? p.year}</p>
        <h1 className="display">{p.name}</h1>
        {p.fullName && <p className="full-name">{p.fullName}</p>}
        <p className="lede" style={{ maxWidth: "30ch" }}>{p.tagline}</p>
        <ul className="chips" aria-label="Stack">
          {p.stack.map((s) => <li key={s}>{s}</li>)}
        </ul>
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
        <Link href={`/work/${prev.slug}`}><span>← Previous</span><strong>{prev.name}</strong></Link>
        <Link href={`/work/${next.slug}`}><span>Next →</span><strong>{next.name}</strong></Link>
      </nav>
    </article>
  );
}
