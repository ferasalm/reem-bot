// framePrompt and the plan of a ShotSpec (Rebuild Step 2, 2026-10-16). The sentences always come in one order (WORKPLAN "The new
// picture pipeline" 2): 1 lens/perspective + framing, 2 who she is by image number (+ the age statement, her hair), 3 what she wears,
// 4 pose and who is in the frame, 5 crop edges, 6 place + light, 7 expression, 8 one photo-style line. Route profiles: Runware klein 9B
// (4 references, the LoRA, the sizes by aspect) and Cloudflare klein 4B (3 references, no LoRA, FILTER_WORDS, 576x1024): the same spec
// and frames on both.
import { CONFIG } from "../config/index.js";
import * as FR from "./frames.js";
import { inFrameOutfit } from "./interpret.js";
import { lintPrompt, ruleWords } from "./lint.js";
import { lorasFor } from "./loras.js";
import { pickRefs } from "./refs.js";
import { escapeRegex } from "../platform/http.js";

// A route profile: what the route takes
export function profile(name) {
  const P = CONFIG.PICTURE;
  const R = P.RUNWARE || {};
  const F = P.FRAMES || {};
  const refs = (F.MAX_REFS || {})[name];
  return name === "runware"
    ? { name, model: R.MODEL, refs: Number(refs) || 4, lora: true, filter: false, sizes: R.SIZES || {}, width: Number(R.WIDTH) || 768, height: Number(R.HEIGHT) || 1344 }
    : { name: "cloudflare", model: P.MODEL, refs: Number(refs) || 3, lora: false, filter: true, sizes: {}, width: Number(P.WIDTH) || 576, height: Number(P.HEIGHT) || 1024 };
}
const fill = (t, v) => String(t || "").replace(/\{(\w+)\}/g, (m, k) => (k in v ? String(v[k]) : m));
const sentence = (t) => {
  const x = String(t || "").trim().replace(/[,;:\s]+$/, "");
  return x ? `${x.charAt(0).toUpperCase()}${x.slice(1)}${/[.!?]$/.test(x) ? "" : "."}` : "";
};
// Cloudflare's prompt filter (3030): PICTURE.FILTER_WORDS, whole words (filterSafe's rule, without its route check)
function filterWords(text) {
  let t = String(text || "");
  for (const [w, to] of Object.entries(CONFIG.PICTURE.FILTER_WORDS || {})) t = t.replace(new RegExp(`\\b${escapeRegex(w)}\\b`, "gi"), to);
  return t.replace(/\s+and\s+(?:an?\s+)?(?:matching\s+)?(?=[,.;]|$)/gi, "").replace(/\s{2,}/g, " ").trim();
}
// The prompt of a spec: `refs` = pickRefs' list in the order sent ({ role, name }); image numbers come from it
export function framePrompt(spec, refs = [], prof = profile("runware")) {
  const P = CONFIG.PICTURE;
  const at = (role) => refs.findIndex((r) => r.role === role);
  const out = [];
  const place = () => {
    if (spec.place.crop && at("place") >= 0) out.push(fill(FR.PLACE.picture, { n: at("place") }));
    else if (spec.place.key && (P.LOCATIONS || {})[spec.place.key]) out.push(fill(FR.PLACE.words, { name: P.LOCATIONS[spec.place.key].NAME || spec.place.key }));
    if (spec.light) out.push(fill(FR.PLACE.light, { light: spec.light }));
    if (spec.dark) out.push(spec.herself ? FR.PLACE.night : FR.PLACE.nightAlone);
  };
  if (!spec.herself) {
    // /look without her: what POV sees, nobody's face or body
    out.push(FR.LENS.alone, sentence(spec.alone));
    place();
    out.push(FR.ALONE_PHOTO);
  } else {
    // 1. lens and framing (an act's frame says both)
    if (spec.view === "pov-act") {
      const a = FR.ACTS[spec.act && spec.act.name];
      const anal = spec.act && spec.act.hole === "anus";
      const hole = anal ? FR.PENETRATION.anus : a && a.back ? FR.PENETRATION.vaginaBehind : FR.PENETRATION.vagina;
      out.push(fill(a ? (anal && a.anal) || a.text : FR.ACT_GENERIC, { hole }));
    } else {
      out.push(fill(FR.LENS[spec.view] || FR.LENS.pov, { angle: FR.ANGLES[spec.angle] || "" }));
      if (spec.back && spec.view !== "mirror") out.push(FR.BACK);
      if (FR.FRAMINGS[spec.framing]) out.push(FR.FRAMINGS[spec.framing]);
    }
    // 2. who she is
    const face = at("face");
    const body = at("body");
    const who = face >= 0
      ? fill(FR.IDENTITY.face, { face }) + (body >= 0 ? fill(spec.content === "clothed" ? FR.IDENTITY.bodyClothed : FR.IDENTITY.body, { body }) : "")
      : body >= 0 ? fill(FR.IDENTITY.bodyOnly, { body }) : "";
    // no reference at all (the schnell backup, TwinFlow): her description in words is all the model has (LOOKS; the lint reports it)
    out.push(who ? who + FR.IDENTITY.age : (prof.name === "runware" ? (P.RUNWARE || {}).LOOKS : P.LOOKS) || `She is a woman${FR.IDENTITY.age}`);
    const hairPic = at("hair");
    if (hairPic >= 0) out.push(fill(FR.IDENTITY.hairPicture, { n: hairPic }));
    else if (spec.hair.key) out.push(fill(FR.IDENTITY.hair, { hair: ruleWords(spec.hair.key) }));
    // 3. what she wears
    const words = String(spec.outfit.words || "").replace(/^(?:Her|His|A|An|The|My)\b/, (w) => w.toLowerCase());
    const outfitPic = at("outfit");
    if (spec.content === "clothed") out.push(outfitPic >= 0 ? fill(FR.WEAR.outfitPicture, { n: outfitPic }) : fill(FR.WEAR.clothed, { outfit: inFrameOutfit(words, spec.framing) }));
    else if (words) out.push(fill(FR.WEAR[spec.outfit.kept] || FR.WEAR.partial, { outfit: words }));
    else out.push(FR.WEAR.nude);
    // 4. pose, and who is in the frame
    // "across from POV" seats POV too: klein drew his bare legs toward the lens 4/4 (Step 3b check); she faces the lens instead
    if (spec.pose) out.push(sentence(spec.view === "pov" ? spec.pose.replace(/\bacross from POV\b/gi, "facing the lens") : spec.pose));
    if (spec.view === "pov" || spec.view === "closeup") out.push(FR.ONLY_HER);
    if (spec.aspect === "16:9") out.push(FR.ONE_WOMAN);
    // 5. crop edges
    if (spec.view === "selfie" && spec.side) out.push(fill(FR.EDGES.selfie, { side: spec.side }));
    // 6. place and light
    place();
    // 7. expression
    if (spec.expression) out.push(fill(FR.EXPRESSION, { expression: ruleWords(spec.expression) }));
    // 8. the photo line
    out.push(FR.PHOTO);
  }
  const text = out.filter(Boolean).join(" ").replace(/\s{2,}/g, " ").trim();
  return prof.filter ? filterWords(text) : text;
}
// The plan of a spec on a route, with no network: { tries, refs, lint } (tries as runwarePlan's: { model, text, refs: [{ name, bytes }],
// loras, width, height, steps, cfg, acceleration, scheduler, checkContent }). `bytesOf(name)` gives a reference's bytes (drawPictureNow
// resolves them first). The Runware route tries klein KLEIN_TRIES times; Cloudflare's try is drawn by drawPictureNow's Cloudflare call.
export function specPlan(spec, { route = "runware", bytesOf = () => null, fix = false, level = CONFIG.PICTURE.NSFW.DEFAULT } = {}) {
  const P = CONFIG.PICTURE;
  const R = P.RUNWARE || {};
  const F = P.FRAMES || {};
  const prof = profile(route);
  const refs = pickRefs(spec, prof).map((r) => ({ ...r, bytes: bytesOf(r.name) })).filter((r) => r.bytes);
  const text = framePrompt(spec, refs, prof);
  const lint = lintPrompt(text, refs.length);
  if (prof.name !== "runware") return { tries: [{ model: prof.model, text, refs, loras: [], width: prof.width, height: prof.height, steps: 0, cfg: 0, acceleration: "", scheduler: "", checkContent: false }], refs, lint };
  // PICTURE.ROUTE "runware-twinflow": TwinFlow from words only (no references, LoRA or sampler), as the legacy route did
  if (P.ROUTE === "runware-twinflow" && R.BACKUP_MODEL) {
    const words = framePrompt(spec, [], prof);
    return { tries: [{ model: R.BACKUP_MODEL, text: words, refs: [], loras: [], width: prof.width, height: prof.height, steps: 0, cfg: 0, acceleration: "", scheduler: "", checkContent: level === "off" }], refs: [], lint: lintPrompt(words, 0) };
  }
  const sized = String(prof.sizes[spec.aspect] || "").split("x").map(Number);
  const [width, height] = sized.length === 2 && sized[0] > 0 && sized[1] > 0 ? sized : [prof.width, prof.height];
  const loras = lorasFor(spec, { fix });
  const tries = Array.from({ length: Math.max(1, Number(R.KLEIN_TRIES) || 1) }, () => ({
    model: prof.model, text, refs, loras, width, height,
    steps: Number(F.STEPS) > 0 ? Number(F.STEPS) : 0,
    cfg: Number(F.CFG) >= 1 ? Number(F.CFG) : 0,
    acceleration: F.ACCELERATION ? String(F.ACCELERATION) : "",
    scheduler: F.SCHEDULER ? String(F.SCHEDULER) : "",
    checkContent: level === "off",
  }));
  return { tries, refs, lint };
}
