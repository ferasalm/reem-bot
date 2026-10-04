// OpenRouter text-to-speech bench (owner, 2026-10-04: aura-2 voices "don't even come close to elevenlabs ... Is there
// a better model for tts?"). Reads tools/voice/tts-bench.json: lists OpenRouter's speech models (ids, prices), then
// speaks each line with each candidate on POST /api/v1/audio/speech, turns the MP3 into OGG/Opus (what Telegram voice
// notes use) and has Whisper (Workers AI) hear it back. A candidate names a `model` id, or `match` words that pick the
// first listed id containing all of them (and none of `not`). `clone`: Voxtral-style voice cloning from job.reference.
// Writes tools/voice/out/<candidate>-<line>.ogg. For .github/workflows/voice-bench.yml. Money cap: job.max_chars.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const job = JSON.parse(readFileSync("tools/voice/tts-bench.json", "utf8"));
const { OPENROUTER_API_KEY: orKey, CLOUDFLARE_API_TOKEN: cfToken, CLOUDFLARE_ACCOUNT_ID: account } = process.env;
const out = "tools/voice/out";
mkdirSync(out, { recursive: true });
const or = (path, init = {}) => fetch(`https://openrouter.ai/api/v1${path}`, { ...init, headers: { Authorization: `Bearer ${orKey}`, "Content-Type": "application/json", ...(init.headers || {}) }, signal: AbortSignal.timeout(120000) });

// 1. what OpenRouter offers for speech
const listed = [];
for (const q of ["?output_modalities=speech", "?output_modalities=audio", ""]) {
  const data = await or(`/models${q}`).then((r) => r.json()).catch((e) => ({ error: e.message }));
  for (const m of data.data || []) {
    const outs = m.architecture?.output_modalities || [];
    if (listed.some((x) => x.id === m.id)) continue;
    if (q || /tts|speech|voice|audio/i.test(m.id) || outs.some((o) => /speech|audio/.test(o))) listed.push(m);
  }
  if (q && !data.data) console.log(`models${q}: ${JSON.stringify(data).slice(0, 200)}`);
}
console.log(`Speech/audio models on OpenRouter (${listed.length}):`);
for (const m of listed) console.log(`  ${m.id} | out: ${m.architecture?.output_modalities} | pricing ${JSON.stringify(m.pricing)} | ${String(m.description || "").replace(/\s+/g, " ").slice(0, 220)}`);

const pick = (c) => {
  if (c.model) return c.model;
  const hit = listed.find((m) => c.match.every((w) => m.id.toLowerCase().includes(w)) && !(c.not || []).some((w) => m.id.toLowerCase().includes(w)));
  return hit?.id;
};

// 2. the clips
const ref = job.reference ? readFileSync(job.reference).toString("base64") : null;
const clips = [];
for (const c of job.candidates) for (const line of job.lines) {
  const text = (c.prefix || "") + line.text.replace(/\{laugh\}\s*/g, c.laugh ? `${c.laugh} ` : "");
  clips.push({ c, line, text });
}
const chars = clips.reduce((s, x) => s + x.text.length + (x.c.instructions || "").length, 0);
console.log(`\n${clips.length} clips, ${chars} characters (cap ${job.max_chars}).`);
if (chars > job.max_chars) { console.log("Refused: over the cap."); process.exit(1); }

let spent = 0;
for (const { c, line, text } of clips) {
  const name = `${c.name}-${line.id}`;
  const model = pick(c);
  if (!model) { console.log(`${name}: no listed model matches ${JSON.stringify(c.match)}`); continue; }
  const body = { model, input: text, response_format: c.format || "mp3", ...(c.extra || {}) };
  if (c.voice) body.voice = c.voice;
  if (c.instructions) body.instructions = c.instructions;
  if (c.clone && ref) body.input_references = [{ type: "input_audio", input_audio: { data: ref, format: "mp3" } }, ...(job.reference_text ? [{ type: "text", text: job.reference_text }] : [])];
  const t0 = Date.now();
  let res;
  try { res = await or("/audio/speech", { method: "POST", body: JSON.stringify(body) }); } catch (e) { console.log(`${name} (${model}): FAILED ${e.message}`); continue; }
  const type = res.headers.get("content-type") || "";
  const bytes = Buffer.from(await res.arrayBuffer());
  const cost = res.headers.get("x-openrouter-cost") || res.headers.get("openrouter-cost") || "";
  if (!res.ok || type.includes("json")) { console.log(`${name} (${model}): FAILED HTTP ${res.status} ${bytes.toString().slice(0, 400)}`); continue; }
  const pcm = (c.format || "mp3") === "pcm" && !/mpeg|mp3|wav|ogg/.test(type);
  const raw = `${out}/${name}.${pcm ? "pcm" : type.includes("mpeg") || type.includes("mp3") ? "mp3" : "bin"}`;
  writeFileSync(raw, bytes);
  // raw PCM (Gemini): 16-bit little-endian mono at c.rate (24 kHz)
  const input = pcm ? ["-f", "s16le", "-ar", String(c.rate || 24000), "-ac", "1", "-i", raw] : ["-i", raw];
  try { execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...input, "-ac", "1", "-c:a", "libopus", "-b:a", "48k", `${out}/${name}.ogg`]); }
  catch (e) { console.log(`${name}: ffmpeg could not read ${type} (${bytes.length} bytes)`); continue; }
  const ogg = readFileSync(`${out}/${name}.ogg`);
  const h = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/@cf/openai/whisper-large-v3-turbo`, {
    method: "POST", headers: { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ audio: ogg.toString("base64"), task: "transcribe", vad_filter: true, initial_prompt: "Reem, Basbousa, habibi, yaani." }),
    signal: AbortSignal.timeout(60000),
  }).then((r) => r.json()).catch(() => ({}));
  if (cost) spent += Number(cost) || 0;
  console.log(`${name} (${model}, ${c.voice || "clone"}): ${bytes.length} bytes ${type}, ${Date.now() - t0} ms${cost ? `, $${cost}` : ""}\n  said:  ${text}\n  heard: ${h.result?.text?.trim() ?? JSON.stringify(h.errors || h).slice(0, 200)}`);
}
if (ref) {
  // the reference itself, heard, so its transcript can be passed next time
  const h = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/@cf/openai/whisper-large-v3-turbo`, {
    method: "POST", headers: { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ audio: ref, task: "transcribe" }), signal: AbortSignal.timeout(60000),
  }).then((r) => r.json()).catch(() => ({}));
  console.log(`\nReference (${job.reference}) heard: ${h.result?.text?.trim()}`);
}
console.log(`\nCost reported in headers: $${spent.toFixed(4)} (OpenRouter's activity page has the exact figure).`);
