// Golden picture plans (Step 1, docs/WORKPLAN.md): node tools/test/picture-plans.mjs [--check | --write]
// Runs the bot's own picture code (startPicture, lookPicture, customPicture, drawPicture) with the network stubbed: every
// Runware request is recorded as sent and answered with a tiny JPEG, so nothing is paid. The clock is frozen and
// Math.random is seeded per case (mulberry32, seed = case index), so the same code always gives the same plans.
// --write rewrites picture-plans.golden.json; --check compares and prints each difference (exit 1 on any).
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadWorker } from "./load-worker.mjs";
import * as FACE from "../../face.js";
import * as PLACES from "../../places.js";

const GOLDEN = join(dirname(fileURLToPath(import.meta.url)), "picture-plans.golden.json");
const FROZEN = Date.parse("2026-10-11T18:00:00Z"); // 14:00 in Boston
const TINY_JPEG = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==";

// The clock: `new Date()` and Date.now() read `frozen`; a case may move it (`at`)
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

// Seeded Math.random (mulberry32)
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Every known reference picture by the hash of its bytes: a sent reference maps back to a name
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
function knownReferences() {
  const names = new Map();
  const add = (name, b64) => {
    if (b64 && !names.has(sha(Buffer.from(b64, "base64")))) names.set(sha(Buffer.from(b64, "base64")), name);
  };
  add("face-1x", FACE.FACE_JPEG_BASE64);
  add("face-2x", FACE.FACE_2X_JPEG_BASE64);
  add("body-cloudflare", FACE.BODY_JPEG_BASE64);
  add("body-v10", FACE.BODY_NUDE_JPEG_BASE64);
  add("body-v10-back", FACE.BODY_BACK_JPEG_BASE64);
  add("body-v10-clothed", FACE.BODY_CLOTHED_JPEG_BASE64);
  for (const [k, v] of Object.entries(FACE.STYLE_JPEG_BASE64 || {})) add(`style:${k}`, v);
  for (const [k, v] of Object.entries(PLACES.PLACE_JPEG_BASE64 || {})) add(`place:${k}`, v);
  return names;
}
const REFERENCE_NAMES = knownReferences();
const nameOf = (dataUrl) => {
  const bytes = Buffer.from(String(dataUrl).split(",")[1] || "", "base64");
  return REFERENCE_NAMES.get(sha(bytes)) || `unknown:${sha(bytes).slice(0, 12)}`;
};

// What the current case has sent (reset per case)
let sent = { runware: [], cloudflare: [], failRunware: false };

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  if (u === "https://api.runware.ai/v1") {
    const tasks = JSON.parse(init.body);
    for (const t of tasks) {
      sent.runware.push({
        model: t.model,
        positivePrompt: t.positivePrompt,
        width: t.width,
        height: t.height,
        lora: t.lora || [],
        steps: t.steps ?? null,
        CFGScale: t.CFGScale ?? null,
        acceleration: t.acceleration ?? null,
        refs: (t.inputs?.referenceImages || []).map(nameOf),
      });
    }
    if (sent.failRunware) return json({ data: [], errors: [{ code: "stub", message: "stub failure (golden case)" }] }, 500);
    return json({ data: tasks.map((t) => ({ taskUUID: t.taskUUID, imageBase64Data: TINY_JPEG, cost: 0.0025 })), errors: [] });
  }
  throw new Error(`picture-plans: unexpected request to ${u}`);
};

function stubEnv() {
  const kv = { get: async () => null, put: async () => {}, delete: async () => {}, list: async () => ({ keys: [] }) };
  const ai = {
    run: async (model, input) => {
      if (input && input.multipart) {
        // Workers AI's klein route: the multipart form (prompt, width, height), read back
        const form = await new Response(input.multipart.body, { headers: { "content-type": input.multipart.contentType } }).formData();
        sent.cloudflare.push({ model, prompt: form.get("prompt"), width: Number(form.get("width")), height: Number(form.get("height")) });
        return { image: TINY_JPEG };
      }
      return { response: "stub" };
    },
  };
  return { RUNWARE_API_KEY: "stub-key", REEM_KV: kv, AI: ai };
}

// Each case: the bot's own call for that picture (the chat's parts that name it are the arguments)
const cases = (W) => {
  const pic = (args) => async (env, ledger) => {
    const words = W.picWords(args); // /pic: his words, about her
    if (!W.mayDraw(words)) return { refused: true };
    const { prompt, location, night } = W.customPicture(words);
    return W.drawPicture(env, prompt, { location, night, ledger, custom: true });
  };
  const selfie = (want, at = null) => ({ at, run: (env, ledger) => W.startPicture(env, ledger, "selfie", want, { asked: want || "" }) });
  return [
    { name: "selfie everyday kitchen (composePicture)", run: selfie("making coffee in my kitchen, gray cardigan").run },
    { name: "selfie no words (cozy)", run: selfie(null).run },
    { name: "mirror bedroom at night", at: "2026-10-12T04:30:00Z", run: selfie("mirror selfie in the bedroom, late at night").run },
    { name: "flirty mirror-back", run: selfie("flirty, mirror selfie from behind in the bedroom").run },
    { name: "boudoir black lace bodysuit", run: selfie("a black lace bodysuit").run },
    { name: "/pic messy bun on the porch", run: pic("messy bun, red lipstick, black turtleneck, on the porch") },
    { name: "/pic olive-cardigan outfit", run: pic("wearing the olive cardigan and jeans, at home") },
    { name: "/pic hairstyle with a picture", run: pic("with her hair in a messy bun") },
    { name: "/pic naked on the bed", run: pic("naked on the bed") },
    { name: "/pic close-up of her pussy, white t-shirt", run: pic("close-up of her pussy, wearing a white t-shirt") },
    { name: "/pic pussy close up, covered breasts", run: pic("pussy close up, covered breasts") },
    { name: "/pic topless, jeans on, mirror selfie", run: pic("topless, jeans on, mirror selfie") },
    { name: "/pic blowjob", run: pic("blowjob") },
    { name: "/pic deepthroat", run: pic("deepthroat") },
    { name: "/pic riding the man", run: pic("riding the man") },
    { name: "/pic reverse cowgirl", run: pic("reverse cowgirl") },
    { name: "/pic missionary", run: pic("missionary") },
    { name: "/pic doggy style", run: pic("doggy style") },
    { name: "/pic anal", run: pic("anal") },
    { name: "/pic missionary anal", run: pic("missionary anal") },
    { name: "selfie camera flash in the bedroom mirror", run: selfie("camera flash selfie in the bedroom mirror").run },
    { name: "/look alone: car window at night", run: (env, ledger) => W.lookPicture(env, ledger, "the view out of my car window at night", false) },
    { name: "/look with her: couch, old cardigan", run: (env, ledger) => W.lookPicture(env, ledger, "She sits on his couch in her old cardigan, laughing", true) },
    { name: "/pic nude belfie in the bedroom mirror", run: pic("nude belfie in the bedroom mirror") },
    { name: "Runware fails twice: Cloudflare draws", fail: true, run: selfie("in the kitchen, gray cardigan").run },
  ];
};

async function runAll(W) {
  const out = {};
  const list = cases(W);
  for (const [i, c] of list.entries()) {
    frozen = c.at ? Date.parse(c.at) : FROZEN;
    Math.random = mulberry32(i);
    sent = { runware: [], cloudflare: [], failRunware: !!c.fail };
    const env = stubEnv();
    const ledger = await W.loadLedger(env);
    ledger.rwUsd = 0;
    const res = await c.run(env, ledger).catch((e) => ({ error: String(e && e.message || e).slice(0, 200) }));
    out[c.name] = {
      runware: sent.runware,
      cloudflare: sent.cloudflare,
      drawn: !!res && !res.refused && !res.error,
      ...(res && res.refused ? { refused: "mayDraw" } : {}),
      ...(res && res.error ? { error: res.error } : {}),
    };
  }
  return out;
}

const stable = (v) => (Array.isArray(v) ? v.map(stable) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, stable(v[k])])) : v);

// Readable leaf differences: "case · path: old -> new"
function differences(a, b, path, out) {
  if (JSON.stringify(a) === JSON.stringify(b)) return out;
  const isObj = (x) => x && typeof x === "object";
  if (isObj(a) && isObj(b) && Array.isArray(a) === Array.isArray(b)) {
    const keys = Array.isArray(a) ? [...Array.from({ length: Math.max(a.length, b.length) }, (_, i) => i)] : [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
    for (const k of keys) differences(a[k], b[k], `${path}.${k}`, out);
    return out;
  }
  out.push(`  ${path}:\n     - ${JSON.stringify(a)}\n     + ${JSON.stringify(b)}`);
  return out;
}

const mode = process.argv.includes("--write") ? "write" : "check";
const W = await loadWorker();
const actual = stable(await runAll(W));
const text = JSON.stringify({ _note: "Golden picture plans (tools/test/picture-plans.mjs). Regenerate with --write only for an intended change.", cases: actual }, null, 2) + "\n";

if (mode === "write") {
  writeFileSync(GOLDEN, text);
  console.log(`wrote ${Object.keys(actual).length} cases to ${GOLDEN}`);
  process.exit(0);
}

let golden;
try {
  golden = JSON.parse(readFileSync(GOLDEN, "utf8")).cases;
} catch (e) {
  console.log(`FAIL no golden file (${e.message}): run node tools/test/picture-plans.mjs --write`);
  process.exit(1);
}
const lines = [];
for (const name of new Set([...Object.keys(golden), ...Object.keys(actual)])) {
  if (!golden[name] || !actual[name]) {
    lines.push(`${name}: ${golden[name] ? "missing from this run" : "new case, not in the golden"}`);
    continue;
  }
  for (const d of differences(golden[name], actual[name], "", [])) lines.push(`${name}${d}`);
}
if (lines.length) {
  console.log(lines.join("\n"));
  console.log(`FAIL ${lines.length} difference(s) from the golden`);
  process.exit(1);
}
console.log(`ok   ${Object.keys(actual).length} cases match the golden`);
process.exit(0);
