# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.
**Work plan: `docs/WORKPLAN.md`** (2026-10-11): the eight steps, their specs, and the "Decided in review" notes at its end.

**Last updated:** 2026-10-11 (thirtieth session, **Opus**: Step 4 reviewed, four slips fixed, `CLOTHED_BODY` "none". On `dev`.)
**Deployed:** `main` = 897dfaf (deploy run 38013450881), unchanged. Rollback: push `0d2010f` or `9c1270f` to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. **Live (`main`):** texts, memory, /auto on DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat; hearing Gemini; pictures Runware klein 9B with her face, body and place references, `DAILY_USD` $1.
**On `dev`, not deployed:** Steps 1-4, each reviewed by Opus (Step 4 built by Haiku, reviewed this session).
- **Step 4 as reviewed:** realism LoRAs InstaPic + Real HD 2K; one home and one out outfit a day (KV "day", by temperature band, never
  yesterday's); everyday pictures and /pic that name no clothes wear them; an outfit with a picture is image 1 itself; **other clothed
  pictures send no body picture** (`CLOTHED_BODY` "none", REFERENCE_NOBODY); nude back views use the back body.
- **Why "none":** klein copies the garment in a clothed image 1. The rust halter cut tops to its crop length (3 pictures), a neutral
  gray tank put its scoop neck on other tops (3). No body picture: 0 of 18 leaked, not slimmer than rust. Built but not default:
  "nude" (v10 as image 1: fullest build, 6/6 dressed, one seed) and "neutral" (`tools/face/body-neutral.jpg`).
- **Fixed in review** (unit rows fail on the old code): the day's outfit re-rolled after a weather refresh in the same reply; "out",
  "rain", "snow" put her in street clothes at home; her sex-act words got a wardrobe item (read as partly naked); golden cases
  inserted mid-list had re-seeded every later case.
- Pictures: `face-candidates` runs/2026-10-11-step4-outfit-bench/ (Haiku, 39) and runs/2026-10-11-step4-review/ (Opus, 18 + 4
  neutral candidates; table.md has every read; `sheet-q-*` = rust | none | nude | neutral side by side).
- Session link (this review, Opus): https://claude.ai/code/session_01SS9jTukEt8oHbi6CVAE3Ni

## Waiting on the owner
- **Clothed body, your call if you want it fuller:** "none" is in. If clothed pictures should carry v10's fuller bust and arms, the
  "nude" mode does that (see `sheet-q-linen.jpg`, `sheet-q-breton.jpg`, third column); it needs a second seed, the boudoir tier and
  /nsfw Off checked first (about $0.04).
- **Your Telegram test** of the belly fix (deployed 2026-10-10), and of /nsfw once deployed. Do not send `/restart` (it wipes her memory).
- Steps 1-4 are not deployed. Deploy when you say "deploy" (suggested after Steps 2, 6 and 7).
- Once deployed, Step 2 makes a chat with no `/nsfw` setting On (about 1 in 3 hot-chat pictures nude): deploy only when you say so.

## Verified this session (2026-10-11, thirtieth session)
- Model read with `get_session`: Opus (this review); the build commits name Haiku.
- Sync report after `git fetch --unshallow origin`: "No other branch has work missing here."
- `node tools/check.mjs` 7/7 before and after the fixes (read in full). The four new unit rows fail on Haiku's worker.js.
- Golden `--write`, compared case by case against the pre-Step-4 golden with the LoRA lists and prefix normalized out: only clothed
  cases changed (rust body out, REFERENCE_NOBODY), the nude belfie (back body), one flirty pick (its outfit picture as image 1), and
  5 cases at the end. Nude and act cases unchanged.
- All 39 of Haiku's pictures and the 22 new ones read at full size (side by side by seed; nude-mode chests on a crop).
- Runware: $14.56408 → $14.50883 ($0.05525; the sums $0.05434). Step 4 in all: $0.15691 of $0.20.

## Next steps (in order; one chat each; Opus reviews each step before the next)
1. **Step 5** (Haiku): partly dressed and close-ups, with a bench. ≤ $0.10. Apply WORKPLAN's "Decided in review, for Step 5" first
   (BODY_PARTIAL "none", golden cases at the end, one read per picture). *Effort: medium.*
2. **Review of Step 5** (Opus). *Effort: high.*
3. **Step 6**: anal positions, with zoom-crop bench (also riding: a second head, his hands). ≤ $0.12. *Effort: medium.*
4. **Step 7**: the prompt studio at /studio, reading the D1 log. ≤ $0.05. *Effort: high.*
5. **Step 8**: deploy and live checks when you say "deploy" (suggested after Steps 2, 6 and 7). *Effort: low.*
6. **Your Telegram test** of the belly fix, and of /nsfw once deployed. *Effort: low.*
7. **Later:** the "nude" clothed mode (if you want it fuller); hair drifting to brown highlights (seed 101, every mode); the plain
   mirror belfie with no phone; the blowjob arms; the riding second head; Flux 4 Play tongue weight; `/look`'s DeepSeek answers
   (`llm_text`); /spend vs the dashboards; a cheaper text model; old session branches (`tools/retired-branches.txt`). *Effort: medium.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`? The sync check says no work is missing from `dev`.
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? (Done by hand again this session.)
- Old session branches still hold the old Reem pictures in their history. Clear those too, or leave them?

## Prompt for the next chat
Pick **Haiku** (effort medium) and paste the Haiku prompt from `docs/WORKPLAN.md` ("How to run a step"), with N = 5 and $X = 0.10.
