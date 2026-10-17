# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Rebuild (2026-10-15)", the current plan, with paste prompts).

**Last updated:** 2026-10-17 (fifty-eighth session: Opus 5.5, `claude-opus-5-5`, configured and served per get_session; no subagents). Runware: one failed check call (see below).
**On `dev`, not deployed:** v15 bodies (full-length front/back, two side views, skin warmed to wheatish), side-view code, "wheatish skin" and "petite, 158 cm, about 58 kg" in her words.
**Live Worker:** Version `84fd5b01-afce-4290-a78e-2270e08cd51f` = `main` 8d0f79c (Rebuild Steps 2, 3b, 4; v13 bodies, fair olive skin, 165 cm).
Rollback: push `c652eb3` (Step 1; Version `649f169d`) to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers.
Rebuild: 0-4 done and live → 5 = the owner's Telegram check, then approve candidates in /studio.
Runware for the Rebuild: $0.651 of $1.00 (plus whatever the failed call below cost).

## This session (dev only)
- Bodies v15: originals 23 back, 24 front (full length, cut below the chin), 25/26 side views (facing left/right), 20 clothed (bra + briefs).
  All five warmed by `tools/face/warm-skin.sh` (skin only; before/after was sent to the owner).
- Side views: PROFILE_WORDS ("side view", "in profile", ...) → `spec.profile` left/right → BODY_SIDES as image 1 for nude, partly dressed and acts;
  clothed keeps the clothed body; a back view wins. The prompt says "She is seen from the side, in profile to the lens."
- Persona: "Petite and softly curvy (158 cm, about 58 kg)"; skin "wheatish" everywhere it was "fair olive".

## Verified this session
- `node tools/check.mjs` 8 of 8; new unit rows for side views (refs, back wins, prompt, lint clean); golden plans changed only by body names.
- Not verified: any picture drawn with v15. The check (`tools/face/newref-check.mjs`) failed on its first case: Runware `failedModelLoad`
  after its tries (01:15 UTC). Stopped there (LESSONS: twice in a row, stop). Runware's "today" read $2.71 / 481 requests: the Playground key
  was also used at 01:00 UTC, not by this session.

## Waiting on the owner
- Deploy v15 + petite + wheatish? (say "deploy"). Better after the check below draws.
- Earlier: open /studio > References, "Draw the first batch" (~$0.04), approve outfits only. Do not send `/restart`.

## Next steps (in order; one chat each)
1. **Check v15:** `NODE_USE_ENV_PROXY=1 node tools/face/newref-check.mjs <outdir>` (4 pictures, ≈ $0.025; if failedModelLoad again, test one
   call without the LoRA to see if NSFW Unlocked fails to load); read each picture at full size: build (petite, full arms and bottom), skin tone, side view. Opus. *Effort: medium.*
2. **Step 5:** the owner's Telegram check of pictures and replies; read D1 `events`/`pictures` for slips. Haiku. *Effort: low.*
3. **Step 4 extras (optional):** blurred-face hair candidates. Sonnet builds, Opus reads pictures. ≤ $0.15. *Effort: medium.*
4. **Read `events`** after some use; decide hedging/timeout. Sonnet. *Effort: low.*
5. **Later:** WORKPLAN issue 12 leftovers; studio pictures expire from KV; `logSent` sizes; remove runwarePlan once /face and /health use a spec. Haiku. *Effort: low.*

## Open questions for the owner
- The full bust stays in her words; the new pictures show a medium natural bust. Change to match?
- UUID refs (cheaper, a different background at one seed): on or off?
- OK to press Actions > Delete retired branches? Unshallow in the SessionStart hook? A 401/402 ping outside the chat?

## Prompt for the next chat
"Next step 1 from HANDOFF.md: check the v15 bodies." Opus, effort medium.
