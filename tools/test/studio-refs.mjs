// The studio's References tab at a phone width (Rebuild Step 4 finish, 2026-10-16; by hand, not in check.mjs: CI has no browser):
// node tools/test/studio-refs.mjs [outDir]. Global Playwright + /opt/pw-browsers/chromium; page.route answers https://studio.test/**
// with STUDIO_HTML and fixtures (no Worker, D1 or Runware). Checks at 390 px: the tab opens and lists candidates, each card's picture
// sits above its text and fits the width, Approve / Reject send the right patch (with the key and tags typed), the first-batch and
// new-candidate buttons call their routes, the base list holds her face + approved pictures, no horizontal scroll, no console errors.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { STUDIO_HTML } from "../../src/studio/page.js";
const require = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require("playwright");
const out = process.argv[2] || "/tmp/studio-refs";
mkdirSync(out, { recursive: true });
let fails = 0;
const check = (ok, label, detail = "") => { if (!ok) fails++; console.log(ok ? "ok  " : "FAIL", label, ok ? "" : detail); };
const svg = (w, h, label) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#a98"/><text x="40" y="${h / 2}" font-size="120" fill="#fff">${label}</text></svg>`;
const ref = (id, kind, status, key) => ({ id, at: new Date().toISOString(), kind, key, tags: "casual", parent: "body-clothed", status, prompt: "the same body, now in a cream knit sweater and blue jeans, same pose, plain background, a long line that wraps on a phone", seed: 100 + id, cost: 0.0039 });
let rows = [ref(1, "outfit", "candidate", "cream knit sweater"), ref(2, "hair", "candidate", "long bangs"), ref(3, "outfit", "approved", "gray cardigan")];
const posts = [];
const options = { ok: true, models: [{ id: "klein", label: "klein 9B", model: "runware:400@2" }], loras: [], refs: [], bodies: [{ name: "body-clothed", label: "clothed body" }], sampler: { steps: 4, cfg: 1 }, defaultLoras: [],
  sizes: [{ label: "9:16", width: 768, height: 1344 }], levels: ["off", "nude", "on"], usdPerPicture: 0.003, cap: { dailyUsd: 1, spentUsd: 0, resultsMax: 4 } };

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
  if (u.pathname === "/studio/api/log") return json({ ok: true, rows: [], next: null });
  if (u.pathname === "/studio/api/presets") return json({ ok: true, presets: [] });
  if (u.pathname === "/studio/api/refs") {
    const st = u.searchParams.get("status"), kd = u.searchParams.get("kind");
    return json({ ok: true, refs: rows.filter((r) => (!st || r.status === st) && (!kd || r.kind === kd)) });
  }
  if (u.pathname.startsWith("/studio/api/refs/")) {
    const body = JSON.parse(route.request().postData() || "{}");
    posts.push({ path: u.pathname, body });
    if (u.pathname.endsWith("/set")) { rows = rows.map((r) => r.id === body.id ? { ...r, ...body } : r); return json({ ok: true }); }
    if (u.pathname.endsWith("/make")) { rows.push(ref(9, body.kind, "candidate", body.key)); return json({ ok: true, id: 9, cost: 0.0039, studioUsd: 0.0039 }); }
    if (u.pathname.endsWith("/batch")) return json({ ok: true, made: [1, 2, 3], errors: [] });
  }
  if (u.pathname.startsWith("/studio/ref/")) return route.fulfill({ contentType: "image/svg+xml", body: svg(768, 1344, u.pathname.slice(-6)) });
  return route.fulfill({ status: 404, body: "no" });
});
await page.goto("https://studio.test/studio");
await page.click("#tab-refs");
await page.waitForSelector("#rf-rows .row");
await page.waitForTimeout(300);
check((await page.locator("#rf-rows .row").count()) === 2, "candidates listed (2 of 3 rows)");
const box = (loc) => loc.evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom }; });
const card = page.locator("#rf-rows .row").first();
const img = await box(card.locator("img"));
const meta = await box(card.locator(".meta"));
check(img.b <= meta.y + 2, "card: picture above its text", `img bottom ${img.b.toFixed(0)}, text top ${meta.y.toFixed(0)}`);
check(img.w <= 390 && Math.abs(img.w / img.h - 768 / 1344) < 0.03, "card: picture fits the width and keeps its shape", `${img.w.toFixed(0)}x${img.h.toFixed(0)}`);
check(meta.w > 250, "card: text column is wide", `${meta.w.toFixed(0)} px`);
check((await page.evaluate(() => document.documentElement.scrollWidth)) <= 390, "no horizontal scroll at 390 px");
const bases = await page.locator("#rf-new-base option").allTextContents();
check(bases.length === 3 && /face/.test(bases[0]) && /clothed body/.test(bases[1]) && /gray cardigan/.test(bases[2]), "base list: her face, the body, the approved outfit", bases.join(" | "));
await page.screenshot({ path: `${out}/refs-390.png`, fullPage: true });

await card.locator("input[aria-label=key]").fill("cream sweater");
await card.getByRole("button", { name: "Approve" }).click();
await page.waitForTimeout(300);
const ap = posts.find((p) => p.path.endsWith("/set"));
check(ap && ap.body.id === 1 && ap.body.status === "approved" && ap.body.key === "cream sweater" && ap.body.tags === "casual", "Approve sends id, status, typed key and tags", JSON.stringify(ap));
check((await page.locator("#rf-rows .row").count()) === 1, "an approved candidate leaves the candidate list");
await page.selectOption("#rf-status", "approved");
await page.waitForTimeout(300);
check((await page.locator("#rf-rows .row").count()) === 2, "approved list shows 2");
await page.selectOption("#rf-status", "candidate");
await page.waitForTimeout(200);
await page.locator("#rf-rows .row").first().getByRole("button", { name: "Reject" }).click();
await page.waitForTimeout(300);
check(posts.filter((p) => p.path.endsWith("/set")).pop().body.status === "rejected", "Reject sends status rejected");
await page.fill("#rf-new-change", "the same body, in a red dress");
await page.fill("#rf-new-key", "red dress");
await page.click("#rf-make");
await page.waitForTimeout(300);
const mk = posts.find((p) => p.path.endsWith("/make"));
check(mk && mk.body.kind === "outfit" && mk.body.base === "face-2x" && mk.body.change.includes("red dress") && mk.body.key === "red dress", "Draw a candidate sends kind, base, change, key", JSON.stringify(mk));
await page.click("#rf-batch");
await page.waitForTimeout(300);
check(posts.some((p) => p.path.endsWith("/batch")), "first batch calls its route");
check((await page.evaluate(() => document.documentElement.scrollWidth)) <= 390, "no horizontal scroll after actions");
check(errors.length === 0, "no console errors", errors.join(" / "));
await browser.close();
console.log(fails ? `${fails} FAILED` : "all ok");
process.exit(fails ? 1 : 0);
