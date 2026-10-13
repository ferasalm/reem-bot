// Unit tests: node tools/test/unit.mjs (expects the default CONFIG; uses the real clock for quiet-hour checks)
import { loadWorker } from "./load-worker.mjs";
const W = await loadWorker();
W.CONFIG.PICTURE.WRITER.ON = false; // the picture writer (Step C): its own rows turn it on
W.CONFIG.PICTURE.ANATOMY.ON = false; // the anatomy check (Step D): its own rows turn it on
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
  const R = W.CONFIG.PICTURE.RUNWARE, keep = [R.LORAS, R.LORA_PREFIX, R.ANATOMY_LORAS], realFetch = globalThis.fetch, sent = [];
  R.LORAS = { "ferasalm:phone2025@1": "0.8", "ferasalm:realhd2k@1": 0 }; R.LORA_PREFIX = "Candid phone photo of"; R.ANATOMY_LORAS = {};
  globalThis.fetch = async (url, init) => { sent.push(JSON.parse(init.body)[0]); return new Response(JSON.stringify({ data: [{ imageBase64Data: "AAAA", cost: 0.001 }] })); };
  try {
    // runwarePlan chooses the LoRAs (Step 1b: drawRunware only sends what it is given); the plan's tries are sent as drawPicture does
    const plan = W.runwarePlan("words", { herself: false, width: 576, height: 1024, who: (w) => w });
    for (const t of plan.tries) await W.drawRunware({ RUNWARE_API_KEY: "k" }, t.model, t.text, [], t.width, t.height, { loras: t.loras, steps: t.steps, cfg: t.cfg, acceleration: t.acceleration });
  } finally { globalThis.fetch = realFetch; [R.LORAS, R.LORA_PREFIX, R.ANATOMY_LORAS] = keep; }
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
    // owner 2026-10-12 ("Drop flash LoRA"): FLASH_LORAS empty, so a flash ask is words only: the usual LoRAs, no flash trigger or light
    const usual = [...Object.keys(R.LORAS), ...Object.keys(R.ANATOMY_LORAS)].sort();
    const flash = await draw("in a black slip dress on her bed, with flash");
    eq([flash.lora.map((l) => l.model).sort(), flash.positivePrompt.includes(R.FLASH_TRIGGER), flash.positivePrompt.includes(R.PHOTO)], [usual, false, true], "flash asked (2026-10-12): no flash LoRA or trigger, the usual LoRAs and PHOTO");
    const plain = await draw("in a black slip dress on her bed");
    eq(plain.lora.map((l) => l.model).sort(), usual, "no flash asked: the usual LoRAs (Lenovo + Anatomy Fixer)");
    eq(W.customPicture("you in a slip dress with flash", 22).prompt.includes(R.FLASH_LIGHT), false, "/pic with flash (2026-10-12): no flash light, the time's");
    eq(W.customPicture("you by candlelight in your bedroom", 22).prompt.includes("Lit by"), false, "/pic naming its light (candlelight): no light picked");
    eq(!!(!W.composePicture({ words: "on the porch at golden hour", hour: 21 }).prompt.includes("lamp")), true, "her words name the light: no LIGHT pick");
    P.HAIR_CHANCE = 1; Math.random = () => 0;
    const hair = await draw("on the couch");
    eq(!!(hair.positivePrompt.includes(`Her hair: ${P.HAIRSTYLES[0]}.`) && hair.positivePrompt.includes("same face, hair color")), true, "a hairstyle: named, her hair color kept");
    eq(!!(!(await draw("on the couch, her hair in a ponytail")).positivePrompt.includes("Her hair:")), true, "the words name her hair: no hairstyle picked");
  } finally { globalThis.fetch = realFetch; [P.ROUTE, P.HAIR_CHANCE] = keep; Math.random = r0; }
}
{
  // owner 2026-10-10: a hairstyle with a picture (RUNWARE.STYLE_PICTURES) sends that picture as the next image, after face, body and place,
  // and names it. 2026-10-12 (owner): the outfit pictures are retired and the clothed body is v11-clothed (bra + thong), or its back
  const P = W.CONFIG.PICTURE, R = P.RUNWARE, realFetch = globalThis.fetch, keep = [P.ROUTE, P.HAIR_CHANCE], r0 = Math.random;
  let sent = [];
  globalThis.fetch = async (url, init) => { sent.push(JSON.parse(init.body)[0]); return new Response(JSON.stringify({ data: [{ imageBase64Data: "AAAA", cost: 0.001 }] })); };
  const draw = async (words, opts = {}) => { sent = []; await W.drawPicture({ RUNWARE_API_KEY: "k" }, `{who} ${words}`, { ledger: {}, ...opts }); return sent[0]; };
  try {
    P.ROUTE = "runware-klein"; P.HAIR_CHANCE = 0; Math.random = () => 0;
    const plain = await draw("on the couch reading a book");
    const n0 = plain.inputs.referenceImages.length;
    eq(n0, 2, "a clothed picture sends her face and the clothed body (2026-10-12)");
    eq(!!(plain.positivePrompt.includes("not image 1's black bra and thong") && plain.positivePrompt.includes("full upper arms and soft body")), true, "clothed: REFERENCE_CLOTHED keeps image 1's underwear out, full upper arms and a soft body");
    const named = (words) => W.runwarePlan(`{who} ${words}`, { ref: new Uint8Array([1]), rwFace: new Uint8Array([1]), faceName: "face-2x", who: (w, a, b) => w }).tries[0];
    eq(named("on the couch reading a book").refs.map((r) => r.name), ["face-2x", "body-v11-clothed"], "clothed: image 1 is v11-clothed");
    const belfie = named("a belfie in tight jeans, looking over her shoulder");
    eq([belfie.refs.map((r) => r.name), belfie.text.includes("not image 1's black thong")], [["face-2x", "body-v11-clothed-back"], true], "a clothed back view: image 1 is v11-clothed-back, REFERENCE_CLOTHED_BACK");
    // the place's image number follows the pictures really sent (Step 5: "none" said "image 2" with only face and place sent)
    const roomN = async () => ((await draw("making coffee {room}", { location: "kitchen" })).positivePrompt.match(/as in image (\d)/) || [])[1];
    eq(await roomN(), "2", "with a body picture the place is image 2");
    const camel = await draw("on the couch in a long camel wool coat open over a black turtleneck and charcoal trousers");
    eq([camel.inputs.referenceImages.length, camel.positivePrompt.includes("wearing exactly image 1's clothes")], [2, false], "a retired outfit picture's words: face + clothed body, no outfit picture (2026-10-12)");
    P.HAIR_CHANCE = 1;
    const hair = await draw("on the couch");
    eq(hair.inputs.referenceImages.length, n0 + 1, "a hairstyle with a picture (the first one, picked at chance 1): one more image");
    eq(hair.positivePrompt.includes("styled exactly as in image"), true, "a hairstyle picture is named in the prompt");
    eq([W.stylePicture("x a fitted olive ribbed cami and soft olive cotton shorts under a long, open cream chunky-knit cardigan", null), (W.stylePicture("x", R.STYLE_PICTURES["hair-long-waves"]) || {}).key], [null, "hair-long-waves"], "stylePicture: hairstyles only (2026-10-12), else null");
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
  // 2026-10-12 (owner): Lenovo on every picture, NSFW Unlocked on nude and sex pictures, Anatomy Fixer when not a sex act
  const anat = Object.keys(R.ANATOMY_LORAS), base = [...Object.keys(R.LORAS), ...anat].sort(), nude = [...base, ...Object.keys(R.NUDE_LORAS)].sort();
  const act = [...Object.keys(R.LORAS), ...Object.keys(R.NUDE_LORAS)].sort();
  try {
    W.CONFIG.PICTURE.ROUTE = "runware-klein"; R.SEX_ACTS = false;
    eq(await loras("in a gray sweater on the couch"), [[R.MODEL, base]], "clothed: klein 9B with LORAS + ANATOMY_LORAS");
    eq(await loras("naked in bed"), [[R.MODEL, nude]], "nude: klein 9B with LORAS + NUDE_LORAS + ANATOMY_LORAS");
    failKlein = true;
    eq(await loras("naked in bed"), [[R.MODEL, nude], [R.MODEL, nude]], "klein fails: klein tries again with the same LoRAs, no TwinFlow (Cloudflare draws after; 2026-10-10)");
    failKlein = false;
    eq(await loras("having sex"), [[R.MODEL, base]], "a sex act with SEX_ACTS off: no NUDE_LORAS");
    R.SEX_ACTS = true;
    eq(await loras("having sex"), [[R.MODEL, act]], "a sex act with SEX_ACTS on: LORAS + NUDE_LORAS, no Anatomy Fixer (owner 2026-10-12)");
    // 2026-10-12 (owner: no act LoRA for now): riding and missionary are Lenovo + NSFW Unlocked only
    for (const words of ["riding the man", "missionary"]) eq(await loras(words), [[R.MODEL, act]], `${words}: Lenovo + NSFW Unlocked, no act LoRA (2026-10-12)`);
    eq(await loras("the man fucking her ass doggy style, anal"), [[R.MODEL, act]], "doggy + anal: Lenovo + NSFW Unlocked (owner 2026-10-13: POV Doggy Anal changed her face 4/4)");
    eq(await loras("the man fucking her ass, anal, prone bone"), [[R.MODEL, act]], "anal not doggy: no POV Doggy Anal (owner 2026-10-12: doggy AND anal only)");
    eq((await loras("sucking the man's cock, blowjob"))[0][1].includes(Object.keys(R.NUDE_LORAS)[0]), true, "a blowjob keeps NUDE_LORAS");
    // round 4: Runware's own size and sampler
    sent = []; await W.drawPicture({ RUNWARE_API_KEY: "k" }, "{who} on the couch", { ledger: {} });
    eq([sent[0].width, sent[0].height, sent[0].steps, sent[0].CFGScale, sent[0].acceleration], [R.WIDTH, R.HEIGHT, R.STEPS, R.CFG, R.ACCELERATION], "Runware: its own size, steps, CFG and acceleration sent");
    eq(sent[0].inputs.referenceImages[0].length > 150000, true, "Runware: the 2x face reference (BIG_FACE)");
    sent = []; await W.drawPicture({ RUNWARE_API_KEY: "k" }, "{who} on the couch", { ledger: {}, size: 480 });
    eq([sent[0].width, sent[0].height], [480, 480], "Runware: a size asked by the caller wins");
  } finally { globalThis.fetch = realFetch; [W.CONFIG.PICTURE.ROUTE, R.SEX_ACTS] = keep; }
  eq(Object.entries(R.NUDE_LORAS), [["ferasalm:nsfwunlock@1", 0.8]], "nude LoRAs: NSFW Unlocked V2 at 0.8 (owner 2026-10-12)");
  eq([Object.entries(R.LORAS), R.MAX_LORAS, R.STEPS, R.CFG], [[["ferasalm:lenovoc@1", 1.3]], 3, 6, 2], "every picture: Lenovo UltraReal at 1.3, at most 3 LoRAs, 6 steps, CFG 2 (owner 2026-10-12)");
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
    eq([R.BODY_CLOTHED, R.BODY_CLOTHED_BACK], ["v11-clothed", "v11-clothed-back"], "clothed pictures: the owner's 2026-10-12 bra-and-thong pictures, front and back");
    yes(W.runwareBody("back") && W.runwareBody("back").length !== W.runwareBody(true).length, "acts from behind: the body seen from behind (round 7)");
    yes(W.runwareBody(false).length !== W.runwareBody(true).length, "nude body only on nude/sex-act pictures");
    const clothed = await prompt("on the couch reading a book");
    yes(!clothed.includes(R.DRESSED) && !clothed.includes(R.NAKED) && clothed.includes("she wears only the clothes described here"), "clothed: no DRESSED on the clothed body (Step B: REFERENCE_CLOTHED says it), no NAKED");
    eq(W.picWords("you riding me on my bed"), "Her riding the man on his bed", "/pic sex act: me is the man, my is his, you is her");
    eq(W.picWords("you in my shirt"), "Her in his shirt", "/pic without a sex act: my is his too (Step B: he is the camera)");
    // Step B (2026-10-13): every hand has an owner (ownHands), on every Runware and Cloudflare prompt
    for (const [t, want] of [["leaning back on one hand", "leaning back on one of her hands"], ["a hand on her hip", "one of her hands on her hip"], ["both hands in her hair", "both her hands in her hair"], ["hands on her hips, smiling", "her hands on her hips, smiling"], ["Hands in her pockets", "Her hands in her pockets"], ["her hip, hand on the door", "her hip, her hand on the door"],
      ["his hands on her hips", "his hands on her hips"], ["the man's hands on her butt", "the man's hands on her butt"], ["his big rough hands", "his big rough hands"], ["on her hands and knees", "on her hands and knees"], ["one of her hands on his chest", "one of her hands on his chest"], ["hand-knit sweater, second-hand coat", "hand-knit sweater, second-hand coat"], ["no phone and no hands unless described", "no phone and no hands unless described"]])
      eq(W.ownHands(t), want, `ownHands: ${t}`);
    // Step B: he is the camera (asCamera): his name, I/me/my and her name; a clause that opens with him loses him
    const feras = { name: "Feras" };
    eq(W.asCamera("Feras having sex with Reem", feras), "Having sex with her", "asCamera: D1 485, his name as the subject goes, hers is her");
    eq(W.asCamera("Feras PoV of spooning with Reem", feras), "PoV of spooning with her", "asCamera: D1 491");
    eq(W.asCamera("I'm fucking you from behind", feras), "Fucking her from behind", "asCamera: I'm as the subject goes");
    eq(W.asCamera("Reem's legs over Feras's shoulders", feras), "Her legs over the man's shoulders", "asCamera: possessives");
    eq(W.asCamera("The man sits on the edge of a bed, and she is right beside him, their shoulders touching."), "She is close beside the camera, their shoulders touching", "asCamera: /look 484, where he sits goes (the man was drawn 2/2)");
    eq(W.asCamera("the man fucks her doggy style"), "The man fucks her doggy style", "asCamera: an act clause keeps its words");
    {
      const P = W.CONFIG.PICTURE, was = P.CAMERA;
      eq(W.cloudflareText("She straddles the man lying on his back").startsWith("She straddles the man lying on his back"), true, "CAMERA third: the man stays");
      P.CAMERA = "first";
      eq(W.cloudflareText("She straddles the man lying on his back, the man is fucking her").split(". Natural")[0].replace(/ Natural.*$/, ""), "She straddles me lying on my back, I am fucking her", "CAMERA first: me / my / I am");
      P.CAMERA = was;
      const c = W.customPicture(W.picWords("Feras PoV of spooning with Reem", "on", feras), 14, null, "on");
      yes(c.prompt.includes(P.POV_CLOTHED) && !/Feras|Reem/.test(c.prompt), "/pic with him, no sex act: POV_CLOTHED, no names (D1 491)");
      yes(!W.customPicture(W.picWords("in a red dress on the porch", "on", feras), 14, null, "on").prompt.includes(P.POV_CLOTHED), "/pic without him: no POV_CLOTHED");
      yes(!W.customPicture(W.picWords("Feras having sex with Reem, riding him", "on", feras), 14, null, "on").prompt.includes(P.POV_CLOTHED), "/pic sex act: POV_MAN (in runwarePlan), not POV_CLOTHED");
    }
    yes(W.mayDraw("her giving a blowjob") && W.sexAct("her giving a blowjob"), "a sex act is drawn with the switch on");
    const act = await prompt("riding the man on the bed");
    yes(act.includes(R.POV_MAN) && act.includes(R.NAKED), "a sex act: POV_MAN added, and she is naked (round 7)", act.slice(-200));
    const part = await prompt("missionary sex, naked from the waist down, still wearing her black bra over her breasts");
    yes(part.includes(R.PARTIAL_TOP) && part.includes("A thick, untrimmed dark bush") && !part.includes(R.NAKED) && !part.includes("natural breasts"), "partly naked in a sex act, a bra kept on: PARTIAL_TOP + the bush, not NAKED (round 7, Step 5)", part.slice(-300));
    const dog = await prompt("the man fucking her doggy style on the bed");
    yes(dog.includes(R.NAKED_BACK) && !dog.includes(R.NAKED) && dog.includes("seen from behind: the same back") && !/breast/i.test(dog) && W.runwareBody("back"), "doggy: from behind, no breasts (round 7)", dog);
    const nude = await prompt("naked on the bed, her pussy in view");
    yes(nude.includes(R.NAKED) && !nude.includes(R.POV_MAN), "nude, no act: NAKED, no POV_MAN");
    eq(W.scenePicturePrompt("*She straddles you on the couch, riding you slowly, her hands on your chest.*"), "She straddles the man on the couch, riding the man slowly, her hands on the man's chest.", "scene: a sex-act sentence about him stays, he is the man");
    eq(W.scenePicturePrompt("*She sits beside you on the couch with a mug of tea. She tucks her feet under her, the gray cardigan sliding off one shoulder.*"), "She tucks her feet under her, the gray cardigan sliding off one shoulder.", "scene: a clothed sentence about him is still left out");
    // LoRAs by situation (owner 2026-10-08)
    const call = async (words, kind) => { sent = []; await W.drawPicture({ RUNWARE_API_KEY: "k" }, `{who} ${words}`, { ledger: {}, kind }); return { loras: (sent[0].lora || []).map((l) => l.model).sort(), text: sent[0].positivePrompt }; };
    const base = Object.keys(R.LORAS), nudeSet = Object.keys(R.NUDE_LORAS), anat = Object.keys(R.ANATOMY_LORAS);
    const actSet = [...base, ...nudeSet].sort();
    let c = await call("in a gray sweater on the couch", "pic");
    eq(c.loras, [...base, ...anat].sort(), "/pic, clothed: Lenovo + Anatomy Fixer (2026-10-12)");
    c = await call("in a gray hoodie in her bedroom", "selfie");
    yes(c.loras.includes("ferasalm:lenovoc@1") && !c.text.startsWith("instapic"), "her selfie: Lenovo, no InstaPic trigger (2026-10-12)", c.text.slice(0, 60));
    c = await call("in a gray sweater on the couch", "pic");
    yes(c.text.includes(R.PHOTO) && c.text.includes("Her face: "), "every picture: PHOTO and an expression + gaze", c.text.slice(0, 60));
    // the trigger words open the whole prompt, before the style line (they ran into it: "photo of instapic. This is ...")
    sent = []; await W.drawPicture({ RUNWARE_API_KEY: "k" }, W.customPicture("in a red sweater on the couch", 21).prompt, { ledger: {}, custom: true });
    c = { text: sent[0].positivePrompt };
    yes(c.text.startsWith("Realistic candid photo") && !/smartphone/i.test(c.text), "/pic: no trigger words, no smartphone sentence (2026-10-12: Lenovo has no trigger)", c.text.slice(0, 120));
    c = await call("a blowjob on the bed", "pic");
    yes(R.MOODS.ORAL.some((m) => c.text.includes(`Her face: ${m}`)) && !R.MOODS.ACT.some((m) => c.text.includes(m)), "a blowjob: an eyes-only expression (MOODS.ORAL), never an open-mouthed one", c.text.slice(-400));
    // round 5: /look and scene pictures find the act in her own words (SEX_CUES, gated by SEX_CONTEXT)
    eq(["*She sucks in a breath and laughs.*", "*She bends over to grab the laundry basket.*", "*She pops a strawberry in her mouth.*", "*She straddles your lap and kisses you slowly.*", "*She gets on all fours to look under the couch for the remote.*"].map(W.sexCue), ["", "", "", "", ""], "SEX_CUES: everyday lines are no sex act");
    eq(["*She wraps her lips around your cock.*", "*She takes you into her mouth, slow.*", "*She takes you all the way down her throat.*", "*She rides you hard, moaning.*", "*She gasps as you take her from behind.*", "*You press into her ass, slow.*", "*She pulls you down on top of her as you push inside her.*"].map(W.sexCue), ["a blowjob", "a blowjob", "deepthroat", "riding the man, cowgirl", "doggy style", "anal", "missionary"], "SEX_CUES: the act in her own words");
    const look = async (t) => { sent = []; await W.startPicture({ RUNWARE_API_KEY: "k" }, { rwUsd: 0 }, "scene", t, { history: [] }); return sent[0]; };
    let lk = await look("*She pulls you down on top of her, legs wrapping around your hips as you push inside her.*");
    yes(lk && JSON.stringify(lk.lora.map((l) => l.model).sort()) === JSON.stringify(actSet) && lk.positivePrompt.includes(W.CONFIG.PICTURE.SCENE_ACT_STYLE) && !lk.positivePrompt.includes("She is wearing") && lk.positivePrompt.includes("Sex act: missionary."), "/look missionary in her words: Lenovo + NSFW Unlocked (2026-10-12), his-eyes style, no clothes", lk && lk.positivePrompt.slice(0, 200));
    lk = await look("*She kneels between your legs and takes you into her mouth, slow.*");
    yes(lk && !lk.lora.some((l) => l.model === "ferasalm:povdt@1") && Object.keys(R.ASPECTS.ORAL).map((k) => R.SIZES[k]).includes(`${lk.width}x${lk.height}`), "/look blowjob in her words: no act LoRA (2026-10-12), 1:1 or 16:9 (round 7)", lk && [lk.width, lk.height]);
    c = await call("riding the man on the bed", "pic");
    yes(Object.keys(R.ASPECTS.ACT).map((k) => R.SIZES[k]).includes(`${sent[0].width}x${sent[0].height}`), "other sex acts: 9:16, 1:1 or 16:9 (round 7)", [sent[0].width, sent[0].height]);
    c = await call("on the couch in a sweater", "pic");
    yes(sent[0].width === R.WIDTH && sent[0].height === R.HEIGHT && R.SIZES["9:16"] === `${R.WIDTH}x${R.HEIGHT}`, "every other picture: 9:16", [sent[0].width, sent[0].height]);
    c = await call("deepthroating the man", "pic");
    eq(c.loras, actSet, "deepthroat: Lenovo + NSFW Unlocked, no Holding Deepthroat POV (2026-10-12)");
    c = await call("smiling at the camera on the couch", "pic");
    yes(!c.text.includes("Her face: "), "words that name her face: no MOODS pick", c.text);
    c = await call("on the couch", "pic");
    yes(c.text.indexOf("Her face: ") < c.text.indexOf("on the couch"), "her expression comes before the scene words", c.text);
    c = await call("giving the man a blowjob, kneeling", "pic");
    yes(JSON.stringify(c.loras) === JSON.stringify(actSet) && !c.text.includes("POV deepthroat scene") && /first-person/i.test(c.text) && !/side view/i.test(c.text) && !c.text.includes("{close}"), "a blowjob: Lenovo + NSFW Unlocked (2026-10-12), from his eyes, no side view", c.loras);
    yes(Object.values(R.ACT_SCENES).every((t) => !/side view/i.test(t) && (/first-person/i.test(t) || t.includes("{pov}"))), "every act scene: from his eyes, never a side view (round 4)");
    yes(Object.values(R.ACT_SCENES).every((t) => t.includes("{close}")), "every act scene: no room picture (tight framing)");
    c = await call("riding the man on the bed", "pic");
    yes(JSON.stringify(c.loras) === JSON.stringify(actSet) && !c.text.includes("c0wg1rl") && c.text.includes(R.POV_MAN), "riding: Lenovo + NSFW Unlocked, no Flux 4 Play trigger, POV_MAN kept (2026-10-12)", c.loras);
    c = await call("naked on the bed, legs spread", "pic");
    yes(!c.loras.includes("ferasalm:pussyd@1") && !c.text.startsWith("hairy pussy") && c.loras.length <= R.MAX_LORAS, "legs spread, no act: no PussyDiffusion (2026-10-12)", c.loras);
    c = await call("riding the man on the bed, her pussy spread", "pic");
    yes(!c.loras.includes("ferasalm:pussyd@1") && !c.loras.includes("ferasalm:penis@1"), "riding: neither PussyDiffusion nor General Penis (round 8: both drew it wrong)", c.loras);
    c = await call("missionary on the bed", "pic");
    eq(c.loras, actSet, "missionary: Lenovo + NSFW Unlocked, no General Penis or Missionary (2026-10-12)");
    c = await call("doggy style on the bed", "pic");
    eq(c.loras, actSet, "doggy (vaginal): Lenovo + NSFW Unlocked, no General Penis or Flux 4 Play (2026-10-12)");
    c = await call("naked, holding the man's erect penis in her hand", "pic");
    yes(!c.loras.includes("ferasalm:penis@1") && c.loras.length <= R.MAX_LORAS, "a penis without an act: no General Penis (2026-10-12)", c.loras);
    c = await call("the man fucking her anal doggystyle", "pic");
    yes(JSON.stringify(c.loras) === JSON.stringify(actSet) && !c.text.includes("an4l") && c.text.includes("seen from behind") && c.text.includes("his penis inside her anus; below it, between her thighs, her vulva closed and untouched") && !c.text.includes("This is a candid photograph") && !c.text.includes("POV hand"), "doggy anal: Lenovo + NSFW Unlocked (2026-10-13), from behind, the vulva below her anus, no LORA_PREFIX", c);
    // Step 6 (WORKPLAN, 2026-10-11): anal positions. ANAL_POSITION_WORDS names the position, else ANAL_POSITIONS picks one; the position
    // sets the camera (ANAL_SCENES), the LoRAs (ANAL_LORAS, no Unchained) and the body (the front for missionary, else the back)
    const OPTS = { ref: new Uint8Array([1]), rwFace: new Uint8Array([1]), faceName: "face-2x", place: new Uint8Array([1]), placeName: "place", who: (w) => w };
    const planAll = (words) => W.runwarePlan(words, OPTS);
    const refsOf = (words) => planAll(words).tries[0].refs.map((r) => r.name);
    c = await call("missionary anal on the bed", "pic");
    let refs = refsOf("missionary anal on the bed");
    yes(JSON.stringify(c.loras) === JSON.stringify(actSet) && refs.includes("body-v10") && !refs.includes("body-v10-back") && c.text.includes("his penis inside her anus, low between her buttocks") && !c.text.includes("inside her vagina"), "missionary anal: front body, Lenovo + NSFW Unlocked (2026-10-12: POV Doggy Anal only on doggy), the anal text", { loras: c.loras, refs });
    c = await call("anal reverse cowgirl on the bed", "pic");
    refs = refsOf("anal reverse cowgirl on the bed");
    yes(JSON.stringify(c.loras) === JSON.stringify(actSet) && refs.includes("body-v10-back") && !c.text.includes("r3v3rs3_c0wg1rl") && c.text.includes("inside her anus") && !c.text.includes("inside her vagina"), "anal reverse cowgirl: back body, Lenovo + NSFW Unlocked (2026-10-12), no Flux 4 Play trigger", { loras: c.loras, refs });
    c = await call("prone bone anal on the bed", "pic");
    refs = refsOf("prone bone anal on the bed");
    yes(JSON.stringify(c.loras) === JSON.stringify(actSet) && refs.includes("body-v10-back") && c.text.includes("lies flat on her stomach"), "prone bone anal: back body, Lenovo + NSFW Unlocked (2026-10-12), the prone text", { loras: c.loras, refs });
    c = await call("anal, doggy style on the bed", "pic");
    yes(JSON.stringify(c.loras) === JSON.stringify(actSet) && c.text.includes("fucking her in the ass doggy style"), "anal, doggy style: Lenovo + NSFW Unlocked (2026-10-13), the doggy anal text", c.loras);
    c = await call("anal riding the man", "pic");
    yes(planAll("anal riding the man").flags.analAt === "reverse cowgirl" && c.text.includes("inside her anus") && !c.text.includes("inside her vagina"), "Step 6: anal riding the man: the reverse cowgirl position (riding), the anal text", c.text.slice(0, 200));
    c = await call("riding the man, his hands on her ass", "pic");
    const hands = planAll("riding the man, his hands on her ass").flags;
    yes(!hands.anal && JSON.stringify(c.loras) === JSON.stringify(actSet) && c.text.includes("inside her vagina"), "riding, his hands on her ass: not anal, Lenovo + NSFW Unlocked (2026-10-13: no hands LoRA), the vaginal text", { anal: hands.anal, loras: c.loras });
    c = await call("doggy style, grabbing her ass", "pic");
    const grab = planAll("doggy style, grabbing her ass").flags;
    yes(!grab.anal && !c.loras.includes("ferasalm:povanal@1") && c.text.includes("inside her vagina"), "Step 6: doggy style, grabbing her ass: not anal, no POV Doggy Anal, the vaginal text", { anal: grab.anal, loras: c.loras });
    const rand = Math.random;
    try {
      const picks = [0.1, 0.59, 0.65, 0.8, 0.99].map((x) => { Math.random = () => x; return planAll("anal on the bed").flags.analAt; });
      eq(picks, ["doggy", "doggy", "reverse cowgirl", "prone", "prone"], "Step 6 bench: an anal act with no position named: ANAL_POSITIONS doggy 0.6, reverse cowgirl 0.1, prone 0.3, never missionary (Math.random 0.1, 0.59, 0.65, 0.8, 0.99)");
    } finally { Math.random = rand; }
    c = await call("naked in bed", "pic");
    yes(!c.loras.includes("ferasalm:penis@1") && !c.loras.includes("ferasalm:flux4play@1"), "nude, no act: no act LoRAs", c.loras);
    c = await call("missionary sex on the bed", "scene");
    eq(c.loras, actSet, "/look missionary: Lenovo + NSFW Unlocked (2026-10-12)");
    c = await call("in a black dress, the man's hand on her waist", "pic");
    eq(c.loras, ["ferasalm:lenovoc@1", ...anat].sort(), "his hand, clothed: Lenovo + Anatomy Fixer (owner 2026-10-13: hands LoRA dropped)");
    const keepHands = R.HANDS_LORAS;
    R.HANDS_LORAS = { "ferasalm:povhandc@1": 0.6 };
    c = await call("riding the man, his hands on her hips", "pic");
    eq(c.loras, [...actSet, "ferasalm:povhandc@1"].sort(), "HANDS_LORAS set again: his hands named add it, within MAX_LORAS");
    R.HANDS_LORAS = keepHands;
    eq(W.picWords("my hand on your waist, you in a black dress"), "His hand on her waist, her in a black dress", "/pic: 'my hand' is his");
    R.SEX_ACTS = false;
    yes(!W.mayDraw("her giving a blowjob") && !W.sexAct("her giving a blowjob"), "switch off: not drawn");
    eq(W.picWords("you riding me"), "Her riding the man", "switch off: /pic words the same as with it on (Step B)");
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

// Step 4 (2026-10-11, docs/WORKPLAN.md): one home and one out outfit a day, by the temperature band; outside words take OUT;
// clothes named in the words are never replaced; the day's outfit reaches /pic and her own pictures
{
  const P = W.CONFIG.PICTURE, H = P.WARDROBE.HOME, O = P.WARDROBE.OUT;
  eq([W.namesClothes("on the couch in a fitted black tank top"), W.namesClothes("smiling on the couch"), W.namesClothes("in her outfit")], [true, false, true], "namesClothes: clothes words and 'outfit' count, a pose doesn't");
  eq([W.outfitBand(40), W.outfitBand(60), W.outfitBand(80), W.outfitBand(NaN, "2026-01-15"), W.outfitBand(NaN, "2026-05-01"), W.outfitBand(NaN, "2026-07-01")], ["COLD", "MILD", "WARM", "COLD", "MILD", "WARM"], "outfitBand: under 50 F cold, over 72 warm, between mild; no weather by month");
  const day = { day: "2026-10-11", band: "COLD", home: H.COLD[0], out: O.COLD[0] };
  const warm = [...H.WARM, ...O.WARM];
  const picks = [0, 0.3, 0.6, 0.99].map((r) => W.pickDayOutfits(null, "COLD", "2026-10-11", () => r));
  eq(picks.every((d) => H.COLD.includes(d.home) && O.COLD.includes(d.out) && !warm.includes(d.home) && !warm.includes(d.out)), true, "a cold day's outfits are cold-day items, never a WARM one");
  const prev = { day: "2026-10-10", home: H.COLD[0], out: O.COLD[0] };
  const next = W.pickDayOutfits(prev, "COLD", "2026-10-11", () => 0);
  eq([next.home !== prev.home, next.out !== prev.out], [true, true], "tomorrow's outfits are never yesterday's");
  eq(W.dayOutfits && typeof W.dayOutfits, "function", "dayOutfits is exported");
  const pic = (words, dayWear = day) => W.customPicture(words, 21, dayWear).prompt;
  eq([pic("on the couch reading a book").includes(`She is wearing ${day.home}.`), pic("at the coffee shop, smiling").includes(`She is wearing ${day.out}.`), pic("in a red sweater on the couch").includes("She is wearing"), pic("naked on the bed").includes("She is wearing"), pic("on the couch reading a book", null).includes("She is wearing")],
    [true, true, false, false, true], "/pic: no clothes named gets the day's home outfit, outside words the out outfit; named clothes and nudity get none; no day outfit gets SCENE_WEARING (Step B)");
}

// Step 4 review (Opus, 2026-10-11): the day's outfit holds all day, "out" and the weather aren't outside, act words get no clothes
{
  // refreshDay (weather, every 30 min) wrote back the "day" it read before the reply's picture picked the outfits: the next picture
  // re-rolled them. Yesterday's outfits, stale weather; the reply picks today's while the weather call is still out.
  const store = new Map([["day", JSON.stringify({ day: "2000-01-01", plan: [], weather: "60°F", temp: 60, wxAt: Date.now() - 4 * 3600000, outfits: { day: "2000-01-01", band: "MILD", home: "y-home", out: "y-out" } })]]);
  const env = { REEM_KV: { get: async (k) => (store.has(k) ? JSON.parse(store.get(k)) : null), put: async (k, v) => { store.set(k, v); } } };
  const realFetch = globalThis.fetch, plan = W.CONFIG.DAY.PLAN;
  let release;
  const gate = new Promise((r) => (release = r));
  globalThis.fetch = async () => { await gate; return new Response(JSON.stringify({ current: { temperature_2m: 61, weather_code: 1, wind_speed_10m: 3 } })); };
  W.CONFIG.DAY.PLAN = false;
  const waits = [];
  try {
    await W.dayInfo(env, { waitUntil: (p) => waits.push(p) });
    const first = await W.dayOutfits(env);
    release();
    await Promise.all(waits);
    const second = await W.dayOutfits(env);
    eq([waits.length, second.day, second.home, second.out], [1, first.day, first.home, first.out], "the day's outfits survive a weather refresh in the same reply");
    eq(JSON.parse(store.get("day")).temp, 61, "the refresh still saves the new temperature");
  } finally {
    globalThis.fetch = realFetch;
    W.CONFIG.DAY.PLAN = plan;
  }
  const dw = { day: "2026-10-11", band: "COLD", home: "HOME-OUTFIT", out: "OUT-OUTFIT" };
  const wear = (words) => (W.composePicture({ tier: "everyday", shot: "selfie", words, dayWear: dw }).prompt.match(/HOME-OUTFIT|OUT-OUTFIT/) || ["none"])[0];
  eq(["stretched out on the couch", "lights out, in bed", "rain on the window, in bed", "going out tonight", "at the coffee shop", "walking in the rain"].map(wear),
    ["HOME-OUTFIT", "HOME-OUTFIT", "HOME-OUTFIT", "OUT-OUTFIT", "OUT-OUTFIT", "OUT-OUTFIT"], "OUTSIDE_WORDS: a bare 'out' or the weather is not outside");
  const act = W.composePicture({ tier: "boudoir", shot: "selfie", words: "riding him on the bed" }).prompt;
  eq([/wearing/.test(act), W.pictureFlags(act, true, "on").partial], [false, false], "her sex-act words get no wardrobe (it made the act 'partly naked')");
}

{
  // Step 5 (2026-10-11): partly dressed and close-ups
  const P = W.CONFIG.PICTURE, R = P.RUNWARE, keep = [P.ROUTE, R.BODY_PARTIAL, P.HAIR_CHANCE], realFetch = globalThis.fetch, r0 = Math.random;
  eq([R.NAKED, R.NAKED_BREASTS, R.NAKED_BUSH].join(" "), "She is completely naked, no clothing of any kind: natural breasts with soft brown areolas, a thick, untrimmed dark bush, a real vulva when in view.", "NAKED's three parts join to the text before the split");
  const f = (t, level = "on") => { const x = W.pictureFlags(t, true, level); return [x.partial, x.top, x.bottom, x.close]; };
  eq(f("pussy close up, covered breasts"), [true, true, false, true], "covered breasts: partly naked, top on, a close-up (they were drawn bare: no clothes word)");
  eq(f("naked from the waist down, black sports bra, sitting on the bed"), [true, true, false, false], "a sports bra: partly naked, top on");
  eq(f("naked, in a crop top"), [true, true, false, false], "a crop top: partly naked, top on");
  eq(f("topless, in jeans, mirror selfie"), [true, false, true, false], "topless in jeans: bottom on");
  eq(f("topless, an open shirt and jeans"), [true, false, true, false], "'topless' beats a top word: bottom only");
  eq(f("naked on the bed, covered in sweat"), [false, false, false, false], "'covered in sweat' is not clothing");
  eq(f("riding the man, she climbs on top of him"), [false, false, false, false], "riding 'on top' is not a top");
  eq(f("naked on the bed, her hand between her legs"), [false, false, false, false], "a hand between her legs is no close-up");
  eq(f("missionary, close-up of her pussy"), [false, false, false, false], "no close-up framing on a sex act (its camera is ACT_SCENES')");
  eq(f("pussy close up, covered breasts", "off"), [false, false, false, false], "/nsfw Off: nothing partial or close");
  eq(W.nakedLine({ partial: true, bottom: true }), `${R.PARTIAL_BOTTOM} Natural breasts with soft brown areolas.`, "only a bottom on: PARTIAL_BOTTOM + the breasts as a sentence");
  eq(W.nakedLine({ partial: true, top: true, bottom: true }), R.PARTIAL, "top and bottom on: PARTIAL as before");
  eq(W.nakedLine({ close: true }), `${R.NAKED} ${R.NAKED_BUSH} ${R.CROTCH_FRAMING}`, "a nude crotch close-up: no breasts, CROTCH_FRAMING");
  // LoRAs: partly naked leaves Unchained out and takes PussyDiffusion at PARTIAL_WEIGHTS
  const nudeL = W.runwareLoras({ explicit: true, text: "naked, legs spread on the bed" }).map((l) => l.model);
  const partL = W.runwareLoras({ explicit: true, text: "naked, legs spread on the bed", partial: true }).map((l) => l.model);
  eq(partL, nudeL, "partly naked: the same LoRAs as nude (2026-10-12: NSFW Unlocked stays, PARTIAL_LORAS_OFF empty)");
  // the plan: BODY_PARTIAL none sends no body picture and REFERENCE_NOBODY; a close-up sends no place picture and names no face
  let sent = [];
  globalThis.fetch = async (url, init) => { sent.push(JSON.parse(init.body)[0]); return new Response(JSON.stringify({ data: [{ imageBase64Data: "AAAA", cost: 0.001 }] })); };
  const draw = async (words, opts = {}) => { sent = []; await W.drawPicture({ RUNWARE_API_KEY: "k" }, `{who} ${words} {room}`, { ledger: {}, ...opts }); return sent[0]; };
  try {
    P.ROUTE = "runware-klein"; P.HAIR_CHANCE = 0; Math.random = () => 0;
    R.BODY_PARTIAL = "none";
    const none = await draw("naked from the waist down, black sports bra, sitting on the bed", { location: "bedroom" });
    eq([none.inputs.referenceImages.length, none.positivePrompt.includes(R.REFERENCE_NOBODY.slice(0, 60).replace("same face and hair", "same face, hair color")) || none.positivePrompt.includes("full upper arms and a soft body"), /as in image 1\b/.test(none.positivePrompt)], [2, true, true], "BODY_PARTIAL none: face and place only, REFERENCE_NOBODY, the place is image 1");
    R.BODY_PARTIAL = "nude";
    eq((await draw("naked from the waist down, black sports bra, sitting on the bed")).inputs.referenceImages.length, 2, "BODY_PARTIAL nude: face and the nude body");
    P.HAIR_CHANCE = 1; // a hairstyle is picked, and left out of the close-up's words and pictures
    const close = await draw("close-up of her pussy, legs spread on the bed, wearing a white t-shirt", { location: "bedroom" });
    eq([(close.inputs?.referenceImages || []).length, `${close.width}x${close.height}`, close.positivePrompt.includes(R.REFERENCE_CLOSE), close.positivePrompt.includes(R.CROTCH_FRAMING), /image \d|Her face:|Her hair:|natural breasts/i.test(close.positivePrompt)], [0, R.SIZES[R.CLOSE_SHAPE], true, true, false], "a crotch close-up (CLOSE_FACE false, CLOSE_SHAPE): no face, body or place picture, its own shape, REFERENCE_CLOSE + CROTCH_FRAMING, no face, hair or breasts words");
    const keepClose = [R.CLOSE_FACE, R.CLOSE_SHAPE];
    R.CLOSE_FACE = true; R.CLOSE_SHAPE = "";
    const withFace = await draw("close-up of her pussy, legs spread on the bed, wearing a white t-shirt", { location: "bedroom" });
    eq([withFace.inputs.referenceImages.length, `${withFace.width}x${withFace.height}`], [2, `${R.WIDTH}x${R.HEIGHT}`], "CLOSE_FACE true: her face and body (no place picture), the usual shape");
    [R.CLOSE_FACE, R.CLOSE_SHAPE] = keepClose;
  } finally { globalThis.fetch = realFetch; [P.ROUTE, R.BODY_PARTIAL, P.HAIR_CHANCE] = keep; Math.random = r0; }
}

// /nsfw Off on Cloudflare (2026-10-11, owner: "when /nsfw off, we reroute image generation to cloudflare as it has a built in safety
// filter. Keep nsfw nudity and sex on runware."): Off draws klein on Workers AI with her face, body and place, the filter words and
// SAFE; no Runware request and no OpenRouter call (Nano Banana is never at Off); the log row says the Cloudflare model and nsfw "off"
{
  const P = W.CONFIG.PICTURE;
  const FAKE = Buffer.from("fake jpeg").toString("base64");
  const realFetch = globalThis.fetch;
  const urls = [];
  const runware = [];
  const klein = [];
  const rows = [];
  globalThis.fetch = async (url, init = {}) => {
    urls.push(String(url));
    if (String(url) === "https://api.runware.ai/v1") {
      runware.push(JSON.parse(init.body));
      return new Response(JSON.stringify({ data: [], errors: [] }), { headers: { "content-type": "application/json" } });
    }
    throw new Error(`unit (Off): unexpected request to ${url}`);
  };
  const db = {
    prepare(sql) {
      let args = [];
      const s = {
        bind(...a) {
          args = a;
          return s;
        },
        async run() {
          if (/^INSERT INTO pictures/.test(sql)) {
            const cols = sql.match(/\(([^)]*)\)/)[1].split(",").map((c) => c.trim());
            rows.push(Object.fromEntries(cols.map((c, i) => [c, args[i]])));
          }
          return { results: [], meta: { last_row_id: rows.length } };
        },
        async all() {
          return { results: [] };
        },
        async first() {
          return null;
        },
      };
      return s;
    },
    async batch(list) {
      const out = [];
      for (const s of list) out.push(await s.run());
      return out;
    },
  };
  const kleinPrompts = () => klein.map((k) => k.prompt);
  const env = {
    RUNWARE_API_KEY: "test-key",
    REEM_KV: { get: async () => null, put: async () => {}, delete: async () => {}, list: async () => ({ keys: [] }) },
    AI: {
      run: async (model, input) => {
        if (input && input.multipart) {
          const form = await new Response(input.multipart.body, { headers: { "content-type": input.multipart.contentType } }).formData();
          klein.push({ model, prompt: form.get("prompt"), images: [...form.keys()].filter((k) => k.startsWith("input_image_")) });
        }
        return { image: FAKE };
      },
    },
    STUDIO_DB: db,
  };
  try {
    const onRunware = /^runware/.test(P.ROUTE);
    eq([W.runwareRoute("off"), W.runwareRoute("nude"), W.runwareRoute("on")], [P.NSFW.OFF_ROUTE === "cloudflare" ? false : onRunware, onRunware, onRunware], "the route: Off on Cloudflare (NSFW.OFF_ROUTE), Nude and On as before");
    eq([W.safeLine("on"), W.safeLine("off")], [onRunware ? "" : P.SAFE, P.SAFE], "SAFE at Off on Cloudflare, not on Runware");
    eq(/\bbra\b|\bpanties\b/i.test(W.filterSafe("a black lace bra and panties", "off")), false, "filterSafe at Off: the lingerie words are filter-safe");
    const ledger = { rwUsd: 0, rwFailed: 0, usd: 0, recent: [], shots: [] };
    const c = W.customPicture("a black lace bra and panties, in the kitchen", undefined, null, "off");
    const drawn = await W.drawPicture(env, c.prompt, { custom: true, ledger, nsfw: "off", location: c.location, night: c.night });
    eq(runware.length, 0, "Off: no Runware request");
    eq(klein.length, 1, "Off: one klein picture on Workers AI");
    eq(klein[0] && klein[0].model === P.MODEL, true, "Off: the Cloudflare model is P.MODEL");
    eq(klein[0] && klein[0].images.length >= 2 && klein[0].images.length <= 3, true, "Off: her face and body (and the place) as input images");
    eq(/\b(?:bra|panties|thong)\b/i.test(kleinPrompts().join(" ")), false, "Off: the klein prompt has the filter words, not bra, panties or thong (Step B: REFERENCE names none)");
    eq(kleinPrompts()[0] && kleinPrompts()[0].includes(P.SAFE), true, "Off: SAFE is in the klein prompt");
    eq(urls.some((u) => u.includes("openrouter.ai")), false, "Off: no OpenRouter call");
    eq(drawn.model === P.MODEL, true, "Off: the picture is klein's");
    eq(rows.map((r) => [String(r.model).startsWith("@cf/"), r.nsfw]), [[true, "off"]], "Off: the log row is the Cloudflare model at nsfw off");
    const before = urls.length;
    const lingerie = await W.startPicture(env, { rwUsd: 0, rwFailed: 0, usd: 0, recent: [], shots: [] }, "selfie", "a black lace bra and panties", { nsfw: "off", asked: "send me a pic in the lace bra and panties", said: "sending you one now" });
    eq(!!(lingerie && lingerie.bytes), true, "Off: a lingerie selfie is drawn (klein)");
    eq(urls.slice(before).some((u) => u.includes("openrouter.ai")) || runware.length > 0, false, "Off: a lingerie selfie makes no OpenRouter (Nano Banana) and no Runware call");
    eq(kleinPrompts().slice(1).some((p) => /\b(?:bra|panties)\b/i.test(p)), false, "Off: the lingerie selfie's klein prompts are filter-safe");
  } finally {
    globalThis.fetch = realFetch;
  }
}
// Task C (2026-10-11, the owner's row 13: "her father's old gray cardigan over a black cami, in the kitchen" came out naked below the
// waist): clothed on the nude body with a top and no bottom or one-piece: the bottom line; nothing else changes
{
  const R = W.CONFIG.PICTURE.RUNWARE;
  const FAKE = W.fromBase64(Buffer.from("fake jpeg").toString("base64"));
  const tryOf = (words) => W.runwarePlan(words, { herself: true, kind: "selfie", ref: FAKE, rwFace: FAKE, faceName: "face-2x", width: 576, height: 1024, who: (w) => w, level: "on" }).tries[0];
  const row13 = tryOf("her father's old gray cardigan over a black cami, in the kitchen");
  eq(row13.text.includes(R.DRESSED_BOTTOM), true, "row 13: a cardigan over a cami, no bottom: the bottom line is in the prompt");
  eq(row13.refs.map((r) => r.name).filter((n) => !n.startsWith("style:hair-")), ["face-2x", "body-v11-clothed"], "row 13: her face and the clothed body as image 1 (2026-10-12; the random hairstyle picture aside)");
  eq(tryOf("a fitted black tank top and high-waisted jeans, in the kitchen").text.includes(R.DRESSED_BOTTOM), false, "a bottom named: no bottom line");
  eq(tryOf("a black cami under a long dress, in the kitchen").text.includes(R.DRESSED_BOTTOM), false, "a one-piece named (a dress): no bottom line");
  eq(tryOf("sitting on top of the counter, in the kitchen").text.includes(R.DRESSED_BOTTOM), false, "\"on top\" is no top: no bottom line");
  // fix round review (2026-10-11): real bottoms (briefs, joggers) and outfits that show her legs on purpose get no bottom line
  for (const w of ["a black lace bralette and matching high-waisted lace briefs", "a gray zip-up hoodie half open over a white crop tank and joggers", "an oversized gray tee that barely reaches mid-thigh", "his oversized flannel shirt, unbuttoned low, and bare legs"]) eq(tryOf(`a mirror selfie, wearing ${w}, in the bedroom`).text.includes(R.DRESSED_BOTTOM), false, `no bottom line: ${w}`);
}

// Step C (2026-10-13): the picture writer (PICTURE.WRITER, DeepSeek on Workers AI) words her own pictures; the code keeps the framing,
// expression, light and references; anything unusable, slow or off is today's template
{
  const Wr = W.CONFIG.PICTURE.WRITER;
  const yes = (ok, label, got) => eq(!!ok, true, ok ? label : `${label} ${String(got || "").slice(0, 600)}`);
  const asked = [];
  let answer = "";
  const env = { AI: { async run(model, input) { asked.push({ model, input }); return answer === "never" ? new Promise(() => {}) : { choices: [{ message: { content: answer } }] }; } } };
  Wr.ON = true;
  // D1 row 13: the counter-sit template plus her words (a second pose, a second smile, a phone)
  const pic = W.composePicture({ tier: "everyday", shot: "counter-sit", words: "she's leaning against the kitchen counter, one leg bent up, wearing her father's old gray cardigan over a black cami, phone in hand, a small smirk", hour: 15 });
  answer = "Sitting up on the counter in her kitchen, legs dangling, leaning back on one hand, wearing her father's old gray cardigan over a black cami.";
  const ws = await W.writtenSelfie(env, pic, { history: [{ role: "user", content: "send me a pic" }] });
  const sent = asked.at(-1);
  eq([sent.model, sent.input.reasoning_effort, sent.input.messages.map((m) => m.role)], [Wr.MODEL, "none", ["system", "user"]], "writer: DeepSeek on Workers AI, chat-shaped with no thinking (replay: \"low\" thought through all 1,660 tokens, median 24 s)");
  yes(sent.input.messages[0].content.includes(pic.parts.draft) && sent.input.messages[0].content.includes(Wr.RULES) && sent.input.messages[0].content.includes("He: send me a pic"), "writer: reads the draft, the rules and the chat");
  yes(ws && ws.prompt.startsWith(`${W.CONFIG.PICTURE.SELFIE_STYLE} {who} ${W.CONFIG.PICTURE.SELFIE_PHONE} Sitting up on the counter`) && ws.prompt.includes(`black cami, ${pic.parts.expression}, ${pic.parts.light}.`) && !/phone in hand|small smirk/.test(ws.prompt) && ws.written === answer, "writer: the selfie's phone line, its clause, then the code's one expression and light", ws && ws.prompt);
  for (const [bad, why] of [["Sitting up on the counter in her kitchen, legs dangling.", "a garment lost"], ["Sitting up on the counter in her kitchen, completely naked.", "nudity added"], ["ok.", "too short"]]) {
    answer = bad;
    eq(await W.writtenSelfie(env, pic, {}), null, `writer: unusable selfie answer → the template (${why})`);
  }
  answer = "Sitting up on the counter in her kitchen, phone in hand, wearing her father's old gray cardigan over a black cami.";
  yes(!/phone in hand/.test((await W.writtenSelfie(env, pic, {})).prompt), "writer: a phone clause kept from her words is cut (the selfie's lead line has the phone rule)");
  const n = asked.length;
  eq(await W.writtenSelfie(env, W.composePicture({ tier: "everyday", shot: "selfie", hour: 15 }), {}), null, "writer: a template with none of her words is not sent to it");
  Wr.KINDS = ["scene"];
  answer = "Sitting up on the counter in her kitchen, wearing her father's old gray cardigan over a black cami.";
  eq([await W.writtenSelfie(env, pic, {}), asked.length], [null, n], "writer: a kind outside WRITER.KINDS is never asked");
  Wr.KINDS = ["selfie", "scene"];
  // in person: he is the camera (asCamera), the code's clothes when it names none, no act her narration hadn't
  const scene = { prompt: "x", location: null, wearing: "a gray knit cardigan over a black tank top", act: false };
  answer = "The man sits on the edge of the bed, and she kneels close beside him on the rumpled sheets, one hand in her hair, a soft smile.";
  let sc = await W.writtenScene(env, scene, "*She kneels on the bed beside you, one hand in her hair.*", {});
  yes(sc && sc.prompt.startsWith(W.CONFIG.PICTURE.SCENE_STYLE) && !/the man sits/i.test(sc.prompt) && sc.prompt.includes("close beside the camera") && sc.prompt.includes("She is wearing a gray knit cardigan over a black tank top."), "writer (scene): where he sits goes, the camera stays; no clothes named → the scene's clothes", sc && sc.prompt);
  yes(asked.at(-1).input.messages[0].content.includes("one hand in her hair.*") && asked.at(-1).input.messages[0].content.includes("if the story names no clothes: a gray knit cardigan over a black tank top"), "writer (scene): reads her reply and the clothes to name");
  answer = "She rides the man on the sofa, naked, her hands on his chest.";
  eq(await W.writtenScene(env, scene, "*She sits on the sofa.*", {}), null, "writer (scene): a sex act her narration hadn't → the template");
  answer = "She rides the man on the sofa, naked, her hands braced on the cushions.";
  sc = await W.writtenScene(env, { ...scene, act: true }, "*She sinks onto you.*", {});
  yes(sc && sc.prompt.startsWith(W.CONFIG.PICTURE.SCENE_ACT_STYLE) && !sc.prompt.includes("She is wearing"), "writer (scene): an act the code saw: the act style, no clothes line");
  // slow: the template, without waiting past TIMEOUT_MS
  answer = "never";
  const keep = Wr.TIMEOUT_MS; Wr.TIMEOUT_MS = 50;
  const t0 = Date.now();
  const hold = setInterval(() => {}, 10); // AbortSignal.timeout's timer doesn't keep Node running (a Worker waits for it)
  eq(await W.writePicture(env, "scene", { chat: "", moment: "x", clothes: "" }), null, "writer: slower than TIMEOUT_MS → null (the template draws)");
  clearInterval(hold);
  yes(Date.now() - t0 < 2000, "...after TIMEOUT_MS, not the model's own time limit");
  Wr.TIMEOUT_MS = keep;
  eq(W.writtenWords("Clause: She sits on the sofa,\n\"wearing a red dress\"."), "She sits on the sofa, wearing a red dress", "writtenWords: one line, no label or quotes");
  eq(W.writtenWords("Sitting up on the counter in her kitchen, wearing her father's old gray cardigan over a black cami, and no visible bottom garment."), "Sitting up on the counter in her kitchen, wearing her father's old gray cardigan over a black cami", "writtenWords: \"no visible bottom garment\" goes (Step D bench: bare legs at Off)");
  Wr.ON = false;
  eq(await W.writePicture(env, "scene", {}), null, "writer off: nothing asked");
}

// Step D (2026-10-13): the anatomy check (PICTURE.ANATOMY) and drawPicture's redraws
{
  const A = W.CONFIG.PICTURE.ANATOMY;
  const yes = (ok, label, got) => eq(!!ok, true, ok ? label : `${label} ${String(got || "").slice(0, 400)}`);
  const verdict = (o) => `I looked.\n${JSON.stringify({ heads: 1, stray_parts: false, bad_hands: false, bad_limbs: false, mismatched_legs: false, bad_face: false, ...o })}`;
  let answers = [];
  const draws = [];
  const asked = [];
  const kv = { get: async () => null, put: async () => {}, delete: async () => {} };
  const env = { REEM_KV: kv, AI: { async run(model, input) {
    if (input && input.multipart) { draws.push(model); return { image: btoa(`picture ${draws.length}`) }; }
    asked.push({ model, text: input.messages[0].content[0].text });
    const a = answers.shift();
    if (a instanceof Error) throw a;
    return { response: a ?? "" };
  } } };
  const ledger = () => ({ day: "", neurons: 0, out: false, rwUsd: 0, recent: [], shots: [] });
  const draw = (o = {}) => W.drawPicture(env, "Realistic candid smartphone photo she took herself: {who} Chest-up, a gray sweater.", { ledger: o.ledger || ledger(), kind: "selfie", nsfw: "off", ...o });
  const reset = (a) => { answers = a; draws.length = 0; asked.length = 0; W.budget.reset(); }; // a new request's subrequest budget
  A.ON = true;
  reset([verdict({ stray_parts: true }), verdict({})]);
  let out = await draw();
  eq([new TextDecoder().decode(out.bytes), draws.length, asked.length], ["picture 2", 2, 2], "anatomy: a stray hand → drawn again, the clean second picture sent");
  yes(asked[0].model === A.MODEL && asked[0].text.includes("heads or faces") && !asked[0].text.includes(A.ATTACHED) && !asked[0].text.includes(A.POV), "anatomy: her selfie is checked without the his-eyes lines", asked[0].text);
  reset([verdict({ bad_hands: true, bad_limbs: true }), verdict({ heads: 2 }), verdict({ bad_hands: true, stray_parts: true })]);
  out = await draw();
  eq([new TextDecoder().decode(out.bytes), draws.length], ["picture 2", A.TRIES], "anatomy: TRIES pictures at most, the one with the fewest mistakes sent");
  reset(["I can't tell."]);
  out = await draw();
  eq([draws.length, asked.length], [1, 1], "anatomy: an answer with no JSON passes the picture");
  reset([new Error("3040: capacity")]);
  out = await draw();
  eq([new TextDecoder().decode(out.bytes), draws.length], ["picture 1", 1], "anatomy: the check failing passes the picture");
  reset([verdict({ stray_parts: true }), verdict({})]);
  await W.drawPicture(env, "Realistic candid first-person photo from the man's own eyes, caught in the middle of the act, not posing: {who} She rides the man on the sofa, naked.", { ledger: ledger(), kind: "scene", nsfw: "off" });
  yes(asked[0].text.includes(A.ATTACHED) && (asked[0].text.includes(A.ACT) || asked[0].text.includes(A.POV)), "anatomy: an in-person picture is checked from his eyes (his parts belong to him, his head never shows)", asked[0].text);
  reset([verdict({ stray_parts: true })]);
  await W.drawPicture(env, "A dim room, a lamp.", { ledger: ledger(), kind: "scene", herself: false, face: false, nsfw: "off", log: { source: "look" } });
  eq([draws.length, asked.length], [1, 0], "anatomy: /look without her is not checked");
  reset([verdict({ stray_parts: true })]);
  await W.drawPicture(env, "x {who}", { kind: "selfie", nsfw: "off" });
  eq(asked.length, 0, "anatomy: no ledger (/face, /health) → not checked");
  const led = ledger();
  reset([verdict({ stray_parts: true }), verdict({ stray_parts: true }), verdict({})]);
  await draw({ ledger: led });
  eq(led.neurons, W.CONFIG.AI_BUDGET.PICTURE_NEURONS * 2 + W.CONFIG.AI_BUDGET.PHOTO_NEURONS * 3, "anatomy: the 2 Cloudflare redraws and the 3 checks are counted (the first picture is its caller's)");
  reset([verdict({ heads: 2 })]);
  await W.drawPicture(env, "Realistic candid first-person photo from the man's own eyes, caught in the middle of the act, not posing: {who} She rides the man on the sofa, naked.", { ledger: ledger(), kind: "scene", nsfw: "on" });
  yes(asked[0] && asked[0].text.includes(A.ACT), "anatomy: a sex act at On is asked with the act lines", asked[0] && asked[0].text);
  eq(draws.length, 1, "anatomy: on a sex act \"2 heads\" is not a mistake (Scout counts the man on clean act pictures, probe v3)");
  A.ON = false;
  reset([verdict({ stray_parts: true })]);
  await draw();
  eq([draws.length, asked.length], [1, 0], "anatomy off: one picture, no check");
}

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
