// Writes tools/face/job.json for a pictures v3 grid: every shot type x tier, each prompt composed exactly
// the way the bot composes it (composePicture in worker.js, her reference face as image 0). Pushing the
// job runs .github/workflows/face.yml, which draws them with FLUX.2 klein and pushes them to face-candidates.
//   node tools/face/shots.mjs
import { writeFileSync } from "node:fs";
import { loadWorker } from "../test/load-worker.mjs";

const W = await loadWorker();
const P = W.CONFIG.PICTURE;
const labels = [];
const prompts = [];
let n = 0;
for (const tier of ["everyday", "flirty", "boudoir"]) {
  for (const shot of W.tierShots(tier)) {
    const hour = shot === "golden" ? 17 : [10, 14, 19, 23][n++ % 4]; // a spread of times of day (light)
    const pic = W.composePicture({ tier, shot, hour });
    labels.push(`${tier}/${shot}${pic.angle ? `/${pic.angle}` : ""} @${hour}h`);
    prompts.push(pic.prompt.replace("{who}", P.REFERENCE));
  }
}
const job = {
  note: "Pictures v3 grid: every shot type x tier, prompts from composePicture (worker.js). Check each: same face as the reference, clearly adult, tier right, phone rule right (selfie: no phone or hand; mirror: an iPhone), no nudity.",
  mode: "shots",
  reference: "tools/face/reference.jpg",
  size: P.SIZE,
  labels,
  prompts,
  per_prompt: 1,
  describe: true,
};
writeFileSync(new URL("./job.json", import.meta.url), JSON.stringify(job, null, 2) + "\n");
console.log(labels.map((l, i) => `${String(i + 1).padStart(2, "0")} ${l}`).join("\n"));
