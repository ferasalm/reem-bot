// /auto: drafts his next message (Send / Another).
import { notice } from "./batch.js";
import { aboutHim, hisName } from "./commands.js";
import { sceneOf } from "./respond.js";
import { CONFIG, fill } from "../config/index.js";
import { chatHeat, pickOne } from "../pictures/shots.js";
import { callModel } from "../platform/ai.js";
import { escapeHtml, escapeRegex } from "../platform/http.js";
import { loadState } from "../platform/kv.js";
import { tg } from "../platform/telegram.js";

/* ------------------------------------------------------------------ */
/*  /auto: she drafts his next message                                 */
/* ------------------------------------------------------------------ */

// Returns { text, move }. `avoid`: the moves of the drafts he skipped; `skipped`: those drafts' words.
export async function autoDraft(env, state, idea, { avoid = [], skipped = [] } = {}) {
  const A = CONFIG.AUTO;
  const C = CONFIG.CHARACTER;
  const user = hisName(state.settings) || C.USER_LABEL;
  const transcript = state.history
    .map((m) => `${m.role === "user" ? user : C.NAME}: ${m.content}`)
    .join("\n\n")
    .slice(-A.TRANSCRIPT_MAX_CHARS);
  let system = fill(A.PROMPT, { user });
  const about = aboutHim(state.settings);
  if (about) system += fill(A.ABOUT, { user, about });
  if (state.notes) system += fill(A.NOTES, { notes: state.notes });
  system += fill(sceneOf(state.history, "") === "together" ? A.TOGETHER : A.APART);
  if (idea) system += fill(A.IDEA, { idea });
  // a warm or hot chat (its words, not the hour) gets HOT_MOVES
  const hot = chatHeat(state.history, "", 12) >= 1 && (A.HOT_MOVES || []).some((m) => String(m).trim());
  const moves = ((hot ? A.HOT_MOVES : A.MOVES) || []).filter((m) => String(m).trim());
  const move = pickOne(moves.filter((m) => !avoid.includes(m))) || pickOne(moves);
  if (move && A.MOVE) system += fill(A.MOVE, { move });
  const messages = [
    { role: "system", content: system },
    { role: "user", content: fill(A.ASK, { transcript: transcript || fill(CONFIG.INBOX.CONVERSATION_START), user }) + (skipped.length && A.AGAIN ? fill(A.AGAIN, { drafts: skipped.map((d) => `- ${d}`).join("\n") }) : "") },
  ];
  const out = await callModel(env, messages, A.SAMPLING, { model: A.MODEL, timeoutMs: A.TIMEOUT_MS, trimCut: true, backup: CONFIG.LLM.BACKUP_MODEL, task: true });
  return { text: cleanDraft(out, user), move };
}
// Only his message: no "Sam:" prefix, no wrapping quotes, nothing after a line of hers
export function cleanDraft(t, user) {
  const C = CONFIG.CHARACTER;
  let s = String(t).trim();
  const hers = C.NAME_PREFIXES.map(escapeRegex).join("|");
  if (hers) {
    const stop = new RegExp(`^[ \\t]*(?:${hers})[ \\t]*:`, "im").exec(s);
    if (stop && stop.index > 0) s = s.slice(0, stop.index);
  }
  const his = [user, C.USER_LABEL, "you", "me", "him"].filter(Boolean).map(escapeRegex).join("|");
  s = s.replace(new RegExp(`^[ \\t]*(?:${his})[ \\t]*:[ \\t]*`, "gim"), "").trim();
  if (/^["“][^"“”]*["”]$/.test(s)) s = s.slice(1, -1).trim();
  return s.slice(0, CONFIG.TELEGRAM.MAX_MESSAGE_CHARS - 200);
}
// The draft as HTML: the template escaped, the draft itself tap-to-copy
export function draftHtml(text) {
  const [before, after = ""] = String(CONFIG.AUTO.DRAFT).split("{text}");
  return escapeHtml(fill(before)) + `<code>${escapeHtml(text)}</code>` + escapeHtml(fill(after));
}
export function draftButtons() {
  const A = CONFIG.AUTO;
  return { inline_keyboard: [[{ text: A.BUTTON_SEND, callback_data: "auto:send" }, { text: A.BUTTON_AGAIN, callback_data: "auto:again" }]] };
}
export async function autoCommand(env, chatId, idea) {
  const kv = env.REEM_KV;
  const { text, move } = await autoDraft(env, await loadState(kv, chatId), idea);
  if (!text) return notice(env, chatId, CONFIG.AUTO.FAILED);
  const sent = await tg(env, "sendMessage", { chat_id: chatId, text: draftHtml(text), parse_mode: "HTML", reply_markup: draftButtons() });
  if (sent.ok) await kv.put(`a:${chatId}`, JSON.stringify({ id: sent.result.message_id, text, idea, moves: [move], skipped: [] }));
}
