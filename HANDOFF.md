# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.
**Work plan: `docs/WORKPLAN.md`** (2026-10-11): the next eight steps, their specs and the prompts to paste.

**Last updated:** 2026-10-11 (twenty-second session: diagnosis and the work plan, docs only). **Deployed:** `main` = 897dfaf (deploy run
38013450881, Version 496925bf-95b1-4fd7-8a0b-e1daea3953a7, the belly fix). Rollback: push `0d2010f` or `9c1270f` to `main`. `dev` = this
session's docs commit on top of `897dfaf` (no code change). Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid). **Live (`main`):** texts, memory and /auto on
DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat; hearing Gemini 3.8 Flash; pictures Runware klein 9B with her face,
body and place references (retried once, then Cloudflare klein), the owner's reference set of 2026-10-10, `DAILY_USD` $1.
**Diagnosed this session (code read; WORKPLAN has the detail and the fixes):**
- No user NSFW switch; only the global `RUNWARE.SEX_ACTS` (on).
- Her own pictures are never nude: `PICTURE.SELF_CHOICE` still ends "Your pictures never show you fully naked." (a 2026-10-02 rule).
- The rust halter everywhere: it *is* image 1 of every clothed picture, the Runware REFERENCE never says "not its clothes", and no
  outfit is added when her or his words name none; an outfit picture is sent next to it (two clothed bodies blend); nude back views
  use the front body.
- Bare breasts on "covered" close-ups: "covered breasts", "top", "sports bra" don't count as clothes, NAKED names her breasts, and
  Unchained XXX + PussyDiffusion still load on partly dressed pictures.
- Ghost hands: POV hand is *not* loaded (in ACT_WORDS, not ACT_LORAS). Suspects: four realism LoRAs stacked (2.3 total) plus act
  LoRAs (5-6 per picture), and the hands named twice in the sex prompts. Step 3 benches it.
- Anal: one camera (all fours) with POV Doggy Anal alone at 1.0; "missionary anal" gets the *vaginal* missionary text.
- Prompts are not logged anywhere (no console.log, no observability): step 8 of the old list ("read /look answers in the log")
  couldn't work. Step 1 adds a D1 log; D1 is reachable through the Cloudflare MCP, R2 is not enabled on the account.

## Waiting on the owner
- **Start Step 1** in a new chat with **Haiku 5.5** (prompt in `docs/WORKPLAN.md`, "How to run a step"; budget $0).
- **Your Telegram test of the belly fix** and the 01:31:44 UTC picture of 2026-10-10 (a Runware "no picture" that Cloudflare redrew).
- **Do not send `/restart`**, though `/setup` says to: it wipes her memory.
- `tools/face/bench.json` still names the deleted `body-hourglass.jpg`; changing it starts the paid image bench (`image-bench.yml`).

## Verified this session (2026-10-11)
- Sync report: OK after `git fetch --unshallow origin` (the shallow-clone warning again).
- Every diagnosis above read in `worker.js` (`drawPicture`, `runwareLoras`, `runwareBody`, `composePicture`, `selfiePicture`,
  `customPicture`, `lookWrite`, CONFIG.PICTURE); the five body/outfit references viewed (same framing, faceless).
- Cloudflare MCP: `d1_databases_list` answers (none yet); `r2_buckets_list` 403 10042 (R2 off). `node tools/check.mjs` (below).
- Not done: no picture drawn, no code changed, nothing deployed.

## Next steps (in order; one chat each; Opus reviews each Haiku step before the next)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **WORKPLAN Step 1** (Haiku): plan/draw split, seeds, golden plans, the D1 prompt log, observability. $0. *Effort: medium*
2. **Opus review of Step 1**, then **Step 2** (Haiku): /nsfw Off/Nude/On, her own nudes, the SELF_CHOICE line. $0. *Effort: medium*
3. **Step 3** (Haiku runs, Opus judges): LoRA catalog, realism diet and ghost-hands bench, 72 pictures. ≤ $0.25. *Effort: medium*
4. **Step 4** (Haiku): outfits, the daily outfit, image 1 by outfit, nude back views, with a bench. ≤ $0.20. *Effort: high*
5. **Step 5** (Haiku): partly dressed and close-ups, with a bench. ≤ $0.10. *Effort: medium*
6. **Step 6** (Haiku runs, Opus judges): anal positions, with zoom-crop bench. ≤ $0.12. *Effort: medium*
7. **Step 7** (Haiku): the prompt studio at /studio. ≤ $0.05. *Effort: high*
8. **Step 8**: deploy and live checks when you say "deploy" (suggested after Steps 2, 6 and 7). *Effort: low*
9. **Your Telegram test** of the belly fix (any time). *Effort: low*
10. **Runware "no picture" recurring?** `/spend` (`failed today`) for a few days; Step 1's log will show which picture. *Effort: low*
11. **Later, from before the plan:** Flux 4 Play tongue weight bench; a seated clothed pose that keeps the belly flat; `/look`'s
    DeepSeek answers (readable once Step 1 logs them); /spend vs the dashboards; a cheaper or better text model; `bench.json` →
    `body-nude.jpg`; old session branches (`tools/retired-branches.txt`, Actions > Delete retired branches). *Effort: medium*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`? The sync check says no work is missing from `dev`.
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? The warning came again (the plan's
  prompts run it by hand for now).
- Commit trailers: the attribution reminder asks for a Co-Authored-By line naming the model; the system rules bar model names in
  commit messages. Commits carry only the Claude-Session line. Which do you want?
- The old session branches still hold the old Reem pictures in their history (not on `dev`). Clear those too, or leave them?
- Step 1 may find the deploy token can't use D1: then add "Account, D1, Edit" to the `CLOUDFLARE_API_TOKEN` secret before a deploy.

## Prompt for the next chat (pick Haiku 5.5, then paste the Step 1 prompt from `docs/WORKPLAN.md` with N = 1 and $X = 0)
