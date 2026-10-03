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
  // round 3 (2026-10-03): FILTER_WORDS as bodysuit / string bikini
  ["boudoir/mirror: 'red satin bra and matching panties'", { tier: "boudoir", shot: "mirror", words: "a red satin bra and matching panties, bedroom mirror", hour: 23 }],
  ["boudoir/mirror-back: 'black lace bralette and a matching thong'", { tier: "boudoir", shot: "mirror-back", words: "a black lace bralette and a matching thong, bedroom mirror", hour: 23 }],
  ["boudoir/mirror-back: 'black g-string bikini'", { tier: "boudoir", shot: "mirror-back", words: "a black g-string bikini, bathroom mirror", hour: 13 }],
  ["boudoir/neckline: her own wardrobe", { tier: "boudoir", shot: "neckline", words: "a black lace bodysuit, on the bed", hour: 23 }],
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
  mode: "examples3", reference: "tools/face/reference.jpg", width: P.WIDTH, height: P.HEIGHT, square: false,
  labels, prompts, refs, per_prompt: 1, describe: false,
}, null, 2) + "\n");
console.log(labels.map((l, i) => `${String(i + 1).padStart(2, "0")} ${l}${refs[i].length ? " +place" : ""}`).join("\n"));
