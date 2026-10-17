// The Runware klein 9B plan: prompt, references, LoRAs (runwarePlan).
import { STYLE_JPEG_BASE64 } from "../../assets/face.js";
import { CONFIG } from "../config/index.js";
import { firstPerson } from "./commands.js";
import { ownHands } from "./compose.js";
import { runwareRoute } from "./draw.js";
import { runwareBodyBytes } from "./refs.js";
import { hasWord, pickHair, pickOne, pickWeighted, sexAct } from "./shots.js";
import { fromBase64 } from "../platform/http.js";

// Runware's image 1 (RUNWARE.BODY, BODY_BACK, BODY_CLOTHED): v15 nude front, v15-back, v15-side(-r), v15-clothed (the owner's sets of 2026-10-17)
// `explicit` false: BODY_CLOTHED (a nude body picture made her naked whenever no clothes were named, 2026-10-08); "back": BODY_BACK
// The RUNWARE.BODY* key of a picture's body reference ("v15", "v15-back", "v15-clothed"); explicit = "back" | nude | clothed
export function runwareBodyName(explicit = true) {
  const R = CONFIG.PICTURE.RUNWARE || {};
  return explicit === "back" ? R.BODY_BACK || R.BODY : explicit ? R.BODY : R.BODY_CLOTHED || R.BODY;
}
export function runwareBody(explicit = true) {
  return runwareBodyBytes(runwareBodyName(explicit));
}
// The LoRAs of one klein 9B picture as Runware's lora list ([{ model, weight }]), by situation (owner 2026-10-08: "use LoRAs
// according to situations instead of dumping them all together"): LORAS on every picture, then the kind's own (SELFIE_LORAS her
// selfies, SCENE_LORAS /look and in-person scenes, PIC_LORAS /pic), NUDE_LORAS when nude or a sex act, and each ACT_LORAS LoRA
// whose ACT_WORDS are in the words. A later set wins a LoRA's weight; weight 0 or not a number = left out.
// `opts`: { kind, explicit, text, partial, anal } (a bare boolean = explicit). Partly naked (Step 5): PARTIAL_LORAS_OFF left out,
// PARTIAL_WEIGHTS for the others (0 = left out). Step 6: `anal` = the anal position: its ANAL_LORAS replace the ACT_WORDS LoRAs,
// WITH_LORAS and NUDE_LORAS (penetration: Unchained put the penis below an empty vulva, round 6); an ALONE_LORAS one stays alone.
// 2026-10-12 (owner): then HANDS_LORAS when HANDS_WORDS name his hands, ANATOMY_LORAS when not a sex act (`act`), and at most
// MAX_LORAS in that order (realism, nudity, act, hands, anatomy)
export function runwareLoras(opts = {}) {
  if (typeof opts === "boolean") opts = { explicit: opts };
  const { kind = "", explicit = false, act = false, text = "", partial = false, anal = "", fix = false, level = CONFIG.PICTURE.NSFW.DEFAULT } = opts;
  const R = CONFIG.PICTURE.RUNWARE || {};
  const flash = flashAsked(text, level);
  const own = { selfie: R.SELFIE_LORAS, scene: R.SCENE_LORAS, pic: R.PIC_LORAS }[kind] || {};
  const words = R.ACT_WORDS || {};
  // only on nude or sex-act pictures, except ACT_ANY (his hand can be on her waist in a clothed picture)
  const analSet = explicit && anal ? (R.ANAL_LORAS || {})[anal] : null;
  let acts = analSet ? Object.entries(analSet) : Object.entries(R.ACT_LORAS || {}).filter(([air]) => (explicit || (R.ACT_ANY || []).includes(air)) && String(words[air] || "").split(",").some((w) => w.trim() && hasWord(text, w.trim())));
  // SOLO_LORAS (penis, pussy) only when no act LoRA (neither SOLO_LORAS nor ACT_ANY) is in: the act LoRA draws them already
  const solo = R.SOLO_LORAS || [];
  if (!analSet && acts.some(([air]) => !solo.includes(air) && !(R.ACT_ANY || []).includes(air))) acts = acts.filter(([air]) => !solo.includes(air));
  // WITH_LORAS: a LoRA added to a sex act by its own words (General Penis on missionary and doggy), at its ACT_LORAS weight
  for (const [air, withs] of Object.entries(analSet ? {} : R.WITH_LORAS || {})) {
    if (explicit && !acts.some(([a]) => a === air) && Object.hasOwn(R.ACT_LORAS || {}, air) && String(withs).split(",").some((w) => w.trim() && hasWord(text, w.trim()))) acts.push([air, R.ACT_LORAS[air]]);
  }
  // an ALONE_LORAS LoRA draws alone (ALONE_WORDS: only when one of its words is in the text)
  // Step 6: with ANAL_LORAS, ANAL_ALONE decides (its LoRA alone at its ANAL_LORAS weight), not ALONE_LORAS
  const aloneWords = R.ALONE_WORDS || {};
  const alone = analSet ? ((R.ANAL_ALONE || []).includes(anal) ? acts.map(([air]) => air)[0] : undefined)
    : acts.map(([air]) => air).find((air) => Object.hasOwn(R.ALONE_LORAS || {}, air) && (!aloneWords[air] || String(aloneWords[air]).split(",").some((w) => w.trim() && hasWord(text, w.trim()))));
  const list = alone
    ? [{ model: alone, weight: Number(analSet ? analSet[alone] : R.ALONE_LORAS[alone]) }].filter((l) => Number.isFinite(l.weight) && l.weight !== 0)
    : Object.entries({ ...(flash ? R.FLASH_LORAS || {} : { ...(R.LORAS || {}), ...own }), ...(explicit && !analSet && !acts.some(([air]) => (R.NUDE_LORAS_OFF_WITH || []).includes(air)) ? R.NUDE_LORAS || {} : {}), ...Object.fromEntries(acts) }).map(([model, w]) => ({ model: model.trim(), weight: Number(w) })).filter((l) => l.model && Number.isFinite(l.weight) && l.weight !== 0);
  const off = partial ? R.PARTIAL_LORAS_OFF || [] : [];
  const weights = partial ? R.PARTIAL_WEIGHTS || {} : {};
  const shaped = list.filter((l) => !off.includes(l.model)).map((l) => (Object.hasOwn(weights, l.model) ? { model: l.model, weight: Number(weights[l.model]) } : l)).filter((l) => Number.isFinite(l.weight) && l.weight !== 0);
  // his hands named, then not a sex act: the hands and anatomy LoRAs; MAX_LORAS keeps the first ones (owner 2026-10-12)
  const hands = String(R.HANDS_WORDS || "").split(",").some((w) => w.trim() && hasWord(text, w.trim()));
  const more = [...(hands ? Object.entries(R.HANDS_LORAS || {}) : []), ...(!act && !alone ? Object.entries(R.ANATOMY_LORAS || {}) : [])]
    .map(([model, w]) => ({ model: model.trim(), weight: Number(w) })).filter((l) => l.model && Number.isFinite(l.weight) && l.weight !== 0 && !shaped.some((x) => x.model === l.model));
  // `fix`: a redraw after the anatomy check (drawPicture) may take one LoRA more (2026-10-15)
  const max = (Number(R.MAX_LORAS) > 0 ? Number(R.MAX_LORAS) : Infinity) + (fix ? 1 : 0);
  return [...shaped, ...more].slice(0, max);
}
// The words ask for a camera-flash picture (RUNWARE.FLASH_WORDS, Runware routes only; FLASH_LORAS set)
export function flashAsked(text, level = CONFIG.PICTURE.NSFW.DEFAULT) {
  const R = CONFIG.PICTURE.RUNWARE || {};
  return !!(runwareRoute(level) && Object.keys(R.FLASH_LORAS || {}).length && (R.FLASH_WORDS || []).some((w) => String(w).trim() && hasWord(text, w)));
}
// RUNWARE.STYLE_PICTURES: the outfit whose text is in the picture's words (outfits first), else the hairstyle picked for it.
// Returns {key, kind, bytes} or null; that picture goes in after face, body and place (drawPicture)
export function stylePicture(text, hair) {
  const S = (CONFIG.PICTURE.RUNWARE || {}).STYLE_PICTURES || {};
  const low = String(text || "").toLowerCase();
  const keys = Object.keys(S).filter((k) => STYLE_JPEG_BASE64 && STYLE_JPEG_BASE64[k]);
  const key = keys.find((k) => k.startsWith("outfit-") && low.includes(String(S[k]).toLowerCase()))
    || keys.find((k) => k.startsWith("hair-") && hair && String(S[k]).toLowerCase() === String(hair).toLowerCase());
  return key ? { key, kind: key.startsWith("outfit-") ? "outfit" : "hair", bytes: fromBase64(STYLE_JPEG_BASE64[key]) } : null;
}
// The camera and his hands for a sex act (ACT_SCENES, first match; {pov} = POV_MAN), else POV_MAN. Step 6: an anal act's
// position (`analAt`) takes its ANAL_SCENES text first
export function actScene(text, analAt = "") {
  const R = CONFIG.PICTURE.RUNWARE || {};
  const anal = analAt && (R.ANAL_SCENES || {})[analAt];
  const hit = anal ? [analAt, anal] : Object.entries(R.ACT_SCENES || {}).find(([words]) => String(words).split(",").some((w) => w.trim() && hasWord(text, w.trim())));
  return (hit ? String(hit[1]).replace("{pov}", R.POV_MAN || "") : R.POV_MAN || "").replace(/\s{2,}/g, " ").trim();
}
// The trigger words of the LoRAs in use (LORA_WORDS), joined, for the start of the prompt
export const loraWords = (loras) => loras.map((l) => String(((CONFIG.PICTURE.RUNWARE || {}).LORA_WORDS || {})[l.model] || "").trim()).filter(Boolean).join(". ");
// The words without the clothes they say are off (2026-10-15: /look's "She wears a cropped top, wide pants are off" kept the pants on
// as a partly naked act, D1 row 614): "without/no X", "took/pulled/peeled off X", and a clause where something is "off", "removed" or
// "gone" (not "off her shoulder", "off the bed": a place after it)
export function stillWorn(text) {
  return String(text || "")
    .replace(/\b(?:without|no|minus)\s+(?:her\s+|any\s+)?[\w-]+(?:\s+[\w-]+)?/gi, " ")
    .replace(/\b(?:took|takes|taking|pulled|pulls|pulling|peeled|peels|peeling|stripped|strips|stripping|kicked|kicks|slid|slides|tugged|tugs|yanked|yanks)\s+off\b[^,.;]*/gi, " ")
    .split(/(?<=[,.;])/)
    .filter((c) => !/\b(?:off|removed|gone|discarded)\b(?!\s+(?:her|his|one|the|a|both|each|my|your)\b)/i.test(c))
    .join("");
}
// What a picture's words ask for (no network, no random picks): a sex act (sexAct), its oral or back camera (ORAL_WORDS,
// BACK_WORDS), nudity (NUDE_WORDS), partly naked (clothes named with nudity or an act: WEARING_WORDS). `kind` is the studio
// log's: alone (/look without her) > act > partial > nude > clothed
// Step 2: at /nsfw Off nothing is a sex act or nude, whatever its words say (so `partial` is false too)
export function pictureFlags(prompt, herself = true, level = CONFIG.PICTURE.NSFW.DEFAULT) {
  const P = CONFIG.PICTURE;
  const R = P.RUNWARE || {};
  const off = level === "off";
  const act = !off && !!sexAct(prompt, level);
  const oral = act && (R.ORAL_WORDS || []).some((w) => String(w).trim() && hasWord(prompt, w));
  const nude = !off && (R.NUDE_WORDS || []).some((w) => String(w).trim() && hasWord(prompt, w));
  // a pose ("sitting back on her heels") is not shoes (WEARING_WORDS "heels"): the phrase is taken out before the check (Step 4);
  // nor is "on top" (riding) or "top of" a top (Step 5)
  const worn = stillWorn(prompt).replace(/\bon (?:her|his|your) heels\b/gi, "").replace(/\b(?:on|from|at) (?:the )?top\b|\btop of\b/gi, "");
  const named = (list) => (list || []).some((w) => String(w).trim() && (hasWord(worn, w) || hasWord(worn, `${w}s`)));
  // Step 5: PARTIAL_WORDS count too; what stays on: a top (TOP_WORDS, not "topless"), a bottom (BOTTOM_WORDS, not "bottomless")
  const partial = (nude || act) && named([...(P.WEARING_WORDS || []), ...(R.PARTIAL_WORDS || [])]);
  const top = partial && named(R.TOP_WORDS) && !hasWord(prompt, "topless");
  const bottom = partial && named(R.BOTTOM_WORDS) && !hasWord(prompt, "bottomless");
  // Step 6: an anal act (ANAL_WORDS) and the position its words name (ANAL_POSITION_WORDS, first match; "" = runwarePlan picks one
  // by ANAL_POSITIONS); seen from behind unless missionary
  const anal = act && String(R.ANAL_WORDS || "").split(",").some((w) => w.trim() && hasWord(prompt, w.trim()));
  const analAt = anal ? Object.keys(R.ANAL_POSITION_WORDS || {}).find((k) => String(R.ANAL_POSITION_WORDS[k]).split(",").some((w) => w.trim() && hasWord(prompt, w.trim()))) || "" : "";
  const back = analAt ? analAt !== "missionary" : (act && String(R.BACK_WORDS || "").split(",").some((w) => w.trim() && hasWord(prompt, w.trim()))) || (nude && String(R.NUDE_BACK_WORDS || "").split(",").some((w) => w.trim() && hasWord(prompt, w.trim())));
  // Step 5: a crotch close-up (CLOSE_WORDS), nude and not a sex act or a back view
  const close = nude && !act && !back && (R.CLOSE_WORDS || []).some((w) => String(w).trim() && hasWord(prompt, w));
  const kind = !herself ? "alone" : act ? "act" : partial ? "partial" : nude ? "nude" : "clothed";
  return { act, oral: !!oral, nude, partial: !!partial, back: !!back, top: !!top, bottom: !!bottom, close: !!close, anal: !!anal, analAt, kind };
}
// The nudity line of a nude, partly naked or sex-act picture (Step 5): NAKED NAKED_BREASTS NAKED_BUSH (the same text as before the
// split); a back view NAKED_BACK; partly naked PARTIAL_TOP + NAKED_BUSH (only a top on), PARTIAL_BOTTOM + NAKED_BREASTS (only a
// bottom on), else PARTIAL; a crotch close-up leaves the breasts out and adds CROTCH_FRAMING
export function nakedLine({ partial = false, back = false, top = false, bottom = false, close = false } = {}) {
  const R = CONFIG.PICTURE.RUNWARE || {};
  const sentence = (t) => {
    const x = String(t || "").trim().replace(/[,;:\s]+$/, "");
    return x ? `${x.charAt(0).toUpperCase()}${x.slice(1)}${/[.!?]$/.test(x) ? "" : "."}` : "";
  };
  const full = [R.NAKED, R.NAKED_BREASTS, R.NAKED_BUSH];
  const parts = partial
    ? top && !bottom ? [R.PARTIAL_TOP, sentence(R.NAKED_BUSH)] : bottom && !top ? [R.PARTIAL_BOTTOM, close ? "" : sentence(R.NAKED_BREASTS)] : [R.PARTIAL]
    : back ? [R.NAKED_BACK || full.join(" ")] : [R.NAKED, close ? "" : R.NAKED_BREASTS, R.NAKED_BUSH];
  return [...parts, close ? R.CROTCH_FRAMING : ""].map((x) => String(x || "").trim()).filter(Boolean).join(" ");
}
// The Runware plan of one picture, with no network: `tries` in order, each { model, text, refs: [{ name, bytes }], loras,
// width, height, steps, cfg, acceleration }, and `flags` (pictureFlags). drawPicture sends the tries until one draws.
// opts: { herself, kind (the LoRA kind: selfie, scene, pic), ref (her face bytes), rwFace (the face sent, 2x), faceName,
// place (bytes), placeName, width, height, size, who (drawPicture's {who} filler) }. The random picks (act shape, mood,
// hairstyle) come in the same order as before the split: tools/test/picture-plans.golden.json must not change.
// `level` (Step 2): the chat's /nsfw level; Off sets checkContent on every try (drawRunware) and makes the flags clothed
export function runwarePlan(prompt, { herself = true, kind = "", ref = null, rwFace = null, faceName = "face-1x", place = null, placeName = "", width, height, size = 0, who, fix = false, level = CONFIG.PICTURE.NSFW.DEFAULT }) {
  const P = CONFIG.PICTURE;
  const R = P.RUNWARE || {};
  const flags = pictureFlags(prompt, herself, level);
  // the sampler goes to klein 9B only (TwinFlow takes Runware's defaults)
  const tryOf = (model, text, refs, loras, w, h) => ({
    model,
    text,
    refs,
    loras,
    width: w,
    height: h,
    steps: model === R.MODEL && Number(R.STEPS) > 0 ? Number(R.STEPS) : 0,
    cfg: model === R.MODEL && Number(R.CFG) >= 1 ? Number(R.CFG) : 0,
    acceleration: model === R.MODEL && R.ACCELERATION ? String(R.ACCELERATION) : "",
    checkContent: level === "off",
  });
  if (!herself) {
    // /look without her: klein 9B from words with the realism LoRAs, then TwinFlow; no face, body, mood or hair
    const tries = [];
    for (const model of P.ROUTE === "runware-klein" ? [R.MODEL, R.BACKUP_MODEL] : [R.BACKUP_MODEL]) {
      if (!model) continue;
      const loras = model === R.MODEL ? runwareLoras({ kind, explicit: false, text: "", level }) : [];
      const triggers = loraWords(loras);
      const text = [triggers && `${triggers}.`, who("", false, true), R.PHOTO].filter(Boolean).join(" ");
      tries.push(tryOf(model, ownHands(firstPerson(text)), [], loras, Number(R.WIDTH) || width, Number(R.HEIGHT) || height));
    }
    return { tries, flags };
  }
  // the position the words name: only it loads ANAL_LORAS (owner 2026-10-12: POV Doggy Anal only when doggy AND anal are asked)
  const analNamed = flags.analAt || "";
  // Step 6: an anal act with no position named gets one by ANAL_POSITIONS (a random pick only on anal acts: the others keep theirs)
  if (flags.anal && !flags.analAt) {
    flags.analAt = pickWeighted(R.ANAL_POSITIONS || {}) || Object.keys(R.ANAL_SCENES || {})[0] || "";
    if (flags.analAt) flags.back = flags.analAt !== "missionary";
  }
  const { act, oral, nude, partial, back, close: crotch, analAt } = flags;
  const explicit = nude || act;
  // partly naked = PARTIAL_TOP / PARTIAL_BOTTOM / PARTIAL, not NAKED; a back view = NAKED_BACK; a crotch close-up (Step 5: nakedLine)
  const naked = !explicit ? "" : ` ${nakedLine(flags)}`.trimEnd();
  // its own size (RUNWARE.WIDTH/HEIGHT, a sex act's shape by ASPECTS) unless the caller asked for one
  // Step 5: a crotch close-up takes CLOSE_SHAPE (no random pick: the other cases' picks stay in order)
  const shape = act ? pickWeighted((R.ASPECTS || {})[oral ? "ORAL" : "ACT"] || {}) : crotch ? String(R.CLOSE_SHAPE || "") : "";
  const sized = String((shape && (R.SIZES || {})[shape]) || "").split("x").map(Number);
  const [ow, oh] = sized.length === 2 && sized[0] > 0 && sized[1] > 0 ? sized : [Number(R.WIDTH), Number(R.HEIGHT)];
  const [rwW, rwH] = size || !(ow > 0 && oh > 0) ? [width, height] : [ow, oh];
  const wide = rwW > rwH && R.WIDE ? ` ${R.WIDE}` : "";
  // "{close}" in its ACT_SCENES text: no place picture (it pulled blowjobs into a wide room shot 4/4); the room stays in words
  const scene = act ? actScene(prompt, analAt) : "";
  const close = scene.includes("{close}");
  const pov = scene ? ` ${scene.replace("{close}", "").replace(/\s{2,}/g, " ").trim()}` : "";
  // a flash picture: no place picture either (its lamp light beat the flash; without it the flash look 2/2, 2026-10-08); nor a crotch
  // close-up (Step 5: a room picture pulls the camera back, as it did on blowjobs)
  const shownPlace = close || crotch || flashAsked(prompt, level) ? null : place;
  // her expression and gaze when the words name none (MOODS, GAZES; a sex act's scene may already name her gaze)
  // Step B: a shot's own EXPRESSIONS pick names her face too ("an unimpressed deadpan look" got a second, random "Her face: ...")
  const named = (t) => (R.FACE_WORDS || []).some((w) => String(w).trim() && hasWord(t, w)) || Object.values(P.EXPRESSIONS || {}).flat().some((e) => e && String(t).includes(e));
  const k = oral && (R.MOODS || {}).ORAL ? "ORAL" : act ? "ACT" : naked ? "HEATED" : "EVERYDAY";
  const look = named(prompt) ? "" : [pickOne((R.MOODS || {})[k]), named(scene) ? "" : pickOne((R.GAZES || {})[k])].filter(Boolean).join(", ");
  // right after who she is (at the end klein kept image 0's smile, round 4 bench), but after a sex act's camera words: early, it
  // turned her face to the lens in doggy 3/3 (without it 1/1 from behind)
  // a crotch close-up names no expression or hairstyle (Step 5: they are camera words and pull her face into the frame); the random
  // picks are still made, in their order
  const mood = look && !crotch ? ` Her face: ${look}.` : "";
  // a hairstyle (HAIRSTYLES): her hair color stays image 0's, the style changes
  const hair = pickHair(prompt);
  const shownHair = crotch ? "" : hair;
  const style = stylePicture(prompt, shownHair);
  const hairLine = shownHair ? ` Her hair: ${shownHair}.` : "";
  const [early, late] = act ? ["", mood] : [mood, ""];
  const photo = [act && R.ACT_PHOTO, R.PHOTO].filter(Boolean).map((x) => ` ${x}`).join("");
  // partly naked: BODY_PARTIAL (the clothed body leaked its tank top, the nude one bared what her clothes cover)
  const bodyArg = back ? "back" : partial ? R.BODY_PARTIAL === "nude" : explicit;
  // a clothed picture (not nude, back or partly naked): image 1 is BODY_CLOTHED, or BODY_CLOTHED_BACK when its words ask for a back
  // view (NUDE_BACK_WORDS: "back view", "from behind", a belfie) (owner 2026-10-12: the only clothed body references)
  const clothedOnly = !explicit && !partial && !back;
  const clothedBack = clothedOnly && String(R.NUDE_BACK_WORDS || "").split(",").some((w) => w.trim() && hasWord(prompt, w.trim()));
  // Step 5: partly naked with BODY_PARTIAL "none": no body picture (the rust halter leaked its crop top), REFERENCE_NOBODY
  const noBody = partial && !back && R.BODY_PARTIAL === "none";
  const clothedBody = clothedOnly ? (clothedBack && R.BODY_CLOTHED_BACK) || R.BODY_CLOTHED || "" : "";
  // Step 5: CLOSE_FACE false = a crotch close-up with no face or body picture (klein from REFERENCE_CLOSE)
  const faceless = crotch && R.CLOSE_FACE === false;
  const rwBody = faceless ? null : ref && !noBody ? (clothedBody ? runwareBodyBytes(clothedBody) : runwareBody(bodyArg)) : null;
  const bodyName = `body-${clothedBody || runwareBodyName(bodyArg)}`;
  // her pictures: klein again (KLEIN_TRIES), then Cloudflare klein with the same references (drawPicture). Never TwinFlow for
  // her: it has no reference and its words drew the big belly (2026-10-10). Without her face, TwinFlow as before.
  const tries = P.ROUTE === "runware-klein" && ref ? Array.from({ length: Math.max(1, Number(R.KLEIN_TRIES) || 1) }, () => [R.MODEL, true]) : [[R.BACKUP_MODEL, false]];
  // with a sex act's back view, REFERENCE_BACK names the view; a hairstyle changes her hair, not its color
  const ref1 = (back && R.REFERENCE_BACK) || (noBody && R.REFERENCE_NOBODY) || (clothedBack && R.REFERENCE_CLOTHED_BACK) || (clothedOnly && R.REFERENCE_CLOTHED) || R.REFERENCE;
  const ref0 = shownHair ? ref1.replace("with exactly the same face and hair", "with exactly the same face, hair color") : ref1;
  const out = [];
  for (const [model, withFace] of tries) {
    if (!model) continue;
    // face, body, place: the same order and numbers as the Cloudflare route (ROOM's {n})
    const base = withFace && !faceless ? [rwFace && { name: faceName, bytes: rwFace }, rwBody && { name: bodyName, bytes: rwBody }, shownPlace && { name: placeName, bytes: shownPlace }].filter(Boolean) : [];
    // the hairstyle's picture comes after them: its image number is base.length
    const extra = withFace && !faceless && style;
    const refs = extra ? [...base, { name: `style:${style.key}`, bytes: style.bytes }] : base;
    const styleLine = extra ? ` ${R.HAIR_LINE.replaceAll("{n}", String(base.length))}` : "";
    // with LoRAs, LORA_PREFIX (a trigger like "...taken with a smartphone of") runs into her description: "...of the woman from image 0"
    // the LoRAs' own trigger words (LORA_WORDS) go first
    const loras = model === R.MODEL ? runwareLoras({ kind, explicit, act, text: prompt, partial, anal: analNamed, fix, level }) : [];
    const flash = model === R.MODEL && flashAsked(prompt, level);
    const triggers = [flash && R.FLASH_TRIGGER, loraWords(loras)].filter(Boolean).join(". ");
    const alone = loras.length === 1 && (analAt ? (R.ANAL_ALONE || []).includes(analAt) : Object.hasOwn(R.ALONE_LORAS || {}, loras[0].model));
    // Step 3: the prefix only when LORA_PREFIX_WITH (phone2025) is one of the LoRAs
    const lead = (w) => (loras.length && R.LORA_PREFIX && loras.some((l) => l.model === R.LORA_PREFIX_WITH) && !flash && !alone ? `${R.LORA_PREFIX} ${w.charAt(0).toLowerCase()}${w.slice(1)}` : w);
    // Task C: clothed, a top named and no bottom or one-piece: the bottom is her outfit's own, never bare ("on top" is no top). Since
    // 2026-10-12 image 1 wears underwear, so the line stays (a top alone would leave image 1's thong and bare legs)
    const worn = stillWorn(prompt).replace(/\b(?:on|from|at) (?:the )?top\b|\btop of\b/gi, "");
    const namedIn = (list) => (list || []).some((w) => String(w).trim() && (hasWord(worn, w) || hasWord(worn, `${w}s`)));
    const topOnly = !!clothedBody && namedIn(R.TOP_WORDS) && !namedIn(R.BOTTOM_WORDS) && !namedIn(R.ONE_PIECE_WORDS) && !namedIn(R.BARE_LEGS_WORDS);
    // Step B: no DRESSED on the clothed body (REFERENCE_CLOTHED already says "only the clothes described here"); DRESSED_BOTTOM stays
    const dressed = (!explicit && !clothedBody && R.DRESSED ? ` ${R.DRESSED}` : "") + (topOnly && R.DRESSED_BOTTOM ? ` ${R.DRESSED_BOTTOM}` : "");
    const photoLine = flash && R.FLASH_PHOTO ? ` ${R.FLASH_PHOTO}` : photo;
    const herLine = faceless ? who(lead(R.REFERENCE_CLOSE || R.LOOKS), false, true) : withFace ? who(lead(ref0 + early + hairLine), !!shownPlace, true, [rwFace, rwBody].filter(Boolean).length) : who(R.LOOKS + early + hairLine, false, true);
    const text = (triggers ? `${triggers}. ` : "") + herLine + naked + pov + late + dressed + wide + photoLine + styleLine;
    out.push(tryOf(model, ownHands(firstPerson(text)), refs, loras, rwW, rwH));
  }
  return { tries: out, flags };
}
