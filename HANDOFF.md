# HANDOFF — reem-bot

## Goal and status
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (free plan). v8 ("more human") and v9
(eleven_v3 audio tags + emoji reactions) are merged to `main` (PR #5). Pushing to `main` deploys via GitHub Actions.
**v10 (format enforced in code + scenario tests) is on branch `ccr-75e7610d-6zkheu`, not merged, so not deployed.**

## Decisions (owner's rules, don't revisit)
- **The AI model stays `sao10k/l3-lunaris-8b`** (chat and memory): cheap, uncensored, good at roleplay. The owner decides models; Claude only advises when asked.
- Adult themes stay open and may turn explicit naturally. **Never tone down explicitness** (owner, 2026-10-01): prompt edits may only make INTIMACY more explicit, and code guards fix format only, never content. **`LIMITS & OOC` in SYSTEM_PROMPT stays word for word**: never loosen or tighten it.
- No photo vision (it would need a second model). No deliberate typos. Emoji reactions: yes. Expressive voice (eleven_v3): strongly preferred.
- Arabizi (ya3ni, 7abibi) is fine in texts, but **no digit may ever be spoken** in voice notes (verified with a real clip).
- Don't merge, open a PR, or deploy unless the owner asks. The Cloudflare API token has full permissions (the Cloudflare MCP can inspect the Worker).
- Keep every tunable in `CONFIG`. After any CONFIG change, run `node tools/build-panel.mjs`.

## File map
- `worker.js`: everything. SETTINGS on top (`SYSTEM_PROMPT`, `INTRO_MESSAGE`, `MEMORY_PROMPT`, `CONFIG`), then code:
  - entry points: `fetch` (/setup, /webhook → queue), `queue` (replies), `scheduled` (cron → `proactiveChat` → queue task)
  - `handleBatch` → `reply` (builds `heard`, `noticeTime`) → **`respond`** (think, wait, `shapeReply`, texts then voice, `saveTurn`); `textFirst` also uses `respond`
  - `think` (system prompt + nudges: memory, ABOUT_HIM, TIME/SCHEDULE, TOGETHER/APART, OOC, voice (apart only), TEXTURE (+TEXTURE_APART), VARY_OPENING; retry if repeated or nothing sendable → RETRY / RETRY_EMPTY)
  - **`shapeReply(raw, {scene, ooc, canReact, history, heard, lastResort})`**: the single place format is enforced. `scrubModel` (Llama 3 tokens, "Him:" lines, {{char}}, unrequested OOC/Note asides) → `takeReaction` → OOC (one plain message) / together (scene, no voice, plain words after his action → "dialogue") / apart voice (narration before [voice] dropped, typed words → texts first, `emotesToTags`) / apart text (`texting`: `isNarration` lines and `dropActions`; narration-only → `narrationOnly`, asked again, `lastResort` sends it as a scene). Returns `{kind, texts, voiceText, spoken, stored, reaction, repeated}`
  - scene state: `sceneOf` (his *action* unless OOC; else her last non-OOC message via `inPerson` = *action* or "quoted"), `isOoc`
  - `callModel` (OpenRouter; `trimCut` → `trimUnfinished`), `remember` (memory folding)
  - timing: `noticeTime` (momentum, schedule delay, long pause), `typingTime` (scene cap), `act`, `sendBubbles`
  - voice: `bodyOf`/`clean` (strip `[voice]` and line-start `[...]` except allowed audio tags), `forSpeech` → `tidySpoken(line, keepTags)` → **`sayArabizi`**, `tts` (`voiceSettings`), `sendVoice`
  - audio tags: `isV3`, `audioTagsOn`, `audioTagRe`, `stripAudioTags` (texts/history never carry tags). `shapeReply` keeps tags only in `spoken`; `texts`, `voiceText` and `stored` never have them
  - reactions: `takeReaction`/`reactionEmoji` (parse `[react: X]`, aliases, validate); `respond` rolls `REACTIONS.CHANCE` (→ `NUDGES.REACT`), calls `setMessageReaction` on `reactTo` (his latest message_id, from `reply`)
  - overrides: `applyOverrides`/`mergeSettings` (`CONFIG_OVERRIDES` JSON env var; PRONUNCIATIONS/ARABIZI_DIGITS replaced whole)
  - KV keys: `s:<chat>` settings (moreVoice, proactive {day,count}), `h:<chat>` history `{role,content,at,proactive?,ooc?}`, `m:` notes, `b:` backlog, `owner`, `seen`
- `wrangler.toml`: KV `REEM_KV`, queue `reem-inbox` (consumer: max concurrency 1, retries 0), cron `*/15 * * * *`.
- `tools/settings-panel.html`: offline settings UI (screenshot/copy changes, export CONFIG_OVERRIDES). Field schema in `SECTIONS`; types: text, textarea, long, list, number, ms, range, bool, select, commands, map, groups, schedule.
- `tools/build-panel.mjs`: rewrites the panel's `const DEFAULTS = …;` line from worker.js CONFIG.
- `tools/test/unit.mjs`, `tools/test/e2e.mjs`, `load-worker.mjs`: tests (load-worker exports internal functions; add new ones to its `EXPORTS`).
- `tools/test/scenarios.mjs`: assertion-based, exits 1 on failure. Part 1 is a table of typical Lunaris (Llama 3 8B) slips → expected delivery (add a row whenever a new slip is seen in the chat); then properties over all of them (no voice in person, no digits spoken, no tags/actions in texts, no leaks saved); scene state; mocked whole conversations (narration before [voice], TTS fallback, in-scene safeguards, OOC mid-scene, LIMITS & OOC sent word for word in every prompt).
- `tools/test/live.mjs`: same situations against the real model (needs `OPENROUTER_API_KEY`; OpenRouter is blocked from Claude's cloud container, so the owner runs it). Reports slips the code fixed, fails if one would still reach him, flags under-18 flirting / fade-outs / acting in OOC for review.

## Gotchas
- History entries saved before v8 have no `at`; texting first only starts after one new exchange.
- Cron runs (every 15 min) must finish within 30 s, so `scheduled` only queues a task; the queue run (up to 15 min) writes the message.
- `clean()` strips `[...]` at line starts except allowed audio tags; `tidySpoken()` strips every other `[...]` (it holds allowed tags in U+E000+ placeholders while tidying).
- eleven_v3: no `<break>` (lines joined with "..."), stability must be 0/0.5/1 (snapped in `voiceSettings`), speaker boost not sent. Tags are only kept when `VOICE.MODEL` starts with `eleven_v3` and `AUDIO_TAGS` is on.
- Format rules live in code (`shapeReply`), the prompt only asks for them. The 8B model will keep slipping; fix new slips there and add a row to scenarios.mjs, rather than only rewording the prompt.
- `texting()` keeps `*word*` mid-sentence as emphasis (≤2 words, text on both sides, not an emote); everything else between asterisks is dropped while apart. While apart, a reply with only *actions* and "quotes" is a scene (she went over to him).
- Reactions only when apart, never when she texts first. A reaction-only reply counts as a full answer in `think`'s repeat check (else it would be retried away); it's saved as `REACTIONS.SAVED`.
- e2e: memory-folding calls get a fixed mock reply (they don't consume scripted `llm` replies). `CONFIG_OVERRIDES` is cached once per run, so tests set `W.CONFIG` directly.
- Telegram reactions accept only its fixed emoji list (e.g. ❤ without FE0F, 🤣 rather than 😂).
- Panel textareas: a leading "\n" is added on purpose (browsers drop the first newline).
- e2e mocks `Date`, `setTimeout` (instant) and `Math.random` (seeded); unit quiet-hour checks use the real clock.
- The ElevenLabs MCP needs the voice description and sample line to come from the owner. They're approved below.
- Free plan: at most 50 outside calls per run (`budget`, `SUBREQUEST_RESERVE`); about 1000 KV writes per day.

## Status and next steps
Voice: owner picked A1, saved as "Reem" (`8SAEKgpGuII5UtUnpuYN`); on eleven_v3 only `stability` 0.5 (Natural) is sent. Real clip checked 2026-10-01: tags performed, not read; no Arabizi digit spoken.
Note: transcribing a TTS node directly in a flow only echoes its prompt; upload the MP3 as an asset to really transcribe it.

v10 done (branch `ccr-75e7610d-6zkheu`): code-side narration guard before [voice], texts/scene/OOC format guards, prompt format + intimacy wording, scenario tests (486 checks) and the live script.
**Open, owner's call:** run `node tools/test/live.mjs` with the OpenRouter key and read the REVIEW lines; merge/deploy (not asked yet). After a deploy, open `/setup`. A `VOICE_ID` Worker secret, if set, overrides `VOICE.ID`: remove it.

**After each step:** run `node tools/build-panel.mjs` (add panel fields), `node tools/test/unit.mjs`, `node tools/test/scenarios.mjs`, `node tools/test/e2e.mjs`, `node --check worker.js`. Commit, push to the session branch, update this file.
Suggested model: Opus for pipeline changes; Sonnet for panel/README/text tweaks.

## Prompt for the next chat (paste as-is)
> Continue the reem-bot project on branch `ccr-75e7610d-6zkheu`. Use /anthropic-skills:lean-session. Read `HANDOFF.md` first and follow its rules exactly: the AI model stays Lunaris 8B (advise only, never change it); `LIMITS & OOC` stays word for word; every tunable goes in `CONFIG`; don't merge, open a PR or deploy unless I ask.
> Continue the reem-bot project from HANDOFF.md. <describe the next change>. Finish with the listed checks, then commit and push.
> Report briefly: what changed, test results, and anything you need from me.
