# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.
**Work plan: `docs/WORKPLAN.md`** (2026-10-11): the next eight steps, their specs and the prompts to paste.

**Last updated:** 2026-10-11 (twenty-third session: WORKPLAN Step 1 built and checked, on `dev`. **Step 1 done, waiting on review.**)
**Deployed:** `main` = 897dfaf (deploy run 38013450881, Version 496925bf-95b1-4fd7-8a0b-e1daea3953a7, the belly fix), unchanged.
Rollback: push `0d2010f` or `9c1270f` to `main`. `dev` = Step 1 (`e142e68`) plus this handoff commit. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid). **Live (`main`, unchanged):** texts, memory and /auto on
DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat; hearing Gemini 3.8 Flash; pictures Runware klein 9B with her face, body and
place references (retried once, then Cloudflare klein), the owner's reference set of 2026-10-10, `DAILY_USD` $1.
**Step 1 of WORKPLAN, on `dev`, not deployed** (Haiku, $0 spent):
- Golden picture plans: `tools/test/picture-plans.mjs` runs 25 cases of the bot's own picture code with the network stubbed (every Runware
  request recorded as sent; clock frozen; Math.random seeded). Golden: `tools/test/picture-plans.golden.json`. In `check.mjs` and the mocked CI job.
- Split: `drawPicture` = `runwarePlan` (no network: tries, text, references by name, LoRAs, sampler; `pictureFlags`) → `drawRunware` (sends only;
  now a seed per picture) → `logPicture`. The golden did not change.
- Studio log: D1 `reem-studio` (binding `STUDIO_DB`, id ee34d51e-36b8-43f4-8c53-cdc4282cb93a), tables `pictures` and `presets` (`STUDIO_SCHEMA`,
  applied once per isolate). One row per `drawPicture` call: prompt, LoRAs, reference names, seed, cost, attempts, ok, error, source, chat, his
  words, /look's DeepSeek text (`llm_text`); `logSent` stores Telegram's thumb and full copies. One JSON line per picture. Empty until the first
  picture after a deploy.

## Waiting on the owner
- **Review of Step 1 with Opus** (its prompt is in `docs/WORKPLAN.md`). Claude's calls, for the review: the log `kind` precedence (alone > act >
  partial > nude > clothed); Runware pictures now send a seed (what Runware gets changes, not the prompts); both klein tries are planned before
  the first send (same random order; the golden shows it); the test that checked LoRAs through `drawRunware` now checks `runwarePlan` (same values).
- **Pre-existing, not changed:** `tools/test/unit.mjs` calls `process.exit` before its last test (`pcmToMp3`), so that test never runs. Fix:
  move the exit to the end. Say if Claude should do it.
- **Commit trailers** (still open): the attribution reminder asks for a Co-Authored-By line naming the model; the system rules bar model names
  in commits. Commits carry only the Claude-Session line.
- **Your Telegram test of the belly fix**, and the 01:31:44 UTC picture of 2026-10-10 (a Runware "no picture" that Cloudflare redrew).
- **Do not send `/restart`**, though `/setup` says to: it wipes her memory.
- `tools/face/bench.json` still names the deleted `body-hourglass.jpg`; changing it starts the paid image bench (`image-bench.yml`).

## Verified this session (2026-10-11, twenty-third session)
- Sync report: OK after `git fetch --unshallow origin`; nothing missing from `dev`. WORKPLAN Step 1 read in full; "Decided in review" was empty.
- Golden: `--write` on the unchanged code (25 cases), then `--check` twice: `ok 25 cases match the golden` both times. After the split, `--check`
  read: `ok 25 cases match the golden`. **Golden-plan diff summary: no line of any case changed** (prompts, LoRA lists, sizes, steps, CFG,
  acceleration, reference names). Not in the golden, by design: the seed now sent to Runware.
- `node tools/check.mjs` on the split, read in full: `all 7 checks passed` (settings panel, worker.js parses, unit, scenarios, e2e, picture plans
  match golden, docs). Unit output read: `all passed`; the new studio checks ok (one row per picture with the prompt, LoRAs and seed as sent;
  schema applied once; drawPicture returns the row id; Telegram thumb 320 px and full 800 px; no binding and a failed write still return the
  picture; klein planned twice with the 2x face first; /look without her is `alone`). Scenarios exit 0; e2e exit 0 (`all passed`).
- D1: `d1_database_create` (ENAM); `d1_database_query` created `pictures` (+ `pictures_at`) and `presets`; `sqlite_master` read: both present.
- Actions, read: **Cloudflare resources run 38100867556 (dev), success**: `wrangler d1 info reem-studio` printed the `STUDIO_DB` binding and
  `num_tables 2`; the vectorize 3002 and 40004 lines are the normal already-exists errors. **Tests run 38100865365 (`e142e68`), success**: sync,
  mocked (unit, scenarios, e2e, picture plans `--check`, docs, wrangler dry-run) all success; `live` skipped (no `[live]`).
- Runware balance: $14.92535 before and after; total requests 1562 before and after (no Runware call from this session).
- **Pictures: none drawn** (budget $0). The bench output is text only: `tools/test/picture-plans.golden.json`.
- Not done: no deploy; `main` untouched.

## Next steps (in order; one chat each; Opus reviews each Haiku step before the next)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Opus review of Step 1** (WORKPLAN, "Opus review prompt (Step 1)"). *Effort: medium*
2. **WORKPLAN Step 2** (Haiku): /nsfw Off/Nude/On, her own nudes, the SELF_CHOICE line. $0. *Effort: medium*
3. **Step 3** (Haiku runs, Opus judges): LoRA catalog, realism diet and ghost-hands bench, 72 pictures. ≤ $0.25. *Effort: medium*
4. **Step 4** (Haiku): outfits, the daily outfit, image 1 by outfit, nude back views, with a bench. ≤ $0.20. *Effort: high*
5. **Step 5** (Haiku): partly dressed and close-ups, with a bench. ≤ $0.10. *Effort: medium*
6. **Step 6** (Haiku runs, Opus judges): anal positions, with zoom-crop bench. ≤ $0.12. *Effort: medium*
7. **Step 7** (Haiku): the prompt studio at /studio, reading the D1 log. ≤ $0.05. *Effort: high*
8. **Step 8**: deploy and live checks when you say "deploy" (suggested after Steps 2, 6 and 7; the D1 binding ships with it). *Effort: low*
9. **Your Telegram test** of the belly fix (any time). *Effort: low*
10. **Runware "no picture" recurring?** `/spend` (`failed today`) for a few days; after the deploy, the studio log shows which picture. *Effort: low*
11. **Later, from before the plan:** Flux 4 Play tongue weight bench; a seated clothed pose that keeps the belly flat; `/look`'s DeepSeek answers
    (after the deploy, `llm_text` in the studio log); /spend vs the dashboards; a cheaper or better text model; `bench.json` → `body-nude.jpg`;
    old session branches (`tools/retired-branches.txt`, Actions > Delete retired branches). *Effort: medium*

## Open questions for the owner
- OK to fix the `unit.mjs` exit order (above), and to press Actions > Delete retired branches for `tools/retired-branches.txt`? The sync
  check says no work is missing from `dev`.
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? The warning came again (done by hand this session).
- Commit trailers (above).
- The old session branches still hold the old Reem pictures in their history (not on `dev`). Clear those too, or leave them?

## Prompt for the next chat
Pick **Opus**, paste the Opus review prompt for Step 1 from `docs/WORKPLAN.md`. Then Step 2 in **Haiku 5.5** (its prompt, N = 2, $X = 0).
