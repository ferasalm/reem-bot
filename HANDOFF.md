# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Fix round 2", the current plan).

**Last updated:** 2026-10-13 (forty-fourth session: Opus 5.5, `claude-opus-5-5` per `get_session` `session_context.model` and `last_served_model`; no subagents). The Opus check of F1/F2; the owner's picks: F2 enough, F3 (a), two latency branches; Llama deployed for the owner's test.
**Deployed:** `main` = cabafb8 (Fix round 2 F1, F2, F3 a, her chat on Llama), deploy run 38361955420; see CHANGELOG for the Version ID and /setup. Rollback: push `79daf47` to `main` (Steps A-D, DeepSeek chat, before Fix round 2). Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**Branches:** `ccr-468e83c1-ci51w8` = `chat-llama` = `dev` = `main` (cabafb8). `chat-timeout` (not deployed): the other latency option.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live: her chat on **Llama 3.3 70B fast** (Workers AI, `LLM.CONTEXT_TOKENS` 20000 for its 24k window); memory, /auto and the day plan on DeepSeek V4 Flash (Workers AI); OpenRouter DeepSeek as the backup; voice Sulafat; hearing Gemini; pictures Runware klein 9B (Nude/On) and Cloudflare klein 4B (Off); the Llama picture writer; the Scout anatomy check.
Live since this session (Fix round 2):
- **F1:** a DeepSeek chat gets `LLM.THINK_TOKENS` 700 more room; `LLM.THINKING_MODELS` ["deepseek"] keeps that and the "low" retry off Llama (the writer and her chat keep their own lengths). `LLM.TIMEOUT_MS` 30 s.
- **F2:** `PICTURE.BODY_WORDS` (the owner's list) in every body line. Owner: enough, no Option B.
- **F3 (a):** `PICTURE.ANATOMY.STOP_ON_REPEAT`: the same single mistake on two tries in a row ends the redraws (at most 2 pictures for it).
- **Branch `chat-timeout`** (= the F3 commit 2e0d800 + `LLM.TIMEOUT_MS` 60000, DeepSeek chat): the fallback if Llama isn't good enough. To switch: merge `chat-timeout` into `dev` (keep its LLM.MODEL DeepSeek and CONTEXT_TOKENS 32768: revert 2e193c5's LLM lines), check, deploy.

## Waiting on the owner
- **Your Telegram test of Llama:** her texts, scenes, a voice note, an explicit scene (not covered by the replay), and pictures. Then: keep Llama, or go to `chat-timeout`.
- **Persona body words:** SYSTEM_PROMPT "HOW YOU LOOK" still says "a full bust, soft, narrow, gently sloping shoulders and soft, full arms" and "rounded hips"; your call.
- **Cloudflare half of the body bench** (only matters at /nsfw Off): wait for 00:00 UTC or OK raising `day_neurons`.

## Verified this session
- F1, F2 checked (QUALITY "Opus check"): diffs, probe log line by line, golden by script, 12 pictures at full size.
- Llama replay test.yml 38361339464 (QUALITY): 48/48 answered, 0 broken, no refusal; shorter, plainer replies; "Reem's eyes..." openings.
- `node tools/check.mjs` 8 of 8 at 2e0d800, 2e193c5, cabafb8 and on `chat-timeout`.
- Deploy run 38361955420: see CHANGELOG (Version ID, /health, /setup as read in its log).
- Not verified: the live bot in Telegram (the owner's test); STOP_ON_REPEAT live; explicit scenes on Llama.

## Next steps (in order; one chat each)
1. **After the owner's test:** if Llama is off (too plain, refuses, third person), either tune her prompt for Llama (Opus, medium) or switch to `chat-timeout` (Sonnet, low). Every slip seen goes in `tools/test/scenarios.mjs`. *Effort: medium.*
2. **Llama style slips from the replay:** scenes open with "Reem's eyes..." (her name in third person; DeepSeek wrote "She ..."): a format guard in `shapeReply` if the owner keeps Llama. Sonnet. *Effort: low.*
3. **Cloudflare half of the bench** after 00:00 UTC (face.yml on a session branch). Haiku runs it, Opus reads. *Effort: low.*
4. **Later:** BODY_WORDS copied into each body line instead of built from CONFIG; a REFERENCE_CLOSE bench; Step D's edge strays; `/setup`'s stale Pictures line; VISION.BACKUP_MODEL; old session branches. *Effort: medium.*

## Open questions for the owner
- Llama or `chat-timeout`, after your test.
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? It happened again this session.

## Prompt for the next chat
"Read HANDOFF. I tested Llama in Telegram: <what you saw>. Keep it and fix the slips, or switch to chat-timeout." Pick Opus for tuning, Sonnet for the switch. *Effort: medium.*
