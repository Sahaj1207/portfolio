// Snapshots recent GitHub activity for the hero's "currently building" line: the most
// recently pushed projects and the public repository count. Runs before every build; if
// GitHub can't be reached (or rate-limits), the committed file is kept as is.
import { writeFileSync } from "node:fs";

const USER = "Sahaj1207";
const out = new URL("../src/content/github.json", import.meta.url);
/** Repos that aren't projects. */
const SKIP = new Set([USER, "app-releases"]);

try {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "sahaj-portfolio-build" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const [userRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${USER}`, { headers, signal: AbortSignal.timeout(10_000) }),
    fetch(`https://api.github.com/users/${USER}/repos?sort=pushed&per_page=12`, { headers, signal: AbortSignal.timeout(10_000) }),
  ]);
  if (!userRes.ok || !reposRes.ok) throw new Error(`GitHub ${userRes.status}/${reposRes.status}`);
  const user = await userRes.json();
  const repos = (await reposRes.json()).filter((r) => !r.fork && !SKIP.has(r.name));
  const snapshot = {
    fetchedAt: new Date().toISOString(),
    publicRepos: user.public_repos,
    recent: repos.slice(0, 3).map((r) => ({ repo: r.name, pushedAt: r.pushed_at, url: r.html_url })),
  };
  writeFileSync(out, JSON.stringify(snapshot, null, 2) + "\n");
  console.log(`github: ${snapshot.publicRepos} repos, latest ${snapshot.recent[0]?.repo}`);
} catch (e) {
  console.log(`github: couldn't refresh (${e.message}), keeping the committed file`);
}
