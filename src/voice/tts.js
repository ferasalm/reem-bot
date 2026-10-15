// Her voice: Sulafat (OpenRouter), ElevenLabs, aura; MP3 encoding.
import { Mp3Encoder } from "../../assets/mp3.js";
import { voiceFailed } from "../chat/respond.js";
import { CONFIG, fill } from "../config/index.js";
import { can } from "../gate.js";
import { TAG_MARK } from "../persona/index.js";
import { aiFailed, aiRun, aiSpent, aiText_ } from "../platform/ai.js";
import { budget, xfetch } from "../platform/http.js";
import { loadLedger, saveLedger, spend } from "../platform/kv.js";
import { audioTagRe, isV3 } from "./tags.js";

export const voiceId = (env) => String(env.VOICE_ID || CONFIG.VOICE.ID).trim();
// Her voice note: Workers AI aura-2 (VOICE.PROVIDER "aura", counted in the day's AI budget; `ledger` is the reply's
// own when it has one, so a picture saved later keeps the count), ElevenLabs when aura fails or the budget is spent
export async function tts(env, text, ledger = null) {
  const V = CONFIG.VOICE;
  if (V.PROVIDER === "openrouter") return openRouterTts(env, text, ledger);
  if (V.PROVIDER !== "aura") return elevenTts(env, text);
  return auraTts(env, text, ledger);
}
// aura-2 on Workers AI: VOICE.PROVIDER "aura", and the backup of the OpenRouter voice (owner 2026-10-06: backups on
// Cloudflare); ElevenLabs after it (ELEVENLABS_BACKUP)
export async function auraTts(env, text, ledger = null) {
  const V = CONFIG.VOICE;
  const said = auraText(text);
  if (!said) throw new Error("Nothing to say aloud.");
  const backup = !!V.ELEVENLABS_BACKUP && !!env.ELEVENLABS_API_KEY;
  if (env.AI && budget.left() > CONFIG.LIMITS.SUBREQUEST_RESERVE + 2) {
    ledger = ledger || (await loadLedger(env));
    const neurons = Math.ceil((said.length / 1000) * CONFIG.AI_BUDGET.VOICE_NEURONS_PER_1000_CHARS);
    if (can({ ledger }, "ai", "voice", neurons)) {
      let error = null;
      try {
        const out = await aiRun(env, V.AURA_MODEL, { text: said, speaker: V.AURA_SPEAKER, encoding: "opus", container: "ogg" }, CONFIG.LIMITS.HTTP_TIMEOUT_MS, true, { returnRawResponse: true });
        return await audioBytes(out, V.AURA_MODEL);
      } catch (e) {
        error = e;
        await aiFailed(env, `her voice note: ${aiText_(e)}${backup ? "; ElevenLabs spoke it" : ""}`);
        if (!backup) throw new Error(`Workers AI voice: ${aiText_(e)}`);
      } finally {
        aiSpent(ledger, neurons, error);
        await saveLedger(env, ledger);
      }
    }
  }
  if (!backup) throw new Error("Workers AI voice: today's AI budget is spent (or Workers AI is missing) and the ElevenLabs backup is off.");
  return elevenTts(env, text);
}
// Her voice note on an OpenRouter speech model (VOICE.OR_*): MP3 bytes. ElevenLabs when it fails or the day's
// OR_DAILY_USD is spent (if ELEVENLABS_BACKUP), else an error (the note goes as text).
export async function openRouterTts(env, text, ledger = null) {
  const V = CONFIG.VOICE;
  const said = auraText(text, V.OR_CUES);
  if (!said) throw new Error("Nothing to say aloud.");
  const backup = !!V.ELEVENLABS_BACKUP && !!env.ELEVENLABS_API_KEY;
  ledger = ledger || (await loadLedger(env));
  const usd = (said.length / 1000) * (Number(V.OR_USD_PER_1000_CHARS) || 0);
  if (env.OPENROUTER_API_KEY && (ledger.voiceUsd || 0) + usd <= (Number(V.OR_DAILY_USD) || 0) && budget.left() > CONFIG.LIMITS.SUBREQUEST_RESERVE + 2) {
    try {
      const bytes = await orSpeech(env, said);
      spend(ledger, "voiceUsd", usd);
      await saveLedger(env, ledger);
      return bytes;
    } catch (e) {
      await voiceFailed(env, `OpenRouter voice: ${e.message || e}${env.AI ? "; Workers AI aura spoke it" : backup ? "; ElevenLabs spoke it" : ""}`);
      if (!backup && !env.AI) throw e;
    }
  } else if (!backup && !env.AI) throw new Error("OpenRouter voice: today's money for voice notes is spent (VOICE.OR_DAILY_USD) and no backup is set.");
  return env.AI ? auraTts(env, text, ledger) : elevenTts(env, text);
}
// `said` spoken by VOICE.OR_MODEL on OpenRouter: MP3 bytes (Gemini's raw PCM encoded here), or an error
export async function orSpeech(env, said) {
  const V = CONFIG.VOICE;
  const pcm = V.OR_FORMAT === "pcm";
  const body = { model: V.OR_MODEL, input: said, response_format: pcm ? "pcm" : "mp3" };
  if (V.OR_VOICE) body.voice = V.OR_VOICE;
  if (V.OR_INSTRUCTIONS) body.instructions = V.OR_INSTRUCTIONS;
  const res = await xfetch("https://openrouter.ai/api/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(CONFIG.LIMITS.HTTP_TIMEOUT_MS),
  });
  if (!res.ok || /json/.test(res.headers.get("content-type") || "")) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`${V.OR_MODEL} ${res.status}: ${data?.error?.message || "no audio"}`);
  }
  const bytes = await res.arrayBuffer();
  if (bytes.byteLength < 100) throw new Error(`${V.OR_MODEL} gave no audio`);
  return pcm ? pcmToMp3(bytes) : bytes;
}
// Gemini TTS gives raw 16-bit little-endian mono PCM at 24 kHz; Telegram wants MP3 or OGG/Opus
export function pcmToMp3(pcm, rate = 24000) {
  const samples = new Int16Array(pcm.slice(0, pcm.byteLength - (pcm.byteLength % 2)));
  const enc = new Mp3Encoder(1, rate, 64);
  const parts = [];
  for (let i = 0; i < samples.length; i += 1152 * 8) {
    const chunk = enc.encodeBuffer(samples.subarray(i, i + 1152 * 8));
    if (chunk.length) parts.push(chunk);
  }
  const end = enc.flush();
  if (end.length) parts.push(end);
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out.buffer;
}
// Workers AI's answer for audio: a raw Response (returnRawResponse), a stream, or bytes
export async function audioBytes(out, model) {
  if (out && typeof out.arrayBuffer === "function" && "status" in out) {
    if (!out.ok || /json/.test(out.headers.get("content-type") || "")) throw new Error(`${model} ${out.status}: ${(await out.text().catch(() => "")).slice(0, 200)}`);
    out = await out.arrayBuffer();
  } else if (out && typeof out.getReader === "function") out = await new Response(out).arrayBuffer();
  const bytes = out instanceof ArrayBuffer ? out : out?.buffer instanceof ArrayBuffer ? out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) : null;
  if (!bytes || bytes.byteLength < 100) throw new Error(`${model} gave no audio`);
  return bytes;
}
// What aura reads: the allowed tags become VOICE.AURA_CUES ("[laughs] You're ridiculous" -> "Heh... You're ridiculous"),
// every other [...] is dropped (aura would read it aloud)
// `cues`: VOICE.OR_CUES for an OpenRouter model; a cue written as a tag ("[laugh]", "(laughs)", "<giggle>") stays
// where the tag was, a spoken one ("hm") becomes "Hm..."
export function auraText(text, cues = CONFIG.VOICE.AURA_CUES || {}) {
  cues = cues || {};
  const kept = []; // the model's own tags, held as placeholders (TAG_MARK) while every other [...] goes
  const re = audioTagRe();
  let s = String(text || "");
  if (re) {
    s = s.replace(new RegExp(`${re.source}\\s*`, "gi"), (_, t, offset, all) => {
      const key = t.toLowerCase().replace(/\s+/g, " ");
      const cue = Object.hasOwn(cues, key) ? String(cues[key] || "").trim() : "";
      if (!cue) return "";
      if (/^[[(<]/.test(cue)) return `${String.fromCharCode(0xe000 + kept.push(cue) - 1)} `;
      const rest = all.slice(offset + _.length);
      return /\p{L}/u.test(rest) ? `${cue}... ` : `${cue}.`;
    });
  }
  return s
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/(^|[.!?]\s+)([a-z])/g, (_, a, b) => a + b.toUpperCase())
    .trim()
    .replace(TAG_MARK, (c) => kept[c.charCodeAt(0) - 0xe000]);
}
export async function elevenTts(env, text) {
  const V = CONFIG.VOICE;
  const res = await xfetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId(env)}?output_format=${V.FORMAT}`, {
    method: "POST",
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: V.MODEL,
      voice_settings: voiceSettings(),
    }),
    signal: AbortSignal.timeout(CONFIG.LIMITS.HTTP_TIMEOUT_MS),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`ElevenLabs voice ${res.status}: ${elevenError(data)}`);
  }
  return res.arrayBuffer();
}
// eleven_v3 only takes stability, as exactly 0 (Creative), 0.5 (Natural) or 1 (Robust)
export function voiceSettings() {
  const V = CONFIG.VOICE;
  if (isV3()) return { stability: Math.round(Math.min(Math.max(Number(V.STABILITY) || 0, 0), 1) * 2) / 2 };
  return { stability: V.STABILITY, similarity_boost: V.SIMILARITY_BOOST, style: V.STYLE, use_speaker_boost: V.SPEAKER_BOOST, speed: V.SPEED };
}
// Checks the voice works on this account with a short test clip
// clip: false checks the key and the voice only (no credits spent)
export async function checkVoice(env, clip = true) {
  const v = await xfetch(`https://api.elevenlabs.io/v1/voices/${voiceId(env)}`, { headers: { "xi-api-key": env.ELEVENLABS_API_KEY } });
  if (v.status === 401) return { ok: false, detail: "ElevenLabs rejected the key. Check ELEVENLABS_API_KEY." };
  if (!v.ok) {
    return { ok: false, detail: "This voice isn't in your account. On the free plan use a built-in voice or one you designed yourself." };
  }
  if (!clip) return { ok: true, detail: "The key works and the voice is in your account (no test clip, to save credits)." };
  try {
    await elevenTts(env, fill(CONFIG.VOICE.TEST_PHRASE));
    return { ok: true, detail: "Test clip worked." };
  } catch (e) {
    return { ok: false, detail: e.message };
  }
}
export function elevenError(data) {
  const d = data?.detail;
  if (typeof d === "string") return d;
  return d?.message || d?.status || data?.message || "request failed";
}
