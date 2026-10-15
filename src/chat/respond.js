// A reply: what he sent, text/voice/scene/visit, timing, delivery, saving the turn.
import { failed } from "./batch.js";
import { joinParts, makeEntry, noteTelegramName } from "./commands.js";
import { dayInfo, scheduleNow } from "./day.js";
import { queueFold } from "./memory.js";
import { recallFind, recallSave } from "./recall.js";
import { ACTION, inPerson, isOoc, shapeReply, splitBubbles } from "./shape.js";
import { think } from "./think.js";
import { CONFIG, fill } from "../config/index.js";
import { noteMinor, nsfwLevel, pictureMode, picturesAllowed } from "../gate.js";
import { forSpeech } from "../persona/index.js";
import { deliverPicture, startPicture } from "../pictures/deliver.js";
import { dayOutfits, planShot } from "../pictures/shots.js";
import { aiText_ } from "../platform/ai.js";
import { escapeRegex, sleep } from "../platform/http.js";
import { loadLedger, loadState } from "../platform/kv.js";
import { logEvent, startTrace, trace, traceRow } from "../platform/log.js";
import { act, plain, sendBubbles, sendVoice, tg } from "../platform/telegram.js";
import { describePhoto, photoLine } from "../vision.js";
import { transcribe } from "../voice/hearing.js";
import { audioTagsOn, stripAudioTags } from "../voice/tags.js";
import { tts } from "../voice/tts.js";

/* ------------------------------------------------------------------ */
/*  Her replies                                                        */
/* ------------------------------------------------------------------ */

export async function reply(env, ctx, convo, deadline) {
  const chatId = convo[0].chat.id;
  const kv = env.REEM_KV;
  const I = CONFIG.INBOX;
  // His first unanswered message is when her clock starts
  const sentAt = Math.min(...convo.map((m) => (m.date || 0) * 1000));
  const started = Math.min(Date.now(), sentAt || Date.now());

  try {
    const statePromise = loadState(kv, chatId);
    statePromise.catch(() => {});

    const parts = [];
    let chars = 0;
    let voiceSeconds = 0;
    let photoSeconds = 0; // she looks at each photo for a moment
    for (const m of convo) {
      const media = m.voice || m.audio || m.video_note;
      let text;
      if (media) {
        voiceSeconds += media.duration || 0;
        const t = await transcribe(env, media.file_id, media.mime_type, media.duration);
        text = t ? fill(I.VOICE_NOTE, { text: t }) : fill(I.VOICE_NOISE);
      } else if (m.text) {
        text = m.text.trim();
        chars += m.text.length;
      } else if (m.photo) {
        const seen = await describePhoto(env, m.photo);
        if (seen) photoSeconds += 3;
        parts.push({ id: m.message_id, text: photoLine(seen, m.caption), photo: true, ...(seen ? { seen } : {}) });
        continue;
      } else if (m.sticker) {
        text = fill(I.STICKER, { emoji: m.sticker.emoji || "" });
      } else continue;
      parts.push({ id: m.message_id, text });
    }
    if (!parts.length) return;
    const heard = joinParts("user", parts);
    const state = await statePromise;
    const last = convo[convo.length - 1];
    await noteTelegramName(env, chatId, state.settings, last.from);

    // She only answers once she has noticed (SCHEDULE, momentum) and read or listened
    const T = CONFIG.TIMING;
    const waitUntil = started + noticeTime(lastTime(state.history), started) + chars * T.READ_MS_PER_CHAR + (voiceSeconds + photoSeconds) * 1000;
    const reactTo = last.viaAuto ? undefined : last.message_id; // a draft he sent is the bot's message
    await respond(env, ctx, chatId, state, { heard, userParts: parts, cameAsVoice: voiceSeconds > 0, waitUntil, reactTo }, deadline);
  } catch (e) {
    await failed(env, chatId, e, deadline);
  }
}
// Replies and texting first both end here: she thinks, waits like a person, then sends a text,
// a scene or a voice note. `heard` is what he sent (or, when she texts first, her instruction);
// `userParts` are his Telegram messages behind it. Saved once it's delivered, with the message ids.
export async function respond(env, ctx, chatId, state, opts, deadline) {
  const t = startTrace();
  t.chat = chatId;
  try {
    await respondNow(env, ctx, chatId, state, opts, deadline);
    await logEvent(env, traceRow(opts.proactive ? "proactive" : "reply", "ok"));
  } catch (e) {
    await logEvent(env, traceRow(opts.proactive ? "proactive" : "reply", e && e.retryable ? "dropped" : "error", (e && e.message) || e));
    if (e && typeof e === "object") e.logged = true; // failed() doesn't log it a second time
    throw e;
  }
}
export async function respondNow(env, ctx, chatId, state, { heard, userParts = null, cameAsVoice = false, waitUntil, proactive = false, reactTo }, deadline) {
  const { settings, history, notes } = state;
  const level = nsfwLevel(settings); // /nsfw (Step 2): Off, Nude or On for this chat's pictures
  const ooc = !proactive && isOoc(heard);
  const scene = proactive ? "apart" : sceneOf(history, heard);
  const R = CONFIG.REACTIONS;
  const canReact = !proactive && !ooc && !!reactTo && R.ENABLED && scene === "apart";
  const offerReaction = canReact && Math.random() < R.CHANCE;
  const mode = replyMode({ scene, heard, proactive, ooc, cameAsVoice, moreVoice: !!settings.moreVoice });
  if (trace) trace.mode = mode;
  // His own words: not what the vision model saw in his photos ("a selfie of a man..." isn't him asking)
  const said = userParts ? userParts.map((p) => (p.photo ? p.text.replace(p.seen || "\u0000", "") : p.text)).join("\n") : heard;
  if (!proactive) await noteMinor(env, chatId, settings, said);
  // Pictures follow the voice rules (pictureMode next to replyMode), within the day's Workers AI budget
  const ledger = env.AI ? await loadLedger(env) : null;
  const canPicture = picturesAllowed(env, { ooc, settings, ledger });
  const picture = canPicture ? pictureMode({ scene, said, proactive, cameAsPhoto: !!(userParts && userParts.some((p) => p.photo)), morePics: !!settings.morePics }) : null;
  // A selfie the code decided: its shot and tier are picked now, so she's told which one she sends
  const asked = picture && picture.asked ? said : "";
  if (picture && picture.kind === "selfie") picture.plan = planShot({ asked, history, recentShots: ledger.shots, level });

  // She starts thinking now, but only answers at waitUntil
  const sceneVoice = (mode === "scene" || mode === "visit") && (asksToHear(heard) || Math.random() < (Number(CONFIG.VOICE.SCENE_CHANCE) || 0));
  const [recall, day] = await Promise.all([ooc || proactive ? "" : recallFind(env, chatId, said), dayInfo(env, ctx)]);
  const replyPromise = think(env, history, notes, heard, { mode, scene, offerReaction, canReact, ooc, settings, picture, canPicture, recentPictures: ledger ? ledger.recent : [], recall, day });
  replyPromise.catch(() => {});
  await sleep(Math.min(waitUntil, deadline - CONFIG.TIMING.REPLY_MARGIN_MS) - Date.now());

  const typingStarted = Date.now();
  await tg(env, "sendChatAction", { chat_id: chatId, action: mode === "voice" ? "record_voice" : "typing" });
  const raw = await replyPromise;
  if (trace) trace.lateMs = Date.now() - Math.min(waitUntil, deadline - CONFIG.TIMING.REPLY_MARGIN_MS); // > 0: she was ready late
  // The format rules are enforced here, whatever the model wrote (see shapeReply)
  const out = shapeReply(raw, { scene, mode, ooc, canReact, canSelfie: canPicture, history, heard: proactive ? "" : heard, lastResort: true });
  // Her picture starts drawing now, while she types: a selfie when the code decided one (she may have left
  // [selfie] out) or she wrote one herself; in person, the moment from the scene
  let drawing = null;
  if (canPicture && scene !== "together" && (out.selfie != null || (picture && picture.kind === "selfie"))) {
    drawing = startPicture(env, ledger, "selfie", out.selfie || null, { dayWear: await dayOutfits(env), said: [...out.texts, out.voiceText].filter(Boolean).join("\n"), plan: picture && picture.plan, history, asked, chat: chatId, nsfw: level });
  } else if (picture && picture.kind === "scene" && out.kind === "scene") {
    drawing = startPicture(env, ledger, "scene", out.texts.join("\n"), { dayWear: await dayOutfits(env), history, asked, chat: chatId, nsfw: level });
  }
  if (out.reaction) {
    const r = await tg(env, "setMessageReaction", { chat_id: chatId, message_id: reactTo, reaction: [{ type: "emoji", emoji: out.reaction }] });
    if (!r.ok) console.error("reaction failed", r.description);
  }
  const userEntry = proactive ? null : makeEntry("user", userParts || [{ id: null, text: heard }]);
  const extra = {
    ...(proactive ? { proactive: true } : {}),
    ...(ooc ? { ooc: true } : {}),
    ...(out.reaction ? { react: out.reaction, reactTo } : {}),
  };
  if (out.kind === "none" && !drawing) {
    // Only a reaction: that's her whole answer
    if (out.reaction) {
      await saveTurn(env, chatId, history, notes, userEntry, makeEntry("assistant", [], extra, fill(R.SAVED, { emoji: out.reaction })))
        .catch((e) => console.error("save failed", e));
    } else console.error("nothing sendable in the reply, even after a retry");
    return;
  }

  let parts = [];
  try {
    // Texts (or a scene, as one message) first: for a voice note, only words she typed before it
    if (out.texts.length) parts = await sendBubbles(env, chatId, out.texts, { deadline, typedAlready: Date.now() - typingStarted });
    if (out.kind === "voice") {
      let note = null;
      try {
        const audioPromise = tts(env, out.spoken, ledger);
        audioPromise.catch(() => {});
        await act(env, chatId, "record_voice", Math.min(speakingTime(out.spoken), deadline - Date.now() - CONFIG.TIMING.VOICE_MARGIN_MS), 1);
        const sent = await sendVoice(env, chatId, await audioPromise);
        if (sent.delivered) note = { id: sent.id, text: `[voice] ${out.voiceText}` };
        else await voiceFailed(env, sent.error);
      } catch (e) {
        console.error(e); // fall back to text
        await voiceFailed(env, e.message || e);
      }
      parts = parts.concat(note ? [note] : await sendBubbles(env, chatId, splitBubbles(out.voiceText), { deadline }));
    }
    if (out.kind === "scene" && sceneVoice) {
      const clip = await sayScene(env, chatId, out.texts.join("\n"), deadline, ledger);
      if (clip) parts.push(clip);
    }
    // Her picture, after her words
    if (drawing) {
      const pic = await deliverPicture(env, chatId, ledger, drawing);
      if (pic) parts.push(pic);
      else if (!parts.length) parts = await sendBubbles(env, chatId, [fill(CONFIG.PICTURE.FAILED_TEXT)], { deadline });
    }
  } finally {
    const hers = parts.length ? makeEntry("assistant", parts, extra) : makeEntry("assistant", [], extra, out.stored);
    await saveTurn(env, chatId, history, notes, userEntry, hers).catch((e) => console.error("save failed", e));
  }
}
// What kind of reply this is: a scene when together; when apart a voice note if he asks for one or on
// a VOICE.CHANCE roll, otherwise texts. Decided here because the model describes voice notes instead.
// An OOC answer is always plain text.
export function replyMode({ scene, heard, proactive = false, ooc = false, cameAsVoice = false, moreVoice = false }) {
  if (ooc) return "text";
  if (scene === "together") return "scene";
  const V = CONFIG.VOICE;
  if (!proactive && asksForVoice(heard)) return "voice";
  if (!proactive && asksHerOver(heard) && Math.random() < (Number(CONFIG.TEXTING.VISIT_CHANCE) || 0)) return "visit";
  const chance = cameAsVoice ? V.CHANCE_AFTER_VOICE : moreVoice ? V.CHANCE_MORE_VOICE : V.CHANCE;
  return Math.random() < (Number(chance) || 0) ? "voice" : "text";
}
// Apart: he asks her to come to him (TEXTING.VISIT_PATTERN), not that he's coming (VISIT_NOT_PATTERN)
export function asksHerOver(text) {
  const T = CONFIG.TEXTING;
  try {
    return !!T.VISIT_PATTERN && new RegExp(T.VISIT_PATTERN, "i").test(text) && !(T.VISIT_NOT_PATTERN && new RegExp(T.VISIT_NOT_PATTERN, "i").test(text));
  } catch (e) {
    console.error("TEXTING.VISIT_PATTERN or VISIT_NOT_PATTERN is not a valid regular expression", e);
    return false;
  }
}
// In a scene: he asks to hear her (ASK_PATTERN or SCENE_ASK_PATTERN)
export function asksToHear(text) {
  if (asksForVoice(text)) return true;
  try {
    return !!CONFIG.VOICE.SCENE_ASK_PATTERN && new RegExp(CONFIG.VOICE.SCENE_ASK_PATTERN, "i").test(text);
  } catch (e) {
    console.error("VOICE.SCENE_ASK_PATTERN is not a valid regular expression", e);
    return false;
  }
}
// Her quoted words in a scene, one line each, for the audio clip. A stage direction in the narration
// around a line ("she whispers", "...," she murmurs) becomes its tag; the narration itself is never spoken.
export function sceneSpeech(scene) {
  const map = CONFIG.VOICE.STAGE_DIRECTIONS || {};
  const keys = Object.keys(map).filter((k) => map[k]).sort((a, b) => b.length - a.length);
  // The direction nearest her words wins ("her voice drops..., almost a whisper" -> whispers)
  const tagIn = (narration) => {
    let best = null;
    for (const k of keys) {
      const re = new RegExp(`\\b${escapeRegex(k).replace(/\s+/g, "\\s+")}(?![\\p{L}])`, "giu");
      for (const m of narration.matchAll(re)) if (!best || m.index > best.at) best = { at: m.index, tag: map[k] };
    }
    return best ? best.tag : "";
  };
  const t = String(scene).replace(/\*/g, "");
  const quotes = [...t.matchAll(/["“]([^"”\n]+)["”]/g)];
  let last = "";
  return quotes
    .map((m, n) => {
      const words = m[1].trim().replace(/^[—–-]+\s*/, ""); // a line picked up after narration: "—you didn't"
      const end = m.index + m[0].length;
      const after = t.slice(end, n + 1 < quotes.length ? quotes[n + 1].index : t.length).split(/[.!?]/)[0];
      const before = t.slice(n ? quotes[n - 1].index + quotes[n - 1][0].length : 0, m.index).split(/[.!?]/).filter((x) => x.trim()).pop() || "";
      // "Come here," she whispers: the words after the line describe it; otherwise the sentence before it
      const tag = (/[,—–-]$/.test(words) && tagIn(after)) || tagIn(before);
      const say = tag && tag !== last && audioTagsOn(); // a tone holds until another one is given
      if (tag) last = tag;
      return (say ? `[${tag}] ` : "") + words.replace(/[,—–-]+$/, ".");
    })
    .filter((l) => /\p{L}/u.test(l))
    .join("\n");
}
// The audio clip after a scene: {id, text: ""} (nothing added to what the model reads back), or null
export async function sayScene(env, chatId, scene, deadline, ledger = null) {
  const spoken = forSpeech(sceneSpeech(scene));
  if (!/\p{L}/u.test(stripAudioTags(spoken))) return null;
  const room = deadline - Date.now() - CONFIG.TIMING.VOICE_MARGIN_MS;
  if (room <= 0) return null;
  try {
    const audioPromise = tts(env, spoken, ledger);
    audioPromise.catch(() => {});
    await act(env, chatId, "record_voice", Math.min(speakingTime(spoken), room), 1);
    const sent = await sendVoice(env, chatId, await audioPromise);
    if (sent.delivered) return { id: sent.id, text: "" };
    await voiceFailed(env, sent.error);
  } catch (e) {
    console.error(e);
    await voiceFailed(env, e.message || e);
  }
  return null; // the written scene already said it
}
export function asksForVoice(text) {
  try {
    return !!CONFIG.VOICE.ASK_PATTERN && new RegExp(CONFIG.VOICE.ASK_PATTERN, "i").test(text);
  } catch (e) {
    console.error("VOICE.ASK_PATTERN is not a valid regular expression", e);
    return false;
  }
}
// The last voice-note failure, shown on /setup (she falls back to text when it happens)
export async function voiceFailed(env, error) {
  console.error("voice note failed:", error);
  if (!env.REEM_KV) return;
  await env.REEM_KV.put("voice_error", JSON.stringify({ at: Date.now(), error: String(error || "unknown error").slice(0, 300) }))
    .catch((e) => console.error("couldn't save the voice error", e));
}
// Together in person or apart? His message decides if it has *actions*; otherwise her last
// message does, unless it's been so long that the scene is surely over. OOC talk never counts.
export function sceneOf(history, heard) {
  if (!isOoc(heard) && ACTION.test(heard)) return "together";
  const last = [...history].reverse().find((m) => m.role === "assistant" && !m.ooc);
  if (!last || !inPerson(last.content)) return "apart";
  const stale = last.at && Date.now() - last.at > CONFIG.TEXTING.SCENE_TIMEOUT_MIN * 60000;
  return stale ? "apart" : "together";
}
// When her last message was saved (messages from before v8 have no time)
export function lastTime(history) {
  const last = [...history].reverse().find((m) => m.role === "assistant");
  return (last && last.at) || 0;
}
export function lineDropped() {
  const list = CONFIG.MESSAGES.LINE_DROPPED || [];
  const pair = Array.isArray(list[0]) ? list[Math.floor(Math.random() * list.length)] : list;
  return pair.map((l) => fill(l));
}
export async function openStory(env, chatId) {
  const kv = env.REEM_KV;
  // Sent as ONE message: the scene must not be split into separate texts
  const intro = CONFIG.PERSONA.INTRO_MESSAGE;
  if (kv) {
    await Promise.all([
      kv.put(`h:${chatId}`, JSON.stringify([makeEntry("assistant", [{ id: null, text: intro }])])),
      kv.delete(`m:${chatId}`),
      kv.delete(`b:${chatId}`),
      kv.delete(`a:${chatId}`),
      kv.put(`rs:${chatId}`, String(Date.now())), // recall leaves out what was saved before this (RECALL)
    ]);
  }
  await sleep(CONFIG.TIMING.INTRO_DELAY_MS);
  const parts = await sendBubbles(env, chatId, [intro], { deadline: Date.now() + CONFIG.TIMING.INTRO_BUDGET_MS });
  // Saved again with the message id, so /rewind can go back to the very start
  if (kv && parts[0] && parts[0].id != null) await kv.put(`h:${chatId}`, JSON.stringify([makeEntry("assistant", parts)]));
}
// userEntry is null when she texted first; `at` times drive momentum, scenes and texting first
export async function saveTurn(env, chatId, history, notes, userEntry, herEntry) {
  const kv = env.REEM_KV;
  if (!kv) return;
  if (userEntry) history.push(userEntry);
  history.push(herEntry);
  if (history.length <= CONFIG.MEMORY.HISTORY_MAX) {
    await kv.put(`h:${chatId}`, JSON.stringify(history));
    return;
  }
  const cut = history.length - CONFIG.MEMORY.HISTORY_KEEP;
  await kv.put(`h:${chatId}`, JSON.stringify(history.slice(cut)));
  await recallSave(env, chatId, history.slice(0, cut)).catch((e) => console.error("recall: couldn't save", aiText_(e)));
  // The fold into notes (a model call that can take a minute or two) no longer holds the reply queue: the folded messages wait in the
  // backlog (`b:`) and the 15-minute cron folds them (foldWaiting). Rebuild Step 0, 2026-10-15.
  await queueFold(env, chatId, history.slice(0, cut));
}
/* ------------------------------------------------------------------ */
/*  Human timing                                                       */
/* ------------------------------------------------------------------ */

export const between = (a, b) => a + Math.random() * (b - a);
export const jitter = () => between(CONFIG.TIMING.TYPING_JITTER_MIN, CONFIG.TIMING.TYPING_JITTER_MAX);
// Time before she picks up her phone. Mid-conversation (he answered soon after her last message)
// she's quick; otherwise it depends on her day (SCHEDULE delay), and sometimes she's just busy.
export function noticeTime(lastAt, started) {
  const T = CONFIG.TIMING;
  if (lastAt && started - lastAt < T.ACTIVE_WINDOW_MS) return between(T.ACTIVE_NOTICE_MIN_MS, T.ACTIVE_NOTICE_MAX_MS);
  const busy = Math.random() < T.LONG_PAUSE_CHANCE;
  const ms = busy ? between(T.LONG_PAUSE_MIN_MS, T.LONG_PAUSE_MAX_MS) : between(T.NOTICE_MIN_MS, T.NOTICE_MAX_MS);
  const slot = scheduleNow();
  return ms * ((slot && slot.delay) || 1);
}
// TIMING.TYPING_CHARS_PER_MIN, within TYPING_MIN_MS..TYPING_MAX_MS (SCENE_TYPING_MAX_MS for scenes)
export function typingTime(text) {
  const T = CONFIG.TIMING;
  const chars = plain(text).length;
  const ms = (chars / T.TYPING_CHARS_PER_MIN) * 60000 * jitter();
  const max = inPerson(text) ? T.SCENE_TYPING_MAX_MS : T.TYPING_MAX_MS;
  return Math.min(Math.max(ms, T.TYPING_MIN_MS), max);
}
export function speakingTime(spoken) {
  const T = CONFIG.TIMING;
  const words = spoken.replace(/<[^>]*>|\[[^\]]*\]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.min((words / T.SPEAK_WORDS_PER_SEC) * 1000 + T.RECORDING_EXTRA_MS, T.RECORDING_MAX_MS);
}
