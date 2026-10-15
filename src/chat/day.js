// Her day: hour, schedule, weather, the day's plan.
import { CONFIG, fill } from "../config/index.js";
import { callModel } from "../platform/ai.js";
import { xfetch } from "../platform/http.js";

/* ------------------------------------------------------------------ */
/*  Her clock                                                          */
/* ------------------------------------------------------------------ */

export const herHour = () =>
  Number(new Intl.DateTimeFormat("en-US", { timeZone: CONFIG.CHARACTER.TIMEZONE, hour: "numeric", hourCycle: "h23" }).format(new Date())) % 24;
export const herDay = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: CONFIG.CHARACTER.TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
// from <= hour < to; also works across midnight (from 22 to 2)
export const inHours = (h, from, to) => (from <= to ? h >= from && h < to : h >= from || h < to);
/* --- Her real day (CONFIG.DAY): Watertown's weather and today's plan, cached in KV "day" --- */

// What's cached for today ({ day, plan, weather, wxAt }); a stale part is refreshed after this reply (ctx.waitUntil)
export async function dayInfo(env, ctx) {
  const D = CONFIG.DAY;
  const kv = env.REEM_KV;
  if (!kv || (!D.WEATHER && !D.PLAN)) return {};
  const cached = (await kv.get("day", "json").catch(() => null)) || {};
  const today = herDay();
  const planStale = D.PLAN && cached.day !== today && !!env.AI;
  const wxStale = D.WEATHER && Date.now() - (cached.wxAt || 0) > (Number(D.WEATHER_TTL_MIN) || 30) * 60000;
  if ((planStale || wxStale) && Date.now() - (cached.tried || 0) > 120000 && ctx && ctx.waitUntil) {
    cached.tried = Date.now();
    await kv.put("day", JSON.stringify(cached)).catch(() => {});
    ctx.waitUntil(refreshDay(env, cached, today, { plan: planStale, weather: wxStale }).catch((e) => console.error("her day: couldn't refresh", e.message || e)));
  }
  return { plan: cached.day === today ? cached.plan : null, weather: Date.now() - (cached.wxAt || 0) < 3 * 3600000 ? cached.weather : "" };
}
export async function refreshDay(env, cached, today, { plan, weather }) {
  const D = CONFIG.DAY;
  const out = { ...cached };
  if (weather) {
    const res = await xfetch(`https://api.open-meteo.com/v1/forecast?latitude=${D.LAT}&longitude=${D.LON}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=${encodeURIComponent(CONFIG.CHARACTER.TIMEZONE)}&forecast_days=1`, { signal: AbortSignal.timeout(8000) });
    const w = await res.json();
    if (w && w.current) {
      out.weather = weatherWords(w);
      out.temp = Math.round(Number(w.current.temperature_2m)); // Step 4: the outfit band (outfitBand)
      out.wxAt = Date.now();
    }
  }
  if (plan) {
    const usual = (CONFIG.CHARACTER.SCHEDULE || []).filter((x) => x.from >= D.PLAN_FROM || x.to > D.PLAN_FROM).map((x) => `${x.from}-${x.to}: ${x.doing}`).join("; ");
    const date = new Date().toLocaleDateString("en-US", { timeZone: CONFIG.CHARACTER.TIMEZONE, weekday: "long", month: "long", day: "numeric" });
    const prompt = fill(D.PLAN_PROMPT, { date, weather: out.weather || "unknown", usual, from: D.PLAN_FROM, to: D.PLAN_TO });
    const text = await callModel(env, [{ role: "user", content: prompt }], { temperature: 0.9, max_tokens: 500 }, { model: D.PLAN_MODEL, timeoutMs: 40000, attempts: 2, task: true });
    const lines = parsePlan(text);
    if (lines.length >= 3) { out.plan = lines; out.day = today; }
  }
  delete out.tried;
  // `cached` was read before this reply: keep the outfits dayOutfits picked meanwhile, or the day's outfit changes (Step 4 review)
  const now = await env.REEM_KV.get("day", "json").catch(() => null);
  if (now && now.outfits) out.outfits = now.outfits;
  await env.REEM_KV.put("day", JSON.stringify(out));
}
// "14-16: client books" lines → [{ from, to, doing }]
export function parsePlan(text) {
  return String(text || "").split("\n").map((l) => l.trim().replace(/^[-*•]\s*/, "").match(/^(\d{1,2})(?::\d{2})?\s*[-–]\s*(\d{1,2})(?::\d{2})?\s*[:.)-]?\s*(.{4,200})$/))
    .filter(Boolean).map((m) => ({ from: Number(m[1]) % 25, to: Number(m[2]) % 25, doing: m[3].trim() })).filter((x) => x.from < x.to || x.to === 0);
}
// Today's plan for her hour, inside DAY.PLAN_FROM-PLAN_TO only
export function planNow(plan) {
  const D = CONFIG.DAY;
  const h = herHour();
  if (!Array.isArray(plan) || !inHours(h, D.PLAN_FROM, D.PLAN_TO % 24 || 24)) return "";
  const hit = plan.find((x) => inHours(h, x.from, x.to || 24));
  return hit ? hit.doing : "";
}
export const WEATHER_CODES = [[0, "clear"], [1, "mostly clear"], [2, "partly cloudy"], [3, "overcast"], [48, "foggy"], [57, "drizzling"], [67, "raining"], [77, "snowing"], [82, "rain showers"], [86, "snow showers"], [99, "a thunderstorm"]];
export function weatherWords(w) {
  const c = w.current;
  const sky = (WEATHER_CODES.find(([max]) => c.weather_code <= max) || [0, "unsettled"])[1];
  const d = w.daily || {};
  const range = d.temperature_2m_max ? `, today ${Math.round(d.temperature_2m_min[0])}-${Math.round(d.temperature_2m_max[0])}°F` : "";
  return `${Math.round(c.temperature_2m)}°F and ${sky}${c.wind_speed_10m >= 18 ? ", windy" : ""}${range}`;
}
// Her SCHEDULE slot right now
export function scheduleNow() {
  const h = herHour();
  return (CONFIG.CHARACTER.SCHEDULE || []).find((s) => inHours(h, s.from, s.to));
}
