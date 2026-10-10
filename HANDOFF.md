# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-10 (twenty-first session, end: the belly fix on `dev`, after the reference set went live). **Deployed:** `main` = 0d2010f
(deploy run 38011331407, success, Version 8a4778e1-e606-4b2b-a7dc-e3a4cee17388; the reference set, without the belly fix). Rollback: push `9c1270f`
(the v9 deploy) to `main`, or `9309e8e` (before v9), `9803e28` (rounds 6-8) or `088c9be` (round 5). `dev` = this session's belly commit, on top of
`0d2010f`. Deploy = a push to `main` only (`git push origin origin/dev:main`), and only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid, $5/month). **Live (`main`):** texts, memory and
/auto on DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat (aura-2, then ElevenLabs); hearing Gemini 3.8 Flash (Whisper,
then Scribe); pictures Runware klein 9B with her face (`runware:400@2`; `DAILY_USD` $1, then Cloudflare klein; nudity and sex acts on).
**The owner's reference set (2026-10-10) is live:** face = his picture 2 (messy bun, no bangs); bodies `v10` (nude front), `v10-back`,
`v10-clothed` (rust halter + jeans), all faceless; outfits and hairstyles first in `WARDROBE`/`HAIRSTYLES`, with a picture sent as the next image.
**On `dev`, not deployed: the belly fix (2026-10-10).** Why: the words said "softly rounded belly, wide hips, full thighs" on top of a body
picture that already has a belly, and the TwinFlow fallback (klein failed) sent no reference and drew from hourglass words. Now her pictures
retry klein (`KLEIN_TRIES` 2), then Cloudflare klein with her references; TwinFlow never draws her; those body clauses are gone.

## Waiting on the owner
- **Deploy the belly fix?** Say "deploy" and I push `dev` to `main`. Until then the live pictures still have the belly words.
- **Telegram test** (the first live check of the Runware route): /pic with an outfit and without; a hairstyle picture for face drift;
  whether the belly is flatter. `/spend` now shows the failed Runware attempts today.
- **Bare-words clothed pictures** take the rust halter from the body picture (2026-10-10 bench). The real flow names an outfit, so rare.
- **Do not send `/restart`**, though the `/setup` page says to: it wipes her memory (`docs/OPTIONS.md`).
- **`tools/face/bench.json`** still names the deleted `body-hourglass.jpg`. Changing it starts the paid image bench on push (`image-bench.yml`).

## Verified this session (2026-10-10, twenty-first session)
- Sync report: OK after `git fetch --unshallow origin`; no other branch has work missing here.
- Reference set: deploy run 38011331407 (`0d2010f`), every step success, Version 8a4778e1-e606-4b2b-a7dc-e3a4cee17388; `/health` ok (Cloudflare klein drew 51,103 bytes); `/setup` all ✅.
- Belly fix: `node tools/check.mjs` 6/6 ok (read in full).
- Free captures of the Runware requests (network stubbed): klein working → 3 refs (face, clothed body, place), 0 belly words;
  klein failing → 2 klein tries with the refs, then Cloudflare klein, 0 TwinFlow, `rwFailed` 2.
- Picture check, about $0.04 in total: old words, belly words removed (test), and the new code, 4 each, on one sheet (`docs/QUALITY.md`):
  the lower belly is flatter in the new rows, bust and arms as full. A modest change; small samples, judged at sheet size.
- Not checked: Telegram, a live chat, `/look`, the belly on the deployed Worker.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Deploy the belly fix** when you say "deploy" (a push to `main`); then read the deploy log. *Effort: low*
2. **Your Telegram test** (above), after the deploy. *Effort: low*
3. **If the belly is still big:** the clothed reference (picture 9, `v10-clothed`) has its own soft lower belly; a flatter reference is your call, then an 8-vs-8 bench. *Effort: medium*
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

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). Deploy: <yes/no>. My Telegram test of the belly fix: <...>. Then HANDOFF next step 3 (or 4 if the test is clean).
