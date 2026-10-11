// Step 3 (docs/WORKPLAN.md): the LoRA and ghost-hands bench, through the bot's own picture code.
//   node tools/face/lora-bench.mjs --dry               no network, $0: prints every run's LoRAs, size and prompt
//   NODE_USE_ENV_PROXY=1 node tools/face/lora-bench.mjs --run <outdir>   paid: klein 9B on Runware, stops at $0.25
// Variants (CONFIG only, set and restored per run):
//   V0 today; V1 no hand words (POV_MAN and ACT_SCENES' "his hands on her butt"); V2 V1 + instapic 0.6 + realhd2kc 0.5;
//   V3 V1 + phone2025 0.6 + ultrareal5 0.6 (the prefix); V4 V1 + ultrareal5 0.7; V5 V1 + no realism LoRA.
// 3 clothed/nude cases x (V0, V2, V3, V5) + 4 sex acts x (V0-V5), seeds 101 and 202: 2 x (12 + 24) = 72 pictures.
// Each run seeds Math.random by (seed, case), so every variant of a case makes the same random picks; the Runware seed
// is the run's seed. Runs go seed 101 first, so a stop at the budget still leaves every case drawn once per variant.
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { loadWorker } from "/home/user/reem-bot/tools/test/load-worker.mjs";
import * as FACE from "/home/user/reem-bot/face.js";
import * as PLACES from "/home/user/reem-bot/places.js";

const DRY = process.argv.includes("--dry");
const OUT = DRY ? null : process.argv[process.argv.indexOf("--run") + 1];
if (!DRY && !OUT) throw new Error("usage: --dry | --run <outdir>");
const BUDGET_USD = Number(process.env.BUDGET || 0.045);
import { readFileSync } from "node:fs";
const TESTS = JSON.parse(readFileSync(process.env.TESTS, "utf8"));
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
for (const [k, v] of Object.entries(FACE.STYLE_JPEG_BASE64 || {})) addRef(`style:${k}`, v);
for (const [k, v] of Object.entries(PLACES.PLACE_JPEG_BASE64 || {})) addRef(`place:${k}`, v);
const nameOf = (dataUrl) => {
  const hash = sha(Buffer.from(String(dataUrl).split(",")[1] || "", "base64"));
  return REFERENCE_NAMES.get(hash) || `unknown:${hash.slice(0, 12)}`;
};

const W = await loadWorker();
const R = W.CONFIG.PICTURE.RUNWARE;

// What each variant changes: the LoRA list, the act camera's hand words, and POV_MAN (the man's view)
const POV_NO_HANDS = "First-person view from the man's own eyes, never his face; only his hips and thighs may show. One man, his penis average-sized and realistic.";
const ACT_SCENES_NO_HANDS = Object.fromEntries(Object.entries(R.ACT_SCENES).map(([words, text]) => [
  words,
  String(text).replace("His hands on her butt, she looks back", "She looks back").replace("his hands on her butt, she looks back", "she looks back"),
]));
const changedActs = Object.keys(R.ACT_SCENES).filter((k) => R.ACT_SCENES[k] !== ACT_SCENES_NO_HANDS[k]);
if (changedActs.length !== 2) throw new Error(`hand words: expected 2 act scenes to change, got ${changedActs.length}`);
const ORIGINAL = { LORAS: R.LORAS, POV_MAN: R.POV_MAN, ACT_SCENES: R.ACT_SCENES };
const VARIANTS = {
  V0: { LORAS: ORIGINAL.LORAS, POV_MAN: ORIGINAL.POV_MAN, ACT_SCENES: ORIGINAL.ACT_SCENES },
  V1: { LORAS: ORIGINAL.LORAS, POV_MAN: POV_NO_HANDS, ACT_SCENES: ACT_SCENES_NO_HANDS },
  V2: { LORAS: { "ferasalm:instapic@1": 0.6, "ferasalm:realhd2kc@1": 0.5 }, POV_MAN: POV_NO_HANDS, ACT_SCENES: ACT_SCENES_NO_HANDS },
  V3: { LORAS: { "ferasalm:phone2025@1": 0.6, "ferasalm:ultrareal5@1": 0.6 }, POV_MAN: POV_NO_HANDS, ACT_SCENES: ACT_SCENES_NO_HANDS },
  V4: { LORAS: { "ferasalm:ultrareal5@1": 0.7 }, POV_MAN: POV_NO_HANDS, ACT_SCENES: ACT_SCENES_NO_HANDS },
  V5: { LORAS: {}, POV_MAN: POV_NO_HANDS, ACT_SCENES: ACT_SCENES_NO_HANDS },
};
function applyVariant(name) {
  const v = VARIANTS[name];
  R.LORAS = v.LORAS;
  R.POV_MAN = v.POV_MAN;
  R.ACT_SCENES = v.ACT_SCENES;
}

// The cases: the bot's own calls (the same words as tools/test/picture-plans.mjs where they match)
const pic = (words) => async (env, ledger) => {
  const said = W.picWords(words);
  if (!W.mayDraw(said)) return { refused: true };
  const { prompt, location, night } = W.customPicture(said);
  return W.drawPicture(env, prompt, { location, night, ledger, custom: true });
};
const selfie = (words, at = null) => ({ at, run: (env, ledger) => W.startPicture(env, ledger, "selfie", words, { asked: words }) });
const CLOTHED = ["V0", "V2", "V3", "V5"];
const ACT = ["V0", "V1", "V2", "V3", "V4", "V5"];
const CASES = [
  { id: "clothed-kitchen", variants: CLOTHED, ...selfie("making coffee in my kitchen, a fitted black t-shirt and jeans") },
  { id: "clothed-bedroom-night", variants: CLOTHED, ...selfie("mirror selfie in the bedroom, a black slip dress", "2026-10-12T04:30:00Z") },
  { id: "nude-bedroom-mirror", variants: CLOTHED, run: pic("naked, standing in front of the bedroom mirror") },
  { id: "act-blowjob", variants: ACT, run: pic("blowjob") },
  { id: "act-riding", variants: ACT, run: pic("riding the man") },
  { id: "act-missionary", variants: ACT, run: pic("missionary") },
  { id: "act-doggy", variants: ACT, run: pic("doggy style") },
];

// Runs: seed-major, then case, then variant
const runs = [];
for (const t of TESTS) { const ci = CASES.findIndex((c) => c.id === t.case); if (ci < 0) throw new Error(t.case); runs.push({ seed: t.seed, ci, v: t.v || "V0", id: `${t.case}-${t.v || "V0"}-s${t.seed}-${t.tag}`, swap: t.swap || {}, cfg: t.cfg || null }); }

// Runware through the bot's own code: the fetch wrapper sets the run's seed, records each call, and keeps the first picture
let current = null;
let spent = 0;
const realFetch = globalThis.fetch;
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
globalThis.fetch = async (url, init = {}) => {
  if (String(url) !== "https://api.runware.ai/v1") throw new Error(`bench: unexpected request to ${url}`);
  const tasks = JSON.parse(init.body);
  for (const t of tasks) { t.seed = current.seed; const refs = t.inputs?.referenceImages || []; for (const [i, f] of Object.entries(current.swap)) { if (f === null) refs.splice(Number(i), 1); else refs[Number(i)] = "data:image/jpeg;base64," + readFileSync(f).toString("base64"); } }
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
  current = { seed: run.seed, calls: [], bytes: null, swap: run.swap };
  const saved = {}; if (run.cfg) for (const [k, v] of Object.entries(run.cfg)) { saved[k] = R[k]; R[k] = v; }
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
  for (const k of Object.keys(saved)) R[k] = saved[k];
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
