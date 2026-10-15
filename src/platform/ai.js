// Text models (OpenRouter and Workers AI DeepSeek, the backup), Workers AI runs and the neuron ledger.
import { thinksFirst, trimUnfinished } from "../chat/think.js";
import { CONFIG } from "../config/index.js";
import { budget, sleep, xfetch } from "./http.js";
import { spend } from "./kv.js";
import { trace, traceCall } from "./log.js";

export class ApiError extends Error {
  constructor(message, retryable) {
    super(message);
    this.retryable = retryable;
  }
}
export const RETRYABLE = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
// The OpenRouter request. LLM.PROVIDER and LLM.REASONING belong to LLM.MODEL: they're only sent with
// that model (so a backup or another memory model is routed by OpenRouter as usual). Empty values are left out.
export function openRouterBody(model, messages, sampling) {
  const body = { model, messages, ...sampling };
  const L = CONFIG.LLM;
  const main = model === L.MODEL;
  if (!main && model !== L.BACKUP_MODEL) return body;
  const kept = (o) => Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v != null && v !== "" && !(Array.isArray(v) && !v.length)));
  const provider = kept(main ? L.PROVIDER : L.BACKUP_PROVIDER);
  const reasoning = kept(main ? L.REASONING : L.BACKUP_REASONING);
  if (Object.keys(provider).length) body.provider = provider;
  if (Object.keys(reasoning).length) body.reasoning = reasoning;
  return body;
}
// trimCut: a reply that hit max_tokens ends at its last full sentence instead of mid-word
// backup: a model to try once when every attempt with `model` failed
// task: a job, not her reply (memory notes, /auto, the day's plan, /setup's check): Workers AI's DeepSeek gets a short
// thinking step, without which it answered such prompts with nothing 3-5 times in 5 (cf-probe runs 2026-10-06)
export async function callModel(env, messages, sampling, { model = CONFIG.LLM.MODEL, timeoutMs = CONFIG.LLM.TIMEOUT_MS, attempts = CONFIG.LLM.ATTEMPTS, trimCut = false, backup = "", task = false } = {}) {
  try {
    return await askModel(env, messages, sampling, { model, timeoutMs, attempts, trimCut, task });
  } catch (e) {
    if (!backup || backup === model) throw e;
    console.error(`${model} failed, trying ${backup}:`, e.message);
    if (trace) trace.backup = true;
    const fitted = fitMessages(messages, CONFIG.LLM.BACKUP_CONTEXT_TOKENS, sampling.max_tokens);
    return askModel(env, fitted, sampling, { model: backup, timeoutMs, attempts: 1, trimCut, task });
  }
}
// For a model that reads less (the backup): the oldest chat is left out first, never the system
// prompt, his message or anything after it, so OpenRouter never cuts the middle out silently
export function fitMessages(messages, contextTokens, maxTokens = 0) {
  const L = CONFIG.LLM;
  if (!contextTokens) return messages;
  const room = (contextTokens - maxTokens - 150) * L.CHARS_PER_TOKEN;
  const size = (m) => String(m.content).length + 20;
  const out = [...messages];
  let total = out.reduce((n, m) => n + size(m), 0);
  let removable = out.map((m) => m.role).lastIndexOf("user") - 1; // between the system prompt and his message
  while (total > room && removable > 0) {
    total -= size(out.splice(1, 1)[0]);
    removable--;
  }
  return out;
}
export async function askModel(env, messages, sampling, opts) {
  const t0 = Date.now();
  try {
    const out = await askModelTries(env, messages, sampling, opts);
    traceCall(opts.model, t0);
    return out;
  } catch (e) {
    traceCall(opts.model, t0, e);
    throw e;
  }
}
export async function askModelTries(env, messages, sampling, { model, timeoutMs, attempts, trimCut, task = false }) {
  let lastErr;
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (trace) trace.attempts++;
    if (attempt) await sleep(CONFIG.LLM.RETRY_DELAY_MS);
    // a Workers AI model (@cf/...): the AI binding instead of OpenRouter (owner 2026-10-06: the backup on Cloudflare)
    if (/^@cf\//.test(model)) {
      try {
        const out = await workersChat(env, model, messages, sampling, timeoutMs, trimCut, task);
        if (out) return out;
        lastErr = new ApiError("The model sent an empty reply.", true);
      } catch (e) {
        lastErr = e instanceof ApiError ? e : new ApiError(`Workers AI ${model}: ${aiText_(e)}`, aiBusy(e) || /longer than/.test(aiText_(e)));
        if (!lastErr.retryable) throw lastErr;
      }
      continue;
    }
    let res;
    try {
      res = await xfetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": `https://t.me/${CONFIG.CHARACTER.BOT_USERNAME}`,
          "X-Title": CONFIG.CHARACTER.NAME,
        },
        body: JSON.stringify(openRouterBody(model, messages, sampling)),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      lastErr = new ApiError(`OpenRouter unreachable or too slow (${e.name})`, true);
      continue;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      lastErr = new ApiError(`OpenRouter ${res.status}: ${data?.error?.message || "request failed"}`, RETRYABLE.has(res.status));
      if (!lastErr.retryable) throw lastErr;
      continue;
    }
    const choice = data?.choices?.[0];
    const out = (choice?.message?.content || "").trim();
    if (out) return trimCut && choice.finish_reason === "length" ? trimUnfinished(out) : out;
    lastErr = new ApiError("The model sent an empty reply.", true);
  }
  throw lastErr;
}
// A chat model on Workers AI (OpenAI-style messages). Only temperature and max_tokens are sent (min_p and
// repetition_penalty are OpenRouter's), and no thinking step: Cloudflare's DeepSeek thinks by default
export async function workersChat(env, model, messages, sampling, timeoutMs, trimCut, task = false) {
  if (!env.AI) throw new ApiError("Workers AI is not connected (the AI binding).", false);
  const thinks = thinksFirst(model);
  const input = { messages: messages.map((m) => ({ role: m.role, content: String(m.content) })), max_tokens: (sampling.max_tokens || 0) + (task ? 1500 : thinks ? (CONFIG.LLM.THINK_TOKENS || 0) : 0), reasoning_effort: task && thinks ? "low" : "none" }; // room for the thinking; "none" as the Llama writer sends it
  if (sampling.temperature != null) input.temperature = sampling.temperature;
  // Cloudflare's DeepSeek sometimes ends at once with nothing (1 token, "stop"): 7 of 25 calls with reasoning "none",
  // 3 of 28 with "low" (live runs 37544942514, 37544945221). An empty answer is back in ~1 s and its prompt is cached,
  // so it's asked again, up to 4 times in all
  // the last two tries think a little (reasoning "low" never came back empty in cf-probe, 2026-10-06)
  let data, choice, out = "";
  for (let i = 0; i < 4 && !out; i++) {
    if (i === 2 && thinks && input.reasoning_effort === "none") Object.assign(input, { reasoning_effort: "low", max_tokens: (input.max_tokens || 0) + 1500 });
    data = await aiRun(env, model, input, timeoutMs);
    choice = data?.choices?.[0];
    out = String(choice?.message?.content ?? data?.response ?? "").trim();
  }
  return out && trimCut && choice?.finish_reason === "length" ? trimUnfinished(out) : out;
}
/* ------------------------------------------------------------------ */
/*  Pictures: his photos seen, hers drawn (Cloudflare Workers AI)      */
/* ------------------------------------------------------------------ */

// One Workers AI call (the AI binding), counted like an outside call and cut off after timeoutMs.
// Capacity errors (3040) get one more try.
export async function aiRun(env, model, input, timeoutMs, retry = true, options = undefined) {
  budget.used++;
  const signal = AbortSignal.timeout(timeoutMs);
  const late = new Promise((_, reject) => {
    signal.addEventListener("abort", () => reject(new Error(`Workers AI took longer than ${Math.round(timeoutMs / 1000)} s`)));
  });
  late.catch(() => {});
  try {
    // the AI Gateway only for text and vectors (JSON): it refuses picture uploads ("AI Gateway does not support
    // ReadableStreams yet", deploy run 37547182886), so pictures, voice and hearing go straight to Workers AI
    const gw = CONFIG.AI_BUDGET.GATEWAY && input && (Array.isArray(input.messages) || Array.isArray(input.text)) ? CONFIG.AI_BUDGET.GATEWAY : "";
    const opts = gw ? { ...(options || {}), gateway: { id: gw } } : options;
    return await Promise.race([opts ? env.AI.run(model, input, opts) : env.AI.run(model, input), late]);
  } catch (e) {
    if (retry && aiBusy(e) && budget.left() > CONFIG.LIMITS.SUBREQUEST_RESERVE) return aiRun(env, model, input, timeoutMs, false, options);
    throw e;
  }
}
// What a Workers AI error means (the binding throws errors whose message carries the code)
export const aiText_ = (e) => String((e && (e.message || e)) || "");
// Out of neurons: 3036 in the docs; the live API says 4006 (seen 2026-10-03), same words
export const aiOutOfNeurons = (e) => /\b3036\b|\b4006\b|daily free allocation|neurons/i.test(aiText_(e));
// Its message also says "please upgrade to ... Workers Paid": that's out of neurons, not a model we can't use
// (seen live: read as unavailable, the backup was tried and its 5006 hid the real error on /setup)
export const aiUnavailable = (e) => !aiOutOfNeurons(e) && /\b5035\b|\b403\b|workers paid|upgrade|not (?:found|available)|no such model|\b5007\b/i.test(aiText_(e));
// Workers AI's safety filter refused the prompt (3030)
export const aiFiltered = (e) => /\b3030\b/.test(aiText_(e));
export const aiBusy = (e) => /\b3040\b|capacity|\b429\b/i.test(aiText_(e)) && !aiOutOfNeurons(e);
// The last Workers AI failure, shown on /setup
export async function aiFailed(env, error) {
  console.error("Workers AI failed:", error);
  if (!env.REEM_KV) return;
  await env.REEM_KV.put("ai_error", JSON.stringify({ at: Date.now(), error: String(error || "unknown error").slice(0, 300) }))
    .catch((e) => console.error("couldn't save the AI error", e));
}
// May this kind of call ("picture", "photo", "health", "hearing", "voice") still be made today? `neurons`: its cost, if not fixed
export function aiAffordable(ledger, kind, neurons) {
  const B = CONFIG.AI_BUDGET;
  if (!ledger) return false;
  // out of neurons: wait OUT_RETRY_MS, then one call may test whether Cloudflare's block has lifted
  if (typeof ledger.out === "number" && Date.now() - ledger.out < B.OUT_RETRY_MS) return false;
  const cost = neurons ?? (kind === "picture" ? B.PICTURE_NEURONS : kind === "photo" ? B.PHOTO_NEURONS : B.HEALTH_NEURONS);
  const cap = kind === "picture" ? B.DAILY_NEURONS * B.PICTURE_SHARE : B.DAILY_NEURONS;
  return ledger.neurons + cost <= cap;
}
// After a call: count it, or stop for the day when Cloudflare says the allocation is used up
export function aiSpent(ledger, neurons, error) {
  if (error && error.runwareOnly) return; // nothing was drawn on Cloudflare (Nude/On are Runware's only, 2026-10-13)
  if (error && aiOutOfNeurons(error)) ledger.out = Date.now();
  else { ledger.out = false; spend(ledger, "neurons", neurons); }
}
// Workers AI models answer in different shapes
export function aiText(out) {
  if (typeof out === "string") return out;
  const r = out && (out.response ?? out.description ?? out.result?.response ?? out.choices?.[0]?.message?.content);
  return typeof r === "string" ? r : "";
}
