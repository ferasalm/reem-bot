// Body words bench (Fix round 2, F2, 2026-10-13; docs/WORKPLAN.md "Fix round 2"): today's body lines (REV, the commit before F2)
// against PICTURE.BODY_WORDS (the working tree), through the bot's own picture code. Runware (klein 9B, /nsfw On): three cases x
// seeds 101 and 202 x two variants = 12 pictures. The Cloudflare case (a clothed picture at /nsfw Off) has no network here:
// --cf plans it with the bot's own code and writes tools/face/job.json, which face.yml draws (klein 4B, 2 prompts x 2 draws).
//   node tools/face/bodywords-bench.mjs --dry                no network, $0: every run's prompt and references
//   NODE_USE_ENV_PROXY=1 node tools/face/bodywords-bench.mjs --run <outdir>   paid: Runware, stops at $0.10 (BUDGET_USD)
//   node tools/face/bodywords-bench.mjs --cf                 writes tools/face/job.json (no network)
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadWorker } from "../test/load-worker.mjs";
import * as FACE from "../../face.js";
import * as PLACES from "../../places.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REV = process.env.REV || "3d1ab33"; // the commit before F2: its body lines are "today"
const MODE = process.argv.includes("--cf") ? "cf" : process.argv.includes("--run") ? "run" : "dry";
const OUT = MODE === "run" ? process.argv[process.argv.indexOf("--run") + 1] : null;
if (MODE === "run" && !OUT) throw new Error("usage: --dry | --run <outdir> | --cf");
const PACE_MS = 4000; // Runware answers 502 when calls come closer than ~4 s
const SEEDS = [101, 202];
const BUDGET_USD = Number(process.env.BUDGET_USD) || 0.1;
const FROZEN = Date.parse("2026-10-13T18:00:00Z"); // 14:00 in Boston
const TINY_JPEG = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==";

// The clock: `new Date()` reads `frozen`, so the random picks and the day's moods are the same in every run
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
for (const [k, v] of Object.entries(FACE.STYLE_JPEG_BASE64 || {})) addRef(`style:${k}`, v);
for (const [k, v] of Object.entries(PLACES.PLACE_JPEG_BASE64 || {})) addRef(`place:${k}`, v);
const nameOf = (dataUrl) => {
  const hash = sha(Buffer.from(String(dataUrl).split(",")[1] || "", "base64"));
  return REFERENCE_NAMES.get(hash) || `unknown:${hash.slice(0, 12)}`;
};

// Today's worker: REV's worker.js, loaded the way tools/test/load-worker.mjs loads the working tree's
async function loadRev(rev) {
  const src = execFileSync("git", ["show", `${rev}:worker.js`], { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28 });
  const dir = mkdtempSync(join(tmpdir(), "bodywords-"));
  writeFileSync(join(dir, "worker.mjs"), `${src}\nexport { CONFIG, picWords, customPicture, mayDraw, drawPicture };\n`);
  for (const f of ["face.js", "places.js", "mp3.js", "studio.js"]) copyFileSync(join(ROOT, f), join(dir, f));
  return import(pathToFileURL(join(dir, "worker.mjs")).href);
}
const OLD = await loadRev(REV); // V0: today's body lines
const NEW = await loadWorker(); // V1: PICTURE.BODY_WORDS
const VARIANTS = { V0: OLD, V1: NEW };

// Her body through the bot's own /pic path: his words, no day outfit (his words name the clothes)
const CASES = [
  { id: "clothed-front", words: "a mirror selfie, standing, full body, a fitted black tank top and high-waisted jeans, her arms visible" },
  { id: "nude-front", words: "naked, standing, a mirror selfie in the bedroom mirror" },
  { id: "nude-back", words: "a belfie, naked, standing in the bedroom" },
];
const CF_CASE = { id: "clothed-front-off", words: CASES[0].words }; // the same words at /nsfw Off: Cloudflare klein
const plan = (M, words, level) => {
  const said = M.picWords(words);
  if (!M.mayDraw(said, level)) return null;
  return M.customPicture(said, undefined, null, level); // { prompt, location, night }
};

// Runware through the bot's own code: the fetch wrapper sets the run's seed and records each call
let current = null;
let spent = 0;
const realFetch = globalThis.fetch;
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
globalThis.fetch = async (url, init = {}) => {
  if (String(url) !== "https://api.runware.ai/v1") throw new Error(`bodywords-bench: unexpected request to ${url}`);
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
  if (MODE !== "run") {
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

// Cloudflare must not answer here: this bench counts Runware only (the Cloudflare case is planned by --cf)
const env = {
  RUNWARE_API_KEY: "proxy-injected",
  REEM_KV: { get: async () => null, put: async () => {}, delete: async () => {}, list: async () => ({ keys: [] }) },
  AI: { run: async () => { throw new Error("bodywords-bench: Cloudflare is not called here"); } },
};

if (MODE === "cf") {
  // Plan the Cloudflare case for both variants and both seeds (nothing drawn). The random picks are seeded as in the Runware runs
  // (the same seed and case index), so the two variants of a seed share every pick. Then write the job face.yml draws, one draw per prompt
  const R = NEW.CONFIG.PICTURE.RUNWARE;
  const FILES = { "face-2x": "tools/face/reference-2x.jpg", [`body-${R.BODY_CLOTHED}`]: "tools/face/body-clothed.jpg" };
  const CF_INDEX = CASES.indexOf(CF_CASE) >= 0 ? CASES.indexOf(CF_CASE) : 0;
  const cf = [];
  for (const seed of SEEDS) {
    for (const [v, M] of Object.entries(VARIANTS)) {
      frozen = FROZEN;
      Math.random = mulberry32(seed * 100 + CF_INDEX);
      const p = plan(M, CF_CASE.words, "off");
      if (!p) throw new Error(`${v}: refused at /nsfw Off`);
      const out = await M.drawPicture(env, p.prompt, { location: p.location, night: p.night, ledger: { rwUsd: 0, rwFailed: 0 }, custom: true, nsfw: "off", planOnly: true });
      if (!out?.cloudflare) throw new Error(`${v}: no Cloudflare plan (is the route Runware at Off?)`);
      cf.push({ v, seed, ...out.cloudflare });
      console.log(`${v} s${seed} refs ${out.cloudflare.refs.join(", ")}\n  ${out.cloudflare.prompt}`);
    }
  }
  if (new Set(cf.map((x) => x.refs.join())).size !== 1) throw new Error("the variants send different references");
  const refFiles = cf[0].refs.map((n) => FILES[n] || (() => { throw new Error(`no file for reference ${n}`); })());
  for (const f of refFiles) if (!existsSync(join(ROOT, f))) throw new Error(`missing ${f}`);
  const refs = {};
  cf.forEach((_, i) => {
    refs[i] = refFiles.slice(1);
  });
  const job = {
    note: "2026-10-13 Fix round 2 F2: Cloudflare klein 4B at /nsfw Off, the clothed mirror selfie: today's body lines (V0 = REV, the words before F2) vs PICTURE.BODY_WORDS (V1), two seeds each; the bot's own random picks per seed, the same for both variants. The bot's own prompts (drawPicture planOnly); references: her face (image 0) and the clothed body",
    mode: "2026-10-13-body-words",
    width: NEW.CONFIG.PICTURE.WIDTH,
    height: NEW.CONFIG.PICTURE.HEIGHT,
    square: false,
    keep_full: true,
    max_neurons: 1000,
    day_neurons: 20000,
    reference: refFiles[0],
    refs,
    per_prompt: 1,
    labels: cf.map((x) => `off clothed mirror selfie, ${x.v === "V0" ? "V0 today's body lines" : "V1 PICTURE.BODY_WORDS"}, seed ${x.seed}`),
    prompts: cf.map((x) => x.prompt),
  };
  writeFileSync(join(ROOT, "tools/face/job.json"), JSON.stringify(job, null, 2) + "\n");
  console.log(`wrote tools/face/job.json: ${job.prompts.length} prompts, one draw each, size ${job.width}x${job.height}, refs ${cf[0].refs.join(", ")}`);
  process.exit(0);
}

// The runs: case by case, seed by seed, today then the new words (the pairs finish together)
const runs = [];
CASES.forEach((c, ci) => {
  for (const seed of SEEDS) for (const v of Object.keys(VARIANTS)) runs.push({ c, ci, seed, v, id: `${c.id}-${v}-s${seed}` });
});
const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let first = true;
for (const run of runs) {
  const row = { id: run.id, case: run.c.id, variant: run.v, seed: run.seed, file: null, calls: [], cost: 0, error: "", budgetStop: false };
  if (MODE === "run" && spent >= BUDGET_USD) {
    row.budgetStop = true;
    row.error = `stopped: spent $${spent.toFixed(4)} >= $${BUDGET_USD}`;
    results.push(row);
    continue;
  }
  if (MODE === "run" && !first) await sleep(PACE_MS);
  first = false;
  frozen = FROZEN;
  Math.random = mulberry32(run.seed * 100 + run.ci); // the same random picks for both variants of this case
  current = { seed: run.seed, calls: [], bytes: null };
  const ledger = { rwUsd: 0, rwFailed: 0, usd: 0, recent: [], shots: [] };
  const M = VARIANTS[run.v];
  try {
    const p = plan(M, run.c.words, "on");
    if (!p) row.error = "refused by mayDraw";
    else await M.drawPicture(env, p.prompt, { location: p.location, night: p.night, ledger, custom: true, nsfw: "on" });
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
  if (MODE === "run" && current.bytes) {
    row.file = `${run.id}.jpg`;
    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, row.file), Buffer.from(current.bytes, "base64"));
  }
  results.push(row);
  const line = `${run.id}  ${row.width}x${row.height}  refs ${row.refs.join(",")}  loras ${row.loras.map((l) => `${l.model.replace("ferasalm:", "")}@${l.weight}`).join(" ") || "none"}  ${row.file ? "picture" : row.error || "no picture"}  $${row.cost.toFixed(4)}`;
  console.log(line);
}
const summary = { mode: MODE, rev: REV, budgetUsd: BUDGET_USD, spentUsd: Number(spent.toFixed(6)), pictures: results.filter((r) => r.file).length, runs: results };
if (MODE === "run") {
  writeFileSync(join(OUT, "results.json"), JSON.stringify(summary, null, 2) + "\n");
  writeFileSync(join(OUT, "plan.txt"), results.map((r) => `${r.id}\n  ${r.prompt}`).join("\n\n") + "\n");
  console.log(`\n${summary.pictures} pictures, spent $${summary.spentUsd} of $${BUDGET_USD}; wrote ${OUT}/results.json`);
} else {
  for (const r of results) console.log(`${r.id}\n  refs ${r.refs.join(",")}\n  ${r.prompt}`);
}
