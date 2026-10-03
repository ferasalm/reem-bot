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
  // round 4 (2026-10-03): ROOM without "the same light", no bathroom in body-length mirror shots
  ["boudoir/neckline at night: black lace bodysuit", { tier: "boudoir", shot: "neckline", words: "a black lace bodysuit, on the bed", hour: 23 }],
  ["flirty/waist at night (bedroom mirror)", { tier: "flirty", shot: "waist", words: "", hour: 22 }],
  ["everyday/cozy in the evening, sofa with Basbousa", { tier: "everyday", shot: "cozy", words: "curled up on the sofa with Basbousa, oversized gray knit cardigan", hour: 20 }],
  ["everyday/mirror in the morning (code picks the mirror)", { tier: "everyday", shot: "mirror", words: "", hour: 9 }],
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
  mode: "examples4", reference: "tools/face/reference.jpg", width: P.WIDTH, height: P.HEIGHT, square: false,
  labels, prompts, refs, per_prompt: 1, describe: false,
}, null, 2) + "\n");
console.log(labels.map((l, i) => `${String(i + 1).padStart(2, "0")} ${l}${refs[i].length ? " +place" : ""}`).join("\n"));
