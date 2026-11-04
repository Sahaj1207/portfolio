// Captures recent commits for the terminal's `git log` command.
// Runs before every build; if git history isn't available (e.g. a shallow CI checkout
// without .git), the committed file is kept as is.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const out = new URL("../src/content/gitlog.json", import.meta.url);

try {
  const raw = execFileSync("git", ["log", "-12", "--date=short", "--pretty=format:%h%x09%ad%x09%s"], { encoding: "utf8" });
  const commits = raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, date, subject] = line.split("\t");
      return { hash, date, subject };
    });
  if (commits.length) writeFileSync(out, JSON.stringify(commits, null, 2) + "\n");
  console.log(`gitlog: ${commits.length} commits`);
} catch {
  console.log("gitlog: no git history here, keeping the committed file");
}
