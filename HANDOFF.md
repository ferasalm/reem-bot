# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Rebuild (2026-10-15)", the current plan, with paste prompts).

**Last updated:** 2026-10-16 (fifty-fifth session: Opus 5.5, `claude-opus-5-5`, configured and served per get_session; no subagents).
Step 3b paired check run: selfie fixed, the POV case has a new slip. Runware this session: $0.0156.
**Deployed:** `main` = c652eb3 (Step 1), Version `649f169d-b85c-44e1-9692-8085f0b3e4ae`. Steps 2 and 3b are NOT deployed.
Rollback: push `ba540c9`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**On `dev`:** Step 2 (the picture core) + Step 3b + this check (bench phase C, docs).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live: chat on DeepSeek V4 Flash (Workers AI, 60 s), voice Sulafat,
hearing Gemini, pictures Runware klein 9B (Nude/On) and Cloudflare klein 4B (Off), still on the old prompts (main = Step 1).
Rebuild: 0 done → 1 done (deployed) → 2 done (dev) → 3 bench done → 3b done (dev), checked → 4 reference library → 5 deploy.
Runware for the Rebuild: $0.591 of $1.00 (Step 4 planned ≤ $0.40).

## Step 3b check (this session; QUALITY "Rebuild Step 3b check"; pictures `face-candidates` runs/2026-10-16-step3b-check)
- Built config: Karras + acceleration "high", $0.0039 a picture (as benched).
- Selfie (cream sweater, kitchen), seeds 101/202: **fixed**: head to chest, sweater only, her face, eyeliner, hazel-green eyes.
- POV (gray hoodie, black leggings, on the couch), seeds 101/202: leggings now worn (no bike shorts), but **a pair of bare knees fills the
  bottom of the frame** 2/2: "ends just below her knees" on a seated subject facing the lens puts her knees nearest the lens, drawn bare.
  Seed 101 also smeared her laughing face (melted nose); cause not known (maybe "high" on a small face).
- Not fixed (no owner pick yet). Candidates: seated framings end mid-thigh with the leggings named ("her black leggings to the edge"),
  or a seated three-quarter frame from slightly further back. One idea, one paired run (~$0.016) to check.

## Verified this session
- `node tools/check.mjs` 8 of 8 (after the bench edit and docs).
- The 4 pictures read one at a time at full size; dry-run plans read first (lint clean, jeans gone from the selfie, knees framing on POV).

## Waiting on the owner
- **The POV knees slip:** fix it before Step 4 (Opus, ~$0.02), or carry it into Step 4?
- Using the bot: the first replies fill D1 `events`. Before Step 4: approving references in /studio. Do not send `/restart`.

## Next steps (in order; one chat each)
1. **Fix the seated POV framing** (owner's call): change the seated three-quarter edge, golden plans, then redraw the POV case at seeds
   101/202 (≤ $0.02) and read each picture at full size. Opus (judging pictures). *Effort: low.*
2. **Rebuild Step 4:** reference library + Studio References tab (≤ $0.40; her body here: a fuller body reference, and test whether
   the face picture slims her). Sonnet builds, Opus reviews. *Effort: medium.*
3. **Read `events`** after some use and decide hedging/timeout with the owner. Sonnet. *Effort: low.*
4. **Later:** WORKPLAN issue 12 leftovers (WARDROBE "his oversized" shirt words); studio pictures expire from KV; `logSent` sizes; remove
   runwarePlan once /face and /health draw from a spec. Haiku. *Effort: low.*

## Open questions for the owner
- Fix the POV knees first, or go to Step 4?
- Runware's "today" window read $2.72 before the Step 3 run (the bot's cap is $1/day). Worth a look at Runware's usage page.
- OK to press Actions > Delete retired branches? Unshallow in the SessionStart hook? A 401/402 ping outside the chat?

## Prompt for the next chat
"Fix the seated POV framing from HANDOFF (≤ $0.02), then start Rebuild Step 4." Opus, effort low.
