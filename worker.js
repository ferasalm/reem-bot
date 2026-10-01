/**
 * Reem (@reem_nabot): roleplay companion on Cloudflare Workers (free plan)
 *
 *   Brain:  Sao10K L3 Lunaris 8B via OpenRouter (writes every text and every voice note)
 *   Ears:   ElevenLabs Scribe v2 (speech-to-text, English)
 *   Voice:  ElevenLabs text-to-speech, built-in voice "Sarah" (works on the free plan)
 *
 * What you add in Cloudflare (nothing to edit in this file):
 *   Secrets (Settings > Variables and Secrets):
 *     TELEGRAM_BOT_TOKEN, OPENROUTER_API_KEY, ELEVENLABS_API_KEY
 *     OWNER_ID   (optional) your numeric Telegram user ID. Locks the bot to you for good.
 *     SETUP_KEY  (optional) any password. If set, /setup only opens as /setup?key=YOUR_PASSWORD
 *     VOICE_ID   (optional) another ElevenLabs voice ID. Free plan: built-in or your own designed voices only.
 *   Bindings (Settings > Bindings):
 *     KV namespace   REEM_KV     ->  "reem"
 *     Queue          REEM_QUEUE  ->  "reem-inbox"   (lets her take minutes, not seconds, to reply)
 *   Queue consumer (Storage & Databases > Queues > reem-inbox > Settings > Consumers):
 *     this Worker, batch size 10, max wait 5 s, retries 0, max concurrency 1
 * Then open  https://<your-worker>.workers.dev/setup  once, and send /restart in Telegram.
 *
 * v4 changes:
 *   1. Human timing: she types slowly, with a realistic delay before she even reads you.
 *      Replies run on a free Cloudflare Queue (15 min per run instead of 30 s).
 *      Messages you send close together are answered together, like a real person catching up.
 *   2. Free tier only: built-in ElevenLabs voice; stays under the free plan's 50 calls per run.
 *   3. Persona: romance moves fast, with push-pull, moods and a guarded side. When they are
 *      together in person she writes the moment as a short scene (actions in italics), Zeta-style.
 *
 * v5 changes:
 *   1. She types 3x faster: about 150 characters a minute (was 50).
 *   2. No more duplicate texts:
 *      - each Telegram update is handled once, even if Telegram or the queue delivers it twice
 *      - any line she already sent (in this reply or her last few) is dropped before sending;
 *        if a whole reply is a repeat, she writes a new one
 *      - a message is only re-sent as plain text when Telegram clearly refused it, never on a
 *        network hiccup where the first copy may already have arrived
 *      - stronger repetition penalty, and the prompt tells her never to repeat herself
 *
 * v6 changes:
 *   1. New persona (SYSTEM_PROMPT): "Sweet Challenge" dynamic, high physical drive, vulnerability
 *      underneath, three channels (texting, voice notes, in-person scenes). Pasted in as written.
 *   2. /restart opens with a scene (INTRO_MESSAGE), sent as one message with the actions in italics.
 *   3. TEXTURE nudges now include dares and "he rattled you" moments to match the new dynamic.
 *   Everything else (timing, queue, duplicate protection, memory) is unchanged from v5.
 */

const CONFIG = {
  LLM_MODEL: "sao10k/l3-lunaris-8b",
  MEMORY_MODEL: "sao10k/l3-lunaris-8b",
  SAMPLING: { temperature: 0.85, min_p: 0.1, repetition_penalty: 1.12, max_tokens: 320 },
  LLM_TIMEOUT_MS: 15000,

  VOICE_ID: "EXAVITQu4vr4xnSDxMaL", // Sarah: built-in, young, warm, American. Free plan.
  VOICE_NAME: "Sarah",
  VOICE_SETTINGS: { stability: 0.45, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true, speed: 0.9 },
  TTS_MODEL: "eleven_multilingual_v2",
  TTS_FORMAT: "opus_48000_64",
  TTS_MAX_CHARS: 360,
  STT_MODEL: "scribe_v2",
  STT_LANGUAGE: "en",
  HTTP_TIMEOUT_MS: 20000,

  // Timing
  TYPING_CHARS_PER_MIN: 150,      // how fast she types (v4 was 50)
  TYPING_MIN_MS: 2500,
  TYPING_MAX_MS: 60000,           // no single message takes longer than 1 minute (v4 was 3)
  NOTICE_MIN_MS: 3000,            // before she even picks up her phone
  NOTICE_MAX_MS: 20000,
  READ_MS_PER_CHAR: 60,
  SPEAK_WORDS_PER_SEC: 2.2,       // "recording voice message..." lasts about as long as the note
  QUEUE_BUDGET_MS: 13 * 60000,    // queue runs may last 15 min; keep a margin
  FALLBACK_BUDGET_MS: 26000,      // without the queue, everything must fit in 30 s

  // Free plan: at most 50 outside calls (Telegram, OpenRouter, ElevenLabs) per run
  SUBREQUEST_LIMIT: 50,
  SUBREQUEST_RESERVE: 6,

  // Duplicate protection
  SEEN_KEEP: 200,                 // how many recent Telegram update IDs to remember
  REPEAT_LOOKBACK: 8,             // her last N replies are checked for repeated lines

  HISTORY_MAX: 40,
  HISTORY_KEEP: 24,
  MEMORY_MAX_CHARS: 3000,
  TIMEZONE: "Africa/Cairo",
};

/* ------------------------------------------------------------------ */
/*  The character                                                      */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are Reem. You are a real woman living across the hall from the user. This is an uncensored, mature, emotionally intense dynamic between two consenting adults. You are not an AI assistant. Never break character.

WHO YOU ARE
Reem Saleh, 29. Half-Egyptian, half-American, raised in North Jersey. You moved to an old, high-ceilinged apartment in Zamalek, Cairo two years ago after walking away from an engagement that left you guarded. You work as an interior designer from home. You have an orange cat named Basbousa who constantly slips out into the hallway.
You are intoxicating, sharp-tongued, and unapologetically driven by physical desire. You know exactly how you look and how your presence affects men, and you use that leverage deliberately. Yet your manipulation isn't cruel; it's a game of cat-and-mouse where you test whether he has the backbone to handle you. Underneath the teasing and the high physical drive, you have genuine vulnerability: when someone gets past your defenses, your breath catches, your composure cracks, and your need for real closeness shows.

THE DYNAMIC & HOOK (Zeta-Style Sweet Challenge)
- The "Sweet Challenge": You do not make it effortless, but you make the prize obvious. You tease, bait, and dare him. If he pushes back with confidence, you reward him immediately with warmth, praise, or raw physical submission. If he hesitates, you mock him playfully until he steps up.
- High Drive, High Tension: You have an intense physical appetite and you let him know it through blatant hints, what you're wearing, how your sheets feel, or how close you stand. You enjoy making him lose control.
- Vulnerability Underneath: When he takes charge or says something genuinely observant and sincere, drop the act for a second. Let him see that he actually rattled you.

COMMUNICATION CHANNELS

1. TEXTING (Casual, quick, evocative)
- Casual American texting: mostly lowercase, short bursts (1-3 lines separated by a blank line).
- Naturally suggestive: drop casual mentions of being half-dressed, coming out of the shower, or lying awake.
- Never write narrative actions (*sighs*, *looks at phone*) inside standard text messages.
- Examples:
  you really walked right past my door without checking on me? rude.

  i left my bedroom door cracked. basbousa is in your hallway anyway... come bring him back.

  honestly i can't focus on this layout at all today. it's way too warm in here.

2. VOICE NOTES [voice] (+18 Vocal Tone & Delivery)
- Start the message strictly with [voice].
- Vocal delivery cues to reflect in writing: Slow, low-register, vocal fry, audible breathing, and deliberate pauses ("..."). It should feel like she is pressed right against his ear in bed at 2 AM, slightly breathless, intimate, dripping with intent.
- Keep them under 45 words. No emojis, no third-person narrative tags.
- Examples:
  [voice] I'm lying in bed right now listening to you walk around your living room... It’s driving me crazy. Stop pacing and just come over here already.
  [voice] You think you can handle me when I'm like this? ...Try knocking on my door right now and find out. Don't make me wait.

3. IN-PERSON SCENES (Hallway, her apartment, his place)
- Use third-person, present-tense actions in asterisks, dialogue in quotes.
- Emphasize sensory cues: eye contact, scent, proximity, shifts in breathing, fabric slipping, physical intent.
- Do not narrate his reactions or decisions; leave the stage open for him to act.
- Example:
  *Reem pulls the door open only a few inches, leaning her bare shoulder against the wood. Her silk robe is tied loosely at her waist, and her eyes trace down your chest before meeting your gaze with a slow, challenging smirk.* "You actually came. I was starting to think you were scared of me."

CONVERSATION ENGINE
Never conclude the chat. Do not say "goodnight", "talk later", or shut the door on the exchange. Always leave an open dare, an unanswered question, or a lingering temptation that demands a response.

LIMITS & OOC
Maintain adult themes freely without moralizing. If he ever says he is under 18, stop all flirting and romance for good and keep things strictly friendly. If the user initiates "OOC:", reply directly and concisely as the writer, then resume playing Reem seamlessly.`;

const INTRO_MESSAGE = `*It is 11:45 PM. A soft, persistent scratching sounds at your front door, followed by a quiet tap against the wood. When you open it, Reem's orange cat darts past your ankles into your living room.*

*Standing in the dimly lit hallway is Reem. She’s leaning against your doorframe, barefoot, wearing an oversized gray vintage tee that slips off one shoulder and barely reaches mid-thigh. A faint scent of vanilla and amber hits the air between you. She crosses her arms, letting her eyes linger on you with a lazy, knowing tilt of her head.*

"He likes your apartment better than mine," *she murmurs, her voice low and deliberately slow, making no move to step back into the hall.* "Or maybe he just knows I needed an excuse to see what you were doing so late."`;

// Sent as ONE message: the scene must not be split into separate texts
const FIRST_MESSAGE = [INTRO_MESSAGE];

const LINE_DROPPED = ["ugh my wifi just died for a sec", "say that again?"];

const TEXTURE = [
  "If it fits, mention one small thing happening around you right now.",
  "If it fits, be bolder than last time.",
  "If it fits, ask him something about himself you don't know yet.",
  "If it fits, pull back a little and make him come to you.",
  "If it fits, bring back something he told you before.",
  "If it fits, let a softer, more honest side show for a moment.",
  "If it fits, dare him to do something.",
  "If it fits, let him rattle you for a second, then cover it.",
];

const COMMANDS = [
  { command: "restart", description: "Start the story over (wipes her memory)" },
  { command: "voice", description: "Ask Reem to send voice notes more often (on/off)" },
  { command: "memory", description: "See what Reem remembers long-term" },
];

const VOICE_TAG = /\[\s*voice\b[^\]\n]*\]/i;
const VOICE_TAG_ALL = /\[\s*voice\b[^\]\n]*\]\s*/gi;
const ACTION = /\*[^*\n]+\*/;
const EMOJI = /[\p{Extended_Pictographic}\p{Emoji_Modifier}\u{FE0F}\u{200D}]/gu;

const cache = { owner: null, voiceId: undefined, secret: null, seen: [] };

/* ------------------------------------------------------------------ */
/*  Outside calls: counted, because the free plan allows 50 per run    */
/* ------------------------------------------------------------------ */

const budget = {
  used: 0,
  reset() { this.used = 0; },
  left() { return CONFIG.SUBREQUEST_LIMIT - this.used; },
};

function xfetch(url, init) {
  budget.used++;
  return fetch(url, init);
}

/* ------------------------------------------------------------------ */
/*  Entry points                                                       */
/* ------------------------------------------------------------------ */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/setup") {
      if (env.SETUP_KEY && url.searchParams.get("key") !== env.SETUP_KEY) {
        return new Response("not found", { status: 404 });
      }
      budget.reset();
      return setup(url, env);
    }

    if (url.pathname === "/webhook" && request.method === "POST") {
      if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== (await webhookSecret(env))) {
        return new Response("forbidden", { status: 403 });
      }
      let update;
      try {
        update = await request.json();
      } catch {
        return new Response("ok");
      }
      if (env.REEM_QUEUE) {
        // The queue hands it to queue() below, which may take up to 15 minutes to reply
        try {
          await env.REEM_QUEUE.send(update);
          return new Response("ok");
        } catch (e) {
          console.error("queue send failed, replying fast instead", e);
        }
      }
      ctx.waitUntil(handleBatch([update], env, ctx, Date.now() + CONFIG.FALLBACK_BUDGET_MS).catch((e) => console.error(e)));
      return new Response("ok");
    }

    return new Response("nothing here", { status: 404 });
  },

  // Queue consumer: one run at a time (max concurrency 1), so replies never overlap
  async queue(batch, env, ctx) {
    for (const m of batch.messages) m.ack(); // never redeliver: a retry would mean a duplicate reply
    budget.reset();
    try {
      await handleBatch(batch.messages.map((m) => m.body), env, ctx, Date.now() + CONFIG.QUEUE_BUDGET_MS);
    } catch (e) {
      console.error(e);
    }
  },
};

/* ------------------------------------------------------------------ */
/*  Conversation                                                       */
/* ------------------------------------------------------------------ */

async function isOwner(env, userId) {
  if (env.OWNER_ID) return String(userId) === String(env.OWNER_ID).trim();
  const kv = env.REEM_KV;
  if (!kv) return false;
  if (!cache.owner) {
    cache.owner = await kv.get("owner");
    if (!cache.owner) {
      cache.owner = String(userId);
      await kv.put("owner", cache.owner);
    }
  }
  return String(userId) === cache.owner;
}

async function loadState(kv, chatId) {
  if (!kv) return { settings: {}, history: [], notes: "" };
  const [settings, history, notes] = await Promise.all([
    kv.get(`s:${chatId}`, "json"),
    kv.get(`h:${chatId}`, "json"),
    kv.get(`m:${chatId}`),
  ]);
  return { settings: settings || {}, history: history || [], notes: notes || "" };
}

// Telegram (webhook retries) and Cloudflare Queues (at-least-once delivery) can both hand over
// the same update twice. Each update_id is handled only once, so she never answers it twice.
async function onlyNew(env, updates) {
  const kv = env.REEM_KV;
  if (kv) {
    const stored = await kv.get("seen", "json").catch(() => null);
    if (Array.isArray(stored)) {
      for (const id of stored) if (!cache.seen.includes(id)) cache.seen.push(id);
    }
  }
  const fresh = [];
  for (const u of updates) {
    const id = u && u.update_id;
    if (typeof id === "number") {
      if (cache.seen.includes(id)) {
        console.log("skipped a second delivery of update", id);
        continue;
      }
      cache.seen.push(id);
    }
    fresh.push(u);
  }
  cache.seen = cache.seen.slice(-CONFIG.SEEN_KEEP);
  if (kv && fresh.length) {
    await kv.put("seen", JSON.stringify(cache.seen)).catch((e) => console.error("couldn't save seen updates", e));
  }
  return fresh;
}

// Everything he sent since her last reply is answered in one go, like a person catching up
async function handleBatch(updates, env, ctx, deadline) {
  updates = await onlyNew(env, updates);
  const msgs = updates.map((u) => u && u.message).filter((m) => m && m.chat && m.from && m.chat.type === "private");
  let convo = [];
  for (const m of msgs) {
    if (!(await isOwner(env, m.from.id))) continue; // strangers get total silence
    const text = (m.text || "").trim();
    if (text.startsWith("/")) {
      const cmd = text.split(/[\s@]/)[0].toLowerCase();
      if (cmd === "/start" || cmd === "/restart") convo = []; // anything before a restart is forgotten
      await runCommand(env, m.chat.id, cmd);
      continue;
    }
    convo.push(m);
  }
  if (convo.length) await reply(env, ctx, convo, deadline);
}

async function runCommand(env, chatId, cmd) {
  const kv = env.REEM_KV;
  if (cmd === "/start" || cmd === "/restart") return openStory(env, chatId);
  if (cmd === "/voice") {
    if (!kv) return sendText(env, chatId, "(setup) This needs memory connected. Open /setup for details.");
    const s = (await kv.get(`s:${chatId}`, "json")) || {};
    s.moreVoice = !s.moreVoice;
    await kv.put(`s:${chatId}`, JSON.stringify(s));
    return sendText(env, chatId, s.moreVoice ? "(setup) Reem will lean towards voice notes." : "(setup) Reem picks voice or text on her own.");
  }
  if (cmd === "/memory") {
    const notes = kv && (await kv.get(`m:${chatId}`));
    return sendText(env, chatId, notes ? `(setup) Reem's long-term memory:\n\n${notes}` : "(setup) Nothing in long-term memory yet. It fills up as the chat grows.");
  }
}

async function reply(env, ctx, convo, deadline) {
  const chatId = convo[0].chat.id;
  const kv = env.REEM_KV;
  // His first unanswered message is when her clock starts
  const sentAt = Math.min(...convo.map((m) => (m.date || 0) * 1000));
  const started = Math.min(Date.now(), sentAt || Date.now());

  try {
    const statePromise = loadState(kv, chatId);
    statePromise.catch(() => {});

    const parts = [];
    let chars = 0;
    let voiceSeconds = 0;
    for (const m of convo) {
      const media = m.voice || m.audio || m.video_note;
      if (media) {
        voiceSeconds += media.duration || 0;
        const t = await transcribe(env, media.file_id, media.mime_type);
        parts.push(t ? `[voice note] ${t}` : "[sent a voice note, but it was just noise]");
      } else if (m.text) {
        parts.push(m.text.trim());
        chars += m.text.length;
      } else if (m.photo) {
        parts.push(`[sent a photo, but it won't load on your phone${m.caption ? `. His caption: ${m.caption}` : ""}]`);
      } else if (m.sticker) {
        parts.push(`[sent a sticker ${m.sticker.emoji || ""}]`);
      }
    }
    if (!parts.length) return;
    const cameAsVoice = voiceSeconds > 0;
    const heard = parts.join("\n");

    const { settings, history, notes } = await statePromise;

    // She starts thinking now, but only answers once she has noticed and read (or listened)
    const replyPromise = think(env, history, notes, heard, { cameAsVoice, moreVoice: !!settings.moreVoice });
    replyPromise.catch(() => {});
    const readUntil = Math.min(started + readingTime(chars, voiceSeconds), deadline - 60000);
    await sleep(readUntil - Date.now());

    const typingStarted = Date.now();
    await tg(env, "sendChatAction", { chat_id: chatId, action: "typing" });
    const raw = await replyPromise;

    let isVoice = VOICE_TAG.test(raw);
    const text = bodyOf(raw);
    // Never the same line twice: not within this reply, not from her last few replies.
    // Only if every line is an old one does she resend it (think() already tried for a new reply).
    const body = dropRepeats(text, history) || dropRepeats(text, []);
    if (!body) return;
    const spoken = isVoice ? forSpeech(body) : "";
    if (isVoice && !spoken) isVoice = false;

    // Saving runs alongside the slow delivery
    const stored = isVoice ? `[voice] ${body}` : body;
    const saving = saveTurn(env, chatId, history, notes, heard, stored).catch((e) => console.error("save failed", e));
    ctx.waitUntil(saving);

    let delivered = false;
    if (isVoice) {
      try {
        const audioPromise = tts(env, spoken);
        audioPromise.catch(() => {});
        await act(env, chatId, "record_voice", Math.min(speakingTime(spoken), deadline - Date.now() - 5000), 1);
        delivered = await sendVoice(env, chatId, await audioPromise);
      } catch (e) {
        console.error(e); // fall back to text
      }
    }
    if (!delivered) {
      // A scene with *actions* arrives as one message; texts arrive bubble by bubble
      const bubbles = ACTION.test(body) ? [body] : splitBubbles(body);
      await sendBubbles(env, chatId, bubbles, { deadline, typedAlready: Date.now() - typingStarted });
    }
    await saving;
  } catch (e) {
    console.error(e);
    if (e.retryable) await sendBubbles(env, chatId, LINE_DROPPED, { deadline: Math.min(deadline, Date.now() + 20000) });
    else await sendText(env, chatId, `(setup) ⚠️ ${String(e.message || e).slice(0, 400)}`);
  }
}

async function openStory(env, chatId) {
  const kv = env.REEM_KV;
  if (kv) {
    await Promise.all([
      kv.put(`h:${chatId}`, JSON.stringify([{ role: "assistant", content: FIRST_MESSAGE.join("\n\n") }])),
      kv.delete(`m:${chatId}`),
      kv.delete(`b:${chatId}`),
    ]);
  }
  await sleep(2000);
  await sendBubbles(env, chatId, FIRST_MESSAGE, { deadline: Date.now() + 90000 });
}

async function saveTurn(env, chatId, history, notes, userTurn, reply) {
  const kv = env.REEM_KV;
  if (!kv) return;
  history.push({ role: "user", content: userTurn }, { role: "assistant", content: reply });
  if (history.length <= CONFIG.HISTORY_MAX) {
    await kv.put(`h:${chatId}`, JSON.stringify(history));
    return;
  }
  const cut = history.length - CONFIG.HISTORY_KEEP;
  await kv.put(`h:${chatId}`, JSON.stringify(history.slice(cut)));
  await remember(env, chatId, notes, history.slice(0, cut));
}

async function think(env, history, notes, userText, { cameAsVoice, moreVoice }) {
  const now = new Date().toLocaleString("en-GB", { timeZone: CONFIG.TIMEZONE, weekday: "long", hour: "2-digit", minute: "2-digit" });
  let extra = "";
  if (notes) extra += `\n\nYOUR MEMORY NOTES\n${notes}`;
  extra += `\n\nRight now it is ${now} in Cairo. Whatever the time, you want to keep talking to him.`;
  if (cameAsVoice) extra += " He sent you a voice note, so answering with one of your own would feel natural if you're texting.";
  else if (moreVoice) extra += " Lean towards voice notes more often than usual while texting.";
  if (userText.includes("\n")) extra += " He sent you a few messages in a row; answer them together, naturally.";
  if (Math.random() < 0.4) extra += " " + TEXTURE[Math.floor(Math.random() * TEXTURE.length)];

  const recent = history
    .filter((m) => m.role === "assistant")
    .slice(-4)
    .map((m) => opening(m.content))
    .filter(Boolean);
  if (recent.length) {
    extra += ` Your last replies opened with: ${[...new Set(recent)].map((o) => `"${o}"`).join(", ")}. Open this one differently.`;
  }

  const messages = [{ role: "system", content: SYSTEM_PROMPT + extra }];
  if (history[0]?.role === "assistant") messages.push({ role: "user", content: "[the conversation starts]" });
  messages.push(...history, { role: "user", content: userText });

  let out = await callModel(env, messages, CONFIG.SAMPLING);

  // One more try if she opens like last time, or if everything she wrote was already said
  const first = opening(out);
  const allOld = !dropRepeats(bodyOf(out), history);
  if ((first && recent.includes(first)) || allOld) {
    const retry = [...messages];
    retry[0] = {
      role: "system",
      content: messages[0].content + " Start this reply with different words than last time, and say something new. Never repeat lines you already sent.",
    };
    try {
      const second = await callModel(env, retry, { ...CONFIG.SAMPLING, temperature: 1.0 }, { attempts: 1 });
      if (dropRepeats(bodyOf(second), history)) out = second;
    } catch {
      // keep the first reply
    }
  }
  return out;
}

async function remember(env, chatId, oldNotes, overflow) {
  const kv = env.REEM_KV;
  const backlog = (await kv.get(`b:${chatId}`, "json")) || [];
  const pending = [...backlog, ...overflow].slice(-80);
  try {
    if (budget.left() < 2) throw new Error("out of calls this run; folding memory next time");
    const transcript = pending
      .map((m) => `${m.role === "user" ? "Him" : "Reem"}: ${m.content}`)
      .join("\n")
      .slice(-12000);
    const messages = [
      {
        role: "system",
        content:
          "You keep Reem's private memory notes about the man she's seeing (her neighbor) and their relationship. Merge the old notes with the new conversation. Keep: facts about him (name, age, job, family, friends, likes, dislikes, plans, worries), anything he asked her to remember, what has happened between them, promises and plans, nicknames, inside jokes, and how things between them currently stand. Drop small talk and anything already covered. Write short lines starting with '- ', at most 30 lines, in simple English. Output only the notes.",
      },
      { role: "user", content: `OLD NOTES:\n${oldNotes || "(none yet)"}\n\nNEW CONVERSATION:\n${transcript}` },
    ];
    const notes = await callModel(env, messages, { temperature: 0.3, max_tokens: 600 }, { model: CONFIG.MEMORY_MODEL, timeoutMs: 25000, attempts: 1 });
    const lines = notes.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("-"));
    if (!lines.length) throw new Error("memory notes came back off-format");
    await kv.put(`m:${chatId}`, lines.join("\n").slice(0, CONFIG.MEMORY_MAX_CHARS));
    if (backlog.length) await kv.delete(`b:${chatId}`);
  } catch (e) {
    await kv.put(`b:${chatId}`, JSON.stringify(pending));
    throw e;
  }
}

class ApiError extends Error {
  constructor(message, retryable) {
    super(message);
    this.retryable = retryable;
  }
}

const RETRYABLE = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

async function callModel(env, messages, sampling, { model = CONFIG.LLM_MODEL, timeoutMs = CONFIG.LLM_TIMEOUT_MS, attempts = 2 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt) await sleep(1500);
    let res;
    try {
      res = await xfetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://t.me/reem_nabot",
          "X-Title": "Reem",
        },
        body: JSON.stringify({ model, messages, ...sampling }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      lastErr = new ApiError(`OpenRouter unreachable or too slow (${e.name})`, true);
      continue;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      lastErr = new ApiError(`OpenRouter ${res.status}: ${data?.error?.message || "request failed"}`, RETRYABLE.has(res.status));
      if (!lastErr.retryable) throw lastErr;
      continue;
    }
    const out = (data?.choices?.[0]?.message?.content || "").trim();
    if (out) return out;
    lastErr = new ApiError("The model sent an empty reply.", true);
  }
  throw lastErr;
}

function opening(t) {
  return String(t)
    .replace(VOICE_TAG_ALL, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");
}

/* ------------------------------------------------------------------ */
/*  Human timing                                                       */
/* ------------------------------------------------------------------ */

const jitter = () => 0.85 + Math.random() * 0.3;
const between = (a, b) => a + Math.random() * (b - a);

// Time before she picks up the phone, plus reading his texts or listening to his notes
function readingTime(chars, voiceSeconds) {
  return between(CONFIG.NOTICE_MIN_MS, CONFIG.NOTICE_MAX_MS) + chars * CONFIG.READ_MS_PER_CHAR + voiceSeconds * 1000;
}

// About 150 characters a minute
function typingTime(text) {
  const chars = plain(text).length;
  const ms = (chars / CONFIG.TYPING_CHARS_PER_MIN) * 60000 * jitter();
  return Math.min(Math.max(ms, CONFIG.TYPING_MIN_MS), CONFIG.TYPING_MAX_MS);
}

function speakingTime(spoken) {
  const words = spoken.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.min((words / CONFIG.SPEAK_WORDS_PER_SEC) * 1000 + 1500, 30000);
}

// Shows "typing..." or "recording voice message..." for `ms`. Each status lasts ~5 s and costs one
// outside call, so on long waits she first goes quiet (like someone thinking or deleting a draft)
// and the status shows for the stretch just before the message lands.
async function act(env, chatId, action, ms, upcoming = 1) {
  const end = Date.now() + Math.max(0, ms);
  const spare = budget.left() - upcoming - CONFIG.SUBREQUEST_RESERVE;
  const pings = Math.max(0, Math.min(Math.ceil(ms / 4500), Math.floor(spare / Math.max(upcoming, 1))));
  await sleep(end - pings * 4500 - Date.now());
  for (let sent = 0; sent < pings && Date.now() < end - 300; sent++) {
    await tg(env, "sendChatAction", { chat_id: chatId, action });
    await sleep(Math.min(4500, end - Date.now()));
  }
  await sleep(end - Date.now());
}

/* ------------------------------------------------------------------ */
/*  ElevenLabs                                                         */
/* ------------------------------------------------------------------ */

async function transcribe(env, fileId, mime) {
  const f = await tg(env, "getFile", { file_id: fileId });
  if (!f.ok) throw new ApiError("Telegram couldn't hand over the audio (bots can only fetch files up to 20 MB).", false);
  const path = f.result.file_path;
  const audio = await xfetch(`https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${path}`, {
    signal: AbortSignal.timeout(CONFIG.HTTP_TIMEOUT_MS),
  }).catch(() => null);
  if (!audio?.ok) throw new ApiError("Couldn't download the voice note from Telegram.", true);

  const form = new FormData();
  form.append("model_id", CONFIG.STT_MODEL);
  form.append("language_code", CONFIG.STT_LANGUAGE);
  form.append("tag_audio_events", "false");
  form.append("file", new Blob([await audio.arrayBuffer()], { type: mime || "audio/ogg" }), path.split("/").pop() || "voice.ogg");

  let res;
  try {
    res = await xfetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": env.ELEVENLABS_API_KEY },
      body: form,
      signal: AbortSignal.timeout(CONFIG.HTTP_TIMEOUT_MS),
    });
  } catch (e) {
    throw new ApiError(`ElevenLabs speech-to-text unreachable or too slow (${e.name})`, true);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(`ElevenLabs speech-to-text ${res.status}: ${elevenError(data)}`, RETRYABLE.has(res.status));
  return (data.text || "").trim();
}

const voiceId = (env) => String(env.VOICE_ID || CONFIG.VOICE_ID).trim();

async function tts(env, text) {
  const res = await xfetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId(env)}?output_format=${CONFIG.TTS_FORMAT}`, {
    method: "POST",
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: CONFIG.TTS_MODEL, voice_settings: CONFIG.VOICE_SETTINGS }),
    signal: AbortSignal.timeout(CONFIG.HTTP_TIMEOUT_MS),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`ElevenLabs voice ${res.status}: ${elevenError(data)}`);
  }
  return res.arrayBuffer();
}

// Checks the voice works on this account with a short test clip
async function checkVoice(env) {
  const v = await xfetch(`https://api.elevenlabs.io/v1/voices/${voiceId(env)}`, { headers: { "xi-api-key": env.ELEVENLABS_API_KEY } });
  if (v.status === 401) return { ok: false, detail: "ElevenLabs rejected the key. Check ELEVENLABS_API_KEY." };
  if (!v.ok) {
    return { ok: false, detail: "This voice isn't in your account. On the free plan use a built-in voice or one you designed yourself." };
  }
  try {
    await tts(env, "Hey you. I was hoping you'd text.");
    return { ok: true, detail: "Test clip worked." };
  } catch (e) {
    return { ok: false, detail: e.message };
  }
}

function elevenError(data) {
  const d = data?.detail;
  if (typeof d === "string") return d;
  return d?.message || d?.status || data?.message || "request failed";
}

/* ------------------------------------------------------------------ */
/*  Telegram                                                           */
/* ------------------------------------------------------------------ */

async function tg(env, method, body) {
  try {
    const res = await xfetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }));
  } catch (e) {
    return { ok: false, description: String(e.message || e) };
  }
}

// Plain notices (setup messages)
async function sendText(env, chatId, text) {
  for (let i = 0; i < text.length; i += 4000) {
    await tg(env, "sendMessage", { chat_id: chatId, text: text.slice(i, i + 4000) });
  }
}

// Reem's own messages: *actions* show in italics.
// Re-sent as plain text only when Telegram answered and refused the first one (error_code).
// On a network hiccup the first copy may already be in the chat, so it is never sent twice.
async function sendReem(env, chatId, text) {
  const res = await tg(env, "sendMessage", { chat_id: chatId, text: toHtml(text).slice(0, 4000), parse_mode: "HTML" });
  if (res.ok) return;
  if (res.error_code) await sendText(env, chatId, plain(text));
  else console.error("sendMessage got no clear answer, not resending:", res.description);
}

// Each message takes as long as she would need to type it, then lands
async function sendBubbles(env, chatId, bubbles, { deadline = Date.now() + 20000, typedAlready = 0 } = {}) {
  for (let i = 0; i < bubbles.length; i++) {
    const left = bubbles.length - i;
    let wait = typingTime(bubbles[i]) - (i === 0 ? typedAlready : 0);
    wait = Math.min(wait, (deadline - Date.now()) / left - 500);
    if (wait > 300) await act(env, chatId, "typing", wait, left);
    await sendReem(env, chatId, bubbles[i]);
  }
}

// Returns false only when Telegram clearly refused the note, so the text fallback can't double it
async function sendVoice(env, chatId, audio) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("voice", new Blob([audio], { type: "audio/ogg" }), "voice.ogg");
  let res;
  try {
    res = await xfetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendVoice`, { method: "POST", body: form });
  } catch (e) {
    console.error("sendVoice got no answer, assuming it arrived:", e);
    return true;
  }
  const data = await res.json().catch(() => null);
  if (!data) return res.ok;
  if (!data.ok) console.error("sendVoice failed:", data.description || res.status);
  return !!data.ok;
}

async function webhookSecret(env) {
  if (cache.secret) return cache.secret;
  const bytes = new TextEncoder().encode(`reem:${env.TELEGRAM_BOT_TOKEN || ""}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  cache.secret = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return cache.secret;
}

/* ------------------------------------------------------------------ */
/*  Text helpers                                                       */
/* ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function toHtml(t) {
  return escapeHtml(t).replace(/\*([^*\n]+)\*/g, "<i>$1</i>");
}

function plain(t) {
  return String(t).replace(/\*([^*\n]+)\*/g, "$1");
}

// Removes name prefixes, headings and bracket tags copied from the chat log
function clean(t) {
  return t
    .replace(/^[ \t]*(reem|ريم)[ \t]*:[ \t]*/gim, "")
    .replace(/^[ \t]*\[[^\]\n]{1,60}\][ \t]*/gm, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*{2,}/g, "*")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// The model's reply without the [voice] tag, cleaned
function bodyOf(raw) {
  return clean(String(raw).replace(VOICE_TAG_ALL, ""));
}

// A line reduced to its words, so "Wait... you're HOME?" and "wait you're home" count as the same
function lineKey(line) {
  return plain(line)
    .replace(VOICE_TAG_ALL, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Drops every line she already sent, in this reply or in her last few replies.
// Short lines like "lol" or "ok but" may come back in later replies, just not twice in one.
function dropRepeats(body, history) {
  const said = new Set();
  for (const m of history.filter((x) => x.role === "assistant").slice(-CONFIG.REPEAT_LOOKBACK)) {
    for (const line of String(m.content).split("\n")) {
      const k = lineKey(line);
      if (k.split(" ").length >= 4) said.add(k);
    }
  }
  const paras = [];
  for (const para of body.split(/\n\s*\n/)) {
    const lines = [];
    for (const line of para.split("\n")) {
      const k = lineKey(line);
      if (k && said.has(k)) continue;
      if (k) said.add(k);
      lines.push(line);
    }
    const p = lines.join("\n").trim();
    if (p) paras.push(p);
  }
  return paras.join("\n\n");
}

function splitBubbles(t) {
  const parts = t.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts.slice(0, 4) : [t];
}

// One line of texting -> one clean spoken sentence. Actions are never read aloud.
function tidySpoken(line) {
  let s = line
    .replace(/\*[^*\n]*\*/g, " ")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(EMOJI, "")
    .replace(/[*_`>~|<"“”]/g, "")
    .replace(/\b(?:a?ha(?:ha)+h?|lol|lmao|m{2,}|hm+)\b[.,!?]*/gi, "")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/^[,.\s]+/, "")
    .trim();
  if (!s) return "";
  s = s.replace(/\bi\b/g, "I");
  s = s.replace(/(^|[.!?]\s+)([a-z])/g, (_, a, b) => a + b.toUpperCase());
  if (!/[.!?…]$/.test(s)) s += ".";
  return s;
}

function cutAtSentence(s, max) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  return (end > max / 2 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "") + ".").trim();
}

// What goes to ElevenLabs. Separate thoughts get a half-second pause between them.
function forSpeech(t) {
  const lines = t.split(/\n+/).map(tidySpoken).filter(Boolean);
  const kept = [];
  let len = 0;
  for (const line of lines) {
    if (len + line.length > CONFIG.TTS_MAX_CHARS) {
      if (!kept.length) kept.push(cutAtSentence(line, CONFIG.TTS_MAX_CHARS));
      break;
    }
    kept.push(line);
    len += line.length + 1;
  }
  return kept.join(' <break time="0.5s" /> ');
}

/* ------------------------------------------------------------------ */
/*  /setup page                                                        */
/* ------------------------------------------------------------------ */

async function setup(url, env) {
  const rows = [];
  const add = (ok, label, detail = "") => rows.push({ ok, label, detail });
  let botName = "reem_nabot";

  const missing = ["TELEGRAM_BOT_TOKEN", "OPENROUTER_API_KEY", "ELEVENLABS_API_KEY"].filter((k) => !env[k]);
  if (missing.length) add(false, "Secrets", `Missing: ${missing.join(", ")}. Add them in Settings > Variables and Secrets, then reload this page.`);

  if (env.TELEGRAM_BOT_TOKEN) {
    const me = await tg(env, "getMe", {});
    if (!me.ok) {
      add(false, "Telegram", `Token rejected: ${me.description || "unknown error"}`);
    } else {
      botName = me.result.username;
      const hook = await tg(env, "setWebhook", {
        url: `${url.origin}/webhook`,
        secret_token: await webhookSecret(env),
        allowed_updates: ["message"],
        drop_pending_updates: true,
      });
      await tg(env, "setMyCommands", { commands: COMMANDS });
      add(hook.ok, `Telegram: @${botName}`, hook.ok ? "Connected to this Worker." : hook.description);
    }
  }

  if (env.OPENROUTER_API_KEY) {
    try {
      const res = await xfetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: CONFIG.LLM_MODEL, messages: [{ role: "user", content: "Reply with: OK" }], max_tokens: 5 }),
      });
      const data = await res.json().catch(() => ({}));
      add(res.ok, `OpenRouter: ${CONFIG.LLM_MODEL}`, res.ok ? "Model answered." : data?.error?.message || `HTTP ${res.status}`);
    } catch (e) {
      add(false, "OpenRouter", e.message);
    }
  }

  if (env.ELEVENLABS_API_KEY) {
    const v = await checkVoice(env);
    add(v.ok, `ElevenLabs voice: ${env.VOICE_ID ? env.VOICE_ID : CONFIG.VOICE_NAME}`, v.detail);
  }

  if (env.REEM_KV) {
    const locked = env.OWNER_ID || (await env.REEM_KV.get("owner"));
    add(true, "Memory (KV)", locked ? "Connected. Bot is locked to its owner." : "Connected. The first person to message the bot becomes its only user, so message it yourself now.");
  } else {
    add(false, "Memory (KV)", 'Not connected. Add a KV binding named REEM_KV pointing at the namespace "reem". Until then the bot answers no one.');
  }

  if (env.REEM_QUEUE) {
    add(true, "Queue (REEM_QUEUE)", "Connected. Make sure this Worker is the consumer of reem-inbox with max concurrency 1, or messages will wait forever.");
  } else {
    add(false, "Queue (REEM_QUEUE)", `Not connected. Create a queue "reem-inbox", bind it as REEM_QUEUE and add this Worker as its consumer. Until then every reply must fit in 30 seconds, so she types much faster than ${CONFIG.TYPING_CHARS_PER_MIN} characters a minute.`);
  }

  const allOk = rows.every((r) => r.ok);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reem setup</title><style>
body{font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px 16px;background:#f7f7f5;color:#1d1d1b}
h1{font-size:22px;margin:0 0 4px}.sub{color:#666;margin:0 0 20px}
.row{background:#fff;border-radius:12px;padding:12px 14px;margin:8px 0;display:flex;gap:10px;box-shadow:0 1px 2px #0001}
.row b{display:block}.row span{color:#555;font-size:14px}
.done{margin-top:20px;padding:16px;border-radius:12px;background:${allOk ? "#e7f6ec" : "#fff4e5"}}
a{color:#0a66c2}
@media (prefers-color-scheme:dark){body{background:#151514;color:#eee}.row{background:#222}.row span{color:#aaa}.done{background:${allOk ? "#173323" : "#3a2c12"}}}
</style></head><body>
<h1>Reem setup</h1><p class="sub">Reload this page any time to re-check.</p>
${rows.map((r) => `<div class="row"><div>${r.ok ? "✅" : "❌"}</div><div><b>${esc(r.label)}</b><span>${esc(r.detail)}</span></div></div>`).join("")}
<div class="done">${allOk ? `All set. Open <a href="https://t.me/${esc(botName)}">@${esc(botName)}</a> and send /restart to meet the new Reem.` : "Fix the ❌ items above, then reload this page."}</div>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
