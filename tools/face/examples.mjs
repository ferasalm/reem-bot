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
  ["everyday/close, her living room", { tier: "everyday", shot: "close", words: "in a black ribbed tank top at her desk in her living room", hour: 14 }],
  ["everyday/mirror, her bathroom", { tier: "everyday", shot: "mirror", words: "a fitted black t-shirt and jeans, bathroom mirror", hour: 10 }],
  ["everyday/golden, her porch", { tier: "everyday", shot: "golden", hour: 17 }],
  ["everyday/cozy, sofa with Basbousa", { tier: "everyday", shot: "cozy", words: "curled up on the sofa with Basbousa in an oversized gray knit cardigan", hour: 20 }],
  ["flirty/mirror-back, her bedroom", { tier: "flirty", shot: "mirror-back", words: "black high-waisted leggings and a cropped black top, bedroom mirror", hour: 21 }],
  ["flirty/waist, her bedroom", { tier: "flirty", shot: "waist", words: "a black bodycon mini dress, bedroom mirror", hour: 22 }],
  ["flirty/hallway, leaning on her doorframe", { tier: "flirty", shot: "selfie", words: "leaning on her doorframe in the hallway in a black satin slip dress", hour: 23 }],
  ["boudoir/selfie, on her bed", { tier: "boudoir", shot: "selfie", words: "lying on her bed in a black lace bodysuit, white sheets", hour: 23 }],
  ["probe: balconette bra + high-cut briefs", { tier: "boudoir", shot: "mirror", words: "a matching black lace balconette bra and high-cut lace briefs, bedroom mirror", hour: 23 }],
  ["probe: lace bra + panties", { tier: "boudoir", shot: "mirror", words: "a black lace bra and matching panties, bedroom mirror", hour: 23 }],
  ["probe: two-piece lace set", { tier: "boudoir", shot: "waist", words: "a matching black lace two-piece set, bedroom mirror", hour: 23 }],
  ["probe: bralette + thong, from behind", { tier: "boudoir", shot: "mirror-back", words: "a black lace bralette and a matching thong, bedroom mirror", hour: 23 }],
  ["probe: g-string bikini, from behind", { tier: "boudoir", shot: "mirror-back", words: "a black g-string bikini, bathroom mirror", hour: 13 }],
  ["probe: red satin bra + panties", { tier: "boudoir", shot: "selfie", words: "a red satin bra and matching panties, sitting on her bed", hour: 23 }],
];
const labels = [], prompts = [], refs = [];
for (const [label, args] of set) {
  const k = forKlein(W, W.composePicture(args));
  labels.push(label);
  prompts.push(k.prompt);
  refs.push(k.refs);
}
// a scene picture at his place (in person: drawn from her narration, the way startPicture does)
{
  const what = "She sits sideways on the gray couch in his living room, bare legs tucked under her, wearing his oversized hoodie, hair pinned up, a slow knowing smile.";
  const location = W.locationOf("his couch his living room");
  const k = forKlein(W, { prompt: [P.SCENE_STYLE, "{who}", what, "{room}", P.CRAFT, P.SAFE].join(" "), location });
  labels.push("scene: on his couch");
  prompts.push(k.prompt);
  refs.push(k.refs);
}
writeFileSync(new URL("./job.json", import.meta.url), JSON.stringify({
  note: "Examples for the owner (2026-10-03): Lebanese Reem in Belmont, her fixed places, curvier body, 768x1024; probes show which lingerie wordings Cloudflare's filter lets through.",
  mode: "examples", reference: "tools/face/reference.jpg", width: P.WIDTH, height: P.HEIGHT, square: false,
  labels, prompts, refs, per_prompt: 1, describe: false,
}, null, 2) + "\n");
console.log(labels.map((l, i) => `${String(i + 1).padStart(2, "0")} ${l}${refs[i].length ? " +place" : ""}`).join("\n"));
