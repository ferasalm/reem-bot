# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-10 (twenty-first session, end: the belly fix deployed to `main`). **Deployed:** `main` = 897dfaf
(deploy run 38013450881, success, Version 496925bf-95b1-4fd7-8a0b-e1daea3953a7). Rollback: push `0d2010f` (the reference set, before the
belly fix) or `9c1270f` (the v9 deploy) to `main`. `dev` = this session's docs commit, on top of `897dfaf`. Deploy = a push to `main` only
(`git push origin origin/dev:main`), and only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid, $5/month). **Live (`main`):** texts, memory and
/auto on DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat (aura-2, then ElevenLabs); hearing Gemini 3.8 Flash (Whisper,
then Scribe); pictures Runware klein 9B with her face (`runware:400@2`, retried once, then Cloudflare klein with her references; TwinFlow
never draws her; `DAILY_USD` $1; nudity and sex acts on).
**The owner's reference set (2026-10-10) is live:** face = his picture 2 (messy bun, no bangs); bodies `v10` (nude front), `v10-back`,
`v10-clothed` (rust halter + jeans), all faceless; outfits and hairstyles first in `WARDROBE`/`HAIRSTYLES`, with a picture sent as the next image.
**The belly fix is live too (2026-10-10):** the body words said "softly rounded belly, wide hips, full thighs" on top of a body picture that
already has a belly, and the TwinFlow fallback drew her from hourglass words with no reference. Both are gone from her descriptions.

## Waiting on the owner
- **Your Telegram test** of the belly fix: /pic in a fitted top and jeans (is the lower belly flatter?), /pic with an outfit and without, a
  hairstyle picture for face drift.
- **The picture at 01:31:44 UTC** (09/10 21:31 Boston): a Runware "no picture" that the new fallback redrew on Cloudflare. Tell me if it
  looks wrong; `/spend` now shows the failed Runware attempts today (`rwFailed`).
- **Bare-words clothed pictures** take the rust halter from the body picture (2026-10-10 bench). The real flow names an outfit, so rare.
- **Do not send `/restart`**, though the `/setup` page says to: it wipes her memory (`docs/OPTIONS.md`).
- **`tools/face/bench.json`** still names the deleted `body-hourglass.jpg`. Changing it starts the paid image bench on push (`image-bench.yml`).

## Verified this session (2026-10-10, twenty-first session)
- Sync report: OK after `git fetch --unshallow origin`; no other branch has work missing here.
- Reference set: deploy run 38011331407 (`0d2010f`), success, Version 8a4778e1; `/health` ok; `/setup` all ✅.
- Belly fix: `node tools/check.mjs` 6/6 ok (read in full); free captures (klein working: 3 refs, 0 belly words; klein failing: 2 klein
  tries with the refs, then Cloudflare, 0 TwinFlow, `rwFailed` 2); a 12-picture sheet read at full size (`docs/QUALITY.md`): a modest,
  consistent flattening at the lower belly, bust and arms as full.
- Belly deploy: run 38013450881 (`897dfaf`), success, Version 496925bf-95b1-4fd7-8a0b-e1daea3953a7; Tests run 38013450919 success;
  `/health` ok (Cloudflare klein, 55,092 bytes); `/setup` all ✅ and its Pictures line shows the new fallback.
- Not checked: Telegram, a live chat, `/look`, the belly on the deployed Worker (the owner's test is the check).

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Your Telegram test** of the belly fix and the 01:31:44 UTC picture (above). *Effort: low*
2. **If the belly is still big:** the clothed reference (picture 9, `v10-clothed`) has its own soft lower belly; a flatter reference is your call, then an 8-vs-8 bench. *Effort: medium*
3. **Runware "no picture" recurring?** Read `/spend` (`failed today`) for a few days; if it's often, look at the klein LoRA stack that triggers it. *Effort: low*
4. **`bench.json`** → `body-nude.jpg`, when you want an image bench run (it spends Runware money). *Effort: low*
5. **Missionary/riding penetration** shown more often (wording or LoRA weight bench, zoom crops). *Effort: medium*
6. **Flux 4 Play tongue:** bench its weight 0.5-0.8, and check the tongue in the clothed pictures. *Effort: medium*
7. **Seated clothed pose:** a pose wording that keeps the belly flat (owner's note on the seated olive picture). *Effort: medium*
8. **/look's DeepSeek answers:** read a few in the Worker log after real /look calls, then tune `PICTURE.LOOK.PROMPT`. *Effort: medium*
9. **After a day live:** /spend vs the dashboards (Runware, Workers AI, OpenRouter). *Effort: low*
10. **Text model** (owner's direction): bench cheaper or better Workers AI models with `OWNER_CHAT`. *Effort: high*
11. **Old session branches:** `tools/retired-branches.txt`; the owner presses Actions > Delete retired branches when he agrees. *Effort: low*

## Open questions for the owner
- Should clothed pictures use a flatter seated pose (the seated olive picture's belly)?
- OK to press Actions > Delete retired branches for the list in `tools/retired-branches.txt`? The sync check says no work is missing from `dev`.
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? The warning came again this session.
- Commit trailers: the attribution reminder asks for a Co-Authored-By line naming the model, but the system rules bar model names in commit messages. Commits this session carry only the Claude-Session line. Which do you want?
- The old session branches still hold the old Reem pictures in their history (not on `dev`). Clear those too, or leave them to the retired list?
- The deploy log warns that GitHub will run `actions/checkout`, `setup-node` and `wrangler-action` on Node 24 (they target Node 20). No action yet; check the next deploy.

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). My Telegram test of the belly fix: <...>. The 01:31 UTC picture: <...>. Then HANDOFF next step 2 (or 3 if the test is clean).
