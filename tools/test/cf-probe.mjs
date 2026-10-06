// Empty answers from DeepSeek on Workers AI: a tiny prompt vs a normal one, with and without the AI Gateway "default".
// Workers AI REST only (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID). Actions > Cloudflare probe.
const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account } = process.env;
const model = process.env.PROBE_MODEL || "@cf/deepseek-ai/deepseek-v4-flash-0731";
const ask = async (messages, max_tokens, gateway) => {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(gateway ? { "cf-aig-gateway-id": "default" } : {}) },
    body: JSON.stringify({ messages, max_tokens, reasoning_effort: "none" }) });
  const d = await res.json().catch(() => ({}));
  return d.success === false ? `ERROR ${JSON.stringify(d.errors).slice(0, 120)}` : String(d.result?.choices?.[0]?.message?.content ?? "");
};
const CASES = [
  ["tiny, 5 tokens", [{ role: "user", content: "Reply with: OK" }], 5],
  ["tiny, 40 tokens", [{ role: "user", content: "Say hello in five words." }], 40],
  ["chat, 220 tokens", [{ role: "system", content: "You are Reem, 29, a dry, warm Armenian-Lebanese bookkeeper in Watertown texting the man across the landing. Short lowercase texts." }, { role: "user", content: "hey habibti how are you" }], 220],
];
for (const gateway of [false, true]) for (const [name, messages, max] of CASES) {
  const outs = [];
  for (let i = 0; i < 5; i++) { outs.push(await ask(messages, max, gateway)); await new Promise((r) => setTimeout(r, 1500)); }
  console.log(`${gateway ? "gateway" : "direct "} | ${name}: ${outs.filter((o) => !o.trim()).length}/5 empty | ${outs.map((o) => JSON.stringify(o.slice(0, 40))).join(" ")}`);
}
