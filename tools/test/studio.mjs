// Step 7 tests (docs/WORKPLAN.md): the /studio link and cookie, the owner-only /studio command, the editor's compose (the golden
// "/pic messy bun on the porch" case: the same clock and seeded Math.random as picture-plans.mjs), the studio's draw with
// Runware stubbed (a log row and a kept picture per picture; the money cap), the log's paging and source filter, the pictures,
// the editor's lists, and the page's script. Run: node tools/test/studio.mjs (exits 1 on any failure).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadWorker } from "./load-worker.mjs";

// The clock and Math.random as tools/test/picture-plans.mjs sets them (the golden case below depends on both)
const FROZEN = Date.parse("2026-10-11T18:00:00Z"); // 14:00 in Boston
let frozen = FROZEN;
const RealDate = Date;
class FrozenDate extends RealDate {
  constructor(...args) {
    if (args.length) super(...args);
    else super(frozen);
  }
  static now() {
    return frozen;
  }
}
globalThis.Date = FrozenDate;
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = await loadWorker();
W.CONFIG.PICTURE.WRITER.ON = false; // the picture writer (Step C) is tested in scenarios
W.CONFIG.PICTURE.ANATOMY.ON = false; // the anatomy check (Step D) is tested in unit
const TOKEN = "123456:studio-test";
const NOW = FROZEN;
const TINY = Buffer.from("fake jpeg bytes").toString("base64");

// The fetch stub: Runware answers `numberResults` pictures per task; Telegram answers getFile and file downloads
const calls = [];
let uploads = 0; // imageUpload tasks answered (the UUID cache test)
let staleUuids = false; // Runware no longer knows the cached UUIDs
globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  calls.push({ url: u, body: init.body });
  const json = (body) => new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
  if (u === "https://api.runware.ai/v1") {
    const tasks = JSON.parse(init.body);
    if (tasks[0].taskType === "imageUpload") return json({ data: [{ taskType: "imageUpload", taskUUID: tasks[0].taskUUID, imageUUID: `uuid-${++uploads}` }] });
    if (staleUuids && (tasks[0].inputs?.referenceImages || []).some((r) => /^uuid-/.test(r))) return json({ errors: [{ code: "invalidImageUUID", message: "invalid image uuid" }] });
    const data = tasks.flatMap((t) => Array.from({ length: t.numberResults || 1 }, () => ({ taskUUID: t.taskUUID, imageBase64Data: TINY, cost: 0.0025 })));
    return json({ data, errors: [] });
  }
  if (u.includes("/getFile")) return json({ ok: true, result: { file_path: "photos/file_1.jpg" } });
  if (u.startsWith(`https://api.telegram.org/file/bot${TOKEN}/`)) return new Response(new Uint8Array([255, 216, 255]));
  if (u.includes("api.telegram.org/bot")) return json({ ok: true, result: { message_id: 1 } });
  throw new Error(`studio test: unexpected request to ${u}`);
};

let failed = 0;
const check = (name, cond, detail = "") => {
  if (cond) console.log(`ok   ${name}`);
  else {
    failed++;
    console.log(`FAIL ${name}${detail ? `\n     ${detail}` : ""}`);
  }
};

// A key-value stub with the get and put the studio uses
function fakeKV(init = {}) {
  const store = new Map(Object.entries(init));
  return {
    store,
    async get(key, type) {
      if (!store.has(key)) return null;
      const v = store.get(key);
      if (type === "json") return JSON.parse(v);
      if (type === "arrayBuffer") return v instanceof Uint8Array ? v.slice().buffer : v;
      return v;
    },
    async put(key, value) {
      store.set(key, value);
    },
    async delete(key) {
      store.delete(key);
    },
  };
}

// A D1 stub for the statements the studio runs: the schema, INSERT and UPDATE of pictures, the paged SELECT, presets
function fakeD1() {
  const pictures = [];
  const presets = [];
  const refs = [];
  function exec(sql, args) {
    if (/^\s*CREATE/i.test(sql)) return { results: [], meta: {} };
    if (/^INSERT INTO refs/.test(sql)) {
      const cols = sql.match(/\(([^)]*)\)/)[1].split(",").map((c) => c.trim());
      const row = Object.fromEntries(cols.map((c, i) => [c, args[i]]));
      row.id = refs.length + 1;
      refs.push(row);
      return { results: [], meta: { last_row_id: row.id } };
    }
    if (/^UPDATE refs/.test(sql)) {
      const row = refs.find((r) => r.id === args[3]);
      if (row) Object.assign(row, { status: args[0], key: args[1], tags: args[2] });
      return { results: [], meta: {} };
    }
    if (/FROM refs/.test(sql)) {
      if (/WHERE id = \?/.test(sql)) return { results: refs.filter((r) => r.id === args[0]) };
      let rows = [...refs];
      let i = 0;
      if (sql.includes("kind = ?")) { const k = args[i++]; rows = rows.filter((r) => r.kind === k); }
      if (sql.includes("status = ?")) { const st = args[i++]; rows = rows.filter((r) => r.status === st); }
      return { results: sql.includes("DESC") ? rows.sort((a, b) => b.id - a.id) : rows };
    }
    if (/^INSERT INTO pictures/.test(sql)) {
      const cols = sql.match(/\(([^)]*)\)/)[1].split(",").map((c) => c.trim());
      const row = Object.fromEntries(cols.map((c, i) => [c, args[i]]));
      row.id = pictures.length + 1;
      pictures.push(row);
      return { results: [], meta: { last_row_id: row.id } };
    }
    if (/^UPDATE pictures/.test(sql)) {
      const row = pictures.find((r) => r.id === args[2]);
      if (row) Object.assign(row, { tg_thumb: args[0], tg_full: args[1] });
      return { results: [], meta: {} };
    }
    if (/^INSERT INTO presets/.test(sql)) {
      presets.push({ id: presets.length + 1, at: args[0], author: args[1], name: args[2], body: args[3] });
      return { results: [], meta: {} };
    }
    if (/FROM presets/.test(sql)) return { results: [...presets].sort((a, b) => b.id - a.id).slice(0, 50) };
    if (/FROM pictures/.test(sql)) {
      if (/WHERE id = \?/.test(sql)) return { results: pictures.filter((r) => r.id === args[0]).map((r) => ({ tg_thumb: r.tg_thumb ?? null, tg_full: r.tg_full ?? null })) };
      let rows = [...pictures];
      let i = 0;
      if (sql.includes("id < ?")) {
        const before = args[i++];
        rows = rows.filter((r) => r.id < before);
      }
      if (sql.includes("source = ?")) {
        const source = args[i++];
        rows = rows.filter((r) => r.source === source);
      }
      rows.sort((a, b) => b.id - a.id);
      const limit = args[i];
      return { results: rows.slice(0, limit).map((r) => ({ ...r, has_tg: r.tg_thumb != null ? 1 : 0 })) };
    }
    throw new Error(`fake D1: unknown statement ${sql.slice(0, 80)}`);
  }
  return {
    pictures,
    presets,
    refs,
    prepare(sql) {
      let args = [];
      const stmt = {
        bind(...a) {
          args = a;
          return stmt;
        },
        async run() {
          return exec(sql, args);
        },
        async all() {
          return exec(sql, args);
        },
        async first() {
          return exec(sql, args).results[0] || null;
        },
      };
      return stmt;
    },
    async batch(stmts) {
      const out = [];
      for (const s of stmts) out.push(await s.run());
      return out;
    },
  };
}

const studioEnv = (extra = {}) => ({ TELEGRAM_BOT_TOKEN: TOKEN, OWNER_ID: "42", REEM_KV: fakeKV(), STUDIO_DB: fakeD1(), RUNWARE_API_KEY: "test-key", PUBLIC_URL: "https://reem.example.test", ...extra });
const req = (path, cookie = "") => new Request(`https://x.test${path}`, cookie ? { headers: { cookie } } : {});
const route = (env, path, cookie = "", now = NOW) => W.studioRoute(req(path, cookie), env, new URL(`https://x.test${path}`), now);
const jarOf = async (env, chat = "42") => `studio=${await W.studioToken(env, chat, NOW)}`;

// 1-6. The link: a token opens for the owner's chat only, for LINK_DAYS, until /studio reset
{
  const env = studioEnv();
  const link = await W.studioToken(env, "42", NOW);
  check("a link checks back to the owner's chat", JSON.stringify(await W.studioCheck(env, link, NOW)) === JSON.stringify({ chat: "42" }));
  const flipped = link.slice(0, -2) + (link.slice(-2) === "AA" ? "BB" : "AA");
  check("a tampered signature is refused", (await W.studioCheck(env, flipped, NOW)) === null);
  check("a link for another chat is refused", (await W.studioCheck(env, await W.studioToken(env, "7", NOW), NOW)) === null);
  check("a link older than LINK_DAYS is refused", (await W.studioCheck(env, link, NOW + 31 * 86400e3)) === null);
  check("a link that isn't a token is refused", (await W.studioCheck(env, "nonsense", NOW)) === null);
  env.REEM_KV.store.set("studio_epoch", "1"); // what /studio reset does
  check("after /studio reset an old link is refused, a new one works", (await W.studioCheck(env, link, NOW)) === null && (await W.studioCheck(env, await W.studioToken(env, "42", NOW), NOW)) !== null);
}

// 7-11. The routes: a bad token is 404; the link's first visit is the page itself (no redirect) and sets the cookie; every
// /studio route needs the cookie. 2026-10-11: a redirect let a SameSite=Strict cookie miss the redirected request (a 404 from
// a link opened in Telegram), so the first visit answers 200 with SameSite=Lax
{
  const env = studioEnv();
  const link = await W.studioToken(env, "42", NOW);
  check("a bad token is 404", (await route(env, "/studio?t=bad")).status === 404);
  check("a token for another chat is 404", (await route(env, `/studio?t=${await W.studioToken(env, "7", NOW)}`)).status === 404);
  const first = await route(env, `/studio?t=${link}`);
  const cookie = first.headers.get("set-cookie") || "";
  check(
    "the link's first visit answers the page (200, text/html, no Location) and sets the cookie (Path=/studio, HttpOnly, Secure, SameSite=Lax, 30 days)",
    first.status === 200 && !first.headers.get("location") && /text\/html/.test(first.headers.get("content-type")) && (await first.clone().text()).includes("Picture studio") && /^studio=/.test(cookie) && /Path=\/studio/.test(cookie) && /HttpOnly/.test(cookie) && /Secure/.test(cookie) && /SameSite=Lax/.test(cookie) && !/SameSite=Strict/.test(cookie) && /Max-Age=2592000/.test(cookie),
    cookie,
  );
  const posted = await W.studioRoute(new Request(`https://x.test/studio?t=${link}`, { method: "POST" }), env, new URL(`https://x.test/studio?t=${link}`), NOW);
  check("the token on a POST is 404 (the link is a GET, no cookie set)", posted.status === 404 && !posted.headers.get("set-cookie"));
  const jar = cookie.split(";")[0];
  const page = await route(env, "/studio", jar);
  const html = await page.text();
  check(
    "with the cookie the page loads, with its security headers",
    page.status === 200 && /text\/html/.test(page.headers.get("content-type")) && html.includes("Picture studio") && /default-src 'none'/.test(page.headers.get("content-security-policy")) && page.headers.get("x-robots-tag") === "noindex" && page.headers.get("referrer-policy") === "no-referrer",
  );
  const bare = await route(env, "/studio/api/log");
  check("without the cookie every /studio route is 404", bare.status === 404 && (await bare.text()) === "not found");
  const log = await route(env, "/studio/api/log", jar);
  check("with the cookie the log answers JSON", log.status === 200 && (await log.json()).ok === true);
  check("with an old epoch the cookie is 404", (await route(env, "/studio", jar)).status === 200 && (env.REEM_KV.store.set("studio_epoch", "2"), (await route(env, "/studio", jar)).status === 404));
}

// 12-14. /studio in chats: the owner gets the link; another chat gets no answer; /studio reset ends the old links
{
  const env = studioEnv();
  const sends = () => calls.filter((c) => c.url.includes("/sendMessage")).length;
  const before = sends();
  await W.runCommand(env, "7", "studio", {});
  check("/studio from another chat gets no answer", sends() === before);
  await W.runCommand(env, "42", "studio", {});
  const last = calls.filter((c) => c.url.includes("/sendMessage")).at(-1);
  const text = last ? String(last.body) : "";
  const match = text.match(/valid 30 days: https:\/\/reem\.example\.test\/studio\?t=([A-Za-z0-9_.-]+)/);
  check("/studio from the owner's chat sends its private link", sends() === before + 1 && match !== null, text.slice(0, 200));
  await W.runCommand(env, "42", "studio", { args: "reset" });
  check("/studio reset: the link sent before no longer works", match !== null && (await route(env, `/studio?t=${match[1]}`)).status === 404);
}

// 15. The editor's compose is the bot's own plan: the golden case "/pic messy bun on the porch" (case index 5, seeded random)
{
  const golden = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "picture-plans.golden.json"), "utf8")).cases["/pic messy bun on the porch"];
  const want = golden.runware[0];
  Math.random = mulberry32(5);
  frozen = FROZEN;
  const out = await W.studioCompose(studioEnv(), { source: "pic", words: "messy bun, red lipstick, black turtleneck, on the porch", level: "on" });
  const t = out.tries[0] || {};
  check("compose: the golden /pic case gives the same prompt", t.prompt === want.positivePrompt, `want ${JSON.stringify(want.positivePrompt).slice(0, 200)}\n     got  ${JSON.stringify(t.prompt || "").slice(0, 200)}`);
  check(
    "compose: the same model, size, sampler, LoRAs and references as the golden case",
    // Rebuild Step 2: the picture core names each place by its exact picture ("place:porch~1"), as the golden does
    t.model === want.model && t.width === want.width && t.height === want.height && (want.steps ?? 0) === t.steps && (want.CFGScale ?? 0) === t.cfg && (want.acceleration || "") === t.acceleration && (want.scheduler || "") === t.scheduler && JSON.stringify(t.loras) === JSON.stringify(want.lora) && JSON.stringify(t.refs) === JSON.stringify(want.refs),
    JSON.stringify({ got: { model: t.model, w: t.width, h: t.height, loras: t.loras, refs: t.refs }, want: { model: want.model, w: want.width, h: want.height, lora: want.lora, refs: want.refs } }),
  );
  const none = await W.studioCompose(studioEnv(), { source: "scene", words: "x" });
  const offCompose = await W.studioCompose(studioEnv(), { source: "pic", words: "messy bun, red lipstick, black turtleneck, on the porch", level: "off" });
  check("compose at Off: no Runware plan (tries []), the level is kept", offCompose.ok === true && offCompose.level === "off" && Array.isArray(offCompose.tries) && offCompose.tries.length === 0, JSON.stringify(offCompose).slice(0, 200));
  // 2026-10-12 (owner: compose "always returns Runware can't draw right now"): at Off the Cloudflare prompt and references come back
  const cf = offCompose.cloudflare || {};
  check("compose at Off: the Cloudflare prompt, with the words, and the studio's reference names", String(cf.prompt || "").includes("black turtleneck") && cf.refs.length === 3 && cf.refs[0] === "face-2x" && cf.refs[1] === "body-v15-clothed" && /^place:porch(?:~\d+)?$/.test(cf.refs[2]), JSON.stringify(cf).slice(0, 300));
  check("compose takes /pic words only", none.ok === false);
}

// 16. The studio's draw: one Runware task with two pictures and the editor's settings; a log row and a kept picture for each
{
  const env = studioEnv();
  const before = calls.length;
  const out = await W.studioDraw(env, { model: "klein", prompt: "a woman in her kitchen, gray cardigan", width: 768, height: 1344, results: 2, refs: ["face-2x", "body-v10-clothed", "place:nope"], loras: [{ model: "ferasalm:instapic@1", weight: 0.6 }, { model: "ferasalm:phone2025@1", weight: 0 }], seed: 77, steps: 5, cfg: 1 }, NOW);
  const sent = calls.slice(before).find((c) => c.url === "https://api.runware.ai/v1");
  const task = sent ? JSON.parse(sent.body)[0] : {};
  check(
    "draw: one Runware task, two pictures, the editor's settings (a LoRA at 0 is left out, a missing place is skipped)",
    out.ok === true && out.pictures.length === 2 && task.numberResults === 2 && task.seed === 77 && task.steps === 5 && task.CFGScale === 1 && task.lora.length === 1 && task.lora[0].weight === 0.6 && task.inputs.referenceImages.length === 2,
    JSON.stringify({ ok: out.ok, n: out.pictures && out.pictures.length, task: { numberResults: task.numberResults, lora: task.lora, refs: task.inputs && task.inputs.referenceImages.length } }),
  );
  const rows = env.STUDIO_DB.pictures;
  check("draw: a log row per picture, source studio", rows.length === 2 && rows.every((r) => r.source === "studio" && r.ok === 1 && r.seed === 77 && r.model === "runware:400@2"), JSON.stringify(rows.map((r) => [r.source, r.ok, r.seed])));
  check("draw: each picture is kept for the studio (KV simg:<id>)", out.pictures.every((p) => env.REEM_KV.store.get(`simg:${p.id}`) instanceof Uint8Array));
  const ledger = JSON.parse(env.REEM_KV.store.get("pics"));
  check("draw: the money counts in studioUsd, not in the bot's rwUsd", Math.abs(ledger.studioUsd - 0.005) < 1e-9 && !ledger.rwUsd, JSON.stringify(ledger));
}

// 17. The cap: at STUDIO.DAILY_USD a draw stops before Runware is called
{
  const env = studioEnv();
  env.REEM_KV.store.set("pics", JSON.stringify({ day: "2026-10-11", studioUsd: 0.999 }));
  const before = calls.length;
  const out = await W.studioDraw(env, { prompt: "over the cap", results: 1 }, NOW);
  check("draw stops at the studio's cap, with Runware not called", out.ok === false && /spent/.test(out.error) && !calls.slice(before).some((c) => c.url === "https://api.runware.ai/v1"), JSON.stringify(out));
}

// 18-19. The log: 30 a page, newest first, `before` pages on; the source filter
{
  const env = studioEnv();
  for (let i = 1; i <= 65; i++) env.STUDIO_DB.pictures.push({ id: i, at: new Date(NOW + i * 1000).toISOString(), source: i % 2 ? "pic" : "studio", kind: "clothed", prompt: `p${i}`, loras: "[]", refs: "[]", ok: 1, cost: 0.003, seed: i });
  const page1 = await W.studioLog(env, new URL("https://x.test/studio/api/log"));
  const page2 = await W.studioLog(env, new URL(`https://x.test/studio/api/log?before=${page1.next}`));
  const page3 = await W.studioLog(env, new URL(`https://x.test/studio/api/log?before=${page2.next}`));
  check(
    "log: 30 a page, newest first, then the next page, then the rest",
    page1.rows.length === 30 && page1.rows[0].id === 65 && page1.next === 36 && page2.rows.length === 30 && page2.rows[0].id === 35 && page2.next === 6 && page3.rows.length === 5 && page3.next === null,
    JSON.stringify([page1.rows.length, page1.next, page2.rows.length, page2.next, page3.rows.length, page3.next]),
  );
  const pics = await W.studioLog(env, new URL("https://x.test/studio/api/log?source=pic"));
  check("log: the source filter keeps that source only", pics.rows.length === 30 && pics.rows.every((r) => r.source === "pic") && pics.next !== null);
}

// 20. A picture: the studio's copy in KV, else Telegram's copy of the bot's picture (tg_thumb); a non-number id is 404
{
  const env = studioEnv();
  env.STUDIO_DB.pictures.push({ id: 1, source: "pic", ok: 1, tg_thumb: "FILE_THUMB", tg_full: "FILE_FULL" });
  env.REEM_KV.store.set("simg:2", new Uint8Array([1, 2, 3, 4]));
  const jar = await jarOf(env);
  const kept = await route(env, "/studio/img/2", jar);
  const telegram = await route(env, "/studio/img/1?size=thumb", jar);
  check("pictures: KV for the studio's draws, Telegram's copy for the bot's", kept.status === 200 && kept.headers.get("content-type") === "image/jpeg" && telegram.status === 200 && (await telegram.arrayBuffer()).byteLength === 3);
  check("a picture id must be a number", (await route(env, "/studio/img/x", jar)).status === 404);
}

// 21. The editor's lists: LoRAs, references (every body and face name resolves), two models
{
  const env = studioEnv();
  const o = await W.studioOptions(env);
  const bytes = await Promise.all(["face-2x", "face-1x", "body-cloudflare", ...o.bodies.map((b) => b.name)].map((n) => W.refBytes(env, n)));
  check("options: LoRAs, references and two models; every face and body name resolves", o.loras.length > 0 && o.refs.includes("face-2x") && o.models.length === 2 && bytes.every((b) => b && b.length > 1000), JSON.stringify({ loras: o.loras.length, models: o.models.length }));
  // 2026-10-12 (owner): one face in the list, the body pictures under Body (three since 2026-10-15), hair pictures only (no outfit pictures), and the bot's defaults
  const distinct = new Set(bytes.slice(3).map((b) => b.length)).size;
  check("options: Body = clothed front, nude front and nude back (three different pictures; clothed back views use the nude back, 2026-10-15), no face-1x, hair only, the bot's sampler and LoRAs",
    JSON.stringify(o.bodies.map((b) => b.name)) === JSON.stringify(["body-v15-clothed", "body-v15", "body-v15-back"]) && distinct === 3 && !o.refs.includes("face-1x") && !o.refs.some((r) => r.startsWith("style:outfit-")) && o.sampler.steps === 6 && o.sampler.cfg === 2 && JSON.stringify(o.defaultLoras) === JSON.stringify([{ model: "ferasalm:lenovoc@1", weight: 1.3 }]),
    JSON.stringify({ bodies: o.bodies, distinct, sampler: o.sampler, defaultLoras: o.defaultLoras }));
}

// 21b. The reference library (Rebuild Step 4): candidates, approval, pickRefs, Runware UUIDs
{
  const env = studioEnv();
  const cookie = await jarOf(env);
  const get = async (path) => (await (await route(env, path, cookie)).json());
  check("refs: the list starts empty", (await get("/studio/api/refs")).refs.length === 0);
  const R = W.CONFIG.PICTURE.RUNWARE;
  const made = await W.studioRefMake(env, { kind: "outfit", base: `body-${R.BODY_CLOTHED}`, key: "a cream cable-knit sweater and fitted dark jeans", tags: "everyday", change: "The same body, now in a cream cable-knit sweater and fitted dark jeans, same pose, plain background." });
  check("refs: a candidate is drawn from the base picture, saved in KV and D1 as a candidate, and charged to the studio's money", made.ok && made.id === 1 && env.REEM_KV.store.has("ref:1") && env.STUDIO_DB.refs[0].status === "candidate" && env.STUDIO_DB.refs[0].parent === `body-${R.BODY_CLOTHED}` && made.studioUsd > 0, JSON.stringify(made));
  check("refs: a candidate is not in the bot's library", (await W.loadLibrary(env, NOW)).length === 0);
  check("refs: a candidate's picture is readable in the studio", (await route(env, "/studio/ref/lib:1", cookie)).status === 200);
  const noKey = await W.studioRefSet(env, { id: 1, status: "approved", key: "", tags: "" });
  check("refs: approving needs a key or tags", !noKey.ok, JSON.stringify(noKey));
  const approved = await W.studioRefSet(env, { id: 1, status: "approved" });
  const lib = await W.loadLibrary(env, NOW + 120000);
  check("refs: an approved entry reaches the bot's library", approved.ok && lib.length === 1 && lib[0].id === 1 && lib[0].kind === "outfit", JSON.stringify({ approved, lib }));
  const spec = (over) => { const sp = W.newSpec(); return Object.assign(sp, { herself: true, content: "clothed", view: "pov" }, over); };
  const rw = W.profile("runware");
  const hit = W.pickRefs(spec({ outfit: { key: "", refId: "", words: "a cream cable-knit sweater and fitted dark jeans", kept: "" } }), rw, lib);
  check("pickRefs: clothes that match an approved outfit send its picture as image 1 (instead of the body picture)", hit[0].role === "face" && hit[1].role === "outfit" && hit[1].name === "lib:1", JSON.stringify(hit));
  const miss = W.pickRefs(spec({ outfit: { key: "", refId: "", words: "a red satin cami", kept: "" } }), rw, lib);
  check("pickRefs: other clothes keep the body picture", miss[1].role === "body", JSON.stringify(miss));
  check("pickRefs: no library = as before", JSON.stringify(W.pickRefs(spec({ outfit: { key: "", refId: "", words: "a cream cable-knit sweater and fitted dark jeans", kept: "" } }), rw)) === JSON.stringify(W.pickRefs(spec({ outfit: { key: "", refId: "", words: "a cream cable-knit sweater and fitted dark jeans", kept: "" } }), rw, [])));
  check("pickRefs: a back view and a nude picture never take an outfit picture", W.pickRefs(spec({ back: true, outfit: { key: "", refId: "", words: "a cream cable-knit sweater and fitted dark jeans", kept: "" } }), rw, lib)[1].role === "body" && W.pickRefs(spec({ content: "nude", outfit: { key: "", refId: "", words: "a cream cable-knit sweater", kept: "" } }), rw, lib)[1].role === "body");
  const cf = W.pickRefs(spec({ outfit: { key: "", refId: "", words: "a cream cable-knit sweater and fitted dark jeans", kept: "" } }), W.profile("cloudflare"), lib);
  check("pickRefs: Cloudflare (480 px references) keeps its own body picture", cf[1].name === "body-cloudflare");
  const prompt = W.framePrompt(spec({ outfit: { key: "", refId: "", words: "a cream cable-knit sweater and fitted dark jeans", kept: "" } }), hit, rw);
  check("framePrompt: with an outfit picture she wears the outfit of image 1; the lint is green", /She wears the outfit of image 1\./.test(prompt) && W.lintPrompt(prompt, hit.length).length === 0, prompt + JSON.stringify(W.lintPrompt(prompt, hit.length)));
  // /pic's own steps (picWords -> customPicture -> specFromWords -> drawPicture) with a local catalog holding the approved outfit (Step 4 finish, 2026-10-16)
  {
    const wordsPic = "a selfie of her in a cream cable-knit sweater and fitted dark jeans in the kitchen";
    const mk = () => { const pic = W.customPicture(W.picWords(wordsPic, "on", {}), 14, null, "on"); const sp = W.specFromWords(W.picWords(wordsPic, "on", {}), { source: "pic", level: "on", hour: 14 }); return { pic, sp }; };
    const { pic, sp } = mk();
    const plan = await W.drawPicture(env, pic.prompt, { location: pic.location, night: pic.night, custom: true, nsfw: "on", spec: sp, ledger: await W.loadLedger(env), planOnly: true });
    const t = (plan.plan || [])[0] || {};
    const names = (t.refs || []).map((r) => r.name || r);
    check("/pic with an approved outfit: try 1 sends her face, then the outfit picture (not the body picture), and the prompt says she wears the outfit of image 1",
      names[0] === "face-2x" && names[1] === "lib:1" && !names.some((n) => /^body-/.test(n)) && /She wears the outfit of image 1\./.test(t.text || t.prompt || "") && !(plan.lint || []).length, JSON.stringify({ names, lint: plan.lint, text: t.text || t.prompt }));
    const { pic: pic2, sp: sp2 } = mk();
    const before = calls.length;
    const drawn = await W.drawPicture(env, pic2.prompt, { location: pic2.location, night: pic2.night, custom: true, nsfw: "on", spec: sp2, ledger: await W.loadLedger(env), seed: 101 });
    const inf = calls.slice(before).filter((c) => c.url === "https://api.runware.ai/v1").map((c) => JSON.parse(c.body)[0]).find((b) => b.taskType === "imageInference");
    check("/pic with an approved outfit: the Runware request carries at least 2 references (face, then the outfit; by UUID only when UUID_REFS is on) and the picture comes back",
      !!drawn && !!inf && inf.inputs.referenceImages.length >= 2 && String(inf.inputs.referenceImages[1]).startsWith("uuid") === !!W.CONFIG.PICTURE.RUNWARE.UUID_REFS, JSON.stringify({ drawn: !!drawn, refs: inf && inf.inputs.referenceImages.map((r) => String(r).slice(0, 20)), uuid: W.CONFIG.PICTURE.RUNWARE.UUID_REFS }));
  }
  // Runware UUIDs: uploaded once, then cached; a UUID Runware forgets is uploaded again as bytes this once
  const lastInference = () => JSON.parse(calls.filter((c) => c.url === "https://api.runware.ai/v1" && JSON.parse(c.body)[0].taskType === "imageInference").at(-1).body)[0];
  const bytes = await W.refBytes(env, "lib:1");
  await W.drawRunware(env, R.MODEL, "x", [{ bytes, id: "1" }], 768, 1344, {});
  const first = lastInference().inputs.referenceImages;
  const up = uploads;
  await W.drawRunware(env, R.MODEL, "x", [{ bytes, id: "1" }], 768, 1344, {});
  check("uuid: a library picture goes by its Runware UUID, uploaded once and cached", first[0] === "uuid-1" && up === 1 && uploads === 1 && lastInference().inputs.referenceImages[0] === "uuid-1", JSON.stringify({ first, up, uploads }));
  staleUuids = true;
  const out = await W.drawRunware(env, R.MODEL, "x", [{ bytes, id: "1" }], 768, 1344, {});
  staleUuids = false;
  check("uuid: a UUID Runware no longer knows is forgotten and the bytes are sent instead", out.bytes.length > 0 && /^data:image\/jpeg/.test(lastInference().inputs.referenceImages[0]) && !env.REEM_KV.store.has("ruuid:1"));
  const batch = await W.studioRefBatch(env);
  check("refs: the first batch draws every candidate (outfits, hair, body) within the studio's money", batch.ok && batch.made.length === W.firstBatch().length && batch.made.some((m) => m.kind === "hair") && batch.made.some((m) => m.kind === "body"), JSON.stringify(batch));
  const listed = await get("/studio/api/refs?status=candidate");
  check("refs: the list filters by status", listed.ok && listed.refs.length === batch.made.length && (await get("/studio/api/refs?status=approved")).refs.length === 1, JSON.stringify({ n: listed.refs?.length, made: batch.made.length, err: listed.error }));
  const retired = await W.studioRefSet(env, { id: 1, status: "retired" });
  check("refs: retiring an entry takes it out of the library", retired.ok && (await W.loadLibrary(env, NOW + 300000)).length === 0);
}

// 22. The page's script parses (the page's behaviour was read in a browser: see docs/QUALITY.md)
{
  const { STUDIO_HTML } = await import("../../src/studio/page.js");
  const script = STUDIO_HTML.match(/<script>([\s\S]*)<\/script>/);
  let parsed = false;
  try {
    new Function(script[1]);
    parsed = true;
  } catch (e) {
    console.log(e.message);
  }
  check("the page's script parses", parsed && script !== null);
}

console.log(failed ? `${failed} FAILED` : "all passed");
process.exit(failed ? 1 : 0);
