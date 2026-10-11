// Step 5 (docs/WORKPLAN.md): partly dressed and crotch close-ups, through the bot's own picture code (the Step 3 and 4 harness).
//   node tools/face/partial-bench.mjs --dry               no network, $0: every run's LoRAs, size and prompt
//   NODE_USE_ENV_PROXY=1 node tools/face/partial-bench.mjs --run <outdir>   paid: klein 9B on Runware, stops at $0.10 (BUDGET_USD)
// Cases (/pic): P1 close-up + white t-shirt, P2 close-up + covered breasts, P3 waist down + sports bra, P4 topless in jeans.
// Variants: BODY_PARTIAL nude with PussyDiffusion 0.8 / 0.6 / off, and BODY_PARTIAL none with 0.6 (WORKPLAN's "Decided in review");
// P3 and P4 name no PussyDiffusion words, so only nude and none differ there. Seeds 101, 202: 24 pictures. --framing: see below.
// Each run seeds Math.random by (seed, case), so the variants of a case make the same random picks.
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { loadWorker } from "../test/load-worker.mjs";
import * as FACE from "../../face.js";
import * as PLACES from "../../places.js";

const DRY = process.argv.includes("--dry");
const OUT = DRY ? null : process.argv[process.argv.indexOf("--run") + 1];
if (!DRY && !OUT) throw new Error("usage: --dry | --run <outdir>");
const BUDGET_USD = Number(process.env.BUDGET_USD) || 0.10; // Step 5: the step budget
const PACE_MS = 4000; // Runware answers 502 when calls come closer than ~4 s
const SEEDS = [101, 202];
const FROZEN = Date.parse("2026-10-11T18:00:00Z"); // 14:00 in Boston
const TINY_JPEG = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==";

// The clock: `new Date()` reads `frozen` (a case may move it, `at`)
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
addRef("body-v10-clothed", FACE.BODY_CLOTHED_JPEG_BASE64);
addRef("body-v10-neutral", FACE.BODY_NEUTRAL_JPEG_BASE64);
for (const [k, v] of Object.entries(FACE.STYLE_JPEG_BASE64 || {})) addRef(`style:${k}`, v);
for (const [k, v] of Object.entries(PLACES.PLACE_JPEG_BASE64 || {})) addRef(`place:${k}`, v);
const nameOf = (dataUrl) => {
  const hash = sha(Buffer.from(String(dataUrl).split(",")[1] || "", "base64"));
  return REFERENCE_NAMES.get(hash) || `unknown:${hash.slice(0, 12)}`;
};

const W = await loadWorker();
const R = W.CONFIG.PICTURE.RUNWARE;

// The cases: the bot's own /pic calls (his words, about her)
const pic = (words) => async (env, ledger) => {
  const said = W.picWords(words);
  if (!W.mayDraw(said)) return { refused: true };
  const { prompt, location, night } = W.customPicture(said);
  return W.drawPicture(env, prompt, { location, night, ledger, custom: true });
};
// BODY_PARTIAL (image 1 when partly naked) and PussyDiffusion's weight when partly naked (PARTIAL_WEIGHTS; 0 = left out)
// --framing: CLOSE_SHAPE (a SIZES key) and CLOSE_FACE (her face picture) for the crotch close-ups, with BODY_PARTIAL none and 0.6
const VARIANTS = { "nude-pd08": ["nude", 0.8], "nude-pd06": ["nude", 0.6], "nude-pdoff": ["nude", 0], "none-pd06": ["none", 0.6], nude: ["nude", 0.6], none: ["none", 0.6],
  square: ["none", 0.6, "1:1", true], noface: ["none", 0.6, "", false], "noface-square": ["none", 0.6, "1:1", false] };
function applyVariant(name) {
  const [body, pd, shape = "", face = true] = VARIANTS[name];
  R.BODY_PARTIAL = body;
  R.PARTIAL_WEIGHTS = { ...R.PARTIAL_WEIGHTS, "ferasalm:pussyd@1": pd };
  R.CLOSE_SHAPE = shape;
  R.CLOSE_FACE = face;
}
const FOUR = ["nude-pd08", "nude-pd06", "nude-pdoff", "none-pd06"];
const CASES = [
  { id: "p1-closeup-tshirt", variants: FOUR, seeds: SEEDS, run: pic("close-up of her pussy, legs spread on the bed, wearing a white t-shirt") },
  { id: "p2-closeup-covered", variants: FOUR, seeds: SEEDS, run: pic("pussy close up, covered breasts") },
  { id: "p3-waistdown-sportsbra", variants: ["nude", "none"], seeds: SEEDS, run: pic("naked from the waist down, black sports bra, sitting on the edge of the bed, legs apart") },
  { id: "p4-topless-jeans", variants: ["nude", "none"], seeds: SEEDS, run: pic("topless, in jeans, mirror selfie in her bedroom") },
];
// --framing (Opus, after the first 24): the close-ups came out framed from her lips down in every variant; the face picture ("exactly
// the same face") or the tall 9:16 frame are the leads. 12 pictures.
if (process.argv.includes("--framing")) {
  const close = CASES.slice(0, 2).map((c) => ({ ...c, variants: ["square", "noface", "noface-square"] }));
  CASES.splice(0, CASES.length, ...close);
}
// --redraw: the faceless 1:1 close-ups again, REFERENCE_CLOSE without its belly, hip and thigh words (the owner's 2026-10-10 rule). 4 pictures.
if (process.argv.includes("--redraw")) {
  const close = CASES.slice(0, 2).map((c) => ({ ...c, variants: ["noface-square"] }));
  CASES.splice(0, CASES.length, ...close);
}

// Runs: seed-major (101 first), then case, then variant
const runs = [];
for (const seed of SEEDS) CASES.forEach((c, ci) => {
  if (c.seeds.includes(seed)) c.variants.forEach((v) => runs.push({ seed, ci, v, id: `${c.id}-${v}-s${seed}` }));
});

// Runware through the bot's own code: the fetch wrapper sets the run's seed, records each call, and keeps the first picture
let current = null;
let spent = 0;
const realFetch = globalThis.fetch;
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
globalThis.fetch = async (url, init = {}) => {
  if (String(url) !== "https://api.runware.ai/v1") throw new Error(`bench: unexpected request to ${url}`);
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
  AI: { run: async () => { throw new Error("bench: Cloudflare is not called"); } },
};

const results = [];
const plan = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const say = console.log;
const complain = console.error;
let firstLive = true;
for (const run of runs) {
  const c = CASES[run.ci];
  const row = { id: run.id, case: c.id, variant: run.v, seed: run.seed, file: null, calls: [], cost: 0, error: "", budgetStop: false };
  if (!DRY && spent >= BUDGET_USD) {
    row.budgetStop = true;
    row.error = `stopped: spent $${spent.toFixed(4)} >= $${BUDGET_USD}`;
    results.push(row);
    continue;
  }
  if (!DRY && !firstLive) await sleep(PACE_MS);
  firstLive = false;
  applyVariant(run.v);
  frozen = c.at ? Date.parse(c.at) : FROZEN;
  Math.random = mulberry32(run.seed * 100 + run.ci); // the same random picks for every variant of this case
  current = { seed: run.seed, calls: [], bytes: null };
  const ledger = await W.loadLedger(env);
  ledger.rwUsd = 0;
  console.log = () => {};
  console.error = () => {};
  const t0 = performance.now();
  try {
    const res = await c.run(env, ledger);
    if (res && res.refused) row.error = "refused by mayDraw";
  } catch (e) {
    row.error = String(e && e.message || e).slice(0, 200);
  } finally {
    console.log = say;
    console.error = complain;
  }
  row.ms = Math.round(performance.now() - t0);
  row.calls = current.calls;
  row.cost = current.calls.reduce((s, x) => s + x.cost, 0);
  row.tries = current.calls.length;
  row.width = current.calls[0]?.width ?? null;
  row.height = current.calls[0]?.height ?? null;
  row.loras = current.calls[0]?.loras ?? [];
  row.prompt = current.calls[0]?.positivePrompt ?? "";
  if (current.bytes) {
    row.file = `pictures/${run.id}.jpg`;
    if (!DRY) {
      mkdirSync(join(OUT, "pictures"), { recursive: true });
      writeFileSync(join(OUT, row.file), Buffer.from(current.bytes, "base64"));
    }
  } else if (!row.error) row.error = "no picture";
  results.push(row);
  plan.push(`${run.id}\n  ${row.width}x${row.height} steps ${current.calls[0]?.steps} cfg ${current.calls[0]?.CFGScale} seed ${run.seed}\n  loras: ${row.loras.map((l) => `${l.model}=${l.weight}`).join(", ") || "none"}\n  hand words in the prompt: ${(row.prompt.match(/hands?\b/gi) || []).length}\n  prompt: ${row.prompt}`);
  say(`${run.id}: ${row.error || "drawn"} $${row.cost.toFixed(4)} (spent $${spent.toFixed(4)}, ${row.ms} ms, ${row.tries} call(s))`);
}

const summary = { dry: DRY, seeds: SEEDS, budgetUsd: BUDGET_USD, spentUsd: Number(spent.toFixed(6)), pictures: results.filter((r) => r.file).length, runs: results };
if (DRY) {
  say(plan.join("\n\n"));
  say(`\ndry run: ${runs.length} runs planned, ${results.filter((r) => !r.error).length} plans built, $0 spent`);
} else {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "results.json"), JSON.stringify(summary, null, 2) + "\n");
  writeFileSync(join(OUT, "plan.txt"), plan.join("\n\n") + "\n");
  say(`\n${summary.pictures} pictures, spent $${summary.spentUsd} of $${BUDGET_USD}; wrote ${OUT}/results.json`);
}
process.exit(0);
