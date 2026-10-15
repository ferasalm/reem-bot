// Audio tags ([laughs], [whispers]) for eleven_v3 and the scene clips.
import { ACTION, looksNarrated } from "../chat/shape.js";
import { CONFIG } from "../config/index.js";
import { escapeRegex } from "../platform/http.js";

// "laughs softly Just imagine..." -> "[laughs] Just imagine..." (VOICE.STAGE_DIRECTIONS). Only where a
// direction starts a line or sentence and runs, in lowercase, up to the next capitalized word.
export function stageToTags(t) {
  const map = CONFIG.VOICE.STAGE_DIRECTIONS || {};
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  if (!keys.length) return t;
  const alt = keys
    .map((k) => escapeRegex(k).replace(/\s+/g, "\\s+").replace(/^\p{L}/u, (c) => `[${c.toLowerCase()}${c.toUpperCase()}]`))
    .join("|");
  const re = new RegExp(`(^|[.!?…]["”]?[ \\t]+)((?:${alt})(?![\\p{L}])[^A-Z\\n"“\\[*]{0,200}?)(?=[ \\t]+["“]?[A-Z])`, "gmu");
  return String(t)
    .replace(re, (_, lead, dir) => {
      const key = keys.find((k) => new RegExp(`^${escapeRegex(k).replace(/\s+/g, "\\s+")}(?![\\p{L}])`, "iu").test(dir));
      const tag = key ? map[key] : "";
      return lead + (tag ? `[${tag}] ` : "");
    })
    .replace(/[ \t]{2,}/g, " ")
    .replace(/^[ \t]+/gm, "");
}
// Scene narration in *italics*, dialogue in "quotes", whatever the model did with the asterisks.
// Line by line, so every *action* stays on one line. When she used *actions* but no quotes, her
// markup is kept as it is: the words outside the asterisks are what she says.
export function markScene(t) {
  if (!/["“]/.test(t) && (ACTION.test(t) || !looksNarrated(t))) return t;
  return String(t)
    .split("\n")
    .map((line) => {
      let p = line.replace(/\*/g, "").trim();
      if (!p) return "";
      if ((p.match(/["“”]/g) || []).length % 2) p += '"';
      return p
        .split(/(["“][^"“”]*["”])/)
        .map((seg) => {
          if (/^["“]/.test(seg)) return seg;
          const s = seg.trim().replace(/^[,;:]\s*/, "");
          return /\p{L}/u.test(s) ? `*${s}*` : s;
        })
        .filter(Boolean)
        .join(" ");
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
// Audio tags (VOICE.ALLOWED_TAGS, eleven_v3 only): [laughs], [whispers]...
export const isV3 = () => /^eleven_v3/.test(String(CONFIG.VOICE.MODEL));
export const audioTagsOn = () => isV3() && !!CONFIG.VOICE.AUDIO_TAGS && (CONFIG.VOICE.ALLOWED_TAGS || []).length > 0;
// The tags she's offered: only those her current voice performs. An OpenRouter or aura voice drops a tag with no
// cue (VOICE.OR_CUES / AURA_CUES), and tags with the same cue are offered once (Sulafat: [laughs] [whispers] [sighs])
export function offeredTags() {
  const V = CONFIG.VOICE;
  const all = V.ALLOWED_TAGS || [];
  const cues = V.PROVIDER === "openrouter" ? V.OR_CUES : V.PROVIDER === "aura" ? V.AURA_CUES : null;
  if (!cues) return all;
  const seen = new Set();
  const kept = all.filter((t) => {
    const cue = String(cues[String(t).toLowerCase()] || "").trim();
    if (!cue || seen.has(cue)) return false;
    seen.add(cue);
    return true;
  });
  return kept.length ? kept : all;
}
export function audioTagRe() {
  const names = (CONFIG.VOICE.ALLOWED_TAGS || [])
    .map((t) => String(t).trim().toLowerCase())
    .filter(Boolean)
    .map((t) => escapeRegex(t).replace(/\s+/g, "\\s+"));
  return names.length ? new RegExp(`\\[\\s*(${names.join("|")})\\s*\\]`, "gi") : null;
}
export const isAudioTag = (s) => {
  const re = audioTagRe();
  return !!re && s.trim().replace(re, "") === "";
};
// Texts never show audio tags, whatever the model
export function stripAudioTags(t) {
  const re = audioTagRe();
  if (!re) return t;
  return t
    .replace(new RegExp(`[ \\t]*${re.source}`, "gi"), "")
    .replace(/^[ \t]+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
