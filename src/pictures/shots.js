// Which picture: tiers, shots, heat, words, the day's outfits, hair and light.
import { herDay, herHour, inHours } from "../chat/day.js";
import { CONFIG } from "../config/index.js";
import { actsOff, nudeTierOk, testPattern } from "../gate.js";
import { runwareRoute } from "./draw.js";
import { flashAsked } from "./plan.js";
import { escapeRegex } from "../platform/http.js";

/* --- what a picture shows (pictures v3: the shot catalog) --- */

export const COMMON_WORDS = new Set(["selfie", "selfies", "photo", "pic", "picture", "image", "me", "my", "her", "she", "the", "a", "an", "of", "in", "on", "at", "with", "and", "to", "just", "you", "your", "is", "it", "this", "that"]);
export const wordsOf = (t) => (String(t || "").toLowerCase().match(/\p{L}+/gu) || []).filter((w) => w.length > 2 && !COMMON_WORDS.has(w));
// Word overlap between two descriptions, 0 to 1
export function overlap(a, b) {
  const x = new Set(wordsOf(a));
  const y = new Set(wordsOf(b));
  if (!x.size || !y.size) return 0;
  let both = 0;
  for (const w of x) if (y.has(w)) both++;
  return both / Math.min(x.size, y.size);
}
// A whole word or phrase in a text, any case ("see-through", "in bed")
export const hasWord = (text, w) => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(String(w).toLowerCase())}(?![\\p{L}\\p{N}])`, "u").test(String(text || "").toLowerCase());
// A nude word (PICTURE.RUNWARE.NUDE_WORDS) in the text
export const nudeWords = (text) => ((CONFIG.PICTURE.RUNWARE || {}).NUDE_WORDS || []).some((w) => String(w).trim() && hasWord(text, w));
// A sex act (a RUNWARE.NOT_DRAWN word) in words drawn on Runware with SEX_ACTS on; not at Off or Nude
export function sexAct(text, level = CONFIG.PICTURE.NSFW.DEFAULT) {
  const R = CONFIG.PICTURE.RUNWARE || {};
  return !actsOff(level) && runwareRoute(level) && R.SEX_ACTS === true && (R.NOT_DRAWN || []).some((w) => String(w).trim() && hasWord(text, w));
}
// Nude or a sex act on Runware (NUDE_WORDS, or sexAct)
export const explicitWords = (text, level = CONFIG.PICTURE.NSFW.DEFAULT) => sexAct(text, level) || (runwareRoute(level) && nudeWords(text));
export const pickOne = (list) => (Array.isArray(list) && list.length ? list[Math.floor(Math.random() * list.length)] : "");
// A key of {key: weight}, by weight (models don't roll dice); keys in `avoid` only when nothing else is left
export function pickWeighted(weights, avoid = []) {
  let entries = Object.entries(weights || {}).map(([k, w]) => [k, Number(w) || 0]).filter(([, w]) => w > 0);
  const fresh = entries.filter(([k]) => !avoid.includes(k));
  if (fresh.length) entries = fresh;
  const total = entries.reduce((t, [, w]) => t + w, 0);
  if (!total) return null;
  let r = Math.random() * total;
  for (const [k, w] of entries) if ((r -= w) < 0) return k;
  return entries[entries.length - 1][0];
}
// "15-19" (her hours, across midnight too); anything else = any hour
export function inRange(hour, range) {
  const m = /^\s*(\d+)\s*-\s*(\d+)\s*$/.exec(String(range ?? ""));
  return !m || inHours(hour, +m[1], +m[2]);
}
export const TIER_NAMES = ["everyday", "flirty", "boudoir"];
// The shot types of a tier (PICTURE.TIERS), only those in SHOTS
export const tierShots = (tier) => ((CONFIG.PICTURE.TIERS || {})[String(tier).toUpperCase()] || []).filter((t) => Object.hasOwn(CONFIG.PICTURE.SHOTS, t));
// The shot a text names (SHOT_WORDS or a type's own name; the longest match, "selfie" last). null when none.
export function shotNamed(text) {
  const P = CONFIG.PICTURE;
  if (!text) return null;
  const names = { ...Object.fromEntries(Object.keys(P.SHOTS).map((t) => [t, t])), ...(P.SHOT_WORDS || {}) };
  const found = Object.keys(names)
    .filter((w) => Object.hasOwn(P.SHOTS, names[w]) && hasWord(text, w))
    .sort((a, b) => (names[a] === "selfie") - (names[b] === "selfie") || b.length - a.length);
  return found.length ? names[found[0]] : null;
}
// How hot the chat is: 0 calm, 1 warm, 2 hot. HEAT_WORDS in the last HEAT_MESSAGES and his message;
// late at night (LATE_FROM_HOUR to LATE_TO_HOUR) one step hotter.
export function chatHeat(history = [], said = "", hour = herHour()) {
  const P = CONFIG.PICTURE;
  const n = Number(P.HEAT_MESSAGES) || 0;
  const text = [...(n ? history.slice(-n) : []).map((m) => m.content || ""), said].join("\n");
  const hits = (P.HEAT_WORDS || []).filter((w) => String(w).trim() && hasWord(text, w)).length;
  let heat = hits >= (Number(P.HEAT_HOT) || Infinity) ? 2 : hits > 0 ? 1 : 0;
  if (inHours(hour, Number(P.LATE_FROM_HOUR), Number(P.LATE_TO_HOUR))) heat++;
  return Math.min(heat, 2);
}
export function pickTier({ asked = "", heat = 0, shot = null, level = CONFIG.PICTURE.NSFW.DEFAULT } = {}) {
  const P = CONFIG.PICTURE;
  let weights = { ...((P.TIER_WEIGHTS || {})[["CALM", "WARM", "HOT"][heat] || "CALM"] || {}) };
  const nudeOk = nudeTierOk(level);
  if (!nudeOk) weights.nude = 0;
  if (testPattern("NUDE_ASK_PATTERN", asked)) weights = nudeOk ? { nude: 1 } : { boudoir: 1 };
  else if (testPattern("BOUDOIR_ASK_PATTERN", asked)) weights = { boudoir: 1 };
  else if (testPattern("SEXY_ASK_PATTERN", asked)) weights.everyday = 0;
  if (shot) for (const t of Object.keys(weights)) if (!tierShots(t).includes(shot)) weights[t] = 0;
  return pickWeighted(weights) || (shot && TIER_NAMES.find((t) => tierShots(t).includes(shot))) || "everyday";
}
// A shot of the tier for this hour (SHOT_HOURS), not one of the last RECENT_SHOTS types if there's another
export function pickShot(tier, recentShots = [], hour = herHour()) {
  const P = CONFIG.PICTURE;
  const n = Number(P.RECENT_SHOTS) || 0;
  const avoid = n ? recentShots.slice(-n).map((s) => s && s.shot) : [];
  const shots = tierShots(tier);
  const now = shots.filter((t) => inRange(hour, (P.SHOT_HOURS || {})[t]));
  return pickWeighted(Object.fromEntries((now.length ? now : shots).map((t) => [t, 1])), avoid) || Object.keys(P.SHOTS)[0];
}
// The picture the code decided for this reply (she's told its shot in FORMAT): { tier, shot }. `asked` is his
// message when he asked for a picture: a shot he names ("belfie", "your legs") is the one he gets.
export function planShot({ asked = "", history = [], recentShots = [], hour = herHour(), level = CONFIG.PICTURE.NSFW.DEFAULT } = {}) {
  const named = shotNamed(asked);
  const tier = pickTier({ asked, heat: chatHeat(history, asked, hour), shot: named, level });
  const his = !!named && tierShots(tier).includes(named);
  return { tier, shot: his ? named : pickShot(tier, recentShots, hour), named: his };
}
// {shot} and {hint} for what she's told about the picture the code decided
export const shotVars = (plan) => ({ shot: (plan && plan.shot) || "selfie", hint: (plan && (CONFIG.PICTURE.TIER_HINTS || {})[plan.tier]) || "" });
// Step 4: do the words name clothes (WEARING_WORDS, "top", "outfit")?
export const namesClothes = (text) => ["top", "crop top", "outfit", ...(CONFIG.PICTURE.WEARING_WORDS || [])].some((w) => String(w).trim() && hasWord(text, w));
// The outfit band of the day: COLD under 50 F, WARM over 72 F, MILD between; with no weather, by month (Dec-Mar cold, Apr-May and
// Oct-Nov mild, Jun-Sep warm). `day` is herDay()'s YYYY-MM-DD.
export function outfitBand(tempF, day = herDay()) {
  if (Number.isFinite(tempF)) return tempF < 50 ? "COLD" : tempF > 72 ? "WARM" : "MILD";
  const m = Number(String(day).slice(5, 7));
  return [12, 1, 2, 3].includes(m) ? "COLD" : [6, 7, 8, 9].includes(m) ? "WARM" : "MILD";
}
// One home and one out outfit for `day` from the band's lists. `prev` is yesterday's record: neither outfit is the same as its
// yesterday's. `rand` is injectable for the tests. Returns { day, band, home, out }.
export function pickDayOutfits(prev, band, day, rand = Math.random) {
  const W = CONFIG.PICTURE.WARDROBE || {};
  const pick = (list, not) => {
    const pool = (list || []).filter((x) => x !== not);
    return pool[Math.floor(rand() * pool.length)] || (list || [])[0] || "";
  };
  return { day, band, home: pick((W.HOME || {})[band], prev && prev.home), out: pick((W.OUT || {})[band], prev && prev.out) };
}
// Her outfits for today: KV "day" keeps them (picked once per her date; refreshDay keeps the temperature for the band).
// No KV binding: picked and not kept.
export async function dayOutfits(env) {
  const kv = env.REEM_KV;
  const cached = (kv && (await kv.get("day", "json").catch(() => null))) || {};
  const day = herDay();
  if (cached.outfits && cached.outfits.day === day) return cached.outfits;
  const fresh = cached.wxAt && Date.now() - cached.wxAt < 3 * 3600000;
  const outfits = pickDayOutfits(cached.outfits, outfitBand(fresh ? cached.temp : NaN, day), day);
  if (kv) await kv.put("day", JSON.stringify({ ...cached, outfits })).catch(() => {});
  return outfits;
}
// One of HAIRSTYLES (HAIR_CHANCE of the time) when the words name no hairstyle (HAIR_WORDS), else ""
export function pickHair(text) {
  const P = CONFIG.PICTURE;
  if (!(P.HAIRSTYLES || []).length || (P.HAIR_WORDS || []).some((w) => String(w).trim() && hasWord(text, w))) return "";
  return Math.random() < (Number(P.HAIR_CHANCE) || 0) ? pickOne(P.HAIRSTYLES) : "";
}
// The light of a picture: FLASH_LIGHT when a flash is asked, none when the words already name a light (LIGHT_WORDS), else `light`
export function lightFor(words, light, level = CONFIG.PICTURE.NSFW.DEFAULT) {
  if (flashAsked(words, level)) return (CONFIG.PICTURE.RUNWARE || {}).FLASH_LIGHT || light;
  return (CONFIG.PICTURE.LIGHT_WORDS || []).some((w) => String(w).trim() && hasWord(words, w)) ? "" : light;
}
