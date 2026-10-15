// Do the hairstyle pictures (RUNWARE.STYLE_PICTURES) carry another woman's face into her pictures? (2026-10-15) A chest-up selfie
// with each hairstyle forced (HAIRSTYLES = that style, HAIR_CHANCE 1) through the bot's own /pic path, Runware klein 9B, fixed seed and
// random picks. Run it once with face.js as it is and once with an older face.js to compare: TAG names the output files.
//   TAG=masked NODE_USE_ENV_PROXY=1 node tools/face/hair-check.mjs <outdir>    paid: about $0.006 a picture (3 pictures)
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadWorker } from "../test/load-worker.mjs";

const OUT = process.argv[2];
if (!OUT) throw new Error("usage: hair-check.mjs <outdir>");
mkdirSync(OUT, { recursive: true });
const TAG = process.env.TAG || "now";
const SEED = Number(process.env.SEED) || 101;
const W = await loadWorker();
const P = W.CONFIG.PICTURE;
const WORDS = "a selfie, chest-up, close to her face, a plain white t-shirt, in her bedroom";
const FROZEN = Date.parse("2026-10-15T18:00:00Z");
const RealDate = Date;
globalThis.Date = class extends RealDate {
  constructor(...a) { if (a.length) super(...a); else super(FROZEN); }
  static now() { return FROZEN; }
};
const mulberry32 = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
let current = null;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  if (String(url) !== "https://api.runware.ai/v1") throw new Error(`unexpected request to ${url}`);
  const tasks = JSON.parse(init.body);
  for (const t of tasks) t.seed = SEED;
  const res = await realFetch(url, { ...init, body: JSON.stringify(tasks) });
  const text = await res.text();
  let d = {};
  try { d = (JSON.parse(text).data || [])[0] || {}; } catch {}
  current.calls.push({ status: res.status, cost: d.cost, refs: (tasks[0].inputs?.referenceImages || []).length });
  if (d.imageBase64Data && !current.bytes) current.bytes = d.imageBase64Data;
  return new Response(text, { status: res.status, headers: { "content-type": "application/json" } });
};
const env = {
  RUNWARE_API_KEY: "proxy-injected",
  REEM_KV: { get: async () => null, put: async () => {}, delete: async () => {}, list: async () => ({ keys: [] }) },
  AI: { run: async () => { throw new Error("Cloudflare is not called here"); } },
};
P.HAIR_CHANCE = 1;
let spent = 0;
for (const [key, style] of Object.entries(P.RUNWARE.STYLE_PICTURES)) {
  if (!key.startsWith("hair-")) continue;
  P.HAIRSTYLES = [style];
  Math.random = mulberry32(SEED);
  current = { calls: [], bytes: null };
  const p = W.customPicture(W.picWords(WORDS), undefined, null, "on");
  await W.drawPicture(env, p.prompt, { location: p.location, night: p.night, ledger: { rwUsd: 0, rwFailed: 0 }, custom: true, nsfw: "on" });
  if (current.bytes) writeFileSync(join(OUT, `${key}-${TAG}.jpg`), Buffer.from(current.bytes, "base64"));
  const c = current.calls.at(-1) || {};
  spent += Number(c.cost) || 0;
  console.log(`${key} ${TAG}: ${current.calls.map((x) => x.status).join(",")} $${c.cost} refs ${c.refs}`);
  await new Promise((r) => setTimeout(r, 4000));
}
console.log(`spent $${spent.toFixed(4)}`);
