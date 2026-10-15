# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Fix round 2", the current plan).

**Last updated:** 2026-10-15 (forty-seventh session: Opus 5.5, `claude-opus-5-5`, the configured model; no subagents). The owner's new face and bodies, on `dev`, not deployed.
**Deployed:** `main` = 2c18113 (her chat on **DeepSeek**), Version ID `84535994-ab66-402c-80d9-6f2c5d39e3fc`. Rollback: push `cabafb8` to `main` (Llama). Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**On `dev`:** this session's commit on top of 2c18113: the new reference set (face 13, bodies 14-16) and her words matched to it. Not deployed.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live now: her chat on DeepSeek V4 Flash (Workers AI) with a 60 s limit, `LLM.THINK_TOKENS` 700 and `LLM.CONTEXT_TOKENS` 32768; memory, /auto and the day plan on DeepSeek; OpenRouter DeepSeek as the backup; voice Sulafat; hearing Gemini; pictures Runware klein 9B (Nude/On) and Cloudflare klein 4B (Off); the Llama picture writer and /look; the Scout anatomy check (`STOP_ON_REPEAT`); `PICTURE.BODY_WORDS`.
Known cost of this choice (cf-probe 3d1ab33, 38357963015): DeepSeek answers in 4-6 s or 33-48 s; about a third of replies may still take over 30 s; 60 s catches most of them, but a slow one means a long wait in Telegram.

## Waiting on the owner
- **Deploy the new face and bodies?** Say "deploy" to put them live (the DeepSeek chat test still applies: it ships with them, unchanged).
- **Telegram test of DeepSeek at 60 s:** the first live check of her replies. Tell Claude: fine, too slow, or cut.
- **Cloudflare half of the body bench** (only matters at /nsfw Off): wait for 00:00 UTC or OK raising `day_neurons`.
- Do not send `/restart` (the `/setup` page says to; it wipes her memory).

## Verified this session
- New references: face = original 13 cut square; bodies 14 (clothed, lace bra + panties), 15 (nude back), 16 (nude front), chin cut off each (read at full size). Clothed back views use the nude back (owner).
- Words matched (owner's picks): no "full arms", hazel-green eyes, persona build ~62 kg with a medium bust, shaved. `grep` finds no "amber", "full arms", "71 kg" or "untrimmed" left in `worker.js`.
- `node tools/check.mjs` 8 of 8; golden plans rewritten after a substitution diff showed only the intended changes.
- Four Runware pictures through the bot's own code ($0.0234), each read at full size: clothed front, clothed back on the nude back (dressed, nothing bare), nude front (shaved), nude back. Likeness not measured.
- Not verified: Cloudflare klein (/nsfw Off) with the new `body.jpg`; the bot in Telegram.

## Next steps (in order; one chat each)
1. **Deploy** the new face and bodies when the owner says "deploy" (`git push origin origin/dev:main`, then read the deploy log, /health, /setup). Haiku. *Effort: low.*
2. **The owner's Telegram test** of DeepSeek at 60 s: no chat needed; the owner reports fine, too slow, or cut replies. *Effort: low.*
3. **If still too slow:** shorter `THINK_TOKENS`, a faster model, or back to Llama (`chat-llama`) with the "Reem's eyes..." guard. Opus decides. *Effort: medium.*
4. **Llama style slips** (only if Llama returns): "Reem's eyes..." openings: a format guard in `shapeReply`. Sonnet. *Effort: low.*
5. **Cloudflare half of the bench** after 00:00 UTC (face.yml on a session branch), now with the new `body.jpg` at /nsfw Off. Haiku runs it, Opus reads. *Effort: low.*
6. **Later:** BODY_WORDS copied into each body line instead of built from CONFIG; a REFERENCE_CLOSE bench; Step D's edge strays; `/setup`'s stale Pictures line; VISION.BACKUP_MODEL; old session branches. *Effort: medium.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? This session it showed 51 false "work not here" branches on a shallow clone.

## Prompt for the next chat
"Read HANDOFF. Deploy if I said so; the owner's Telegram test of DeepSeek at 60 s says: <fine / too slow / cut replies>. Do step 2 if it is slow, else stop." Opus. *Effort: medium.*
