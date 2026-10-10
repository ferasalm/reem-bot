# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-10 (twenty-first session, end: the owner's reference set on `dev`). **Deployed:** `main` = 9c1270f
(deploy run 37944915522, success, Version 04777c05-d54f-4dd8-874c-60dd2809b204; clothed body v9 live). Rollback: push `9309e8e`
(before v9), `9803e28` (rounds 6-8, without v4-v6) or `088c9be` (round 5) to `main`. `dev` = this session's docs commit, on top of the
reference set (`f0c5fb2`). New `dev` work goes live when the owner says "deploy" (`git push origin origin/dev:main`).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid, $5/month). **Live (`main`):** texts, memory and
/auto on DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat (aura-2, then ElevenLabs); hearing Gemini 3.8 Flash (Whisper,
then Scribe); pictures Runware klein 9B with her face (`runware:400@2`, TwinFlow when it fails; `DAILY_USD` $1, then Cloudflare klein;
nudity and sex acts on). Clothed body v9 (the white linen set) is live.
**On `dev`, not deployed: the owner's reference set (2026-10-10).** Face = his picture 2 (messy bun, no bangs). Bodies: `v10` (nude
front), `v10-back` (nude back), `v10-clothed` (rust halter + jeans), all faceless. Outfits and hairstyles come first in `WARDROBE` and
`HAIRSTYLES`; those with a picture send it as the next image (`RUNWARE.STYLE_PICTURES`). Bangs are a style now, not her look
(`HAIR_CHANCE` 1: every picture gets a hairstyle unless the words name one).

## Waiting on the owner
- **Your Telegram test of the reference set** (after a deploy, or on `dev` if you test there): /pic with an outfit and with no outfit
  words; the hairstyle pictures (long bangs, bun with bangs, long waves) for face drift.
- **Bare-words clothed pictures** take the rust halter from the body picture (2026-10-10 bench: a relaxed selfie with no outfit named).
  The real flow names an outfit in every clothed picture, so this should stay rare. Tell me if it shows live.
- **Deploy?** Only when you say "deploy" (the set is on `dev`).
- **`tools/face/bench.json`** still names the deleted `body-hourglass.jpg`. Changing it starts the paid image bench on push (`image-bench.yml`).
- **Expressions:** the random moods still draw laughing or frowning faces (keep). Tongue-out grins come with them.

## Verified this session (2026-10-10, twenty-first session)
- Sync report: OK after `git fetch --unshallow origin`; no other branch has work missing here.
- `node tools/check.mjs`: all 6 ok (read in full), after the code change and again after the docs.
- Crops read on a contact sheet: face, nude front (faceless), nude back, rust halter (faceless), the 3 outfits and the 3 hairstyles.
- Bot check (`drawPicture`, Runware, 5 pictures, about $0.02): camel set 3 refs, kitchen 2, nude 2, lace 3, long-bangs style 3. Outfits and
  hair as asked, except the bare-words bangs picture (rust halter). Same woman in all five; likeness not measured. Table in `docs/QUALITY.md`.
- `face-candidates`: 581 pictures removed (`c2f5142`); its voice clips, job files and audio kept.
- Not checked: Telegram, a live chat, `/look`, v10 deployed.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Your Telegram test** of the reference set (on `dev`, or after a deploy): the points above. *Effort: low*
2. **Bare-words outfit leak** (only if your test shows it): a clothed body with no outfit named should not copy its clothes; try a
   `DRESSED` wording or a neutral clothed body, benched with `drawPicture` on 4 pictures. *Effort: medium*
3. **Deploy the set** when you say "deploy". *Effort: low*
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
- Commit trailers: the attribution reminder asks for a Co-Authored-By line naming the model, but the system rules bar model names in commit
  messages. Commits this session carry only the Claude-Session line. Which do you want?
- The old session branches still hold the old Reem pictures in their history (not on `dev`). Clear those too, or leave them to the retired list?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). My Telegram test of the reference set: <...>. Deploy: <yes/no>. Then HANDOFF next step 2 (or 4 if the test is clean).
