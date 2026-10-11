# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds the fix round and its review, "Fix round review (Opus)").

**Last updated:** 2026-10-11 (thirty-sixth session: **Opus**, effort high per the session record. The fix round review.)
**Deployed:** `main` = d21c4b3 (Steps 1-7, unchanged). The fix round and this review are **not deployed**. Rollback if ever needed: push `897dfaf` to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**Branch:** `ccr-cf89486a-e1tk2i` (pushed), and `dev` = the same commit (the shared branch).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live (`main`): Steps 1-7 (texts, memory, /auto on DeepSeek V4 Flash; voice Sulafat; hearing Gemini; pictures on Runware klein 9B with her face, body and place; /nsfw; /studio).

On `dev`, not deployed (the fix round, reviewed):
- **A. /studio from a link:** the first visit answers the page with a `SameSite=Lax` cookie (it was a 302 with a Strict cookie: 404 from Telegram).
- **B. /nsfw Off draws on Cloudflare** (`NSFW.OFF_ROUTE`): klein with her face, the clothed body and the place, filter words and SAFE; lingerie allowed; never Runware, Nano Banana or TwinFlow. Nude and On unchanged.
- **C. A top and no bottom** on the nude body: `RUNWARE.DRESSED_BOTTOM`. Review fix: not on outfits that name a bottom it didn't know (briefs, bottoms, joggers) or show her legs on purpose (`BARE_LEGS_WORDS`).
- **D. Body audit:** read; no body setting changes (WORKPLAN "Fix round review", point 4).

## Verified this session (Opus)
- Studio: `tools/test/studio-browser.mjs` on d21c4b3 reproduces the owner's 404 (302 + Strict, then 404; reload 404); HEAD 10/10; the 390x844 screenshot read. Lax is safe: money is spent only on POST.
- Off rows (unit and scenarios) assert the right calls; every real Off path refuses or tames nude and sex-act words before drawing.
- Found and fixed: the bottoms line hit 6 wardrobe entries (a lace set with "briefs", two bare-legs FLIRTY outfits, "joggers"); after the fix a sweep of every entry gives 0. The row 13 unit row failed 2 runs in 12 (a random hairstyle reference): fixed, 8/8 runs pass. The golden Off case had the On prompt (no SAFE): the harness now builds at the case's level (only change: "No nudity.").
- `node tools/check.mjs` 8 of 8 ok; unit, scenarios, studio and golden outputs read (39 cases).
- 897dfaf vs HEAD, the same clothed /pic at seeds 101-404 (each version's own request): HEAD not slimmer at full size; 897dfaf copied the rust halter's neckline (4/4) and crop (2/4). $0.02808 by Runware `usage`; `face-candidates` runs/2026-10-11-fix-review/.
- Not checked live: Off on Cloudflare in the real bot, /studio opened from Telegram (the owner's test below).

## Waiting on the owner
- Telegram test: (a) `/studio`, then open the link from the chat: the Log page opens. (b) `/nsfw` Off, then a clothed picture of her and a lingerie one: both from Cloudflare. (c) On and Nude unchanged. (d) If she still looks slimmer, say which pictures (the studio log shows each one's references). Do not send `/restart` (it wipes her memory).
- Then "deploy" if the test is fine.

## Next steps (in order; one chat each)
1. **Owner's Telegram test** (above). If /studio or Off misbehaves, say what you see. *Effort: low.*
2. **Deploy** when the owner says "deploy": push `origin/dev` to `main`, read the deploy run, `/health` and `/setup`. Model: Haiku or Sonnet. *Effort: low.*
3. **Later** (Opus to diagnose, Haiku to draw): nipples through fitted tops (seed 202 tank, the olive cami) with Step 5's open questions; fuller arms only through the body picture (owner's pick); the Step 7 deviations (WORKPLAN, "Decided in review"); the porch_night crop; a frontal anal LoRA for missionary; the second head on riding; hair drifting to brown highlights; the blowjob arms; Flux 4 Play tongue weight; `/look`'s DeepSeek answers; a cheaper text model; old session branches. *Effort: medium.*

## Open questions for the owner
- Records: the raw model ID (your rule, 2026-10-11) or no model IDs in pushed files (the session's instructions)? Which wins? (Open. This session used the name only.)
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? (This session ran it; then the report said OK.)
- Old session branches still hold the old pictures in their history. Clear them, or leave them?

## Prompt for the next chat
None needed: the owner's Telegram test, then "deploy" in any chat. *Effort: low.*
