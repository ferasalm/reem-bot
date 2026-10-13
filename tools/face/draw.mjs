// Draws pictures of Reem with Workers AI (FLUX.2 klein 4B) through the Cloudflare REST API, for
// .github/workflows/face.yml. Reads tools/face/job.json; writes tools/face/out/<mode>/NN.jpg (raw) and prints
// what the API answered (shape, timing), plus what the vision model sees in each picture.
// Falls back to Pollinations (free FLUX, no key) when the token can't use Workers AI.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const job = JSON.parse(readFileSync("tools/face/job.json", "utf8"));
const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account } = process.env;
const api = (model) => `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`;
// job.model (Step B, 2026-10-13): another Workers AI image model, e.g. "@cf/black-forest-labs/flux-2-klein-9b" (the bot's since Step B)
const DRAW = job.model || "@cf/black-forest-labs/flux-2-klein-4b";
const SEE = "@cf/meta/llama-4-scout-17b-16e-instruct";
const out = `tools/face/out/${job.mode}`;
mkdirSync(out, { recursive: true });
let cloudflare = !!(token && account);

// Budget guard (2026-10-02 the grid runs used most of the day's 10,000 neurons, which the bot's own ledger never
// saw, and the bot was locked out). A run may cost at most RUN_CAP neurons, and is refused when it would take the
// account's real usage today (GraphQL analytics, bot included) past DAY_CAP, so tests stay inside the free
// allocation and leave the bot its share. job.json may raise either with "max_neurons" / "day_neurons".
// klein 4B: 4 output tiles (640x640 or 768x1024) + the reference images; klein 9B: its first megapixel (1,363.64) + input megapixels
const PICTURE_NEURONS = /klein-9b/.test(DRAW) ? 1500 : 125, SEE_NEURONS = 60;
const RUN_CAP = job.max_neurons || 3000;
const DAY_CAP = job.day_neurons || 7000;
let spent = 0;

async function neuronsToday() {
  const since = new Date().toISOString().slice(0, 10) + "T00:00:00Z";
  const query = `{ viewer { accounts(filter: { accountTag: "${account}" }) { aiInferenceAdaptiveGroups(limit: 100, filter: { datetimeHour_geq: "${since}" }) { sum { totalNeurons } } } } }`;
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
  const data = await res.json().catch(() => ({}));
  const rows = data?.data?.viewer?.accounts?.[0]?.aiInferenceAdaptiveGroups;
  if (!Array.isArray(rows)) throw new Error(`analytics answered ${JSON.stringify(data).slice(0, 300)}`);
  return rows.reduce((n, r) => n + (r.sum?.totalNeurons || 0), 0);
}

if (cloudflare) {
  const count = job.prompts.length * (job.per_prompt || 1);
  const estimate = count * (PICTURE_NEURONS + (job.describe ? SEE_NEURONS : 0));
  let today;
  try { today = await neuronsToday(); } catch (e) { console.log(`Budget guard: couldn't read today's usage (${e.message}); refusing to draw.`); process.exit(1); }
  console.log(`Budget guard: ${count} pictures ≈ ${estimate} neurons; the account used ${Math.round(today)} today (UTC); run cap ${RUN_CAP}, day cap ${DAY_CAP}.`);
  if (estimate > RUN_CAP) { console.log(`Refused: the job is bigger than the run cap. Split it, or set "max_neurons" in job.json.`); process.exit(1); }
  if (today + estimate > DAY_CAP) { console.log(`Refused: it would take today past ${DAY_CAP}. Run it after 00:00 UTC, or set "day_neurons" in job.json.`); process.exit(1); }
}

// job.width/height (else job.size, square); job.refs[p]: more reference images for prompt p (input_image_1...)
const W = job.width || job.size, H = job.height || job.size;
const imagesFor = (p) => [job.reference, ...((job.refs && job.refs[p]) || [])].filter(Boolean);

async function drawCloudflare(prompt, seed, p) {
  const form = new FormData();
  form.append("prompt", prompt);
  form.append("width", String(W));
  form.append("height", String(H));
  form.append("seed", String(seed));
  imagesFor(p).forEach((f, i) => form.append(`input_image_${i}`, new Blob([readFileSync(f)], { type: "image/jpeg" }), `ref${i}.jpg`));
  const t0 = Date.now();
  const res = await fetch(api(DRAW), { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
  spent += Number(res.headers.get("cf-ai-neurons")) || (res.ok ? PICTURE_NEURONS : 0);
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
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${W}&height=${H}&seed=${seed}&model=flux&nologo=true`;
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
  spent += Number(res.headers.get("cf-ai-neurons")) || (res.ok ? SEE_NEURONS : 0);
  const data = await res.json().catch(() => ({}));
  console.log(`  vision: HTTP ${res.status}, ${Date.now() - t0} ms, ${JSON.stringify(data?.result ?? data).slice(0, 600)}`);
}

let n = 0;
draw: for (const [p, prompt] of job.prompts.entries()) {
  for (let k = 0; k < (job.per_prompt || 1); k++) {
    if (cloudflare && spent + PICTURE_NEURONS > RUN_CAP) { console.log(`\nStopped: ${Math.round(spent)} neurons spent, the run cap is ${RUN_CAP}.`); break draw; }
    n++;
    const seed = 1000 + n * 7919;
    const jpg = `${out}/${String(n).padStart(2, "0")}.jpg`;
    console.log(`\n#${n} prompt ${p + 1}${job.labels ? ` (${job.labels[p]})` : ""}, seed ${seed}${imagesFor(p).length ? `, references ${imagesFor(p).join(" ")}` : ""}`);
    let bytes = null;
    try {
      if (cloudflare) bytes = await drawCloudflare(prompt, seed, p);
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
    // a reference (job.square, the default): 480x480, under klein's 512 limit; else the whole picture, 600 px wide
    // job.keep_full (Step B): the picture as drawn, for reading at full size
    if (job.keep_full) execFileSync("convert", [raw, "-quality", "92", "-strip", jpg]);
    else if (job.square === false) execFileSync("convert", [raw, "-resize", "600x800", "-quality", "86", "-strip", jpg]);
    else execFileSync("convert", [raw, "-resize", "480x480^", "-gravity", "center", "-extent", "480x480", "-quality", "86", "-strip", jpg]);
    execFileSync("rm", [raw]);
    console.log(`  saved ${jpg} (${readFileSync(jpg).length} bytes)`);
    // Small preview in the log, in case the branch push is refused
    const thumb = execFileSync("convert", [jpg, "-resize", "96x96", "-quality", "70", "jpg:-"]);
    console.log(`  thumb96 ${thumb.toString("base64")}`);
    await describe(jpg);
  }
}
console.log(`\nNeurons this run: ${Math.round(spent)} (cap ${RUN_CAP}).`);
console.log(`\nDone: ${existsSync(out) ? "see " + out : "nothing drawn"}`);
