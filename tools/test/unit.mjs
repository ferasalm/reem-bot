// Unit tests: node tools/test/unit.mjs (expects the default CONFIG; uses the real clock for quiet-hour checks)
import { loadWorker } from "./load-worker.mjs";
const W = await loadWorker();
let fails = 0;
const eq = (got, want, label) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) fails++; console.log(ok ? "ok  " : "FAIL", label, ok ? "" : `\n     got:  ${JSON.stringify(got)}\n     want: ${JSON.stringify(want)}`); };
// Arabizi
eq(W.forSpeech("ya3ni i'm tired"), "Yaani I'm tired.", "ya3ni");
eq(W.forSpeech("7abibi come here"), "Habibi come here.", "7abibi");
eq(W.forSpeech("ma3lesh"), "Maalesh.", "ma3lesh");
eq(W.forSpeech("it's 3am and i can't sleep"), "It's 3am and I can't sleep.", "3am untouched");
eq(W.forSpeech("give me 2 minutes"), "Give me 2 minutes.", "2 minutes untouched");
eq(W.forSpeech("the 2nd time at 10pm"), "The 2nd time at 10pm.", "2nd/10pm untouched");
eq(W.forSpeech("my mp3 from 2026"), "My mp3 from 2026.", "mp3/2026 untouched");
eq(W.forSpeech("Ya3ni... 5alas, wallahi"), "Yaani... Khalas, wallahi.", "capital + list");
eq(W.forSpeech("enta 3amel eh"), "Enta aamel eh.", "fallback 3amel");
eq(W.forSpeech("7elwa awi"), "Helwa awi.", "list 7elwa");
eq(W.forSpeech("sa7 keda"), "Sah keda.", "sa7 via list (digit at end)");
eq(W.forSpeech("ba7ebak"), "Bahebak.", "fallback ba7ebak");
eq(W.forSpeech("insha2allah"), "Inshallah.", "insha2allah");
eq(W.forSpeech("we have 4 hours, 90s music, 5k steps"), "We have 4 hours, 90s music, 5k steps.", "english numbers");
// trim
eq(W.trimUnfinished("*She leans in. Her hand finds your collar, pulling you clo"), "*She leans in.*", "trim closes action");
eq(W.trimUnfinished("\"Come here,\" she says. \"I want to tell you someth"), "\"Come here,\" she says.", "trim at sentence");
eq(W.trimUnfinished("short reply with no stop at all and then"), "short reply with no stop at all and then", "no sentence end kept");
// scene
const now = Date.now();
eq(W.sceneOf([{ role: "assistant", content: "*She smiles.* \"hi\"", at: now }], "hey"), "together", "scene from her last");
eq(W.sceneOf([{ role: "assistant", content: "*She smiles.* \"hi\"", at: now - 3 * 3600e3 }], "hey"), "apart", "stale scene");
eq(W.sceneOf([{ role: "assistant", content: "lol ok", at: now }], "*knocks on your door*"), "together", "his action");
eq(W.sceneOf([{ role: "assistant", content: "lol ok", at: now }], "hey"), "apart", "texting");
// notice
const active = W.noticeTime(now - 60000, now);
eq(active >= W.CONFIG.TIMING.ACTIVE_NOTICE_MIN_MS && active <= W.CONFIG.TIMING.ACTIVE_NOTICE_MAX_MS, true, `momentum notice ${Math.round(active)}ms`);
// schedule, clock
eq(typeof W.herHour() === "number" && W.herHour() >= 0 && W.herHour() < 24, true, `herHour ${W.herHour()} day ${W.herDay()} slot ${W.scheduleNow()?.doing}`);
eq(W.inHours(23, 22, 2) && W.inHours(1, 22, 2) && !W.inHours(3, 22, 2), true, "inHours across midnight");
// typing caps
eq(W.typingTime("*" + "x".repeat(2000) + "*") <= 20000, true, "scene typing cap");
eq(W.typingTime("x".repeat(2000)) <= 45000, true, "text typing cap");
// line dropped
eq(W.lineDropped().length, 2, "line dropped pair");
// proactive eligibility
const h = W.herHour(); const quiet = W.inHours(h, 1, 9);
const old = [{ role: "assistant", content: "hi", at: now - 4 * 3600e3 }];
eq(W.mayTextFirst({ history: old, settings: {} }), !quiet, "may text first after 4h (unless quiet hours)");
eq(W.mayTextFirst({ history: [{ ...old[0], proactive: true }], settings: {} }), false, "not twice unanswered");
eq(W.mayTextFirst({ history: [{ ...old[0], at: now - 3600e3 }], settings: {} }), false, "not before silence");
eq(W.mayTextFirst({ history: old, settings: { proactive: { day: W.herDay(), count: 3 } } }), false, "daily cap");
eq(W.mayTextFirst({ history: [{ role: "assistant", content: "hi" }], settings: {} }), false, "no time on old history");
// eleven_v3 audio tags (VOICE.MODEL eleven_v3, AUDIO_TAGS on)
eq(W.forSpeech("[laughs] ya3ni stop it [Whispers] come here"), "[laughs] Yaani stop it [whispers] come here.", "tags kept + arabizi");
eq(W.forSpeech("[grinning] hey [voice] you [laughs]"), "Hey you. [laughs]", "unknown brackets dropped, period before end tag");
eq(W.forSpeech("okay so...\n[sighs]\nbasbousa again"), "Okay so... [sighs] Basbousa again.", "v3 line pause + tag-only line joins next");
eq(W.forSpeech("first thought\nsecond one"), "First thought... Second one.", "v3 uses ... not <break>");
eq(W.forSpeech("[breathes   heavily] [moans softly] 7abibi"), "[breathes heavily] [moans softly] Habibi.", "multi-word tags");
eq(W.forSpeech("[laughs]"), "", "tag alone is not a voice note");
eq(/\d/.test(W.forSpeech("[giggles] ma3lesh 7abibti, 5alas")), false, "no digits spoken with tags");
eq(W.stripAudioTags("omg [laughs]! stop\n[sighs] fine [weird]"), "omg! stop\nfine [weird]", "texts drop allowed tags only");
eq(W.bodyOf("[voice] [laughs] hey\n[sent a photo] x"), "[laughs] hey\nx", "clean keeps tags at line start, drops others");
eq(W.speakingTime("[laughs] one two three [whispers] four") === W.speakingTime("one two three four"), true, "tags don't count as words");
eq(W.voiceSettings(), { stability: 0.5 }, "v3 settings: stability only");
W.CONFIG.VOICE.STABILITY = 0.2; eq(W.voiceSettings().stability, 0, "stability snaps to 0");
W.CONFIG.VOICE.STABILITY = 0.8; eq(W.voiceSettings().stability, 1, "stability snaps to 1");
W.CONFIG.VOICE.MODEL = "eleven_multilingual_v2"; W.CONFIG.VOICE.STABILITY = 0.35;
eq(W.voiceSettings(), { stability: 0.35, similarity_boost: 0.75, style: 0.4, use_speaker_boost: true, speed: 0.95 }, "v2 settings unchanged");
eq(W.forSpeech("[laughs] hi\nbye"), 'Hi. <break time="0.4s" /> Bye.', "v2: tags stripped, <break> kept");
W.CONFIG.VOICE.MODEL = "eleven_v3"; W.CONFIG.VOICE.STABILITY = 0.5; W.CONFIG.VOICE.AUDIO_TAGS = false;
eq(W.forSpeech("[laughs] hi"), "Hi.", "v3 with AUDIO_TAGS off strips tags");
W.CONFIG.VOICE.AUDIO_TAGS = true;
// reactions
eq(W.takeReaction("[react: ❤️] aww stop"), { emoji: "❤", rest: "aww stop" }, "alias ❤️ -> ❤");
eq(W.takeReaction("[react:😂]"), { emoji: "🤣", rest: "" }, "alias 😂 -> 🤣, reaction only");
eq(W.takeReaction("[voice] [Reaction: 🔥] hey"), { emoji: "🔥", rest: "[voice] hey" }, "after [voice], any case");
eq(W.takeReaction("[react: 🦖] lol"), { emoji: "", rest: "lol" }, "invalid emoji dropped");
eq(W.takeReaction("just text"), { emoji: "", rest: "just text" }, "no tag");
// v10: commands
eq(W.parseCommand("/Name@reem_nabot Sam"), { action: "name", args: "Sam" }, "command with @bot and args");
eq(W.parseCommand("/about line one\nline two"), { action: "about", args: "line one\nline two" }, "multi-line args kept");
eq(W.parseCommand("/start"), { action: "restart", args: "" }, "alias");
// her voice in a scene: only her quoted words, tagged from the narration around them
eq(W.sceneSpeech('*Reem pulls you closer.* "Come here," *she whispers.* "Now."'), "[whispers] Come here.\nNow.", "scene clip: words only, whisper tag");
eq(W.sceneSpeech('*She laughs, shaking her head.* "You\'re impossible."'), "[laughs] You're impossible.", "scene clip: tag from the sentence before");
// seen live 2026-10-02 (DeepSeek): a line resumed after narration, and "almost a whisper" / "a little breathless"
eq(W.sceneSpeech('"I was starting to think..." *She trails off.* "—you didn\'t know what you were missing."'), "I was starting to think...\nyou didn't know what you were missing.", "scene clip: resumed line loses its dash");
eq(W.sceneSpeech('"Took. You. Long. Enough." *Her voice drops lower on each word, the last one almost a whisper.* "Better?"'), "Took. You. Long. Enough.\n[whispers] Better?", "scene clip: almost a whisper");
eq(W.sceneSpeech('*Her voice drops low, a little breathless.* "Show me."'), "[breathless] Show me.", "scene clip: the direction nearest her words wins");
eq(W.sceneSpeech("*Reem leans in and kisses you slowly.*"), "", "scene clip: nothing to say without quotes");
eq(["let me hear you", "say it again", "say that out loud", "send me a voice note", "*kisses you*", "i want you"].map(W.asksToHear), [true, true, true, true, false, false], "scene: he asks to hear her");
const upd = (text) => ({ update_id: 1, message: { message_id: 1, chat: { id: 7, type: "private" }, from: { id: 7 }, text } });
eq(["/help", "/name Sam", "/about tall", "/voice", "/memory"].map((t) => W.isQuickCommand(upd(t))), [true, true, true, true, true], "settings commands skip the queue");
eq(["/rewind", "/retry", "/edit hi", "/auto", "/start", "/restart", "hello", "/nope"].map((t) => W.isQuickCommand(upd(t))), [false, false, false, false, false, false, false, false], "story commands and chat stay queued");
eq(W.isQuickCommand({ update_id: 2, edited_message: { text: "/help" } }), false, "an edited /help stays queued");
eq(W.parseCommand("/nope x").action, undefined, "unknown command");
eq(W.commandList().split("\n").length, W.CONFIG.COMMANDS.length, "help lists every command");
// his name and about
eq(W.hisName({ name: "Sam", tgName: "Omar" }), "Sam", "/name wins");
eq(W.hisName({ tgName: "Omar" }), "Omar", "telegram name next");
eq(W.aboutHim({ tgName: "Omar", about: "31, architect" }), "His name is Omar; call him that.\n31, architect", "about him");
eq(W.aboutHim({}), "", "nothing known");
// history parts
const H = [
  W.makeEntry("assistant", [{ id: 10, text: "*intro*" }]),
  W.makeEntry("user", [{ id: 11, text: "hi" }, { id: 12, text: "you up?" }]),
  W.makeEntry("assistant", [{ id: 13, text: "maybe" }, { id: 14, text: "why" }]),
  { role: "user", content: "old entry without parts" },
  W.makeEntry("assistant", [{ id: 16, text: "ok" }]),
];
eq(H[1].content, "hi\nyou up?", "his parts joined by line");
eq(H[2].content, "maybe\n\nwhy", "her bubbles joined by blank line");
eq(W.findPart(H, 13), { i: 2, j: 0 }, "find her bubble");
eq(W.findPart(H, 99), null, "unknown id");
const cut = W.cutAfter(H, 2, 0);
eq([cut.history.length, cut.history[2].content, cut.drop], [3, "maybe", [14, 16]], "cut mid-reply");
const cut2 = W.cutAfter(H, 1, 0);
eq([cut2.history.at(-1).content, cut2.drop], ["hi", [12, 13, 14, 16]], "cut inside his batch");
// /auto drafts
eq(W.cleanDraft('Sam: "knock knock"', "Sam"), "knock knock", "draft: prefix and quotes");
eq(W.cleanDraft("on my way\nReem: yay", "Sam"), "on my way", "draft: stops at her line");
eq(W.draftHtml("a<b"), "✍️ Your next message (tap it to copy):\n\n<code>a&lt;b</code>", "draft html escaped");
// voice notes: decided in code
eq(W.asksForVoice("send me a voice note"), true, "asks for voice");
eq(W.asksForVoice("[voice note] hello there"), false, "his own voice note isn't a request");
eq(W.replyMode({ scene: "together", heard: "send me a voice note" }), "scene", "scene stays scene");
eq(W.replyMode({ scene: "apart", heard: "can you send a vn" }), "voice", "asked -> voice");
W.CONFIG.VOICE.CHANCE = 0; eq(W.replyMode({ scene: "apart", heard: "hey" }), "text", "no roll -> text");
W.CONFIG.VOICE.CHANCE_AFTER_VOICE = 1; eq(W.replyMode({ scene: "apart", heard: "hey", cameAsVoice: true }), "voice", "after his voice note");
// He asks her over (owner 2026-10-06, "Mostly go"): TEXTING.VISIT_CHANCE of the time she goes, as a scene
for (const t of ["Come over habibi", "Waiting for you to knock", "get over here", "come here 😏"]) eq(W.asksHerOver(t), true, `asks her over: ${t}`);
for (const t of ["can I come over?", "i'm coming over", "i'll come by later", "hey", "want me to come over?"]) eq(W.asksHerOver(t), false, `not asking her over: ${t}`);
W.CONFIG.TEXTING.VISIT_CHANCE = 1; eq(W.replyMode({ scene: "apart", heard: "Come over habibi" }), "visit", "come over -> visit");
eq(W.replyMode({ scene: "apart", heard: "come over and send me a voice note" }), "voice", "a voice request wins");
eq(W.replyMode({ scene: "together", heard: "come here" }), "scene", "together stays scene");
eq(W.replyMode({ scene: "apart", heard: "come over", proactive: true }), "text", "not when she texts first");
W.CONFIG.TEXTING.VISIT_CHANCE = 0; eq(W.replyMode({ scene: "apart", heard: "Come over habibi" }), "text", "no visit roll -> text");
eq(/crossing the landing/.test(W.formatNudge("visit")), true, "visit gets its format nudge");
W.CONFIG.VOICE.CHANCE = 0.2; W.CONFIG.VOICE.CHANCE_AFTER_VOICE = 0.6;
eq(W.formatNudge("voice").includes("[laughs]"), true, "voice reminder lists tags");
// repairs (from real replies)
eq(W.stageToTags("laughs softly Just imagine. there's a pause, then a sly murmur But hey"), "[laughs] Just imagine. But hey", "stage directions -> tags");
eq(W.stageToTags("sends another voice note after a brief pause, her voice low Mmm, ok"), "Mmm, ok", "voice-note narration dropped");
eq(W.stageToTags("sighs. ok fine"), "sighs. ok fine", "lowercase texting untouched");
const sr = (raw, mode = "text") => W.shapeReply(raw, { scene: "apart", mode });
eq([sr("Reem raises an eyebrow.\n\n\"salted lemons, huh?\" She winks.").texts, sr("Reem raises an eyebrow. ok").repaired], [["salted lemons, huh?"], true], "narrated text -> her words, asked again");
eq(sr("The connection ends with a soft click. Close your eyes... I'm right here.", "voice").voiceText, "Close your eyes... I'm right here.", "narration sentence dropped");
eq([sr("lol ok\n\nnour rolled her eyes at me").texts, sr("lol ok").repaired], [["lol ok", "nour rolled her eyes at me"], false], "normal texts untouched");
eq([sr("*She knocks.* \"Open up.\"").kind, sr("*She knocks.* \"Open up.\"").stored], ["scene", "*She knocks.* \"Open up.\""], "a proper scene while apart is kept");
eq(sr("ok fine. laughs softly Just for you.", "voice").spoken.includes("[laughs]"), true, "stage direction -> tag in a decided voice note");
eq(W.markScene("She takes the glass. \"Thanks,\" she says, \"really.\""), "*She takes the glass.* \"Thanks,\" *she says,* \"really.\"", "scene narration -> italics");
eq(W.markScene("*She smiles.* \"hi\""), "*She smiles.* \"hi\"", "well-formed scene unchanged");
eq(W.markScene("lol ok"), "lol ok", "texting in a scene untouched");
// context budget
const big = Array.from({ length: 120 }, () => ({ role: "user", content: "x".repeat(1500) }));
const fit = W.fitHistory(big, 8000, 220);
eq(fit.length > 2 && fit.length < 120 && fit.reduce((n, m) => n + m.content.length, 0) + 8000 < (W.CONFIG.LLM.CONTEXT_TOKENS - 220) * W.CONFIG.LLM.CHARS_PER_TOKEN, true, `history trimmed to ${fit.length}`);
eq(W.fitHistory(big.slice(0, 3), 1e6, 220).length, 2, "always the last two");
// the backup model (8192 tokens) gets the oldest chat left out, never the prompt, his message or the reminder
const msgs = [{ role: "system", content: "S".repeat(9000) }, ...big.slice(0, 30), { role: "user", content: "his message" }, { role: "system", content: "[format]" }];
const fm = W.fitMessages(msgs, 8192, 220);
eq([fm[0].content.length, fm.at(-2).content, fm.at(-1).content, fm.reduce((n, m) => n + m.content.length + 20, 0) <= (8192 - 220 - 150) * 3.5, fm.length < msgs.length],
  [9000, "his message", "[format]", true, true], `backup fit keeps ${fm.length} of ${msgs.length}`);
eq(W.fitMessages(msgs, 1e6, 220).length, msgs.length, "nothing cut when it fits");
// persona
eq(W.CONFIG.PERSONA.SYSTEM_PROMPT.includes("HOW YOU LOOK") && W.CONFIG.PERSONA.SYSTEM_PROMPT.endsWith(`LIMITS & OOC
Maintain adult themes freely without moralizing. If he ever says he is under 18, stop all flirting and romance for good and keep things strictly friendly. If the user initiates "OOC:", reply directly and concisely as the writer, then resume playing Reem seamlessly.`), true, "looks added, LIMITS & OOC unchanged");
// overrides replace pronunciations whole
W.applyOverrides({ CONFIG_OVERRIDES: JSON.stringify({ VOICE: { PRONUNCIATIONS: { ya3ni: "yani" } } }) });
eq(Object.keys(W.CONFIG.VOICE.PRONUNCIATIONS), ["ya3ni"], "pronunciations replaced whole");
eq(W.forSpeech("ya3ni 7abibi"), "Yani habibi.", "override + fallback");
// OpenRouter routing: LLM.PROVIDER/REASONING with LLM.MODEL (DeepSeek), LLM.BACKUP_* with the backup (Nemo)
eq(W.CONFIG.LLM.MODEL, "@cf/deepseek-ai/deepseek-v4-flash-0731", "chat model: DeepSeek on Workers AI first (owner 2026-10-06)");
eq(W.CONFIG.LLM.BACKUP_MODEL, "deepseek/deepseek-v4-flash", "backup: DeepSeek on OpenRouter (owner 2026-10-06)");
const ds = W.openRouterBody(W.CONFIG.LLM.BACKUP_MODEL, [], { max_tokens: 5 });
eq({ model: ds.model, provider: ds.provider, reasoning: ds.reasoning }, { model: "deepseek/deepseek-v4-flash", provider: { order: ["novita", "baidu", "relace", "streamlake"], ignore: ["azure", "alibaba", "atlas-cloud", "deepinfra"], allow_fallbacks: false }, reasoning: { enabled: false } }, "OpenRouter backup: DeepSeek's providers + reasoning off");
eq(W.CONFIG.HEARING.OR_FIRST, true, "hearing: Gemini (OpenRouter) first, Whisper when it fails (owner 2026-10-06)");
eq(W.CONFIG.PICTURE.LINGERIE.ENABLED, false, "Nano Banana removed (owner 2026-10-06)");
eq(Object.keys(W.openRouterBody("sao10k/l3-lunaris-8b", [], { max_tokens: 5 })), ["model", "messages", "max_tokens"], "another model: no routing");
eq([W.CONFIG.MEMORY.MODEL, W.CONFIG.AUTO.MODEL].every((m) => m === W.CONFIG.LLM.MODEL), true, "memory and /auto use DeepSeek (the chat model's routing)");
{
  const saved = structuredClone(W.CONFIG.LLM);
  W.CONFIG.LLM.BACKUP_PROVIDER.ignore = [];
  W.CONFIG.LLM.BACKUP_REASONING = {};
  const b = W.openRouterBody(W.CONFIG.LLM.BACKUP_MODEL, [], {});
  eq({ ignore: "ignore" in b.provider, reasoning: "reasoning" in b }, { ignore: false, reasoning: false }, "empty routing values dropped");
  W.CONFIG.LLM = saved;
}
// overrides reach the new LLM keys; PROVIDER/REASONING take new OpenRouter keys, LLM itself doesn't
{
  const copy = structuredClone(W.CONFIG), unknown = [];
  W.mergeSettings(copy, { LLM: { PROVIDER: { order: ["baidu"], ignore: ["novita"], allow_fallbacks: true, sort: "latency" }, REASONING: { enabled: true, effort: "low" }, BACKUP_PROVIDER: { sort: "price" }, BACKUP_MODEL: "", FOO: 1 } }, "", unknown);
  eq([copy.LLM.PROVIDER, copy.LLM.REASONING, copy.LLM.BACKUP_MODEL], [{ order: ["baidu"], ignore: ["novita"], allow_fallbacks: true, sort: "latency" }, { enabled: true, effort: "low" }, ""], "LLM routing overrides");
  eq(copy.LLM.BACKUP_PROVIDER.sort, "price", "backup routing takes new OpenRouter keys");
  eq(unknown, ["LLM.FOO"], "unknown LLM key rejected");
}
// Every CONFIG setting has a field in the settings panel (TELEGRAM.ALLOWED_UPDATES is technical, on purpose)
{
  const { readFileSync } = await import("node:fs");
  const html = readFileSync(new URL("../settings-panel.html", import.meta.url), "utf8");
  const fields = new Set([...html.matchAll(/^\s*\["([A-Z_][A-Za-z0-9_.]*)"/gm)].map((m) => m[1]));
  const missing = [];
  const walk = (o, path) => {
    for (const [k, v] of Object.entries(o)) {
      const p = path ? `${path}.${k}` : k;
      if (fields.has(p) || p === "TELEGRAM.ALLOWED_UPDATES") continue;
      if (v && typeof v === "object" && !Array.isArray(v)) walk(v, p);
      else missing.push(p);
    }
  };
  walk(W.CONFIG, "");
  eq(missing, [], "every CONFIG key has a settings panel field");
}
eq(W.CONFIG.PICTURE.ROUTE, "runware-klein", "pictures default to Runware klein (owner 2026-10-06)");
{
  // a Workers AI text model (@cf/...): the AI binding, no thinking step, OpenAI-style answer read; no OpenRouter call
  const seen = [];
  const env = { AI: { async run(model, input) { seen.push([model, input.reasoning_effort, input.max_tokens, "min_p" in input]); return { choices: [{ message: { content: "hey you." }, finish_reason: "stop" }] }; } } };
  const out = await W.askModel(env, [{ role: "system", content: "s" }, { role: "user", content: "hi" }], { temperature: 0.9, max_tokens: 50, min_p: 0.1 }, { model: "@cf/deepseek-ai/deepseek-v4-flash-0731", timeoutMs: 5000, attempts: 1, trimCut: true });
  eq([out, seen], ["hey you.", [["@cf/deepseek-ai/deepseek-v4-flash-0731", "none", 50, false]]], "a @cf/ text model goes through the AI binding with no thinking step");
}
{
  // long memory (RECALL): folded messages saved with who/when/chat, OOC and tiny lines left out; nothing without the index
  const up = [];
  const env = { AI: { async run(model, input) { return { data: input.text.map(() => [0.1, 0.2]) }; } }, MEMORY_INDEX: { async upsert(r) { up.push(...r); } } };
  await W.recallSave(env, 7, [{ role: "user", content: "my sister gets married in june", at: 1000 }, { role: "assistant", content: "ok", at: 1001 }, { role: "user", content: "(ooc) quick question for the writer", ooc: true, at: 1002 }, { role: "assistant", content: "then you're wearing a suit, habibi", at: 1003 }]);
  eq(up.map((r) => [r.metadata.chat, r.metadata.who, r.metadata.at, r.values.length]), [["7", "him", 1000, 2], ["7", "her", 1003, 2]], "recall saves folded messages (not OOC, not one-word lines)");
  eq(await W.recallFind({ AI: env.AI }, 7, "june"), "", "no index bound: no recall, no error");
  eq([W.longAgo(Date.now() - 3 * 86400000), W.longAgo(Date.now() - 21 * 86400000), W.longAgo(Date.now() - 90 * 86400000)], ["3 days ago", "3 weeks ago", "3 months ago"], "recall: how long ago, in words");
}
{
  // RECALL.REPEAT_SCORE: the same meaning in other words is caught; a new thing isn't; short replies aren't checked
  const vec = (t) => (/receipt|napkin/.test(t) ? [1, 0.05] : [0.05, 1]);
  const env = { AI: { async run(model, input) { return { data: input.text.map(vec) }; } } };
  const history = [{ role: "assistant", content: "a client paid me with a receipt scribbled on a napkin today" }, { role: "user", content: "lol" }];
  eq([await W.saidBefore(env, "remember that guy who paid me on a napkin receipt? classic", history), await W.saidBefore(env, "the radiator is singing again and i refuse to call the landlord", history), await W.saidBefore(env, "napkin again", history)],
    [true, false, false], "repeat check by meaning: same story caught, new one passes, short ones skipped");
}
{
  // Cloudflare's DeepSeek sometimes answers nothing: asked again (up to 4 times) before it counts as empty
  let n = 0;
  const env = { AI: { async run() { n++; return { choices: [{ message: { content: n < 3 ? "" : "there you are" }, finish_reason: "stop" }] }; } } };
  const out = await W.askModel(env, [{ role: "user", content: "hi" }], { max_tokens: 20 }, { model: "@cf/deepseek-ai/deepseek-v4-flash-0731", timeoutMs: 5000, attempts: 1 });
  eq([out, n], ["there you are", 3], "an empty Workers AI answer is asked again");
  const efforts = []; let k = 0;
  const env2 = { AI: { async run(model, input) { efforts.push(input.reasoning_effort); k++; return { choices: [{ message: { content: k < 4 ? "" : "finally" } }] }; } } };
  eq([await W.askModel(env2, [{ role: "user", content: "hi" }], { max_tokens: 20 }, { model: "@cf/x", timeoutMs: 5000, attempts: 1 }), efforts], ["finally", ["none", "none", "low", "low"]], "the last two tries think a little");
}
{
  // a task (memory, /auto, the plan, /setup) gets reasoning "low" and room for it; her replies "none"
  const seen = [];
  const env = { AI: { async run(model, input) { seen.push([input.reasoning_effort, input.max_tokens]); return { choices: [{ message: { content: "ok then" } }] }; } } };
  await W.askModel(env, [{ role: "user", content: "x" }], { max_tokens: 100 }, { model: "@cf/deepseek-ai/deepseek-v4-flash-0731", timeoutMs: 5000, attempts: 1, task: true });
  await W.askModel(env, [{ role: "user", content: "x" }], { max_tokens: 100 }, { model: "@cf/deepseek-ai/deepseek-v4-flash-0731", timeoutMs: 5000, attempts: 1 });
  eq(seen, [["low", 1600], ["none", 100]], "Workers AI: tasks think a little (low), her replies don't (none)");
}
{
  // the owner's main routes (2026-10-06): texts/memory/auto DeepSeek on Cloudflare, voice Sulafat on OpenRouter, hearing Gemini on
  // OpenRouter, his photos seen on Cloudflare, her pictures on Runware klein
  const C = W.CONFIG;
  eq([C.LLM.MODEL, C.MEMORY.MODEL, C.AUTO.MODEL, C.VOICE.PROVIDER, C.VOICE.OR_MODEL, C.VOICE.OR_VOICE, C.HEARING.OR_FIRST, C.HEARING.OR_MODEL, C.VISION.MODEL.startsWith("@cf/"), C.PICTURE.ROUTE, C.PICTURE.RUNWARE.MODEL],
    ["@cf/deepseek-ai/deepseek-v4-flash-0731", "@cf/deepseek-ai/deepseek-v4-flash-0731", "@cf/deepseek-ai/deepseek-v4-flash-0731", "openrouter", "google/gemini-3.8-flash-tts", "Sulafat", true, "google/gemini-3.8-flash", true, "runware-klein", "runware:400@2"],
    "the owner's main routes");
}
{
  // RUNWARE.LORAS (2026-10-08): sent with klein 9B (MODEL) only; weight 0 drops one
  const R = W.CONFIG.PICTURE.RUNWARE, keep = [R.LORAS, R.LORA_PREFIX], realFetch = globalThis.fetch, sent = [];
  R.LORAS = { "ferasalm:phone2025@1": "0.8", "ferasalm:realhd2k@1": 0 }; R.LORA_PREFIX = "Candid phone photo of";
  globalThis.fetch = async (url, init) => { sent.push(JSON.parse(init.body)[0]); return new Response(JSON.stringify({ data: [{ imageBase64Data: "AAAA", cost: 0.001 }] })); };
  try {
    // runwarePlan chooses the LoRAs (Step 1b: drawRunware only sends what it is given); the plan's tries are sent as drawPicture does
    const plan = W.runwarePlan("words", { herself: false, width: 576, height: 1024, who: (w) => w });
    for (const t of plan.tries) await W.drawRunware({ RUNWARE_API_KEY: "k" }, t.model, t.text, [], t.width, t.height, { loras: t.loras, steps: t.steps, cfg: t.cfg, acceleration: t.acceleration });
  } finally { globalThis.fetch = realFetch; [R.LORAS, R.LORA_PREFIX] = keep; }
  eq(sent.map((t) => t.lora || null), [[{ model: "ferasalm:phone2025@1", weight: 0.8 }], null], "LoRAs go with klein 9B only, weight 0 left out");
}
{
  // owner 2026-10-08: a camera-flash picture only when asked (FLASH_WORDS): the flash LoRA replaces the realism LoRAs (its author: no
  // other realism style), no LORA_PREFIX, the flash trigger first and FLASH_PHOTO; hairstyles (HAIRSTYLES) unless the words name her hair
  const P = W.CONFIG.PICTURE, R = P.RUNWARE, realFetch = globalThis.fetch, keep = [P.ROUTE, P.HAIR_CHANCE], r0 = Math.random;
  let sent = [];
  globalThis.fetch = async (url, init) => { sent.push(JSON.parse(init.body)[0]); return new Response(JSON.stringify({ data: [{ imageBase64Data: "AAAA", cost: 0.001 }] })); };
  const draw = async (words) => { sent = []; await W.drawPicture({ RUNWARE_API_KEY: "k" }, `{who} ${words}`, { ledger: {} }); return sent[0]; };
  try {
    P.ROUTE = "runware-klein"; P.HAIR_CHANCE = 0;
    const flash = await draw("in a black slip dress on her bed, with flash");
    eq(flash.lora.map((l) => [l.model, l.weight]), Object.entries(R.FLASH_LORAS), "flash asked: only the flash LoRA (no realism LoRAs), at its weight");
    eq(!!(flash.positivePrompt.startsWith(R.FLASH_TRIGGER) && !flash.positivePrompt.includes(R.LORA_PREFIX) && flash.positivePrompt.includes(R.FLASH_PHOTO) && !flash.positivePrompt.includes(R.PHOTO)), true, "flash: its trigger first, no phone2025 prefix, FLASH_PHOTO in place of PHOTO");
    const plain = await draw("in a black slip dress on her bed");
    eq(plain.lora.map((l) => l.model).sort(), Object.keys(R.LORAS).sort(), "no flash asked: the usual LoRAs");
    eq(W.customPicture("you in a slip dress with flash", 22).prompt.includes(R.FLASH_LIGHT), true, "/pic with flash: the flash light, not the time's");
    eq(W.customPicture("you by candlelight in your bedroom", 22).prompt.includes("Lit by"), false, "/pic naming its light (candlelight): no light picked");
    eq(!!(!W.composePicture({ words: "on the porch at golden hour", hour: 21 }).prompt.includes("lamp")), true, "her words name the light: no LIGHT pick");
    P.HAIR_CHANCE = 1; Math.random = () => 0;
    const hair = await draw("on the couch");
    eq(!!(hair.positivePrompt.includes(`Her hair: ${P.HAIRSTYLES[0]}.`) && hair.positivePrompt.includes("same face, hair color")), true, "a hairstyle: named, her hair color kept");
    eq(!!(!(await draw("on the couch, her hair in a ponytail")).positivePrompt.includes("Her hair:")), true, "the words name her hair: no hairstyle picked");
  } finally { globalThis.fetch = realFetch; [P.ROUTE, P.HAIR_CHANCE] = keep; Math.random = r0; }
}
{
  // owner 2026-10-10: an outfit or a hairstyle with a picture (RUNWARE.STYLE_PICTURES) sends that picture as the next image, after face, body and place, and names it
  const P = W.CONFIG.PICTURE, R = P.RUNWARE, realFetch = globalThis.fetch, keep = [P.ROUTE, P.HAIR_CHANCE], r0 = Math.random;
  let sent = [];
  globalThis.fetch = async (url, init) => { sent.push(JSON.parse(init.body)[0]); return new Response(JSON.stringify({ data: [{ imageBase64Data: "AAAA", cost: 0.001 }] })); };
  const draw = async (words) => { sent = []; await W.drawPicture({ RUNWARE_API_KEY: "k" }, `{who} ${words}`, { ledger: {} }); return sent[0]; };
  try {
    P.ROUTE = "runware-klein"; P.HAIR_CHANCE = 0; Math.random = () => 0;
    const plain = await draw("on the couch reading a book");
    const n0 = plain.inputs.referenceImages.length;
    const camel = await draw(`on the couch in ${R.STYLE_PICTURES["outfit-camel-coat"]}`);
    eq(camel.inputs.referenceImages.length, n0 + 1, "an outfit with a picture: that picture is one more image");
    eq(camel.positivePrompt.includes("exactly the clothes shown in image"), true, "an outfit picture is named in the prompt");
    const rust = await draw("on the couch in a fitted rust-red halter crop top and light-blue straight-leg jeans");
    eq(rust.inputs.referenceImages.length, n0, "an outfit without a picture: no extra image");
    P.HAIR_CHANCE = 1;
    const hair = await draw("on the couch");
    eq(hair.inputs.referenceImages.length, n0 + 1, "a hairstyle with a picture (the first one, picked at chance 1): one more image");
    eq(hair.positivePrompt.includes("styled exactly as in image"), true, "a hairstyle picture is named in the prompt");
    eq(!!W.stylePicture(`x ${R.STYLE_PICTURES["outfit-olive-cardigan"]}`, null) && W.stylePicture("nothing", null) === null, true, "stylePicture: the outfit's key, or null");
  } finally { globalThis.fetch = realFetch; [P.ROUTE, P.HAIR_CHANCE] = keep; Math.random = r0; }
}
{
  // RUNWARE.NUDE_LORAS (owner 2026-10-08: SNOFS on nude/explicit pictures only): added to LORAS on klein 9B when she's naked,
  // or for a sex act with SEX_ACTS on; never on clothed pictures or TwinFlow
  const R = W.CONFIG.PICTURE.RUNWARE, realFetch = globalThis.fetch, keep = [W.CONFIG.PICTURE.ROUTE, R.SEX_ACTS];
  let sent = [], failKlein = false;
  globalThis.fetch = async (url, init) => {
    const t = JSON.parse(init.body)[0]; sent.push(t);
    if (failKlein && t.model === R.MODEL) return new Response(JSON.stringify({ errors: [{ code: "x" }] }), { status: 400 });
    return new Response(JSON.stringify({ data: [{ imageBase64Data: "AAAA", cost: 0.001 }] }));
  };
  const loras = async (words) => { sent = []; try { await W.drawPicture({ RUNWARE_API_KEY: "k" }, `{who} ${words}`, { ledger: {} }); } catch (e) { /* Cloudflare has no AI binding here: the Runware calls are what this checks */ } return sent.map((t) => [t.model, (t.lora || []).map((l) => l.model).sort()]); };
  const base = Object.keys(R.LORAS).sort(), nude = [...base, ...Object.keys(R.NUDE_LORAS)].sort();
  try {
    W.CONFIG.PICTURE.ROUTE = "runware-klein"; R.SEX_ACTS = false;
    eq(await loras("in a gray sweater on the couch"), [[R.MODEL, base]], "clothed: klein 9B with LORAS only");
    eq(await loras("naked in bed"), [[R.MODEL, nude]], "nude: klein 9B with LORAS + NUDE_LORAS");
    failKlein = true;
    eq(await loras("naked in bed"), [[R.MODEL, nude], [R.MODEL, nude]], "klein fails: klein tries again with the same LoRAs, no TwinFlow (Cloudflare draws after; 2026-10-10)");
    failKlein = false;
    eq(await loras("having sex"), [[R.MODEL, base]], "a sex act with SEX_ACTS off: no NUDE_LORAS");
    R.SEX_ACTS = true;
    eq(await loras("having sex"), [[R.MODEL, nude]], "a sex act with SEX_ACTS on: NUDE_LORAS (the penis LoRA only when named, round 4)");
    // owner 2026-10-08 ("Ensure overall anatomical correctness"): Unchained misplaced the penis on penetration → left out with those act LoRAs
    for (const [words, act] of [["riding the man", "ferasalm:flux4play@1"], ["missionary", "ferasalm:missionary@1"]]) {
      const got = (await loras(words))[0][1];
      eq([got.includes(act), Object.keys(R.NUDE_LORAS).some((n) => got.includes(n))], [true, false], `${words}: ${act}, no NUDE_LORAS (NUDE_LORAS_OFF_WITH)`);
    }
    eq(await loras("the man fucking her ass, anal"), [[R.MODEL, ["ferasalm:povanal@1"]]], "anal: POV Doggy Anal alone (ALONE_LORAS), owner's test 2026-10-08");
    eq((await loras("sucking the man's cock, blowjob"))[0][1].includes(Object.keys(R.NUDE_LORAS)[0]), true, "a blowjob keeps NUDE_LORAS");
    // round 4: Runware's own size and sampler
    sent = []; await W.drawPicture({ RUNWARE_API_KEY: "k" }, "{who} on the couch", { ledger: {} });
    eq([sent[0].width, sent[0].height, sent[0].steps, sent[0].CFGScale, sent[0].acceleration], [R.WIDTH, R.HEIGHT, R.STEPS, R.CFG, R.ACCELERATION], "Runware: its own size, steps, CFG and acceleration sent");
    eq(sent[0].inputs.referenceImages[0].length > 150000, true, "Runware: the 2x face reference (BIG_FACE)");
    sent = []; await W.drawPicture({ RUNWARE_API_KEY: "k" }, "{who} on the couch", { ledger: {}, size: 480 });
    eq([sent[0].width, sent[0].height], [480, 480], "Runware: a size asked by the caller wins");
  } finally { globalThis.fetch = realFetch; [W.CONFIG.PICTURE.ROUTE, R.SEX_ACTS] = keep; }
  eq(Object.keys(R.NUDE_LORAS), ["ferasalm:unchained@2"], "nude LoRAs: Unchained (round 3)");
  eq(Object.keys(R.LORAS), ["ferasalm:phone2025@1", "ferasalm:ultrareal5@1", "ferasalm:instapic@1", "ferasalm:realhd2kc@1"], "every picture: phone2025, UltraReal, InstaPic, Real HD 2K (Real HD back 2026-10-09)");
}
{
  const yes = (v, label, got) => eq(!!v || got, true, label);
  // owner 2026-10-08: sex acts on (SEX_ACTS), the man from his point of view (POV_MAN), the new body (BODY "v2")
  const P = W.CONFIG.PICTURE, R = P.RUNWARE, keep = [P.ROUTE, R.SEX_ACTS], realFetch = globalThis.fetch;
  let sent = [];
  globalThis.fetch = async (url, init) => { sent.push(JSON.parse(init.body)[0]); return new Response(JSON.stringify({ data: [{ imageBase64Data: "AAAA", cost: 0.001 }] })); };
  const prompt = async (words) => { sent = []; await W.drawPicture({ RUNWARE_API_KEY: "k" }, `{who} ${words}`, { ledger: {} }); return sent[0].positivePrompt; };
  try {
    P.ROUTE = "runware-klein"; R.SEX_ACTS = true;
    eq(R.BODY, "v10", "Runware's body picture: the owner's 2026-10-10 nude front");
    eq(R.BODY_BACK, "v10-back", "acts from behind: the owner's 2026-10-10 nude back");
    yes(W.runwareBody() && W.runwareBody().length > 10000, "the nude front picture is built into face.js");
    eq(R.BODY_CLOTHED, "v10-clothed", "clothed pictures: the owner's 2026-10-10 rust halter picture (the nude one made unnamed outfits nude, round 7)");
    yes(W.runwareBody("back") && W.runwareBody("back").length !== W.runwareBody(true).length, "acts from behind: the body seen from behind (round 7)");
    yes(W.runwareBody(false).length !== W.runwareBody(true).length, "nude body only on nude/sex-act pictures");
    const clothed = await prompt("on the couch reading a book");
    yes(clothed.includes(R.DRESSED) && !clothed.includes(R.NAKED), "clothed: DRESSED, no NAKED");
    eq(W.picWords("you riding me on my bed"), "her riding the man on the man's bed", "/pic sex act: me/my are the man, you is her");
    eq(W.picWords("you in my shirt"), "her in her shirt", "/pic without a sex act: unchanged");
    yes(W.mayDraw("her giving a blowjob") && W.sexAct("her giving a blowjob"), "a sex act is drawn with the switch on");
    const act = await prompt("riding the man on the bed");
    yes(act.includes(R.POV_MAN) && act.includes(R.NAKED), "a sex act: POV_MAN added, and she is naked (round 7)", act.slice(-200));
    const part = await prompt("missionary sex, naked from the waist down, still wearing her black bra over her breasts");
    yes(part.includes(R.PARTIAL) && !part.includes(R.NAKED), "partly naked in a sex act: PARTIAL, not NAKED (round 7)", part.slice(-300));
    const dog = await prompt("the man fucking her doggy style on the bed");
    yes(dog.includes(R.NAKED_BACK) && !dog.includes(R.NAKED) && dog.includes("seen from behind: the same back") && !/breast/i.test(dog) && W.runwareBody("back"), "doggy: from behind, no breasts (round 7)", dog);
    const nude = await prompt("naked on the bed, her pussy in view");
    yes(nude.includes(R.NAKED) && !nude.includes(R.POV_MAN), "nude, no act: NAKED, no POV_MAN");
    eq(W.scenePicturePrompt("*She straddles you on the couch, riding you slowly, her hands on your chest.*"), "She straddles the man on the couch, riding the man slowly, her hands on the man's chest.", "scene: a sex-act sentence about him stays, he is the man");
    eq(W.scenePicturePrompt("*She sits beside you on the couch with a mug of tea. She tucks her feet under her, the gray cardigan sliding off one shoulder.*"), "She tucks her feet under her, the gray cardigan sliding off one shoulder.", "scene: a clothed sentence about him is still left out");
    // LoRAs by situation (owner 2026-10-08)
    const call = async (words, kind) => { sent = []; await W.drawPicture({ RUNWARE_API_KEY: "k" }, `{who} ${words}`, { ledger: {}, kind }); return { loras: (sent[0].lora || []).map((l) => l.model).sort(), text: sent[0].positivePrompt }; };
    const base = Object.keys(R.LORAS), nudeSet = Object.keys(R.NUDE_LORAS);
    let c = await call("in a gray sweater on the couch", "pic");
    eq(c.loras, [...base].sort(), "/pic, clothed: the base LoRAs only");
    c = await call("in a gray hoodie in her bedroom", "selfie");
    yes(c.loras.includes("ferasalm:instapic@1") && c.text.startsWith("instapic. "), "her selfie: InstaPic and its trigger word first", c.text.slice(0, 60));
    c = await call("in a gray sweater on the couch", "pic");
    yes(c.text.startsWith("instapic. ") && c.text.includes(R.PHOTO) && c.text.includes("Her face: "), "every picture: InstaPic's trigger, PHOTO and an expression + gaze", c.text.slice(0, 60));
    // the trigger words open the whole prompt, before the style line (they ran into it: "photo of instapic. This is ...")
    sent = []; await W.drawPicture({ RUNWARE_API_KEY: "k" }, W.customPicture("in a red sweater on the couch", 21).prompt, { ledger: {}, custom: true });
    c = { text: sent[0].positivePrompt };
    yes(c.text.startsWith("instapic. Realistic candid photo: This is a candid photograph") && !/photo of (instapic|this is)/i.test(c.text), "/pic: triggers first, then the style line, then phone2025's sentence", c.text.slice(0, 120));
    c = await call("a blowjob on the bed", "pic");
    yes(R.MOODS.ORAL.some((m) => c.text.includes(`Her face: ${m}`)) && !R.MOODS.ACT.some((m) => c.text.includes(m)), "a blowjob: an eyes-only expression (MOODS.ORAL), never an open-mouthed one", c.text.slice(-400));
    // round 5: /look and scene pictures find the act in her own words (SEX_CUES, gated by SEX_CONTEXT)
    eq(["*She sucks in a breath and laughs.*", "*She bends over to grab the laundry basket.*", "*She pops a strawberry in her mouth.*", "*She straddles your lap and kisses you slowly.*", "*She gets on all fours to look under the couch for the remote.*"].map(W.sexCue), ["", "", "", "", ""], "SEX_CUES: everyday lines are no sex act");
    eq(["*She wraps her lips around your cock.*", "*She takes you into her mouth, slow.*", "*She takes you all the way down her throat.*", "*She rides you hard, moaning.*", "*She gasps as you take her from behind.*", "*You press into her ass, slow.*", "*She pulls you down on top of her as you push inside her.*"].map(W.sexCue), ["a blowjob", "a blowjob", "deepthroat", "riding the man, cowgirl", "doggy style", "anal", "missionary"], "SEX_CUES: the act in her own words");
    const look = async (t) => { sent = []; await W.startPicture({ RUNWARE_API_KEY: "k" }, { rwUsd: 0 }, "scene", t, { history: [] }); return sent[0]; };
    let lk = await look("*She pulls you down on top of her, legs wrapping around your hips as you push inside her.*");
    yes(lk && lk.lora.some((l) => l.model === "ferasalm:missionary@1") && lk.positivePrompt.includes(W.CONFIG.PICTURE.SCENE_ACT_STYLE) && !lk.positivePrompt.includes("She is wearing") && lk.positivePrompt.includes("Sex act: missionary."), "/look missionary in her words: Missionary POV, his-eyes style, no clothes", lk && lk.positivePrompt.slice(0, 200));
    lk = await look("*She kneels between your legs and takes you into her mouth, slow.*");
    yes(lk && lk.lora.some((l) => l.model === "ferasalm:povdt@1") && Object.keys(R.ASPECTS.ORAL).map((k) => R.SIZES[k]).includes(`${lk.width}x${lk.height}`), "/look blowjob in her words: Holding Deepthroat POV, 1:1 or 16:9 (round 7)", lk && [lk.width, lk.height]);
    c = await call("riding the man on the bed", "pic");
    yes(Object.keys(R.ASPECTS.ACT).map((k) => R.SIZES[k]).includes(`${sent[0].width}x${sent[0].height}`), "other sex acts: 9:16, 1:1 or 16:9 (round 7)", [sent[0].width, sent[0].height]);
    c = await call("on the couch in a sweater", "pic");
    yes(sent[0].width === R.WIDTH && sent[0].height === R.HEIGHT && R.SIZES["9:16"] === `${R.WIDTH}x${R.HEIGHT}`, "every other picture: 9:16", [sent[0].width, sent[0].height]);
    c = await call("deepthroating the man", "pic");
    yes(c.loras.includes("ferasalm:povdt@1") && c.loras.length > 1, "deepthroat: Holding Deepthroat POV with the others (alone drifted her face 3/3, round 7)", c.loras);
    c = await call("smiling at the camera on the couch", "pic");
    yes(!c.text.includes("Her face: "), "words that name her face: no MOODS pick", c.text);
    c = await call("on the couch", "pic");
    yes(c.text.indexOf("Her face: ") < c.text.indexOf("on the couch"), "her expression comes before the scene words", c.text);
    c = await call("giving the man a blowjob, kneeling", "pic");
    yes(nudeSet.every((k) => c.loras.includes(k)) && c.loras.includes("ferasalm:povdt@1") && !c.loras.includes("ferasalm:penis@1") && !c.loras.includes("ferasalm:povhandc@1") && c.text.includes("POV deepthroat scene") && /first-person/i.test(c.text) && !/side view/i.test(c.text) && !c.text.includes("{close}"), "a blowjob: nude LoRAs + Holding Deepthroat POV, from his eyes, no side view, no penis LoRA", c.loras);
    yes(Object.values(R.ACT_SCENES).every((t) => !/side view/i.test(t) && (/first-person/i.test(t) || t.includes("{pov}"))), "every act scene: from his eyes, never a side view (round 4)");
    yes(Object.values(R.ACT_SCENES).every((t) => t.includes("{close}")), "every act scene: no room picture (tight framing)");
    c = await call("riding the man on the bed", "pic");
    yes(c.loras.includes("ferasalm:flux4play@1") && c.loras.length <= 6 && c.text.includes("c0wg1rl") && c.text.includes(R.POV_MAN), "riding: Flux 4 Play (c0wg1rl), POV_MAN kept, at most 6 LoRAs", c.loras);
    c = await call("naked on the bed, legs spread", "pic");
    yes(c.loras.includes("ferasalm:pussyd@1") && c.text.startsWith("instapic. hairy pussy"), "legs spread, no act: PussyDiffusion and its trigger first", c.loras);
    c = await call("riding the man on the bed, her pussy spread", "pic");
    yes(!c.loras.includes("ferasalm:pussyd@1") && !c.loras.includes("ferasalm:penis@1"), "riding: neither PussyDiffusion nor General Penis (round 8: both drew it wrong)", c.loras);
    c = await call("missionary on the bed", "pic");
    yes(c.loras.includes("ferasalm:penis@1") && c.loras.includes("ferasalm:missionary@1") && !c.loras.includes("ferasalm:pussyd@1") && c.loras.length <= 6, "missionary: General Penis (WITH_LORAS, round 8), no PussyDiffusion", c.loras);
    c = await call("doggy style on the bed", "pic");
    yes(c.loras.includes("ferasalm:penis@1") && c.loras.includes("ferasalm:flux4play@1"), "doggy: General Penis too", c.loras);
    c = await call("naked, holding the man's erect penis in her hand", "pic");
    yes(c.loras.includes("ferasalm:penis@1"), "a penis without an act LoRA: General Penis", c.loras);
    c = await call("the man fucking her anal doggystyle", "pic");
    yes(JSON.stringify(c.loras) === JSON.stringify(["ferasalm:povanal@1"]) && !c.text.includes("an4l") && c.text.includes("seen from behind") && c.text.includes("his penis inside her anus; below it, between her thighs, her vulva closed and untouched") && !c.text.includes("This is a candid photograph") && !c.text.includes("POV hand"), "anal: POV Doggy Anal alone, from behind, the vulva below her anus, no LORA_PREFIX (owner 2026-10-08)", c);
    c = await call("naked in bed", "pic");
    yes(!c.loras.includes("ferasalm:penis@1") && !c.loras.includes("ferasalm:flux4play@1"), "nude, no act: no act LoRAs", c.loras);
    c = await call("missionary sex on the bed", "scene");
    yes(c.loras.includes("ferasalm:missionary@1") && !c.loras.includes("ferasalm:povdt@1") && !c.text.includes("m15510n4ry"), "/look missionary: Missionary POV, no Flux 4 Play trigger", c.loras);
    c = await call("in a black dress, the man's hand on her waist", "pic");
    eq(c.loras, [...base].sort(), "his hand, clothed: the base LoRAs only (round 5: POV hand out)");
    eq(W.picWords("my hand on your waist, you in a black dress"), "the man's hand on her waist, her in a black dress", "/pic: 'my hand' is his");
    R.SEX_ACTS = false;
    yes(!W.mayDraw("her giving a blowjob") && !W.sexAct("her giving a blowjob"), "switch off: not drawn");
    eq(W.picWords("you riding me"), "her riding her", "switch off: /pic unchanged");
  } finally { globalThis.fetch = realFetch; [P.ROUTE, R.SEX_ACTS] = keep; }
}
{
  // owner 2026-10-10 ("where does the big belly come from"): her body words carry no belly, hip or thigh clauses and no hourglass
  const P = W.CONFIG.PICTURE, R = P.RUNWARE;
  const bodyWords = { "REFERENCE": P.REFERENCE, "LOOKS": P.LOOKS, "RUNWARE REFERENCE": R.REFERENCE, "RUNWARE LOOKS": R.LOOKS, "LINGERIE WHO": P.LINGERIE.WHO, "LINGERIE SPICY": P.LINGERIE.SPICY_PROMPT };
  for (const [name, text] of Object.entries(bodyWords)) eq(/belly|hourglass|wide hips|rounded hips|full thighs|round full bottom/i.test(String(text)), false, `${name}: no belly, hip or thigh words (2026-10-10)`);
  eq(typeof JSON.parse(P.LINGERIE.SPICY_PROMPT), "object", "LINGERIE SPICY_PROMPT: still valid JSON after the cut");
  eq(R.KLEIN_TRIES, 2, "her pictures: klein tried twice, then Cloudflare klein (no TwinFlow)");
}
// The studio's log (Step 1c, docs/WORKPLAN.md): one D1 row per picture with the prompt, LoRAs and seed that were sent; no
// binding, or a failed write: the picture still comes back. Runware is stubbed here (nothing is paid).
{
  const TINY = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==";
  const realFetch = globalThis.fetch;
  const sentTasks = [];
  globalThis.fetch = async (url, init) => {
    if (String(url) !== "https://api.runware.ai/v1") throw new Error(`unit: unexpected request to ${url}`);
    const tasks = JSON.parse(init.body);
    sentTasks.push(...tasks);
    return new Response(JSON.stringify({ data: tasks.map((t) => ({ taskUUID: t.taskUUID, imageBase64Data: TINY, cost: 0.0025 })), errors: [] }), { status: 200 });
  };
  // a fake D1: batch() counts (the schema; each statement prepared alone), prepare().bind().run() records the INSERTs and
  // UPDATEs (or throws); exec() fails like D1's on a statement that spans lines
  const studio = (failWrites = false) => {
    const db = { execs: 0, inserts: [], updates: [], schema: [] };
    db.exec = async (sql) => {
      if (sql.split("\n").some((l) => l.trim() && !l.trim().endsWith(";"))) throw new Error("unit: D1_EXEC_ERROR: incomplete input");
    };
    db.batch = async (stmts) => {
      db.execs++;
      db.schema.push(...stmts.map((st) => st.sql));
      return stmts.map(() => ({ success: true }));
    };
    db.prepare = (sql) => ({
      sql,
      bind: (...args) => ({
        run: async () => {
          if (failWrites) throw new Error("unit: D1 is down");
          if (sql.startsWith("INSERT")) db.inserts.push({ sql, args });
          else db.updates.push({ sql, args });
          return { meta: { last_row_id: db.inserts.length } };
        },
      }),
    });
    return db;
  };
  const columns = (row) => Object.fromEntries(row.sql.match(/\((.*?)\) VALUES/)[1].split(", ").map((c, i) => [c, row.args[i]]));
  try {
    const db = studio();
    const env = { RUNWARE_API_KEY: "unit-key", STUDIO_DB: db };
    const ledger = { rwUsd: 0, rwFailed: 0 };
    const first = await W.drawPicture(env, "{who} selfie in her kitchen, gray cardigan.", { ledger, kind: "selfie", log: { source: "selfie", chat: 7, asked: "send a pic", herWords: "here" } });
    const second = await W.drawPicture(env, "{who} selfie in her kitchen, gray cardigan.", { ledger, kind: "selfie", log: { source: "selfie" } });
    const row = columns(db.inserts[0]);
    eq([db.execs, db.inserts.length], [1, 2], "studio: schema applied once, one row per picture");
    eq([db.schema.length, db.schema.every((q) => /^CREATE (TABLE|INDEX) IF NOT EXISTS/.test(q) && !q.includes(";"))], [3, true], "studio: the schema as three single statements");
    eq([first.logId, second.logId], [1, 2], "studio: drawPicture returns the row id");
    eq([row.ok, row.source, row.chat, row.asked, row.model, row.kind], [1, "selfie", "7", "send a pic", "runware:400@2", "clothed"], "studio row: ok, source, chat, his words, model, kind");
    eq([row.seed === sentTasks[0].seed, typeof row.seed === "number" && row.seed >= 1], [true, true], "studio row: the seed sent to Runware");
    eq([row.prompt === sentTasks[0].positivePrompt, JSON.parse(row.loras)], [true, sentTasks[0].lora], "studio row: the prompt and LoRAs sent");
    eq(JSON.parse(row.refs).length > 0 && JSON.parse(row.refs)[0] === "face-2x", true, "studio row: the references by name (the 2x face first)");
    eq(sentTasks[0].seed !== sentTasks[1].seed, true, "each picture gets its own seed");
    await W.logSent(env, first.logId, [{ file_id: "small", width: 90 }, { file_id: "mid", width: 320 }, { file_id: "big", width: 800 }]);
    eq(db.updates[0].args, ["mid", "big", 1], "studio: Telegram thumb = the largest copy at most 400 px, full = the last");
    const bare = await W.drawPicture({ RUNWARE_API_KEY: "unit-key" }, "{who} photo of her", { ledger: { rwUsd: 0, rwFailed: 0 }, kind: "selfie" });
    eq([bare.bytes instanceof Uint8Array && bare.bytes.length > 0, bare.logId], [true, null], "studio: no binding, the picture still comes back");
    const broken = await W.drawPicture({ RUNWARE_API_KEY: "unit-key", STUDIO_DB: studio(true) }, "{who} photo of her", { ledger: { rwUsd: 0, rwFailed: 0 }, kind: "selfie" });
    eq([broken.bytes instanceof Uint8Array && broken.bytes.length > 0, broken.logId], [true, null], "studio: a failed write costs the row, not the picture");
    const plan = W.runwarePlan("{who} photo of her in the kitchen", { herself: true, kind: "selfie", ref: W.fromBase64(TINY), rwFace: W.fromBase64(TINY), faceName: "face-2x", width: 576, height: 1024, who: (w) => w });
    const R = W.CONFIG.PICTURE.RUNWARE;
    eq([plan.tries.length, plan.tries.every((t) => t.model === R.MODEL), plan.tries[0].steps === Number(R.STEPS), plan.tries[0].refs[0].name], [2, true, true, "face-2x"], "plan: klein twice (KLEIN_TRIES), sampler from RUNWARE, the 2x face first");
    eq(W.pictureFlags("a black lace bodysuit", false).kind, "alone", "plan flags: /look without her is alone");
    // /nsfw (Step 2, 2026-10-11): the levels, what each allows, the nude tier's odds, and her own selfies at Off
    {
      const P = W.CONFIG.PICTURE;
      const saved = { route: P.ROUTE, sex: P.RUNWARE.SEX_ACTS };
      P.ROUTE = "runware-klein"; P.RUNWARE.SEX_ACTS = true;
      eq([W.nsfwLevel({}), W.nsfwLevel({ nsfw: "off" }), W.nsfwLevel({ nsfw: "NUDE" }), W.nsfwLevel({ nsfw: "bogus" })], ["on", "off", "nude", "on"], "/nsfw: a chat that never set it is On; off and nude read; an unknown value is the default");
      eq([W.mayDraw("naked", "off"), W.mayDraw("naked", "nude"), W.mayDraw("naked", "on"), W.mayDraw("lingerie", "off"), W.mayDraw("blowjob", "nude"), W.mayDraw("blowjob", "on")], [false, true, true, true, false, true], "/nsfw: mayDraw by level (nudity at Nude, no sex acts at Nude, lingerie at Off)");
      eq([W.levelFor("naked"), W.levelFor("blowjob"), W.levelFor("lingerie")], ["nude", "on", "off"], "/nsfw: the lowest level a picture's words need");
      eq([W.sexAct("blowjob", "nude"), W.sexAct("blowjob", "on"), W.sexCue("*She wraps her lips around your cock.*", "off"), W.sexCue("*She wraps her lips around your cock.*", "on")], [false, true, "", "a blowjob"], "/nsfw: sex acts (sexAct, sexCue) only at On");
      eq([W.pictureFlags("naked on the bed", true, "off").kind, W.pictureFlags("naked on the bed", true, "nude").kind, W.pictureFlags("blowjob", true, "nude").act], ["clothed", "nude", false], "/nsfw: a picture is clothed at Off whatever its words; nude at Nude");
      const draws = (heat, level, n = 3000) => Array.from({ length: n }, () => W.pickTier({ heat, level })).filter((t) => t === "nude").length / n;
      const hot = draws(2, "on"), calm = draws(0, "on"), hotOff = draws(2, "off");
      eq([Math.abs(hot - 0.33) <= 0.03, calm, hotOff, W.pickTier({ asked: "send nudes", level: "on" }), W.pickTier({ asked: "send nudes", level: "off" })], [true, 0, 0, "nude", "boudoir"], "/nsfw: the nude tier 1 in 3 when hot (±3 points), never when calm or Off; send nudes is nude at On, boudoir at Off");
      const selfOff = W.selfiePicture({ want: "naked on the bed", level: "off", recent: [], recentShots: [] });
      eq([selfOff.tier, /\bnaked\b/i.test(selfOff.prompt)], ["boudoir", false], "/nsfw: her [selfie: naked ...] at Off is boudoir, with no nudity in it");
      const selfNude = W.selfiePicture({ asked: "send nudes", level: "on", recent: [], recentShots: [] });
      eq([selfNude.tier, /naked|topless/i.test(selfNude.prompt)], ["nude", true], "/nsfw: the nude tier names its nudity (its wardrobe, or her words)");
      eq([/never show you fully naked/.test(P.SELF_CHOICE), P.SELF_CHOICE.endsWith("{nude}")], [false, true], "/nsfw: SELF_CHOICE has no 'never naked' rule and ends with {nude}");
      P.ROUTE = saved.route; P.RUNWARE.SEX_ACTS = saved.sex;
    }
    // klein's retry: the next seed, and the log row names the one that drew
    const okFetch = globalThis.fetch;
    let calls = 0;
    const seeds = [];
    globalThis.fetch = async (url, init) => {
      const tasks = JSON.parse(init.body);
      seeds.push(tasks[0].seed);
      if (calls++ === 0) return new Response(JSON.stringify({ data: [], errors: [{ message: "unit: no picture" }] }), { status: 200 });
      return okFetch(url, init);
    };
    const rdb = studio();
    const again = await W.drawPicture({ RUNWARE_API_KEY: "unit-key", STUDIO_DB: rdb }, "{who} photo of her", { ledger: { rwUsd: 0, rwFailed: 0 }, kind: "selfie", seed: 41 });
    const rrow = columns(rdb.inserts[0]);
    eq([seeds, rrow.attempts, rrow.seed, again.logId], [[41, 42], 2, 42, 1], "klein's retry sends the next seed; the row keeps the one that drew");
    globalThis.fetch = okFetch;
  } finally {
    globalThis.fetch = realFetch;
  }
}

// Gemini TTS answers raw 24 kHz 16-bit mono PCM; pcmToMp3 makes a real MP3 of it (frame sync 0xFFE, much smaller)
{
  const pcm = new Int16Array(48000).map((_, i) => Math.round(9000 * Math.sin(i / 7))).buffer; // 2 s tone
  const mp3 = new Uint8Array(W.pcmToMp3(pcm));
  eq([mp3[0] === 0xff && (mp3[1] & 0xe0) === 0xe0, mp3.length > 1000 && mp3.length < pcm.byteLength / 5], [true, true], "pcmToMp3 gives an MP3 frame stream");
}

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
