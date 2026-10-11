// Body audit (fix round, 2026-10-11; docs/WORKPLAN.md): the body the bot draws, through its own picture code (the outfit bench's
// harness). Five cases x seeds 101 and 202; V0 = HEAD as committed; V1 = OUTFIT_BODY false (the two outfit cases); V2 = the
// realism LoRAs of 897dfaf (phone2025 0.6, ultrareal5 0.6, instapic 0.6, realhd2kc 0.5); V3 = no realism LoRAs. V0 of every case
// first, then the variants. Math.random is seeded by (seed, case), so the variants of a case make the same random picks.
//   node tools/face/body-audit.mjs --dry               no network, $0: every run's plan
//   NODE_USE_ENV_PROXY=1 node tools/face/body-audit.mjs --run <outdir>   paid: klein 9B on Runware, stops at $0.12 (BUDGET_USD)
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
const BUDGET_USD = Number(process.env.BUDGET_USD) || 0.12;
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
const KEEP = { OUTFIT_BODY: R.OUTFIT_BODY, LORAS: R.LORAS };
const LORAS_897DFAF = { "ferasalm:phone2025@1": 0.6, "ferasalm:ultrareal5@1": 0.6, "ferasalm:instapic@1": 0.6, "ferasalm:realhd2kc@1": 0.5 };

// The cases: his words through the bot's own /pic path (customPicture, no day outfit: his words name the clothes)
const pic = (words) => async (env, ledger) => {
  const said = W.picWords(words);
  if (!W.mayDraw(said)) return { refused: true };
  const { prompt, location, night } = W.customPicture(said);
  return W.drawPicture(env, prompt, { location, night, ledger, custom: true });
};
const CASES = [
  { id: "mirror-tank-jeans", outfit: false, run: pic("a mirror selfie, standing, full body, a fitted black tank top and high-waisted jeans, her arms visible") },
  { id: "outfit-olive-cardigan", outfit: true, run: pic(`on the couch, wearing ${R.STYLE_PICTURES["outfit-olive-cardigan"]}`) },
  { id: "outfit-camel-coat", outfit: true, run: pic(`on the couch, wearing ${R.STYLE_PICTURES["outfit-camel-coat"]}`) },
  { id: "row13-cardigan-cami", outfit: false, run: pic("her father's old gray cardigan over a black cami, in the kitchen") },
  { id: "naked-standing-mirror", outfit: false, run: pic("naked, standing, a mirror selfie in the bedroom mirror") },
];
// V0 = HEAD as committed; V1 = OUTFIT_BODY false (outfit cases only); V2 = 897dfaf's realism LoRAs; V3 = no realism LoRAs
const VARIANTS = {
  V0: { apply: () => {}, cases: CASES.map((_, i) => i) },
  V1: { apply: () => { R.OUTFIT_BODY = false; }, cases: CASES.map((c, i) => (c.outfit ? i : -1)).filter((i) => i >= 0) },
  V2: { apply: () => { R.LORAS = { ...LORAS_897DFAF }; }, cases: CASES.map((_, i) => i) },
  V3: { apply: () => { R.LORAS = {}; }, cases: CASES.map((_, i) => i) },
};
const runs = [];
for (const v of Object.keys(VARIANTS)) for (const ci of VARIANTS[v].cases) for (const seed of SEEDS) runs.push({ v, ci, seed, id: `${CASES[ci].id}-${v}-s${seed}` });

// Runware through the bot's own code: the fetch wrapper sets the run's seed and records each call
let current = null;
let spent = 0;
const realFetch = globalThis.fetch;
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
globalThis.fetch = async (url, init = {}) => {
  if (String(url) !== "https://api.runware.ai/v1") throw new Error(`body-audit: unexpected request to ${url}`);
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

// Cloudflare must not answer for a failed Runware call here: the audit counts Runware only
const env = {
  RUNWARE_API_KEY: "proxy-injected",
  REEM_KV: { get: async () => null, put: async () => {}, delete: async () => {}, list: async () => ({ keys: [] }) },
  AI: { run: async () => { throw new Error("body-audit: Cloudflare is not called"); } },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const plan = [];
let first = true;
let applied = null;
for (const run of runs) {
  const c = CASES[run.ci];
  if (applied !== run.v) {
    Object.assign(R, KEEP); // every variant starts from HEAD's values
    VARIANTS[run.v].apply();
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
  for (const r of results) console.log(`${r.id}\n  ${r.prompt.slice(0, 300)}`);
} else {
  writeFileSync(join(OUT, "results.json"), JSON.stringify(summary, null, 2) + "\n");
  writeFileSync(join(OUT, "plan.txt"), results.map((r) => `${r.id}\n  ${r.prompt}`).join("\n\n") + "\n");
  console.log(`\n${summary.pictures} pictures, spent $${summary.spentUsd} of $${BUDGET_USD}; wrote ${OUT}/results.json`);
}
