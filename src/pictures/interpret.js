// Words → ShotSpec (Rebuild Step 2, 2026-10-16): his /pic words, /look's text, her selfie (composePicture's picks) and her in-person
// scenes. Every decision about the picture is made here, before any prompt words: the view, the content, the act and its position,
// which clothes stay (act vs clothes), the place and its crop, the light, the expression, the hair, the aspect. framePrompt only
// phrases the result.
import { CONFIG } from "../config/index.js";
import { can } from "../gate.js";
import { isDark, locationOf, ownHands, timeOfDay } from "./compose.js";
import * as FR from "./frames.js";
import { ruleWords } from "./lint.js";
import { pictureFlags, stillWorn } from "./plan.js";
import { placeNames } from "./refs.js";
import { hasWord, lightFor, pickHair, pickOne, pickWeighted, sexAct } from "./shots.js";
import { newSpec } from "./spec.js";
import { escapeRegex } from "../platform/http.js";

const list = (s) => (Array.isArray(s) ? s : String(s || "").split(",")).map((w) => String(w).trim()).filter(Boolean);
const names = (text, words) => list(words).some((w) => hasWord(text, w) || hasWord(text, `${w}s`));
// phrases that are no garment by themselves (PARTIAL_WORDS/TOP_WORDS) → words for what she wears
const GARMENT_PHRASES = { "covered breasts": "a top covering her breasts", "breasts covered": "a top covering her breasts", "covered chest": "a top covering her breasts", "chest covered": "a top covering her breasts", "top on": "her top", "shirt on": "her shirt", "bra on": "her bra" };
// a top named with nothing below it: the bottom said affirmatively (was DRESSED_BOTTOM's "never bare")
const DEFAULT_BOTTOM = "fitted blue jeans";
const DEFAULT_TOP = "a fitted black tank top"; // ...and bottoms named with no top

// What she wears, as far as the frame shows it (Step 3b, 2026-10-16: a chest-up selfie that named "fitted blue jeans" was drawn to her
// hips 2/2; the owner's rule: name nothing the frame doesn't hold). Face and chest-up framings drop each part that names only a bottom
// (BOTTOM_WORDS, not a top or a one-piece); a part with both stays. Nothing left → the words as they were.
export const CLOSE_FRAMINGS = ["face", "chest-up"];
export function inFrameOutfit(words, framing) {
  if (!CLOSE_FRAMINGS.includes(framing) || !words) return words;
  const g = garmentLists();
  const parts = String(words).split(/,\s*(?:and\s+)?|\s+and\s+/);
  const kept = parts.filter((p) => !(names(p, g.bottom) && !names(p, g.top) && !names(p, g.onePiece)));
  return kept.length && kept.length < parts.length ? kept.join(" and ") : words;
}
// The garment words of the picture's lists: WEARING_WORDS, TOP_WORDS, BOTTOM_WORDS, ONE_PIECE_WORDS
function garmentLists() {
  const P = CONFIG.PICTURE;
  const R = P.RUNWARE || {};
  return { all: [...list(P.WEARING_WORDS), ...list(R.TOP_WORDS), ...list(R.BOTTOM_WORDS), ...list(R.ONE_PIECE_WORDS)], top: list(R.TOP_WORDS), bottom: list(R.BOTTOM_WORDS), onePiece: list(R.ONE_PIECE_WORDS), bare: list(R.BARE_LEGS_WORDS) };
}
// The clothes in some words: { garments: [phrase], rest: [segment] } (rest: what is left of each comma segment, for the pose). A segment
// with "in/wearing/into/has on <garment phrase>" gives that phrase and keeps the rest; a segment that is all clothes gives itself.
// Clothes said to be off are gone first (stillWorn); a pose that sounds like clothes ("on her heels", "on top") is no garment.
export function garmentsOf(text) {
  const G = garmentLists();
  const garments = [];
  const rest = [];
  const worn = stillWorn(String(text || ""));
  for (let seg of worn.split(/[,;]|\.\s/)) {
    seg = seg.trim();
    if (!seg) continue;
    const probe = seg.replace(/\bon (?:her|his|your) heels\b/gi, "").replace(/\b(?:on|from|at) (?:the )?top\b|\btop of\b/gi, "");
    const phrase = Object.keys(GARMENT_PHRASES).find((p) => hasWord(seg, p));
    if (phrase) {
      garments.push(GARMENT_PHRASES[phrase]);
      const left = seg.replace(new RegExp(escapeRegex(phrase), "i"), "").trim();
      if (left) rest.push(left);
      continue;
    }
    if (!names(probe, G.all)) {
      rest.push(seg);
      continue;
    }
    const m = seg.match(/\b(?:in|wearing|into|has on|dressed in|wears|she wears|she is wearing|pulls on|only)\s+(.+)$/i);
    let g = (m ? m[1] : seg).replace(/^(?:only|just|still)\s+/i, "").replace(/\s+(?:on|still on|from earlier|from before)$/i, "").trim();
    // "a white tank top and jeans": two garments (an act keeps the top and takes off the jeans); "a cardigan over a cami" stays one
    // a place after the clothes ("lingerie on the bed") goes to the pose
    const at = g.search(/\s+(?:on|at|in|by|near|against)\s+(?:the|her|his|my)\b/i);
    if (at > 0) {
      rest.push(g.slice(at).trim());
      g = g.slice(0, at).trim();
    }
    const parts = g.split(/\s+(?:and|&)\s+/).map((x) => x.replace(/\s+(?:on|from earlier|from before)$/i, "").trim()).filter(Boolean);
    garments.push(...(parts.length > 1 && parts.every((x) => names(x, G.all)) ? parts : [g]));
    const left = m ? seg.slice(0, m.index).trim() : "";
    if (left) rest.push(left);
  }
  return { garments, rest };
}
// ["a", "b", "c"] → "a, b and c"
const joinList = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}` : xs[0] || "");
// "gray cardigan" → "a gray cardigan" (a phrase with its own determiner or a plural like "jeans" stays)
export function withArticle(phrase) {
  const p = String(phrase || "").trim();
  const head = p.split(/\s+(?:and|over|with|under)\s+/i)[0].trim().split(/\s+/).at(-1);
  if (!p || /^(?:a|an|the|her|his|my|your|some|only|just|one|two|\d)\b/i.test(p) || /[^su]s$/i.test(head)) return p;
  return `${/^[aeiou]/i.test(p) ? "an" : "a"} ${p}`;
}
// What kind of garment a phrase is: "top" | "bottom" | "one-piece" | "other" (shoes, socks, a scarf)
function garmentKind(phrase) {
  const G = garmentLists();
  if (names(phrase, G.onePiece)) return "one-piece";
  const top = names(phrase, G.top);
  const bottom = names(phrase, G.bottom);
  return top && !bottom ? "top" : bottom && !top ? "bottom" : top && bottom ? "both" : "other";
}
// Phrases out of the pose words (the act, nudity, the shot type, close-up words: framePrompt says them), with "him"/"the man" right after
function stripPhrases(text, phrases) {
  let t = String(text || "");
  for (const p of [...phrases].sort((a, b) => b.length - a.length)) {
    t = t.replace(new RegExp(`(?<![\\p{L}])${escapeRegex(p)}(?:s)?(?:\\s+(?:him|the man|POV|me))?(?![\\p{L}])`, "giu"), " ");
  }
  return t.replace(/\s+([,.;])/g, "$1").replace(/^[\s,.;:]+|[\s,;:]+$/g, "").replace(/\s{2,}/g, " ").trim();
}
// The act the words name: { name, hole, position, back, oral } or null. `anal`: the words name anal (ANAL_WORDS); its position by the
// words (riding = reverse cowgirl), else ANAL_POSITIONS (a random pick made here, so a redraw keeps it)
export function actOf(text, { anal = false } = {}) {
  const R = CONFIG.PICTURE.RUNWARE || {};
  const hit = Object.entries(FR.ACTS).find(([, a]) => list(a.words).some((w) => hasWord(text, w)));
  if (anal) {
    let name = hit ? hit[1].analAs || hit[0] : "";
    if (!FR.ANAL_ACTS.includes(name)) name = "";
    if (!name) {
      const picked = pickWeighted(R.ANAL_POSITIONS || {}) || "doggy";
      name = picked === "doggy" ? "doggy style" : picked;
    }
    const a = FR.ACTS[name];
    return { name, hole: "anus", position: name, back: name !== "missionary", oral: false, words: list(a.words) };
  }
  if (!hit) return { name: "act", hole: "vagina", position: "", back: false, oral: false, words: [] };
  const [name, a] = hit;
  return { name, hole: a.hole, position: name, back: !!a.back, oral: !!a.oral, solo: !!a.solo, words: list(a.words) };
}
// The place (LOCATIONS key) and its picture: { key, crop, night }. `withPicture` false: words only (acts, close-ups)
export function placeOf(key, night, withPicture = true) {
  if (!key) return { key: "", crop: "", night: !!night };
  const nightKey = night && placeNames(`${key}_night`).length ? `${key}_night` : key;
  return { key, crop: withPicture ? pickOne(placeNames(nightKey)) || "" : "", night: !!night };
}
// The light of her hour, or "" when the words name the light; night = isDark
function lightNow(words, hour, level) {
  const P = CONFIG.PICTURE;
  const time = timeOfDay(hour);
  const picked = pickOne((P.LIGHT || {})[time.toUpperCase()]);
  const light = lightFor(words, picked, level);
  const night = time === "night" || isDark(hour, light || words) || /\b(?:at night|tonight|midnight|in the dark)\b/i.test(words);
  // dark: the night sentence (her face lit by the room's lamps) when the words name no light of their own
  return { light: night ? "" : light, night, dark: night && !!light };
}
// An expression for a spec whose words name none (FACE_WORDS): her tier's (selfies) or the content's mood
function expressionFor(words, { tier = "", oral = false, content = "clothed" } = {}) {
  const P = CONFIG.PICTURE;
  const R = P.RUNWARE || {};
  if ((R.FACE_WORDS || []).some((w) => String(w).trim() && hasWord(words, w))) return "";
  if (tier && (P.EXPRESSIONS || {})[tier.toUpperCase()]) return pickOne(P.EXPRESSIONS[tier.toUpperCase()]);
  const M = R.MOODS || {};
  return pickOne(content === "act" ? (oral && M.ORAL) || M.ACT : content === "clothed" ? M.EVERYDAY : M.HEATED) || "";
}
// The shape of a picture: an act's by ASPECTS, a crotch close-up CLOSE_SHAPE, else 9:16
function aspectOf(act, close) {
  const R = CONFIG.PICTURE.RUNWARE || {};
  if (act) return pickWeighted((R.ASPECTS || {})[act.oral ? "ORAL" : "ACT"] || {}) || "9:16";
  return close ? String(R.CLOSE_SHAPE || "1:1") : "9:16";
}
// The words' content: { flags, content, act, outfit: { words, kept }, back, close, rest } with the act-vs-clothes rule (owner 2026-10-15):
// pulled aside or down doesn't draw yet, so a garment over the act's region comes off (below the waist for vaginal and anal acts;
// nothing is in the way of the mouth or a hand); the rest may stay ("garmentState" off/on). Clothed words with only a top get a bottom.
export function readWords(text, { level = CONFIG.PICTURE.NSFW.DEFAULT, nude = false, act: actName = "" } = {}) {
  const R = CONFIG.PICTURE.RUNWARE || {};
  const flags = pictureFlags(text, true, level);
  const actsOk = can({ level }, "acts") && level !== "off";
  const isAct = actsOk && (flags.act || !!actName);
  const isNude = level !== "off" && (flags.nude || nude || isAct);
  const { garments, rest } = garmentsOf(text);
  let act = null;
  let kept = garments;
  if (isAct) {
    const anal = flags.anal || /\banal\b/i.test(actName);
    act = actOf(actName ? `${actName} ${text}` : text, { anal });
    if (act.hole === "vagina" || act.hole === "anus") kept = garments.filter((g) => ["top", "other"].includes(garmentKind(g)));
  }
  const kinds = kept.map(garmentKind);
  const keptKind = kinds.length && kinds.every((k) => k === "top" || k === "other") && kinds.includes("top") ? "top" : kinds.length && kinds.every((k) => k === "bottom" || k === "other") && kinds.includes("bottom") ? "bottom" : "";
  let content = isAct ? "act" : isNude ? (kept.length ? "partial" : "nude") : "clothed";
  let words = joinList(kept.map(withArticle));
  if (content === "clothed" && words && kinds.includes("top") && !kinds.some((k) => k === "bottom" || k === "one-piece" || k === "both") && !names(text, garmentLists().bare)) words = `${words} and ${DEFAULT_BOTTOM}`;
  else if (content === "clothed" && words && kinds.includes("bottom") && !kinds.some((k) => k === "top" || k === "one-piece" || k === "both")) words = `${DEFAULT_TOP} and ${words}`;
  const close = isNude && !isAct && !!flags.close;
  const back = act ? act.back : flags.back || (!isNude && list(R.NUDE_BACK_WORDS).some((w) => hasWord(text, w)));
  return { flags, content, act, outfit: { words, kept: content === "clothed" ? "" : keptKind }, back, close, rest, garments, garmentState: isAct && kept.length < garments.length ? "off" : "on" };
}
// The pose words: what is left of the segments, without the act, nudity, shot and close-up words, in the rules' words (ruleWords)
function poseOf(rest, extra = []) {
  const P = CONFIG.PICTURE;
  const R = P.RUNWARE || {};
  const phrases = [...list(R.NUDE_WORDS), ...list(R.ANAL_WORDS), ...list(R.CLOSE_WORDS), ...list(R.NOT_DRAWN), ...Object.values(FR.ACTS).flatMap((a) => list(a.words)), ...FR.TYPE_WORDS, "topless", "completely", "fully", "partly", ...extra];
  // a segment left with only fillers ("Still", "and then") goes
  const segs = rest.map((s) => stripPhrases(s, phrases)).filter((s) => /\p{L}{3,}/u.test(s.replace(/\b(?:the man|POV|him|her|she|on|in|with|and|of|the|a|still|then|now|just|again|so)\b/gi, "")));
  return ownHands(ruleWords(segs.join(", ")));
}

// /pic and /look with her: the words → a spec. ctx: { source, level, hour, dayWear, view (default "pov"), outside }
export function specFromWords(words, { source = "pic", level = CONFIG.PICTURE.NSFW.DEFAULT, hour, dayWear = null, view = "", act: actName = "", wearing = "" } = {}) {
  const P = CONFIG.PICTURE;
  const text = String(words || "");
  const w = readWords(text, { level, act: actName });
  // only /pic picks a shot, and only by a photo-type word (PHOTO_TYPES); /look and scenes are what POV sees
  const typeWord = view || w.close ? "" : Object.keys(FR.PHOTO_TYPES).find((k) => hasWord(text, k)) || "";
  const framingWord = w.close ? "" : Object.keys(FR.FRAMING_WORDS).find((k) => hasWord(text, k)) || "";
  let shot = typeWord ? FR.SHOTS[FR.PHOTO_TYPES[typeWord]] : null;
  if (shot && shot.view === "mirror" && w.back && !shot.back) shot = FR.SHOTS["mirror-back"];
  const v = w.content === "act" ? "pov-act" : w.close ? "closeup" : (shot && shot.view) || view || "pov";

  const { light, night, dark } = lightNow(text, hour, level);
  const key = locationOf(text) || (shot && shot.places ? pickOne(shot.places) : "");
  const place = placeOf(key, night, v !== "pov-act" && v !== "closeup");
  // clothed and no clothes named: what she wears (the scene's, the day's outfit outside or at home, else SCENE_WEARING)
  const outside = (P.OUTSIDE_WORDS || []).some((x) => String(x).trim() && hasWord(text, x));
  const outfit = { key: "", refId: "", ...w.outfit };
  if (w.content === "clothed" && !outfit.words) outfit.words = wearing || (dayWear ? (outside ? dayWear.out : dayWear.home) : P.SCENE_WEARING || "");
  const spec = newSpec({
    source,
    view: v,
    content: w.content,
    act: w.act && { name: w.act.name, hole: w.act.hole, position: w.act.position },
    back: !!w.back || !!(shot && shot.back),
    outfit,
    garmentState: w.garmentState,
    hair: { key: w.close ? "" : pickHair(text), refId: "" },
    place,
    light,
    dark,
    expression: w.close ? "" : expressionFor(text, { oral: !!(w.act && w.act.oral), content: w.content }),
    pose: [shot && shot.back && shot.pose, poseOf(w.rest, w.act ? w.act.words : [])].filter(Boolean).join(", "),
    framing: w.close ? "crotch" : v === "pov-act" ? "" : FR.FRAMING_WORDS[framingWord] || (shot && shot.framing) || FR.DEFAULT_FRAMING[v] || "",
    aspect: aspectOf(w.act, w.close),
    angle: v === "selfie" || (shot && shot.angle) ? pickWeighted(P.ANGLE_WEIGHTS || {}) || "" : "",
    side: v === "selfie" ? pickOne(["left", "right"]) : "",
  });
  return finishSpec(spec, { oral: !!(w.act && w.act.oral) });
}
// /look: with her, a POV spec from its text; without her, the scene alone
export function specFromLook(text, withHer, opts = {}) {
  if (withHer) return specFromWords(text, { ...opts, source: "look", view: "pov" });
  const { light, night, dark } = lightNow(text, opts.hour, opts.level);
  return newSpec({ source: "look", herself: false, view: "alone", content: "clothed", alone: ruleWords(String(text || "")), light, dark, place: { key: "", crop: "", night }, framing: "", aspect: "9:16" });
}
// Her in-person scene (startPicture "scene"): `what` = her narration about her (scenePicturePrompt), `cue` = SEX_CUES' act name or "",
// `wearing` = sceneWearing's clothes
export function specFromScene(what, { cue = "", wearing = "", level, hour, dayWear = null } = {}) {
  what = String(what || "").replace(/^Sex act:[^.]*\.\s*/i, ""); // scenePicturePrompt's label: the act comes as `cue`
  return { ...specFromWords(what, { source: "scene", level, hour, dayWear, view: "pov", act: cue, wearing }), source: "scene" };
}
// Her selfie (composePicture's answer: its `frame` picks) → a spec. Her words and `doing` decide the content with the tier (nude tier
// = nude); the shot gives the view, framing and pose; the wardrobe pick (or the day's outfit) is what she wears.
export function specFromSelfie(pic, { level = CONFIG.PICTURE.NSFW.DEFAULT, hour } = {}) {
  const P = CONFIG.PICTURE;
  const f = pic.frame || {};
  let shot = FR.SHOTS[pic.shot] || FR.SHOTS.selfie;
  const text = [f.words, f.doing].filter(Boolean).join(", ");
  const nudeTier = pic.tier === "nude";
  const clothesText = String(f.clothes || "");
  // the tier's NUDE wardrobe line ("topless, in only black lace panties") counts as her words for what is bare and what stays
  const w = readWords(nudeTier && !f.words ? clothesText : text, { level, nude: nudeTier });
  if (shot.view === "mirror" && w.back && !shot.back) shot = FR.SHOTS["mirror-back"];
  const v = w.content === "act" ? "pov-act" : shot.view;
  const [pose0, poseKey] = shot.poses ? pickOne(shot.poses) : [shot.pose || "", ""];
  const key = f.location || poseKey || (shot.places ? pickOne(shot.places) : "");
  const { light, night, dark } = lightNow(text, hour, level);
  const outfit = { key: "", refId: "", ...w.outfit };
  if (w.content === "clothed" && !outfit.words) outfit.words = clothesText;
  const spec = newSpec({
    source: "selfie",
    view: v,
    content: w.content,
    act: w.act && { name: w.act.name, hole: w.act.hole, position: w.act.position },
    back: !!w.back || !!shot.back,
    outfit,
    garmentState: w.garmentState,
    hair: { key: pickHair(text), refId: "" },
    place: placeOf(key, night, v !== "pov-act" && v !== "closeup"),
    light: shot.light === "" ? "" : light,
    dark: shot.light === "" ? false : dark,
    expression: v === "closeup" ? "" : expressionFor(text, { tier: w.content === "act" ? "" : pic.tier, oral: !!(w.act && w.act.oral), content: w.content }),
    pose: [ruleWords(pose0), poseOf(w.rest, w.act ? w.act.words : [])].filter(Boolean).join(", "),
    framing: v === "pov-act" ? "" : shot.framing,
    aspect: aspectOf(w.act, false),
    angle: shot.angle ? pickWeighted(P.ANGLE_WEIGHTS || {}, (f.lastAngle && [f.lastAngle]) || []) || "" : "",
    side: v === "selfie" ? pickOne(["left", "right"]) : "",
  });
  return finishSpec(spec, { oral: !!(w.act && w.act.oral) });
}
// inFrame and edges, for the log (the frames say them in words)
function finishSpec(spec, { oral = false } = {}) {
  if (spec.view === "selfie" && spec.side) spec.edges = [{ part: "her extended forearm", edge: spec.side }];
  if (spec.content === "act") spec.inFrame = { her: [], pov: spec.act.name === "masturbating" ? [] : oral || spec.act.hole === "hand" ? ["lower belly", "penis"] : ["lower belly", "penis", "hips"] };
  return spec;
}
// The picture writer's JSON fields applied to a spec (Step 2: the writer fills fields, code phrases them). Each field passes ruleWords;
// a field that adds nudity or a sex act the spec hasn't is dropped; clothes count only on a clothed spec; a place only by its key.
export function applyWritten(spec, fields, { level = CONFIG.PICTURE.NSFW.DEFAULT } = {}) {
  const P = CONFIG.PICTURE;
  const R = P.RUNWARE || {};
  if (!fields || typeof fields !== "object") return null;
  const clean = (x) => ruleWords(String(x || "").replace(/[\n*"“”]/g, " ")).slice(0, 300);
  const adds = (x) => (spec.content !== "act" && sexAct(x, level)) || (spec.content === "clothed" && list(R.NUDE_WORDS).some((w) => hasWord(x, w)));
  const out = { ...spec, outfit: { ...spec.outfit }, place: { ...spec.place } };
  const action = clean(fields.action);
  if (action && !adds(action)) out.pose = action;
  const outfit = clean(fields.outfit);
  if (spec.content === "clothed" && outfit && !adds(outfit) && garmentsOf(outfit).garments.length) out.outfit.words = outfit;
  const place = String(fields.place || "").trim();
  if (place && Object.hasOwn(P.LOCATIONS || {}, place) && place !== spec.place.key) Object.assign(out.place, placeOf(place, spec.place.night, !!spec.place.crop || (spec.view !== "pov-act" && spec.view !== "closeup")));
  const expression = clean(fields.expression);
  if (expression && !adds(expression)) out.expression = expression;
  return out;
}
