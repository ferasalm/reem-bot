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

section("pictures: his photos, her selfies");
{
  const ai = [];
  env.AI = { async run(model, input) { ai.push({ model, input }); return model.includes("flux") ? { image: btoa("jpeg") } : { response: "A man in a gray hoodie smiling in a car [selfie]" }; } };
  Object.assign(W.CONFIG.SELFIE, { CHANCE: 0, MAX_PER_DAY: 20 });
  const lastUser = (x) => x.prompts[0].messages.filter((m) => m.role === "user").at(-1).content;
  const photoId = 1000 + uid;
  const sizes = [{ file_id: "small", width: 90, height: 68 }, { file_id: "big", width: 1280, height: 960 }, { file_id: "huge", width: 2560, height: 1920 }];
  r = await turn({ photo: sizes, caption: "new car" }, ["ok that's actually cute"], { history: APART });
  eq(r.files, ["big"], "the biggest size up to VISION.MAX_SIDE is looked at");
  yes(ai[0].input.messages[0].content[1].image_url.url.startsWith("data:image/jpeg;base64,"), "the photo reaches the vision model");
  eq(lastUser(r), "[sent a photo: A man in a gray hoodie smiling in a car (selfie). His caption: new car]", "she reads what's in the photo and his caption (no stray brackets)");
  const his = JSON.parse(store.get("h:7")).at(-2);
  eq([his.parts[0].id, his.parts[0].seen], [photoId, "A man in a gray hoodie smiling in a car (selfie)."], "what she saw is kept with his message");
  await W.default.queue({ messages: [{ body: { update_id: uid++, edited_message: { message_id: photoId, chat: { id: 7, type: "private" }, from: { id: 7 }, photo: sizes, caption: "my new car!!" } }, ack() {} }] }, env, ctx);
  eq(JSON.parse(store.get("h:7")).at(-2).content, "[sent a photo: A man in a gray hoodie smiling in a car (selfie). His caption: my new car!!]", "a new caption keeps what she saw, without looking again");
  eq(ai.length, 1, "no second vision call for a caption edit");

  env.AI.run = async () => { throw new Error("boom"); };
  r = await turn({ photo: sizes }, ["what's that"], { history: APART });
  eq(lastUser(r), "[sent a photo you can't open right now]", "vision down: the old line, and she still answers");
  yes(JSON.parse(store.get("ai_error")).error.includes("boom"), "the failure is kept for /setup");
  env.AI.run = async (model, input) => { ai.push({ model, input }); return model.includes("flux") ? { image: btoa("jpeg") } : { response: "A dog." }; };

  store.set("selfies", JSON.stringify([{ tag: "mirror selfie", file_id: "F1" }, { tag: "morning coffee on the balcony", file_id: "F2" }]));
  r = await turn("send me a pic", ["here 😏\n\n[selfie: mirror selfie]"], { history: APART });
  yes(r.system[0].includes("He's asking for a picture of you"), "he asks: NUDGE_ASKED");
  yes(r.system[0].includes("What it can show: mirror selfie, morning coffee on the balcony, anything you describe in a few words."), "the pack and drawing offered");
  eq(r.order, ["sendMessage", "sendPhoto"], "her words, then the picture");
  eq(r.photos.map((p) => p.photo), ["F1"], "the pack photo that matches");
  eq(r.saved.content, "here 😏\n[selfie: mirror selfie]".replace("\n", "\n\n"), "history: her words and [selfie: ...]");
  yes(typeof r.saved.parts.at(-1).id === "number", "the picture has its message id, so /rewind and /retry delete it");
  r = await turn("good morning", ["[selfie: coffee on my balcony]\nmorning"], { history: APART });
  eq(r.photos.length, 0, "not offered (CHANCE 0, not asked): no picture, marker dropped");
  eq(r.texts, ["morning"], "...and her words still go out");
  W.CONFIG.SELFIE.CHANCE = 1;
  r = await turn("good morning", ["morning ☀️\n\n[selfie: coffee on my balcony]"], { history: APART });
  yes(r.system[0].includes("You can send him a picture of yourself"), "offered on a CHANCE roll: NUDGE");
  eq(r.photos.map((p) => p.photo), ["F2"], "best word match from the pack");
  W.CONFIG.SELFIE.CHANCE = 0;
  r = await turn("show me a selfie", ["no. earn it"], { history: APART });
  eq(r.photos.length, 1, "asked and she only teased: a picture comes anyway (WHEN_ASKED)");
  const drawn = ai.length;
  r = await turn("send a pic from the gym", ["[selfie: me at the gym after a workout]"], { history: APART });
  eq(ai.length - drawn, 1, "nothing in the pack fits: drawn");
  yes(ai.at(-1).input.prompt.startsWith(W.CONFIG.SELFIE.LOOKS) && ai.at(-1).input.prompt.includes("me at the gym after a workout.") && ai.at(-1).input.prompt.endsWith(W.CONFIG.SELFIE.SAFE), "drawing prompt: her looks + what it shows + SAFE");
  eq([r.photos.length, r.photos[0].photo], [1, "<blob>"], "the drawn picture is uploaded");
  eq(r.saved.content, "[selfie: me at the gym after a workout]", "picture-only reply saved");
  r = await turn("send a pic", ["[selfie: me in lingerie]"], { history: APART });
  eq(ai.length - drawn, 1, "never drawn from a sexual description (NOT_DRAWN)");
  yes(["F1", "F2"].includes(r.photos[0]?.photo), "...a pack photo instead");
  r = await turn("*steps closer* send me a pic", ["*She laughs.* \"you're right here.\" [selfie: mirror selfie]"], { history: SCENE });
  eq(r.photos.length, 0, "never in person");
  yes(!r.system[0].includes("picture of you"), "no picture nudge in person");
  r = await turn("OOC: can she send a selfie?", ["Sure, just ask her. [selfie: mirror selfie]"], { history: APART });
  eq(r.photos.length, 0, "never OOC");
  W.CONFIG.SELFIE.MAX_PER_DAY = 0;
  r = await turn("send me a pic", ["here"], { history: APART });
  eq(r.photos.length, 0, "daily cap (MAX_PER_DAY)");
  W.CONFIG.SELFIE.MAX_PER_DAY = 20;
  store.set("s:7", JSON.stringify({}));
  r = await turn("im 15 btw. send me a selfie", ["oh. ok, friends then"], { history: APART });
  eq(r.photos.length, 0, "he says he's under 18: no picture");
  eq(JSON.parse(store.get("s:7")).minor, true, "...remembered");
  r = await turn("send me a pic pls", ["no"], { history: APART });
  eq(r.photos.length, 0, "...and never again");
  yes(!r.system[0].includes("picture of you"), "...not even offered");
  yes(!W.isQuickCommand({}) && W.saysMinor("i'm 16") && W.saysMinor("I am 17 years old") && W.saysMinor("under 18 lol") && !W.saysMinor("i'm 16 minutes away") && !W.saysMinor("im 25") && !W.saysMinor("i'm 18"), "MINOR_PATTERN: ages under 18 only, not minutes");
  store.set("s:7", JSON.stringify({}));

  section("/selfie: her photo pack");
  const noticeOf = async (m) => { const c0 = calls.length; await W.default.queue({ messages: [msg(m)] }, env, ctx); return calls.slice(c0); };
  store.delete("selfies");
  let c = await noticeOf({ text: "/selfie" });
  yes(c.find((x) => x.method === "sendMessage")?.body.text.includes("has no photos yet"), "empty pack explained");
  c = await noticeOf({ photo: sizes, caption: "/selfie add beach day in Sahel" });
  eq(JSON.parse(store.get("selfies")), [{ tag: "beach day in Sahel", file_id: "huge" }], "a photo with /selfie add as its caption is saved (biggest size)");
  c = await noticeOf({ text: "/selfie add gym", reply_to_message: { message_id: 5, photo: [{ file_id: "G" }] } });
  eq(JSON.parse(store.get("selfies")).at(-1), { tag: "gym", file_id: "G" }, "replying to a photo with /selfie add saves it");
  c = await noticeOf({ text: "/selfie add gym" });
  yes(c.find((x) => x.method === "sendMessage")?.body.text.includes("Reply to a picture"), "no picture: explained");
  c = await noticeOf({ text: "/selfie" });
  yes(/photos \(2\):\n- beach day in Sahel\n- gym/.test(c.find((x) => x.method === "sendMessage")?.body.text), "/selfie lists them");
  c = await noticeOf({ text: "/selfie remove gym" });
  eq(JSON.parse(store.get("selfies")).map((p) => p.tag), ["beach day in Sahel"], "/selfie remove");
  c = await noticeOf({ text: "/selfie make curled up on the couch with Basbousa" });
  yes(c.find((x) => x.method === "sendPhoto")?.body.caption.includes("Draft: curled up on the couch with Basbousa"), "/selfie make sends a drawn draft to pick from");
  c = await noticeOf({ text: "/selfie make naked in bed" });
  eq(c.filter((x) => x.method === "sendPhoto").length, 0, "/selfie make never draws sexual pictures");
  yes(W.isQuickCommand({ message: { photo: sizes, caption: "/selfie add x" } }), "/selfie is answered from the webhook, captions too");
  eq(JSON.parse(store.get("h:7")).at(-1).content.includes("selfie add"), false, "/selfie never enters her chat history");
  delete env.AI;
  store.delete("selfies");
  Object.assign(W.CONFIG.SELFIE, { CHANCE: 0.1, MAX_PER_DAY: 4 });
}

section("LIMITS & OOC always sent, word for word");
yes(W.SYSTEM_PROMPT.endsWith(LIMITS), "SYSTEM_PROMPT ends with the exact LIMITS & OOC text");
yes(prompts.every((p) => p.messages[0].content.includes(LIMITS)), `in every reply's prompt (${prompts.length} prompts)`);
r = await turn("lol btw i'm 16", ["wait what. ok... friends then. so how was school"], { history: APART });
yes(r.system[0].includes("If he ever says he is under 18, stop all flirting"), "under-18 rule present when he states an age");
yes(r.prompts[0].messages.filter((m) => m.role === "user").at(-1).content === "lol btw i'm 16", "his words reach the model unchanged");

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
