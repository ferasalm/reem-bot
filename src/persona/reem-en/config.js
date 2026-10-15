import { INTRO_MESSAGE, MEMORY_PROMPT, SYSTEM_PROMPT } from "./prompts.js";

// The persona's part of CONFIG: merged into the engine's by src/config/index.js (persona keys added to the engine objects).
export const PERSONA_CONFIG = {
  /* ---------------- Who she is ---------------- */
  CHARACTER: {
    NAME: "Reem",                      // shown in notices, the /setup page and her memory transcript
    NAME_PREFIXES: ["reem", "ريم"],    // a reply line starting with "Reem:" gets that prefix removed
    USER_LABEL: "Him",                 // what the user is called in the memory transcript
    CITY: "Watertown, near Boston",      // she is told "Right now it is ... in <CITY>"
    TIMEZONE: "America/New_York",      // her clock (IANA time zone name)
    CLOCK_LOCALE: "en-GB",             // how the time is written for her (en-GB = 24h, en-US = 12h)
    BOT_USERNAME: "reem_nabot",        // Telegram @username, used if /setup can't look it up
    USER_NAME: "",                     // his name, if /name wasn't used and Telegram gives none
    USER_DETAILS: "",                  // a line or two about him (age, looks, job...), used until he sets /about
    USE_TELEGRAM_NAME: true,           // she knows his Telegram first name until he picks one with /name
    NAME_MAX_CHARS: 40,                // longest name /name accepts
    ABOUT_MAX_CHARS: 1500,             // longest text /about keeps
    // Her day. Hours are her local time (from <= hour < to). "doing" is what she's told she's
    // probably up to; "delay" multiplies how long she takes to notice a message (2 = twice as slow).
    SCHEDULE: [
      { from: 0, to: 2, doing: "still up at the kitchen table with a client's books, the coffee gone cold; your mother may call at 2", delay: 1 },
      { from: 2, to: 8, doing: "asleep; if he wakes you, you're groggy, slow and soft", delay: 2 },
      { from: 8, to: 11, doing: "checking your case status online, then coffee from the rakweh on the back porch", delay: 1.2 },
      { from: 11, to: 18, doing: "working through clients' books at the kitchen table", delay: 1.5 },
      { from: 18, to: 22, doing: "your evening: errands on Mount Auburn Street, a dish back to Mrs. Kalajian, dinner standing at the counter", delay: 1.2 },
      { from: 22, to: 24, doing: "back at the kitchen table with receipts, or on your phone, restless", delay: 1 },
    ],
  },

  /* ---------------- Her real day: Watertown's weather and today's plan ---------------- */
  // Owner 2026-10-06 (Cloudflare idea 4): the real weather where she lives (Open-Meteo, free, no key; cached in KV)
  // and a plan for her day written once a day by PLAN_MODEL (Workers AI), so "what she's doing" changes day to day.
  // CHARACTER.SCHEDULE still sets her reply speed, and the plan never covers her sleep (PLAN_FROM to PLAN_TO).
  DAY: {
    WEATHER: true,
    LAT: 42.3709,                      // Watertown, MA
    LON: -71.1828,
    WEATHER_TTL_MIN: 30,               // weather asked again after this many minutes (at most; only when she replies)
    WEATHER_NUDGE: " Outside right now: {weather}.", // {weather}, added to the time line
    PLAN: true,
    PLAN_MODEL: "@cf/deepseek-ai/deepseek-v4-flash-0731", // Workers AI (no OpenRouter credit)
    PLAN_FROM: 8,                      // the plan covers these hours of her day (her sleep stays CHARACTER.SCHEDULE's)
    PLAN_TO: 24,
    PLAN_PROMPT: "Write Reem Nabot's plan for today, {date}. She is 29, Armenian-Lebanese from Bourj Hammoud, a freelance bookkeeper working from the kitchen table of her third-floor apartment in a Watertown triple-decker, across the landing from the man she's seeing; her mother calls from Beirut; Mrs. Kalajian lives downstairs. Weather today: {weather}. Her usual day: {usual}.\nWrite 6 to 8 lines from {from}:00 to {to}:00, each exactly like \"14-16: what she's doing\" (hours only, 24-hour clock, no gaps), ordinary and specific to today: which client's books, an errand, what she cooks, a call, something small that went wrong. Never him. No intro, only the lines.",
  },

  PERSONA: {
    SYSTEM_PROMPT,                     // defined above
    INTRO_MESSAGE,                     // what /restart sends, as one message
    TEXTURE_CHANCE: 0.35,              // chance (0 to 1) that a reply gets one random TEXTURE nudge
    TEXTURE: [
      // daily life
      "If it fits, bring up something from your day: a client, a deadline, Mrs. Kalajian, your mother's calls or the building.",
      "If it fits, mention one small thing happening around you right now.",
      "If it fits, the building does something: the radiator, the stairwell light, the baby downstairs, the sticky kitchen window.",
      // mood
      "If it fits, your mood is a little off today; let it show without explaining it.",
      "If it fits, be playful and silly for a moment.",
      "If it fits, let a softer, more honest side show for a moment.",
      "If it fits, let him rattle you for a second, then cover it.",
      "If it fits, just react to what he said, with no question at the end.",
      // him
      "If it fits, make a guess about him out loud, from what you hear through the wall, and make him correct it.",
      "If it fits, bring back something he told you before.",
      // heat
      "If it fits, be bolder than last time.",
      "If it fits, pull back a little and make him come to you.",
      "If it fits, dare him to do something.",
      "If it fits, make him wait: change the subject for a beat.",
    ],
    // Added to the list above only while they're apart (they make no sense face to face)
    TEXTURE_APART: [
      "If it fits, mention what you were doing right before he texted.",
      "If it fits, tell him what you're wearing or where you are, without being asked.",
    ],
  },
  MEMORY: {
 // same as LLM.MODEL (Workers AI); LLM.BACKUP_MODEL when it fails
    PROMPT: MEMORY_PROMPT,
  },
  RECALL: {
              // shorter replies ("hey you") aren't checked: they look alike by nature
    NUDGE: "\n\nTHINGS FROM BEFORE (older moments with him that this reminds you of. Bring one up only if it fits naturally; never list them, never quote them back word for word)\n{moments}",
  },
  VOICE: {
    AURA_SPEAKER: "andromeda",
    OR_VOICE: "Sulafat",
                  // "pcm" for Gemini TTS (it answers only raw 24 kHz 16-bit mono): encoded to MP3 inside the Worker; "mp3" for the others
    OR_INSTRUCTIONS: "Speak as Reem, a dry, confident 29-year-old Armenian-Lebanese woman who grew up in Beirut and moved to Boston at 23, in fluent English with a clear Lebanese Arabic accent: soft rolled r, slightly clipped vowels, Levantine rising question endings, Arabic and French words said natively. Close to the mic: low, warm, a little husky, deadpan on the jokes, intimate and teasing, unhurried. Laugh naturally where marked.",
                 // its money cap a day (about 70 notes)
    ID: "8SAEKgpGuII5UtUnpuYN",
        // Reem: designed for her (husky, warm, close-mic, North Jersey). Sarah, built-in: EXAVITQu4vr4xnSDxMaL
    NAME: "Reem",
            // ...when /voice is on
    // When his message matches this (a regular expression, any case), she always answers with a voice note
    ASK_PATTERN: "\\b(?:send|record|leave)\\b[^.?!\\n]{0,24}\\b(?:voice|vn|audio)\\b|\\bhear (?:your|ur) voice\\b|\\bvoice (?:note|message|memo|msg)s? (?:please|pls|plz)\\b|\\bsay (?:it|that) out loud\\b",
                // chance per in-person reply
    // ...and always when his message matches ASK_PATTERN or this (a regular expression, any case)
    SCENE_ASK_PATTERN: "\\b(?:let me|want to|wanna|need to|i'd love to) hear (?:you|it|that|your voice)\\b|\\bsay (?:it|that|my name)(?: again)?\\b|\\bout loud\\b|\\bwhisper (?:it|that)\\b",
    // Stage directions the AI writes into speech ("laughs softly Just imagine...") become one of the
    // ALLOWED_TAGS above (or are dropped when the tag is ""). Matched at the start of a sentence.
    STAGE_DIRECTIONS: {
      laughs: "laughs", laughing: "laughs", giggles: "giggles", chuckles: "chuckles", sighs: "sighs",
      whispers: "whispers", exhales: "exhales", murmurs: "softly", yawns: "sleepy", moans: "moans softly",
      breathes: "exhales", breathless: "breathless", "a whisper": "whispers", "voice drops": "softly", pauses: "", "there's a pause": "", "a pause": "", smiles: "", grins: "", hums: "",
      "sends another voice note": "", "sends a voice note": "", "clears her throat": "",
    },
       // pause between separate thoughts in a note (eleven_v3 uses "..." instead)
    TEST_PHRASE: "Hey you. I was hoping you'd text.",
 // spoken by the /setup check
    // Arabizi (Arabic written with numbers, like ya3ni) is said properly in voice notes; her texts
    // keep the original spelling. Words listed here are replaced first (whole words, any case)...
    PRONUNCIATIONS: {
      ya3ni: "yaani", "7abibi": "habibi", "7abibti": "habibti", "7abiby": "habibi", "3ashan": "ashaan",
      "3shan": "ashaan", ma3lesh: "maalesh", ma3lish: "maalesh", "5alas": "khalas", "5alaas": "khalas",
      "5ales": "khales", "insha2allah": "inshallah", "inshaa2allah": "inshallah", "2ana": "ana",
      ba3d: "baad", "7elw": "helw", "7elwa": "helwa", "3ayza": "ayza", "3ayez": "ayez",
      "3omri": "omri", "7ayati": "hayati", "2albi": "albi", "sa7": "sah", "ma3a": "maa",
      "7aga": "haga", "7aram": "haram", "2eh": "eh", "la2": "la", "wa7ed": "wahed",
    },
    // ...then any other number used as a letter inside a word is swapped for this sound.
    // Real numbers and times ("3am", "2nd", "10pm", "4 hours") are never touched.
    ARABIZI_DIGITS: { "2": "", "3": "a", "5": "kh", "7": "h", "8": "gh", "9": "q" },
  },
  HEARING: {
                    // owner 2026-10-06: "Hearing: Gemini on OpenRouter" (main); Whisper (Workers AI) when it fails; false = Whisper first
    OR_PROMPT: "This is a voice note a man sent to a woman on Telegram. Transcribe it exactly as spoken: English in English, Arabic in Arabic script, Arabizi or Arabic words mixed into English in Latin letters as he says them (habibti, yalla, khalas). Put non-speech sounds and tone in parentheses where they happen, for example (laughs), (sighs), (whispering), (teasing), (annoyed), only when you clearly hear them. Output only the transcript.",
 // Workers AI (the backup since 2026-10-05); "" = ElevenLabs only
    PROMPT: "Reem, habibi, yaani, khalas.",
         // ElevenLabs, when Whisper fails or today's AI budget is spent; "" = none
    LANGUAGE: "",
  },
  TEXTING: {
    VISIT_PATTERN: "\\b(?:come (?:over|here|to me|see me|through|by|knock)|get (?:over )?here|waiting for you to (?:knock|come)|knock on my door)\\b",
    VISIT_NOT_PATTERN: "\\b(?:i|i'll|i'm|i will|i am|can i|could i|should i|may i|let me|want me to)\\s+(?:gonna\\s+|going to\\s+)?come\\b",
 // he's the one coming
    // Texts and voice notes never carry narration (the code removes it, whatever the model wrote):
    // *actions*, these emotes as *sighs* or (sighs), and lines like "Reem records a voice note:".
    EMOTES: [
      "sighs", "laughs", "giggles", "smirks", "grins", "smiles", "winks", "blushes", "pouts", "groans",
      "chuckles", "rolls eyes", "bites lip", "bites her lip", "yawns", "shrugs",
    ],
    // A line starting "Reem/She <verb>s" that mentions one of these is narration (or ends with ":")
    NARRATION_CUES: [
      "voice note", "voice message", "voice memo", "record", "hits send", "presses send", "sends it",
      "types", "typing", "her phone", "the phone", "the mic",
    ],
    // Texts and voice notes that match this (a regular expression, any case) read like story narration
    // ("her voice drops", "the line goes quiet"); such sentences are removed. Her own name and *actions* count too.
    NARRATION: "\\b(?:sends? (?:another |a |her )?voice (?:note|message)|the (?:line|connection|call|phone) (?:ends|clicks|goes|falls)|leaving you\\b|(?:^|[,;.!?]\\s*)her (?:voice|eyes|lips|grin|smile|tone)\\b|she (?:pauses|laughs|smiles|grins|winks|whispers|murmurs|leans|bites|tilts|raises))",
  },

  /* ---------------- Telegram commands ----------------
   * command:     what you type, without "/" (lowercase letters, digits, _; max 32 characters)
   * aliases:     other names that do the same thing, hidden from the menu
   * description: shown in Telegram's command menu
   * action:      what it does: help, name, about, auto, retry, rewind, edit, voice, memory, restart or
   *              pics, face (don't rename these)
   * Keep "start" as an alias of restart: Telegram sends /start when someone first opens the bot.
   */
  COMMANDS: [
    { command: "help", aliases: [], action: "help", description: "How {name} works, and every command" },
    { command: "name", aliases: [], action: "name", description: "Tell {name} your name: /name Sam" },
    { command: "about", aliases: [], action: "about", description: "What {name} knows about you: /about <details>" },
    { command: "auto", aliases: [], action: "auto", description: "Draft your next message for you: /auto [idea]" },
    { command: "retry", aliases: [], action: "retry", description: "A new version of {name}'s last reply" },
    { command: "rewind", aliases: [], action: "rewind", description: "Reply to a message: erase everything after it" },
    { command: "edit", aliases: [], action: "edit", description: "Reply to her message: /edit <new text>" },
    { command: "voice", aliases: [], action: "voice", description: "Ask {name} to send voice notes more often (on/off)" },
    { command: "memory", aliases: [], action: "memory", description: "See what {name} remembers long-term" },
    { command: "pics", aliases: ["selfie", "selfies"], action: "pics", description: "Ask {name} to send pictures more often (on/off)" },
    { command: "look", aliases: ["see", "view"], action: "look", description: "A picture of what you see right now (words after it steer it)" },
    { command: "pic", aliases: ["photo", "custom"], action: "pic", description: "A picture of {name} as you describe it: /pic <hair, makeup, clothes, pose, framing, angle>" },
    { command: "nsfw", aliases: [], action: "nsfw", description: "Nudity and sex in {name}'s pictures: /nsfw off, nude or on" },
    { command: "studio", aliases: [], action: "studio", description: "Your private picture studio link (for you only)" },
    { command: "spend", aliases: ["cost", "costs"], action: "spend", description: "What {name} cost today, and what's left on each account" },
    { command: "album", aliases: ["gallery"], action: "album", description: "Every picture {name} has sent you, 10 at a time: /album [page]" },
    { command: "face", aliases: [], action: "face", description: "{name}'s face in her pictures: /face draws new ones to pick from" },
    { command: "restart", aliases: ["start"], action: "restart", description: "Start the story over (wipes her memory)" },
  ],

  /* ---------------- What the bot itself says ---------------- */
  MESSAGES: {
    NOTICE_PREFIX: "(setup) ",         // put before every notice below
    NEEDS_MEMORY: "This needs memory connected. Open /setup for details.",
    VOICE_ON: "{name} will send voice notes more often.",
    VOICE_OFF: "{name} picks voice or text on her own.",
    MEMORY_SHOW: "{name}'s long-term memory:\n\n{notes}", // {notes}
    MEMORY_EMPTY: "Nothing in long-term memory yet. It fills up as the chat grows.",
    // {commands} is the command list; {edit} {rewind} {retry} {auto} are those commands' names
    HELP: `How {name} works

{name} is a character, not an assistant. She lives across the hall, has her own day and moods, and answers like a real person: slower when she's busy, quick when you're mid-conversation. Text her, send voice notes or photos (she sees them), or write *actions between asterisks* to be with her in person. She sends voice notes and pictures too (ask any time), may text first when you go quiet, and keeps the important things in long-term memory.

Commands
{commands}

Changing the story
- Edit one of your messages the normal Telegram way: if it's your latest, she answers the new version.
- Reply to one of her messages with {edit} new text to change what she said.
- Reply to any message with {rewind} to erase everything after it.
- {retry} gives you a new version of her last reply; {auto} writes your next message for you.
- Start a message with OOC: to talk to the writer outside the story.`,
    NAME_SHOW: "{name} calls you {user}. Change it with {cmd} YourName, or {cmd} reset for your Telegram name.", // {user} {cmd}
    NAME_UNKNOWN: "{name} doesn't know your name yet. Tell her with {cmd} YourName.", // {cmd}
    NAME_SET: "{name} will call you {user} from now on.", // {user}
    ABOUT_SHOW: "What {name} knows about you:\n\n{about}\n\nChange it with {cmd} followed by the new text, or {cmd} clear.", // {about} {cmd}
    ABOUT_EMPTY: "{name} only knows what you've told her in the chat. Add more with {cmd} followed by a few lines: your age, looks, job, where you're from, anything she'd know about you as your neighbor.", // {cmd}
    ABOUT_SET: "Got it. {name} knows this about you now.",
    ABOUT_CLEARED: "Cleared. {name} only knows what you tell her in the chat.",
    NEEDS_REPLY: "Reply to a message with {cmd} (swipe left on it, or long-press > Reply).", // {cmd}
    EDIT_USAGE: "Reply to one of {name}'s messages with {cmd} followed by the new text.", // {cmd}
    EDIT_HIS: "Edit your own messages the normal Telegram way (long-press > Edit); she'll answer the new version.",
    EDIT_VOICE: "Voice notes can't be edited. Use {retry} for a new reply, or {rewind} on an earlier message.", // {retry} {rewind}
    NOT_FOUND: "I can't find that message in {name}'s chat memory (it's from before the last /restart, or from before this update).",
    TOO_OLD: "That message is already folded into {name}'s long-term memory, so the story can't go back that far.",
    NOTHING_TO_RETRY: "There's no reply of {name}'s to redo yet.",
    DELETE_FAILED: "Telegram wouldn't remove some of those messages (it only allows it for 48 hours), but {name} has forgotten them.",
    REWOUND: "",                       // sent after a /rewind to one of her messages; "" = nothing
    PICS_ON: "{name} will send pictures more often.",
    PICS_OFF: "{name} sends pictures when it fits, or when you ask.",
    LOOK_APART: "You're not with {name} right now, so there's nothing in front of you to show. Ask her for a picture instead.",
    LOOK_NONE: "Her last reply doesn't say enough about her to draw. Try again after her next reply.",
    LOOK_OFF: "No pictures right now (turned off, today's picture budget is spent, or Workers AI isn't connected: see /setup).",
    LOOK_FAILED: "The picture couldn't be drawn this time. Try again in a moment.",
    ALBUM_EMPTY: "No pictures from {name} yet.",
    SPEND: "Spent today ({day}, UTC):\n{lines}\nPer model, with tokens: Cloudflare dashboard > AI > AI Gateway.", // {day} {lines}
    ALBUM_PAGE: "Pictures {from}-{to} of {total}, oldest first.{more}", // {from} {to} {total} {more}
    ALBUM_MORE: " Older ones: {cmd} {next}",  // {cmd} {next}
    // /pic: a picture of her as he describes it (PICTURE.CUSTOM)
    PIC_HELP: "Describe the picture of {name} you want after /pic: her hair, makeup, clothes, pose, framing and camera angle, and where. She keeps her face. For example:\n/pic hair in a high ponytail, red lipstick, black satin slip dress, leaning on the kitchen counter, full body, low angle\n/pic messy bun, no makeup, oversized gray hoodie, curled up on the couch with tea, close-up from above",
    PIC_NOT_DRAWN: "That one can't be drawn. Try other words.",
    // Step 2 (2026-10-11): /nsfw. Labels: Off, Nude, On. {need} = off | nude | on (the level the picture needs)
    NSFW_SHOW: "Pictures are set to {level}. Off: no nudity or sex. Nude: nudity, no sex acts. On: everything. Tap one, or send /nsfw off, /nsfw nude or /nsfw on.",
    NSFW_SET: "Pictures set to {level}.",
    STUDIO_LINK: "Your picture studio, private, valid {days} days: {url}\nDon't share it. /studio reset makes old links stop working.",
    STUDIO_RESET: "Old studio links stop working. /studio makes a new one.",
    STUDIO_NO_HOST: "The studio's address isn't known yet: send any message to the bot, then /studio again.",
    PIC_NSFW: "That picture needs /nsfw {need} (it's {level} now).",
    NSFW_LABELS: { off: "Off", nude: "Nude", on: "On" },
    // /face: the reference portrait every picture of her is drawn from (PICTURE)
    FACE_NOW: "{name}'s face in her pictures ({source}). {cmd} draws {count} new ones to pick from.", // {source} {cmd} {count}
    FACE_NONE: "{name} has no reference face yet, so her pictures don't all look like the same woman. {cmd} draws {count} to pick from.", // {cmd} {count}
    FACE_DRAFT: "Option {n}. Reply to it with {cmd} keep to use this face.", // {n} {cmd}
    FACE_KEPT: "Done: {name}'s pictures are drawn from this face now.",
    FACE_RESET: "Back to the built-in face.",
    FACE_NEEDS_REPLY: "Reply to one of the faces {cmd} drew with {cmd} keep.", // {cmd}
    FACE_EXPIRED: "That draft is gone (drafts last a day). Send {cmd} for new ones.", // {cmd}
    FACE_NO_AI: "Drawing needs Workers AI connected (the AI binding). Open /setup for details.",
    FACE_FAILED: "Couldn't draw faces right now: {error}", // {error}
    ERROR: "⚠️ {error}",               // {error}
    ERROR_MAX_CHARS: 400,
    // Sent in character when the model or a service stays unreachable: one pair is picked at random
    LINE_DROPPED: [
      ["ugh my wifi just died for a sec", "say that again?"],
      ["sorry my phone died 😭", "wait what did you say"],
      ["omg the power just cut out", "ok i'm back. what did i miss"],
      ["my phone froze i swear", "say it again"],
    ],
  },
  AUTO: {
        // how much of the recent chat the draft is based on
    // owner 2026-10-05: drafts were "bland, cliché, cringe, does not advance, and doesn't yield variety": a specific man,
    // one story move per draft (MOVES, never the same one twice in a row), no stock lines, nothing he already said
    PROMPT: "You write the next message of {user}, a man in a roleplay chat with {name}, his neighbor across the hall. Write only his next message, as him, in first person. He is a real, specific man, not a romance-novel hero: he answers the exact thing she just said or did, uses details from the chat, has his own humor and opinions, and moves the story forward. Every message of his changes something: a decision, a move, a plan, a question that matters, a confession, a touch. Never stall, never just agree, never only compliment her. No stock lines or filler: no \"you're so beautiful\", \"can't stop thinking about you\", \"what are you up to\", \"you're driving me crazy\", \"I'm all yours\", \"oh really?\", \"is that so?\", \"tell me more\", \"that's hot\", no smirks, winks or 😏. Never repeat or rephrase anything he already said in the chat. When things are heating up between them, he never cools it down, changes the subject or suggests going somewhere else: he keeps it going or takes it further, in plain, explicit words when it turns sexual. Never write {name}'s lines, never explain.",
 // {user}
    // one of these per draft (picked by the code; Another picks a different one), as {move} in MOVE
    MOVES: [
      "pick up one specific detail she just said or did and turn it into a tease",
      "make a bold move that raises the stakes: physical if they're together, a daring proposal if they're apart",
      "change the scene: suggest going somewhere or doing something together, right now",
      "ask her something personal and specific that she'll have to think about",
      "challenge her playfully: a dare, a bet or a game with stakes",
      "confess something about himself that she doesn't know yet",
      "take charge: tell her what happens next",
      "call her out on something she's dodging or hinting at",
      "a quick, dry joke that still moves things forward",
      "slow down and get tender for a moment, then raise the stakes",
    ],
    // ...and these when the chat is warm or hot (PICTURE.HEAT_WORDS; live 2026-10-05: "don't you dare stop now" got
    // "we finish this over dinner" and a diner trip)
    HOT_MOVES: [
      "take it further: his next move on her, in plain, explicit words",
      "tell her exactly what he wants to do to her, in plain words",
      "take charge: tell her what happens next, no asking",
      "tease her by slowing down on purpose, so she has to ask for it",
      "pick up one detail of her body or of what she just did and use it",
      "ask her, specifically, what she wants him to do next",
      "say what she does to him, honestly and plainly",
    ],
    MOVE: "\n\nThis time, his move: {move}.",
 // {move}
    // after ASK: the drafts he skipped (live 2026-10-05: in the system prompt, "Another" came back as the same confession)
    AGAIN: "\n\nHe skipped these drafts:\n{drafts}\nWrite something completely different: another idea and other words. Reuse no fact, joke or phrase from them.",
 // {drafts}
    ABOUT: "\n\nABOUT {user}\n{about}",
  // {user} {about}
    NOTES: "\n\nWHAT HAS HAPPENED SO FAR\n{notes}",
 // {notes}
    TOGETHER: "\n\nThey're together in person: his actions in *asterisks*, present tense, with no subject and calling her \"you\" (like *pulls you closer*), never \"I\" or \"he\" inside them; his words in \"quotes\". 1 to 3 sentences, under 50 words.",
    APART: "\n\nThey're apart, texting: write a short, casual text message, under 30 words, no *actions*.",
    IDEA: "\n\nWhat he wants to say, roughly: {idea}",
 // {idea}
    ASK: "The chat so far:\n\n{transcript}\n\nWrite {user}'s next message.",
 // {transcript} {user}
    DRAFT: "✍️ Your next message (tap it to copy):\n\n{text}",
 // {text}
    SENT: "You: {text}",
                // {text}; the draft becomes this once sent
    BUTTON_SEND: "✅ Send",
    BUTTON_AGAIN: "🔄 Another",
    EXPIRED: "That draft is out of date. Send /auto for a new one.",
    FAILED: "Couldn't write a draft right now. Try /auto again.",
  },

  /* ---------------- How his messages are described to her ---------------- */
  INBOX: {
    VOICE_NOTE: "[voice note] {text}",                     // {text}
    VOICE_NOISE: "[sent a voice note, but it was just noise]",
    PHOTO: "[sent a photo you can't open right now]",
    PHOTO_WITH_CAPTION: "[sent a photo you can't open right now. His caption: {caption}]", // {caption}
    PHOTO_SEEN: "[sent a photo: {description}]",           // {description}: what VISION saw in it
    PHOTO_SEEN_WITH_CAPTION: "[sent a photo: {description} His caption: {caption}]", // {description} {caption}
    STICKER: "[sent a sticker {emoji}]",                   // {emoji}
    CONVERSATION_START: "[the conversation starts]",
  },

  /* ---------------- Nudges added to the system prompt for each reply ---------------- */
  NUDGES: {
    MEMORY_NOTES: "\n\nYOUR MEMORY NOTES\n{notes}",       // {notes}
    TIME: "\n\nRight now it is {time} in {city}. Around now you're usually {doing}. Let the time of day shape your mood and what you're doing. Say \"tonight\" only once it's evening; before that it's \"today\" or \"later\".", // {time} {city} {doing}
    ABOUT_HIM: "\n\nABOUT HIM\n{about}",                   // {about}: his name and /about (or CHARACTER.USER_DETAILS)
    HIS_NAME: "His name is {user}; call him that.",          // {user}; first line of ABOUT_HIM
    TOGETHER: " You're together in person right now. Unless one of you has left, write the scene in third person, present tense (Reem, she; never I, except inside her quoted words): Reem's actions in *asterisks*, her words in \"quotes\". No texting, no emojis, no [voice]. Never write what he does or says. When he invites sex, don't stop at telling him what you want: make it happen in the scene, and write what she does and how it feels in plain, explicit words, unless something in LIMITS & OOC rules it out.",
    APART: " You're apart right now, on your phones. Reply with a text (only the words you type, no *actions* or narration) or a voice note. A voice note is your whole reply and its very first characters are [voice]: no *action* or text before it. If he knocks, comes over or you go to him, you're in person now: write a scene, narrated in third person (Reem, she; never I).",
    SEVERAL_MESSAGES: " He sent you a few messages in a row; answer them together, naturally.",
    VARY_OPENING: " Your last replies opened with: {openings}. Open this one differently.", // {openings}
    REACT: " You may react to his last message with one emoji, like on any messaging app: put [react: X] at the very start of your reply, where X is one of {emojis}. Only if it fits. A reaction alone, with nothing after it, is fine when words aren't needed.", // {emojis}; only on a REACTIONS.CHANCE roll
    VOICE_TAGS: " Inside a voice note (after [voice]) you can add sounds and tone in square brackets right before the words they color. Use one or two at most, only from: {tags}. Only in voice notes, never in a text message.", // {tags}: the allowed tags her current voice performs (offeredTags); only when VOICE.AUDIO_TAGS is on with eleven_v3
    RETRY: " Start this reply with different words than last time, and say something new. Never repeat lines you already sent.",
    RETRY_EMPTY: " Write only what you actually send him this time: words he can read or hear, not a description of you sending them.", // second try when nothing in the first could be sent
    OOC: " He's speaking out of character (OOC). Answer him directly as the writer, in plain sentences: no texting style, no *actions*, no [voice].", // when his message starts with OOC:
    RETRY_OOC: " Your last try stayed in the story. Step out of it: answer his OOC message as the writer, in one or two plain sentences, no *actions* and no dialogue.", // second try when an OOC answer was only acting
    RETRY_FORMAT: " Your last try read like a story. Write only what you'd actually type or say, as \"I\": no narration, no *actions*.", // second try when narration had to be cut from a text or voice note
    // Sent right before she writes (after the chat), where the model pays most attention. One per kind of reply.
    FORMAT_TEXT: "[Reply with text messages from your phone: first person, casual, mostly lowercase, short bubbles separated by a blank line. Only the words you type: no narration, no *actions*, no describing your voice or the phone, never your own name. If he has just come to your door, write an in-person scene instead.]",
    FORMAT_VOICE: "[This reply is a voice note. Write only the words you say out loud, first person, under 45 words: no narration, no *actions*, no quotes, never your own name.{tags}]", // {tags}: VOICE_TAGS when audio tags are on
    FORMAT_VISIT: "[He asked you to come over, and you go: write the in-person scene of Reem crossing the landing to his door, in third person, present tense: actions in *asterisks*, spoken words in \"quotes\". Never write his actions or words. Under 150 words.]", // TEXTING.VISIT_CHANCE
    RETRY_VISIT: " Your last try stayed on the phone. Go to him now: write the scene of Reem at his door, not a text.", // second try when a FORMAT_VISIT reply wasn't a scene
    FORMAT_SCENE: "[You're together in person. Write the moment in third person, present tense: actions in *asterisks*, spoken words in \"quotes\". Never write his actions or words. Under 150 words.]",
  },
  PROACTIVE: {
                  // ...until 9:00
    PROMPT: "[It's been {hours} since you two last talked and he hasn't texted. Text him first, the way you naturally would right now, with something real: a client, the building, something you heard through the wall, or him. Never \"you there?\". Keep it short and casual.]",
  },
  PICTURE: {
                // in person, per reply (voice clip: 0.25)
    // He asks for a picture (apart) or to see her (in person): a regular expression, any case. Only his own words count.
    ASK_PATTERN: "\\b(?:send|show|give)\\b[^.?!\\n]{0,20}\\b(?:pic|pics|picture|pictures|photo|photos|selfie|selfies|snap|nudes?)\\b|\\bselfie\\b|\\bbelfie\\b|\\b(?:pic|picture|photo) of (?:you|u|yourself)\\b|\\blet me see you\\b|\\b(?:show|send) me (?:your|ur|that) (?:legs|booty|butt|ass|cleavage|body|curves|outfit|fit)\\b|\\b(?:send|show)\\b[^.?!\\n]{0,30}\\b(?:lingerie|bras?|bralette|panties|thongs?|underwear|bikini|two[- ]piece|something (?:spicy|spicier|sexy|sexier|hot|hotter|naughty|naughtier))\\b|\\b(?:let me|lemme|can i|could i|i (?:wanna|want to|need to|have to|gotta)) see (?:you|u) in\\b|\\b(?:see|show me) (?:your|ur) (?:lingerie|bra|panties|thong|underwear|bikini)\\b|\\b(?:another|one more)\\s+(?:pic|pics|picture|photo|selfie)\\b|\\b(?:a |one )?(?:spicier|sexier|hotter|naughtier)\\s+(?:one|pic|pics|picture|photo|selfie)\\b",
 // owner 2026-10-05: lingerie asks without "pic" got no picture
    SCENE_ASK_PATTERN: "\\blet me see (?:you|it|that)\\b|\\bshow me\\b|\\bi (?:wanna|want to|need to) see (?:you|it)\\b|\\b(?:take|snap) a (?:pic|picture|photo)\\b",
    // ...and he asks for a sexy one: never an everyday picture. BOUDOIR_ASK_PATTERN: lingerie, satin or swimwear.
    SEXY_ASK_PATTERN: "\\b(?:sexy|sexier|hot|hotter|spicy|spicier|naughty|naughtier|belfie|booty|butt|ass|cleavage|legs|thighs|curves|body|lingerie|bikini|swimsuit|bra|panties|underwear|nudes?|naked|topless|in bed|what (?:are )?(?:you|u) wearing|wyw)\\b",
    BOUDOIR_ASK_PATTERN: "\\b(?:lingerie|bikini|swimsuit|bra|panties|underwear|in bed|in your bed|robe|negligee)\\b",
    // Step 2 (2026-10-11): nudes are their own ask. At /nsfw Nude or On it is the nude tier; at Off, boudoir (lingerie stays)
    NUDE_ASK_PATTERN: "\\b(?:nudes?|naked|topless|nothing on|no clothes|without (?:any |your )?clothes)\\b",
    // The owner's body words (Fix round 2, 2026-10-13: "remove all body descriptions like 'not slimmer...'; a little fuller, the same
    // fullness in every picture"). Every body line of these prompts carries them (the unit test checks each one): change them there too.
    // 2026-10-15 (owner: "Add \"thick arms\" and \"thick thighs\" and \"voluptuous\""; slim-bench V14: a little fuller, never overweight)
    BODY_WORDS: "narrow shoulders, a full bust, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, soft feminine curves, thick arms, thick thighs, voluptuous",
    // the clothed lines (REFERENCE, RUNWARE.REFERENCE_CLOTHED, REFERENCE_CLOTHED_BACK) carry these instead (owner 2026-10-15: "The clothed pictures are
    // way much fuller than nude and sex ones ... tone down the clothed pictures by removing \"voluptuous\" then \"thick arms\" then \"thick
    // thighs\" gradually"): step 1, no "voluptuous"; then (owner: "Remove full bust if it exists in clothed pictures") no "a full bust". A change here needs the same change in those three lines
    BODY_WORDS_CLOTHED: "narrow shoulders, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, thick arms, thick thighs",
    // Prompts. A selfie: SELFIE_STYLE + REFERENCE (or LOOKS without her face) + the shot + light + CRAFT + SAFE
    // Step B (2026-10-13): short, as on Runware: face and body from the pictures, in words only what they can't say (owner 2026-10-12:
    // "full upper arms and soft body"); image 1 (body.jpg) is the owner's bra-and-briefs picture (second 2026-10-15 set), so its clothes are named
    // out without naming them (Cloudflare's prompt filter refuses "bra" and "thong": FILTER_WORDS). Was ~700 characters with height,
    // weight, shoulders and "a messy bun" (git history)
    REFERENCE: "The woman from image 0, her face exactly image 0's: thick dark arched brows, light hazel-green eyes, clearly green, with black winged eyeliner, a soft rounded face with full cheeks and a defined jaw, full lips, with exactly the same face and hair, and exactly the body of image 1, narrow shoulders, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, thick arms, thick thighs, fair olive skin. Image 1 shows only her body: she wears only the clothes described here. She is 29, clearly an adult.",
    LOOKS: "A 29-year-old Lebanese woman, clearly an adult: soft rounded face, fair olive skin, thick dark softly arched brows, almond-shaped hazel-green eyes, full lips, long jet-black wavy hair often piled up in a messy bun, narrow shoulders, a full bust, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, soft feminine curves, thick arms, thick thighs, voluptuous, thin gold rings.",
    RUNWARE: {
 // text only (LOOKS); also the "runware-twinflow" route's model
      // round 8 (owner: "update her body reference to reflect the skin tone and fuller arms ... all her body shots (back, front, clothed, and
      // nude) are consistent ... ultra-realistic with hyperdetailed skin texture, and use the Realism LoRAs"): "v3" = body-v2 redrawn with
      // pale warm ivory skin and fuller arms, "v3-back" and "v3-clothed" drawn from it, all with phone2025 + ultrareal5 (768x1344)
      // 2026-10-09 (owner: "her body looks so airbrushed ... fair olive and ... hyperdetailed skin texture, natural and imperfect", then
      // "use klein for everything with a realism LoRA"): "v4" = the owner's nude pictures redrawn by klein 9B + phone2025 0.6 + ultrareal5 0.9
      // in fair olive skin; "v4-back" from his back picture, "v4-clothed" drawn from v4 (tools/face/owner-2026-10-09)
      // then "v5" (owner: "We want the bodies of the clothed pictures ... nudify it ... same breasts from the nude image front shot ... same
      // ass from the nude pictures", "Instapic and Real HD 2k are good. Use them both together"): his lace body nude, by klein 9B + InstaPic 1.0
      // + Real HD 2K 1.0; "v5-back" from behind, "v5-clothed" drawn from v5
      // then "v6" (owner: "redraw the body (the fuller are what's important)"): v5 redrawn with fuller arms and a softer belly
      BODY: "v13",
                     // image 1 on nude pictures: the owner's nude front (second 2026-10-15 set; v12, v10 before); older sets are in the history above
      // 2026-10-12 (owner: "Add attached body images as THE only clothed body reference, retiring other clothed image references
      // (Wardrobe variety now happens with prompt text)"): the black bra + thong pictures (originals 11, 12). Was v10-clothed (the rust
      // halter + jeans), then the nude front for clothed pictures (CLOTHED_BODY "nude", Step 5); the outfit pictures are retired too
      BODY_CLOTHED: "v13-clothed",
     // the owner's black bra and briefs (second 2026-10-15 set; v12-clothed lace, v11-clothed bra + thong before). Image 1 when she isn't naked (and of partly naked pictures, BODY_PARTIAL "clothed")
      BODY_CLOTHED_BACK: "v13-back",
   // image 1 of a clothed back view (NUDE_BACK_WORDS in a clothed picture: a belfie, a mirror back view): the nude back
      // dressed by REFERENCE_CLOTHED_BACK (owner 2026-10-15: "Use the nude back"; no clothed back picture in the 2026-10-15 set)
      BODY_BACK: "v13-back",
                  // her pictures: klein 9B tries (2 = one retry), then Cloudflare klein with the same references; TwinFlow never draws her (words only: its LOOKS drew the belly, 2026-10-10)
      // owner 2026-10-10: these hairstyles also send their picture (tools/face/style/<key>.jpg) as the next image when picked (about
      // $0.0009 more). The four outfit pictures were retired 2026-10-12 (owner): outfits are words only
      // 2026-10-15 (owner: "use the new references and retire the old ones"): the hairstyle pictures (another woman, from the old set) are
      // retired; hairstyles come from HAIRSTYLES words only. Was hair-long-bangs, hair-bun-bangs, hair-long-waves
      STYLE_PICTURES: {},
      // clothed pictures on BODY_CLOTHED (2026-10-12): klein copies a clothed image 1's garment (the rust halter's crop, Step 4), so
      // the line names what image 1 wears and keeps it out. Owner 2026-10-12: "keep adding to prompts of Reem: full upper arms and soft body"
      REFERENCE_CLOTHED: "The woman from image 0, her face exactly image 0's: thick dark arched brows, light hazel-green eyes, clearly green, with black winged eyeliner, a soft rounded face with full cheeks and a defined jaw, full lips, with exactly the same face and hair (her expression and head pose as this scene describes), and exactly the body of image 1, narrow shoulders, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, thick arms, thick thighs, fair olive skin. Image 1 shows only her body: she wears only the clothes described here. She is 29, clearly an adult.",
      REFERENCE_CLOTHED_BACK: "The woman from image 0, her face exactly image 0's: thick dark arched brows, light hazel-green eyes, clearly green, with black winged eyeliner, a soft rounded face with full cheeks and a defined jaw, full lips, with exactly the same face and hair, and exactly the body of image 1, seen from behind: narrow shoulders, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, thick arms, thick thighs, fair olive skin. Image 1 shows only her body shape: here she is fully dressed, in only the clothes described here. She is 29, clearly an adult.",
      REFERENCE_NOBODY: "The woman from image 0, her face exactly image 0's: thick dark arched brows, light hazel-green eyes, clearly green, with black winged eyeliner, a soft rounded face with full cheeks and a defined jaw, full lips, with exactly the same face and hair (her expression and head pose as this scene describes): narrow shoulders, a full bust, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, soft feminine curves, thick arms, thick thighs, voluptuous, fair olive skin. She is 29, clearly an adult.",
      // who she is, with her face (klein) / in words (TwinFlow). {n} = the place's image number in ROOM
      // round 4 (owner: "test using simpler prompts with the LoRAs"): short prompts drew blowjobs 4/4 (long: 0/10), doggy 2/2 and real lamp light (the long texts: git history before round 4)
      // round 7 (owner: "use concise prompts, relying more on reference images, and mentioning only what makes a difference"; "her body is
      // accurate when she's nude, but ... too overweight" clothed; "her skin tone ... pale warm ivory" (fair olive since 2026-10-09); the mole "keeps changing its place",
      // so out): the body is image 1's, in words only the arms (owner: "keep the fuller arms") and the skin. Was "image 1 but curvier: ...
      // 163 cm and 64 kg, an hourglass figure ... wide hips, full thighs", which on the heavier clothed body made her overweight
      // round 8: with only "the same build and proportions" clothed pictures came out slimmer than image 1 (narrow hips, thin arms 4/4):
      // image 1's own shape named, "not slimmer" (round 7's overweight came from "but curvier" on a heavier picture)
      // 2026-10-15 (owner: the clothed scene pictures "don't look like her", "it's mostly because of the prompts ... eye color as well"): her face
      // in words, first, before the body (replays of D1 611/612 at their seeds: cutting prompt parts, the place picture or LoRAs changed nothing;
      // the face words after the body gave her eyeliner and brows, first and with SCENE_NIGHT's lit face also her green eyes)
      REFERENCE: "The woman from image 0, her face exactly image 0's: thick dark arched brows, light hazel-green eyes, clearly green, with black winged eyeliner, a soft rounded face with full cheeks and a defined jaw, full lips, with exactly the same face and hair (her expression and head pose as this scene describes), and exactly the body of image 1, narrow shoulders, a full bust, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, soft feminine curves, thick arms, thick thighs, voluptuous, fair olive skin. She is 29, clearly an adult.",
      // a sex act from behind (BACK_WORDS): image 1 is BODY_BACK, no breasts named (owner: "don't prompt her breasts since they won't show")
      REFERENCE_BACK: "The woman from image 0, her face exactly image 0's: thick dark arched brows, light hazel-green eyes, clearly green, with black winged eyeliner, a soft rounded face with full cheeks and a defined jaw, full lips, with exactly the same face and hair, and exactly the body of image 1, seen from behind: narrow shoulders, a full bust, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, soft feminine curves, thick arms, thick thighs, voluptuous, fair olive skin. She is 29, clearly an adult.",
      LOOKS: "Photo of a woman: a 29-year-old Armenian-Lebanese woman, clearly an adult, soft rounded face, fair olive skin, thick dark arched brows, almond-shaped hazel-green eyes, full lips, long jet-black wavy hair often piled up in a messy bun: narrow shoulders, a full bust, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, soft feminine curves, thick arms, thick thighs, voluptuous. Her head is naturally sized for her body, about one seventh of her height.",
      // round 4 (owner: "Reem has the same expression and gaze direction in almost every picture"): klein copied image 0's closed-lip
      // smile and tilted head whenever the words named no face. A picture whose words name none (FACE_WORDS) gets one expression and
      // one gaze: ACT on sex acts, HEATED on nude pictures, EVERYDAY on the rest. Claude's wording
      MOODS: {
        EVERYDAY: ["a wide, open-mouthed laugh", "a playful grin showing her teeth", "a lopsided smirk", "a shy small smile, chin tucked", "a relaxed face with soft, closed lips and no smile", "a surprised, delighted look, eyebrows raised", "a thoughtful look, lips pressed together", "a cheeky grin with the tip of her tongue out", "a sleepy half smile", "a calm, serious face"],
        HEATED: ["a sultry look with her lips parted", "a teasing smile, biting her lower lip", "a daring, confident stare with no smile", "a shy, flushed smile", "heavy-lidded eyes and a slow smile", "a playful laugh", "a serious, intense look", "a soft, dreamy look"],
        // oral acts (ORAL_WORDS): her mouth is on him, so only eyes and brows (an open-mouthed moan drew her tongue out, not sucking: 2/2 seeds)
        ORAL: ["teary, eager eyes", "brows raised, eyes wide and eager", "heavy-lidded eyes, flushed cheeks", "a teasing look in her eyes", "eyes half-closed, cheeks flushed", "a hungry, intent stare"],
        ACT: ["her mouth open in pleasure, brows drawn together", "eyes half-closed, lips parted, cheeks flushed", "biting her lower lip hard", "a breathless open-mouthed moan", "a wicked, satisfied smile", "eyes squeezed shut, head pressed back", "a dazed, blissful look", "a hungry, heavy-lidded look"],
      },
      // no belly, hip or thigh words (owner 2026-10-10: they made her belly big); the first framing bench had them, the redraw has not
      REFERENCE_CLOSE: "A 29-year-old woman, clearly an adult: fair olive skin, narrow shoulders, a full bust, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, soft feminine curves, thick arms, thick thighs, voluptuous.",
    },
    LINGERIE: {
      KLEIN_WARDROBE: [
        "a black lace bodysuit with a plunging neckline and high-cut legs, and black thigh-high stockings with wide lace tops",
        "a short red satin robe hanging open over a red lace triangle top and tiny matching lace bottoms",
        "his oversized white button-down shirt worn open over a black lace triangle top and tiny matching lace bottoms, her legs bare",
        "a dusty pink satin and lace one-piece with thin straps, light boning at the waist and high-cut legs, her legs bare",
      ],
      SPICY_WARDROBE: [
        "only a deep plum French floral lace string thong with velvet trim", "only a black lace thong",
        "a black lace balconette bra and a matching high-cut lace thong", "a red lace bra and matching red lace panties",
        "a white lace bralette and a matching lace thong", "an open oversized white shirt slipping off her shoulders over only a black lace thong",
      ],
      // who she is, in words (the description Nano Banana drew her face from)
      WHO: "a 29-year-old Lebanese woman with a soft rounded face, fair olive skin, thick dark arched brows, almond-shaped hazel-green eyes, full lips, long jet-black wavy hair often piled up in a messy bun, narrow shoulders, a full bust, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, soft feminine curves, thick arms, thick thighs, voluptuous.",
      WARDROBE: [
        "a black lace bra and matching black lace panties", "a red lace bra and matching red lace panties",
        "a black lace bralette and matching high-waisted lace briefs", "a white lace bra and matching white lace panties",
        "a black lace bodysuit with a low open back", "a short black satin babydoll slip with lace trim and thin straps",
        "a short silk robe hanging open over a black lace bralette and matching briefs",
      ],
    },
    HEAT_WORDS: ["kiss", "kissing", "bed", "sexy", "hot", "naked", "touch", "lingerie", "horny", "fuck", "want you", "need you", "turn me on", "body", "lips", "moan", "moans", "undress", "tease", "come over", "thighs", "wet", "hard", "bite", "taste"],
    EXPRESSIONS: {
      EVERYDAY: ["a soft half smile", "laughing, eyes crinkled almost shut", "a raised-eyebrow smirk", "an unimpressed deadpan look", "biting back a smile", "a sleepy, lazy smile"],
      FLIRTY: ["a slow, knowing smile", "a teasing smirk", "lips slightly parted, eyes on the camera", "a daring look straight into the camera", "biting her lower lip"],
      BOUDOIR: ["heavy-lidded eyes, lips slightly parted", "a slow, knowing smile", "a soft, inviting look", "a teasing half smile, chin lowered", "a daring look straight into the camera"],
      NUDE: ["heavy-lidded eyes, lips slightly parted", "a slow, knowing smile", "a daring look straight into the camera", "a shy, flushed smile", "biting her lower lip"],
    },
    // From her persona. "clothes | place" brings its own place (only for shots with {where})
    WARDROBE: {
      // fitted, so her shape shows (owner 2026-10-05: "clothes that better reflect her body shape and contours")
      EVERYDAY: ["a fitted olive ribbed cami and soft olive cotton shorts under a long, open cream chunky-knit cardigan", "a long camel wool coat open over a black turtleneck and charcoal trousers, a cream chunky-knit scarf around her neck", "a fitted rust-red halter crop top and light-blue straight-leg jeans", "a sleeveless white linen top with a square neckline and wide-leg white linen pants", "a gray knit cardigan sliding off one shoulder over a fitted black tank top and soft gray sweatpants", "a fitted black t-shirt tucked into high-waisted jeans", "a fitted black ribbed knit midi dress", "a fitted black ribbed tank top and high-waisted jeans", "a fitted gray ribbed tee and high-waisted jeans", "a fitted black turtleneck tucked into high-waisted jeans and small gold hoops", "a fitted black wrap dress",
        // owner 2026-10-08: "more outfits"
        "a cream cable-knit sweater and fitted dark jeans", "a fitted olive ribbed long-sleeve top and gray yoga pants", "a denim button-up shirt knotted at the waist over a white tank top and jeans", "a fitted burgundy sweater dress and black tights", "a gray zip-up hoodie half open over a white crop tank and joggers", "a fitted white linen button-down tucked into black trousers", "a black leather jacket over a fitted gray tee and jeans", "a matching soft beige lounge set, cropped top and wide pants", "a fitted navy striped Breton top and high-waisted jeans", "a red silk blouse with the top buttons open and black jeans"],
      FLIRTY: ["an open, oversized gray linen shirt over a black ribbed bralette with lace trim and black knit shorts with lace side panels", "a long black satin-look slip dress with thin straps, relaxed drape", "a black satin slip dress with lace trim at the neckline", "a cropped black top and black high-waisted leggings", "a black bodycon mini dress", "a low-cut black camisole and cotton shorts", "an oversized white shirt worn as a dress, unbuttoned at the collar", "a black off-shoulder top and a short skirt", "an oversized gray tee that barely reaches mid-thigh",
        "a tight ribbed white tank top and tiny gray sleep shorts", "a red satin cami and black satin shorts", "a fitted black corset top and high-waisted jeans", "his oversized flannel shirt, unbuttoned low, and bare legs", "a short emerald satin wrap dress", "a cropped white tee with no bra and low-rise sweatpants", "a backless black knit top and a fitted midi skirt", "a sheer black mesh top over a black bralette and jeans"],
      // Worded so Cloudflare's prompt filter (3030) lets it through: it refused "lingerie", "bralette and briefs"
      BOUDOIR: ["a black lace bodysuit", "a black satin slip with thin straps", "a black lace cami and matching silk shorts", "a red lace bodysuit", "a white lace bodysuit", "a burgundy velvet slip with thin straps", "a black mesh bodysuit", "a black one-shoulder swimsuit | on Crane Beach, bright sun", "a black string bikini | on Crane Beach, bright sun"],
      NUDE: ["completely naked", "topless, in only black lace panties", "naked except for her thin gold rings", "completely naked, her hair still damp from the shower", "topless, in only his oversized gray sweatpants", "naked on rumpled white sheets"],
      // Step 4 (owner, 2026-10-11: "one home outfit a day"): one HOME and one OUT outfit a day by the band (outfitBand: COLD under 50 F,
      // MILD 50-72, WARM over 72). Everyday pictures that name no clothes wear them; OUTSIDE_WORDS take OUT. Claude's lists (words
      // only since 2026-10-12: the outfit pictures were retired).
      HOME: {
        COLD: ["her father's old gray knit cardigan over a plain black tank top and soft gray sweatpants", "a cream cable-knit sweater and soft gray sweatpants", "a gray zip-up hoodie half open over a white crop tank and joggers", "a matching soft beige lounge set, cropped top and wide pants", "a fitted olive ribbed long-sleeve top and gray yoga pants"],
        MILD: ["a fitted olive ribbed cami and soft olive cotton shorts under a long, open cream chunky-knit cardigan", "a gray knit cardigan sliding off one shoulder over a fitted black tank top and soft gray sweatpants", "a matching soft beige lounge set, cropped top and wide pants", "a fitted gray ribbed tee and soft black lounge shorts", "an oversized gray tee and black bike shorts"],
        WARM: ["a fitted olive ribbed cami and soft olive cotton shorts under a long, open cream chunky-knit cardigan", "a fitted rust-red halter crop top and light-blue straight-leg jeans", "a tight ribbed white tank top and soft gray cotton shorts", "a loose white linen button-down over a black bralette and cotton shorts"],
      },
      OUT: {
        COLD: ["a long camel wool coat open over a black turtleneck and charcoal trousers, a cream chunky-knit scarf around her neck", "a fitted burgundy sweater dress, black tights and a long black wool coat", "a cream cable-knit sweater, fitted dark jeans and a black puffer jacket", "a black leather jacket over a black turtleneck and jeans"],
        MILD: ["a black leather jacket over a fitted gray tee and jeans", "a fitted black turtleneck tucked into high-waisted jeans and small gold hoops", "a denim button-up shirt knotted at the waist over a white tank top and jeans", "a fitted navy striped Breton top and high-waisted jeans", "a fitted black wrap dress", "a red silk blouse with the top buttons open and black jeans", "a fitted black ribbed knit midi dress"],
        WARM: ["a fitted rust-red halter crop top and light-blue straight-leg jeans", "a sleeveless white linen top with a square neckline and wide-leg white linen pants", "a fitted black ribbed tank top and high-waisted jeans", "a fitted black t-shirt tucked into high-waisted jeans", "a fitted white linen button-down tucked into black trousers"],
      },
    },
    // @name = one of her fixed places (LOCATIONS): the same room in every picture
    PLACES: {
      EVERYDAY: ["on @porch", "in @kitchen", "at a bakery café on Mount Auburn Street with a coffee", "at her table in @living, laptop open, shoeboxes of receipts around her", "in @living", "by the radiator under the window in @living", "in @hallway, by her door"],
      FLIRTY: ["in @bedroom", "in @living", "on @porch", "in @hallway, leaning on her doorframe"],
      BOUDOIR: ["on the bed in @bedroom, rumpled white sheets", "by the window in @bedroom", "sitting on the edge of the bed in @bedroom", "in @bedroom"],
      NUDE: ["on the bed in @bedroom, rumpled white sheets", "by the window in @bedroom", "sitting on the edge of the bed in @bedroom", "in @bedroom"],
    },
    // Fixed places (owner 2026-10-03), the same in every picture and scene: NAME goes in the prompt where @key
    // is; LOOK is added once, and with a reference picture (places.js, drawn by tools/face) the room is drawn
    // from it. WORDS: words in her [selfie: ...] or a scene that put the picture there (his rooms are checked first).
    LOCATIONS: {
      his_bedroom: { NAME: "his bedroom across the hall", LOOK: "a plain bedroom in an old apartment: a big bed with rumpled dark gray sheets, a worn wooden nightstand with a phone charger, a glass and an alarm clock, off-white walls, two tall wooden windows with half-open white blinds over a radiator, a navy patterned rug on wood floors, sneakers and a backpack on the floor", WORDS: ["his bed", "his bedroom", "his sheets", "your bed", "your bedroom"] },
      his_living: { NAME: "his living room across the hall", LOOK: "a plain living room: a gray fabric couch with a plaid blanket, a big TV on a low wooden stand, a wooden coffee table with a game controller and a mug, bare off-white walls, a radiator under a small window, a bookshelf, a green bike by the white door, worn wood floors and a patterned rug", WORDS: ["his couch", "his place", "his apartment", "his living room", "your couch", "your place", "your apartment"] },
      bedroom: { NAME: "her bedroom", LOOK: "a calm bedroom in an old Boston-area apartment: a low bed with rumpled white linen sheets and a cream knit throw, a black iron bedside lamp on a small wooden nightstand with books, a tall arched black floor mirror leaning on the wall, sheer white curtains on a wide old wooden sash window, a white radiator, a jute rug on dark worn wood floors", WORDS: ["bedroom", "bed", "sheets", "pillows", "pillow"] },
      bathroom: { NAME: "her bathroom", LOOK: "a small bathroom: white subway tiles, a round mirror with a thin brass frame over a white pedestal sink, a brass two-bulb vanity light, black-and-white mosaic floor tiles, a linen shower curtain", WORDS: ["bathroom", "shower", "bath", "sink"] },
      kitchen: { NAME: "her kitchen", LOOK: "a narrow kitchen: white cabinets, butcher-block counters, a white farmhouse sink under a wooden window with pots of herbs on the sill, open wooden shelves with mismatched mugs, an old white gas stove with a kettle, warm under-cabinet light", WORDS: ["kitchen", "stove", "counter", "cooking"] },
      living: { NAME: "her living room", LOOK: "the front room of an old triple-decker apartment: cream plaster walls with dark wooden trim, a silver-painted cast-iron steam radiator beside tall drafty wooden sash windows, a worn wooden kitchen table used as her desk with an open laptop, a printing calculator and cardboard boxes of receipts, a worn olive-green sofa with a green plaid wool blanket, a faded rug on old fir floorboards, a tall white paper floor lamp", WORDS: ["living room", "front room", "sofa", "couch", "desk", "receipts", "shoebox", "shoeboxes", "laptop", "calculator", "radiator", "rug"] },
      porch: { NAME: "her back porch", LOOK: "a small third-floor wooden back porch of a triple-decker, seen from high above the ground: worn gray-painted floorboards, white turned railings with peeling paint, one rusty metal folding chair, an old coffee can for an ashtray, string lights along the railing, the asphalt driveway with trash bins and a white van three floors below, the neighbors' clapboard triple-deckers and autumn maples at eye level", WORDS: ["porch", "balcony", "railing"] },
      hallway: { NAME: "the hallway between their doors", LOOK: "the narrow third-floor landing of an old triple-decker: worn dark wooden floorboards, steep back stairs going down behind a dark wooden banister, two dark green painted apartment doors facing each other a few steps apart, a tall wood-framed mirror on the wall by her door, a doormat, a bare bulb on the slanted ceiling, rough cream plaster walls, a small window at the end", WORDS: ["hallway", "hall", "doorframe", "landing", "stairs", "your door", "my door"] },
    },
    // owner 2026-10-08: "more hairstyles": Runware pictures get one of these HAIR_CHANCE of the time, unless the words name her hair
    // (HAIR_WORDS); her hair color stays image 0's (REFERENCE "same face, hair color"); bangs are a style, not fixed (owner 2026-10-10)
    HAIRSTYLES: ["long, layered jet-black waves falling past her chest, with soft wispy curtain bangs grazing her brows", "pulled up in a big messy top bun, no bangs, loose wispy strands around her face and neck", "pulled up loosely, with full wispy bangs down to her brows and long loose strands framing her face", "long, loose dark waves with a center part and no bangs, falling over her shoulders", "her long hair down in loose natural waves", "pulled up in a messy bun and a few loose strands framing her face", "in a high ponytail", "in a loose side braid over one shoulder", "half-up with a black claw clip, the rest falling down her back", "tucked behind one ear, the rest down", "in a low, sleek bun at the nape of her neck", "damp and tousled from the shower", "blown out straight and glossy", "piled up with a claw clip, loose, messy strands falling out", "messy bedhead waves, a little flat on one side", "in a loose low ponytail with a silk scrunchie"],
    HAIR_WORDS: ["hair", "ponytail", "bun", "braid", "braids", "pigtails", "updo", "claw clip", "scrunchie", "bedhead", "bangs"],
                   // the code avoids the shot types and angle of this many recent pictures

    // What she's told. FORMAT: this reply comes with a picture (decided by the code, like a voice note).
    // {shot}: the shot the code picked, {hint}: TIER_HINTS
    FORMAT: " This reply comes with a picture of you, like anyone texting: put [selfie: {shot}, what it shows] on its own line, a few words on where you are and what you're wearing.{hint} Your words go with it as usual.",
    FORMAT_ASKED: " He's asking for a picture of you, and you send one: put [selfie: {shot}, what it shows] on its own line, a few words on where you are and what you're wearing.{hint} A short text with it if you like.",
    // Sent right before she writes (like NUDGES.FORMAT_*), where the model pays the most attention
    REMINDER: "[This reply comes with a picture of you: put [selfie: {shot}, what it shows] on its own line, in a few words about you (\"she\", never \"you\").]",
    // While apart, when a picture is possible. {everyday}, {flirty}: the TIERS' shot types
    // Step 2 (2026-10-11): the old "Your pictures never show you fully naked." is gone; {nude} = NSFW.SELF_NUDE at Nude and On only
    SELF_CHOICE: " Now and then you may send him a picture of yourself instead of describing it: [selfie: type, what it shows] on its own line. Types: {everyday}. When you feel like it, pick a sexier one: {flirty}, or any of them in lingerie, satin or swimwear.{nude}",
    RECENT: " Your last pictures showed: {list}. Show something different this time.",
        // {what}: "type, what it shows"; in her chat history (scene pictures store nothing)
    FAILED_TEXT: "ugh my pic won't send. later",
  },
};
