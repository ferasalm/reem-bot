// One queue run: each Telegram update guarded, commands parsed, failures turned into her line (failed).
import { onButton, onEdited, runCommand } from "./commands.js";
import { textFirst } from "./proactive.js";
import { lineDropped, reply } from "./respond.js";
import { CONFIG, fill } from "../config/index.js";
import { isOwner, onlyNew } from "../platform/kv.js";
import { logEvent } from "../platform/log.js";
import { sendBubbles, sendText } from "../platform/telegram.js";

// Everything he sent since her last reply is answered in one go, like a person catching up.
// Commands, edits and button taps that change the story first let her answer what came before them.
export async function handleBatch(updates, env, ctx, deadline) {
  updates = await onlyNew(env, updates);
  let convo = [];
  let heardFromHim = false;
  let lastChat = null;
  const flush = async () => {
    if (!convo.length) return;
    const c = convo;
    convo = [];
    await reply(env, ctx, c, deadline);
  };
  for (const u of updates) {
    if (!u) continue;
    // one update that throws never takes the rest of the batch with it: she says the line was dropped and the next one is handled
    try {
      const cq = u.callback_query;
      if (cq) {
        const chat = cq.message && cq.message.chat;
        if (!chat || !CONFIG.TELEGRAM.CHAT_TYPES.includes(chat.type) || !(await isOwner(env, cq.from.id))) continue;
        heardFromHim = true;
        await flush();
        await onButton(env, ctx, cq, deadline);
        continue;
      }
      const m = u.message || u.edited_message;
      if (!m || !m.chat || !m.from || !CONFIG.TELEGRAM.CHAT_TYPES.includes(m.chat.type)) continue;
      if (!(await isOwner(env, m.from.id))) continue; // strangers get total silence
      heardFromHim = true;
      lastChat = m.chat.id;
      if (u.edited_message) {
        // Still waiting for her answer: just use the new version
        const waiting = convo.findIndex((x) => x.message_id === m.message_id);
        if (waiting >= 0) convo[waiting] = m;
        else {
          await flush();
          await onEdited(env, ctx, m, deadline);
        }
        continue;
      }
      const text = (m.text || (m.photo && m.caption) || "").trim();
      if (text.startsWith("/")) {
        const { action, args } = parseCommand(text);
        if (action === "restart") convo = []; // anything before a restart is forgotten
        else if (STORY_ACTIONS.has(action)) await flush();
        await runCommand(env, m.chat.id, action, { args, msg: m, ctx, deadline });
        continue;
      }
      convo.push(m);
    } catch (e) {
      const chat = (u.message || u.edited_message || (u.callback_query && u.callback_query.message) || {}).chat;
      await failed(env, chat && chat.id, e, deadline, "update");
    }
  }
  await flush().catch((e) => failed(env, lastChat, e, deadline, "update"));
  // Nothing from him in this run: she may text first, if a cron check asked for it
  const task = updates.find((u) => u && u.proactive);
  if (task && !heardFromHim) await textFirst(env, ctx, String(task.chat_id), deadline).catch((e) => failed(env, null, e, deadline, "proactive"));
}
// Commands that change the chat history (her answer to earlier messages comes first)
export const STORY_ACTIONS = new Set(["auto", "retry", "rewind", "edit", "look", "pic"]);
// Commands answered straight from the webhook, never queued: they only show or change his settings
export const QUICK_ACTIONS = new Set(["help", "name", "about", "voice", "memory", "pics", "nsfw", "face", "album", "spend", "studio"]);
export function isQuickCommand(update) {
  const m = update && update.message;
  const text = ((m && (m.text || (m.photo && m.caption))) || "").trim();
  return text.startsWith("/") && QUICK_ACTIONS.has(parseCommand(text).action);
}
// "/Name@reem_nabot Sam" -> { action: "name", args: "Sam" } (args keep their line breaks)
export function parseCommand(text) {
  const m = /^\/([A-Za-z0-9_]+)(?:@\S*)?(?:[ \t\n]+([\s\S]*))?$/.exec(String(text).trim());
  if (!m) return { action: undefined, args: "" };
  const name = m[1].toLowerCase();
  const c = CONFIG.COMMANDS.find((c) => c.command === name || (c.aliases || []).includes(name));
  return { action: c && c.action, args: (m[2] || "").trim() };
}
export function commandFor(action) {
  const c = CONFIG.COMMANDS.find((c) => c.action === action);
  return c ? `/${c.command}` : "";
}
// "/help - How Reem works, and every command", one per line
export function commandList() {
  return CONFIG.COMMANDS.map((c) => `/${c.command} - ${fill(c.description)}`).join("\n");
}
// Plain notices from the bot (not from her)
export function notice(env, chatId, template, vars) {
  return sendText(env, chatId, CONFIG.MESSAGES.NOTICE_PREFIX + fill(template, vars));
}
export async function getSettings(kv, chatId) {
  return (await kv.get(`s:${chatId}`, "json")) || {};
}
// When she can't answer: "wifi died" in character, whatever the error (a passing outage, a 401 or 402 from a provider, a throw in
// a command): never silence and never a "(setup)" notice in the chat (owner, Rebuild 2026-10-15). The real error goes in the `events` log.
export async function failed(env, chatId, e, deadline, kind = "error") {
  console.error(e);
  if (!(e && e.logged)) {
    await logEvent(env, { chat: chatId == null ? null : String(chatId), kind, outcome: e && e.retryable ? "dropped" : "error", error: (e && e.message) || String(e) });
  }
  if (chatId == null) return;
  try {
    await sendBubbles(env, chatId, lineDropped(), { deadline: Math.min(deadline || Infinity, Date.now() + CONFIG.TIMING.LINE_DROPPED_BUDGET_MS) });
  } catch (e2) {
    console.error("couldn't send the dropped line", e2);
  }
}
