# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.
**Work plan: `docs/WORKPLAN.md`** (2026-10-11): the next eight steps, their specs and the prompts to paste.

**Last updated:** 2026-10-11 (twenty-fifth session: **WORKPLAN Step 2 done, waiting on review**: /nsfw built, golden unchanged. On `dev`.)
**Deployed:** `main` = 897dfaf (deploy run 38013450881, Version 496925bf-95b1-4fd7-8a0b-e1daea3953a7, the belly fix), unchanged.
Rollback: push `0d2010f` or `9c1270f` to `main`. `dev` = Steps 1 and 2 with Step 1's review. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid). **Live (`main`, unchanged):** texts, memory and /auto on
DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat; hearing Gemini 3.8 Flash; pictures Runware klein 9B with her face, body and
place references (retried once, then Cloudflare klein), the owner's reference set of 2026-10-10, `DAILY_USD` $1.
**Step 1 (reviewed by Opus, on `dev`):** golden picture plans, `drawPicture` = plan → send → `logPicture` into D1 `reem-studio`.
**Step 2 done, waiting on review (on `dev`, not deployed):** `/nsfw` Off / Nude / On per chat (`s:<chat>`.nsfw, default On, buttons `nsfw:`).
- Her own nudes: a `nude` tier (HOT 0.33, WARM 0.05, CALM 0), only at Nude or On and only on Runware; "send nudes" is the nude tier at
  Nude/On, boudoir at Off. The 2026-10-02 line "Your pictures never show you fully naked." is gone from SELF_CHOICE; `{nude}` = NSFW.SELF_NUDE.
- Off: no nudity, no sex acts, no NUDE/ACT LoRAs, Runware's `checkContent` on (lingerie and boudoir stay); a picture asking for more gets
  PIC_NSFW ("That picture needs /nsfw nude (it's Off now)"). Nude: nudity, no sex acts (NOT_DRAWN applies). On: as before.
- **Claude's calls in Step 2 (for Opus to judge):** the nude tier is Runware-only (Cloudflare draws nothing nude); `PLACES.NUDE` added
  (= boudoir's places, not named in the spec); at Off `drawPicture` still gets the words it's given (the entry points refuse nude words,
  Runware's check is the second guard); /look refuses a text the level doesn't allow, at On it's drawn as before; levels are checked by
  name (`actsOff`), so a callback that passes an index (`.map(W.sexCue)`) reads as On; a scene whose only sentence about her is cut at Off
  draws no picture (the same as any scene with no sentence about her).
- Golden: the 25 existing cases unchanged; 3 added (Off "naked on the bed", Nude "naked on the bed", Nude "topless, jeans on, mirror selfie").
  The Nude case matches the On plan on body, clause, LoRAs, sampler and size; the place crop and mood differ (each case draws its own picks).

## Waiting on the owner
- **Commit trailers** (still open): the attribution reminder asks for a Co-Authored-By line naming the model; the system rules bar model names
  in commits. Commits carry only the Claude-Session line.
- **Your Telegram test of the belly fix**, and the 01:31:44 UTC picture of 2026-10-10 (a Runware "no picture" that Cloudflare redrew).
- **Do not send `/restart`**, though `/setup` says to: it wipes her memory.
- `tools/face/bench.json` still names the deleted `body-hourglass.jpg`; changing it starts the paid image bench (`image-bench.yml`).

## Verified this session (2026-10-11, twenty-fifth session)
- Sync report: OK after `git fetch --unshallow origin` (no other branch has work missing). Read: WORKPLAN Step 2 and "Decided in review,
  for Step 2"; `docs/MAP.md`; every picture function Step 2 touches (grep, then the lines needed; `worker.js` never read whole).
- `node tools/check.mjs`, read: `all 7 checks passed` (settings panel regenerated, parses, unit, scenarios, e2e, golden, docs).
- Counts, read: unit 250 ok, 0 FAIL (9 new, the `/nsfw` block); scenarios 1238 ok (7 new, the `/nsfw` block; the one "FAIL" match is the
  existing row "...failed: FAILED_TEXT", which passes); e2e exit 0, no false check (5 new: the `/nsfw` step, buttons and a tap, args);
  picture plans 28 ok (**golden diff: 123 lines added, 0 removed**).
- Grep of `worker.js` for "never" near naked/nude/topless: no prompt string left (SELF_CHOICE was the only one). Comments checked: line
  ~772 corrected; the Cloudflare-route texts, the DAILY_USD comment and the /health and /setup lines say "never nude" for Cloudflare only: accurate.
- Runware: no live call (every test stubs `fetch`). Balance read at the end: **$14.93** (Runware MCP `account`). No balance was read before
  this session started, so the spend is $0 by construction, not by a before/after diff.

## Next steps (in order; one chat each; Opus reviews each Haiku step before the next)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Opus review of Step 2** (Opus, *effort: medium*): paste the Opus review prompt from WORKPLAN with N = 2. Judge the calls above, fix slips,
   write the notes for Step 3 under "Decided in review".
2. **WORKPLAN Step 3** (Haiku runs, Opus judges): LoRA catalog, realism diet, ghost-hands bench, 72 pictures. ≤ $0.25. *Effort: medium*
3. **Step 4** (Haiku): outfits, the daily outfit, image 1 by outfit, nude back views, with a bench. ≤ $0.20. *Effort: high*
4. **Step 5** (Haiku): partly dressed and close-ups, with a bench. ≤ $0.10. *Effort: medium*
5. **Step 6** (Haiku runs, Opus judges): anal positions, with zoom-crop bench. ≤ $0.12. *Effort: medium*
6. **Step 7** (Haiku): the prompt studio at /studio, reading the D1 log. ≤ $0.05. *Effort: high*
7. **Step 8**: deploy and live checks when you say "deploy" (suggested after Steps 2, 6 and 7; the D1 binding ships with it). *Effort: low*
8. **Your Telegram test** of the belly fix, and of `/nsfw` (any time: `/nsfw` shows the level and its buttons). *Effort: low*
9. **Runware "no picture" recurring?** `/spend` (`failed today`) for a few days; after the deploy, the studio log shows which picture. *Effort: low*
10. **Later, from before the plan:** Flux 4 Play tongue weight bench; a seated clothed pose that keeps the belly flat; `/look`'s DeepSeek answers
    (after the deploy, `llm_text` in the studio log); /spend vs the dashboards; a cheaper or better text model; `bench.json` → `body-nude.jpg`;
    old session branches (`tools/retired-branches.txt`, Actions > Delete retired branches). *Effort: medium*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`? The sync check says no work is missing from `dev`.
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? The warning came again (done by hand this session).
- Commit trailers (above).
- The old session branches still hold the old Reem pictures in their history (not on `dev`). Clear those too, or leave them?
- Step 2 on `dev` changes what the bot does at its default: a chat that never set `/nsfw` is On, as before. Deploy only when you say so.

## Prompt for the next chat
Pick **Opus** and paste the Opus review prompt from `docs/WORKPLAN.md` with N = 2. Then Haiku 5.5 for Step 3 with N = 3 and $X = 0.25.
