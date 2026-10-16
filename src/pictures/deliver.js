// A picture from start to Telegram: startPicture, upload_photo while drawing, the album.
import { CONFIG, fill } from "../config/index.js";
import { can } from "../gate.js";
import {
  composePicture, isDark, locationOf, scenePicturePrompt, sceneWearing, selfiePicture, sexCue, timeOfDay,
} from "./compose.js";
import { drawPicture, filterSafe, runwareRoute, safeLine } from "./draw.js";
import { specFromScene, specFromSelfie } from "./interpret.js";
import {
  drawLingerie, isSpicy, lingerieArgs, lingerieSeen, lingerieWords, spicyPicture, spicyWords, wantsLingerie,
} from "./lingerie.js";
import { lightFor, pickOne, sexAct } from "./shots.js";
import { writeSpec, writtenScene, writtenSelfie } from "./writer.js";
import { aiFailed, aiFiltered, aiSpent, aiText_ } from "../platform/ai.js";
import { sha256 } from "../platform/http.js";
import { saveLedger, spend } from "../platform/kv.js";
import { logSent } from "../platform/log.js";
import { sendPhoto, tg } from "../platform/telegram.js";

// Starts drawing her picture for this reply (in parallel with her typing). Resolves to { bytes, what, shot, ... }
// or null; never rejects. kind "selfie": `want` is what she wrote in [selfie: ...] (or null), `said` her words,
// `plan` the shot the code decided (planShot), `asked` his message when he asked; "scene": `want` is the scene.
export function startPicture(env, ledger, kind, want, { said = "", plan = null, history = [], asked = "", chat = null, source = kind, nsfw = null, dayWear = null } = {}) {
  const P = CONFIG.PICTURE;
  const L = P.LINGERIE || {};
  const level = nsfw || P.NSFW.DEFAULT; // /nsfw (Step 2): Off and Nude keep sex acts out of scenes and selfies
  const nanoBanana = level !== "off"; // Nano Banana (OpenRouter) is never drawn at /nsfw Off (2026-10-11)
  const log = { source, chat, asked, herWords: kind === "scene" ? want : said }; // the studio's log (drawPicture)
  // the picture core (Rebuild Step 2): each picture's ShotSpec; a selfie recomposed below (lingerie, a refused tier) gets a new one
  const specOf = (p) => (!p ? null : p.spec || (kind === "selfie" && p.frame ? specFromSelfie(p, { level }) : null));
  let pic;
  let nanoScene = null; // an in-person moment in lingerie, worded for Nano Banana (real words, her description, no face)
  if (kind === "scene") {
    const what = scenePicturePrompt(want, level);
    // Step C: no sentence left for the template (each one names him: "you wrap your arms around her ...") → only the writer can draw it
    const writes = (P.WRITER || {}).ON && ((P.WRITER || {}).KINDS || []).includes("scene") && !!env.AI;
    if (!what && !writes) return null;
    const location = locationOf(what);
    // a sex act (SEX_CUES or its words): his eyes, she is naked (no clothes from earlier in the scene or SCENE_WEARING)
    const act = !!sexCue(want, level) || sexAct(what, level);
    const wearing = act ? "" : sceneWearing(want, history, level, dayWear);
    const night = timeOfDay() === "night";
    // her narration's own light (candles, golden hour: LIGHT_WORDS) or a flash beats the time's light
    const lightText = lightFor(what, night ? P.SCENE_NIGHT : pickOne((P.LIGHT || {})[timeOfDay().toUpperCase()]), level);
    const light = night && lightText === P.SCENE_NIGHT ? lightText : lightText && `Lit by ${lightText}.`;
    const wornSafe = filterSafe(wearing, level);
    pic = { prompt: [(act && P.SCENE_ACT_STYLE) || P.SCENE_STYLE, "{who}", filterSafe(what, level).replace(/[.\s]*$/, "."), wornSafe && `She is wearing ${wornSafe}.`, light, location && "{room}", safeLine(level)].filter(Boolean).join(" "), what, location, night: night || isDark(undefined, lightText || ""), wearing, act };
    pic.spec = specFromScene(what, { cue: act ? sexCue(want, level) || "act" : "", wearing, level, dayWear });
    if (L.ENABLED && L.SCENES && (lingerieWords(`${wearing} ${what}`) || lingerieWords(asked) || spicyWords(asked))) {
      pic.lingerie = true;
      pic.spicy = spicyWords(`${asked} ${wearing}`);
      nanoScene = { prompt: [P.SCENE_STYLE, `${L.WHO}.`, what.replace(/[.\s]*$/, "."), wearing && `She is wearing ${wearing}.`, light, location && "{room}", P.CRAFT].filter(Boolean).join(" "), what, location, night: pic.night, wearing };
    }
  } else {
    pic = selfiePicture({ want, said, plan, history, asked, recent: ledger.recent.slice(-(Number(P.REMEMBER) || 8)), recentShots: ledger.shots, level, dayWear });
  }
  const drawing = (async () => {
    let error = null;
    let model = P.MODEL;
    try {
      // a boudoir or spicier picture (owner 2026-10-05): spicier → Nano Banana straight away; else klein first in
      // KLEIN_WARDROBE (her face), its picture checked for lingerie (CHECK); Nano Banana when klein refuses or drew her
      // tamer; then klein's tamer picture; klein's filter-safe chain last
      // Runware draws lingerie and nudity itself (PICTURE.ROUTE): a lingerie or spicier selfie in the real lingerie
      // wardrobe, no klein check, no Nano Banana
      const open = can({ env, ledger, level: level }, "runware");
      // owner 2026-10-13: Nude/On are Runware's only (no Nano Banana, no Cloudflare klein) when the Worker has a Runware key
      if (!open && runwareRoute(level) && env.RUNWARE_API_KEY) {
        model = null;
        await aiFailed(env, `no picture: the day's Runware money is spent, and at /nsfw ${level} pictures are drawn on Runware only`);
        return null;
      }
      if (open && kind === "selfie" && pic.args && L.ENABLED && (isSpicy(pic) || (L.TIERS || []).includes(pic.tier))) {
        pic = { ...composePicture({ ...lingerieArgs(pic), lingerie: true, level, wardrobeList: isSpicy(pic) && !lingerieWords(pic.args.words) ? L.SPICY_WARDROBE : null }), asked: pic.asked };
      }
      const spicy = !open && nanoBanana && L.ENABLED && (kind === "selfie" ? isSpicy(pic) : !!pic.spicy);
      const lingerie = !open && L.ENABLED && (kind === "selfie" ? !!pic.args && (L.TIERS || []).includes(pic.tier) : !!pic.lingerie);
      // Step C: the picture writer words her own picture (never Nano Banana's or klein's lingerie-check pictures); null = the template
      if (!spicy && !lingerie) {
        // the picture core: the writer fills the spec's fields (JSON); the code phrases the prompt
        if (!pic.spec) pic = { ...pic, spec: specOf(pic) };
        const w = await writeSpec(env, kind, pic, pic.spec, { want, history, level });
        if (w) {
          pic = { ...pic, spec: w.spec, written: w.raw };
          log.llmText = w.raw;
        }
      } else if (!spicy && !lingerie) {
        const w = kind === "selfie" ? await writtenSelfie(env, pic, { history, level }) : kind === "scene" ? await writtenScene(env, pic, want, { history, level, dayWear }) : null;
        if (w) {
          pic = w;
          log.llmText = w.written;
        }
      }
      if (kind === "scene" && !pic.what && !pic.written) {
        model = null;
        return null; // the template had nothing to draw and the writer didn't answer: no picture, as before Step C
      }
      let kleinPic = null;
      let kleinRefused = null;
      if (lingerie && L.KLEIN_FIRST && !spicy) {
        const kp = kind === "scene" ? pic : { ...composePicture({ ...lingerieArgs(pic), wardrobeList: L.KLEIN_WARDROBE, level }), asked: pic.asked };
        try {
          const drawn = await drawPicture(env, kp.prompt, { location: kp.location, night: kp.night, ledger, kind, log, nsfw: level, spec: specOf(kp) });
          aiSpent(ledger, drawn.model === P.MODEL ? CONFIG.AI_BUDGET.PICTURE_NEURONS : CONFIG.AI_BUDGET.BACKUP_PICTURE_NEURONS, null);
          const seen = nanoBanana ? await lingerieSeen(env, ledger, drawn.bytes) : { ok: true, text: "" }; // at Off no vision check: the picture is klein's (2026-10-11)
          kleinPic = { ...kp, bytes: drawn.bytes, kind, logId: drawn.logId };
          if (seen.ok || !wantsLingerie(env, ledger, pic, spicy, level)) {
            model = null;
            return kleinPic;
          }
          await aiFailed(env, `klein drew lingerie tamer (seen: ${seen.text.slice(0, 120)}); asked ${L.MODEL}`);
        } catch (e) {
          kleinRefused = e;
          aiSpent(ledger, CONFIG.AI_BUDGET.PICTURE_NEURONS, e); // a refused picture was still drawn
          await aiFailed(env, `drawing lingerie with ${P.MODEL}: ${aiText_(e)}; ${wantsLingerie(env, ledger, pic, false, level) ? `asked ${L.MODEL}` : "drew it in klein's own wardrobe"}`);
        }
      }
      if (nanoBanana && (spicy || lingerie) && (kind === "selfie" ? !!pic.args : !!nanoScene)) {
        // a spicier selfie Google refuses (an outfit with no top, seen in SPICY_WARDROBE) gets one more try in a two-piece set
        const tries = kind === "scene" ? [nanoScene] : spicy ? [spicyPicture(pic), spicyPicture(pic, pickOne(L.WARDROBE))] : [composePicture({ ...lingerieArgs(pic), lingerie: true, level })];
        for (const [i, lp] of tries.entries()) {
          if (!wantsLingerie(env, ledger, pic, spicy || kind === "scene", level)) break;
          try {
            const bytes = await drawLingerie(env, lp);
            spend(ledger, "usd", Number(L.USD_PER_PICTURE) || 0);
            model = null;
            return { ...lp, bytes, kind };
          } catch (e) {
            await aiFailed(env, `drawing lingerie with ${L.MODEL}: ${aiText_(e)}; ${i < tries.length - 1 ? "tried a two-piece set" : kleinPic ? "sent klein's" : "klein drew it"}`);
          }
        }
      }
      if (kleinPic) {
        model = null;
        return kleinPic;
      }
      // klein already refused this very moment: drawing it again would only be refused again
      if (kind === "scene" && kleinRefused) {
        model = null;
        throw kleinRefused;
      }
      let drawn;
      try {
        drawn = await drawPicture(env, pic.prompt, { location: pic.location, night: pic.night, ledger, kind, log, nsfw: level, spec: specOf(pic) });
      } catch (e) {
        // Cloudflare's safety filter (3030) refused it (seen on the real API: a lace bralette and briefs in a
        // mirror): a boudoir picture first again in the code's own boudoir wardrobe (it gets through; owner
        // 2026-10-03: lingerie, not a robe or a tamer outfit), then one tier tamer, so a picture still comes
        if (kind !== "selfie" || !aiFiltered(e) || pic.tier === "everyday") throw e;
        // a nude-tier picture (Step 2) Cloudflare refused (Runware past its cap or failing): boudoir, then flirty, not everyday
        const tiers = pic.tier === "boudoir" || pic.tier === "nude" ? ["boudoir", "flirty"] : ["everyday"];
        for (const [i, tier] of tiers.entries()) {
          await aiFailed(env, `drawing a ${pic.tier} ${pic.shot}: ${aiText_(e)}; drew it ${tier}${tier === pic.tier ? " in her own wardrobe" : ""}`);
          pic = composePicture({ tier, shot: pic.shot, recentShots: ledger.shots, dayWear, level });
          try {
            drawn = await drawPicture(env, pic.prompt, { location: pic.location, night: pic.night, ledger, kind, log, nsfw: level, spec: specOf(pic) });
            break;
          } catch (again) {
            if (i === tiers.length - 1 || !aiFiltered(again)) throw again;
          }
        }
      }
      model = drawn.model;
      return { ...pic, bytes: drawn.bytes, kind, logId: drawn.logId };
    } catch (e) {
      error = e;
      await aiFailed(env, `drawing a picture: ${aiText_(e)}`);
      return null;
    } finally {
      // Runware's spend is in ledger.rwUsd (drawPicture), not in Cloudflare's neurons
      if (model && !String(model).startsWith("runware:")) aiSpent(ledger, model === P.MODEL ? CONFIG.AI_BUDGET.PICTURE_NEURONS : CONFIG.AI_BUDGET.BACKUP_PICTURE_NEURONS, error);
    }
  })();
  drawing.catch(() => {});
  return drawing;
}
// "sending a photo..." in the chat for as long as the picture draws (Telegram shows an action for 5 s)
export function whileDrawing(env, chatId, drawing) {
  const pulse = setInterval(() => tg(env, "sendChatAction", { chat_id: chatId, action: "upload_photo" }).catch(() => {}), 4500);
  const stop = () => clearInterval(pulse);
  Promise.resolve(drawing).then(stop, stop);
  return drawing;
}
// Sends a drawn picture, never one sent before (same bytes). Returns a history part, or null.
export async function deliverPicture(env, chatId, ledger, drawing) {
  const P = CONFIG.PICTURE;
  const pic = drawing && (await whileDrawing(env, chatId, drawing));
  try {
    if (!pic) return null;
    const hash = await sha256(pic.bytes);
    if (ledger.hashes.includes(hash)) {
      console.error("a drawn picture matched one already sent; not sending it");
      return null;
    }
    await tg(env, "sendChatAction", { chat_id: chatId, action: "upload_photo" });
    const sent = {};
    const id = await sendPhoto(env, chatId, pic.bytes, "", sent);
    if (id == null) return null;
    await logSent(env, pic.logId, sent.photo);
    await albumAdd(env, chatId, sent).catch((e) => console.error("album: couldn't save", e));
    ledger.hashes.push(hash);
    if (pic.kind === "selfie") {
      ledger.recent.push(pic.what);
      ledger.shots.push({ shot: pic.shot, angle: pic.angle || null, tier: pic.tier });
    }
    return { id, text: pic.kind === "selfie" ? fill(P.STORED, { what: pic.what }) : "" };
  } finally {
    if (drawing) await saveLedger(env, ledger);
  }
}
/* --- /album: every picture she sent (owner 2026-10-06, Cloudflare idea 6), as Telegram's own photo ids in KV --- */

export async function albumAdd(env, chatId, sent) {
  const sizes = (sent && sent.photo) || [];
  const fileId = sizes.length ? sizes[sizes.length - 1].file_id : null;
  if (!fileId || !env.REEM_KV) return;
  const list = (await env.REEM_KV.get(`al:${chatId}`, "json")) || [];
  list.push({ f: fileId, at: Date.now() });
  await env.REEM_KV.put(`al:${chatId}`, JSON.stringify(list.slice(-(Number(CONFIG.PICTURE.ALBUM_MAX) || 500))));
}
