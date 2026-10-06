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
eq(W.CONFIG.LLM.MODEL, "deepseek/deepseek-v4-flash", "chat model: DeepSeek V4 Flash (owner 2026-10-06)");
const ds = W.openRouterBody(W.CONFIG.LLM.MODEL, [], { max_tokens: 5 });
eq({ model: ds.model, provider: ds.provider, reasoning: ds.reasoning }, { model: "deepseek/deepseek-v4-flash", provider: { order: ["novita", "baidu", "relace", "streamlake"], ignore: ["azure", "alibaba", "atlas-cloud", "deepinfra"], allow_fallbacks: false }, reasoning: { enabled: false } }, "DeepSeek: provider + reasoning");
eq(W.CONFIG.LLM.BACKUP_MODEL, "@cf/deepseek-ai/deepseek-v4-flash-0731", "backup: DeepSeek on Workers AI (owner 2026-10-06, Nemo removed)");
eq(W.CONFIG.PICTURE.LINGERIE.ENABLED, false, "Nano Banana removed (owner 2026-10-06)");
eq(Object.keys(W.openRouterBody("sao10k/l3-lunaris-8b", [], { max_tokens: 5 })), ["model", "messages", "max_tokens"], "another model: no routing");
eq([W.CONFIG.MEMORY.MODEL, W.CONFIG.AUTO.MODEL].every((m) => m === W.CONFIG.LLM.MODEL), true, "memory and /auto use DeepSeek (the chat model's routing)");
{
  const saved = structuredClone(W.CONFIG.LLM);
  W.CONFIG.LLM.PROVIDER.ignore = [];
  W.CONFIG.LLM.REASONING = {};
  const b = W.openRouterBody(W.CONFIG.LLM.MODEL, [], {});
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
}
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);

// Gemini TTS answers raw 24 kHz 16-bit mono PCM; pcmToMp3 makes a real MP3 of it (frame sync 0xFFE, much smaller)
{
  const pcm = new Int16Array(48000).map((_, i) => Math.round(9000 * Math.sin(i / 7))).buffer; // 2 s tone
  const mp3 = new Uint8Array(W.pcmToMp3(pcm));
  eq([mp3[0] === 0xff && (mp3[1] & 0xe0) === 0xe0, mp3.length > 1000 && mp3.length < pcm.byteLength / 5], [true, true], "pcmToMp3 gives an MP3 frame stream");
}
