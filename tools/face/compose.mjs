// The prompt and reference pictures of one picture, exactly as drawPicture (worker.js) sends them to klein:
// {who} = REFERENCE (her face is image 0, her body tools/face/body.jpg image 1), {room} = ROOM with the place's picture as the next image when
// tools/face/places/<key>.jpg exists, else ROOM_TEXT. Used by shots.mjs and examples.mjs.
import { existsSync, readdirSync } from "node:fs";

// The place picture is one of its crops (places/views/<key>~N.jpg) when it has them, as drawPicture picks one
export function forKlein(W, pic) {
  const P = W.CONFIG.PICTURE;
  const L = pic.location && P.LOCATIONS[pic.location];
  const crops = L && existsSync("tools/face/places/views") ? readdirSync("tools/face/places/views").filter((f) => f.startsWith(`${pic.location}~`)) : [];
  const file = L && (crops.length ? `tools/face/places/views/${crops[Math.floor(Math.random() * crops.length)]}` : `tools/face/places/${pic.location}.jpg`);
  const withImage = !!(file && existsSync(file));
  const body = existsSync("tools/face/body.jpg") ? ["tools/face/body.jpg"] : []; // image 1, as in drawPicture
  const room = !L ? "" : (withImage ? P.ROOM : P.ROOM_TEXT).replaceAll("{n}", String(1 + body.length)).replace("{look}", L.LOOK);
  const prompt = pic.prompt.replace("{room}", room).replace("{who}", P.REFERENCE).replace(/\s{2,}/g, " ").trim();
  return { prompt, refs: [...body, ...(withImage ? [file] : [])] };
}
