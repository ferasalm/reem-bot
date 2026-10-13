// Her replies on Workers AI's DeepSeek, as the bot asks for them (2026-10-13: short, cut replies and "wifi died" after the deploy).
// Fix round 2, F1: her persona + a short chat, reasoning "none", max_tokens = her reply's length (LLM.MAX_TOKENS TEXT 220,
// SCENE 380, VOICE 120) + LLM.THINK_TOKENS (700), 4 calls each. Prints per call the seconds, finish_reason, token usage,
// the length of the content and of any reasoning, and the content's end. The check: every answer finishes (finish=stop) with content.
// Workers AI REST only (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID). Runs on a push of this file (cf-probe.yml).
import { loadWorker } from "./load-worker.mjs";
const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account } = process.env;
const model = process.env.PROBE_MODEL || "@cf/deepseek-ai/deepseek-v4-flash-0731";
const W = await loadWorker();
const chat = [
  { role: "system", content: W.SYSTEM_PROMPT },
  { role: "user", content: "hey you. long day?" },
  { role: "assistant", content: "the longest. three clients and a printer that hates me" },
  { role: "user", content: "come tell me about it. i made tea" },
];
const ask = async (max_tokens, reasoning_effort) => {
  const t = Date.now();
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messages: chat, max_tokens, reasoning_effort, temperature: 0.95 }), signal: AbortSignal.timeout(60000) }).catch((e) => e);
  if (res instanceof Error) return `${((Date.now() - t) / 1000).toFixed(1)}s ${res.name}`;
  const d = await res.json().catch(() => ({}));
  const s = ((Date.now() - t) / 1000).toFixed(1);
  if (d.success === false) return `${s}s ERROR ${JSON.stringify(d.errors).slice(0, 160)}`;
  const c = d.result?.choices?.[0] || {};
  const content = String(c.message?.content ?? d.result?.response ?? "");
  const reasoning = String(c.message?.reasoning_content ?? c.message?.reasoning ?? "");
  return `${s}s finish=${c.finish_reason} usage=${JSON.stringify(d.result?.usage || {})} content=${content.length}ch reasoning=${reasoning.length}ch keys=${Object.keys(c.message || {}).join(",")} | end: ${JSON.stringify(content.slice(-120))}`;
};
const L = W.CONFIG.LLM;
for (const mode of ["TEXT", "SCENE", "VOICE"]) {
  const max = L.MAX_TOKENS[mode] + L.THINK_TOKENS;
  for (let i = 0; i < 4; i++) {
    process.stdout.write(`${mode} max ${max} none #${i + 1}: ${await ask(max, "none")}\n`);
    await new Promise((r) => setTimeout(r, 1500));
  }
}
process.exit(0); // the loaded worker may hold timers open
