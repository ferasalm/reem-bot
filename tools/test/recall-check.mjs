// How close bge-m3 (RECALL.MODEL) puts pairs of her replies: the same story in other words should score at least
// RECALL.REPEAT_SCORE, different replies below it. Workers AI REST (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID); no OpenRouter.
// Run from Actions > Recall check.
import { loadWorker } from "./load-worker.mjs";
const W = await loadWorker();
const R = W.CONFIG.RECALL;
const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account } = process.env;
const embed = async (text) => {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${R.MODEL}`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
  const d = await res.json();
  if (!d.success) throw new Error(JSON.stringify(d.errors));
  return d.result.data;
};
const cos = (a, b) => { let d = 0, x = 0, y = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; x += a[i] * a[i]; y += b[i] * b[i]; } return d / Math.sqrt(x * y); };
// [expected same?, a, b]: repeats like the ones seen live (docs/LESSONS.md §5), and different replies in her voice
const PAIRS = [
  [true, "a client paid me with a receipt written on a napkin today. a napkin, habibi", "remember the guy with the napkin receipt? another one today, same energy"],
  [true, "taxes are a suggestion, apparently, according to my newest client", "my new client thinks taxes are optional. like a suggestion"],
  [true, "the radiator is banging again, it sounds like someone trapped in the walls", "that radiator is doing its trapped-ghost banging again"],
  [true, "my mother called three times. i'm not answering, she wants to know when i'm getting married", "mama called again about marriage. i let it ring"],
  [false, "a client paid me with a receipt written on a napkin today. a napkin, habibi", "the radiator is banging again, it sounds like someone trapped in the walls"],
  [false, "come to the landing. don't knock. just stand there and let me decide", "i just closed the hovsepian quarterlies and my eyes are crossing"],
  [false, "you walked past my door three times tonight. i counted", "you're awake, no? your floor says you are"],
  [false, "my mother called three times. i'm not answering", "taxes are a suggestion, apparently, according to my newest client"],
  [false, "yalla, open the door, i'm on the landing in your old t-shirt", "what are you wearing right now, be honest"],
];
const vecs = await embed(PAIRS.flatMap(([, a, b]) => [a, b]));
let wrong = 0;
PAIRS.forEach(([same, a, b], i) => {
  const s = cos(vecs[2 * i], vecs[2 * i + 1]);
  const flagged = s >= R.REPEAT_SCORE;
  if (flagged !== same) wrong++;
  console.log(`${s.toFixed(3)} ${same ? "same " : "other"} ${flagged === same ? "ok  " : "MISS"} | ${a.slice(0, 50)} || ${b.slice(0, 50)}`);
});
console.log(`REPEAT_SCORE ${R.REPEAT_SCORE}: ${PAIRS.length - wrong}/${PAIRS.length} as expected`);
