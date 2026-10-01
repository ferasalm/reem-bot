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
 *     CONFIG_OVERRIDES (optional) JSON that changes any value in CONFIG below without a redeploy, e.g.
 *                {"VOICE": {"SPEED": 1.05}, "TIMING": {"TYPING_CHARS_PER_MIN": 200}}
 *                Only the values you list change; /setup tells you if a name was misspelled.
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
 *
 * v7 changes:
 *   Every adjustable value now lives in the SETTINGS section right below: character name, models,
 *   voice (ID, speed, stability...), speech-to-text, timing, Telegram commands, every message she
 *   or the bot sends, prompt nudges and limits. Edit them there, or override any of them from the
 *   Cloudflare dashboard with CONFIG_OVERRIDES. Behaviour with the default values is unchanged.
 */

/* ================================================================== */
/*  SETTINGS: everything you may want to adjust is in this section.     */
/*  The code after "End of settings" reads from here; no need to touch  */
/*  it to change a value.                                               */
/*                                                                      */
/*  Texts may contain {placeholders}. {name} (CHARACTER.NAME) works in  */
/*  every short text; the extra ones a text understands are listed      */
/*  next to it.                                                         */
/* ================================================================== */

// Her personality and rules: the system prompt sent with every reply
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

// The opening scene /restart sends (as one message; *actions* show in italics)
const INTRO_MESSAGE = `*It is 11:45 PM. A soft, persistent scratching sounds at your front door, followed by a quiet tap against the wood. When you open it, Reem's orange cat darts past your ankles into your living room.*

*Standing in the dimly lit hallway is Reem. She’s leaning against your doorframe, barefoot, wearing an oversized gray vintage tee that slips off one shoulder and barely reaches mid-thigh. A faint scent of vanilla and amber hits the air between you. She crosses her arms, letting her eyes linger on you with a lazy, knowing tilt of her head.*

"He likes your apartment better than mine," *she murmurs, her voice low and deliberately slow, making no move to step back into the hall.* "Or maybe he just knows I needed an excuse to see what you were doing so late."`;

// Instructions for the model that keeps her long-term memory notes. Placeholders: {name}
const MEMORY_PROMPT =
  "You keep {name}'s private memory notes about the man she's seeing (her neighbor) and their relationship. Merge the old notes with the new conversation. Keep: facts about him (name, age, job, family, friends, likes, dislikes, plans, worries), anything he asked her to remember, what has happened between them, promises and plans, nicknames, inside jokes, and how things between them currently stand. Drop small talk and anything already covered. Write short lines starting with '- ', at most 30 lines, in simple English. Output only the notes.";

const CONFIG = {
  /* ---------------- Who she is ---------------- */
  CHARACTER: {
    NAME: "Reem",                      // shown in notices, the /setup page and her memory transcript
    NAME_PREFIXES: ["reem", "ريم"],    // a reply line starting with "Reem:" gets that prefix removed
    USER_LABEL: "Him",                 // what the user is called in the memory transcript
    CITY: "Cairo",                     // she is told "Right now it is ... in <CITY>"
    TIMEZONE: "Africa/Cairo",          // her clock (IANA time zone name)
    CLOCK_LOCALE: "en-GB",             // how the time is written for her (en-GB = 24h, en-US = 12h)
    BOT_USERNAME: "reem_nabot",        // Telegram @username, used if /setup can't look it up
  },

  PERSONA: {
    SYSTEM_PROMPT,                     // defined above
    INTRO_MESSAGE,                     // what /restart sends, as one message
    TEXTURE_CHANCE: 0.4,               // chance (0 to 1) that a reply gets one random TEXTURE nudge
    TEXTURE: [
      "If it fits, mention one small thing happening around you right now.",
      "If it fits, be bolder than last time.",
      "If it fits, ask him something about himself you don't know yet.",
      "If it fits, pull back a little and make him come to you.",
      "If it fits, bring back something he told you before.",
      "If it fits, let a softer, more honest side show for a moment.",
      "If it fits, dare him to do something.",
      "If it fits, let him rattle you for a second, then cover it.",
    ],
  },

  /* ---------------- Brain (OpenRouter) ---------------- */
  LLM: {
    MODEL: "sao10k/l3-lunaris-8b",
    SAMPLING: { temperature: 0.85, min_p: 0.1, repetition_penalty: 1.12, max_tokens: 320 },
    RETRY_TEMPERATURE: 1.0,            // the second try, when her first reply repeated herself
    TIMEOUT_MS: 15000,
    ATTEMPTS: 2,                       // tries per reply when OpenRouter fails
    RETRY_DELAY_MS: 1500,
  },

  /* ---------------- Long-term memory ---------------- */
  MEMORY: {
    MODEL: "sao10k/l3-lunaris-8b",
    PROMPT: MEMORY_PROMPT,             // defined above
    SAMPLING: { temperature: 0.3, max_tokens: 600 },
    TIMEOUT_MS: 25000,
    ATTEMPTS: 1,
    HISTORY_MAX: 40,                   // once the chat log has this many messages...
    HISTORY_KEEP: 24,                  // ...the newest this many stay and the rest fold into notes
    MAX_CHARS: 3000,                   // size cap of the notes
    BACKLOG_MAX: 80,                   // messages kept waiting when folding fails, until next time
    TRANSCRIPT_MAX_CHARS: 12000,       // how much of the old chat the memory model reads
  },

  /* ---------------- Voice (ElevenLabs text-to-speech) ---------------- */
  VOICE: {
    ID: "EXAVITQu4vr4xnSDxMaL",        // Sarah: built-in, young, warm, American. Free plan.
    NAME: "Sarah",                     // only shown on /setup
    MODEL: "eleven_multilingual_v2",
    FORMAT: "opus_48000_64",
    SPEED: 0.9,                        // 0.7 (slow) to 1.2 (fast); 1.0 is normal
    STABILITY: 0.45,                   // 0 to 1: lower = more expressive, higher = steadier
    SIMILARITY_BOOST: 0.75,            // 0 to 1: how closely it sticks to the original voice
    STYLE: 0.3,                        // 0 to 1: style exaggeration
    SPEAKER_BOOST: true,
    MAX_CHARS: 360,                    // longest text read aloud in one note
    PAUSE_BETWEEN_LINES: "0.5s",       // pause between separate thoughts in a note
    TEST_PHRASE: "Hey you. I was hoping you'd text.", // spoken by the /setup check
  },

  /* ---------------- Ears (ElevenLabs speech-to-text) ---------------- */
  HEARING: {
    MODEL: "scribe_v2",
    LANGUAGE: "en",
    TAG_AUDIO_EVENTS: false,           // true adds things like (laughs) to transcripts
  },

  /* ---------------- Human timing ---------------- */
  TIMING: {
    TYPING_CHARS_PER_MIN: 150,         // how fast she types (v4 was 50)
    TYPING_MIN_MS: 2500,
    TYPING_MAX_MS: 60000,              // no single message takes longer than 1 minute
    TYPING_JITTER_MIN: 0.85,           // each message's typing time is randomly scaled
    TYPING_JITTER_MAX: 1.15,           //   between these two factors
    NOTICE_MIN_MS: 3000,               // before she even picks up her phone
    NOTICE_MAX_MS: 20000,
    READ_MS_PER_CHAR: 60,
    SPEAK_WORDS_PER_SEC: 2.2,          // "recording voice message..." lasts about as long as the note
    RECORDING_EXTRA_MS: 1500,          // added on top of the speaking time
    RECORDING_MAX_MS: 30000,
    STATUS_REFRESH_MS: 4500,           // how often "typing..." is re-sent (Telegram shows it ~5 s)
    INTRO_DELAY_MS: 2000,              // pause before the /restart scene arrives
    INTRO_BUDGET_MS: 90000,            // time allowed for sending the /restart scene
    LINE_DROPPED_BUDGET_MS: 20000,     // time allowed for the "wifi died" messages
    REPLY_MARGIN_MS: 60000,            // she starts typing at least this long before a run must end
    VOICE_MARGIN_MS: 5000,             // a voice note is sent at least this long before a run must end
    QUEUE_BUDGET_MS: 13 * 60000,       // queue runs may last 15 min; keep a margin
    FALLBACK_BUDGET_MS: 26000,         // without the queue, everything must fit in 30 s
  },

  /* ---------------- How her replies are shaped ---------------- */
  TEXTING: {
    MAX_BUBBLES: 4,                    // a text reply is split into at most this many messages
    REPEAT_LOOKBACK: 8,                // her last N replies are checked for repeated lines
    REPEAT_MIN_WORDS: 4,               // shorter lines ("lol", "ok but") may come back in later replies
    OPENING_LOOKBACK: 4,               // she is told how her last N replies started...
    OPENING_WORDS: 3,                  // ...using their first N words, so she opens differently
  },

  /* ---------------- Telegram commands ----------------
   * command:     what you type, without "/" (lowercase letters, digits, _; max 32 characters)
   * aliases:     other names that do the same thing, hidden from the menu
   * description: shown in Telegram's command menu
   * action:      what it does: "restart", "voice" or "memory" (don't rename these)
   * Keep "start" as an alias of restart: Telegram sends /start when someone first opens the bot.
   */
  COMMANDS: [
    { command: "restart", aliases: ["start"], action: "restart", description: "Start the story over (wipes her memory)" },
    { command: "voice", aliases: [], action: "voice", description: "Ask Reem to send voice notes more often (on/off)" },
    { command: "memory", aliases: [], action: "memory", description: "See what Reem remembers long-term" },
  ],

  /* ---------------- What the bot itself says ---------------- */
  MESSAGES: {
    NOTICE_PREFIX: "(setup) ",         // put before every notice below
    NEEDS_MEMORY: "This needs memory connected. Open /setup for details.",
    VOICE_ON: "{name} will lean towards voice notes.",
    VOICE_OFF: "{name} picks voice or text on her own.",
    MEMORY_SHOW: "{name}'s long-term memory:\n\n{notes}", // {notes}
    MEMORY_EMPTY: "Nothing in long-term memory yet. It fills up as the chat grows.",
    ERROR: "⚠️ {error}",               // {error}
    ERROR_MAX_CHARS: 400,
    // Sent in character when the model or a service stays unreachable
    LINE_DROPPED: ["ugh my wifi just died for a sec", "say that again?"],
  },

  /* ---------------- How his messages are described to her ---------------- */
  INBOX: {
    VOICE_NOTE: "[voice note] {text}",                     // {text}
    VOICE_NOISE: "[sent a voice note, but it was just noise]",
    PHOTO: "[sent a photo, but it won't load on your phone]",
    PHOTO_WITH_CAPTION: "[sent a photo, but it won't load on your phone. His caption: {caption}]", // {caption}
    STICKER: "[sent a sticker {emoji}]",                   // {emoji}
    CONVERSATION_START: "[the conversation starts]",
  },

  /* ---------------- Nudges added to the system prompt for each reply ---------------- */
  NUDGES: {
    MEMORY_NOTES: "\n\nYOUR MEMORY NOTES\n{notes}",       // {notes}
    TIME: "\n\nRight now it is {time} in {city}. Whatever the time, you want to keep talking to him.", // {time} {city}
    CAME_AS_VOICE: " He sent you a voice note, so answering with one of your own would feel natural if you're texting.",
    MORE_VOICE: " Lean towards voice notes more often than usual while texting.", // when /voice is on
    SEVERAL_MESSAGES: " He sent you a few messages in a row; answer them together, naturally.",
    VARY_OPENING: " Your last replies opened with: {openings}. Open this one differently.", // {openings}
    RETRY: " Start this reply with different words than last time, and say something new. Never repeat lines you already sent.",
  },

  /* ---------------- Telegram ---------------- */
  TELEGRAM: {
    CHAT_TYPES: ["private"],           // chats she answers in ("private", "group", "supergroup")
    MAX_MESSAGE_CHARS: 4000,           // Telegram's limit is 4096
    ALLOWED_UPDATES: ["message"],
    DROP_PENDING_UPDATES: true,        // /setup throws away messages that arrived while the bot was down
  },

  /* ---------------- Limits ---------------- */
  LIMITS: {
    HTTP_TIMEOUT_MS: 20000,            // ElevenLabs and Telegram file downloads
    SUBREQUEST_LIMIT: 50,              // free plan: at most 50 outside calls per run
    SUBREQUEST_RESERVE: 6,             // kept free for the actual messages
    SEEN_KEEP: 200,                    // how many recent Telegram update IDs to remember
  },
};

/* ================================================================== */
/*  End of settings                                                     */
/* ================================================================== */

const VOICE_TAG = /\[\s*voice\b[^\]\n]*\]/i;
const VOICE_TAG_ALL = /\[\s*voice\b[^\]\n]*\]\s*/gi;
const ACTION = /\*[^*\n]+\*/;
const EMOJI = /[\p{Extended_Pictographic}\p{Emoji_Modifier}\u{FE0F}\u{200D}]/gu;

const cache = { owner: null, voiceId: undefined, secret: null, seen: [], overrides: null };

// Fills {placeholders} in a settings text. Values are inserted as-is, never re-read as placeholders.
function fill(template, vars = {}) {
  const all = { name: CONFIG.CHARACTER.NAME, ...vars };
  return String(template).replace(/\{(\w+)\}/g, (m, k) => (k in all ? String(all[k]) : m));
}

/* ------------------------------------------------------------------ */
/*  CONFIG_OVERRIDES: change settings from the dashboard               */
/* ------------------------------------------------------------------ */

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// Only names that exist in CONFIG are changed (sampling blocks may also take new model parameters)
function mergeSettings(target, src, path, unknown) {
  for (const [k, v] of Object.entries(src)) {
    const at = path ? `${path}.${k}` : k;
    if (!(k in target) && !path.endsWith("SAMPLING")) {
      unknown.push(at);
      continue;
    }
    if (isPlainObject(v) && isPlainObject(target[k])) mergeSettings(target[k], v, at, unknown);
    else target[k] = v;
  }
}

// Applied once per Worker instance; changing the variable in the dashboard starts a fresh one
function applyOverrides(env) {
  if (cache.overrides) return cache.overrides;
  const raw = env.CONFIG_OVERRIDES;
  if (!raw) return (cache.overrides = { set: false, ok: true, detail: "" });
  try {
    const src = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!isPlainObject(src)) throw new Error("it must be a JSON object, like {\"VOICE\": {\"SPEED\": 1}}");
    const unknown = [];
    mergeSettings(CONFIG, src, "", unknown);
    cache.overrides = unknown.length
      ? { set: true, ok: false, detail: `Applied, except these names, which don't exist in CONFIG: ${unknown.join(", ")}` }
      : { set: true, ok: true, detail: "Applied." };
  } catch (e) {
    console.error("CONFIG_OVERRIDES ignored", e);
    cache.overrides = { set: true, ok: false, detail: `Not applied: ${e.message}` };
  }
  return cache.overrides;
}

/* ------------------------------------------------------------------ */
/*  Outside calls: counted, because the free plan allows 50 per run    */
/* ------------------------------------------------------------------ */

const budget = {
  used: 0,
  reset() { this.used = 0; },
  left() { return CONFIG.LIMITS.SUBREQUEST_LIMIT - this.used; },
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
    applyOverrides(env);
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
      ctx.waitUntil(handleBatch([update], env, ctx, Date.now() + CONFIG.TIMING.FALLBACK_BUDGET_MS).catch((e) => console.error(e)));
      return new Response("ok");
    }

    return new Response("nothing here", { status: 404 });
  },

  // Queue consumer: one run at a time (max concurrency 1), so replies never overlap
  async queue(batch, env, ctx) {
    applyOverrides(env);
    for (const m of batch.messages) m.ack(); // never redeliver: a retry would mean a duplicate reply
    budget.reset();
    try {
      await handleBatch(batch.messages.map((m) => m.body), env, ctx, Date.now() + CONFIG.TIMING.QUEUE_BUDGET_MS);
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
  cache.seen = cache.seen.slice(-CONFIG.LIMITS.SEEN_KEEP);
  if (kv && fresh.length) {
    await kv.put("seen", JSON.stringify(cache.seen)).catch((e) => console.error("couldn't save seen updates", e));
  }
  return fresh;
}

// Everything he sent since her last reply is answered in one go, like a person catching up
async function handleBatch(updates, env, ctx, deadline) {
  updates = await onlyNew(env, updates);
  const msgs = updates
    .map((u) => u && u.message)
    .filter((m) => m && m.chat && m.from && CONFIG.TELEGRAM.CHAT_TYPES.includes(m.chat.type));
  let convo = [];
  for (const m of msgs) {
    if (!(await isOwner(env, m.from.id))) continue; // strangers get total silence
    const text = (m.text || "").trim();
    if (text.startsWith("/")) {
      const action = commandAction(text);
      if (action === "restart") convo = []; // anything before a restart is forgotten
      await runCommand(env, m.chat.id, action);
      continue;
    }
    convo.push(m);
  }
  if (convo.length) await reply(env, ctx, convo, deadline);
}

// "/Voice@reem_nabot on" -> the action of the command named "voice" (or one of its aliases)
function commandAction(text) {
  const name = text.slice(1).split(/[\s@]/)[0].toLowerCase();
  const c = CONFIG.COMMANDS.find((c) => c.command === name || (c.aliases || []).includes(name));
  return c && c.action;
}

function commandFor(action) {
  const c = CONFIG.COMMANDS.find((c) => c.action === action);
  return c ? `/${c.command}` : "";
}

// Plain notices from the bot (not from her)
function notice(env, chatId, template, vars) {
  return sendText(env, chatId, CONFIG.MESSAGES.NOTICE_PREFIX + fill(template, vars));
}

async function runCommand(env, chatId, action) {
  const kv = env.REEM_KV;
  const M = CONFIG.MESSAGES;
  if (action === "restart") return openStory(env, chatId);
  if (action === "voice") {
    if (!kv) return notice(env, chatId, M.NEEDS_MEMORY);
    const s = (await kv.get(`s:${chatId}`, "json")) || {};
    s.moreVoice = !s.moreVoice;
    await kv.put(`s:${chatId}`, JSON.stringify(s));
    return notice(env, chatId, s.moreVoice ? M.VOICE_ON : M.VOICE_OFF);
  }
  if (action === "memory") {
    const notes = kv && (await kv.get(`m:${chatId}`));
    return notice(env, chatId, notes ? M.MEMORY_SHOW : M.MEMORY_EMPTY, { notes });
  }
}

async function reply(env, ctx, convo, deadline) {
  const chatId = convo[0].chat.id;
  const kv = env.REEM_KV;
  const I = CONFIG.INBOX;
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
        parts.push(t ? fill(I.VOICE_NOTE, { text: t }) : fill(I.VOICE_NOISE));
      } else if (m.text) {
        parts.push(m.text.trim());
        chars += m.text.length;
      } else if (m.photo) {
        parts.push(m.caption ? fill(I.PHOTO_WITH_CAPTION, { caption: m.caption }) : fill(I.PHOTO));
      } else if (m.sticker) {
        parts.push(fill(I.STICKER, { emoji: m.sticker.emoji || "" }));
      }
    }
    if (!parts.length) return;
    const cameAsVoice = voiceSeconds > 0;
    const heard = parts.join("\n");

    const { settings, history, notes } = await statePromise;

    // She starts thinking now, but only answers once she has noticed and read (or listened)
    const replyPromise = think(env, history, notes, heard, { cameAsVoice, moreVoice: !!settings.moreVoice });
    replyPromise.catch(() => {});
    const readUntil = Math.min(started + readingTime(chars, voiceSeconds), deadline - CONFIG.TIMING.REPLY_MARGIN_MS);
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
        await act(env, chatId, "record_voice", Math.min(speakingTime(spoken), deadline - Date.now() - CONFIG.TIMING.VOICE_MARGIN_MS), 1);
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
    if (e.retryable) {
      const lines = CONFIG.MESSAGES.LINE_DROPPED.map((l) => fill(l));
      await sendBubbles(env, chatId, lines, { deadline: Math.min(deadline, Date.now() + CONFIG.TIMING.LINE_DROPPED_BUDGET_MS) });
    } else {
      await notice(env, chatId, CONFIG.MESSAGES.ERROR, { error: String(e.message || e).slice(0, CONFIG.MESSAGES.ERROR_MAX_CHARS) });
    }
  }
}

async function openStory(env, chatId) {
  const kv = env.REEM_KV;
  // Sent as ONE message: the scene must not be split into separate texts
  const intro = CONFIG.PERSONA.INTRO_MESSAGE;
  if (kv) {
    await Promise.all([
      kv.put(`h:${chatId}`, JSON.stringify([{ role: "assistant", content: intro }])),
      kv.delete(`m:${chatId}`),
      kv.delete(`b:${chatId}`),
    ]);
  }
  await sleep(CONFIG.TIMING.INTRO_DELAY_MS);
  await sendBubbles(env, chatId, [intro], { deadline: Date.now() + CONFIG.TIMING.INTRO_BUDGET_MS });
}

async function saveTurn(env, chatId, history, notes, userTurn, reply) {
  const kv = env.REEM_KV;
  if (!kv) return;
  history.push({ role: "user", content: userTurn }, { role: "assistant", content: reply });
  if (history.length <= CONFIG.MEMORY.HISTORY_MAX) {
    await kv.put(`h:${chatId}`, JSON.stringify(history));
    return;
  }
  const cut = history.length - CONFIG.MEMORY.HISTORY_KEEP;
  await kv.put(`h:${chatId}`, JSON.stringify(history.slice(cut)));
  await remember(env, chatId, notes, history.slice(0, cut));
}

async function think(env, history, notes, userText, { cameAsVoice, moreVoice }) {
  const C = CONFIG.CHARACTER;
  const N = CONFIG.NUDGES;
  const P = CONFIG.PERSONA;
  const now = new Date().toLocaleString(C.CLOCK_LOCALE, { timeZone: C.TIMEZONE, weekday: "long", hour: "2-digit", minute: "2-digit" });
  let extra = "";
  if (notes) extra += fill(N.MEMORY_NOTES, { notes });
  extra += fill(N.TIME, { time: now, city: C.CITY });
  if (cameAsVoice) extra += fill(N.CAME_AS_VOICE);
  else if (moreVoice) extra += fill(N.MORE_VOICE);
  if (userText.includes("\n")) extra += fill(N.SEVERAL_MESSAGES);
  if (P.TEXTURE.length && Math.random() < P.TEXTURE_CHANCE) {
    extra += " " + fill(P.TEXTURE[Math.floor(Math.random() * P.TEXTURE.length)]);
  }

  const recent = history
    .filter((m) => m.role === "assistant")
    .slice(-CONFIG.TEXTING.OPENING_LOOKBACK)
    .map((m) => opening(m.content))
    .filter(Boolean);
  if (recent.length) {
    extra += fill(N.VARY_OPENING, { openings: [...new Set(recent)].map((o) => `"${o}"`).join(", ") });
  }

  const messages = [{ role: "system", content: P.SYSTEM_PROMPT + extra }];
  if (history[0]?.role === "assistant") messages.push({ role: "user", content: fill(CONFIG.INBOX.CONVERSATION_START) });
  messages.push(...history, { role: "user", content: userText });

  let out = await callModel(env, messages, CONFIG.LLM.SAMPLING);

  // One more try if she opens like last time, or if everything she wrote was already said
  const first = opening(out);
  const allOld = !dropRepeats(bodyOf(out), history);
  if ((first && recent.includes(first)) || allOld) {
    const retry = [...messages];
    retry[0] = { role: "system", content: messages[0].content + fill(N.RETRY) };
    try {
      const second = await callModel(env, retry, { ...CONFIG.LLM.SAMPLING, temperature: CONFIG.LLM.RETRY_TEMPERATURE }, { attempts: 1 });
      if (dropRepeats(bodyOf(second), history)) out = second;
    } catch {
      // keep the first reply
    }
  }
  return out;
}

async function remember(env, chatId, oldNotes, overflow) {
  const kv = env.REEM_KV;
  const M = CONFIG.MEMORY;
  const C = CONFIG.CHARACTER;
  const backlog = (await kv.get(`b:${chatId}`, "json")) || [];
  const pending = [...backlog, ...overflow].slice(-M.BACKLOG_MAX);
  try {
    if (budget.left() < 2) throw new Error("out of calls this run; folding memory next time");
    const transcript = pending
      .map((m) => `${m.role === "user" ? C.USER_LABEL : C.NAME}: ${m.content}`)
      .join("\n")
      .slice(-M.TRANSCRIPT_MAX_CHARS);
    const messages = [
      { role: "system", content: fill(M.PROMPT) },
      { role: "user", content: `OLD NOTES:\n${oldNotes || "(none yet)"}\n\nNEW CONVERSATION:\n${transcript}` },
    ];
    const notes = await callModel(env, messages, M.SAMPLING, { model: M.MODEL, timeoutMs: M.TIMEOUT_MS, attempts: M.ATTEMPTS });
    const lines = notes.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("-"));
    if (!lines.length) throw new Error("memory notes came back off-format");
    await kv.put(`m:${chatId}`, lines.join("\n").slice(0, M.MAX_CHARS));
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

async function callModel(env, messages, sampling, { model = CONFIG.LLM.MODEL, timeoutMs = CONFIG.LLM.TIMEOUT_MS, attempts = CONFIG.LLM.ATTEMPTS } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt) await sleep(CONFIG.LLM.RETRY_DELAY_MS);
    let res;
    try {
      res = await xfetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": `https://t.me/${CONFIG.CHARACTER.BOT_USERNAME}`,
          "X-Title": CONFIG.CHARACTER.NAME,
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
    .slice(0, CONFIG.TEXTING.OPENING_WORDS)
    .join(" ");
}

/* ------------------------------------------------------------------ */
/*  Human timing                                                       */
/* ------------------------------------------------------------------ */

const between = (a, b) => a + Math.random() * (b - a);
const jitter = () => between(CONFIG.TIMING.TYPING_JITTER_MIN, CONFIG.TIMING.TYPING_JITTER_MAX);

// Time before she picks up the phone, plus reading his texts or listening to his notes
function readingTime(chars, voiceSeconds) {
  const T = CONFIG.TIMING;
  return between(T.NOTICE_MIN_MS, T.NOTICE_MAX_MS) + chars * T.READ_MS_PER_CHAR + voiceSeconds * 1000;
}

// TIMING.TYPING_CHARS_PER_MIN, within TYPING_MIN_MS..TYPING_MAX_MS
function typingTime(text) {
  const T = CONFIG.TIMING;
  const chars = plain(text).length;
  const ms = (chars / T.TYPING_CHARS_PER_MIN) * 60000 * jitter();
  return Math.min(Math.max(ms, T.TYPING_MIN_MS), T.TYPING_MAX_MS);
}

function speakingTime(spoken) {
  const T = CONFIG.TIMING;
  const words = spoken.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.min((words / T.SPEAK_WORDS_PER_SEC) * 1000 + T.RECORDING_EXTRA_MS, T.RECORDING_MAX_MS);
}

// Shows "typing..." or "recording voice message..." for `ms`. Each status lasts ~5 s and costs one
// outside call, so on long waits she first goes quiet (like someone thinking or deleting a draft)
// and the status shows for the stretch just before the message lands.
async function act(env, chatId, action, ms, upcoming = 1) {
  const every = CONFIG.TIMING.STATUS_REFRESH_MS;
  const end = Date.now() + Math.max(0, ms);
  const spare = budget.left() - upcoming - CONFIG.LIMITS.SUBREQUEST_RESERVE;
  const pings = Math.max(0, Math.min(Math.ceil(ms / every), Math.floor(spare / Math.max(upcoming, 1))));
  await sleep(end - pings * every - Date.now());
  for (let sent = 0; sent < pings && Date.now() < end - 300; sent++) {
    await tg(env, "sendChatAction", { chat_id: chatId, action });
    await sleep(Math.min(every, end - Date.now()));
  }
  await sleep(end - Date.now());
}

/* ------------------------------------------------------------------ */
/*  ElevenLabs                                                         */
/* ------------------------------------------------------------------ */

async function transcribe(env, fileId, mime) {
  const H = CONFIG.HEARING;
  const timeout = CONFIG.LIMITS.HTTP_TIMEOUT_MS;
  const f = await tg(env, "getFile", { file_id: fileId });
  if (!f.ok) throw new ApiError("Telegram couldn't hand over the audio (bots can only fetch files up to 20 MB).", false);
  const path = f.result.file_path;
  const audio = await xfetch(`https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${path}`, {
    signal: AbortSignal.timeout(timeout),
  }).catch(() => null);
  if (!audio?.ok) throw new ApiError("Couldn't download the voice note from Telegram.", true);

  const form = new FormData();
  form.append("model_id", H.MODEL);
  form.append("language_code", H.LANGUAGE);
  form.append("tag_audio_events", String(!!H.TAG_AUDIO_EVENTS));
  form.append("file", new Blob([await audio.arrayBuffer()], { type: mime || "audio/ogg" }), path.split("/").pop() || "voice.ogg");

  let res;
  try {
    res = await xfetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": env.ELEVENLABS_API_KEY },
      body: form,
      signal: AbortSignal.timeout(timeout),
    });
  } catch (e) {
    throw new ApiError(`ElevenLabs speech-to-text unreachable or too slow (${e.name})`, true);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(`ElevenLabs speech-to-text ${res.status}: ${elevenError(data)}`, RETRYABLE.has(res.status));
  return (data.text || "").trim();
}

const voiceId = (env) => String(env.VOICE_ID || CONFIG.VOICE.ID).trim();

async function tts(env, text) {
  const V = CONFIG.VOICE;
  const res = await xfetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId(env)}?output_format=${V.FORMAT}`, {
    method: "POST",
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: V.MODEL,
      voice_settings: {
        stability: V.STABILITY,
        similarity_boost: V.SIMILARITY_BOOST,
        style: V.STYLE,
        use_speaker_boost: V.SPEAKER_BOOST,
        speed: V.SPEED,
      },
    }),
    signal: AbortSignal.timeout(CONFIG.LIMITS.HTTP_TIMEOUT_MS),
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
    await tts(env, fill(CONFIG.VOICE.TEST_PHRASE));
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
  const max = CONFIG.TELEGRAM.MAX_MESSAGE_CHARS;
  for (let i = 0; i < text.length; i += max) {
    await tg(env, "sendMessage", { chat_id: chatId, text: text.slice(i, i + max) });
  }
}

// Her own messages: *actions* show in italics.
// Re-sent as plain text only when Telegram answered and refused the first one (error_code).
// On a network hiccup the first copy may already be in the chat, so it is never sent twice.
async function sendReem(env, chatId, text) {
  const res = await tg(env, "sendMessage", { chat_id: chatId, text: toHtml(text).slice(0, CONFIG.TELEGRAM.MAX_MESSAGE_CHARS), parse_mode: "HTML" });
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
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function toHtml(t) {
  return escapeHtml(t).replace(/\*([^*\n]+)\*/g, "<i>$1</i>");
}

function plain(t) {
  return String(t).replace(/\*([^*\n]+)\*/g, "$1");
}

// Removes name prefixes, headings and bracket tags copied from the chat log
function clean(t) {
  const names = CONFIG.CHARACTER.NAME_PREFIXES.map(escapeRegex).join("|");
  if (names) t = t.replace(new RegExp(`^[ \\t]*(${names})[ \\t]*:[ \\t]*`, "gim"), "");
  return t
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
  for (const m of history.filter((x) => x.role === "assistant").slice(-CONFIG.TEXTING.REPEAT_LOOKBACK)) {
    for (const line of String(m.content).split("\n")) {
      const k = lineKey(line);
      if (k.split(" ").length >= CONFIG.TEXTING.REPEAT_MIN_WORDS) said.add(k);
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
  return parts.length ? parts.slice(0, CONFIG.TEXTING.MAX_BUBBLES) : [t];
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

// What goes to ElevenLabs. Separate thoughts get a short pause (VOICE.PAUSE_BETWEEN_LINES) between them.
function forSpeech(t) {
  const max = CONFIG.VOICE.MAX_CHARS;
  const lines = t.split(/\n+/).map(tidySpoken).filter(Boolean);
  const kept = [];
  let len = 0;
  for (const line of lines) {
    if (len + line.length > max) {
      if (!kept.length) kept.push(cutAtSentence(line, max));
      break;
    }
    kept.push(line);
    len += line.length + 1;
  }
  return kept.join(` <break time="${CONFIG.VOICE.PAUSE_BETWEEN_LINES}" /> `);
}

/* ------------------------------------------------------------------ */
/*  /setup page                                                        */
/* ------------------------------------------------------------------ */

async function setup(url, env) {
  const rows = [];
  const add = (ok, label, detail = "") => rows.push({ ok, label, detail });
  const name = CONFIG.CHARACTER.NAME;
  let botName = CONFIG.CHARACTER.BOT_USERNAME;

  const missing = ["TELEGRAM_BOT_TOKEN", "OPENROUTER_API_KEY", "ELEVENLABS_API_KEY"].filter((k) => !env[k]);
  if (missing.length) add(false, "Secrets", `Missing: ${missing.join(", ")}. Add them in Settings > Variables and Secrets, then reload this page.`);

  const overrides = applyOverrides(env);
  if (overrides.set) add(overrides.ok, "Settings (CONFIG_OVERRIDES)", overrides.detail);

  if (env.TELEGRAM_BOT_TOKEN) {
    const me = await tg(env, "getMe", {});
    if (!me.ok) {
      add(false, "Telegram", `Token rejected: ${me.description || "unknown error"}`);
    } else {
      botName = me.result.username;
      const hook = await tg(env, "setWebhook", {
        url: `${url.origin}/webhook`,
        secret_token: await webhookSecret(env),
        allowed_updates: CONFIG.TELEGRAM.ALLOWED_UPDATES,
        drop_pending_updates: CONFIG.TELEGRAM.DROP_PENDING_UPDATES,
      });
      const menu = await tg(env, "setMyCommands", {
        commands: CONFIG.COMMANDS.map((c) => ({ command: c.command, description: fill(c.description) })),
      });
      if (!menu.ok) add(false, "Telegram commands", `Telegram refused the command list: ${menu.description || "unknown error"}`);
      add(hook.ok, `Telegram: @${botName}`, hook.ok ? "Connected to this Worker." : hook.description);
    }
  }

  if (env.OPENROUTER_API_KEY) {
    try {
      const res = await xfetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: CONFIG.LLM.MODEL, messages: [{ role: "user", content: "Reply with: OK" }], max_tokens: 5 }),
      });
      const data = await res.json().catch(() => ({}));
      add(res.ok, `OpenRouter: ${CONFIG.LLM.MODEL}`, res.ok ? "Model answered." : data?.error?.message || `HTTP ${res.status}`);
    } catch (e) {
      add(false, "OpenRouter", e.message);
    }
  }

  if (env.ELEVENLABS_API_KEY) {
    const v = await checkVoice(env);
    add(v.ok, `ElevenLabs voice: ${env.VOICE_ID ? env.VOICE_ID : CONFIG.VOICE.NAME}`, v.detail);
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
    add(false, "Queue (REEM_QUEUE)", `Not connected. Create a queue "reem-inbox", bind it as REEM_QUEUE and add this Worker as its consumer. Until then every reply must fit in 30 seconds, so she types much faster than ${CONFIG.TIMING.TYPING_CHARS_PER_MIN} characters a minute.`);
  }

  const allOk = rows.every((r) => r.ok);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const restart = commandFor("restart");
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(name)} setup</title><style>
body{font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px 16px;background:#f7f7f5;color:#1d1d1b}
h1{font-size:22px;margin:0 0 4px}.sub{color:#666;margin:0 0 20px}
.row{background:#fff;border-radius:12px;padding:12px 14px;margin:8px 0;display:flex;gap:10px;box-shadow:0 1px 2px #0001}
.row b{display:block}.row span{color:#555;font-size:14px}
.done{margin-top:20px;padding:16px;border-radius:12px;background:${allOk ? "#e7f6ec" : "#fff4e5"}}
a{color:#0a66c2}
@media (prefers-color-scheme:dark){body{background:#151514;color:#eee}.row{background:#222}.row span{color:#aaa}.done{background:${allOk ? "#173323" : "#3a2c12"}}}
</style></head><body>
<h1>${esc(name)} setup</h1><p class="sub">Reload this page any time to re-check.</p>
${rows.map((r) => `<div class="row"><div>${r.ok ? "✅" : "❌"}</div><div><b>${esc(r.label)}</b><span>${esc(r.detail)}</span></div></div>`).join("")}
<div class="done">${allOk ? `All set. Open <a href="https://t.me/${esc(botName)}">@${esc(botName)}</a>${restart ? ` and send ${esc(restart)}` : ""} to meet the new ${esc(name)}.` : "Fix the ❌ items above, then reload this page."}</div>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
