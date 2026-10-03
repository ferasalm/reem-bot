// All local checks in one command: node tools/check.mjs (exits 1 on any failure).
// Same steps as the mocked CI job (.github/workflows/test.yml) except the wrangler dry run.
// Prints ok/FAIL per step; for a failing step, its last 40 lines. Read them: a FAIL is never a flake.
import { spawnSync } from "node:child_process";

const steps = [
  // Locally the panel is regenerated (commit it with the CONFIG change); CI fails if the committed one is stale.
  ["settings panel regenerated from CONFIG", "node tools/build-panel.mjs"],
  ["worker.js parses", "node --check worker.js"],
  ["unit", "node tools/test/unit.mjs"],
  ["scenarios", "node tools/test/scenarios.mjs"],
  ["e2e", "node tools/test/e2e.mjs"],
  ["docs", "node tools/doc-check.mjs"],
];
let fails = 0;
for (const [name, cmd] of steps) {
  const r = spawnSync("bash", ["-c", cmd], { encoding: "utf8", maxBuffer: 64 << 20 });
  const ok = r.status === 0;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}`);
  if (!ok) {
    fails++;
    console.log((r.stdout + r.stderr).trimEnd().split("\n").slice(-40).map((l) => "     " + l).join("\n"));
  }
}
console.log(fails ? `${fails} of ${steps.length} checks FAILED` : `all ${steps.length} checks passed`);
process.exit(fails ? 1 : 0);
