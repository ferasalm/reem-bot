# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Rebuild (2026-10-15)", the current plan, with paste prompts).

**Last updated:** 2026-10-16 (fifty-fifth session: Opus 5.5, `claude-opus-5-5`, configured and served per get_session; no subagents).
Step 3b paired check run, POV slip fixed. Runware this session: $0.0312.
**Deployed:** `main` = c652eb3 (Step 1), Version `649f169d-b85c-44e1-9692-8085f0b3e4ae`. Steps 2 and 3b are NOT deployed.
Rollback: push `ba540c9`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**On `dev`:** Step 2 (the picture core) + Step 3b + this session's check and POV fix.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live: chat on DeepSeek V4 Flash (Workers AI, 60 s), voice Sulafat,
hearing Gemini, pictures Runware klein 9B (Nude/On) and Cloudflare klein 4B (Off), still on the old prompts (main = Step 1).
Rebuild: 0 done → 1 done (deployed) → 2 done (dev) → 3 bench done → 3b done and checked (dev) → **4 reference library** → 5 deploy.
Runware for the Rebuild: $0.606 of $1.00 (Step 4 planned ≤ $0.40).

## This session (QUALITY "Rebuild Step 3b check"; pictures `face-candidates` runs/2026-10-16-step3b-*)
- Built config, Karras + acceleration "high" together ($0.0039 a picture): no artifact from them in 6 pictures.
- Selfie (cream sweater, kitchen), seeds 101/202: fixed: head to chest, sweater only, her face, eyeliner, hazel-green eyes.
- POV (gray hoodie, black leggings, couch): the leggings were right, but bare legs came toward the lens 2/2. They were POV's own legs:
  "Sitting across from POV" seats him. Fix (owner: "Fix it first"): `framePrompt` turns "across from POV" into "facing the lens" in POV
  poses; fixed 2/2. A lap framing was tried first: worse, reverted.
- `tools/face/step3-bench.mjs` phase C (`CASES=` picks cases).

## Verified this session
- `node tools/check.mjs` 8 of 8; golden plans unchanged by the fix (no golden case says "across from POV").
- Every picture read one at a time at full size (8 pictures); dry-run prompts read before each paid run.
- Not verified: "across from POV" wording from /look or the writer (only /pic's words tested); other POV seated poses.

## Waiting on the owner
- Deploy Steps 2 + 3b now, or after Step 4? (Everything on dev is checked.)
- Using the bot: the first replies fill D1 `events`. Before Step 4: approving references in /studio. Do not send `/restart`.

## Next steps (in order; one chat each)
1. **Rebuild Step 4:** reference library + Studio References tab (≤ $0.40; her body here: a fuller body reference, and test whether
   the face picture slims her). Sonnet builds, Opus reviews. *Effort: medium.*
2. **Read `events`** after some use and decide hedging/timeout with the owner. Sonnet. *Effort: low.*
3. **Later:** WORKPLAN issue 12 leftovers (WARDROBE "his oversized" shirt words); studio pictures expire from KV; `logSent` sizes; remove
   runwarePlan once /face and /health draw from a spec; other ways POV gets seated ("next to POV", "on POV's lap" are fine). Haiku. *Effort: low.*

## Open questions for the owner
- Deploy Steps 2 + 3b before Step 4?
- Runware's "today" window read $2.72 before the Step 3 run (the bot's cap is $1/day). Worth a look at Runware's usage page.
- OK to press Actions > Delete retired branches? Unshallow in the SessionStart hook? A 401/402 ping outside the chat?

## Prompt for the next chat
"Do Rebuild Step 4 from docs/WORKPLAN.md." Sonnet builds, effort medium.
