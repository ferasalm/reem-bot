// Step 7 fix round (docs/WORKPLAN.md, 2026-10-11): the /studio link opened from another site, in Chromium. By hand, not in
// check.mjs (CI has no browser). Run: node tools/test/studio-browser.mjs [outDir]  (exits 1 on any failed check).
// The worker's fetch runs behind an https server on 127.0.0.1 (production is https: Secure cookies are sent only there), with a
// self-signed certificate made by openssl into outDir. A fake env: KV in memory, an empty D1, the owner's chat "1".
// The link is clicked on a page served from https://localhost: another site, as a link opened from Telegram is, so SameSite
// cookies are not sent on the way in. Then: the page loads, its API answers, the reload works, a fresh browser is 404.
import { createServer } from "node:https";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { loadWorker } from "./load-worker.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/node22/lib/node_modules/playwright");
const OUT = process.argv[2] || mkdtempSync(join(tmpdir(), "studio-browser-"));

// A self-signed certificate for localhost and 127.0.0.1 (the browser is told to accept it)
execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", join(OUT, "key.pem"), "-out", join(OUT, "cert.pem"), "-days", "2", "-subj", "/CN=localhost", "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1"], { stdio: "ignore" });
const tls = { key: readFileSync(join(OUT, "key.pem")), cert: readFileSync(join(OUT, "cert.pem")) };

const W = await loadWorker();
const kv = new Map();
const env = {
  TELEGRAM_BOT_TOKEN: "test",
  OWNER_ID: "1",
  REEM_KV: { get: async (key) => (kv.has(key) ? kv.get(key) : null), put: async (key, value) => void kv.set(key, value) },
  STUDIO_DB: emptyD1(),
};
const ctx = { waitUntil() {}, passThroughOnException() {} };

// A D1 stub with no rows: the studio's schema statements run, its selects answer nothing
function emptyD1() {
  const stmt = () => {
    const s = {
      bind: () => s,
      run: async () => ({ results: [], meta: {} }),
      all: async () => ({ results: [] }),
      first: async () => null,
    };
    return s;
  };
  return { prepare: stmt, batch: async (list) => Promise.all(list.map((s) => s.run())) };
}

// The worker behind node:https (the Request is rebuilt from the socket; Set-Cookie is kept whole)
const studio = createServer(tls, async (req, res) => {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (!["host", "connection", "content-length"].includes(k)) headers.set(k, String(v));
  const request = new Request(`https://127.0.0.1:${studio.address().port}${req.url}`, { method: req.method, headers });
  const response = await W.default.fetch(request, env, ctx);
  const out = {};
  response.headers.forEach((v, k) => {
    if (k !== "set-cookie") out[k] = v;
  });
  if (response.headers.getSetCookie().length) out["set-cookie"] = response.headers.getSetCookie();
  res.writeHead(response.status, out);
  res.end(Buffer.from(await response.arrayBuffer()));
});
await new Promise((ok) => studio.listen(0, "127.0.0.1", ok));
const PORT = studio.address().port;
const token = await W.studioToken(env, "1");
const LINK = `https://127.0.0.1:${PORT}/studio?t=${token}`;

// The "chat" page on another site: localhost is a different site from 127.0.0.1
const chat = createServer(tls, (req, res) => {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Chat</title><p>Reem sent you a link.</p><a id="studio-link" href="${LINK}">Open the studio</a>`);
});
await new Promise((ok) => chat.listen(0, "localhost", ok));
const CHAT_URL = `https://localhost:${chat.address().port}/`;

let failed = 0;
const check = (name, cond, detail = "") => {
  if (cond) console.log(`ok   ${name}`);
  else {
    failed++;
    console.log(`FAIL ${name}${detail ? `\n     ${detail}` : ""}`);
  }
};

// Every response of the studio (documents and its API), with the headers that decide the cookie and the redirect.
// Playwright's headers() leaves out Set-Cookie, so the list comes from allHeaders() (read before any check: settle())
function watch(page) {
  const seen = [];
  const errors = [];
  const pending = [];
  page.on("response", (r) => {
    const u = new URL(r.url());
    if (u.pathname.startsWith("/studio")) {
      pending.push(
        r.allHeaders().then((h) => seen.push({ path: u.pathname + u.search, status: r.status(), location: h.location || "", setCookie: h["set-cookie"] || "" })),
      );
    }
  });
  // The browser asks for /favicon.ico by itself (the page has no icon; the Worker answers 404 to it, and the CSP refuses a data: icon)
  page.on("console", (m) => {
    const url = m.location().url || "";
    if (m.type() === "error" && !url.endsWith("/favicon.ico")) errors.push(`${m.text()} (${url || "no url"})`);
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  return { seen, errors, settle: async () => (await Promise.all(pending), seen) };
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true };
try {
  // 1. The link clicked from the chat page (another site)
  const telegram = await browser.newContext(phone);
  const page = await telegram.newPage();
  const log = watch(page);
  await page.goto(CHAT_URL);
  await Promise.all([page.waitForURL(/127\.0\.0\.1/, { waitUntil: "load" }).catch(() => {}), page.click("#studio-link")]);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(800);
  const seen = await log.settle();
  const afterClick = new URL(page.url());
  const bodyText = (await page.locator("body").innerText().catch(() => "")).slice(0, 120).replace(/\s+/g, " ");
  console.log(`seen after the click: ${JSON.stringify(seen)}`);
  console.log(`url after the click: ${afterClick.pathname}${afterClick.search}; title "${await page.title()}"; body: "${bodyText}"`);
  console.log(`cookies after the click: ${JSON.stringify((await telegram.cookies()).map((c) => ({ name: c.name, path: c.path, sameSite: c.sameSite, httpOnly: c.httpOnly, secure: c.secure })))}`);
  const first = seen.find((s) => s.path.startsWith("/studio?t="));
  check("the link's first visit answers 200 (no redirect)", !!first && first.status === 200 && !first.location, JSON.stringify(first));
  check("the link's first visit sets the cookie (SameSite=Lax, Path=/studio, HttpOnly, Secure)", !!first && /^studio=/.test(first.setCookie) && /SameSite=Lax/.test(first.setCookie) && /Path=\/studio/.test(first.setCookie) && /HttpOnly/.test(first.setCookie) && /Secure/.test(first.setCookie), first ? first.setCookie : "");
  check("the page opened (the studio's title and tabs)", (await page.title()) === "Picture studio" && (await page.locator("#tab-log").count()) === 1, `title "${await page.title()}"`);
  check("the token leaves the address bar (/studio, no ?t=)", afterClick.pathname === "/studio" && afterClick.search === "", `${afterClick.pathname}${afterClick.search}`);
  const options = seen.find((s) => s.path === "/studio/api/options");
  const logApi = seen.find((s) => s.path.startsWith("/studio/api/log"));
  check("/studio/api/options answers 200", !!options && options.status === 200, JSON.stringify(options));
  check("/studio/api/log answers 200", !!logApi && logApi.status === 200, JSON.stringify(logApi));
  check("no console errors or page errors", log.errors.length === 0, log.errors.join(" | "));
  await page.screenshot({ path: join(OUT, "studio-390x844.png") });
  console.log(`screenshot: ${join(OUT, "studio-390x844.png")}`);

  // 2. A reload without ?t= (same site now)
  const reloaded = await page.reload({ waitUntil: "load" }).catch(() => null);
  await page.waitForTimeout(500);
  const after = (await log.settle()).filter((s) => s.path === "/studio").pop();
  check("a reload without ?t= still opens the studio", !!reloaded && reloaded.status() === 200 && (await page.locator("#tab-log").count()) === 1, JSON.stringify(after));
  await telegram.close();

  // 3. A fresh browser (no cookie): /studio is 404, and so is a bad token
  const stranger = await browser.newContext(phone);
  const bare = await stranger.newPage();
  const bareResponse = await bare.goto(`https://127.0.0.1:${PORT}/studio`);
  check("a fresh browser without the cookie gets 404", bareResponse.status() === 404 && (await bareResponse.text()) === "not found", `status ${bareResponse.status()}`);
  const bad = await bare.goto(`https://127.0.0.1:${PORT}/studio?t=${token.slice(0, -2)}xx`);
  check("a bad token is 404 (no cookie set)", bad.status() === 404 && !(await stranger.cookies()).some((c) => c.name === "studio"), `status ${bad.status()}`);
  await stranger.close();
} finally {
  await browser.close();
  studio.close();
  chat.close();
}
console.log(failed ? `${failed} check(s) failed` : "studio browser: all checks ok");
process.exit(failed ? 1 : 0);
