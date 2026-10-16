// The prompt studio's page (Step 7 of docs/WORKPLAN.md, 2026-10-11): one HTML page with its style and script inline, served by
// worker.js at /studio to the owner's cookie only (studioRoute). Vanilla JS: no outside scripts, fonts or images; light and
// dark; the phone is the first screen. Its API is /studio/api/* (worker.js): options, log, compose, draw and presets.
export const STUDIO_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="referrer" content="no-referrer">
<title>Picture studio</title>
<style>
:root { color-scheme: light dark; --bg: #f6f4f1; --fg: #1f1c19; --muted: #6e675f; --card: #ffffff; --line: #e0dad2; --accent: #8a4b2a; --bad: #b3261e; --chip: #eee8e0; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #171513; --fg: #f2ede7; --muted: #a8a097; --card: #221f1c; --line: #3a352f; --accent: #e0a074; --bad: #ff8a80; --chip: #302b26; } }
:root[data-theme="dark"] { --bg: #171513; --fg: #f2ede7; --muted: #a8a097; --card: #221f1c; --line: #3a352f; --accent: #e0a074; --bad: #ff8a80; --chip: #302b26; }
* { box-sizing: border-box; }
body { margin: 0; overflow-x: hidden; background: var(--bg); color: var(--fg); font: 15px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; }
header, nav, main { max-width: 760px; margin: 0 auto; padding: 0 16px; }
header { padding-top: 16px; }
h1 { font-size: 20px; margin: 0 0 4px; }
p { margin: 6px 0; }
.muted { color: var(--muted); font-size: 13px; }
.bad { color: var(--bad); }
nav.tabs { display: flex; gap: 6px; margin-top: 12px; }
nav.tabs button { flex: 1; padding: 8px; border: 1px solid var(--line); background: var(--card); color: var(--fg); border-radius: 8px; font: inherit; }
nav.tabs button[aria-selected="true"] { border-color: var(--accent); color: var(--accent); font-weight: 600; }
section { padding: 8px 0 40px; }
label { display: block; margin: 8px 0; font-size: 13px; color: var(--muted); }
input, select, textarea { display: block; width: 100%; margin-top: 4px; padding: 8px; font: inherit; color: var(--fg); background: var(--card); border: 1px solid var(--line); border-radius: 8px; }
textarea { resize: vertical; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
fieldset { border: 1px solid var(--line); border-radius: 10px; margin: 12px 0; padding: 8px 12px; }
legend { color: var(--muted); font-size: 13px; padding: 0 4px; }
button { margin: 4px 6px 4px 0; padding: 8px 12px; border: 1px solid var(--line); background: var(--card); color: var(--fg); border-radius: 8px; font: inherit; }
button.primary { background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 600; }
button:disabled { opacity: 0.5; }
.bar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin: 8px 0; }
.bar label { margin: 0; }
.bar input { width: auto; flex: 1; min-width: 160px; }
.row { display: flex; gap: 12px; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 10px; margin: 10px 0; }
.row.stack { flex-direction: column; }
.thumb { width: 96px; height: auto; aspect-ratio: 1 / 1; max-height: 176px; flex: none; align-self: flex-start; object-fit: contain; border-radius: 8px; background: var(--chip); }
.nope { height: 96px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: var(--muted); text-align: center; }
img.full { width: 100%; max-width: 360px; height: auto; align-self: flex-start; border-radius: 10px; }
.meta { min-width: 0; flex: 1; }
.head { font-weight: 600; font-size: 13px; overflow-wrap: anywhere; }
.sub, .words { font-size: 13px; color: var(--muted); overflow-wrap: anywhere; }
.chips { margin: 4px 0; }
.chip { display: inline-block; background: var(--chip); border-radius: 999px; padding: 1px 8px; margin: 2px 4px 2px 0; font-size: 12px; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; background: var(--chip); padding: 8px; border-radius: 8px; }
.lora { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 4px 0; border-bottom: 1px dashed var(--line); }
.lora .lname { flex: 1; min-width: 150px; font-size: 13px; }
.lora input.w { width: 80px; display: inline-block; margin: 0; }
.lora input[type="checkbox"] { width: auto; margin: 0; }
@media (max-width: 520px) { .grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<header>
<h1>Picture studio</h1>
<p class="muted">Private: only your link opens this page. In the chat, /studio reset makes old links stop working.</p>
<p id="status" role="status"></p>
</header>
<nav class="tabs" role="tablist">
<button id="tab-log" type="button" role="tab" aria-selected="true">Log</button>
<button id="tab-editor" type="button" role="tab" aria-selected="false">Editor</button>
<button id="tab-presets" type="button" role="tab" aria-selected="false">Presets</button>
<button id="tab-refs" type="button" role="tab" aria-selected="false">References</button>
</nav>
<main>
<section id="log">
<div class="bar"><label>Source <select id="log-source">
<option value="">all</option><option value="pic">/pic</option><option value="selfie">selfie</option><option value="scene">scene</option><option value="look">/look</option><option value="studio">studio</option><option value="health">health</option><option value="face">face</option>
</select></label></div>
<div id="log-rows"></div>
<button id="log-more" type="button" hidden>Older</button>
</section>
<section id="editor" hidden>
<label>Prompt<textarea id="ed-prompt" rows="6"></textarea></label>
<fieldset><legend>Compose from words (the bot's own plan, no cost)</legend>
<label>Words, as after /pic<input id="ed-words" autocomplete="off"></label>
<button id="ed-compose" type="button">Compose</button>
</fieldset>
<div class="grid">
<label>Model<select id="ed-model"></select></label>
<label>Size<select id="ed-size"></select></label>
<label>Width (custom)<input id="ed-w" type="number" min="256" max="2048" step="16"></label>
<label>Height (custom)<input id="ed-h" type="number" min="256" max="2048" step="16"></label>
<label>Steps (0 = Runware's)<input id="ed-steps" type="number" min="0" max="50"></label>
<label>CFG (0 = Runware's)<input id="ed-cfg" type="number" min="0" max="10" step="0.1"></label>
<label>Acceleration (blank = Runware's)<input id="ed-acc" autocomplete="off"></label>
<label>Seed (0 = random)<input id="ed-seed" type="number" min="0"></label>
<label>Pictures<select id="ed-n"></select></label>
<label>Nudity level (for Compose)<select id="ed-level"></select></label>
</div>
<fieldset><legend>References</legend>
<div class="grid">
<label>Face<select id="ed-face"></select></label>
<label>Body<select id="ed-body"></select></label>
<label>Place<select id="ed-place"></select></label>
<label>Hair<select id="ed-style"></select></label>
</div>
</fieldset>
<fieldset><legend>LoRAs (weight 0 to 1.5)</legend><div id="ed-loras"></div></fieldset>
<p id="ed-est" class="muted"></p>
<button id="ed-draw" type="button" class="primary">Generate</button>
<div id="ed-results"></div>
</section>
<section id="presets" hidden>
<div class="bar"><input id="preset-name" placeholder="Preset name" autocomplete="off"><button id="preset-save" type="button">Save editor as preset</button></div>
<div id="preset-rows"></div>
</section>
<section id="refs" hidden>
<p class="muted">Outfit, hair and body pictures. The bot uses only the ones you approve; a candidate does nothing until then. Outfits are drawn from the faceless clothed body, hair from her face.</p>
<div class="bar"><label>Kind <select id="rf-kind"><option value="">all</option><option value="outfit">outfit</option><option value="hair">hair</option><option value="body">body</option></select></label>
<label>Status <select id="rf-status"><option value="candidate">candidate</option><option value="approved">approved</option><option value="">all</option><option value="rejected">rejected</option><option value="retired">retired</option></select></label></div>
<fieldset><legend>New candidate (about $0.004)</legend>
<div class="grid">
<label>Kind<select id="rf-new-kind"><option value="outfit">outfit</option><option value="hair">hair</option><option value="body">body</option></select></label>
<label>Base picture<select id="rf-new-base"></select></label>
</div>
<label>The change<textarea id="rf-new-change" rows="3" placeholder="the same body, now in a cream knit sweater and blue jeans, same pose, plain background"></textarea></label>
<label>Key (the clothes or hair words the bot matches)<input id="rf-new-key" autocomplete="off"></label>
<label>Tags (comma separated)<input id="rf-new-tags" autocomplete="off"></label>
<button id="rf-make" type="button" class="primary">Draw a candidate</button>
<button id="rf-batch" type="button">Draw the first batch (about $0.04)</button>
</fieldset>
<div id="rf-rows"></div>
</section>
</main>
<script>
(function () {
  "use strict";
  // The link's ?t= leaves the address bar at once: the cookie from the first visit keeps the page open (no redirect, 2026-10-11)
  if (new URLSearchParams(location.search).has("t")) history.replaceState(null, "", "/studio");
  var opts = null; // /studio/api/options
  var logNext = null; // the id to pass as before= for the next page of the log
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (k === "text") n.textContent = v;
      else if (k === "cls") n.className = v;
      else if (k === "on") Object.keys(v).forEach(function (ev) { n.addEventListener(ev, v[ev]); });
      else if (v !== false && v != null) n.setAttribute(k, v === true ? "" : String(v));
    });
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function say(msg, bad) { var s = $("status"); s.textContent = msg || ""; s.className = bad ? "bad" : ""; }
  function fail(e) { say(String((e && e.message) || e), true); }
  function api(path, body) {
    var init = { credentials: "same-origin", cache: "no-store" };
    if (body !== undefined) { init.method = "POST"; init.headers = { "content-type": "application/json" }; init.body = JSON.stringify(body); }
    return fetch(path, init).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: "HTTP " + r.status }; }).then(function (j) {
        if (!r.ok || !j.ok) throw new Error(j.error || ("HTTP " + r.status));
        return j;
      });
    });
  }
  function money(n) { return "$" + (Number(n) || 0).toFixed(4); }
  function when(iso) {
    var d = new Date(iso);
    return isNaN(d) ? String(iso) : d.toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " Boston";
  }
  function parseJSON(s, dflt) { try { return JSON.parse(s) || dflt; } catch (e) { return dflt; } }
  function copy(text) {
    navigator.clipboard.writeText(text).then(function () { say("Copied."); }, function () { say("Copy failed.", true); });
  }
  function setSelect(sel, value) {
    value = value == null ? "" : String(value);
    if (!Array.prototype.some.call(sel.options, function (o) { return o.value === value; })) sel.appendChild(el("option", { value: value, text: value }));
    sel.value = value;
  }
  function fillSelect(sel, pairs, value) {
    sel.innerHTML = "";
    pairs.forEach(function (p) { sel.appendChild(el("option", { value: p[0], text: p[1] })); });
    setSelect(sel, value);
  }
  function tab(name) {
    ["log", "editor", "presets", "refs"].forEach(function (t) {
      $(t).hidden = t !== name;
      $("tab-" + t).setAttribute("aria-selected", t === name ? "true" : "false");
    });
    if (name === "presets") loadPresets().catch(fail);
    if (name === "refs") loadRefs().catch(fail);
  }
  // ---- References (Rebuild Step 4) ----
  function refBases(approved) {
    var pairs = [["face-2x", "her face"]];
    (opts.bodies || []).forEach(function (b) { pairs.push([b.name, b.label]); });
    approved.forEach(function (r) { pairs.push(["lib:" + r.id, "#" + r.id + " " + r.kind + ": " + String(r.key || "").slice(0, 40)]); });
    return pairs;
  }
  function refCard(r) {
    var key = el("input", { value: r.key || "", placeholder: "key", "aria-label": "key" });
    var tags = el("input", { value: r.tags || "", placeholder: "tags", "aria-label": "tags" });
    function set(patch) {
      patch.id = r.id;
      return api("/studio/api/refs/set", patch).then(function () { say("Saved #" + r.id + "."); return loadRefs(); }).catch(fail);
    }
    function btn(label, status, primary) {
      return el("button", { type: "button", cls: primary ? "primary" : "", text: label, on: { click: function () { set({ status: status, key: key.value, tags: tags.value }); } } });
    }
    var kids = [btn("Approve", "approved", true), btn("Reject", "rejected"), btn("Retire", "retired"), el("button", { type: "button", text: "Save key and tags", on: { click: function () { set({ key: key.value, tags: tags.value }); } } })];
    return el("div", { cls: "row stack" }, [
      el("img", { cls: "full", loading: "lazy", alt: r.kind + " #" + r.id, src: "/studio/ref/lib:" + r.id }),
      el("div", { cls: "meta" }, [
        el("div", { cls: "head", text: "#" + r.id + " " + r.kind + " (" + r.status + ")" }),
        el("div", { cls: "sub", text: "from " + (r.parent || "?") + ", seed " + (r.seed || "?") + ", " + money(r.cost) + ", " + when(r.at) }),
        el("div", { cls: "words", text: r.prompt || "" }),
        key, tags, el("div", { cls: "btns" }, kids),
      ]),
    ]);
  }
  function loadRefs() {
    var q = "?kind=" + encodeURIComponent($("rf-kind").value) + "&status=" + encodeURIComponent($("rf-status").value);
    return api("/studio/api/refs" + q).then(function (j) {
      var box = $("rf-rows");
      box.innerHTML = "";
      if (!j.refs.length) box.appendChild(el("p", { cls: "muted", text: "Nothing here yet." }));
      j.refs.forEach(function (r) { box.appendChild(refCard(r)); });
      return api("/studio/api/refs?status=approved");
    }).then(function (a) { fillSelect($("rf-new-base"), refBases(a.refs), $("rf-new-base").value); });
  }
  function makeRef() {
    var change = $("rf-new-change").value.trim();
    if (!change) return say("Write the change first.", true);
    say("Drawing...");
    return api("/studio/api/refs/make", { kind: $("rf-new-kind").value, base: $("rf-new-base").value, change: change, key: $("rf-new-key").value, tags: $("rf-new-tags").value })
      .then(function (j) { say("Candidate #" + j.id + " drawn (" + money(j.cost) + "). Studio today " + money(j.studioUsd) + "."); $("rf-status").value = "candidate"; return loadRefs(); }).catch(fail);
  }
  function makeBatch() {
    say("Drawing the first batch...");
    return api("/studio/api/refs/batch", {})
      .then(function (j) { say(j.made.length + " candidates drawn" + (j.errors.length ? "; stopped: " + j.errors[0] : "") + "."); $("rf-status").value = "candidate"; return loadRefs(); }).catch(fail);
  }
  function idOf(model) { var m = opts.models.filter(function (x) { return x.model === model; })[0]; return m ? m.id : "klein"; }
  function refNamed(refs, prefix) { return refs.filter(function (r) { return String(r).indexOf(prefix) === 0; })[0] || ""; }
  function estimate() {
    var n = Number($("ed-n").value) || 1;
    $("ed-est").textContent = "About " + money(n * opts.usdPerPicture) + " for " + n + " picture" + (n > 1 ? "s" : "") + ". The studio today: " + money(opts.cap.spentUsd) + " of $" + opts.cap.dailyUsd + ".";
  }
  function addWords(words) {
    var p = $("ed-prompt");
    var base = p.value.replace(/ +$/, "");
    p.value = (base ? base + ", " : "") + words;
  }
  function renderLoras(on) {
    var weights = {};
    on.forEach(function (l) { weights[l.model] = l.weight; });
    var box = $("ed-loras");
    box.innerHTML = "";
    opts.loras.forEach(function (l, i) {
      var active = Object.prototype.hasOwnProperty.call(weights, l.air);
      var cb = el("input", { type: "checkbox", id: "lora" + i });
      cb.checked = active;
      var w = el("input", { type: "number", min: "0", max: "1.5", step: "0.05", cls: "w", value: active ? weights[l.air] : 1 });
      var trig = /^[a-z ]+$/.test(l.trigger) ? el("button", { type: "button", text: "add " + l.trigger, on: { click: function () { addWords(l.trigger); } } }) : null;
      box.appendChild(el("div", { cls: "lora", "data-air": l.air }, [cb, el("span", { cls: "lname", text: l.name + " (" + l.category + ")" }), w, trig]));
    });
  }
  function editorBody() {
    var size = opts.sizes[Number($("ed-size").value)] || opts.sizes[0];
    var loras = [];
    $("ed-loras").querySelectorAll(".lora").forEach(function (row) {
      var weight = Number(row.querySelector("input.w").value);
      if (row.querySelector("input[type=checkbox]").checked && weight > 0) loras.push({ model: row.getAttribute("data-air"), weight: weight });
    });
    return {
      model: $("ed-model").value,
      prompt: $("ed-prompt").value,
      width: Number($("ed-w").value) || size.width,
      height: Number($("ed-h").value) || size.height,
      steps: Number($("ed-steps").value) || 0,
      cfg: Number($("ed-cfg").value) || 0,
      acceleration: $("ed-acc").value.trim(),
      seed: Number($("ed-seed").value) || 0,
      results: Number($("ed-n").value) || 1,
      refs: [$("ed-face").value, $("ed-body").value, $("ed-place").value, $("ed-style").value].filter(Boolean),
      loras: loras,
      nsfw: $("ed-level").value,
      words: $("ed-words").value
    };
  }
  function applyEditor(s) {
    $("ed-prompt").value = s.prompt || "";
    $("ed-words").value = s.words || "";
    setSelect($("ed-model"), s.model || "klein");
    var at = -1;
    opts.sizes.forEach(function (z, i) { if (z.width === s.width && z.height === s.height) at = i; });
    $("ed-size").value = String(at >= 0 ? at : 0);
    $("ed-w").value = at >= 0 ? "" : (s.width || "");
    $("ed-h").value = at >= 0 ? "" : (s.height || "");
    $("ed-steps").value = s.steps || "";
    $("ed-cfg").value = s.cfg || "";
    $("ed-acc").value = s.acceleration || "";
    $("ed-seed").value = s.seed || "";
    setSelect($("ed-n"), String(s.results || 1));
    if (s.nsfw) setSelect($("ed-level"), s.nsfw);
    var refs = s.refs || [];
    setSelect($("ed-face"), refNamed(refs, "face-"));
    setSelect($("ed-body"), refNamed(refs, "body-"));
    setSelect($("ed-place"), refNamed(refs, "place:"));
    setSelect($("ed-style"), refNamed(refs, "style:"));
    renderLoras(s.loras || []);
    estimate();
  }
  function loadOptions() {
    return api("/studio/api/options").then(function (o) {
      opts = o;
      var labelOf = function (name) { return [name, name.indexOf(":") > 0 ? name.slice(name.indexOf(":") + 1) : name]; };
      fillSelect($("ed-model"), o.models.map(function (m) { return [m.id, m.label]; }), "klein");
      fillSelect($("ed-size"), o.sizes.map(function (z, i) { return [String(i), z.label]; }), "0");
      fillSelect($("ed-level"), o.levels.map(function (l) { return [l, l]; }), "on");
      // one face (the 2x picture Runware gets); the bodies by what they show; hair pictures only under Hair (owner 2026-10-12)
      fillSelect($("ed-face"), [["", "none"], ["face-2x", "face"]], "face-2x");
      fillSelect($("ed-body"), [["", "none"]].concat(o.bodies.map(function (b) { return [b.name, b.label]; })), o.bodies[0] ? o.bodies[0].name : "");
      fillSelect($("ed-place"), [["", "none"]].concat(o.refs.filter(function (r) { return r.indexOf("place:") === 0; }).map(labelOf)), "");
      fillSelect($("ed-style"), [["", "none"]].concat(o.refs.filter(function (r) { return r.indexOf("style:hair-") === 0; }).map(labelOf)), "");
      var n = [];
      for (var i = 1; i <= o.cap.resultsMax; i++) n.push([String(i), String(i)]);
      fillSelect($("ed-n"), n, "1");
      // the bot's own defaults: its sampler and its LoRAs on every picture
      $("ed-steps").value = o.sampler.steps || "";
      $("ed-cfg").value = o.sampler.cfg || "";
      renderLoras(o.defaultLoras || []);
      estimate();
    });
  }
  function compose() {
    say("Composing from your words...");
    return api("/studio/api/compose", { source: "pic", words: $("ed-words").value, level: $("ed-level").value }).then(function (r) {
      // at Off the bot draws on Cloudflare klein (no LoRAs): its prompt and references come back instead of a Runware plan
      if (!r.tries.length && r.cloudflare) {
        applyEditor({ prompt: r.cloudflare.prompt, words: $("ed-words").value, model: "klein", width: r.cloudflare.width, height: r.cloudflare.height, results: Number($("ed-n").value) || 1, refs: r.cloudflare.refs, loras: [], nsfw: r.level });
        return say("At Off the bot draws these words on Cloudflare klein (no LoRAs); its prompt is loaded. Generate draws it on Runware klein. Set the level to Nude or On for the Runware plan.");
      }
      if (!r.tries.length) return say(r.reason || "Nothing to compose for these words.", true);
      var t = r.tries[0];
      applyEditor({ prompt: t.prompt, words: $("ed-words").value, model: idOf(t.model), width: t.width, height: t.height, steps: t.steps, cfg: t.cfg, acceleration: t.acceleration, results: Number($("ed-n").value) || 1, refs: t.refs, loras: t.loras, nsfw: r.level });
      say("Composed from your words: the bot's plan (" + r.tries.length + " planned). Check the prompt, then Generate.");
    }).catch(fail);
  }
  function resultCard(p, body) {
    var src = p.id ? "/studio/img/" + p.id + "?size=full" : p.data;
    return el("article", { cls: "row stack" }, [
      el("img", { src: src, alt: "", cls: "full" }),
      el("div", { cls: "meta" }, [
        el("div", { cls: "head", text: (p.id ? "#" + p.id + " · " : "") + "seed " + p.seed + " · " + money(p.cost) }),
        el("div", { cls: "btns" }, [
          el("button", { type: "button", text: "copy prompt", on: { click: function () { copy(body.prompt); } } }),
          el("button", { type: "button", text: "edit", on: { click: function () { applyEditor(Object.assign({}, body, { seed: p.seed })); } } })
        ])
      ])
    ]);
  }
  function draw() {
    var body = editorBody();
    var btn = $("ed-draw");
    btn.disabled = true;
    say("Drawing " + body.results + " with Runware...");
    return api("/studio/api/draw", body).then(function (r) {
      opts.cap.spentUsd = r.studioUsd;
      estimate();
      $("ed-results").innerHTML = "";
      r.pictures.forEach(function (p) { $("ed-results").appendChild(resultCard(p, body)); });
      say("Done. The studio today: " + money(r.studioUsd) + " of $" + r.cap + ".");
    }).catch(fail).then(function () { btn.disabled = false; });
  }
  function logRow(row) {
    var loras = parseJSON(row.loras, []);
    var thumb = el("img", { src: "/studio/img/" + row.id + "?size=thumb", alt: "", loading: "lazy", cls: "thumb" });
    if (row.width > 0 && row.height > 0) thumb.style.aspectRatio = row.width + " / " + row.height; // the picture's own shape, never cropped
    thumb.onerror = function () { thumb.replaceWith(el("div", { cls: "thumb nope", text: "not kept" })); };
    var sizeLine = [row.model, row.width && row.height && (row.width + "x" + row.height), row.steps && (row.steps + " steps"), row.cfg && ("CFG " + row.cfg), row.seed && ("seed " + row.seed), money(row.cost)].filter(Boolean).join(" · ");
    var head = "#" + row.id + " · " + when(row.at) + " · " + row.source + (row.kind ? " · " + row.kind : "") + (row.nsfw ? " · " + row.nsfw : "");
    return el("article", { cls: "row" }, [
      row.ok ? thumb : el("div", { cls: "thumb nope", text: "no picture" }),
      el("div", { cls: "meta" }, [
        el("div", { cls: "head", text: head }),
        el("div", { cls: "sub", text: sizeLine }),
        row.asked ? el("div", { cls: "words", text: "his words: " + row.asked }) : null,
        row.her_words ? el("div", { cls: "words", text: "her words: " + row.her_words }) : null,
        row.llm_text ? el("div", { cls: "words", text: "text: " + row.llm_text }) : null,
        el("div", { cls: "chips" }, loras.map(function (l) { return el("span", { cls: "chip", text: String(l.model).split(":").pop() + " " + l.weight }); })),
        row.error ? el("div", { cls: "bad", text: "error: " + row.error }) : null,
        el("details", null, [el("summary", { text: "prompt" }), el("pre", { text: row.prompt })]),
        el("div", { cls: "btns" }, [
          el("button", { type: "button", text: "copy prompt", on: { click: function () { copy(row.prompt); } } }),
          el("button", { type: "button", text: "edit", on: { click: function () {
            applyEditor({ prompt: row.prompt, model: idOf(row.model), width: row.width, height: row.height, steps: row.steps, cfg: row.cfg, seed: row.seed, results: 1, refs: parseJSON(row.refs, []), loras: loras, nsfw: row.nsfw || "", words: row.asked || "" });
            tab("editor");
          } } })
        ])
      ])
    ]);
  }
  function loadLog(more) {
    if (!more) logNext = null;
    var path = "/studio/api/log?source=" + encodeURIComponent($("log-source").value) + (more && logNext ? "&before=" + logNext : "");
    return api(path).then(function (r) {
      var box = $("log-rows");
      if (!more) box.innerHTML = "";
      r.rows.forEach(function (row) { box.appendChild(logRow(row)); });
      if (!box.children.length) box.appendChild(el("p", { cls: "muted", text: "Nothing logged yet for this source." }));
      logNext = r.next;
      $("log-more").hidden = !r.next;
    });
  }
  function loadPresets() {
    return api("/studio/api/presets").then(function (r) {
      var box = $("preset-rows");
      box.innerHTML = "";
      if (!r.presets.length) box.appendChild(el("p", { cls: "muted", text: "No presets yet." }));
      r.presets.forEach(function (p) {
        box.appendChild(el("div", { cls: "row" }, [el("div", { cls: "meta" }, [
          el("div", { cls: "head", text: p.name + " · " + when(p.at) }),
          el("div", { cls: "btns" }, [el("button", { type: "button", text: "load", on: { click: function () { applyEditor(parseJSON(p.body, {})); tab("editor"); } } })])
        ])]));
      });
    });
  }
  function savePreset() {
    var name = $("preset-name").value.trim();
    if (!name) return say("Give the preset a name.", true);
    return api("/studio/api/presets", { name: name, body: JSON.stringify(editorBody()) }).then(function () {
      $("preset-name").value = "";
      say("Preset saved.");
      return loadPresets();
    }).catch(fail);
  }
  $("tab-log").onclick = function () { tab("log"); };
  $("tab-editor").onclick = function () { tab("editor"); };
  $("tab-presets").onclick = function () { tab("presets"); };
  $("tab-refs").onclick = function () { tab("refs"); };
  $("rf-kind").onchange = function () { loadRefs().catch(fail); };
  $("rf-status").onchange = function () { loadRefs().catch(fail); };
  $("rf-make").onclick = makeRef;
  $("rf-batch").onclick = makeBatch;
  $("log-source").onchange = function () { loadLog(false).catch(fail); };
  $("log-more").onclick = function () { loadLog(true).catch(fail); };
  $("ed-compose").onclick = compose;
  $("ed-draw").onclick = draw;
  $("ed-n").onchange = estimate;
  $("preset-save").onclick = savePreset;
  loadOptions().then(function () { return loadLog(false); }).catch(fail);
})();
</script>
</body>
</html>
`;
