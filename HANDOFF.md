# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-10 (twenty-first session, end: the reference set deployed to `main`). **Deployed:** `main` = 0d2010f
(deploy run 38011331407, success, Version 8a4778e1-e606-4b2b-a7dc-e3a4cee17388). Rollback: push `9c1270f` (the v9 deploy, clothed body
v9) to `main`, or `9309e8e` (before v9), `9803e28` (rounds 6-8) or `088c9be` (round 5). `dev` = this session's docs commit, on top of
`0d2010f`. Deploy = a push to `main` only (`git push origin origin/dev:main`), and only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid, $5/month). **Live (`main`):** texts, memory and
/auto on DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat (aura-2, then ElevenLabs); hearing Gemini 3.8 Flash (Whisper,
then Scribe); pictures Runware klein 9B with her face (`runware:400@2`, TwinFlow when it fails; `DAILY_USD` $1, then Cloudflare klein;
nudity and sex acts on). **The owner's reference set (2026-10-10) is live:** face = his picture 2 (messy bun, no bangs); bodies `v10`
(nude front), `v10-back` (nude back), `v10-clothed` (rust halter + jeans), all faceless. Outfits and hairstyles come first in `WARDROBE`
and `HAIRSTYLES`; those with a picture send it as the next image (`RUNWARE.STYLE_PICTURES`). Bangs are a style, not her look
(`HAIR_CHANCE` 1: every picture gets a hairstyle unless the words name one).

## Waiting on the owner
- **Your Telegram test of the reference set**, the first live check of the Runware route (`/health` and `/setup` drew on Cloudflare only):
  /pic with an outfit and with no outfit words; the hairstyle pictures (long bangs, bun with bangs, long waves) for face drift.
- **Bare-words clothed pictures** take the rust halter from the body picture (2026-10-10 bench: a relaxed selfie with no outfit named).
  The real flow names an outfit in every clothed picture, so this should stay rare. Tell me if it shows live.
- **Do not send `/restart`**, though the `/setup` page says to: it wipes her memory (`docs/OPTIONS.md`). The new Reem is already live.
- **`tools/face/bench.json`** still names the deleted `body-hourglass.jpg`. Changing it starts the paid image bench on push (`image-bench.yml`).
- **Expressions:** the random moods still draw laughing or frowning faces (keep). Tongue-out grins come with them.

## Verified this session (2026-10-10, twenty-first session)
- Sync report: OK after `git fetch --unshallow origin`; no other branch has work missing here.
- `node tools/check.mjs`: all 6 ok (read in full), before and after the docs.
- Crops read on a contact sheet: face, nude front (faceless), nude back, rust halter (faceless), the 3 outfits and the 3 hairstyles.
- Bot check (`drawPicture`, Runware, 5 pictures, about $0.02): camel set 3 refs, kitchen 2, nude 2, lace 3, long-bangs style 3. Outfits and
  hair as asked, except the bare-words bangs picture (rust halter). Same woman in all five; likeness not measured. `docs/QUALITY.md`.
- Deploy run 38011331407 (push to `main`, `0d2010f`): every step success; the Vectorize 3002 and metadata 40004 errors are the normal
  already-exists ones; `/health` ok (Cloudflare klein drew 51,103 bytes, the vision model described it); `/setup` all ✅. Its Runware line: today
  about $0.00 of $1.00 by the bot's ledger (our test pictures ran outside it, about $0.02); an old "Runware 200: no picture" from 08/10 19:48 UTC.
- `face-candidates`: 581 pictures removed (`c2f5142`); its voice clips, job files and audio kept.
- Not checked: Telegram, a live chat, `/look`, the Runware route of the new set.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Your Telegram test** of the reference set (live now): the points above. *Effort: low*
2. **Bare-words outfit leak** (only if your test shows it): a clothed body with no outfit named should not copy its clothes; try a
   `DRESSED` wording or a neutral clothed body, benched with `drawPicture` on 4 pictures. *Effort: medium*
3. **`bench.json`** → `body-nude.jpg`, when you want an image bench run (it spends Runware money). *Effort: low*
4. **Missionary/riding penetration** shown more often (wording or LoRA weight bench, zoom crops). *Effort: medium*
5. **Flux 4 Play tongue:** bench its weight 0.5-0.8, and check the tongue in the clothed pictures. *Effort: medium*
6. **Seated clothed pose:** a pose wording that keeps the belly flat (owner's note on the seated olive picture). *Effort: medium*
7. **/look's DeepSeek answers:** read a few in the Worker log after real /look calls, then tune `PICTURE.LOOK.PROMPT`. *Effort: medium*
8. **After a day live:** /spend vs the dashboards (Runware, Workers AI, OpenRouter). *Effort: low*
9. **Text model** (owner's direction): bench cheaper or better Workers AI models with `OWNER_CHAT`. *Effort: high*
10. **Old session branches:** `tools/retired-branches.txt`; the owner presses Actions > Delete retired branches when he agrees. *Effort: low*

## Open questions for the owner
- Should clothed pictures use a flatter seated pose (the seated olive picture's belly)?
- OK to press Actions > Delete retired branches for the list in `tools/retired-branches.txt`? The sync check says no work is missing from `dev`.
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? The warning came again this session.
- Commit trailers: the attribution reminder asks for a Co-Authored-By line naming the model, but the system rules bar model names in commit
  messages. Commits this session carry only the Claude-Session line. Which do you want?
- The old session branches still hold the old Reem pictures in their history (not on `dev`). Clear those too, or leave them to the retired list?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). My Telegram test of the reference set: <...>. Then HANDOFF next step 2 (or 3 if the test is clean).
