// Draws pictures of Reem with Workers AI (FLUX.2 klein 4B) through the Cloudflare REST API, for
// .github/workflows/face.yml. Reads tools/face/job.json; writes tools/face/out/<mode>/NN.jpg (raw) and prints
// what the API answered (shape, timing), plus what the vision model sees in each picture.
// Falls back to Pollinations (free FLUX, no key) when the token can't use Workers AI.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const job = JSON.parse(readFileSync("tools/face/job.json", "utf8"));
const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account } = process.env;
const api = (model) => `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`;
const DRAW = "@cf/black-forest-labs/flux-2-klein-4b";
const SEE = "@cf/meta/llama-4-scout-17b-16e-instruct";
const out = `tools/face/out/${job.mode}`;
mkdirSync(out, { recursive: true });
let cloudflare = !!(token && account);

async function drawCloudflare(prompt, seed) {
  const form = new FormData();
  form.append("prompt", prompt);
  form.append("width", String(job.size));
  form.append("height", String(job.size));
  // no seed: klein answers 5006 to one since 2026-10-03
  if (job.reference) form.append("input_image_0", new Blob([readFileSync(job.reference)], { type: "image/jpeg" }), "ref.jpg");
  const t0 = Date.now();
  const res = await fetch(api(DRAW), { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
  const type = res.headers.get("content-type") || "";
  const ms = Date.now() - t0;
  if (type.startsWith("image/")) {
    console.log(`  cloudflare: HTTP ${res.status}, ${type}, ${ms} ms (raw image)`);
    return Buffer.from(await res.arrayBuffer());
  }
  const data = await res.json().catch(() => ({}));
  const shape = JSON.stringify(data, (k, v) => (typeof v === "string" && v.length > 80 ? `<string ${v.length}>` : v));
  console.log(`  cloudflare: HTTP ${res.status}, ${type}, ${ms} ms, body ${shape.slice(0, 400)}`);
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const b64 = data?.result?.image ?? data?.image;
  if (typeof b64 !== "string") throw new Error("no image in the answer");
  return Buffer.from(b64, "base64");
}

async function drawPollinations(prompt, seed) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${job.size}&height=${job.size}&seed=${seed}&model=flux&nologo=true`;
  const t0 = Date.now();
  const res = await fetch(url);
  console.log(`  pollinations: HTTP ${res.status}, ${res.headers.get("content-type")}, ${Date.now() - t0} ms`);
  if (!res.ok) throw new Error(`pollinations HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function describe(file) {
  if (!cloudflare || !job.describe) return;
  const img = `data:image/jpeg;base64,${readFileSync(file).toString("base64")}`;
  const t0 = Date.now();
  const res = await fetch(api(SEE), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: [
        { type: "text", text: "Estimate the apparent age of the person in this photo as a range in years, on the first line as AGE: <low>-<high>. Then describe in three sentences: face shape, eyes, brows, hair, skin, expression; what she is wearing and whether a phone or a hand holding one is visible; and whether it looks like a real photo or an illustration." },
        { type: "image_url", image_url: { url: img } },
      ] }],
      max_tokens: 160,
    }),
  });
  const data = await res.json().catch(() => ({}));
  console.log(`  vision: HTTP ${res.status}, ${Date.now() - t0} ms, ${JSON.stringify(data?.result ?? data).slice(0, 600)}`);
}

let n = 0;
for (const [p, prompt] of job.prompts.entries()) {
  for (let k = 0; k < (job.per_prompt || 1); k++) {
    n++;
    const seed = 1000 + n * 7919;
    const jpg = `${out}/${String(n).padStart(2, "0")}.jpg`;
    console.log(`\n#${n} prompt ${p + 1}${job.labels ? ` (${job.labels[p]})` : ""}, seed ${seed}${job.reference ? `, reference ${job.reference}` : ""}`);
    let bytes = null;
    try {
      if (cloudflare) bytes = await drawCloudflare(prompt, seed);
    } catch (e) {
      console.log(`  cloudflare failed: ${e.message}`);
      if (e.status === 401 || e.status === 403) {
        console.log("  => the API token can't use Workers AI; using Pollinations for the rest (add 'Workers AI: Read' to the token for real checks)");
        cloudflare = false;
      }
    }
    if (!bytes && !job.reference) {
      try {
        bytes = await drawPollinations(prompt, seed);
      } catch (e) {
        console.log(`  pollinations failed: ${e.message}`);
      }
    }
    if (!bytes) continue;
    // The format from the first bytes (ImageMagick goes by the extension)
    const ext = bytes[0] === 0x89 ? "png" : bytes[0] === 0xff ? "jpg" : bytes.slice(8, 12).toString() === "WEBP" ? "webp" : "bin";
    console.log(`  format: ${ext}, ${bytes.length} bytes`);
    const raw = `${out}/${String(n).padStart(2, "0")}-full.${ext}`;
    writeFileSync(raw, bytes);
    execFileSync("convert", [raw, "-resize", "480x480^", "-gravity", "center", "-extent", "480x480", "-quality", "86", "-strip", jpg]);
    execFileSync("rm", [raw]);
    console.log(`  saved ${jpg} (${readFileSync(jpg).length} bytes)`);
    // Small preview in the log, in case the branch push is refused
    const thumb = execFileSync("convert", [jpg, "-resize", "96x96", "-quality", "70", "jpg:-"]);
    console.log(`  thumb96 ${thumb.toString("base64")}`);
    await describe(jpg);
  }
}
console.log(`\nDone: ${existsSync(out) ? "see " + out : "nothing drawn"}`);
