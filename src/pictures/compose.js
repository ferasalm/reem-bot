// The Cloudflare klein prompt: selfies, scenes, what she wears, hands and the POV rules.
import { hisName } from "../chat/commands.js";
import { herHour } from "../chat/day.js";
import { inPerson, sentencesOf } from "../chat/shape.js";
import { CONFIG } from "../config/index.js";
import { can, testPattern } from "../gate.js";
import { filterSafe, runwareRoute, safeLine } from "./draw.js";
import { pictureFlags } from "./plan.js";
import {
  chatHeat, explicitWords, hasWord, inRange, lightFor, namesClothes, nudeWords, overlap, pickOne, pickShot, pickTier,
  pickWeighted, shotNamed, tierShots, wordsOf,
} from "./shots.js";
import { escapeRegex } from "../platform/http.js";

// In a sex-act picture he is "the man" (POV_MAN): /pic's me/my/I, a scene's you/he/his become him before aboutHer
export const theMan = (t) => String(t || "").replace(/\bi(?:'|’)m\b/gi, "the man is").replace(/\b(?:my|your|his)\b/gi, "the man's").replace(/\b(?:me|you|him|i|he)\b/gi, "the man").replace(/\bthe man's own\b/gi, "the man's");
// A line about where she is or what she's doing ("just lying in bed scrolling", "i'm in my ratty t-shirt")
export const DOING = /\b(?:in|on) (?:my|the) |\b(?:lying|laying|sitting|cooking|working|reading|walking|wearing|curled|stretched|scrolling|finished|eating|drinking|at (?:my|the|home|a|work)|in bed|outside)\b/i;
// The model talking about the task instead of describing a picture
export const SELFIE_META = /\b(?:supposed to|i(?:'|’)?m (?:going|gonna) to|reply(?:ing)? to (?:you|him)|as requested|since that(?:'|’)s what)\b/i;
// The picture is of her: "you"/"I" in what the model wrote become "her"/"she"
export const aboutHer = (t) => String(t || "").replace(/\byou(?:'|’)re\b/gi, "she is").replace(/\byou(?:'|’)ve\b/gi, "she has").replace(/\byou(?:'|’)ll\b/gi, "she will").replace(/\byou(?:'|’)d\b/gi, "she would").replace(/\byour\b/gi, "her").replace(/\byou\b/gi, "her").replace(/\bmy\b/gi, "her").replace(/\bme\b/gi, "her").replace(/\bi'?m\b/gi, "she is").replace(/\bi\b/gi, "she").replace(/[{}[\]]/g, "").trim();
// What her [selfie: ...] says, ready for composePicture: { shot, words, doing, explicit }.
// She may name the shot first ("mirror-back, black leggings"). Words with a NOT_DRAWN word aren't drawn
// (explicit: the sexiest allowed picture instead); words too close to a recent picture aren't either.
// No [selfie] at all: `doing` is what she just said she's doing ("just finished dinner"), if drawable.
export function selfieSubject(want, recent = [], said = "", level = CONFIG.PICTURE.NSFW.DEFAULT) {
  const P = CONFIG.PICTURE;
  // Seen live: "[Now, I'm supposed to reply to you with a picture...]" is the model talking about the task
  if (want && SELFIE_META.test(want)) want = "";
  let words = aboutHer(want)
    // "...The photo comes through: flash-bright, her bathroom mirror, ...": only what the picture shows
    .replace(/^[\s\S]*\b(?:photo|picture|pic|selfie)\b[^:\n]{0,30}:\s*(?=\S)/i, (m) => (/\bmirror\b/i.test(m) && !/^mirror/i.test(m.split(":").pop()) ? "mirror selfie, " : ""))
    .replace(/^(?:she\s+)?(?:texts?|sends?)\b[^—:.\n]{0,40}?\b(?:(mirror)\s+)?(?:selfie|pic|picture|photo)\s*(?:[—:.-]\s*(?:in it,?\s*)?|,\s*)/i, (m, mirror) => (mirror ? "mirror selfie, " : ""))
    .replace(/^(?:she\s+)?(?:texts?|sends?)\s+(?:her\s+|him\s+)?an?\s+([^,.]{0,30}?)\s*(?:selfie|pic|picture|photo)\b[,.:]?\s*/i, "$1, ")
    .replace(/^[\s,]+/, "");
  let shot = null;
  // Only a label ("mirror-back", "a mirror selfie") is taken off; "mirror selfie in the hallway" stays whole
  const [first, ...rest] = words.split(",");
  const named = shotNamed(first);
  const label = Object.entries({ [named]: named, ...(P.SHOT_WORDS || {}) }).filter(([, t]) => t === named).map(([w]) => w);
  if (named && !/^\s*(?:on|in|at|by|under|with|from)\b/i.test(first) && !wordsOf(label.reduce((t, w) => t.replace(new RegExp(escapeRegex(w), "gi"), " "), first).replace(/\b(?:shot|pic|photo|picture)\b/gi, " ")).length) {
    shot = named;
    words = rest.join(",").trim();
  } else if (words) {
    shot = shotNamed(words) === "selfie" ? null : shotNamed(words);
    // "mirror selfie in the hallway": the shot says the first part already
    const lead = shot && Object.entries({ [shot]: shot, ...(P.SHOT_WORDS || {}) }).filter(([, t]) => t === shot).map(([w]) => w)
      .sort((a, b) => b.length - a.length).find((w) => new RegExp(`^(?:an?\\s+)?${escapeRegex(w)}(?:\\s+(?:selfie|shot|pic|photo))?\\b`, "i").test(words));
    if (lead) words = words.replace(new RegExp(`^(?:an?\\s+)?${escapeRegex(lead)}(?:\\s+(?:selfie|shot|pic|photo))?\\b[\\s,—–:-]*`, "i"), "");
  }
  // a type named in the middle ("dim bedroom, mirror-back, black silk slip") is dropped from her words
  if (shot) words = words.split(",").filter((seg) => !(shotNamed(seg) === shot && wordsOf(seg.replace(/\b(?:shot|pic|photo|picture|selfie)\b/gi, " ")).every((w) => Object.hasOwn(P.SHOTS, w) || w === "back"))).join(",").trim();
  words = words.replace(/^(?:an?\s+)?selfie\b[\s,:-]*/i, "").replace(/^(?:her|she)\s+(?=(?:in|on|at|with|wearing|by|lying|sitting)\b)/i, "");
  let explicit = false;
  if (words && !can({ level: level }, "draw", words)) {
    words = "";
    explicit = true;
  }
  if (words && recent.some((r) => overlap(words, r) > P.SIMILAR)) words = "";
  let doing = "";
  if (!want) {
    // only a line that says where she is or what she's doing (seen live: "but pics don't come free" drawn)
    const sentence = String(said).split(/\n+|(?<=[.!?])\s+/).map((x) => x.trim())
      .find((x) => wordsOf(x).length >= 3 && DOING.test(x)) || "";
    const d = aboutHer(sentence).replace(/[?!.,]+$/, "");
    if (d && d.length <= 160 && can({ level: level }, "draw", d) && !recent.some((r) => overlap(d, r) > P.SIMILAR)) doing = d;
  }
  return { shot, words: words.replace(/[.\s]+$/, ""), doing, explicit };
}
// The drawing prompt of a selfie: the shot's template with the slots picked here (angle by ANGLE_WEIGHTS,
// expression, wardrobe and place of the tier, light for her time of day) and the phone rule; her own words
// (`words`) replace wardrobe and place, `doing` comes before the wardrobe. {who} is left for drawPicture.
// Returns { prompt, shot, tier, angle, what } (what: "type, her words or the wardrobe and place", for history).
// `lingerie`: for PICTURE.LINGERIE (Nano Banana): her words as she wrote them and its WARDROBE for the clothes
export function composePicture({ tier = "everyday", shot = "selfie", words = "", doing = "", hour = herHour(), recentShots = [], lingerie = false, wardrobeList = null, dayWear = null, level = CONFIG.PICTURE.NSFW.DEFAULT } = {}) {
  const P = CONFIG.PICTURE;
  const args = { tier, shot, words, doing, hour, recentShots };
  if (!lingerie) {
    words = filterSafe(words, level);
    doing = filterSafe(doing, level);
  }
  const T = String(tier).toUpperCase();
  const template = P.SHOTS[shot] || P.SHOTS.selfie || Object.values(P.SHOTS)[0] || "{selfie} {wearing}{where}, {light}.";
  const lastAngle = (Number(P.RECENT_SHOTS) || 0) ? recentShots.slice(-1).map((s) => s && s.angle).filter(Boolean) : [];
  const angle = template.includes("{angle}") ? pickWeighted(P.ANGLE_WEIGHTS, lastAngle) : null;
  const time = timeOfDay(hour);
  const hasWhere = template.includes("{where}");
  // "clothes | place" brings its own place, so only for shots with {where}
  // Step 4: an everyday picture that names no clothes wears the day's outfit (dayWear: OUT when the words are outside, else HOME)
  const outside = !!dayWear && (P.OUTSIDE_WORDS || []).some((w) => String(w).trim() && hasWord(`${words} ${doing}`, w));
  const dayClothes = !lingerie && !wardrobeList && T === "EVERYDAY" && dayWear && !namesClothes(`${words} ${doing}`) ? [outside ? dayWear.out : dayWear.home] : null;
  const wardrobe = ((wardrobeList && wardrobeList.length && wardrobeList) || dayClothes || (lingerie && (P.LINGERIE || {}).WARDROBE) || (P.WARDROBE || {})[T] || []).filter((w) => hasWhere || !String(w).includes("|"));
  const [clothes = "", ownPlace = ""] = pickOne(wardrobe).split("|").map((x) => x.trim());
  const place = hasWhere ? ownPlace || pickOne((P.PLACES || {})[T]) : "";
  // Step 4: words that name no clothes get the tier's (or the day's) clothes too, so klein doesn't copy image 1's; nude words stay as they are
  // (nor a sex act: "riding him" got "wearing a black one-shoulder swimsuit" and read as partly naked, review)
  const wearing = !lingerie && words && !(tier === "nude" || nudeWords(words) || namesClothes(words) || pictureFlags(words, true, "on").act) ? [words, clothes && `wearing ${clothes}`].filter(Boolean).join(", ") : words || [doing, clothes && `wearing ${clothes}`].filter(Boolean).join(", ");
  const where = words || doing || !place ? "" : `, ${place}`;
  // {a|b|c}: the one her words mention, else any
  const chosen = template.replace(/\{([^{}|]+(?:\|[^{}|]+)+)\}/g, (_, alts) => {
    const list = alts.split("|").map((a) => a.trim());
    const said = wordsOf(`${words} ${doing}`);
    return list.find((a) => wordsOf(a).some((w) => said.includes(w))) || pickOne(list);
  });
  const vars = {
    selfie: P.SELFIE_PHONE, mirror: P.MIRROR_PHONE, pov: P.POV_PHONE,
    angle: angle ? (P.ANGLES || {})[angle] || "" : "",
    expression: pickOne((P.EXPRESSIONS || {})[T]),
    wearing, where,
    light: lightFor(`${words} ${doing}`, pickOne((P.LIGHT || {})[time.toUpperCase()]), level),
  };
  const night = isDark(hour, vars.light);
  const filled = chosen.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k] || "") : m));
  // the fixed place: one her words name, else the template's or place list's @key; @key → its NAME
  const L = P.LOCATIONS || {};
  const token = [...filled.matchAll(/@(\w+)/g)].map((m) => m[1]).find((k) => Object.hasOwn(L, k));
  const location = locationOf(`${words} ${doing}`) || token || null;
  const named = (t) => String(t).replace(/@(\w+)/g, (m, k) => (Object.hasOwn(L, k) ? L[k].NAME || k : m));
  const body = named(filled)
    .replace(/(?:,\s*)+(?=[,.])/g, "").replace(/\s+,/g, ",").replace(/\s{2,}/g, " ").trim();
  const shown = named(words || [doing, clothes && `wearing ${clothes}`, place].filter(Boolean).join(", "));
  // In history and her recent pictures as "type, what" (just "what" when it already names the type)
  const what = shown && shotNamed(shown) === shot ? shown : [shot, shown].filter(Boolean).join(", ");
  // Step C: the same picture without its phone line, expression and light, for the picture writer (writtenSelfie) to tidy
  const lead = (chosen.match(/\{(selfie|mirror|pov)\}/) || [])[1];
  const draft = named(chosen.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? (["selfie", "mirror", "pov", "expression", "light"].includes(k) ? "" : String(vars[k] || "")) : m)))
    .replace(/(?:,\s*)+(?=[,.]|$)/g, "").replace(/\s+([,.])/g, "$1").replace(/\s{2,}/g, " ").replace(/^[\s,]+/, "").trim();
  const parts = { lead: lead ? String(vars[lead] || "") : "", draft, expression: vars.expression || "", light: vars.light || "" };
  return { prompt: [P.SELFIE_STYLE, "{who}", body, location && "{room}", safeLine(level)].filter(Boolean).join(" "), shot, tier: String(tier).toLowerCase(), angle, what, location, night, args, parts };
}
// Her time of day (PICTURE.TIMES) at this hour
export function timeOfDay(hour = herHour()) {
  const P = CONFIG.PICTURE;
  return Object.keys(P.TIMES || {}).find((k) => inRange(hour, P.TIMES[k])) || "evening";
}
// Dark outside, so a fixed place is drawn from its night picture (places.js "<key>_night"): at night, and in the
// evening unless the light picked is daylight. klein copies the reference's light: wording alone turned the lamp
// on in 1 of 3 night shots, still in daylight (round 4, 2026-10-03).
export function isDark(hour = herHour(), light = "") {
  const time = timeOfDay(hour);
  return time === "night" || (time === "evening" && !/daylight|evening light|\bsun/i.test(light));
}
// The fixed place (PICTURE.LOCATIONS) a text puts a picture in, by its WORDS (his rooms are listed first,
// so "his bed" wins over "bed"), or null
export function locationOf(text) {
  if (!String(text || "").trim()) return null;
  for (const [key, l] of Object.entries(CONFIG.PICTURE.LOCATIONS || {})) if ((l.WORDS || []).some((w) => String(w).trim() && hasWord(text, w))) return key;
  return null;
}
// Her selfie for this reply, from her [selfie: ...] (`want`, null when she wrote none), the code's plan (when
// the code decided the picture) and the chat. Returns composePicture's answer.
export function selfiePicture({ want = null, said = "", plan = null, history = [], asked = "", recent = [], recentShots = [], hour = herHour(), level = CONFIG.PICTURE.NSFW.DEFAULT, dayWear = null } = {}) {
  const P = CONFIG.PICTURE;
  const s = selfieSubject(want, recent, said, level);
  // her own nude words (NUDE_ASK_PATTERN): the nude tier where the level allows it, else boudoir (as before Step 2)
  const nudeSaid = !!s.words && testPattern("NUDE_ASK_PATTERN", s.words);
  let tier = nudeSaid && can({ level: level }, "nude") ? "nude" : s.explicit || nudeSaid || (s.words && testPattern("BOUDOIR_ASK_PATTERN", s.words)) ? "boudoir" : null;
  // the shot he named wins over the type she writes (seen live: a belfie asked, drawn as a plain mirror shot)
  let shot = plan && plan.named ? plan.shot : s.shot;
  if (!tier && plan && plan.named) tier = plan.tier;
  if (!tier && plan && (!shot || tierShots(plan.tier).includes(shot))) tier = plan.tier;
  if (!tier) tier = pickTier({ asked, heat: chatHeat(history, asked, hour), shot, level });
  // Her own description with no type: the shot she was told (plan), else a plain selfie, never a random
  // framing that contradicts it ("lying on her side in bed" drawn as a mirror shot, seen live)
  if (!shot && s.words) shot = plan && Object.hasOwn(P.SHOTS, plan.shot) ? plan.shot : Object.hasOwn(P.SHOTS, "selfie") ? "selfie" : null;
  if (!shot) shot = plan && plan.tier === tier && Object.hasOwn(P.SHOTS, plan.shot) ? plan.shot : pickShot(tier, recentShots, hour);
  // Step 2: a nude-tier picture whose own words name no nudity says so ("completely naked" from the wardrobe when she named none)
  const words = tier === "nude" && s.words && !nudeWords(s.words) ? `${s.words}, completely naked` : s.words;
  return { ...composePicture({ tier, shot, words, doing: s.doing, hour, recentShots, dayWear, level }), asked, explicit: !!s.explicit };
}
// The act her narration shows (SEX_CUES, first match) as the words ACT_WORDS/ACT_SCENES know, or ""; Runware with SEX_ACTS on only
export function sexCue(sceneText, level = CONFIG.PICTURE.NSFW.DEFAULT) {
  const R = CONFIG.PICTURE.RUNWARE || {};
  if (!can({ level: level }, "acts") || !runwareRoute(level) || R.SEX_ACTS !== true) return "";
  const narration = [...String(sceneText).matchAll(/\*([^*]+)\*/g)].map((m) => m[1]).join(" ");
  try {
    if (CONFIG.PICTURE.SEX_CONTEXT && !new RegExp(CONFIG.PICTURE.SEX_CONTEXT, "i").test(narration)) return "";
  } catch {}
  for (const [act, re] of Object.entries(CONFIG.PICTURE.SEX_CUES || {})) {
    try {
      if (re && new RegExp(re, "i").test(narration)) return act;
    } catch {}
  }
  return "";
}
// The prompt for a picture of the moment in person, from the scene's narration about her: only sentences
// about her (none about him: "you", "his"), none with a NOT_DRAWN word. "" when too little is left.
export function scenePicturePrompt(sceneText, level = CONFIG.PICTURE.NSFW.DEFAULT) {
  const P = CONFIG.PICTURE;
  const names = CONFIG.CHARACTER.NAME_PREFIXES.map(escapeRegex).join("|");
  const narration = [...String(sceneText).matchAll(/\*([^*]+)\*/g)].map((m) => m[1]).join(" ");
  // a sex act in her own words (SEX_CUES): its sentences about him stay too, and the act is named first
  const cue = sexCue(sceneText, level);
  const kept = sentencesOf(narration)
    .map((x) => x.trim())
    // a lowercase start is a speech tag cut from its line ("she murmurs, a teasing edge to her voice")
    // with SEX_ACTS on (Runware), a nude or sex-act sentence about him stays: he is "the man" (POV_MAN)
    .map((x) => (x && (explicitWords(x, level) || (cue && sexCue(`*${x}*`, level))) ? theMan(x.replace(/\byours\b/gi, "the man's")).replace(/^the/, "The") : x))
    .filter((x) => x && /^[^a-z]/.test(x) && !/\b(?:you|your|yours|he|him|his|they|them|their|each other)\b/i.test(x) && can({ level: level }, "draw", x))
    // nothing a camera sees: her voice, a pause (seen live: "Her voice drops, mock-soft.")
    .filter((x) => !/\b(?:voice|voices|pause|says|said|whispers|murmurs|tone)\b/i.test(x))
    .map((x) => x.replace(new RegExp(`\\b(?:${names})['’]s\\b`, "gi"), "Her").replace(new RegExp(`\\b(?:${names})\\b`, "gi"), "She"));
  const text = [cue && !hasWord(kept.join(" "), cue) ? `Sex act: ${cue}.` : "", ...kept].filter(Boolean).join(" ");
  return wordsOf(text).length >= (Number(P.MIN_SCENE_WORDS) || 0) ? text : "";
}
// Only layers named (a cardigan, socks): SCENE_UNDER goes under them
export function underLayers(what) {
  const P = CONFIG.PICTURE;
  const named = (P.WEARING_WORDS || []).filter((w) => hasWord(what, w) || hasWord(what, `${w}s`));
  const layers = new Set((P.LAYER_WORDS || []).map(String));
  return P.SCENE_UNDER && named.length && named.every((w) => layers.has(w)) ? `${what}, over ${P.SCENE_UNDER}` : what;
}
// What she wears in this scene: the newest clothes her narration named (this reply, then her earlier replies of the
// same in-person scene), else PICTURE.SCENE_WEARING. Filter-safe; "" when it can't be drawn.
export function sceneWearing(sceneText, history = [], level = CONFIG.PICTURE.NSFW.DEFAULT, dayWear = null) {
  const P = CONFIG.PICTURE;
  const texts = [sceneText];
  let after = Date.now();
  for (const m of [...history].reverse()) {
    if (m.role !== "assistant" || m.ooc) continue;
    if (!inPerson(m.content) || (m.at && after - m.at > CONFIG.TEXTING.SCENE_TIMEOUT_MIN * 60000)) break;
    texts.push(m.content);
    after = m.at || after;
  }
  const words = (P.WEARING_WORDS || []).map(String).filter((w) => w.trim()).sort((a, b) => b.length - a.length).map(escapeRegex);
  if (words.length) {
    const cloth = `(?:${words.join("|")})s?`;
    const pre = "(?:[\\w'’-]+\\s+){0,4}?";
    const worn = new RegExp(`\\b(in|wearing|into|pulls on|has on)\\s+(${pre}${cloth}(?:\\s+(?:and|over|with)\\s+${pre}${cloth})?)\\b`, "i");
    const bare = new RegExp(`\\b((?:an?|the|her)\\s+(?:(?!(?:in|on|at|of|to|into|with|his|her|the|a|an)\\b)[\\w'’-]+\\s+){0,3}?${cloth})\\b`, "i");
    // only sentences about her ("pulls on his hoodie" is hers to wear; "her face in his shirt" isn't)
    const about = texts.map((t) => sentencesOf(String(t).replace(/\*/g, " ")).filter((x) => !/\b(?:you|your|he|him)\b/i.test(x)));
    // "in an old cardigan and wool socks" anywhere in the scene beats a later "the cardigan slipping off"
    for (const re of [worn, bare]) {
      for (const list of about) {
        const m = list.map((x) => x.match(re)).find((x) => x && !(/^his\b/i.test(x[x.length - 1]) && !/^(?:wearing|into|pulls on|has on)$/i.test(x[1])));
        const what = m && m[m.length - 1].replace(/^the\s+/i, "her ").trim();
        if (what && can({ level: level }, "draw", what)) return underLayers(filterSafe(what, level).replace(/\b(\w+)\s+\1\b/gi, "$1"));
      }
    }
  }
  // Step 4: the day's outfit (OUT when the scene is outside), else the fixed cardigan
  if (dayWear) return filterSafe((P.OUTSIDE_WORDS || []).some((w) => String(w).trim() && hasWord(sceneText, w)) ? dayWear.out : dayWear.home, level);
  return filterSafe(P.SCENE_WEARING || "", level);
}
// Step B (2026-10-13, owner's plan): every "hand(s)" in a picture prompt gets an owner, so klein never adds a stranger's hands or a
// second person to own them: "one hand" → "one of her hands", "both hands" → "both her hands", "a hand" → "one of her hands", a bare
// "hand(s)" → "her hand(s)". Left alone: an owner (his, her, my, the man's ...) in the three words before it (after the last comma or
// period), "no"/"any"/"without" just before it, and compounds (hand-knit, second-hand, hands-free).
export const HAND_OWNER = /\b(?:his|her|hers|my|your|their|its|whose|own)\b|['’]s\b/i;
export function ownHands(text) {
  return String(text || "").replace(/(?<![-\p{L}])(?:(one|both|a)\s+)?(hands?)(?![-\p{L}])/giu, (m, q, h, off, str) => {
    const before = str.slice(Math.max(0, off - 40), off).split(/[.,;:!?()]/).pop();
    const words = before.trim().split(/\s+/).filter(Boolean);
    if (HAND_OWNER.test(words.slice(-3).join(" "))) return m;
    if (!q && /^(?:no|any|without)$/i.test(words.at(-1) || "")) return m;
    const cap = (w) => (m[0] === m[0].toUpperCase() ? w.charAt(0).toUpperCase() + w.slice(1) : w);
    const ql = String(q || "").toLowerCase();
    if (ql === "one" || ql === "a") return cap("one of her hands");
    if (ql === "both") return cap("both her hands");
    return cap(`her ${h.toLowerCase()}`);
  });
}
// Step B (2026-10-13, owner's plan: "he is the camera"): /pic and /look words with him as the camera. His name (hisName) → "the
// man"; I'm / me / I → "the man is" / "the man"; my → his; her name → her / she; you → her (aboutHer). A clause that opens with him
// as its subject loses the subject ("Feras having sex with Reem" → "having sex with her"; "Feras PoV of spooning with Reem" → "PoV
// of spooning with her"): the picture is what he sees, so he is never a body in it (Step A bench: "his hands on her hips" drew a
// second man's head 3/4). "the man" as an object stays ("she rides the man").
export function asCamera(text, settings = {}) {
  let t = String(text || "");
  const him = hisName(settings || {});
  if (him && him.length > 1) t = t.replace(new RegExp(`\\b${escapeRegex(him)}(['’]s)?\\b`, "gi"), (m, s) => (s ? "the man's" : "the man"));
  const hers = CONFIG.CHARACTER.NAME_PREFIXES.map(escapeRegex).join("|");
  t = t.replace(new RegExp(`\\b(?:${hers})['’]s\\b`, "gi"), "her");
  t = t.replace(new RegExp(`(^|[.;,!?]\\s*)(?:${hers})\\b`, "gi"), "$1she").replace(new RegExp(`\\b(?:${hers})\\b`, "gi"), "her");
  t = t.replace(/\bi(?:'|’)m\b/gi, "the man is").replace(/\bmy\b/gi, "his").replace(/\b(?:me|i)\b/gi, "the man");
  t = aboutHer(t);
  // him as the subject at the start of a clause: "the man (is) having ...", "the man's PoV of ..." → "having ...", "PoV of ..."
  t = t.replace(/(^|[.;!?]\s*)the man(?:['’]s)?\s+(?:is\s+|are\s+)?(?=\w+ing\b|pov\b|point of view\b)/gi, "$1");
  // ...and a clause where he does something with his body ("The man sits on the edge of a bed, and she is right beside him", /look
  // 484: the man drawn 2/2): the clause goes, and "beside him" is beside the camera
  // (only where he sits, stands, lies, waits or watches: "the man fucks her doggy style" keeps its act words)
  t = t.replace(/(^|[.;!?]\s*)the man\s+(?:is\s+)?(?:sits|sitting|seated|stands|standing|lies|lying|leans|leaning|waits|waiting|watches|watching|rests|resting)\b[^,.;!?]*(?:,\s*(?:and|while|as)\s+|[.;!?]\s*)(?=\S)/gi, "$1");
  t = t.replace(/\b(?:right |close )?(?:beside|next to) (?:him|the man)\b/gi, "close beside the camera");
  // his face is the camera: "her hand raised to his jaw", "the cut above his brow" drew a second person to own it (/look 483, 484)
  t = t.replace(/\b(?:his|the man['’]s) (?:jaw|jawline|face|cheek|cheeks|chin|lips|mouth|forehead|brow|eye|eyes|head|nose|temple|ear)\b/gi, "the camera");
  t = t.replace(/\b(toward|towards) (?:him|the man)\b/gi, "$1 the camera");
  return t.replace(/^\s*\w/, (c) => c.toUpperCase()).replace(/[.\s]+$/, "").trim();
}
