// Step C bench (picture overhaul, 2026-10-13): the picture writer's words vs today's template, through the bot's own picture code
// (Step B's harness). T = the template (WRITER off; /look: Step B's DeepSeek text as logged), W = the writer's answer as DeepSeek gave it
// in the free replay (tools/face/stepc-answers.json, from writer-replay run logs), returned by a stubbed Workers AI. Cases: her selfies
// from D1 rows 13 and 14 (two poses, two smiles, a phone), her in-person moments (the hurt scene, riding, the kitchen with him behind
// her: no template picture today), /look 484 and "PoV of spooning". Seeds 101 and 202; Math.random seeded by (seed, case).
//   node tools/face/stepc-bench.mjs --dry               no network, $0: every run's plan
//   NODE_USE_ENV_PROXY=1 node tools/face/stepc-bench.mjs --run <outdir>   paid: klein 9B on Runware, stops at $0.12 (BUDGET_USD)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
const ANSWERS = JSON.parse(readFileSync(new URL("./stepc-answers.json", import.meta.url), "utf8"));
let answer = null; // what the stubbed Workers AI says to the writer in this run
const her = (content) => ({ role: "assistant", content });
const him = (content) => ({ role: "user", content });

// her selfie: composePicture with her words (the D1 rows), then the template or the writer's clause
const selfie = (args, key) => async (env, ledger, v) => {
  const pic = W.composePicture({ hour: 14, level: "on", ...args });
  const use = v === "W" ? await W.writtenSelfie(env, pic, { history: [him("send me a pic")], level: "on" }) : pic;
  if (!use) return { refused: true, why: "writer answer unusable" };
  return W.drawPicture(env, use.prompt, { location: use.location, night: use.night, ledger, kind: "selfie", nsfw: "on" });
};
// her in-person moment: startPicture "scene" as the bot runs it (WRITER on for W)
const scene = (history, moment) => async (env, ledger) => {
  const drawn = await W.startPicture(env, ledger, "scene", moment, { history: [...history, her(moment)], nsfw: "on", source: "bench" });
  return drawn || { refused: true, why: "no picture (startPicture null)" };
};
// /look with her: T = Step B's logged DeepSeek text, W = the new LOOK.PROMPT's answer
const look = (oldText) => async (env, ledger, v) => {
  const text = v === "W" ? answer : oldText;
  if (!text) return { refused: true, why: "no text" };
  return W.lookPicture(env, ledger, text, true, null, "on");
};
const L484 = "The man sits on the edge of a bed, and she is right beside him, their shoulders touching. She leans toward him, her fingers resting on his jaw, her brow furrowed as she studies the cut above his eye. A glass of water and a blister pack sit on the nightstand, lit by a warm bedside lamp in the quiet room.";
const KITCHEN = "*You wrap your arms around her waist and she leans back into you, stirring the pot, her black ribbed tank top and gray sweatpants dusted with flour.* \"you're in my way.\" *She tilts her head so you can kiss her neck.*";
const HURT = "*She sits beside you, close, her old gray cardigan wrapped tight over a simple black top, and tips your chin toward the bedside lamp. A glass of water and a blister pack wait on the nightstand.* \"a scratch. sure.\" *Her thumb hovers near the cut above your brow, her face pinched with worry.*";
const RIDING = "*She rides you slowly, her hands braced on your chest, head thrown back, hair spilling down her back.* \"fuck—right there.\"";
const CASES = [
  { id: "s13-counter", run: selfie({ tier: "everyday", shot: "counter-sit", words: "she's leaning against the kitchen counter, one leg bent up, wearing her father's old gray cardigan over a black cami, hair messily twisted up with a pencil, phone in hand, a small smirk" }) },
  { id: "s14-close", run: selfie({ tier: "everyday", shot: "close", words: "biting back a smile, looking down at her phone, hair falling forward, a small smile at the corner of her mouth" }) },
  { id: "c-hurt", run: scene([him("*sits on the edge of your bed* it's just a scratch")], HURT) },
  { id: "c-riding", run: scene([her("*She straddles you on the sofa, already naked, guiding you inside her.*"), him("*grabs your hips*")], RIDING) },
  { id: "c-kitchen", run: scene([him("*comes up behind you at the stove*")], KITCHEN), wOnly: true },
  { id: "l484-hurt", run: look(L484) },
  { id: "l-spooning", run: look(""), wOnly: true },
];
const VARIANTS = { T: () => { P.WRITER.ON = false; }, W: () => { P.WRITER.ON = true; } };
const ONLY = String(process.env.ONLY || "").split(",").filter(Boolean);
const PICK = String(process.env.CASES || "").split(",").filter(Boolean);
const runs = [];
for (const v of Object.keys(VARIANTS).filter((k) => !ONLY.length || ONLY.includes(k)))
  CASES.forEach((c, ci) => {
    if (v === "T" && c.wOnly) return;
    if (PICK.length && !PICK.includes(c.id)) return;
    for (const seed of SEEDS) runs.push({ v, ci, seed, id: `${c.id}-${v}-s${seed}` });
  });

// Runware through the bot's own code: the fetch wrapper sets the run's seed and records each call
let current = null;
let spent = 0;
const realFetch = globalThis.fetch;
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
globalThis.fetch = async (url, init = {}) => {
  if (String(url) !== "https://api.runware.ai/v1") throw new Error(`stepc-bench: unexpected request to ${url}`);
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
  // Workers AI: only the writer's text answers (ANSWERS[case][seed]); Cloudflare pictures are never drawn here
  AI: { run: async (model, input) => {
    if (input && input.messages && answer) return { choices: [{ message: { content: answer } }] };
    throw new Error("stepc-bench: Cloudflare is not called");
  } },
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
  answer = run.v === "W" ? ((ANSWERS[c.id] || {})[run.seed] || (ANSWERS[c.id] || {}).any || null) : null;
  row.answer = answer;
  const ledger = { rwUsd: 0, rwFailed: 0, usd: 0, recent: [], shots: [] };
  try {
    const out = await c.run(env, ledger, run.v);
    if (out && out.refused) row.error = out.why || "refused";
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
