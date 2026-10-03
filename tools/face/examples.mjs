// Writes tools/face/job.json: a picked set of example pictures for the owner, composed exactly the way the
// bot composes them (composePicture + her fixed places), plus lingerie wordings to probe Cloudflare's prompt
// filter (3030: a refused prompt is not drawn and costs nothing). Pushing the job runs face.yml.
//   node tools/face/examples.mjs
import { writeFileSync } from "node:fs";
import { loadWorker } from "../test/load-worker.mjs";
import { forKlein } from "./compose.mjs";

const W = await loadWorker();
const P = W.CONFIG.PICTURE;
const set = [
  // round 2 (2026-10-03): the room behind her, not a wide room shot; the stronger body; FILTER_WORDS
  ["everyday/mirror, her bathroom", { tier: "everyday", shot: "mirror", words: "a fitted black t-shirt and jeans, bathroom mirror", hour: 10 }],
  ["everyday/cozy, sofa with Basbousa", { tier: "everyday", shot: "cozy", words: "curled up on the sofa with Basbousa in an oversized gray knit cardigan", hour: 20 }],
  ["flirty/waist, her bedroom", { tier: "flirty", shot: "waist", words: "a black bodycon mini dress, bedroom mirror", hour: 22 }],
  ["flirty/legs, her bed", { tier: "flirty", shot: "legs", words: "an oversized gray tee that barely reaches mid-thigh, on the bed", hour: 23 }],
  ["boudoir/mirror: red satin bra and panties (reworded)", { tier: "boudoir", shot: "mirror", words: "a red satin bra and matching panties, bedroom mirror", hour: 23 }],
  ["boudoir/mirror-back: bralette and thong (reworded)", { tier: "boudoir", shot: "mirror-back", words: "a black lace bralette and a matching thong, bedroom mirror", hour: 23 }],
  ["boudoir/mirror-back: g-string bikini (reworded)", { tier: "boudoir", shot: "mirror-back", words: "a black g-string bikini, bathroom mirror", hour: 13 }],
  ["boudoir/waist: lace two-piece (new wardrobe)", { tier: "boudoir", shot: "waist", words: "a matching black lace two-piece set, her midriff bare, bedroom mirror", hour: 23 }],
];
const labels = [], prompts = [], refs = [];
for (const [label, args] of set) {
  const k = forKlein(W, W.composePicture(args));
  labels.push(label);
  prompts.push(k.prompt);
  refs.push(k.refs);
}
writeFileSync(new URL("./job.json", import.meta.url), JSON.stringify({
  note: "Examples for the owner (2026-10-03): Lebanese Reem in Belmont, her fixed places, curvier body, 768x1024; probes show which lingerie wordings Cloudflare's filter lets through.",
  mode: "examples2", reference: "tools/face/reference.jpg", width: P.WIDTH, height: P.HEIGHT, square: false,
  labels, prompts, refs, per_prompt: 1, describe: false,
}, null, 2) + "\n");
console.log(labels.map((l, i) => `${String(i + 1).padStart(2, "0")} ${l}${refs[i].length ? " +place" : ""}`).join("\n"));
