// Builds places.js (imported by worker.js) from tools/face/places/<key>.jpg: one reference picture per fixed
// place in PICTURE.LOCATIONS, each under 512x512 (klein's limit). Run after adding or replacing a picture:
//   node tools/face/build-places.mjs
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const dir = new URL("./places/", import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith(".jpg")).sort();
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
  return `  ${JSON.stringify(f.replace(/\.jpg$/, ""))}: ${JSON.stringify(b.toString("base64"))},`;
});
writeFileSync(new URL("../../places.js", import.meta.url), `// Her fixed places (CONFIG.PICTURE.LOCATIONS in worker.js): base64 JPEGs under 512x512, drawn by
// tools/face (places.mjs) and built by tools/face/build-places.mjs. Never open this file: it is pictures.
export const PLACE_JPEG_BASE64 = {
${entries.join("\n")}
};
`);
console.log(`places.js: ${files.map((f) => f.replace(/\.jpg$/, "")).join(", ") || "none"}`);
