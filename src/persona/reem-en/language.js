// English and Arabizi speech rules for her voice notes (digits never spoken, ya3ni said yaani).
import { CONFIG } from "../../config/index.js";
import { audioTagRe, audioTagsOn, isV3 } from "../../voice/tags.js";

// The persona's language (Rebuild Step 1): what she writes in, and the scripts that can only be garbled output in it. Checks that
// depend on the language read it from here (tools/test/live.mjs), so an Arabic persona brings its own.
export const LANGUAGE = { CODE: "en", FOREIGN_SCRIPT: /[\u0590-\u08FF\u0400-\u04FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/ }; // Arabic/Persian, Hebrew, Cyrillic, CJK, Hangul
export const EMOJI = /[\p{Extended_Pictographic}\p{Emoji_Modifier}\u{FE0F}\u{200D}]/gu;
// Placeholders that hold audio tags while a line is tidied (no letters or digits, so nothing touches them)
export const TAG_MARK = /[\uE000-\uE0FF]/g;
// One line of texting -> one clean spoken sentence. Actions are never read aloud.
// With keepTags (eleven_v3), allowed audio tags stay where she put them; every other [...] goes.
export function tidySpoken(line, keepTags = false) {
  const tags = [];
  const re = keepTags && audioTagRe();
  if (re) {
    line = line.replace(re, (_, t) => {
      tags.push(`[${t.toLowerCase().replace(/\s+/g, " ")}]`);
      return ` ${String.fromCharCode(0xe000 + tags.length - 1)} `;
    });
  }
  let s = line
    .replace(/<[^>\n]*>/g, " ")
    .replace(/\*[^*\n]*\*/g, " ")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(EMOJI, "")
    .replace(/[*_`>~|<"“”]/g, "")
    .replace(/\b(?:a?ha(?:ha)+h?|lol|lmao|m{2,}|hm+)\b[.,!?]*/gi, "")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/^[,.\s]+/, "")
    .trim();
  if (!s.replace(TAG_MARK, "").trim()) return "";
  s = sayArabizi(s);
  s = s.replace(/\bi\b/g, "I");
  s = s.replace(/(^|[.!?]\s+)((?:[\uE000-\uE0FF]\s*)*)([a-z])/g, (_, a, t, b) => a + t + b.toUpperCase());
  // The full stop goes after the words, before any tags at the very end
  const [, words, tail] = s.match(/^([\s\S]*?)((?:\s*[\uE000-\uE0FF])*)$/);
  if (!/[.!?…]$/.test(words)) s = words + "." + tail;
  return s.replace(TAG_MARK, (c) => tags[c.charCodeAt(0) - 0xe000]);
}
// Numbers followed by an English ending stay numbers: 3am, 10pm, 2nd, 90s, 5k, 20min
export const ENGLISH_NUMBER = /^\d+(?:st|nd|rd|th|s|am|pm|k|m|h|hr|hrs|min|mins|sec|secs|ish|x|d|yo|ft|cm|mm|kg|km|mph|gb|mb|p)$/i;
// Arabizi for the voice only: "ya3ni" is read "yaani", never "ya three ni". VOICE.PRONUNCIATIONS
// first, then VOICE.ARABIZI_DIGITS for a number used as a letter: at the start of a word or between
// letters, always followed by a letter. Real numbers, times and "mp3"-style endings are left alone.
export function sayArabizi(s) {
  const V = CONFIG.VOICE;
  const words = V.PRONUNCIATIONS || {};
  const digits = V.ARABIZI_DIGITS || {};
  return s.replace(/[\p{L}\p{N}]+/gu, (w) => {
    const k = w.toLowerCase();
    if (Object.hasOwn(words, k) && typeof words[k] === "string") {
      const said = words[k];
      return /^\p{Lu}/u.test(w) ? said.charAt(0).toUpperCase() + said.slice(1) : said;
    }
    if (!/\d/.test(w) || !/\p{L}/u.test(w) || ENGLISH_NUMBER.test(w)) return w;
    return w.replace(/\d/g, (d, i) => {
      const letterAfter = /\p{L}/u.test(w.charAt(i + 1));
      const letterBefore = i === 0 || /\p{L}/u.test(w.charAt(i - 1));
      return letterAfter && letterBefore && Object.hasOwn(digits, d) ? digits[d] : d;
    });
  });
}
export function cutAtSentence(s, max) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  return (end > max / 2 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "") + ".").trim();
}
// What goes to ElevenLabs. Separate thoughts get a short pause between them: VOICE.PAUSE_BETWEEN_LINES,
// or "..." on eleven_v3 (it has no <break>), where allowed audio tags are also kept.
export function forSpeech(t) {
  const max = CONFIG.VOICE.MAX_CHARS;
  const v3 = isV3();
  const keepTags = audioTagsOn();
  // A line that is only a tag ("[sighs]") belongs to the line after it
  const re = keepTags && audioTagRe();
  if (re) t = t.replace(new RegExp(`^((?:[ \\t]*${re.source})+)[ \\t]*\\n+`, "gim"), "$1 ");
  const lines = t.split(/\n+/).map((l) => tidySpoken(l, keepTags)).filter(Boolean);
  const kept = [];
  let len = 0;
  for (const line of lines) {
    if (len + line.length > max) {
      if (!kept.length) kept.push(cutAtSentence(line, max));
      break;
    }
    kept.push(line);
    len += line.length + 1;
  }
  if (v3) return kept.map((l, i) => (i < kept.length - 1 ? l.replace(/([^.])\.$/, "$1...") : l)).join(" ");
  return kept.join(` <break time="${CONFIG.VOICE.PAUSE_BETWEEN_LINES}" /> `);
}
