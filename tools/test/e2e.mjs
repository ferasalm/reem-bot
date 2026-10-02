// End-to-end run with mocked Telegram/OpenRouter/ElevenLabs/KV/queue: node tools/test/e2e.mjs (read the printed log)
// Every check prints true/false; a false anywhere fails the run (exit 1), so CI catches it
let failedChecks = 0; const realLog = console.log;
console.log = (...a) => { if (a.some((x) => x === false)) { failedChecks++; console.error("FAIL:", ...a); } realLog(...a); };
globalThis.setTimeout = (f) => { f(); return 0; };
let seed = 7; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const RealDate = Date; let clock = RealDate.UTC(2026, 9, 1, 8, 0);
globalThis.Date = class extends RealDate { constructor(...a){ super(...(a.length?a:[clock])); } static now(){ return clock; } };
const log = []; let llm = []; const prompts = []; const calls = []; let mid = 5000; let ttsFail = false;
globalThis.fetch = async (url, init = {}) => {
  let body = init.body;
  if (body instanceof FormData) { const o={}; for (const [k,v] of body) o[k]= typeof v==="string"?v:"<blob>"; body=JSON.stringify(o); }
  const j = (o, status=200) => new Response(JSON.stringify(o), { status });
  if (url.includes("openrouter")) {
    const b = JSON.parse(init.body); prompts.push(b);
    if (b.messages.some(m => m.at !== undefined)) throw new Error("history 'at' leaked to OpenRouter");
    if (b.messages[0].content.includes("private memory notes")) return j({ choices: [{ message: { content: "- notes" }, finish_reason: "stop" }] }); // memory folding
    const next = llm.shift() ?? { content: "hey you\n\nwhat are you doing up" };
    return j({ choices: [{ message: { content: next.content }, finish_reason: next.finish || "stop" }] });
  }
  log.push(url.replace(/bot[^/]+/, "botTOKEN").replace("https://api.","") + " " + (body || "").slice(0, 160));
  if (url.includes("api.telegram.org/bot")) calls.push({ m: url.split("/").pop(), b: JSON.parse(body || "{}") });
  if (url.includes("getFile")) return j({ ok: true, result: { file_path: "voice/a.oga" } });
  if (url.includes("/file/")) return new Response("audio");
  if (url.includes("speech-to-text")) return j({ text: "hello there (laughs)" });
  if (url.includes("text-to-speech")) return ttsFail ? j({ detail: { message: "invalid_api_key" } }, 401) : new Response("mp3");
  if (url.endsWith("/sendMessage") || url.endsWith("/sendVoice")) return j({ ok: true, result: { message_id: mid++ } });
  return j({ ok: true, result: true });
};
const store = new Map();
const kv = { async get(k, t){ const v = store.get(k); return v==null?null: t==="json"?JSON.parse(v):v; }, async put(k,v){ store.set(k,v); }, async delete(k){ store.delete(k); } };
const queued = [];
const env = { TELEGRAM_BOT_TOKEN: "t", OPENROUTER_API_KEY: "o", ELEVENLABS_API_KEY: "e", REEM_KV: kv, OWNER_ID: "7",
  REEM_QUEUE: { async send(b){ queued.push(b); } }, CONFIG_OVERRIDES: JSON.stringify({ PROACTIVE: { CHANCE: 1 }, VOICE: { CHANCE: 0, CHANCE_AFTER_VOICE: 0, CHANCE_MORE_VOICE: 0 } }) };
import { loadWorker } from "./load-worker.mjs";
const W = await loadWorker(); const mod = W.default;
const ctx = { waitUntil(){} };
let uid = 1;
const msg = (m) => ({ body: { update_id: uid, message: { message_id: 1000 + uid++, chat: { id: 7, type: "private" }, from: { id: 7 }, date: clock/1000, ...m } }, ack(){} });
const run = (...ms) => mod.queue({ messages: ms }, env, ctx);
const step = (t) => log.push(`--- ${t}`);
function tgFetchBody(part) { const l = log.filter((x) => x.includes(part)).at(-1); return l.slice(l.indexOf(" ") + 1); }
// Her own prompts (not memory folding or /auto drafts); the nudges after LIMITS & OOC (TOGETHER also names it)
const herPrompts = () => prompts.filter((p) => p.messages[0].content.includes("HOW YOU TALK"));
const sys = () => { const c = herPrompts().at(-1).messages[0].content; return c.slice(c.indexOf("LIMITS & OOC") + 12); };

step("old history without times (pre-v8)");
store.set("h:7", JSON.stringify([{ role: "assistant", content: "old hi" }]));
await run(msg({ text: "hi" }));
step("restart"); await run(msg({ text: "/start" }));
console.log("nudge after intro:", /in person/.test(sys()) ? "?" : "", "");
step("in person: he acts");
llm = [{ content: "[voice] come here... ya3ni" }];
await run(msg({ text: "*steps closer*" }));
console.log("scene nudge:", sys().includes("You're together in person"), "| voice blocked in scene:", !log.some(l => l.includes("sendVoice")));
console.log("scene nudge: third person:", sys().includes("in third person, present tense"), "| the act itself:", sys().includes("make it happen in the scene"));
step("cut-off scene");
llm = [{ content: "*She pulls you in. Her lips brush your ear as she whis", finish: "length" }];
await run(msg({ text: "*kisses her*" }));
console.log("trimmed:", log.filter(l => l.includes("sendMessage")).at(-1));
step("apart voice note with arabizi");
clock += 3 * 3600e3;
llm = [{ content: "[voice] ya3ni... 7abibi you left so fast. it's 3am energy already" }];
await run(msg({ voice: { file_id: "f", duration: 4 } }));
console.log("apart nudge:", sys().includes("You're apart right now"), "| doing:", /usually ([^.]*)/.exec(sys())[1]);
console.log("apart nudge: [voice] first:", sys().includes("its very first characters are [voice]"), "| scene in third person:", sys().includes("write a scene, narrated in third person"));
console.log("tts:", log.find(l => l.includes("text-to-speech")).slice(0, 140));
console.log("stt lang omitted:", !log.find(l => l.includes("speech-to-text")).includes("language_code"), "| tagged:", log.find(l => l.includes("speech-to-text")).includes('"tag_audio_events":"true"'));
step("webhook: /help skips the queue, /rewind doesn't");
{
  const secret = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("reem:t")))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const waits = []; const wctx = { waitUntil(p){ waits.push(p); } };
  const hook = (text) => mod.fetch(new Request("https://x/webhook", { method: "POST", headers: { "X-Telegram-Bot-Api-Secret-Token": secret }, body: JSON.stringify(msg({ text }).body) }), env, wctx);
  queued.length = 0; const before = calls.length;
  await hook("/help"); await Promise.all(waits);
  console.log("/help answered at once:", queued.length === 0 && calls.slice(before).some((c) => c.m === "sendMessage" && /How Reem works/.test(c.b.text)));
  await hook("/rewind");
  console.log("/rewind queued:", queued.length === 1);
  queued.length = 0;
}
step("cron: too soon"); queued.length = 0; await mod.scheduled({}, env, ctx); console.log("queued too soon:", queued.length);
step("cron: after 4h"); clock += 4 * 3600e3; await mod.scheduled({}, env, ctx); console.log("queued after 4h:", JSON.stringify(queued));
llm = [{ content: "ok basbousa just knocked my plant over\n\nwhere did you disappear to" }];
await mod.queue({ messages: queued.splice(0).map(b => ({ body: b, ack(){} })) }, env, ctx);
console.log("proactive prompt:", prompts.at(-1).messages.filter((m) => m.role === "user").at(-1).content);
const h = JSON.parse(store.get("h:7")); console.log("last entry proactive:", h.at(-1).proactive === true, "| entries have at:", h.every(e => e.at), "| settings:", store.get("s:7"));
step("cron again: unanswered"); await mod.scheduled({}, env, ctx); console.log("queued while unanswered:", queued.length);
step("he answers"); await run(msg({ text: "sorry was at work" }));
console.log("sampling:", JSON.stringify({ t: prompts.at(-1).temperature, rp: prompts.at(-1).repetition_penalty, mt: prompts.at(-1).max_tokens, model: prompts.at(-1).model }));
console.log("routing:", JSON.stringify({ provider: prompts.at(-1).provider, reasoning: prompts.at(-1).reasoning }));
step("v3 audio tags: voice note");
llm = [{ content: "[voice] [laughs] ya3ni you're ridiculous\n[whispers] come over" }];
await run(msg({ text: "i miss you" }));
const ttsLast = log.filter(l => l.includes("text-to-speech")).at(-1);
console.log("tags offered:", sys().includes("[moans softly]"), "| tts keeps tags:", ttsLast.includes('[laughs] Yaani you\'re ridiculous... [whispers] Come over.'), "| v3 stability only:", ttsLast.includes('"voice_settings":{"stability":0.5}'));
console.log("history has no tags:", JSON.parse(store.get("h:7")).at(-1).content);
step("v3 audio tags: text reply");
llm = [{ content: "[laughs] omg stop\n\nyou're the worst [sighs]" }];
await run(msg({ text: "lol" }));
console.log("texts have no tags:", !log.slice(-3).some(l => l.includes("sendMessage") && /\[(laughs|sighs)\]/.test(l)));
step("reaction + text");
W.CONFIG.REACTIONS.CHANCE = 1; // CONFIG_OVERRIDES is read once per run, so set it directly
llm = [{ content: "[react: ❤️] okay that was sweet\n\ndon't let it go to your head" }];
await run(msg({ text: "i got you the cake you wanted" }));
const reacts = () => log.filter(l => l.includes("setMessageReaction"));
console.log("react nudge:", sys().includes("[react: X]"), "| reaction:", reacts().at(-1), "| text clean:", !log.slice(-3).some(l => l.includes("react:")));
step("reaction only");
llm = [{ content: "[react: 😂]" }];
const before = log.length;
await run(msg({ text: "basbousa is wearing my sock" }));
console.log("reaction only:", reacts().at(-1).includes("🤣"), "| no text sent:", !log.slice(before).some(l => l.includes("sendMessage")), "| saved:", JSON.parse(store.get("h:7")).at(-1).content);
step("invalid emoji");
llm = [{ content: "[react: 🦖] lmao what" }];
const nReacts = reacts().length;
await run(msg({ text: "dinosaur noises" }));
console.log("invalid: no reaction:", reacts().length === nReacts, "| text:", log.filter(l => l.includes("sendMessage")).at(-1));
step("no reaction in a scene or when texting first");
llm = [{ content: "[react: 🔥] *She grins.*" }];
await run(msg({ text: "*knocks on your door*" }));
console.log("scene: no reaction:", reacts().length === nReacts, "| no react nudge:", !sys().includes("[react: X]"));
W.CONFIG.REACTIONS.CHANCE = 0.25;

step("memory folding: same model and routing");
const [hMax, hKeep] = [W.CONFIG.MEMORY.HISTORY_MAX, W.CONFIG.MEMORY.HISTORY_KEEP];
W.CONFIG.MEMORY.HISTORY_MAX = 4; W.CONFIG.MEMORY.HISTORY_KEEP = 2;
await run(msg({ text: "tell me about your day" }));
W.CONFIG.MEMORY.HISTORY_MAX = hMax; W.CONFIG.MEMORY.HISTORY_KEEP = hKeep;
const memoryCalls = prompts.filter(b => !b.messages[0].content.includes("HOW YOU TALK"));
console.log("memory folds:", memoryCalls.length, "| all DeepSeek + routed:", memoryCalls.length > 0 && memoryCalls.every(b => b.model === "deepseek/deepseek-v4-flash" && b.provider?.allow_fallbacks === false && b.reasoning?.enabled === false));

step("DeepSeek down: backup model answers");
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => url.includes("openrouter") && JSON.parse(init.body).model === W.CONFIG.LLM.MODEL ? new Response("{}", { status: 503 }) : realFetch(url, init);
const nPrompts = prompts.length, nSent = log.filter(l => l.includes("sendMessage")).length;
llm = [{ content: "sorry my phone died lol\n\nwhat did i miss" }];
await run(msg({ text: "hello??" }));
console.log("backup:", JSON.stringify({ model: prompts.at(-1).model, provider: prompts.at(-1).provider ?? null, reasoning: prompts.at(-1).reasoning ?? null }), "| backup calls:", prompts.length - nPrompts, "| replied:", log.filter(l => l.includes("sendMessage")).length > nSent);
globalThis.fetch = realFetch;


/* ---------------- v10 ---------------- */
const tgCalls = (m) => calls.filter((c) => c.m === m);
const lastSent = () => tgCalls("sendMessage").at(-1);
const hist = () => JSON.parse(store.get("h:7"));
const herPrompt = () => herPrompts().at(-1);
const userMsgs = () => herPrompt().messages.filter((m) => m.role === "user");
const upd = (o) => ({ body: { update_id: uid++, ...o }, ack(){} });
clock += 60e3;

step("help");
await run(msg({ text: "/help" }));
const help = lastSent().b.text;
console.log("help lists every command:", W.CONFIG.COMMANDS.every((c) => help.includes("/" + c.command)), "| explains rewind:", help.includes("/rewind to erase"));

step("name");
await run(msg({ text: "/name", from: { id: 7, first_name: "Omar" } }));
console.log("telegram name:", lastSent().b.text);
await run(msg({ text: "/name@reem_nabot Sam" }));
console.log("set:", lastSent().b.text);
await run(msg({ text: "hey" }));
console.log("name in prompt:", sys().includes("His name is Sam; call him that."));
await run(msg({ text: "/name reset" })); console.log("reset:", lastSent().b.text);

step("about");
await run(msg({ text: "/about I'm 31, an architect.\nI drive a black Jeep." }));
await run(msg({ text: "you up?" }));
console.log("about in prompt:", sys().includes("I drive a black Jeep."), "| shown:", (await run(msg({ text: "/about" })), lastSent().b.text.includes("black Jeep")));

step("auto: draft, another, send");
llm = [{ content: "Omar: \"knock knock. open up\"" }];
const nBefore = tgCalls("deleteMessages").length;
await run(msg({ text: "/auto tell her i'm outside" }));
const draft = lastSent();
console.log("draft:", draft.b.text, "| buttons:", JSON.stringify(draft.b.reply_markup.inline_keyboard[0].map((b) => b.callback_data)), "| idea in prompt:", prompts.at(-1).messages[0].content.includes("i'm outside"), "| command removed:", tgCalls("deleteMessages").length === nBefore + 1);
const draftId = JSON.parse(store.get("a:7")).id;
const tap = (data, id = draftId) => run(upd({ callback_query: { id: "cb" + uid, from: { id: 7 }, data, message: { message_id: id, chat: { id: 7, type: "private" } } } }));
llm = [{ content: "open the door, i brought koshary" }];
await tap("auto:again");
console.log("another:", tgCalls("editMessageText").at(-1).b.text);
llm = [{ content: "wait you did??\n\ncoming" }];
await tap("auto:send");
console.log("sent:", tgCalls("editMessageText").at(-1).b.text, "| she answered:", lastSent().b.text, "| saved as his turn:", hist().at(-2).content, hist().at(-2).parts[0].id === draftId);
await tap("auto:send"); console.log("stale tap:", lastSent().b.text);

step("he edits his latest message");
llm = [{ content: "same honestly" }];
await run(msg({ text: "i'm bored" }));
const boredId = hist().at(-2).parts[0].id; const herIds = hist().at(-1).parts.map((p) => p.id);
llm = [{ content: "then come over" }];
await run(upd({ edited_message: { message_id: boredId, chat: { id: 7, type: "private" }, from: { id: 7 }, date: clock / 1000, edit_date: clock / 1000, text: "i'm bored and lonely" } }));
console.log("old reply deleted:", JSON.stringify(tgCalls("deleteMessages").at(-1).b.message_ids) === JSON.stringify(herIds), "| asked again with:", userMsgs().at(-1).content, "| new reply:", lastSent().b.text, "| history:", hist().at(-2).content, "/", hist().at(-1).content);

step("/edit her message");
const lastHerId = hist().at(-1).parts[0].id;
await run(msg({ text: "/edit then COME over. now.", reply_to_message: { message_id: lastHerId, from: { id: 1, is_bot: true } } }));
const ed = tgCalls("editMessageText").at(-1).b;
console.log("edited:", ed.message_id === lastHerId, ed.text, "| history:", hist().at(-1).content);
await run(msg({ text: "/edit hi", reply_to_message: { message_id: boredId, from: { id: 7 } } })); console.log("his own:", lastSent().b.text);

step("/rewind to her message, then to his");
llm = [{ content: "ok" }]; await run(msg({ text: "omw" }));
llm = [{ content: "door's open" }]; await run(msg({ text: "*knocks*" }));
const len = hist().length; const sentBefore = tgCalls("sendMessage").length;
await run(msg({ text: "/rewind", reply_to_message: { message_id: lastHerId } }));
console.log("history cut to her message:", hist().length === len - 4 && hist().at(-1).parts[0].id === lastHerId, "| no new reply:", tgCalls("sendMessage").length === sentBefore, "| deleted:", tgCalls("deleteMessages").at(-1).b.message_ids.length);
llm = [{ content: "lonely? you? since when" }];
await run(msg({ text: "/rewind", reply_to_message: { message_id: boredId } }));
console.log("rewound to his: she answers again:", lastSent().b.text, "| history ends:", hist().at(-2).content, "/", hist().at(-1).content);
await run(msg({ text: "/rewind" })); console.log("no reply target:", lastSent().b.text);
await run(msg({ text: "/rewind", reply_to_message: { message_id: 1 } })); console.log("too old:", lastSent().b.text);

step("/retry");
const beforeRetry = hist().at(-1).parts.map((p) => p.id);
llm = [{ content: "since you started texting me at midnight" }];
await run(msg({ text: "/retry" }));
console.log("old deleted:", JSON.stringify(tgCalls("deleteMessages").at(-1).b.message_ids) === JSON.stringify(beforeRetry), "| new:", lastSent().b.text, "| one answer:", hist().at(-1).content, "| his turn kept:", hist().at(-2).content);

step("voice note when he asks (model forgets [voice] and narrates)");
llm = [{ content: "ok fine. laughs softly Just for you, habibi." }];
await run(msg({ text: "send me a voice note" }));
console.log("voice reminder:", herPrompt().messages.at(-1).content.startsWith("[This reply is a voice note"), "| max_tokens:", herPrompt().max_tokens, "| tts:", JSON.parse(tgFetchBody("text-to-speech")).text, "| sendVoice:", tgCalls("sendVoice").length > 0 || log.at(-1).includes("sendVoice"), "| saved:", hist().at(-1).content);

step("voice note fails: text instead, error kept for /setup");
ttsFail = true; llm = [{ content: "listen to this" }];
await run(msg({ text: "say it out loud" }));
ttsFail = false;
console.log("fallback text:", lastSent().b.text, "| voice_error:", store.get("voice_error"));

step("narrated texts are repaired");
clock += 3 * 3600e3;
llm = [{ content: "Reem raises an eyebrow, pops the lemon slice into her mouth.\n\n\"Mmmm, salted lemons are the new hotness, huh?\"" }, { content: "She grins at her phone. \"ok rebel\"" }];
await run(msg({ text: "salted lemon in my drink" }));
console.log("retried with format nudge:", herPrompt().messages[0].content.includes("Your last try read like a story"), "| sent:", lastSent().b.text);

step("scene narration gets italics");
llm = [{ content: "She takes the glass and smiles. \"Thanks.\" She leans on the counter." }];
await run(msg({ text: "*hands her a drink*" }));
console.log("scene:", lastSent().b.text, "| scene reminder:", herPrompt().messages.at(-1).content.startsWith("[You're together"), "| max_tokens:", herPrompt().max_tokens);

step("long history fits the context");
const long = Array.from({ length: 120 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "x".repeat(1500), at: clock }));
store.set("h:7", JSON.stringify(long));
await run(msg({ text: "hey" }));
const chars = herPrompt().messages.reduce((n, m) => n + m.content.length, 0);
console.log("prompt chars:", chars, "| under the limit:", chars < (W.CONFIG.LLM.CONTEXT_TOKENS - 220) * W.CONFIG.LLM.CHARS_PER_TOKEN, "| no parts/at leaked:", !prompts.some((p) => JSON.stringify(p).includes('"parts"')));

step("everything down: fallback line");
globalThis.fetch = ((f) => async (url, init) => url.includes("openrouter") ? new Response("{}", { status: 503 }) : f(url, init))(globalThis.fetch);
await run(msg({ text: "you there?" }));
console.log(log.filter(l => l.startsWith("---") || l.includes("setMessageReaction") || l.includes("sendMessage") || l.includes("sendVoice") || l.includes("text-to-speech")).join("\n"));
if (failedChecks) { console.error(`${failedChecks} e2e checks FAILED`); process.exit(1); }
