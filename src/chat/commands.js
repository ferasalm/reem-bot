// Story commands: /name, /about, /retry, /rewind, /edit, edited messages, buttons.
import { autoCommand, autoDraft, draftButtons, draftHtml } from "./auto.js";
import { commandFor, commandList, failed, getSettings, notice } from "./batch.js";
import { proactiveHeard } from "./proactive.js";
import { openStory, reply, respond } from "./respond.js";
import { VOICE_TAG } from "./shape.js";
import { CONFIG, fill } from "../config/index.js";
import {
  albumCommand, faceCommand, lookCommand, nsfwButton, nsfwCommand, picCommand, picsCommand, spendCommand,
} from "../pictures/commands.js";
import { loadState, saveHistory } from "../platform/kv.js";
import { plain, tg, toHtml } from "../platform/telegram.js";
import { studioCommand } from "../studio/routes.js";
import { photoLine } from "../vision.js";

// A command that throws: one in-character line and an `events` row, never silence (Rebuild Step 0, 2026-10-15)
export async function runCommand(env, chatId, action, opts = {}) {
  try {
    await runCommandNow(env, chatId, action, opts);
  } catch (e) {
    await failed(env, chatId, e, opts.deadline, `command:${action || "?"}`);
  }
}
export async function runCommandNow(env, chatId, action, { args = "", msg = {}, ctx, deadline = Date.now() + CONFIG.TIMING.FALLBACK_BUDGET_MS } = {}) {
  const kv = env.REEM_KV;
  const M = CONFIG.MESSAGES;
  if (action === "restart") return openStory(env, chatId);
  if (action === "help") {
    return notice(env, chatId, M.HELP, {
      commands: commandList(),
      edit: commandFor("edit"),
      rewind: commandFor("rewind"),
      retry: commandFor("retry"),
      auto: commandFor("auto"),
    });
  }
  if (action === "memory") {
    const notes = kv && (await kv.get(`m:${chatId}`));
    return notice(env, chatId, notes ? M.MEMORY_SHOW : M.MEMORY_EMPTY, { notes });
  }
  if (!action) return;
  if (!kv) return notice(env, chatId, M.NEEDS_MEMORY);
  if (action === "voice") {
    const s = await getSettings(kv, chatId);
    s.moreVoice = !s.moreVoice;
    await kv.put(`s:${chatId}`, JSON.stringify(s));
    return notice(env, chatId, s.moreVoice ? M.VOICE_ON : M.VOICE_OFF);
  }
  if (action === "name") return nameCommand(env, chatId, args, msg);
  if (action === "about") return aboutCommand(env, chatId, args);
  if (action === "pics") return picsCommand(env, chatId);
  if (action === "nsfw") return nsfwCommand(env, chatId, args);
  if (action === "studio") return studioCommand(env, chatId, args);
  if (action === "face") return faceCommand(env, chatId, args, msg);
  if (action === "album") return albumCommand(env, chatId, args);
  if (action === "spend") return spendCommand(env, chatId);

  // Story commands: the command message itself is removed once it's done
  if (CONFIG.TELEGRAM.CLEAN_COMMANDS && msg.message_id) await deleteIds(env, chatId, [msg.message_id]);
  try {
    if (action === "auto") return await autoCommand(env, chatId, args);
    if (action === "retry") return await retry(env, ctx, chatId, deadline);
    if (action === "rewind") return await rewind(env, ctx, chatId, msg, deadline);
    if (action === "edit") return await editHers(env, chatId, msg, args);
    if (action === "look") return await lookCommand(env, chatId, args);
    if (action === "pic") return await picCommand(env, chatId, args);
  } catch (e) {
    await failed(env, chatId, e, deadline);
  }
}
/* ------------------------------------------------------------------ */
/*  Who he is: /name and /about                                        */
/* ------------------------------------------------------------------ */

// /name > his Telegram first name > CHARACTER.USER_NAME
export function hisName(settings = {}) {
  const C = CONFIG.CHARACTER;
  return settings.name || (C.USE_TELEGRAM_NAME && settings.tgName) || C.USER_NAME || "";
}
// What she's told about him with every reply: his name, then /about (or CHARACTER.USER_DETAILS)
export function aboutHim(settings = {}) {
  const user = hisName(settings);
  return [user && fill(CONFIG.NUDGES.HIS_NAME, { user }), settings.about || CONFIG.CHARACTER.USER_DETAILS]
    .filter(Boolean)
    .join("\n");
}
// His Telegram first name is kept once (and when it changes), so texting first knows it too
export async function noteTelegramName(env, chatId, settings, from) {
  const first = from && String(from.first_name || "").trim();
  if (!env.REEM_KV || !first || settings.tgName === first) return;
  settings.tgName = first;
  await env.REEM_KV.put(`s:${chatId}`, JSON.stringify(settings)).catch((e) => console.error("couldn't save his name", e));
}
export async function nameCommand(env, chatId, args, msg) {
  const kv = env.REEM_KV;
  const M = CONFIG.MESSAGES;
  const cmd = commandFor("name");
  const s = await getSettings(kv, chatId);
  const first = msg.from && String(msg.from.first_name || "").trim();
  if (first && first !== s.tgName) {
    s.tgName = first;
    if (!args) await kv.put(`s:${chatId}`, JSON.stringify(s));
  }
  if (!args) {
    const user = hisName(s);
    return notice(env, chatId, user ? M.NAME_SHOW : M.NAME_UNKNOWN, { user, cmd });
  }
  if (args.toLowerCase() === "reset") delete s.name;
  else s.name = args.replace(/\s+/g, " ").slice(0, CONFIG.CHARACTER.NAME_MAX_CHARS).trim();
  await kv.put(`s:${chatId}`, JSON.stringify(s));
  const user = hisName(s);
  return notice(env, chatId, user ? M.NAME_SET : M.NAME_UNKNOWN, { user, cmd });
}
export async function aboutCommand(env, chatId, args) {
  const kv = env.REEM_KV;
  const M = CONFIG.MESSAGES;
  const cmd = commandFor("about");
  const s = await getSettings(kv, chatId);
  if (!args) return notice(env, chatId, s.about ? M.ABOUT_SHOW : M.ABOUT_EMPTY, { about: s.about || "", cmd });
  if (args.toLowerCase() === "clear") delete s.about;
  else s.about = args.slice(0, CONFIG.CHARACTER.ABOUT_MAX_CHARS).trim();
  await kv.put(`s:${chatId}`, JSON.stringify(s));
  return notice(env, chatId, s.about ? M.ABOUT_SET : M.ABOUT_CLEARED);
}
/* ------------------------------------------------------------------ */
/*  Changing the story: /retry, /rewind, /edit, his own edits          */
/* ------------------------------------------------------------------ */

// History entries: { role, content, at, parts: [{ id, text }] }. `parts` are the Telegram messages
// (his batched messages, her bubbles); `content` is what the model reads. Entries saved before v10
// have no parts: they still count, they just can't be found by message.
export function joinParts(role, parts) {
  return parts.filter((p) => p.text).map((p) => p.text).join(role === "user" ? "\n" : "\n\n");
}
export function makeEntry(role, parts, extra = {}, content = joinParts(role, parts)) {
  return { role, content, at: Date.now(), parts, ...extra };
}
// Where a Telegram message lives in the history: entry i, part j
export function findPart(history, id) {
  for (let i = history.length - 1; i >= 0; i--) {
    const j = (history[i].parts || []).findIndex((p) => p.id === id);
    if (j >= 0) return { i, j };
  }
  return null;
}
// A message that isn't found is either older than the chat log (folded into notes) or unknown
export function missingNotice(history, id) {
  const ids = history.flatMap((e) => (e.parts || []).map((p) => p.id)).filter((x) => typeof x === "number");
  return ids.length && id < Math.min(...ids) ? CONFIG.MESSAGES.TOO_OLD : CONFIG.MESSAGES.NOT_FOUND;
}
// Keeps everything up to and including part j of entry i. Returns the shorter history, the Telegram
// ids of everything after it, and the entries that were dropped.
export function cutAfter(history, i, j) {
  const entry = history[i];
  const parts = entry.parts || [];
  const kept = history.slice(0, i + 1);
  const later = [...parts.slice(j + 1), ...history.slice(i + 1).flatMap((e) => e.parts || [])];
  if (j + 1 < parts.length) {
    const left = parts.slice(0, j + 1);
    kept[i] = { ...entry, parts: left, content: joinParts(entry.role, left) };
  }
  return {
    history: kept,
    drop: later.map((p) => p.id).filter((id) => typeof id === "number"),
    dropped: history.slice(i + 1),
  };
}
// Removes messages from the chat (Telegram: up to 100 per call, only within 48 hours)
export async function deleteIds(env, chatId, ids) {
  let ok = true;
  for (let k = 0; k < ids.length; k += 100) {
    const r = await tg(env, "deleteMessages", { chat_id: chatId, message_ids: ids.slice(k, k + 100) });
    if (!r.ok) {
      console.error("deleteMessages failed", r.description);
      ok = false;
    }
  }
  return ok;
}
// Her emoji on his message goes when her reply goes
export async function clearReactions(env, chatId, entries) {
  for (const e of entries) {
    if (e.role === "assistant" && e.react && e.reactTo) {
      await tg(env, "setMessageReaction", { chat_id: chatId, message_id: e.reactTo, reaction: [] });
    }
  }
}
// His last turn (the end of the history) gets a fresh answer, right away
export async function answerAgain(env, ctx, chatId, state, deadline) {
  const last = state.history[state.history.length - 1];
  if (!last || last.role !== "user") return;
  state.history.pop();
  const parts = last.parts && last.parts.length ? last.parts : [{ id: null, text: last.content }];
  const ids = parts.map((p) => p.id).filter((id) => typeof id === "number");
  await respond(env, ctx, chatId, state, { heard: last.content, userParts: parts, waitUntil: Date.now(), reactTo: ids[ids.length - 1] }, deadline);
}
// /retry: her last reply is deleted and written again
export async function retry(env, ctx, chatId, deadline) {
  const state = await loadState(env.REEM_KV, chatId);
  const h = state.history;
  const last = h[h.length - 1];
  const M = CONFIG.MESSAGES;
  if (!last || (last.role === "assistant" && h.length === 1 && !last.proactive)) return notice(env, chatId, M.NOTHING_TO_RETRY);
  if (last.role === "assistant") {
    h.pop();
    await deleteIds(env, chatId, (last.parts || []).map((p) => p.id).filter((id) => typeof id === "number"));
    await clearReactions(env, chatId, [last]);
    await saveHistory(env, chatId, h);
    if (last.proactive) {
      return respond(env, ctx, chatId, state, { heard: proactiveHeard(h, last.at), proactive: true, waitUntil: Date.now() }, deadline);
    }
  }
  if (h[h.length - 1]?.role !== "user") return notice(env, chatId, M.NOTHING_TO_RETRY);
  await answerAgain(env, ctx, chatId, state, deadline);
}
// /rewind (as a reply to a message): that message stays, everything after it goes, from the chat and
// from her memory. Rewound to his message, she answers it again; to hers, it's his turn.
export async function rewind(env, ctx, chatId, msg, deadline) {
  const M = CONFIG.MESSAGES;
  const target = msg.reply_to_message && msg.reply_to_message.message_id;
  if (!target) return notice(env, chatId, M.NEEDS_REPLY, { cmd: commandFor("rewind") });
  const state = await loadState(env.REEM_KV, chatId);
  const at = findPart(state.history, target);
  if (!at) return notice(env, chatId, missingNotice(state.history, target));
  const { history, drop, dropped } = cutAfter(state.history, at.i, at.j);
  const deleted = await deleteIds(env, chatId, drop);
  await clearReactions(env, chatId, dropped);
  state.history = history;
  await saveHistory(env, chatId, history);
  if (!deleted) await notice(env, chatId, M.DELETE_FAILED);
  if (history[history.length - 1].role === "user") return answerAgain(env, ctx, chatId, state, deadline);
  if (M.REWOUND) await notice(env, chatId, M.REWOUND);
}
// /edit new text (as a reply to one of her messages)
export async function editHers(env, chatId, msg, args) {
  const M = CONFIG.MESSAGES;
  const cmd = commandFor("edit");
  const target = msg.reply_to_message;
  if (!target) return notice(env, chatId, M.NEEDS_REPLY, { cmd });
  if (target.from && msg.from && target.from.id === msg.from.id) return notice(env, chatId, M.EDIT_HIS);
  if (!args) return notice(env, chatId, M.EDIT_USAGE, { cmd });
  const state = await loadState(env.REEM_KV, chatId);
  const at = findPart(state.history, target.message_id);
  if (!at) return notice(env, chatId, missingNotice(state.history, target.message_id));
  const entry = state.history[at.i];
  if (entry.role === "user") return notice(env, chatId, M.EDIT_HIS);
  const part = entry.parts[at.j];
  if (target.voice || VOICE_TAG.test(part.text)) return notice(env, chatId, M.EDIT_VOICE, { retry: commandFor("retry"), rewind: commandFor("rewind") });
  const max = CONFIG.TELEGRAM.MAX_MESSAGE_CHARS;
  let r = await tg(env, "editMessageText", { chat_id: chatId, message_id: part.id, text: toHtml(args).slice(0, max), parse_mode: "HTML" });
  if (!r.ok && r.error_code) r = await tg(env, "editMessageText", { chat_id: chatId, message_id: part.id, text: plain(args).slice(0, max) });
  if (!r.ok) console.error("editMessageText failed", r.description);
  entry.parts[at.j] = { ...part, text: args };
  entry.content = joinParts(entry.role, entry.parts);
  await saveHistory(env, chatId, state.history);
}
// He edited one of his messages in Telegram. If she has only answered it so far, her answer is
// redone for the new version; an older message is just corrected in her memory.
export async function onEdited(env, ctx, m, deadline) {
  const kv = env.REEM_KV;
  const chatId = m.chat.id;
  if (!kv) return;
  let text = null;
  if (typeof m.text === "string") text = m.text.trim();
  else if (m.photo) text = (m.caption || "").trim() || " "; // the photo line is made below, from what she saw
  if (!text || text.startsWith("/")) return;
  const state = await loadState(kv, chatId);
  const h = state.history;
  const at = findPart(h, m.message_id);
  if (!at || h[at.i].role !== "user") return;
  const entry = h[at.i];
  // A new caption: what she saw in the photo stays, only the caption changes
  if (m.photo) text = photoLine(entry.parts[at.j].seen, m.caption);
  entry.parts[at.j] = { ...entry.parts[at.j], text };
  entry.content = joinParts("user", entry.parts);
  try {
    if (at.i === h.length - 2 && h[h.length - 1].role === "assistant") {
      const hers = h.pop();
      await deleteIds(env, chatId, (hers.parts || []).map((p) => p.id).filter((id) => typeof id === "number"));
      await clearReactions(env, chatId, [hers]);
      await saveHistory(env, chatId, h);
      return await answerAgain(env, ctx, chatId, state, deadline);
    }
    await saveHistory(env, chatId, h);
    if (at.i === h.length - 1) await answerAgain(env, ctx, chatId, state, deadline); // never answered
  } catch (e) {
    await failed(env, chatId, e, deadline);
  }
}
// The draft's buttons: Another (a new draft in the same message) or Send (she answers it)
export async function onButton(env, ctx, cq, deadline) {
  const kv = env.REEM_KV;
  const A = CONFIG.AUTO;
  const chatId = cq.message.chat.id;
  const id = cq.message.message_id;
  if (kv && /^nsfw:/.test(cq.data || "")) return nsfwButton(env, cq); // /nsfw's buttons (Step 2), before the auto: check
  if (!kv || !/^auto:/.test(cq.data || "")) return;
  const draft = await kv.get(`a:${chatId}`, "json");
  if (!draft || draft.id !== id) {
    await tg(env, "editMessageReplyMarkup", { chat_id: chatId, message_id: id, reply_markup: { inline_keyboard: [] } });
    return notice(env, chatId, A.EXPIRED);
  }
  try {
    if (cq.data === "auto:again") {
      const skipped = [...(draft.skipped || []), draft.text].filter(Boolean).slice(-4);
      const { text, move } = await autoDraft(env, await loadState(kv, chatId), draft.idea, { avoid: draft.moves || [], skipped });
      if (!text) return notice(env, chatId, A.FAILED);
      await tg(env, "editMessageText", { chat_id: chatId, message_id: id, text: draftHtml(text), parse_mode: "HTML", reply_markup: draftButtons() });
      await kv.put(`a:${chatId}`, JSON.stringify({ ...draft, text, moves: [...(draft.moves || []), move].slice(-4), skipped }));
      return;
    }
    if (cq.data === "auto:send") {
      await kv.delete(`a:${chatId}`);
      await tg(env, "editMessageText", { chat_id: chatId, message_id: id, text: fill(A.SENT, { text: draft.text }).slice(0, CONFIG.TELEGRAM.MAX_MESSAGE_CHARS) });
      const m = { message_id: id, chat: cq.message.chat, from: cq.from, date: Math.floor(Date.now() / 1000), text: draft.text, viaAuto: true };
      return reply(env, ctx, [m], deadline);
    }
  } catch (e) {
    await failed(env, chatId, e, deadline);
  }
}
