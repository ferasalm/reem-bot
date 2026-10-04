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
const { CLOUDFLARE_API_TOKEN: cfToken, CLOUDFLARE_ACCOUNT_ID: account, OPENROUTER_API_KEY: orKey } = process.env;
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
  // FLUX.1 schnell (the bot's backup model): text only, always 1024x1024, 4.8 neurons per tile + 9.6 per step
  "cf-schnell": { usd: 0.0011, family: "text", run: (p, r, s) => cfJson("@cf/black-forest-labs/flux-1-schnell", { prompt: p, seed: s, steps: 8 }) },
  "or-grok": { usd: 0.024, run: (p, r, s) => openRouter("x-ai/grok-imagine-image", p, r, s) },
  "or-grok2": { usd: 0.06, run: (p, r, s) => openRouter("x-ai/grok-imagine-image-2.0", p, r, s) },
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

async function cfSD(model, prompt, mode, seed = 4242) {
  const [w, h] = job.sd_size || [480, 640];
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
async function openRouter(model, prompt, refs, seed, providerOptions) {
  const body = {
    model, prompt, seed, aspect_ratio: "3:4", n: 1,
    input_references: refs.map((f) => ({ type: "image_url", image_url: { url: dataUri(f) } })),
  };
  if (providerOptions) body.provider = { options: providerOptions };
  const res = await fetch("https://openrouter.ai/api/v1/images", {
    method: "POST", headers: { Authorization: `Bearer ${orKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
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

async function fetchImage(url) {
  if (url.startsWith("data:")) return Buffer.from(url.slice(url.indexOf(",") + 1), "base64");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image download HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
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

if (job.want) {
  const estimate = job.routes.reduce((s, r) => s + ROUTES[r].usd * job.max_attempts, 0);
  console.log(`Bench until ${job.want} pictures a route, at most ${job.max_attempts} attempts each: worst case about $${estimate.toFixed(3)} at list prices (cap $${job.max_usd}).`);
  if (estimate > job.max_usd) { console.log("Refused: over the cap."); process.exit(1); }
  const table = [];
  for (const route of job.routes) {
    const R = ROUTES[route];
    const set = job.prompt_sets[R.family];
    let drawn = 0, refused = 0, black = 0, neurons = 0, usd = 0, ms = 0, n = 0;
    const lines = [];
    for (let a = 0; a < job.max_attempts && drawn < job.want; a++) {
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
      const cost = lastNeurons != null ? lastNeurons * NEURON_USD : r.error ? 0 : R.usd;
      if (lastNeurons != null) neurons += lastNeurons;
      usd += cost; spentUsd += cost;
      const bill = `${lastNeurons != null ? `${lastNeurons.toFixed(1)} neurons, ` : ""}$${cost.toFixed(4)}`;
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
