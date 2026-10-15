// Long memory: older messages as vectors (Vectorize).
import { CONFIG, fill } from "../config/index.js";
import { aiRun, aiText_ } from "../platform/ai.js";
import { budget, withTimeout } from "../platform/http.js";

// Long memory (RECALL): vectors of the messages that fold out of the chat log, in Vectorize (env.MEMORY_INDEX)
export const recallOn = (env) => !!(CONFIG.RECALL.ENABLED && env.AI && env.MEMORY_INDEX);
export const recallText = (m) => String(m.content || "").replace(/\s+/g, " ").trim().slice(0, CONFIG.RECALL.MAX_CHARS);
export async function embed(env, texts) {
  const out = await aiRun(env, CONFIG.RECALL.MODEL, { text: texts }, CONFIG.RECALL.TIMEOUT_MS);
  return (out && out.data) || [];
}
export async function recallSave(env, chatId, entries) {
  if (!recallOn(env) || budget.left() < CONFIG.LIMITS.SUBREQUEST_RESERVE) return;
  const items = entries.filter((m) => !m.ooc && recallText(m).length >= 12);
  if (!items.length) return;
  const vecs = await embed(env, items.map(recallText));
  const rows = items.map((m, i) => ({ id: `${chatId}:${m.at || 0}:${m.role === "user" ? "u" : "a"}${i}`, values: vecs[i],
    metadata: { chat: String(chatId), who: m.role === "user" ? "him" : "her", at: m.at || 0, text: recallText(m) } })).filter((r) => r.values);
  budget.used++;
  if (rows.length) await env.MEMORY_INDEX.upsert(rows);
}
// "- 3 weeks ago, he said: ..." lines for her prompt, or "" (never slows her down past RECALL.TIMEOUT_MS)
export async function recallFind(env, chatId, query) {
  const R = CONFIG.RECALL;
  if (!recallOn(env) || !String(query || "").trim() || budget.left() < CONFIG.LIMITS.SUBREQUEST_RESERVE + 4) return "";
  try {
    return await withTimeout((async () => {
      const [vec] = await embed(env, [String(query).slice(0, R.MAX_CHARS)]);
      if (!vec) return "";
      budget.used++;
      const [res, since] = await Promise.all([
        env.MEMORY_INDEX.query(vec, { topK: R.TOP_K, filter: { chat: String(chatId) }, returnMetadata: "all" }),
        env.REEM_KV ? env.REEM_KV.get(`rs:${chatId}`) : null,
      ]);
      const lines = ((res && res.matches) || [])
        .filter((m) => m.score >= R.MIN_SCORE && m.metadata && m.metadata.text && (m.metadata.at || 0) >= Number(since || 0))
        .slice(0, R.KEEP)
        .sort((a, b) => (a.metadata.at || 0) - (b.metadata.at || 0))
        .map((m) => `- ${longAgo(m.metadata.at)}, ${m.metadata.who === "him" ? "he said" : "you said"}: "${m.metadata.text}"`);
      return lines.length ? fill(R.NUDGE, { moments: lines.join("\n") }) : "";
    })(), R.TIMEOUT_MS + 1000, "recall");
  } catch (e) {
    console.error("recall failed:", aiText_(e));
    return "";
  }
}
export function longAgo(at) {
  const days = Math.floor((Date.now() - (at || 0)) / 86400000);
  if (!at || days < 1) return "earlier today";
  if (days < 2) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}
