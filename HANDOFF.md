# HANDOFF — reem-bot

## Goal and status
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (free plan). v8 + v9 are merged (#5) and deployed.
**v10** is on branch `ccr-b51a9ebf-j34yp9`, not merged, so **not deployed** (pushing to `main` deploys via GitHub Actions).
v10: /help, /name, /about, /auto (draft + Send/Another buttons), /edit, /rewind, /retry, his own edits redo her answer,
her looks (HOW YOU LOOK), Basbousa a fluffy tabby, and the voice-note + writing-quality fixes below.

**After the owner deploys v10:** open `/setup` once (Telegram must start sending `edited_message` and `callback_query`,
and the command menu updates), then `/restart` (or `/rewind` to a clean point): the old narrated replies in history
keep pulling the model back to that style.

## Why voice notes didn't arrive, and the fix (v10)
Live Worker, voice ID and the ElevenLabs "Reem" voice were all fine. The model (Lunaris 8B) never wrote the `[voice]`
tag; it narrated voice notes in prose ("sends another voice note…", "laughs softly…"), so the code sent text.
Root cause of the drift: ~8k-token context. System prompt ≈1.5k tokens + notes + up to 40 long scene messages
overflowed it, and OpenRouter's automatic middle-out silently cut the chat.
- The code decides voice notes (`replyMode`): `VOICE.CHANCE` / `CHANCE_AFTER_VOICE` / `CHANCE_MORE_VOICE`, always when
  his message matches `VOICE.ASK_PATTERN`. A model-written `[voice]` still counts.
- `fitHistory` keeps the newest chat that fits `LLM.CONTEXT_TOKENS`; `MEMORY.HISTORY_MAX/KEEP` 24/14.
- `NUDGES.FORMAT_TEXT/VOICE/SCENE` go as a system message after the chat; `LLM.MAX_TOKENS` per mode.
- Repairs (`shape`): scenes → `markScene` (narration in *italics*); texts/voice → `stageToTags`
  (`VOICE.STAGE_DIRECTIONS`), then `unnarrate` if `looksNarrated` (quotes only, or narration sentences dropped,
  `TEXTING.NARRATION`). `think` retries once with `NUDGES.RETRY_FORMAT` when a text/voice reply reads like a story.
- TTS/sendVoice failures are stored in KV `voice_error` and shown on `/setup` (she falls back to text).

## Decisions (owner's rules, don't revisit)
- **The AI model stays `sao10k/l3-lunaris-8b`** (chat, memory and /auto): cheap, uncensored, good at roleplay. The owner decides models; Claude only advises when asked.
- Adult themes stay open and may turn explicit naturally. **`LIMITS & OOC` in SYSTEM_PROMPT stays word for word**: never loosen or tighten it (a unit test checks it).
- No photo vision (it would need a second model). No deliberate typos. Emoji reactions: yes. Expressive voice (eleven_v3): strongly preferred.
- Arabizi (ya3ni, 7abibi) is fine in texts, but **no digit may ever be spoken** in voice notes (verified with a real clip).
- Owner's v10 picks: /auto = draft with ✅ Send / 🔄 Another buttons; editing = reply-commands (no buttons under her messages); Basbousa = fluffy golden-brown tabby.
- Don't merge, open a PR, or deploy unless the owner asks. The Cloudflare API token has full permissions (the Cloudflare MCP can inspect the Worker).
- Keep every tunable in `CONFIG`. After any CONFIG change, run `node tools/build-panel.mjs`.

## File map
- `worker.js`: everything. SETTINGS on top (`SYSTEM_PROMPT`, `INTRO_MESSAGE`, `MEMORY_PROMPT`, `CONFIG`), then code:
  - entry points: `fetch` (/setup, /webhook → queue; answers button taps at once), `queue`, `scheduled` (cron → `proactiveChat` → queue task)
  - `handleBatch`: messages, `edited_message` (`onEdited`), `callback_query` (`onButton`), commands (`parseCommand` → `runCommand`). Story commands (`STORY_ACTIONS`) first flush pending messages through `reply`.
  - commands: `nameCommand`, `aboutCommand` (`hisName`, `aboutHim`), `autoCommand`/`autoDraft`/`cleanDraft`/`draftHtml`, `retry`, `rewind`, `editHers`; helpers `findPart`, `cutAfter`, `deleteIds`, `clearReactions`, `answerAgain`, `failed`
  - `reply` (builds `heard` + his `parts`) → **`respond`** (`replyMode`, think, wait, voice/text, `shape`, then `saveTurn` after delivery with ids); `textFirst` (`proactiveHeard`) also uses `respond`
  - `think` (system prompt + nudges; `fitHistory`; `formatNudge` after the chat; retry on repeated opening, all-old lines or narration)
  - `callModel` (OpenRouter; `trimCut` → `trimUnfinished`), `remember` (memory folding)
  - repairs: `shape`, `looksNarrated`, `unnarrate`, `stageToTags`, `markScene`, `isWellFormedScene`
  - timing: `noticeTime`, `typingTime`, `act`, `sendBubbles` (returns `[{id, text}]`)
  - voice: `bodyOf`/`clean`, `forSpeech` → `tidySpoken` → `sayArabizi`, `tts`, `sendVoice` (returns `{delivered, id, error}`), `voiceFailed`
  - audio tags: `isV3`, `audioTagsOn`, `audioTagRe`, `stripAudioTags`
  - reactions: `takeReaction`/`reactionEmoji`
  - overrides: `applyOverrides`/`mergeSettings` (PRONUNCIATIONS/ARABIZI_DIGITS/STAGE_DIRECTIONS replaced whole)
  - KV keys: `s:<chat>` settings (moreVoice, proactive {day,count}, name, about, tgName), `h:<chat>` history
    `{role, content, at, parts: [{id, text}], proactive?, react?, reactTo?}`, `m:` notes, `b:` backlog, `a:<chat>` /auto draft `{id, text, idea}`, `owner`, `seen`, `voice_error`
- `wrangler.toml`: KV `REEM_KV`, queue `reem-inbox` (consumer: max concurrency 1, retries 0), cron `*/15 * * * *`.
- `tools/settings-panel.html`: offline settings UI. Field schema in `SECTIONS`; types: text, textarea, long, list, number, ms, range, bool, select, commands, map, groups, schedule.
- `tools/build-panel.mjs`: rewrites the panel's `const DEFAULTS = …;` line from worker.js CONFIG.
- `tools/test/unit.mjs`, `tools/test/e2e.mjs`, `load-worker.mjs`: tests (load-worker exports internal functions; add new ones to its `EXPORTS`).

## Gotchas
- History entries from before v10 have no `parts`: they can't be targeted by /edit or /rewind (NOT_FOUND notice). Before v8 they had no `at` either.
- Rewind/edit only reach the verbatim history; anything older is in `m:` notes (TOO_OLD notice). That keeps notes consistent: they only hold messages older than the whole history.
- Telegram only deletes messages for 48 h (`DELETE_FAILED`); history is cut anyway. Bot notices are never in history, so /rewind leaves them.
- `respond` saves once, after delivery (one KV write). Cron runs (every 15 min) must finish within 30 s, so `scheduled` only queues a task.
- `clean()` strips `[...]` at line starts except allowed audio tags; `tidySpoken()` strips every other `[...]`.
- eleven_v3: no `<break>` (lines joined with "..."), stability must be 0/0.5/1, speaker boost not sent. Tags only when `VOICE.MODEL` starts with `eleven_v3` and `AUDIO_TAGS` is on.
- Reactions only when apart, never when she texts first; stored on her entry (`react`, `reactTo`) so /retry, /rewind and his edits clear them.
- e2e: memory-folding calls (system prompt contains "private memory notes") get a fixed mock reply; use `herPrompt()`/`sys()` to read her last prompt. `CONFIG_OVERRIDES` is cached once per run, so tests set `W.CONFIG` directly. Voice chances are 0 in e2e except where a test asks.
- Telegram reactions accept only its fixed emoji list (❤ without FE0F, 🤣 rather than 😂).
- Panel textareas: a leading "\n" is added on purpose (browsers drop the first newline).
- Free plan: at most 50 outside calls per run (`budget`, `SUBREQUEST_RESERVE`); about 1000 KV writes per day.

## Next steps
- Owner's call: merge/deploy v10. Then `/setup` once, `/restart`, and check a voice note ("send me a voice note").
- Watch whether texts still drift into narration; if so, try `LLM.MAX_TOKENS.TEXT` lower or `VOICE.CHANCE` tweaks before touching the prompt.

**After each step:** run `node tools/build-panel.mjs` (add panel fields), `node tools/test/unit.mjs`, `node tools/test/e2e.mjs`, `node --check worker.js`. Commit, push, update this file.

## Prompt for the next chat (paste as-is)
> Continue the reem-bot project on branch `ccr-b51a9ebf-j34yp9`. Use /anthropic-skills:lean-session. Read `HANDOFF.md` first and follow its rules exactly: the AI model stays Lunaris 8B (advise only, never change it); `LIMITS & OOC` stays word for word; every tunable goes in `CONFIG`; don't merge, open a PR or deploy unless I ask.
> <describe the next change>. Finish with the listed checks, then commit and push.
> Report briefly: what changed, test results, and anything you need from me.
