// The Telegram Bot API: tg(), sending texts, voice notes and photos, chat actions.
import { typingTime } from "../chat/respond.js";
import { cache, CONFIG } from "../config/index.js";
import { budget, escapeHtml, sleep, xfetch } from "./http.js";

// Shows "typing..." or "recording voice message..." for `ms`. Each status lasts ~5 s and costs one
// outside call, so on long waits she first goes quiet (like someone thinking or deleting a draft)
// and the status shows for the stretch just before the message lands.
export async function act(env, chatId, action, ms, upcoming = 1) {
  const every = CONFIG.TIMING.STATUS_REFRESH_MS;
  const end = Date.now() + Math.max(0, ms);
  const spare = budget.left() - upcoming - CONFIG.LIMITS.SUBREQUEST_RESERVE;
  const pings = Math.max(0, Math.min(Math.ceil(ms / every), Math.floor(spare / Math.max(upcoming, 1))));
  await sleep(end - pings * every - Date.now());
  for (let sent = 0; sent < pings && Date.now() < end - 300; sent++) {
    await tg(env, "sendChatAction", { chat_id: chatId, action });
    await sleep(Math.min(every, end - Date.now()));
  }
  await sleep(end - Date.now());
}
// Sends picture bytes. Returns the message id, or null. `sent` gets Telegram's message (its photo ids).
export async function sendPhoto(env, chatId, bytes, caption = "", sent = null) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  if (caption) form.append("caption", caption);
  form.append("photo", new Blob([bytes], { type: "image/jpeg" }), "photo.jpg");
  try {
    const res = await xfetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`, { method: "POST", body: form });
    const data = await res.json().catch(() => null);
    if (!data?.ok) console.error("sendPhoto failed", data?.description || res.status);
    if (sent && data?.ok && data.result) Object.assign(sent, data.result);
    return data?.ok && data.result ? data.result.message_id : null;
  } catch (e) {
    console.error("sendPhoto got no answer", e);
    return null;
  }
}
/* ------------------------------------------------------------------ */
/*  Telegram                                                           */
/* ------------------------------------------------------------------ */

export async function tg(env, method, body) {
  try {
    const res = await xfetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }));
  } catch (e) {
    return { ok: false, description: String(e.message || e) };
  }
}
// Plain notices (setup messages). Returns the id of the first message sent, or null.
export async function sendText(env, chatId, text) {
  const max = CONFIG.TELEGRAM.MAX_MESSAGE_CHARS;
  let first = null;
  for (let i = 0; i < text.length; i += max) {
    const r = await tg(env, "sendMessage", { chat_id: chatId, text: text.slice(i, i + max) });
    if (first == null && r.ok && r.result) first = r.result.message_id;
  }
  return first;
}
// Her own messages: *actions* show in italics.
// Re-sent as plain text only when Telegram answered and refused the first one (error_code).
// On a network hiccup the first copy may already be in the chat, so it is never sent twice.
// Returns the message id, or null.
export async function sendReem(env, chatId, text) {
  const res = await tg(env, "sendMessage", { chat_id: chatId, text: toHtml(text).slice(0, CONFIG.TELEGRAM.MAX_MESSAGE_CHARS), parse_mode: "HTML" });
  if (res.ok) return res.result ? res.result.message_id : null;
  if (res.error_code) return sendText(env, chatId, plain(text));
  console.error("sendMessage got no clear answer, not resending:", res.description);
  return null;
}
// Each message takes as long as she would need to type it, then lands.
// Returns what was sent as history parts: [{ id, text }]
export async function sendBubbles(env, chatId, bubbles, { deadline = Date.now() + 20000, typedAlready = 0 } = {}) {
  const parts = [];
  for (let i = 0; i < bubbles.length; i++) {
    const left = bubbles.length - i;
    let wait = typingTime(bubbles[i]) - (i === 0 ? typedAlready : 0);
    wait = Math.min(wait, (deadline - Date.now()) / left - 500);
    if (wait > 300) await act(env, chatId, "typing", wait, left);
    parts.push({ id: await sendReem(env, chatId, bubbles[i]), text: bubbles[i] });
  }
  return parts;
}
// { delivered, id, error }. Not delivered only when Telegram clearly refused the note, so the text
// fallback can't double it.
export async function sendVoice(env, chatId, audio) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  // MP3 (ElevenLabs' mp3 formats, OpenRouter) or OGG/Opus (aura, ElevenLabs opus): Telegram takes both as a voice note
  const head = new Uint8Array(audio instanceof ArrayBuffer ? audio.slice(0, 4) : new ArrayBuffer(0));
  const ogg = !head.length || String.fromCharCode(...head) === "OggS";
  form.append("voice", new Blob([audio], { type: ogg ? "audio/ogg" : "audio/mpeg" }), ogg ? "voice.ogg" : "voice.mp3");
  let res;
  try {
    res = await xfetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendVoice`, { method: "POST", body: form });
  } catch (e) {
    console.error("sendVoice got no answer, assuming it arrived:", e);
    return { delivered: true, id: null };
  }
  const data = await res.json().catch(() => null);
  if (!data) return { delivered: res.ok, id: null, error: `Telegram sendVoice HTTP ${res.status}` };
  if (!data.ok) return { delivered: false, id: null, error: `Telegram sendVoice: ${data.description || res.status}` };
  return { delivered: true, id: data.result ? data.result.message_id : null };
}
export async function webhookSecret(env) {
  if (cache.secret) return cache.secret;
  const bytes = new TextEncoder().encode(`reem:${env.TELEGRAM_BOT_TOKEN || ""}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  cache.secret = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return cache.secret;
}
export function toHtml(t) {
  return escapeHtml(t).replace(/\*([^*\n]+)\*/g, "<i>$1</i>");
}
export function plain(t) {
  return String(t).replace(/\*([^*\n]+)\*/g, "$1");
}
