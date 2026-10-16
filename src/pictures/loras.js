// The LoRA policy of the picture core (Rebuild Step 2; owner 2026-10-15): one LoRA, NSFW Unlocked, weighted by content
// (PICTURE.FRAMES.LORA_WEIGHTS: clothed ≤ 0.6, nudity and acts ≤ 0.8, 0.05 steps); the Anatomy Fixer only on a redraw after the anatomy
// check found a mistake, never on a sex act. Lenovo and every other LoRA are retired (still in RUNWARE for the legacy core).
import { CONFIG } from "../config/index.js";
import { loraKey } from "./spec.js";

// Runware's lora list for one picture: [{ model, weight }] (a weight of 0 or not a number leaves it out)
export function lorasFor(spec, { fix = false } = {}) {
  const F = CONFIG.PICTURE.FRAMES || {};
  const out = [];
  const w = Number((F.LORA_WEIGHTS || {})[loraKey(spec)]);
  if (F.LORA && Number.isFinite(w) && w > 0) out.push({ model: String(F.LORA), weight: Math.round(w * 100) / 100 });
  const fw = Number(F.FIX_WEIGHT);
  if (fix && spec.content !== "act" && spec.herself && F.FIX_LORA && Number.isFinite(fw) && fw > 0) out.push({ model: String(F.FIX_LORA), weight: fw });
  return out;
}
