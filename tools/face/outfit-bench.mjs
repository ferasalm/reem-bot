// Step 4 (docs/WORKPLAN.md): outfits, image 1 by outfit, nude back views, through the bot's own picture code (Step 3's harness).
//   node tools/face/outfit-bench.mjs --dry               no network, $0: every run's LoRAs, size and prompt
//   NODE_USE_ENV_PROXY=1 node tools/face/outfit-bench.mjs --run <outdir>   paid: klein 9B on Runware, stops at $0.20
//   --review: the Step 4 review's set; --nude-check: CLOTHED_BODY "nude" on a second seed, lingerie, /nsfw Off, scenes (Opus, Step 5 chat)
// Cases: 6 outfits with no picture x (CLOTHED_BODY rust, none) x seeds 101, 202 = 24; 4 outfits with a picture as image 1 x 2 seeds
// = 8; 4 nude back views (seed 101) = 4; 3 regression pictures (the nude mirror x2, doggy seed 202) = 3. 39 pictures.
// Each run seeds Math.random by (seed, case), so the variants of a case make the same random picks.
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { loadWorker } from "../test/load-worker.mjs";
import * as FACE from "../../assets/face.js";
import * as PLACES from "../../assets/places.js";

const DRY = process.argv.includes("--dry");
const OUT = DRY ? null : process.argv[process.argv.indexOf("--run") + 1];
if (!DRY && !OUT) throw new Error("usage: --dry | --run <outdir>");
const BUDGET_USD = Number(process.env.BUDGET_USD) || 0.20; // Step 4: the step budget ($0.20); the review ran with what was left
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

// The cases: the bot's own calls (customPicture, the /pic route: his words name the outfit, so no day outfit is added)
const OUTFITS = {
  turtleneck: "a fitted black turtleneck tucked into high-waisted jeans and small gold hoops",
  burgundy: "a fitted burgundy sweater dress, black tights and a long black wool coat",
  hoodie: "a gray zip-up hoodie half open over a white crop tank and joggers",
  linen: "a sleeveless white linen top with a square neckline and wide-leg white linen pants",
  silk: "a red silk blouse with the top buttons open and black jeans",
  breton: "a fitted navy striped Breton top and high-waisted jeans",
};
// rust: the rust-halter body as image 1 (CLOTHED_BODY "rust", today); none: no body picture (REFERENCE_NOBODY)
// Step 4 review (--review): nude (the nude front + DRESSED_FULL) and neutral (body-neutral, v10 in a gray tank and leggings)
function applyVariant(name) {
  R.CLOTHED_BODY = ["none", "nude", "neutral"].includes(name) ? name : "rust";
  R.OUTFIT_BODY = true;
}
const pic = (words) => async (env, ledger) => {
  const said = W.picWords(words);
  if (!W.mayDraw(said)) return { refused: true };
  const { prompt, location, night } = W.customPicture(said);
  return W.drawPicture(env, prompt, { location, night, ledger, custom: true });
};
const CASES = [
  ...Object.entries(OUTFITS).map(([k, text], i) => ({
    id: `outfit-${k}`, variants: ["rust", "none"], seeds: SEEDS,
    run: pic(i % 2 === 0 ? `mirror selfie in her bedroom, wearing ${text}` : `chest-up selfie in her living room, wearing ${text}`),
  })),
  ...Object.keys(R.STYLE_PICTURES).filter((k) => k.startsWith("outfit-")).map((k) => ({
    id: `picture-${k}`, variants: ["picture"], seeds: SEEDS, run: pic(`on the couch, wearing ${R.STYLE_PICTURES[k]}`),
  })),
  { id: "back-belfie-bedroom", variants: ["back"], seeds: [101], run: pic("nude belfie in the bedroom mirror") },
  { id: "back-over-shoulder", variants: ["back"], seeds: [101], run: pic("naked, from behind, looking over her shoulder") },
  { id: "back-mirror-tier", variants: ["back"], seeds: [101], run: pic("nude, mirror selfie from behind in the bedroom") },
  { id: "back-bent-over", variants: ["back"], seeds: [101], run: pic("naked, bent over the bed, from behind") },
  { id: "regress-nude-mirror", variants: ["rust"], seeds: [101, 202], run: pic("naked, standing in front of the bedroom mirror") },
  { id: "regress-doggy", variants: ["rust"], seeds: [202], run: pic("doggy style") },
];

// --review (Step 4 review, Opus): the two modes the bench left out, at seed 101 (the seed of the owner's "slimmer" read and the Breton
// leak), and the crop-length leak (Breton, silk) repeated at a fresh seed 303 in rust, none and neutral. 18 pictures.
if (process.argv.includes("--review")) {
  const six = CASES.slice(0, 6);
  const repeat = CASES.filter((c) => c.id === "outfit-breton" || c.id === "outfit-silk");
  CASES.splice(0, CASES.length, ...six.map((c) => ({ ...c, variants: ["nude", "neutral"], seeds: [101] })), ...repeat.map((c) => ({ ...c, id: `${c.id}-again`, variants: ["rust", "none", "neutral"], seeds: [303] })));
  SEEDS.push(303);
}

// --nude-check (owner's yes to the fuller build, 2026-10-11): CLOTHED_BODY "nude" where the Step 4 review had not tried it. The six
// outfits at seed 202 (same case index and seed as Haiku's rust and none pictures at 202: the same random picks), lingerie (her
// selfie asking for it), /nsfw Off (Runware's content check on: a thin white day top, a lace bodysuit) and two in-person scenes whose
// narration names no clothes (the day's home outfit). nude and none side by side at seed 101; Off in nude only. 18 pictures.
if (process.argv.includes("--nude-check")) {
  const WARM = { day: "2026-10-11", band: "WARM", home: "a tight ribbed white tank top and soft gray cotton shorts", out: "a fitted black ribbed tank top and high-waisted jeans" };
  const MILD = { day: "2026-10-11", band: "MILD", home: "a gray knit cardigan sliding off one shoulder over a fitted black tank top and soft gray sweatpants", out: "a black leather jacket over a fitted gray tee and jeans" };
  const selfie = (want, opts = {}) => (env, ledger) => W.startPicture(env, ledger, "selfie", want, { asked: "", ...opts });
  const scene = (text, dayWear) => (env, ledger) => W.startPicture(env, ledger, "scene", text, { dayWear });
  const six = CASES.slice(0, 6).map((c) => ({ ...c, variants: ["nude"], seeds: [202] }));
  CASES.splice(0, CASES.length, ...six,
    { id: "lingerie-lace-bodysuit", variants: ["nude", "none"], seeds: [101], run: selfie("in my black lace bodysuit, sitting on my bed", { asked: "send me a lingerie pic" }) },
    { id: "lingerie-satin-slip", variants: ["nude", "none"], seeds: [101], run: selfie("in my black satin slip with thin straps, by the bedroom mirror", { asked: "send me a lingerie pic" }) },
    { id: "lingerie-cami-shorts", variants: ["nude", "none"], seeds: [101], run: selfie("in a black lace cami and matching silk shorts, lying on my bed", { asked: "send me a lingerie pic" }) },
    { id: "off-day-white-tank", variants: ["nude"], seeds: [101], run: selfie(null, { dayWear: WARM, nsfw: "off" }) },
    { id: "off-lace-bodysuit", variants: ["nude"], seeds: [101], run: selfie("in my black lace bodysuit, sitting on my bed", { asked: "send me a lingerie pic", nsfw: "off" }) },
    { id: "scene-couch-mild", variants: ["nude", "none"], seeds: [101], run: scene("*She curls up on the couch under the soft throw blanket, knees tucked to her chest, laughing at the movie on the television, a bowl of popcorn balanced on her lap.* That's the worst movie ever made.", MILD) },
    { id: "scene-bed-warm", variants: ["nude", "none"], seeds: [101], run: scene("*She sits on the edge of her bed in the lamplight, brushing out her long hair, and smiles slowly.* Come here.", WARM) },
  );
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
