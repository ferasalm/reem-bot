# HANDOFF — reem-bot

## Goal and status
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (free plan). v8 + v9 are merged to `main` (PR #5) and deployed.
Branch `claude/reem-llm-model-comparison-f27xor` adds the model bench (`tools/model-bench/`, `.github/workflows/model-bench.yml`);
results are in `tools/model-bench/FINDINGS.md`. **Next: switch the chat model to DeepSeek V4 Flash** (owner's decision, see below).

## Decisions (owner's rules, don't revisit)
- **Chat model: switch to `deepseek/deepseek-v4-flash`, reasoning off, providers Novita → Baidu → Relace → StreamLake; never Azure, Alibaba, AtlasCloud or DeepInfra** (owner decided 2026-10-01 after the bench, see `tools/model-bench/FINDINGS.md`). Memory model: owner's call. The owner decides models; Claude only advises when asked.
- **Model bench**: runs only in GitHub Actions (the key is a GitHub secret, not in Claude's cloud environment). A push of `.github/workflows/model-bench.yml` runs it with `PUSH_ARGS`/`PUSH_BUDGET` from that file; read results with `gh run download <id> -n model-bench-results`. Always keep a hard `--budget` cap the owner approved. Results can be explicit: never commit them, describe them in summary terms.
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
Steps 2–4 are done. Voice: owner picked A1, saved as "Reem" (`8SAEKgpGuII5UtUnpuYN`); B was never generated (owner said don't).
On eleven_v3 only `stability` is sent (owner: v3 has Creative/Natural/Robust and no speed/style); keep 0.5 (Natural), which is what A1 was made with.
Real clip checked 2026-10-01 (v3, Reem voice, [laughs]/[whispers] + Arabizi), uploaded and transcribed with Scribe:
"Okay, Yani Basbousa is a menace. Habibi, come over. Khalas, I miss you. It is 3:00 AM, and I am wide awake". Tags performed, not read; no Arabizi digit spoken.
Note: transcribing a TTS node directly in a flow only echoes its prompt; upload the MP3 as an asset to really transcribe it.

**Open, owner's call:** merge/deploy (not asked yet). After a deploy, open `/setup` to confirm the voice test passes with the new voice. A `VOICE_ID` Worker secret, if set, overrides `VOICE.ID`: remove it.

**After each step:** run `node tools/build-panel.mjs` (add panel fields), `node tools/test/unit.mjs`, `node tools/test/e2e.mjs`, `node --check worker.js`. Commit, push to `ccr-9d5bc032-5c585q`, update this file.
Suggested model: Opus for pipeline changes; Sonnet for panel/README/text tweaks.
