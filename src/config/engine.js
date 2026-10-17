// The engine's settings: models, routes, limits, budgets, timing, picture engine. The persona's words and looks are in src/persona/reem-en/config.js.
export const ENGINE = {

  /* ---------------- Brain (OpenRouter) ---------------- */
  LLM: {
    // owner 2026-10-13: her chat back on DeepSeek with a 60 s limit (branch chat-timeout) after his Llama test; Llama is branch chat-llama.
    MODEL: "@cf/deepseek-ai/deepseek-v4-flash-0731", // owner 2026-10-06: DeepSeek on Workers AI first ("it succeeds even with explicit texts"),
                                       // the same DeepSeek on OpenRouter as the backup (BACKUP_MODEL with BACKUP_PROVIDER)
    // Novita, Baidu and StreamLake ignore min_p; Relace and the backup model use it
    SAMPLING: { temperature: 0.95, min_p: 0.1, repetition_penalty: 1.05, max_tokens: 420 },
    // OpenRouter routing for a model there: PROVIDER/REASONING go with MODEL, BACKUP_* with BACKUP_MODEL (none for a @cf/ model).
    PROVIDER: {},
    REASONING: {},
    BACKUP_MODEL: "deepseek/deepseek-v4-flash", // one try with this model when every try with MODEL failed; "" = off. Owner 2026-10-06:
                                       // DeepSeek on OpenRouter is the backup now (was the main; Nemo before that)
    // Provider slugs as OpenRouter lists them; allow_fallbacks: false = never any other provider (the 2026-10-01 bench).
    BACKUP_PROVIDER: {
      order: ["novita", "baidu", "relace", "streamlake"],
      ignore: ["azure", "alibaba", "atlas-cloud", "deepinfra"], // filter, cut replies, or rate-limited
      allow_fallbacks: false,
    },
    BACKUP_REASONING: { enabled: false }, // no thinking step: faster, cheaper, and the bench was run this way
    // Reply length per kind of reply (max_tokens above is used if one is missing). Shorter = less rambling.
    MAX_TOKENS: { TEXT: 220, VOICE: 120, SCENE: 380 },
    // DeepSeek on Workers AI thinks before every reply, and the thinking counts in max_tokens: her replies get this much more room
    // (cf-probe 38355964346: 150-300 tokens of thinking). A reply's visible length is still MAX_TOKENS (Fix round 2, 2026-10-13).
    THINK_TOKENS: 700,
    // Models that think before answering (THINK_TOKENS and the "low" retry go only to these): words in the model id, e.g. "deepseek".
    // Llama 3.3 70B fast doesn't think: its replies stay at MAX_TOKENS (owner 2026-10-13, her chat on Llama to test)
    THINKING_MODELS: ["deepseek"],
    // How much of the chat is sent with each reply, in tokens. The oldest messages are left out so the
    // prompt always fits. DeepSeek V4 Flash reads far more; this keeps replies fast and cheap.
    CONTEXT_TOKENS: 32768,
    // The same for the backup model: when it answers, older messages
    // are left out first, so OpenRouter never cuts the middle (her rules) out silently.
    BACKUP_CONTEXT_TOKENS: 32768,
    CHARS_PER_TOKEN: 3.5,              // rough estimate used for both (lower = safer)
    RETRY_TEMPERATURE: 1.05,           // the second try, when her first reply repeated herself
    TIMEOUT_MS: 60000,                 // owner 2026-10-13 (option 1, branch chat-timeout): DeepSeek finished in 4-6 s or 33-48 s (cf-probe 38357963015); was 30 s
    ATTEMPTS: 2,                       // tries per reply when the model fails
    RETRY_DELAY_MS: 1500,
  },

  /* ---------------- Long-term memory ---------------- */
  MEMORY: {
    MODEL: "@cf/deepseek-ai/deepseek-v4-flash-0731",             // defined above
    SAMPLING: { temperature: 0.3, max_tokens: 600 },
    TIMEOUT_MS: 45000,                 // a short thinking step on Workers AI (~20 s, cf-probe 2026-10-06); runs after her reply
    ATTEMPTS: 1,
    HISTORY_MAX: 40,                   // once the chat log has this many messages...
    HISTORY_KEEP: 24,                  // ...the newest this many stay and the rest fold into notes
    MAX_CHARS: 3000,                   // size cap of the notes
    BACKLOG_MAX: 80,                   // messages kept waiting when folding fails, until next time
    TRANSCRIPT_MAX_CHARS: 12000,       // how much of the old chat the memory model reads
  },

  /* ---------------- Long memory: recall (Cloudflare Vectorize) ---------------- */
  // Owner 2026-10-06 (Cloudflare idea 1): messages that fold out of the chat log are saved as vectors (RECALL.MODEL on
  // Workers AI) in the Vectorize index "reem-memory" (wrangler.toml MEMORY_INDEX; tools/cf-resources.sh makes it);
  // before she replies, his message finds the closest older moments and she's reminded of them (NUDGE).
  // About $0.012 per million tokens for the vectors; Vectorize is included in Workers Paid up to ~10,000 messages.
  RECALL: {
    ENABLED: true,
    MODEL: "@cf/baai/bge-m3",          // multilingual (Arabic, Arabizi), 1024 numbers a message: the index's size
    TOP_K: 6,                          // closest matches asked for (after /restart, older ones are left out)
    KEEP: 3,                           // at most this many go into her prompt
    MIN_SCORE: 0.6,                    // how close a match must be (cosine, 0-1)
    MAX_CHARS: 400,                    // of each message, saved and shown
    TIMEOUT_MS: 4000,                  // past this she answers without it
    // Owner 2026-10-06 (Cloudflare idea 5): a reply that means the same as one of her last REPEAT_LOOKBACK replies
    // (cosine at least REPEAT_SCORE, in other words too) is asked again once, like a word-for-word repeat. 0 = off
    REPEAT_SCORE: 0.68,                // recall-check 2026-10-06 (bge-m3): same story 0.71-0.90, other replies 0.47-0.63
    REPEAT_LOOKBACK: 10,
    REPEAT_MIN_CHARS: 30,
  },

  /* ---------------- Voice (ElevenLabs text-to-speech) ---------------- */
  VOICE: {
    // Who speaks her voice notes: "aura" = Workers AI Deepgram aura-2 (counted in the day's AI budget, ElevenLabs
    // as the backup when it fails or the budget is spent), "elevenlabs" = ElevenLabs only (the settings below ID)
    PROVIDER: "openrouter",
    AURA_MODEL: "@cf/deepgram/aura-2-en",         // aura-2-en voice (owner 2026-10-04: "Andromeda of course is much better than Helena")
    // aura reads [tags] aloud, so each allowed tag becomes a spoken cue here ("" = dropped; any tag not listed is dropped)
    // bench 2026-10-04: "heh" was heard as "Phew"/"Okay", "hehe" made her shout; "hm" and "mm" are performed well
    AURA_CUES: { laughs: "", giggles: "", chuckles: "hm" },
    ELEVENLABS_BACKUP: true,           // aura/OpenRouter failed or the budget is spent: ElevenLabs speaks it (else the note goes as text)
    // PROVIDER "openrouter": a speech model on OpenRouter (POST /api/v1/audio/speech, MP3 straight to Telegram), paid
    // from OpenRouter credit with its own money cap a day. TTS bench 2026-10-04: x-ai/grok-voice-tts-1.0 (ara, eve),
    // fish-audio/s2.1-pro, minimax/speech-2.8-hd, canopylabs/orpheus-3b-0.1-ft (tara, leah) all spoke her lines.
    OR_MODEL: "google/gemini-3.8-flash-tts",                   // "" = the model's own (Fish Audio needs none)
    OR_FORMAT: "pcm", // how she sounds, for models that take it (Gemini, OpenAI); the stronger accent wording the owner picked over the light one (2026-10-05, tts-bench run 37261464781)

    OR_CUES: { laughs: "[laughs]", giggles: "[laughs]", chuckles: "[laughs]", whispers: "[whispers]", sighs: "[sighs]" }, // tags as this model writes them ("" = dropped)
    OR_USD_PER_1000_CHARS: 0.015,      // Grok and Fish Audio $0.015, Orpheus $0.007, MiniMax HD $0.10 (OpenRouter list prices)
    OR_DAILY_USD: 0.3,                      // only shown on /setup
    MODEL: "eleven_v3",                // expressive, reads [laughs]-style tags; "eleven_multilingual_v2" is the steady older one
    FORMAT: "opus_48000_64",
    // eleven_v3 only uses STABILITY: 0 = Creative, 0.5 = Natural, 1 = Robust (other values are rounded).
    // The four settings after it are for the older models (eleven_multilingual_v2 and the like).
    STABILITY: 0.5,                    // 0 to 1: lower = more expressive, higher = steadier
    SPEED: 0.95,                       // 0.7 (slow) to 1.2 (fast); 1.0 is normal
    SIMILARITY_BOOST: 0.75,            // 0 to 1: how closely it sticks to the original voice
    STYLE: 0.4,                        // 0 to 1: style exaggeration
    SPEAKER_BOOST: true,
    // eleven_v3 only: she may put tags like [laughs] or [whispers] in voice notes, and the voice performs
    // them. Only the tags listed here are kept; any other [...] is dropped. Never shown in texts.
    AUDIO_TAGS: true,
    ALLOWED_TAGS: [
      "laughs", "giggles", "chuckles", "sighs", "whispers", "exhales", "breathes heavily", "breathless",
      "softly", "teasing", "sarcastic", "sleepy", "excited", "moans softly",
    ],
    MAX_CHARS: 360,                    // longest text read aloud in one note
    // When a reply is a voice note: decided here, not by the AI (it tends to describe voice notes instead).
    // Only while apart; she may still choose one herself by starting with [voice].
    CHANCE: 0.1,                       // chance per reply
    // Her own [voice] (when the code said text) counts only if none of her last this-many replies was a voice
    // note; otherwise it's sent as a text. Old voice notes in the chat pull her to more of them. 0 = always.
    SELF_CHOICE_GAP: 4,
    CHANCE_AFTER_VOICE: 0.6,           // ...when he just sent a voice note
    CHANCE_MORE_VOICE: 0.5,
    // In person (a scene), her quoted words can also come as an audio clip after the written scene, so he
    // hears her say them. Narration is never spoken; "she whispers" etc. before or after a line becomes its tag.
    SCENE_CHANCE: 0.25,
    PAUSE_BETWEEN_LINES: "0.4s",
  },

  /* ---------------- Ears (speech-to-text: Workers AI Whisper, ElevenLabs Scribe as the backup) ---------------- */
  // Owner 2026-10-04: use the Cloudflare plan for speech recognition. Whisper costs ~47 neurons a minute ($0.0005).
  HEARING: {
    // Gemini on OpenRouter first (owner 2026-10-05: "Go with Gemini 3.8 flash for voice"): it hears his words, Arabic and
    // Arabizi, and writes laughs, sighs and tone in parentheses (stt bench run 37266123079); Whisper when it fails
    OR_MODEL: "google/gemini-3.8-flash", // OpenRouter, audio in (Telegram's OGG as is); "" = never
    OR_FIRST: true,
    OR_TIMEOUT_MS: 25000,              // Gemini's limit before Whisper takes over
    OR_MAX_SECONDS: 300,               // longer voice notes go straight to Whisper (cost: about $0.02 a minute on Gemini)
    MODEL: "@cf/openai/whisper-large-v3-turbo", // Whisper's hint: words it should spell right ("" = none; "habibi" was heard as "heavy bee" without it)
    TIMEOUT_MS: 30000,                 // Whisper's limit before the backup takes over
    BACKUP_MODEL: "scribe_v2",                      // "" = detect automatically; or a code like "en", "ar"
    TAG_AUDIO_EVENTS: true,            // ElevenLabs only: adds things like (laughs) to transcripts, so she hears them
  },

  /* ---------------- Human timing ---------------- */
  TIMING: {
    TYPING_CHARS_PER_MIN: 900,         // how fast she types
    TYPING_MIN_MS: 1200,
    TYPING_MAX_MS: 8000,               // no single text takes longer than this
    SCENE_TYPING_MAX_MS: 6000,         // in-person scenes aren't typed on a phone, so they come faster
    TYPING_JITTER_MIN: 0.7,            // each message's typing time is randomly scaled
    TYPING_JITTER_MAX: 1.4,            //   between these two factors
    NOTICE_MIN_MS: 1000,               // before she even picks up her phone...
    NOTICE_MAX_MS: 6000,               // ...multiplied by the "delay" of her SCHEDULE slot
    ACTIVE_WINDOW_MS: 1200000,         // if he answers within this long of her last message, they're mid-conversation...
    ACTIVE_NOTICE_MIN_MS: 500,         // ...and she picks up within this range instead
    ACTIVE_NOTICE_MAX_MS: 2500,
    LONG_PAUSE_CHANCE: 0,              // otherwise, sometimes she's busy and takes much longer
    LONG_PAUSE_MIN_MS: 60000,
    LONG_PAUSE_MAX_MS: 120000,
    READ_MS_PER_CHAR: 8,
    SPEAK_WORDS_PER_SEC: 2.2,          // "recording voice message..." lasts about as long as the note
    RECORDING_EXTRA_MS: 1500,          // added on top of the speaking time
    RECORDING_MAX_MS: 15000,
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
    COPY_WORDS: 6,                     // a line with this many words in a row from a prompt example is a copy (0 = off)
    OPENING_LOOKBACK: 4,               // she is told how her last N replies started...
    OPENING_WORDS: 3,                  // ...using their first N words, so she opens differently
    SCENE_TIMEOUT_MIN: 120,            // an in-person scene counts as over after this long without messages
    // He asks her over while they're apart ("come over", "waiting for you to knock"): this often her reply is the scene
    // of her going to his door (NUDGES.FORMAT_VISIT); otherwise a normal reply, where she may tease or invite him instead.
    // Owner 2026-10-06: "Mostly go" (live runs before: she went 3/9 to 5/10).
    VISIT_CHANCE: 0.75,
  },

  /* ---------------- /auto: she drafts his next message ----------------
   * /auto [idea] shows a draft of his next message with two buttons: Send (she answers it) and Another.
   * The draft is tap-to-copy, so he can also edit it and send it himself.
   */
  AUTO: {
    MODEL: "@cf/deepseek-ai/deepseek-v4-flash-0731", // same as LLM.MODEL (Workers AI); LLM.BACKUP_MODEL when it fails
    SAMPLING: { temperature: 1.0, min_p: 0.1, repetition_penalty: 1.05, max_tokens: 160 },
    TIMEOUT_MS: 40000,                 // a short thinking step on Workers AI (~20 s, cf-probe 2026-10-06)
    TRANSCRIPT_MAX_CHARS: 6000,
  },

  /* ---------------- Emoji reactions ----------------
   * Sometimes (CHANCE per reply, only while apart) she's offered a reaction: she may put [react: X] at the
   * start of her reply, and X lands on his latest message. A reaction alone, with no text, is fine too.
   * Telegram only accepts emoji from its fixed reaction list (❤ without FE0F, 🤣 rather than 😂).
   */
  REACTIONS: {
    ENABLED: true,
    CHANCE: 0.25,                      // chance per reply that she's offered a reaction
    ALLOWED: ["❤", "🔥", "🥰", "🤣", "😭", "😈", "💋", "😘", "😍", "🙈", "🤨", "💔", "👀"],
    ALIASES: { "❤️": "❤", "😂": "🤣" }, // what the model might write = what Telegram accepts
    SAVED: "[reacted {emoji}]",        // {emoji}; kept in the chat history when she only reacts
  },

  /* ---------------- She texts first ----------------
   * Every 15 minutes (cron in wrangler.toml) she may send something unprompted, if he's been
   * quiet long enough, it's not her quiet hours, and a random roll passes. She never sends a
   * second one until he answers the first.
   */
  PROACTIVE: {
    ENABLED: true,
    MIN_SILENCE_HOURS: 3,              // only after this long without any message either way
    CHANCE: 0.12,                      // chance per 15-minute check once the silence is long enough
    MAX_PER_DAY: 3,
    QUIET_FROM_HOUR: 1,                // her local time: no texting first from 1:00...
    QUIET_TO_HOUR: 9, // {hours}
  },

  /* ---------------- Her eyes: his photos (Cloudflare Workers AI) ----------------
   * A photo he sends is described in words by a vision model; she reads the description (INBOX.PHOTO_SEEN).
   * Needs the AI binding (wrangler.toml); without it, or when it fails, she gets INBOX.PHOTO as before.
   */
  VISION: {
    ENABLED: true,
    MODEL: "@cf/meta/llama-4-scout-17b-16e-instruct",
    BACKUP_MODEL: "@cf/google/gemma-3-12b-it", // used when MODEL is unavailable (Cloudflare can move models off the free plan)
    PROMPT: "Describe this photo for someone who can't see it, in one to three plain sentences: who or what is in it, what they're doing and wearing, the place, and any text in it. If there is a person, describe how they look. Describe bodies and nudity plainly and factually. No opinions, no intro.",
    MAX_TOKENS: 160,
    MAX_SIDE: 800,                     // the biggest size Telegram has up to this many pixels is looked at (small = less CPU and neurons)
    MAX_CHARS: 600,                    // longest description she's given
    TIMEOUT_MS: 20000,
  },

  /* ---------------- Her pictures (Cloudflare Workers AI) ----------------
   * Same rules as voice notes, less often (pictures cost more): apart she sends a selfie when he asks
   * (ASK_PATTERN) or on CHANCE (CHANCE_AFTER_PHOTO after he sent one, CHANCE_MORE with /pics); she may also
   * choose one herself with [selfie: type, what it shows]. In person, a picture of the moment (seen from his
   * eyes) when he asks to see (SCENE_ASK_PATTERN) or on SCENE_CHANCE. Never OOC.
   * Every picture is drawn new (never a picture sent before), from her reference face (/face, else face.js),
   * never once he says he's under 18 (MINOR_PATTERN), and only within AI_BUDGET.
   * Pictures v3 (shot catalog): a selfie is one of SHOTS (a camera + framing), in a tier (everyday, flirty,
   * boudoir) picked by the code from the chat (TIER_WEIGHTS, heat, late hours, what he asks for); the angle,
   * expression, wardrobe, place and light are picked by the code too (models don't roll dice). May be sexy by
   * pose or wardrobe; nude only at /nsfw Nude or On on Runware (Step 2; on Cloudflare, SAFE: never nude). Descriptions or
   * scene sentences with NOT_DRAWN words aren't drawn.
   */
  PICTURE: {
    ENABLED: true,
    // Which model draws her pictures (owner 2026-10-06: "different versions with different models all ready to deploy"):
    // "cloudflare" = klein 4B on Workers AI (MODEL; 9B in Step B only), lingerie on Nano Banana (LINGERIE), never nude: today's route;
    // "runware-klein" = FLUX.2 klein 9B on Runware with her face and body (RUNWARE.MODEL), safety check off, nudity
    // allowed (owner 2026-10-06), TwinFlow when it fails; "runware-twinflow" = TwinFlow Z-Image-Turbo on Runware,
    // text only (RUNWARE.LOOKS: no face picture). Both Runware routes need the Worker secret RUNWARE_API_KEY.
    ROUTE: "runware-klein",            // owner 2026-10-06: "Switch on the runware klein for all pictures" (was "cloudflare")
    // Step C (owner 2026-10-13: "revert cloudflare to Klein 4B"): klein 4B, ~115 neurons a picture at 576x1024. Step B had klein 9B
    // at 768x1344 (~1,500 neurons, $0.0165). Fixed 4 steps.
    MODEL: "@cf/black-forest-labs/flux-2-klein-4b", // draws from her reference face
    BACKUP_MODEL: "@cf/black-forest-labs/flux-1-schnell", // when MODEL is unavailable: no reference, LOOKS instead
    BACKUP_STEPS: 6,                   // 1 to 8
    WIDTH: 576,                        // pixels, 9:16 (owner 2026-10-04: "all pictures should have 9:16 aspect ratio").
    HEIGHT: 1024,                      // Klein 4B is priced per 512x512 tile, rounded up: 576x1024 = 4 tiles, as 768x1024 was
    TIMEOUT_MS: 120000,                // klein took 9-238 s on 2026-10-03 (most under 60 s; 2 of 25 over 2 min)
    CHANCE: 0.1,                       // apart, per reply (voice: 0.1). Owner 2026-10-03: more pictures (was 0.05)
    CHANCE_AFTER_PHOTO: 0.45,          // ...when he just sent a photo (voice: 0.6 after his voice note)
    ALBUM_MAX: 500,                    // pictures /album keeps (Telegram's ids in KV: nothing is stored twice or drawn again)
    CHANCE_MORE: 0.3,                  // ...when /pics is on (voice: 0.5 with /voice)
    SCENE_CHANCE: 0.15,
    // Step 2 (2026-10-11): /nsfw Off / Nude / On, per chat (s:<chat>.nsfw); a chat that has never set it is On (DEFAULT).
    // Off: no nudity, no sex acts, no NUDE or ACT LoRAs, Runware's content check on (lingerie still allowed). Nude: nudity,
    // no sex acts. On: everything (today). SELF_NUDE is added to her SELF_CHOICE at Nude and On only.
    NSFW: {
      DEFAULT: "on",
      // /nsfw Off draws on this route (owner 2026-10-11): "cloudflare" = Cloudflare klein (her face, body and place; lingerie with FILTER_WORDS; SAFE), so Cloudflare's safety filter applies; "" = Runware as at Off before. Nude and On stay on Runware
      OFF_ROUTE: "cloudflare",
      SELF_NUDE: " When things are hot between you, you may send one naked or topless: say plainly what's bare.",
    },
    SELFIE_STYLE: "Realistic candid smartphone photo she took herself:",
    // round 5: an in-person scene whose narration is a sex act (SEX_CUES): his eyes are the camera, he is in the picture
    SCENE_ACT_STYLE: "Realistic candid first-person photo from the man's own eyes, caught in the middle of the act, not posing:",
    // round 5 (owner: "Would doing the /look while in a sex scene give a picture that properly reflects that act from POV of
    // user?"): her narration rarely names the act ("wraps her lips around it", "pulls you down on top of her"), so /look missed
    // the act's LoRA and camera, dropped sentences about him and dressed her. act words (what ACT_WORDS/ACT_SCENES know) = a
    // regex (case-insensitive) on her narration; the first match wins, so the narrower acts come first
    SEX_CUES: {
      "anal": "\\banal(?:ly)?\\b|\\b(?:in|into|inside) her (?:ass|asshole)\\b|\\bfuck\\w* her ass\\b|\\b(?:press|push|slid|slide|sink|ease)\\w* into her ass\\b",
      "deepthroat": "\\bdeep ?throat\\w*|\\bdown her throat\\b|\\bto the base\\b|\\bgag(?:s|ging|ged)?\\b",
      "a blowjob": "\\bblow ?job\\b|\\bsuck(?:s|ing|ed)?\\b|\\blips (?:wrap\\w* |close |tighten )?around\\b|\\b(?:in|into) her mouth\\b|\\bher mouth (?:on|around) (?:you|your|the man|his)\\b|\\blick\\w* (?:up )?(?:your|the man's|his) (?:cock|shaft|tip|length)\\b",
      "reverse cowgirl": "\\breverse cowgirl\\b|\\bfacing away\\b[^.]*\\b(?:rid\\w*|straddl\\w*|on top)\\b|\\b(?:rid\\w*|straddl\\w*|on top)\\b[^.]*\\bfacing away\\b",
      "riding the man, cowgirl": "\\bcowgirl\\b|\\brid(?:es|ing|e) (?:you|the man|him|your cock|the man's cock|his cock)\\b|\\bstraddl\\w*|\\bsinks? (?:down )?onto\\b|\\blowers herself onto\\b|\\bon top of (?:you|the man|him)\\b",
      "doggy style": "\\bdoggy\\w*|\\bon all fours\\b|\\bhands and knees\\b|\\bbent over\\b|\\bbends over\\b|\\bfrom behind\\b[^.]*\\b(?:into her|inside her|thrust\\w*|fuck\\w*)\\b|\\b(?:take\\w*|fuck\\w*|thrust\\w*|push\\w* into) her from behind\\b|\\bas (?:you|the man|he) takes? her from behind\\b",
      "missionary": "\\bmissionary\\b|\\bon top of her\\b|\\bdown (?:on top of|onto) her\\b|\\blegs (?:wrap\\w*|lock\\w*|hook\\w*) around (?:your|the man's|his) (?:hips|waist|back)\\b|\\b(?:lies|lying) (?:back|on her back)\\b[^.]*\\b(?:into her|inside her)\\b|\\b(?:legs spread|spreads her legs)\\b[^.]*\\b(?:into her|inside her)\\b",
    },
    // and a cue counts only when the narration also has one of these (so "sucks in a breath" or "bends over for the laundry"
    // stay everyday pictures)
    SEX_CONTEXT: "\\b(?:cock|dick|penis|shaft|erection|inside her|into her|thrust\\w*|fuck\\w*|naked|nude|moan\\w*|cum\\w*|sex|her throat|her ass|(?:takes?|taking) her from behind|pounds? her)\\b",
    // "seen from the eyes of the man in front of her" drew a man at the edge (face run 2026-10-05), hence "from where he stands"; Step B
    // (2026-10-13): "in front of her" only when the scene says so (/look 484 had her beside him), so the camera is his eyes, wherever he is
    SCENE_STYLE: "Realistic candid first-person photo from the man's own eyes, as he sees her (only she is in the picture, nobody else), caught in the middle of what she's doing, not posing:",
    // Step B: on a /pic picture that is not a sex act but involves him (involvesHim: "the man", his, him, PoV ...): he is the camera.
    // Sex acts have RUNWARE.POV_MAN
    POV_CLOTHED: "First-person photo from the man's own eyes: he holds the camera, so his face and head are never in the picture and nobody else is; only his own hands or forearms may reach in from the bottom edge.",
    // Step B: "third" = the man in the third person (POV lines say he is the camera); "first" = every prompt names him I / me / my
    // (firstPerson). The Step B bench picks one
    CAMERA: "third",
    // its light: LIGHT for her time of day, or this after dark ("natural light" drew 3 of 3 night scenes in daylight, 2026-10-05)
    SCENE_NIGHT: "It is the middle of the night: the windows are black, and the room is lit only by its own warm lamps. The lamp light falls on her face, so her green eyes show.", // the face lit: 2026-10-15 (her eyes came out brown in the dark)
    // In person, she wears what the scene said she wears (WEARING_WORDS in her narration of this scene, newest first),
    // else SCENE_WEARING. Without it klein dressed her in image 1's black dress, pose included (owner, 2026-10-05)
    SCENE_WEARING: "her father's old gray knit cardigan, elbows worn through, sliding off one shoulder, over a plain black tank top and soft gray sweatpants",
    // a scene that names only layers (LAYER_WORDS: "an old cardigan and wool socks") gets these under them, so klein
    // doesn't fill the gap with image 1's dress (owner 2026-10-05: "She should be wearing casual at home")
    SCENE_UNDER: "a plain black tank top and soft gray sweatpants",
    LAYER_WORDS: ["cardigan", "sweater", "hoodie", "sweatshirt", "coat", "jacket", "scarf", "apron", "socks", "slippers", "heels", "boots", "sneakers", "stockings"],
    // Step 4: an everyday picture (or /pic) whose words say she is out takes the day's OUT outfit, else HOME. Not a bare "out", "rain"
    // or "snow" (review: "stretched out", "lights out", "rain on the window" put her in a coat at home)
    OUTSIDE_WORDS: ["outside", "going out", "out for", "out with", "night out", "walk", "walking", "street", "park", "cafe", "café", "coffee shop", "store", "grocery", "market", "work", "office", "car", "train", "bus", "subway", "beach", "restaurant", "bar", "date", "campus", "sidewalk", "in the snow", "in the rain"],
    WEARING_WORDS: ["cardigan", "sweater", "hoodie", "sweatshirt", "t-shirt", "tee", "shirt", "blouse", "tank top", "camisole", "slip dress", "satin slip", "silk slip", "lace slip", "velvet slip", "dress", "skirt", "jeans", "leggings", "sweatpants", "pants", "trousers", "shorts", "pajamas", "pyjamas", "robe", "bathrobe", "kimono", "nightgown", "nightie", "coat", "jacket", "scarf", "apron", "towel", "socks", "slippers", "heels", "boots", "sneakers", "bodysuit", "bikini", "swimsuit", "turtleneck", "lingerie", "bra", "bralette", "panties", "underwear", "stockings", "corset", "babydoll", "teddy"],
    PORTRAIT: "Head-and-shoulders portrait photo, looking at the camera, plain light wall behind her, soft natural light, realistic, sharp focus on the face.", // what /face draws
    CRAFT: "Natural skin texture, slight grain.",
    // owner 2026-10-05: "90% from the same angle as the location pictures ... included as is": klein copies the place
    // picture's framing (rewording it as "only a reference" changed 1 of 6, face run 37339347977), so each place is
    // three crops of the owner's picture (tools/face/places/views) and a picture gets one: 8 of 8 showed another part
    // of the same room (face run 37340198460)
    ROOM: "Behind her is the part of her room shown in image {n}, with the same walls and furniture, close behind her, lit by this picture's own light as described above; she fills most of the frame. The room: {look}.", // a fixed place with its reference picture ({n}: its image number). "the same light" copied the reference's daylight into every picture: 0 of 12 lamp or night prompts came out dark (face runs 37151684663-37154159749, 2026-10-03)
    ROOM_TEXT: "The place: {look}.",   // ...without one (or drawn by the backup model)
    SAFE: "",                          // Step B (2026-10-13): was "No nudity."; Off is gated by mayDraw and Cloudflare's filter judges the picture
    // /pic (owner 2026-10-06: "generate pictures customized with different hairstyles, makeup, poses, clothing, framing,
    // angle, but Reem remains Reem"): STYLE + who she is + his words + the light of her hour + CRAFT; her face stays the
    // reference, but REFERENCE's "same face and hair" becomes SAME_PERSON, so the hair he asks for is drawn
    CUSTOM: {
      STYLE: "Realistic candid photo:",   // ends with a colon: phone2025's trigger (LORA_PREFIX) is a sentence of its own
      SAME_PERSON: "with exactly the same face, clearly the same woman (her hair, makeup, clothes, pose and framing are as described below, not as in image 0)",
    },
    // /look (owner, round 7: "/look doesn't always have to involve Reem if the user is not with her. It simply describes what he sees,
    // wherever and whenever ... it'd be useful if deepseek can help with it, as well as the user by typing after /look"): MODEL reads
    // the last CHAT_MESSAGES and his words after /look and writes the picture (PROMPT; first line WITH_HER or ALONE). With her: a
    // scene picture (SCENE_STYLE, or SCENE_ACT_STYLE on a sex act) with her face; alone: ALONE_STYLE, nobody's face. When the model
    // fails: her last reply as before (in person), else LOOK_APART
    LOOK: {
      // owner 2026-10-13 (Step C, "Llama for all"): Llama 3.3 70B fast, as WRITER.MODEL (was DeepSeek V4 Flash: 5-140 s, it thinks first)
      MODEL: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      CHAT_MESSAGES: 8,
      MAX_TOKENS: 300,
      // Step C (2026-10-13): the picture writer's rules (WRITER.RULES) and the clothes to name when the story names none ({clothes}: the
      // scene's own, else the day's outfit); Step B's free text put him in the room (D1 484) and a phone in her hands (Step B bench)
      PROMPT: "You describe one photo: exactly what {him} sees right now with his own eyes in the roleplay story below, as if he took a picture of it this second. {her} is the woman in the story.\n\nThe story so far (newest last):\n{chat}\n\n{ask}Write the first line as WITH_HER if {her} is in front of him and in view, else ALONE.\nIf she is in view, then 1 or 2 plain sentences, at most 45 words, for an image model: what she is doing and her pose, where each of her hands is (on her knee, in her hair, on the sheets; she holds only what the story puts in her hands, never a phone); what she is wearing (if the story names no clothes: {clothes}); the place and one or two things around her; her expression in a few words. {rules}\nIf she is not in view: 1 to 3 plain sentences of what is in front of him: the place, the light, the things around; no people; his own hands only if they hold or touch something. No dialogue, no feelings, no names.",
      ASK: "His request for this photo (it wins over the story): {words}\n\n",
      // "...the phone is the camera" drew a man holding a phone, seen from outside (1/1)
      ALONE_STYLE: "Realistic candid first-person photo taken from the man's own eyes (no person in the picture; no phone and no hands unless described):",
    },
    // Step D (picture overhaul; owner 2026-10-13: "fix every anatomical issues that I have seen in almost every single picture", then
    // "Step D now"): after each picture of her (KINDS), a vision model answers PROMPT (+ POV on pictures from his eyes, ACT on sex acts);
    // a picture with problems is drawn again with the next seed, TRIES pictures at most, the one with the fewest problems sent.
    // Claude's wording; benched on labelled pictures first (tools/face/anatomy-probe.mjs).
    ANATOMY: {
      ON: true,
      MODEL: "@cf/meta/llama-4-scout-17b-16e-instruct", // as VISION.MODEL; ~4.6 s and ~63 neurons a check (probe v2)
      KINDS: ["selfie", "scene", "look", "pic"],
      TRIES: 3,                        // pictures drawn at most (2 redraws)
      // owner 2026-10-13 (F3, option a): stop redrawing when a try has the same single mistake as the try before it (a likely false
      // alarm, e.g. "2 heads" on a /look 3 times, D1 565-567): at most 2 pictures paid for it
      STOP_ON_REPEAT: true,
      TIMEOUT_MS: 20000,               // a slower check passes the picture
      MAX_TOKENS: 300,
      // probe run 38340313839 (an open checklist, one JSON verdict): Scout caught 1 of 4 mistakes outside sex acts, and counted the man as a
      // second person in every act picture, good or bad → v2: one question per mistake, his head counted as a mistake (he is the camera).
      // v2 (run 38340521232): Scout caught 5 of 7 (the second man's head 2/2, the bare + jeans legs), passed 9 of 11 (a laugh read as a
      // distorted face; 2 heads in a clean riding picture); Llama 3.2 11B Vision 3/7, Mistral Small 3.1 1/7 → Scout; v3: the edges, a laugh.
      // v3 (run 38341298420): 5/7 and 9/11; no laugh false alarm; "2 heads" on every act picture, clean ones too (it infers the man) →
      // on acts the head count is not a mistake (anatomyVerdict); outside acts: second heads, mismatched legs, 1 of 3 klein 4B stray hands
      PROMPT: "You check an AI-generated photo for drawing mistakes. Look closely, especially along all four edges of the photo, then answer.\n1. How many human heads or faces can you see? Count every one, even partly hidden, blurred or cut off at an edge.\n2. Is there any hand, arm, leg or foot that is not clearly attached to the woman's body{attached}? Look hardest at the left and right edges, where someone else's hand or arm can reach in.\n3. Does any hand have too many or too few fingers, or fused, melted or impossibly bent fingers?\n4. Is any arm or leg broken, bent the wrong way, missing, doubled, far too long, or merging into furniture, clothes or another body?\n5. Is one of her legs dressed differently from the other (one in jeans, the other bare)?\n6. Is her face or neck deformed (melted, lopsided, twisted)? An expression, a laugh or a squint is not a mistake.{pov}{act}\nAnswer in at most four short lines, then on the last line only JSON: {\"heads\": number, \"stray_parts\": true or false, \"bad_hands\": true or false, \"bad_limbs\": true or false, \"mismatched_legs\": true or false, \"bad_face\": true or false}",
      ATTACHED: " or to the man whose eyes are the camera",
      POV: "\nThe photo is taken from a man's own eyes: he is the camera, so his head and face are never in it; his own hands or forearms may reach in from the bottom edge.",
      ACT: "\nIt shows sex from the man's own eyes: he is the camera, so his head and face are never in it; his hands, arms, legs, torso and penis may show and belong to him.",
    },
    // Step C (picture overhaul, owner 2026-10-12: "Hybrid (Recommended)"): DeepSeek on Workers AI writes only the words of the moment
    // (action, pose, clothes, place) of /look (LOOK.PROMPT, under RULES) and of her own pictures: SELFIE tidies the code's draft
    // (framing + her words: D1 rows 13 and 14 had two poses, two smiles and a phone), SCENE writes her in-person moment from her
    // narration. The code still picks the references, LoRAs, framing, expression and light. Off, failed, slower than TIMEOUT_MS or
    // unusable (fewer than 4 words, a garment lost, nudity or a phone added, a level it may not draw): today's template. Claude's wording.
    // Step C bench: "thumb extended toward the camera" drew a jab at the lens 2/2 and "expression pinched" a glare or wince 3/4; a
    // t-shirt with nothing named below drew jeans in bed 2/2 (RUNWARE.DRESSED_BOTTOM) → RULES' hands, plain expression, below the waist
    WRITER: {
      ON: true,
      // owner 2026-10-13 ("Llama for all"): Llama 3.3 70B fast on Workers AI, ~$0.00024 a call. Replays (writer-replay runs 38334730750,
      // 38336511907, 38337486774): Llama 15/15 answered, median 1.3 s, every rule kept, no refusals on explicit cases; DeepSeek V4
      // Flash thinks first even at "none" (median 5-24 s, most selfie calls past 25 s); Mistral Small 3.1 refuses reasoning_effort "none"
      MODEL: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      KINDS: ["selfie", "scene"],      // her own pictures it writes ("look" is LOOK.PROMPT's, always on)
      TIMEOUT_MS: 25000,               // then the template: her picture comes without waiting longer
      // "none": the instructions as the system message and GO as his turn (chat-shaped: no thinking; an empty answer is asked again,
      // the third time with "low"); "low": one user message, it thinks first. Replay run 38334730750 with "low": median 24 s, 20 of
      // 48 calls over 25 s, most spent all 1,660 tokens thinking and came back empty. /look (LOOK.PROMPT) asks the same way
      REASONING: "none",
      GO: "Write it now.",
      MAX_TOKENS: 160,
      CHAT_MESSAGES: 6,                // the chat it reads (newest last)
      MAX_WORDS: 60,                   // longer answers are cut back to whole sentences
      RULES: "Call her \"she\", no names. He is the camera: the photo is what his own eyes see, so never write about the man, his body, his face, his hands or where he is (write \"facing the camera\" or \"close to the camera\"); every hand in your words is hers, and her hands never point, reach or gesture toward the camera; nothing on his body (a cut, his shirt). Always say what she is wearing, garment by garment with colors and what she wears below the waist (sleep shorts, sweatpants, a skirt), or that she is naked, or which clothes are off. Her expression in plain everyday words (a worried look, a soft smile, a sleepy face). If they are having sex, name the act plainly with one of these words: blowjob, deepthroat, missionary, riding, reverse cowgirl, doggy style, anal; the man is named only as the one she does it with (\"she rides the man\"). No feelings, thoughts, sounds, dialogue or story; only what a camera sees.",
      SELFIE: "You write the words of one photo for an image model. {her} is sending {him} a selfie. The code wrote this draft from her words, and it may contradict itself:\n{draft}\n\nWhat was said around it (newest last):\n{chat}\n\nRewrite the draft as one plain clause of at most 40 words with no subject, starting the way the draft starts: its framing and pose first, then what she is wearing, then where she is. Keep every garment and color the draft names, and its place. Drop: anything that contradicts the framing or the pose (a second pose, a second place), every expression, gaze, smile or laugh (they are added later), any phone or anything held in her hands, and the light. {rules} Answer with the clause only.",
      // Rebuild Step 2 (2026-10-16): the writer fills ShotSpec fields as JSON and the code phrases every prompt
      SPEC: "You fill in the fields of one photo for an image model. {her} is the woman in it; {him} sees it with his own eyes (he is the lens, never in it).\n\nWhat was said (newest last):\n{chat}\n\nThe moment:\n{moment}\n\nThe code already decided: {decided}\n\nAnswer with one JSON object and nothing else, with these keys:\n\"action\": what she is doing and her pose, and where each of her hands is, in at most 20 plain words, starting with a verb (\"sits on the edge of the bed, one hand in her hair\"); she holds only what the story puts in her hands, never a phone.\n\"outfit\": what she is wearing, garment by garment with colors, including what she wears below the waist; \"\" if she is naked.\n\"place\": one of {places}, or \"\".\n\"expression\": her expression in a few everyday words (\"a sleepy smile\").\nUse only words for what the lens sees: call her \"she\", write \"the lens\" for where the photo is taken from, describe only things that are in the photo, and say what is there (never what is missing). No feelings, sounds, dialogue or story. Add no nudity or sex the moment hasn't.",
      SCENE: "You write the words of one photo for an image model: what {him} sees with his own eyes right now, in person, in the roleplay story below. {her} is the woman in it.\n\nThe story so far (newest last):\n{chat}\n\nThe moment to draw is her last reply:\n{moment}\n\nWrite 1 or 2 plain sentences, at most 45 words: what she is doing and her pose, where each of her hands is (on her knee, in her hair, on the sheets; she holds only what the story puts in her hands, never a phone); what she is wearing (if the story names no clothes: {clothes}); the place and one or two things around her; her expression in a few words. The light only if the story names it (a lamp, candles). {rules} Answer with the sentences only.",
    },
    // The picture core (Rebuild Step 2, 2026-10-16, WORKPLAN "Rebuild"): every picture of hers is a ShotSpec phrased by framePrompt
    // (src/pictures/spec.js, interpret.js, frames.js, prompt.js, loras.js, lint.js). The CORE "legacy" switch was removed in Step 3b
    // (2026-10-16); runwarePlan stays only for drawPicture without a spec (/face, /health, old benches)
    FRAMES: {
      // the sampler (owner 2026-10-15: "CFG at 1 and Steps at 4"; FLUX.2 klein 9B is step-distilled for 4 steps at guidance 1).
      // owner 2026-10-16 (Step 3b): acceleration "high" ($0.0039 a picture, a third cheaper; the same picture as "none" 6/6 in the Step 3
      // bench) and DPM++ 2M Karras (the same picture as Default 6/6 at the same price). "" = Runware's Default
      STEPS: 4,
      CFG: 1,
      ACCELERATION: "high",
      SCHEDULER: "DPM++ 2M Karras",
      // one LoRA, NSFW Unlocked, by content (owner 2026-10-15: clothed tested at 0.6 and below; nudity and acts never above 0.8, since
      // with a long prompt 1.0 and higher forces an act or nudity; 0.05 steps). Starting values; the Step 3 weight sweep decides.
      // "alone": /look without her (no LoRA)
      LORA: "ferasalm:nsfwunlock@1",
      LORA_WEIGHTS: { clothed: 0.5, partial: 0.65, nude: 0.75, act: 0.8, "act-partial": 0.75, alone: 0 },
      // the Anatomy Fixer (owner 2026-10-15): only on a redraw after the anatomy check found a mistake, never on a sex act
      FIX_LORA: "myaiprojectsqqq:3@2",
      FIX_WEIGHT: 0.7,
      // references a route takes (Runware's schema: at most 4; Cloudflare klein 4B: face, body, place)
      MAX_REFS: { runware: 4, cloudflare: 3 },
    },
    // Runware (PICTURE.ROUTE "runware-klein" / "runware-twinflow"): every picture, lingerie and nudity included, with her
    // real words (no FILTER_WORDS, no NOT_DRAWN, no SAFE). Benched 2026-10-06 (docs/QUALITY.md): klein 9B kept her face and
    // drew nude 8/8 at $0.00078 in ~3 s, but only with NAKED's "no clothing of any kind" (else the body picture's clothes
    // leaked); TwinFlow drew 6/6 nude at $0.0006 without a face picture, the same-looking woman each time.
    RUNWARE: {
      MODEL: "runware:400@2",          // FLUX.2 klein 9B: her face (image 0), BODY (image 1), the place (image 2)
      BACKUP_MODEL: "runware:twinflow-z-image-turbo@0",           // image 1 on sex acts from behind (BACK_WORDS): the owner's nude back (second 2026-10-15 set)
      // acts seen from behind (owner, round 7: "When it's a doggy scene, don't prompt her breasts since they won't show ... always describe
      // that it's from behind"): BODY_BACK, REFERENCE_BACK and NAKED_BACK instead of the front ones
      BACK_WORDS: "doggy, doggystyle, doggy style, on all fours, anal, ass fucking, in her ass, in the ass, anally, reverse cowgirl, from behind",
      // Step 4 (owner, 2026-10-11): a nude picture that is not an act, with these words, is seen from behind too (BODY_BACK, REFERENCE_BACK,
      // NAKED_BACK). "her back" is left out: "naked, lying on her back" is a front view
      NUDE_BACK_WORDS: "from behind, belfie, booty, butt, her ass, back view, over her shoulder, bent over",
      DAILY_USD: 1,                    // owner 2026-10-08 (was 0.5): money a day for Runware pictures; then the Cloudflare route draws (never nude)
      USD_PER_PICTURE: 0.003,          // klein 9B at 768x1344 / 1024x1024: $0.0025-0.0034 (round 6 test; was 0.004 at 1008x1792)
      // owner 2026-10-08 (round 4: "the pictures' quality and details are poor"): Runware's own size and sampler. 576x1024 is
      // billed like 1024x1024 and drew her face ~100 px tall; Runware's defaults were acceleration "high" (step caching) and
      // CFG 3.5 on a distilled model (the Civitai klein workflows run CFG 1, 4-5 steps). 0 / "" = Runware's default
      // round 7 (owner: "Use lower resolution for lower cost"): 768x1344 $0.0025 (was 1008x1792 $0.0034; 576x1024 drew a soft, plastic face)
      WIDTH: 768,                      // klein on Runware only (multiples of 16, at most 2048); /face and Cloudflare keep PICTURE.WIDTH
      HEIGHT: 1344,
      STEPS: 6,                        // 2026-10-12 (owner: "use 6 steps and put CFG at 2"); were 5 and 1 (round 4)
      CFG: 2,
      ACCELERATION: "none",
      // the shape of sex-act pictures (owner, round 7: "Keep it at 1:1 (with occasional 16:9s) for blowjobs and deepthroat. For other sex
      // scenes, randomize between 9:16, 1:1, with occasional 16:9. Keep other pictures ... at 9:16"): ASPECTS.ORAL on oral acts (ORAL_WORDS),
      // ASPECTS.ACT on the other acts, shape = chance; SIZES in pixels; every other picture WIDTH x HEIGHT. A wide picture adds WIDE
      // (16:9 drew her twice in a clothed picture, round 6)
      SIZES: { "9:16": "768x1344", "1:1": "1024x1024", "16:9": "1344x768" },
      ASPECTS: { ORAL: { "1:1": 0.8, "16:9": 0.2 }, ACT: { "9:16": 0.4, "1:1": 0.4, "16:9": 0.2 } },
      WIDE: "Only one woman is in the picture.",
      BIG_FACE: true,                  // her face reference 2x (896x960, Runware upscaler) instead of the 460x480 one (Cloudflare's limit)
      UUID_REFS: false,                // library pictures (outfit, hair) go to Runware by UUID (imageUpload once, cached) instead of base64: cheaper ($0.0022 vs $0.0039 in one probe) but the same seed drew another background (Step 4 probe, 2026-10-16); off until the owner picks. A UUID Runware forgets is re-sent as bytes
      TRANSIENT_RETRIES: 1,            // at /nsfw Nude and On (Runware only): this many more tries when the last one failed with a Runware 5xx or a timeout (never on another error)
      KLEIN_TRIES: 2,
      HAIR_LINE: "Her hair is styled exactly as in image {n}; her face stays image 0's.",
      // Task C (owner's row 13, 2026-10-11: a cardigan over a cami came out naked below the waist): a top named and no bottom or one-piece
      DRESSED_BOTTOM: "Below the waist she wears what suits the outfit (jeans, a skirt, shorts or sweatpants); her hips and legs are never bare.",
      // LoRAs on klein 9B (MODEL only), AIR id = weight. Owner 2026-10-08: three Civitai LoRAs for klein 9B, uploaded to
      // Runware as ferasalm:...: realhd2k (Real HD 2k), phone2025 (Phone Photography 2000-2025), ultrareal5 (UltraReal V5 Pro)
      // owner 2026-10-08 "we want to try both": phone2025 + ultrareal5 at 0.6 each (bench run 37720473185: face kept 16/16);
      // then "Switch on Real HD 2K too": realhd2kc (converted, rank 32) at 0.5, as in the all-three bench (run 37722968583, 4/4)
      // owner 2026-10-08 (round 3): "Add anatomy fixer to every picture, and remove the least impactful LoRA": the drop-one
      // bench changed least without Real HD 2K (Lenovo UltraReal, ferasalm:lenovoc@1, drew the same as it): both out
      // round 4 (owner: "use instapic for every pic"): InstaPic moves here from SELFIE_LORAS
      // round 5 (owner: "Cut LoRAs where they make the least impact and where they worsen the output"): Anatomy Fixer
      // (myaiprojectsqqq:3@2) out: the drop-one bench (6 situations x 2 seeds) drew the same faces, bodies and acts without it
      // 2026-10-09 (owner: "let's return to using Real HD 2k for all pictures"): realhd2kc back at 0.5, its weight when it was last on
      // Step 4 (Step 3 review, 2026-10-11, "Realism LoRAs: V2"): InstaPic and Real HD 2K only; phone2025 and ultrareal5 are spare
      // (LORA_INFO). The smartphone prefix needs phone2025 in the list, so it stays out.
      // 2026-10-12 (owner: "For realism in telegram bot, always use Lenovo Ultrareal LoRA at 1.3 weighting. Stop using other Realism
      // LoRAs like instapic", "Maximum #of LoRAs per image is 3"): Lenovo UltraReal (Civitai 2682771, ferasalm:lenovoc@1) alone
      LORAS: { "ferasalm:lenovoc@1": 1.3 },
      // at most this many LoRAs a picture, kept in this order: LORAS, NUDE_LORAS, an act LoRA, HANDS_LORAS, ANATOMY_LORAS. 2026-10-15 (owner:
      // "reduce them to only two LoRAs, include the third only when necessary"): 2; a redraw after the anatomy check found a mistake
      // (drawPicture's `fix`) takes one more, so a nude picture gets the Anatomy Fixer then. Was 3 (owner 2026-10-12)
      MAX_LORAS: 2,
      // owner 2026-10-12 ("the quality anatomy fix LoRA ... especially since they cannot be retried"; "Sex scenes don't use anatomy
      // fixer"): Anatomy Quality Fixer on every picture that is not a sex act (her own, /pic, /look), at its round-2 weight
      ANATOMY_LORAS: { "myaiprojectsqqq:3@2": 0.7 },
      // owner 2026-10-12 ("When user's hand in the prompt, include the hands LoRA"): POV hand when HANDS_WORDS name his hands. Step A
      // bench (2026-10-13): with and without it the same pictures 4/4 pairs (NSFW Unlocked on) → owner: "Drop it"; it comes back with
      // one line here ({ "ferasalm:povhandc@1": 0.6 })
      HANDS_LORAS: {},
      HANDS_WORDS: "his hand, his hands, the man's hand, the man's hands, his fingers, the man's fingers, my hand, my hands, his palm, the man's palm",
      LORA_PREFIX: "This is a candid photograph taken with a smartphone of", // phone2025's trigger words, before her description
      // the prefix goes in only when this LoRA is in the list (Step 3, 2026-10-11): a picture without phone2025 has no smartphone sentence
      LORA_PREFIX_WITH: "ferasalm:phone2025@1",
      // Step 3 (2026-10-11): the LoRA catalog, for tools/options.mjs (docs/OPTIONS.md) and the bench; the plans don't read it.
      // category: realism, nudity, anatomy, act, light. `used` (in a list above) and `spare` (in no list) are worked out by options.mjs.
      LORA_INFO: {
        "ferasalm:phone2025@1": { name: "Phone Photography 2000-2025", category: "realism", civitai: null, trigger: "LORA_PREFIX", note: "spare (out of LORAS, Step 4)" },
        "ferasalm:ultrareal5@1": { name: "UltraReal V5 Pro", category: "realism", civitai: null, trigger: "", note: "spare (out of LORAS, Step 4)" },
        "ferasalm:instapic@1": { name: "InstaPic", category: "realism", civitai: 2998522, trigger: "instapic", note: "spare (out of LORAS, 2026-10-12: Lenovo only)" },
        "ferasalm:realhd2kc@1": { name: "Real HD 2K (DoRA converted to rank 32)", category: "realism", civitai: null, trigger: "", note: "spare (out of LORAS, 2026-10-12: Lenovo only)" },
        "ferasalm:lenovoc@1": { name: "Lenovo UltraReal", category: "realism", civitai: null, trigger: "", note: "LORAS at 1.3 (owner 2026-10-12: on every picture)" },
        "ferasalm:unchained@2": { name: "Unchained XXX v2", category: "nudity", civitai: 2753532, trigger: "", note: "spare (out of NUDE_LORAS, 2026-10-12: NSFW Unlocked)" },
        "ferasalm:snofsc@1": { name: "SNOFS v1.4 (rank-128 copy)", category: "nudity", civitai: null, trigger: "", note: "spare" },
        "ferasalm:nsfwunlock@1": { name: "NSFW Unlocked V2", category: "nudity", civitai: 3030169, trigger: "", note: "NUDE_LORAS at 0.8 (owner 2026-10-12: nudity and sex)" },
        "ferasalm:pussyd@1": { name: "PussyDiffusion v2", category: "anatomy", civitai: 2960754, trigger: "hairy pussy", note: "spare (2026-10-12: no act LoRA)" },
        "ferasalm:penis@1": { name: "General Penis", category: "anatomy", civitai: 2624854, trigger: "", note: "spare (2026-10-12: no act LoRA)" },
        "myaiprojectsqqq:3@2": { name: "Anatomy Quality Fixer", category: "anatomy", civitai: null, trigger: "", note: "ANATOMY_LORAS at 0.7 (owner 2026-10-12: every picture but sex acts)" },
        "ferasalm:flux4play@1": { name: "Flux 4 Play AIO", category: "act", civitai: 2702716, trigger: "c0wg1rl, r3v3rs3_c0wg1rl (ACT_SCENES)", note: "spare (2026-10-12: no act LoRA)" },
        "ferasalm:missionary@1": { name: "Missionary POV K3NK", category: "act", civitai: 2699087, trigger: "", note: "spare (2026-10-12: no act LoRA)" },
        "ferasalm:povanal@1": { name: "POV Doggy Anal", category: "act", civitai: 2821244, trigger: "", note: "spare (owner 2026-10-13: doggy anal on NSFW Unlocked only; with it her face changed 4/4)" },
        "ferasalm:povdt@1": { name: "Holding Deepthroat POV", category: "act", civitai: 2779637, trigger: "POV deepthroat scene", note: "spare (2026-10-12: no act LoRA)" },
        "ferasalm:povbj@1": { name: "POV Blowjob", category: "act", civitai: null, trigger: "", note: "spare" },
        "ferasalm:povhandc@1": { name: "POV hand (converted)", category: "act", civitai: 2640656, trigger: "", note: "spare (owner 2026-10-13: dropped, no visible change 4/4 pairs)" },
        "ferasalm:tushyraw@1": { name: "Tushy Raw Filter", category: "light", civitai: 2569967, trigger: "FLASH_TRIGGER", note: "spare (owner 2026-10-12: flash LoRA dropped)" },
      },
      // owner 2026-10-08: SNOFS (Civitai, klein 9B v1.4) on nude/explicit pictures only: added to LORAS when NUDE_WORDS match
      // (or, with SEX_ACTS on, a NOT_DRAWN word). Runware can't load its LoKR ("failed to load") and its merged klein 9B
      // checkpoints (bf16 and fp8: internalError), so it is a rank-128 LoRA copy (tools/lora/lokr-to-lora.py, run 37788419189)
      // + NSFW Unlocked V2 (Civitai 3030169, fuller natural bush 2/2) and Anatomy Quality Fixer (on Runware, myaiprojectsqqq:3@2:
      // cleaner limbs, followed the words better 3/3), owner 2026-10-08
      // round 3 (owner: "Compare between SNOFS and NSFW unlocked", + Unchained XXX v2, Civitai 2753532): Unchained spread her
      // legs and showed penetration riding where SNOFS and Unlocked didn't; Unlocked beat SNOFS on 2 of 3 → Unchained +
      // Unlocked (SNOFS, ferasalm:snofsc@1, stays on Runware)
      // Unlocked (ferasalm:nsfwunlock@1) out too: with every LoRA stacked (9) her face drifted in 5 of 8 sex pictures
      // 2026-10-12 (owner: "For NSFW and nudity, use NSFW Unlocked V2 LoRA at 0.8 weighting, instead of other LoRAs. The NSFW Unlocked
      // LoRA works fine for most of NSFW scenes and positions nudity and sex"): Unchained out
      NUDE_LORAS: { "ferasalm:nsfwunlock@1": 0.8 },
      // owner 2026-10-08 ("don't confuse which is anal and which is normal vaginal ... Ensure overall anatomical correctness"): with
      // Unchained on a sex act the penis went in below an open, empty vulva on riding 0/4 and missionary 0/4 (even worded "inside her
      // vagina"), and anal from behind came out vaginal 0/2; without it riding 2/2, missionary 2/2, anal from behind 2/3. NUDE_LORAS
      // are left out when one of these act LoRAs (penetration) loads; blowjobs and nude pictures keep them
      // 2026-10-12 (owner: "The act may replace NSFW unlocked LoRA if and only if NSFW LoRA has a high failure rate in achieving such
      // act"): none since the Step A bench (2026-10-13): NSFW Unlocked drew every act right (riding 4/4, missionary 4/4, blowjob 2/2,
      // doggy 2/2, doggy anal 1/1), and POV Doggy Anal in its place drew another woman's face 4/4 (at 1.0 and 0.8)
      NUDE_LORAS_OFF_WITH: [],
      // an act LoRA drawn alone (no LORAS, NUDE_LORAS or LORA_PREFIX) at this weight when it loads. Owner 2026-10-08 ("Let's try POV
      // doggy anal alone without the other LoRAs while raising its weight to 1"): anal from behind, her anus where it belongs 3/3 alone
      // at 1.0, while with the realism LoRAs a small vulva was drawn where her anus is (4 of 5)
      // round 7 (owner: "The tear streak is fine during deepthroat"): Holding Deepthroat POV alone at 1.0 on "deepthroat" benched again: her
      // face drifted 3/3 (older, another woman) and in her mouth only 1/3, while with the others a blowjob kept her face → not alone.
      // ALONE_WORDS: an ALONE_LORAS LoRA is alone only when one of its words is in the text (none = always alone)
      ALONE_LORAS: {},                 // 2026-10-12: none (Lenovo is on every picture, owner)
      ALONE_WORDS: {},
      // a LoRA (at its ACT_LORAS weight) added to a sex act whose words (comma-separated) are in the picture, even next to another act
      // LoRA (SOLO_LORAS aside). Round 7 put PussyDiffusion on vaginal acts; round 8 (owner: "his penis becomes as if it were part of the
      // pussy. Try running general penis with it"), zoom crops, 2 seeds each: PussyDiffusion missionary 0/2, riding 1/2, doggy 1/2; with
      // General Penis too 0/2, 0/2, 1/2; General Penis alone 2/2, 0/2 (on riding it drew the penis growing from her bush), 2/2 →
      // General Penis on missionary and doggy, riding with neither (right 2/2 in round 6)
      WITH_LORAS: {},                  // 2026-10-12: none (owner: no third act LoRA for now)
      // by situation (owner 2026-10-08: "use LoRAs according to situations", runwareLoras): added to LORAS on her selfies /
      // in-person scenes and /look / /pic. InstaPic (Civitai 2998522) on selfies: more natural hair and skin (alone it drew
      // the phone in a plain selfie, so only with the others, at 0.6)
      SELFIE_LORAS: {},
      SCENE_LORAS: {},
      PIC_LORAS: {},
      // a LoRA added when one of its ACT_WORDS (comma-separated, whole words) is in the picture's words. Benches 2026-10-08:
      // Flux 4 Play AIO (Civitai 2702716) cowgirl, reverse cowgirl, missionary, doggy 5/5 (riding had no LoRA before);
      // Missionary POV K3NK (2699087) 4/4; POV Doggy Anal (2821244) 2/2; General Penis (2624854) and PussyDiffusion v2 (2960754:
      // a full natural bush and a real vulva 2/2) on every sex act; POV hand (2640656, converted: ferasalm:povhandc@1) his hands.
      // POV Blowjob (ferasalm:povbj@1): its POV penis came out far too long 0/9 (owner: "too long") → 0.6 with a side view
      // (ACT_SCENES): oral and an average size 2/2 (without it, oral 3/6)
      // round 4 (owner: "Remove any side-view, where it implies Reem is having sex with another man", "Add the following LoRA for
      // blowjob scenes": Holding Deepthroat POV, Civitai 2779637, ferasalm:povdt@1): blowjobs from his eyes with it (povbj stays on Runware)
      // round 5: POV hand (ferasalm:povhandc@1) out: ACT_SCENES' "his hands on her butt" drew his hands 4/4 without it, and
      // with it one anal picture got a stray bra strap. Holding Deepthroat POV kept: in her mouth 3/3 at 0.6-1.0, without it 0/2
      // 2026-10-12 (owner: "None for now, expect that this will change later and new LoRAs might be added"): no act LoRA; ACT_WORDS
      // below stay, so an act LoRA comes back with one line here. Was: Flux 4 Play, Holding Deepthroat, Missionary, POV Doggy Anal 0.8,
      // General Penis 0.6, PussyDiffusion 0.8
      ACT_LORAS: {},
      ACT_WORDS: {
        "ferasalm:flux4play@1": "riding, rides, ride, cowgirl, reverse cowgirl, sinks down onto the man, lowers herself onto the man",
        "ferasalm:povdt@1": "blowjob, blow job, sucking, sucks, suck, deepthroat, deep throat, deepthroating, takes the man in her mouth",
        "ferasalm:missionary@1": "missionary",
        // Step 6: the same words as ANAL_WORDS (an anal act takes ANAL_LORAS; "her ass" on riding or doggy loaded POV Doggy Anal alone)
        "ferasalm:povanal@1": "anal, anally, ass fucking, in her ass, in the ass, up her ass, fucks her ass, fucking her ass, fucked her ass, in her anus",
        "ferasalm:penis@1": "penis, cock, dick, erection, erect",
        "ferasalm:pussyd@1": "pussy, vagina, spread legs, legs spread",
      },
      ACT_ANY: [],                       // ACT_LORAS also allowed on clothed pictures (round 5: none; POV hand was the only one)
      // round 4 (owner: "Remove the overlapping LoRAs (General Penis, pussy diffusion) unless the picture requested specifically
      // requests for a pussy or penis without a sex act"): these load only when no other ACT_LORAS act LoRA does
      SOLO_LORAS: ["ferasalm:penis@1", "ferasalm:pussyd@1"],
      // a LoRA's trigger words, put first in the prompt whenever that LoRA is used
      LORA_WORDS: {
        "ferasalm:instapic@1": "instapic",
        "ferasalm:pussyd@1": "hairy pussy",
        "ferasalm:povdt@1": "POV deepthroat scene",   // its Civitai trigger
      },
      // a camera-flash picture, only when the words ask for one (owner 2026-10-08: "when asked for specifically: camera flash LoRA",
      // Tushy Raw Filter klein 9B, Civitai 2569967 v2887624, ferasalm:tushyraw@1; its author: "DO NOT USE ANY OTHER REALISM STYLE!
      // ... Strength: 1.0"): FLASH_LORAS replace LORAS (the realism LoRAs) and LORA_PREFIX; NUDE_LORAS and ACT_LORAS stay.
      // FLASH_LIGHT replaces the picture's light, FLASH_PHOTO the PHOTO line, FLASH_TRIGGER opens the prompt
      FLASH_WORDS: ["camera flash", "flash on", "with flash", "with the flash", "with a flash", "flash photo", "flash pic", "flash picture", "flash selfie", "use flash", "using flash", "using the flash", "harsh flash", "direct flash", "flash photography"],
      FLASH_LORAS: {},                 // 2026-10-12 (owner: "Drop flash LoRA"): none, so flashAsked is false and a flash is words only
      FLASH_TRIGGER: "the photograph is shot with harsh frontal flash. background is very dark. change the entire lighting of the image into tushy raw style",
      FLASH_LIGHT: "only the phone's harsh direct camera flash, the room behind her falling into darkness",
      FLASH_PHOTO: "Raw, unretouched flash photo: flat frontal light, blown-out highlights on her skin, hard shadows behind her, a very dark background.",
      // the camera, his hands and the act's trigger words, by act. The first entry whose words (comma-separated) are in the
      // picture's words is added in place of POV_MAN ({pov} = POV_MAN); none = POV_MAN. Round 4 (owner: "Make framing for sex acts
      // tighter and POV to avoid anatomical issues and to improve skin texture and detail"; no side view): every act from his
      // eyes, close. Flux 4 Play's triggers (c0wg1rl, r3v3rs3_c0wg1rl) went out with it (2026-10-12: no act LoRA). Doggy has no Flux 4 Play
      // (Step 3 review, 2026-10-11): its d0gg13 drew the man lying down and her torso upright (a reverse cowgirl), her anus hidden in the closed cleft
      ACT_SCENES: {
        "blowjob, blow job, sucking, sucks, suck, deepthroat, deep throat, deepthroating, takes the man in her mouth, the man's cock in her mouth": "First-person view looking down at her: she kneels between the man's legs sucking his average-sized penis, her lips around the shaft, looking up at the camera. {close}",
        "reverse cowgirl": "{pov} She rides the man facing away, her back and round bottom close, his penis inside her vagina: the shaft enters her vulva, her anus above it closed and untouched; she glances back over her shoulder. {close}",
        "riding, rides, ride, cowgirl, sinks down onto the man, lowers herself onto the man": "{pov} She straddles the man lying on his back, riding him, his penis inside her vagina: the shaft enters her vulva at its center, her labia spread around it, seen from below. {close}",
        // owner 2026-10-08: "don't confuse which is anal and which is normal vaginal": vaginal acts name the vagina and vulva
        "missionary": "{pov} She lies on her back with her legs spread, the man kneeling between them, his penis inside her vagina: the shaft enters her vulva at its center, her labia spread around it, looking up at him. {close}",
        // round 5 (owner: "the anus looks like a vagina"): from behind, klein drew a vulva where her anus is 0/14 (POV Doggy Anal at
        // 0.6-1.0, Flux 4 Play, anatomy words); on her back, legs raised, the vulva above and the penis below it 3/3
        // owner 2026-10-08 ("Ensure overall anatomical correctness"): the vulva-for-anus of round 5 came with Unchained; without it, from
        // behind 2/3 (POV Doggy Anal alone 3/3), while on her back POV Doggy Anal fused her front and her spread bottom into one pose
        // Step 6: the anal camera is ANAL_SCENES' now (doggy = this text); its "her ass" here caught vaginal doggy words first
        "doggy, doggystyle, doggy style, on all fours": "{pov} Seen from behind and above, her back and round bottom toward the camera: she is on all fours on the bed, the man fucking her doggy style from behind, his penis inside her vagina: the shaft enters her vulva between her thighs, her anus above it closed and untouched; his hands on her butt, she looks back over her shoulder. {close}",
      },
      // Step 6 (WORKPLAN, 2026-10-11): anal first. When ANAL_WORDS match a sex act, the position comes from ANAL_POSITION_WORDS (first
      // match), else by ANAL_POSITIONS; its camera from ANAL_SCENES ({pov} = POV_MAN) and its LoRAs from ANAL_LORAS (in place of ACT_WORDS
      // matching). Body: missionary the front, the others BODY_BACK
      ANAL_WORDS: "anal, anally, ass fucking, in her ass, in the ass, up her ass, fucks her ass, fucking her ass, fucked her ass, in her anus",
      ANAL_POSITION_WORDS: {
        missionary: "missionary, on her back, legs up, knees to her chest",
        // "on top" only as hers: "he's on top of her" is missionary or prone
        "reverse cowgirl": "reverse cowgirl, riding, rides, cowgirl, on top of him, on top of the man, she's on top, she is on top",
        prone: "prone, lying flat, on her stomach, prone bone",
        doggy: "doggy, doggystyle, doggy style, all fours, from behind, bent over",
      },
      // Step 6 bench (Opus, 2026-10-11, 32 pictures): missionary anal drew right in no setup (Missionary + penis vaginal 3/3, penis only
      // vaginal or none 3/3, POV Doggy Anal 0.8 in her anus 2/2 but her legs gone) → never picked at random; reverse cowgirl had a
      // second head 1/2 → rare. Claude's values
      ANAL_POSITIONS: { doggy: 0.6, missionary: 0, "reverse cowgirl": 0.1, prone: 0.3 },
      ANAL_SCENES: {
        missionary: "{pov} She lies on her back with her knees pulled up to her chest and her legs held wide, her round bottom lifted toward the man kneeling between them; his penis inside her anus, low between her buttocks, and above it her vulva closed and untouched. She looks up at him. {close}",
        "reverse cowgirl": "{pov} She rides the man facing away, her back and round bottom close, his penis inside her anus between her spread buttocks; below it her vulva closed and untouched; she glances back over her shoulder. {close}",
        prone: "{pov} She lies flat on her stomach on the bed, legs together, the man on top of her from behind; his penis inside her anus between her round buttocks; she looks back over her shoulder, her cheek on the pillow. {close}",
        doggy: "{pov} She is on all fours on the bed, seen from behind and above: the man is fucking her in the ass doggy style, his penis inside her anus; below it, between her thighs, her vulva closed and untouched. His hands on her butt, she looks back over her shoulder. {close}",
      },
      // Step 6 bench: only POV Doggy Anal (trained on anal) put the penis in her anus. Flux 4 Play and Missionary (trained on vaginal
      // sex) drew it in her vulva, her anus above it (0/3 each, doggy with Flux 4 Play 0/3); General Penis alone drew no penetration
      // (0/9). POV Doggy Anal: doggy alone at 1.0 5/5; 0.8 with the realism LoRAs prone 5/5 (flat 4/5), reverse cowgirl 2/2 (a
      // second head 1/2), missionary 2/2 (legs gone 2/2: no frontal anal LoRA yet)
      // 2026-10-12 (owner: "remove the use of doggy anal LoRA unless specifically asked for doggy AND anal"), then 2026-10-13 (owner, after
      // the Step A bench: her face changed 4/4 with it): "NSFW Unlocked only". A position here loads only when the words name it
      // (doggy was { "ferasalm:povanal@1": 1 })
      ANAL_LORAS: {},
      ANAL_ALONE: [],                  // positions whose ANAL_LORAS draw alone; none since 2026-10-12 (Lenovo on every picture)
      TIMEOUT_MS: 60000,
      // round 4: the room on Runware, short (the room's LOOK words drowned the act and the LoRAs); {n} = its image number
      ROOM: "Behind her, her room as in image {n}, in this picture's own light.",
      ROOM_TEXT: "",
      // sex acts: never drawn on Runware while SEX_ACTS is off; with it on, they add NUDE_LORAS and POV_MAN
      NOT_DRAWN: ["sex", "fuck", "fucks", "fucked", "fucking", "masturbates", "masturbating", "orgasm", "cum", "penis", "cock", "dick", "blowjob", "blow job", "sucking", "sucks", "handjob", "riding", "rides", "doggy", "doggystyle", "missionary", "cowgirl", "penetration", "penetrated", "fingering", "fingers herself", "oral", "deepthroat", "deep throat", "deepthroating", "anal", "creampie", "cumshot", "titfuck", "69", "thrusts", "thrusting", "inside her", "sinks down onto the man", "lowers herself onto the man", "takes the man in her mouth", "reverse cowgirl", "on all fours", "doggy style"],
      SEX_ACTS: true,                  // owner 2026-10-06: a switch; on since 2026-10-08 (owner: "lift all restrictions" to test the
                                       // LoRA with sex acts). On = NOT_DRAWN is ignored on Runware (sex acts sent as he wrote
                                       // them). The under-18 flag and "never OOC" still stop every picture.
      // the man in a sex-act picture (owner 2026-10-08: "POV, faceless man"), added when a NOT_DRAWN word matches with SEX_ACTS on
      // round 4: short (see REFERENCE)
      POV_MAN: "First-person view from the man's own eyes: never his face or head; only his hands, belly, hips and thighs may show. One man, his penis average-sized and realistic.",
      // added when the picture is neither nude nor a sex act: the nude body picture (BODY "v2") leaked nudity into 3/3
      // pictures that named no clothes (owner's refresh bench, 2026-10-08)
      // round 4: short (see REFERENCE)
      DRESSED: "She is fully dressed as described.",
      // Step 3 review (2026-10-11): no "looking up at the camera through her lashes": it put the camera above her, so a standing
      // full-body picture drew her head too large for her body (nude mirror, seed 101; with a level gaze the same seed was in scale)
      // Step B (2026-10-13): no "looking down at something in her hands" (it drew a second phone in her other hand, Step A bench), and
      // MOODS.EVERYDAY lost the eye roll and the "really?" look (scowls the owner didn't ask for); no "looking past the camera at
      // someone" either (someone else in the picture, beside his POV line); ACT's "an intense, hungry stare" drew a worried frown (Step B
      // bench, D1 485 seed 202, 2/2) → "a hungry, heavy-lidded look"
      GAZES: {
        EVERYDAY: ["looking straight into the lens", "looking off to the side, out of the frame", "her eyes closed", "her head turned in three-quarter profile, eyes to the lens"],
        HEATED: ["looking straight into the lens", "looking down at her own body", "looking away toward the window", "her eyes closed, head tilted back"],
        ACT: ["looking straight into the man's eyes, into the lens", "her eyes closed", "her eyes half-open and unfocused", "looking down at the man's body"],
      },
      // a sex act with one of these: MOODS.ORAL (eyes and brows only; no gaze list: the blowjob scene names it)
      ORAL_WORDS: ["blowjob", "blow job", "sucking", "sucks", "suck", "deepthroat", "deep throat", "deepthroating", "takes the man in her mouth", "oral"],
      // words that already name her face: then no MOODS/GAZES pick
      FACE_WORDS: ["smile", "smiles", "smiling", "smirk", "smirking", "grin", "grinning", "laugh", "laughs", "laughing", "pout", "pouting", "frown", "wink", "winks", "winking", "moan", "moaning", "expression", "looking", "looks at", "looks up", "looks down", "gaze", "gazing", "glance", "glances", "glancing", "stare", "stares", "staring", "eyes closed", "eyes on", "her eyes", "lips parted", "parted lips", "bites her lip", "biting her lip", "biting her lower lip", "into the camera", "into the lens", "toward the lens",
        // Step B: /look 484 said "her brow furrowed" and got "a playful grin" too
        "brow", "furrowed", "frowning", "worried", "eyes fixed"],
      // round 4 (owner: "Think of lens, framing, lighting, style. The pictures need to look real and natural, not rendered ... Any
      // low-quality artifacts may only be attributed to iPhone photography artifacts"): on every Runware picture; ACT_PHOTO on sex acts
      // round 4: short (see REFERENCE)
      PHOTO: "Unretouched iPhone photo: natural skin texture with pores and fine hair, real light from one side with soft falloff, true color; only the phone's own flaws (grain in dim light, slight motion blur).",
      // round 4: short (see REFERENCE)
      ACT_PHOTO: "Close framing: their bodies fill the frame.",
      // added when the picture's words say she's naked or topless (NUDE_WORDS)
      NUDE_WORDS: ["nude", "naked", "topless", "bottomless", "bare breasts", "bare chest", "nothing on", "wearing nothing", "undressed", "nipple", "nipples", "pussy", "vagina", "pubic", "bush", "spread legs", "legs spread"],
      // round 4: short (see REFERENCE)
      // Step 5 (2026-10-11): NAKED in three parts, joined the same as before (NAKED NAKED_BREASTS NAKED_BUSH); a crotch close-up
      // (CLOSE_WORDS) leaves NAKED_BREASTS out, PARTIAL_TOP adds NAKED_BUSH, PARTIAL_BOTTOM adds NAKED_BREASTS (`nakedLine`)
      NAKED: "She is completely naked, no clothing of any kind:",
      NAKED_BREASTS: "natural breasts with soft brown areolas,",
      NAKED_BUSH: "a natural dark bush, a real vulva when in view.", // as the owner's nude front (second 2026-10-15 set),
      NAKED_BACK: "She is completely naked, seen from behind.", // acts from behind (BACK_WORDS)
      // nude or a sex act with clothes named (owner, round 7: "I can't seem to make her partially nude ... asking for a bra and covered
      // breasts, the bare breasts were always there"): in place of NAKED, and image 1 is BODY_PARTIAL ("clothed", "nude" or "none")
      PARTIAL: "She is only partly naked: the clothes named stay on, in place, and cover what they cover (a bra or top keeps her breasts fully covered, no nipples showing); only the rest of her is bare.",
      // Step 5: partly naked = nude or a sex act + WEARING_WORDS or these ("covered breasts", "crop top", "sports bra" named no clothes,
      // so the breasts were drawn bare). "covered" only with her breasts or chest ("covered in sweat" is not clothing); "on top" and
      // "top of" are taken out before the check (riding "on top" is not a top)
      PARTIAL_WORDS: ["top", "crop top", "sports bra", "covered breasts", "breasts covered", "covered chest", "chest covered", "covered up", "shirt on", "top on", "bra on", "half-dressed", "half dressed"],
      // what stays on: only a top (TOP_WORDS) = PARTIAL_TOP, only a bottom (BOTTOM_WORDS) = PARTIAL_BOTTOM, both or neither = PARTIAL;
      // "topless" (or "bottomless") in the words beats a top (or bottom) word
      TOP_WORDS: ["bra", "bralette", "sports bra", "top", "crop top", "tank top", "camisole", "t-shirt", "tee", "shirt", "blouse", "sweater", "hoodie", "sweatshirt", "cardigan", "corset", "turtleneck", "covered breasts", "breasts covered", "covered chest", "chest covered"],
      BOTTOM_WORDS: ["panties", "underwear", "thong", "briefs", "bottoms", "jeans", "leggings", "sweatpants", "joggers", "pants", "trousers", "shorts", "skirt"],
      // a top and a bottom in one piece: named with no BOTTOM_WORDS, no DRESSED_BOTTOM line (Task C)
      ONE_PIECE_WORDS: ["dress", "jumpsuit", "romper", "robe", "nightgown", "bodysuit", "overalls", "onesie", "long coat"],
      // an outfit that shows her legs on purpose (a long tee to mid-thigh, his shirt and bare legs): no DRESSED_BOTTOM line (fix round review, 2026-10-11)
      BARE_LEGS_WORDS: ["bare legs", "legs bare", "bare-legged", "mid-thigh"],
      PARTIAL_TOP: "She is naked only from the waist down: her top stays on and fully covers her breasts, no nipples or underboob showing.",
      PARTIAL_BOTTOM: "She is topless: only the clothes described below her waist stay on; her breasts are bare.",
      // Step 5: a crotch close-up (nude, not a sex act): CROTCH_FRAMING, no NAKED_BREASTS, no place picture. A bare "between her legs"
      // is left out ("her hand between her legs", "he kneels between her legs" are no close-up)
      CLOSE_WORDS: ["close-up of her pussy", "close up of her pussy", "pussy close-up", "pussy close up", "close-up between her legs", "close up between her legs", "her pussy up close", "zoomed in on her pussy", "spread pussy", "pussy shot", "crotch shot"],
      CROTCH_FRAMING: "Close-up from her navel to her upper thighs; her breasts and face are out of the frame.",
      // a crotch close-up's shape (a SIZES key; "" = WIDTH x HEIGHT) and her face picture (false: no face or body picture, klein from
      // REFERENCE_CLOSE alone). Step 5 bench (Opus): at 9:16 with her face every close-up ran from her lips down (12/12, with or without
      // a body picture); 9:16 without the face kept the chin 4/4, 1:1 with it the lips or chin 2/4; 1:1 without it 0/4, framed from the
      // chest down, the vulva largest. Never navel-to-thighs exactly (0/16)
      CLOSE_SHAPE: "1:1",
      CLOSE_FACE: false,
      // Step 5: partly naked pictures leave out these LoRAs (Unchained XXX was trained on full nudes) and take these weights
      // (PussyDiffusion; 0 = left out)
      PARTIAL_LORAS_OFF: [],           // was Unchained XXX (out 2026-10-12); NSFW Unlocked stays on partly naked pictures
      PARTIAL_WEIGHTS: { "ferasalm:pussyd@1": 0.6 },
      // 2026-10-15 (owner: retire the lace-bra body for acts): "nude": the named top is drawn (2/2); "clothed" drew image 1's bra in its place (2/2)
      BODY_PARTIAL: "nude",
    },
    // Never drawn: a description or scene sentence with one of these (whole words or phrases, any case)
    // Cloudflare's prompt filter (3030) refused every wording with these words (face runs 37151684663, 37152577208,
    // 2026-10-03; "top and bottoms" passed but drew pajamas, "cheeky bottoms" was refused), so her words are drawn
    // with the replacement: her color and fabric as a bodysuit or string bikini, which got through. "" drops the word.
    // Lingerie (owner 2026-10-04: "Let's keep using nanobanana and klein"): her boudoir selfies go to Nano Banana on
    // OpenRouter as text only (with her face attached Google refused 11/11; text only it drew 7/7 the same woman, whose
    // face is now her reference). Real lingerie words, no FILTER_WORDS. Since 2026-10-05 klein tries them first
    // (KLEIN_FIRST) and Nano Banana draws them when klein refuses; klein's own wardrobe is the last resort.
    LINGERIE: {
      ENABLED: false,                  // owner 2026-10-06: Nano Banana removed (Runware draws lingerie); the Cloudflare route, past
                                       // Runware's cap, draws her boudoir pictures with klein's filter-safe words
      // klein (her face) tries first in KLEIN_WARDROBE, words that drew 4/12 as asked and none tamer (round 2, run
      // 37266040257); Nano Banana when klein refuses, and straight away when the picture is spicier (owner 2026-10-05:
      // "Let klein try first unless it's more explicit or user asks for two pieces or a \"spicier\" picture")
      KLEIN_FIRST: true,
      // owner 2026-10-05: "She is not sending lingerie pics ... even when I ask": klein's picture is looked at (VISION.MODEL,
      // CHECK_PROMPT); when what it sees has no WORDS (klein drew her tamer) Nano Banana draws it, klein's picture the fallback
      CHECK: true,
      CHECK_PROMPT: "What is the woman in this picture wearing? Answer in one short line that names each piece of clothing, nothing else.",
      // what counts as lingerie: in what the check sees, in what she wears in a scene, in her words
      WORDS: "\\b(?:lingerie|bras?|bralette|panties|panty|thongs?|g-?strings?|briefs|underwear|bodysuit|teddy|babydoll|corset|bustier|garters?|stockings|negligee|chemise|nightie|(?:lace|satin|silk|mesh)\\s+(?:top|set|bottoms|one-piece|slip|cami|camisole|robe))\\b",
      // in person: a moment in lingerie (WORDS in what she wears, or his ask) goes the same way (klein, checked, then
      // Nano Banana; spicier asks straight to Nano Banana). Before, klein refused the real words and nothing came
      SCENES: true,
      // straight to Nano Banana with SPICY_PROMPT: two pieces, "spicier", from behind (his ask or her words), or explicit words
      SPICY_PATTERN: "\\b(?:bras?|bralette|panties|panty|thongs?|g-?strings?|briefs|underwear|two[- ]piece|matching set|spic(?:y|ier|iest)|sexier|sexiest|hotter|naughtier|dirtier|more revealing|show (?:me )?more|less clothes|fewer clothes|topless|nothing but|from behind|behind you|belfie|your (?:ass|butt|booty|bum)|her (?:ass|butt|booty|bum)|bare back)\\b",
      // Nano Banana's prompt for those (owner's JSON style, 2026-10-05, with her description); {slots} are filled by the code
      SPICY_PROMPT: "{\"subject\": {\"descriptor\": \"adult woman\", \"age\": 29, \"ethnicity\": \"Armenian-Lebanese\", \"skin\": \"wheatish skin\", \"face\": \"soft rounded face\", \"brows\": \"thick dark arched brows\", \"eyes\": \"almond-shaped hazel-green eyes\", \"lips\": \"full lips with a soft natural tint\", \"hair\": \"long jet-black wavy hair often piled up in a messy bun, sometimes with wispy bangs\"}, \"body\": {\"frame\": \"average figure, about 165 cm and 65 kg, not slim and not heavy, soft feminine curves\", \"shape\": \"narrow shoulders, a full bust, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, soft feminine curves, thick arms, thick thighs, voluptuous\"}, \"wardrobe\": {\"garment\": \"{garment}\"}, \"pose\": \"{pose}\", \"expression\": \"{expression}\", \"mood\": \"confident and self-possessed, teasing, with a magnetic, unhurried presence\", \"environment\": {\"setting\": \"{setting}\"}, \"lighting\": {\"key\": \"{light}\"}, \"camera\": {\"body\": \"modern flagship smartphone\", \"lens\": \"48mm-equivalent 2x crop, computational portrait blur\"}, \"composition\": {\"aspect_ratio\": \"9:16\", \"orientation\": \"tall vertical portrait\", \"capture\": \"mirror selfie, an iPhone held in her hand and visible in the reflection\", \"framing\": \"vertical mid-thigh-up framing\", \"angle\": \"eye-level three-quarter perspective\"}}",
      SPICY_POSES: [
        "standing from behind, weight on one leg, hip shifted, glancing back over her shoulder at the mirror",
        "standing facing the mirror, one hand in her hair, hip turned",
        "kneeling on the bed facing the mirror, back slightly arched",
        "standing three-quarter to the mirror, one hand on her hip, looking back at her reflection",
      ],
      MODEL: "google/gemini-2.5-flash-image", // Nano Banana
      TIERS: ["boudoir"],              // picture tiers that go to it
      ASPECT: "9:16",
      DAILY_USD: 0.5,                  // its own money cap a day (OpenRouter), about 12 pictures
      USD_PER_PICTURE: 0.039,          // what one costs (image bench 2026-10-04)
      TIMEOUT_MS: 60000,
    },
    FILTER_WORDS: { bra: "bodysuit", bras: "bodysuit", bralette: "bodysuit", panties: "", panty: "", briefs: "", thong: "", "g-string": "string", underwear: "bodysuit", lingerie: "lace bodysuit" },
    NOT_DRAWN: ["through the thin", "through her thin", "through the silk", "nude", "nudes", "naked", "topless", "bottomless", "nipple", "nipples", "areola", "areolas", "genitals", "genital", "pussy", "vagina", "penis", "cock", "dick", "sheer", "see-through", "see through", "transparent", "sex", "fuck", "fucks", "fucked", "fucking", "masturbates", "masturbating", "orgasm", "cum", "undressed", "nothing on", "wearing nothing"],
    MIN_SCENE_WORDS: 8,                // a scene picture needs at least this many words about her
    // He says he's under 18: no pictures from then on (stored with his settings)
    MINOR_PATTERN: "\\b(?:i'?m|i am|im)\\s+(?:only\\s+|just\\s+)?(?:1[0-7]|thirteen|fourteen|fifteen|sixteen|seventeen)\\b(?!\\s*(?:min|mins|minutes|hours|hrs|secs|seconds|%|km|miles|percent|days|weeks))|\\bunder\\s*18\\b|\\b(?:1[0-7]|thirteen|fourteen|fifteen|sixteen|seventeen)\\s*(?:yo|y\\/o|y\\.o\\.?|years?\\s+old|year-old)\\b|\\b(?:in|at)\\s+(?:high\\s+school|middle\\s+school|(?:7|8|9|10|11|12)(?:th)?\\s+grade|grade\\s+(?:7|8|9|10|11|12))\\b|\\bi'?m\\s+a\\s+(?:minor|freshman in high school|sophomore in high school)\\b",

    // The shot catalog: type = camera + framing. Filled in by the code: {selfie} {mirror} {pov} (the phone
    // rules below), {angle} {expression} {wearing} {where} {light}, and {a|b|c} (one is picked; the one her
    // words mention, if any). {wearing} is what she wrote in [selfie: ...] when she wrote something.
    // No bathroom in the body-length mirror shots: its mirror is a small round one over the sink, and all 3 drawn
    // there broke (her body half in the glass, a second face, clothes ignored; face runs, 2026-10-03)
    SHOTS: {
      close: "{selfie} Close-up of her face and shoulders, {angle}, {expression}, {wearing}{where}, {light}.",
      selfie: "{selfie} Chest-up, {angle}, {expression}, {wearing}{where}, {light}.",
      mirror: "{mirror} Full-body reflection in a mirror in {@bedroom|@hallway}, the room behind her, {expression}, {wearing}, a little flash glare on the glass, {light}.",
      cozy: "{selfie} Chest-up, {angle}, curled up {on the sofa in @living, wool socks, knees pulled up|under a blanket on the sofa in @living|in bed against the pillows in @bedroom}, {expression}, {wearing}, {light}.",
      detail: "{pov} Close-up of {her hand with thin gold rings around a coffee cup in @kitchen|her bare feet up on the railing of @porch|her hand with a yellow highlighter on a stack of receipts by a printing calculator in @living}, her face out of frame, {wearing}, {light}.",
      golden: "{selfie} Chest-up on @porch at golden hour, warm low sun on her face, maple trees and rooftops behind her, {angle}, {expression}, {wearing}.",
      "mirror-back": "{mirror} Back view: she stands with her back to a mirror in {@bedroom|@hallway} and twists to look over her shoulder at her phone; the reflection shows her back, 3/4 body, {expression}, {wearing}, {light}.",
      neckline: "{selfie} Taken from above, chest-up, her collarbones and neckline in the frame, {expression}, {wearing}{where}, {light}.",
      legs: "{selfie} Taken from above while she sits {on the sofa in @living|on the bed in @bedroom|on a chair on @porch}, her legs crossed and in the frame, {expression}, {wearing}, {light}.",
      waist: "{mirror} 3/4-body reflection in a mirror in @bedroom, one hand on her waist, her hip turned toward the mirror, {expression}, {wearing}, {light}.",
      // owner 2026-10-08: "more poses"
      "belly-down": "{selfie} Taken from above while she lies on her stomach {on the bed in @bedroom|on the sofa in @living}, propped on her elbows, her feet up and crossed behind her, {expression}, {wearing}, {light}.",
      "overhead": "{selfie} Taken from straight above while she lies on her back in bed in @bedroom, her hair spread over the pillow, {expression}, {wearing}, {light}.",
      "floor-sit": "{selfie} Sitting on the floor of @living with her back against the sofa, knees pulled up, a mug beside her, {angle}, {expression}, {wearing}, {light}.",
      "counter-sit": "{selfie} Sitting up on the counter in @kitchen, legs dangling, leaning back on one hand, {angle}, {expression}, {wearing}, {light}.",
      "window-lean": "{selfie} Leaning on the window frame {in @bedroom|in @living}, half turned toward the glass, {angle}, {expression}, {wearing}, {light}.",
      "stretch-mirror": "{mirror} Full-body reflection in a mirror in {@bedroom|@hallway}, stretching one arm up over her head, her top riding up a little, {expression}, {wearing}, {light}.",
      "kneel-mirror": "{mirror} Reflection in the tall mirror in @bedroom: she kneels on the bed, sitting back on her heels, back arched a little, {expression}, {wearing}, {light}.",
    },
    // The phone rules (owner): selfies never show the phone or her hand; mirror selfies always show an iPhone
    SELFIE_PHONE: "Seen straight from her phone's front camera at arm's length, so the phone itself is never in the picture; her hands are out of the frame.",
    MIRROR_PHONE: "Mirror selfie: she holds an iPhone (camera lenses visible) at chest height, visible in the mirror, her face visible.",
    POV_PHONE: "First-person photo through her own eyes; the phone is the camera, never in the picture.",
    // Which shots each tier uses
    TIERS: {
      EVERYDAY: ["close", "selfie", "mirror", "cozy", "detail", "golden", "floor-sit", "counter-sit", "window-lean"],
      FLIRTY: ["mirror-back", "neckline", "legs", "waist", "belly-down", "stretch-mirror", "window-lean"],
      BOUDOIR: ["selfie", "mirror", "neckline", "waist", "cozy", "belly-down", "overhead", "kneel-mirror"], // refused by the filter (3030): legs twice (2026-10-02), mirror-back 4/4 (2026-10-03)
      // Step 2 (2026-10-11): her own nudes, only at /nsfw Nude or On and on Runware (Cloudflare draws nothing nude)
      NUDE: ["selfie", "mirror", "mirror-back", "waist", "belly-down", "overhead", "kneel-mirror", "cozy"],
    },
    // How likely each tier is when the code picks, by how hot the chat is (HEAT_WORDS, late hours). nude: Step 2, owner's
    // "about 1 in 3 when hot, a few when warm, never when calm" (2026-10-11); 0 at /nsfw Off (pickTier)
    TIER_WEIGHTS: {
      CALM: { everyday: 0.85, flirty: 0.13, boudoir: 0.02, nude: 0 },
      WARM: { everyday: 0.48, flirty: 0.36, boudoir: 0.11, nude: 0.05 },
      HOT: { everyday: 0.1, flirty: 0.27, boudoir: 0.3, nude: 0.33 },
    },
    HEAT_MESSAGES: 6,                  // how many recent messages (his and hers) are read for HEAT_WORDS
    HEAT_HOT: 4,                       // this many HEAT_WORDS = hot (1 or more = warm)
    LATE_FROM_HOUR: 22,                // late at night (her time) the chat counts one step hotter
    LATE_TO_HOUR: 3,
    // Told to her with the picture's shot: {hint} in FORMAT, FORMAT_ASKED and REMINDER
    TIER_HINTS: { everyday: "", flirty: " Make it a little flirty.", boudoir: " You're in lingerie, satin or swimwear.", nude: " You're naked or topless in it: say plainly what's bare." },
    // Words in his ask or her [selfie: ...] that name a shot (the longest match counts)
    SHOT_WORDS: { "close-up": "close", "close up": "close", face: "close", "mirror selfie": "mirror", mirror: "mirror", "full body": "mirror", outfit: "mirror", fit: "mirror", ootd: "mirror", belfie: "mirror-back", booty: "mirror-back", butt: "mirror-back", ass: "mirror-back", "from behind": "mirror-back", "over the shoulder": "mirror-back", cleavage: "neckline", neckline: "neckline", chest: "neckline", legs: "legs", thighs: "legs", waist: "waist", curves: "waist", cozy: "cozy", couch: "cozy", "lying down": "belly-down", "on your stomach": "belly-down", "on my stomach": "belly-down", "on the floor": "floor-sit", "on the counter": "counter-sit", stretching: "stretch-mirror", kneeling: "kneel-mirror", "golden hour": "golden", sunset: "golden", detail: "detail" },
    SHOT_HOURS: { golden: "15-19" },   // shots only picked by the code in these hours (her time)
    // The slots, picked by the code. ANGLES only go where a shot has {angle}; ANGLE_WEIGHTS: how often each
    ANGLES: { high: "camera held a little above her eyes, tilted down", eye: "camera at eye level", low: "camera a little below her chin, tilted up", over: "shot over her shoulder as she glances back at the camera" },
    ANGLE_WEIGHTS: { high: 0.45, eye: 0.35, low: 0.1, over: 0.1 },
    // Light by her time of day (TIMES: hours, her time)
    TIMES: { morning: "5-11", afternoon: "11-17", evening: "17-21", night: "21-5" },
    // owner 2026-10-08: "more lighting settings (golden hour, blue hour, dim candle soft lighting ...)"
    LIGHT: {
      MORNING: ["soft morning daylight", "bright morning sun through the window", "low golden early-morning sun through the window, long warm shadows", "soft gray overcast daylight from the window"],
      AFTERNOON: ["bright afternoon daylight", "soft window light", "dappled sunlight through the leaves outside the window", "soft gray overcast daylight from the window"],
      EVENING: ["warm lamp light", "the last of the evening light", "golden hour: low, warm orange sun across her face, long soft shadows", "blue hour: cool blue dusk light from the window, one warm lamp on"],
      NIGHT: ["warm lamp light in a dark room", "dim light from a bedside lamp", "dim, soft candlelight from a few candles, warm flickering glow, deep soft shadows", "the cool glow of a laptop screen and string lights in a dark room"],
    },
    // words that already name the light (his /pic words, her [selfie: ...] or scene): then no LIGHT pick
    LIGHT_WORDS: ["golden hour", "blue hour", "sunset", "sunrise", "candle", "candles", "candlelight", "candlelit", "moonlight", "neon", "string lights", "lamp light", "lamplight", "daylight", "sunlight", "in the dark", "flash",
      // Step B (2026-10-13): /look 483 said "lit only by a warm bedside lamp" and got "Lit by bright afternoon daylight" too
      "lamp", "lamps", "lamplit", "lit by", "lit only", "glow", "dimly lit", "dim light", "overcast", "sunny", "bright sun"],
    HAIR_CHANCE: 1,
    RECENT_SHOTS: 2, // {list}
    SIMILAR: 0.6,                      // word overlap with a recent picture that counts as the same picture
    REMEMBER: 8,                       // how many recent picture descriptions she's reminded of
    STORED: "[selfie: {what}]", // sent when the picture was her whole reply and it failed
    FACE_DRAFTS: 3,                    // how many faces /face draws
  },

  /* ---------------- The prompt studio (Step 7, docs/WORKPLAN.md, 2026-10-11): /studio, a private page on this Worker ------
   * DAILY_USD: the studio's own Runware money a day (not RUNWARE.DAILY_USD). LINK_DAYS: how long the signed link and its
   * cookie last. PAGE_ROWS: log rows a page. RESULTS_MAX: pictures in one draw. IMG_DAYS: how long a studio picture is kept.
   */
  STUDIO: {
    DAILY_USD: 1,
    LINK_DAYS: 30,
    PAGE_ROWS: 30,
    RESULTS_MAX: 4,
    IMG_DAYS: 30,
  },

  /* ---------------- Workers AI budget (Workers Paid since 2026-10-03: the first 10,000 neurons a day are free, ------
   * then $0.011 per 1,000; the day resets 00:00 UTC). Estimated per call and counted in KV ("pics"). DAILY_NEURONS
   * is the money cap: 28,000 = at most 18,000 paid = $0.20 a day. Test runs (face.yml) have their own cap.
   */
  AI_BUDGET: {
    DAILY_NEURONS: 50000,              // stop here: 10,000 free + 40,000 paid ($0.44) at most a day (owner 2026-10-04: "Raise the daily cap")
    PICTURE_SHARE: 0.6,                // pictures stop at this share of DAILY_NEURONS (~140 Cloudflare klein 4B pictures a day), so voice notes, hearing and photos keep 20,000
    PICTURE_NEURONS: 115,              // FLUX.2 klein 4B: 4 output tiles (576x1024) ~104 + 5.4 per reference image (face, place); 640x640 measured 91-106 (2026-10-02). Step B's klein 9B was 1,500 (back to 4B, Step C)
    BACKUP_PICTURE_NEURONS: 65,        // FLUX.1 schnell, 640x640, 6 steps (1.56 x 4.8 + 6 x 9.6)
    PHOTO_NEURONS: 60,                 // seeing one of his photos
    HEALTH_NEURONS: 40,                // one /health check (klein 4B again, Step C; 1,450 on Step B's klein 9B)
    HEARING_NEURONS_PER_MIN: 47,
    VOICE_NEURONS_PER_1000_CHARS: 2728, // aura-2: $0.03 per 1,000 characters at $0.011 per 1,000 neurons       // Whisper large v3 turbo: 46.63 neurons per audio minute (Cloudflare's price list)
    // Owner 2026-10-06 (Cloudflare idea 3): every Workers AI call goes through this AI Gateway, which logs its cost,
    // tokens and errors per model (Cloudflare dashboard > AI > AI Gateway). "default" is created on first use; "" = off
    GATEWAY: "default",
    OUT_RETRY_MS: 3600000,             // after "allocation used up", try again this much later (seen 2026-10-03: the block outlived the 00:00 UTC reset)
  },

  /* ---------------- Telegram ---------------- */
  TELEGRAM: {
    CHAT_TYPES: ["private"],           // chats she answers in ("private", "group", "supergroup")
    MAX_MESSAGE_CHARS: 4000,           // Telegram's limit is 4096
    ALLOWED_UPDATES: ["message", "edited_message", "callback_query"], // edits and /auto buttons need the last two (open /setup after changing)
    CLEAN_COMMANDS: true,              // remove /edit, /rewind, /retry and /auto from the chat once done
    DROP_PENDING_UPDATES: true,        // /setup throws away messages that arrived while the bot was down
  },

  /* ---------------- Limits ---------------- */
  LIMITS: {
    HTTP_TIMEOUT_MS: 20000,            // ElevenLabs and Telegram file downloads
    SUBREQUEST_LIMIT: 10000,           // Workers Paid: 10,000 subrequests per invocation (Cloudflare docs, 2026-02-11); the free plan allows 50
    SUBREQUEST_RESERVE: 6,             // kept free for the actual messages
    SEEN_KEEP: 200,                    // how many recent Telegram update IDs to remember
  },
};
