// Workers AI diagnosis, for .github/workflows/ai-diag.yml. Prints Cloudflare's answers in full (never truncated):
// the token, the models' current input schemas, the account's real neuron usage (GraphQL analytics), and tiny
// test calls to klein, schnell and a text model. Calls that fail validation cost nothing; the others a few neurons.
const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account } = process.env;
const base = `https://api.cloudflare.com/client/v4`;
const auth = { Authorization: `Bearer ${token}` };
const KLEIN = "@cf/black-forest-labs/flux-2-klein-4b";
const SCHNELL = "@cf/black-forest-labs/flux-1-schnell";
const TEXT = "@cf/meta/llama-3.2-1b-instruct";

const short = (v) => JSON.stringify(v, (k, x) => (typeof x === "string" && x.length > 400 && /^[A-Za-z0-9+/=]+$/.test(x.slice(0, 100)) ? `<base64 ${x.length}>` : x), 1);
const HEADERS = /^(cf-ray|cf-ai|x-ratelimit|ratelimit|retry-after|server-timing|x-request-id|date)/i;

async function show(label, url, init = {}) {
  const t0 = Date.now();
  let res;
  try { res = await fetch(url, { ...init, headers: { ...auth, ...(init.headers || {}) } }); } catch (e) { console.log(`\n### ${label}: fetch failed: ${e.message}`); return null; }
  const type = res.headers.get("content-type") || "";
  const hdrs = [...res.headers].filter(([k]) => HEADERS.test(k)).map(([k, v]) => `${k}: ${v}`);
  console.log(`\n### ${label}: HTTP ${res.status} ${type} ${Date.now() - t0} ms`);
  if (hdrs.length) console.log(hdrs.join("\n"));
  if (type.startsWith("image/")) { console.log(`(image, ${(await res.arrayBuffer()).byteLength} bytes)`); return { ok: res.ok }; }
  const text = await res.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  console.log(typeof body === "string" ? body.slice(0, 4000) : short(body).slice(0, 6000));
  return body;
}

const form = (fields) => { const f = new FormData(); for (const [k, v] of Object.entries(fields)) f.append(k, v); return f; };
const run = (model) => `${base}/accounts/${account}/ai/run/${model}`;

console.log(`now ${new Date().toISOString()}, account ${account ? account.slice(0, 6) + "…" : "MISSING"}, token ${token ? "set" : "MISSING"}`);

// 1. The token and the account
await show("token verify (user)", `${base}/user/tokens/verify`);
await show("token verify (account)", `${base}/accounts/${account}/tokens/verify`);

// 2. The models' current input schemas (free)
for (const m of [KLEIN, SCHNELL]) await show(`schema ${m}`, `${base}/accounts/${account}/ai/models/schema?model=${encodeURIComponent(m)}`);
await show("model search klein", `${base}/accounts/${account}/ai/models/search?search=klein`);

// 3. Real neuron usage (aiInferenceAdaptiveGroups): look up its sum and dimension fields, then hourly totals
const gql = (label, query, variables = {}) => show(label, `${base}/graphql`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query, variables }) });
const fieldsOf = async (type) => { const r = await gql(`fields of ${type}`, `{ __type(name: "${type}") { fields { name } } }`); return ((r && r.data && r.data.__type && r.data.__type.fields) || []).map((f) => f.name); };
const sums = await fieldsOf("AccountAiInferenceAdaptiveGroupsSum");
const dims = await fieldsOf("AccountAiInferenceAdaptiveGroupsDimensions");
const since = new Date(Date.now() - 3 * 864e5).toISOString();
const until = new Date().toISOString();
const pick = (want, all) => want.filter((w) => all.includes(w));
const hourly = pick(["datetimeHour"], dims);
const byModel = pick(["datetimeHour", "modelId"], dims);
const sumF = sums.length ? `sum { ${sums.join(" ")} }` : "";
if (hourly.length) {
  for (const [label, by] of [["usage by hour", hourly], ["usage by hour and model", byModel]]) {
    await gql(label, `{ viewer { accounts(filter: { accountTag: "${account}" }) { aiInferenceAdaptiveGroups(limit: 1000, filter: { datetimeHour_geq: "${since}", datetimeHour_leq: "${until}" }, orderBy: [datetimeHour_ASC]) { count ${sumF} dimensions { ${by.join(" ")} } } } } }`);
  }
} else console.log("no datetimeHour dimension; dimensions are:", dims.join(", "));

// 4. Tiny calls. Order: the one expected to fail validation first (costs nothing), then klein without seed,
// then other models, so we see whether a block is klein-only or the whole account.
await show("klein multipart WITH seed, 256 px", run(KLEIN), { method: "POST", body: form({ prompt: "a red apple on a table", width: "256", height: "256", seed: "12345" }) });
await show("klein multipart no seed, 256 px", run(KLEIN), { method: "POST", body: form({ prompt: "a red apple on a table", width: "256", height: "256" }) });
await show("schnell JSON, 1 step", run(SCHNELL), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: "a red apple on a table", steps: 1 }) });
await show("schnell JSON WITH seed, 1 step", run(SCHNELL), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: "a red apple on a table", steps: 1, seed: 12345 }) });
await show("text model, 5 tokens", run(TEXT), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: "Say ok" }], max_tokens: 5 }) });
