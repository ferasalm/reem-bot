#!/usr/bin/env node
// Side-by-side model test for Reem: every scenario in scenarios.mjs, sent the way worker.js sends it
// (same system prompt, nudges and sampling), to every target model, and to every OpenRouter
// provider of DeepSeek V4 Flash one by one (fallbacks off, so we know who answered).
// The target "bot (CONFIG.LLM)" is sent exactly as the bot sends it: worker.js's openRouterBody(),
// i.e. LLM.MODEL with LLM.PROVIDER and LLM.REASONING (use --only bot to test just that).
//
//   OPENROUTER_API_KEY=... node tools/model-bench/bench.mjs [options]
//     --only <text>        only targets whose label contains <text> (comma-separated for several)
//     --scenarios <text>   only scenarios whose id starts with <text> (comma-separated)
//     --reps <q,l,g>       runs per scenario for quality, ladder, guard (default 2,3,2)
//     --concurrency <n>    parallel requests (default 6)
//     --out <dir>          results folder (default tools/model-bench/results/<timestamp>)
//     --budget <usd>       hard spending cap: a request is only sent if, even at its most expensive
//                          (whole prompt + max_tokens at the provider's listed price), the total stays
//                          under the cap (default 0.08)
//     --plan lean|full     lean (default): quality + safeguard scenarios once per model (DeepSeek on one
//                          provider, PRIMARY below), and the intimacy ladder top-down on every target:
//                          start at the highest level, repeat until it's delivered --reps-ladder times,
//                          step down a level whenever a reply isn't. full: every scenario, every target.
//
// Writes results.jsonl (one line per reply), summary.md (scores per target) and replies.md
// (every reply, grouped by scenario, for reading). results/ is git-ignored: replies can be explicit.

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadWorker } from "../test/load-worker.mjs";
import { SCENARIOS } from "./scenarios.mjs";
import { runChecks, heatOf } from "./checks.mjs";

// Node's fetch only uses HTTPS_PROXY when NODE_USE_ENV_PROXY is set: re-run with it
if (process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY) {
  const r = spawnSync(process.execPath, process.argv.slice(1), { stdio: "inherit", env: { ...process.env, NODE_USE_ENV_PROXY: "1", NODE_NO_WARNINGS: "1" } });
  process.exit(r.status ?? 1);
}

const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) {
  console.error("OPENROUTER_API_KEY is not set.");
  process.exit(1);
}

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
};
const [REPS_Q, REPS_L, REPS_G] = arg("reps", arg("plan", "lean") === "full" ? "2,3,2" : "1,3,1").split(",").map(Number);
const CONCURRENCY = Number(arg("concurrency", 6));
const ONLY = arg("only", "").split(",").filter(Boolean);
const ONLY_SCN = arg("scenarios", "").split(",").filter(Boolean);
const HERE = dirname(fileURLToPath(import.meta.url));
const BUDGET = Number(arg("budget", 0.08));
const PLAN = arg("plan", "lean");
const PRIMARY = "deepinfra"; // DeepSeek provider for the quality scenarios in the lean plan (supports min_p and repetition_penalty)
const OUT = arg("out", join(HERE, "results", new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)));

const DEEPSEEK = "deepseek/deepseek-v4-flash";
const OTHERS = [
  { label: "ministral-14b-2512 @mistral", model: "mistralai/ministral-14b-2512" },
  { label: "dolphin-venice-24b @venice", model: "cognitivecomputations/dolphin-mistral-24b-venice-edition" },
  { label: "lunaris-8b (current) @auto", model: "sao10k/l3-lunaris-8b" },
];

const W = await loadWorker();
const C = W.CONFIG;
const fill = (tpl, vars = {}) => String(tpl).replace(/\{(\w+)\}/g, (m, k) => (k in { name: 1, ...vars } ? String({ name: C.CHARACTER.NAME, ...vars }[k]) : m));

async function api(path, init = {}) {
  const res = await fetch(`${process.env.OPENROUTER_BASE || "https://openrouter.ai/api/v1"}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "HTTP-Referer": "https://t.me/reem_nabot", "X-Title": "Reem model bench", ...(init.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function targets() {
  const { data } = await api(`/models/${DEEPSEEK}/endpoints`);
  const eps = data?.data?.endpoints || [];
  if (!eps.length) console.warn("Could not list DeepSeek providers; testing default routing only.");
  const list = eps.length
    ? eps.map((e) => {
        const slug = String(e.tag || e.provider_name).split("/")[0];
        return { label: `deepseek-v4-flash @${slug}`, model: DEEPSEEK, provider: slug, quant: e.quantization, deepseek: true, price: e.pricing };
      })
    : [{ label: "deepseek-v4-flash @auto", model: DEEPSEEK, deepseek: true }];
  // The bot's own routing; priced at the dearest provider it may use, so the budget check is never too optimistic
  const routed = (C.LLM.MODEL === DEEPSEEK ? list : []).filter((t) => t.price && (C.LLM.PROVIDER?.order || []).includes(t.provider));
  const bot = { label: `bot (CONFIG.LLM) ${C.LLM.MODEL}`, model: C.LLM.MODEL, bot: true };
  if (routed.length) bot.price = { prompt: Math.max(...routed.map((t) => +t.price.prompt)), completion: Math.max(...routed.map((t) => +t.price.completion)) };
  else OTHERS.push(bot); // priced below like the other models
  const missing = [...(C.LLM.PROVIDER?.order || []), ...(C.LLM.PROVIDER?.ignore || [])].filter((p) => C.LLM.MODEL === DEEPSEEK && eps.length && !list.some((t) => t.provider === p));
  if (missing.length) console.warn(`LLM.PROVIDER names providers OpenRouter doesn't list for ${DEEPSEEK}: ${missing.join(", ")}`);
  for (const t of OTHERS) {
    // the dearest endpoint's price, so the budget check is never too optimistic
    const { data: d } = await api(`/models/${t.model}/endpoints`);
    const prices = (d?.data?.endpoints || []).map((e) => e.pricing);
    t.price = prices.length
      ? { prompt: Math.max(...prices.map((p) => +p.prompt)), completion: Math.max(...prices.map((p) => +p.completion)) }
      : { prompt: 1e-6, completion: 2e-6 };
  }
  const all = [...(bot.price && !OTHERS.includes(bot) ? [bot] : []), ...list, ...OTHERS];
  return ONLY.length ? all.filter((t) => ONLY.some((o) => t.label.includes(o))) : all;
}

// The same system prompt and nudges think() builds (minus the random TEXTURE nudge, for repeatability)
function messagesFor(scn) {
  const N = C.NUDGES;
  const day = "Friday";
  const hh = String(scn.hour).padStart(2, "0");
  const slot = (C.CHARACTER.SCHEDULE || []).find((s) => scn.hour >= s.from && scn.hour < s.to);
  let extra = "";
  extra += fill(N.TIME, { time: `${day} ${hh}:${scn.hour === 0 ? "10" : "40"}`, city: C.CHARACTER.CITY, doing: slot?.doing || "going about your day" });
  extra += fill(scn.scene === "together" ? N.TOGETHER : N.APART);
  if (scn.cameAsVoice) extra += fill(N.CAME_AS_VOICE);
  else if (scn.moreVoice) extra += fill(N.MORE_VOICE);
  if (scn.scene !== "together" && C.VOICE.AUDIO_TAGS) extra += fill(N.VOICE_TAGS, { tags: C.VOICE.ALLOWED_TAGS.map((t) => `[${t}]`).join(", ") });
  if (scn.offerReaction) extra += fill(N.REACT, { emojis: C.REACTIONS.ALLOWED.join(" ") });
  const user = scn.user ?? fill(C.PROACTIVE.PROMPT, { hours: "5 hours" });
  return [{ role: "system", content: C.PERSONA.SYSTEM_PROMPT + extra }, ...scn.history, { role: "user", content: user }];
}

async function call(target, scn) {
  const body = target.bot
    ? { ...W.openRouterBody(target.model, messagesFor(scn), C.LLM.SAMPLING), usage: { include: true } }
    : { model: target.model, messages: messagesFor(scn), ...C.LLM.SAMPLING, usage: { include: true } };
  if (target.provider) body.provider = { only: [target.provider], allow_fallbacks: false };
  if (target.deepseek) body.reasoning = { enabled: false };
  const t0 = Date.now();
  let last;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { res, data } = await api("/chat/completions", { method: "POST", body: JSON.stringify(body), signal: AbortSignal.timeout(60000) });
      const ms = Date.now() - t0;
      if (!res.ok || data.error) {
        last = { ok: false, status: res.status, error: data?.error?.message || `HTTP ${res.status}`, errorMeta: data?.error?.metadata, ms };
        if ([429, 500, 502, 503, 504].includes(res.status) && attempt === 0) { await new Promise((r) => setTimeout(r, 3000)); continue; }
        return last;
      }
      const ch = data.choices?.[0];
      return {
        ok: true, ms, status: res.status,
        text: (ch?.message?.content || "").trim(),
        reasoningChars: (ch?.message?.reasoning || "").length,
        finish: ch?.finish_reason || ch?.native_finish_reason,
        servedBy: data.provider, servedModel: data.model,
        usage: data.usage,
      };
    } catch (e) {
      last = { ok: false, status: 0, error: `${e.name}: ${e.message}`, ms: Date.now() - t0 };
    }
  }
  return last;
}

const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const pct = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
const fmtMs = (v) => (v == null ? "—" : `${(v / 1000).toFixed(1)}s`);
const fmt$ = (v) => (v == null || Number.isNaN(v) ? "—" : `$${(v * 1000).toFixed(3)}`); // per 1,000 replies

function summarize(tlist, rows) {
  const lines = [];
  lines.push(`# Reem model bench — ${new Date().toISOString().slice(0, 16)}Z`, "");
  lines.push(`Sampling: \`${JSON.stringify(C.LLM.SAMPLING)}\`; DeepSeek with \`reasoning: {enabled: false}\`, one provider at a time, fallbacks off. Plan: ${PLAN}.`, "");
  if (tlist.some((t) => t.bot)) lines.push(`Bot target: \`${C.LLM.MODEL}\`, provider \`${JSON.stringify(C.LLM.PROVIDER)}\`, reasoning \`${JSON.stringify(C.LLM.REASONING)}\` (from worker.js CONFIG).`, "");
  lines.push(`Spent **$${spent.toFixed(4)}** (cap $${BUDGET}) on ${rows.length} requests${skipped ? `; ${skipped} skipped to stay under the cap` : ""}.`, "");
  lines.push("## Reliability, speed, cost", "");
  lines.push("| Target | Replies OK | Errors | Empty | Median latency | p90 | Cost / 1k replies | Avg out tokens | Served by |");
  lines.push("|---|---|---|---|---|---|---|---|---|");
  for (const t of tlist) {
    const r = rows.filter((x) => x.target === t.label);
    const ok = r.filter((x) => x.ok && x.text);
    const errs = r.filter((x) => !x.ok);
    const empty = r.filter((x) => x.ok && !x.text);
    const costs = ok.map((x) => x.cost).filter((v) => typeof v === "number");
    const outTok = ok.map((x) => x.usage?.completion_tokens).filter(Boolean);
    const served = [...new Set(ok.map((x) => x.servedBy).filter(Boolean))].join(", ");
    lines.push(`| ${t.label} | ${ok.length}/${r.length} | ${errs.length} | ${empty.length} | ${fmtMs(median(ok.map((x) => x.ms)))} | ${fmtMs(pct(ok.map((x) => x.ms), 0.9))} | ${costs.length ? fmt$(costs.reduce((a, b) => a + b, 0) / costs.length) : "—"} | ${outTok.length ? Math.round(outTok.reduce((a, b) => a + b, 0) / outTok.length) : "—"} | ${served || "—"} |`);
  }
  const errRows = rows.filter((x) => !x.ok);
  if (errRows.length) {
    lines.push("", "### Errors", "");
    const byErr = {};
    for (const e of errRows) (byErr[`${e.target}: ${e.status} ${e.error}`.slice(0, 220)] ||= []).push(e.scenario);
    for (const [k, v] of Object.entries(byErr)) lines.push(`- ${k} — ${v.length}× (${[...new Set(v)].join(", ")})`);
  }

  lines.push("", "## Intimacy ladder (consensual adults) — explicit / suggestive / tame / faded / refused / error", "");
  const ladder = SCENARIOS.filter((s) => s.kind === "ladder");
  lines.push("Ceiling = highest level where every reply was delivered (L3/L4: explicit; L1/L2: suggestive or explicit), with at least " + REPS_L + " replies.", "");
  lines.push(`| Target | Ceiling | ${ladder.map((s) => s.id).join(" | ")} |`, `|---|---|${ladder.map(() => "---").join("|")}|`);
  for (const t of tlist) {
    const cells = ladder.map((s) => {
      const r = rows.filter((x) => x.target === t.label && x.scenario === s.id);
      const count = {};
      for (const x of r) { const k = !x.ok ? "error" : heatOf(x.text).label; count[k] = (count[k] || 0) + 1; }
      return Object.entries(count).map(([k, v]) => `${v} ${k}`).join(", ") || "—";
    });
    let ceiling = "none";
    for (const s of [...ladder].sort((a, b) => b.level - a.level)) {
      const r = rows.filter((x) => x.target === t.label && x.scenario === s.id && x.ok);
      if (r.length >= REPS_L && r.every((x) => delivered(s, x))) { ceiling = `L${s.level}`; break; }
    }
    lines.push(`| ${t.label} | ${ceiling} | ${cells.join(" | ")} |`);
  }

  lines.push("", "## Format & safeguard checks (passed / scored)", "");
  const checkNames = ["texting", "voice", "scene", "reaction", "guard_minor"];
  lines.push(`| Target | ${checkNames.join(" | ")} | refusals / broke character |`, `|---|${checkNames.map(() => "---").join("|")}|---|`);
  for (const t of tlist) {
    const r = rows.filter((x) => x.target === t.label && x.ok && x.text);
    const cells = checkNames.map((c) => {
      const scored = r.map((x) => x.checks?.[c]).filter((v) => v && v.pass !== null && v.pass !== undefined);
      return scored.length ? `${scored.filter((v) => v.pass).length}/${scored.length}` : "—";
    });
    const refusals = r.filter((x) => x.checks?.refusal).length;
    lines.push(`| ${t.label} | ${cells.join(" | ")} | ${refusals} |`);
  }
  return lines.join("\n") + "\n";
}

function repliesDoc(tlist, rows) {
  const out = ["# Every reply, by scenario", ""];
  for (const s of SCENARIOS.filter((s) => rows.some((x) => x.scenario === s.id))) {
    out.push(`## ${s.id}`, "", `_${s.note}_`, "", `**He:** ${s.user ?? "(she texts first)"}`, "");
    for (const t of tlist) {
      for (const x of rows.filter((r) => r.scenario === s.id && r.target === t.label)) {
        const flags = Object.entries(x.checks || {}).map(([k, v]) => `${k}: ${v.pass === false ? "FAIL" : v.pass ? "ok" : "–"}${v.notes.length ? ` (${v.notes.join("; ")})` : ""}`).join(" · ");
        out.push(`### ${t.label} — run ${x.rep + 1} — ${fmtMs(x.ms)}${x.servedBy ? ` — ${x.servedBy}` : ""}`);
        out.push(x.ok ? (x.text || "_(empty)_") : `**ERROR** ${x.status}: ${x.error}`, "");
        if (flags) out.push(`> ${flags}`, "");
      }
    }
  }
  return out.join("\n");
}

const tlist = await targets();
const scns = ONLY_SCN.length ? SCENARIOS.filter((s) => ONLY_SCN.some((p) => s.id.startsWith(p))) : SCENARIOS;
const reps = { quality: REPS_Q, ladder: REPS_L, guard: REPS_G };
mkdirSync(OUT, { recursive: true });

// Budget: reserve each request's worst case before sending it, settle with the real cost after
let spent = 0, reserved = 0, skipped = 0;
const tokensIn = (s) => Math.ceil(messagesFor(s).reduce((a, m) => a + m.content.length, 0) / 3);
const worstCase = (t, s) => tokensIn(s) * +t.price.prompt + C.LLM.SAMPLING.max_tokens * +t.price.completion;

const rows = [];
let sent = 0;
async function run(t, s, rep) {
  const worst = worstCase(t, s);
  if (spent + reserved + worst > BUDGET) { skipped++; return null; }
  reserved += worst;
  const r = await call(t, s);
  reserved -= worst;
  const cost = typeof r.usage?.cost === "number" ? r.usage.cost
    : r.usage ? (r.usage.prompt_tokens || 0) * +t.price.prompt + (r.usage.completion_tokens || 0) * +t.price.completion : 0;
  spent += cost;
  const row = { target: t.label, model: t.model, provider: t.provider || null, scenario: s.id, kind: s.kind, level: s.level, rep, cost, ...r };
  if (r.ok) row.checks = runChecks(s, r.text, C);
  rows.push(row);
  appendFileSync(join(OUT, "results.jsonl"), JSON.stringify(row) + "\n");
  if (++sent % 10 === 0) console.log(`  ${sent} sent, $${spent.toFixed(4)} spent`);
  return row;
}

const delivered = (s, row) => {
  const label = heatOf(row.text).label;
  return s.level >= 3 ? label === "explicit" : label === "explicit" || label === "suggestive";
};

// Highest level first; step down a level whenever a reply isn't delivered; stop after REPS_L deliveries
async function ladderTopDown(t) {
  const levels = scns.filter((s) => s.kind === "ladder").sort((a, b) => b.level - a.level);
  const count = {};
  let i = 0, ok = 0, errors = 0, tries = 0;
  while (i < levels.length && tries < REPS_L + levels.length + 2) {
    const s = levels[i];
    const row = await run(t, s, (count[s.id] = (count[s.id] || 0) + 1) - 1);
    tries++;
    if (!row) return;                                  // budget reached
    if (!row.ok) { if (++errors >= 2) return; continue; } // provider down: give up after two errors
    if (delivered(s, row)) { if (++ok >= REPS_L) return; }
    else { i++; ok = 0; }
  }
}

// What each target runs
function planFor(t) {
  const fixed = [];
  const quality = PLAN === "full" || !t.deepseek || t.bot || t.provider === PRIMARY;
  for (const s of scns) {
    if (s.kind === "ladder" && PLAN !== "full") continue;
    if (s.kind !== "ladder" && !quality) continue;
    for (let rep = 0; rep < reps[s.kind]; rep++) fixed.push([s, rep]);
  }
  return { fixed, topDown: PLAN !== "full" };
}

const plans = tlist.map((t) => ({ t, ...planFor(t) }));
const worstTotal = plans.reduce((a, p) => {
  const ladderMax = p.topDown ? (REPS_L + 2) * Math.max(0, ...scns.filter((s) => s.kind === "ladder").map((s) => worstCase(p.t, s))) : 0;
  return a + p.fixed.reduce((b, [s]) => b + worstCase(p.t, s), 0) + ladderMax;
}, 0);
console.log(`${PLAN} plan: ${tlist.length} targets. Worst-case cost if every request maxed out: $${worstTotal.toFixed(4)}; hard cap $${BUDGET}.`);
console.log(`Results: ${OUT}`);
for (const p of plans) console.log(`  - ${p.t.label}${p.t.quant ? ` (${p.t.quant})` : ""}: ${p.fixed.length} fixed${p.topDown ? " + ladder top-down" : ""}`);

let next = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (next < plans.length) {
    const p = plans[next++];
    for (const [s, rep] of p.fixed) await run(p.t, s, rep);
    if (p.topDown) await ladderTopDown(p.t);
  }
}));
console.log(`Spent $${spent.toFixed(4)} of $${BUDGET} on ${rows.length} requests${skipped ? `; ${skipped} skipped to stay under the cap` : ""}.`);

writeFileSync(join(OUT, "summary.md"), summarize(tlist, rows));
writeFileSync(join(OUT, "replies.md"), repliesDoc(tlist, rows));
console.log(`Done. ${join(OUT, "summary.md")}`);
