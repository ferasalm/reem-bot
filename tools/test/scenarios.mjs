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
  ["selfie: never OOC", "Sure, I can do that. [selfie: mirror selfie]", { ooc: true, canSelfie: true }, { kind: "text", selfie: null, texts: ["Sure, I can do that."] }],
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
  const ai = []; let pictureNo = 0; let drawError = null; let visionError = null; let sameBytes = false;
  const formOf = async (input) => Object.fromEntries([...(await new Response(input.multipart.body, { headers: { "content-type": input.multipart.contentType } }).formData())].map(([k, v]) => [k, typeof v === "string" ? v : `<${v.size} bytes>`]));
  env.AI = { async run(model, input) {
    if (model.includes("flux")) {
      const fields = input.multipart ? await formOf(input) : input;
      ai.push({ model, fields });
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
  yes(f1.prompt.startsWith(W.CONFIG.PICTURE.SELFIE_STYLE) && f1.prompt.includes("mirror selfie in the hallway, black slip dress.") && f1.prompt.endsWith(W.CONFIG.PICTURE.SAFE), "prompt: style + what she wrote + SAFE");
  yes(f1.prompt.includes(W.CONFIG.PICTURE.LOOKS) && !f1.input_image_0, "no reference face yet: LOOKS, no input image");
  eq([f1.width, f1.height], ["640", "640"], "drawn at PICTURE.SIZE (cheaper and faster than 1024)");
  eq(r.photos[0].photo, "<blob>", "a freshly drawn picture is uploaded (never a reused file)");
  eq(r.saved.content, "here 😏\n\n[selfie: mirror selfie in the hallway, black slip dress]", "history: her words and [selfie: ...]");
  yes(typeof r.saved.parts.at(-1).id === "number", "the picture has its message id, so /rewind and /retry delete it");
  eq(ledger().neurons, 3 * W.CONFIG.AI_BUDGET.PHOTO_NEURONS + W.CONFIG.AI_BUDGET.PICTURE_NEURONS, "the picture is counted");
  r = await turn("show me a selfie", ["no. earn it"], { history: APART });
  eq(r.photos.length, 1, "asked and she only teased: a picture comes anyway");
  yes(/^\[selfie: .+\]$/.test(r.saved.parts.at(-1).text), "...showing what she's doing or a VARIETY", r.saved.parts.at(-1).text);
  r = await turn("good morning", ["morning\n\n[selfie: coffee on my balcony]"], { history: APART });
  yes(r.system[0].includes(W.CONFIG.PICTURE.SELF_CHOICE.trim()), "apart she may choose one herself (SELF_CHOICE), like [voice]");
  eq(r.photos.length, 1, "...and her own [selfie] is sent");
  yes(r.system[0].includes("Your last pictures showed:") && r.system[0].includes("mirror selfie in the hallway"), "she's reminded of her recent pictures (RECENT)");
  r = await turn("hey", ["hey you\n\n[selfie: mirror selfie in the hallway, black slip dress]"], { history: APART });
  const f2 = ai.filter((a) => a.model === W.CONFIG.PICTURE.MODEL).at(-1).fields;
  yes(!f2.prompt.includes("mirror selfie in the hallway"), "the same picture as a recent one: a different subject is drawn", f2.prompt);
  r = await turn("hey", ["hi\n\n[selfie: me in lingerie on the bed]"], { history: APART });
  const f3 = ai.filter((a) => a.model === W.CONFIG.PICTURE.MODEL).at(-1).fields;
  yes(!/lingerie|bed/.test(f3.prompt) && f3.prompt.endsWith(W.CONFIG.PICTURE.SAFE), "never drawn sexual: another subject, SAFE always");
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
  eq(W.selfieSubject("dim bedroom, city lights behind you, phone angled just above your eyes", []), "dim bedroom, city lights behind her, phone angled just above her eyes", "live: 'you' in her [selfie] becomes 'her'");
  eq(W.selfieSubject(null, [], "nothing. just finished dinner, basbousa is judging me from the counter\n\nyou? bored? curious?"), "just finished dinner, basbousa is judging her from the counter", "live: no [selfie]: the picture shows what she just said she's doing");
  W.CONFIG.PICTURE.CHANCE = 1;
  r = await turn("what are you up to", ["just finished dinner, basbousa is judging me from the counter\n\nyou?"], { history: APART });
  W.CONFIG.PICTURE.CHANCE = 0;
  yes(r.prompts[0].messages.at(-1).content === W.CONFIG.PICTURE.REMINDER, "the picture reminder is the last thing she reads before writing");
  yes(ai.filter((a) => a.model === W.CONFIG.PICTURE.MODEL).at(-1).fields.prompt.includes("just finished dinner, basbousa is judging her from the counter"), "...and with no marker the picture matches her words");
  eq(W.scenePicturePrompt("*Reem's playful smirk falters for a second, caught off guard. The air between them goes sharp. She tilts her head, dark waves slipping over her collarbone.*"), "Her playful smirk falters for a second, caught off guard. She tilts her head, dark waves slipping over her collarbone.", "live: 'Reem's' becomes 'Her'; sentences about them both are left out");

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
  store.set("pics", JSON.stringify({ ...ledger(), neurons: 0, out: true }));
  r = await turn({ photo: sizes }, ["?"], { history: APART });
  eq(lastUser(r), "[sent a photo you can't open right now]", "Cloudflare said the day is used up: nothing tried until 00:00 UTC");
  store.set("pics", JSON.stringify({ ...ledger(), out: false }));
  drawError = new Error("3036: You have used up your daily free allocation of 10,000 neurons");
  r = await turn("send me a pic", ["[selfie: on my balcony]"], { history: APART });
  eq(r.texts, [W.CONFIG.PICTURE.FAILED_TEXT], "the picture was her whole reply and failed: FAILED_TEXT");
  eq(ledger().out, true, "3036 stops Workers AI for the rest of the UTC day");
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
  const drafts = c.filter((x) => x.method === "sendPhoto");
  eq(drafts.length, 3, "/face with no face yet: 3 drafts");
  yes(c.find((x) => x.method === "sendMessage")?.body.text.includes("no reference face yet"), "...and says there's none yet");
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
