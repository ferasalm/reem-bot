// Replays logged pictures (tools/face/replay-cases.json: D1 rows' prompt, refs, LoRAs, seed) on Runware klein 9B with one change per
// variant (2026-10-15: clothed scene pictures that didn't look like her): R0 as logged, R1 no Anatomy Fixer, R2 no place picture (its
// sentence out), R3 no LoRAs, R4 no Anatomy Fixer and no place picture; F1 her face named in words (FACE_WORDS), F2 FACE_FULL (a head-and-
// shoulders picture file) in place of face-2x, F3 both; P1 no PHOTO line ("Unretouched iPhone photo..."), P2 no night-light sentence, P3 no
// "(not image 0's expression or head tilt)", P4 "Realistic candid photo:" for the scene lead, P5 P1-P4 together; G1 her face (G_WORDS) right
// after "The woman from image 0", before the body; G2 G1 + her face lit (G_LIGHT).
//   NODE_USE_ENV_PROXY=1 node tools/face/replay-bench.mjs <outdir> [R0,R1]   paid: ~$0.006-0.008 a picture, stops at BUDGET_USD ($0.10)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as FACE from "../../face.js";
import * as PLACES from "../../places.js";

const OUT = process.argv[2];
if (!OUT) throw new Error("usage: replay-bench.mjs <outdir> [variants]");
mkdirSync(OUT, { recursive: true });
const ONLY = process.argv[3] ? process.argv[3].split(",") : null;
const BUDGET_USD = Number(process.env.BUDGET_USD) || 0.1;
const DIR = dirname(fileURLToPath(import.meta.url));
const CASES = JSON.parse(readFileSync(join(DIR, "replay-cases.json"), "utf8"));
const REF = {
  "face-2x": FACE.FACE_2X_JPEG_BASE64,
  "body-v12": FACE.BODY_NUDE_JPEG_BASE64,
  "body-v12-back": FACE.BODY_BACK_JPEG_BASE64,
  "body-v12-clothed": FACE.BODY_CLOTHED_JPEG_BASE64,
  // the v12 rows replay on today's bodies (v13 since 2026-10-15)
  "body-v13": FACE.BODY_NUDE_JPEG_BASE64,
  "body-v13-back": FACE.BODY_BACK_JPEG_BASE64,
  "body-v13-clothed": FACE.BODY_CLOTHED_JPEG_BASE64,
};
const refB64 = (n) => REF[n] || (n.startsWith("place:") && PLACES.PLACE_JPEG_BASE64[n.slice(6)]) || (n.startsWith("style:") && FACE.STYLE_JPEG_BASE64[n.slice(6)]) || (() => { throw new Error(`no reference ${n}`); })();
const FACE_WORDS = process.env.FACE_WORDS || "Her face as in image 0: thick dark arched brows, almond-shaped hazel-green eyes with black winged eyeliner, a soft rounded face with full cheeks and a defined jaw, full lips.";
const FACE_FULL = process.env.FACE_FULL ? readFileSync(process.env.FACE_FULL).toString("base64") : null;
if (FACE_FULL) REF["face-full"] = FACE_FULL;
const G_WORDS = process.env.G_WORDS || "her face exactly image 0's: thick dark arched brows, light hazel-green eyes, clearly green, with black winged eyeliner, a soft rounded face with full cheeks and a defined jaw, full lips";
const G_LIGHT = process.env.G_LIGHT || " The lamp light falls on her face, so her green eyes show.";
const PLACE_LINE = /\s*Behind her, her room as in image \d+, in this picture's own light\./;
const ANATOMY = "myaiprojectsqqq:3@2";
const VARIANTS = {
  R0: (c) => c,
  R1: (c) => ({ ...c, loras: Object.fromEntries(Object.entries(c.loras).filter(([k]) => k !== ANATOMY)) }),
  R2: (c) => ({ ...c, refs: c.refs.filter((r) => !r.startsWith("place:")), prompt: c.prompt.replace(PLACE_LINE, "") }),
  R3: (c) => ({ ...c, loras: {} }),
  R4: (c) => VARIANTS.R2(VARIANTS.R1(c)),
  F1: (c) => ({ ...c, prompt: c.prompt.replace(" She is 29, clearly an adult.", ` ${FACE_WORDS} She is 29, clearly an adult.`) }),
  F2: (c) => ({ ...c, refs: c.refs.map((r) => (r === "face-2x" ? "face-full" : r)) }),
  F3: (c) => VARIANTS.F2(VARIANTS.F1(c)),
  P1: (c) => ({ ...c, prompt: c.prompt.replace(/\s*Unretouched iPhone photo:[^]*$/, "") }),
  P2: (c) => ({ ...c, prompt: c.prompt.replace(/\s*It is the middle of the night:[^.]*\./, "") }),
  P3: (c) => ({ ...c, prompt: c.prompt.replace(" (not image 0's expression or head tilt)", "") }),
  P4: (c) => ({ ...c, prompt: c.prompt.replace(/^[^:]*:/, "Realistic candid photo:") }),
  P5: (c) => VARIANTS.P4(VARIANTS.P3(VARIANTS.P2(VARIANTS.P1(c)))),
  G1: (c) => ({ ...c, prompt: c.prompt.replace(/The woman from image 0, with exactly the same face,/, `The woman from image 0, ${G_WORDS}, with exactly the same face,`) }),
  G2: (c) => { const g = VARIANTS.G1(c); return { ...g, prompt: g.prompt.replace(/(It is the middle of the night:[^.]*\.)/, `$1${G_LIGHT}`) }; },
};
let spent = 0;
for (const [id, c] of Object.entries(CASES)) {
  if (id.startsWith("_")) continue;
  for (const [v, f] of Object.entries(VARIANTS)) {
    if (ONLY && !ONLY.includes(v)) continue;
    if (spent >= BUDGET_USD) { console.log(`stop: $${spent.toFixed(4)}`); break; }
    const x = f(c);
    const task = { taskType: "imageInference", taskUUID: crypto.randomUUID(), model: "runware:400@2", positivePrompt: x.prompt, width: x.width || 768, height: x.height || 1344, numberResults: 1, outputType: "base64Data", outputFormat: "JPG", includeCost: true, seed: x.seed, steps: 6, CFGScale: 2, acceleration: "none",
      inputs: { referenceImages: x.refs.map((n) => `data:image/jpeg;base64,${refB64(n)}`) } };
    const loras = Object.entries(x.loras).map(([model, weight]) => ({ model, weight }));
    if (loras.length) task.lora = loras;
    const res = await fetch("https://api.runware.ai/v1", { method: "POST", headers: { Authorization: "Bearer proxy-injected", "Content-Type": "application/json" }, body: JSON.stringify([task]) });
    const data = await res.json().catch(() => ({}));
    const d = (data.data || [])[0];
    spent += Number(d?.cost) || 0;
    if (d?.imageBase64Data) writeFileSync(join(OUT, `${id}-${v}.jpg`), Buffer.from(d.imageBase64Data, "base64"));
    console.log(`${id} ${v}: ${res.status} $${d?.cost} refs ${x.refs.join(",")} loras ${loras.map((l) => l.model).join(",")} ${(data.errors || []).map((e) => e.message).join(" ")}`);
    await new Promise((r) => setTimeout(r, 4000));
  }
}
console.log(`spent $${spent.toFixed(4)}`);
