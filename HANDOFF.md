# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.
**Work plan: `docs/WORKPLAN.md`** (2026-10-11): the eight steps, their specs, and the review prompt for Step 3 at its end.

**Last updated:** 2026-10-11 (twenty-seventh session: **WORKPLAN Step 3 built and benched**, $0.20397 of the $0.25 cap; the owner's corrections are logged; ready for the review. On `dev`.)
**Deployed:** `main` = 897dfaf (deploy run 38013450881, Version 496925bf-95b1-4fd7-8a0b-e1daea3953a7, the belly fix), unchanged.
Rollback: push `0d2010f` or `9c1270f` to `main`. `dev` = Steps 1-3 (Step 3 not yet reviewed). Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid). **Live (`main`, unchanged):** texts, memory and /auto
on DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat; hearing Gemini 3.8 Flash; pictures Runware klein 9B with her face, body
and place references, the owner's reference set of 2026-10-10, `DAILY_USD` $1.
**On `dev`, not deployed:** Steps 1-2 (reviewed: golden picture plans, the D1 studio log, `/nsfw` Off / Nude / On per chat, default On).
**Step 3 (waiting on the review):** `RUNWARE.LORA_INFO` (18 LoRAs), `LORA_PREFIX_WITH` (smartphone prefix only with phone2025), `povhandc`
out of the word lists, `tools/options.mjs` category and spare list, `tools/face/lora-bench.mjs`. Routing unchanged.

## Step 3 bench: where it is
- **GitHub branch `face-candidates`, folder `runs/2026-10-11-step3-lora-bench/`** (commit 5fba51a):
  https://github.com/ferasalm/reem-bot/tree/face-candidates/runs/2026-10-11-step3-lora-bench
  Start with `table.md` (every picture; the owner's reads override the bench read). Also `reads-raw.md`, `plan.txt` (every prompt sent),
  `results.json`, the two zoom sheets, and `pictures/` (72 JPGs named `case-variant-s<seed>.jpg`).
- Spend $0.20397 (the bot's sum = the Runware balance change, $14.92535 → $14.72138). Under the $0.25 cap.
- **The owner's defects (the review finds the root causes):** (1) nude mirror, seed 101: head disproportionately large; (2) blowjob,
  seed 101: upper arms slimmer than they should be, though the prompt says "full upper arms"; (3) doggy, seed 202: no anus visible above the entry.
- **Doggy hands are correct** (seeds 101 and 202): the earlier "ghost hands" finding is withdrawn.
- **The build's leads, for the review to double-check (not findings):** `BIG_FACE` (the 2x face on every face picture); the head-size line
  exists only in LOOKS, which face pictures never use; image 1 (`body-v10`) arms; the camera.
- Bench reads not checked by the owner: riding seed 202 V0 (his hands at the bottom of the frame); a second head in riding (both seeds);
  missionary's hands on her thighs (a pose); one bare nipple on a clothed picture (seed 202 V0, four realism LoRAs); blowjob penis reads long.
- **The fix is the review's, at the root** (reference, body or camera). No new size, arm or anus words in the prompt (they leak).

## Session links (where the work is attributed)
- Build session: https://claude.ai/code/session_01RoSzs9sjxYEF75N7tTu8Nt (commits e4b3d47, 4e81a2d, 1650d58 on `dev`; fd0e9e0 and 5fba51a on `face-candidates`).
- The review session's commits carry its own Claude-Session link, which opens its session page.

## Waiting on the owner
- **Model names in the records (the early open question).** The owner asked for the build and the review to be logged by model name. The
  system rules for this session bar model identifiers in anything pushed to a repository, so the records name no model: the Claude-Session
  link opens the session, whose page shows the model. The model is named in chat.
  Recommended: keep it this way. Writing model names into the records needs a change to the session setup; I won't add them without it.
- **Your Telegram test of the belly fix**, and the 01:31:44 UTC picture of 2026-10-10 (a Runware "no picture" that Cloudflare redrew).
- **Do not send `/restart`**, though `/setup` says to: it wipes her memory.
- `tools/face/bench.json` still names the deleted `body-hourglass.jpg`; changing it starts the paid image bench (`image-bench.yml`).

## Verified this session (2026-10-11, twenty-seventh session)
- Sync report OK after `git fetch --unshallow origin`. Golden `picture-plans --check` ok (28 cases); `tools/check.mjs` 7/7 (no code changed since).
- Bench: dry run, 72 plans at $0; paid run, 72 drawn, 0 errors, $0.20397; every picture read at full size; the owner's re-check confirmed
  the nude and blowjob defects and the doggy hands (re-viewed here too).

## Next steps (in order; one chat each; the review checks each step before the next)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Review of Step 3** (paste the review prompt at the end of `docs/WORKPLAN.md`): find and fix the root causes of the three defects,
   double-check the leads, decide the LoRA set, write "Decided in review, for Step 4". *Effort: high*
2. **Step 4**: outfits, the daily outfit, image 1 by outfit, nude back views, with a bench. ≤ $0.20. *Effort: high*
3. **Step 5**: partly dressed and close-ups, with a bench. ≤ $0.10. *Effort: medium*
4. **Step 6**: anal positions, with zoom-crop bench. ≤ $0.12. *Effort: medium*
5. **Step 7**: the prompt studio at /studio, reading the D1 log. ≤ $0.05. *Effort: high*
6. **Step 8**: deploy and live checks when you say "deploy" (suggested after Steps 2, 6 and 7). *Effort: low*
7. **Your Telegram test** of the belly fix, and of `/nsfw` once deployed (at Off/Nude, does /look refuse too often in a hot chat?). *Effort: low*
8. **Runware "no picture" recurring?** `/spend` (`failed today`) for a few days. *Effort: low*
9. **Later:** Flux 4 Play tongue weight bench; a seated clothed pose that keeps the belly flat; `/look`'s DeepSeek answers (`llm_text` in the
   studio log after the deploy); /spend vs the dashboards; a cheaper or better text model; `bench.json` → `body-nude.jpg`; old session branches
   (`tools/retired-branches.txt`). *Effort: medium*

## Open questions for the owner
- Model names in the records: see "Waiting on the owner" (recommended: keep the session links).
- Realism LoRAs after the review: four (V0) or two (V2 or V3)? The bare nipple came from the full stack once; fewer LoRAs cost less GPU time.
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`? The sync check says no work is missing from `dev`.
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? (Done by hand this session.)
- Old session branches still hold the old Reem pictures in their history. Clear those too, or leave them?
- Once deployed, Step 2 changes the default: a chat that never set `/nsfw` is On, and at On about 1 in 3 of her own hot-chat pictures are nude
  (your 2026-10-11 decision). Deploy only when you say so.

## Prompt for the next chat
Pick **Opus** (effort high) and paste the "Step 3 review prompt" at the end of `docs/WORKPLAN.md`. It is self-contained.
