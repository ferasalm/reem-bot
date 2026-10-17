# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Rebuild (2026-10-15)", the current plan, with paste prompts).

**Last updated:** 2026-10-17 (fifty-eighth session: Opus 5.5, `claude-opus-5-5`, configured and served per get_session; no subagents). Runware this session $0.0214.
**`main` = `dev` = ed9e4a2, but NOT live:** the Deploy run (38990832683, run_number 57) failed in 2 s with no runner, like every
Actions run since at least 00:44 UTC (an Actions-level problem, as on 2026-10-16). A retry is scheduled in this chat.
**Live Worker:** still Version `84fd5b01-afce-4290-a78e-2270e08cd51f` = 8d0f79c (v13 bodies, fair olive skin, 165 cm, full bust).
Rollback: push `8d0f79c` to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy"; a hand run of `deploy.yml` on `main` redeploys.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers.
Rebuild: 0-4 done and live → 5 = the owner's Telegram check, then approve candidates in /studio.
Runware for the Rebuild: about $0.67 of $1.00.

## This session (on main, waiting for Actions)
- Bodies v15: originals 23 back, 24 front (full length, cut below the chin), 25/26 side views, 20 clothed; skin warmed to wheatish by `tools/face/warm-skin.sh`.
- Side views: PROFILE_WORDS → `spec.profile` → BODY_SIDES as image 1 (nude, partly dressed, acts); "She is seen from the side, in profile to the lens."
- Words: "wheatish skin", "Petite and softly curvy (158 cm, about 58 kg)", "a medium, natural bust" (was "a full bust").
- `stripPhrases` takes the article with a photo-type phrase ("Standing, a in the bedroom." seen in the check).

## Verified this session
- `node tools/check.mjs` 8 of 8 (new unit rows: side views, the article fix).
- newref-check, 4 pictures read at full size (QUALITY 2026-10-17): the reference build in all four, her face; the side view drew
  three-quarter rather than a clean profile; skin a little warmer, not strongly wheatish under lamp light.
- Not verified: the deploy (Actions down), anything in Telegram.

## Waiting on the owner
- If Actions stays down: GitHub > Settings > Billing (Actions minutes or spending limit) and githubstatus.com; then Actions > Deploy to Cloudflare > Run workflow on `main`.
- Earlier: /studio > References, "Draw the first batch" (~$0.04), approve outfits only. Do not send `/restart`.

## Next steps (in order; one chat each)
1. **Finish the deploy** once Actions runs: hand-run `deploy.yml` on `main`, read the log's Version ID, `/health` and `/setup`. Haiku. *Effort: low.*
2. **Step 5:** the owner's Telegram check of pictures and replies (new bodies, petite); read D1 `events`/`pictures` for slips. Haiku. *Effort: low.*
3. **Side views (optional):** a clean profile drew three-quarter: try "her whole body turned sideways" wording, 2 seeds, ≤ $0.03. Opus reads pictures. *Effort: medium.*
4. **Read `events`** after some use; decide hedging/timeout. Sonnet. *Effort: low.*
5. **Later:** WORKPLAN issue 12 leftovers; studio pictures expire from KV; `logSent` sizes; remove runwarePlan once /face and /health use a spec. Haiku. *Effort: low.*

## Open questions for the owner
- Skin in pictures is only a little warmer: want a stronger warm tint on the body pictures?
- UUID refs (cheaper, a different background at one seed): on or off?
- OK to press Actions > Delete retired branches? Unshallow in the SessionStart hook? A 401/402 ping outside the chat?

## Prompt for the next chat
"Next step 1 from HANDOFF.md: finish the deploy." Haiku, effort low.
