// Why nude pictures come out slimmer than the v13 body pictures (2026-10-15): the nude front mirror selfie and the nude belfie through
// the bot's own /pic path on Runware klein 9B, one change per variant at a fixed seed and fixed random picks:
// V0 as built, V1 no NSFW Unlocked (NUDE_LORAS), V2 no LoRAs, V3 no place picture, V4 no BODY_WORDS in the body line, V5 no Lenovo,
// V6 no Anatomy Fixer, V7 NSFW Unlocked at 0.5, V8 Lenovo at 0.8, V9 Lenovo 0.8 + NSFW Unlocked 0.5 + no Anatomy Fixer, V11 no Anatomy Fixer + the body words first
// ("her body exactly image 1's, the same fullness: BODY_WORDS" right after her face, out of their later place), V12 no Anatomy Fixer +
// SHAPE_WORDS after BODY_WORDS, V13 no Anatomy Fixer + Lenovo 1.0 + NSFW Unlocked 0.6. SEED=202 for a second seed.
//   NODE_USE_ENV_PROXY=1 node tools/face/slim-bench.mjs <outdir> [V0,V1,...]   paid: ~$0.008 a picture, stops at BUDGET_USD ($0.12)
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadWorker } from "../test/load-worker.mjs";

const OUT = process.argv[2];
if (!OUT) throw new Error("usage: slim-bench.mjs <outdir> [variants]");
mkdirSync(OUT, { recursive: true });
const ONLY = process.argv[3] ? process.argv[3].split(",") : null;
const BUDGET_USD = Number(process.env.BUDGET_USD) || 0.12;
const SEED = Number(process.env.SEED) || 101;
const W = await loadWorker();
const R = W.CONFIG.PICTURE.RUNWARE;
const BW = W.CONFIG.PICTURE.BODY_WORDS;
const saved = { NUDE_LORAS: R.NUDE_LORAS, LORAS: R.LORAS, ANATOMY_LORAS: R.ANATOMY_LORAS, REFERENCE: R.REFERENCE, REFERENCE_BACK: R.REFERENCE_BACK };
const SHAPE = process.env.SHAPE_WORDS || "her hips much wider than her shoulders, full thick thighs";
const bodyFirst = (line) => line.replace(`, ${BW},`, ",").replace(`: ${BW},`, ":").replace(", with exactly the same face", `, her body exactly image 1's, the same fullness: ${BW}, with exactly the same face`);
const VARIANTS = {
  V0: {},
  V1: { NUDE_LORAS: {} },
  V2: { NUDE_LORAS: {}, LORAS: {}, ANATOMY_LORAS: {} },
  V3: { noPlace: true },
  V5: { LORAS: {} },
  V6: { ANATOMY_LORAS: {} },
  V7: { NUDE_LORAS: { "ferasalm:nsfwunlock@1": 0.5 } },
  V8: { LORAS: { "ferasalm:lenovoc@1": 0.8 } },
  V9: { LORAS: { "ferasalm:lenovoc@1": 0.8 }, NUDE_LORAS: { "ferasalm:nsfwunlock@1": 0.5 }, ANATOMY_LORAS: {} },
  V11: { ANATOMY_LORAS: {}, REFERENCE: bodyFirst(saved.REFERENCE), REFERENCE_BACK: bodyFirst(saved.REFERENCE_BACK) },
  V12: { ANATOMY_LORAS: {}, REFERENCE: saved.REFERENCE.replace(BW, `${BW}, ${SHAPE}`), REFERENCE_BACK: saved.REFERENCE_BACK.replace(BW, `${BW}, ${SHAPE}`) },
  V13: { ANATOMY_LORAS: {}, LORAS: { "ferasalm:lenovoc@1": 1.0 }, NUDE_LORAS: { "ferasalm:nsfwunlock@1": 0.6 } },
  V4: { REFERENCE: saved.REFERENCE.replace(`, ${BW},`, ","), REFERENCE_BACK: saved.REFERENCE_BACK.replace(`: ${BW},`, ":") },
};
const CASES = [
  ["nude-front", "naked, standing, a mirror selfie in the bedroom mirror, full body"],
  ["nude-back", "a belfie, naked, standing in the bedroom"],
];
const FROZEN = Date.parse("2026-10-15T18:00:00Z");
const RealDate = Date;
globalThis.Date = class extends RealDate {
  constructor(...a) { if (a.length) super(...a); else super(FROZEN); }
  static now() { return FROZEN; }
};
const mulberry32 = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
let current = null;
let spent = 0;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  if (String(url) !== "https://api.runware.ai/v1") throw new Error(`unexpected request to ${url}`);
  const tasks = JSON.parse(init.body);
  for (const t of tasks) t.seed = SEED;
  const res = await realFetch(url, { ...init, body: JSON.stringify(tasks) });
  const text = await res.text();
  let d = {};
  try { d = (JSON.parse(text).data || [])[0] || {}; } catch {}
  spent += Number(d.cost) || 0;
  current.calls.push({ status: res.status, cost: d.cost, refs: (tasks[0].inputs?.referenceImages || []).length, loras: (tasks[0].lora || []).map((l) => `${l.model}@${l.weight}`), prompt: tasks[0].positivePrompt });
  if (d.imageBase64Data && !current.bytes) current.bytes = d.imageBase64Data;
  return new Response(text, { status: res.status, headers: { "content-type": "application/json" } });
};
const env = {
  RUNWARE_API_KEY: "proxy-injected",
  REEM_KV: { get: async () => null, put: async () => {}, delete: async () => {}, list: async () => ({ keys: [] }) },
  AI: { run: async () => { throw new Error("Cloudflare is not called here"); } },
};
const rows = [];
for (const [ci, [id, words]] of CASES.entries()) {
  for (const [v, change] of Object.entries(VARIANTS)) {
    if (ONLY && !ONLY.includes(v)) continue;
    if (spent >= BUDGET_USD) { console.log(`stop: $${spent.toFixed(4)}`); break; }
    Object.assign(R, saved, Object.fromEntries(Object.entries(change).filter(([k]) => k !== "noPlace")));
    Math.random = mulberry32(SEED * 100 + ci);
    current = { calls: [], bytes: null };
    const p = W.customPicture(W.picWords(words), undefined, null, "on");
    await W.drawPicture(env, p.prompt, { location: change.noPlace ? null : p.location, night: p.night, ledger: { rwUsd: 0, rwFailed: 0 }, custom: true, nsfw: "on" });
    if (current.bytes) writeFileSync(join(OUT, `${id}-${v}.jpg`), Buffer.from(current.bytes, "base64"));
    rows.push({ id, v, calls: current.calls });
    const c = current.calls.at(-1) || {};
    console.log(`${id} ${v}: ${current.calls.map((x) => x.status).join(",")} $${c.cost} refs ${c.refs} loras ${c.loras?.join(" ")}`);
    await new Promise((r) => setTimeout(r, 4000));
  }
}
Object.assign(R, saved);
writeFileSync(join(OUT, "runs.json"), JSON.stringify(rows, null, 2));
console.log(`spent $${spent.toFixed(4)}`);
