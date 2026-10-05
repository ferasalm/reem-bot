// Speech-to-text bench (owner, 2026-10-05: which model hears his voice notes better than Whisper, with laughs, tone,
// accents and Arabic). Reads tools/voice/stt-bench.json: makes each line with Gemini TTS (OpenRouter, raw PCM), turns it
// into OGG/Opus as Telegram sends voice notes, then has every hearer transcribe it: Workers AI Whisper (the live one,
// with HEARING.PROMPT's words) and Nova-3, OpenRouter models with audio input (chat completions, `input_audio`; a hearer
// names a `model` id or `match` words over the listed audio models) and OpenRouter's /audio/transcriptions.
// Writes tools/voice/out/stt-<line>.ogg. For .github/workflows/stt-bench.yml. Cap: job.max_clips.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const job = JSON.parse(readFileSync("tools/voice/stt-bench.json", "utf8"));
const { OPENROUTER_API_KEY: orKey, CLOUDFLARE_API_TOKEN: cfToken, CLOUDFLARE_ACCOUNT_ID: account } = process.env;
const out = "tools/voice/out";
mkdirSync(out, { recursive: true });
const or = (path, init = {}) => fetch(`https://openrouter.ai/api/v1${path}`, { ...init, headers: { Authorization: `Bearer ${orKey}`, ...(init.json === false ? {} : { "Content-Type": "application/json" }), ...(init.headers || {}) }, signal: AbortSignal.timeout(120000) });
const cf = (model, init) => fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}${init.query || ""}`, { method: "POST", headers: { Authorization: `Bearer ${cfToken}`, ...init.headers }, body: init.body, signal: AbortSignal.timeout(90000) });
if (job.lines.length > job.max_clips) { console.log("Refused: more lines than max_clips."); process.exit(1); }

// 1. OpenRouter's models that take audio in, and its transcription models
const listed = [];
for (const q of ["?input_modalities=audio", "?output_modalities=transcription", ""]) {
  const data = await or(`/models${q}`).then((r) => r.json()).catch((e) => ({ error: e.message }));
  for (const m of data.data || []) {
    const ins = m.architecture?.input_modalities || [];
    if (listed.some((x) => x.id === m.id)) continue;
    if (q || ins.includes("audio") || /transcri|voxtral|whisper/i.test(m.id)) listed.push(m);
  }
  if (q && !data.data) console.log(`models${q}: ${JSON.stringify(data).slice(0, 200)}`);
}
console.log(`Audio-input / transcription models on OpenRouter (${listed.length}):`);
for (const m of listed) console.log(`  ${m.id} | in: ${m.architecture?.input_modalities} | out: ${m.architecture?.output_modalities} | pricing ${JSON.stringify(m.pricing)}`);
const pick = (h) => h.model || listed.find((m) => h.match.every((w) => m.id.toLowerCase().includes(w)) && !(h.not || []).some((w) => m.id.toLowerCase().includes(w)))?.id;
for (const h of job.hearers) console.log(`hearer ${h.name}: ${pick(h) || "none listed"}`);

// 2. the clips (his voice notes)
const clips = [];
for (const l of job.lines) {
  const res = await or("/audio/speech", { method: "POST", body: JSON.stringify({ model: job.tts.model, input: l.text, voice: l.voice, instructions: l.instructions, response_format: job.tts.format }) });
  const bytes = Buffer.from(await res.arrayBuffer());
  if (!res.ok || (res.headers.get("content-type") || "").includes("json")) { console.log(`clip ${l.id}: FAILED HTTP ${res.status} ${bytes.toString().slice(0, 300)}`); continue; }
  writeFileSync(`${out}/stt-${l.id}.pcm`, bytes);
  const ogg = `${out}/stt-${l.id}.ogg`, mp3 = `${out}/stt-${l.id}.mp3`;
  const pcmIn = ["-f", "s16le", "-ar", String(job.tts.rate), "-ac", "1", "-i", `${out}/stt-${l.id}.pcm`];
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...pcmIn, "-ac", "1", "-c:a", "libopus", "-b:a", "32k", ogg]);
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...pcmIn, "-ac", "1", "-b:a", "64k", mp3]);
  clips.push({ l, ogg: readFileSync(ogg), mp3: readFileSync(mp3), secs: bytes.length / 2 / job.tts.rate });
}

// 3. every hearer on every clip
const hearingPrompt = (readFileSync("worker.js", "utf8").match(/HEARING: \{[^]*?PROMPT: "([^"]*)"/) || [])[1] || "";
async function hear(h, c) {
  const model = pick(h);
  if (!model) return "no model listed";
  if (h.kind === "workers") {
    const r = await cf(model, { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audio: c.ogg.toString("base64"), task: "transcribe", vad_filter: true, initial_prompt: hearingPrompt }) }).then((x) => x.json());
    return r.result?.text?.trim() ?? JSON.stringify(r.errors || r).slice(0, 300);
  }
  if (h.kind === "nova") {
    const r = await cf(model, { query: "?detect_language=true&smart_format=true&punctuate=true", headers: { "Content-Type": "audio/ogg" }, body: c.ogg }).then((x) => x.json());
    const alt = r.result?.results?.channels?.[0]?.alternatives?.[0];
    return alt ? `${alt.transcript} [lang ${r.result.results.channels[0].detected_language || "?"}]` : JSON.stringify(r.errors || r).slice(0, 300);
  }
  if (h.kind === "transcriptions") {
    const form = new FormData();
    form.append("model", model);
    form.append("file", new Blob([c.ogg], { type: "audio/ogg" }), "voice.ogg");
    let r = await or("/audio/transcriptions", { method: "POST", body: form, json: false }).then((x) => x.json()).catch((e) => ({ error: e.message }));
    if (!r.text) r = await or("/audio/transcriptions", { method: "POST", body: JSON.stringify({ model, input_audio: { data: c.ogg.toString("base64"), format: "ogg" } }) }).then((x) => x.json()).catch((e) => ({ error: e.message }));
    return r.text ?? JSON.stringify(r).slice(0, 300);
  }
  // chat with audio in: OGG as Telegram sends it first, then MP3 (would the Worker need to convert?)
  for (const [fmt, data] of [["ogg", c.ogg], ["mp3", c.mp3]]) {
    const r = await or("/chat/completions", { method: "POST", body: JSON.stringify({ model, temperature: 0, messages: [{ role: "user", content: [{ type: "text", text: job.prompt }, { type: "input_audio", input_audio: { data: data.toString("base64"), format: fmt } }] }] }) }).then((x) => x.json()).catch((e) => ({ error: { message: e.message } }));
    const text = r.choices?.[0]?.message?.content;
    if (text) return `${fmt === "mp3" ? "[ogg refused, mp3] " : ""}${String(text).trim()} [${r.usage?.prompt_tokens ?? "?"} in, $${r.usage?.cost ?? "?"}]`;
    if (fmt === "mp3") return `FAILED ${JSON.stringify(r.error || r).slice(0, 300)}`;
    console.log(`  (${h.name} ogg: ${JSON.stringify(r.error || r).slice(0, 200)})`);
  }
}
for (const c of clips) {
  console.log(`\n=== ${c.l.id} (${c.secs.toFixed(1)} s, voice ${c.l.voice})\n  said: ${c.l.text}`);
  for (const h of job.hearers) {
    const t0 = Date.now();
    let text;
    try { text = await hear(h, c); } catch (e) { text = `FAILED ${e.message}`; }
    console.log(`  ${h.name.padEnd(18)} ${String(Date.now() - t0).padStart(6)} ms | ${String(text).replace(/\s+/g, " ")}`);
  }
}
