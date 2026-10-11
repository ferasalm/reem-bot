# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. **Work plan: `docs/WORKPLAN.md`** (2026-10-11): the eight steps, their specs, and the notes at its end.

**Last updated:** 2026-10-11 (thirty-third session: **Opus** `claude-opus-5-5` with **haiku-worker** `claude-haiku-5-5`; Step 6 done;
the owner's "spend less" applied. On `dev`.)
**Deployed:** `main` = 897dfaf (deploy run 38013450881), unchanged. Rollback: push `0d2010f` or `9c1270f` to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. **Live (`main`):** texts, memory, /auto on DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat; hearing Gemini; pictures Runware klein 9B with her face, body and place references, `DAILY_USD` $1.
**On `dev`, not deployed:** Steps 1-4 (reviewed by Opus), Step 5 (Opus, no review: owner), **Step 6 done** (no separate review chat: owner).
- **Step 6 anal positions:** anal is routed first (ANAL_WORDS), so "missionary anal" and "anal riding" no longer get the vaginal text, and "her
  ass" on riding or doggy no longer loads POV Doggy Anal. Position from his words, else doggy 0.6 / prone 0.3 / reverse cowgirl 0.1 /
  missionary 0. Body: the front for missionary, else the back.
- **Bench (32 pictures, $0.0936, every one read by Opus):** only POV Doggy Anal draws anal: doggy alone 5/5, prone 0.8 5/5 (flat 4/5),
  reverse cowgirl 0.8 2/2 (two heads 1/2), missionary 0.8 2/2 but her legs gone. The spec's Flux 4 Play / Missionary POV / General Penis
  drew vaginal or no penetration 0/18 (vaginal-trained LoRAs). So ANAL_LORAS = POV Doggy Anal everywhere; `ANAL_ALONE` doggy is new.
- Pictures: `face-candidates` runs/2026-10-11-step6-anal-bench/ (table.md one line per picture, `sheets/` one per position, `crops/`).
- Who did what: haiku-worker the CONFIG keys + panel rows, unit rows + golden cases, `anal-bench.mjs`, pass 1 of the bench, the Civitai
  report; Opus the routing, the golden diff, every picture, the picks, the docs. WORKPLAN "Step 6 build" has the deviations.
- **Spend less (owner):** DECISIONS.md loaded at start 77 KB → 30 KB (74 older entries word for word in DECISIONS-ARCHIVE.md); haiku-worker
  effort max → medium; the orchestrator skill delegates only token-heavy steps; HANDOFF names the cheapest model per next step.

## Waiting on the owner
- **Your Telegram test** of the belly fix (deployed 2026-10-10), and of /nsfw once deployed. Do not send `/restart` (it wipes her memory).
- Steps 1-6 are not deployed. Deploy when you say "deploy" (suggested after Steps 6 and 7).
- Once deployed, Step 2 makes a chat with no `/nsfw` setting On (about 1 in 3 hot-chat pictures nude): deploy only when you say so.

## Verified this session (2026-10-11, thirty-third session)
- Sync: OK after `git fetch --unshallow origin` (nothing missing from `dev`). Runware $14.36739 → $14.27379 (MCP `account`).
- Golden diff read case by case: only the anal cases changed (/pic anal, /pic missionary anal, prone, reverse cowgirl, anal riding), 5 new
  cases at the end; anal doggy unchanged. Unit rows for each position, "her ass" without anal, and the position pick.
- `node tools/check.mjs` 7/7, read in full, before each push. Workers' model read from their transcripts: 302 lines, all `claude-haiku-5-5`.

## Next steps (in order; one chat each)
1. **Step 7**: the prompt studio at /studio, reading the D1 log. ≤ $0.05. Model: **Sonnet 5.5** (a well-specified build; WORKPLAN "Step 7:
   how to run it cheaply"). *Effort: high.*
2. **Step 8**: deploy and live checks when you say "deploy". Model: **Haiku 5.5** or Sonnet (commands and log reads). *Effort: low.*
3. **Your Telegram test** of the belly fix, and of /nsfw and anal pictures once deployed. *Effort: low.*
4. **Later** (Opus to diagnose, Haiku to draw): a frontal anal LoRA for missionary (True-Anal Frontal view, Piledriver anal: WORKPLAN's
   Civitai table); the second head on riding and two women at 16:9; Step 5's open questions (BODY_PARTIAL "none", the faceless 1:1
   close-up, nipple points, P3 "legs apart", close-ups never navel-to-thighs); hair drifting to brown highlights; the mirror belfie with
   no phone; the blowjob arms; Flux 4 Play tongue weight; `/look`'s DeepSeek answers (`llm_text`); /spend vs the dashboards; a cheaper
   text model; old session branches (`tools/retired-branches.txt`). *Effort: medium.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`? The sync check says no work is missing from `dev`.
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? (Done by hand again this session.)
- Old session branches still hold the old Reem pictures in their history. Clear those too, or leave them?
- LESSONS.md is at 179 of 180 lines: the next session that adds one summarizes it back to about 150 (your rule). OK to do that on Haiku?

## Prompt for the next chat
Pick **Sonnet 5.5** (effort high) and paste the "Haiku prompt (Step N)" from `docs/WORKPLAN.md` with N = 7 and $0.05.
