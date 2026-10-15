// KV state: the chat state, history, the owner lock, seen updates, the money ledgers.
import { cache, CONFIG } from "../config/index.js";

/* ------------------------------------------------------------------ */
/*  Conversation                                                       */
/* ------------------------------------------------------------------ */

export async function isOwner(env, userId) {
  if (env.OWNER_ID) return String(userId) === String(env.OWNER_ID).trim();
  const kv = env.REEM_KV;
  if (!kv) return false;
  if (!cache.owner) {
    cache.owner = await kv.get("owner");
    if (!cache.owner) {
      cache.owner = String(userId);
      await kv.put("owner", cache.owner);
    }
  }
  return String(userId) === cache.owner;
}
export async function loadState(kv, chatId) {
  if (!kv) return { settings: {}, history: [], notes: "" };
  const [settings, history, notes] = await Promise.all([
    kv.get(`s:${chatId}`, "json"),
    kv.get(`h:${chatId}`, "json"),
    kv.get(`m:${chatId}`),
  ]);
  return { settings: settings || {}, history: history || [], notes: notes || "" };
}
// Telegram (webhook retries) and Cloudflare Queues (at-least-once delivery) can both hand over
// the same update twice. Each update_id is handled only once, so she never answers it twice.
export async function onlyNew(env, updates) {
  const kv = env.REEM_KV;
  if (kv) {
    const stored = await kv.get("seen", "json").catch(() => null);
    if (Array.isArray(stored)) {
      for (const id of stored) if (!cache.seen.includes(id)) cache.seen.push(id);
    }
  }
  const fresh = [];
  for (const u of updates) {
    const id = u && u.update_id;
    if (typeof id === "number") {
      if (cache.seen.includes(id)) {
        console.log("skipped a second delivery of update", id);
        continue;
      }
      cache.seen.push(id);
    }
    fresh.push(u);
  }
  cache.seen = cache.seen.slice(-CONFIG.LIMITS.SEEN_KEEP);
  if (kv && fresh.length) {
    await kv.put("seen", JSON.stringify(cache.seen)).catch((e) => console.error("couldn't save seen updates", e));
  }
  return fresh;
}
export async function saveHistory(env, chatId, history) {
  await env.REEM_KV.put(`h:${chatId}`, JSON.stringify(history));
}
/* --- the day's Workers AI spending, recent pictures (KV "pics": one write per picture or seen photo) --- */

export const utcDay = () => new Date().toISOString().slice(0, 10);
export async function loadLedger(env) {
  const saved = (env.REEM_KV && (await env.REEM_KV.get("pics", "json").catch(() => null))) || {};
  const day = utcDay();
  const fresh = saved.day === day;
  return {
    day,
    neurons: fresh ? saved.neurons || 0 : 0,
    usd: fresh ? saved.usd || 0 : 0, // OpenRouter pictures today (PICTURE.LINGERIE)
    rwUsd: fresh ? saved.rwUsd || 0 : 0, // Runware pictures today (PICTURE.RUNWARE.DAILY_USD)
    rwFailed: fresh ? saved.rwFailed || 0 : 0, // failed Runware attempts today (/spend)
    studioUsd: fresh ? saved.studioUsd || 0 : 0, // the studio's Runware money today (STUDIO.DAILY_USD, separate from rwUsd)
    voiceUsd: fresh ? saved.voiceUsd || 0 : 0, // OpenRouter voice notes today (VOICE.OR_DAILY_USD)
    out: fresh && saved.out ? saved.out : false, // the time Cloudflare said out of neurons (true = old format)
    hashes: Array.isArray(saved.hashes) ? saved.hashes : [],
    recent: Array.isArray(saved.recent) ? saved.recent : [],
    shots: Array.isArray(saved.shots) ? saved.shots : [], // { shot, angle, tier } of her recent selfies
  };
}
export async function saveLedger(env, ledger) {
  if (!env.REEM_KV) return;
  ledger.hashes = ledger.hashes.slice(-300);
  ledger.recent = ledger.recent.slice(-20);
  ledger.shots = ledger.shots.slice(-20);
  await env.REEM_KV.put("pics", JSON.stringify(ledger)).catch((e) => console.error("couldn't save the picture ledger", e));
}
