// Seeing his photos (Workers AI vision).
import { CONFIG, fill } from "./config/index.js";
import { can } from "./gate.js";
import { cutAtSentence } from "./persona/index.js";
import { aiFailed, aiRun, aiSpent, aiText, aiText_, aiUnavailable } from "./platform/ai.js";
import { budget, toBase64, xfetch } from "./platform/http.js";
import { loadLedger, saveLedger } from "./platform/kv.js";
import { tg } from "./platform/telegram.js";

/* --- his photos --- */

// What his photo shows, in a few plain sentences (VISION), or "" when it can't be seen
export async function describePhoto(env, sizes, ledger = null) {
  const V = CONFIG.VISION;
  if (!V.ENABLED || !env.AI || !Array.isArray(sizes) || !sizes.length) return "";
  if (budget.left() < CONFIG.LIMITS.SUBREQUEST_RESERVE + 3) return "";
  ledger = ledger || (await loadLedger(env));
  if (!can({ ledger }, "ai", "photo")) return "";
  let error = null;
  try {
    // Telegram lists sizes small to big: the biggest that fits MAX_SIDE, else the smallest
    const fit = sizes.filter((p) => Math.max(p.width || 0, p.height || 0) <= V.MAX_SIDE);
    const size = fit.length ? fit[fit.length - 1] : sizes[0];
    const f = await tg(env, "getFile", { file_id: size.file_id });
    if (!f.ok) throw new Error(`Telegram getFile: ${f.description || "failed"}`);
    const res = await xfetch(`https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${f.result.file_path}`, {
      signal: AbortSignal.timeout(CONFIG.LIMITS.HTTP_TIMEOUT_MS),
    }).catch(() => null);
    if (!res?.ok) throw new Error("couldn't download the photo from Telegram");
    const image = `data:image/jpeg;base64,${toBase64(await res.arrayBuffer())}`;
    const input = {
      messages: [{ role: "user", content: [{ type: "text", text: fill(V.PROMPT) }, { type: "image_url", image_url: { url: image } }] }],
      max_tokens: V.MAX_TOKENS,
    };
    let out;
    try {
      out = await aiRun(env, V.MODEL, input, V.TIMEOUT_MS);
    } catch (e) {
      if (!V.BACKUP_MODEL || !aiUnavailable(e)) throw e;
      await aiFailed(env, `seeing a photo with ${V.MODEL}: ${aiText_(e)}; used ${V.BACKUP_MODEL}`);
      out = await aiRun(env, V.BACKUP_MODEL, input, V.TIMEOUT_MS);
    }
    const seen = tidyDescription(aiText(out));
    if (!seen) throw new Error(`${V.MODEL} gave no description`);
    return seen;
  } catch (e) {
    error = e;
    await aiFailed(env, `seeing a photo: ${aiText_(e)}`);
    return "";
  } finally {
    aiSpent(ledger, CONFIG.AI_BUDGET.PHOTO_NEURONS, error);
    await saveLedger(env, ledger);
  }
}
// One clean paragraph for INBOX.PHOTO_SEEN: no brackets (they'd close the line early), no refusals
export function tidyDescription(t) {
  let s = String(t || "").replace(/\[/g, "(").replace(/\]/g, ")").replace(/\s+/g, " ").trim();
  if (!s || /^(?:i'?m sorry|sorry|i can(?:no|')t|i am unable|i'm unable|unable to)\b/i.test(s)) return "";
  s = cutAtSentence(s, CONFIG.VISION.MAX_CHARS);
  return /[.!?]$/.test(s) ? s : `${s}.`;
}
// How a photo he sent reads to her: what she saw (if anything) and his caption
export function photoLine(seen, caption) {
  const I = CONFIG.INBOX;
  caption = String(caption || "").trim();
  if (seen) return caption ? fill(I.PHOTO_SEEN_WITH_CAPTION, { description: seen, caption }) : fill(I.PHOTO_SEEN, { description: seen });
  return caption ? fill(I.PHOTO_WITH_CAPTION, { caption }) : fill(I.PHOTO);
}
