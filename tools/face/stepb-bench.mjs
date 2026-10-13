// Step B bench (picture overhaul, 2026-10-13): the new prompts through the bot's own picture code (Step A's harness).
// T vs F (PICTURE.CAMERA "third" / "first") on the pictures with him in them: riding + "his hands on her hips" (Step A: a second
// man's head 3/4), D1 rows 485, 490, 491 (/pic with his name) and 484 (/look: "The man sits ..., she is right beside him"); T only,
// one seed: /look 483 (lamp light only), the slip-dress mirror selfie (Step A: a second phone from a gaze), two outfits with no
// DRESSED line. Seeds 101 and 202 (101 only for the T-only cases). Math.random is seeded by (seed, case): T and F make the same picks.
//   node tools/face/stepb-bench.mjs --dry               no network, $0: every run's plan
//   NODE_USE_ENV_PROXY=1 node tools/face/stepb-bench.mjs --run <outdir>   paid: klein 9B on Runware, stops at $0.08 (BUDGET_USD)
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { loadWorker } from "../test/load-worker.mjs";
import * as FACE from "../../face.js";
import * as PLACES from "../../places.js";

const PACE_MS = 4000; // Runware answers 502 when calls come closer than ~4 s
const SEEDS = [101, 202];
const FROZEN = Date.parse("2026-10-11T18:00:00Z"); // 14:00 in Boston
const DRY = process.argv.includes("--dry");
const OUT = DRY ? null : process.argv[process.argv.indexOf("--run") + 1];
if (!DRY && !OUT) throw new Error("usage: --dry | --run <outdir>");
const BUDGET_USD = Number(process.env.BUDGET_USD) || 0.08;
const TINY_JPEG = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==";

// The clock: `new Date()` reads `frozen`
let frozen = FROZEN;
const RealDate = Date;
class FrozenDate extends RealDate {
  constructor(...args) {
    if (args.length) super(...args);
    else super(frozen);
  }
  static now() {
    return frozen;
  }
}
globalThis.Date = FrozenDate;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Every known reference by the hash of its bytes, so a sent reference reads back as a name
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const REFERENCE_NAMES = new Map();
const addRef = (name, b64) => b64 && REFERENCE_NAMES.set(sha(Buffer.from(b64, "base64")), name);
addRef("face-1x", FACE.FACE_JPEG_BASE64);
addRef("face-2x", FACE.FACE_2X_JPEG_BASE64);
addRef("body-cloudflare", FACE.BODY_JPEG_BASE64);
addRef("body-v10", FACE.BODY_NUDE_JPEG_BASE64);
addRef("body-v10-back", FACE.BODY_BACK_JPEG_BASE64);
addRef("body-v11-clothed", FACE.BODY_CLOTHED_JPEG_BASE64);
addRef("body-v11-clothed-back", FACE.BODY_CLOTHED_BACK_JPEG_BASE64);
for (const [k, v] of Object.entries(FACE.STYLE_JPEG_BASE64 || {})) addRef(`style:${k}`, v);
for (const [k, v] of Object.entries(PLACES.PLACE_JPEG_BASE64 || {})) addRef(`place:${k}`, v);
const nameOf = (dataUrl) => {
  const hash = sha(Buffer.from(String(dataUrl).split(",")[1] || "", "base64"));
  return REFERENCE_NAMES.get(hash) || `unknown:${hash.slice(0, 12)}`;
};

const W = await loadWorker();
const P = W.CONFIG.PICTURE;
const FERAS = { name: "Feras" };

// /pic: his words through the bot's own path (asCamera with his name, customPicture, no day outfit)
const pic = (words) => async (env, ledger) => {
  const said = W.picWords(words, "on", FERAS);
  if (!W.mayDraw(said, "on")) return { refused: true };
  const { prompt, location, night } = W.customPicture(said, 14, null, "on");
  return W.drawPicture(env, prompt, { location, night, ledger, custom: true, nsfw: "on" });
};
// /look with her: DeepSeek's text as logged (D1 llm_text, the WITH_HER line removed), drawn on Runware (On) to test the words
const look = (text) => (env, ledger) => W.lookPicture(env, ledger, text, true, null, "on");
const L483 = "She sits beside him on the edge of the bed, turned toward him, one hand gently raised to his jaw while the other rests on her thigh, her cardigan wrapped tight over a simple top. The room is dim, lit only by a warm bedside lamp, with a glass of water and a blister pack on the nightstand beside them. Her expression is soft but worried, her eyes fixed on the cut above his brow.";
const L484 = "The man sits on the edge of a bed, and she is right beside him, their shoulders touching. She leans toward him, her fingers resting on his jaw, her brow furrowed as she studies the cut above his eye. A glass of water and a blister pack sit on the nightstand, lit by a warm bedside lamp in the quiet room.";
const CASES = [
  { id: "h1-riding-hands", tf: true, run: pic("riding the man, his hands on her hips") },
  { id: "d485-sex", tf: true, run: pic("Feras having sex with Reem") },
  { id: "d490-reverse", tf: true, run: pic("Feras having sex with Reem, Reem riding him in reverse cowgirl") },
  { id: "d491-spooning", tf: true, run: pic("Feras PoV of spooning with Reem") },
  { id: "l484-beside", tf: true, run: look(L484) },
  { id: "l483-lamp", tf: false, run: look(L483) },
  { id: "o3-slip-dress-mirror", tf: false, run: pic("a mirror selfie, full body, a long black satin slip dress") },
  { id: "o2-tee-jeans-couch", tf: false, run: pic("on the couch, a fitted gray ribbed tee and high-waisted jeans") },
  { id: "o4-cardigan-cami", tf: false, run: pic("her father's old gray cardigan over a black cami, in the kitchen") },
];
const VARIANTS = { T: () => { P.CAMERA = "third"; }, F: () => { P.CAMERA = "first"; } };
const ONLY = String(process.env.ONLY || "").split(",").filter(Boolean);
const runs = [];
for (const v of Object.keys(VARIANTS).filter((k) => !ONLY.length || ONLY.includes(k)))
  CASES.forEach((c, ci) => {
    if (v === "F" && !c.tf) return;
    for (const seed of c.tf ? SEEDS : SEEDS.slice(0, 1)) runs.push({ v, ci, seed, id: `${c.id}-${v}-s${seed}` });
  });

// Runware through the bot's own code: the fetch wrapper sets the run's seed and records each call
let current = null;
let spent = 0;
const realFetch = globalThis.fetch;
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
globalThis.fetch = async (url, init = {}) => {
  if (String(url) !== "https://api.runware.ai/v1") throw new Error(`stepb-bench: unexpected request to ${url}`);
  const tasks = JSON.parse(init.body);
  for (const t of tasks) t.seed = current.seed;
  const summary = tasks.map((t) => ({
    model: t.model,
    width: t.width,
    height: t.height,
    steps: t.steps ?? null,
    CFGScale: t.CFGScale ?? null,
    seed: t.seed,
    loras: (t.lora || []).map((l) => ({ model: l.model, weight: l.weight })),
    refs: (t.inputs?.referenceImages || []).map(nameOf),
    positivePrompt: t.positivePrompt,
  }));
  if (DRY) {
    current.calls.push({ ...summary[0], status: 200, cost: 0, error: "" });
    if (!current.bytes) current.bytes = TINY_JPEG;
    return json({ data: tasks.map((t) => ({ taskUUID: t.taskUUID, imageBase64Data: TINY_JPEG, cost: 0 })), errors: [] });
  }
  const res = await realFetch(url, { ...init, body: JSON.stringify(tasks) });
  const text = await res.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {}
  const d = (data.data || [])[0];
  const cost = Number(d?.cost) || 0;
  spent += cost;
  current.calls.push({ ...summary[0], status: res.status, cost, error: (data.errors || []).map((x) => x.code || x.message).join(", ") || (d?.imageBase64Data ? "" : "no picture") });
  if (d?.imageBase64Data && !current.bytes) current.bytes = d.imageBase64Data;
  return new Response(text, { status: res.status, headers: { "content-type": "application/json" } });
};

// Cloudflare must not answer for a failed Runware call here: the bench counts Runware only
const env = {
  RUNWARE_API_KEY: "proxy-injected",
  REEM_KV: { get: async () => null, put: async () => {}, delete: async () => {}, list: async () => ({ keys: [] }) },
  AI: { run: async () => { throw new Error("stepb-bench: Cloudflare is not called"); } },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const plan = [];
let first = true;
let applied = null;
for (const run of runs) {
  const c = CASES[run.ci];
  if (applied !== run.v) {
    VARIANTS[run.v]();
    applied = run.v;
  }
  const row = { id: run.id, case: c.id, variant: run.v, seed: run.seed, file: null, calls: [], cost: 0, error: "", budgetStop: false };
  if (!DRY && spent >= BUDGET_USD) {
    row.budgetStop = true;
    row.error = `stopped: spent $${spent.toFixed(4)} >= $${BUDGET_USD}`;
    results.push(row);
    continue;
  }
  if (!DRY && !first) await sleep(PACE_MS);
  first = false;
  frozen = FROZEN;
  Math.random = mulberry32(run.seed * 100 + run.ci); // the same random picks for every variant of this case
  current = { seed: run.seed, calls: [], bytes: null };
  const ledger = { rwUsd: 0, rwFailed: 0, usd: 0, recent: [], shots: [] };
  try {
    const out = await c.run(env, ledger);
    if (out && out.refused) row.error = "refused by mayDraw";
  } catch (e) {
    row.error = String(e.message || e);
  }
  row.calls = current.calls.map(({ positivePrompt, ...rest }) => rest);
  row.prompt = current.calls[0]?.positivePrompt || "";
  row.refs = current.calls[0]?.refs || [];
  row.loras = current.calls[0]?.loras || [];
  row.width = current.calls[0]?.width;
  row.height = current.calls[0]?.height;
  row.cost = current.calls.reduce((s, x) => s + (Number(x.cost) || 0), 0);
  if (!DRY && current.bytes) {
    row.file = `${run.id}.jpg`;
    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, row.file), Buffer.from(current.bytes, "base64"));
  }
  results.push(row);
  const line = `${run.id}  ${row.width}x${row.height}  refs ${row.refs.join(",")}  loras ${row.loras.map((l) => `${l.model.replace("ferasalm:", "")}@${l.weight}`).join(" ") || "none"}  ${row.file ? "picture" : row.error || "no picture"}  $${row.cost.toFixed(4)}`;
  plan.push(line);
  console.log(line);
}
const summary = { dry: DRY, budgetUsd: BUDGET_USD, spentUsd: Number(spent.toFixed(6)), pictures: results.filter((r) => r.file).length, runs: results };
if (DRY) {
  for (const r of results) console.log(`${r.id}\n  ${r.prompt}`);
} else {
  writeFileSync(join(OUT, "results.json"), JSON.stringify(summary, null, 2) + "\n");
  writeFileSync(join(OUT, "plan.txt"), results.map((r) => `${r.id}\n  ${r.prompt}`).join("\n\n") + "\n");
  console.log(`\n${summary.pictures} pictures, spent $${summary.spentUsd} of $${BUDGET_USD}; wrote ${OUT}/results.json`);
}
