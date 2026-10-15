// Builds places.js (imported by worker.js) from tools/face/places/<key>.jpg: one reference picture per fixed
// place in PICTURE.LOCATIONS, each under 512x512 (klein's limit). A place with crops in places/views/<key>~N.jpg
// (three parts of the room: klein copies a whole room picture's framing, owner 2026-10-05) gets the crops instead.
// Run after adding or replacing a picture (and its crops, see places/views/README.md):
//   node tools/face/build-places.mjs
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const dir = new URL("./places/", import.meta.url);
const views = new URL("./places/views/", import.meta.url);
const crops = readdirSync(views).filter((f) => f.endsWith(".jpg")).sort();
const files = readdirSync(dir).filter((f) => f.endsWith(".jpg")).sort()
  .flatMap((f) => {
    const mine = crops.filter((c) => c.startsWith(`${f.replace(/\.jpg$/, "")}~`));
    return mine.length ? mine.map((c) => `views/${c}`) : [f];
  });
const entries = files.map((f) => {
  const b = readFileSync(new URL(f, dir));
  // JPEG size from its SOF marker: refuse anything klein would reject
  for (let i = 2; i < b.length - 8;) {
    const marker = b[i + 1], len = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      const h = b.readUInt16BE(i + 5), w = b.readUInt16BE(i + 7);
      if (w >= 512 || h >= 512) throw new Error(`${f} is ${w}x${h}: klein needs under 512x512`);
      break;
    }
    i += 2 + len;
  }
  return `  ${JSON.stringify(f.replace(/^views\//, "").replace(/\.jpg$/, ""))}: ${JSON.stringify(b.toString("base64"))},`;
});
writeFileSync(new URL("../../assets/places.js", import.meta.url), `// Her fixed places (CONFIG.PICTURE.LOCATIONS in worker.js): base64 JPEGs under 512x512, drawn by
// tools/face (places.mjs) and built by tools/face/build-places.mjs. Never open this file: it is pictures.
export const PLACE_JPEG_BASE64 = {
${entries.join("\n")}
};
`);
console.log(`places.js: ${files.map((f) => f.replace(/^views\//, "").replace(/\.jpg$/, "")).join(", ") || "none"}`);
