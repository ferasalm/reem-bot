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
eq(active >= 1000 && active <= 6000, true, `momentum notice ${Math.round(active)}ms`);
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
// overrides replace pronunciations whole
W.applyOverrides({ CONFIG_OVERRIDES: JSON.stringify({ VOICE: { PRONUNCIATIONS: { ya3ni: "yani" } } }) });
eq(Object.keys(W.CONFIG.VOICE.PRONUNCIATIONS), ["ya3ni"], "pronunciations replaced whole");
eq(W.forSpeech("ya3ni 7abibi"), "Yani habibi.", "override + fallback");
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
