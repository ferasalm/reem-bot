# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.
**Work plan: `docs/WORKPLAN.md`** (2026-10-11): the next eight steps, their specs and the prompts to paste.

**Last updated:** 2026-10-11 (twenty-seventh session: **WORKPLAN Step 3 built and benched**, $0.20397 of the $0.25 budget; the owner's corrections of the bench are logged; waiting on the review. On `dev`.)
**Deployed:** `main` = 897dfaf (deploy run 38013450881, Version 496925bf-95b1-4fd7-8a0b-e1daea3953a7, the belly fix), unchanged.
Rollback: push `0d2010f` or `9c1270f` to `main`. `dev` = Steps 1-3 (Step 3 not yet reviewed). Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid). **Live (`main`, unchanged):** texts, memory and /auto
on DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat; hearing Gemini 3.8 Flash; pictures Runware klein 9B with her face, body
and place references, the owner's reference set of 2026-10-10, `DAILY_USD` $1.
**On `dev`, not deployed:** Steps 1-2 (reviewed: golden picture plans, the D1 studio log, `/nsfw` Off / Nude / On per chat, default On).
**Step 3 (waiting on the review):** `RUNWARE.LORA_INFO` (18 LoRAs), `LORA_PREFIX_WITH` (smartphone prefix only with phone2025), `povhandc`
out of the word lists, `tools/options.mjs` category and spare list, `tools/face/lora-bench.mjs`. Routing unchanged.

## Step 3 bench (2026-10-11): corrected by the owner
Run `runs/2026-10-11-step3-lora-bench` on `face-candidates`: 72 pictures, `table.md` (every picture, owner reads marked), `results.json`,
`plan.txt`, zoom sheets (`doggy-zoom-s101/s202.png`), `reads-raw.md`. Spend $0.20397 (the bot's sum = the Runware balance change, $14.92535 → $14.72138).
The owner's reads override the bench read:
1. **Nude mirror, seed 101: the head is disproportionately large** for the body (all four variants). Seed 202 fine. Candidates: `BIG_FACE`
   (the 2x face on every face picture); the head-size line is in LOOKS only, which her face pictures never use.
2. **Blowjob, seed 101: the upper arms are slimmer than they should be.** The sent prompt says "full upper arms" (REFERENCE): the words do not hold them.
   Candidate: image 1 (`body-v10`).
3. **Doggy, seeds 101 and 202: no ghost hands, no deformation.** His hands on her buttocks at V0 are correct. The earlier "ghost hands = hand
   words" finding is withdrawn; the hand words need no change for doggy.
4. **Doggy, seed 202: no anus visible** above the entry in any variant. Vaginal vs anal unresolved on zoom.
Also from the bench read (not checked by the owner): riding seed 202 V0 shows his hands at the bottom of the frame; riding has a second head
behind her in all six; missionary's hands on her thighs (V0, V3-V5) look like a pose; one clothed picture (seed 202 V0, four realism LoRAs)
showed a bare nipple; blowjob penis reads long in all six.
**Requested (owner, 2026-10-11):** fix each defect at its root (the reference, the body, or the camera), not with new prompt words that may leak.

## Waiting on the owner
- **Model names in the logs (the early open question).** The owner asked that the work be logged as Haiku and the review as Opus. The
  system rules bar model names in anything pushed to the repository, so the repo's records name the session by its role (the build, the
  review), not the model. Each commit's Claude-Session link opens the session, whose page shows the model. Recommended answer: keep the
  trailers as they are (Claude-Session only). The owner decides.
- **Your Telegram test of the belly fix**, and the 01:31:44 UTC picture of 2026-10-10 (a Runware "no picture" that Cloudflare redrew).
- **Do not send `/restart`**, though `/setup` says to: it wipes her memory.
- `tools/face/bench.json` still names the deleted `body-hourglass.jpg`; changing it starts the paid image bench (`image-bench.yml`).

## Verified this session (2026-10-11, twenty-seventh session)
- Sync report: OK after `git fetch --unshallow origin`.
- Golden: `node tools/test/picture-plans.mjs --check` ok (28 cases); `node tools/check.mjs` 7/7 ok (last run before the log edits, no code changed since);
  `doc-check` 146 ok.
- Bench: dry run 72 plans at $0; paid run 72 drawn, 0 errors, $0.20397, balance read before and after.
- The owner's re-check: nude seed 101 (head), blowjob seed 101 (arms), doggy both seeds (hands fine), doggy seed 202 (no anus). Re-viewed the four
  pictures; the nude and blowjob defects confirmed, the doggy hands confirmed correct.

## Next steps (in order; one chat each; the review checks each step before the next)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Review of Step 3, with the root-cause fixes** (WORKPLAN "Step 3 corrections", items 1, 2 and 4): test the head-size and arm causes
   at the reference and the body; decide the LoRA set; write "Decided in review, for Step 4". *Effort: high*
2. **Step 4**: outfits, the daily outfit, image 1 by outfit, nude back views, with a bench. ≤ $0.20. *Effort: high*
3. **Step 5**: partly dressed and close-ups, with a bench. ≤ $0.10. *Effort: medium*
4. **Step 6**: anal positions, with zoom-crop bench. ≤ $0.12. *Effort: medium*
5. **Step 7**: the prompt studio at /studio, reading the D1 log. ≤ $0.05. *Effort: high*
6. **Step 8**: deploy and live checks when you say "deploy" (suggested after Steps 2, 6 and 7). *Effort: low*
7. **Your Telegram test** of the belly fix, and of `/nsfw` once deployed (at Off/Nude, see if /look refuses too often in a hot chat). *Effort: low*
8. **Runware "no picture" recurring?** `/spend` (`failed today`) for a few days. *Effort: low*
9. **Later, from before the plan:** Flux 4 Play tongue weight bench; a seated clothed pose that keeps the belly flat; `/look`'s DeepSeek answers
   (after the deploy, `llm_text` in the studio log); /spend vs the dashboards; a cheaper or better text model; `bench.json` → `body-nude.jpg`;
   old session branches (`tools/retired-branches.txt`, Actions > Delete retired branches). *Effort: medium*

## Open questions for the owner
- Model names in the logs: see "Waiting on the owner" (recommended: keep the trailers as they are).
- Once the review has picked the LoRA set: four realism LoRAs (V0) or two (V2 or V3)? The bare nipple came from the full stack once; the
  fewer-LoRA sets cost less GPU time.
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`? The sync check says no work is missing from `dev`.
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? The warning came again (done by hand this session).
- The old session branches still hold the old Reem pictures in their history (not on `dev`). Clear those too, or leave them?
- Once deployed, Step 2 changes the default: a chat that never set `/nsfw` is On, and at On about 1 in 3 of her own pictures in a hot chat are nude
  (your 2026-10-11 decision). Deploy only when you say so.

## Prompt for the next chat
Pick **Opus** and paste the review prompt for Step 3 from `docs/WORKPLAN.md`, with the "Step 3 corrections" section (the root-cause fixes).
