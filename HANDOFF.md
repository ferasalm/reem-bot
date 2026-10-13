# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Fix round 2", the current plan).

**Last updated:** 2026-10-13 (forty-second session: Opus 5.5, `claude-opus-5-5` per `get_session` `session_context.model` and `last_served_model`; two subagents on Opus 5.5 `claude-opus-5-5` per their transcripts. Diagnosis and plan only; no bot code changed.)
**Deployed:** `main` = 79daf47 (Steps A-D), Version ID `4f30ebfd-6bbe-406b-9fa5-f4003830b6f0`. Rollback if ever needed: push `b42cac1` to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**Branch:** `claude/reem-agent-fixes-upgqr1` (pushed), and `dev` = the same commit (docs + the cf-probe script only, ahead of `main`).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live: texts, memory, /auto on DeepSeek V4 Flash (Workers AI); voice Sulafat; hearing Gemini; pictures on Runware klein 9B (Nude/On only there), /nsfw Off on Cloudflare klein 4B; the Llama picture writer and the Scout anatomy check (Steps C, D).
The owner reported three problems after the deploy. Diagnosis and plan are in WORKPLAN "Fix round 2":
- **Short, cut replies and "wifi died":** not the deploy's code. Workers AI's DeepSeek now thinks even at reasoning "none". The thinking counts in max_tokens, so at TEXT 220 her replies came back cut or empty in 3 of 3 calls (cf-probe run 38355964346, QUALITY). Fix F1: + `LLM.THINK_TOKENS` 700 on chat replies, `LLM.TIMEOUT_MS` 30 s.
- **Her body not full enough:** replace every "not slimmer: the same full bust, full upper arms and soft body" with one `PICTURE.BODY_WORDS` (the owner's list: narrow shoulders, wide low hips, full arms, tapered waist, big bubbly bottom, curves), then a ≤ $0.10 bench (F2). Option B, fuller body pictures, comes later if needed.
- **Picture cost:** one picture costs the same as before. Step D's redraws (up to 3 paid pictures) add about 18%. One /look was paid 3 times for a likely false "2 heads" (Scout infers the man on POV). Options F3 (a), (b) and (c) wait on the owner.

## Verified this session
- cf-probe run 38355964346: every line read; the table is in QUALITY. Caveat: two other probe runs were going at the same time, so some of the slow calls may be load. The pattern (thinking inside max_tokens) holds in every call.
- `node tools/check.mjs` 8 of 8 before the push.
- The subagents' findings (cost from D1 `reem-studio` and the deployed code, the body-line sweep) were checked against worker.js lines `drawPicture` ~4561-4605 and `anatomyCheck` ~5026. They were not re-queried.

## Waiting on the owner
- **F3, the redraw cost:** (a) stop redrawing when a try has the same single mistake as the try before it, (b) `ANATOMY.TRIES` 2, or (c) leave it.
- **F2's route:** words first (recommended) or fuller body pictures (Option B).
- The Telegram test of Steps A-D is still useful after F1 (replies now break the chat).

## Next steps (in order; one chat each)
1. **Build Fix round 2, F1 + F2**: paste WORKPLAN "Fix round 2" → "Haiku prompt". Haiku 5.5. *Effort: high.*
2. **Opus check of F1/F2 and the body bench pictures**: the "Opus check prompt" there. Opus. *Effort: medium.*
3. **Deploy F1** once checked (owner says "deploy"): her replies are broken live until then. F1 alone could go first. Sonnet. *Effort: low.*
4. **Later**: Step D's edge strays; `/setup`'s stale Pictures line; VISION.BACKUP_MODEL (Gemma 3 12B "not allowed"); old session branches. *Effort: medium.*

## Open questions for the owner
- F3 and F2's route (above).
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? (~40 old branches show as "not here" on a shallow clone.)

## Prompt for the next chat
Paste the "Haiku prompt" of WORKPLAN "Fix round 2" (pick Haiku 5.5). *Effort: high.*
