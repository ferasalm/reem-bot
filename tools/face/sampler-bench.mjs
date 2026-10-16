// The sampler short list (Rebuild Step 2, 2026-10-16): the picture core's own prompts and references (ShotSpec → frames, NSFW Unlocked by
// content, steps 4, CFG 1, acceleration none) through the bot's drawPicture on Runware klein 9B, one seed, one variable: the scheduler.
// Each case's spec is built once (seeded) and reused, so the pictures differ only by the sampler. Stops at BUDGET_USD (default 0.04)
// by Runware's reported cost.
//   NODE_USE_ENV_PROXY=1 node tools/face/sampler-bench.mjs <outdir> [variant,variant]   (RUNWARE_API_KEY, or the proxy's own key)
// Variants: D Default, M "DPM++ 2M", K "DPM++ 2M Karras", B "DPM++ 2M Beta", E "Euler Beta", F "FlowMatchEulerDiscreteScheduler",
// S6 Default at 6 steps (time and cost against 4).
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadWorker } from "../test/load-worker.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: sampler-bench.mjs <outdir> [D,M,K,B]");
const pick = (process.argv[3] || "D,M,K,B").split(",");
const BUDGET = Number(process.env.BUDGET_USD) || 0.04;
const SEED = Number(process.env.SEED) || 101;
mkdirSync(out, { recursive: true });
const W = await loadWorker();
const P = W.CONFIG.PICTURE;
P.ANATOMY.ON = false;
P.WRITER.ON = false;
const VARIANTS = {
  D: { scheduler: "" }, M: { scheduler: "DPM++ 2M" }, K: { scheduler: "DPM++ 2M Karras" }, B: { scheduler: "DPM++ 2M Beta" },
  E: { scheduler: "Euler Beta" }, F: { scheduler: "FlowMatchEulerDiscreteScheduler" }, S6: { scheduler: "", steps: 6 },
};
// seeded Math.random (mulberry32): the same spec for every variant
const seeded = (s) => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const CASES = {
  clothed: () => { Math.random = seeded(7); return W.specFromWords("selfie in a cream cable-knit sweater and dark jeans, leaning on the kitchen counter", { source: "pic", level: "on" }); },
  nude: () => { Math.random = seeded(11); return W.specFromWords("naked, sitting on the edge of the bed", { source: "pic", level: "on" }); },
};
// what was sent and what came back (Runware's cost and the time)
const realFetch = globalThis.fetch;
let last = null;
globalThis.fetch = async (u, init) => {
  const t0 = Date.now();
  const res = await realFetch(u, init);
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}
  const task = String(u).includes("runware") ? JSON.parse(init.body)[0] : null;
  if (task) last = { ms: Date.now() - t0, cost: Number(((data.data || [])[0] || {}).cost) || 0, sent: { ...task, inputs: undefined }, errors: data.errors || null };
  return new Response(text, { status: res.status, headers: res.headers });
};
const env = { RUNWARE_API_KEY: process.env.RUNWARE_API_KEY || "proxy", REEM_KV: { get: async () => null, put: async () => {} } };
let spent = 0;
const rows = [];
for (const [name, make] of Object.entries(CASES)) {
  const spec = make();
  for (const v of pick) {
    const V = VARIANTS[v];
    if (!V) continue;
    if (spent + 0.0065 > BUDGET) { console.log(`stop: $${spent.toFixed(4)} spent, the next picture would pass $${BUDGET}`); break; }
    P.FRAMES.SCHEDULER = V.scheduler;
    P.FRAMES.STEPS = V.steps || 4;
    const ledger = await W.loadLedger(env);
    last = null;
    try {
      const drawn = await W.drawPicture(env, "{who}", { ledger, custom: true, nsfw: "on", spec, seed: SEED });
      const file = `${name}-${v}.jpg`;
      writeFileSync(join(out, file), drawn.bytes);
      spent += last ? last.cost : 0;
      rows.push({ case: name, variant: v, scheduler: V.scheduler || "Default", steps: P.FRAMES.STEPS, cost: last && last.cost, ms: last && last.ms, file });
      console.log(JSON.stringify(rows.at(-1)));
    } catch (e) {
      rows.push({ case: name, variant: v, scheduler: V.scheduler || "Default", error: String(e.message || e).slice(0, 200), sent: last && last.errors });
      console.log(JSON.stringify(rows.at(-1)));
    }
  }
  writeFileSync(join(out, `${name}-prompt.txt`), `${W.specPlan(spec, { route: "runware", bytesOf: () => new Uint8Array(1) }).tries[0].text}\n\n${JSON.stringify(spec, null, 1)}\n`);
}
writeFileSync(join(out, "results.json"), JSON.stringify({ seed: SEED, spent, rows }, null, 1));
console.log(`spent $${spent.toFixed(5)} (Runware's reported cost)`);
