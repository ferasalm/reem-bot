/**
 * Reem (@reem_nabot): a Telegram roleplay companion on Cloudflare Workers (Workers Paid). This file is only the entry point:
 * fetch (/setup, /health, /studio, /webhook), queue (the replies, one run at a time) and scheduled (the 15-minute cron: the memory
 * fold, then maybe she texts first). Everything else is in src/ (docs/MAP.md names where each thing lives):
 *   src/config      CONFIG = the engine's settings + the persona's, then CONFIG_OVERRIDES (a dashboard variable, JSON)
 *   src/persona     who she is: prompts, words, looks, language (reem-en today; a second persona is another folder)
 *   src/platform    Telegram, KV, AI calls, outside-call counting, the D1 logs
 *   src/gate.js     can(who, feature): every rule about what a chat may get
 *   src/chat, src/voice, src/pictures, src/vision.js, src/studio, src/setup.js
 *   assets/         generated pictures and the MP3 encoder (never edit by hand)
 * Secrets: TELEGRAM_BOT_TOKEN, OPENROUTER_API_KEY, ELEVENLABS_API_KEY, RUNWARE_API_KEY; optional OWNER_ID, SETUP_KEY,
 * CONFIG_OVERRIDES. Bindings (wrangler.toml): REEM_KV, REEM_QUEUE, AI, MEMORY_INDEX, STUDIO_DB.
 * History (v4-v11 and every change since): docs/CHANGELOG.md.
 */
import { failed, handleBatch, isQuickCommand } from "./src/chat/batch.js";
import { foldWaiting } from "./src/chat/memory.js";
import { proactiveChat } from "./src/chat/proactive.js";
import { applyOverrides, CONFIG } from "./src/config/index.js";
import { budget } from "./src/platform/http.js";
import { tg, webhookSecret } from "./src/platform/telegram.js";
import { health, setup } from "./src/setup.js";
import { saveOrigin, setStudioHost, studioRoute } from "./src/studio/routes.js";

/* ------------------------------------------------------------------ */
/*  Entry points                                                       */
/* ------------------------------------------------------------------ */

export default {
  async fetch(request, env, ctx) {
    applyOverrides(env);
    const url = new URL(request.url);

    if (url.pathname === "/setup") {
      if (env.SETUP_KEY && url.searchParams.get("key") !== env.SETUP_KEY) {
        return new Response("not found", { status: 404 });
      }
      budget.reset();
      return setup(url, env);
    }

    // A read-only Workers AI check (draws one small picture, describes it), used after each deploy
    if (url.pathname === "/health") {
      budget.reset();
      const result = await health(env).catch((e) => ({ ok: false, error: String(e.message || e) }));
      return new Response(JSON.stringify(result, null, 1), { headers: { "content-type": "application/json" } });
    }

    // The prompt studio (/studio): its own cookie and signed links (studioRoute)
    if (url.pathname === "/studio" || url.pathname.startsWith("/studio/")) return studioRoute(request, env, url);

    if (url.pathname === "/webhook" && request.method === "POST") {
      if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== (await webhookSecret(env))) {
        return new Response("forbidden", { status: 403 });
      }
      // The address of this Worker: the studio's link host (studioCommand); KV "origin" is its fallback
      setStudioHost(url.origin);
      ctx.waitUntil(saveOrigin(env, url.origin));
      let update;
      try {
        update = await request.json();
      } catch {
        return new Response("ok");
      }
      // A tapped button stops spinning right away; what it does runs in the queue
      if (update.callback_query) ctx.waitUntil(tg(env, "answerCallbackQuery", { callback_query_id: update.callback_query.id }));
      // Commands that don't touch the story (/help, /name, /voice...) are answered right away instead of
      // waiting in the queue, possibly behind a reply she's still holding back (see QUICK_ACTIONS)
      if (isQuickCommand(update)) {
        ctx.waitUntil(handleBatch([update], env, ctx, Date.now() + CONFIG.TIMING.FALLBACK_BUDGET_MS).catch((e) => console.error(e)));
        return new Response("ok");
      }
      if (env.REEM_QUEUE) {
        // The queue hands it to queue() below, which may take up to 15 minutes to reply
        try {
          await env.REEM_QUEUE.send(update);
          return new Response("ok");
        } catch (e) {
          console.error("queue send failed, replying fast instead", e);
        }
      }
      ctx.waitUntil(handleBatch([update], env, ctx, Date.now() + CONFIG.TIMING.FALLBACK_BUDGET_MS).catch((e) => console.error(e)));
      return new Response("ok");
    }

    return new Response("nothing here", { status: 404 });
  },

  // Queue consumer: one run at a time (max concurrency 1), so replies never overlap
  async queue(batch, env, ctx) {
    applyOverrides(env);
    for (const m of batch.messages) m.ack(); // never redeliver: a retry would mean a duplicate reply
    budget.reset();
    const updates = batch.messages.map((m) => m.body);
    try {
      await handleBatch(updates, env, ctx, Date.now() + CONFIG.TIMING.QUEUE_BUDGET_MS);
    } catch (e) {
      // handleBatch guards each update itself; this is anything outside them (the seen list, the KV): say so in the chat
      const u = updates.find((x) => x && (x.message || x.edited_message || (x.callback_query && x.callback_query.message)));
      const chat = u && (u.message || u.edited_message || u.callback_query.message).chat;
      await failed(env, chat && chat.id, e, Date.now() + CONFIG.TIMING.FALLBACK_BUDGET_MS, "queue").catch((e2) => console.error(e2));
    }
  },

  // Cron (every 15 min, see wrangler.toml): first the memory fold of any chat whose backlog is waiting (a separate invocation, so it
  // never holds the reply queue), then maybe she texts first. The message itself is written in a queue run, which may take minutes.
  async scheduled(event, env, ctx) {
    applyOverrides(env);
    budget.reset();
    await foldWaiting(env).catch((e) => console.error("memory fold (cron) failed", e));
    budget.reset();
    try {
      const chatId = await proactiveChat(env);
      if (!chatId) return;
      const task = { proactive: true, chat_id: chatId, at: Date.now() };
      if (env.REEM_QUEUE) await env.REEM_QUEUE.send(task);
      else await handleBatch([task], env, ctx, Date.now() + CONFIG.TIMING.FALLBACK_BUDGET_MS);
    } catch (e) {
      console.error("texting first failed", e);
    }
  },
};
