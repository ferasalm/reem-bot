// Voice bench (owner, 2026-10-04: "Let's test aura-2-en"): her lines through Workers AI text-to-speech, each clip
// heard back by Whisper (the bot's ears since 2026-10-04) from the OGG/Opus format Telegram voice notes use.
// Reads tools/voice/bench.json; writes tools/voice/out/<speaker>-<line>-<style>.ogg and prints each transcript and
// Cloudflare's real cost (cf-ai-neurons). For .github/workflows/voice-bench.yml. Money cap: job.max_chars.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const job = JSON.parse(readFileSync("tools/voice/bench.json", "utf8"));
const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account } = process.env;
const out = "tools/voice/out";
mkdirSync(out, { recursive: true });
const run = (model) => `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`;
const NEURON_USD = 0.011 / 1000;
const strip = (t) => t.replace(/\[[^\]]*\]\s*/g, ""); // aura reads [tags] aloud: the bot would drop them

const clips = [];
for (const speaker of job.speakers) for (const line of job.lines) for (const style of ["bot", "expressive"]) {
  clips.push({ speaker, id: line.id, style, text: style === "bot" ? strip(line.bot) : line.expressive });
}
const chars = clips.reduce((s, c) => s + c.text.length, 0);
console.log(`${clips.length} clips, ${chars} characters (cap ${job.max_chars}): about $${(chars / 1000 * 0.03).toFixed(3)} at $0.03 per 1,000.`);
if (chars > job.max_chars) { console.log("Refused: over the cap."); process.exit(1); }

let neurons = 0, heardNeurons = 0;
for (const c of clips) {
  const name = `${c.speaker}-${c.id}-${c.style}`;
  const t0 = Date.now();
  const res = await fetch(run(job.model), {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: c.text, speaker: c.speaker, encoding: "opus", container: "ogg" }),
    signal: AbortSignal.timeout(60000),
  });
  const n = Number(res.headers.get("cf-ai-neurons")) || 0;
  neurons += n;
  const type = res.headers.get("content-type") || "";
  const bytes = Buffer.from(await res.arrayBuffer());
  if (!res.ok || type.includes("json")) { console.log(`${name}: FAILED HTTP ${res.status} ${bytes.toString().slice(0, 300)}`); continue; }
  writeFileSync(`${out}/${name}.ogg`, bytes);
  const took = Date.now() - t0;
  // heard back: the same call the bot makes for his voice notes
  const h = await fetch(run(job.hearing_model), {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ audio: bytes.toString("base64"), task: "transcribe", vad_filter: true, initial_prompt: "Reem, Basbousa." }),
    signal: AbortSignal.timeout(60000),
  });
  heardNeurons += Number(h.headers.get("cf-ai-neurons")) || 0;
  const hd = await h.json().catch(() => ({}));
  const heard = h.ok ? hd.result?.text?.trim() : `FAILED HTTP ${h.status} ${JSON.stringify(hd.errors || hd).slice(0, 200)}`;
  console.log(`${name}: ${bytes.length} bytes, ${took} ms, ${n.toFixed(1)} neurons\n  said:  ${c.text}\n  heard: ${heard}`);
}
console.log(`\nSpeech: ${neurons.toFixed(0)} neurons ($${(neurons * NEURON_USD).toFixed(3)}); hearing: ${heardNeurons.toFixed(0)} neurons ($${(heardNeurons * NEURON_USD).toFixed(4)}).`);
