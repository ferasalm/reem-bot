// End-to-end run with mocked Telegram/OpenRouter/ElevenLabs/KV/queue: node tools/test/e2e.mjs (read the printed log)
// Every check prints true/false; a false anywhere fails the run (exit 1), so CI catches it
let failedChecks = 0; const realLog = console.log;
console.log = (...a) => { if (a.some((x) => x === false)) { failedChecks++; console.error("FAIL:", ...a); } realLog(...a); };
globalThis.setTimeout = (f) => { f(); return 0; };
let seed = 7; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const RealDate = Date; let clock = RealDate.UTC(2026, 9, 1, 8, 0);
globalThis.Date = class extends RealDate { constructor(...a){ super(...(a.length?a:[clock])); } static now(){ return clock; } };
const log = []; let llm = []; const prompts = []; const calls = []; let mid = 5000; let ttsFail = false; const orSpeech = []; let orSpeechFail = false;
const gemini = { mode: "fail", calls: [] };
globalThis.fetch = async (url, init = {}) => {
  let body = init.body;
  if (body instanceof FormData) { const o={}; for (const [k,v] of body) o[k]= typeof v==="string"?v:"<blob>"; body=JSON.stringify(o); }
  const j = (o, status=200) => new Response(JSON.stringify(o), { status });
  if (url.includes("openrouter.ai/api/v1/models/")) return j({ data: { endpoints: [{ provider_name: "Google" }] } }); // /setup: the lingerie model is listed
  if (url.endsWith("/getMe")) return j({ ok: true, result: { username: "reem_nabot" } });
  if (url.includes("openrouter.ai/api/v1/audio/speech")) {
    orSpeech.push(JSON.parse(init.body));
    return orSpeechFail ? new Response(JSON.stringify({ error: { message: "Provider returned 400" } }), { status: 400, headers: { "content-type": "application/json" } }) : new Response(JSON.parse(init.body).response_format === "pcm" ? new Uint8Array(new Int16Array(24000).map((_, i) => Math.round(8000 * Math.sin(i / 8))).buffer) : new Uint8Array(300), { headers: { "content-type": "audio/mpeg" } });
  }
  if (url.includes("openrouter") && JSON.stringify(JSON.parse(init.body).messages || []).includes("input_audio")) {
    gemini.calls.push(JSON.parse(init.body)); // HEARING.OR_MODEL hearing his voice note; "fail" unless a step says otherwise
    return gemini.mode === "hear" ? j({ choices: [{ message: { content: "Transcript: come over (laughs) yalla habibti" }, finish_reason: "stop" }] }) : j({ error: { message: "upstream down" } }, 503);
  }
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
  if (url.endsWith("/sendPhoto") && typeof body !== "string") { const id = mid++; return j({ ok: true, result: { message_id: id, photo: [{ file_id: `s${id}` }, { file_id: `p${id}` }] } }); }
  return j({ ok: true, result: true });
};
const store = new Map();
const kv = { async get(k, t){ const v = store.get(k); return v==null?null: t==="json"?JSON.parse(v):v; }, async put(k,v){ store.set(k,v); }, async delete(k){ store.delete(k); } };
const queued = [];
const env = { TELEGRAM_BOT_TOKEN: "t", OPENROUTER_API_KEY: "o", ELEVENLABS_API_KEY: "e", REEM_KV: kv, OWNER_ID: "7",
  REEM_QUEUE: { async send(b){ queued.push(b); } }, CONFIG_OVERRIDES: JSON.stringify({ PROACTIVE: { CHANCE: 1 }, VOICE: { CHANCE: 0, CHANCE_AFTER_VOICE: 0, CHANCE_MORE_VOICE: 0, SCENE_CHANCE: 0 } }) };
import { loadWorker } from "./load-worker.mjs";
const W = await loadWorker(); const mod = W.default;
W.CONFIG.VOICE.PROVIDER = "aura"; // the default is OpenRouter (Sulafat); the flows below were written for aura with ElevenLabs behind it, the OpenRouter step switches it itself
W.CONFIG.PICTURE.ROUTE = "cloudflare"; // the default is Runware klein (owner 2026-10-06); these flows were written for the Cloudflare route
W.CONFIG.DAY.WEATHER = false; W.CONFIG.DAY.PLAN = false; // her real day (DAY) is tested on its own: these count AI calls
{ const L = W.CONFIG.LLM; // the defaults are DeepSeek on Workers AI first, OpenRouter's the backup (owner 2026-10-06); these flows mock OpenRouter as the main
  Object.assign(L, { MODEL: L.BACKUP_MODEL, PROVIDER: L.BACKUP_PROVIDER, REASONING: L.BACKUP_REASONING, BACKUP_MODEL: "@cf/deepseek-ai/deepseek-v4-flash-0731", BACKUP_PROVIDER: {}, BACKUP_REASONING: {} });
  W.CONFIG.MEMORY.MODEL = L.MODEL; W.CONFIG.AUTO.MODEL = L.MODEL; W.CONFIG.HEARING.OR_FIRST = true; }
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
step("in person: he asks to hear her");
llm = [{ content: '*Reem pulls you closer.* "Come here," *she whispers.* "I missed you, 7abibi."' }];
await run(msg({ text: "*holds you* say it again" }));
{
  const tts = log.filter(l => l.includes("text-to-speech")).at(-1) || "";
  const h = JSON.parse(store.get("h:7")).at(-1);
  console.log("scene clip spoken:", /\[whispers\] Come here\./.test(tts) && /habibi/.test(tts) && !/pulls|Reem/.test(tts), "| sent after the scene:", log.findLastIndex(l => l.includes("sendVoice")) > log.findLastIndex(l => l.includes("sendMessage") && l.includes("she whispers")));
  console.log("clip in history for /rewind, not in what she reads back:", h.parts.length === 2 && h.parts[1].text === "" && typeof h.parts[1].id === "number" && !h.content.includes("voice"));
}
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
step("hearing: Whisper on Workers AI first, Scribe when it fails or the day's budget is spent");
{
  const aiCalls = []; let whisperFails = false;
  env.AI = { async run(model, input) { aiCalls.push({ model, input }); if (whisperFails) throw new Error("3040: capacity"); return { text: " come here you (whisper) " }; } };
  const scribeCalls = () => log.filter((l) => l.includes("speech-to-text")).length;
  let before = scribeCalls();
  llm = [{ content: "mm ok" }];
  await run(msg({ voice: { file_id: "w1", duration: 90 } }));
  const heard = JSON.parse(store.get("h:7")).filter((m) => m.role === "user").at(-1).content;
  console.log("whisper used:", aiCalls.at(-1)?.model === "@cf/openai/whisper-large-v3-turbo", "| scribe not called:", scribeCalls() === before,
    "| heard:", heard.includes("come here you (whisper)"), "| hint + vad:", aiCalls.at(-1).input.initial_prompt === "Reem, habibi, yaani, khalas." && aiCalls.at(-1).input.vad_filter === true,
    "| 90 s counted:", JSON.parse(store.get("pics")).neurons >= 71);
  whisperFails = true; before = scribeCalls();
  llm = [{ content: "mm ok" }];
  await run(msg({ voice: { file_id: "w2", duration: 3 } }));
  console.log("whisper fails -> scribe:", scribeCalls() === before + 1, "| error kept for /setup:", JSON.parse(store.get("ai_error")).error.includes("used scribe_v2"));
  whisperFails = false; const n = aiCalls.length; before = scribeCalls();
  const pics = JSON.parse(store.get("pics")); store.set("pics", JSON.stringify({ ...pics, neurons: W.CONFIG.AI_BUDGET.DAILY_NEURONS }));
  llm = [{ content: "mm ok" }];
  await run(msg({ voice: { file_id: "w3", duration: 3 } }));
  console.log("budget spent -> scribe, no whisper:", aiCalls.length === n && scribeCalls() === before + 1);
  store.delete("pics");
  // owner 2026-10-05: "Go with Gemini 3.8 flash for voice": Gemini hears first, Whisper only when it fails
  store.delete("pics"); delete env.AI;
}
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
await run(msg({ text: "i miss you, send me a voice note" })); // he asks: her own [voice] right after one would be a text (SELF_CHOICE_GAP)
const ttsLast = log.filter(l => l.includes("text-to-speech")).at(-1);
console.log("tags offered (aura: only what it performs):", herPrompts().at(-1).messages.some((m) => m.content.includes("only from: [chuckles].")) && !herPrompts().at(-1).messages.some((m) => m.content.includes("[moans softly]")), "| tts keeps tags:", ttsLast.includes('[laughs] Yaani you\'re ridiculous... [whispers] Come over.'), "| v3 stability only:", ttsLast.includes('"voice_settings":{"stability":0.5}'));
console.log("history has no tags:", JSON.parse(store.get("h:7")).at(-1).content);
step("aura voice: Workers AI speaks, tags become cues, counted; ElevenLabs when aura fails or the budget is spent");
{
  const aiCalls = []; let auraFails = false;
  env.AI = { async run(model, input, options) { aiCalls.push({ model, input, options }); if (auraFails) throw new Error("3040: capacity"); return new Response(new Uint8Array(400), { headers: { "content-type": "audio/ogg" } }); } };
  const eleven = () => log.filter((l) => l.includes("text-to-speech")).length;
  const voices = () => calls.filter((c) => c.m === "sendVoice").length;
  let before = eleven(), sent = voices();
  llm = [{ content: "[voice] [chuckles] 7abibi you're blushing\n[laughs] [whispers] knock on my door" }];
  await run(msg({ text: "send me a voice note" }));
  const a = aiCalls.at(-1);
  console.log("aura used:", a?.model === "@cf/deepgram/aura-2-en" && a.input.speaker === "andromeda" && a.input.encoding === "opus" && a.input.container === "ogg" && a.options?.returnRawResponse === true,
    "| cues, no tags:", a?.input.text === "Hm... Habibi you're blushing... Knock on my door.", "| ElevenLabs not called:", eleven() === before, "| voice sent:", voices() === sent + 1,
    "| counted:", JSON.parse(store.get("pics")).neurons >= Math.ceil(a.input.text.length / 1000 * 2728));
  auraFails = true; before = eleven(); sent = voices();
  llm = [{ content: "[voice] come over" }];
  await run(msg({ text: "send me a voice note" }));
  console.log("aura fails -> ElevenLabs:", eleven() === before + 1 && voices() === sent + 1, "| error kept for /setup:", JSON.parse(store.get("ai_error")).error.includes("ElevenLabs spoke it"));
  auraFails = false; const n = aiCalls.length; before = eleven();
  const pics = JSON.parse(store.get("pics")); store.set("pics", JSON.stringify({ ...pics, neurons: W.CONFIG.AI_BUDGET.DAILY_NEURONS }));
  llm = [{ content: "[voice] the door is open" }];
  await run(msg({ text: "send me a voice note" }));
  console.log("budget spent -> ElevenLabs, no aura:", aiCalls.length === n && eleven() === before + 1);
  W.CONFIG.VOICE.ELEVENLABS_BACKUP = false; sent = voices();
  llm = [{ content: "[voice] basbousa misses you" }];
  await run(msg({ text: "send me a voice note" }));
  const last = calls.filter((c) => c.m === "sendMessage").at(-1);
  console.log("no backup, budget spent -> text:", voices() === sent && /basbousa misses you/i.test(last.b.text));
  W.CONFIG.VOICE.ELEVENLABS_BACKUP = true; store.delete("pics"); delete env.AI;
}
step("OpenRouter voice: VOICE.PROVIDER openrouter, its own tags, its money cap; ElevenLabs when it fails");
{
  const V = W.CONFIG.VOICE; V.PROVIDER = "openrouter";
  const gemini = { m: V.OR_MODEL, v: V.OR_VOICE, f: V.OR_FORMAT, c: V.OR_CUES, i: V.OR_INSTRUCTIONS };
  Object.assign(V, { OR_MODEL: "x-ai/grok-voice-tts-1.0", OR_VOICE: "ara", OR_FORMAT: "mp3", OR_CUES: { laughs: "[laugh]", whispers: "" }, OR_INSTRUCTIONS: "" }); // the Grok settings: its tags, MP3 as is
  const eleven = () => log.filter((l) => l.includes("text-to-speech")).length;
  let before = eleven(); const sent = calls.filter((c) => c.m === "sendVoice").length;
  llm = [{ content: "[voice] [laughs] look at you\n[whispers] my door is unlocked" }];
  await run(msg({ text: "send me a voice note" }));
  const b = orSpeech.at(-1);
  console.log("OpenRouter used:", b?.model === V.OR_MODEL && b.voice === V.OR_VOICE && b.response_format === "mp3", "| its tags:", b?.input === "[laugh] Look at you... My door is unlocked.", "| ElevenLabs not called:", eleven() === before,
    "| sent:", calls.filter((c) => c.m === "sendVoice").length === sent + 1, "| money counted:", JSON.parse(store.get("pics")).voiceUsd > 0);
  orSpeechFail = true; before = eleven();
  llm = [{ content: "[voice] the hallway light is out again" }];
  await run(msg({ text: "send me a voice note" }));
  console.log("OpenRouter fails -> ElevenLabs:", eleven() === before + 1, "| kept for /setup:", JSON.parse(store.get("voice_error")).error.includes("Provider returned 400"));
  orSpeechFail = false; const n = orSpeech.length; before = eleven();
  store.set("pics", JSON.stringify({ ...JSON.parse(store.get("pics")), voiceUsd: V.OR_DAILY_USD }));
  llm = [{ content: "[voice] i made too much tabbouleh" }];
  await run(msg({ text: "send me a voice note" }));
  console.log("money spent -> ElevenLabs, OpenRouter not called:", orSpeech.length === n && eleven() === before + 1);
  // owner 2026-10-06: the backups on Cloudflare: with the AI binding, aura speaks it when OpenRouter fails; ElevenLabs only after aura
  {
    const auraCalls = []; env.AI = { async run(model, input, options) { auraCalls.push(model); return new Response(new Uint8Array(400), { headers: { "content-type": "audio/ogg" } }); } };
    store.set("pics", JSON.stringify({ ...JSON.parse(store.get("pics")), voiceUsd: 0 }));
    orSpeechFail = true; before = eleven(); const sentA = calls.filter((c) => c.m === "sendVoice").length;
    llm = [{ content: "[voice] the radiator is singing again" }];
    await run(msg({ text: "send me a voice note" }));
    console.log("OpenRouter fails -> aura (Workers AI):", auraCalls.includes(V.AURA_MODEL) && eleven() === before && calls.filter((c) => c.m === "sendVoice").length === sentA + 1, "| kept for /setup:", JSON.parse(store.get("voice_error")).error.includes("aura spoke it"));
    orSpeechFail = false; delete env.AI;
  }
  // Gemini (the default): raw PCM asked for, MP3 made in the Worker, its own tags
  Object.assign(V, { OR_MODEL: gemini.m, OR_VOICE: gemini.v, OR_FORMAT: gemini.f, OR_CUES: gemini.c, OR_INSTRUCTIONS: gemini.i });
  store.set("pics", JSON.stringify({ ...JSON.parse(store.get("pics")), voiceUsd: 0 }));
  llm = [{ content: "[voice] [laughs] stop it\n[whispers] come closer" }];
  const sent2 = calls.filter((c) => c.m === "sendVoice").length;
  await run(msg({ text: "send me a voice note" }));
  const g = orSpeech.at(-1);
  console.log("Gemini asked for pcm with Sulafat:", g?.model === "google/gemini-3.8-flash-tts" && g.voice === "Sulafat" && g.response_format === "pcm" && /Reem/.test(g.instructions), "| its tags:", g?.input === "[laughs] Stop it... [whispers] Come closer.", "| sent:", calls.filter((c) => c.m === "sendVoice").length === sent2 + 1);
  V.PROVIDER = "aura"; store.delete("pics");
}
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

step("he asks her over while apart: she goes (TEXTING.VISIT_CHANCE), a text is asked again");
clock += 3 * 3600e3; W.CONFIG.TEXTING.VISIT_CHANCE = 1;
llm = [{ content: "door's unlocked\n\ncome" }, { content: '*Reem crosses the landing in her socks and knocks on your door, twice.* "You asked."' }];
await run(msg({ text: "Come over habibi" }));
{
  const visit = herPrompts().slice(-2);
  console.log("visit format:", visit[0].messages.at(-1).content.includes("crossing the landing"), "| asked again:", visit[1].messages[0].content.includes("Go to him now"),
    "| scene sent:", tgFetchBody("sendMessage").includes("crosses the landing"));
}
W.CONFIG.TEXTING.VISIT_CHANCE = 0; clock += 3 * 3600e3;

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
const firstSys = prompts.at(-1).messages[0].content;
const moveOf = (t) => [...W.CONFIG.AUTO.MOVES, ...W.CONFIG.AUTO.HOT_MOVES].find((m) => t.includes(m));
await tap("auto:again");
const againSys = prompts.at(-1).messages[0].content + prompts.at(-1).messages[1].content;
console.log("another:", tgCalls("editMessageText").at(-1).b.text, "| a move each time:", !!moveOf(firstSys) && !!moveOf(againSys), "| another move:", moveOf(firstSys) !== moveOf(againSys), "| the skipped draft in the prompt:", againSys.includes("- \"knock knock. open up\"") || againSys.includes("- knock knock. open up"));
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

step("hearing: Gemini (HEARING.OR_MODEL) first, Whisper when it fails or the note is too long");
{
  const aiCalls = []; env.AI = { async run(model, input) { aiCalls.push({ model, input }); return { text: "whisper heard it" }; } };
  const scribeCalls = () => log.filter((l) => l.includes("speech-to-text")).length; let before;
  clock += 3600e3; const picsOn = W.CONFIG.PICTURE.ENABLED; W.CONFIG.PICTURE.ENABLED = false; // only hearing here
  gemini.mode = "hear"; gemini.calls.length = 0; const w = aiCalls.length; before = scribeCalls();
  llm = [{ content: "on my way up" }];
  await run(msg({ voice: { file_id: "g1", duration: 5 } }));
  const g = gemini.calls.at(-1); const heardG = JSON.parse(store.get("h:7")).filter((m) => m.role === "user").at(-1).content;
  console.log("gemini hears first:", gemini.calls.length === 1 && g.model === W.CONFIG.HEARING.OR_MODEL && g.messages[0].content[1].input_audio.format === "ogg",
    "| laugh + arabizi kept, label dropped:", heardG.includes("come over (laughs) yalla habibti") && !heardG.includes("Transcript"), "| no whisper, no scribe:", aiCalls.length === w && scribeCalls() === before);
  llm = [{ content: "long one" }];
  await run(msg({ voice: { file_id: "g2", duration: W.CONFIG.HEARING.OR_MAX_SECONDS + 1 } }));
  console.log("too long for gemini -> whisper:", gemini.calls.length === 1 && aiCalls.length === w + 1);
  gemini.mode = "fail";
  llm = [{ content: "mm hm" }];
  await run(msg({ voice: { file_id: "g3", duration: 4 } }));
  console.log("gemini fails -> whisper:", gemini.calls.length === 2 && aiCalls.length === w + 2 && JSON.parse(store.get("ai_error")).error.includes(W.CONFIG.HEARING.OR_MODEL));
  W.CONFIG.PICTURE.ENABLED = picsOn; store.delete("pics"); delete env.AI;
}

step("long memory (RECALL, owner 2026-10-06): older moments found in Vectorize are put in her prompt; none after /restart");
{
  const rows = [{ id: "7:1", metadata: { chat: "7", who: "him", at: clock - 20 * 86400000, text: "my sister's wedding is in june and i'm the best man" } },
    { id: "9:1", metadata: { chat: "9", who: "him", at: clock - 20 * 86400000, text: "another chat's secret" } }];
  const queries = [];
  env.MEMORY_INDEX = { async upsert() {}, async query(vec, o) { queries.push(o); return { matches: rows.map((r) => ({ score: 0.8, ...r })).filter((m) => m.metadata.chat === o.filter.chat) }; } };
  env.AI = { async run(model, input) { if (input.text) return { data: input.text.map(() => new Array(1024).fill(0.01)) }; throw new Error("3040: capacity"); } };
  const picsOn = W.CONFIG.PICTURE.ENABLED; W.CONFIG.PICTURE.ENABLED = false; store.delete("rs:7");
  llm = [{ content: "the wedding. you nervous yet" }];
  await run(msg({ text: "remember what i told you about june?" }));
  console.log("recall in her prompt:", /THINGS FROM BEFORE[\s\S]*3 weeks ago, he said: "my sister's wedding/.test(sys()), "| only this chat:", !sys().includes("another chat") && queries.at(-1).filter.chat === "7");
  store.set("rs:7", String(clock)); // /restart (openStory) sets this: older moments are left out
  llm = [{ content: "june? tell me again" }];
  await run(msg({ text: "remember what i told you about june?" }));
  console.log("after /restart, nothing older:", !sys().includes("THINGS FROM BEFORE"));
  delete env.MEMORY_INDEX; delete env.AI; store.delete("rs:7"); W.CONFIG.PICTURE.ENABLED = picsOn;
}

step("/album (owner 2026-10-06): her pictures as Telegram ids, 10 a page, oldest first, the newest page first");
{
  store.set("al:7", JSON.stringify(Array.from({ length: 12 }, (_, i) => ({ f: `pic${i + 1}`, at: clock }))));
  await run(msg({ text: "/album" }));
  let g = calls.filter((c) => c.m === "sendMediaGroup").at(-1);
  console.log("album page 1:", g && g.b.media.length === 10 && g.b.media[0].media === "pic3" && g.b.media[9].media === "pic12" && /Pictures 3-12 of 12.*\/album 2/.test(g.b.media[0].caption));
  await run(msg({ text: "/album 2" }));
  g = calls.filter((c) => c.m === "sendMediaGroup").at(-1);
  console.log("album page 2:", g && g.b.media.map((x) => x.media).join() === "pic1,pic2" && !/album 3/.test(g.b.media[0].caption));
  store.delete("al:7");
}

step("her real day (DAY, owner 2026-10-06): Watertown's weather and today's plan, fetched after a reply, in her prompt from the next one");
{
  const D = W.CONFIG.DAY; D.WEATHER = true; D.PLAN = true; store.delete("day");
  const before = clock; clock = RealDate.UTC(2026, 9, 1, 18, 30); // 14:30 in Watertown
  const pending = []; ctx.waitUntil = (p) => pending.push(p);
  const fetch0 = globalThis.fetch; let meteo = 0;
  globalThis.fetch = async (url, init) => String(url).includes("open-meteo") ? (meteo++, new Response(JSON.stringify({ current: { temperature_2m: 51.6, weather_code: 63, wind_speed_10m: 21 }, daily: { temperature_2m_min: [44.2], temperature_2m_max: [55.9] } }))) : fetch0(url, init);
  const planAsked = [];
  env.AI = { async run(model, input) { if (input.messages) { planAsked.push(input.messages[0].content); return { choices: [{ message: { content: "8-11: coffee on the porch, the Hovsepian invoices\n11-14: the Der Sarkissian bakery's books\n14-16: re-sorting a shoebox of receipts from the florist\n16-18: walk to the Armenian market for lahmajun dough\n18-21: cooking for Mrs. Kalajian\n21-24: mama on the phone, then receipts" } }] }; } throw new Error("3040: capacity"); } };
  llm = [{ content: "rain again" }];
  await run(msg({ text: "what are you up to" }));
  await Promise.all(pending);
  const saved = JSON.parse(store.get("day") || "{}");
  console.log("day fetched after the reply:", meteo === 1 && saved.weather === "52°F and raining, windy, today 44-56°F" && saved.plan.length === 6 && /raining/.test(planAsked[0] || ""), saved.weather);
  llm = [{ content: "receipts. a whole shoebox" }];
  await run(msg({ text: "and now?" }));
  console.log("in her prompt: the plan's hour and the weather:", sys().includes("usually re-sorting a shoebox of receipts from the florist") && sys().includes("Outside right now: 52°F and raining"), "| not fetched again:", meteo === 1);
  clock = RealDate.UTC(2026, 9, 1, 8, 0); // 04:00 there: asleep, the plan doesn't cover it
  llm = [{ content: "mm" }];
  await run(msg({ text: "you up?" }));
  console.log("asleep: the usual schedule, not the plan:", sys().includes("usually asleep"));
  globalThis.fetch = fetch0; ctx.waitUntil = () => {}; clock = before; D.WEATHER = false; D.PLAN = false; delete env.AI; store.delete("day");
}

step("/spend (owner 2026-10-06): today's money from OpenRouter's and Runware's own figures, Cloudflare from the bot's count; Workers AI through the AI Gateway");
{
  const fetch0 = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith("/api/v1/key")) return new Response(JSON.stringify({ data: { usage_daily: 0.0412, usage_monthly: 3.5 } }));
    if (String(url).endsWith("/api/v1/credits")) return new Response(JSON.stringify({ data: { total_credits: 10, total_usage: 8.75 } }));
    if (String(url).includes("api.runware.ai")) return new Response(JSON.stringify({ data: [{ balance: 19.0666, usage: { today: { credits: 0.0062 } } }] }));
    return fetch0(url, init);
  };
  env.RUNWARE_API_KEY = "rw"; const opts = [];
  env.AI = { async run(model, input, o) { opts.push(o); return { description: "x" }; } };
  store.set("pics", JSON.stringify({ day: new RealDate(clock).toISOString().slice(0, 10), neurons: 12000 }));
  await run(msg({ text: "/spend" }));
  const t = calls.filter((c) => c.m === "sendMessage").at(-1).b.text;
  console.log("spend: OpenRouter:", /OpenRouter.*\$0\.041 today, \$3\.50 this month, \$1\.25 credit left/.test(t), "| Runware:", /Runware.*\$0\.006 today, \$19\.07 left/.test(t), "| Cloudflare:", /12,000 of 50,000 neurons.*\$0\.02 past the free/.test(t));
  await W.drawPicture(env, "test", {}).catch(() => {});
  console.log("pictures go straight to Workers AI (the gateway refuses uploads):", opts.length > 0 && opts.every((o) => !o || !o.gateway));
  opts.length = 0; env.AI.run = async (model, input, o) => { opts.push(o); return input.messages ? { choices: [{ message: { content: "hi there you" } }] } : { data: [[1]] }; };
  await W.askModel(env, [{ role: "user", content: "hi" }], { max_tokens: 9 }, { model: "@cf/deepseek-ai/deepseek-v4-flash-0731", timeoutMs: 5000, attempts: 1 });
  console.log("text goes through the AI Gateway:", opts.length === 1 && opts[0].gateway.id === "default");
  globalThis.fetch = fetch0; delete env.RUNWARE_API_KEY; delete env.AI; store.delete("pics");
}

step("owner 2026-10-06: texts and hearing on Cloudflare first, OpenRouter only when it fails (the real defaults)");
{
  const L = W.CONFIG.LLM, H = W.CONFIG.HEARING; const savedL = { ...L }, mem = W.CONFIG.MEMORY.MODEL, auto = W.CONFIG.AUTO.MODEL, orFirst = H.OR_FIRST;
  Object.assign(L, { MODEL: "@cf/deepseek-ai/deepseek-v4-flash-0731", PROVIDER: {}, REASONING: {}, BACKUP_MODEL: "deepseek/deepseek-v4-flash", BACKUP_PROVIDER: savedL.PROVIDER, BACKUP_REASONING: savedL.REASONING });
  H.OR_FIRST = false; W.CONFIG.MEMORY.MODEL = L.MODEL; W.CONFIG.AUTO.MODEL = L.MODEL;
  const picsOn = W.CONFIG.PICTURE.ENABLED; W.CONFIG.PICTURE.ENABLED = false;
  let cfDown = false; const ai = [];
  env.AI = { async run(model, input) { ai.push(model); if (cfDown) throw new Error("3040: capacity"); if (input.messages) return { choices: [{ message: { content: "workers ai here, habibi" }, finish_reason: "stop" }] }; if (input.audio) return { text: "whisper heard: come up" }; throw new Error("x"); } };
  const orBefore = prompts.length;
  llm = [{ content: "openrouter here" }];
  await run(msg({ text: "you there?" }));
  let sent = calls.filter((c) => c.m === "sendMessage").at(-1).b.text;
  console.log("text from Workers AI, OpenRouter not asked:", ai.includes(L.MODEL) && /workers ai here/.test(sent) && prompts.length === orBefore);
  cfDown = true; llm = [{ content: "openrouter here, the backup" }];
  await run(msg({ text: "hello??" }));
  sent = calls.filter((c) => c.m === "sendMessage").at(-1).b.text;
  console.log("Workers AI down -> DeepSeek on OpenRouter, with its providers:", /openrouter here, the backup/.test(sent) && prompts.at(-1).model === "deepseek/deepseek-v4-flash" && prompts.at(-1).provider?.order?.[0] === "novita");
  cfDown = false; gemini.mode = "hear"; gemini.calls.length = 0;
  llm = [{ content: "coming" }];
  await run(msg({ voice: { file_id: "w1", duration: 5 } }));
  const heard = JSON.parse(store.get("h:7")).filter((m) => m.role === "user").at(-1).content;
  console.log("Whisper hears first, Gemini not asked:", /whisper heard: come up/.test(heard) && gemini.calls.length === 0);
  cfDown = true; llm = [{ content: "ok" }];
  await run(msg({ voice: { file_id: "w2", duration: 5 } }));
  const heard2 = JSON.parse(store.get("h:7")).filter((m) => m.role === "user").at(-1).content;
  console.log("Whisper down -> Gemini on OpenRouter:", gemini.calls.length === 1 && /come over/.test(heard2));
  Object.assign(L, savedL); W.CONFIG.MEMORY.MODEL = mem; W.CONFIG.AUTO.MODEL = auto; H.OR_FIRST = orFirst; gemini.mode = "fail";
  W.CONFIG.PICTURE.ENABLED = picsOn; delete env.AI; store.delete("pics"); store.delete("ai_error");
}

step("/setup: Sulafat test clip heard back by Gemini, ElevenLabs without a clip, failures as notes, money today");
{
  const V = W.CONFIG.VOICE; const prov = V.PROVIDER; V.PROVIDER = "openrouter"; gemini.mode = "hear";
  const eleven = () => log.filter((l) => l.includes("text-to-speech")).length; const before = eleven(); const spoke = orSpeech.length;
  store.set("ai_error", JSON.stringify({ at: clock - 2 * 86400000, error: "drawing a boudoir mirror: 3030" }));
  store.set("voice_error", JSON.stringify({ at: clock - 3600000, error: "OpenRouter voice: x 500; ElevenLabs spoke it" }));
  env.AI = { async run(model, input) { if (/deepseek/.test(model) && input.messages) return { choices: [{ message: { content: "OK" } }] }; throw new Error("not called by /setup"); } }; // only the backup text model (LLM.BACKUP_MODEL) is asked
  const html = await (await mod.fetch(new Request("https://reem.example/setup"), env, ctx)).text();
  const row = (label) => (html.match(new RegExp(`<div class="row"><div>([^<]*)</div><div><b>${label}[^<]*</b><span>([^<]*)</span>`)) || []).slice(1);
  console.log("setup: her voice tested:", orSpeech.length === spoke + 1 && row("Her voice")[0] === "✅", "| Gemini heard it:", row("Hearing")[0] === "✅" && /come over/.test(row("Hearing")[1]) && gemini.calls.at(-1).messages[0].content[1].input_audio.format === "mp3",
    "| ElevenLabs no clip:", eleven() === before && row("ElevenLabs \\(backup\\) voice")[0] === "✅",
    "| old failure is a note:", row("Last Workers AI call")[0] === "ℹ️" && /2 days ago/.test(row("Last Workers AI call")[1]),
    "| voice failure not 'as text':", !/as text instead/.test(row("Last voice note")[1] || "") && row("Last voice note")[0] === "ℹ️",
    "| all set:", html.includes("All set."));
  V.PROVIDER = prov; gemini.mode = "fail"; delete env.AI; store.delete("ai_error"); store.delete("voice_error");
}

step("everything down: fallback line");
globalThis.fetch = ((f) => async (url, init) => url.includes("openrouter") ? new Response("{}", { status: 503 }) : f(url, init))(globalThis.fetch);
await run(msg({ text: "you there?" }));
console.log(log.filter(l => l.startsWith("---") || l.includes("setMessageReaction") || l.includes("sendMessage") || l.includes("sendVoice") || l.includes("text-to-speech")).join("\n"));
if (failedChecks) { console.error(`${failedChecks} e2e checks FAILED`); process.exit(1); }
