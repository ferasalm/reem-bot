// OpenRouter text-to-speech bench (owner, 2026-10-04: aura-2 voices "don't even come close to elevenlabs ... Is there
// a better model for tts?"). Reads tools/voice/tts-bench.json: lists OpenRouter's speech models (ids, prices), then
// speaks each line with each candidate on POST /api/v1/audio/speech, turns the MP3 into OGG/Opus (what Telegram voice
// notes use) and has Whisper (Workers AI) hear it back. A candidate names a `model` id, or `match` words that pick the
// first listed id containing all of them (and none of `not`). `clone`: Voxtral-style voice cloning from job.reference.
// Writes tools/voice/out/<candidate>-<line>.ogg. For .github/workflows/voice-bench.yml. Money cap: job.max_chars.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const job = JSON.parse(readFileSync("tools/voice/tts-bench.json", "utf8"));
const { OPENROUTER_API_KEY: orKey, CLOUDFLARE_API_TOKEN: cfToken, CLOUDFLARE_ACCOUNT_ID: account, RUNWARE_API_KEY: rwKey } = process.env;
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

// Runware (owner, 2026-10-06: "Test fish audio and qwen for tts"): a candidate with provider "runware" is one
// audioInference task (speech.text + c.speech, c.prompt as positivePrompt: Qwen's style instruction); job.runware_search
// prints the audio models Runware finds for each term (free) to check the ids
const rw = (tasks) => fetch("https://api.runware.ai/v1", { method: "POST", headers: { Authorization: `Bearer ${rwKey}`, "Content-Type": "application/json" }, body: JSON.stringify(tasks), signal: AbortSignal.timeout(180000) }).then((r) => r.json());
for (const search of job.runware_search || []) {
  const res = await rw([{ taskType: "modelSearch", taskUUID: crypto.randomUUID(), search, limit: 12 }]).catch((e) => ({ error: e.message }));
  console.log(`Runware models for "${search}":`);
  for (const m of res.data?.[0]?.results || []) console.log(`  ${m.air} | ${m.name} ${m.version || ""} | ${m.category || ""} ${m.architecture || ""}`);
  if (!res.data?.[0]?.results) console.log(`  ${JSON.stringify(res).slice(0, 400)}`);
}
async function runwareSpeech(c, text) {
  const task = { taskType: "audioInference", taskUUID: crypto.randomUUID(), model: c.model, speech: { text, ...(c.speech || {}) },
    outputType: "base64Data", outputFormat: "MP3", includeCost: true, ...(c.extra || {}) };
  if (c.prompt) task.positivePrompt = c.prompt;
  let data;
  for (let tries = 0; ; tries++) { // a small balance stays reserved for a moment after each call
    data = await rw([task]);
    if (tries >= 4 || !data.errors?.some((e) => e.code === "concurrentRequestLimitExceeded")) break;
    await new Promise((r) => setTimeout(r, 10000));
  }
  const d = data?.data?.[0];
  const b64 = d?.audioBase64Data || d?.audioDataURI?.replace(/^data:[^,]*,/, "");
  if (b64) return { bytes: Buffer.from(b64, "base64"), type: "audio/mpeg", cost: d.cost };
  if (d?.audioURL) return { bytes: Buffer.from(await (await fetch(d.audioURL)).arrayBuffer()), type: "audio/mpeg", cost: d.cost };
  return { error: JSON.stringify(data.errors || data).slice(0, 400) };
}

const pick = (c) => {
  if (c.model) return c.model;
  const hit = listed.find((m) => c.match.every((w) => m.id.toLowerCase().includes(w)) && !(c.not || []).some((w) => m.id.toLowerCase().includes(w)));
  return hit?.id;
};

const whisper = (ogg) => fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/@cf/openai/whisper-large-v3-turbo`, {
  method: "POST", headers: { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" },
  body: JSON.stringify({ audio: ogg.toString("base64"), task: "transcribe", vad_filter: true, initial_prompt: "Reem, habibi, yaani, walaw." }),
  signal: AbortSignal.timeout(60000),
}).then((r) => r.json()).catch(() => ({}));
const hear = async (ogg) => { const h = await whisper(ogg); return h.result?.text?.trim() ?? JSON.stringify(h.errors || h).slice(0, 200); };

// 2. the clips
const ref = job.reference ? readFileSync(job.reference).toString("base64") : null;
const clips = [];
for (const c of job.candidates) for (const line of job.lines) {
  let text = (c.prefix || "") + line.text.replace(/\{laugh\}\s*/g, c.laugh ? `${c.laugh} ` : "");
  if (c.strip_tags) text = text.replace(/\[[^\]]*\]\s*/g, "").trim(); // models that would read [tags] aloud
  clips.push({ c, line, text });
}
const chars = clips.reduce((s, x) => s + x.text.length + (x.c.instructions || "").length, 0);
console.log(`\n${clips.length} clips, ${chars} characters (cap ${job.max_chars}).`);
if (chars > job.max_chars) { console.log("Refused: over the cap."); process.exit(1); }

let spent = 0;
for (const { c, line, text } of clips) {
  const name = `${c.name}-${line.id}`;
  if (c.provider === "runware") {
    const t0 = Date.now();
    const r = await runwareSpeech(c, text).catch((e) => ({ error: e.message }));
    if (r.error) { console.log(`${name} (${c.model}): FAILED ${r.error}`); continue; }
    writeFileSync(`${out}/${name}.mp3`, r.bytes);
    try { execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", `${out}/${name}.mp3`, "-ac", "1", "-c:a", "libopus", "-b:a", "48k", `${out}/${name}.ogg`]); }
    catch { console.log(`${name}: ffmpeg could not read it (${r.bytes.length} bytes)`); continue; }
    const h = await hear(readFileSync(`${out}/${name}.ogg`));
    console.log(`${name} (${c.model}): ${r.bytes.length} bytes, ${Date.now() - t0} ms, $${r.cost}\n  said:  ${text}\n  heard: ${h}`);
    continue;
  }
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
  const h = await whisper(ogg);
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
