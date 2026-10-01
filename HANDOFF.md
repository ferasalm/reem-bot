# HANDOFF — reem-bot

## Goal and status
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (free plan). v8 ("more human") and v9
(eleven_v3 audio tags + emoji reactions) are pushed to branch `ccr-9d5bc032-5c585q`. **It is not merged to `main`, so it is not deployed** (pushing to `main` deploys via GitHub Actions).
Steps 3 and 4 are done. Step 2 is waiting on the owner's voice pick (see Next steps).

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
  - voice: `bodyOf`/`clean` (strip `[voice]` and line-start `[...]` except allowed audio tags), `forSpeech` → `tidySpoken(line, keepTags)` → **`sayArabizi`**, `tts` (`voiceSettings`), `sendVoice`
  - audio tags: `isV3`, `audioTagsOn`, `audioTagRe`, `stripAudioTags` (texts/history never carry tags). `respond` keeps `tagged` for the voice and `body` (no tags) for everything else
  - reactions: `takeReaction`/`reactionEmoji` (parse `[react: X]`, aliases, validate); `respond` rolls `REACTIONS.CHANCE` (→ `NUDGES.REACT`), calls `setMessageReaction` on `reactTo` (his latest message_id, from `reply`)
  - overrides: `applyOverrides`/`mergeSettings` (`CONFIG_OVERRIDES` JSON env var; PRONUNCIATIONS/ARABIZI_DIGITS replaced whole)
  - KV keys: `s:<chat>` settings (moreVoice, proactive {day,count}), `h:<chat>` history `{role,content,at,proactive?}`, `m:` notes, `b:` backlog, `owner`, `seen`
- `wrangler.toml`: KV `REEM_KV`, queue `reem-inbox` (consumer: max concurrency 1, retries 0), cron `*/15 * * * *`.
- `tools/settings-panel.html`: offline settings UI (screenshot/copy changes, export CONFIG_OVERRIDES). Field schema in `SECTIONS`; types: text, textarea, long, list, number, ms, range, bool, select, commands, map, groups, schedule.
- `tools/build-panel.mjs`: rewrites the panel's `const DEFAULTS = …;` line from worker.js CONFIG.
- `tools/test/unit.mjs`, `tools/test/e2e.mjs`, `load-worker.mjs`: tests (load-worker exports internal functions; add new ones to its `EXPORTS`).

## Gotchas
- History entries saved before v8 have no `at`; texting first only starts after one new exchange.
- Cron runs (every 15 min) must finish within 30 s, so `scheduled` only queues a task; the queue run (up to 15 min) writes the message.
- `clean()` strips `[...]` at line starts except allowed audio tags; `tidySpoken()` strips every other `[...]` (it holds allowed tags in U+E000+ placeholders while tidying).
- eleven_v3: no `<break>` (lines joined with "..."), stability must be 0/0.5/1 (snapped in `voiceSettings`), speaker boost not sent. Tags are only kept when `VOICE.MODEL` starts with `eleven_v3` and `AUDIO_TAGS` is on.
- Reactions only when apart, never when she texts first. A reaction-only reply counts as a full answer in `think`'s repeat check (else it would be retried away); it's saved as `REACTIONS.SAVED`.
- e2e: memory-folding calls get a fixed mock reply (they don't consume scripted `llm` replies). `CONFIG_OVERRIDES` is cached once per run, so tests set `W.CONFIG` directly.
- Telegram reactions accept only its fixed emoji list (e.g. ❤ without FE0F, 🤣 rather than 😂).
- Panel textareas: a leading "\n" is added on purpose (browsers drop the first newline).
- e2e mocks `Date`, `setTimeout` (instant) and `Math.random` (seeded); unit quiet-hour checks use the real clock.
- The ElevenLabs MCP needs the voice description and sample line to come from the owner. They're approved below.
- Free plan: at most 50 outside calls per run (`budget`, `SUBREQUEST_RESERVE`); about 1000 KV writes per day.

## Next steps (approved plan)
**Step 2: voice designs (waiting on the owner).** Previews made with `creative_design_voice` (eleven_ttv_v3) on 2026-10-01:
- A Late-night neighbor: A1 `8SAEKgpGuII5UtUnpuYN`, A2 `uwpbWh6fpTkixJvv7yGU`, A3 `Sv8qJzK2GeUG9doSKzm9`
- B Sharp & bright: the call errored, so no previews. Re-run it only if the owner asks (each call costs credits), with
  description "29-year-old American woman from North Jersey. Clear mid pitch, quick and teasing with a sarcastic edge, a warm easy laugh, confident and flirty, casual phone-call sound."
  and line (en) "Okay so... Basbousa just knocked my coffee off the table. While looking at me. Come over and deal with your new best friend... or are you scared of me?"
- C Velvet: C1 `ZsgOUUgl4bsiemjznim9`, C2 `kJuTqrsxlT2t1jn0fEQ4`, C3 `EZFccgbC0tWgsPDsRsMm`
After the pick: `creative_save_designed_voice` (pass the others as `discarded_voice_ids`) → set `VOICE.ID`/`VOICE.NAME` → `node tools/build-panel.mjs`.
Preview URLs expire after 2 h; `creative_get_voice_design_previews` re-reads them for free. A and C descriptions are in git history (8798bdc).

**Step 3 verification still open:** one real clip (eleven_v3, the chosen voice, tags + Arabizi) transcribed back. Run `forSpeech` on a sample
reply, generate it with `creative_generate_speech` (model eleven_v3, generations_count 1), transcribe with `creative_transcribe_audio`, and confirm no digit is spoken.
The worker's own call (voice_settings incl. `speed`/`style` on v3) is only proven after deploy: check `/setup` (voice test) first.

**After each step:** run `node tools/build-panel.mjs` (add panel fields), `node tools/test/unit.mjs`, `node tools/test/e2e.mjs`, `node --check worker.js`. Commit, push to `ccr-9d5bc032-5c585q`, update this file.
Suggested model: Sonnet is fine for saving the voice and the clip check.

## Prompt for the next chat (paste as-is)
> Continue the reem-bot project on branch `ccr-9d5bc032-5c585q`. Use /anthropic-skills:lean-session. Read `HANDOFF.md` first and follow its rules exactly: the AI model stays Lunaris 8B (advise only, never change it); `LIMITS & OOC` stays word for word; every tunable goes in `CONFIG`; don't merge, open a PR or deploy unless I ask.
> I picked voice <ID>. Save it, set VOICE.ID/NAME, then run the step-3 real-clip check. Finish with the listed checks, then commit and push.
> Report briefly: what changed, test results, and anything you need from me.
