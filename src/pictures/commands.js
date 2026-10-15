// /look, /pic, /pics, /album, /spend, /face, /nsfw.
import { commandFor, getSettings, notice } from "../chat/batch.js";
import { hisName } from "../chat/commands.js";
import { herHour } from "../chat/day.js";
import { sceneOf } from "../chat/respond.js";
import { inPerson } from "../chat/shape.js";
import { CONFIG, fill } from "../config/index.js";
import { levelFor, mayDraw, NSFW_LEVELS, nsfwLevel, picturesAllowed } from "../gate.js";
import { asCamera, isDark, locationOf, scenePicturePrompt, sceneWearing, timeOfDay } from "./compose.js";
import { deliverPicture, startPicture } from "./deliver.js";
import { drawPicture, filterSafe, safeLine } from "./draw.js";
import { pictureFlags } from "./plan.js";
import { faceBytes } from "./refs.js";
import { dayOutfits, hasWord, lightFor, namesClothes, nudeWords, pickOne, sexAct, wordsOf } from "./shots.js";
import { writerMessages } from "./writer.js";
import { aiAffordable, aiFailed, aiSpent, aiText_, callModel } from "../platform/ai.js";
import { escapeRegex, toBase64, xfetch } from "../platform/http.js";
import { loadLedger, saveLedger } from "../platform/kv.js";
import { sendPhoto, tg } from "../platform/telegram.js";

/* --- /spend (owner 2026-10-06, Cloudflare idea 3): today's money per account, from each provider's own figures --- */

export async function spendCommand(env, chatId) {
  const M = CONFIG.MESSAGES;
  const usd = (n, d = 2) => `$${(Number(n) || 0).toFixed(d)}`;
  const line = async (what, f) => { try { return `• ${what}: ${await f()}`; } catch (e) { return `• ${what}: couldn't ask (${String(e.message || e).slice(0, 80)})`; } };
  const [or, rw, cf] = await Promise.all([
    env.OPENROUTER_API_KEY ? line("OpenRouter (texts, voice, hearing)", async () => {
      const auth = { headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` }, signal: AbortSignal.timeout(8000) };
      const [k, c] = await Promise.all([xfetch("https://openrouter.ai/api/v1/key", auth).then((r) => r.json()), xfetch("https://openrouter.ai/api/v1/credits", auth).then((r) => r.json()).catch(() => ({}))]);
      const d = (k && k.data) || {};
      const left = c && c.data && c.data.total_credits != null ? `, ${usd(c.data.total_credits - c.data.total_usage)} credit left` : "";
      return `${usd(d.usage_daily, 3)} today, ${usd(d.usage_monthly)} this month${left}`;
    }) : null,
    env.RUNWARE_API_KEY ? line("Runware (pictures)", async () => {
      const r = await xfetch("https://api.runware.ai/v1", { method: "POST", headers: { Authorization: `Bearer ${env.RUNWARE_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify([{ taskType: "accountManagement", taskUUID: crypto.randomUUID(), operation: "getDetails" }]), signal: AbortSignal.timeout(8000) }).then((x) => x.json());
      const d = (r && r.data && r.data[0]) || {};
      if (d.balance == null) throw new Error(JSON.stringify(r.errors || r).slice(0, 80));
      return `${usd(d.usage && d.usage.today && d.usage.today.credits, 3)} today, ${usd(d.balance)} left`;
    }) : null,
    env.AI && env.REEM_KV ? line("Cloudflare Workers AI", async () => {
      const B = CONFIG.AI_BUDGET;
      const l = await loadLedger(env);
      const paid = Math.max(0, l.neurons - 10000) * 0.011 / 1000;
      return `about ${Math.round(l.neurons).toLocaleString("en-US")} of ${B.DAILY_NEURONS.toLocaleString("en-US")} neurons counted by the bot (${usd(paid)} past the free 10,000; pictures, photos, voice and hearing; the backup texts, plan and memory are in the gateway's figures)`;
    }) : null,
  ]);
  const today = await loadLedger(env).catch(() => null);
  const failed = env.RUNWARE_API_KEY ? `• Runware attempts that failed today: ${(today && today.rwFailed) || 0} (klein tries again, then Cloudflare draws; never TwinFlow for her pictures)` : "";
  const lines = [or, rw, cf, failed].filter(Boolean).join("\n") || "• no accounts connected";
  return notice(env, chatId, M.SPEND, { day: new Date().toISOString().slice(0, 10), lines });
}
// /album [page]: page 1 = the newest 10, page 2 the 10 before them...
export async function albumCommand(env, chatId, args) {
  const M = CONFIG.MESSAGES;
  if (!env.REEM_KV) return notice(env, chatId, M.NEEDS_MEMORY);
  const list = (await env.REEM_KV.get(`al:${chatId}`, "json")) || [];
  if (!list.length) return notice(env, chatId, M.ALBUM_EMPTY);
  const pages = Math.ceil(list.length / 10);
  const page = Math.min(Math.max(parseInt(args, 10) || 1, 1), pages);
  const end = list.length - (page - 1) * 10;
  const shown = list.slice(Math.max(0, end - 10), end);
  const more = page < pages ? fill(M.ALBUM_MORE, { cmd: commandFor("album"), next: page + 1 }) : "";
  const caption = M.NOTICE_PREFIX + fill(M.ALBUM_PAGE, { from: end - shown.length + 1, to: end, total: list.length, more });
  const r = shown.length === 1
    ? await tg(env, "sendPhoto", { chat_id: chatId, photo: shown[0].f, caption })
    : await tg(env, "sendMediaGroup", { chat_id: chatId, media: shown.map((p, i) => ({ type: "photo", media: p.f, ...(i ? {} : { caption }) })) });
  if (!r.ok) console.error("album failed", r.description);
}
/* --- /look, /pics and /face --- */

// /look [words]: what he sees right now (PICTURE.LOOK): DeepSeek reads the chat and his words and writes the picture, with her
// in it (her face) or without (where he is); when it fails, in person: her last reply as before (her earlier replies of the scene
// when that one says too little about her). Never stored in the history
export async function lookCommand(env, chatId, args = "") {
  const M = CONFIG.MESSAGES;
  const P = CONFIG.PICTURE;
  const kv = env.REEM_KV;
  const [history, settings, ledger] = await Promise.all([kv.get(`h:${chatId}`, "json").then((h) => h || []), getSettings(kv, chatId), loadLedger(env)]);
  const together = sceneOf(history, "") === "together";
  const level = nsfwLevel(settings); // /nsfw (Step 2)
  if (!picturesAllowed(env, { ooc: false, settings, ledger })) return notice(env, chatId, M.LOOK_OFF);
  await tg(env, "sendChatAction", { chat_id: chatId, action: "upload_photo" });
  // Step C: the clothes LOOK.PROMPT names when the story names none: the scene's own, else the day's outfit
  const dayWear = await dayOutfits(env);
  const lastHers = (history.filter((m) => m.role === "assistant" && !m.ooc).at(-1) || {}).content || "";
  const seen = await lookWrite(env, history, settings, args, sceneWearing(lastHers, history, level, dayWear));
  // a description the level doesn't allow is not drawn (at On it is drawn as before)
  if (seen && level !== "on" && !mayDraw(seen.text, level)) return nsfwRefusal(env, chatId, seen.text, level);
  if (seen && seen.withHer) {
    const sent = await deliverPicture(env, chatId, ledger, lookPicture(env, ledger, seen.text, true, { chat: chatId, asked: args, llmText: seen.raw }, level));
    return sent ? undefined : notice(env, chatId, M.LOOK_FAILED);
  }
  if (seen) {
    const sent = await deliverPicture(env, chatId, ledger, lookPicture(env, ledger, seen.text, false, { chat: chatId, asked: args, llmText: seen.raw }, level));
    return sent ? undefined : notice(env, chatId, M.LOOK_FAILED);
  }
  if (!together) return notice(env, chatId, M.LOOK_APART);
  const hers = history.filter((m) => m.role === "assistant" && !m.ooc).slice(-3).map((m) => m.content).filter(inPerson);
  const text = [hers.at(-1), hers.slice(-2).join("\n"), hers.join("\n")].find((t) => t && scenePicturePrompt(t, level));
  if (!text) return notice(env, chatId, M.LOOK_NONE);
  const sent = await deliverPicture(env, chatId, ledger, startPicture(env, ledger, "scene", text, { dayWear, history, chat: chatId, asked: args, source: "look", nsfw: level }));
  if (!sent) return notice(env, chatId, M.LOOK_FAILED);
}
// /look's picture in words (PICTURE.LOOK.MODEL): { withHer, text } or null when the model fails or says nothing usable
export async function lookWrite(env, history, settings, args = "", clothes = "") {
  const P = CONFIG.PICTURE;
  const L = P.LOOK || {};
  if (!L.MODEL || !L.PROMPT) return null;
  const him = hisName(settings) || "the man";
  const her = CONFIG.CHARACTER.NAME;
  const chat = history.slice(-(Number(L.CHAT_MESSAGES) || 8)).map((m) => `${m.role === "user" ? him : her}: ${String(m.content).slice(0, 800)}`).join("\n");
  const words = String(args || "").trim();
  const prompt = fill(L.PROMPT, { him, her, chat: chat || "(nothing yet)", ask: words ? fill(L.ASK || "", { words }) : "", rules: (P.WRITER || {}).RULES || "", clothes: clothes || P.SCENE_WEARING || "" });
  let out;
  try {
    out = await callModel(env, writerMessages(prompt), { temperature: 0.7, max_tokens: Number(L.MAX_TOKENS) || 300 }, { model: L.MODEL, timeoutMs: 40000, attempts: 2, task: (P.WRITER || {}).REASONING === "low" });
  } catch (e) {
    await aiFailed(env, `/look description: ${aiText_(e)}`);
    return null;
  }
  const lines = String(out || "").replace(/\*/g, "").split("\n").map((x) => x.trim()).filter(Boolean);
  if (!lines.length) return null;
  const withHer = /^WITH[_ ]HER\b/i.test(lines[0]);
  const first = lines[0].replace(/^(?:WITH[_ ]HER|ALONE)\b[:.\s-]*/i, "");
  const names = CONFIG.CHARACTER.NAME_PREFIXES.map(escapeRegex).join("|");
  const text = [first, ...lines.slice(1)].filter(Boolean).join(" ").replace(new RegExp(`\\b(?:${names})['’]s\\b`, "gi"), "her").replace(new RegExp(`\\b(?:${names})\\b`, "gi"), "she").replace(/^she\b/, "She").trim();
  return wordsOf(text).length >= 4 ? { withHer, text, raw: String(out || "") } : null;
}
// Draws /look's picture: with her, a scene picture with her face (SCENE_ACT_STYLE on a sex act); without, ALONE_STYLE and no face
export function lookPicture(env, ledger, text, withHer, log = null, level = CONFIG.PICTURE.NSFW.DEFAULT) {
  const P = CONFIG.PICTURE;
  return (async () => {
    let model = null;
    let error = null;
    try {
      const location = withHer ? locationOf(text) : null;
      const night = timeOfDay() === "night";
      const lightText = lightFor(text, night ? P.SCENE_NIGHT : pickOne((P.LIGHT || {})[timeOfDay().toUpperCase()]), level);
      const light = night && lightText === P.SCENE_NIGHT ? lightText : lightText && `Lit by ${lightText}.`;
      const style = withHer ? (sexAct(text, level) && P.SCENE_ACT_STYLE) || P.SCENE_STYLE : (P.LOOK || {}).ALONE_STYLE;
      const body = withHer ? filterSafe(asCamera(text), level) : text; // Step B: he is the camera
      // Step B: a /look text that names no clothes (and no nudity or sex act) gets SCENE_WEARING, as her scene pictures do: else klein
      // drew image 1's black bra and thong (/look 484, 4/4)
      const wear = withHer && P.SCENE_WEARING && !namesClothes(text) && !nudeWords(text) && !sexAct(text, level) ? `She is wearing ${P.SCENE_WEARING}.` : "";
      const prompt = [style, withHer ? "{who}" : "", body.replace(/[.\s]*$/, "."), wear, light, location && "{room}", withHer ? safeLine(level) : ""].filter(Boolean).join(" ");
      const drawn = await drawPicture(env, prompt, { location, night: night || isDark(undefined, lightText || ""), ledger, kind: "scene", herself: withHer, face: withHer, log: { ...log, source: "look" }, nsfw: level });
      model = drawn.model;
      return { bytes: drawn.bytes, kind: "scene", logId: drawn.logId };
    } catch (e) {
      error = e;
      model = P.MODEL;
      await aiFailed(env, `drawing /look: ${aiText_(e)}`);
      return null;
    } finally {
      if (model && !String(model).startsWith("runware:")) aiSpent(ledger, model === P.MODEL ? CONFIG.AI_BUDGET.PICTURE_NEURONS : CONFIG.AI_BUDGET.BACKUP_PICTURE_NEURONS, error);
    }
  })();
}
// /pic's words about her; in a sex act (sexAct) or with "my hand", his me/my/I are "the man" (POV_MAN), "you" is still her
// Step B: his words go through asCamera (his name and I/me/my are the man, her name and "you" are her, he is the camera)
export const picWords = (args, level = CONFIG.PICTURE.NSFW.DEFAULT, settings = {}) => asCamera(args, settings);
// Words that put him in the picture: then he is the camera (PICTURE.POV_CLOTHED on a picture that is not a sex act)
export const involvesHim = (t) => /\b(?:the man|the man['’]s|his|him|he|himself|pov|point of view|first[- ]person)\b/i.test(String(t || ""));
// Step B: PICTURE.CAMERA "first" writes him in the first person in the final prompt (the man / he / him / his → I / me / my), the
// bench's variant F; "third" (default) leaves "the man". Her words are untouched.
export function firstPerson(text) {
  if (CONFIG.PICTURE.CAMERA !== "first") return text;
  const verb = (v) => (/^(?:is|was)$/i.test(v) ? (v.toLowerCase() === "is" ? "am" : "was") : /^has$/i.test(v) ? "have" : /(?:ch|sh|ss|x|z)es$/i.test(v) ? v.slice(0, -2) : /[^s]s$/i.test(v) ? v.slice(0, -1) : v);
  return String(text || "")
    .replace(/\b(?:the man|he)(?:'|’)s\s+(?=\w+ing\b)/gi, "I'm ")
    .replace(/\b(the man|he)\s+(\w+)\b/gi, (m, w, v) => (/^(?:and|or|but|with|from|to|in|on|at|of|for|by|as|between|behind|lying|kneeling|sitting|standing)$/i.test(v) || !/s$/i.test(v) ? (w.toLowerCase() === "he" ? `I ${v}` : `me ${v}`) : `I ${verb(v)}`))
    .replace(/\bthe man(?:'|’)s\b/gi, "my").replace(/\bthe man\b/gi, "me")
    .replace(/\bhimself\b/gi, "myself").replace(/\bhis\b/gi, "my").replace(/\bhim\b/gi, "me").replace(/\bhe\b/gi, "I")
    .replace(/(^|[.!?:]\s+)(me|my)\b/g, (m, a, w) => a + w.charAt(0).toUpperCase() + w.slice(1));
}
// /pic <words>: a picture of her as he describes it (hair, makeup, clothes, pose, framing, angle, place); her face from
// the reference, drawn on PICTURE.ROUTE like her other pictures; never stored in the history
export async function picCommand(env, chatId, args) {
  const P = CONFIG.PICTURE;
  const M = CONFIG.MESSAGES;
  const [settings, ledger] = await Promise.all([getSettings(env.REEM_KV, chatId), loadLedger(env)]);
  const level = nsfwLevel(settings); // /nsfw (Step 2)
  const words = picWords(args, level, settings);
  if (!words) return notice(env, chatId, M.PIC_HELP);
  if (!picturesAllowed(env, { ooc: false, settings, ledger })) return notice(env, chatId, M.LOOK_OFF);
  if (!mayDraw(words, level)) return nsfwRefusal(env, chatId, words, level);
  const { prompt, location, night } = customPicture(words, undefined, await dayOutfits(env), level);
  await tg(env, "sendChatAction", { chat_id: chatId, action: "upload_photo" });
  const drawing = (async () => {
    let model = null;
    let error = null;
    try {
      const drawn = await drawPicture(env, prompt, { location, night, ledger, custom: true, nsfw: level, log: { source: "pic", chat: chatId, asked: args } });
      model = drawn.model;
      return { bytes: drawn.bytes, kind: "custom", logId: drawn.logId };
    } catch (e) {
      error = e;
      model = P.MODEL;
      await aiFailed(env, `drawing /pic: ${aiText_(e)}`);
      return null;
    } finally {
      if (model && !String(model).startsWith("runware:")) aiSpent(ledger, model === P.MODEL ? CONFIG.AI_BUDGET.PICTURE_NEURONS : CONFIG.AI_BUDGET.BACKUP_PICTURE_NEURONS, error);
    }
  })();
  const sent = await deliverPicture(env, chatId, ledger, drawing);
  if (!sent) return notice(env, chatId, M.LOOK_FAILED);
}
// /pic's prompt from his words (already about her): CUSTOM.STYLE, {who}, his words, the place ({room}) they name, the
// light of her hour, CRAFT and (on Cloudflare) SAFE. { prompt, location, night }
export function customPicture(words, hour = herHour(), dayWear = null, level = CONFIG.PICTURE.NSFW.DEFAULT) {
  const P = CONFIG.PICTURE;
  const light = lightFor(words, pickOne((P.LIGHT || {})[timeOfDay(hour).toUpperCase()]), level);
  const location = locationOf(words);
  // Step 4: his words name no clothes → the day's outfit (OUT when the words are outside); never for nudity or a sex act
  const outside = (P.OUTSIDE_WORDS || []).some((w) => String(w).trim() && hasWord(words, w));
  // Step B: no day outfit (KV down, the studio, a bench) → SCENE_WEARING: with no clothes named klein drew image 1's bra and thong (D1 491)
  const wear = !namesClothes(words) && !nudeWords(words) && !pictureFlags(words, true, level).act ? (dayWear ? (outside ? dayWear.out : dayWear.home) : P.SCENE_WEARING || "") : "";
  // Step B: him in the words and no sex act (POV_MAN covers acts): he is the camera
  const pov = P.POV_CLOTHED && involvesHim(words) && !sexAct(words, level) ? P.POV_CLOTHED : "";
  const prompt = [(P.CUSTOM || {}).STYLE, "{who}", `${filterSafe(words, level)}.`, pov, wear && `She is wearing ${wear}.`, location && "{room}", light && `Lit by ${light}.`, safeLine(level)].filter(Boolean).join(" ");
  return { prompt, location, night: isDark(hour, light || "") };
}
export async function picsCommand(env, chatId) {
  const kv = env.REEM_KV;
  const s = await getSettings(kv, chatId);
  s.morePics = !s.morePics;
  await kv.put(`s:${chatId}`, JSON.stringify(s));
  return notice(env, chatId, s.morePics ? CONFIG.MESSAGES.PICS_ON : CONFIG.MESSAGES.PICS_OFF);
}
export function nsfwButtons() {
  const L = CONFIG.MESSAGES.NSFW_LABELS;
  return { inline_keyboard: [NSFW_LEVELS.map((l) => ({ text: L[l], callback_data: `nsfw:${l}` }))] };
}
// /nsfw: no argument shows the level with its buttons; off, nude or on sets it
export async function nsfwCommand(env, chatId, args = "") {
  const M = CONFIG.MESSAGES;
  const kv = env.REEM_KV;
  const want = String(args || "").trim().split(/\s+/)[0].toLowerCase();
  const s = await getSettings(kv, chatId);
  if (NSFW_LEVELS.includes(want)) {
    s.nsfw = want;
    await kv.put(`s:${chatId}`, JSON.stringify(s));
    return notice(env, chatId, M.NSFW_SET, { level: M.NSFW_LABELS[want] });
  }
  return tg(env, "sendMessage", { chat_id: chatId, text: M.NOTICE_PREFIX + fill(M.NSFW_SHOW, { level: M.NSFW_LABELS[nsfwLevel(s)] }), reply_markup: nsfwButtons() });
}
// A tap on one of /nsfw's buttons: save the level, and the message says so (its buttons go)
export async function nsfwButton(env, cq) {
  const M = CONFIG.MESSAGES;
  const kv = env.REEM_KV;
  const chatId = cq.message.chat.id;
  const want = String(cq.data).slice("nsfw:".length);
  if (!NSFW_LEVELS.includes(want)) return;
  const s = await getSettings(kv, chatId);
  s.nsfw = want;
  await kv.put(`s:${chatId}`, JSON.stringify(s));
  await tg(env, "editMessageText", { chat_id: chatId, message_id: cq.message.message_id, text: M.NOTICE_PREFIX + fill(M.NSFW_SET, { level: M.NSFW_LABELS[want] }) });
}
// Words that can't be drawn at this level: PIC_NSFW with the level they need, or PIC_NOT_DRAWN when no level draws them
export const nsfwRefusal = (env, chatId, words, level) => {
  const need = levelFor(words);
  return notice(env, chatId, need ? CONFIG.MESSAGES.PIC_NSFW : CONFIG.MESSAGES.PIC_NOT_DRAWN, { need, level: CONFIG.MESSAGES.NSFW_LABELS[level] });
};
// /face: shows her face and draws FACE_DRAFTS new ones; /face keep (as a reply to a draft) uses it;
// /face reset goes back to the face built into face.js. Drafts are kept a day (KV face_draft:<message id>).
export async function faceCommand(env, chatId, args, msg = {}) {
  const M = CONFIG.MESSAGES;
  const P = CONFIG.PICTURE;
  const kv = env.REEM_KV;
  const cmd = commandFor("face");
  const verb = (args.split(/\s+/)[0] || "").toLowerCase();
  if (verb === "keep") {
    const target = msg.reply_to_message && msg.reply_to_message.message_id;
    if (!target) return notice(env, chatId, M.FACE_NEEDS_REPLY, { cmd });
    const draft = await kv.get(`face_draft:${target}`);
    if (!draft) return notice(env, chatId, M.FACE_EXPIRED, { cmd });
    await kv.put("face", draft);
    return notice(env, chatId, M.FACE_KEPT);
  }
  if (verb === "reset") {
    await kv.delete("face");
    return notice(env, chatId, M.FACE_RESET);
  }
  const now = await faceBytes(env);
  const count = Number(P.FACE_DRAFTS) || 3;
  if (now) await sendPhoto(env, chatId, now, M.NOTICE_PREFIX + fill(M.FACE_NOW, { source: (await kv.get("face")) ? "picked with /face" : "built in", cmd, count }));
  else await notice(env, chatId, M.FACE_NONE, { cmd, count });
  if (!env.AI) return notice(env, chatId, M.FACE_NO_AI);
  const ledger = await loadLedger(env);
  try {
    for (let n = 1; n <= count; n++) {
      if (!aiAffordable(ledger, "picture")) break;
      await tg(env, "sendChatAction", { chat_id: chatId, action: "upload_photo" });
      let drawn;
      try {
        drawn = await drawPicture(env, `{who} ${P.PORTRAIT} ${P.SAFE}`, { size: 480, face: false, log: { source: "face" } });
        aiSpent(ledger, CONFIG.AI_BUDGET.PICTURE_NEURONS);
      } catch (e) {
        aiSpent(ledger, 0, e);
        await aiFailed(env, `drawing a face: ${aiText_(e)}`);
        return notice(env, chatId, M.FACE_FAILED, { error: aiText_(e) });
      }
      const id = await sendPhoto(env, chatId, drawn.bytes, M.NOTICE_PREFIX + fill(M.FACE_DRAFT, { n, cmd }));
      if (id != null) await kv.put(`face_draft:${id}`, toBase64(drawn.bytes), { expirationTtl: 86400 });
    }
  } finally {
    await saveLedger(env, ledger);
  }
}
