// The prompt and reference pictures of one picture, exactly as drawPicture (worker.js) sends them to klein:
// {who} = REFERENCE (her face is image 0, her body tools/face/body.jpg image 1), {room} = ROOM with the place's picture as the next image when
// tools/face/places/<key>.jpg exists, else ROOM_TEXT. Used by shots.mjs and examples.mjs.
import { existsSync } from "node:fs";

// `view`: one of ROOM_VIEWS for ROOM's {view} (drawPicture picks one at random)
export function forKlein(W, pic, view = null) {
  const P = W.CONFIG.PICTURE;
  const L = pic.location && P.LOCATIONS[pic.location];
  const file = L && `tools/face/places/${pic.location}.jpg`;
  const withImage = !!(file && existsSync(file));
  const body = existsSync("tools/face/body.jpg") ? ["tools/face/body.jpg"] : []; // image 1, as in drawPicture
  const v = view || (P.ROOM_VIEWS || [])[Math.floor(Math.random() * (P.ROOM_VIEWS || []).length)] || "";
  const room = !L ? "" : (withImage ? P.ROOM : P.ROOM_TEXT).replace("{view}", v).replaceAll("{n}", String(1 + body.length)).replace("{look}", L.LOOK);
  const prompt = pic.prompt.replace("{room}", room).replace("{who}", P.REFERENCE).replace(/\s{2,}/g, " ").trim();
  return { prompt, refs: [...body, ...(withImage ? [file] : [])] };
}
