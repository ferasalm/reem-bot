# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-08 (eighteenth session: picture round 7, on `dev`). **Deployed:** `main` = 088c9be (round 5, unchanged).
`dev` = rounds 6 + 7 (not deployed). To deploy: the owner says "deploy" (`git push origin origin/dev:main`).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid, $5/month). **Live (`main`):** texts, memory,
/auto on DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat; hearing Gemini 3.8 Flash; pictures Runware klein 9B
(round 5; `DAILY_USD` $1, then Cloudflare klein, never nude).
**On `dev`, not deployed:** round 6 (anatomy fix, flash on request, hairstyles, light, poses, outfits: `docs/CHANGELOG.md`) and round 7:
- **Cheaper sizes:** 9:16 768x1344 (was 1008x1792). Blowjobs/deepthroats 1:1 (80%) or 16:9; other sex acts 9:16 / 1:1 / 16:9 (40/40/20);
  everything else 9:16. Measured $0.0025-0.0034 a picture (was $0.0034-0.0042).
- **Three kinds of picture:** clothed (her body dressed: `body-v2-clothed.jpg`, drawn from the nude body, so the build matches and the
  head is in proportion: 3/3), nude, sex act. Short prompts: the body comes from image 1, the words only add the fuller arms and pale
  warm ivory skin; the mole is gone (persona too).
- **From behind** (doggy, anal, reverse cowgirl): her body from behind (`body-v2-back.jpg`), "seen from behind", no breasts named (doggy 2/2).
- **Partly naked:** clothes named in a nude or sex picture stay on (t-shirt 2/2, black bra 3/3, white bra 1/3).
- **PussyDiffusion** on vaginal acts (riding, cowgirl, doggy, missionary): vulva and entry right on zoom 3/3.
- **/look rebuilt:** DeepSeek (Workers AI) reads the last 8 messages + your words after /look and writes the picture: with her (her face)
  or without her (where you are, first-person 2/2). "/look nude, missionary sex" now draws that (1/1 nude; penetration not shown).
- **Not adopted:** deepthroat LoRA alone at 1.0 (her face older 3/3, in her mouth 1/3); it stays with the others at 0.8.
- **`docs/OPTIONS.md`:** every command, picture word, pose, act, outfit, hairstyle, light, place and LoRA (when, weight, trigger, cost).

## Waiting on the owner
- **Deploy rounds 6 + 7?**
- **Her tongue out** on riding/doggy (Flux 4 Play draws it): keep, lower its weight, or another LoRA.
- Still open: InstaPic everywhere, ElevenLabs "North Jersey", old branches.

## Verified this session (2026-10-08, eighteenth session)
- `node tools/check.mjs` all 6 ok (new rows: v2-clothed / back body, PARTIAL, NAKED_BACK, aspect shapes, WITH_LORAS, deepthroat with the
  others, /look words/with her/alone/model down). ~40 pictures on Runware through the bot's own code (~$0.12), each read, genitals zoomed.
- Not checked live: /look's DeepSeek call (the container can't reach Workers AI; mocked in scenarios), Telegram, a deploy.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Deploy** if you want rounds 6 + 7 live. *Effort: low*
2. **Your Telegram test** with `docs/OPTIONS.md`: /look with and without words (with her, apart, in a sex scene), /pic clothed full body,
   doggy, a bra kept on during sex; report misses. *Effort: low*
3. **/look's DeepSeek answers:** after the deploy, read a few in the Worker log (or a workflow call) and tune `PICTURE.LOOK.PROMPT`. *Effort: medium*
4. **Missionary/riding penetration** shown more often (wording or LoRA weight bench, zoom crops). *Effort: medium*
5. **Flux 4 Play tongue:** bench its weight 0.5-0.8. *Effort: medium*
6. **After a day live:** /spend vs the dashboards. *Effort: low*
7. **Text model** (owner's direction): bench cheaper or better Workers AI models with `OWNER_CHAT`. *Effort: high*
8. **Old session branches:** list them in `tools/retired-branches.txt` once the owner agrees. *Effort: low*

## Open questions for the owner
- OK to retire the old session branches the sync report keeps listing?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). Deploy rounds 6+7: <yes/no>. My Telegram test: <...>. Flux 4 Play tongue <...>. Then HANDOFF next step 3.
