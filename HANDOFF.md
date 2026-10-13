# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Fix round 2", the current plan).

**Last updated:** 2026-10-13 (forty-fifth session: Sonnet 5.5, `claude-sonnet-5-5` per `get_session` `session_context.model` "sonnet" and `last_served_model`; no subagents). The owner chose chat-timeout (DeepSeek) after testing Llama; applied on `dev`, not deployed.
**Deployed:** `main` = cabafb8 (Fix round 2 + her chat on **Llama**), deploy run 38361955420, Version ID `8095dafd-3991-4889-9d49-265a796d0c8c`. Rollback: push `79daf47` to `main` (before Fix round 2). Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**On `dev` (not deployed):** cabafb8 + the switch: her chat on DeepSeek (`LLM.MODEL`, `CONTEXT_TOKENS` 32768, `LLM.TIMEOUT_MS` 60000). Branch `chat-llama` (= cabafb8) keeps the Llama version; `chat-timeout` is the older base of the same idea (not needed any more).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. On `dev`: her chat on DeepSeek V4 Flash (Workers AI) with a 60 s limit and `LLM.THINK_TOKENS` 700; memory, /auto and the day plan on DeepSeek; OpenRouter DeepSeek as the backup; voice Sulafat; hearing Gemini; pictures Runware klein 9B (Nude/On) and Cloudflare klein 4B (Off); the Llama picture writer and /look; the Scout anatomy check (`STOP_ON_REPEAT`); `PICTURE.BODY_WORDS`. **Live right now is still Llama** until the deploy.
Known cost of this choice (cf-probe 3d1ab33, 38357963015): DeepSeek answers in 4-6 s or 33-48 s; about a third of replies may still take over 30 s; 60 s catches most of them but a slow one means a long wait in Telegram.

## Waiting on the owner
- **"Deploy"** to put DeepSeek + 60 s on `main` (the Llama version stays on `chat-llama`).
- **Persona body words:** SYSTEM_PROMPT "HOW YOU LOOK" still says "a full bust, soft, narrow, gently sloping shoulders and soft, full arms" and "rounded hips"; your call.
- **Cloudflare half of the body bench** (only matters at /nsfw Off): wait for 00:00 UTC or OK raising `day_neurons`.

## Verified this session
- `node tools/check.mjs` 8 of 8 on `dev` + the switch. The three CONFIG lines compared against `origin/chat-timeout` (only `reasoning_effort` differs: `dev` keeps `task && thinks`, which is the same for DeepSeek).
- Not verified: the live bot after a deploy; replies on DeepSeek at 60 s in Telegram.

## Next steps (in order; one chat each)
1. **Deploy** when the owner says so (`git push origin origin/dev:main`), then read the deploy run, /health and /setup (chat model row on DeepSeek). Sonnet. *Effort: low.*
2. **After the owner's Telegram test of DeepSeek 60 s:** if still too slow, options: shorter `THINK_TOKENS`, a faster model, or back to Llama (`chat-llama`) with the "Reem's eyes..." guard. Opus decides. *Effort: medium.*
3. **Llama style slips** (only if Llama returns): "Reem's eyes..." openings: a format guard in `shapeReply`. Sonnet. *Effort: low.*
4. **Cloudflare half of the bench** after 00:00 UTC (face.yml on a session branch). Haiku runs it, Opus reads. *Effort: low.*
5. **Later:** BODY_WORDS copied into each body line instead of built from CONFIG; a REFERENCE_CLOSE bench; Step D's edge strays; `/setup`'s stale Pictures line; VISION.BACKUP_MODEL; old session branches. *Effort: medium.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report?

## Prompt for the next chat
"Read HANDOFF. Deploy dev to main (DeepSeek, 60 s)." Sonnet. *Effort: low.*
