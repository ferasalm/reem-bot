# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Rebuild (2026-10-15)", the current plan, with paste prompts).

**Last updated:** 2026-10-16 (fifty-fourth session: Opus 5.5, `claude-opus-5-5`, configured and served per get_session; no subagents).
Rebuild Step 3b built. Runware this session: $0.
**Deployed:** `main` = c652eb3 (Step 1), Version `649f169d-b85c-44e1-9692-8085f0b3e4ae`. Steps 2 and 3b are NOT deployed.
Rollback: push `ba540c9`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**On `dev`:** Step 2 (the picture core) + Step 3b (this session).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live: chat on DeepSeek V4 Flash (Workers AI, 60 s), voice Sulafat,
hearing Gemini, pictures Runware klein 9B (Nude/On) and Cloudflare klein 4B (Off), still on the old prompts (main = Step 1).
Rebuild: 0 done → 1 done (deployed) → 2 done (dev) → 3 bench done → **3b done (dev)** → 4 reference library → 5 deploy.
Runware for the Rebuild: $0.575 of $1.00 (Step 4 planned ≤ $0.40).

## Step 3b (this session; DECISIONS 2026-10-16 "Acceleration high and DPM++ 2M Karras")
- Owner's picks set: `PICTURE.FRAMES.ACCELERATION` "high" ($0.0039 a picture), `SCHEDULER` "DPM++ 2M Karras".
  **Never benched together** (each was benched alone against Default/none).
- Chest-up slip: the cause was the clothes words. A top alone gets "fitted blue jeans", and naming jeans pulled the frame down to the hips.
  Now close framings (face, chest-up) name only the garments in frame (`inFrameOutfit`), and the chest-up sentence is reworded.
- Leggings slip: three-quarter framing now ends "just below her knees" (it ended at her thighs and drew bike shorts).
- `PICTURE.CORE` "legacy" removed. runwarePlan stays only for drawPicture without a spec (/face, /health).
- Body: kept as is; Step 4 decides (owner suspects the slim face picture makes her slimmer).

## Verified this session
- `node tools/check.mjs` 8 of 8 (unit incl. lint and 4 new `inFrameOutfit` rows, scenarios, e2e, studio, golden plans, docs).
- Golden diffs read by script: 69 prompt pairs differ only by the two framing sentences and the dropped bottoms; acceleration and
  scheduler changed on every Runware case. The golden check caught a leftover in deliver.js (selfies stopped drawing) before commit.
- Not verified: any picture (no paid run this session); Karras + "high" together; the new framings drawn.

## Waiting on the owner
- **A paired check before the deploy?** 4 pictures (~$0.02): the two slip cases with the new framings, and Karras + high together.
- Using the bot: the first replies fill D1 `events`. Before Step 4: approving references in /studio. Do not send `/restart`.

## Next steps (in order; one chat each)
1. **Step 3b check (optional, ~$0.02):** draw the selfie (cream sweater, kitchen) and the POV (hoodie, black leggings) at seeds 101/202
   with Karras + high; read each at full size. Opus (judging pictures). *Effort: low.*
2. **Rebuild Step 4:** reference library + Studio References tab (≤ $0.40; her body here: a fuller body reference, and test whether
   the face picture slims her). Sonnet builds, Opus reviews. *Effort: medium.*
3. **Read `events`** after some use and decide hedging/timeout with the owner. Sonnet. *Effort: low.*
4. **Later:** WORKPLAN issue 12 leftovers (WARDROBE "his oversized" shirt words); studio pictures expire from KV; `logSent` sizes; remove
   runwarePlan once /face and /health draw from a spec. Haiku. *Effort: low.*

## Open questions for the owner
- The paired check above, or straight to Step 4?
- Runware's "today" window read $2.72 before the Step 3 run (the bot's cap is $1/day; the Playground key was used at 03:29 UTC). Worth a
  look at Runware's usage page.
- OK to press Actions > Delete retired branches? Unshallow in the SessionStart hook? A 401/402 ping outside the chat?

## Prompt for the next chat
"Run the Step 3b paired check from HANDOFF (≤ $0.02), then start Rebuild Step 4." Opus for the check, effort low.
