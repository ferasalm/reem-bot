// Reference picture bytes: face, bodies, places, styles.
import {
  BODY_BACK_JPEG_BASE64, BODY_CLOTHED_JPEG_BASE64, BODY_JPEG_BASE64, BODY_NUDE_JPEG_BASE64, FACE_2X_JPEG_BASE64,
  FACE_JPEG_BASE64, STYLE_JPEG_BASE64,
} from "../../assets/face.js";
import { PLACE_JPEG_BASE64 } from "../../assets/places.js";
import { fromBase64 } from "../platform/http.js";

/* --- her reference face --- */

// The face every picture is drawn from: /face keep (KV) first, else the one built into face.js
// Her body shape (face.js BODY_JPEG_BASE64: a Nano Banana picture of the figure, face out of frame): image 1 of every
// picture drawn from her face, so her softly curvy figure and soft narrow shoulders don't depend on words alone
export const bodyBytes = () => (BODY_JPEG_BASE64 ? fromBase64(BODY_JPEG_BASE64) : null);
// A body picture by its RUNWARE.BODY* name: v13 / v13-back (nude), v13-clothed (black bra and briefs): the owner's second set of 2026-10-15
export function runwareBodyBytes(name) {
  const pics = { "v13": BODY_NUDE_JPEG_BASE64, "v13-back": BODY_BACK_JPEG_BASE64, "v13-clothed": BODY_CLOTHED_JPEG_BASE64 };
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
  if (name.startsWith("body-")) return runwareBodyBytes(name.slice("body-".length));
  if (name.startsWith("place:")) {
    const crops = placePictures(name.slice("place:".length));
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
