// Rebuild Step 4 (2026-10-16): the reference library's paid checks, through the bot's own code (drawRunware, pickRefs, framePrompt).
//   NODE_USE_ENV_PROXY=1 node tools/face/step4-batch.mjs <outdir> [phases]
//   U: a library picture by its Runware UUID against the same picture as base64 (same seed: expect the same picture)
//   B: the first batch of candidates (firstBatch(): outfits from the clothed body, hair from her face, two fuller-body candidates)
//   S: does her face picture slim her? nude front "naked on the bed", seeds 101 and 202, with the face picture against without it
//   F: the same nude front with a fuller body candidate as image 1 (FULLER=<file> BODY_NAME=...) against the standard body
//   DRY=1 prints the requests and draws nothing. Stops at BUDGET_USD (default 0.30) by Runware's reported cost.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadWorker } from "../test/load-worker.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: step4-batch.mjs <outdir> [U,B,S,F]");
const phases = (process.argv[3] || "U,B,S").split(",");
const BUDGET = Number(process.env.BUDGET_USD) || 0.3;
const DRY = !!process.env.DRY;
mkdirSync(out, { recursive: true });
const W = await loadWorker();
const P = W.CONFIG.PICTURE;
P.ANATOMY.ON = false;
P.WRITER.ON = false;
const R = P.RUNWARE;
const realFetch = globalThis.fetch;
let spent = 0;
let seen = [];
globalThis.fetch = async (u, init) => {
  const res = await realFetch(u, init);
  const text = await res.text();
  if (String(u).includes("runware") && init && init.body) {
    const task = JSON.parse(init.body)[0];
    let data = {};
    try { data = JSON.parse(text); } catch {}
    const cost = Number(((data.data || [])[0] || {}).cost) || 0;
    if (task.taskType === "imageInference") {
      spent += cost;
      seen.push({ refs: ((task.inputs || {}).referenceImages || []).map((r) => (/^data:/.test(r) ? "data" : r)), cost, errors: data.errors });
    }
  }
  return new Response(text, { status: res.status, headers: res.headers });
};
const kv = new Map();
const env = { RUNWARE_API_KEY: process.env.RUNWARE_API_KEY || "proxy", REEM_KV: { get: async (k) => kv.get(k) ?? null, put: async (k, v) => void kv.set(k, v), delete: async (k) => void kv.delete(k) } };
const save = (name, bytes) => writeFileSync(join(out, name), bytes);
const room = () => DRY || spent + 0.012 <= BUDGET;
const log = [];
const note = (o) => { log.push(o); console.log(JSON.stringify(o)); writeFileSync(join(out, "results.json"), JSON.stringify({ spent, log }, null, 1)); };

if (phases.includes("U")) {
  const body = await W.refBytes(env, `body-${R.BODY_CLOTHED}`);
  const face = await W.refBytes(env, "face-2x");
  const prompt = "She is the woman of image 0, with the body shape of image 1: an adult woman, 29. She is fully dressed in a cream cable-knit sweater and fitted dark jeans. A natural photo.";
  for (const mode of ["bytes", "uuid"]) {
    if (!room()) break;
    seen = [];
    const refs = [face, mode === "uuid" ? { bytes: body, id: "probe-body" } : body];
    if (DRY) { note({ phase: "U", mode, prompt }); continue; }
    const d = await W.drawRunware(env, R.MODEL, prompt, refs, R.WIDTH, R.HEIGHT, { seed: 101, steps: P.FRAMES.STEPS, cfg: P.FRAMES.CFG, acceleration: P.FRAMES.ACCELERATION });
    save(`U-${mode}.jpg`, d.bytes);
    note({ phase: "U", mode, file: `U-${mode}.jpg`, bytes: d.bytes.length, sent: seen[0].refs, cost: d.cost });
  }
}
if (phases.includes("B")) {
  let n = 0;
  for (const item of W.firstBatch()) {
    n++;
    if (!room()) { note({ stop: `budget at ${spent.toFixed(4)}` }); break; }
    if (DRY) { note({ phase: "B", ...item }); continue; }
    const base = await W.refBytes(env, item.base);
    seen = [];
    const d = await W.drawRunware(env, R.MODEL, item.change, [base], R.WIDTH, R.HEIGHT, { seed: 101 });
    const file = `B-${String(n).padStart(2, "0")}-${item.kind}.jpg`;
    save(file, d.bytes);
    note({ phase: "B", file, kind: item.kind, key: item.key, tags: item.tags, base: item.base, prompt: item.change, seed: 101, cost: d.cost });
  }
}
// S and F: the bot's own nude-front plan ("naked on the bed", /nsfw On), the face picture dropped or the body picture swapped
for (const ph of ["S", "F"]) {
  if (!phases.includes(ph)) continue;
  const prof = W.profile("runware");
  for (const seed of (process.env.SEEDS || "101,202").split(",").map(Number)) {
    const w = W.picWords("naked on the bed", "on", {});
    let s0 = seed;
    Math.random = () => { s0 = (s0 + 0x6d2b79f5) | 0; let t = Math.imul(s0 ^ (s0 >>> 15), 1 | s0); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const pic = W.customPicture(w, 14, null, "on");
    const spec = W.specFromWords(w, { source: "pic", level: "on", hour: 14 });
    const plan = W.specPlan(spec, { route: "runware", bytesOf: () => new Uint8Array(1), level: "on" });
    const t = plan.tries[0];
    const variants = ph === "S"
      ? [["with-face", t.refs.map((r) => r.name)], ["no-face", t.refs.map((r) => r.name).filter((n) => !/^face/.test(n))]]
      : [["standard", t.refs.map((r) => r.name)], ["fuller", t.refs.map((r) => (/^body-/.test(r.name) ? "FULLER" : r.name))]];
    for (const [v, names] of variants) {
      if (!room()) break;
      const refs = names.map((n) => ({ role: n === "FULLER" ? "body" : t.refs.find((r) => r.name === n).role, name: n }));
      const text = W.framePrompt(spec, refs, prof);
      note({ phase: ph, seed, variant: v, refs: names, prompt: text, loras: t.loras.map((l) => `${l.model}@${l.weight}`) });
      if (DRY) continue;
      const bytes = [];
      for (const n of names) bytes.push(n === "FULLER" ? readFileSync(process.env.FULLER) : await W.refBytes(env, n));
      seen = [];
      const d = await W.drawRunware(env, t.model, text, bytes, t.width, t.height, { loras: t.loras, seed, steps: t.steps, cfg: t.cfg, acceleration: t.acceleration, scheduler: t.scheduler });
      const file = `${ph}-${seed}-${v}.jpg`;
      save(file, d.bytes);
      note({ phase: ph, file, cost: d.cost });
    }
  }
}
console.log(DRY ? "dry run" : `spent $${spent.toFixed(5)} (Runware's reported cost)`);
