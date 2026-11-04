import Link from "next/link";

export default function NotFound() {
  return (
    <section className="hero" data-island-slot="hero" aria-labelledby="nf-title">
      <div className="wrap hero-copy">
        <p className="eyebrow">404</p>
        <h1 id="nf-title" className="display">
          Nothing <em>here</em>.
        </h1>
        <p className="lede">This page drifted off the island. The work is still where you left it.</p>
        <ul className="hero-links">
          <li><Link className="pill-link primary" href="/">Back home</Link></li>
          <li><Link className="pill-link" href="/#work">See the work</Link></li>
        </ul>
      </div>
    </section>
  );
}
