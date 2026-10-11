# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.
**Work plan: `docs/WORKPLAN.md`** (2026-10-11): the next eight steps, their specs and the prompts to paste.

**Last updated:** 2026-10-11 (twenty-fourth session: **Opus review of Step 1 done**, three fixes, notes for Step 2 written. On `dev`.)
**Deployed:** `main` = 897dfaf (deploy run 38013450881, Version 496925bf-95b1-4fd7-8a0b-e1daea3953a7, the belly fix), unchanged.
Rollback: push `0d2010f` or `9c1270f` to `main`. `dev` = Step 1 + its review. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid). **Live (`main`, unchanged):** texts, memory and /auto on
DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat; hearing Gemini 3.8 Flash; pictures Runware klein 9B with her face, body and
place references (retried once, then Cloudflare klein), the owner's reference set of 2026-10-10, `DAILY_USD` $1.
**WORKPLAN Step 1, reviewed, on `dev`, not deployed:** golden picture plans (`tools/test/picture-plans.mjs`, 25 cases, $0); `drawPicture` =
`runwarePlan` → `drawRunware` (sends only, a seed per picture) → `logPicture` into D1 `reem-studio` (`STUDIO_DB`). Opus's fixes (WORKPLAN
"Step 1 review"): the schema is now a `batch()` of prepared statements (D1's `exec()` would have failed on the 3-line CREATE TABLE and lost
every row live); a klein retry sends the next seed; /look's in-person fallback logs source "look". Haiku's four calls stand.
**Notes for Step 2** are in WORKPLAN "Decided in review, for Step 2" (checkContent in the plan, `pictureFlags` by level, new golden cases).

## Waiting on the owner
- **Commit trailers** (still open): the attribution reminder asks for a Co-Authored-By line naming the model; the system rules bar model names
  in commits. Commits carry only the Claude-Session line.
- **Your Telegram test of the belly fix**, and the 01:31:44 UTC picture of 2026-10-10 (a Runware "no picture" that Cloudflare redrew).
- **Do not send `/restart`**, though `/setup` says to: it wipes her memory.
- `tools/face/bench.json` still names the deleted `body-hourglass.jpg`; changing it starts the paid image bench (`image-bench.yml`).

## Verified this session (2026-10-11, twenty-fourth session)
- Sync report: OK after `git fetch --unshallow origin`. Read: WORKPLAN Step 1 spec, the whole Step 1 diff (`cd76cee..e142e68`).
- After the fixes, `node tools/check.mjs`, read in full: `all 7 checks passed`, picture plans match golden (**golden diff: none**).
  Unit, read: `all passed`, including the new rows "the schema as three single statements" and "klein's retry sends the next
  seed" (41, then 42; the row keeps 42), and `pcmToMp3` (it now runs).
- `STUDIO_SCHEMA` split as the Worker splits it, run in `node:sqlite`: 3 statements, tables `pictures`, `pictures_at`, `presets`.
- D1's exec rule: Cloudflare docs (MCP search) show exec errors as "Error in line N". No Runware call, $0; no deploy; `main` untouched.

## Next steps (in order; one chat each; Opus reviews each Haiku step before the next)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **WORKPLAN Step 2** (Haiku): /nsfw Off/Nude/On, her own nudes, the SELF_CHOICE line. $0. *Effort: medium*
2. **Step 3** (Haiku runs, Opus judges): LoRA catalog, realism diet and ghost-hands bench, 72 pictures. ≤ $0.25. *Effort: medium*
3. **Step 4** (Haiku): outfits, the daily outfit, image 1 by outfit, nude back views, with a bench. ≤ $0.20. *Effort: high*
4. **Step 5** (Haiku): partly dressed and close-ups, with a bench. ≤ $0.10. *Effort: medium*
5. **Step 6** (Haiku runs, Opus judges): anal positions, with zoom-crop bench. ≤ $0.12. *Effort: medium*
6. **Step 7** (Haiku): the prompt studio at /studio, reading the D1 log. ≤ $0.05. *Effort: high*
7. **Step 8**: deploy and live checks when you say "deploy" (suggested after Steps 2, 6 and 7; the D1 binding ships with it). *Effort: low*
8. **Your Telegram test** of the belly fix (any time). *Effort: low*
9. **Runware "no picture" recurring?** `/spend` (`failed today`) for a few days; after the deploy, the studio log shows which picture. *Effort: low*
10. **Later, from before the plan:** Flux 4 Play tongue weight bench; a seated clothed pose that keeps the belly flat; `/look`'s DeepSeek answers
    (after the deploy, `llm_text` in the studio log); /spend vs the dashboards; a cheaper or better text model; `bench.json` → `body-nude.jpg`;
    old session branches (`tools/retired-branches.txt`, Actions > Delete retired branches). *Effort: medium*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`? The sync
  check says no work is missing from `dev`.
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? The warning came again (done by hand this session).
- Commit trailers (above).
- The old session branches still hold the old Reem pictures in their history (not on `dev`). Clear those too, or leave them?

## Prompt for the next chat
Pick **Haiku 5.5** and paste the Haiku prompt from `docs/WORKPLAN.md` with N = 2 and $X = 0. Then run the Opus review of Step 2.
