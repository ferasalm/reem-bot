// Reference picture bytes: face, bodies, places, styles.
import {
  BODY_BACK_JPEG_BASE64, BODY_CLOTHED_JPEG_BASE64, BODY_JPEG_BASE64, BODY_NUDE_JPEG_BASE64, BODY_SIDE_JPEG_BASE64, FACE_2X_JPEG_BASE64,
  FACE_JPEG_BASE64, STYLE_JPEG_BASE64,
} from "../../assets/face.js";
import { PLACE_JPEG_BASE64 } from "../../assets/places.js";
import { CONFIG } from "../config/index.js";
import { fromBase64 } from "../platform/http.js";
import { libName, libraryBytes, matchRef } from "./library.js";

/* --- her reference face --- */

// The face every picture is drawn from: /face keep (KV) first, else the one built into face.js
// Her body shape (face.js BODY_JPEG_BASE64: a Nano Banana picture of the figure, face out of frame): image 1 of every
// picture drawn from her face, so her softly curvy figure and soft narrow shoulders don't depend on words alone
export const bodyBytes = () => (BODY_JPEG_BASE64 ? fromBase64(BODY_JPEG_BASE64) : null);
// A body picture by its RUNWARE.BODY* name: v15 / v15-back (nude), v15-side (nude side view), v15-clothed (black bra and briefs): the owner's sets of 2026-10-17, skin warmed
export function runwareBodyBytes(name) {
  const pics = { "v15": BODY_NUDE_JPEG_BASE64, "v15-back": BODY_BACK_JPEG_BASE64, "v15-side": BODY_SIDE_JPEG_BASE64, "v15-clothed": BODY_CLOTHED_JPEG_BASE64 };
  const b64 = pics[name] || BODY_JPEG_BASE64;
  return b64 ? fromBase64(b64) : null;
}
// `big`: the 2x reference (Runware, RUNWARE.BIG_FACE) unless /face stored another face
export async function faceBytes(env, big = false) {
  const kv = env.REEM_KV && (await env.REEM_KV.get("face").catch(() => null));
  const b64 = kv || (big && FACE_2X_JPEG_BASE64) || FACE_JPEG_BASE64;
  return b64 ? fromBase64(b64) : null;
}
// Image bytes from whatever an image model answered ({ image: base64 }, a stream, bytes)
export async function imageBytes(out) {
  const b64 = out && (typeof out.image === "string" ? out.image : out.result && out.result.image);
  if (typeof b64 === "string") return fromBase64(b64);
  if (out instanceof Uint8Array) return out;
  if (out instanceof ArrayBuffer || (typeof ReadableStream !== "undefined" && out instanceof ReadableStream)) {
    return new Uint8Array(await new Response(out).arrayBuffer());
  }
  throw new Error("the image model returned no image");
}
export async function refBytes(env, name) {
  if (name === "face-1x" || name === "face-2x") return faceBytes(env, name === "face-2x");
  if (name === "body-cloudflare") return bodyBytes();
  if (name.startsWith("lib:")) return libraryBytes(env, name.slice("lib:".length)); // the reference library (approved or a candidate the studio is showing)
  if (name.startsWith("body-")) return runwareBodyBytes(name.slice("body-".length));
  if (name.startsWith("place:")) {
    // an exact picture ("kitchen~2", the picture core's crop) or a place's first crop
    const key = name.slice("place:".length);
    const exact = (PLACE_JPEG_BASE64 || {})[key];
    const crops = exact ? [exact] : placePictures(key);
    return crops.length ? fromBase64(crops[0]) : null;
  }
  if (name.startsWith("style:")) {
    const b64 = (STYLE_JPEG_BASE64 || {})[name.slice("style:".length)];
    return b64 ? fromBase64(b64) : null;
  }
  return null;
}
// A place's pictures in places.js (base64): its crops "<key>~1".. when it has them, else "<key>" itself; [] when none
export function placePictures(key) {
  const pics = PLACE_JPEG_BASE64 || {};
  const crops = Object.keys(pics).filter((k) => k.startsWith(`${key}~`)).map((k) => pics[k]);
  return crops.length ? crops : pics[key] ? [pics[key]] : [];
}
// A place's picture names in places.js: its crops "<key>~1".. when it has them, else "<key>" itself; [] when none (placePictures' order)
export function placeNames(key) {
  const pics = PLACE_JPEG_BASE64 || {};
  const crops = Object.keys(pics).filter((k) => k.startsWith(`${key}~`));
  return crops.length ? crops : pics[key] ? [key] : [];
}
// The picture core's references (Rebuild Step 2, WORKPLAN "Reference library" slots; Runware takes at most 4): 0 her face (none on a
// crotch close-up: her face pulled the frame up to her lips, Step 5), 1 the body (clothed pictures the clothed body, never the nude one
// (owner 2026-10-15: with the LoRA it forced nudity); nude, partly dressed and acts the nude front or back; Cloudflare its small clothed
// copy), 2 the place crop, 3 the hairstyle picture. Cut to the profile's count. [{ role, name }]
// `lib` (Step 4): the approved library entries (loadLibrary). On Runware a clothed front view whose clothes match an approved outfit takes
// that outfit's picture as image 1 instead of the body picture (the outfit pictures are drawn from the faceless clothed body, so the
// build is the same); a hairstyle that matches an approved hair picture takes slot 3. No match, or no library: exactly as before.
export function pickRefs(spec, prof, lib = []) {
  const R = CONFIG.PICTURE.RUNWARE || {};
  if (!spec.herself) return [];
  const out = [];
  const cf = prof.name === "cloudflare";
  if (!(spec.view === "closeup" && spec.framing === "crotch")) out.push({ role: "face", name: !cf && R.BIG_FACE ? "face-2x" : "face-1x" });
  // a nude, partly dressed or act picture seen from the side (spec.profile, PROFILE_WORDS) takes the side view facing that way (owner 2026-10-17)
  const sides = String(R.BODY_SIDES || "").split(",").map((s) => s.trim()).filter(Boolean);
  const side = !spec.back && spec.profile && sides.length ? sides[spec.profile === "right" && sides[1] ? 1 : 0] : "";
  const body = cf ? "body-cloudflare" : spec.content === "clothed" ? `body-${R.BODY_CLOTHED || R.BODY}` : `body-${(spec.back && R.BODY_BACK) || side || R.BODY}`;
  const outfit = !cf && spec.content === "clothed" && !spec.back ? matchRef(lib, "outfit", spec.outfit.words || spec.outfit.key) : null;
  if (outfit) out.push({ role: "outfit", name: libName(outfit.id) });
  else out.push({ role: "body", name: body });
  if (spec.place.crop) out.push({ role: "place", name: `place:${spec.place.crop}` });
  const hair = spec.hair.refId ? { name: spec.hair.refId } : !cf && spec.hair.key ? matchRef(lib, "hair", spec.hair.key) : null;
  if (hair) out.push({ role: "hair", name: hair.name || libName(hair.id) });
  return out.slice(0, prof.refs);
}
