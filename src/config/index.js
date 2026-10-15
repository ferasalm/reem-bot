// CONFIG = the engine's settings + the persona's (src/persona), then CONFIG_OVERRIDES; fill() for {placeholders}; the per-instance cache.
import { ENGINE } from "./engine.js";
import { PERSONA_CONFIG } from "../persona/reem-en/config.js";

export const cache = { owner: null, voiceId: undefined, secret: null, seen: [], overrides: null };
// Fills {placeholders} in a settings text. Values are inserted as-is, never re-read as placeholders.
export function fill(template, vars = {}) {
  const all = { name: CONFIG.CHARACTER.NAME, ...vars };
  return String(template).replace(/\{(\w+)\}/g, (m, k) => (k in all ? String(all[k]) : m));
}
/* ------------------------------------------------------------------ */
/*  CONFIG_OVERRIDES: change settings from the dashboard               */
/* ------------------------------------------------------------------ */

export const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
// These word lists are replaced as a whole, so entries can be removed as well as added
export const REPLACED_WHOLE = new Set(["PRONUNCIATIONS", "FILTER_WORDS", "ARABIZI_DIGITS", "STAGE_DIRECTIONS", "SHOTS", "SHOT_WORDS", "SHOT_HOURS", "ANGLES", "ANGLE_WEIGHTS"]);
// Blocks passed to OpenRouter as they are, so they may also take new parameters
export const OPEN_BLOCKS = /(^|\.)(SAMPLING|PROVIDER|REASONING|BACKUP_PROVIDER|BACKUP_REASONING)$/;
// Only names that exist in CONFIG are changed (OPEN_BLOCKS excepted)
export function mergeSettings(target, src, path, unknown) {
  for (const [k, v] of Object.entries(src)) {
    const at = path ? `${path}.${k}` : k;
    if (!(k in target) && !OPEN_BLOCKS.test(path)) {
      unknown.push(at);
      continue;
    }
    if (isPlainObject(v) && isPlainObject(target[k]) && !REPLACED_WHOLE.has(k)) mergeSettings(target[k], v, at, unknown);
    else target[k] = v;
  }
}
// Applied once per Worker instance; changing the variable in the dashboard starts a fresh one
export function applyOverrides(env) {
  if (cache.overrides) return cache.overrides;
  const raw = env.CONFIG_OVERRIDES;
  if (!raw) return (cache.overrides = { set: false, ok: true, detail: "" });
  try {
    const src = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!isPlainObject(src)) throw new Error("it must be a JSON object, like {\"VOICE\": {\"SPEED\": 1}}");
    const unknown = [];
    mergeSettings(CONFIG, src, "", unknown);
    cache.overrides = unknown.length
      ? { set: true, ok: false, detail: `Applied, except these names, which don't exist in CONFIG: ${unknown.join(", ")}` }
      : { set: true, ok: true, detail: "Applied." };
  } catch (e) {
    console.error("CONFIG_OVERRIDES ignored", e);
    cache.overrides = { set: true, ok: false, detail: `Not applied: ${e.message}` };
  }
  return cache.overrides;
}

// Every setting: the engine's (src/config/engine.js) with the persona's (src/persona/reem-en/config.js) merged in. A persona key
// never replaces an engine value (merge() throws on a clash), so each setting has one home. CONFIG_OVERRIDES (applyOverrides) then
// changes values in place.
export const CONFIG = merge(ENGINE, PERSONA_CONFIG, "");

function merge(engine, persona, path) {
  for (const [k, v] of Object.entries(persona)) {
    const at = path ? `${path}.${k}` : k;
    if (!(k in engine)) engine[k] = v;
    else if (isPlainObject(engine[k]) && isPlainObject(v)) merge(engine[k], v, at);
    else throw new Error(`CONFIG.${at} is set by both the engine and the persona`);
  }
  return engine;
}
