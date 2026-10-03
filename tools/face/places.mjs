// Writes tools/face/job.json to draw her fixed places (PICTURE.LOCATIONS in worker.js) as empty rooms, two
// tries each, 480x480 (the reference size klein takes). Pick one per place and save it as
// tools/face/places/<key>.jpg, then run node tools/face/build-places.mjs.
//   node tools/face/places.mjs                (every place)
//   node tools/face/places.mjs bedroom porch  (only those)
import { writeFileSync } from "node:fs";
import { loadWorker } from "../test/load-worker.mjs";

const W = await loadWorker();
const L = W.CONFIG.PICTURE.LOCATIONS;
const only = process.argv.slice(2);
const keys = Object.keys(L).filter((k) => !only.length || only.includes(k));
const job = {
  note: "Her fixed places, empty: pick the best of each pair, matching LOOK, no people, believable as a real Boston-area apartment.",
  mode: "places",
  size: 640,
  labels: keys,
  prompts: keys.map((k) => `Realistic photo of an empty room, no people, wide shot at eye level, natural light, shot on a phone: ${L[k].LOOK}. Lived-in and real, not staged.`),
  per_prompt: 2,
  describe: false,
};
writeFileSync(new URL("./job.json", import.meta.url), JSON.stringify(job, null, 2) + "\n");
console.log(keys.join(", "));
