// shapeReply: the reply's format fixed in code (texts, scenes, voice notes, OOC, leaks, repeats, reactions).
import { CONFIG } from "../config/index.js";
import { forSpeech } from "../persona/index.js";
import { wordsOf } from "../pictures/shots.js";
import { escapeRegex } from "../platform/http.js";
import { plain } from "../platform/telegram.js";
import { audioTagsOn, isAudioTag, markScene, stageToTags, stripAudioTags } from "../voice/tags.js";

/* ================================================================== */
/*  End of settings                                                     */
/* ================================================================== */

// [voice], [Voice note], (voice note), a line starting "Voice note:" or "voice]" (its "[" lost, seen live) all mark a voice note
export const VOICE_TAG_SRC = String.raw`\[\s*voice\b[^\]\n]*\][ \t]*:?|^[ \t]*voice[ \t]*\][ \t]*:?|\(\s*voice(?:\s+(?:note|message|memo))?\s*\)[ \t]*:?|^[ \t]*voice(?:[ \t]+(?:note|message|memo))?[ \t]*:`;
export const VOICE_TAG = new RegExp(VOICE_TAG_SRC, "im");
export const VOICE_TAG_ALL = new RegExp(`(?:${VOICE_TAG_SRC})\\s*`, "gim");
export const REACT_TAG = /\[\s*react(?:ed|ion)?\b\s*:?\s*([^\]\n]{0,16})\]\s*/gi;
// [selfie: mirror selfie], [photo: ...], [pic: ...]: she sends a picture of herself (CONFIG.PICTURE)
// (DeepSeek often describes the whole picture inside it, so it may be long)
export const SELFIE_TAG = /\[\s*(?:selfie|photo|pic|picture|image)s?\b\s*:?\s*([^\]\n]{0,400})\]/gi;
// "*sends a selfie*": the model narrating what it could simply do
export const SENDS_SELFIE = /\bsends?\s+(?:you\s+|him\s+)?(?:a\s+|another\s+|her\s+)?(?:quick\s+|mirror\s+)?(?:selfie|pic|picture|photo)\b/i;
export const ACTION = /\*[^*\n]+\*/;
// Removes name prefixes, headings and bracket tags copied from the chat log
export function clean(t) {
  const names = CONFIG.CHARACTER.NAME_PREFIXES.map(escapeRegex).join("|");
  if (names) t = t.replace(new RegExp(`^[ \\t]*(${names})[ \\t]*:[ \\t]*`, "gim"), "");
  return t
    // a whole line in [brackets], however long, is never for him (a narrated paragraph, live 2026-10-05)
    .replace(/^[ \t]*\[[^\]\n]{61,}\][ \t]*$/gm, (m) => (isAudioTag(m) ? m : ""))
    .replace(/^[ \t]*\[[^\]\n]{1,60}\][ \t]*/gm, (m) => (isAudioTag(m) ? m : ""))
    // a "[" opening a line that never closes is a stray bracket: keep the words (Mistral Nemo, live 2026-10-05)
    .replace(/^([ \t]*)\[(?![^\]\n]*\])/gm, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*{2,}/g, "*")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
// The model's reply without the [voice] tag, cleaned
export function bodyOf(raw) {
  return clean(String(raw).replace(VOICE_TAG_ALL, ""));
}
// Takes [react: X] out of a reply. `emoji` is what Telegram accepts (REACTIONS.ALIASES applied), or ""
export function takeReaction(raw) {
  let found = "";
  const rest = String(raw).replace(REACT_TAG, (_, e) => {
    if (!found) found = e.trim();
    return "";
  });
  return { emoji: reactionEmoji(found), rest };
}
// Takes [selfie: what it shows] out of a reply. `want` is null when she sends no picture, "" when she
// only narrates sending one ("*sends a selfie*", which texting() drops anyway)
export function takeSelfie(raw) {
  let want = null;
  // Long descriptions are cut at a word, never mid-word ("a hint of a s")
  // "[sends: selfie, ...]" (seen live 2026-10-03): the "sends:" label comes off
  const cut = (w) => { w = w.trim().replace(/^(?:she\s+)?sends?\s*:\s*/i, ""); return w.length <= 240 ? w : w.slice(0, 240).replace(/[,;\s]+\S*$/, ""); };
  let rest = String(raw).replace(SELFIE_TAG, (_, w) => {
    if (want == null) want = cut(w);
    return "";
  });
  // Seen live 2026-10-02: the picture described in brackets without "selfie:" ("[sitting up in bed, hair
  // messy, ...]", "[texts with a mirror selfie — low light, ...]"): a whole line in brackets that long is it
  // ...or as a plain line "selfie: mirror, black lace..." (seen live: spoken in a voice note)
  if (want == null) {
    rest = rest.replace(/^[ \t]*(?:selfie|photo|pic|picture)[ \t]*:[ \t]*([^\n]{3,400})$/im, (line, w) => {
      want = cut(w);
      return "";
    });
  }
  if (want == null) {
    rest = rest.replace(/^[ \t]*\[([^\]\n]{12,400})\][ \t]*$/m, (line, w) => {
      if (wordsOf(w).length < 4 || /^\s*(?:voice|react)/i.test(w)) return line;
      // a pause or typing beat is not a picture ("[stays quiet for a moment, then types again]", live 2026-10-03)
      if (/\b(?:types?|typing|typed|texts? again|pauses?|stays? quiet|silence|deletes?|read receipt)\b/i.test(w) && !/\b(?:selfie|photo|pic|picture|mirror|wearing)\b/i.test(w)) return line;
      // a one-word label before the picture ("[slept: hair up loose, ...]", live 2026-10-05) comes off
      want = cut(w.replace(/^\s*[a-z]+\s*:\s*/i, ""));
      return "";
    });
  }
  if (want == null && /\*[^*\n]*\*/.test(rest) && [...rest.matchAll(/\*([^*\n]+)\*/g)].some((m) => SENDS_SELFIE.test(m[1]))) want = "";
  return { want, rest };
}
export function reactionEmoji(e) {
  const R = CONFIG.REACTIONS;
  const allowed = R.ALLOWED || [];
  const aliases = R.ALIASES || {};
  const alias = (x) => (Object.hasOwn(aliases, x) ? aliases[x] : x);
  if (!e) return "";
  let x = alias(e);
  if (!allowed.includes(x)) x = alias(x.replace(/\uFE0F/g, ""));
  return allowed.includes(x) ? x : "";
}
// A line reduced to its words, so "Wait... you're HOME?" and "wait you're home" count as the same
export function lineKey(line) {
  return plain(stripAudioTags(line))
    .replace(VOICE_TAG_ALL, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
// Drops every line she already sent, in this reply or in her last few replies.
// Short lines like "lol" or "ok but" may come back in later replies, just not twice in one.
// The style examples in her prompt (indented lines after "Example:"/"Examples, ..."): Mistral Nemo sent them word
// for word ("you're awake, no? your floor says you are", the in-person example scene; live 2026-10-06)
export let examples = null;
export function exampleKeys() {
  const prompt = CONFIG.PERSONA.SYSTEM_PROMPT;
  if (examples && examples.prompt === prompt) return examples.keys;
  const keys = [];
  let inside = false;
  for (const line of prompt.split("\n")) {
    if (/^- Examples?\b.*:\s*$/.test(line)) inside = true;
    else if (inside && /^ {2}\S/.test(line)) keys.push(lineKey(line));
    else if (line.trim()) inside = false;
  }
  examples = { prompt, keys: keys.filter(Boolean) };
  return examples.keys;
}
// A line copied from a style example: the same words, or any run of COPY_WORDS words in a row from one.
// Nothing is cut (that left a door scene without its narration, DeepSeek 2026-10-06): think() asks once more.
export const copiesAny = (t) => String(t).split("\n").some((line) => copiesExample(lineKey(line)));
export function copiesExample(k) {
  const n = Number(CONFIG.TEXTING.COPY_WORDS) || 0;
  if (!k || !n) return false;
  const words = k.split(" ");
  return exampleKeys().some((e) => {
    if (e === k) return true;
    if (words.length < n) return false;
    for (let i = 0; i + n <= words.length; i++) if (` ${e} `.includes(` ${words.slice(i, i + n).join(" ")} `)) return true;
    return false;
  });
}
export function dropRepeats(body, history) {
  const said = new Set();
  for (const m of history.filter((x) => x.role === "assistant").slice(-CONFIG.TEXTING.REPEAT_LOOKBACK)) {
    for (const line of String(m.content).split("\n")) {
      const k = lineKey(line);
      if (k.split(" ").length >= CONFIG.TEXTING.REPEAT_MIN_WORDS) said.add(k);
    }
  }
  const paras = [];
  for (const para of body.split(/\n\s*\n/)) {
    const lines = [];
    for (const line of para.split("\n")) {
      const k = lineKey(line);
      if (k && said.has(k)) continue;
      if (k) said.add(k);
      lines.push(line);
    }
    const p = lines.join("\n").trim();
    if (p) paras.push(p);
  }
  return paras.join("\n\n");
}
export function splitBubbles(t) {
  const parts = t.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts.slice(0, CONFIG.TEXTING.MAX_BUBBLES) : [t];
}
/* ------------------------------------------------------------------ */
/*  Reply format, enforced in code                                     */
/*                                                                     */
/*  The model knows the rules but slips (DeepSeek less than Lunaris):  */
/*  it narrates itself recording a voice note, puts *actions* in texts,*/
/*  writes his next line, leaks chat tokens or "(OOC: ...)" notes.     */
/*  shapeReply() turns whatever it wrote into exactly one of: texts,   */
/*  a voice note (with any words she typed before it), or a scene.     */
/* ------------------------------------------------------------------ */

// He's talking out of character: "OOC: ...", "(ooc) ...", "[OOC] ..."
export const isOoc = (t) => /(?:^|\n)[ \t]*[(\[]?[ \t]*ooc\b[ \t]*[:)\]-]/i.test(String(t || ""));
// An in-person scene: *actions*, or her words in quotes ("Come here.")
export const inPerson = (t) => ACTION.test(t) || /^\s*["“][^\n]*["”]/.test(String(t));
export const listRe = (list) => (list || []).map((w) => escapeRegex(String(w).trim())).filter(Boolean).map((w) => w.replace(/\s+/g, "\\s+")).join("|");
// What only the model's training leaks: Llama 3 chat tokens, character-card placeholders, his next
// line written for him, and "(OOC: ...)" or "(Note: ...)" asides he never asked for
export function scrubModel(t, { ooc = false } = {}) {
  const C = CONFIG.CHARACTER;
  t = String(t).replace(/^\s*(?:<\|start_header_id\|>\s*)?assistant\s*(?:<\|end_header_id\|>)?[ \t]*\n/i, "");
  const stop = t.search(/<\|(?:eot_id|end_of_text|start_header_id|eom_id|im_end|im_start)\|>/i);
  if (stop >= 0) t = t.slice(0, stop);
  t = t.replace(/<\|[a-z_]+\|>/gi, "");
  const him = listRe([C.USER_LABEL, "user", "human", "him"]);
  const cut = t.search(new RegExp(`^[ \\t*]*(?:\\{\\{\\s*user\\s*\\}\\}|${him})[ \\t*]*:`, "im"));
  if (cut >= 0) t = t.slice(0, cut);
  t = t.replace(/\{\{\s*char\s*\}\}/gi, C.NAME).replace(/\{\{\s*user\s*\}\}/gi, "you");
  // Two versions offered ("(or)", "Alternatively:", "---" on a line of its own): only the first is kept
  const alt = t.search(/\n[ \t]*(?:\(\s*or\s*\)|\[\s*or\s*\]|alternatively\b[,:]?|option\s*\d+\s*:|-{3,})[ \t]*(?=\n|$)|\n[ \t]*OR:?[ \t]*(?=\n|$)/i);
  if (alt > 0 && /\p{L}/u.test(t.slice(0, alt))) t = t.slice(0, alt);
  // She calls him habibi: "habibti" is what you call a woman (Nemo echoed his "habibti" back: "hey habibti", live
  // 2026-10-06). Only where she says it to him ("hey habibti", "Habibti, ...", "..., habibti."); talking about the
  // word stays ("habibi, not habibti", "I'm not anyone's habibti", "calling me habibti": DeepSeek, same day)
  t = t.replace(/\b((?:hey+|hi|hello|morning|night|goodnight|ok|okay|yalla|bye|ya|aw+|mm+)\b,?\s+)([h7])abibti\b(?!["”'’])/gi, (_, a, h) => `${a}${h}abibi`)
    .replace(/(^|[.!?…]\s+|["“])([h7])abibti(?=,)/gim, (_, a, h) => `${a}${h}abibi`)
    .replace(/(,\s*)([h7])abibti(?=[.!?…]*["”]?\s*$)/gim, (_, a, h) => `${a}${h}abibi`);
  if (!ooc) {
    const aside = String.raw`(?:ooc|note|author'?s\s+note|a\/n)\s*:`;
    t = t
      .replace(new RegExp(String.raw`\(\(?\s*${aside}[^)]*\)\)?|\[\s*${aside}[^\]]*\]`, "gi"), "")
      .replace(/\(\([^)\n]*\)\)/g, "")
      .replace(new RegExp(String.raw`^[ \t]*${aside}.*$`, "gim"), "");
  }
  return t.trim();
}
// **bold** means nothing in a text and would otherwise turn into an *action*
export const unbold = (t) => String(t).replace(/\*\*([^*\n]+)\*\*/g, "$1");
// *laughs* or (laughs) in a voice note becomes the [laughs] tag the voice performs (allowed tags only)
export function emotesToTags(t) {
  const names = listRe(CONFIG.VOICE.ALLOWED_TAGS);
  if (!names) return t;
  return t.replace(new RegExp(`\\*\\s*(${names})\\s*\\*|\\(\\s*(${names})\\s*\\)`, "gi"), (_, a, b) => `[${(a || b).toLowerCase().replace(/\s+/g, " ")}]`);
}
// A line that describes her instead of being something she types or says: only *actions* or
// "(she ...)" asides, or a stage direction like "Reem records a voice note:" / "She hits send."
export function isNarration(line) {
  const s = line.trim();
  if (!s) return false;
  const names = listRe([...CONFIG.CHARACTER.NAME_PREFIXES, CONFIG.CHARACTER.NAME, "she"]);
  const words = s.replace(/\*[^*\n]*\*/g, "").replace(new RegExp(`\\((?:${names})\\b[^)]*\\)`, "gi"), "");
  if (words !== s && !/[\p{L}\p{N}]/u.test(words)) return true;
  const cues = listRe(CONFIG.TEXTING.NARRATION_CUES);
  return new RegExp(`^\\W*(?:${names})\\s+\\w+s\\b`, "i").test(s) && (/:\W*$/.test(s) || (!!cues && new RegExp(`\\b(?:${cues})`, "i").test(s)));
}
// *word* inside a sentence is emphasis ("i'm *not* jealous") and stays as a plain word; any other
// *action*, an emote like *sighs* or (laughs), or a "(she ...)" aside is dropped (and noted in `fix`)
export function dropActions(line, fix = {}) {
  const emotes = listRe([...(CONFIG.TEXTING.EMOTES || []), ...(CONFIG.VOICE.ALLOWED_TAGS || [])]);
  const names = listRe([...CONFIG.CHARACTER.NAME_PREFIXES, CONFIG.CHARACTER.NAME, "she", "her"]);
  return line
    .replace(/\*([^*\n]+)\*/g, (m, x, i, all) => {
      const before = all.slice(0, i).replace(/\*[^*\n]*\*/g, "");
      const after = all.slice(i + m.length).replace(/\*[^*\n]*\*/g, "");
      const isEmote = !!emotes && new RegExp(`^\\s*(?:${emotes})\\s*$`, "i").test(x);
      const emphasis = /\p{L}/u.test(before) && /\p{L}/u.test(after) && x.trim().split(/\s+/).length <= 2 && !isEmote;
      if (!emphasis) fix.actions = true;
      return emphasis ? x : " ";
    })
    .replace(new RegExp(`\\((?:${names})\\b[^)]*\\)${emotes ? `|\\(\\s*(?:${emotes})\\s*\\)` : ""}`, "gi"), () => {
      fix.actions = true;
      return " ";
    })
    .replace(/[ \t]{2,}/g, " ")
    .replace(/^[ \t,;]+|[ \t]+$/g, "")
    .replace(/[ \t]+([,.!?])/g, "$1");
}
// "hey you" -> hey you: a whole text bubble or voice note wrapped in quotes
export const unquote = (p) => p.replace(/^["“]([^"“”\n]+)["”]$/, "$1");
// Stage cues in square brackets anywhere in a line ("[clears throat]", "[laughs softly]") and empty
// "()": a text or a scene never shows them; a voice note keeps only the allowed audio tags
export function dropCues(t, keepTags = false) {
  return String(t)
    .replace(/[ \t]*\[(?!\s*(?:voice|react))[^\]\n]{1,60}\][ \t]*/gi, (m) => (keepTags && isAudioTag(m) ? m : " "))
    .replace(/\(\s*\)/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([,.!?])/g, "$1")
    .replace(/^[ \t]+|[ \t]+$/gm, "");
}
// Texting (and voice notes): only what she types or says. Narration lines, *actions*, stage cues and,
// with `story` on, story sentences ("Reem raises an eyebrow", "her voice drops") are cut; `fix` notes
// which were found. keepTags: allowed audio tags stay (voice notes).
export function texting(t, { keepTags = false, story = true, fix = {} } = {}) {
  const all = String(t).split("\n");
  const kept = all.filter((l) => !isNarration(l));
  if (kept.length < all.length) fix.narration = true;
  let s = dropCues(kept.map((l) => dropActions(l, fix)).join("\n"), keepTags);
  if (story && looksNarrated(s)) {
    const cut = unnarrate(s);
    if (cut !== s) fix.narration = true;
    s = cut;
  }
  return s
    .replace(/\n{3,}/g, "\n\n")
    .split(/\n\s*\n/)
    .map((p) => unquote(p.trim()))
    .filter((p) => /[\p{L}\p{N}\p{Extended_Pictographic}]/u.test(p))
    .join("\n\n")
    .trim();
}
// Words left once *actions* and "quoted dialogue" are taken out: a text, not a scene
export const hasUnquotedText = (t) => /[\p{L}\p{Extended_Pictographic}]/u.test(String(t).replace(/\*[^*\n]*\*/g, "").replace(/["“][^"“”]*["”]/g, ""));
// In person, words with no *action* and no quotes are what she says out loud
// A paragraph that narrates her in third person ("She lets the pause hang...") is narration, not her words
// (seen live 2026-10-02: quoted, so her voice clip read the narration out loud)
export const asDialogue = (t) =>
  t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    .map((p) => (/["“”]/.test(p) ? p : /^\W*(?:She|Her)\b(?!['’])/.test(p) || (herNames() && new RegExp(`^\\W*${herNames().source}`, "iu").test(p)) ? `*${p}*` : `"${p}"`)).join("\n\n");
// May she choose a voice note herself (VOICE.SELF_CHOICE_GAP): none in her last few replies
export function mayChooseVoice(history = []) {
  const n = Number(CONFIG.VOICE.SELF_CHOICE_GAP) || 0;
  if (!n) return true;
  const hers = history.filter((m) => m.role === "assistant").slice(-n);
  return !hers.some((m) => (m.parts && m.parts.length ? m.parts.some((p) => /^\s*\[voice\]/i.test(p.text || "")) : /^\s*\[voice\]/im.test(m.content || "")));
}
/**
 * The model's raw reply -> what is delivered and saved.
 *   scene     "apart" or "together" (sceneOf); ooc: he wrote OOC; canReact: a [react: X] may be used;
 *             canSelfie: a [selfie: ...] may be used (picturesAllowed)
 *   mode      "text", "voice" or "scene" (replyMode): when it's "voice", the reply is a voice note
 *             even without [voice]
 *   heard     what he sent (his *actions* mean she must answer in person)
 *   lastResort  a reply that only narrates is sent as a scene instead of nothing
 * Returns { kind: "text" | "voice" | "scene" | "none", texts (messages to send, in order; for a voice
 * note, words she typed before it), voiceText (the note, no tags), spoken (for ElevenLabs), stored
 * (for history), reaction, repeated (every line was already said, by her or just now by him), copied (a line
 * copies a style example of her prompt: think() asks once more), narrationOnly, repaired (narration
 * or acting had to be cut from her words: think() asks once more), selfie (null, or what the picture
 * of her should show, "" = any; only with canSelfie, while apart and not OOC) }
 */
// In a scene he is "you": narration that calls him "him"/"his" ("squints at him", "the hem of his shirt", live
// 2026-10-04/05) is turned to "you"/"your". Her quoted words are never touched, nor a sentence that names another
// man or says "he" (it may be about someone else).
export const OTHER_MAN = /\b(?:he|father|dad|hayrig|dikran|thiago|sevag|garo|vatche|fadi|brother|uncle|cousin|man|guy|boy|landlord|roofer|tiler|client|baby)\b/i;
export function toYou(body) {
  return String(body).split(/(["“][^"”\n]*["”])/).map((part, i) => (i % 2 ? part : part.replace(/[^.!?*\n]+[.!?]*/g, (sentence) =>
    OTHER_MAN.test(sentence) ? sentence : sentence.replace(/\b(him|his|himself)\b/gi, (w) => {
      const to = { him: "you", his: "your", himself: "yourself" }[w.toLowerCase()];
      return w[0] === w[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to;
    })))).join("");
}
export const ON_PHONE = /\b(?:phone|screen|reads?|reading|texts?|texting|types?|typing|message|messages)\b/i;
export const GOES_OVER = /\b(?:door|doorframe|knocks?|knocking|landing|hallway|stairs|across the hall|comes over|goes over|walks over|crosses)\b/i;
// She herself goes to him (a scene she starts while apart). Live 2026-10-05 (run 37339438191): "Then his knock: two quick
// raps" and her leaning on her own doorframe while he only texted were sent as scenes: he never came over
export const HER_MOVE = /\b(?:crosses|crossing|walks over|goes over|comes over|heads? (?:over|across)|across the (?:hall|landing)|(?:at|on|to) your door|(?:she|reem) knocks|knocks (?:on|at) (?:your|his)|before you (?:can )?knock)\b/i;
export function shapeReply(raw, { scene = "apart", mode = "text", ooc = false, canReact = false, canSelfie = false, history = [], heard = "", lastResort = false } = {}) {
  const { emoji, rest: unreacted } = takeReaction(scrubModel(raw, { ooc }));
  let { want, rest } = takeSelfie(unreacted);
  const out = { kind: "none", texts: [], voiceText: "", spoken: "", stored: "", reaction: canReact && !ooc && scene !== "together" ? emoji : "", selfie: canSelfie && !ooc && scene !== "together" ? want : null, repeated: false, narrationOnly: false, repaired: false, copied: false };
  // Never the same line twice: not within this reply, not from her last few replies.
  // Only if every line is an old one does she resend it (think() already tried for a new reply).
  // His own words sent back to him ("what time is it there? what are you up to" as her first bubble, DeepSeek 2026-10-06)
  const said = heard ? [...history, { role: "assistant", content: heard }] : history;
  const fresh = (t) => {
    if (!t) return t;
    const kept = dropRepeats(t, said);
    if (kept) return kept;
    out.repeated = true;
    return dropRepeats(t, []);
  };
  // texts never keep a lone * (no pair: not emphasis, not an *action*; live run 37548268082: "*habibi. you can't...")
  const lone = (t) => String(t).split("\n").map((l) => ((l.match(/\*/g) || []).length === 1 ? l.replace("*", "") : l)).join("\n");
  const as = (kind, body, texts) => kind === "text"
    ? Object.assign(out, { kind, texts: texts.map(lone), stored: lone(body), copied: copiesAny(body) })
    : Object.assign(out, { kind, texts, stored: body, copied: copiesAny(body) });
  // In person, sent as one message: *actions* in italics, her words in quotes
  const asScene = (body) => {
    const scened = fresh(markScene(toYou(dropCues(body))));
    return scened ? as("scene", scened, [scened]) : out;
  };

  // OOC: plain words from the writer, one message, nothing performed. A reply that is only acting
  // (*actions* and "dialogue") is asked again; as a last resort its quoted words go as the plain answer
  // ("*She raises a brow.* \"Understood. I'll keep it tight.\"", live 2026-10-05), else the scene it is.
  if (ooc) {
    const body = stripAudioTags(bodyOf(rest));
    if (!body) return out;
    if (ACTION.test(body) && !hasUnquotedText(body)) {
      out.repaired = true;
      if (!lastResort) return out;
      const said = [...body.replace(/\*[^*\n]*\*/g, " ").matchAll(/["“]([^"”\n]+)["”]/g)].map((m) => m[1].trim()).filter(Boolean).join(" ");
      return said ? as("text", said, [said]) : asScene(body);
    }
    const fix = {};
    const words = fresh(texting(body, { story: false, fix }));
    out.repaired = !!(fix.narration || fix.actions);
    return words ? as("text", words, [words]) : out;
  }

  // Together: always a scene, sent as one message. Never a voice note, never tags.
  if (scene === "together") {
    let body = dropCues(stripAudioTags(bodyOf(rest)));
    if (!body) return out;
    if (!inPerson(body) && ACTION.test(heard)) body = asDialogue(body); // he's right there: she says it
    // *actions* but her words left bare ("You're due, you know." between two *actions*, DeepSeek 2026-10-06): quoted
    else if (ACTION.test(body) && !/["“”]/.test(body)) body = body.split(/\n\s*\n/).map((p) => (/\*/.test(p) ? p : asDialogue(p))).join("\n\n");
    body = fresh(markScene(toYou(body)));
    if (!body) return out;
    return inPerson(body) ? as("scene", body, [body]) : as("text", body, splitBubbles(body));
  }

  // Apart, voice note (asked for by the code, or she started with [voice]): anything before [voice]
  // that narrates her (picking up the phone, recording) is dropped; words she typed before it go out
  // as texts first. *laughs* and stage directions ("laughs softly Just...") become audio tags.
  let at = rest.search(VOICE_TAG);
  if (at >= 0 && mode !== "voice" && !mayChooseVoice(history)) {
    // She picked a voice note herself, but she sent one a moment ago: this one is a text
    rest = rest.replace(new RegExp(VOICE_TAG_SRC, "gim"), "").trim();
    at = -1;
  }
  const from = at >= 0 ? at : mode === "voice" ? 0 : -1;
  if (from >= 0) {
    const typed = from > 0 ? fresh(texting(stripAudioTags(bodyOf(unbold(rest.slice(0, from)))))) : "";
    let note = rest.slice(from);
    if (audioTagsOn()) note = emotesToTags(note);
    const fix = {};
    const tagged = fresh(texting(stageToTags(bodyOf(unbold(note))), { keepTags: audioTagsOn(), fix }));
    out.repaired = !!(fix.narration || fix.actions);
    const spoken = tagged ? forSpeech(tagged) : "";
    if (spoken) {
      const voiceText = stripAudioTags(tagged);
      Object.assign(out, { voiceText, spoken });
      return as("voice", [typed, `[voice] ${voiceText}`].filter(Boolean).join("\n\n"), typed ? splitBubbles(typed) : []);
    }
    // Nothing to say out loud: whatever she typed is a text
    const body = [typed, stripAudioTags(tagged || "")].filter(Boolean).join("\n\n");
    if (body) return as("text", body, splitBubbles(body));
    return lastResort && !typed && ACTION.test(rest) ? asScene(stripAudioTags(bodyOf(rest))) : out;
  }

  // Apart, text
  const body = stripAudioTags(bodyOf(unbold(rest)));
  if (!body) return out;
  if (ACTION.test(body) && !hasUnquotedText(body)) {
    // Only *actions* and "dialogue": she goes over to him and a scene starts. Narration with no
    // words at all is her describing herself on the phone; think() asks again for real words.
    if (!/["“]/.test(body) && !lastResort) return Object.assign(out, { narrationOnly: true });
    // ...unless the narration has her on her phone and not at his door ("sets the phone face-down and goes
    // back to the receipt", live 2026-10-05): then her quoted words are the texts
    const acts = [...body.matchAll(/\*([^*\n]+)\*/g)].map((m) => m[1]).join(" ");
    const quoted = () => {
      const said = [...body.replace(/\*[^*\n]*\*/g, "\n").matchAll(/["“]([^"”\n]+)["”]/g)].map((m) => m[1].trim()).filter(Boolean).join("\n\n");
      return said && fresh(texting(said));
    };
    // She was told to go to him (mode "visit"): the scene is her going, however she walks in ("turns the handle and steps
    // in", live 2026-10-06, run 37517733148: 2 of 8 lost their narration and went out as texts saying "So I came")
    if (mode === "visit") return asScene(body);
    if (ON_PHONE.test(acts) && !GOES_OVER.test(acts)) {
      const text = quoted();
      if (text) { out.repaired = true; return as("text", text, splitBubbles(text)); }
    }
    // ...and a scene only when she goes to him: otherwise she's asked again, and at last her quoted words are the texts
    if (!HER_MOVE.test(acts)) {
      if (!lastResort) return Object.assign(out, { narrationOnly: true });
      const text = quoted();
      if (text) { out.repaired = true; return as("text", text, splitBubbles(text)); }
    }
    return asScene(body);
  }
  const fix = {};
  const text = fresh(texting(stageToTags(body), { fix }));
  out.repaired = !!(fix.narration || fix.actions);
  if (text) return as("text", text, splitBubbles(text));
  // Everything was narration: think() asks again; as a last resort it's sent as a scene
  return lastResort ? asScene(body) : out;
}
/* ------------------------------------------------------------------ */
/*  Repairs: what the model wrote, in the shape of the reply it should be */
/* ------------------------------------------------------------------ */

export function herNames() {
  const names = CONFIG.CHARACTER.NAME_PREFIXES.map(escapeRegex).join("|");
  return names ? new RegExp(`(?<!\\p{L})(?:${names})(?!\\p{L})`, "iu") : null;
}
export function narrationRe() {
  try {
    return CONFIG.TEXTING.NARRATION ? new RegExp(CONFIG.TEXTING.NARRATION, "im") : null;
  } catch (e) {
    console.error("TEXTING.NARRATION is not a valid regular expression", e);
    return null;
  }
}
// Reads like a story rather than something she typed or said
export function looksNarrated(t) {
  t = String(t);
  if (ACTION.test(t)) return true;
  const names = herNames();
  if (names && names.test(t)) return true;
  const re = narrationRe();
  if (re && re.test(t)) return true;
  // a speech tag after her quoted words: "Four in the morning," she repeats (DeepSeek, live 2026-10-06)
  if (/["”],?\s+(?:she|reem)\s+[a-z]+s\b/i.test(t)) return true;
  return (t.match(/(?:^|[.!?…]\s+)(?:She|Her)\b(?!['’])/gm) || []).length >= 2;
}
export function isNarrationSentence(s) {
  const names = herNames();
  const re = narrationRe();
  return ACTION.test(s) || (names && names.test(s)) || (re && re.test(s)) || /^(?:She|Her)\b(?!['’])/.test(s);
}
// "Mrs. Kalajian" stays one sentence
export const ABBREVIATION = /\b(Mrs|Mr|Ms|Dr|St|vs)\./g;
export function sentencesOf(p) {
  return (p.replace(ABBREVIATION, "$1").match(/[^.!?…]+(?:[.!?…]+["”’)\]]*|$)/g) || [])
    .map((s) => s.replace(//g, ".").trim())
    .filter(Boolean);
}
// What she actually says: the "quoted" words if there are any, otherwise every sentence that isn't narration
export function unnarrate(t) {
  const quotes = [...String(t).matchAll(/["“]([^"“”\n]+)["”]/g)].map((m) => m[1].trim()).filter((q) => /\p{L}/u.test(q));
  if (quotes.length) return quotes.join("\n\n");
  return String(t)
    .split(/\n\s*\n/)
    .map((para) =>
      sentencesOf(para.replace(/\*[^*\n]*\*/g, " "))
        .filter((s) => !isNarrationSentence(s))
        .join(" ")
        .replace(/\s{2,}/g, " ")
        .trim())
    .filter(Boolean)
    .join("\n\n");
}
