# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds the fix round and its review, "Fix round review (Opus)").

**Last updated:** 2026-10-11 (thirty-seventh session: Sonnet 5.5, `claude-sonnet-5-5` per `get_session` `session_context.model` and `last_served_model`. The deploy of the fix round.)
**Deployed:** `main` = b42cac1 (Steps 1-7 + the fix round). Deploy run 38173924557 and Tests 38173924502 green; Version ID `b9d09df9-efbe-4163-aa8c-1eb392bc17d1`. Rollback if ever needed: push `d21c4b3` to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**Branch:** `ccr-1bb1b4a8-2jsqby` (pushed), and `dev` = the same commit (the shared branch). `dev` is only docs commits ahead of `main`.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live (`main`): texts, memory, /auto on DeepSeek V4 Flash; voice Sulafat; hearing Gemini; pictures on Runware klein 9B with her face, body and place; /nsfw; /studio; and, since this deploy, the fix round:
- **A. /studio from a link:** the first visit answers the page with a `SameSite=Lax` cookie (it was a 302 with a Strict cookie: 404 from Telegram).
- **B. /nsfw Off draws on Cloudflare** (`NSFW.OFF_ROUTE`): klein with her face, the clothed body and the place, filter words and SAFE; lingerie allowed; never Runware, Nano Banana or TwinFlow. Nude and On unchanged.
- **C. A top and no bottom** on the nude body: `RUNWARE.DRESSED_BOTTOM`, not on outfits that name a bottom it didn't know or show her legs on purpose (`BARE_LEGS_WORDS`).
- **D. Body audit:** read; no body setting changes (WORKPLAN "Fix round review", point 4).

## Verified this session
- `node tools/check.mjs` 8 of 8 ok before the push; fast-forward `d21c4b3` → `b42cac1`; both runs read via the GitHub MCP.
- Deploy log read: every step success; `/health` ok (Cloudflare klein drew 60,871 bytes in 24.3 s, the vision model described it); `/setup` all ✅, its Pictures line says "at /nsfw Off: Cloudflare klein"; Runware about $0.06 of $1.00 today. The only failed call shown is the old Runware "200: no picture" of 09/10 22:04 Boston time.
- Not checked live: /studio opened from Telegram, Off on Cloudflare in the real bot, a Runware picture after this deploy (the owner's test below).

## Waiting on the owner
- Telegram test: (a) `/studio`, then open the link from the chat: the Log page opens. (b) `/nsfw` Off, then a clothed picture of her and a lingerie one: both from Cloudflare. (c) On and Nude unchanged. (d) If she still looks slimmer, say which pictures (the studio log shows each one's references). Do not send `/restart` (it wipes her memory).

## Next steps (in order; one chat each)
1. **Owner's Telegram test** (above). If /studio or Off misbehaves, say what you see. *Effort: low.*
2. **Later** (Opus to diagnose, Haiku to draw): nipples through fitted tops (seed 202 tank, the olive cami) with Step 5's open questions; fuller arms only through the body picture (owner's pick); the Step 7 deviations (WORKPLAN, "Decided in review"); the porch_night crop; a frontal anal LoRA for missionary; the second head on riding; hair drifting to brown highlights; the blowjob arms; Flux 4 Play tongue weight; `/look`'s DeepSeek answers; a cheaper text model; old session branches. *Effort: medium.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? (The report lists ~35 old session branches as "not here" on a shallow clone; this session did not run it. Those branches are old work already on or superseded by `dev`; no one has confirmed that, so nothing was changed.)
- Old session branches still hold the old pictures in their history. Clear them, or leave them?
- Settled this session: records carry both the model name and the raw model ID (DECISIONS, 2026-10-11, last entry before the deploy record).

## Prompt for the next chat
None needed: the owner's Telegram test, then any later work in a new chat. *Effort: low.*
