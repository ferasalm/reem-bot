// She texts first (cron).
import { herDay, herHour, inHours } from "./day.js";
import { between, respond } from "./respond.js";
import { CONFIG, fill } from "../config/index.js";
import { loadState } from "../platform/kv.js";

/* ------------------------------------------------------------------ */
/*  She texts first (CONFIG.PROACTIVE)                                 */
/* ------------------------------------------------------------------ */

// Asked by the cron check: the owner's chat, if she should text first right now
export async function proactiveChat(env) {
  const kv = env.REEM_KV;
  if (!CONFIG.PROACTIVE.ENABLED || !kv) return null;
  const chatId = env.OWNER_ID ? String(env.OWNER_ID).trim() : await kv.get("owner");
  if (!chatId) return null;
  if (!mayTextFirst(await loadState(kv, chatId))) return null;
  return Math.random() < CONFIG.PROACTIVE.CHANCE ? chatId : null;
}
export function mayTextFirst({ history, settings }) {
  const P = CONFIG.PROACTIVE;
  const last = history[history.length - 1];
  if (!P.ENABLED || !last || !last.at) return false;    // nothing to go on yet
  if (last.proactive) return false;                      // he hasn't answered her last one
  if (Date.now() - last.at < P.MIN_SILENCE_HOURS * 3600000) return false;
  if (inHours(herHour(), P.QUIET_FROM_HOUR, P.QUIET_TO_HOUR)) return false;
  const today = settings.proactive || {};
  return !(today.day === herDay() && today.count >= P.MAX_PER_DAY);
}
// What she's told when she texts first: how long it's been since the last message
export function proactiveHeard(history) {
  const last = history[history.length - 1];
  const hours = last && last.at ? Math.max(1, Math.round((Date.now() - last.at) / 3600000)) : 1;
  return fill(CONFIG.PROACTIVE.PROMPT, { hours: `${hours} hour${hours === 1 ? "" : "s"}` });
}
export async function textFirst(env, ctx, chatId, deadline) {
  const kv = env.REEM_KV;
  if (!kv) return;
  const state = await loadState(kv, chatId);
  if (!mayTextFirst(state)) return; // he may have texted since the check
  const heard = proactiveHeard(state.history);

  // Counted before sending, so a failure can't make her try again every 15 minutes
  const s = state.settings;
  const day = herDay();
  s.proactive = { day, count: (s.proactive && s.proactive.day === day ? s.proactive.count : 0) + 1 };
  await kv.put(`s:${chatId}`, JSON.stringify(s));

  try {
    await respond(env, ctx, chatId, state, { heard, proactive: true, waitUntil: Date.now() + between(0, 60000) }, deadline);
  } catch (e) {
    console.error("texting first failed", e); // no "wifi died" for a message he never asked for
  }
}
