// Writes tools/face/job.json to draw her fixed places (PICTURE.LOCATIONS in worker.js) as empty rooms, two
// tries each, 480x480 (the reference size klein takes). Pick one per place and save it as
// tools/face/places/<key>.jpg, then run node tools/face/build-places.mjs.
//   node tools/face/places.mjs                (every place)
//   node tools/face/places.mjs bedroom porch  (only those)
//   node tools/face/places.mjs --night        (the same rooms at night, drawn from places/<key>.jpg: save the pick
//                                              as places/<key>_night.jpg; prompts per the FLUX skill: klein wants
//                                              narrative prose, the subject first, the light described in detail)
import { writeFileSync } from "node:fs";
import { loadWorker } from "../test/load-worker.mjs";

const W = await loadWorker();
const L = W.CONFIG.PICTURE.LOCATIONS;
const night = process.argv.includes("--night");
const only = process.argv.slice(2).filter((a) => a !== "--night");
// at night ("deep shadow" drew living, kitchen and porch too dark to use, run 37156755166): where the light comes from in each place (its LOOK and its day picture); bathroom: already lamp-lit
const NIGHT_LIGHT = {
  bedroom: "the window is dark night blue behind the sheer curtains; the black iron bedside lamp is switched on, a warm amber pool of light over the rumpled white sheets and the cream throw, the floor mirror catching its glow",
  living: "the sash window is black with night; the paper floor lamp is switched on and the open laptop glows blue-white on the kitchen table, warm amber light across the shoeboxes of receipts, the small sofa and the cream plaster walls, the radiator in soft shadow",
  his_bedroom: "the window is dark; a warm ceiling light is on, the dark gray sheets in soft light, a faint orange streetlight glow through the half-open blinds",
  his_living: "a warm ceiling light is on and the TV screen glows softly, light on the gray couch and the coffee table",
  kitchen: "the small window over the sink is black with night; the warm under-cabinet lights are on, glowing on the counter, the herbs on the sill and the mugs on the open shelves",
  hallway: "the bare bulb on the slanted ceiling is switched on, warm yellow light on the two facing wooden doors and the worn floorboards, the back stairs going down into soft shadow",
  porch: "the string lights are on, small warm bulbs glowing along the white railings and the folding chair, the driveway below lit by an orange streetlight, the neighbors' houses and maples in deep blue darkness",
};
const keys = Object.keys(L).filter((k) => (!only.length || only.includes(k)) && (!night || NIGHT_LIGHT[k]));
const job = night ? {
  note: "Her fixed places at night, drawn from the day pictures: pick the one with the same room (walls, furniture, angle) and believable night light.",
  mode: "places-night",
  size: 640,
  labels: keys.map((k) => `${k}_night`),
  prompts: keys.map((k) => `The same room from image 0, with exactly the same walls, furniture, window and camera angle, now late at night: ${NIGHT_LIGHT[k]}. The room is warmly lit and easy to see, only its corners in soft shadow, a cozy lived-in mood, the room empty. Realistic phone photo taken at night, natural grain.`),
  refs: keys.map((k) => [`tools/face/places/${k}.jpg`]),
  per_prompt: 2,
  describe: false,
  day_neurons: 12000, // Workers Paid: the owner's cap is AI_BUDGET.DAILY_NEURONS 28,000; this leaves the bot 16,000
} : {
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
