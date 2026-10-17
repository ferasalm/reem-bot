# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Rebuild (2026-10-15)", the current plan, with paste prompts).

**Last updated:** 2026-10-17 (sixtieth session: Haiku 5.5, `claude-haiku-5-5`, configured and served per the session record; the deploy only;
no subagents, no picture drawn for the chat). Runware this session $0.00.
**DEPLOYED:** `main` = 0444bf2, Deploy run 39001015983 (run_number 59). `dev` = 0444bf2 too, plus this session's record commit (docs only).
**Live Worker:** Version `ea9af634-f77d-49bc-adae-627130662e42`. Rollback: push `6c6c19f` to `main`.
Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers.
Rebuild: 0-4 done and live; 5 = the owner's Telegram check: its slips and the /studio update are now live (deployed this session).
Runware for the Rebuild: about $0.70 of $1.00 (the last counted figure; not re-read this session).

## Live now (main 0444bf2, deployed this session)
- The slips of D1 860-871: "riding up" is no act (`notActs`); belfies: "A photo of her from behind, taken in a tall mirror: the whole frame
  is the reflection" (one woman at 3 seeds); "tights" is a garment, "in tights only" = only the tights, the rest bare (Claude's reading);
  view, photo-type and her name words out of the pose; "her vulva wet and creamy, POV's semen on her bottom"; "braless" (lint passes).
- /studio: Body menu has the v15 side view and current labels; editor defaults = the bot's core (4 steps, CFG 1, "high", Karras, NSFW Unlocked 0.5),
  with a Scheduler field.

## Verified this session
- Deploy run 39001015983: every step success; `/health` drew 54,020 bytes (16.0 s) and Scout described it; `/setup` all ✅ (both read in full from the job log).
- `node tools/check.mjs` 8 of 8 on 0444bf2 before the push. Sync report: only `chat-timeout` (the superseded 60 s DeepSeek change; `dev` has its content).
- Tests run 39001015954 (run_number 705, sync and mocked) on `0444bf2`: `success` (conclusion read from the run).
- Not verified: a reply or picture in Telegram (the owner's check).

## Waiting on the owner
- Telegram check of the deployed slip fixes and /studio: a picture or reply in the bot, and /studio opened from Telegram.
- "tights only" picture: the tights weren't drawn (she came out fully nude) and she held a phone in each hand. Fix next, or leave?
- Is "in tights only" = topless what you meant? (Claude's reading; at /nsfw Off it stays clothed.)
- /studio > References, "Draw the first batch" (~$0.04), approve outfits only.

## Next steps (in order; one chat each)
1. **Read `events`** (D1 `reem-studio`, `SELECT kind, outcome, error, ms, late_ms FROM events`) after the owner's Telegram check; decide timeout/hedging (6 rows so far: wall 17-104 s, model 2-30 s). Sonnet. *Effort: low.*
2. **Tights and the second phone** (if the owner wants): bench "black opaque tights" and one-phone wording at seed 881416599, ≤ $0.02. Opus reads pictures. *Effort: medium.*
3. **Skin (optional):** stronger warm-skin.sh tint if pictures read too fair. Opus reads pictures. *Effort: medium.*
4. **Later:** blurred-face hair candidates; WORKPLAN issue 12 leftovers; studio pictures expire from KV; remove runwarePlan once /face and /health use a spec. Haiku. *Effort: low.*

## Open questions for the owner
- UUID refs (cheaper, a different background at one seed): on or off?
- OK to press Actions > Delete retired branches? Unshallow in the SessionStart hook? A 401/402 ping outside the chat?

## Prompt for the next chat
"Read events from D1 reem-studio and tell me whether her replies time out." Sonnet, effort low.
