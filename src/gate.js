// What a chat may do: pictures allowed, the /nsfw level, the minor rule, daily money caps. One place for the rules (later: paid tiers).
import { CONFIG } from "./config/index.js";
import { runwareRoute } from "./pictures/draw.js";
import { hasWord, nudeWords } from "./pictures/shots.js";
import { aiAffordable } from "./platform/ai.js";
import { budget } from "./platform/http.js";

/* --- who may get pictures, and when --- */

export const testPattern = (name, text) => {
  const src = CONFIG.PICTURE[name];
  try {
    return !!src && new RegExp(src, "i").test(String(text || ""));
  } catch (e) {
    console.error(`PICTURE.${name} is not a valid regular expression`, e);
    return false;
  }
};
// He said he's under 18 (PICTURE.MINOR_PATTERN): no pictures of her from then on
export const saysMinor = (text) => testPattern("MINOR_PATTERN", text);
export async function noteMinor(env, chatId, settings, heard) {
  if (settings.minor || !saysMinor(heard)) return;
  settings.minor = true;
  if (env.REEM_KV) await env.REEM_KV.put(`s:${chatId}`, JSON.stringify(settings)).catch((e) => console.error("couldn't save settings", e));
}
// Pictures are possible at all for this reply (her own [selfie] included): not OOC, not a minor, AI connected,
// within the day's budget and with enough outside calls left
export function picturesAllowed(env, { ooc, settings, ledger }) {
  // Runware (PICTURE.ROUTE) has its own money cap; otherwise Workers AI's neurons decide
  return !!CONFIG.PICTURE.ENABLED && !ooc && !settings.minor && (runwareAffordable(env, ledger, nsfwLevel(settings)) || (!!env.AI && aiAffordable(ledger, "picture"))) &&
    budget.left() >= CONFIG.LIMITS.SUBREQUEST_RESERVE + 4;
}
// Like replyMode for voice: does this reply come with a picture? null, or { kind: "selfie" | "scene", asked }
export function pictureMode({ scene, said, proactive = false, cameAsPhoto = false, morePics = false }) {
  const P = CONFIG.PICTURE;
  if (scene === "together") {
    const asked = !proactive && (testPattern("SCENE_ASK_PATTERN", said) || testPattern("ASK_PATTERN", said));
    return asked || Math.random() < (Number(P.SCENE_CHANCE) || 0) ? { kind: "scene", asked } : null;
  }
  const asked = !proactive && testPattern("ASK_PATTERN", said);
  const chance = cameAsPhoto ? P.CHANCE_AFTER_PHOTO : morePics ? P.CHANCE_MORE : P.CHANCE;
  return asked || Math.random() < (Number(chance) || 0) ? { kind: "selfie", asked } : null;
}
// /nsfw Off and Nude keep sex acts out (Step 2); any other level (On, the default) is today's behavior
export const actsOff = (level) => level === "off" || level === "nude";
// A description with a PICTURE.NOT_DRAWN word or phrase is never drawn. Step 2 (/nsfw): Nude and Off keep NOT_DRAWN
// (no sex acts, even with SEX_ACTS on); Off refuses nude words too (lingerie stays)
export function mayDraw(text, level = CONFIG.PICTURE.NSFW.DEFAULT) {
  const R = CONFIG.PICTURE.RUNWARE || {};
  if (!actsOff(level) && runwareRoute(level) && R.SEX_ACTS === true) return true;
  const list = runwareRoute(level) || level === "off" ? R.NOT_DRAWN : CONFIG.PICTURE.NOT_DRAWN; // Off keeps sex acts and nudity out on any route (2026-10-11)
  if ((list || []).some((w) => String(w).trim() && hasWord(text, w))) return false;
  return !(level === "off" && nudeWords(text)); // Off refuses nude words on every route (2026-10-11)
}
// The tier of a picture: he asks for lingerie/swimwear (BOUDOIR_ASK_PATTERN) → boudoir, for something sexy
// (SEXY_ASK_PATTERN) → never everyday; otherwise by TIER_WEIGHTS for the chat's heat. Only tiers with `shot`.
// Step 2 (2026-10-11): the nude tier only at /nsfw Nude or On and on Runware (Cloudflare draws nothing nude); with NUDE_ASK
// ("send nudes") it is the tier, else boudoir
// The nude tier is allowed: /nsfw Nude or On, and a Runware route (Cloudflare draws nothing nude)
export const nudeTierOk = (level) => (level === "nude" || level === "on") && runwareRoute(level);
// May Runware draw today (its key is set and RUNWARE.DAILY_USD isn't spent)?
export function runwareAffordable(env, ledger, level = CONFIG.PICTURE.NSFW.DEFAULT) {
  const R = CONFIG.PICTURE.RUNWARE || {};
  if (!runwareRoute(level) || !env.RUNWARE_API_KEY) return false;
  return !ledger || (ledger.rwUsd || 0) + (Number(R.USD_PER_PICTURE) || 0) <= (Number(R.DAILY_USD) || 0);
}
// Step 2 (2026-10-11): /nsfw Off / Nude / On for this chat (s:<chat>.nsfw). Off: no nudity, no sex acts, no NUDE or ACT
// LoRAs, Runware's content check on (lingerie and boudoir still allowed). Nude: nudity, no sex acts. On: everything (today).
export const NSFW_LEVELS = ["off", "nude", "on"];
// The chat's level; a missing or unknown value is PICTURE.NSFW.DEFAULT
export function nsfwLevel(settings) {
  const v = String((settings && settings.nsfw) || "").toLowerCase();
  return NSFW_LEVELS.includes(v) ? v : CONFIG.PICTURE.NSFW.DEFAULT;
}
// The lowest level at which a picture's words may be drawn ("off", "nude", "on"), or null when none (NOT_DRAWN at On)
export const levelFor = (text) => NSFW_LEVELS.find((l) => mayDraw(text, l)) || null;
