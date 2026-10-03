// Sync check: is this branch built on the latest shared work, and is work sitting anywhere else?
//   node tools/sync-check.mjs        at the start of every Claude session (.claude/settings.json hook)
//   node tools/sync-check.mjs --ci   in GitHub Actions (fails when this branch misses shared work)
//
// Why: on 2026-10-01 three sessions each built their own "v10" from different starting points
// (one on DeepSeek, two on Lunaris), none knowing about the others, and HANDOFF.md said different
// things on each branch. Every session now starts by seeing this report.
//
// The shared branch is INTEGRATION (dev); main is what's deployed. Until dev exists, main is used.
// Branches listed in tools/retired-branches.txt (squash-merged or superseded) are ignored.
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const CI = process.argv.includes("--ci");
const INTEGRATION = process.env.REEM_INTEGRATION_BRANCH || "dev";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const tryGit = (...args) => {
  try {
    return git(...args);
  } catch {
    return null;
  }
};
const ok = (...args) => tryGit(...args) !== null;

tryGit("fetch", "--quiet", "--prune", "origin");

const retiredFile = join(root, "tools", "retired-branches.txt");
const retired = new Set(
  existsSync(retiredFile)
    ? readFileSync(retiredFile, "utf8").split("\n").map((l) => l.replace(/#.*/, "").trim()).filter(Boolean)
    : [],
);
const remotes = (tryGit("for-each-ref", "--format=%(refname:short)", "refs/remotes/origin") || "")
  .split("\n")
  .filter((r) => r.startsWith("origin/") && r !== "origin/HEAD")
  .map((r) => r.slice("origin/".length));
const base = remotes.includes(INTEGRATION) ? INTEGRATION : "main";
const here = process.env.GITHUB_REF_NAME || tryGit("rev-parse", "--abbrev-ref", "HEAD") || "HEAD";

const problems = [];
const elsewhere = [];

// 1. This branch must contain everything on the shared branch (main itself is only ever behind dev)
if (here !== "main" && remotes.includes(base) && !ok("merge-base", "--is-ancestor", `origin/${base}`, "HEAD")) {
  const n = tryGit("rev-list", "--count", `HEAD..origin/${base}`);
  problems.push(`This branch is missing ${n} commit(s) from origin/${base}. Merge it first: git merge origin/${base}`);
}

// 2. Work on other branches that isn't here (by content, so cherry-picks and merges count as here)
const headTree = tryGit("rev-parse", "HEAD^{tree}");
for (const b of remotes) {
  if (b === here || retired.has(b)) continue;
  if (ok("merge-base", "--is-ancestor", `origin/${b}`, "HEAD")) continue;
  const merged = tryGit("merge-tree", "--write-tree", "HEAD", `origin/${b}`);
  if (merged && merged.split("\n")[0] === headTree) continue;
  const n = tryGit("rev-list", "--count", `HEAD..origin/${b}`);
  const tip = tryGit("log", "-1", "--format=%cs %ch: %s", `origin/${b}`);
  elsewhere.push(`  - ${b} (${n} commit(s) not here; last ${tip})`);
}

const lines = [`SYNC CHECK (reem-bot): on ${here}; shared branch is origin/${base}${base === INTEGRATION ? "" : ` (origin/${INTEGRATION} doesn't exist yet)`}`];
if (!problems.length) lines.push(`OK: this branch contains everything on origin/${base}.`);
for (const p of problems) lines.push(`PROBLEM: ${p}`);
if (elsewhere.length) {
  lines.push("WARNING: other branches have work that is NOT on this branch:", ...elsewhere);
  lines.push("Before changing anything: read what they did (git log / HANDOFF.md on each) and ask the owner which work is current.",
    "Never restate a decision from another branch's HANDOFF.md or docs/DECISIONS.md without checking its date. Retired branches go in tools/retired-branches.txt.");
} else {
  lines.push("No other branch has work missing here.");
}
console.log(lines.join("\n"));

if (CI) {
  for (const p of problems) console.log(`::error::${p}`);
  if (elsewhere.length) console.log(`::warning::${elsewhere.length} other branch(es) have work not on this branch (see the log)`);
  process.exit(problems.length ? 1 : 0);
}
