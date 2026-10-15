// Refreshes the default values inside tools/settings-panel.html from CONFIG (src/config: the engine's settings + the persona's).
// Run after changing CONFIG:  node tools/build-panel.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG } from "../src/config/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const panel = join(root, "tools", "settings-panel.html");
const html = readFileSync(panel, "utf8");
const json = JSON.stringify(CONFIG).replace(/</g, "\\u003c");
if (!/^const DEFAULTS = .*;$/m.test(html)) throw new Error("couldn't find the DEFAULTS line in settings-panel.html");
writeFileSync(panel, html.replace(/^const DEFAULTS = .*;$/m, () => `const DEFAULTS = ${json};`));
console.log("tools/settings-panel.html now matches CONFIG");
