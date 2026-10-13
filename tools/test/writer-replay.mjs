// Step C (2026-10-13): the picture writer (PICTURE.WRITER, LOOK.PROMPT) replayed on the real DeepSeek on Workers AI, free of
// pictures: /look stories (D1 rows 2-4, 8, 483-484 rebuilt), her selfies with her words (D1 rows 9-14) and her in-person moments.
// Prints every raw answer, the words drawn and the seconds each call took. Runs in .github/workflows/writer-replay.yml (the container
// can't reach api.cloudflare.com); RUNS=n asks each case n times (default 2). Writes writer-replay.json for the bench.
import { writeFileSync } from "node:fs";
import { loadWorker } from "./load-worker.mjs";

const W = await loadWorker();
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!account || !token) throw new Error("CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are needed");
const RUNS = Number(process.env.RUNS) || 2;
// a variant (the workflow's matrix): another model, reasoning or token cap for the writer and /look
const Wr = W.CONFIG.PICTURE.WRITER;
if (process.env.WRITER_REASONING) Wr.REASONING = process.env.WRITER_REASONING;
if (process.env.WRITER_MODEL) Wr.MODEL = W.CONFIG.PICTURE.LOOK.MODEL = process.env.WRITER_MODEL;
if (process.env.WRITER_MAX_TOKENS) Wr.MAX_TOKENS = W.CONFIG.PICTURE.LOOK.MAX_TOKENS = Number(process.env.WRITER_MAX_TOKENS);
console.log(`model: ${Wr.MODEL} | reasoning: ${Wr.REASONING} | max tokens: ${Wr.MAX_TOKENS} (look ${W.CONFIG.PICTURE.LOOK.MAX_TOKENS})`);
const calls = [];
const store = new Map();
const env = {
  REEM_KV: { get: async (k, t) => (store.has(k) ? (t === "json" ? JSON.parse(store.get(k)) : store.get(k)) : null), put: async (k, v) => void store.set(k, v), delete: async (k) => void store.delete(k) },
  AI: {
    async run(model, input) {
      const t0 = Date.now();
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const data = await res.json().catch(() => ({}));
      calls.push({ model, ms: Date.now() - t0, usage: data.result && data.result.usage });
      if (!res.ok || data.success === false) throw new Error(`${res.status} ${JSON.stringify(data.errors || data).slice(0, 300)}`);
      return data.result;
    },
  },
};
const settings = { name: "Feras" };
const her = (content) => ({ role: "assistant", content });
const him = (content) => ({ role: "user", content });

// /look: what he sees (LOOK.PROMPT with the writer's rules and the clothes to name)
const HURT = [her("*Reem pushes her door open with her hip, a first-aid tin under her arm.* \"sit. no, on the bed. don't argue with me.\""), him("*sits on the edge of your bed* it's just a scratch"),
  her("*She sits beside you, close, her old gray cardigan wrapped tight over a simple black top, and tips your chin toward the bedside lamp. A glass of water and a blister pack wait on the nightstand.* \"a scratch. sure.\" *Her thumb hovers near the cut above your brow, her face pinched with worry.*")];
const DOOR = [her("*Her door opened anyway—Reem in an old cardigan and wool socks, a calculator's paper roll trailing from one hand.*"), him("can i have some coffee?"),
  her("*Reem steps back, holding the door wider, a small, dry smile tugging at her lips. The kitchen light spills into the hallway.* \"Sit wherever.\"")];
const BED = [her("*She pulls you down onto her bed, laughing, her slip dress riding up her thighs.*"), him("*kisses your neck, slides the straps off*"),
  her("*The black slip pools at her waist, then the floor. She lies back on the sheets, naked, pulling you on top of her, her legs wrapping around your hips as you push inside her.* \"don't stop.\"")];
const APART = [him("i'm home. the wall's so thin i can hear your printer"), her("then come knock instead of listening through the plaster\n\ni'm still doing the hovsepian books")];
const SPOON = [her("*Reem curls up under the duvet in her old t-shirt, the lamp low.* \"you're letting the cold in.\""), him("*slides in behind you*")];
const LOOKS = [
  ["look-483-484 hurt", HURT, ""],
  ["look door", DOOR, ""],
  ["look missionary", BED, ""],
  ["look apart (alone)", APART, ""],
  ["look PoV of spooning", SPOON, "PoV of spooning"],
];

// her selfies: the shot and her words as the D1 rows show them (row 13: a second pose, a smirk, a phone; row 14: two smiles, a phone)
const SELFIES = [
  ["selfie row 13 counter-sit", { tier: "everyday", shot: "counter-sit", words: "she's leaning against the kitchen counter, one leg bent up, wearing her father's old gray cardigan over a black cami, hair messily twisted up with a pencil, phone in hand, a small smirk" }],
  ["selfie row 14 close", { tier: "everyday", shot: "close", words: "biting back a smile, looking down at her phone, hair falling forward, a small smile at the corner of her mouth" }],
  ["selfie row 10 window-lean", { tier: "flirty", shot: "window-lean", words: "the kitchen window open behind her, hair loose, looking back over her shoulder, wearing a black lace cami and matching silk shorts" }],
  ["selfie row 12 bakery", { tier: "everyday", shot: "selfie", doing: "she is at the bakery on mount auburn pretending to work, actually just watching the door" }],
  ["selfie mirror nude", { tier: "nude", shot: "mirror", words: "in the bedroom mirror, completely naked, one arm across her waist, hair down" }],
];
const SAID = [him("send me a pic"), her("fine. one. don't get used to it")];

// her in-person moments (the moment is her last reply)
const SCENES = [
  ["scene doorframe", [him("*steps closer* let me see you")], "*She leans against the doorframe, her dark waves loose over one shoulder, a slow smile on her lips.* \"like what you see?\" *Her eyes move over you.*"],
  ["scene couch", [him("*sits on the couch*")], "*Reem curls up at the other end of the couch, tucking her bare feet under a gray knit cardigan.* \"comfy?\""],
  ["scene hurt", HURT.slice(0, 2), HURT[2].content],
  ["scene riding", [her("*She straddles you on the sofa, already naked, guiding you inside her.*"), him("*grabs your hips*")], "*She rides you slowly, her hands braced on your chest, head thrown back, hair spilling down her back.* \"fuck—right there.\""],
  ["scene kitchen him-heavy", [him("*comes up behind you at the stove*")], "*You wrap your arms around her waist and she leans back into you, stirring the pot, her black ribbed tank top and gray sweatpants dusted with flour.* \"you're in my way.\" *She tilts her head so you can kiss her neck.*"],
];

const out = [];
const show = (label, raw, text, ms) => {
  console.log(`\n### ${label} (${(ms / 1000).toFixed(1)} s)\nRAW: ${String(raw ?? "(null)").replace(/\n/g, " | ")}\nDRAWN: ${text ?? "(template)"}`);
  out.push({ label, raw, text, ms });
};
for (let run = 1; run <= RUNS; run++) {
  for (const [label, history, ask] of LOOKS) {
    const t0 = Date.now();
    const lastHers = (history.filter((m) => m.role === "assistant").at(-1) || {}).content || "";
    const seen = await W.lookWrite(env, history, settings, ask, W.sceneWearing(lastHers, history, "on", null));
    show(`${label} #${run}`, seen && seen.raw, seen && `${seen.withHer ? "WITH_HER" : "ALONE"}: ${seen.withHer ? W.asCamera(seen.text) : seen.text}`, Date.now() - t0);
  }
  for (const [label, args] of SELFIES) {
    const pic = W.composePicture({ hour: 15, ...args, level: "on" });
    const t0 = Date.now();
    const w = await W.writtenSelfie(env, pic, { history: SAID, level: "on" });
    console.log(`\n--- draft: ${pic.parts.draft}`);
    show(`${label} #${run}`, w && w.written, w ? w.prompt : null, Date.now() - t0);
    out.at(-1).template = pic.prompt;
  }
  for (const [label, history, moment] of SCENES) {
    const what = W.scenePicturePrompt(moment, "on");
    const act = !!W.sexCue(moment, "on") || W.sexAct(what, "on");
    const pic = { prompt: `(template) ${what}`, what, location: W.locationOf(what), wearing: act ? "" : W.sceneWearing(moment, history, "on", null), act };
    const t0 = Date.now();
    const w = await W.writtenScene(env, pic, moment, { history: [...history, her(moment)], level: "on" });
    console.log(`\n--- template's words: ${what || "(none: no picture today)"}`);
    show(`${label} #${run}`, w && w.written, w ? w.prompt : null, Date.now() - t0);
    out.at(-1).template = what;
  }
}
const ms = calls.map((c) => c.ms).sort((a, b) => a - b);
console.log(`\n${calls.length} calls; seconds: median ${(ms[ms.length >> 1] / 1000).toFixed(1)}, slowest ${(ms.at(-1) / 1000).toFixed(1)}; over ${W.CONFIG.PICTURE.WRITER.TIMEOUT_MS / 1000} s: ${ms.filter((x) => x > W.CONFIG.PICTURE.WRITER.TIMEOUT_MS).length}`);
console.log(`tokens: ${JSON.stringify(calls.map((c) => c.usage && [c.usage.prompt_tokens, c.usage.completion_tokens]))}`);
writeFileSync("writer-replay.json", JSON.stringify(out, null, 1));
