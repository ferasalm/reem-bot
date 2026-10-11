# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. **Work plan: `docs/WORKPLAN.md`** (2026-10-11): the eight steps, their specs, and the notes at its end.

**Last updated:** 2026-10-11 (thirty-fourth session: **Haiku 5.5**, effort max per the session record. Step 7 built, Step 8 done: the owner said "Also deploy".)
**Deployed:** `main` = d21c4b3 (Steps 1-7; Deploy to Cloudflare run 38115691263, Version ID d000a6a5-c932-49b4-b326-37552a825c6d).
Rollback: push `897dfaf` to `main`. `dev` = this handoff's commit on top: docs only, no code difference. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. **Live (`main`) from this session:** Steps 1-7. Texts, memory, /auto on DeepSeek V4 Flash; voice Sulafat; hearing Gemini; pictures Runware klein 9B with her face, body and place references, Cloudflare klein when Runware fails; `DAILY_USD` $1.
- Steps 2-6, live (default On, every chat starts On): `/nsfw` Off / Nude / On; her own nudes about 1 in 3 of her pictures when a chat is hot, a few when warm, none when calm, at /nsfw Nude or On; anal positions; outfits by situation and one home outfit a day.
- Step 7, live: `/studio` in your chat sends a private link. The page logs every picture from D1 `pictures` (30 a page), composes from /pic words through the bot's own plan, generates 1-4 pictures on Runware, and keeps presets. The studio's money is its own: `studioUsd`, $1 a day.
- **Deviations from the Step 7 spec (Opus to decide):** (1) compose takes /pic words only: scene, look and selfie are not in the editor;
  (2) no Cloudflare klein in the studio: klein 9B and TwinFlow (Runware) only; (3) the editor's place is a place's first crop, the bot picks
  at random; compose names the place, not the crop; (4) studio draws send `checkContent` false (the owner's own tool).

## Checks run and read (2026-10-11, thirty-fourth session)
- Before the deploy: `node tools/check.mjs` 8 of 8 ok, read in full (panel, worker parses, unit, scenarios, e2e, studio, golden plans, docs).
  `tools/test/studio.mjs` 30 ok; golden plans 38 cases match (no Runware request changed); unit all passed; `doc-check` 152 ok.
- One real draw from the container (`studioCompose`, then `studioDraw`): $0.00247, 768x1344, read at full size. The words are there; the
  place is not (an indoor bedroom, not a porch). Runware usage moved by exactly that cost; its `balance` field did not (LESSONS).
- The page in Chromium at 390x844 (`/studio/api/*` answered by fixtures): 15 checks ok, no console errors; screenshots read.
- **Deploy (Step 8):** Deploy to Cloudflare run 38115691263 (run_number 41): every step success; `cf-resources` normal "already exists";
  Deploy Worker with RUNWARE_API_KEY; `/health` ok (a picture and a vision description); `/setup` all ✅. Tests run 38115691254 (run 534):
  success. The `/health` picture is D1 row 1 (source health): the `STUDIO_DB` binding writes. The container can't reach workers.dev (proxy
  403), so `/studio` and `/nsfw` were not probed: the owner's Telegram test does them. DECISIONS (2026-10-11, deploy entry), QUALITY (deploy section).
- Pictures: `face-candidates` `runs/2026-10-11-step7-studio/` (studio-draw-1.jpg, table.md with the read), commit 02d32d5.

## Waiting on the owner
- **Your Telegram test, now live:** (a) `/studio` in your chat, open the link, make one picture in the editor (about $0.003); (b) `/nsfw`
  Off, Nude and On, one picture each; (c) her own nudes when a chat is hot; (d) the belly fix (2026-10-10) and anal pictures (`/pic anal`,
  `/pic missionary anal`). Do not send `/restart` (it wipes her memory).
- **Opus review of Step 7** (new chat, Opus, the review prompt in WORKPLAN): the deviations above, the porch picture, and your test results.
- **Records rule vs system rule:** your rule asks each record to name the raw model ID; this session's instructions forbid model IDs in
  pushed artifacts. Records name the model only ("Haiku 5.5"). Tell me which wins.
- **Model and effort:** Step 7 ran in Haiku 5.5 as you asked (effort max per the session record); HANDOFF had recommended Sonnet 5.5 at high effort.

## Next steps (in order; one chat each)
1. **Opus review of Step 7** (now live): read this HANDOFF, the Step 7 commits, the golden check, the deploy entry in DECISIONS and the
   face-candidates picture; decide the deviations; write the review notes under "Decided in review" in WORKPLAN. *Effort: high.* Model: Opus.
2. **Your Telegram tests** (above). If `/studio` or `/nsfw` misbehaves, say what you see; the rollback is `897dfaf` to `main`. *Effort: low.*
3. **Later** (Opus to diagnose, Haiku to draw): the porch_night crop (a bedroom came out); the studio's scene, look and selfie sources and
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
