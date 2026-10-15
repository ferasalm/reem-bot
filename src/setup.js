// /setup (the status page) and /health (draws and sees after a deploy).
import { FACE_JPEG_BASE64 } from "../assets/face.js";
import { commandFor } from "./chat/batch.js";
import { applyOverrides, CONFIG, fill } from "./config/index.js";
import { composePicture } from "./pictures/compose.js";
import { drawPicture, runwareRoute } from "./pictures/draw.js";
import { aiAffordable, aiRun, aiSpent, aiText, aiText_, askModel, openRouterBody } from "./platform/ai.js";
import { toBase64, xfetch } from "./platform/http.js";
import { loadLedger, saveLedger } from "./platform/kv.js";
import { tg, webhookSecret } from "./platform/telegram.js";
import { tidyDescription } from "./vision.js";
import { hearWithGemini } from "./voice/hearing.js";
import { audioBytes, auraText, checkVoice, orSpeech } from "./voice/tts.js";

/* --- /health: a read-only check of Workers AI, for the deploy workflow --- */

// Draws a small picture from her face and describes it. At most once per 10 minutes; no Telegram calls.
export async function health(env) {
  const result = { ok: false, ai: !!env.AI, face: FACE_JPEG_BASE64 ? "built in" : "none" };
  const kv = env.REEM_KV;
  if (kv && (await kv.get("face"))) result.face = "picked with /face";
  if (!env.AI) return result;
  const last = kv && Number(await kv.get("health_at"));
  if (last && Date.now() - last < 10 * 60000) return { ...result, skipped: "checked less than 10 minutes ago", last: kv && (await kv.get("health", "json")) };
  if (kv) await kv.put("health_at", String(Date.now()));
  const ledger = await loadLedger(env);
  result.neurons_today = ledger.neurons;
  if (!aiAffordable(ledger, "health")) return { ...result, skipped: "today's Workers AI budget is used up" };
  let error = null;
  try {
    const t0 = Date.now();
    const pic = composePicture({ tier: "everyday", shot: "selfie", words: "smiling at the camera in her living room" });
    const drawn = await drawPicture(env, pic.prompt, { size: 256, location: pic.location, log: { source: "health" } });
    result.draw = { ok: true, model: drawn.model, bytes: drawn.bytes.length, ms: Date.now() - t0 };
    const t1 = Date.now();
    const out = await aiRun(env, CONFIG.VISION.MODEL, {
      // The same prompt as his photos get (asking "who is this" gets a refusal, not a description)
      messages: [{ role: "user", content: [{ type: "text", text: fill(CONFIG.VISION.PROMPT) }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${toBase64(drawn.bytes)}` } }] }],
      max_tokens: CONFIG.VISION.MAX_TOKENS,
    }, CONFIG.VISION.TIMEOUT_MS);
    // ok only for a real description (tidyDescription turns a refusal into "")
    result.vision = { ok: !!tidyDescription(aiText(out)), model: CONFIG.VISION.MODEL, said: aiText(out).slice(0, 300), ms: Date.now() - t1 };
    result.ok = result.vision.ok;
  } catch (e) {
    error = e;
    result.error = aiText_(e).slice(0, 300);
  } finally {
    aiSpent(ledger, CONFIG.AI_BUDGET.HEALTH_NEURONS, error);
    await saveLedger(env, ledger);
    if (kv) await kv.put("health", JSON.stringify({ at: Date.now(), ...result })).catch(() => {});
  }
  return result;
}
/* ------------------------------------------------------------------ */
/*  /setup page                                                        */
/* ------------------------------------------------------------------ */

// "2 days ago" for a saved time
export function ago(at) {
  const min = Math.max(0, Math.round((Date.now() - (Number(at) || 0)) / 60000));
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`;
}
export async function setup(url, env) {
  const rows = [];
  const add = (ok, label, detail = "") => rows.push({ ok, label, detail });
  const name = CONFIG.CHARACTER.NAME;
  let botName = CONFIG.CHARACTER.BOT_USERNAME;

  // ok: true ✅, false ❌, null ℹ️ (a note, not a check)
  const elevenNeeded = !["aura", "openrouter"].includes(CONFIG.VOICE.PROVIDER);
  const missing = ["TELEGRAM_BOT_TOKEN", "OPENROUTER_API_KEY", ...(elevenNeeded ? ["ELEVENLABS_API_KEY"] : [])].filter((k) => !env[k]);
  if (missing.length) add(false, "Secrets", `Missing: ${missing.join(", ")}. Add them in Settings > Variables and Secrets, then reload this page.`);
  if (!elevenNeeded && !env.ELEVENLABS_API_KEY) add(null, "ElevenLabs (backup)", "ELEVENLABS_API_KEY isn't set: no backup voice and no last-resort hearing. She still talks and hears without it.");

  const overrides = applyOverrides(env);
  if (overrides.set) add(overrides.ok, "Settings (CONFIG_OVERRIDES)", overrides.detail);

  if (env.TELEGRAM_BOT_TOKEN) {
    const me = await tg(env, "getMe", {});
    if (!me.ok) {
      add(false, "Telegram", `Token rejected: ${me.description || "unknown error"}`);
    } else {
      botName = me.result.username;
      const hook = await tg(env, "setWebhook", {
        url: `${url.origin}/webhook`,
        secret_token: await webhookSecret(env),
        allowed_updates: CONFIG.TELEGRAM.ALLOWED_UPDATES,
        drop_pending_updates: CONFIG.TELEGRAM.DROP_PENDING_UPDATES,
      });
      const menu = await tg(env, "setMyCommands", {
        commands: CONFIG.COMMANDS.map((c) => ({ command: c.command, description: fill(c.description) })),
      });
      if (!menu.ok) add(false, "Telegram commands", `Telegram refused the command list: ${menu.description || "unknown error"}`);
      add(hook.ok, `Telegram: @${botName}`, hook.ok ? "Connected to this Worker." : hook.description);
    }
  }

  if (env.OPENROUTER_API_KEY) {
    // The same routing as her replies (LLM.PROVIDER, LLM.REASONING), then the backup model (LLM.BACKUP_*)
    const models = [[CONFIG.LLM.MODEL, ""], ...(CONFIG.LLM.BACKUP_MODEL && CONFIG.LLM.BACKUP_MODEL !== CONFIG.LLM.MODEL ? [[CONFIG.LLM.BACKUP_MODEL, " (backup)"]] : [])];
    for (const [model, label] of models) {
      if (/^@cf\//.test(model)) {
        try {
          await askModel(env, [{ role: "user", content: "Say hello in five words." }], { max_tokens: 40 }, { model, timeoutMs: 30000, attempts: 1, task: true });
          add(true, `Workers AI: ${model}${label}`, "Model answered.");
        } catch (e) {
          add(false, `Workers AI: ${model}${label}`, e.message);
        }
        continue;
      }
      try {
        const res = await xfetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify(openRouterBody(model, [{ role: "user", content: "Reply with: OK" }], { max_tokens: 5 })),
        });
        const data = await res.json().catch(() => ({}));
        add(res.ok, `OpenRouter: ${model}${label}`, res.ok ? `Model answered${data?.provider ? ` (via ${data.provider})` : ""}.` : data?.error?.message || `HTTP ${res.status}`);
      } catch (e) {
        add(false, `OpenRouter${label}`, e.message);
      }
    }
  }

  let clip = null;
  if (CONFIG.VOICE.PROVIDER === "openrouter" && env.OPENROUTER_API_KEY) {
    const V = CONFIG.VOICE;
    const label = `Her voice: ${V.OR_VOICE || V.OR_MODEL}`;
    try {
      clip = await orSpeech(env, auraText(fill(V.TEST_PHRASE), V.OR_CUES));
      add(true, label, `Test clip made (${V.OR_MODEL}, ${Math.round(clip.byteLength / 1024)} KB MP3).${env.AI ? ` Backup: ${V.AURA_SPEAKER} (Workers AI aura-2)${V.ELEVENLABS_BACKUP && env.ELEVENLABS_API_KEY ? ", then ElevenLabs" : ""}.` : V.ELEVENLABS_BACKUP && env.ELEVENLABS_API_KEY ? " ElevenLabs is the backup." : ""}`);
    } catch (e) {
      add(false, label, `${e.message}${V.ELEVENLABS_BACKUP && env.ELEVENLABS_API_KEY ? ". ElevenLabs speaks her notes until this works." : ". Her voice notes go as text until this works."}`);
    }
  }
  const H = CONFIG.HEARING;
  if (H.OR_MODEL && env.OPENROUTER_API_KEY) {
    const backups = [H.OR_FIRST && H.MODEL && "Whisper", H.BACKUP_MODEL && env.ELEVENLABS_API_KEY && "Scribe"].filter(Boolean).join(", then ");
    const after = (H.OR_FIRST ? "" : ` Whisper (Workers AI) hears first; this model is its backup${H.BACKUP_MODEL && env.ELEVENLABS_API_KEY ? ", then Scribe" : ""}.`) +
      (H.OR_FIRST && backups ? ` ${backups} ${backups.includes(",") ? "are" : "is"} the backup (not tested here).` : "");
    if (!clip) add(null, `Hearing: ${H.OR_MODEL}`, `Not tested: it listens to her test clip, and there was none.${after}`);
    else {
      try {
        const heard = await hearWithGemini(env, clip, "mp3");
        add(true, `Hearing: ${H.OR_MODEL}`, `It heard her test clip as: “${heard.slice(0, 120)}”.${after}`);
      } catch (e) {
        add(false, `Hearing: ${H.OR_MODEL}`, `${e.message}.${after}`);
      }
    }
  }

  if (CONFIG.VOICE.PROVIDER === "aura") {
    const V = CONFIG.VOICE;
    if (!env.AI) add(false, "Workers AI voice", "The AI binding is missing (wrangler.toml), so ElevenLabs speaks every note.");
    else {
      try {
        const out = await aiRun(env, V.AURA_MODEL, { text: fill(V.TEST_PHRASE), speaker: V.AURA_SPEAKER, encoding: "opus", container: "ogg" }, CONFIG.LIMITS.HTTP_TIMEOUT_MS, true, { returnRawResponse: true });
        await audioBytes(out, V.AURA_MODEL);
        add(true, `Workers AI voice: ${V.AURA_SPEAKER}`, `Test clip worked (${V.AURA_MODEL}).${V.ELEVENLABS_BACKUP ? " ElevenLabs is the backup." : ""}`);
      } catch (e) {
        add(false, `Workers AI voice: ${V.AURA_SPEAKER}`, aiText_(e));
      }
    }
  }

  if (env.ELEVENLABS_API_KEY && (CONFIG.VOICE.PROVIDER !== "aura" || CONFIG.VOICE.ELEVENLABS_BACKUP)) {
    const v = await checkVoice(env, elevenNeeded);
    const which = env.VOICE_ID ? ` (the VOICE_ID secret replaces CONFIG.VOICE.ID "${CONFIG.VOICE.ID}"; delete it to use ${CONFIG.VOICE.NAME})` : "";
    add(v.ok, `ElevenLabs${elevenNeeded ? "" : " (backup)"} voice: ${env.VOICE_ID ? env.VOICE_ID : CONFIG.VOICE.NAME}`, v.detail + which);
  }

  const lastVoiceError = env.REEM_KV && (await env.REEM_KV.get("voice_error", "json").catch(() => null));
  if (lastVoiceError) {
    const when = new Date(lastVoiceError.at).toLocaleString(CONFIG.CHARACTER.CLOCK_LOCALE, { timeZone: CONFIG.CHARACTER.TIMEZONE });
    // the error says itself when ElevenLabs spoke it instead
    add(null, "Last voice note that failed", `${when} (${CONFIG.CHARACTER.CITY} time, ${ago(lastVoiceError.at)}): ${lastVoiceError.error}${/ElevenLabs spoke it/.test(lastVoiceError.error) ? "." : ". She sent it as text instead."}`);
  }

  // Workers AI: his photos seen (VISION), her pictures drawn (PICTURE) from her reference face
  const PIC = CONFIG.PICTURE;
  if (CONFIG.VISION.ENABLED || PIC.ENABLED) {
    add(!!env.AI, "Workers AI (AI)", env.AI
      ? `Bound to this Worker (not test-called here): ${[CONFIG.VISION.ENABLED && `she sees your photos (${CONFIG.VISION.MODEL})`, PIC.ENABLED && `she draws her pictures (${PIC.MODEL})`].filter(Boolean).join("; ")}.`
      : "Not connected. Add an AI binding named AI (wrangler.toml has it: deploy again). Until then she can't see photos or send pictures.");
  }
  if (PIC.ENABLED && env.REEM_KV) {
    const picked = await env.REEM_KV.get("face");
    add(!!(picked || FACE_JPEG_BASE64), "Her face in pictures", picked ? `Picked with ${commandFor("face")}.` : FACE_JPEG_BASE64 ? `Built in (face.js). ${commandFor("face")} shows it and draws others to pick from.` : `None: her pictures won't all show the same face. Send ${commandFor("face")} in the chat to pick one.`);
    const ledger = await loadLedger(env);
    const B = CONFIG.AI_BUDGET;
    add(ledger.out ? false : null, "Workers AI today (UTC)", ledger.out ? `Cloudflare said the allocation is used up: no pictures for now, the next try after ${new Date((Number(ledger.out) || 0) + B.OUT_RETRY_MS).toISOString().slice(11, 16)} UTC.` : `About ${Math.round(ledger.neurons)} of ${B.DAILY_NEURONS} neurons used by the bot's own count (test runs on GitHub aren't in it; Cloudflare's dashboard has the real total). Pictures stop at ${Math.round(B.DAILY_NEURONS * B.PICTURE_SHARE)}; the first 10,000 a day are free, then about $0.011 per 1,000.`);
    const L = PIC.LINGERIE || {};
    const usd = (n) => `$${(Number(n) || 0).toFixed(2)}`;
    add(null, "OpenRouter today (UTC)", [CONFIG.VOICE.PROVIDER === "openrouter" && `her voice notes about ${usd(ledger.voiceUsd)} of ${usd(CONFIG.VOICE.OR_DAILY_USD)}`, L.ENABLED && `lingerie pictures ${usd(ledger.usd)} of ${usd(L.DAILY_USD)}`].filter(Boolean).join("; ") + ". Her text replies and hearing aren't counted here (OpenRouter's activity page has them).");
    // the picture route (PICTURE.ROUTE): Runware needs its key; no test picture here (it would cost on every reload)
    if (runwareRoute()) {
      const R = PIC.RUNWARE || {};
      add(!!env.RUNWARE_API_KEY, `Pictures: Runware (${PIC.ROUTE})`, env.RUNWARE_API_KEY ? `${PIC.ROUTE === "runware-klein" ? `${R.MODEL} with her face, retried, then Cloudflare klein` : R.BACKUP_MODEL}; nudity allowed${PIC.NSFW.OFF_ROUTE === "cloudflare" ? "; at /nsfw Off: Cloudflare klein" : ""}. Today about ${usd(ledger.rwUsd)} of ${usd(R.DAILY_USD)}; past it Cloudflare draws.` : "The Worker secret RUNWARE_API_KEY is missing: Cloudflare draws every picture (never nude).");
    } else add(null, "Pictures: Cloudflare", "klein on Workers AI, lingerie on Nano Banana; never nude. Switch PICTURE.ROUTE to a Runware route on the settings panel.");
    if (L.ENABLED && env.OPENROUTER_API_KEY && !runwareRoute()) {
      // a real picture would cost USD_PER_PICTURE on every reload: only that the model is there
      try {
        const res = await xfetch(`https://openrouter.ai/api/v1/models/${L.MODEL}/endpoints`, { headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` } });
        const n = ((await res.json().catch(() => ({})))?.data?.endpoints || []).length;
        add(res.ok && n > 0, `Lingerie pictures: ${L.MODEL}`, res.ok && n > 0 ? `Available on OpenRouter (${n} provider${n === 1 ? "" : "s"}). Not drawn here: a test picture costs about ${usd(L.USD_PER_PICTURE)}.` : `OpenRouter doesn't list it now (HTTP ${res.status}): klein's own wardrobe draws them instead.`);
      } catch (e) {
        add(false, `Lingerie pictures: ${L.MODEL}`, e.message);
      }
    }
  }
  const lastAiError = env.REEM_KV && (await env.REEM_KV.get("ai_error", "json").catch(() => null));
  if (lastAiError) {
    const when = new Date(lastAiError.at).toLocaleString(CONFIG.CHARACTER.CLOCK_LOCALE, { timeZone: CONFIG.CHARACTER.TIMEZONE });
    add(null, "Last Workers AI call that failed", `${when} (${CONFIG.CHARACTER.CITY} time, ${ago(lastAiError.at)}): ${lastAiError.error}`);
  }

  if (env.REEM_KV) {
    const locked = env.OWNER_ID || (await env.REEM_KV.get("owner"));
    add(true, "Memory (KV)", locked ? "Connected. Bot is locked to its owner." : "Connected. The first person to message the bot becomes its only user, so message it yourself now.");
  } else {
    add(false, "Memory (KV)", 'Not connected. Add a KV binding named REEM_KV pointing at the namespace "reem". Until then the bot answers no one.');
  }

  if (env.REEM_QUEUE) {
    add(true, "Queue (REEM_QUEUE)", "Connected. Make sure this Worker is the consumer of reem-inbox with max concurrency 1, or messages will wait forever.");
  } else {
    add(false, "Queue (REEM_QUEUE)", `Not connected. Create a queue "reem-inbox", bind it as REEM_QUEUE and add this Worker as its consumer. Until then every reply must fit in 30 seconds, so she types much faster than ${CONFIG.TIMING.TYPING_CHARS_PER_MIN} characters a minute.`);
  }

  const allOk = rows.every((r) => r.ok !== false);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const restart = commandFor("restart");
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(name)} setup</title><style>
body{font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px 16px;background:#f7f7f5;color:#1d1d1b}
h1{font-size:22px;margin:0 0 4px}.sub{color:#666;margin:0 0 20px}
.row{background:#fff;border-radius:12px;padding:12px 14px;margin:8px 0;display:flex;gap:10px;box-shadow:0 1px 2px #0001}
.row b{display:block}.row span{color:#555;font-size:14px}
.done{margin-top:20px;padding:16px;border-radius:12px;background:${allOk ? "#e7f6ec" : "#fff4e5"}}
a{color:#0a66c2}
@media (prefers-color-scheme:dark){body{background:#151514;color:#eee}.row{background:#222}.row span{color:#aaa}.done{background:${allOk ? "#173323" : "#3a2c12"}}}
</style></head><body>
<h1>${esc(name)} setup</h1><p class="sub">Reload to re-check. Each load reconnects Telegram${CONFIG.TELEGRAM.DROP_PENDING_UPDATES ? " and drops messages still waiting to be answered" : ""}, and the voice test costs about $0.001.</p>
${rows.map((r) => `<div class="row"><div>${r.ok === null ? "ℹ️" : r.ok ? "✅" : "❌"}</div><div><b>${esc(r.label)}</b><span>${esc(r.detail)}</span></div></div>`).join("")}
<div class="done">${allOk ? `All set. Open <a href="https://t.me/${esc(botName)}">@${esc(botName)}</a>${restart ? ` and send ${esc(restart)}` : ""} to meet the new ${esc(name)}.` : "Fix the ❌ items above, then reload this page."}</div>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
