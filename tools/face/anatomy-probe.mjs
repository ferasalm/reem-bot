// Step D (picture overhaul, 2026-10-13): does a Workers AI vision model catch the anatomy mistakes? The bot's own check
// (PICTURE.ANATOMY.PROMPT + POV / ACT) on labelled pictures from face-candidates (bad: ghost hands, a broken leg, a second head, stray
// toes; good: clean selfies, scenes, nudes and sex acts), on each MODELS entry. Free apart from Workers AI neurons (~a few hundred).
// Runs in .github/workflows/anatomy-probe.yml with face-candidates checked out at FC (the container can't reach api.cloudflare.com).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadWorker } from "../test/load-worker.mjs";

const W = await loadWorker();
const A = W.CONFIG.PICTURE.ANATOMY;
const FC = process.env.FC || "fc";
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
// run 38340313839: Gemma 3 12B is not allowed on this account (5018); Llama 3.2 11B Vision needs a one-time "agree" (sent below).
// run 38340521232 (v2): Scout 5/7 caught, 9/11 passed; Llama 3.2 11B Vision 3/7, 9/11; Mistral Small 3.1 1/7, 7/11. Default: the bot's.
const MODELS = (process.env.MODELS || A.MODEL).split(",").filter(Boolean);
const B = "runs/2026-10-13-stepA-bench/";
const C = "runs/2026-10-13-stepC-bench/";
const P4 = "runs/38333810448-cf-lora-probe/";
// [file, bad?, kind of view, what is wrong]: view "act" = sex from his eyes, "pov" = his eyes, "" = a selfie or a plain photo
const PICTURES = [
  [`${P4}bogus-lora.jpg`, true, "", "a stray hand at the left edge (klein 4B)"],
  [`${P4}lora-anatomy.jpg`, true, "", "a stray hand at the left edge (klein 4B)"],
  [`${P4}loras-json.jpg`, true, "", "a stray hand at the left edge (klein 4B)"],
  [`${C}s13-counter-T-s202.jpg`, true, "", "denim shorts with a bare raised leg plus a jeans leg and a bare foot"],
  [`${B}h1-riding-hands-V0-s101.jpg`, true, "act", "a second man's head behind her shoulder"],
  [`${B}h1-riding-hands-V0-s202.jpg`, true, "act", "a second head behind her"],
  [`${B}a2-missionary-V0-s101.jpg`, true, "act", "small stray toes at the right edge"],
  [`${C}s13-counter-W-s101.jpg`, false, "", ""],
  [`${C}s13-counter-W-s202.jpg`, false, "", ""],
  [`${C}s14-close-W-s202.jpg`, false, "", ""],
  [`${C}c-kitchen-W-s101.jpg`, false, "pov", ""],
  [`${C}c-hurt-W-s202.jpg`, false, "pov", "(his hand at the bottom edge)"],
  [`${C}l-spooning-W-s202.jpg`, false, "pov", "(his hand at the bottom edge)"],
  [`${B}o1-sweater-mirror-V0-s101.jpg`, false, "", ""],
  [`${B}o4-cardigan-cami-V0-s101.jpg`, false, "", ""],
  [`${B}a1-riding-V0-s101.jpg`, false, "act", ""],
  [`${B}a3-blowjob-V0-s202.jpg`, false, "act", ""],
  [`${B}a4-doggy-V0-s202.jpg`, false, "act", ""],
];

const promptFor = (view) => W.fill(A.PROMPT, { attached: view ? A.ATTACHED : "", pov: view === "pov" ? A.POV : "", act: view === "act" ? A.ACT : "" });
async function ask(model, bytes, view) {
  const input = { messages: [{ role: "user", content: [{ type: "text", text: promptFor(view) }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${bytes.toString("base64")}` } }] }], max_tokens: A.MAX_TOKENS };
  const t0 = Date.now();
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(input) });
  const data = await res.json().catch(() => ({}));
  const ms = Date.now() - t0;
  const neurons = res.headers.get("cf-ai-neurons");
  if (!res.ok || data.success === false) return { ms, neurons, error: `${res.status} ${JSON.stringify(data.errors || data).slice(0, 300)}` };
  const r = data.result || {};
  return { ms, neurons, text: String(r.response ?? r.choices?.[0]?.message?.content ?? "") };
}
const verdict = (text, view) => W.anatomyVerdict(text, { heads: view !== "act" }); // as anatomyCheck

// Llama 3.2 Vision's license: a one-time "agree" prompt on the account (Cloudflare's own instruction in the 403)
if (MODELS.some((m) => m.includes("llama-3.2-11b-vision"))) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ prompt: "agree" }) });
  console.log(`llama-3.2-11b-vision agree: ${res.status} ${(await res.text()).slice(0, 200)}`);
}
const tally = {};
for (const model of MODELS) {
  tally[model] = { caught: 0, bad: 0, passed: 0, good: 0, unread: 0, ms: [], neurons: 0 };
  console.log(`\n======== ${model}`);
  for (const [file, bad, view, note] of PICTURES) {
    const bytes = readFileSync(join(FC, file));
    const out = await ask(model, bytes, view);
    const v = out.error ? null : verdict(out.text, view);
    const t = tally[model];
    t.ms.push(out.ms);
    t.neurons += Number(out.neurons) || 0;
    if (!v) t.unread++;
    if (bad) { t.bad++; if (v && !v.ok) t.caught++; } else { t.good++; if (v && v.ok) t.passed++; }
    const mark = !v ? "UNREAD" : v.ok === !bad ? "right" : "WRONG";
    console.log(`\n--- ${file} [${bad ? "BAD" : "good"}${view ? `, ${view}` : ""}] ${note} → ${mark} (${(out.ms / 1000).toFixed(1)} s, ${out.neurons || "?"} neurons)`);
    console.log(out.error || out.text.trim().replace(/\n+/g, " | ").slice(0, 900));
  }
}
console.log("\n======== summary");
for (const [m, t] of Object.entries(tally)) {
  const ms = t.ms.sort((a, b) => a - b);
  console.log(`${m}: bad caught ${t.caught}/${t.bad}, good passed ${t.passed}/${t.good}, unread ${t.unread}; median ${(ms[ms.length >> 1] / 1000).toFixed(1)} s, slowest ${(ms.at(-1) / 1000).toFixed(1)} s; ${t.neurons.toFixed(0)} neurons`);
}
