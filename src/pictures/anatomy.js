// The anatomy check (Llama 4 Scout) and the redraw verdict.
import { CONFIG, fill } from "../config/index.js";
import { aiAffordable, aiFailed, aiRun, aiSpent, aiText, aiText_ } from "../platform/ai.js";
import { budget, toBase64 } from "../platform/http.js";

// Step D: the anatomy check's answer (PICTURE.ANATOMY.PROMPT) as { ok, mistakes, people }: its last JSON object; ok only with no flag
// true, no mistake listed and at most one head (v1's { people, mistakes, ok } read too). null when there is no JSON to read (the caller passes the picture).
// `heads` false: the head count is not a mistake (sex acts: Scout answered "2 heads" on 3 of 3 clean act pictures, probe v3)
export function anatomyVerdict(text, { heads: countHeads = true } = {}) {
  const t = String(text || "");
  const found = [...t.matchAll(/\{[^{}]*\}/g)].map((m) => m[0]);
  for (const j of found.reverse()) {
    try {
      const v = JSON.parse(j);
      if (!v || typeof v !== "object" || !("ok" in v || "mistakes" in v || "heads" in v || "stray_parts" in v)) continue;
      // v2: one flag per mistake and the heads it counted (more than one head: someone else, or his own head, is in the picture)
      const flags = ["stray_parts", "bad_hands", "bad_limbs", "mismatched_legs", "bad_face"].filter((k) => v[k] === true || String(v[k]).toLowerCase() === "true");
      const listed = (Array.isArray(v.mistakes) ? v.mistakes : []).map((m) => String(m).trim()).filter((m) => m && !/^(?:none|no mistakes?)\.?$/i.test(m));
      const heads = Number(v.heads ?? v.people) || 0;
      const mistakes = [...listed, ...flags, ...(countHeads && heads > 1 ? [`${heads} heads`] : [])];
      return { ok: v.ok !== false && !mistakes.length, mistakes, people: heads };
    } catch {}
  }
  return null;
}
// Step D: asks ANATOMY.MODEL whether a drawn picture has anatomy mistakes. view: "act" (sex from his eyes), "pov" (his eyes) or "".
// { ok, mistakes, people, text } or null when it can't be checked (off, no AI or budget, an error, slower than TIMEOUT_MS, no JSON):
// then the picture is sent as drawn. Counted as one of his photos (AI_BUDGET.PHOTO_NEURONS; ~60 neurons measured, run 38340313839).
export async function anatomyCheck(env, ledger, bytes, view = "") {
  const A = CONFIG.PICTURE.ANATOMY || {};
  if (!A.ON || !A.MODEL || !A.PROMPT || !env.AI || !bytes || (ledger && !aiAffordable(ledger, "photo")) || budget.left() < CONFIG.LIMITS.SUBREQUEST_RESERVE + 3) return null;
  const prompt = fill(A.PROMPT, { attached: view ? A.ATTACHED || "" : "", pov: view === "pov" ? A.POV || "" : "", act: view === "act" ? A.ACT || "" : "" });
  let error = null;
  try {
    const input = { messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${toBase64(bytes)}` } }] }], max_tokens: Number(A.MAX_TOKENS) || 300 };
    const text = String(aiText(await aiRun(env, A.MODEL, input, Number(A.TIMEOUT_MS) || 20000)) || "").trim();
    const v = anatomyVerdict(text, { heads: view !== "act" });
    return v && { ...v, text };
  } catch (e) {
    error = e;
    await aiFailed(env, `anatomy check (${A.MODEL}): ${aiText_(e)}; sent the picture as drawn`);
    return null;
  } finally {
    if (ledger) aiSpent(ledger, CONFIG.AI_BUDGET.PHOTO_NEURONS, error);
  }
}
