// Her notes: the memory fold (on the cron), repeats.
import { embed, recallText } from "./recall.js";
import { CONFIG, fill } from "../config/index.js";
import { aiText_, callModel } from "../platform/ai.js";
import { budget, withTimeout } from "../platform/http.js";
import { logEvent, startTrace, traceRow } from "../platform/log.js";

// Her reply means the same as one of her recent ones (RECALL.REPEAT_SCORE, bge-m3 vectors compared here)
export async function saidBefore(env, reply, history) {
  const R = CONFIG.RECALL;
  const text = String(reply || "").replace(/\s+/g, " ").trim();
  if (!R.REPEAT_SCORE || !env.AI || text.length < R.REPEAT_MIN_CHARS || budget.left() < CONFIG.LIMITS.SUBREQUEST_RESERVE + 3) return false;
  const hers = history.filter((m) => m.role === "assistant" && !m.ooc).slice(-R.REPEAT_LOOKBACK).map(recallText).filter((t) => t.length >= R.REPEAT_MIN_CHARS);
  if (!hers.length) return false;
  try {
    const [v, ...old] = await withTimeout(embed(env, [text.slice(0, R.MAX_CHARS), ...hers]), R.TIMEOUT_MS, "repeat check");
    const cos = (a, b) => { let d = 0, x = 0, y = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; x += a[i] * a[i]; y += b[i] * b[i]; } return d / (Math.sqrt(x * y) || 1); };
    const best = Math.max(...old.map((o) => (v && o ? cos(v, o) : 0)));
    if (best >= R.REPEAT_SCORE) console.log(`repeat check: ${best.toFixed(3)} like an earlier reply, asked again`);
    return best >= R.REPEAT_SCORE;
  } catch (e) {
    console.error("repeat check failed:", aiText_(e));
    return false;
  }
}
// Folded-out messages wait in the chat's backlog until the cron has folded them into the notes
export async function queueFold(env, chatId, overflow) {
  const kv = env.REEM_KV;
  const backlog = (await kv.get(`b:${chatId}`, "json")) || [];
  await kv.put(`b:${chatId}`, JSON.stringify([...backlog, ...overflow].slice(-CONFIG.MEMORY.BACKLOG_MAX)));
}
// The cron's job: every chat whose backlog is waiting gets it folded into its notes. A failure leaves the backlog for the next run.
export async function foldWaiting(env) {
  const kv = env.REEM_KV;
  if (!kv || !kv.list) return;
  const { keys } = await kv.list({ prefix: "b:" });
  for (const { name } of keys || []) {
    const chatId = name.slice(2);
    const t = startTrace();
    t.chat = chatId;
    try {
      const notes = (await kv.get(`m:${chatId}`)) || "";
      await remember(env, chatId, notes, []);
      await logEvent(env, traceRow("fold", "ok"));
    } catch (e) {
      await logEvent(env, traceRow("fold", "error", (e && e.message) || e));
    }
  }
}
export async function remember(env, chatId, oldNotes, overflow) {
  const kv = env.REEM_KV;
  const M = CONFIG.MEMORY;
  const C = CONFIG.CHARACTER;
  const backlog = (await kv.get(`b:${chatId}`, "json")) || [];
  const pending = [...backlog, ...overflow].slice(-M.BACKLOG_MAX);
  try {
    if (!pending.length) return;
    if (budget.left() < 2) throw new Error("out of calls this run; folding memory next time");
    const transcript = pending
      .map((m) => `${m.role === "user" ? C.USER_LABEL : C.NAME}: ${m.content}`)
      .join("\n")
      .slice(-M.TRANSCRIPT_MAX_CHARS);
    const messages = [
      { role: "system", content: fill(M.PROMPT) },
      { role: "user", content: `OLD NOTES:\n${oldNotes || "(none yet)"}\n\nNEW CONVERSATION:\n${transcript}` },
    ];
    const notes = await callModel(env, messages, M.SAMPLING, { model: M.MODEL, timeoutMs: M.TIMEOUT_MS, attempts: M.ATTEMPTS, backup: CONFIG.LLM.BACKUP_MODEL, task: true });
    const lines = notes.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("-"));
    if (!lines.length) throw new Error("memory notes came back off-format");
    // /restart during the fold wiped the backlog and the notes: don't bring them back
    const now = await kv.get(`b:${chatId}`, "json");
    if (backlog.length && !now) return;
    await kv.put(`m:${chatId}`, lines.join("\n").slice(0, M.MAX_CHARS));
    // what folded is removed; messages queued while the model worked stay for the next fold
    const rest = (now || []).slice(backlog.length);
    if (rest.length) await kv.put(`b:${chatId}`, JSON.stringify(rest));
    else await kv.delete(`b:${chatId}`);
  } catch (e) {
    if (overflow.length) await kv.put(`b:${chatId}`, JSON.stringify(pending)); // a cron fold leaves the backlog as it is
    throw e;
  }
}
