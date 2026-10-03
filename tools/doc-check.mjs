// Docs check: node tools/doc-check.mjs (exits 1 on any failure). Runs in CI with the mocked tests.
// Keeps the handbook from growing back into one long file (owner's decision 2026-10-03, docs/DECISIONS.md):
// sizes, dated decisions, an effort level on every next step, every source file named in docs/MAP.md.
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const read = (f) => (existsSync(f) ? readFileSync(f, "utf8") : null);
const lines = (s) => s.replace(/\n$/, "").split("\n");
let fails = 0, oks = 0;
const check = (ok, what) => { if (ok) oks++; else { console.log(`FAIL ${what}`); fails++; } };

const files = ["CLAUDE.md", "HANDOFF.md", "docs/DECISIONS.md", "docs/LESSONS.md", "docs/MAP.md", "docs/CHANGELOG.md",
  "docs/QUALITY.md", ".claude/skills/handoff/SKILL.md"];
for (const f of files) check(read(f) !== null, `${f} exists`);
if (fails) process.exit(1);

const claude = read("CLAUDE.md"), handoff = read("HANDOFF.md"), decisions = read("docs/DECISIONS.md");
const lessons = read("docs/LESSONS.md"), map = read("docs/MAP.md");

for (const f of ["HANDOFF.md", "docs/DECISIONS.md", "docs/LESSONS.md"])
  check(claude.includes(`@${f}`), `CLAUDE.md loads ${f} at session start (@${f})`);

check(lines(handoff).length <= 80, `HANDOFF.md at most 80 lines (has ${lines(handoff).length})`);
check(lines(lessons).length <= 150, `docs/LESSONS.md at most 150 lines (has ${lines(lessons).length})`);

// Next steps: every numbered item names an effort level.
const next = handoff.split(/^## Next steps.*$/m)[1]?.split(/^## /m)[0] ?? "";
const items = next.split(/^(?=\d+\. )/m).filter((s) => /^\d+\. /.test(s));
check(items.length > 0, "HANDOFF.md has numbered next steps");
for (const it of items)
  check(/Effort: (low|medium|high)/i.test(it), `next step ${it.match(/^\d+/)[0]} has "Effort: low|medium|high"`);

// Decisions: every entry is dated (or struck through and dated); struck entries say what superseded them.
const log = decisions.split(/^## Decision log.*$/m)[1] ?? "";
check(log.length > 0, "docs/DECISIONS.md has the decision log");
const entries = log.split(/^(?=- )/m).filter((s) => s.startsWith("- "));
for (const e of entries) {
  const first = e.split("\n")[0];
  const dated = /^- (~~)?\d{4}-\d{2}-\d{2}\b/.test(first) || /^- Standing rules/.test(first);
  check(dated, `decision dated: ${first.slice(0, 70)}`);
}
for (const l of lines(log).filter((l) => l.includes("~~")))
  check(/supersed|revert|replac/i.test(l), `struck-through decision says what superseded or reverted it: ${l.trim().slice(0, 70)}`);

// Map: every tracked source file is named in docs/MAP.md (by path or file name).
const tracked = execSync("git ls-files", { encoding: "utf8" }).split("\n").filter(Boolean)
  .filter((f) => !/^(docs\/|HANDOFF\.md|CLAUDE\.md|README\.md)/.test(f) && !/\.(jpg|png|json|txt|html)$/.test(f));
const missing = tracked.filter((f) => !map.includes(f.split("/").pop()));
check(missing.length === 0, `every source file is named in docs/MAP.md${missing.length ? ": missing " + missing.join(", ") : ""}`);

console.log(fails ? `${fails} docs checks FAILED (${oks} ok)` : `all ${oks} docs checks passed`);
process.exit(fails ? 1 : 0);
