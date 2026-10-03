// The prompt and reference pictures of one picture, exactly as drawPicture (worker.js) sends them to klein:
// {who} = REFERENCE (her face is image 0), {room} = ROOM with the place's picture as image 1 when
// tools/face/places/<key>.jpg exists, else ROOM_TEXT. Used by shots.mjs and examples.mjs.
import { existsSync } from "node:fs";

export function forKlein(W, pic) {
  const P = W.CONFIG.PICTURE;
  const L = pic.location && P.LOCATIONS[pic.location];
  const file = L && `tools/face/places/${pic.location}.jpg`;
  const withImage = !!(file && existsSync(file));
  const room = !L ? "" : (withImage ? P.ROOM : P.ROOM_TEXT).replace("{n}", "1").replace("{look}", L.LOOK);
  const prompt = pic.prompt.replace("{room}", room).replace("{who}", P.REFERENCE).replace(/\s{2,}/g, " ").trim();
  return { prompt, refs: withImage ? [file] : [] };
}
