# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Fix round 2", the current plan).

**Last updated:** 2026-10-13 (forty-sixth session: Haiku 5.5, per `get_session` `session_context.model` and `last_served_model`; no subagents). The owner said "Deploy": her chat on DeepSeek with a 60 s limit is live on `main`.
**Deployed:** `main` = 2c18113 (her chat on **DeepSeek**), deploy run 38365240367, Version ID `84535994-ab66-402c-80d9-6f2c5d39e3fc` (was `8095dafd-3991-4889-9d49-265a796d0c8c`). Rollback: push `cabafb8` to `main` (her chat back on Llama). Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**On `dev`:** 2c18113 (= `main`) plus this session's docs-only records commit; not deployed, no code change. Branch `chat-llama` (= cabafb8) keeps the Llama version; `chat-timeout` is the older base of the same switch.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live now: her chat on DeepSeek V4 Flash (Workers AI) with a 60 s limit, `LLM.THINK_TOKENS` 700 and `LLM.CONTEXT_TOKENS` 32768; memory, /auto and the day plan on DeepSeek; OpenRouter DeepSeek as the backup; voice Sulafat; hearing Gemini; pictures Runware klein 9B (Nude/On) and Cloudflare klein 4B (Off); the Llama picture writer and /look; the Scout anatomy check (`STOP_ON_REPEAT`); `PICTURE.BODY_WORDS`.
Known cost of this choice (cf-probe 3d1ab33, 38357963015): DeepSeek answers in 4-6 s or 33-48 s; about a third of replies may still take over 30 s; 60 s catches most of them, but a slow one means a long wait in Telegram.

## Waiting on the owner
- **Telegram test of DeepSeek at 60 s:** the first live check of her replies. Tell Claude: fine, too slow, or cut.
- **Persona body words:** SYSTEM_PROMPT "HOW YOU LOOK" still says "a full bust, soft, narrow, gently sloping shoulders and soft, full arms" and "rounded hips"; your call.
- **Cloudflare half of the body bench** (only matters at /nsfw Off): wait for 00:00 UTC or OK raising `day_neurons`.
- Do not send `/restart` (the `/setup` page says to; it wipes her memory).

## Verified this session
- `node tools/check.mjs` 8 of 8 on `dev` (2c18113) before the push.
- Sync: the SessionStart report listed 51 branches with "work not here", all from the shallow clone. After `git fetch --unshallow origin`, `node tools/sync-check.mjs` reads "No other branch has work missing here". A patch count (`git cherry`) agrees: only retired branches, `face-candidates` (pictures) and the superseded `chat-timeout` commit differ.
- Push: `origin/dev` fast-forwarded into `main` (cabafb8..2c18113, no force); `git ls-remote` shows main = dev = 2c18113.
- Deploy run 38365240367: every step success; `/health` ok and `/setup` all ✅ with the chat row on DeepSeek, both read in the job log.
- Tests run 38365240396: sync and mocked success; live skipped (no `[live]` in the commit).
- Not verified: the bot in Telegram; DeepSeek replies at 60 s; a picture after this deploy. `/setup`'s Pictures line is stale: it still says "then Cloudflare klein" for Nude and On.

## Next steps (in order; one chat each)
1. **The owner's Telegram test** of DeepSeek at 60 s: no chat needed; the owner reports fine, too slow, or cut replies. *Effort: low.*
2. **If still too slow:** shorter `THINK_TOKENS`, a faster model, or back to Llama (`chat-llama`) with the "Reem's eyes..." guard. Opus decides. *Effort: medium.*
3. **Llama style slips** (only if Llama returns): "Reem's eyes..." openings: a format guard in `shapeReply`. Sonnet. *Effort: low.*
4. **Cloudflare half of the bench** after 00:00 UTC (face.yml on a session branch). Haiku runs it, Opus reads. *Effort: low.*
5. **Later:** BODY_WORDS copied into each body line instead of built from CONFIG; a REFERENCE_CLOSE bench; Step D's edge strays; `/setup`'s stale Pictures line; VISION.BACKUP_MODEL; old session branches. *Effort: medium.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? This session it showed 51 false "work not here" branches on a shallow clone.

## Prompt for the next chat
"Read HANDOFF. The owner's Telegram test of DeepSeek at 60 s says: <fine / too slow / cut replies>. Do step 2 if it is slow, else stop." Opus. *Effort: medium.*
