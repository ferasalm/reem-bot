# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.
**Work plan: `docs/WORKPLAN.md`** (2026-10-11): the next eight steps, their specs and the prompts to paste.

**Last updated:** 2026-10-11 (twenty-seventh session: **WORKPLAN Step 3 built and benched**, $0.20397 of the $0.25 budget; waiting on Opus review. On `dev`.)
**Deployed:** `main` = 897dfaf (deploy run 38013450881, Version 496925bf-95b1-4fd7-8a0b-e1daea3953a7, the belly fix), unchanged.
Rollback: push `0d2010f` or `9c1270f` to `main`. `dev` = Steps 1, 2 and 3 (Step 3 not yet reviewed). Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid). **Live (`main`, unchanged):** texts, memory and /auto
on DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat; hearing Gemini 3.8 Flash; pictures Runware klein 9B with her face, body
and place references, the owner's reference set of 2026-10-10, `DAILY_USD` $1.
**On `dev`, not deployed:** Steps 1-2 (reviewed by Opus: golden picture plans, `drawPicture` = plan → send → `logPicture` into D1 `reem-studio`;
`/nsfw` Off / Nude / On per chat, default On). **Step 3 (Haiku, waiting on Opus):** `RUNWARE.LORA_INFO` (18 LoRAs with category, Civitai id,
trigger, note), `LORA_PREFIX_WITH` (the smartphone prefix only with phone2025), `povhandc` out of the word lists, `tools/options.mjs` (category
column, spare list), `tools/face/lora-bench.mjs`. Routing unchanged: no LoRA set and no hand words are decided yet (Opus picks).

## Step 3 bench (2026-10-11): Haiku's read, for Opus to check
Run `runs/2026-10-11-step3-lora-bench` on `face-candidates`: 72 pictures, `table.md` (every picture), `results.json`, `plan.txt`, zoom sheets, `haiku-reads-raw.md`.
Spend: $0.20397 by the bot's sum, equal to the Runware balance change ($14.92535 → $14.72138). Under the $0.25 cap; no retries.
1. **Ghost hands = the hand words.** Doggy (both seeds) and riding (seed 202): his hands on her butt/hips at V0 only; V1-V5 none.
2. **Missionary hands on her thighs** (V0, V3, V4, V5 at seed 101): a pose, not the words.
3. **Riding: a second head** behind her in all six (POV defect; no variant fixes it).
4. **Clothed bedroom, seed 202:** a bare nipple above a sheer slip at V0 only (four realism LoRAs, 2.3); V2, V3, V5 covered. One case.
5. **Blowjob penis reads long** in all six; POV_MAN's "average-sized" isn't honoured.
6. **Doggy vaginal vs anal: unresolved** on 260 px zooms; needs full-size judgement.

## Waiting on the owner
- **Commit trailers:** the attribution reminder asks for a Co-Authored-By line naming the model; the system rules bar model names in commits.
  Commits carry only the Claude-Session line (unchanged).
- **Your Telegram test of the belly fix**, and the 01:31:44 UTC picture of 2026-10-10 (a Runware "no picture" that Cloudflare redrew).
- **Do not send `/restart`**, though `/setup` says to: it wipes her memory.
- `tools/face/bench.json` still names the deleted `body-hourglass.jpg`; changing it starts the paid image bench (`image-bench.yml`).

## Verified this session (2026-10-11, twenty-seventh session)
- Sync report: OK after `git fetch --unshallow origin` (the warning about old branches is gone).
- Golden: `node tools/test/picture-plans.mjs --check` ok (28 cases); `node tools/check.mjs` 7/7 ok; `doc-check` 145 ok.
- Dry run of the bench: 72 plans built at $0; read the LoRA lists, hand-word counts and prefix per variant (36 smartphone prefixes = V0, V1, V3).
- Paid run: 72 drawn, 0 errors, $0.20397; balance read before and after (Runware MCP `account`). Every picture read at full size.
- Opus has not reviewed Step 3. Pictures read by Haiku only.

## Next steps (in order; one chat each; Opus reviews each Haiku step before the next)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Opus review of Step 3** (paste the Opus review prompt in `docs/WORKPLAN.md`): check Haiku's read on the zoom sheets and the pictures; pick
   the realism LoRA set and whether V1's hand words are adopted; decide doggy anatomy; write "Decided in review, for Step 4". *Effort: high*
2. **Step 4** (Haiku): outfits, the daily outfit, image 1 by outfit, nude back views, with a bench. ≤ $0.20. *Effort: high*
3. **Step 5** (Haiku): partly dressed and close-ups, with a bench. ≤ $0.10. *Effort: medium*
4. **Step 6** (Haiku runs, Opus judges): anal positions, with zoom-crop bench. ≤ $0.12. *Effort: medium*
5. **Step 7** (Haiku): the prompt studio at /studio, reading the D1 log. ≤ $0.05. *Effort: high*
6. **Step 8**: deploy and live checks when you say "deploy" (suggested after Steps 2, 6 and 7). *Effort: low*
7. **Your Telegram test** of the belly fix, and of `/nsfw` once deployed (at Off/Nude, see if /look refuses too often in a hot chat). *Effort: low*
8. **Runware "no picture" recurring?** `/spend` (`failed today`) for a few days; after the deploy, the studio log shows which picture. *Effort: low*
9. **Later, from before the plan:** Flux 4 Play tongue weight bench; a seated clothed pose that keeps the belly flat; `/look`'s DeepSeek answers
   (after the deploy, `llm_text` in the studio log); /spend vs the dashboards; a cheaper or better text model; `bench.json` → `body-nude.jpg`;
   old session branches (`tools/retired-branches.txt`, Actions > Delete retired branches). *Effort: medium*

## Open questions for the owner
- Once Opus has picked the LoRA set: should the realism stack stay at four LoRAs (V0) or drop to two (V2 or V3)? The bench says the bare nipple came
  from the full stack once; the fewer-LoRA sets cost less GPU time.
- Should the hand words (POV_MAN and the doggy/anal scenes) lose "his hands"? V1 removed his hands in every case where V0 had them.
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`? The sync check says no work is missing from `dev`.
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? The warning came again (done by hand this session).
- The old session branches still hold the old Reem pictures in their history (not on `dev`). Clear those too, or leave them?
- Once deployed, Step 2 changes the default: a chat that never set `/nsfw` is On, and at On about 1 in 3 of her own pictures in a hot chat are nude
  (your 2026-10-11 decision). Deploy only when you say so.

## Prompt for the next chat
Pick **Opus** and paste the Opus review prompt for Step 3 from `docs/WORKPLAN.md` (it reviews this bench first). Or say "deploy" first to ship Steps 1-2.
