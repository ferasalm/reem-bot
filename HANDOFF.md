# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Rebuild (2026-10-15)", the current plan, with paste prompts).

**Last updated:** 2026-10-17 (fifty-eighth session: Opus 5.5, `claude-opus-5-5`, configured and served per get_session; no subagents). Runware this session $0.0292.
**DEPLOYED:** `main` = 6c6c19f, Deploy run 38991580245 (run_number 58) green. `dev` = 6c6c19f + these records.
**Live Worker:** Version `31d318d7-23fd-409c-b446-0b9be7a05927`. `/health` ok, `/setup` all ✅.
Rollback: push `8d0f79c` (Version `84fd5b01`) to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers.
Rebuild: 0-4 done and live → 5 = the owner's Telegram check, then approve candidates in /studio.
Runware for the Rebuild: about $0.68 of $1.00.

## Live since this session
- Bodies v15: full-length nude front (24) and back (23), one side view (25, facing left; 26 dropped: thinner arms), clothed bra + briefs (20);
  skin warmed to wheatish by `tools/face/warm-skin.sh`.
- Side views: PROFILE_WORDS → `spec.profile` → the side picture as image 1 (nude, partly dressed, acts) + "She is seen from the side, in profile to the lens."
- Face: `reference-2x.jpg` slightly fuller (Shepards warp, owner picked "A"); same face otherwise.
- Words: "wheatish skin", "Petite and softly curvy (158 cm, about 58 kg)", "a medium, natural bust".
- `stripPhrases` takes a photo-type phrase's article ("Standing, a in the bedroom.").

## Verified this session
- `node tools/check.mjs` 8 of 8 (unit rows: side views, the article fix).
- newref-check pictures read at full size (QUALITY 2026-10-17): 4 on v15, then clothed + side on the fuller face: the reference build, her face.
- Deploy log read: Version, /health, /setup. Not verified: anything in Telegram.
- GitHub Actions failed at start 00:44-01:30 UTC (runner_id 0, no steps), then worked again (LESSONS).

## Waiting on the owner
- Telegram check: a few pictures (/pic naked side view, a selfie, a belfie) and replies. Do not send `/restart` (the /setup page says to; it wipes her memory).
- /studio > References, "Draw the first batch" (~$0.04), approve outfits only.

## Next steps (in order; one chat each)
1. **Step 5:** read D1 `events`/`pictures` after the owner's Telegram check for slips (Telegram is the owner's). Haiku. *Effort: low.*
2. **Skin (optional):** if pictures read too fair, a stronger warm-skin.sh tint (try G 0.90, B 0.76), 2 pictures ≤ $0.01. Opus reads pictures. *Effort: medium.*
3. **Step 4 extras (optional):** blurred-face hair candidates. Sonnet builds, Opus reads pictures. ≤ $0.15. *Effort: medium.*
4. **Read `events`** after some use; decide hedging/timeout. Sonnet. *Effort: low.*
5. **Later:** WORKPLAN issue 12 leftovers; studio pictures expire from KV; `logSent` sizes; remove runwarePlan once /face and /health use a spec. Haiku. *Effort: low.*

## Open questions for the owner
- UUID refs (cheaper, a different background at one seed): on or off?
- OK to press Actions > Delete retired branches? Unshallow in the SessionStart hook? A 401/402 ping outside the chat?

## Prompt for the next chat
"Step 5 from HANDOFF.md: read the live bot's logs after my Telegram check." Haiku, effort low.
