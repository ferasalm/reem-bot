// Image model bench (owner, 2026-10-04: "Run test but half the cost"): the same lingerie prompts, her face
// (tools/face/reference.jpg) and the room's picture through each candidate model, for
// .github/workflows/image-bench.yml. Reads tools/face/bench.json; writes tools/face/out/bench/<model>-<n>.jpg and
// prints what each API answered (refusals word for word). Money cap: job.max_usd over the list prices below.
// With job.want (owner, 2026-10-04: "until you get two for each model, with a maximum of 14 attempts each"): each
// route draws job.prompt_sets[its family] in turn (a new seed each round) until job.want pictures came back that
// aren't black, or job.max_attempts were made; Cloudflare's real cost per call (cf-ai-neurons) is printed.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const job = JSON.parse(readFileSync("tools/face/bench.json", "utf8"));
const { CLOUDFLARE_API_TOKEN: cfToken, CLOUDFLARE_ACCOUNT_ID: account, OPENROUTER_API_KEY: orKey, RUNWARE_API_KEY: rwKey } = process.env;
const out = "tools/face/out/bench";
mkdirSync(out, { recursive: true });
const dataUri = (f) => `data:image/jpeg;base64,${readFileSync(f).toString("base64")}`;
let spentUsd = 0;
let lastNeurons = null; // cf-ai-neurons of the last Cloudflare call (null when Cloudflare didn't say)
const NEURON_USD = 0.011 / 1000;
const cfHeaders = (res) => { const n = Number(res.headers.get("cf-ai-neurons")); lastNeurons = Number.isFinite(n) && n > 0 ? n : null; };

// Each route: how to call it, and its list price per picture (2026-10-04, Cloudflare docs / OpenRouter pages).
const ROUTES = {
  // Cloudflare-hosted klein (today's model): Cloudflare's own filter (3030), no strictness setting
  "cf-klein4b": { usd: 0.0013, run: async (prompt, refs, seed) => {
    const form = new FormData();
    form.append("prompt", prompt);
    form.append("width", "768");
    form.append("height", "1024");
    form.append("seed", String(seed));
    refs.forEach((f, i) => form.append(`input_image_${i}`, new Blob([readFileSync(f)], { type: "image/jpeg" }), `ref${i}.jpg`));
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/@cf/black-forest-labs/flux-2-klein-4b`, { method: "POST", headers: { Authorization: `Bearer ${cfToken}` }, body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.result?.image) return { error: `HTTP ${res.status} ${JSON.stringify(data.errors || data).slice(0, 400)}` };
    return { bytes: Buffer.from(data.result.image, "base64") };
  } },
  // Third-party models on Cloudflare (AI Gateway, Unified Billing): ByteDance's filter, not Cloudflare's 3030
  "cf-seedream4.0": { usd: 0.03, run: (p, r) => cfThirdParty("bytedance/seedream-4.0", p, r) },
  "cf-seedream4.5": { usd: 0.04, run: (p, r) => cfThirdParty("bytedance/seedream-4.5", p, r) },
  // The same Seedream 4.5 and klein through OpenRouter (chat completions with image output)
  "or-seedream4.5": { usd: 0.04, run: (p, r, s) => openRouter("bytedance-seed/seedream-4.5", p, r, s) },
  // Cloudflare's free beta Stable Diffusion models ($0.00 a step): text only, img2img, or inpainting (job.base +
  // job.mask_box [x0, y0, x1, y1] on a 480x640 copy: only that box is redrawn, so her face outside it stays klein's)
  "cf-sd15-inpaint": { usd: 0, run: (p) => cfSD("@cf/runwayml/stable-diffusion-v1-5-inpainting", p, "inpaint") },
  "cf-sd15-img2img": { usd: 0, run: (p) => cfSD("@cf/runwayml/stable-diffusion-v1-5-img2img", p, "img2img") },
  "cf-sdxl-lightning": { usd: 0, run: (p) => cfSD("@cf/bytedance/stable-diffusion-xl-lightning", p, "text") },
  "cf-dreamshaper": { usd: 0, family: "sd", run: (p, r, s) => cfSD("@cf/lykon/dreamshaper-8-lcm", p, "text", s) },
  // FLUX.2 dev: klein's big sibling, same multipart form and reference images; 18.75 neurons per input tile and
  // 37.5 per output tile, per step (20 steps, 768x1024 = 4 tiles, face + room = 2 tiles: 3,750 neurons)
  "cf-flux2dev": { usd: 0.0413, family: "ref", run: (p, r, s) => cfFlux2("@cf/black-forest-labs/flux-2-dev", p, r, s, { steps: job.flux2_steps || 20 }) },
  // Leonardo Lucid Origin: text only (no reference image), 636 neurons per output tile + 12 per step
  "cf-lucid": { usd: 0.0313, family: "text", run: (p, r, s) => cfJson("@cf/leonardo/lucid-origin", { prompt: p, seed: s, width: 768, height: 1024, num_steps: job.lucid_steps || 25 }) },
  // FLUX.1 schnell (the bot's backup model): text only, no seed (5006), always 1024x1024, 4.8 neurons per tile + 9.6 per step
  "cf-schnell": { usd: 0.0011, family: "text", run: (p, r, s) => cfJson("@cf/black-forest-labs/flux-1-schnell", { prompt: p, steps: 8 }) },
  "or-grok": { usd: 0.024, run: (p, r, s) => openRouter("x-ai/grok-imagine-image", p, r, s) },
  "or-grok2": { usd: 0.06, run: (p, r, s) => openRouter("x-ai/grok-imagine-image-2.0", p, r, s) },
  // Text-only candidates (owner, 2026-10-04: "drop maintaining face for now, check what other good cheap options we
  // have"); OpenRouter bills image tokens, about 4,175 a picture (Seedream 4.5's $0.04), so the list prices are estimates
  "or-seedream4.5-text": { usd: 0.04, family: "text", run: (p, r, s) => openRouter("bytedance-seed/seedream-4.5", p, [], s) },
  "or-seedream5flash": { usd: 0.018, family: "text", run: (p, r, s) => openRouter("bytedance-seed/seedream-5-0-flash", p, [], s) },
  "or-krea2turbo": { usd: 0.015, family: "text", run: (p, r, s) => openRouter("krea/krea-2-medium-turbo", p, [], s) },
  "or-muse": { usd: 0.01, family: "text", run: (p, r, s) => openRouter("meta/muse-image", p, [], s) },
  "or-recraft41flash": { usd: 0.007, family: "text", run: (p, r, s) => openRouter("recraft/recraft-v4.1-flash", p, [], s) },
  "or-riverflow25fast": { usd: 0.019, family: "text", run: (p, r, s) => openRouter("sourceful/riverflow-v2.5-fast", p, [], s) },
  "cf-phoenix": { usd: 0.026, family: "text", run: (p, r, s) => cfJson("@cf/leonardo/phoenix-1.0", { prompt: p, seed: s, width: 768, height: 1024, num_steps: 25 }) },
  "cf-sdxl": { usd: 0, family: "sd", run: (p, r, s) => cfSD("@cf/stabilityai/stable-diffusion-xl-base-1.0", p, "text", s, [768, 1024]) },
  // Nano Banana (owner, 2026-10-04: "google safety filters are actually lenient ... just random. Let's test them"):
  // Google's Gemini image models through OpenRouter's chat completions (images in, image out), and Cloudflare's copy
  // (third-party: needs AI Gateway credits). List prices: ~1,290 output tokens a picture at $30/M (Nano Banana 2: $60/M)
  "or-nanobanana": { usd: 0.039, family: "ref", run: (p, r, s) => openRouterChat("google/gemini-2.5-flash-image", p, r, s) },
  "or-nanobanana2": { usd: 0.067, family: "ref", run: (p, r, s) => openRouterChat("google/gemini-3.1-flash-image-preview", p, r, s) },
  "or-nanobananapro": { usd: 0.134, family: "ref", run: (p, r, s) => openRouterChat("google/gemini-3-pro-image-preview", p, r, s) },
  "or-nanobanana-text": { usd: 0.039, family: "text", run: (p, r, s) => openRouterChat("google/gemini-2.5-flash-image", p, [], s) },
  "or-nanobanana2-text": { usd: 0.067, family: "text", run: (p, r, s) => openRouterChat("google/gemini-3.1-flash-image-preview", p, [], s) },
  // Nano Banana 2 Lite (owner 2026-10-04: "Let's try nano banana lite"): $30/M image tokens; price per picture unknown, capped at Nano Banana's
  "or-nanobananalite": { usd: 0.039, family: "ref", run: (p, r, s) => openRouterChat("google/gemini-3.1-flash-lite-image", p, r, s) },
  "or-nanobananalite-text": { usd: 0.039, family: "text", run: (p, r, s) => openRouterChat("google/gemini-3.1-flash-lite-image", p, [], s) },
  "cf-nanobanana": { usd: 0.039, family: "ref", run: (p, r) => cfThirdParty("google/nano-banana", p, r) },
  // Runware (owner, 2026-10-06: any provider; "klein 9B with Runware's safety check off, and Z-Image-Turbo"):
  // its content check (safety.checkContent) is off; the real cost comes back with includeCost. Model ids:
  // job.runware_models overrides them (the docs' AIR ids, checked by job.runware_search)
  "rw-klein9b": { usd: 0.0012, family: "ref", run: (p, r, s) => runware(job.runware_models?.["rw-klein9b"] || "runware:400@2", p, r, s) },
  "rw-klein9b-text": { usd: 0.0008, family: "text", run: (p, r, s) => runware("runware:400@2", p, [], s) },
  "rw-klein4b-text": { usd: 0.0006, family: "text", run: (p, r, s) => runware("runware:400@4", p, [], s) },
  "rw-twinflow": { usd: 0.0008, family: "text", run: (p, r, s) => runware("runware:twinflow-z-image-turbo@0", p, [], s) },
  "rw-zimage": { usd: 0.0008, family: "text", run: (p, r, s) => runware(job.runware_models?.["rw-zimage"] || "runware:z-image@turbo", p, [], s) },
  "or-klein4b": { usd: 0.016, run: (p, r, s) => openRouter("black-forest-labs/flux.2-klein-4b", p, r, s, job.klein_options) },
};

async function cfFlux2(model, prompt, refs, seed, extra = {}) {
  const form = new FormData();
  form.append("prompt", prompt);
  form.append("width", "768");
  form.append("height", "1024");
  form.append("seed", String(seed));
  for (const [k, v] of Object.entries(extra)) form.append(k, String(v));
  refs.forEach((f, i) => form.append(`input_image_${i}`, new Blob([readFileSync(f)], { type: "image/jpeg" }), `ref${i}.jpg`));
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`, { method: "POST", headers: { Authorization: `Bearer ${cfToken}` }, body: form, signal: AbortSignal.timeout(300000) });
  cfHeaders(res);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.result?.image) return { error: `HTTP ${res.status} ${JSON.stringify(data.errors || data).slice(0, 400)}` };
  return { bytes: Buffer.from(data.result.image, "base64") };
}

async function cfJson(model, input) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`, {
    method: "POST", headers: { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" }, body: JSON.stringify(input), signal: AbortSignal.timeout(300000),
  });
  cfHeaders(res);
  const type = res.headers.get("content-type") || "";
  if (res.ok && type.startsWith("image/")) return { bytes: Buffer.from(await res.arrayBuffer()) };
  const data = await res.json().catch(() => ({}));
  if (res.ok && data?.result?.image) return { bytes: Buffer.from(data.result.image, "base64") };
  return { error: `HTTP ${res.status} ${JSON.stringify(data.errors || data).slice(0, 400)}` };
}

async function cfSD(model, prompt, mode, seed = 4242, size) {
  const [w, h] = size || job.sd_size || [480, 640];
  const input = { prompt, num_steps: model.includes("lightning") || model.includes("lcm") ? 8 : 20, guidance: 7.5, width: w, height: h, seed };
  if (job.negative) input.negative_prompt = job.negative;
  if (mode !== "text") {
    const base = execFileSync("convert", [job.base, "-resize", "480x640!", "png:-"]);
    input.image = [...base];
    input.strength = mode === "img2img" ? job.strength || 0.6 : 1;
  }
  if (mode === "inpaint") {
    const [x0, y0, x1, y1] = job.mask_box;
    const mask = execFileSync("convert", ["-size", "480x640", "xc:black", "-fill", "white", "-draw", `rectangle ${x0},${y0} ${x1},${y1}`, ...(job.mask_extra ? ["-draw", `rectangle ${job.mask_extra.join(",").replace(/^(\d+),(\d+),/, "$1,$2 ")}`] : []), "-blur", "0x6", "png:-"]);
    input.mask = [...mask];
  }
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`, {
    method: "POST", headers: { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
  cfHeaders(res);
  const type = res.headers.get("content-type") || "";
  if (res.ok && type.startsWith("image/")) return { bytes: Buffer.from(await res.arrayBuffer()) };
  const data = await res.json().catch(() => ({}));
  if (res.ok && data?.result?.image) return { bytes: Buffer.from(data.result.image, "base64") };
  return { error: `HTTP ${res.status} ${JSON.stringify(data.errors || data).slice(0, 400)}` };
}

async function cfThirdParty(model, prompt, refs) {
  const input = { prompt, aspect_ratio: "3:4", image_input: refs.map(dataUri) };
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run`, {
    method: "POST", headers: { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, input }),
  });
  const data = await res.json().catch(() => ({}));
  const r = data.result || data;
  const url = r?.images?.[0] || r?.image;
  if (!res.ok || !url) return { error: `HTTP ${res.status} ${JSON.stringify(data.errors || data).slice(0, 500)}` };
  return { bytes: await fetchImage(url) };
}

// OpenRouter's image API (image-only models aren't served on chat completions: 404 "output modalities")
async function openRouter(model, prompt, refs, seed, providerOptions, aspect = "3:4") {
  const body = {
    model, prompt, seed, aspect_ratio: aspect, n: 1,
  };
  if (refs.length) body.input_references = refs.map((f) => ({ type: "image_url", image_url: { url: dataUri(f) } }));
  if (providerOptions) body.provider = { options: providerOptions };
  const res = await fetch("https://openrouter.ai/api/v1/images", {
    method: "POST", headers: { Authorization: `Bearer ${orKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  const accepted = res.status === 400 && /aspect_ratio: not supported\. Accepted: ([\d:, ]+)/.exec(JSON.stringify(data));
  if (accepted && body.aspect_ratio !== "1:1") {
    // the shape refused (Krea has no 3:4): take its tallest portrait shape, else a square
    const tall = accepted[1].split(/,\s*/).map((r) => r.trim().split(":").map(Number)).filter(([w, h]) => w < h).sort((a, b) => a[0] / a[1] - b[0] / b[1]).at(-1);
    console.log(`  3:4 refused; using ${tall ? tall.join(":") : "1:1"}`);
    return openRouter(model, prompt, refs, seed, providerOptions, tall ? tall.join(":") : "1:1");
  }
  if (res.status === 400 && providerOptions) {
    // the strictness setting refused as a parameter: say so, then draw at the provider's default
    console.log(`  provider options ${JSON.stringify(providerOptions)} refused: ${JSON.stringify(data.error || data).slice(0, 300)}; retrying without`);
    return openRouter(model, prompt, refs, seed);
  }
  const img = data?.data?.[0];
  const url = img?.b64_json ? `data:image/png;base64,${img.b64_json}` : img?.url;
  if (!res.ok || !url) return { error: `HTTP ${res.status} ${JSON.stringify(data.error || data).slice(0, 500)}`, usage: data.usage };
  return { bytes: await fetchImage(url), usage: data.usage };
}

// OpenRouter chat completions with image output (Gemini's image models): the reference pictures first, in order
// (image 0, image 1), then the words. A refusal comes back as text with no picture: reported as "(content)".
async function openRouterChat(model, prompt, refs, seed) {
  const content = [...refs.map((f) => ({ type: "image_url", image_url: { url: dataUri(f) } })), { type: "text", text: prompt }];
  const body = { model, seed, messages: [{ role: "user", content }], modalities: ["image", "text"], image_config: { aspect_ratio: job.aspect || "3:4" }, usage: { include: true } };
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST", headers: { Authorization: `Bearer ${orKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(300000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: `HTTP ${res.status} ${JSON.stringify(data.error || data).slice(0, 500)}`, usage: data.usage };
  const choice = data.choices?.[0] || {};
  const url = choice.message?.images?.[0]?.image_url?.url;
  if (!url) {
    const why = `${choice.finish_reason || ""}/${choice.native_finish_reason || ""}`;
    return { error: `no picture (content) ${why}: ${String(choice.message?.content || "").replace(/\s+/g, " ").slice(0, 300)}`, usage: data.usage };
  }
  return { bytes: await fetchImage(url), usage: data.usage };
}

// Runware's REST API: one imageInference task, safety check off, picture back as base64 with its cost. The
// reference pictures go in inputs.referenceImages (FLUX.2's shape); job.runware_steps / runware_size tune it.
async function runware(model, prompt, refs, seed) {
  if (!rwKey) return { error: "no RUNWARE_API_KEY secret" };
  const [width, height] = job.runware_size || [576, 1024];
  const task = { taskType: "imageInference", taskUUID: crypto.randomUUID(), model, positivePrompt: prompt, width, height, seed,
    numberResults: 1, outputType: "base64Data", outputFormat: "JPG", includeCost: true, safety: { checkContent: false } };
  if (job.runware_steps?.[model]) task.steps = job.runware_steps[model];
  if (refs.length) task.inputs = { referenceImages: refs.map(dataUri) };
  // a small balance stays reserved for a moment after each call (concurrentRequestLimitExceeded): wait and retry
  let res, data;
  for (let tries = 0; ; tries++) {
    res = await fetch("https://api.runware.ai/v1", { method: "POST", headers: { Authorization: `Bearer ${rwKey}`, "Content-Type": "application/json" }, body: JSON.stringify([task]) });
    data = await res.json().catch(() => ({}));
    if (tries >= 8 || !data.errors?.some((e) => e.code === "concurrentRequestLimitExceeded")) break;
    await new Promise((r) => setTimeout(r, 10000));
  }
  const d = data?.data?.[0];
  if (!res.ok || data.errors?.length || !d?.imageBase64Data) return { error: `HTTP ${res.status} ${JSON.stringify(data.errors || data).slice(0, 400)}` };
  return { bytes: Buffer.from(d.imageBase64Data, "base64"), usage: { cost: d.cost, nsfw: d.NSFWContent } };
}

// job.runware_search: print the models Runware finds for each term (free), to check the ids above
if (job.runware_search) {
  for (const search of job.runware_search) {
    const res = await fetch("https://api.runware.ai/v1", { method: "POST", headers: { Authorization: `Bearer ${rwKey}`, "Content-Type": "application/json" },
      body: JSON.stringify([{ taskType: "modelSearch", taskUUID: crypto.randomUUID(), search, limit: 10 }]) }).then((r) => r.json()).catch((e) => ({ error: e.message }));
    console.log(`Runware models for "${search}":`);
    for (const m of res.data?.[0]?.results || []) console.log(`  ${m.air} | ${m.name} ${m.version || ""} | ${m.category || ""} ${m.architecture || ""}`);
    if (!res.data?.[0]?.results) console.log(`  ${JSON.stringify(res).slice(0, 400)}`);
  }
}

async function fetchImage(url) {
  if (url.startsWith("data:")) return Buffer.from(url.slice(url.indexOf(",") + 1), "base64");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image download HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// job.list: print every image model each provider offers, with its price, and stop (nothing is drawn)
if (job.list) {
  const or = await fetch("https://openrouter.ai/api/v1/models?output_modalities=image", { headers: { Authorization: `Bearer ${orKey}` } }).then((r) => r.json()).catch((e) => ({ error: e.message }));
  console.log(`OpenRouter image models (${or.data?.length ?? JSON.stringify(or).slice(0, 200)}):`);
  for (const m of or.data || []) console.log(`  ${m.id} | in: ${m.architecture?.input_modalities} | pricing ${JSON.stringify(m.pricing)} | ${String(m.description || "").replace(/\s+/g, " ").slice(0, 160)}`);
  for (const task of ["Text-to-Image", "Image-to-Image"]) {
    const cf = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/models/search?task=${encodeURIComponent(task)}&per_page=100`, { headers: { Authorization: `Bearer ${cfToken}` } }).then((r) => r.json()).catch((e) => ({ error: e.message }));
    console.log(`\nCloudflare ${task} models (${cf.result?.length ?? JSON.stringify(cf).slice(0, 200)}):`);
    for (const m of cf.result || []) console.log(`  ${m.name} | ${(m.properties || []).map((p) => `${p.property_id}=${JSON.stringify(p.value)}`).join(" ").slice(0, 300)} | ${String(m.description || "").slice(0, 120)}`);
  }
  process.exit(0);
}

// Save a picture as a 768x1024-at-most JPEG; returns its size and whether it came back black (a safety checker)
function save(name, bytes) {
  const raw = `${out}/${name}-raw`;
  writeFileSync(raw, bytes);
  const jpg = `${out}/${name}.jpg`;
  execFileSync("convert", [raw, "-resize", "768x1024", "-quality", "88", "-strip", jpg]);
  execFileSync("rm", [raw]);
  const [size, mean, sd] = execFileSync("identify", ["-format", "%wx%h %[fx:mean] %[fx:standard_deviation]", jpg]).toString().split(" ");
  return { jpg, size, black: Number(mean) < 0.04 && Number(sd) < 0.04 };
}

// job.list_google: before drawing, print the Google image models OpenRouter serves (to check the ids above)
if (job.list_google) {
  const or = await fetch("https://openrouter.ai/api/v1/models?output_modalities=image", { headers: { Authorization: `Bearer ${orKey}` } }).then((r) => r.json()).catch((e) => ({ error: e.message }));
  for (const m of (or.data || []).filter((m) => m.id.startsWith("google/"))) console.log(`  ${m.id} | pricing ${JSON.stringify(m.pricing)}`);
}

if (job.want) {
  // refusals cost nothing on either provider (2026-10-04), so the expected spend is want pictures a route; the
  // real cost is added up as it goes and stops the run past job.max_usd
  const estimate = job.routes.reduce((s, r) => s + ROUTES[r].usd * Math.min(job.want_by?.[r] ?? job.want, (job.stop_at?.[r] ?? job.max_attempts) - (job.start_at?.[r] || 0)), 0);
  console.log(`Bench until ${job.want} pictures a route, at most ${job.max_attempts} attempts each: worst case about $${estimate.toFixed(3)} at list prices (cap $${job.max_usd}).`);
  if (estimate > job.max_usd) { console.log("Refused: over the cap."); process.exit(1); }
  const table = [];
  for (const route of job.routes) {
    const R = ROUTES[route];
    const set = job.prompt_sets[job.family_of?.[route] || R.family]; // job.family_of: a route's own prompt set
    let drawn = 0, refused = 0, black = 0, neurons = 0, usd = 0, ms = 0, n = 0;
    const lines = [];
    // job.start_at: attempts a route already used in an earlier run (they count toward max_attempts)
    // job.want_by / job.stop_at: per-route goal and last attempt (e.g. to try a good model's remaining outfits)
    const want = job.want_by?.[route] ?? job.want, end = Math.min(job.stop_at?.[route] ?? job.max_attempts, job.max_attempts);
    for (let a = job.start_at?.[route] || 0; a < end && drawn < want; a++) {
      const v = a % set.length;
      const name = `${route}-${String(a + 1).padStart(2, "0")}-v${v + 1}`;
      const refs = R.family === "ref" ? [job.reference, ...(job.refs || [])] : [];
      const seed = 5000 + a * 7919;
      const t0 = Date.now();
      lastNeurons = null;
      let r;
      try { r = await R.run(set[v], refs, seed); } catch (e) { r = { error: e.message }; }
      const took = Date.now() - t0;
      n++; ms += took;
      // what Cloudflare billed (also on a refusal, if it says so), else the list price for a drawn picture
      const cost = lastNeurons != null ? lastNeurons * NEURON_USD : Number.isFinite(Number(r.usage?.cost)) ? Number(r.usage.cost) : r.error ? 0 : R.usd;
      if (lastNeurons != null) neurons += lastNeurons;
      usd += cost; spentUsd += cost;
      const bill = `${lastNeurons != null ? `${lastNeurons.toFixed(1)} neurons, ` : ""}$${cost.toFixed(4)}${r.usage ? ` usage ${JSON.stringify(r.usage).slice(0, 160)}` : ""}`;
      if (r.error) {
        refused++;
        lines.push(`${name} (${job.labels[v]}): REFUSED ${r.error.slice(0, 220)} [${took} ms, ${bill}]`);
      } else {
        const s = save(name, r.bytes);
        if (s.black) { black++; lines.push(`${name} (${job.labels[v]}): BLACK picture (safety checker) [${took} ms, ${bill}]`); }
        else { drawn++; lines.push(`${name} (${job.labels[v]}): drawn ${s.size} [${took} ms, ${bill}]`); }
      }
      console.log(lines.at(-1));
      if (r.error && a === 0 && !/3030|sensitive|safety|moderat|content|policy|flagged|nsfw/i.test(r.error)) { console.log(`  ${route} looks broken: stopped`); break; }
      if (spentUsd > job.max_usd) { console.log("Money cap reached: stopping."); break; }
    }
    table.push(`${route}: ${drawn} drawn, ${refused} refused, ${black} black in ${n} attempts; ${neurons.toFixed(0)} neurons, about $${usd.toFixed(3)}; ${Math.round(ms / Math.max(n, 1) / 1000)} s a call`);
    console.log(`== ${table.at(-1)}\n`);
    if (spentUsd > job.max_usd) break;
  }
  console.log(`\nSummary (spent about $${spentUsd.toFixed(3)}):\n${table.join("\n")}`);
  process.exit(0);
}

const estimate = job.routes.reduce((s, r) => s + ROUTES[r].usd * job.prompts.length, 0);
console.log(`Bench: ${job.routes.length} routes x ${job.prompts.length} prompts, list price about $${estimate.toFixed(3)} (cap $${job.max_usd}).`);
if (estimate > job.max_usd) { console.log("Refused: over the cap."); process.exit(1); }

// job.fallbacks: a route to run instead when one breaks (e.g. Cloudflare's third-party models without credits)
const rows = [];
const queue = [...job.routes];
for (let q = 0; q < queue.length; q++) {
  const route = queue[q];
  // a route that fails for a reason other than its filter (no credits, unknown model) is skipped after one try
  let broken = false;
  for (const [p, prompt] of job.prompts.entries()) {
    const name = `${route}-${p + 1}`;
    if (broken) { rows.push(`${name}: skipped (route broken)`); continue; }
    if (spentUsd + ROUTES[route].usd > job.max_usd) { rows.push(`${name}: skipped (money cap)`); continue; }
    const refs = [job.reference, ...(job.refs[p] || [])];
    const t0 = Date.now();
    let r;
    try { r = await ROUTES[route].run(prompt, refs, 1000 + p * 7919); } catch (e) { r = { error: e.message }; }
    const ms = Date.now() - t0;
    console.log(`\n#${name} (${job.labels[p]}), ${ms} ms${r.usage ? `, usage ${JSON.stringify(r.usage)}` : ""}`);
    if (r.error) {
      console.log(`  FAILED: ${r.error}`);
      rows.push(`${name}: FAILED ${r.error.slice(0, 160)}`);
      if (p === 0 && !/3030|sensitive|safety|moderat|content|policy|flagged|nsfw/i.test(r.error)) {
        broken = true;
        const alt = job.fallbacks?.[route];
        if (alt && !queue.includes(alt)) { queue.push(alt); console.log(`  => ${route} looks broken, ${alt} runs instead`); }
      }
      continue;
    }
    spentUsd += ROUTES[route].usd;
    const raw = `${out}/${name}-raw`;
    writeFileSync(raw, r.bytes);
    const jpg = `${out}/${name}.jpg`;
    execFileSync("convert", [raw, "-resize", "768x1024", "-quality", "88", "-strip", jpg]);
    execFileSync("rm", [raw]);
    const size = execFileSync("identify", ["-format", "%wx%h", jpg]).toString();
    console.log(`  saved ${jpg} (${size})`);
    rows.push(`${name}: ok ${size}, ${ms} ms`);
  }
}
console.log(`\nSummary (spent about $${spentUsd.toFixed(3)} at list prices):\n${rows.join("\n")}`);
