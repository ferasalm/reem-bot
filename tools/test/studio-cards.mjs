// The studio page at a phone width (Rebuild Step 0, 2026-10-15; by hand, not in check.mjs: CI has no browser):
// node tools/test/studio-cards.mjs [outDir]. The global Playwright + /opt/pw-browsers/chromium; page.route answers
// https://studio.test/** with STUDIO_HTML and fixtures (no Worker, D1 or Runware). Checks at 390 px, with 1:1, 9:16 and 16:9 pictures:
//  - Generate's result cards: the picture sits above its text, is not stretched, the text column is as wide as the card;
//  - the Log's thumbnails keep each picture's shape (never cropped); no horizontal scroll; no console errors.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { STUDIO_HTML } from "../../studio.js";
const require = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require("playwright");
const out = process.argv[2] || "/tmp/studio-cards";
mkdirSync(out, { recursive: true });
let fails = 0;
const check = (ok, label, detail = "") => { if (!ok) fails++; console.log(ok ? "ok  " : "FAIL", label, ok ? "" : detail); };

const SHAPES = { 1: [1024, 1024], 2: [768, 1344], 3: [1344, 768] }; // row / picture id -> width, height
const svg = (w, h, label) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#8aa"/><text x="40" y="${h / 2}" font-size="${Math.round(w / 8)}" fill="#fff">${label}</text></svg>`;
const row = (id, shape) => ({ id, at: new Date().toISOString(), source: "pic", kind: "clothed", nsfw: "on", ok: 1, model: "runware:400@2", width: SHAPES[shape][0], height: SHAPES[shape][1], steps: 4, cfg: 1, seed: 1000 + id, cost: 0.0031,
  loras: "[]", refs: "[]", prompt: "A long prompt that wraps across several lines on a phone, with her kitchen and a gray cardigan and soft light", asked: "in the kitchen" });
const options = { ok: true, models: [{ id: "klein", label: "klein 9B", model: "runware:400@2" }], loras: [], refs: [], bodies: [], sampler: { steps: 4, cfg: 1 }, defaultLoras: [],
  sizes: [{ label: "9:16", width: 768, height: 1344 }, { label: "1:1", width: 1024, height: 1024 }, { label: "16:9", width: 1344, height: 768 }], levels: ["off", "nude", "on"], usdPerPicture: 0.003, cap: { dailyUsd: 1, spentUsd: 0, resultsMax: 4 } };

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));
await page.route("https://studio.test/**", async (route) => {
  const u = new URL(route.request().url());
  const json = (o) => route.fulfill({ contentType: "application/json", body: JSON.stringify(o) });
  if (u.pathname === "/studio") return route.fulfill({ contentType: "text/html", body: STUDIO_HTML });
  if (u.pathname === "/studio/api/options") return json(options);
  if (u.pathname === "/studio/api/log") return json({ ok: true, rows: [row(1, 1), row(2, 2), row(3, 3)], next: null });
  if (u.pathname === "/studio/api/presets") return json({ ok: true, presets: [] });
  if (u.pathname === "/studio/api/draw") return json({ ok: true, studioUsd: 0.01, cap: 1, pictures: [1, 2, 3].map((id) => ({ id: 10 + id, seed: 2000 + id, cost: 0.0031 })) });
  const m = /^\/studio\/img\/(\d+)$/.exec(u.pathname);
  if (m) { const id = Number(m[1]) % 10; return route.fulfill({ contentType: "image/svg+xml", body: svg(...SHAPES[id], `#${m[1]}`) }); }
  return route.fulfill({ status: 404, body: "no" });
});
await page.goto("https://studio.test/studio");
await page.waitForSelector(".row .thumb");
await page.waitForTimeout(300);

const box = (loc) => loc.evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom }; });
// Log: each thumbnail has its picture's shape
const thumbs = page.locator("#log-list .thumb, .row .thumb");
const n = await thumbs.count();
for (let i = 0; i < Math.min(n, 3); i++) {
  const b = await box(thumbs.nth(i));
  const [w, h] = SHAPES[i + 1];
  check(Math.abs(b.w / b.h - w / h) < 0.03 * (w / h), `Log thumbnail ${i + 1} (${w}x${h}) keeps its shape`, `${b.w.toFixed(0)}x${b.h.toFixed(0)}`);
}
check((await page.evaluate(() => document.documentElement.scrollWidth)) <= 390, "Log: no horizontal scroll at 390 px");
await page.screenshot({ path: `${out}/log-390.png`, fullPage: true });

// Editor: Generate three results (1:1, 9:16, 16:9)
await page.click("#tab-editor");
await page.fill("#ed-prompt", "a prompt");
await page.click("#ed-draw");
await page.waitForSelector("#ed-results .row");
await page.waitForTimeout(300);
const cards = page.locator("#ed-results .row");
check((await cards.count()) === 3, "three result cards");
for (let i = 0; i < 3; i++) {
  const card = cards.nth(i);
  const img = await box(card.locator("img.full"));
  const meta = await box(card.locator(".meta"));
  const cardBox = await box(card);
  const [w, h] = SHAPES[i + 1];
  check(Math.abs(img.w / img.h - w / h) < 0.02 * (w / h), `result ${i + 1} (${w}x${h}): the picture is not stretched`, `${img.w.toFixed(0)}x${img.h.toFixed(0)}`);
  check(meta.y >= img.b - 1, `result ${i + 1}: the text sits below the picture`, `meta.y ${meta.y.toFixed(0)} img.bottom ${img.b.toFixed(0)}`);
  check(meta.w >= cardBox.w - 40, `result ${i + 1}: the text column is the card's width, not a sliver`, `${meta.w.toFixed(0)} of ${cardBox.w.toFixed(0)}`);
  const head = await box(card.locator(".head"));
  check(head.h < 60, `result ${i + 1}: the head line is one or two lines, not vertical`, `${head.h.toFixed(0)} px`);
}
check((await page.evaluate(() => document.documentElement.scrollWidth)) <= 390, "Editor: no horizontal scroll at 390 px");
await page.locator("#ed-results").screenshot({ path: `${out}/results-390.png` });
check(errors.length === 0, "no console errors", errors.join(" | "));
await browser.close();
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
