// The picture writer (Llama 3.3 70B fast): the scene sentence of her pictures.
import { sentencesOf } from "../chat/shape.js";
import { CONFIG, fill } from "../config/index.js";
import { can } from "../gate.js";
import { asCamera, isDark, locationOf, sceneWearing, timeOfDay } from "./compose.js";
import { filterSafe, safeLine } from "./draw.js";
import { applyWritten, garmentsOf } from "./interpret.js";
import { lightFor, namesClothes, nudeWords, pickOne, sexAct, wordsOf } from "./shots.js";
import { aiFailed, aiText_, callModel } from "../platform/ai.js";

// Step C (picture overhaul, owner 2026-10-12 "Hybrid"): the picture writer (PICTURE.WRITER, Llama 3.3 70B fast on Workers AI) for her own
// pictures. Its raw answer, or null when it is off for this kind, fails or is slower than TIMEOUT_MS: the caller keeps the template.
export async function writePicture(env, kind, vars = {}) {
  const W = CONFIG.PICTURE.WRITER || {};
  const template = W[String(kind).toUpperCase()];
  // `vars.kind`: the picture's kind when the template is another (the picture core's "spec" template writes selfies and scenes)
  if (!W.ON || !(W.KINDS || []).includes(vars.kind || kind) || !template || !W.MODEL || !env.AI) return null;
  const ms = Number(W.TIMEOUT_MS) || 25000;
  const prompt = fill(template, { him: "he", her: CONFIG.CHARACTER.NAME, rules: W.RULES || "", ...vars });
  // as aiRun: AbortSignal.timeout, not setTimeout (the tests make setTimeout instant)
  const signal = AbortSignal.timeout(ms);
  const slow = new Promise((resolve) => signal.addEventListener("abort", () => resolve(null)));
  try {
    const out = await Promise.race([callModel(env, writerMessages(prompt), { temperature: 0.4, max_tokens: Number(W.MAX_TOKENS) || 160 }, { model: W.MODEL, timeoutMs: ms, attempts: 1, task: W.REASONING === "low" }), slow]);
    if (out == null) await aiFailed(env, `picture writer (${kind}): no answer in ${Math.round(ms / 1000)} s; drew the template`);
    return out == null ? null : String(out);
  } catch (e) {
    await aiFailed(env, `picture writer (${kind}): ${aiText_(e)}; drew the template`);
    return null;
  }
}
// The writer's prompt as messages (WRITER.REASONING): "low" = one user message; else the instructions as the system message and GO
export const writerMessages = (prompt) => {
  const W = CONFIG.PICTURE.WRITER || {};
  return W.REASONING === "low" ? [{ role: "user", content: prompt }] : [{ role: "system", content: prompt }, { role: "user", content: W.GO || "Write it now." }];
};
// The writer's answer as picture words: one line, no labels, quotes or asterisks, her name → she, at most WRITER.MAX_WORDS (whole
// sentences), and he is the camera (asCamera). "" when fewer than 4 words are left.
export function writtenWords(raw, settings = {}) {
  const max = Number((CONFIG.PICTURE.WRITER || {}).MAX_WORDS) || 60;
  let t = String(raw || "").replace(/[*"“”]/g, "").split("\n").map((x) => x.trim()).filter(Boolean)
    .map((x) => x.replace(/^(?:WITH[_ ]HER|ALONE|clause|sentences?|answer|photo|picture|draft)\s*[:.-]\s*/i, "")).filter(Boolean).join(" ");
  if (wordsOf(t).length > max) {
    const kept = [];
    for (const x of sentencesOf(t)) if (!kept.length || wordsOf([...kept, x].join(" ")).length <= max) kept.push(x.trim());
    t = kept.join(" ");
    if (wordsOf(t).length > max) t = t.split(/\s+/).slice(0, max).join(" ").replace(/[,;:\s]+$/, "");
  }
  // Step D bench: Llama's "and no visible bottom garment" drew her bare-legged under a cardigan at /nsfw Off → such a clause goes
  t = t.split(",").filter((seg) => !/\bno (?:visible )?(?:bottoms?|pants|trousers|jeans|shorts|skirt|underwear|(?:bottom )?garment)\b/i.test(seg)).join(",").replace(/,\s*and\s*(?=[.,]|$)/gi, "").trim();
  t = asCamera(t, settings);
  return wordsOf(t).length >= 4 ? t : "";
}
// Step C: her selfie's draft (composePicture's framing + her words) tidied by the writer, as a full prompt; null keeps the template.
// Only when her own words went into the draft (a template alone has no contradictions). The answer must keep every garment the draft
// names (or its nudity) and add no nudity or sex act the draft hadn't, and pass the level; a clause with a phone is cut.
export async function writtenSelfie(env, pic, { history = [], level = CONFIG.PICTURE.NSFW.DEFAULT } = {}) {
  const P = CONFIG.PICTURE;
  const parts = pic && pic.parts;
  const a = (pic && pic.args) || {};
  if (!parts || !parts.draft || !(String(a.words || "").trim() || String(a.doing || "").trim())) return null;
  const raw = await writePicture(env, "selfie", { draft: parts.draft, chat: writerChat(history) });
  // a phone in her hands is never in a selfie's words (the lead line says where the phone is: D1 rows 13, 14)
  const text = raw && writtenWords(raw).split(",").filter((seg) => !/\bphones?\b/i.test(seg)).join(",").replace(/[.\s]+$/, "");
  if (!text) return null;
  const draft = parts.draft;
  const lost = (namesClothes(draft) && !namesClothes(text) && !nudeWords(text)) || (nudeWords(draft) && !nudeWords(text) && !namesClothes(text));
  const added = (nudeWords(text) && !nudeWords(draft)) || (sexAct(text, level) && !sexAct(draft, level));
  if (lost || added || !can({ level: level }, "draw", text)) {
    await aiFailed(env, `picture writer (selfie): unusable (${lost ? "a garment lost" : "added what the draft hadn't"}): ${text.slice(0, 120)}; drew the template`);
    return null;
  }
  const body = [text.charAt(0).toUpperCase() + text.slice(1), parts.expression, parts.light].filter(Boolean).join(", ");
  return { ...pic, prompt: [P.SELFIE_STYLE, "{who}", parts.lead, `${body}.`, pic.location && "{room}", safeLine(level)].filter(Boolean).join(" "), written: raw };
}
// Step C: her in-person moment (kind "scene") written by the writer from her reply and the chat, as a full prompt; null keeps the
// template. The code still decides the act (her narration's SEX_CUES or the act words), the clothes when it names none, the light and
// the place picture.
export async function writtenScene(env, pic, want, { history = [], level = CONFIG.PICTURE.NSFW.DEFAULT, dayWear = null } = {}) {
  const P = CONFIG.PICTURE;
  if (!pic || !want) return null;
  const clothes = pic.wearing || sceneWearing(want, history, level, dayWear) || P.SCENE_WEARING || "";
  const raw = await writePicture(env, "scene", { chat: writerChat(history), moment: String(want).slice(0, 1500), clothes });
  const text = raw && writtenWords(raw);
  if (!text) return null;
  if (!can({ level: level }, "draw", text) || (sexAct(text, level) && !pic.act)) {
    await aiFailed(env, `picture writer (scene): unusable (${!can({ level: level }, "draw", text) ? "not at this level" : "a sex act her narration hadn't"}): ${text.slice(0, 120)}; drew the template`);
    return null;
  }
  const act = !!pic.act || sexAct(text, level);
  const wearing = act || namesClothes(text) || nudeWords(text) ? "" : clothes;
  const location = locationOf(text) || pic.location || null;
  const night = timeOfDay() === "night";
  const lightText = lightFor(text, night ? P.SCENE_NIGHT : pickOne((P.LIGHT || {})[timeOfDay().toUpperCase()]), level);
  const light = night && lightText === P.SCENE_NIGHT ? lightText : lightText && `Lit by ${lightText}.`;
  const wornSafe = filterSafe(wearing, level);
  const prompt = [(act && P.SCENE_ACT_STYLE) || P.SCENE_STYLE, "{who}", filterSafe(text, level).replace(/[.\s]*$/, "."), wornSafe && `She is wearing ${wornSafe}.`, light, location && "{room}", safeLine(level)].filter(Boolean).join(" ");
  return { ...pic, prompt, location, night: night || isDark(undefined, lightText || ""), written: raw };
}
// The chat as the writer reads it (WRITER.CHAT_MESSAGES, newest last; his lines as "He")
export const writerChat = (history = []) => history.slice(-(Number((CONFIG.PICTURE.WRITER || {}).CHAT_MESSAGES) || 6))
  .map((m) => `${m.role === "user" ? "He" : CONFIG.CHARACTER.NAME}: ${String(m.content).slice(0, 600)}`).join("\n") || "(nothing yet)";
// The picture core (Rebuild Step 2): the writer fills the spec's fields as JSON (WRITER.SPEC: action, outfit, place, expression) and the
// code phrases the prompt (framePrompt), so the picture rules hold by construction. Her selfies only when her own words went into them
// (as writtenSelfie); her scenes always. { spec, raw } or null (off, failed, slow, no JSON, nothing usable): the spec stays as built.
export async function writeSpec(env, kind, pic, spec, { want = "", history = [], level = CONFIG.PICTURE.NSFW.DEFAULT } = {}) {
  const P = CONFIG.PICTURE;
  const W = P.WRITER || {};
  if (!spec || !W.SPEC || !["selfie", "scene"].includes(kind)) return null;
  const f = (pic && pic.frame) || {};
  if (kind === "selfie" && !(String(f.words || "").trim() || String(f.doing || "").trim())) return null;
  const moment = kind === "scene" ? String(want || "").slice(0, 1500) : `Her selfie: ${[f.words, f.doing].filter(Boolean).join(", ")}`;
  const content = spec.content === "act" ? `they are having sex (${spec.act.name})` : spec.content === "nude" ? "she is naked" : spec.content === "partial" ? `she wears only ${spec.outfit.words}` : "she is dressed";
  const decided = `${kind === "selfie" ? "a selfie she takes" : "what he sees in person"}; ${content}${spec.place.key ? `; the place: ${spec.place.key}` : ""}.`;
  const raw = await writePicture(env, "spec", { chat: writerChat(history), moment, decided, places: Object.keys(P.LOCATIONS || {}).join(", "), kind });
  if (!raw) return null;
  let fields = null;
  try {
    const m = String(raw).match(/\{[\s\S]*\}/);
    fields = m ? JSON.parse(m[0]) : null;
  } catch {}
  // plain words instead of JSON: its clothes are the outfit, the rest the action
  if (!fields) {
    const g = garmentsOf(writtenWords(raw));
    fields = { action: g.rest.join(", "), outfit: g.garments.join(" and ") };
  }
  const out = applyWritten(spec, fields, { level });
  if (!out) {
    await aiFailed(env, `picture writer (${kind}): no usable JSON: ${String(raw).slice(0, 120)}; drew the spec as built`);
    return null;
  }
  return { spec: out, raw: String(raw) };
}
