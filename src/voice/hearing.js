// Hearing his voice notes: Gemini, Whisper, Scribe.
import { CONFIG } from "../config/index.js";
import { aiAffordable, aiFailed, aiRun, aiSpent, aiText_, ApiError, RETRYABLE } from "../platform/ai.js";
import { budget, toBase64, xfetch } from "../platform/http.js";
import { loadLedger, saveLedger } from "../platform/kv.js";
import { tg } from "../platform/telegram.js";
import { elevenError } from "./tts.js";

/* ------------------------------------------------------------------ */
/*  ElevenLabs                                                         */
/* ------------------------------------------------------------------ */

export async function transcribe(env, fileId, mime, seconds) {
  const H = CONFIG.HEARING;
  const timeout = CONFIG.LIMITS.HTTP_TIMEOUT_MS;
  const f = await tg(env, "getFile", { file_id: fileId });
  if (!f.ok) throw new ApiError("Telegram couldn't hand over the audio (bots can only fetch files up to 20 MB).", false);
  const path = f.result.file_path;
  const audio = await xfetch(`https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${path}`, {
    signal: AbortSignal.timeout(timeout),
  }).catch(() => null);
  if (!audio?.ok) throw new ApiError("Couldn't download the voice note from Telegram.", true);
  const bytes = await audio.arrayBuffer();

  // HEARING.OR_FIRST: Gemini on OpenRouter first (words, Arabic, laughs and tone), else Whisper first and Gemini when it
  // fails (owner 2026-10-06: OpenRouter only as the main for her voice); ElevenLabs Scribe last
  const gemini = async () => {
    if (!(H.OR_MODEL && env.OPENROUTER_API_KEY && (Number(seconds) || 0) <= (Number(H.OR_MAX_SECONDS) || 300) && budget.left() > CONFIG.LIMITS.SUBREQUEST_RESERVE + 3)) return null;
    try {
      return await hearWithGemini(env, bytes);
    } catch (e) {
      await aiFailed(env, `hearing a voice note with ${H.OR_MODEL}: ${aiText_(e)}; used ${H.OR_FIRST ? H.MODEL || H.BACKUP_MODEL : H.BACKUP_MODEL}`);
      return null;
    }
  };
  if (H.OR_FIRST) {
    const heard = await gemini();
    if (heard != null) return heard;
  }

  // Workers AI (counted in the day's AI budget)
  if (H.MODEL && env.AI && budget.left() > CONFIG.LIMITS.SUBREQUEST_RESERVE + 2) {
    const ledger = await loadLedger(env);
    const neurons = Math.ceil((Math.max(Number(seconds) || 0, 1) / 60) * CONFIG.AI_BUDGET.HEARING_NEURONS_PER_MIN);
    if (aiAffordable(ledger, "hearing", neurons)) {
      let error = null;
      try {
        const input = { audio: toBase64(bytes), task: "transcribe", vad_filter: true };
        if (H.LANGUAGE) input.language = H.LANGUAGE;
        if (H.PROMPT) input.initial_prompt = H.PROMPT;
        const out = await aiRun(env, H.MODEL, input, H.TIMEOUT_MS);
        const text = out?.text ?? out?.result?.text;
        if (typeof text !== "string") throw new Error(`${H.MODEL} gave no transcript`);
        return text.trim();
      } catch (e) {
        error = e;
        const next = !H.OR_FIRST && H.OR_MODEL && env.OPENROUTER_API_KEY ? H.OR_MODEL : H.BACKUP_MODEL;
        await aiFailed(env, `hearing a voice note with ${H.MODEL}: ${aiText_(e)}${next ? `; used ${next}` : ""}`);
      } finally {
        aiSpent(ledger, neurons, error);
        await saveLedger(env, ledger);
      }
    }
  }
  if (!H.OR_FIRST) {
    const heard = await gemini();
    if (heard != null) return heard;
  }
  if (!H.BACKUP_MODEL || !env.ELEVENLABS_API_KEY) throw new ApiError("Speech-to-text: every way of hearing failed (see /setup).", false);
  return scribe(env, H.BACKUP_MODEL, bytes, mime, path);
}
// His voice note heard by an audio model on OpenRouter (HEARING.OR_MODEL): the transcript, with (laughs) and the like
export async function hearWithGemini(env, bytes, format = "ogg") {
  const H = CONFIG.HEARING;
  const res = await xfetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: H.OR_MODEL, temperature: 0,
      messages: [{ role: "user", content: [{ type: "text", text: H.OR_PROMPT }, { type: "input_audio", input_audio: { data: toBase64(bytes), format } }] }],
    }),
    signal: AbortSignal.timeout(Number(H.OR_TIMEOUT_MS) || 25000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${data?.error?.message || "no answer"}`);
  const text = String(data?.choices?.[0]?.message?.content || "")
    .replace(/^```\w*\s*|\s*```$/g, "").replace(/^\s*(?:transcript(?:ion)?)\s*:\s*/i, "").replace(/^["“](.*)["”]$/s, "$1").trim();
  if (!text) throw new Error("no transcript");
  return text;
}
// ElevenLabs speech-to-text (the backup)
export async function scribe(env, model, bytes, mime, path) {
  const H = CONFIG.HEARING;
  const timeout = CONFIG.LIMITS.HTTP_TIMEOUT_MS;
  const form = new FormData();
  form.append("model_id", model);
  if (H.LANGUAGE) form.append("language_code", H.LANGUAGE); // empty: ElevenLabs detects it
  form.append("tag_audio_events", String(!!H.TAG_AUDIO_EVENTS));
  form.append("file", new Blob([bytes], { type: mime || "audio/ogg" }), path.split("/").pop() || "voice.ogg");

  let res;
  try {
    res = await xfetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": env.ELEVENLABS_API_KEY },
      body: form,
      signal: AbortSignal.timeout(timeout),
    });
  } catch (e) {
    throw new ApiError(`ElevenLabs speech-to-text unreachable or too slow (${e.name})`, true);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(`ElevenLabs speech-to-text ${res.status}: ${elevenError(data)}`, RETRYABLE.has(res.status));
  return (data.text || "").trim();
}
