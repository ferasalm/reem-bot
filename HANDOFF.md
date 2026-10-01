# HANDOFF — reem-bot

## Goal and status
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (free plan). v8 ("more human") is done and
pushed to branch `ccr-9d5bc032-5c585q`. **It is not merged to `main`, so it is not deployed** (pushing to `main` deploys via GitHub Actions).
Next: voice designs → eleven_v3 expressive voice with audio tags → emoji reactions (plan below).

## Decisions (owner's rules, don't revisit)
- **The AI model stays `sao10k/l3-lunaris-8b`** (chat and memory): cheap, uncensored, good at roleplay. The owner decides models; Claude only advises when asked.
- Adult themes stay open and may turn explicit naturally. **`LIMITS & OOC` in SYSTEM_PROMPT stays word for word**: never loosen or tighten it.
- No photo vision (it would need a second model). No deliberate typos. Emoji reactions: yes. Expressive voice (eleven_v3): strongly preferred.
- Arabizi (ya3ni, 7abibi) is fine in texts, but **no digit may ever be spoken** in voice notes (verified with a real clip).
- Don't merge, open a PR, or deploy unless the owner asks. The Cloudflare API token has full permissions (the Cloudflare MCP can inspect the Worker).
- Keep every tunable in `CONFIG`. After any CONFIG change, run `node tools/build-panel.mjs`.

## File map
- `worker.js`: everything. SETTINGS on top (`SYSTEM_PROMPT`, `INTRO_MESSAGE`, `MEMORY_PROMPT`, `CONFIG`), then code:
  - entry points: `fetch` (/setup, /webhook → queue), `queue` (replies), `scheduled` (cron → `proactiveChat` → queue task)
  - `handleBatch` → `reply` (builds `heard`, `noticeTime`) → **`respond`** (think, wait, voice/text, `saveTurn`); `textFirst` also uses `respond`
  - `think` (system prompt + nudges: memory, ABOUT_HIM, TIME/SCHEDULE, TOGETHER/APART, voice, TEXTURE, VARY_OPENING; retry if repeated)
  - `callModel` (OpenRouter; `trimCut` → `trimUnfinished`), `remember` (memory folding)
  - timing: `noticeTime` (momentum, schedule delay, long pause), `typingTime` (scene cap), `act`, `sendBubbles`
  - voice: `bodyOf`/`clean` (strip `[voice]` and line-start `[...]`), `forSpeech` → `tidySpoken` → **`sayArabizi`**, `tts`, `sendVoice`
  - overrides: `applyOverrides`/`mergeSettings` (`CONFIG_OVERRIDES` JSON env var; PRONUNCIATIONS/ARABIZI_DIGITS replaced whole)
  - KV keys: `s:<chat>` settings (moreVoice, proactive {day,count}), `h:<chat>` history `{role,content,at,proactive?}`, `m:` notes, `b:` backlog, `owner`, `seen`
- `wrangler.toml`: KV `REEM_KV`, queue `reem-inbox` (consumer: max concurrency 1, retries 0), cron `*/15 * * * *`.
- `tools/settings-panel.html`: offline settings UI (screenshot/copy changes, export CONFIG_OVERRIDES). Field schema in `SECTIONS`; types: text, textarea, long, list, number, ms, range, bool, select, commands, map, groups, schedule.
- `tools/build-panel.mjs`: rewrites the panel's `const DEFAULTS = …;` line from worker.js CONFIG.
- `tools/test/unit.mjs`, `tools/test/e2e.mjs`, `load-worker.mjs`: tests (load-worker exports internal functions; add new ones to its `EXPORTS`).

## Gotchas
- History entries saved before v8 have no `at`; texting first only starts after one new exchange.
- Cron runs (every 15 min) must finish within 30 s, so `scheduled` only queues a task; the queue run (up to 15 min) writes the message.
- `clean()` strips `[...]` at the start of lines, and `tidySpoken()` strips every `[...]`. eleven_v3 tags need a separate path (step 3).
- Telegram reactions accept only its fixed emoji list (e.g. ❤ without FE0F, 🤣 rather than 😂).
- Panel textareas: a leading "\n" is added on purpose (browsers drop the first newline).
- e2e mocks `Date`, `setTimeout` (instant) and `Math.random` (seeded); unit quiet-hour checks use the real clock.
- The ElevenLabs MCP needs the voice description and sample line to come from the owner. They're approved below.
- Free plan: at most 50 outside calls per run (`budget`, `SUBREQUEST_RESERVE`); about 1000 KV writes per day.

## Next steps (approved plan)
**Step 2: voice designs.** Use `creative_design_voice` for each design below with the approved line, then send the previews to the owner. After they pick, `creative_save_designed_voice` → set `VOICE.ID`/`VOICE.NAME`.
- A (recommended) Late-night neighbor: "29-year-old American woman from North Jersey. Low-to-mid pitch, slightly husky and warm, light vocal fry, relaxed and unhurried. Intimate close-mic sound in a quiet bedroom, a playful smile you can hear."
- B Sharp & bright: "29-year-old American woman from North Jersey. Clear mid pitch, quick and teasing with a sarcastic edge, a warm easy laugh, confident and flirty, casual phone-call sound."
- C Velvet: "29-year-old woman, American with a faint Arabic-English bilingual lilt. Deep, soft and breathy, slow and sensual, whispery close-mic, calm and seductive."
- Line (language en): "Okay so... Basbousa just knocked my coffee off the table. While looking at me. Come over and deal with your new best friend... or are you scared of me?"

**Step 3: eleven_v3 with audio tags.**
- `VOICE.MODEL "eleven_v3"`, plus new `VOICE.AUDIO_TAGS true` and `VOICE.ALLOWED_TAGS` [laughs, giggles, chuckles, sighs, whispers, exhales, breathes heavily, breathless, softly, teasing, sarcastic, sleepy, excited, moans softly].
- Build the spoken text from the raw reply (remove only `[voice]`), keep allowed tags, and drop all other brackets.
- Strip tags from the text fallback and from `speakingTime`. Use "..." instead of `<break>` on v3.
- Snap STABILITY to 0, 0.5 or 1, and send only the voice_settings v3 accepts (check the docs). `sayArabizi` is unchanged.
- New `NUDGES.VOICE_TAGS`, added only when tags are on.
- Verify: unit tests, then one real clip (v3, the chosen voice, tags + Arabizi) transcribed back.

**Step 4: emoji reactions.**
- New `REACTIONS {ENABLED:true, CHANCE:0.25, ALLOWED:[❤,🔥,🥰,🤣,😭,😈,💋,😘,😍,🙈,🤨,💔,👀], ALIASES:{"❤️":"❤","😂":"🤣"}}`. Check ALLOWED against the Bot API list.
- The model may start a reply with `[react: X]`. Parse it, map aliases, validate, then call `setMessageReaction` on his latest message_id and strip the tag.
- A reaction-only reply just reacts and saves `[reacted X]`. No reactions when she texts first.
- Add a prompt line plus a CHANCE nudge, and e2e cases (reaction + text, reaction only, invalid emoji).

**After each step:** run `node tools/build-panel.mjs` (add panel fields), `node tools/test/unit.mjs`, `node tools/test/e2e.mjs`, `node --check worker.js`. Commit, push to `ccr-9d5bc032-5c585q`, update this file.
Suggested model: Opus for steps 3 and 4 (pipeline changes); Sonnet is fine for panel/README updates.

## Prompt for the next chat (paste as-is)
> Continue the reem-bot project on branch `ccr-9d5bc032-5c585q`. Use /anthropic-skills:lean-session. Read `HANDOFF.md` first and follow its rules exactly: the AI model stays Lunaris 8B (advise only, never change it); `LIMITS & OOC` stays word for word; every tunable goes in `CONFIG`; don't merge, open a PR or deploy unless I ask.
> Do the approved "Next steps" in order. Step 2: generate the three ElevenLabs voice designs (A, B, C) with the approved descriptions and line, send me the previews, then stop and wait for my pick. Steps 3 (eleven_v3 audio tags) and 4 (emoji reactions) can be built while I listen; finish each with the listed checks, then commit and push.
> Report briefly: what changed, test results, and anything you need from me.
