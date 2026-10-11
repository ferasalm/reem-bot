# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.
**Work plan: `docs/WORKPLAN.md`** (2026-10-11): the next eight steps, their specs and the prompts to paste.

**Last updated:** 2026-10-11 (twenty-sixth session: **Opus review of Step 2 done**, two slips fixed; LESSONS cap 180. On `dev`.)
**Deployed:** `main` = 897dfaf (deploy run 38013450881, Version 496925bf-95b1-4fd7-8a0b-e1daea3953a7, the belly fix), unchanged.
Rollback: push `0d2010f` or `9c1270f` to `main`. `dev` = Steps 1 and 2, both reviewed. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid). **Live (`main`, unchanged):** texts, memory and /auto on
DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat; hearing Gemini 3.8 Flash; pictures Runware klein 9B with her face, body and
place references (retried once, then Cloudflare klein), the owner's reference set of 2026-10-10, `DAILY_USD` $1.
**On `dev`, not deployed (Steps 1 and 2, reviewed by Opus):** golden picture plans; `drawPicture` = plan → send → `logPicture` into D1
`reem-studio`; `/nsfw` Off / Nude / On per chat (default On), her own nudes (nude tier HOT 0.33, WARM 0.05, CALM 0, Runware only;
"send nudes" → nude tier at Nude/On, boudoir at Off). Off: clothed body, no nude/act LoRAs, Runware `checkContent` on; /pic and /look answer
PIC_NSFW with the level a picture needs.
- **This review (details in WORKPLAN "Step 2 review"):** Haiku's six calls stand. Fixed: her own `[selfie: naked ...]` got a random tier
  even at On (naked had left BOUDOIR_ASK_PATTERN, which `selfiePicture` also reads) → nude tier where allowed (`nudeTierOk`), else boudoir;
  a nude-tier picture refused by Cloudflare (3030, Runware past its cap) fell to everyday → boudoir, then flirty.
- Left for later: at Off/Nude, /look's DeepSeek writer isn't told the level, so in a hot chat /look often answers PIC_NSFW.
- LESSONS.md cap is now 180 lines (owner); at 180, summarize back to ~150.

## Waiting on the owner
- **Commit trailers** (still open): the attribution reminder asks for a Co-Authored-By line naming the model; the system rules bar model names
  in commits. Commits carry only the Claude-Session line.
- **Your Telegram test of the belly fix**, and the 01:31:44 UTC picture of 2026-10-10 (a Runware "no picture" that Cloudflare redrew).
- **Do not send `/restart`**, though `/setup` says to: it wipes her memory.
- `tools/face/bench.json` still names the deleted `body-hourglass.jpg`; changing it starts the paid image bench (`image-bench.yml`).

## Verified this session (2026-10-11, twenty-sixth session)
- Sync report: OK after `git fetch --unshallow origin`. Read: WORKPLAN Step 2, its review notes, the Step 2 commit's full worker.js diff,
  `runwareLoras`/`runwarePlan` (Off → explicit false → no NUDE/ACT LoRAs), the 3 new golden cases, the 3030 fallback in `startPicture`.
- Golden: `git diff --numstat` 123 added, 0 removed (the 25 cases untouched); my fixes leave it unchanged (`--check` ok).
- New scenario rows: "her [selfie: naked ...]: the nude tier at On and Nude, boudoir at Off", "... on Cloudflare: boudoir", "nude tier
  refused by Cloudflare (3030): drawn again in the boudoir wardrobe". Each was run against the code without its fix: FAIL; with it: ok.
- Grep for "never" near naked/nude/topless: only comments (lines ~772, 778, 895, 1280, 5831), all accurate.
- `node tools/check.mjs`, read: `all 7 checks passed`; doc-check 144 ok. No Runware call; no bench pictures (Step 2 was $0).

## Next steps (in order; one chat each; Opus reviews each Haiku step before the next)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **WORKPLAN Step 3** (Haiku runs, Opus judges): LoRA catalog, realism diet, ghost-hands bench, 72 pictures. ≤ $0.25. *Effort: medium*
2. **Step 4** (Haiku): outfits, the daily outfit, image 1 by outfit, nude back views, with a bench. ≤ $0.20. *Effort: high*
3. **Step 5** (Haiku): partly dressed and close-ups, with a bench. ≤ $0.10. *Effort: medium*
4. **Step 6** (Haiku runs, Opus judges): anal positions, with zoom-crop bench. ≤ $0.12. *Effort: medium*
5. **Step 7** (Haiku): the prompt studio at /studio, reading the D1 log. ≤ $0.05. *Effort: high*
6. **Step 8**: deploy and live checks when you say "deploy" (suggested after Steps 2, 6 and 7: Steps 1-2 are reviewed and can go now; the D1 binding ships with it). *Effort: low*
7. **Your Telegram test** of the belly fix, and of `/nsfw` once deployed (`/nsfw` shows the level and its buttons; at Off/Nude, see if /look refuses too often in a hot chat). *Effort: low*
8. **Runware "no picture" recurring?** `/spend` (`failed today`) for a few days; after the deploy, the studio log shows which picture. *Effort: low*
9. **Later, from before the plan:** Flux 4 Play tongue weight bench; a seated clothed pose that keeps the belly flat; `/look`'s DeepSeek answers
    (after the deploy, `llm_text` in the studio log); /spend vs the dashboards; a cheaper or better text model; `bench.json` → `body-nude.jpg`;
    old session branches (`tools/retired-branches.txt`, Actions > Delete retired branches). *Effort: medium*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`? The sync check says no work is missing from `dev`.
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? The warning came again (done by hand this session).
- Commit trailers (above).
- The old session branches still hold the old Reem pictures in their history (not on `dev`). Clear those too, or leave them?
- Once deployed, Step 2 changes the default: a chat that never set `/nsfw` is On, and at On about 1 in 3 of her own pictures in a hot chat are nude (your 2026-10-11 decision). Deploy only when you say so.

## Prompt for the next chat
Pick **Haiku 5.5** and paste the Haiku prompt from `docs/WORKPLAN.md` with N = 3 and $X = 0.25 (it applies "Decided in review, for Step 3" first). Or say "deploy" first to ship Steps 1-2.
