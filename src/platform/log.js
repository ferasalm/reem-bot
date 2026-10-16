// D1 (reem-studio): the pictures log, the events log, the per-reply trace.
// The studio's log (D1, binding STUDIO_DB; Step 1 of docs/WORKPLAN.md): every picture's prompt, LoRAs, references, settings,
// seed and cost. The schema is applied once per isolate; no binding = no log, and nothing else changes.
export const STUDIO_SCHEMA = `
CREATE TABLE IF NOT EXISTS pictures (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, chat TEXT, source TEXT NOT NULL,
  asked TEXT, her_words TEXT, llm_text TEXT, kind TEXT, nsfw TEXT, model TEXT, prompt TEXT NOT NULL, loras TEXT, refs TEXT,
  width INTEGER, height INTEGER, steps INTEGER, cfg REAL, seed INTEGER, cost REAL, ms INTEGER, attempts INTEGER, ok INTEGER NOT NULL,
  error TEXT, tg_thumb TEXT, tg_full TEXT, spec TEXT, lint TEXT, scheduler TEXT);
CREATE INDEX IF NOT EXISTS pictures_at ON pictures(at);
CREATE TABLE IF NOT EXISTS presets (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, author TEXT, name TEXT, body TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, chat TEXT, kind TEXT NOT NULL, mode TEXT,
  outcome TEXT NOT NULL, error TEXT, model TEXT, calls TEXT, attempts INTEGER, backup INTEGER, ms INTEGER, model_ms INTEGER, late_ms INTEGER, detail TEXT);
CREATE INDEX IF NOT EXISTS events_at ON events(at);
`;
// columns added after a table existed (CREATE TABLE IF NOT EXISTS leaves an old table as it was); each runs alone, "duplicate column" is fine
// (Rebuild Step 2: the picture core's spec, its lint findings and the sampler)
export const STUDIO_MIGRATIONS = ["ALTER TABLE pictures ADD COLUMN spec TEXT", "ALTER TABLE pictures ADD COLUMN lint TEXT", "ALTER TABLE pictures ADD COLUMN scheduler TEXT"];
export let studioSchema = null;
export function ensureStudioSchema(env) {
  if (!env.STUDIO_DB) return Promise.resolve(false);
  if (!studioSchema) {
    // one prepared statement each in a batch: D1's exec() reads one statement per line, and CREATE TABLE spans three
    const sqls = STUDIO_SCHEMA.split(";").map((q) => q.trim()).filter(Boolean);
    studioSchema = env.STUDIO_DB.batch(sqls.map((q) => env.STUDIO_DB.prepare(q))).then(
      async () => {
        for (const q of STUDIO_MIGRATIONS) {
          try {
            await env.STUDIO_DB.prepare(q).run();
          } catch {}
        }
        return true;
      },
      (e) => {
        studioSchema = null; // try again next time
        console.error("studio schema", e);
        return false;
      },
    );
  }
  return studioSchema;
}
// One row in the studio's log: its id, or null (no binding, or the write failed). Never throws: a failed write costs the log
// a row, never the picture.
export async function logPicture(env, row) {
  try {
    if (!(await ensureStudioSchema(env))) return null;
    const cols = Object.keys(row);
    const res = await env.STUDIO_DB.prepare(`INSERT INTO pictures (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`).bind(...cols.map((c) => row[c] ?? null)).run();
    return res?.meta?.last_row_id ?? null;
  } catch (e) {
    console.error("logPicture failed", e);
    return null;
  }
}
// The reliability log (Rebuild Step 0, 2026-10-15): one `events` row per reply, command, failure and memory fold: kind, outcome
// (ok / error / dropped / skipped), the error, the chat model calls (model, ms, error), whether the backup answered, the total ms,
// the ms spent in the model and how late the reply was against the time she meant to answer (late_ms). Never throws.
export async function logEvent(env, row) {
  try {
    if (!(await ensureStudioSchema(env))) return null;
    const r = { at: new Date().toISOString(), ...row };
    for (const k of Object.keys(r)) if (r[k] !== null && typeof r[k] === "object") r[k] = JSON.stringify(r[k]);
    if (r.error != null) r.error = String(r.error).slice(0, 500);
    const cols = Object.keys(r);
    const res = await env.STUDIO_DB.prepare(`INSERT INTO events (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`).bind(...cols.map((c) => r[c] ?? null)).run();
    return res?.meta?.last_row_id ?? null;
  } catch (e) {
    console.error("logEvent failed", e);
    return null;
  }
}
// What one reply collects on the way (the queue runs one reply at a time; a quick command that runs beside it adds a call at worst)
export let trace = null;
export function startTrace() {
  trace = { t0: Date.now(), calls: [], attempts: 0, backup: false, lateMs: null, mode: null };
  return trace;
}
export function traceCall(model, t0, e) {
  if (!trace || trace.calls.length >= 8) return;
  trace.calls.push({ model, ms: Date.now() - t0, ...(e ? { error: String((e && e.message) || e).slice(0, 120) } : {}) });
}
export function traceRow(kind, outcome, error) {
  const t = trace || { t0: Date.now(), calls: [], attempts: 0, backup: false };
  const chat = t.chat;
  return {
    chat: chat == null ? null : String(chat), kind, mode: t.mode || null, outcome, error: error || null,
    model: (t.calls.find((c) => !c.error) || t.calls[0] || {}).model || null,
    calls: t.calls.length ? t.calls : null, attempts: t.attempts || null, backup: t.backup ? 1 : 0,
    ms: Date.now() - t.t0, model_ms: t.calls.reduce((n, c) => n + c.ms, 0) || null, late_ms: t.lateMs,
  };
}
// Telegram's own copies of a logged picture (free, no re-upload): tg_thumb = the largest PhotoSize at most 400 px wide,
// tg_full = the last (largest) one
export async function logSent(env, id, photo) {
  try {
    if (!env.STUDIO_DB || !id || !Array.isArray(photo) || !photo.length) return;
    const small = [...photo].filter((p) => p.width <= 400).sort((a, b) => a.width - b.width);
    const thumb = (small.length ? small : [...photo].sort((a, b) => a.width - b.width)).at(-1);
    await env.STUDIO_DB.prepare("UPDATE pictures SET tg_thumb = ?, tg_full = ? WHERE id = ?").bind(thumb.file_id, photo.at(-1).file_id, id).run();
  } catch (e) {
    console.error("logSent failed", e);
  }
}
// The row for one drawPicture call: what was finally sent (or tried last) and what it cost
export function pictureRow(prompt, L, rec, ok) {
  return {
    at: new Date().toISOString(),
    chat: L.chat == null ? null : String(L.chat),
    source: L.source || "other",
    asked: L.asked || null,
    her_words: L.herWords || null,
    llm_text: L.llmText || null,
    kind: rec.kind,
    nsfw: rec.nsfw || null,
    model: rec.model || null,
    prompt: rec.prompt || prompt,
    loras: JSON.stringify(rec.loras),
    refs: JSON.stringify(rec.refs),
    width: rec.width,
    height: rec.height,
    steps: rec.steps,
    cfg: rec.cfg,
    seed: rec.seed || null,
    cost: rec.cost || 0,
    ms: Date.now() - rec.ms0,
    attempts: rec.attempts,
    ok: ok ? 1 : 0,
    error: ok ? rec.note || null : rec.error || null, // a drawn picture: the anatomy check's mistakes (Step D)
    // the picture core (Rebuild Step 2): its spec, the lint's findings (logged, never blocking) and the sampler; left out when empty
    ...(rec.spec ? { spec: JSON.stringify(rec.spec) } : {}),
    ...(rec.lint && rec.lint.length ? { lint: JSON.stringify(rec.lint) } : {}),
    ...(rec.scheduler ? { scheduler: rec.scheduler } : {}),
  };
}
