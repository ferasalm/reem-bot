// Outside calls (xfetch, counted by budget) and small byte/text helpers.
import { CONFIG } from "../config/index.js";

/* ------------------------------------------------------------------ */
/*  Outside calls: counted, because the free plan allows 50 per run    */
/* ------------------------------------------------------------------ */

// `used` is this run's outside calls, the cap; byChat counts them per chat (`chat`: the chat being answered, set by handleBatch),
// ready for per-chat limits with paid tiers (Rebuild Step 1)
export const budget = {
  used: 0,
  chat: null,
  byChat: {},
  reset() { this.used = 0; this.chat = null; this.byChat = {}; },
  left() { return CONFIG.LIMITS.SUBREQUEST_LIMIT - this.used; },
};
export function xfetch(url, init) {
  budget.used++;
  if (budget.chat != null) budget.byChat[budget.chat] = (budget.byChat[budget.chat] || 0) + 1;
  return fetch(url, init);
}
export const withTimeout = (p, ms, what) => {
  const signal = AbortSignal.timeout(ms);
  const late = new Promise((_, no) => signal.addEventListener("abort", () => no(new Error(`${what} took longer than ${ms} ms`))));
  late.catch(() => {});
  return Promise.race([p, late]);
};
export function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
// Light on CPU (the free plan allows 10 ms per run): the runtime's own decoder when it has one
export function fromBase64(s) {
  if (typeof Uint8Array.fromBase64 === "function") return Uint8Array.fromBase64(s);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
export async function sha256(bytes) {
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return toBase64(hash).slice(0, 24);
}
/* ------------------------------------------------------------------ */
/*  Text helpers                                                       */
/* ------------------------------------------------------------------ */

export const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
export const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
