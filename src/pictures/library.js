// The reference library (Rebuild Step 4, docs/WORKPLAN.md "Reference library"): outfit, hair and body pictures the owner approves in
// /studio. The catalog is D1 `refs` (id, kind, key, tags, parent, status, prompt, seed, cost, runware_uuid); the bytes are KV `ref:<id>`;
// Runware's imageUpload UUIDs are cached in KV `ruuid:<id>`. Nothing reaches the bot until status = "approved". Slot 0 (her face) never
// comes from here. Without a D1 binding the library is empty and every plan is the same as before.
import { CONFIG } from "../config/index.js";
import { toBase64, xfetch } from "../platform/http.js";
import { ensureStudioSchema } from "../platform/log.js";

export const REF_KINDS = ["outfit", "hair", "body"];
export const REF_STATUSES = ["candidate", "approved", "rejected", "retired"];
const UUID_TTL = 6 * 86400; // Runware keeps an uploaded image for days; a stale UUID is uploaded again (checked on the call, not assumed)
const norm = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
export const libName = (id) => `lib:${id}`;

/* --- the catalog --- */
let approvedCache = { at: 0, rows: [] };
// The approved entries the picture core picks from: [{ id, kind, key, tags }]; kept 60 s per isolate
export async function loadLibrary(env, now = Date.now()) {
  if (!env.STUDIO_DB) return [];
  if (now - approvedCache.at < 60000 && approvedCache.env === env.STUDIO_DB) return approvedCache.rows;
  try {
    await ensureStudioSchema(env);
    const res = await env.STUDIO_DB.prepare("SELECT id, kind, key, tags FROM refs WHERE status = ? ORDER BY id").bind("approved").all();
    const rows = (res.results || []).map((r) => ({ id: r.id, kind: r.kind, key: norm(r.key), tags: String(r.tags || "").split(",").map(norm).filter(Boolean) }));
    approvedCache = { at: now, rows, env: env.STUDIO_DB };
    return rows;
  } catch (e) {
    console.error("loadLibrary", e);
    return [];
  }
}
export const forgetLibrary = () => {
  approvedCache = { at: 0, rows: [] };
};
// An entry matches words when its key (or every word of one tag) is in them; the longest key wins, ties go to the oldest id
export function matchRef(lib, kind, text) {
  const t = ` ${norm(text)} `;
  if (!t.trim()) return null;
  let best = null;
  for (const r of lib || []) {
    if (r.kind !== kind) continue;
    const keys = [r.key, ...r.tags].filter(Boolean);
    const hit = keys.filter((k) => t.includes(` ${k} `)).sort((a, b) => b.length - a.length)[0];
    if (hit && (!best || hit.length > best.len)) best = { ref: r, len: hit.length };
  }
  return best ? best.ref : null;
}
export async function listRefs(env, { kind = "", status = "" } = {}) {
  if (!env.STUDIO_DB) return { ok: false, error: "No D1 binding (STUDIO_DB): the library is off." };
  await ensureStudioSchema(env);
  const where = [];
  const args = [];
  if (REF_KINDS.includes(kind)) (where.push("kind = ?"), args.push(kind));
  if (REF_STATUSES.includes(status)) (where.push("status = ?"), args.push(status));
  const res = await env.STUDIO_DB.prepare(`SELECT id, at, kind, key, tags, parent, status, prompt, seed, cost FROM refs${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY id DESC LIMIT 200`).bind(...args).all();
  return { ok: true, refs: res.results || [] };
}
export async function addCandidate(env, { kind, key, tags = "", parent = "", prompt = "", seed = 0, cost = 0, bytes }) {
  if (!env.STUDIO_DB || !env.REEM_KV) throw new Error("The library needs D1 (STUDIO_DB) and KV.");
  if (!REF_KINDS.includes(kind)) throw new Error(`kind must be one of ${REF_KINDS.join(", ")}`);
  await ensureStudioSchema(env);
  const res = await env.STUDIO_DB.prepare("INSERT INTO refs (at, kind, key, tags, parent, status, prompt, seed, cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(new Date().toISOString(), kind, String(key || "").slice(0, 160), String(tags || "").slice(0, 300), String(parent || "").slice(0, 80), "candidate", String(prompt).slice(0, 4000), seed || null, cost || 0).run();
  const id = res?.meta?.last_row_id;
  if (!id) throw new Error("the library could not save the candidate");
  await env.REEM_KV.put(`ref:${id}`, bytes);
  return id;
}
// Approve, reject or retire; or edit the key and tags (only these fields ever change). Returns the entry's new state.
export async function setRef(env, id, { status, key, tags } = {}) {
  if (!env.STUDIO_DB) throw new Error("No D1 binding (STUDIO_DB): the library is off.");
  await ensureStudioSchema(env);
  const n = Math.floor(Number(id));
  if (!(n > 0)) throw new Error("no such reference");
  const cur = await env.STUDIO_DB.prepare("SELECT id, kind, key, tags, status FROM refs WHERE id = ?").bind(n).first();
  if (!cur) throw new Error("no such reference");
  const next = {
    status: status === undefined ? cur.status : status,
    key: key === undefined ? cur.key : String(key).slice(0, 160),
    tags: tags === undefined ? cur.tags : String(tags).slice(0, 300),
  };
  if (!REF_STATUSES.includes(next.status)) throw new Error(`status must be one of ${REF_STATUSES.join(", ")}`);
  if (next.status === "approved" && !norm(next.key) && !String(next.tags).trim()) throw new Error("Give it a key or tags before approving: the bot picks a reference by them.");
  await env.STUDIO_DB.prepare("UPDATE refs SET status = ?, key = ?, tags = ? WHERE id = ?").bind(next.status, next.key, next.tags, n).run();
  forgetLibrary();
  return { id: n, kind: cur.kind, ...next };
}
export async function libraryBytes(env, id) {
  if (!env.REEM_KV) return null;
  const b = await env.REEM_KV.get(`ref:${id}`, "arrayBuffer");
  return b ? new Uint8Array(b) : null;
}

/* --- Runware UUIDs (imageUpload, once per reference) --- */
// The UUID of a library picture on Runware: cached in KV, else uploaded now. null when the upload fails (the caller sends the bytes).
export async function runwareUuid(env, id, bytes) {
  const key = `ruuid:${id}`;
  try {
    const kept = env.REEM_KV && (await env.REEM_KV.get(key));
    if (kept) return kept;
    const res = await xfetch("https://api.runware.ai/v1", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RUNWARE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify([{ taskType: "imageUpload", taskUUID: crypto.randomUUID(), image: `data:image/jpeg;base64,${toBase64(bytes)}` }]),
      signal: AbortSignal.timeout(20000),
    });
    const uuid = (await res.json().catch(() => ({}))).data?.[0]?.imageUUID;
    if (!res.ok || !uuid) return null;
    if (env.REEM_KV) await env.REEM_KV.put(key, uuid, { expirationTtl: UUID_TTL });
    return uuid;
  } catch {
    return null;
  }
}
export async function forgetUuid(env, id) {
  try {
    if (env.REEM_KV) await env.REEM_KV.delete(`ruuid:${id}`);
  } catch {}
}

/* --- a candidate drawn from a base picture (the studio's References tab, and the first batch) --- */
// `change` is the owner's (or Claude's) sentence ("the same body, now in a cream knit sweater and blue jeans, same pose, plain
// background"); `base` is a reference name refBytes knows (a body picture, her face, or a library picture). Returns { id, cost, seed }.
export async function composeCandidate(env, { base, kind, key, tags, change, seed = 0, draw, refBytes }) {
  const bytes = await refBytes(env, base);
  if (!bytes) throw new Error(`no such base picture: ${base}`);
  const s = Number(seed) || 1 + Math.floor(Math.random() * 2147483646);
  const R = CONFIG.PICTURE.RUNWARE || {};
  const prompt = String(change || "").trim();
  if (!prompt) throw new Error("Write the change first (what the picture should look like).");
  const out = await draw(env, R.MODEL, prompt, [bytes], R.WIDTH, R.HEIGHT, { seed: s });
  const id = await addCandidate(env, { kind, key, tags, parent: base, prompt, seed: s, cost: out.cost, bytes: out.bytes });
  return { id, cost: out.cost, seed: s };
}

/* --- the first batch of candidates (Step 4): drawn from the faceless clothed body (outfits), her face (hair) and the body picture --- */
// [{ base, kind, key, tags, change }]. base: a refBytes name ("body" = RUNWARE.BODY_CLOTHED's picture, "face" = the 2x face). Outfit and hair
// keys are the persona's own words, so the bot's wardrobe and hairstyle words match them. The body candidates use the owner's own words
// (DECISIONS 2026-10-13); the owner approves or rejects each.
export function firstBatch() {
  const P = CONFIG.PICTURE;
  const R = P.RUNWARE || {};
  const W = (P.WARDROBE && P.WARDROBE.EVERYDAY) || [];
  const H = P.HAIRSTYLES || [];
  const outfits = [2, 11, 7, 12].map((i) => W[i]).filter(Boolean);
  const hairs = [0, 1, 6, 8].map((i) => H[i]).filter(Boolean);
  const body = `body-${R.BODY_CLOTHED || R.BODY}`;
  return [
    ...outfits.map((o) => ({ base: body, kind: "outfit", key: o, tags: "everyday", change: `The same body, now in ${o}, same pose, plain background.` })),
    ...hairs.map((h) => ({ base: "face-2x", kind: "hair", key: h, tags: "hair", change: `The same woman, same face, her hair ${h}, same pose, plain background.` })),
    { base: body, kind: "body", key: "fuller body", tags: "body, fuller", change: "The same woman, same pose, plain background: narrow shoulders, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, feminine curves." },
    { base: `body-${R.BODY}`, kind: "body", key: "fuller nude front", tags: "body, fuller, nude", change: "The same woman, same pose, plain background: narrow shoulders, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, feminine curves." },
  ];
}
