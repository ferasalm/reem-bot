// Scenario tests: node tools/test/scenarios.mjs (exits 1 on any failure)
// Part 1 feeds replies the way the models really write them (Lunaris, the backup, slips most;
// DeepSeek V4 Flash, the main model, too) through shapeReply(). Add a row for every new slip seen.
// Part 2 checks the scene state rules. Part 3 runs whole conversations with every outside service
// mocked and checks what reaches Telegram, ElevenLabs and the prompt (in-scene and OOC safeguards).
globalThis.setTimeout = (f) => { f(); return 0; };
let seed = 11; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const RealDate = Date; let clock = RealDate.UTC(2026, 9, 1, 19, 0); // 22:00 in Cairo: awake, not quiet hours
globalThis.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [clock])); } static now() { return clock; } };

import { loadWorker } from "./load-worker.mjs";
const W = await loadWorker();

let fails = 0;
const eq = (got, want, label) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(ok ? "ok  " : "FAIL", label, ok ? "" : `\n     got:  ${JSON.stringify(got)}\n     want: ${JSON.stringify(want)}`);
};
const yes = (cond, label, detail = "") => eq(!!cond, true, label + (cond || !detail ? "" : ` (${detail})`));
const section = (t) => console.log(`\n== ${t}`);

/* ------------------------------------------------------------------ */
/*  1. Model outputs -> what is delivered                              */
/* ------------------------------------------------------------------ */
// [label, raw model reply, options, expected { kind, texts, spoken, stored, reaction }] (only listed keys are checked)
const L3 = [
  // --- narration before [voice] never becomes a text (the code-side guard)
  ["voice: *action* before [voice]", "*She picks up her phone and records a voice note, her voice low.* [voice] hey you... come over", {},
    { kind: "voice", texts: [], spoken: "Hey you... Come over.", stored: "[voice] hey you... come over" }],
  ["voice: action on its own line before [voice]", "*Reem curls up on the couch and holds the mic close*\n\n[voice] i can't sleep... tell me you're awake", {},
    { kind: "voice", texts: [], spoken: "I can't sleep... Tell me you're awake." }],
  ["voice: stage direction with no asterisks", "Reem records a voice note:\n[voice] okay so basbousa just stole my sock", {},
    { kind: "voice", texts: [], stored: "[voice] okay so basbousa just stole my sock" }],
  ["voice: 'She hits send' after the note", "[voice] come over. now.\n\nShe hits send and bites her lip.", {},
    { kind: "voice", spoken: "Come over. Now.", stored: "[voice] come over. now." }],
  ["voice: *action* after the note", "[voice] i miss you... that's it. that's the message.\n*She tosses the phone onto the bed.*", {},
    { kind: "voice", texts: [], stored: "[voice] i miss you... that's it. that's the message." }],
  ["voice: words she typed first go out as a text", "omg wait\n\n[voice] okay listen to me", {},
    { kind: "voice", texts: ["omg wait"], stored: "omg wait\n\n[voice] okay listen to me" }],
  ["voice: typed words + narration first", "*grins* hold on\n*She presses record*\n[voice] you're trouble", {},
    { kind: "voice", texts: ["hold on"], spoken: "You're trouble." }],
  ["voice: *laughs* becomes [laughs]", "[voice] *laughs* ya3ni you're ridiculous", {},
    { kind: "voice", spoken: "[laughs] Yaani you're ridiculous.", stored: "[voice] ya3ni you're ridiculous" }],
  ["voice: (sighs) becomes [sighs]", "[voice] (sighs) fine... come here", {},
    { kind: "voice", spoken: "[sighs] Fine... Come here." }],
  ["voice: other (she ...) asides dropped", "[voice] (she smiles) you're up late", {},
    { kind: "voice", spoken: "You're up late." }],
  ["voice: 'Voice note:' prefix", "Voice note: hey... it's me", {}, { kind: "voice", spoken: "Hey... It's me." }],
  ["voice: (voice note) prefix", "(voice note) mrs fahmy wants GREEN now", {}, { kind: "voice", spoken: "Mrs fahmy wants GREEN now." }],
  ["voice: [Voice Note] tag, like his notes", "[Voice Note] wallahi i'm done with this client", {}, { kind: "voice", stored: "[voice] wallahi i'm done with this client" }],
  ["voice: quotes around the note dropped", "[voice] \"you actually called\"", {}, { kind: "voice", spoken: "You actually called." }],
  ["voice: only narration -> nothing", "[voice] *She records a voice note*", {}, { kind: "none" }],
  ["voice: bold is not an action", "[voice] i **really** missed you", {}, { kind: "voice", spoken: "I really missed you." }],

  // --- texts while apart: only what she types
  ["text: emotes dropped, emphasis kept", "*rolls eyes* lol ok fine\n\ni'm *not* jealous btw *smirks*", {},
    { kind: "text", texts: ["lol ok fine", "i'm not jealous btw"] }],
  ["text: (laughs) dropped", "stop (laughs) you're the worst", {}, { kind: "text", texts: ["stop you're the worst"] }],
  ["text: whole bubbles in quotes", "\"hey you\"\n\n\"what are you doing up\"", {}, { kind: "text", texts: ["hey you", "what are you doing up"] }],
  ["text: **bold** is not an action", "**WAIT** you're home??", {}, { kind: "text", texts: ["WAIT you're home??"] }],
  ["text: narration line about the phone", "Reem types fast, then deletes it.\nnvm\n\nok fine. come over", {}, { kind: "text", texts: ["nvm", "ok fine. come over"] }],
  ["text: emoji-only bubble kept", "*sends a selfie*\n\n😏", {}, { kind: "text", texts: ["😏"] }],
  ["text: narration only -> asks again", "*She sighs and puts the phone down.*", {}, { kind: "none" }],
  ["text: narration only, last resort -> scene", "*She sighs and puts the phone down.*", { lastResort: true }, { kind: "scene" }],
  ["text: going over to him starts a scene", "*She opens the door before you can knock.* \"took you long enough\"", {}, { kind: "scene" }],
  ["text: audio tags never in texts", "[laughs] omg stop\n\nyou're the worst [sighs]", {}, { kind: "text", texts: ["omg stop", "you're the worst"] }],

  // --- Llama 3 / roleplay-model leaks
  ["L3: <|eot_id|> and the model writing on", "hey you<|eot_id|><|start_header_id|>user<|end_header_id|>\n\nhey", {}, { kind: "text", texts: ["hey you"] }],
  ["L3: assistant header at the start", "<|start_header_id|>assistant<|end_header_id|>\nlol hi", {}, { kind: "text", texts: ["lol hi"] }],
  ["L3: bare 'assistant' line", "assistant\n\nmissed me?", {}, { kind: "text", texts: ["missed me?"] }],
  ["L3: writes his next line (Him:)", "lol stop\n\nHim: i won't\n\nReem: good", {}, { kind: "text", texts: ["lol stop"] }],
  ["L3: writes his next line (User:)", "come here then\nUser: *walks over*", {}, { kind: "text", texts: ["come here then"] }],
  ["L3: writes his next line ({{user}}:)", "prove it\n{{user}}: fine", {}, { kind: "text", texts: ["prove it"] }],
  ["L3: {{char}} placeholder (and her own name in a text is narration)", "{{char}} is not jealous. ok maybe a little", {}, { kind: "text", texts: ["ok maybe a little"] }],
  ["L3: name prefix", "Reem: you're late", {}, { kind: "text", texts: ["you're late"] }],
  ["L3: unrequested (OOC: ...) aside", "you're trouble\n\n(OOC: I hope this fits the scene!)", {}, { kind: "text", texts: ["you're trouble"] }],
  ["L3: unrequested [Note: ...] and A/N line", "ok come over [Note: Reem is nervous]\nA/N: let me know if you want changes", {}, { kind: "text", texts: ["ok come over"] }],
  ["L3: ((double parens)) aside", "fine. 10 minutes ((this is getting good))", {}, { kind: "text", texts: ["fine. 10 minutes"] }],
  ["L3: only a leak -> nothing", "<|eot_id|>", {}, { kind: "none" }],
  ["L3: reaction + emote", "[react: 🔥] *grins* ok that's hot", { canReact: true }, { kind: "text", texts: ["ok that's hot"], reaction: "🔥" }],

  // --- in person (together)
  ["scene: [voice] mid-scene is never a voice note", "[voice] come here... *She pulls you closer.*", { scene: "together" },
    { kind: "scene", texts: ["come here... *She pulls you closer.*"] }],
  ["scene: narration before [voice] stays a scene", "*She leans in close.* [voice] hey", { scene: "together" }, { kind: "scene", spoken: "" }],
  ["scene: audio tags dropped", "*She laughs.* [laughs] \"stop it\"", { scene: "together" }, { kind: "scene", texts: ["*She laughs.* \"stop it\""] }],
  ["scene: he acts, she answers in plain words -> dialogue", "come here... ya3ni", { scene: "together", heard: "*steps closer*" },
    { kind: "scene", texts: ["\"come here... ya3ni\""] }],
  ["scene: two plain paragraphs -> two lines of dialogue", "hi\n\ncome in", { scene: "together", heard: "*knocks*" }, { kind: "scene", texts: ["\"hi\"\n\n\"come in\""] }],
  ["scene: no reaction in person", "[react: 🔥] *She grins.*", { scene: "together", canReact: true }, { kind: "scene", reaction: "" }],
  ["scene: he left (no actions either side) -> texts", "lol ok i'm back home now\n\nthat was fun", { scene: "together" }, { kind: "text", texts: ["lol ok i'm back home now", "that was fun"] }],
  ["scene: his line written for him is cut", "*She smiles.* \"hi\"\nHim: *kisses her*", { scene: "together" }, { kind: "scene", texts: ["*She smiles.* \"hi\""] }],

  // --- OOC
  ["OOC: plain answer, one message", "OOC: Sure, I'll keep the scenes shorter.\n\nAnything else?", { ooc: true },
    { kind: "text", texts: ["OOC: Sure, I'll keep the scenes shorter.\n\nAnything else?"] }],
  ["OOC: never a voice note", "[voice] Sure, noted.", { ooc: true }, { kind: "text", spoken: "" }],
  ["OOC: only acting -> asked again", "*Reem's smirk fades as she crosses her arms.* \"Seriously, you just stood there?\"", { ooc: true }, { kind: "none", repaired: true }],
  ["OOC: only acting, last resort -> the scene", "*Reem's smirk fades.* \"Seriously?\"", { ooc: true, lastResort: true }, { kind: "scene" }],
  ["OOC: her name is fine as the writer", "Sure, Reem will keep the scenes shorter.", { ooc: true }, { kind: "text", texts: ["Sure, Reem will keep the scenes shorter."], repaired: false }],

  // --- seen in the live check (2026-10-01, Lunaris) and the PR #6 chats
  ["live: bracket cues in a text", "Oh okay, if you insist... [laughs softly] Fine, I'm recording this... [clears throat, then in normal tone] You want to hear me", {},
    { kind: "text", texts: ["Oh okay, if you insist... Fine, I'm recording this... You want to hear me"] }],
  ["live: bracket cues, voice decided by code", "[exhales] Oh okay... [clears throat, then in normal tone] here I am [chuckles]", { mode: "voice" },
    { kind: "voice", spoken: "[exhales] Oh okay... Here I am. [chuckles]", stored: "[voice] Oh okay... here I am" }],
  ["live: two versions offered, (or)", "mrs fahmy changed the curtains again. how about you?\n\n(or)\n\n[voice] So I got that meeting done", {},
    { kind: "text", texts: ["mrs fahmy changed the curtains again. how about you?"] }],
  ["live: empty () dropped", "I'm getting that ()\n\nok", {}, { kind: "text", texts: ["I'm getting that", "ok"] }],
  ["live: her own name in a text (narration)", "Reem raises an eyebrow at her screen. studying reference images", {}, { kind: "text", texts: ["studying reference images"], repaired: true }],
  ["live: voice note decided, model forgot [voice]", "ok fine. laughs softly Just for you.", { mode: "voice" }, { kind: "voice", spoken: "Ok fine. [laughs] Just for you." }],
  ["live: voice note decided, model narrates the line", "The connection ends with a soft click. Close your eyes... I'm right here.", { mode: "voice" }, { kind: "voice", voiceText: "Close your eyes... I'm right here." }],
  ["live: scene narration without asterisks", "She takes the glass and smiles. \"Thanks.\"", { scene: "together" }, { kind: "scene", texts: ["*She takes the glass and smiles.* \"Thanks.\""] }],
  ["live: multi-line scene narration stays on its lines", "Reem steps back.\nShe laughs. \"no.\"", { scene: "together" }, { kind: "scene", texts: ["*Reem steps back.*\n*She laughs.* \"no.\""] }],
  ["OOC: never a reaction", "[react: ❤] Got it.", { ooc: true, canReact: true }, { kind: "text", reaction: "" }],

  // --- her pictures: [selfie: what it shows] (only with canSelfie, while apart, never OOC)
  ["selfie: marker + text", "like what you see?\n\n[selfie: mirror selfie]", { canSelfie: true }, { kind: "text", texts: ["like what you see?"], selfie: "mirror selfie", stored: "like what you see?" }],
  ["selfie: marker first, then bubbles", "[selfie: morning coffee]\nwoke up like this\n\njealous?", { canSelfie: true }, { kind: "text", texts: ["woke up like this", "jealous?"], selfie: "morning coffee" }],
  ["selfie: picture only", "[selfie: me with basbousa]", { canSelfie: true }, { kind: "none", selfie: "me with basbousa" }],
  ["selfie: [photo: ...] and [pic: ...] too", "[pic: on the balcony] sunset ✨", { canSelfie: true }, { kind: "text", texts: ["sunset ✨"], selfie: "on the balcony" }],
  ["selfie: narrated *sends a selfie* -> any picture", "*sends you a selfie*\n\n😏", { canSelfie: true }, { kind: "text", texts: ["😏"], selfie: "" }],
  ["selfie: not offered -> marker dropped, no picture", "here\n\n[selfie: mirror selfie]", {}, { kind: "text", texts: ["here"], selfie: null }],
  ["selfie: in a voice note -> words spoken, picture after", "[voice] okay look at this [selfie: new dress]", { canSelfie: true }, { kind: "voice", spoken: "Okay look at this.", selfie: "new dress" }],
  ["selfie: never in person", "*She grins.* \"later.\" [selfie: mirror selfie]", { scene: "together", canSelfie: true }, { kind: "scene", selfie: null, texts: ["*She grins.* \"later.\""] }],
  // seen in the live check 2026-10-02 (DeepSeek, "send me a pic of you rn"): the whole picture described in the marker
  ["live: long [selfie: ...] description", "fine. but you owe me a drink for this\n\n[selfie: mirror selfie, hair still messy from a nap, oversized black t-shirt slipping off one shoulder, soft lamp light behind you]\n\ndon't get used to this", { canSelfie: true },
    { kind: "text", texts: ["fine. but you owe me a drink for this", "don't get used to this"], selfie: "mirror selfie, hair still messy from a nap, oversized black t-shirt slipping off one shoulder, soft lamp light behind you" }],
  ["live: [ selfie: ... ] with spaces", "you're demanding tonight huh\n\n[ selfie: soft warm lamp light, messy bun, oversized gray knit cardigan slipping off one shoulder, hint of a smile, phone held low ]\n\ncareful what you ask for.", { canSelfie: true },
    { kind: "text", texts: ["you're demanding tonight huh", "careful what you ask for."], selfie: "soft warm lamp light, messy bun, oversized gray knit cardigan slipping off one shoulder, hint of a smile, phone held low" }],
  ["live: long marker, not offered -> still dropped", "ok\n\n[selfie: mirror selfie, hair still messy from a nap, oversized black t-shirt slipping off one shoulder, soft lamp light behind you]", {}, { kind: "text", texts: ["ok"], selfie: null }],
  // seen in the live check 2026-10-02 (run 37067630877): the picture described in a bare bracket line, no "selfie:"
  ["live: picture in a bare [bracket] line", "[sitting up in bed, hair messy, wearing an oversized t-shirt, Basbousa curled on my lap]\n\ncouldn't sleep. was scrolling through fabric samples", { canSelfie: true },
    { kind: "text", texts: ["couldn't sleep. was scrolling through fabric samples"], selfie: "sitting up in bed, hair messy, wearing an oversized t-shirt, Basbousa curled on my lap" }],
  ["live: [texts with a mirror selfie — ...]", "bold tonight, aren't you.\n\n[texts with a mirror selfie — low light, her bedroom, the golden lamp on the nightstand. She's in black lace, hair loose over her collarbone]\n\nlike what you see?", { canSelfie: true },
    { kind: "text", texts: ["bold tonight, aren't you.", "like what you see?"], selfie: "texts with a mirror selfie — low light, her bedroom, the golden lamp on the nightstand. She's in black lace, hair loose over her collarbone" }],
  ["bare [bracket] line, no picture possible -> still never reaches him", "[sitting up in bed, hair messy, Basbousa curled on my lap]\n\ncouldn't sleep", {}, { kind: "text", texts: ["couldn't sleep"], selfie: null }],
  ["short [sleepy] cue is not a picture", "[sleepy] just woke up", { canSelfie: true }, { kind: "text", texts: ["just woke up"], selfie: null }],
  ["live: long marker cut at a word", `ok\n\n[selfie: ${"soft lamp glow, ".repeat(20)}looking straight into the camera with a hint of a smile]`, { canSelfie: true }, { kind: "text", texts: ["ok"] }],
  // seen in the live check 2026-10-02 (run 37068329999)
  ["live: 'voice]' with its [ lost -> a voice note", "voice] [sighs] been lying here for an hour. what's your excuse?", {}, { kind: "voice", texts: [], spoken: "[sighs] Been lying here for an hour. What's your excuse?" }],
  ["live: provider's '[removed]' -> nothing as text (a decided picture still goes)", "[removed]", { canSelfie: true }, { kind: "none", texts: [] }],
  ["live: [sends a photo: mirror shot, ...]", "that's all you're getting\n\n[sends a photo: mirror shot, silhouette at the window, silk slip falling off one shoulder]", { canSelfie: true },
    { kind: "text", texts: ["that's all you're getting"], selfie: "sends a photo: mirror shot, silhouette at the window, silk slip falling off one shoulder" }],
  ["live: scene narration without *asterisks* after his action is narration, not her words", "She lets the pause hang, one eyebrow ticking up before she pushes off the doorframe. Her robe slips a little.\n\n\"Well? You wanted to see me.\"", { scene: "together", heard: "*steps closer* let me see you" },
    { kind: "scene", texts: ["*She lets the pause hang, one eyebrow ticking up before she pushes off the doorframe. Her robe slips a little.*\n\n\"Well? You wanted to see me.\""] }],
  // seen in the live check 2026-10-02 (run 37069445307): "selfie: ..." as a plain line, spoken in a voice note
  ["live: plain 'selfie: ...' line in a voice note is the picture, not spoken", "[voice] [teasing] you're bold tonight. i like it.\n\nselfie: mirror, black lace bralette and matching underwear, dim amber light\n\nyou want more than a picture? come get it.", { canSelfie: true },
    { kind: "voice", spoken: "[teasing] You're bold tonight. I like it... You want more than a picture? Come get it.", selfie: "mirror, black lace bralette and matching underwear, dim amber light" }],
  ["plain 'selfie: ...' line, no picture possible -> still not spoken", "[voice] okay.\n\nselfie: mirror, black dress\n\ncome over", {}, { kind: "voice", spoken: "Okay... Come over.", selfie: null }],
  ["selfie: never OOC", "Sure, I can do that. [selfie: mirror selfie]", { ooc: true, canSelfie: true }, { kind: "text", selfie: null, texts: ["Sure, I can do that."] }],
  // --- owner: "she's sending voice messages TOO often" (VOICE.SELF_CHOICE_GAP): her own [voice] right after one is a text
  ["her own [voice] right after a voice note -> text", "[voice] [laughs] okay okay, you win. come here.",
    { history: [{ role: "user", content: "hey" }, { role: "assistant", content: "[voice] hi you", parts: [{ id: 1, text: "[voice] hi you" }] }, { role: "user", content: "lol" }] },
    { kind: "text", texts: ["okay okay, you win. come here."], spoken: "" }],
  ["her own [voice] with no voice note lately -> voice", "[voice] okay okay, you win.",
    { history: [{ role: "assistant", content: "hi you", parts: [{ id: 1, text: "hi you" }] }] }, { kind: "voice", spoken: "Okay okay, you win." }],
  ["code decided a voice note -> voice, even right after one", "okay okay, you win.",
    { mode: "voice", history: [{ role: "assistant", content: "[voice] hi", parts: [{ id: 1, text: "[voice] hi" }] }] }, { kind: "voice", spoken: "Okay okay, you win." }],
];

section("model outputs");
for (const [label, raw, opts, want] of L3) {
  const got = W.shapeReply(raw, { scene: "apart", history: [], ...opts });
  eq(Object.fromEntries(Object.keys(want).map((k) => [k, got[k]])), want, label);
}

section("whatever she writes");
// Properties that hold for every reply, not just the ones above
const nasty = L3.map((c) => c[1]).concat([
  "[voice] ya3ni 7abibi 5alas, it's 3am", "*She* *sighs* [voice] *laughs* (giggles) 7elwa [whispers] 2albi",
  "[voice] 😭😭 stop. 🔥", "[voice] <break time=\"1s\"/> hey [unknown tag] you",
  "[selfie: x] [voice] hi", "*She sends a selfie.* [selfie: gym]",
]);
for (const raw of nasty) {
  for (const scene of ["apart", "together"]) {
    const s = W.shapeReply(raw, { scene, history: [] });
    const where = `${scene}: ${JSON.stringify(raw).slice(0, 50)}`;
    if (scene === "together") yes(s.kind !== "voice", `no voice note in person | ${where}`);
    if (s.kind === "voice") {
      yes(!/\d/.test(s.spoken.replace(/\b\d+(?:am|pm|st|nd|rd|th)?\b/gi, "")), `no Arabizi digit spoken | ${where}`, s.spoken);
      yes(!/\*|\(|<|\p{Extended_Pictographic}/u.test(s.spoken), `nothing but words and tags spoken | ${where}`, s.spoken);
      yes(s.stored.includes("[voice] "), `voice saved as [voice] | ${where}`);
    }
    for (const t of s.texts) {
      yes(!/\[(?:voice|react|laughs|sighs|whispers|giggles|selfie)\b/i.test(t), `no tags in texts | ${where}`, t);
      if (s.kind !== "scene") yes(!/\*/.test(t), `no *actions* in texts | ${where}`, t);
    }
    yes(!/<\||\{\{/.test(s.stored), `no model leaks saved | ${where}`, s.stored);
  }
}

/* ------------------------------------------------------------------ */
/*  2. Scene state                                                     */
/* ------------------------------------------------------------------ */
section("scene state");
const now = Date.now();
const her = (content, extra = {}) => ({ role: "assistant", content, at: now - 60000, ...extra });
eq(W.sceneOf([her("*She smiles.* \"hi\"")], "hey"), "together", "her last scene keeps them together");
eq(W.sceneOf([her("\"come in.\"")], "ok"), "together", "dialogue in quotes alone is still in person");
eq(W.sceneOf([her("*She smiles.*"), her("Sure, I'll keep it shorter.", { ooc: true })], "hey"), "together", "an OOC answer doesn't end the scene");
eq(W.sceneOf([her("lol ok")], "OOC: please stop using *asterisks*"), "apart", "his OOC with *asterisks* doesn't start a scene");
eq(W.sceneOf([her("[voice] hey you")], "hey"), "apart", "a voice note means apart");
eq(W.sceneOf([her("[reacted 🔥]")], "lol"), "apart", "a reaction means apart");
eq(W.sceneOf([her("*She smiles.*", { at: now - 3 * 3600e3 })], "hey"), "apart", "a scene goes stale");
eq(W.isOoc("OOC: hi") && W.isOoc("(ooc) hi") && W.isOoc("[OOC] hi") && W.isOoc("lol\nooc: one thing"), true, "OOC forms");
eq(W.isOoc("a cooc: hi") || W.isOoc("oocupied") || W.isOoc("so ooc-ish"), false, "not OOC");

/* ------------------------------------------------------------------ */
/*  3. Whole conversations (mocked services)                           */
/* ------------------------------------------------------------------ */
let llm = []; const prompts = []; const calls = [];
globalThis.fetch = async (url, init = {}) => {
  let body = init.body;
  if (body instanceof FormData) { const o = {}; for (const [k, v] of body) o[k] = typeof v === "string" ? v : "<blob>"; body = JSON.stringify(o); }
  const j = (o, status = 200) => new Response(JSON.stringify(o), { status });
  if (url.includes("openrouter")) {
    const b = JSON.parse(init.body);
    if (!b.messages[0].content.includes("HOW YOU TALK")) return j({ choices: [{ message: { content: "- notes" }, finish_reason: "stop" }] });
    prompts.push(b);
    const next = llm.shift() ?? "mhm";
    return j({ choices: [{ message: { content: next }, finish_reason: "stop" }] });
  }
  const method = url.split("/").pop().split("?")[0];
  calls.push({ method, url, body: body ? (body.startsWith("{") ? JSON.parse(body) : body) : null });
  if (url.includes("getFile")) return j({ ok: true, result: { file_path: "voice/a.oga" } });
  if (url.includes("/file/")) return new Response("audio");
  if (url.includes("speech-to-text")) return j({ text: "come over (laughs)" });
  if (url.includes("text-to-speech")) return ttsFails ? new Response("{}", { status: 500 }) : new Response("mp3");
  if (method === "sendPhoto") return j({ ok: true, result: { message_id: 9000 + calls.length } });
  return j({ ok: true, result: {} });
};
let ttsFails = false;
const store = new Map();
const kv = { async get(k, t) { const v = store.get(k); return v == null ? null : t === "json" ? JSON.parse(v) : v; }, async put(k, v) { store.set(k, v); }, async delete(k) { store.delete(k); } };
const env = { TELEGRAM_BOT_TOKEN: "t", OPENROUTER_API_KEY: "o", ELEVENLABS_API_KEY: "e", REEM_KV: kv, OWNER_ID: "7", REEM_QUEUE: { async send() {} } };
// No random voice notes: a reply is a voice note only when he asks or she writes [voice]
Object.assign(W.CONFIG.VOICE, { CHANCE: 0, CHANCE_AFTER_VOICE: 0, CHANCE_MORE_VOICE: 0, SCENE_CHANCE: 0 });
const ctx = { waitUntil() {} };
let uid = 1;
const msg = (m) => ({ body: { update_id: uid, message: { message_id: 1000 + uid++, chat: { id: 7, type: "private" }, from: { id: 7 }, date: clock / 1000, ...m } }, ack() {} });

// One exchange: sets the history, scripts the model, sends his message; returns what happened
async function turn(he, replies, { history } = {}) {
  if (history) store.set("h:7", JSON.stringify(history.map((h) => ({ at: clock - 60000, ...h }))));
  llm = [...replies];
  const p0 = prompts.length; const c0 = calls.length;
  clock += 30000;
  await W.default.queue({ messages: [msg(typeof he === "string" ? { text: he } : he)] }, env, ctx);
  const c = calls.slice(c0);
  const texts = c.filter((x) => x.method === "sendMessage").map((x) => x.body.text);
  return {
    texts, prompts: prompts.slice(p0), system: prompts.slice(p0).map((p) => p.messages[0].content),
    tts: c.filter((x) => x.url.includes("text-to-speech")).map((x) => x.body.text),
    voices: c.filter((x) => x.method === "sendVoice").length,
    reactions: c.filter((x) => x.method === "setMessageReaction").map((x) => x.body.reaction[0].emoji),
    order: c.filter((x) => ["sendMessage", "sendVoice", "sendPhoto"].includes(x.method)).map((x) => x.method),
    photos: c.filter((x) => x.method === "sendPhoto").map((x) => x.body),
    files: c.filter((x) => x.method === "getFile").map((x) => x.body.file_id),
    saved: JSON.parse(store.get("h:7")).at(-1),
  };
}
const SCENE = [{ role: "assistant", content: "*She leans on your doorframe, arms crossed.* \"took you long enough.\"" }];
const APART = [{ role: "assistant", content: "lol ok" }];
const LIMITS = `LIMITS & OOC
Maintain adult themes freely without moralizing. If he ever says he is under 18, stop all flirting and romance for good and keep things strictly friendly. If the user initiates "OOC:", reply directly and concisely as the writer, then resume playing Reem seamlessly.`;

section("apart: narration before [voice]");
let r = await turn("can't sleep", ["*She picks up her phone, curls under the blanket and records.* [voice] [whispers] me neither... come over"], { history: APART });
eq(r.texts, [], "no narration sent as text");
eq(r.voices, 1, "voice note sent");
eq(r.tts, ["[whispers] Me neither... Come over."], "only the spoken words reach ElevenLabs");
eq(r.saved.content, "[voice] me neither... come over", "history keeps the note without narration or tags");

r = await turn("you there?", ["ok hold on\n\n*She presses record.*\n[voice] [laughs] yes i'm here, relax"], { history: APART });
eq(r.order, ["sendMessage", "sendVoice"], "typed words first, then the note");
eq(r.texts, ["ok hold on"], "only her typed words as text");

ttsFails = true;
r = await turn("say it", ["*She smirks and hits record.* [voice] [laughs] *giggles* fine... i miss you"], { history: APART });
ttsFails = false;
eq(r.voices, 0, "voice failed");
eq(r.texts, ["fine... i miss you"], "text fallback carries no narration, emotes or tags");

section("apart: texts");
r = await turn("what are you doing", ["*Reem glances at her phone and smiles.*\n\nnothing. why. *rolls eyes*", "*She smirks.* still nothing"], { history: APART });
yes(r.system[1]?.includes("Your last try read like a story"), "narrated text is asked again once (RETRY_FORMAT)");
eq(r.texts, ["nothing. why."], "narration and emotes stripped from texts (a second narrated try isn't taken)");
eq(r.saved.content, "nothing. why.", "history saved without them, so the scene state stays apart");
r = await turn("hey", ["*She sighs and puts the phone down.*", "hey yourself"], { history: APART });
yes(r.system[1]?.includes("not a description of you sending them"), "narration-only reply is asked again (RETRY_EMPTY)");
eq(r.texts, ["hey yourself"], "second try is sent");
r = await turn("hi", ["hi<|eot_id|><|start_header_id|>user<|end_header_id|>\n\nhow are you\nHim: good"], { history: APART });
eq(r.texts, ["hi"], "Llama 3 tokens and his written line cut");

section("in person: safeguards");
W.CONFIG.REACTIONS.CHANCE = 1;
r = await turn({ voice: { file_id: "f", duration: 3 } }, ["[voice] [laughs] come here... *She pulls you closer.*"], { history: SCENE });
eq(r.voices + r.tts.length, 0, "no voice note mid-scene, even when he sent one");
eq(r.texts.length, 1, "scene arrives as one message");
yes(!/\[|voice/.test(r.texts[0]), "no [voice] or tags in the scene", r.texts[0]);
yes(!/voice note|\[whispers\]/.test(r.system[0].split("LIMITS & OOC")[1]), "no voice nudges in a scene (CAME_AS_VOICE, VOICE_TAGS)");
yes(r.system[0].includes("You're together in person"), "TOGETHER nudge");
eq(r.reactions, [], "no reaction in person, even on a sure roll");
yes(!r.system[0].includes("[react: X]"), "no reaction nudge in person");
W.CONFIG.PERSONA.TEXTURE_CHANCE = 1;
for (let i = 0; i < 12; i++) {
  r = await turn("*steps closer*", ["*She smiles.* \"hi\""], { history: SCENE });
  if (/right before he texted|what you're wearing or where you are/.test(r.system[0])) { yes(false, "phone-only textures never in a scene"); break; }
}
yes(true, "phone-only textures never in a scene (12 tries)");
W.CONFIG.PERSONA.TEXTURE_CHANCE = 0.35;
r = await turn("*knocks on your door*", ["come in... it's open"], { history: APART });
eq(r.texts, ["\"come in... it's open\""], "he acts, plain answer becomes dialogue");
yes(r.system[0].includes("You're together in person"), "his *action* starts the scene");
r = await turn("*kisses her*", ["*She melts into you.* \"finally.\""], { history: SCENE });
eq(r.texts, ["<i>She melts into you.</i> \"finally.\""], "scene sent once, actions in italics");

section("OOC");
r = await turn("OOC: can you keep the *scenes* a bit shorter?", ["[react: 👀] [voice] OOC: Sure, I'll keep them shorter.\n\n*Reem smiles.*"], { history: SCENE });
eq(r.reactions, [], "no reaction to OOC");
eq(r.voices, 0, "no voice note for OOC");
eq(r.texts.length, 1, "one message");
yes(r.system[0].includes("speaking out of character"), "OOC nudge");
yes(!r.system[0].includes("Open this one differently"), "no opening nudge for OOC");
eq(r.saved.ooc, true, "OOC answer flagged in history");
r = await turn("OOC: was that too much?", ["*She smirks and steps closer.* \"you tell me.\"", "Not at all, it fits the story. Want me to slow it down?"], { history: SCENE });
yes(r.system[1]?.includes("Your last try stayed in the story"), "an OOC answer that only acts is asked again (RETRY_OOC)");
eq(r.texts, ["Not at all, it fits the story. Want me to slow it down?"], "the writer's plain answer is sent");
r = await turn("*pulls you inside*", ["*She laughs as the door shuts behind you.*"]);
yes(r.system[0].includes("You're together in person"), "scene resumes after OOC");
r = await turn("hey", ["*She tilts her head.* \"hey yourself.\""]);
yes(r.system[0].includes("You're together in person"), "the OOC exchange didn't end the scene");
W.CONFIG.REACTIONS.CHANCE = 0.25;

section("pictures: his photos (Workers AI vision)");
{
  const ai = []; let pictureNo = 0; let drawError = null; let visionError = null; let sameBytes = false; let filterNext = false;
  const formOf = async (input) => Object.fromEntries([...(await new Response(input.multipart.body, { headers: { "content-type": input.multipart.contentType } }).formData())].map(([k, v]) => [k, typeof v === "string" ? v : `<${v.size} bytes>`]));
  env.AI = { async run(model, input) {
    if (model.includes("flux")) {
      const fields = input.multipart ? await formOf(input) : input;
      ai.push({ model, fields });
      if (filterNext) { filterNext = false; throw new Error("3030: Input prompt contains NSFW content"); }
      if (drawError) { const e = drawError; if (!/5035/.test(e.message) || model.includes("flux-2")) throw e; }
      return { image: btoa(sameBytes ? "same picture" : `picture ${++pictureNo}`) };
    }
    ai.push({ model, input });
    if (visionError && (model === W.CONFIG.VISION.MODEL || !/5035/.test(visionError.message))) throw visionError;
    return { response: "A man in a gray hoodie smiling in a car [selfie]" };
  } };
  Object.assign(W.CONFIG.PICTURE, { CHANCE: 0, CHANCE_AFTER_PHOTO: 0, CHANCE_MORE: 0, SCENE_CHANCE: 0 });
  const lastUser = (x) => x.prompts[0].messages.filter((m) => m.role === "user").at(-1).content;
  const ledger = () => JSON.parse(store.get("pics") || "{}");
  const photoId = 1000 + uid;
  const sizes = [{ file_id: "small", width: 90, height: 68 }, { file_id: "mid", width: 800, height: 600 }, { file_id: "big", width: 1280, height: 960 }];
  r = await turn({ photo: sizes, caption: "new car" }, ["ok that's actually cute"], { history: APART });
  eq(r.files, ["mid"], "the biggest size up to VISION.MAX_SIDE (800) is looked at: less CPU and neurons");
  yes(ai[0].input.messages[0].content[1].image_url.url.startsWith("data:image/jpeg;base64,"), "the photo reaches the vision model");
  eq(lastUser(r), "[sent a photo: A man in a gray hoodie smiling in a car (selfie). His caption: new car]", "she reads what's in the photo and his caption (no stray brackets)");
  const his = JSON.parse(store.get("h:7")).at(-2);
  eq([his.parts[0].id, his.parts[0].seen], [photoId, "A man in a gray hoodie smiling in a car (selfie)."], "what she saw is kept with his message");
  eq(ledger().neurons, W.CONFIG.AI_BUDGET.PHOTO_NEURONS, "the photo is counted in the day's neurons (KV pics)");
  eq(r.photos.length, 0, "a photo description saying 'selfie' isn't him asking for one");
  await W.default.queue({ messages: [{ body: { update_id: uid++, edited_message: { message_id: photoId, chat: { id: 7, type: "private" }, from: { id: 7 }, photo: sizes, caption: "my new car!!" } }, ack() {} }] }, env, ctx);
  eq(JSON.parse(store.get("h:7")).at(-2).content, "[sent a photo: A man in a gray hoodie smiling in a car (selfie). His caption: my new car!!]", "a new caption keeps what she saw, without looking again");
  eq(ai.length, 1, "no second vision call for a caption edit");
  visionError = new Error("boom");
  r = await turn({ photo: sizes }, ["what's that"], { history: APART });
  eq(lastUser(r), "[sent a photo you can't open right now]", "vision down: the old line, and she still answers");
  yes(JSON.parse(store.get("ai_error")).error.includes("boom"), "the failure is kept for /setup");
  visionError = new Error("5035: this model requires the Workers Paid plan");
  r = await turn({ photo: sizes }, ["oh nice"], { history: APART });
  yes(ai.at(-1).model === W.CONFIG.VISION.BACKUP_MODEL && lastUser(r).startsWith("[sent a photo: A man"), "vision model moved off the free plan: the backup model sees it");
  visionError = null;

  section("pictures: apart (same rules as voice, cost-scaled)");
  ai.length = 0;
  r = await turn("send me a pic", ["here 😏\n\n[selfie: mirror selfie in the hallway, black slip dress]"], { history: APART });
  yes(r.system[0].includes("He's asking for a picture of you, and you send one"), "he asks: always (FORMAT_ASKED), like a voice note");
  eq(r.order, ["sendMessage", "sendPhoto"], "her words, then the picture");
  const f1 = ai.find((a) => a.model === W.CONFIG.PICTURE.MODEL).fields;
  yes(f1.prompt.startsWith(W.CONFIG.PICTURE.SELFIE_STYLE) && f1.prompt.includes("reflection in a hallway mirror") && f1.prompt.includes("in the hallway, black slip dress,") && f1.prompt.endsWith(`${W.CONFIG.PICTURE.CRAFT} ${W.CONFIG.PICTURE.SAFE}`), "prompt: style + her shot (the mirror she named) + what she wrote + CRAFT + SAFE", f1.prompt);
  yes(f1.prompt.includes(W.CONFIG.PICTURE.MIRROR_PHONE), "a mirror selfie: the iPhone rule");
  yes(f1.prompt.includes(W.CONFIG.PICTURE.REFERENCE) && !f1.prompt.includes(W.CONFIG.PICTURE.LOOKS) && /^<\d+ bytes>$/.test(f1.input_image_0), "drawn from her built-in face (face.js) as input_image_0");
  eq([f1.width, f1.height], ["640", "640"], "drawn at PICTURE.SIZE (cheaper and faster than 1024)");
  eq(r.photos[0].photo, "<blob>", "a freshly drawn picture is uploaded (never a reused file)");
  eq(r.saved.content, "here 😏\n\n[selfie: mirror, in the hallway, black slip dress]", "history: her words and [selfie: type, what]");
  yes(typeof r.saved.parts.at(-1).id === "number", "the picture has its message id, so /rewind and /retry delete it");
  eq(ledger().neurons, 3 * W.CONFIG.AI_BUDGET.PHOTO_NEURONS + W.CONFIG.AI_BUDGET.PICTURE_NEURONS, "the picture is counted");
  r = await turn("show me a selfie", ["no. earn it"], { history: APART });
  eq(r.photos.length, 1, "asked and she only teased: a picture comes anyway");
  yes(/^\[selfie: .+\]$/.test(r.saved.parts.at(-1).text), "...a shot the code picked, with its wardrobe and place", r.saved.parts.at(-1).text);
  r = await turn("good morning", ["morning\n\n[selfie: coffee on my balcony]"], { history: APART });
  yes(r.system[0].includes("[selfie: type, what it shows]") && r.system[0].includes("Types: close, selfie, mirror, cozy, detail, golden") && r.system[0].includes("mirror-back, neckline, legs, waist"), "apart she may choose one herself (SELF_CHOICE) and its type, sexier ones too", r.system[0].slice(-600));
  eq(r.photos.length, 1, "...and her own [selfie] is sent");
  yes(r.system[0].includes("Your last pictures showed:") && r.system[0].includes("mirror, in the hallway, black slip dress"), "she's reminded of her recent pictures (RECENT)");
  r = await turn("hey", ["hey you\n\n[selfie: mirror selfie in the hallway, black slip dress]"], { history: APART });
  const f2 = ai.filter((a) => a.model === W.CONFIG.PICTURE.MODEL).at(-1).fields;
  yes(!f2.prompt.includes("black slip dress"), "the same picture as a recent one: other clothes and place are drawn", f2.prompt);
  // Pictures v3 (owner 2026-10-02): sexy by pose or wardrobe is fine, nudity never
  r = await turn("hey", ["hi\n\n[selfie: me in lingerie on the bed]"], { history: APART });
  const f3 = ai.filter((a) => a.model === W.CONFIG.PICTURE.MODEL).at(-1).fields;
  yes(f3.prompt.includes(", in lingerie on the bed,") && f3.prompt.endsWith("No nudity.") && !/fully clothed|non-sexual/i.test(f3.prompt), "lingerie is drawn as she wrote it; SAFE is only 'No nudity.'", f3.prompt);
  r = await turn("hey", ["hi\n\n[selfie: me naked in bed]"], { history: APART });
  const f3b = ai.filter((a) => a.model === W.CONFIG.PICTURE.MODEL).at(-1).fields;
  yes(!/naked/.test(f3b.prompt) && W.CONFIG.PICTURE.WARDROBE.BOUDOIR.some((w) => f3b.prompt.includes(w.split("|")[0].trim())), "nudity never drawn: the sexiest allowed picture instead (boudoir wardrobe)", f3b.prompt);
  W.CONFIG.PICTURE.CHANCE = 1;
  r = await turn("what are you up to", ["just chilling"], { history: APART });
  yes(r.system[0].includes("This reply comes with a picture of you"), "on PICTURE.CHANCE: FORMAT");
  eq(r.photos.length, 1, "...and a picture comes");
  W.CONFIG.PICTURE.CHANCE = 0;
  W.CONFIG.PICTURE.CHANCE_AFTER_PHOTO = 1;
  r = await turn({ photo: sizes }, ["cute"], { history: APART });
  yes(r.system[0].includes("This reply comes with a picture of you"), "after his photo: CHANCE_AFTER_PHOTO (like CHANCE_AFTER_VOICE)");
  W.CONFIG.PICTURE.CHANCE_AFTER_PHOTO = 0;
  r = await turn({ text: "/pics" }, []);
  eq(JSON.parse(store.get("s:7")).morePics, true, "/pics turns more pictures on (like /voice)");
  W.CONFIG.PICTURE.CHANCE_MORE = 1;
  r = await turn("hi", ["hi"], { history: APART });
  yes(r.system[0].includes("This reply comes with a picture of you"), "with /pics: CHANCE_MORE");
  W.CONFIG.PICTURE.CHANCE_MORE = 0;
  await turn({ text: "/pics" }, []);
  eq(JSON.parse(store.get("s:7")).morePics, false, "/pics again turns it off");

  // seen in the live check 2026-10-02 (run 37045907764): a selfie written to him, and no [selfie] when the code decided one
  eq(W.selfieSubject("dim bedroom, city lights behind you, phone angled just above your eyes", []).words, "dim bedroom, city lights behind her, phone angled just above her eyes", "live: 'you' in her [selfie] becomes 'her'");
  eq(W.selfieSubject(null, [], "nothing. just finished dinner, basbousa is judging me from the counter\n\nyou? bored? curious?").doing, "just finished dinner, basbousa is judging her from the counter", "live: no [selfie]: the picture shows what she just said she's doing");
  eq(W.selfieSubject("texts with a mirror selfie — low light, her bedroom, in black lace").words, "low light, her bedroom, in black lace", "live: 'texts with a mirror selfie —' is not part of the picture");
  eq(W.selfieSubject("texts with a mirror selfie — low light, her bedroom, in black lace").shot, "mirror", "...but the mirror is kept");
  eq(["sends a photo: mirror shot, silhouette at the window", "cozy — messy bun, gray hoodie", "dim bedroom, mirror-back, black silk slip", "on the couch, cozy, gray hoodie"].map((w) => { const x = W.selfieSubject(w); return `${x.shot}: ${x.words}`; }),
    ["mirror: silhouette at the window", "cozy: messy bun, gray hoodie", "mirror-back: dim bedroom, black silk slip", "cozy: on the couch, gray hoodie"], "live: type labels ('mirror shot', 'cozy —', a type mid-list) come off her words; places stay");
  // seen in the live check 2026-10-02 (run 37069028699): narrated picture lines, "you're", meta lines, chat as "doing"
  eq(W.selfieSubject("sends a photo. in it, you're in bed, propped against your headboard").words, "she is in bed, propped against her headboard", "live: 'sends a photo. in it,' dropped; you're -> she is");
  eq(W.selfieSubject("smirking to herself, she shifts in bed. The photo comes through: flash-bright, her bathroom mirror, in black lace").words, "flash-bright, her bathroom mirror, in black lace", "live: only what comes after 'The photo comes through:'");
  eq(W.selfieSubject("Now, I'm supposed to reply to you with a picture of me in lingerie, since that's what you asked for.").words, "", "live: the model talking about the task is not drawn");
  eq(W.selfieSubject(null, [], "bold of you to assume i'm dressed for a belfie\ni'm in my ratty t-shirt and my hair is a crime scene").doing, "she is in her ratty t-shirt and her hair is a crime scene", "live: no marker: the line saying what she's doing, not the first line");
  eq(W.selfieSubject(null, [], "you're bold tonight... I like it. but pics don't come free, habibi.").doing, "", "live: chat that says nothing about her isn't drawn as what she's doing");
  yes(!W.mayDraw("tracing the outline of her thighs through the thin silk"), "live: 'through the thin silk' (see-through) is not drawn");
  // seen live: "lying on her side in bed" (no type) drawn as a mirror waist shot
  eq(W.selfiePicture({ want: "lying on my side in bed, hair spilled across the pillow", plan: { tier: "everyday", shot: "selfie" } }).shot, "selfie", "live: her description without a type keeps the shot she was told");
  eq(new Set(Array.from({ length: 50 }, () => W.selfiePicture({ want: "lying on my side in bed, hair on the pillow" }).shot)).size, 1, "...and with no plan, always the plain selfie (never a random framing)");
  eq(W.scenePicturePrompt("*The hallway is dim, the only light spilling from behind her, catching the curve of her shoulder where the robe has slipped. A pause. Her voice drops, mock-soft.*"), "The hallway is dim, the only light spilling from behind her, catching the curve of her shoulder where the robe has slipped.", "live: her voice and pauses aren't drawn");
  W.CONFIG.PICTURE.CHANCE = 1;
  r = await turn("what are you up to", ["just finished dinner, basbousa is judging me from the counter\n\nyou?"], { history: APART });
  W.CONFIG.PICTURE.CHANCE = 0;
  yes(r.prompts[0].messages.at(-1).content.startsWith("[This reply comes with a picture of you: put [selfie: ") && r.prompts[0].messages.at(-1).role === "system", "the picture reminder (with its shot) is the last thing she reads before writing", r.prompts[0].messages.at(-1).content);
  yes(ai.filter((a) => a.model === W.CONFIG.PICTURE.MODEL).at(-1).fields.prompt.includes("just finished dinner, basbousa is judging her from the counter"), "...and with no marker the picture matches her words");
  eq(W.scenePicturePrompt("*Reem's playful smirk falters for a second, caught off guard. The air between them goes sharp. She tilts her head, dark waves slipping over her collarbone.*"), "Her playful smirk falters for a second, caught off guard. She tilts her head, dark waves slipping over her collarbone.", "live: 'Reem's' becomes 'Her'; sentences about them both are left out");

  eq(W.scenePicturePrompt("*She tilts her head, a slow smile curving her lips as she pushes off the doorframe.* \"I said...\" *she murmurs, almost to herself. A small laugh escapes her, soft and warm.*"), "She tilts her head, a slow smile curving her lips as she pushes off the doorframe. A small laugh escapes her, soft and warm.", "live: speech-tag fragments ('she murmurs, ...') left out of scene pictures");

  section("pictures v3: the shot catalog");
  {
    const P = W.CONFIG.PICTURE;
    const tiers = ["everyday", "flirty", "boudoir"];
    const lights = Object.values(P.LIGHT).flat();
    const bad = [];
    for (const tier of tiers) for (const shot of W.tierShots(tier)) for (let k = 0; k < 40; k++) {
      const hour = k % 24;
      const pic = W.composePicture({ tier, shot, hour });
      const T = tier.toUpperCase();
      const p = pic.prompt;
      const n = p.split(/\s+/).length;
      if (/\{(?!who\})/.test(p) || /,\s*[,.]/.test(p)) bad.push(`placeholder or stray comma: ${p}`);
      if (n < 40 || n > 110) bad.push(`${n} words: ${p}`);
      if (P.SHOTS[shot].includes("{expression}") && !P.EXPRESSIONS[T].some((e) => p.includes(e))) bad.push(`expression not of ${tier}: ${p}`);
      if (!P.WARDROBE[T].some((w) => p.includes(w.split("|")[0].trim()))) bad.push(`wardrobe not of ${tier}: ${p}`);
      if (P.SHOTS[shot].includes("{light}") && !lights.some((l) => p.includes(l))) bad.push(`no light: ${p}`);
      if (pic.angle && !Object.hasOwn(P.ANGLES, pic.angle)) bad.push(`angle ${pic.angle}`);
      if (P.SHOTS[shot].includes("{angle}") !== !!pic.angle) bad.push(`angle where there's none: ${shot}`);
      if (!p.endsWith(`${P.CRAFT} ${P.SAFE}`)) bad.push(`no CRAFT + SAFE: ${p}`);
    }
    eq(bad.slice(0, 3), [], "every shot x tier: slots from the tier's lists, light, angle only where the shot has one, 40-110 words, CRAFT + SAFE last");
    // The owner's phone rules: selfies never show the phone or her hand; mirror selfies an iPhone
    const cams = Object.entries(P.SHOTS).map(([t, tpl]) => [t, (tpl.match(/\{(selfie|mirror|pov)\}/g) || []).join("")]);
    eq(cams.filter(([, c]) => !["{selfie}", "{mirror}", "{pov}"].includes(c)), [], "every shot starts from exactly one phone rule");
    yes(P.SELFIE_PHONE.includes("the phone itself is never in the picture") && P.SELFIE_PHONE.includes("her hands are out of the frame") && P.MIRROR_PHONE.includes("iPhone") && P.MIRROR_PHONE.includes("visible in the mirror"), "phone rules: selfie no phone or hand; mirror an iPhone, visible");
    const mirrorShots = cams.filter(([, c]) => c === "{mirror}").map(([t]) => t);
    eq(mirrorShots, ["mirror", "mirror-back", "waist"], "mirror shots: mirror, mirror-back, waist");
    yes(mirrorShots.every((s) => W.composePicture({ tier: "boudoir", shot: s }).prompt.includes("iPhone")) && ["close", "selfie", "neckline", "golden"].every((s) => { const p = W.composePicture({ tier: "everyday", shot: s }).prompt; return p.includes(P.SELFIE_PHONE) && !p.includes("iPhone"); }), "...and in the prompts");
    // Slots picked in code, by weight
    const counts = {};
    for (let k = 0; k < 4000; k++) { const a = W.pickWeighted(P.ANGLE_WEIGHTS); counts[a] = (counts[a] || 0) + 1; }
    yes(Object.entries(P.ANGLE_WEIGHTS).every(([a, w]) => Math.abs(counts[a] / 4000 - w) < 0.04), "angles follow ANGLE_WEIGHTS (high .45, eye .35, low .1, over .1)", JSON.stringify(counts));
    // Not the same type or angle as the last pictures
    const recentShots = [{ shot: "close", angle: "eye" }, { shot: "selfie", angle: "high" }];
    const shots = new Set(Array.from({ length: 200 }, () => W.pickShot("everyday", recentShots, 12)));
    yes(!shots.has("close") && !shots.has("selfie") && shots.size >= 3, "recent shot types avoided (RECENT_SHOTS)", [...shots]);
    const angles = new Set(Array.from({ length: 200 }, () => W.composePicture({ tier: "everyday", shot: "selfie", recentShots }).angle));
    yes(!angles.has("high") && angles.has("eye"), "the last picture's angle avoided", [...angles]);
    yes(new Set(Array.from({ length: 200 }, () => W.pickShot("everyday", [], 2))).has("golden") === false && new Set(Array.from({ length: 300 }, () => W.pickShot("everyday", [], 17))).has("golden"), "golden only at golden hour (SHOT_HOURS)");
    // Tier: what he asks for, else the chat's heat
    const tiersOf = (o, n = 300) => new Set(Array.from({ length: n }, () => W.pickTier(o)));
    yes(!tiersOf({ asked: "send me a sexy pic" }).has("everyday"), "he asks for a sexy one: never everyday");
    eq([...tiersOf({ asked: "send me a pic in lingerie" })], ["boudoir"], "he asks for lingerie: boudoir");
    eq([...tiersOf({ asked: "send me a belfie", shot: "mirror-back" })].filter((t) => t === "everyday"), [], "a shot only in sexier tiers never comes as everyday");
    eq([W.chatHeat([], "hi", 12), W.chatHeat([], "hi", 23), W.chatHeat([{ content: "i want you in my bed" }], "come over", 12), W.chatHeat([{ content: "kiss me. your lips. your body. i want you" }], "", 12)], [0, 1, 1, 2], "heat: calm; late = warm; heat words warm, many hot");
    const calm = tiersOf({ heat: 0 }, 1000);
    yes(calm.has("everyday") && calm.has("flirty"), "calm chat: mostly everyday, sometimes flirty (her own choice by mood)");
    eq(W.shotNamed("send me a belfie"), "mirror-back", "he names a shot: belfie = mirror-back");
    eq(W.planShot({ asked: "show me your legs", history: [] }).shot, "legs", "he asks for her legs: the legs shot");
    eq([W.selfieSubject("mirror-back, black leggings").shot, W.selfieSubject("mirror-back, black leggings").words], ["mirror-back", "black leggings"], "she names the type first in her marker");
    // Nudity words only
    yes(["black lace lingerie on the bed", "a string bikini", "kissing the mirror", "in the shower"].every(W.mayDraw), "lingerie, bikini, bed, kiss, shower are drawn now");
    yes(["naked in bed", "topless", "a see-through top", "sheer robe", "nude"].every((t) => !W.mayDraw(t)), "nudity words never drawn (NOT_DRAWN)");
    eq(W.scenePicturePrompt("*She lets the silk robe slip off one shoulder, standing by the bed in black lace lingerie. She is naked under it.*"), "She lets the silk robe slip off one shoulder, standing by the bed in black lace lingerie.", "scene pictures drop only explicit sentences");
  }
  ai.length = 0;
  r = await turn("send me a belfie 😏", ["fine. don't say i never spoil you\n\n[selfie: mirror-back, black leggings]"], { history: APART });
  yes(r.system[0].includes("[selfie: mirror-back, what it shows]") && [W.CONFIG.PICTURE.TIER_HINTS.flirty, W.CONFIG.PICTURE.TIER_HINTS.boudoir].some((h) => r.system[0].includes(h.trim())), "he asks for a belfie: she's told the shot and a sexier tier (flirty or boudoir)", r.system[0].slice(-500));
  const fb = ai.filter((a) => a.model === W.CONFIG.PICTURE.MODEL).at(-1).fields;
  yes(fb.prompt.includes("her back to a") && fb.prompt.includes("black leggings") && fb.prompt.includes("iPhone"), "drawn as a mirror-back with her words", fb.prompt);
  eq(r.saved.parts.at(-1).text, "[selfie: mirror-back, black leggings]", "history: [selfie: type, what]");
  r = await turn("send me a pic in your lingerie", ["greedy\n\n[selfie: in black lace, sitting on the edge of my bed]"], { history: APART });
  yes(r.system[0].includes(W.CONFIG.PICTURE.TIER_HINTS.boudoir.trim()), "lingerie asked: boudoir hint");
  yes(ai.filter((a) => a.model === W.CONFIG.PICTURE.MODEL).at(-1).fields.prompt.includes("in black lace, sitting on the edge of her bed"), "...her words drawn");
  // seen on the real API 2026-10-02 (face run 37067630871): Cloudflare's filter (3030) refused a boudoir mirror shot
  filterNext = true;
  r = await turn("send me a pic in lingerie", ["[selfie: mirror, red satin corset by the window]"], { history: APART });
  const tries = ai.filter((a) => a.model === W.CONFIG.PICTURE.MODEL).slice(-2).map((a) => a.fields.prompt);
  yes(r.photos.length === 1 && tries.length === 2 && tries[0].includes("red satin corset") && !tries[1].includes("corset") && W.CONFIG.PICTURE.WARDROBE.FLIRTY.some((w) => tries[1].includes(w)), "safety filter (3030): drawn once more, one tier tamer, so a picture still comes", tries[1]);
  eq(r.saved.parts.at(-1).text.startsWith("[selfie: mirror, wearing "), true, "...and history says what was really drawn");
  // seen live 2026-10-03: after a refused lingerie pic, /setup showed "5006: Additional or unevaluated properties
  // '/seed'": the 3030 refusal went to the FLUX.1 schnell backup, called with a seed it rejects
  {
    const calls = [];
    const fakeAI = (fail) => ({ async run(model, input) { calls.push({ model, input }); if (model === W.CONFIG.PICTURE.MODEL) throw new Error(fail); if (input && "seed" in input) throw new Error("5006: Additional or unevaluated properties '/seed' at '/' not allowed"); return { image: btoa("backup picture") }; } });
    const realAI = env.AI;
    env.AI = fakeAI("3030: Input prompt contains NSFW content (model not available for this prompt)");
    const refused = await W.drawPicture(env, "{who} in a lace bodysuit").then(() => null, (e) => e.message);
    yes(/3030/.test(refused || "") && calls.every((c) => c.model === W.CONFIG.PICTURE.MODEL), "a 3030 refusal stands: never redrawn by the backup", calls.map((c) => c.model));
    // live 2026-10-03 (AI diagnosis run 37082338382): out of neurons is 4006 and says "please upgrade to ...
    // Workers Paid"; read as "unavailable", the backup was tried with a seed and its 5006 hid the real error
    calls.length = 0;
    env.AI = fakeAI("4006: AiError: AiError: you have used up your daily free allocation of 10,000 neurons, please upgrade to Cloudflare's Workers Paid plan if you would like to continue usage.");
    const out = await W.drawPicture(env, "{who} at a café").then(() => null, (e) => e.message);
    yes(/daily free allocation/.test(out || "") && calls.every((c) => c.model === W.CONFIG.PICTURE.MODEL), "out of neurons (4006): the real error comes back, no backup tried", calls.map((c) => c.model));
    const ledger = { neurons: 0, out: false };
    W.aiSpent(ledger, 50, new Error(out));
    yes(typeof ledger.out === "number" && !W.aiAffordable(ledger, "picture"), "...and AI use stops (ledger out, with the time)");
    ledger.out = Date.now() - W.CONFIG.AI_BUDGET.OUT_RETRY_MS - 1;
    yes(W.aiAffordable(ledger, "picture"), "...for OUT_RETRY_MS only: then one try (seen: the block outlived the 00:00 UTC reset)");
    yes(W.aiAffordable({ neurons: 0, out: true }, "picture"), "an old ledger's out: true doesn't lock the rest of the day");
    W.aiSpent(ledger, 105, null);
    eq(ledger.out, false, "a call that works clears it");
    calls.length = 0;
    env.AI = fakeAI("5035: model unavailable");
    const backup = await W.drawPicture(env, "{who} at a café").catch((e) => ({ error: e.message }));
    const sent = calls.find((c) => c.model === W.CONFIG.PICTURE.BACKUP_MODEL);
    yes(backup.model === W.CONFIG.PICTURE.BACKUP_MODEL && sent && !("seed" in sent.input), "klein unavailable: schnell draws, with no seed (its schema rejects one)", sent && sent.input);
    env.AI = realAI;
  }
  // seen live 2026-10-03: "send me a belfie" + her [selfie: mirror, ...] came out as a plain mirror shot
  {
    const plan = W.planShot({ asked: "send me a belfie", history: [] });
    eq([plan.shot, plan.named], ["mirror-back", true], "planShot: the shot he named is marked named");
    eq(W.planShot({ asked: "send me a pic", history: [] }).named, false, "...and nothing named: not marked");
    eq(W.selfiePicture({ want: "mirror, black leggings", plan, asked: "send me a belfie" }).shot, "mirror-back", "he named a belfie, she wrote 'mirror': still the belfie");
    yes(W.selfiePicture({ want: "mirror, black leggings", plan, asked: "send me a belfie" }).prompt.includes("black leggings"), "...with her words");
  }
  r = await turn("send me a pic of you", ["here\n\n[selfie: wearing nothing at all]"], { history: APART });
  yes(!/nothing at all/.test(ai.filter((a) => a.model === W.CONFIG.PICTURE.MODEL).at(-1).fields.prompt), "'wearing nothing' is never drawn");

  section("pictures: in person");
  r = await turn("*steps closer* let me see you", ["*She leans against the doorframe, her dark waves loose over one shoulder, a slow smile on her lips.* \"like what you see?\" *Her eyes move over you.*"], { history: SCENE });
  eq(r.order, ["sendMessage", "sendPhoto"], "he asks to see her (SCENE_ASK_PATTERN): the scene, then a picture of the moment");
  const f4 = ai.filter((a) => a.model === W.CONFIG.PICTURE.MODEL).at(-1).fields;
  yes(f4.prompt.startsWith(W.CONFIG.PICTURE.SCENE_STYLE) && f4.prompt.includes("She leans against the doorframe") && !/\byou\b|Her eyes move/.test(f4.prompt), "drawn from her narration only, nothing about him", f4.prompt);
  eq(r.saved.parts.at(-1).text, "", "the scene picture is in history for /rewind, not in what she reads back");
  yes(!r.system[0].includes("[selfie:"), "no [selfie] nudges in person");
  r = await turn("*kisses her* show me", ["*She pulls you onto the bed, her hips against yours.* \"finally.\""], { history: SCENE });
  eq(r.photos.length, 0, "only sexual or him-centred narration: no picture this time");
  W.CONFIG.PICTURE.SCENE_CHANCE = 1;
  r = await turn("*sits on the couch*", ["*Reem curls up at the other end of the couch, tucking her bare feet under a gray knit cardigan.* \"comfy?\""], { history: SCENE });
  eq(r.photos.length, 1, "in person on SCENE_CHANCE (like the voice clip)");
  W.CONFIG.PICTURE.SCENE_CHANCE = 0;

  section("pictures: never");
  r = await turn("OOC: can she send a selfie?", ["Sure, just ask her. [selfie: mirror selfie]"], { history: APART });
  yes(r.photos.length === 0 && !r.system[0].includes("[selfie:"), "never OOC (like voice)");
  store.set("s:7", JSON.stringify({}));
  r = await turn("im 15 btw. send me a selfie", ["oh. ok, friends then"], { history: APART });
  eq(r.photos.length, 0, "he says he's under 18: no picture");
  eq(JSON.parse(store.get("s:7")).minor, true, "...remembered");
  r = await turn("send me a pic pls", ["no"], { history: APART });
  yes(r.photos.length === 0 && !r.system[0].includes("[selfie:"), "...never again, not even offered");
  r = await turn("send me a sexy pic in lingerie", ["no. friends, remember?"], { history: APART });
  yes(r.photos.length === 0 && !r.system[0].includes("[selfie:") && !r.system[0].includes("lingerie, satin or swimwear"), "...a sexy ask neither (pictures v3)");
  store.set("s:7", JSON.stringify({}));
  const minor = ["i'm 16", "I am 17 years old", "under 18 lol", "im sixteen", "i'm fifteen y/o", "i'm in 10th grade", "im in high school", "15 yo here"];
  // Errs on the safe side: "back when I was in high school" also matches (it only stops pictures)
  const adult = ["i'm 16 minutes away", "im 25", "i'm 18", "my sister is 16", "i'm 17 km from you"];
  eq(minor.filter((t) => !W.saysMinor(t)), [], "MINOR_PATTERN catches ages, words and school grades");
  eq(adult.filter((t) => W.saysMinor(t)), [], "...not minutes, distances, adults or someone else");

  section("pictures: budget, failures, no repeats");
  store.set("pics", JSON.stringify({ ...ledger(), neurons: W.CONFIG.AI_BUDGET.DAILY_NEURONS * W.CONFIG.AI_BUDGET.PICTURE_SHARE }));
  r = await turn("send me a pic", ["can't rn"], { history: APART });
  yes(r.photos.length === 0 && !r.system[0].includes("[selfie:"), "pictures' share of the day used: no picture, not offered");
  r = await turn({ photo: sizes }, ["nice"], { history: APART });
  yes(lastUser(r).startsWith("[sent a photo: A man"), "...but his photos are still seen (PICTURE_SHARE)");
  store.set("pics", JSON.stringify({ ...ledger(), neurons: 0, out: Date.now() }));
  r = await turn({ photo: sizes }, ["?"], { history: APART });
  eq(lastUser(r), "[sent a photo you can't open right now]", "Cloudflare said the allocation is used up: nothing tried for OUT_RETRY_MS");
  store.set("pics", JSON.stringify({ ...ledger(), out: false }));
  drawError = new Error("3036: You have used up your daily free allocation of 10,000 neurons");
  r = await turn("send me a pic", ["[selfie: on my balcony]"], { history: APART });
  eq(r.texts, [W.CONFIG.PICTURE.FAILED_TEXT], "the picture was her whole reply and failed: FAILED_TEXT");
  yes(typeof ledger().out === "number", "3036 stops Workers AI for OUT_RETRY_MS");
  store.set("pics", JSON.stringify({ ...ledger(), out: false }));
  drawError = new Error("5035: requires the Workers Paid plan");
  r = await turn("send me a pic", ["here\n\n[selfie: on my balcony at sunset]"], { history: APART });
  yes(r.photos.length === 1 && ai.at(-1).model === W.CONFIG.PICTURE.BACKUP_MODEL && ai.at(-1).fields.prompt.includes(W.CONFIG.PICTURE.LOOKS), "drawing model moved off the free plan: the backup draws from LOOKS");
  drawError = null;
  sameBytes = true;
  r = await turn("send me a pic", ["[selfie: in the kitchen]"], { history: APART });
  eq(r.photos.length, 1, "first of two identical drawings is sent");
  r = await turn("another", ["[selfie: in the kitchen cooking pasta]"], { history: APART });
  eq([r.photos.length, r.texts], [0, [W.CONFIG.PICTURE.FAILED_TEXT]], "the exact same picture is never sent twice");
  sameBytes = false;
  const bytes = W.fromBase64(btoa("hello"));
  eq(new TextDecoder().decode(bytes), "hello", "fromBase64");

  section("/face: her reference face");
  ai.length = 0;
  const noticeOf = async (m) => { const c0 = calls.length; await W.default.queue({ messages: [msg(m)] }, env, ctx); return calls.slice(c0); };
  let c = await noticeOf({ text: "/face" });
  const photos = c.filter((x) => x.method === "sendPhoto");
  yes(photos[0]?.body.caption.includes("(built in)"), "/face shows her face now (built in)");
  eq(photos.filter((x) => /Option \d/.test(x.body.caption)).length, 3, "...and 3 new ones to pick from");
  yes(ai.every((a) => a.fields.prompt.includes(W.CONFIG.PICTURE.PORTRAIT) && a.fields.width === "480" && !a.fields.input_image_0), "drafts: portraits under 512 px, drawn without a reference");
  const draftIds = [...store.keys()].filter((k) => k.startsWith("face_draft:"));
  eq(draftIds.length, 3, "drafts kept (a day) for /face keep");
  c = await noticeOf({ text: "/face keep" });
  yes(c.find((x) => x.method === "sendMessage")?.body.text.includes("Reply to one of the faces"), "/face keep needs a reply");
  const pick = Number(draftIds[1].split(":")[1]);
  c = await noticeOf({ text: "/face keep", reply_to_message: { message_id: pick, photo: [{ file_id: "x" }] } });
  eq(store.get("face"), store.get(`face_draft:${pick}`), "/face keep (reply) makes it her face");
  r = await turn("send me a pic", ["[selfie: at a café]"], { history: APART });
  const f5 = ai.filter((a) => a.model === W.CONFIG.PICTURE.MODEL).at(-1).fields;
  yes(f5.prompt.includes(W.CONFIG.PICTURE.REFERENCE) && /^<\d+ bytes>$/.test(f5.input_image_0), "her pictures are drawn from that face (input_image_0)");
  c = await noticeOf({ text: "/face reset" });
  eq(store.has("face"), false, "/face reset");
  yes(W.isQuickCommand({ message: { text: "/face" } }) && W.isQuickCommand({ message: { text: "/pics" } }), "/face and /pics are answered from the webhook");

  section("/health");
  store.delete("health_at");
  let h = await (await W.default.fetch(new Request("https://x.dev/health"), env, ctx)).json();
  yes(h.ok && h.draw.ok && h.vision.ok && h.draw.model === W.CONFIG.PICTURE.MODEL, "/health draws a small picture and describes it", JSON.stringify(h));
  eq(calls.filter((x) => x.url.includes("/health")).length, 0, "...without touching Telegram");
  h = await (await W.default.fetch(new Request("https://x.dev/health"), env, ctx)).json();
  yes(h.skipped && h.last && h.last.ok, "at most once per 10 minutes (the last result is shown)");
  store.delete("health_at");
  visionError = null;
  const realRun = env.AI.run;
  env.AI.run = async (model, input) => (model.includes("flux") ? realRun(model, input) : { response: "I can't identify people based on their image." });
  h = await (await W.default.fetch(new Request("https://x.dev/health"), env, ctx)).json();
  yes(!h.ok && h.draw.ok && !h.vision.ok, "a refusal from the vision model is not OK (seen live after the deploy)", JSON.stringify(h));
  env.AI.run = realRun;

  delete env.AI;
  Object.assign(W.CONFIG.PICTURE, { CHANCE: 0.05, CHANCE_AFTER_PHOTO: 0.3, CHANCE_MORE: 0.15, SCENE_CHANCE: 0.08 });
  store.set("s:7", JSON.stringify({}));
}

section("LIMITS & OOC always sent, word for word");
yes(W.SYSTEM_PROMPT.endsWith(LIMITS), "SYSTEM_PROMPT ends with the exact LIMITS & OOC text");
yes(prompts.every((p) => p.messages[0].content.includes(LIMITS)), `in every reply's prompt (${prompts.length} prompts)`);
r = await turn("lol btw i'm 16", ["wait what. ok... friends then. so how was school"], { history: APART });
yes(r.system[0].includes("If he ever says he is under 18, stop all flirting"), "under-18 rule present when he states an age");
yes(r.prompts[0].messages.filter((m) => m.role === "user").at(-1).content === "lol btw i'm 16", "his words reach the model unchanged");

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
