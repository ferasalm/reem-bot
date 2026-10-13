// Step D bench (picture overhaul, 2026-10-13): her pictures through the bot's own startPicture (the picture writer, the draw, the anatomy
// check and its redraws), on Cloudflare klein 4B at /nsfw Off (where the owner saw anatomy mistakes in almost every picture) and two
// Runware sex acts at On (does the check false-alarm on acts?). Workers AI through the REST API, Runware with its own key. Every drawn try
// and every check answer is saved to OUT (try files <case>-r<run>-t<n>.jpg, results.json). Runs in .github/workflows/stepd-bench.yml.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadWorker } from "../test/load-worker.mjs";

const W = await loadWorker();
const OUT = process.env.OUT || "stepd";
const RUNS = Number(process.env.RUNS) || 2;
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
mkdirSync(OUT, { recursive: true });

let current = null; // { id, tries: [], checks: [], writer: [] }
const cf = (model) => `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`;
const store = new Map();
const env = {
  RUNWARE_API_KEY: process.env.RUNWARE_API_KEY,
  REEM_KV: { get: async (k, t) => (store.has(k) ? (t === "json" ? JSON.parse(store.get(k)) : store.get(k)) : null), put: async (k, v) => void store.set(k, v), delete: async (k) => void store.delete(k) },
  AI: {
    async run(model, input) {
      if (input && input.multipart) {
        // klein on Cloudflare: the multipart form as the Worker builds it
        const res = await fetch(cf(model), { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": input.multipart.contentType }, body: input.multipart.body, duplex: "half" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) throw new Error(`${res.status} ${JSON.stringify(data.errors || data).slice(0, 300)}`);
        current.tries.push({ model, neurons: res.headers.get("cf-ai-neurons"), bytes: Buffer.from(data.result.image, "base64") });
        return data.result;
      }
      const res = await fetch(cf(model), { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(`${res.status} ${JSON.stringify(data.errors || data).slice(0, 300)}`);
      const r = data.result || {};
      const text = String(r.response ?? r.choices?.[0]?.message?.content ?? "");
      if (Array.isArray(input.messages) && Array.isArray(input.messages[0]?.content)) current.checks.push(text); // the anatomy check
      else current.writer.push(text);
      return r;
    },
  },
};
// Runware's pictures: every try saved too
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  const res = await realFetch(url, init);
  if (String(url) === "https://api.runware.ai/v1") {
    const body = await res.clone().json().catch(() => ({}));
    const d = (body.data || [])[0];
    if (d && d.imageBase64Data) current.tries.push({ model: "runware", cost: d.cost, bytes: Buffer.from(d.imageBase64Data, "base64") });
  }
  return res;
};

const her = (content) => ({ role: "assistant", content });
const him = (content) => ({ role: "user", content });
const APART = [him("send me a pic"), her("fine. one.")];
const CASES = [
  { id: "off-counter", level: "off", kind: "selfie", want: "counter-sit, she's leaning against the kitchen counter, one leg bent up, wearing her father's old gray cardigan over a black cami, phone in hand, a small smirk", history: APART },
  { id: "off-mirror", level: "off", kind: "selfie", want: "mirror selfie in the hallway, full body, a long black slip dress", history: APART },
  { id: "off-couch", level: "off", kind: "selfie", want: "curled up on the couch in an oversized gray hoodie and black leggings, a mug in her hands", history: APART },
  { id: "off-doorframe", level: "off", kind: "scene", want: "*She leans against the doorframe, her dark waves loose over one shoulder, a slow smile on her lips.* \"like what you see?\"", history: [him("*steps closer* let me see you")] },
  { id: "off-kitchen", level: "off", kind: "scene", want: "*You wrap your arms around her waist and she leans back into you, stirring the pot, her black ribbed tank top and gray sweatpants dusted with flour.* \"you're in my way.\"", history: [him("*comes up behind you at the stove*")] },
  { id: "on-riding", level: "on", kind: "scene", want: "*She rides you slowly on the sofa, naked, her hands braced on your chest, head thrown back.* \"right there.\"", history: [her("*She straddles you on the sofa, already naked, guiding you inside her.*"), him("*grabs your hips*")], runs: 1 },
];
const results = [];
for (const c of CASES) {
  for (let run = 1; run <= (c.runs || RUNS); run++) {
    current = { id: `${c.id}-r${run}`, tries: [], checks: [], writer: [] };
    const ledger = { day: "", neurons: 0, out: false, rwUsd: 0, rwFailed: 0, usd: 0, recent: [], shots: [], hashes: [] };
    W.budget.reset();
    const t0 = Date.now();
    let pic = null;
    let error = "";
    try {
      pic = await W.startPicture(env, ledger, c.kind, c.want, { history: [...c.history, ...(c.kind === "scene" ? [her(c.want)] : [])], nsfw: c.level, source: "bench" });
    } catch (e) {
      error = String(e.message || e);
    }
    const sent = pic && pic.bytes ? Buffer.from(pic.bytes) : null;
    const files = current.tries.map((t, i) => {
      const f = `${current.id}-t${i + 1}.jpg`;
      writeFileSync(join(OUT, f), t.bytes);
      return { file: f, model: t.model, neurons: t.neurons || null, cost: t.cost || null, sent: !!sent && sent.equals(t.bytes) };
    });
    const row = { id: current.id, level: c.level, kind: c.kind, seconds: Math.round((Date.now() - t0) / 100) / 10, writer: current.writer, prompt: pic && pic.prompt, tries: files, checks: current.checks.map((t) => ({ verdict: W.anatomyVerdict(t), text: t })), error, ledger: { neurons: ledger.neurons, rwUsd: ledger.rwUsd } };
    results.push(row);
    console.log(`\n### ${row.id} (${row.seconds} s): ${files.length} tries, sent ${files.findIndex((f) => f.sent) + 1}${error ? `, error ${error}` : ""}`);
    if (row.writer.length) console.log(`writer: ${row.writer.join(" | ").replace(/\n/g, " ")}`);
    row.checks.forEach((k, i) => console.log(`check ${i + 1}: ${k.verdict ? (k.verdict.ok ? "ok" : k.verdict.mistakes.join(", ")) : "unread"} | ${k.text.replace(/\n+/g, " | ").slice(0, 500)}`));
  }
}
writeFileSync(join(OUT, "results.json"), JSON.stringify(results, null, 1));
const all = results.flatMap((r) => r.checks);
console.log(`\n${results.length} pictures sent from ${results.reduce((n, r) => n + r.tries.length, 0)} tries; checks: ${all.length}, flagged ${all.filter((k) => k.verdict && !k.verdict.ok).length}`);
