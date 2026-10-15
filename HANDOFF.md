# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Fix round 2", the current plan).

**Last updated:** 2026-10-15 (forty-seventh session: Opus 5.5, `claude-opus-5-5`, the configured model; no subagents). The v12 face and bodies deployed; the second body set (v13) on `dev`, not deployed.
**Deployed:** `main` = e0e78ac (new face 13 + v12 bodies, her chat on DeepSeek at 60 s), run 38674596701, Version ID `b38605e3-2bd8-4c13-a778-328125822737` (was `84535994-…`). Rollback: push `2c18113` to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**On `dev`:** the v13 bodies (originals 17-19: black bra + briefs, nude back, nude front with a natural bush) and their words. Not deployed.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live now: her chat on DeepSeek V4 Flash (Workers AI) with a 60 s limit, `LLM.THINK_TOKENS` 700 and `LLM.CONTEXT_TOKENS` 32768; memory, /auto and the day plan on DeepSeek; OpenRouter DeepSeek as the backup; voice Sulafat; hearing Gemini; pictures Runware klein 9B (Nude/On) and Cloudflare klein 4B (Off); the Llama picture writer and /look; the Scout anatomy check (`STOP_ON_REPEAT`); `PICTURE.BODY_WORDS`.
Known cost of this choice (cf-probe 3d1ab33, 38357963015): DeepSeek answers in 4-6 s or 33-48 s; about a third of replies may still take over 30 s; 60 s catches most of them, but a slow one means a long wait in Telegram.

## Waiting on the owner
- **Deploy the v13 bodies?** Say "deploy" when you've looked at the four check pictures (sent in chat; QUALITY). It brings back the natural bush and the 65 kg / soft belly / natural bust words.
- **Telegram test of DeepSeek at 60 s** (live now): tell Claude fine, too slow, or cut.
- **Cloudflare half of the body bench** (only matters at /nsfw Off): wait for 00:00 UTC or OK raising `day_neurons`.
- Do not send `/restart` (the `/setup` page says to; it wipes her memory).

## Verified this session
- Deploy run 38674596701: every step success; `/health` ok (klein 4B drew, Scout described) and `/setup` all ✅, read in the job log; `git ls-remote`: main = e0e78ac.
- v12 set (deployed) and v13 set (`dev`): each built from the owner's pictures with the chin cut off; words matched; `node tools/check.mjs` 8 of 8; golden plans rewritten after a substitution diff showed only the intended changes.
- Runware check pictures through the bot's own code, read at full size: v12 four ($0.0234), v13 four ($0.0276): dressed when clothed (also on the nude back), bush/shaved as the picture. Likeness not measured.
- Not verified: Cloudflare klein (/nsfw Off) with the new `body.jpg`; the bot in Telegram.

## Next steps (in order; one chat each)
1. **Deploy** the v13 bodies when the owner says "deploy" (`git push origin origin/dev:main`, then read the deploy log, /health, /setup). Haiku. *Effort: low.*
2. **The owner's Telegram test** of DeepSeek at 60 s: no chat needed; the owner reports fine, too slow, or cut replies. *Effort: low.*
3. **If still too slow:** shorter `THINK_TOKENS`, a faster model, or back to Llama (`chat-llama`) with the "Reem's eyes..." guard. Opus decides. *Effort: medium.*
4. **Llama style slips** (only if Llama returns): "Reem's eyes..." openings: a format guard in `shapeReply`. Sonnet. *Effort: low.*
5. **Cloudflare half of the bench** after 00:00 UTC (face.yml on a session branch), now with the new `body.jpg` at /nsfw Off. Haiku runs it, Opus reads. *Effort: low.*
6. **Later:** BODY_WORDS copied into each body line instead of built from CONFIG; a REFERENCE_CLOSE bench; Step D's edge strays; `/setup`'s stale Pictures line; VISION.BACKUP_MODEL; old session branches. *Effort: medium.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? This session it showed 51 false "work not here" branches on a shallow clone.

## Prompt for the next chat
"Read HANDOFF. Deploy v13 if I said so; the owner's Telegram test of DeepSeek at 60 s says: <fine / too slow / cut replies>. Do step 2 if it is slow, else stop." Opus. *Effort: medium.*
