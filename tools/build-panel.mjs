// Refreshes the default values inside tools/settings-panel.html from CONFIG in worker.js.
// Run after changing CONFIG:  node tools/build-panel.mjs
import { readFileSync, writeFileSync, mkdtempSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "worker.js"), "utf8").replace(/^export default \{/m, "const worker = {");
const copy = join(mkdtempSync(join(tmpdir(), "reem-")), "worker.mjs");
writeFileSync(copy, `${source}\nexport { CONFIG };\n`);
copyFileSync(join(root, "face.js"), join(dirname(copy), "face.js")); // worker.js imports it
copyFileSync(join(root, "places.js"), join(dirname(copy), "places.js"));
copyFileSync(join(root, "mp3.js"), join(dirname(copy), "mp3.js"));
copyFileSync(join(root, "studio.js"), join(dirname(copy), "studio.js")); // worker.js imports it (Step 7)
const { CONFIG } = await import(pathToFileURL(copy).href);

const panel = join(root, "tools", "settings-panel.html");
const html = readFileSync(panel, "utf8");
const json = JSON.stringify(CONFIG).replace(/</g, "\\u003c");
if (!/^const DEFAULTS = .*;$/m.test(html)) throw new Error("couldn't find the DEFAULTS line in settings-panel.html");
writeFileSync(panel, html.replace(/^const DEFAULTS = .*;$/m, () => `const DEFAULTS = ${json};`));
console.log("tools/settings-panel.html now matches worker.js");
