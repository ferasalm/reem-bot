# HANDOFF — reem-bot

## Goal and status
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (free plan). v8 + v9 are merged to `main` (PR #5) and deployed.
Branch `claude/reem-llm-model-comparison-f27xor` adds the model bench (`tools/model-bench/`, `.github/workflows/model-bench.yml`);
results are in `tools/model-bench/FINDINGS.md`.
**v10 (branch `ccr-b7869b5d-d7yudi`, built on the bench branch): chat + memory switched to DeepSeek V4 Flash.** Tests green,
verified with 2 bench runs (see "v10 bench" below). Not merged, not deployed: owner's call.

## Decisions (owner's rules, don't revisit)
- **Chat model: switch to `deepseek/deepseek-v4-flash`, reasoning off, providers Novita → Baidu → Relace → StreamLake; never Azure, Alibaba, AtlasCloud or DeepInfra** (owner decided 2026-10-01 after the bench, see `tools/model-bench/FINDINGS.md`). The owner decides models; Claude only advises when asked.
- v10 choices (owner, 2026-10-01): memory on DeepSeek too; `allow_fallbacks: false` (all four fail → the reply fails, never another provider); Lunaris as `BACKUP_MODEL`; sampling unchanged (0.95 / min_p 0.1 / 1.05; Novita ignores min_p); prompt fixes (b) [voice] first + tags only in voice, (c) scenes in third person, (d) the act itself, all in NUDGES (SYSTEM_PROMPT untouched). Fix (a) "no *actions* in texts" was **not** picked.
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
  - `callModel` (OpenRouter; `trimCut` → `trimUnfinished`; `backup` → one try with that model after every attempt failed) → `askModel`; `remember` (memory folding)
  - **`openRouterBody(model, messages, sampling)`**: the request. Adds `LLM.PROVIDER` + `LLM.REASONING` only when `model === LLM.MODEL` (so memory on the same model is routed the same; the Lunaris backup isn't). Used by `callModel`, `/setup` (tests model + backup, names the provider that answered) and the bench.
  - `think`'s first call passes `backup: LLM.BACKUP_MODEL`; its repeat-retry and memory folding don't (memory keeps a backlog on failure).
  - timing: `noticeTime` (momentum, schedule delay, long pause), `typingTime` (scene cap), `act`, `sendBubbles`
  - voice: `bodyOf`/`clean` (strip `[voice]` and line-start `[...]` except allowed audio tags), `forSpeech` → `tidySpoken(line, keepTags)` → **`sayArabizi`**, `tts` (`voiceSettings`), `sendVoice`
  - audio tags: `isV3`, `audioTagsOn`, `audioTagRe`, `stripAudioTags` (texts/history never carry tags). `respond` keeps `tagged` for the voice and `body` (no tags) for everything else
  - reactions: `takeReaction`/`reactionEmoji` (parse `[react: X]`, aliases, validate); `respond` rolls `REACTIONS.CHANCE` (→ `NUDGES.REACT`), calls `setMessageReaction` on `reactTo` (his latest message_id, from `reply`)
  - overrides: `applyOverrides`/`mergeSettings` (`CONFIG_OVERRIDES` JSON env var; PRONUNCIATIONS/ARABIZI_DIGITS replaced whole; arrays like `PROVIDER.order` replaced whole; `SAMPLING`, `PROVIDER`, `REASONING` accept new OpenRouter keys)
  - KV keys: `s:<chat>` settings (moreVoice, proactive {day,count}), `h:<chat>` history `{role,content,at,proactive?}`, `m:` notes, `b:` backlog, `owner`, `seen`
- `wrangler.toml`: KV `REEM_KV`, queue `reem-inbox` (consumer: max concurrency 1, retries 0), cron `*/15 * * * *`.
- `tools/settings-panel.html`: offline settings UI (screenshot/copy changes, export CONFIG_OVERRIDES). Field schema in `SECTIONS`; types: text, textarea, long, list, number, ms, range, bool, select, commands, map, groups, schedule.
- `tools/build-panel.mjs`: rewrites the panel's `const DEFAULTS = …;` line from worker.js CONFIG.
- `tools/test/unit.mjs`, `tools/test/e2e.mjs`, `load-worker.mjs`: tests (load-worker exports internal functions; add new ones to its `EXPORTS`).
- `tools/model-bench/bench.mjs`: target **`bot (CONFIG.LLM)`** sends exactly what the bot sends (`W.openRouterBody`), priced at the dearest provider in `PROVIDER.order`; warns if a `PROVIDER` slug isn't listed by OpenRouter. `checks.mjs`: `heatOf` lexicon widened (v2), still a rough sort: read every reply.

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
- Free plan: at most 50 outside calls per run (`budget`, `SUBREQUEST_RESERVE`); about 1000 KV writes per day. A reply can now take 3 OpenRouter calls (2 attempts + backup).
- Provider slugs (OpenRouter tags): novita, baidu, relace, streamlake, azure, alibaba, atlas-cloud, deepinfra.
- e2e `sys()` slices from the first "LIMITS & OOC" (the TOGETHER nudge also names it). e2e forces one memory fold (HISTORY_MAX 4) to check its routing.
- A reply with `[voice]` and an *action* is sent as a text (`respond`), so narration before `[voice]` turns a voice note into a text.
- This cloud environment can't reach openrouter.ai, and `gh run download`/`gh run view --log` are blocked (Azure blob host). Read bench results through the GitHub MCP `get_job_logs` (the workflow prints summary.md + replies.md). Never commit them.
- The bench push trigger only fires when `.github/workflows/model-bench.yml` itself changes (branches: bench branch + `ccr-b7869b5d-d7yudi`).

## v10 bench (2 runs, `--only bot`, full plan, reps 2,3,3; ~$0.010 total, cap $0.03 each)
- Reliability 62/62, all served by Novita; median 2.0–2.3 s, p90 2.3–3.0 s; $0.13–0.20 per 1k replies.
- Safeguard (under 18): 6/6 stopped flirting for good, read by hand (the auto check's 2 FAILs are false positives on "teasing"/"tease").
- Writing: strong, persona details (Mrs Fahmy, Basbousa, Dina, koshary), carries scenes, OOC handled.
- Format, still weak: *actions* in texts in about half (fix (a) not applied); narration before `[voice]` or a missing tag in 3/4 voice-asked replies; a first-person knock scene in 2/4 (c); the tightened nudge wording (run 2) didn't fix (b)/(c).
- Explicitness: L1–L2 sensual, no fade. L3: she still mostly says what she wants; run 2 started the act in 1/3 but never wrote it out. L4: run 1 none, run 2 2/3 explicit. The L3/L4 prompts literally ask "show/tell me what you want", which invites a wants-list.

## Next steps
**Owner's call:** merge/deploy v10 (not asked). After a deploy: `/setup` should show "Model answered (via Novita)" and the Lunaris backup line. Remove a `VOICE_ID` Worker secret if set.
Possible follow-ups (owner decides): fix (a) as a nudge; a code-side guard that drops narration before `[voice]` instead of demoting to text; an L3 scenario that invites the act rather than a list of wants; a guard scenario inside a scene.
Earlier voice work (A1 voice "Reem" `8SAEKgpGuII5UtUnpuYN`, eleven_v3 stability 0.5, real clip checked) is unchanged.

**After each step:** run `node tools/build-panel.mjs` (add panel fields), `node tools/test/unit.mjs`, `node tools/test/e2e.mjs`, `node --check worker.js`. Commit, push to `ccr-b7869b5d-d7yudi`, update this file.
Suggested model: Opus for pipeline changes and reading bench replies; Sonnet for panel/README/text tweaks.
