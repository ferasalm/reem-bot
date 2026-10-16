// Drawing: Runware first at Nude/On, Cloudflare klein at Off; the filter words.
import { CONFIG } from "../config/index.js";
import { can } from "../gate.js";
import { anatomyCheck } from "./anatomy.js";
import { firstPerson } from "./commands.js";
import { ownHands } from "./compose.js";
import { pictureFlags, runwarePlan } from "./plan.js";
import { forgetUuid, loadLibrary, runwareUuid } from "./library.js";
import { profile, specPlan } from "./prompt.js";
import { bodyBytes, faceBytes, imageBytes, pickRefs, placePictures, refBytes } from "./refs.js";
import { pickOne } from "./shots.js";
import { aiFailed, aiFiltered, aiRun, aiSpent, aiText_, aiUnavailable } from "../platform/ai.js";
import { escapeRegex, fromBase64, toBase64, xfetch } from "../platform/http.js";
import { spend } from "../platform/kv.js";
import { logPicture, pictureRow } from "../platform/log.js";

// Her words, worded so Cloudflare's prompt filter lets them through (PICTURE.FILTER_WORDS, whole words, any case)
export function filterSafe(text, level = CONFIG.PICTURE.NSFW.DEFAULT) {
  let t = String(text || "");
  if (runwareRoute(level)) return t.trim(); // Runware has no prompt filter: her words as they are
  for (const [w, to] of Object.entries(CONFIG.PICTURE.FILTER_WORDS || {})) t = t.replace(new RegExp(`\\b${escapeRegex(w)}\\b`, "gi"), to);
  // a dropped word leaves "... and a matching" behind
  return t.replace(/\s+and\s+(?:an?\s+)?(?:matching\s+)?(?=[,.;]|$)/gi, "").replace(/\s{2,}/g, " ").trim();
}
// PICTURE.ROUTE "runware-klein" / "runware-twinflow": her words are drawn as she wrote them (no FILTER_WORDS, only
// RUNWARE.NOT_DRAWN, no SAFE), nudity included (owner 2026-10-06)
// /nsfw Off draws on Cloudflare when NSFW.OFF_ROUTE is "cloudflare" (2026-10-11); with no level it is the route as configured
export const runwareRoute = (level) => /^runware/.test(String(CONFIG.PICTURE.ROUTE || "")) && !(level === "off" && CONFIG.PICTURE.NSFW.OFF_ROUTE === "cloudflare");
export const safeLine = (level = CONFIG.PICTURE.NSFW.DEFAULT) => (runwareRoute(level) ? "" : CONFIG.PICTURE.SAFE);
// The Cloudflare route's prompt: CRAFT at the end (Runware has RUNWARE.PHOTO in its place) and every hand owned
export const cloudflareText = (t) => ownHands(firstPerson([t, CONFIG.PICTURE.CRAFT].filter(Boolean).join(" ").replace(/\s{2,}/g, " ").trim()));
// One picture from Runware (POST api.runware.ai/v1, one imageInference task, its content check off): { bytes, cost }.
// `refs`: JPEG bytes sent as reference images (klein: face, body, place); none for TwinFlow.
// One picture from Runware (POST api.runware.ai/v1, one imageInference task, its content check off): { bytes, cost }.
// It only sends: runwarePlan decides the model, text, references, LoRAs and sampler. `refs`: JPEG bytes, the reference
// images in order (klein: face, body, place, style); none for TwinFlow. `seed`: drawPicture's, one per picture.
// checkContent (Step 2): Runware's own content check, on at /nsfw Off (runwarePlan sets it); off everywhere else, as before
export async function drawRunware(env, model, prompt, refs, width, height, { loras = [], seed = 0, steps = 0, cfg = 0, acceleration = "", scheduler = "", checkContent = false, results = 1 } = {}) {
  const R = CONFIG.PICTURE.RUNWARE || {};
  const task = { taskType: "imageInference", taskUUID: crypto.randomUUID(), model, positivePrompt: prompt, width, height, numberResults: results, outputType: "base64Data", outputFormat: "JPG", includeCost: true, safety: { checkContent: !!checkContent } };
  // a reference is JPEG bytes, or { bytes, id } for a library picture: that one goes by its Runware UUID (uploaded once, KV ruuid:<id>)
  const dataUrl = (b) => `data:image/jpeg;base64,${toBase64(b.bytes || b)}`;
  const byUuid = refs.some((r) => r && r.id);
  if (refs.length) task.inputs = { referenceImages: await Promise.all(refs.map(async (r) => (r.id && (await runwareUuid(env, r.id, r.bytes))) || dataUrl(r))) };
  if (loras.length) task.lora = loras;
  if (seed > 0) task.seed = seed;
  // klein 9B's sampler (STEPS, CFG, ACCELERATION): runwarePlan sets them for klein only; 0 or "" = Runware's default
  if (steps > 0) task.steps = steps;
  if (cfg >= 1) task.CFGScale = cfg;
  if (acceleration) task.acceleration = String(acceleration);
  if (scheduler) task.scheduler = String(scheduler); // the picture core's PICTURE.FRAMES.SCHEDULER ("" = Runware's Default)
  const send = (t) => xfetch("https://api.runware.ai/v1", { method: "POST", headers: { Authorization: `Bearer ${env.RUNWARE_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify([t]), signal: AbortSignal.timeout(Number(R.TIMEOUT_MS) || 60000) });
  let res;
  try {
    res = await send(task);
  } catch (e) {
    throw new Error(`Runware unreachable or too slow (${e.name})`);
  }
  let data = await res.json().catch(() => ({}));
  // a UUID Runware no longer knows: forget it and send the bytes this once (not one of drawSpecNow's tries)
  if (byUuid && (!res.ok || (data.errors || []).length) && /uuid|invalid.*image|image.*not found/i.test(JSON.stringify(data.errors || data))) {
    for (const r of refs) if (r && r.id) await forgetUuid(env, r.id);
    task.inputs = { referenceImages: refs.map(dataUrl) };
    task.taskUUID = crypto.randomUUID();
    try {
      res = await send(task);
    } catch (e) {
      throw new Error(`Runware unreachable or too slow (${e.name})`);
    }
    data = await res.json().catch(() => ({}));
  }
  const pics = (data.data || []).filter((x) => x && x.imageBase64Data); // `results` pictures from one task (the studio)
  const d = pics[0];
  if (!res.ok || (data.errors || []).length || !d) throw new Error(`Runware ${res.status}: ${(data.errors || []).map((x) => x.code || x.message).join(", ") || "no picture"}`);
  return { bytes: fromBase64(d.imageBase64Data), cost: Number(d.cost) || 0, pictures: pics.map((x) => ({ bytes: fromBase64(x.imageBase64Data), cost: Number(x.cost) || 0 })) };
}
// A new picture: { bytes, model, logId } (logId: its row in the studio's log, null without STUDIO_DB). `prompt` is the whole
// prompt (composePicture), with {who} where she's introduced: REFERENCE with her face, LOOKS without. `face` false = no
// reference. `log` = { source, chat, asked, herWords, llmText, nsfw } for the log. Every call is logged, drawn or not, and
// prints one line of JSON. Plan (runwarePlan) → draw (drawRunware, then Cloudflare) → log.
// Step 2: `nsfw` = the chat's /nsfw level ("off" | "nude" | "on"; default PICTURE.NSFW.DEFAULT); it is the log row's nsfw
// Step D (2026-10-13): her pictures (ANATOMY.KINDS, with a ledger) are checked (anatomyCheck); one with mistakes is drawn again with another
// seed, ANATOMY.TRIES pictures at most, and the one with the fewest mistakes is returned. Each try is its own log row ("anatomy: ..." in
// its error column when the check found mistakes). A failed first draw throws as before; a failed redraw keeps the best so far.
export async function drawPicture(env, prompt, opts = {}) {
  const P = CONFIG.PICTURE;
  const A = P.ANATOMY || {};
  const L = opts.log || {};
  const nsfw = opts.nsfw || P.NSFW.DEFAULT;
  // the picture core (Rebuild Step 2): with a spec the spec decides; every redraw keeps the same spec, only the seed changes (the old
  // prompts re-rolled mood, hair and aspect on each redraw)
  const spec = opts.spec || null;
  const kindOf = () => (spec ? (spec.herself ? spec.content : "alone") : pictureFlags(prompt, opts.herself !== false, nsfw).kind);
  const newRec = () => ({ ms0: Date.now(), attempts: 0, cost: 0, seed: 0, kind: kindOf(), model: "", prompt: "", refs: [], loras: [], width: null, height: null, steps: null, cfg: null, error: "", note: "", nsfw, spec, lint: null, scheduler: "" });
  const now = (o, rec) => (spec ? drawSpecNow(env, spec, o, rec) : drawPictureNow(env, prompt, o, rec));
  if (opts.planOnly) return now({ ...opts, nsfw }, newRec()); // the studio's compose: the plan only (nothing drawn or logged)
  const kind = L.source === "look" ? "look" : opts.kind || (opts.custom ? "pic" : "");
  const checking = !!(A.ON && opts.ledger && opts.herself !== false && (A.KINDS || []).includes(kind));
  const tries = checking ? Math.max(1, Math.floor(Number(A.TRIES) || 1)) : 1;
  let best = null;
  let prev = null; // the last try's mistakes (STOP_ON_REPEAT)
  let seed = Number(opts.seed) || 0;
  for (let i = 0; i < tries; i++) {
    const rec = newRec();
    let out = null;
    let failure = null;
    try {
      // a redraw after the anatomy check found mistakes: `fix` lets the Anatomy Fixer in as a third LoRA (2026-10-15)
      out = await now({ ...opts, nsfw, seed, fix: i > 0 }, rec);
    } catch (e) {
      failure = e;
      rec.error = aiText_(e);
    }
    // a redraw on Cloudflare is counted here (the callers count one picture)
    if (i && opts.ledger && rec.model && !String(rec.model).startsWith("runware:")) aiSpent(opts.ledger, rec.model === P.MODEL ? CONFIG.AI_BUDGET.PICTURE_NEURONS : CONFIG.AI_BUDGET.BACKUP_PICTURE_NEURONS, failure);
    // his eyes: sex acts, scenes and /look, and a /pic with him (POV_CLOTHED); her selfies are hers
    const view = rec.kind === "act" ? "act" : spec ? (spec.view === "selfie" || spec.view === "mirror" ? "" : "pov") : kind === "selfie" ? "" : kind === "pic" ? (P.POV_CLOTHED && String(prompt).includes(P.POV_CLOTHED) ? "pov" : "") : "pov";
    const verdict = !failure && checking ? await anatomyCheck(env, opts.ledger, out.bytes, view) : null;
    if (verdict && !verdict.ok) rec.note = `anatomy (try ${i + 1} of ${tries}): ${verdict.mistakes.join(", ")}`;
    const logId = await logPicture(env, pictureRow(prompt, L, rec, !failure));
    console.log(JSON.stringify({ picture: logId, source: L.source || "other", model: rec.model || null, kind: rec.kind, loras: rec.loras.length, cost: rec.cost, ms: Date.now() - rec.ms0, ok: !failure, ...(verdict ? { anatomy: verdict.ok ? "ok" : verdict.mistakes } : {}) }));
    if (failure) {
      if (!best) throw failure;
      break;
    }
    const mistakes = verdict ? verdict.mistakes.length : 0;
    if (!best || mistakes < best.mistakes) best = { out: { ...out, logId }, mistakes };
    if (!verdict || verdict.ok) break;
    const same = verdict.mistakes.length === 1 && prev && prev.length === 1 && prev[0] === verdict.mistakes[0];
    if (A.STOP_ON_REPEAT && same) break; // the same single mistake twice: likely the check, not the picture
    prev = verdict.mistakes;
    seed = ((((Number(rec.seed) || 1) - 1 + 7919) % 2147483646) + 1); // another picture, not the same one again
  }
  return best.out;
}
// drawPicture's draw from a ShotSpec (the picture core, Rebuild Step 2): Runware klein 9B when the level and money allow it (the Runware
// profile: 4 references, the LoRA, the spec's aspect), else Cloudflare klein 4B (its profile: 3 references, FILTER_WORDS); the same spec
// and frames on both. At Nude and On with a Runware key, a picture Runware didn't draw is not drawn (owner 2026-10-13). `rec` keeps what
// was sent, for the log (and the spec and its lint findings).
export async function drawSpecNow(env, spec, { ledger = null, fix = false, seed: wantedSeed = 0, nsfw = CONFIG.PICTURE.NSFW.DEFAULT, planOnly = false } = {}, rec) {
  const P = CONFIG.PICTURE;
  const R = P.RUNWARE || {};
  const seed = Number(wantedSeed) || 1 + Math.floor(Math.random() * 2147483646);
  rec.seed = seed;
  const route = ledger && can({ env, ledger, level: nsfw }, "runware") ? "runware" : "cloudflare";
  const bytes = {};
  const lib = await loadLibrary(env); // the approved reference library (Step 4); [] without D1
  for (const r of pickRefs(spec, profile(route), lib)) bytes[r.name] = await refBytes(env, r.name);
  const plan = specPlan(spec, { route, bytesOf: (n) => bytes[n], fix, level: nsfw, lib });
  rec.lint = plan.lint;
  if (planOnly) {
    if (route === "runware") return { plan: plan.tries, spec, lint: plan.lint };
    // the studio draws on Runware: Cloudflare's references by the names it sends (the 2x face, the clothed body; body.jpg is its copy)
    const t = plan.tries[0];
    const studioName = (n) => (n === "face-1x" ? "face-2x" : n === "body-cloudflare" ? `body-${R.BODY_CLOTHED}` : n);
    return { plan: [], cloudflare: { prompt: t.text, refs: t.refs.map((r) => studioName(r.name)), width: t.width, height: t.height }, spec, lint: plan.lint };
  }
  if (route === "runware") {
    const transient = (e) => /\bRunware 5\d\d\b|unreachable or too slow/.test(String((e && e.message) || e));
    const tries = [...plan.tries];
    let extra = Math.max(0, Number(R.TRANSIENT_RETRIES) || 0);
    for (let i = 0; i < tries.length; i++) {
      const t = tries[i];
      rec.attempts++;
      Object.assign(rec, { model: t.model, prompt: t.text, refs: t.refs.map((r) => r.name), loras: t.loras.map((l) => ({ model: l.model, weight: l.weight })), width: t.width, height: t.height, steps: t.steps || null, cfg: t.cfg || null, scheduler: t.scheduler || "Default" });
      try {
        const trySeed = ((seed - 1 + rec.attempts - 1) % 2147483646) + 1;
        rec.seed = trySeed;
        const out = await drawRunware(env, t.model, t.text, t.refs.map((r) => (R.UUID_REFS && r.name.startsWith("lib:") ? { bytes: r.bytes, id: r.name.slice("lib:".length) } : r.bytes)), t.width, t.height, { loras: t.loras, seed: trySeed, steps: t.steps, cfg: t.cfg, acceleration: t.acceleration, scheduler: t.scheduler, checkContent: t.checkContent });
        const cost = out.cost || Number(R.USD_PER_PICTURE) || 0;
        spend(ledger, "rwUsd", cost);
        rec.cost = cost;
        return { bytes: out.bytes, model: t.model };
      } catch (e) {
        spend(ledger, "rwFailed", 1);
        await aiFailed(env, `drawing with ${t.model} (Runware): ${aiText_(e)}`);
        if (i === tries.length - 1 && extra > 0 && runwareRoute(nsfw) && transient(e) && can({ env, ledger, level: nsfw }, "runware")) {
          extra--;
          tries.push(t);
        }
      }
    }
  }
  if (ledger && runwareRoute(nsfw) && env.RUNWARE_API_KEY) {
    const e = new Error(`Runware didn't draw it (${can({ env, ledger, level: nsfw }, "runware") ? "every try failed" : "the day's Runware money is spent"}); at /nsfw ${nsfw} pictures are drawn on Runware only`);
    e.runwareOnly = true;
    throw e;
  }
  // Cloudflare klein 4B with the spec's references in order (face, body, place)
  const t = plan.tries[0];
  rec.attempts++;
  Object.assign(rec, { model: P.MODEL, prompt: t.text, refs: t.refs.map((r) => r.name), loras: [], width: t.width, height: t.height, steps: null, cfg: null });
  try {
    const form = new FormData();
    form.append("prompt", t.text);
    form.append("width", String(t.width));
    form.append("height", String(t.height));
    form.append("seed", String(seed));
    t.refs.forEach((r, i) => form.append(`input_image_${i}`, new Blob([r.bytes], { type: "image/jpeg" }), `${r.role}.jpg`));
    const packed = new Response(form);
    const out = await aiRun(env, P.MODEL, { multipart: { body: packed.body, contentType: packed.headers.get("content-type") } }, P.TIMEOUT_MS);
    return { bytes: await imageBytes(out), model: P.MODEL };
  } catch (e) {
    if (!P.BACKUP_MODEL || aiFiltered(e) || !aiUnavailable(e)) throw e;
    await aiFailed(env, `drawing with ${P.MODEL}: ${aiText_(e)}; used ${P.BACKUP_MODEL}`);
    const backupText = specPlan(spec, { route: "cloudflare", bytesOf: () => null, level: nsfw }).tries[0].text; // no references: from words
    rec.attempts++;
    Object.assign(rec, { model: P.BACKUP_MODEL, prompt: backupText, refs: [], width: t.width, height: t.height, steps: null, cfg: null });
    const out = await aiRun(env, P.BACKUP_MODEL, { prompt: backupText, steps: P.BACKUP_STEPS }, P.TIMEOUT_MS);
    return { bytes: await imageBytes(out), model: P.BACKUP_MODEL };
  }
}
// drawPicture's draw: the Runware tries (runwarePlan), then Cloudflare. `rec` keeps what was sent, for the log.
export async function drawPictureNow(env, prompt, { size = 0, width = size || CONFIG.PICTURE.WIDTH, height = size || CONFIG.PICTURE.HEIGHT, face = true, location = null, night = false, ledger = null, custom = false, fix = false, kind = custom ? "pic" : "", herself = true, seed: wantedSeed = 0, nsfw = CONFIG.PICTURE.NSFW.DEFAULT, planOnly = false } = {}, rec) {
  const P = CONFIG.PICTURE;
  const ref = face ? await faceBytes(env) : null;
  const body = ref ? bodyBytes() : null; // image 1, the place then follows as image 2
  // one seed per picture, sent to Runware and to klein on Cloudflare (a seed in the call: the same plan, another picture)
  const seed = Number(wantedSeed) || 1 + Math.floor(Math.random() * 2147483646);
  rec.seed = seed;
  // a fixed place: its reference picture (places.js; its night picture when dark) as the next image, and its LOOK
  // in words ({room})
  const L = location && (P.LOCATIONS || {})[location];
  const placeKey = night && placePictures(`${location}_night`).length ? `${location}_night` : location;
  const shown = L ? pickOne(placePictures(placeKey)) : "";
  const place = shown ? fromBase64(shown) : null;
  // `n`: the place picture's image number when the caller knows it (Runware: 1 when no body picture is sent, Step 5)
  const room = (withImage, rw = false, n = null) => (!L ? "" : (withImage && place ? (rw && P.RUNWARE.ROOM != null ? P.RUNWARE.ROOM : P.ROOM) : rw && P.RUNWARE.ROOM_TEXT != null ? P.RUNWARE.ROOM_TEXT : P.ROOM_TEXT) || "").replaceAll("{n}", String(n ?? (ref ? (body ? 2 : 1) : 0))).replace("{look}", (L && L.LOOK) || "");
  const who = (w, withImage, rw = false, n = null) => {
    if (!herself) w = ""; // /look without her: nobody's description
    // /pic: her face, but the hair (and the rest) he describes
    if (custom) w = String(w).replace("with exactly the same face and hair", (P.CUSTOM || {}).SAME_PERSON || "with exactly the same face");
    const p = String(prompt).replace("{room}", room(withImage, rw, n));
    return (p.includes("{who}") ? p.replace("{who}", w) : `${w} ${p}`).replace(/\s{2,}/g, " ").trim();
  };
  // Runware (PICTURE.ROUTE): the plan's tries in order, each drawn with the same seed. Its spend goes in ledger.rwUsd; when
  // every try fails, Cloudflare draws it. (no ledger: /face's portrait and /health stay on Cloudflare)
  // /look without her (`herself` false): klein 9B from words, then TwinFlow; her pictures: klein with her face, body and place
  if (ledger && can({ env, ledger, level: nsfw }, "runware")) {
    const R = P.RUNWARE;
    const rwFace = ref && R.BIG_FACE ? await faceBytes(env, true) : ref;
    const plan = runwarePlan(prompt, { herself, kind, ref, rwFace, faceName: rwFace === ref ? "face-1x" : "face-2x", place, placeName: shown ? `place:${placeKey}` : "", width, height, size, who, fix, level: nsfw });
    if (planOnly) return { plan: plan.tries };
    // At Nude and On a Runware failure means no picture (D1 row 705), so a 5xx or a timeout earns TRANSIENT_RETRIES more tries of the
    // last plan try (the next seed each time); any other error (a refusal, a bad request) is not retried
    const transient = (e) => /\bRunware 5\d\d\b|unreachable or too slow/.test(String((e && e.message) || e));
    const tries = [...plan.tries];
    let extra = Math.max(0, Number(R.TRANSIENT_RETRIES) || 0);
    for (let i = 0; i < tries.length; i++) {
      const t = tries[i];
      rec.attempts++;
      Object.assign(rec, { model: t.model, prompt: t.text, refs: t.refs.map((r) => r.name), loras: t.loras.map((l) => ({ model: l.model, weight: l.weight })), width: t.width, height: t.height, steps: t.steps || null, cfg: t.cfg || null });
      try {
        // a retry gets the next seed (the same seed could fail the same way); the log keeps the one last sent
        const trySeed = ((seed - 1 + rec.attempts - 1) % 2147483646) + 1;
        rec.seed = trySeed;
        const out = await drawRunware(env, t.model, t.text, t.refs.map((r) => r.bytes), t.width, t.height, { loras: t.loras, seed: trySeed, steps: t.steps, cfg: t.cfg, acceleration: t.acceleration, checkContent: t.checkContent });
        const cost = out.cost || Number(R.USD_PER_PICTURE) || 0;
        spend(ledger, "rwUsd", cost);
        rec.cost = cost;
        return { bytes: out.bytes, model: t.model };
      } catch (e) {
        spend(ledger, "rwFailed", 1); // failed Runware attempts today (/spend)
        await aiFailed(env, `drawing with ${t.model} (Runware): ${aiText_(e)}`);
        if (i === tries.length - 1 && extra > 0 && runwareRoute(nsfw) && transient(e) && can({ env, ledger, level: nsfw }, "runware")) {
          extra--;
          tries.push(t);
        }
      }
    }
  }
  // owner 2026-10-13: "cloudflare's klein 4b works only when /nsfw is off, when /nsfw is nude or on, generation goes to runware despite
  // of picture type": with a Runware key, a Nude/On picture Runware didn't draw (every try failed, or the day's RUNWARE.DAILY_USD is
  // spent) is not drawn at all. No ledger (/face, /health) and no key stay on Cloudflare.
  if (ledger && !planOnly && runwareRoute(nsfw) && env.RUNWARE_API_KEY) {
    const e = new Error(`Runware didn't draw it (${can({ env, ledger, level: nsfw }, "runware") ? "every try failed" : "the day's Runware money is spent"}); at /nsfw ${nsfw} pictures are drawn on Runware only`);
    e.runwareOnly = true;
    throw e;
  }
  // the studio's compose when Runware doesn't draw these words (/nsfw Off): the Cloudflare prompt, nothing drawn. Its references as the
  // studio names them: the 2x face (the studio draws on Runware) and the clothed body (body.jpg is its small copy)
  if (planOnly) {
    const R = P.RUNWARE;
    const cfText = cloudflareText(who(ref ? P.REFERENCE : P.LOOKS, true));
    return { plan: [], cloudflare: { prompt: cfText, refs: [ref && "face-2x", body && `body-${R.BODY_CLOTHED}`, place && placeKey && `place:${placeKey}`].filter(Boolean), width: Number(R.WIDTH) || width, height: Number(R.HEIGHT) || height } };
  }
  // Cloudflare: FLUX.2 klein with her references (face, body, place); FLUX.1 schnell from words when klein is unavailable
  // Step B: CRAFT only here (Runware has RUNWARE.PHOTO); every hand gets an owner (ownHands)
  const text = cloudflareText(who(ref ? P.REFERENCE : P.LOOKS, true));
  rec.attempts++;
  Object.assign(rec, { model: P.MODEL, prompt: text, refs: [ref && "face-1x", body && "body-cloudflare", place && placeKey && `place:${placeKey}`].filter(Boolean), loras: [], width, height, steps: null, cfg: null });
  try {
    const form = new FormData();
    form.append("prompt", text);
    form.append("width", String(width));
    form.append("height", String(height));
    form.append("seed", String(seed)); // klein takes a seed; schnell doesn't (5006)
    if (ref) form.append("input_image_0", new Blob([ref], { type: "image/jpeg" }), "face.jpg");
    if (body) form.append("input_image_1", new Blob([body], { type: "image/jpeg" }), "body.jpg");
    if (place) form.append(`input_image_${ref ? (body ? 2 : 1) : 0}`, new Blob([place], { type: "image/jpeg" }), "place.jpg");
    const packed = new Response(form); // serializes the form, with its boundary in the content type
    const out = await aiRun(env, P.MODEL, { multipart: { body: packed.body, contentType: packed.headers.get("content-type") } }, P.TIMEOUT_MS);
    return { bytes: await imageBytes(out), model: P.MODEL };
  } catch (e) {
    // a 3030 refusal stands: never redrawn by the backup
    if (!P.BACKUP_MODEL || aiFiltered(e) || !aiUnavailable(e)) throw e;
    await aiFailed(env, `drawing with ${P.MODEL}: ${aiText_(e)}; used ${P.BACKUP_MODEL}`);
    const backupText = cloudflareText(who(P.LOOKS, false));
    rec.attempts++;
    Object.assign(rec, { model: P.BACKUP_MODEL, prompt: backupText, refs: [], width, height, steps: null, cfg: null });
    const out = await aiRun(env, P.BACKUP_MODEL, { prompt: backupText, steps: P.BACKUP_STEPS }, P.TIMEOUT_MS);
    return { bytes: await imageBytes(out), model: P.BACKUP_MODEL };
  }
}
