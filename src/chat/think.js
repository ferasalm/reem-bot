// The prompt for a reply: system prompt, nudges, the chat fitted to the context.
import { aboutHim } from "./commands.js";
import { planNow, scheduleNow } from "./day.js";
import { saidBefore } from "./memory.js";
import { REACT_TAG, SELFIE_TAG, shapeReply, VOICE_TAG_ALL } from "./shape.js";
import { CONFIG, fill } from "../config/index.js";
import { can } from "../gate.js";
import { shotVars, tierShots } from "../pictures/shots.js";
import { callModel } from "../platform/ai.js";
import { audioTagsOn, offeredTags } from "../voice/tags.js";

// mode: "text", "voice" or "scene" (from replyMode). The format reminder for that mode goes after
// the chat, right before she writes, where the model pays the most attention.
export async function think(env, history, notes, userText, { mode = "text", scene, offerReaction = false, canReact = false, ooc = false, settings = {}, picture = null, canPicture = false, recentPictures = [], recall = "", day = {} }) {
  const C = CONFIG.CHARACTER;
  const N = CONFIG.NUDGES;
  const P = CONFIG.PERSONA;
  const L = CONFIG.LLM;
  const now = new Date().toLocaleString(C.CLOCK_LOCALE, { timeZone: C.TIMEZONE, weekday: "long", hour: "2-digit", minute: "2-digit" });
  const slot = scheduleNow();
  const about = aboutHim(settings);
  const apart = scene !== "together";
  let extra = "";
  if (notes) extra += fill(N.MEMORY_NOTES, { notes });
  if (recall && !ooc) extra += recall;
  if (about) extra += fill(N.ABOUT_HIM, { about });
  extra += fill(N.TIME, { time: now, city: C.CITY, doing: planNow(day.plan) || (slot && slot.doing) || "going about your day" });
  if (day.weather) extra += fill(CONFIG.DAY.WEATHER_NUDGE, { weather: day.weather });
  if (scene) extra += fill(apart ? N.APART : N.TOGETHER);

  const recent = history
    .filter((m) => m.role === "assistant" && !m.ooc)
    .slice(-CONFIG.TEXTING.OPENING_LOOKBACK)
    .map((m) => opening(m.content))
    .filter(Boolean);

  if (ooc) {
    // He's talking to the writer: no voice, reactions or random nudges
    extra += fill(N.OOC);
  } else {
    // Voice notes only exist while apart; in a scene, even mentioning them invites one. A voice note
    // decided by the code gets the tags with its format reminder instead (formatNudge).
    if (apart && mode === "text" && audioTagsOn()) extra += fill(N.VOICE_TAGS, { tags: offeredTags().map((t) => `[${t}]`).join(", ") });
    if (userText.includes("\n")) extra += fill(N.SEVERAL_MESSAGES);
    if (offerReaction) extra += fill(N.REACT, { emojis: CONFIG.REACTIONS.ALLOWED.join(" ") });
    // Pictures: told when this reply comes with one (like FORMAT_VOICE); otherwise, apart, she may choose one
    const PIC = CONFIG.PICTURE;
    if (picture && picture.kind === "selfie") extra += fill(picture.asked ? PIC.FORMAT_ASKED : PIC.FORMAT, shotVars(picture.plan));
    else if (canPicture && apart && PIC.SELF_CHOICE) extra += fill(PIC.SELF_CHOICE, { everyday: tierShots("everyday").join(", "), flirty: tierShots("flirty").join(", "), nude: can({ settings }, "nude") ? PIC.NSFW.SELF_NUDE : "" });
    if (((picture && picture.kind === "selfie") || (canPicture && apart)) && recentPictures.length) {
      extra += fill(PIC.RECENT, { list: recentPictures.slice(-(Number(PIC.REMEMBER) || 8)).map((r) => `"${r}"`).join(", ") });
    }
    const texture = [...(P.TEXTURE || []), ...(apart ? P.TEXTURE_APART || [] : [])];
    if (texture.length && Math.random() < P.TEXTURE_CHANCE) {
      extra += " " + fill(texture[Math.floor(Math.random() * texture.length)]);
    }
    if (recent.length) {
      extra += fill(N.VARY_OPENING, { openings: [...new Set(recent)].map((o) => `"${o}"`).join(", ") });
    }
  }

  const system = P.SYSTEM_PROMPT + extra;
  const format = ooc ? "" : formatNudge(mode);
  const maxTokens = (L.MAX_TOKENS && L.MAX_TOKENS[mode === "visit" ? "SCENE" : mode.toUpperCase()]) || L.SAMPLING.max_tokens;
  const sampling = { ...L.SAMPLING, max_tokens: maxTokens };
  // Only as much of the chat as fits (the longest retry nudge counted)
  const longestRetry = Math.max(...[N.RETRY, N.RETRY_EMPTY, N.RETRY_OOC, N.RETRY_FORMAT, N.RETRY_VISIT].map((n) => fill(n || "").length));
  const fixed = system.length + longestRetry + format.length + userText.length;
  const kept = fitHistory(history, fixed, maxTokens);

  const build = (sys) => {
    const messages = [{ role: "system", content: sys }];
    if (kept[0]?.role === "assistant") messages.push({ role: "user", content: fill(CONFIG.INBOX.CONVERSATION_START) });
    messages.push(...kept.map(({ role, content }) => ({ role, content })), { role: "user", content: userText });
    if (format) messages.push({ role: "system", content: format });
    if (picture && picture.kind === "selfie" && CONFIG.PICTURE.REMINDER) messages.push({ role: "system", content: fill(CONFIG.PICTURE.REMINDER, shotVars(picture.plan)) });
    return messages;
  };

  let out = await callModel(env, build(system), sampling, { trimCut: true, backup: L.BACKUP_MODEL });

  // One more try if she opens like last time, if everything she wrote was already said, if nothing
  // in it can be sent once the format rules are applied (narration only, his lines...), or if
  // narration had to be cut out of a text or voice note. A reaction alone is a full answer when she may react.
  const shape = (o) => shapeReply(o, { scene, mode, ooc, canReact, canSelfie: canPicture, history, heard: userText });
  const first = shape(out);
  const empty = first.kind === "none" && !first.reaction && first.selfie == null && !(picture && picture.kind === "selfie");
  const opener = opening(first.stored);
  // He asked her over and she was told to go (mode "visit"), but she stayed on the phone: asked once more
  const stayed = mode === "visit" && first.kind !== "scene";
  // the same thing in other words (RECALL.REPEAT_SCORE), checked only when nothing else already asks her again
  if (!ooc && !first.repeated && !first.copied && !empty && !first.repaired && !stayed && !(opener && recent.includes(opener))) first.repeated = await saidBefore(env, first.stored, history);
  if ((!ooc && opener && recent.includes(opener)) || first.repeated || first.copied || empty || first.repaired || stayed) {
    const nudge = ooc && (empty || first.repaired) ? N.RETRY_OOC : empty ? N.RETRY_EMPTY : stayed ? N.RETRY_VISIT : first.repaired ? N.RETRY_FORMAT : N.RETRY;
    try {
      const second = await callModel(env, build(system + fill(nudge)), { ...sampling, temperature: L.RETRY_TEMPERATURE }, { attempts: 1, trimCut: true });
      const again = shape(second);
      // Taken if it can be sent and is new and clean; after an empty first try, anything sendable
      if (stayed ? again.kind === "scene" && !again.copied : again.kind !== "none" && (empty || (!again.repeated && !again.repaired && !again.copied))) out = second;
    } catch {
      // keep the first reply
    }
  }
  return out;
}
// The newest messages that fit the model's context next to `fixedChars` of prompt and the reply
export function fitHistory(history, fixedChars, maxTokens) {
  const L = CONFIG.LLM;
  let room = (L.CONTEXT_TOKENS - maxTokens - 150) * L.CHARS_PER_TOKEN - fixedChars;
  let start = history.length;
  while (start > 0) {
    const size = String(history[start - 1].content).length + 20;
    if (size > room && history.length - start >= 2) break;
    room -= size;
    start--;
  }
  return history.slice(start);
}
export function formatNudge(mode) {
  const N = CONFIG.NUDGES;
  if (mode === "scene") return fill(N.FORMAT_SCENE || "");
  if (mode === "visit") return fill(N.FORMAT_VISIT || "");
  if (mode === "voice") {
    const tags = audioTagsOn() ? fill(N.VOICE_TAGS, { tags: offeredTags().map((t) => `[${t}]`).join(", ") }) : "";
    return fill(N.FORMAT_VOICE || "", { tags });
  }
  return fill(N.FORMAT_TEXT || "");
}
// A model that thinks before answering (LLM.THINKING_MODELS): its thinking counts in max_tokens
export const thinksFirst = (model) => (CONFIG.LLM.THINKING_MODELS || []).some((w) => w && String(model || "").toLowerCase().includes(String(w).toLowerCase()));
// Cuts back to the last full sentence, closing an *action* or "quote" left open
export function trimUnfinished(t) {
  const ends = [...t.matchAll(/[.!?…]+["”’)]*\**(?=\s|$)/g)];
  const last = ends[ends.length - 1];
  if (!last) return t;
  let cut = t.slice(0, last.index + last[0].length).trim();
  if ((cut.match(/\*/g) || []).length % 2) cut += "*";
  if ((cut.match(/"/g) || []).length % 2) cut += '"';
  return cut;
}
export function opening(t) {
  return String(t)
    .replace(VOICE_TAG_ALL, "")
    .replace(REACT_TAG, "")
    .replace(SELFIE_TAG, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, CONFIG.TEXTING.OPENING_WORDS)
    .join(" ");
}
