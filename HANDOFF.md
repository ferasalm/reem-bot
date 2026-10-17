# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Rebuild (2026-10-15)", the current plan, with paste prompts).

**Last updated:** 2026-10-17 (fifty-eighth session: Opus 5.5, `claude-opus-5-5`, configured and served per get_session; no subagents). $0 Runware this session.
**On `dev`, not deployed:** new body pictures (v14) and "wheatish skin".
**Live Worker:** Version `84fd5b01-afce-4290-a78e-2270e08cd51f` = `main` 8d0f79c (Rebuild Steps 2, 3b, 4; v13 bodies, fair olive skin).
Rollback: push `c652eb3` (Step 1; Version `649f169d`) to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers.
Rebuild: 0-4 done and live → 5 = the owner's Telegram check, then approve candidates in /studio.
Runware for the Rebuild: $0.651 of $1.00.

## This session (v14 bodies, wheatish skin; dev only)
- Owner's three pictures = originals 20 (black bra + briefs), 21 (nude back), 22 (nude front); 17-19 deleted. Already faceless, resized to 576 wide.
- `RUNWARE.BODY` "v14", `BODY_BACK` / `BODY_CLOTHED_BACK` "v14-back", `BODY_CLOTHED` "v14-clothed"; `assets/face.js` rebuilt.
- "fair olive skin" → "wheatish skin" in SYSTEM_PROMPT, persona picture lines, the writer's JSON example; lint knows "wheatish".
- The frames core (live path) names no skin or body words, so on her pictures the new tone comes from the references only.

## Verified this session
- `node tools/check.mjs` 8 of 8; golden plans changed only by the body names (v13 → v14).
- Not verified: any picture drawn with the new bodies (no Runware spent).

## Waiting on the owner
- Deploy the v14 bodies + wheatish skin? (say "deploy").
- The new body pictures are lighter (pinkish fair) than "wheatish": her face picture (13) and the bodies set the tone in pictures, not the words.
  Want a wheatish redraw of the body pictures, or keep them as they are?
- Her persona still says about 65 kg; the new bodies look fuller. Change it?
- Earlier: open /studio > References, "Draw the first batch" (~$0.04), approve outfits only. Do not send `/restart`.

## Next steps (in order; one chat each)
1. **Check the v14 bodies** (optional, ≤ $0.03): 4 pictures (clothed front, clothed back, nude front, nude back) through the bot's own code, read at full size. Opus reads pictures. *Effort: medium.*
2. **Step 5:** the owner's Telegram check of pictures and replies; read D1 `events`/`pictures` for slips. Haiku. *Effort: low.*
3. **Step 4 extras (optional):** blurred-face hair candidates; a fuller body reference. Sonnet builds, Opus reads pictures. ≤ $0.15. *Effort: medium.*
4. **Read `events`** after some use; decide hedging/timeout. Sonnet. *Effort: low.*
5. **Later:** WORKPLAN issue 12 leftovers; studio pictures expire from KV; `logSent` sizes; remove runwarePlan once /face and /health use a spec. Haiku. *Effort: low.*

## Open questions for the owner
- UUID refs (cheaper, a different background at one seed): on or off?
- Runware's "today" window read $2.72 before Step 3 (the bot's cap is $1/day): worth a look at Runware's usage page.
- OK to press Actions > Delete retired branches? Unshallow in the SessionStart hook? A 401/402 ping outside the chat?

## Prompt for the next chat
"Deploy" (if wanted), then "Step 5 from HANDOFF.md: check the live bot." Haiku, effort low.
