# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (the eight steps; its end holds the Step 7 notes and the **fix round review prompt**).

**Last updated:** 2026-10-11 (thirty-fifth session: **Haiku 5.5**, effort max per the session record. The fix round: the studio link, /nsfw Off on Cloudflare, a top and no bottom, the body audit.)
**Deployed:** `main` = d21c4b3 (Steps 1-7, unchanged). The fix round is **not deployed**. Rollback if ever needed: push `897dfaf` to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**Branch:** `claude/step-7-haiku-audit-fmac61` (pushed), and `dev` = the same commit once the final push below is done (the shared branch).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live (`main`): Steps 1-7 (texts, memory, /auto on DeepSeek V4 Flash; voice Sulafat; hearing Gemini; pictures on Runware klein 9B with her face, body and place; /nsfw; /studio).

The fix round (not deployed):
- **A. /studio from a link:** the first visit answers the page with a `SameSite=Lax` cookie. It was a 302 with a `Strict` cookie, which the redirected request did not send, so the owner got 404 from Telegram. `studio.js` drops `?t=` from the address bar.
- **B. /nsfw Off draws on Cloudflare** (`NSFW.OFF_ROUTE` "cloudflare"): Off pictures are Cloudflare klein (her face, the clothed body, the place) with the filter words and SAFE. Lingerie at Off too. Nano Banana, Runware and TwinFlow never run at Off. Off refuses nudity and sex acts on every route. Nude and On stay on Runware.
- **C. A top and no bottom** on the nude body (the owner's row 13: a cardigan over a cami came out naked below the waist): `RUNWARE.DRESSED_BOTTOM`. `ONE_PIECE_WORDS` (a dress, a robe) leave it out.
- **D. Body audit, done:** 34 pictures through the bot's own code, $0.08684 of the $0.12 cap. On `face-candidates` runs/2026-10-11-body-audit/ (commit 7a25297): `audit.md` (the static table, 897dfaf vs HEAD), `table.md` (per picture, visual only), `rows/` (side by side), `results.json`. No body setting changed; Opus decides any change.

## Checks read (fix round, 2026-10-11)
- `tools/test/studio-browser.mjs` (new, by hand): before the fix the cross-site click gave 302 then 404 "not found" (reproduced over https). After: 200 with the SameSite=Lax cookie, the page, /studio/api/options and /log 200, no console errors, a reload 200, a fresh browser 404, a bad token 404. The 390x844 screenshot was read: the tabs and the empty log fit.
- `tools/test/studio.mjs` 32 ok. `scenarios.mjs` 1241 ok (three Off rows now assert the Cloudflare call). `unit.mjs` all passed (312 rows; new: the Off route, Off with lingerie, Task C). `e2e.mjs` exit 0. `node tools/check.mjs` 8 of 8 ok (before the audit commits).
- Golden plans: 39 cases match. Changed: the Off naked case (a Cloudflare try, no Runware try); the cases whose prompt names a top and no bottom (the day outfit, the turtleneck, the cardigan, the sweater, the Runware-fails case); the new row 13 case. Each changed value differs only by the bottoms sentence or the Off route.
- Body audit: Runware `account` read before (today 0.69888 credits, 263 requests) and after (0.78572, 297): the difference is the bench's $0.08684. Every V0 picture was opened alone at full size and every row read side by side. The clothes were as named in all of them, and nothing was bare below the waist. Judgements of waist, bust and arms are visual, and seed-to-seed variance is larger than the variant differences in several rows. The bench does not isolate `DRESSED_BOTTOM` (no run leaves the line out).
- Not checked live: Off on Cloudflare in the real bot (the owner's Telegram test), and /studio opened from Telegram.

## Waiting on the owner
- Telegram test: (a) `/studio`, then open the link from the chat: the Log page opens. (b) `/nsfw` Off, then a clothed picture of her and a lingerie one: both should come from Cloudflare (nothing from Runware). (c) On and Nude unchanged. Do not send `/restart` (it wipes her memory).
- Opus review of the fix round: the prompt is at the end of `docs/WORKPLAN.md`. It covers the audit read (`table.md`) and whether a no-line `DRESSED_BOTTOM` variant (about $0.01) is worth running before any deploy.
- Records: this round's records name the model "Haiku 5.5" only (the fix-round prompt said so). The raw-ID rule is still open (below).

## Next steps (in order; one chat each)
1. **Opus review of the fix round** (a new chat, the WORKPLAN prompt): the studio browser run, the Off rows, the golden diff, the audit's `table.md`, and the `DRESSED_BOTTOM` question. *Effort: high.* Model: Opus.
2. **Owner's Telegram test** (above). If /studio or Off misbehaves, say what you see; the fix round is not deployed. *Effort: low.*
3. **Deploy** only when the owner says "deploy", after steps 1 and 2. *Effort: low.*
4. **Later** (Opus to diagnose, Haiku to draw): the body-audit findings (seed variance; the tank shortened in V2); the Step 7 deviations (WORKPLAN, "Decided in review"); the porch_night crop; a frontal anal LoRA for missionary; the second head on riding; Step 5's open questions; hair drifting to brown highlights; the blowjob arms; Flux 4 Play tongue weight; `/look`'s DeepSeek answers; a cheaper text model; old session branches. *Effort: medium.*

## Open questions for the owner
- Records: the raw model ID (your rule, 2026-10-11) or no model IDs in pushed files (the session's instructions)? Which wins? (Open. This round used the name only.)
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? (This session ran it by hand, then the report said OK.)
- Old session branches still hold the old pictures in their history. Clear them, or leave them?

## Prompt for the next chat
Opus: paste the "Fix round review prompt" from the end of `docs/WORKPLAN.md`. *Effort: high.*
