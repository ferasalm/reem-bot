# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.
**Work plan: `docs/WORKPLAN.md`** (2026-10-11): the eight steps, their specs, and the "Decided in review" notes at its end.

**Last updated:** 2026-10-11 (twenty-ninth session, **Haiku**: Step 4 built and benched. "Step 4 done, waiting on review". On `dev`.)
**Deployed:** `main` = 897dfaf (deploy run 38013450881), unchanged. Rollback: push `0d2010f` or `9c1270f` to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. **Live (`main`):** texts, memory, /auto on DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat; hearing Gemini; pictures Runware klein 9B with her face, body and place references, `DAILY_USD` $1.
**On `dev`, not deployed:** Steps 1-3 (reviewed by Opus) and Step 4 (built by Haiku, review pending).
- **Step 4 built:** LoRA set V2 (InstaPic 0.6 + Real HD 2K 0.5; phone2025 and UltraReal spare, so no smartphone prefix). One home and one out outfit a day (`dayOutfits`, KV "day", by the temperature band, never yesterday's). Everyday pictures and /pic that name no clothes wear the day's outfit; words that name no clothes get the tier's clothes. Image 1 by outfit (`OUTFIT_BODY`: the rust halter is its own picture, `outfit-rust-halter`). `CLOTHED_BODY` "rust" (today's) or "none". Nude back views on `NUDE_BACK_WORDS`. "On her heels" no longer counts as shoes.
- **Step 4 bench:** 39 pictures, $0.10166 by the bench's sum, every picture read at full size (table, sheets, doggy zoom crop) on `face-candidates` runs/2026-10-11-step4-outfit-bench/ (commit 6173488). Outfits worn as named 24/24; outfit pictures as image 1 with no fourth image 8/8; back views 4/4; nude head in scale at seeds 101 and 202; doggy anus above the entry (zoom). **One suspect:** the rust-mode Breton at seed 101 showed a sleeveless tank (the body's top shape); seed 202 is clean.
- **Not built** (the bench cut to fit $0.20): the neutral reference `v10-neutral` and the nude and neutral `CLOTHED_BODY` modes. "Her back" is left out of `NUDE_BACK_WORDS` (lying on her back is a front view).
- Session link (this build and bench, Haiku): https://claude.ai/code/session_01TtxHDLcufHAr8WtgC8sPXj

## Waiting on the owner
- **Runware balance:** the $0.10582 drop ($14.6699 → $14.56408) is the bench's $0.10166 plus $0.00416 of your own Telegram pictures (owner, 2026-10-11). Nothing to chase.
- **Your Telegram test** of the belly fix (deployed 2026-10-10), and of /nsfw once deployed. Do not send `/restart` (it wipes her memory).
- Step 4 is not deployed. Deploy when you say "deploy" (suggested after Steps 2, 6 and 7).
- Once deployed, Step 2 makes a chat with no `/nsfw` setting On (about 1 in 3 hot-chat pictures nude): deploy only when you say so.

## Verified this session (2026-10-11, twenty-ninth session)
- Sync report: 26 branches listed at first (shallow clone); after `git fetch --unshallow origin`: "No other branch has work missing here."
- Step 4 build: `node tools/check.mjs` 7/7 (read in full). Golden `--write`: the diff is the LoRA lists, the prefix sentence removed, the clothed reference text, the belfie → `body-v10-back`, the outfit pictures as image 1, and the day-outfit cases.
- Unit and scenarios pass (unit: outfit helpers, /pic day outfit, LoRA V2 expectations; scenarios: the heels fix). The scenario failure before the fix was a random pose ("sitting back on her heels") read as shoes.
- Bench: dry plan first ($0, 39 runs), then the paid run: all 39 drawn, no errors, under the $0.20 cap. Refs read in `results.json` on every run. All 39 pictures read at full size; doggy on a zoom crop.

## Open items for the Step 4 review (Opus)
- **Slimmer rust-mode pictures (owner, 2026-10-11):** the owner saw her slimmer in seed 101's rust-mode pictures (turtleneck-rust-s101, linen-rust-s101). Haiku's side-by-side with the body references showed no clear difference by eye, and the framing differs. Build was never measured; Haiku's "not slimmer than v10" was an overclaim. Check with same-framing crops or a waist and hip width before choosing `CLOTHED_BODY`.
- **Breton rust, seed 101:** a sleeveless striped tank (the body's top shape); seed 202 is a short-sleeve tee. Repeat before any fix.
- **Likeness and build:** judged by eye only, in all 39 pictures.

## Next steps (in order; one chat each; Opus reviews each step before the next)
1. **Review of Step 4** (Opus). *Effort: high.* Decide `CLOTHED_BODY` ("rust" today). Look at the seed-101 Breton leak: one seed, so repeat it before fixing. Write "Decided in review, for Step 5" under WORKPLAN's "Decided in review". Name the model in the records.
2. **Step 5**: partly dressed and close-ups, with a bench. ≤ $0.10. *Effort: medium.*
3. **Step 6**: anal positions, with zoom-crop bench (also riding: a second head, his hands). ≤ $0.12. *Effort: medium.*
4. **Step 7**: the prompt studio at /studio, reading the D1 log. ≤ $0.05. *Effort: high.*
5. **Step 8**: deploy and live checks when you say "deploy" (suggested after Steps 2, 6 and 7). *Effort: low.*
6. **Your Telegram test** of the belly fix, and of /nsfw once deployed. *Effort: low.*
7. **Later:** the blowjob arms; the riding second head; Flux 4 Play tongue weight; a seated clothed pose with a flat belly; `/look`'s DeepSeek answers (`llm_text`); /spend vs the dashboards; a cheaper text model; `bench.json` → `body-nude.jpg`; old session branches (`tools/retired-branches.txt`). *Effort: medium.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`? The sync check says no work is missing from `dev`.
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? (Done by hand again this session.)
- Old session branches still hold the old Reem pictures in their history. Clear those too, or leave them?

## Prompt for the next chat
Pick **Opus** (effort high) and paste the Opus review prompt from `docs/WORKPLAN.md` ("How to run a step"), with N = 4.
