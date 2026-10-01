// End-to-end run with mocked Telegram/OpenRouter/ElevenLabs/KV/queue: node tools/test/e2e.mjs (read the printed log)
globalThis.setTimeout = (f) => { f(); return 0; };
let seed = 7; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const RealDate = Date; let clock = RealDate.UTC(2026, 9, 1, 8, 0);
globalThis.Date = class extends RealDate { constructor(...a){ super(...(a.length?a:[clock])); } static now(){ return clock; } };
const log = []; let llm = []; const prompts = [];
globalThis.fetch = async (url, init = {}) => {
  let body = init.body;
  if (body instanceof FormData) { const o={}; for (const [k,v] of body) o[k]= typeof v==="string"?v:"<blob>"; body=JSON.stringify(o); }
  const j = (o, status=200) => new Response(JSON.stringify(o), { status });
  if (url.includes("openrouter")) {
    const b = JSON.parse(init.body); prompts.push(b);
    if (b.messages.some(m => m.at !== undefined)) throw new Error("history 'at' leaked to OpenRouter");
    const next = llm.shift() ?? { content: "hey you\n\nwhat are you doing up" };
    return j({ choices: [{ message: { content: next.content }, finish_reason: next.finish || "stop" }] });
  }
  log.push(url.replace(/bot[^/]+/, "botTOKEN").replace("https://api.","") + " " + (body || "").slice(0, 160));
  if (url.includes("getFile")) return j({ ok: true, result: { file_path: "voice/a.oga" } });
  if (url.includes("/file/")) return new Response("audio");
  if (url.includes("speech-to-text")) return j({ text: "hello there (laughs)" });
  if (url.includes("text-to-speech")) return new Response("mp3");
  return j({ ok: true, result: {} });
};
const store = new Map();
const kv = { async get(k, t){ const v = store.get(k); return v==null?null: t==="json"?JSON.parse(v):v; }, async put(k,v){ store.set(k,v); }, async delete(k){ store.delete(k); } };
const queued = [];
const env = { TELEGRAM_BOT_TOKEN: "t", OPENROUTER_API_KEY: "o", ELEVENLABS_API_KEY: "e", REEM_KV: kv, OWNER_ID: "7",
  REEM_QUEUE: { async send(b){ queued.push(b); } }, CONFIG_OVERRIDES: JSON.stringify({ PROACTIVE: { CHANCE: 1 } }) };
import { loadWorker } from "./load-worker.mjs";
const mod = (await loadWorker()).default;
const ctx = { waitUntil(){} };
let uid = 1;
const msg = (m) => ({ body: { update_id: uid++, message: { chat: { id: 7, type: "private" }, from: { id: 7 }, date: clock/1000, ...m } }, ack(){} });
const run = (...ms) => mod.queue({ messages: ms }, env, ctx);
const step = (t) => log.push(`--- ${t}`);
const sys = () => prompts.at(-1).messages[0].content.split("LIMITS & OOC")[1];

step("old history without times (pre-v8)");
store.set("h:7", JSON.stringify([{ role: "assistant", content: "old hi" }]));
await run(msg({ text: "hi" }));
step("restart"); await run(msg({ text: "/start" }));
console.log("nudge after intro:", /in person/.test(sys()) ? "?" : "", "");
step("in person: he acts");
llm = [{ content: "[voice] come here... ya3ni" }];
await run(msg({ text: "*steps closer*" }));
console.log("scene nudge:", sys().includes("Your last exchange was in person"), "| voice blocked in scene:", !log.some(l => l.includes("sendVoice")));
step("cut-off scene");
llm = [{ content: "*She pulls you in. Her lips brush your ear as she whis", finish: "length" }];
await run(msg({ text: "*kisses her*" }));
console.log("trimmed:", log.filter(l => l.includes("sendMessage")).at(-1));
step("apart voice note with arabizi");
clock += 3 * 3600e3;
llm = [{ content: "[voice] ya3ni... 7abibi you left so fast. it's 3am energy already" }];
await run(msg({ voice: { file_id: "f", duration: 4 } }));
console.log("apart nudge:", sys().includes("You're apart right now"), "| doing:", /usually ([^.]*)/.exec(sys())[1]);
console.log("tts:", log.find(l => l.includes("text-to-speech")).slice(0, 140));
console.log("stt lang omitted:", !log.find(l => l.includes("speech-to-text")).includes("language_code"), "| tagged:", log.find(l => l.includes("speech-to-text")).includes('"tag_audio_events":"true"'));
step("cron: too soon"); queued.length = 0; await mod.scheduled({}, env, ctx); console.log("queued too soon:", queued.length);
step("cron: after 4h"); clock += 4 * 3600e3; await mod.scheduled({}, env, ctx); console.log("queued after 4h:", JSON.stringify(queued));
llm = [{ content: "ok basbousa just knocked my plant over\n\nwhere did you disappear to" }];
await mod.queue({ messages: queued.splice(0).map(b => ({ body: b, ack(){} })) }, env, ctx);
console.log("proactive prompt:", prompts.at(-1).messages.at(-1).content);
const h = JSON.parse(store.get("h:7")); console.log("last entry proactive:", h.at(-1).proactive === true, "| entries have at:", h.every(e => e.at), "| settings:", store.get("s:7"));
step("cron again: unanswered"); await mod.scheduled({}, env, ctx); console.log("queued while unanswered:", queued.length);
step("he answers"); await run(msg({ text: "sorry was at work" }));
console.log("sampling:", JSON.stringify({ t: prompts.at(-1).temperature, rp: prompts.at(-1).repetition_penalty, mt: prompts.at(-1).max_tokens, model: prompts.at(-1).model }));
step("model down -> line dropped");
globalThis.fetch = ((f) => async (url, init) => url.includes("openrouter") ? new Response("{}", { status: 503 }) : f(url, init))(globalThis.fetch);
await run(msg({ text: "you there?" }));
console.log(log.filter(l => l.startsWith("---") || l.includes("sendMessage") || l.includes("sendVoice") || l.includes("text-to-speech")).join("\n"));
