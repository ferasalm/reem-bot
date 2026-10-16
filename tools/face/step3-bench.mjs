// Needs PICTURE.CORE "legacy", removed in Step 3b (2026-10-16): rerun it from commit 7baf729.
// Rebuild Step 3 (2026-10-16): the old prompts (PICTURE.CORE "legacy") against the picture core (CORE "frames") through the bot's own /pic
// path (customPicture → drawPicture for legacy, specFromWords → drawPicture for frames), 13 cases x 2 seeds, then on the frames core:
// DPM++ 2M Karras against Default (owner: "compare default vs karras with more than one seed"), acceleration "high" (owner: "Yes, test
// it"), and the NSFW Unlocked weight sweep at the edges. Math.random is seeded per case and seed, so the variants of one case differ only
// by the change. The hour is fixed (14:00; the dark case 23:00). Stops at BUDGET_USD (default 0.43) by Runware's reported cost.
//   NODE_USE_ENV_PROXY=1 node tools/face/step3-bench.mjs <outdir> [phases]   phases: A (old vs new), K (Karras), X (acceleration), W (weights)
//   DRY=1: the plans only (prompts, references, LoRAs), nothing drawn.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadWorker } from "../test/load-worker.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: step3-bench.mjs <outdir> [A,K,X,W]");
const phases = (process.argv[3] || "A,K,X,W").split(",");
const BUDGET = Number(process.env.BUDGET_USD) || 0.43;
const DRY = !!process.env.DRY;
const SEEDS = [101, 202];
mkdirSync(out, { recursive: true });
const W = await loadWorker();
const P = W.CONFIG.PICTURE;
P.ANATOMY.ON = false;
P.WRITER.ON = false;
const F = P.FRAMES;
const BASE = { scheduler: F.SCHEDULER, acceleration: F.ACCELERATION, weights: { ...F.LORA_WEIGHTS } };

const CASES = [
  ["selfie", "selfie in a cream cable-knit sweater and dark jeans, in the kitchen", 14],
  ["mirror", "mirror selfie in a fitted black ribbed tank top and high-waisted jeans, in the bedroom", 14],
  ["pov-clothed", "sitting across from me on the couch in a gray hoodie and black leggings, laughing", 14],
  ["partial", "topless, jeans on, mirror selfie", 14],
  ["nude-front", "naked on the bed", 14],
  ["nude-back", "naked, standing at the bedroom window, from behind", 14],
  ["blowjob", "blowjob", 14],
  ["riding", "riding the man", 14],
  ["missionary", "missionary", 14],
  ["doggy", "doggy style", 14],
  ["reverse-cowgirl", "reverse cowgirl", 14],
  ["anal-doggy", "anal doggy style", 14],
  ["dark", "selfie lying in bed in the dark, in an oversized gray tee", 23],
];
const PHASES = {
  // old vs new, every case, both seeds
  A: CASES.flatMap(([c]) => SEEDS.flatMap((s) => [{ c, s, core: "legacy", v: "legacy" }, { c, s, core: "frames", v: "default" }])),
  // Karras on the frames core (Default is phase A's frames picture)
  K: ["selfie", "nude-front", "riding"].flatMap((c) => SEEDS.map((s) => ({ c, s, core: "frames", v: "karras", scheduler: "DPM++ 2M Karras" }))),
  // acceleration "high" on the frames core
  X: [["selfie", 101], ["nude-front", 101], ["nude-front", 202], ["riding", 101], ["riding", 202], ["dark", 101]].map(([c, s]) => ({ c, s, core: "frames", v: "accel", acceleration: "high" })),
  // the weight sweep's edges at seed 101 (the start values are phase A's)
  W: [["selfie", "clothed", 0.4], ["selfie", "clothed", 0.6], ["nude-front", "nude", 0.7], ["nude-front", "nude", 0.8], ["riding", "act", 0.7]].map(([c, k, w]) => ({ c, s: 101, core: "frames", v: `w${k}-${w}`, weight: [k, w] })),
};

const seeded = (s) => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const realFetch = globalThis.fetch;
let last = null;
globalThis.fetch = async (u, init) => {
  const t0 = Date.now();
  const res = await realFetch(u, init);
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}
  if (String(u).includes("runware")) {
    const task = JSON.parse(init.body)[0];
    last = { ms: Date.now() - t0, cost: (last ? last.cost : 0) + (Number(((data.data || [])[0] || {}).cost) || 0), loras: (task.lora || []).map((l) => `${l.model}@${l.weight}`), refs: ((task.inputs || {}).referenceImages || []).length, size: `${task.width}x${task.height}`, scheduler: task.scheduler || "Default", acceleration: task.acceleration || "", errors: data.errors || null };
  }
  return new Response(text, { status: res.status, headers: res.headers });
};
const env = { RUNWARE_API_KEY: process.env.RUNWARE_API_KEY || "proxy", REEM_KV: { get: async () => null, put: async () => {} } };
const words = Object.fromEntries(CASES.map(([c, w, h]) => [c, { w: W.picWords(w, "on", {}), h }])); // as /pic reads his words (me → the man)
const idx = Object.fromEntries(CASES.map(([c], i) => [c, i]));

let spent = 0;
const rows = [];
const prompts = {};
for (const ph of phases) {
  for (const job of PHASES[ph] || []) {
    if (!DRY && spent + 0.0085 > BUDGET) { console.log(`stop: $${spent.toFixed(4)} spent, the next picture could pass $${BUDGET}`); break; }
    const { w, h } = words[job.c];
    P.CORE = job.core;
    F.SCHEDULER = job.scheduler || BASE.scheduler;
    F.ACCELERATION = job.acceleration || BASE.acceleration;
    F.LORA_WEIGHTS = { ...BASE.weights, ...(job.weight ? { [job.weight[0]]: job.weight[1] } : {}) };
    Math.random = seeded(idx[job.c] * 1000 + job.s);
    const pic = W.customPicture(w, h, null, "on");
    const spec = job.core === "frames" ? W.specFromWords(w, { source: "pic", level: "on", hour: h }) : null;
    const opts = { location: pic.location, night: pic.night, custom: true, nsfw: "on", spec, seed: job.s };
    const key = `${job.c}-${job.s}-${job.v}`;
    if (DRY) {
      const plan = await W.drawPicture(env, pic.prompt, { ...opts, ledger: await W.loadLedger(env), planOnly: true });
      const t = (plan.plan || [])[0] || {};
      prompts[key] = { text: t.text || t.prompt, refs: (t.refs || []).map((r) => r.name || r), loras: (t.loras || []).map((l) => `${l.model || l.name}@${l.weight}`), size: `${t.width}x${t.height}`, lint: plan.lint };
      continue;
    }
    const ledger = await W.loadLedger(env);
    last = null;
    const row = { phase: ph, case: job.c, seed: job.s, core: job.core, variant: job.v };
    try {
      const drawn = await W.drawPicture(env, pic.prompt, { ...opts, ledger });
      writeFileSync(join(out, `${key}.jpg`), drawn.bytes);
      Object.assign(row, { file: `${key}.jpg`, ...last, errors: undefined });
    } catch (e) {
      Object.assign(row, { error: String(e.message || e).slice(0, 160), ...(last || {}) });
    }
    spent += (last && last.cost) || 0;
    rows.push(row);
    console.log(JSON.stringify(row));
    writeFileSync(join(out, "results.json"), JSON.stringify({ spent, rows }, null, 1));
  }
}
if (DRY) writeFileSync(join(out, "plans.json"), JSON.stringify(prompts, null, 1));
console.log(DRY ? `plans: ${Object.keys(prompts).length}` : `spent $${spent.toFixed(5)} (Runware's reported cost)`);
