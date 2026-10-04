// Image model bench (owner, 2026-10-04: "Run test but half the cost"): the same lingerie prompts, her face
// (tools/face/reference.jpg) and the room's picture through each candidate model, for
// .github/workflows/image-bench.yml. Reads tools/face/bench.json; writes tools/face/out/bench/<model>-<n>.jpg and
// prints what each API answered (refusals word for word). Money cap: job.max_usd over the list prices below.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const job = JSON.parse(readFileSync("tools/face/bench.json", "utf8"));
const { CLOUDFLARE_API_TOKEN: cfToken, CLOUDFLARE_ACCOUNT_ID: account, OPENROUTER_API_KEY: orKey } = process.env;
const out = "tools/face/out/bench";
mkdirSync(out, { recursive: true });
const dataUri = (f) => `data:image/jpeg;base64,${readFileSync(f).toString("base64")}`;
let spentUsd = 0;

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
  "cf-dreamshaper": { usd: 0, run: (p) => cfSD("@cf/lykon/dreamshaper-8-lcm", p, "text") },
  "or-grok": { usd: 0.024, run: (p, r, s) => openRouter("x-ai/grok-imagine-image", p, r, s) },
  "or-grok2": { usd: 0.06, run: (p, r, s) => openRouter("x-ai/grok-imagine-image-2.0", p, r, s) },
  "or-klein4b": { usd: 0.016, run: (p, r, s) => openRouter("black-forest-labs/flux.2-klein-4b", p, r, s, job.klein_options) },
};

async function cfSD(model, prompt, mode) {
  const input = { prompt, num_steps: model.includes("lightning") || model.includes("lcm") ? 8 : 20, guidance: 7.5, width: 480, height: 640 };
  if (mode !== "text") {
    const base = execFileSync("convert", [job.base, "-resize", "480x640!", "png:-"]);
    input.image = [...base];
    input.strength = mode === "img2img" ? job.strength || 0.6 : 1;
  }
  if (mode === "inpaint") {
    const [x0, y0, x1, y1] = job.mask_box;
    const mask = execFileSync("convert", ["-size", "480x640", "xc:black", "-fill", "white", "-draw", `rectangle ${x0},${y0} ${x1},${y1}`, "-blur", "0x6", "png:-"]);
    input.mask = [...mask];
  }
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`, {
    method: "POST", headers: { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
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
