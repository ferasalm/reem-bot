# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Rebuild (2026-10-15)", the current plan, with paste prompts).

**Last updated:** 2026-10-16 (fifty-seventh session: Sonnet 5.5, `claude-sonnet-5-5`, configured and served per get_session; no subagents). $0 Runware this session.
**Rebuild Step 4 finished and DEPLOYED.** `main` = 8d0f79c; the deploy failed at start at first (an Actions outage), then ran by hand: run 38855045063, green.
**Live Worker:** Version `84fd5b01-afce-4290-a78e-2270e08cd51f` = 8d0f79c (Steps 2, 3b, 4). `/health` ok, `/setup` all ✅.
Rollback: push `c652eb3` (Step 1; Version `649f169d`) to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live: still the old prompts (Step 1 code).
Rebuild: 0-4 done and live (Telegram check pending) → 5 = the owner's Telegram check, then approve candidates in /studio.
Runware for the Rebuild: $0.651 of $1.00.

## This session (Step 4 finish)
- Bug found by the new browser check: the studio References tab sent `base: ""` on the first "Draw a candidate" ("Pick a base picture.") → defaults to her face now.
- `tools/test/studio-refs.mjs` (Playwright 390 px, 14 checks): cards stack picture over text, no side scroll, Approve/Reject/make/batch send the right requests, no console errors.
- studio.mjs: /pic's own steps with an approved outfit in a local catalog → face, then the outfit as image 1 (not the body picture), lint green, request carries it.
- Not done (paid, optional): blurred-face hair bench, a fuller body reference. Hair candidates stay unapproved (they carry a full face).

## Verified this session
- `node tools/check.mjs` 8 of 8 (studio 55 rows, golden plans unchanged). Playwright 14 of 14 at 390 px.
- Not verified: the References tab on the live Worker, a UUID's life over days (off), an approved outfit drawn on Runware (stubbed only).

## Waiting on the owner
- Open /studio > References, press "Draw the first batch" (~$0.04), approve outfits only. Do not send `/restart`.

## Next steps (in order; one chat each)
1. **Step 5:** the owner's Telegram check of pictures and replies on the new code; read D1 `events`/`pictures` for slips. Haiku. *Effort: low.*
2. **Step 4 extras (optional):** blurred-face hair candidates; a fuller body reference that works. Sonnet builds, Opus reads pictures. ≤ $0.15. *Effort: medium.*
3. **Read `events`** after some use; decide hedging/timeout. Sonnet. *Effort: low.*
4. **Later:** WORKPLAN issue 12 leftovers; studio pictures expire from KV; `logSent` sizes; remove runwarePlan once /face and /health use a spec. Haiku. *Effort: low.*

## Open questions for the owner
- UUID refs (cheaper, a different background at one seed): on or off?
- Runware's "today" window read $2.72 before Step 3 (the bot's cap is $1/day): worth a look at Runware's usage page.
- OK to press Actions > Delete retired branches? Unshallow in the SessionStart hook? A 401/402 ping outside the chat?

## Prompt for the next chat
"Step 5 from HANDOFF.md: check the live bot." Haiku, effort low.
