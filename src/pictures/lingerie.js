// Lingerie and spicy pictures (Nano Banana / klein).
import { herHour } from "../chat/day.js";
import { CONFIG } from "../config/index.js";
import { can } from "../gate.js";
import { isDark, locationOf, timeOfDay } from "./compose.js";
import { pickOne } from "./shots.js";
import { aiRun, aiSpent, aiText } from "../platform/ai.js";
import { budget, fromBase64, toBase64, xfetch } from "../platform/http.js";

// A spicier selfie (PICTURE.LINGERIE.SPICY_PATTERN in his ask or her words, or explicit words): Nano Banana's job
export function isSpicy(pic) {
  const L = CONFIG.PICTURE.LINGERIE || {};
  if (!pic || !pic.args) return false;
  if (pic.explicit) return true;
  return !!L.SPICY_PATTERN && spicyWords(`${pic.asked || ""} ${pic.args.words || ""} ${pic.args.doing || ""}`);
}
// Lingerie (PICTURE.LINGERIE.WORDS) or a spicier ask (SPICY_PATTERN) in a text
export const lingerieWords = (t) => patternIn((CONFIG.PICTURE.LINGERIE || {}).WORDS, t);
export const spicyWords = (t) => patternIn((CONFIG.PICTURE.LINGERIE || {}).SPICY_PATTERN, t);
export function patternIn(src, text) {
  try {
    return !!src && new RegExp(src, "i").test(String(text || ""));
  } catch {
    return false;
  }
}
// A lingerie selfie's words: he asked for lingerie and her words name none (her hoodie, her pajamas): they make way
// for the lingerie wardrobe, so his ask is what's drawn
export function lingerieArgs(pic) {
  const a = pic.args || {};
  return lingerieWords(pic.asked) && !lingerieWords(`${a.words || ""} ${a.doing || ""}`) ? { ...a, words: "", doing: "" } : a;
}
// Does klein's picture show lingerie? VISION.MODEL says what she wears (LINGERIE.CHECK_PROMPT) and LINGERIE.WORDS must
// be in it. { ok, text }; ok when it can't be checked (no check, no budget, an error): the picture is sent as drawn.
export async function lingerieSeen(env, ledger, bytes) {
  const L = CONFIG.PICTURE.LINGERIE || {};
  const V = CONFIG.VISION;
  if (!L.CHECK || !L.WORDS || !env.AI || !can({ ledger }, "ai", "photo") || budget.left() < CONFIG.LIMITS.SUBREQUEST_RESERVE + 3) return { ok: true, text: "" };
  let error = null;
  try {
    const input = { messages: [{ role: "user", content: [{ type: "text", text: L.CHECK_PROMPT }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${toBase64(bytes)}` } }] }], max_tokens: 60 };
    const text = String(aiText(await aiRun(env, V.MODEL, input, V.TIMEOUT_MS)) || "").trim();
    return { ok: !text || lingerieWords(text), text };
  } catch (e) {
    error = e;
    return { ok: true, text: "" };
  } finally {
    aiSpent(ledger, CONFIG.AI_BUDGET.PHOTO_NEURONS, error);
  }
}
// May this picture go to PICTURE.LINGERIE (Nano Banana) today?
export function wantsLingerie(env, ledger, pic, spicy = false, level = CONFIG.PICTURE.NSFW.DEFAULT) {
  const L = CONFIG.PICTURE.LINGERIE || {};
  if (level === "off") return false; // Nano Banana is never drawn at /nsfw Off (2026-10-11): Off's lingerie is Cloudflare klein
  if (!L.ENABLED || !L.MODEL || !env.OPENROUTER_API_KEY || !pic || !(pic.args || pic.lingerie)) return false;
  if (!spicy && !pic.lingerie && !(L.TIERS || []).includes(pic.tier)) return false;
  if (budget.left() < CONFIG.LIMITS.SUBREQUEST_RESERVE + 2) return false;
  return (ledger.usd || 0) + (Number(L.USD_PER_PICTURE) || 0) <= (Number(L.DAILY_USD) || 0);
}
// A spicier selfie for Nano Banana: SPICY_PROMPT (JSON, her description in words) with her words as the garment (else
// SPICY_WARDROBE; `outfit` instead of both), what she's doing (else a SPICY_POSES pose), a boudoir expression, her bedroom (or the place her words name) and its light.
// Returns { prompt (ready, no {who}/{room}), shot, tier, what, location, spicy }
export function spicyPicture(pic, outfit = "") {
  const P = CONFIG.PICTURE;
  const L = P.LINGERIE;
  const a = pic.args || {};
  const words = String(a.words || "").trim();
  // her words name lingerie, or they're not an outfit for this picture (seen in tests: "a hoodie" drawn as the garment)
  const garment = outfit || (lingerieWords(words) ? words : "") || pickOne(L.SPICY_WARDROBE) || pickOne(L.WARDROBE) || "";
  const location = locationOf(`${words} ${a.doing || ""}`) || "bedroom";
  const where = (P.LOCATIONS || {})[location];
  const time = timeOfDay(a.hour ?? herHour());
  const light = pickOne((P.LIGHT || {})[time.toUpperCase()]) || "warm lamp light";
  const fill = { garment, pose: String(a.doing || "").trim() || pickOne(L.SPICY_POSES) || "", expression: pickOne((P.EXPRESSIONS || {}).BOUDOIR) || "", setting: where ? `${where.NAME}: ${where.LOOK}` : "her bedroom", light };
  const prompt = String(L.SPICY_PROMPT || "").replace(/\{(\w+)\}/g, (m, k) => (k in fill ? JSON.stringify(String(fill[k])).slice(1, -1) : m));
  return { prompt, shot: "mirror", tier: "boudoir", angle: null, what: `mirror, ${garment}`, location, night: isDark(a.hour ?? herHour(), light), spicy: true, args: a };
}
// Nano Banana on OpenRouter, text only (LINGERIE.WHO instead of her face, the place in words): picture bytes.
// Google's refusal is an answer with no picture (HTTP 200) and costs nothing; a picture adds USD_PER_PICTURE to ledger.usd.
export async function drawLingerie(env, pic) {
  const P = CONFIG.PICTURE;
  const L = P.LINGERIE;
  const where = pic.location && (P.LOCATIONS || {})[pic.location];
  const room = where ? (P.ROOM_TEXT || "").replace("{look}", where.LOOK || "") : "";
  // Step B: CRAFT is no longer in the composed prompt (drawPictureNow adds it on Cloudflare); Nano Banana gets it here
  const prompt = pic.spicy ? pic.prompt : `${pic.prompt.replace("{room}", room).replace("{who}", `Realistic smartphone photo of ${L.WHO}`)} ${P.CRAFT || ""}`.replace(/\s{2,}/g, " ").trim();
  let res;
  try {
    res = await xfetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: L.MODEL, messages: [{ role: "user", content: prompt }], modalities: ["image", "text"], image_config: { aspect_ratio: L.ASPECT || "9:16" } }),
      signal: AbortSignal.timeout(Number(L.TIMEOUT_MS) || 60000),
    });
  } catch (e) {
    throw new Error(`OpenRouter unreachable or too slow (${e.name})`);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${data?.error?.message || "request failed"}`);
  const choice = (data.choices || [])[0] || {};
  const url = choice.message?.images?.[0]?.image_url?.url || "";
  if (!url.startsWith("data:")) {
    // Google refused (no picture); a refusal costs nothing
    throw new Error(`no picture (${choice.native_finish_reason || choice.finish_reason || "refused"})`);
  }
  return fromBase64(url.slice(url.indexOf(",") + 1));
}
