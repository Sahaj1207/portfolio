import { existsSync } from "node:fs";
import path from "node:path";
import { site } from "@/content/site";

/** Resume is linked only once public/resume.pdf exists, so the link never 404s. */
const hasResume = existsSync(path.join(process.cwd(), "public", "resume.pdf"));

export function ContactLinks() {
  const { github, linkedin, x, email } = site.links;
  return (
    <ul className="hero-links">
      {hasResume && (
        <li><a className="pill-link primary" href="/resume.pdf">Resume (PDF)</a></li>
      )}
      <li><a className={`pill-link${hasResume ? "" : " primary"}`} href={github}>GitHub</a></li>
      <li><a className="pill-link" href={linkedin}>LinkedIn</a></li>
      <li><a className="pill-link" href={x}>X</a></li>
      {email && (
        <li><a className="pill-link" href={`mailto:${email}`}>Email</a></li>
      )}
    </ul>
  );
}
