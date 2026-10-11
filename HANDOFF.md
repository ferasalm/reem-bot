# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.
**Work plan: `docs/WORKPLAN.md`** (2026-10-11): the eight steps, their specs, and the "Decided in review" notes at its end.

**Last updated:** 2026-10-11 (twenty-eighth session, **Opus**: the Step 3 review. Two root causes found and fixed, one still open,
the LoRA set decided for Step 4. On `dev`.)
**Deployed:** `main` = 897dfaf (deploy run 38013450881, Version 496925bf-95b1-4fd7-8a0b-e1daea3953a7, the belly fix), unchanged.
Rollback: push `0d2010f` or `9c1270f` to `main`. `dev` = Steps 1-3, reviewed. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid). **Live (`main`, unchanged):** texts, memory and /auto
on DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat; hearing Gemini 3.8 Flash; pictures Runware klein 9B with her face, body
and place references, the owner's reference set of 2026-10-10, `DAILY_USD` $1.
**On `dev`, not deployed:** Steps 1-2 (golden picture plans, the D1 studio log, `/nsfw` Off / Nude / On per chat, default On) and Step 3
(built by **Haiku**, reviewed by **Opus**): the LoRA catalog `LORA_INFO`, the smartphone prefix only with phone2025, plus the review's two fixes:
- **Head too large (nude, seed 101) → the camera.** The random gaze "looking up at the camera through her lashes" put the camera above her.
  It is out of `GAZES`. Ruled out: BIG_FACE. Seed 101 redrawn: head in scale.
- **No anus (doggy, seed 202) → Flux 4 Play.** Its doggy drew a reverse-cowgirl pose with the cleft closed. Doggy now runs without it
  (Unchained + General Penis, as the bot's own route). Ruled out: the back body picture, "belly". Both seeds redrawn: the anus shows above the entry.
- **Blowjob arms (seed 101): not fixed.** Ruled out: image 1, BIG_FACE, Unchained at 0.5. A lead only: Unchained 0.8 shrinks the bust and arms,
  but without it the act failed. Details: WORKPLAN "Step 3 review".

## The review's pictures
- GitHub branch `face-candidates`, folder `runs/2026-10-11-step3-review/` (commit 95c5ab8): `table.md` (every test and its read), 13 pictures,
  sheets, the test lists and `diag.mjs` (the bench harness with reference and CONFIG swaps). The Step 3 bench itself: `runs/2026-10-11-step3-lora-bench/`.
- Spend: the review $0.03666 (bot's sum; balance $14.70565 → $14.66990); with the bench $0.24063 of the $0.25 cap. The balance also fell
  $0.01573 between the bench's end and the review (cause unknown, not this session's calls); with it, the step is $0.25636.

## Session links (who did what)
- Step 3 build (Haiku): https://claude.ai/code/session_01RoSzs9sjxYEF75N7tTu8Nt. Step 3 review (Opus): https://claude.ai/code/session_01PVtSGCTGu7CyWDm5pnS4S7.
- From now on the records name the model (owner, 2026-10-11; read with `get_session`, never from memory).

## Waiting on the owner
- **The $0.01573 drop in the Runware balance** between the bench and the review: not this session's calls. Your own Telegram pictures? If not, say so.
- **Your Telegram test of the belly fix**, and the 01:31:44 UTC picture of 2026-10-10 (a Runware "no picture" that Cloudflare redrew).
- **Do not send `/restart`**, though `/setup` says to: it wipes her memory.
- `tools/face/bench.json` still names the deleted `body-hourglass.jpg`; changing it starts the paid image bench (`image-bench.yml`).

## Verified this session (2026-10-11, twenty-eighth session)
- Sync report OK after `git fetch --unshallow origin`. Haiku's commits: CLAUDE.md, `.claude/`, `.github/`, `tools/test/`, `bench.json` untouched; DECISIONS only appended.
- `node tools/check.mjs` 7/7 (read in full). Golden `--write`: 3 changed lines, all intended (doggy LoRA and d0gg13; one gaze pick moved by the shorter list).
- 13 pictures read at full size, doggy on a zoom crop; the seed reproduced the bench picture before any change was tested.

## Next steps (in order; one chat each; Opus reviews each step before the next)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Step 4** (Haiku): outfits, the daily outfit, image 1 by outfit, nude back views, with a bench. ≤ $0.20. Apply "Decided in review, for Step 4"
   first: realism LoRAs = InstaPic + Real HD 2K (V2), three regression pictures. *Effort: high*
2. **Review of Step 4** (Opus). *Effort: high*
3. **Step 5**: partly dressed and close-ups, with a bench. ≤ $0.10. *Effort: medium*
4. **Step 6**: anal positions, with zoom-crop bench (also look at riding: a second head, his hands). ≤ $0.12. *Effort: medium*
5. **Step 7**: the prompt studio at /studio, reading the D1 log. ≤ $0.05. *Effort: high*
6. **Step 8**: deploy and live checks when you say "deploy" (suggested after Steps 2, 6 and 7). *Effort: low*
7. **Your Telegram test** of the belly fix, and of `/nsfw` once deployed (at Off/Nude, does /look refuse too often in a hot chat?). *Effort: low*
8. **Later:** the blowjob arms (a bench: Unchained weight vs povdt, 2+ seeds); the riding second head; Flux 4 Play tongue weight; a seated clothed
   pose with a flat belly; `/look`'s DeepSeek answers (`llm_text`); /spend vs the dashboards; a cheaper text model; `bench.json` → `body-nude.jpg`;
   old session branches (`tools/retired-branches.txt`). *Effort: medium*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`? The sync check says no work is missing from `dev`.
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? (Done by hand again this session.)
- Old session branches still hold the old Reem pictures in their history. Clear those too, or leave them?
- Once deployed, Step 2 changes the default: a chat that never set `/nsfw` is On, and at On about 1 in 3 of her own hot-chat pictures are nude
  (your 2026-10-11 decision). Deploy only when you say so.

## Prompt for the next chat
Pick **Haiku 5.5** and paste the Haiku prompt from `docs/WORKPLAN.md` ("How to run a step") with N = 4 and $X = 0.20.
