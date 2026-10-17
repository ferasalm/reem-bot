// A new reference set through the bot's own /pic path (picWords → specFromWords → drawPicture with the spec) on Runware klein 9B
// (/nsfw On, seed 101, no anatomy check): a clothed front, a nude front, a nude back, a nude side view (2026-10-17: the v15 bodies).
//   NODE_USE_ENV_PROXY=1 node tools/face/newref-check.mjs <outdir>    paid: about $0.025
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadWorker } from "../test/load-worker.mjs";

const OUT = process.argv[2];
if (!OUT) throw new Error("usage: newref-check.mjs <outdir>");
mkdirSync(OUT, { recursive: true });
const W = await loadWorker();
W.CONFIG.PICTURE.ANATOMY.ON = false;
const CASES = [
  ["clothed-front", "a mirror selfie, standing, full body, a fitted black tank top and high-waisted jeans, her arms visible"],
  ["nude-front", "naked, standing, a mirror selfie in the bedroom mirror, full body"],
  ["nude-back", "a belfie, naked, standing in the bedroom"],
  ["nude-side", "naked, standing in the bedroom, side view, full body"],
];
let current = null;
let spent = 0;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  if (String(url) !== "https://api.runware.ai/v1") throw new Error(`unexpected request to ${url}`);
  const tasks = JSON.parse(init.body);
  for (const t of tasks) t.seed = 101;
  const res = await realFetch(url, { ...init, body: JSON.stringify(tasks) });
  const text = await res.text();
  let d = {};
  try { d = (JSON.parse(text).data || [])[0] || {}; } catch {}
  spent += Number(d.cost) || 0;
  current.calls.push({ status: res.status, cost: d.cost, prompt: tasks[0].positivePrompt, loras: (tasks[0].lora || []).map((l) => `${l.model}@${l.weight}`) });
  if (d.imageBase64Data && !current.bytes) current.bytes = d.imageBase64Data;
  return new Response(text, { status: res.status, headers: { "content-type": "application/json" } });
};
const env = {
  RUNWARE_API_KEY: "proxy-injected",
  REEM_KV: { get: async () => null, put: async () => {}, delete: async () => {}, list: async () => ({ keys: [] }) },
  AI: { run: async () => { throw new Error("Cloudflare is not called here"); } },
};
const rows = [];
for (const [id, words] of CASES) {
  current = { calls: [], bytes: null };
  const said = W.picWords(words, "on", {});
  const p = W.customPicture(said, undefined, null, "on");
  const spec = W.specFromWords(said, { source: "pic", level: "on" });
  await W.drawPicture(env, p.prompt, { location: p.location, night: p.night, ledger: { rwUsd: 0, rwFailed: 0 }, custom: true, nsfw: "on", spec }).catch((e) => console.log(id, "not drawn:", e.message));
  if (current.bytes) writeFileSync(join(OUT, `${id}.jpg`), Buffer.from(current.bytes, "base64"));
  rows.push({ id, words, calls: current.calls });
  console.log(id, current.calls.map((c) => `${c.status} $${c.cost}`).join(" "), "\n ", current.calls[0]?.prompt);
  await new Promise((r) => setTimeout(r, 4000));
}
writeFileSync(join(OUT, "runs.json"), JSON.stringify(rows, null, 2));
console.log(`spent $${spent.toFixed(4)}`);
