# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. **Work plan: `docs/WORKPLAN.md`** (2026-10-11): the eight steps, their specs, and the notes at its end.

**Last updated:** 2026-10-11 (thirty-fourth session: **Haiku 5.5**, effort max per the session record; Step 7 done, waiting on review. On `dev`.)
**Deployed:** `main` = 897dfaf (unchanged; read with `git ls-remote origin main`). Rollback: push `0d2010f` or `9c1270f` to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. **Live (`main`):** texts, memory, /auto on DeepSeek V4 Flash; voice Sulafat; hearing Gemini; pictures Runware klein 9B with her face, body and place references, `DAILY_USD` $1.
**On `dev`, not deployed:** Steps 1-7. **Step 7 done, waiting on review:** the prompt studio at /studio, built and tested.
- Built: `studio.js` (the page, vanilla, inline); the worker.js block "The prompt studio": the owner's signed link (`/studio`; `/studio reset`
  ends old links), the cookie, the log from D1 `pictures` (30 a page, source filter), compose (the bot's own plan for /pic words, through
  `drawPicture` with `planOnly`: nothing drawn or logged), Generate (one Runware task, 1-4 pictures, LoRAs, references, sampler), presets
  (D1 `presets`), pictures from KV `simg:<id>` (30 days) or Telegram's copy. Money: ledger `studioUsd` at `STUDIO.DAILY_USD` $1, separate
  from the bot's $1. CONFIG.STUDIO, MESSAGES.STUDIO_*, the `studio` command, panel rows.
- Deviations from the Step 7 spec (Opus to decide): (1) compose takes /pic words only: scene, look and selfie are not in the editor;
  (2) no Cloudflare klein in the studio: klein 9B and TwinFlow (Runware) only; (3) the editor's place is a place's first crop, the bot
  picks at random; compose names the place, not the crop; (4) draws send `checkContent` false (the owner's own tool).

## Checks run and read (2026-10-11, Step 7)
- `node tools/check.mjs`: all 8 ok, read in full (panel, worker parses, unit, scenarios, e2e, studio, golden plans, docs).
- `tools/test/studio.mjs`: 30 ok, read in full: token (tamper, other chat, expiry, epoch), routes (bad token 404, cookie and headers,
  no cookie 404, reset), `/studio` owner-only, compose = golden "/pic messy bun on the porch" (prompt, model, size, sampler, LoRAs, refs
  up to the crop suffix), draw (one task, two pictures, settings, log rows, KV, studioUsd), the cap (refused before Runware), log paging
  (30/30/5), source filter, pictures, options, the page's script parses.
- Golden plans: 38 cases match (no Runware request changed). Unit: all passed (the new MESSAGES keys got panel rows).
- **One real draw from the container** (`studioCompose`, then `studioDraw`): 1 picture, $0.00247, 9.4 s, 768x1344; klein 9B with face-2x,
  body-v10, place:porch_night, InstaPic 0.6, Real HD 2K 0.5; 5 steps, CFG 1. **Read at full size (Haiku's read):** messy bun, red lipstick
  and black turtleneck as asked; **not a porch**: an indoor bedroom with a bed and lamp. Opus to check the porch_night crop.
- **Money:** Runware `balance` 14.27379 before and after (the field lagged); usage total 5.77868 → 5.78115: the draw's $0.00247.
- **Page in Chromium** (390x844; `/studio/api/*` answered by fixtures, no Worker): 15 checks ok, no console errors; log and editor
  screenshots read (LESSONS and MAP have the method; not in check.mjs).
- Pictures: `face-candidates` `runs/2026-10-11-step7-studio/` (studio-draw-1.jpg, table.md with the read), commit 02d32d5.

## Waiting on the owner
- **Opus review of Step 7** (new chat, Opus, the review prompt in WORKPLAN): the deviations above and the porch picture.
- **Deploy** when you say "deploy" (suggested after Steps 2, 6 and 7). `main` = 897dfaf until then.
- **Your Telegram test:** the belly fix (deployed 2026-10-10), /nsfw and anal pictures after a deploy, and `/studio` once deployed: send
  `/studio` in your chat, open the link, make one picture. Do not send `/restart` (it wipes her memory).
- **Model and effort:** Step 7 ran in Haiku 5.5 as you asked; HANDOFF had recommended Sonnet 5.5 at high effort for it.
- **Records rule vs system rule:** your 2026-10-11 rule asks each record to name the raw model ID too; this session's instructions forbid
  model IDs in pushed artifacts. Records here name the model only ("Haiku 5.5"). Tell me which wins.

## Next steps (in order; one chat each)
1. **Step 7 review** (Opus): read this HANDOFF, the Step 7 commits on dev, the golden check and the face-candidates picture; decide the
   deviations; write "Decided in review, for Step 8" in WORKPLAN. *Effort: high.* Model: Opus.
2. **Step 8: deploy and live checks** when you say "deploy": `git push origin origin/dev:main`, watch Deploy and Tests, read `/health`
   and `/setup`, confirm the D1 binding (a new `pictures` row after your first picture, read with `d1_database_query`), open `/studio`.
   Model: Haiku 5.5 or Sonnet (commands and log reads). *Effort: low.*
3. **Your Telegram test** of the belly fix, /nsfw, anal pictures and /studio once deployed. *Effort: low.*
4. **Later** (Opus to diagnose, Haiku to draw): the porch_night crop (a bedroom came out); the studio's scene, look and selfie sources and
   Cloudflare klein; a frontal anal LoRA for missionary; the second head on riding; Step 5's open questions; hair drifting to brown
   highlights; the blowjob arms; Flux 4 Play tongue weight; `/look`'s DeepSeek answers (`llm_text`); /spend vs the dashboards; a cheaper
   text model; old session branches. *Effort: medium.*

## Open questions for the owner
- Records: the raw model ID (your rule) or no model IDs in pushed files (the session's instructions)? Which wins?
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`? (The sync check says no work is missing from `dev`.)
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? (Done by hand again; then the report said OK.)
- Old session branches still hold the old Reem pictures in their history. Clear them, or leave them?
- LESSONS.md is at 179 lines (the limit is 180). OK for the next session to summarize it to about 150 on Haiku (your rule)?

## Prompt for the next chat
Pick **Opus** (effort high) and paste the "Opus review prompt (Step N)" from `docs/WORKPLAN.md` with N = 7.
