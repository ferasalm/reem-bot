// Empty answers from DeepSeek on Workers AI: a tiny prompt vs a normal one, with and without the AI Gateway "default".
// Workers AI REST only (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID). Actions > Cloudflare probe.
const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account } = process.env;
const model = process.env.PROBE_MODEL || "@cf/deepseek-ai/deepseek-v4-flash-0731";
const ask = async (messages, max_tokens, gateway, reasoning_effort = "none") => {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(gateway ? { "cf-aig-gateway-id": "default" } : {}) },
    body: JSON.stringify({ messages, max_tokens, reasoning_effort }) });
  const d = await res.json().catch(() => ({}));
  return d.success === false ? `ERROR ${JSON.stringify(d.errors).slice(0, 120)}` : String(d.result?.choices?.[0]?.message?.content ?? "");
};
const PLAN = "Write Reem Nabot's plan for today, Wednesday, October 7. She is 29, a freelance bookkeeper in Watertown. Weather today: 52°F and raining. Write 6 to 8 lines from 8:00 to 24:00, each exactly like \"14-16: what she's doing\". Never him. No intro, only the lines.";
const CASES = [
  ["plan, reasoning low", [{ role: "user", content: PLAN }], 1500, "low"],
  ["plan, reasoning high", [{ role: "user", content: PLAN }], 3000, "high"],
  ["tiny with a system line, low", [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Say hello in five words." }], 400, "low"],
];
for (const gateway of [false]) for (const [name, messages, max, effort] of CASES) {
  const outs = [];
  for (let i = 0; i < 5; i++) { outs.push(await ask(messages, max, gateway, effort)); await new Promise((r) => setTimeout(r, 1500)); }
  console.log(`${gateway ? "gateway" : "direct "} | ${name}: ${outs.filter((o) => !o.trim()).length}/5 empty | ${outs.map((o) => JSON.stringify(o.slice(0, 40))).join(" ")}`);
}
