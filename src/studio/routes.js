// The prompt studio (/studio): signed link, cookie, the API (options, log, compose, draw, presets).
import { STYLE_JPEG_BASE64 } from "../../assets/face.js";
import { PLACE_JPEG_BASE64 } from "../../assets/places.js";
import { notice } from "../chat/batch.js";
import { CONFIG } from "../config/index.js";
import { NSFW_LEVELS } from "../gate.js";
import { customPicture, picWords } from "../pictures/commands.js";
import { drawPicture, drawRunware } from "../pictures/draw.js";
import { refBytes } from "../pictures/refs.js";
import { dayOutfits } from "../pictures/shots.js";
import { toBase64, xfetch } from "../platform/http.js";
import { loadLedger, saveLedger } from "../platform/kv.js";
import { ensureStudioSchema, logPicture } from "../platform/log.js";
import { tg } from "../platform/telegram.js";
import { STUDIO_HTML } from "./page.js";

// ---- The prompt studio (Step 7, docs/WORKPLAN.md, 2026-10-11): a private page on this Worker at /studio --------------------
// The page is studio.js. /studio sends the owner's chat a signed link: base64url("chat.exp.epoch") + "." + base64url(HMAC-
// SHA256 of that first part, keyed with the bot's token). Its first visit sets a cookie (studio=<token>, LINK_DAYS) and every
// other /studio route needs the cookie (404 without it). `/studio reset` bumps KV studio_epoch: every old link stops working.
// The log is the D1 table `pictures` (the bot's pictures and the studio's draws); the studio's money is ledger studioUsd.
export const STUDIO_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
export const STUDIO_HEADERS = { "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex", "Cache-Control": "private", "Content-Security-Policy": STUDIO_CSP };
export let studioHost = "";
 // this Worker's address from the last webhook call: the link's host (KV "origin" is the fallback)
export let savedOrigin = "";
// The webhook sets the address (an imported binding is read-only, so the entry point calls this)
export function setStudioHost(origin) {
  studioHost = origin;
}
// The webhook keeps its address in KV "origin" (once per isolate, when it differs from the last one saved)
export async function saveOrigin(env, origin) {
  if (!env.REEM_KV || origin === savedOrigin) return;
  savedOrigin = origin;
  await env.REEM_KV.put("origin", origin).catch((e) => console.error("couldn't save the origin", e));
}
export const b64urlEncode = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const b64urlDecode = (s) => {
  const std = String(s).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(std.padEnd(Math.ceil(std.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
};
export const studioKey = (env) => crypto.subtle.importKey("raw", new TextEncoder().encode(String(env.TELEGRAM_BOT_TOKEN || "")), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
export const money4 = (n) => `$${(Number(n) || 0).toFixed(4)}`;
export const intIn = (v, lo, hi, dflt) => {
  const n = Math.floor(Number(v));
  return n >= lo && n <= hi ? n : dflt;
};
// The owner's chat id (OWNER_ID, else KV "owner") as a string, or null
export async function studioOwner(env) {
  const id = env.OWNER_ID ? String(env.OWNER_ID).trim() : env.REEM_KV ? await env.REEM_KV.get("owner") : null;
  return id == null ? null : String(id);
}
// A link's token for a chat: exp (seconds) LINK_DAYS ahead, epoch = the current studio_epoch
export async function studioToken(env, chat, now = Date.now()) {
  const epoch = Number(await env.REEM_KV.get("studio_epoch")) || 0;
  const exp = Math.floor(now / 1000) + CONFIG.STUDIO.LINK_DAYS * 86400;
  const part = b64urlEncode(new TextEncoder().encode(`${chat}.${exp}.${epoch}`));
  const sig = await crypto.subtle.sign("HMAC", await studioKey(env), new TextEncoder().encode(part));
  return `${part}.${b64urlEncode(new Uint8Array(sig))}`;
}
// The owner's chat a token names, or null: a bad signature, an expired link, an old epoch (/studio reset) or another chat
export async function studioCheck(env, token, now = Date.now()) {
  const [part, sig, extra] = String(token || "").split(".");
  if (!part || !sig || extra !== undefined) return null;
  try {
    if (!(await crypto.subtle.verify("HMAC", await studioKey(env), b64urlDecode(sig), new TextEncoder().encode(part)))) return null;
    const [chat, exp, epoch] = new TextDecoder().decode(b64urlDecode(part)).split(".");
    if (Math.floor(now / 1000) > Number(exp)) return null;
    if (Number(epoch) !== (Number(await env.REEM_KV.get("studio_epoch")) || 0)) return null;
    return chat === (await studioOwner(env)) ? { chat } : null;
  } catch (e) {
    return null;
  }
}
// /studio: the owner's chat gets its link; any other chat gets no answer. `/studio reset` makes every old link stop working
export async function studioCommand(env, chatId, args = "") {
  const M = CONFIG.MESSAGES;
  const owner = await studioOwner(env);
  if (!owner || String(chatId) !== owner) return;
  if (String(args).trim().toLowerCase() === "reset") {
    await env.REEM_KV.put("studio_epoch", String((Number(await env.REEM_KV.get("studio_epoch")) || 0) + 1));
    return notice(env, chatId, M.STUDIO_RESET);
  }
  const host = env.PUBLIC_URL || studioHost || (await env.REEM_KV.get("origin")) || "";
  if (!host) return notice(env, chatId, M.STUDIO_NO_HOST);
  const token = await studioToken(env, owner);
  return notice(env, chatId, M.STUDIO_LINK, { url: `${String(host).replace(/\/+$/, "")}/studio?t=${token}`, days: CONFIG.STUDIO.LINK_DAYS });
}
// Every /studio route: the link's first visit sets the cookie; every other route needs it (404 without)
export async function studioRoute(request, env, url, now = Date.now()) {
  const notFound = () => new Response("not found", { status: 404, headers: STUDIO_HEADERS });
  if (!env.REEM_KV || !env.TELEGRAM_BOT_TOKEN) return notFound();
  const token = url.searchParams.get("t");
  // The first visit answers the page itself, no redirect: a SameSite=Strict cookie set on a redirect from a link opened in
  // another app (Telegram) is not sent on the redirected request, so the page was 404 (2026-10-11). Lax is sent on the page's
  // own navigations (a reload, a bookmark); the page drops ?t= from the address bar (studio.js)
  if (url.pathname === "/studio" && token && request.method === "GET") {
    if (!(await studioCheck(env, token, now))) return notFound();
    const maxAge = CONFIG.STUDIO.LINK_DAYS * 86400;
    return new Response(STUDIO_HTML, { headers: { ...STUDIO_HEADERS, "Content-Type": "text/html; charset=utf-8", "Set-Cookie": `studio=${token}; Path=/studio; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}` } });
  }
  const cookie = (request.headers.get("cookie") || "").split(";").map((c) => c.trim()).find((c) => c.startsWith("studio="));
  if (!cookie || !(await studioCheck(env, cookie.slice("studio=".length), now))) return notFound();
  return studioApi(request, env, url).catch((e) => studioJson({ ok: false, error: String(e.message || e) }, 500));
}
export const studioJson = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...STUDIO_HEADERS, "Content-Type": "application/json; charset=utf-8" } });
export async function studioBody(request) {
  return request.json().catch(() => ({}));
}
export async function studioApi(request, env, url) {
  const get = request.method === "GET";
  const post = request.method === "POST";
  const path = url.pathname;
  if (get && path === "/studio") return new Response(STUDIO_HTML, { headers: { ...STUDIO_HEADERS, "Content-Type": "text/html; charset=utf-8" } });
  if (get && path === "/studio/api/options") return studioJson(await studioOptions(env));
  if (get && path === "/studio/api/log") return studioJson(await studioLog(env, url));
  if ((get || post) && path === "/studio/api/presets") return studioJson(await studioPresets(env, request));
  if (post && path === "/studio/api/compose") return studioJson(await studioCompose(env, await studioBody(request), await dayOutfits(env)));
  if (post && path === "/studio/api/draw") return studioJson(await studioDraw(env, await studioBody(request)));
  if (get && path.startsWith("/studio/img/")) return studioImage(env, path.slice("/studio/img/".length), url.searchParams.get("size"));
  if (get && path.startsWith("/studio/ref/")) {
    const bytes = await refBytes(env, decodeURIComponent(path.slice("/studio/ref/".length)));
    return bytes ? new Response(bytes, { headers: { ...STUDIO_HEADERS, "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=86400" } }) : studioJson({ ok: false, error: "no such reference" }, 404);
  }
  return new Response("not found", { status: 404, headers: STUDIO_HEADERS });
}
// The editor's lists: models, LoRAs (LORA_INFO), references, sizes, the nudity levels, the money today
export async function studioOptions(env) {
  const R = CONFIG.PICTURE.RUNWARE;
  const ledger = await loadLedger(env);
  return {
    ok: true,
    models: [{ id: "klein", label: "klein 9B (Runware, her face)", model: R.MODEL }, { id: "twinflow", label: "TwinFlow (Runware, text only)", model: R.BACKUP_MODEL }],
    loras: Object.entries(R.LORA_INFO || {}).map(([air, i]) => ({ air, name: i.name, category: i.category, trigger: i.trigger || "", note: i.note || "" })),
    refs: studioRefNames(),
    // the Body menu (owner 2026-10-12: body pictures under Body, hair pictures under Hair)
    bodies: [[R.BODY_CLOTHED, "clothed front (bra + briefs)"], [R.BODY, "nude front"], [R.BODY_BACK, "nude back (also clothed back views)"], [R.BODY_CLOTHED_BACK, "clothed back"]].filter(([n], i, a) => n && a.findIndex(([m]) => m === n) === i).map(([n, label]) => ({ name: `body-${n}`, label })),
    // the editor starts from the bot's own sampler and its every-picture LoRAs (LORAS)
    sampler: { steps: Number(R.STEPS) || 0, cfg: Number(R.CFG) || 0 },
    defaultLoras: Object.entries(R.LORAS || {}).map(([model, weight]) => ({ model, weight: Number(weight) })),
    sizes: [{ label: "9:16 (768 x 1344)", width: 768, height: 1344 }, { label: "1:1 (1024 x 1024)", width: 1024, height: 1024 }, { label: "16:9 (1344 x 768)", width: 1344, height: 768 }],
    levels: NSFW_LEVELS,
    usdPerPicture: Number(R.USD_PER_PICTURE) || 0,
    cap: { dailyUsd: CONFIG.STUDIO.DAILY_USD, spentUsd: ledger.studioUsd || 0, resultsMax: CONFIG.STUDIO.RESULTS_MAX },
  };
}
// The reference pictures the editor can send, by name: face-2x, body-<BODY name>, place:<key>, style:<key> (hairstyles). face-1x
// (Cloudflare's 480 px face) and body-cloudflare stay readable for old log rows, but are not offered (2026-10-12)
export function studioRefNames() {
  const R = CONFIG.PICTURE.RUNWARE;
  return [
    "face-2x", ...[...new Set([R.BODY, R.BODY_BACK, R.BODY_CLOTHED, R.BODY_CLOTHED_BACK])].filter(Boolean).map((n) => `body-${n}`),
    ...Object.keys(PLACE_JPEG_BASE64 || {}).filter((k) => !k.includes("~")).map((k) => `place:${k}`),
    ...Object.keys(STYLE_JPEG_BASE64 || {}).map((k) => `style:${k}`),
  ];
}
// One of the bot's plan tries as the editor reads it (no bytes)
export const planLine = (t) => ({ model: t.model, prompt: t.text, refs: t.refs.map((r) => r.name), loras: t.loras.map((l) => ({ model: l.model, weight: l.weight })), width: t.width, height: t.height, steps: t.steps || 0, cfg: t.cfg || 0, acceleration: t.acceleration || "", checkContent: !!t.checkContent });
// The editor's "compose": the bot's own plan for his words (customPicture, then drawPicture's plan with planOnly: no network,
// nothing logged). Only /pic words compose for now; the first try is the one the editor starts from.
export async function studioCompose(env, body, dayWear = null) {
  if (body.source !== "pic") return { ok: false, error: "Only /pic words compose for now (scene, look and selfie are not in the studio yet)." };
  const level = NSFW_LEVELS.includes(body.level) ? body.level : CONFIG.PICTURE.NSFW.DEFAULT;
  const words = picWords(String(body.words || "").slice(0, 1000), level);
  if (!words) return { ok: false, error: "Type the words first, as you would after /pic." };
  const c = customPicture(words, undefined, dayWear, level);
  const out = await drawPicture(env, c.prompt, { location: c.location, night: c.night, ledger: { rwUsd: 0, rwFailed: 0 }, custom: true, nsfw: level, planOnly: true });
  // at Off (NSFW.OFF_ROUTE "cloudflare") the bot draws on Cloudflare klein: its prompt and references, named as the studio sends them
  const reason = (out.plan || []).length ? "" : !env.RUNWARE_API_KEY ? "RUNWARE_API_KEY is not set, so there is no Runware plan." : level === "off" ? "" : "Runware isn't the picture route for these words.";
  return { ok: true, level, tries: (out.plan || []).map(planLine), cloudflare: out.cloudflare || null, reason, location: c.location || null };
}
// The studio's own draw: one Runware task with `results` pictures, the editor's prompt, references, LoRAs and sampler. Stops
// at STUDIO.DAILY_USD (ledger studioUsd, read again before the write). Each picture is a row in the log (source "studio") and
// its bytes are kept in KV simg:<id> for IMG_DAYS (without D1 they come back inline as data:).
export async function studioDraw(env, body, now = Date.now()) {
  const R = CONFIG.PICTURE.RUNWARE;
  const S = CONFIG.STUDIO;
  if (!env.RUNWARE_API_KEY) return { ok: false, error: "RUNWARE_API_KEY is not set: the studio draws with Runware." };
  const prompt = String(body.prompt || "").trim().slice(0, 4000);
  if (!prompt) return { ok: false, error: "The prompt is empty." };
  const modelId = body.model === "twinflow" ? "twinflow" : "klein";
  const model = modelId === "twinflow" ? R.BACKUP_MODEL : R.MODEL;
  const results = intIn(body.results, 1, S.RESULTS_MAX, 1);
  const width = intIn(body.width, 256, 2048, 768);
  const height = intIn(body.height, 256, 2048, 1344);
  const steps = intIn(body.steps, 1, 50, 0);
  const cfg = Math.min(10, Math.max(0, Number(body.cfg) || 0));
  const acceleration = String(body.acceleration || "").trim().slice(0, 20);
  const seed = intIn(body.seed, 1, 2147483646, 0) || 1 + Math.floor(Math.random() * 2147483646);
  const loras = (Array.isArray(body.loras) ? body.loras : []).filter((l) => l && l.model && Number(l.weight) > 0).slice(0, 12).map((l) => ({ model: String(l.model).slice(0, 120), weight: Math.min(1.5, Number(l.weight)) }));
  const refs = [];
  for (const name of (Array.isArray(body.refs) ? body.refs : []).slice(0, 4).map(String)) {
    const bytes = await refBytes(env, name);
    if (bytes) refs.push({ name, bytes });
  }
  const ledger = await loadLedger(env);
  const estimate = (Number(R.USD_PER_PICTURE) || 0.004) * results;
  if ((ledger.studioUsd || 0) + estimate > S.DAILY_USD) {
    return { ok: false, error: `The studio's money for today is spent: ${money4(ledger.studioUsd)} of $${S.DAILY_USD}. It starts again at 00:00 UTC.`, studioUsd: ledger.studioUsd || 0, cap: S.DAILY_USD };
  }
  const started = Date.now();
  let out;
  try {
    out = await drawRunware(env, model, prompt, refs.map((r) => r.bytes), width, height, { loras, seed, steps, cfg, acceleration, checkContent: body.checkContent === true, results });
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
  const ms = Date.now() - started;
  const spent = out.pictures.reduce((sum, p) => sum + p.cost, 0);
  const after = await loadLedger(env); // read again right before the write: the bot saves this key too
  after.studioUsd = (after.studioUsd || 0) + spent;
  await saveLedger(env, after);
  const pictures = [];
  for (const p of out.pictures) {
    const row = { at: new Date(now).toISOString(), source: "studio", kind: "studio", nsfw: body.nsfw ? String(body.nsfw).slice(0, 10) : null, model, prompt, loras: JSON.stringify(loras), refs: JSON.stringify(refs.map((r) => r.name)), width, height, steps: steps || null, cfg: cfg || null, seed, cost: p.cost, ms, attempts: 1, ok: 1, error: null };
    const id = await logPicture(env, row);
    if (id && env.REEM_KV) await env.REEM_KV.put(`simg:${id}`, p.bytes, { expirationTtl: S.IMG_DAYS * 86400 });
    pictures.push(id ? { id, seed, cost: p.cost } : { id: null, seed, cost: p.cost, data: `data:image/jpeg;base64,${toBase64(p.bytes)}` });
  }
  return { ok: true, pictures, studioUsd: after.studioUsd, cap: S.DAILY_USD, model: modelId };
}
// The log, newest first, PAGE_ROWS a page. `before` = the last id of the page before; `source` filters
export async function studioLog(env, url) {
  if (!env.STUDIO_DB) return { ok: false, error: "No D1 binding (STUDIO_DB): the log is off." };
  await ensureStudioSchema(env);
  const where = [];
  const args = [];
  const before = Math.floor(Number(url.searchParams.get("before"))) || 0;
  const source = String(url.searchParams.get("source") || "").slice(0, 20);
  if (before > 0) {
    where.push("id < ?");
    args.push(before);
  }
  if (source) {
    where.push("source = ?");
    args.push(source);
  }
  const sql = `SELECT id, at, source, asked, her_words, llm_text, kind, nsfw, model, prompt, loras, refs, width, height, steps, cfg, seed, cost, ms, attempts, ok, error, tg_thumb IS NOT NULL AS has_tg FROM pictures${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY id DESC LIMIT ?`;
  const res = await env.STUDIO_DB.prepare(sql).bind(...args, CONFIG.STUDIO.PAGE_ROWS + 1).all();
  const rows = res.results || [];
  const page = rows.slice(0, CONFIG.STUDIO.PAGE_ROWS);
  return { ok: true, rows: page, next: rows.length > page.length ? page.at(-1).id : null };
}
// Presets: the editor's settings saved by name (D1 presets); GET lists the last 50, POST saves one
export async function studioPresets(env, request) {
  if (!env.STUDIO_DB) return { ok: false, error: "No D1 binding (STUDIO_DB): presets are off." };
  await ensureStudioSchema(env);
  if (request.method === "POST") {
    const body = await studioBody(request);
    const name = String(body.name || "").trim().slice(0, 80);
    const text = String(body.body || "").slice(0, 20000);
    if (!name || !text) return { ok: false, error: "A preset needs a name and a body." };
    await env.STUDIO_DB.prepare("INSERT INTO presets (at, author, name, body) VALUES (?, ?, ?, ?)").bind(new Date().toISOString(), "studio", name, text).run();
    return { ok: true };
  }
  const res = await env.STUDIO_DB.prepare("SELECT id, at, name, body FROM presets ORDER BY id DESC LIMIT 50").all();
  return { ok: true, presets: res.results || [] };
}
// A studio picture: KV simg:<id> (the studio's draws), else Telegram's own copy of the bot's picture (tg_thumb, tg_full)
export async function studioImage(env, id, size) {
  const notFound = () => new Response("not found", { status: 404, headers: STUDIO_HEADERS });
  if (!/^\d+$/.test(id)) return notFound();
  const image = (body) => new Response(body, { headers: { ...STUDIO_HEADERS, "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=86400" } });
  const kept = await env.REEM_KV.get(`simg:${id}`, "arrayBuffer");
  if (kept) return image(kept);
  if (!env.STUDIO_DB) return notFound();
  await ensureStudioSchema(env);
  const row = await env.STUDIO_DB.prepare("SELECT tg_thumb, tg_full FROM pictures WHERE id = ?").bind(Number(id)).first();
  const fileId = row && (size === "full" ? row.tg_full || row.tg_thumb : row.tg_thumb || row.tg_full);
  if (!fileId) return notFound();
  const f = await tg(env, "getFile", { file_id: fileId });
  if (!f.ok) return notFound();
  const res = await xfetch(`https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${f.result.file_path}`);
  return res.ok ? image(res.body) : notFound();
}
