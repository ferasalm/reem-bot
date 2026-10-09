# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-09 (twentieth session: clothed body reference v7 on `dev`). **Deployed:** `main` = 9803e28 (rounds 6-8).
`dev` is ahead: the body and face sets of 2026-10-09 (v4 to v6, plus v7 clothed) are not deployed. Round 5 is `088c9be`: to go back, push it to `main`.
New `dev` work goes live when the owner says "deploy" (`git push origin origin/dev:main`).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid, $5/month). **Live (`main`):** texts, memory and
/auto on DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat (aura-2, then ElevenLabs); hearing Gemini 3.8 Flash (Whisper,
then Scribe); pictures Runware klein 9B with her face (`runware:400@2`, TwinFlow when it fails; `DAILY_USD` $1, then Cloudflare klein;
nudity and sex acts on).
**Pictures, rounds 6-8 (live on `main`):** 9:16 768x1344 for most pictures, 1:1 or 16:9 for blowjobs and some sex acts (about
$0.0025-0.0034 a picture); three picture kinds (clothed, nude, sex act) with their own body pictures; General Penis on missionary and
doggy; `/look` from the chat; hairstyles, light, poses, outfits. `docs/OPTIONS.md` lists every command, word, act and LoRA.
**On `dev`, not deployed (2026-10-09):** her face is the old face as a macro; the nude body is v6 (klein 9B + InstaPic 1.0 + Real HD 2K 1.0,
fuller arms, soft belly); the clothed body is **v7** (`BODY_CLOTHED` "v7-clothed", the nude v6 dressed in a fitted opaque gray tank).

## Waiting on the owner
- **Your Telegram test** of the rounds 6-8 pictures on `main` (next step 1). They are not yet checked live.
- **Keep v7-clothed?** Its one pick (seed 103 of 4) shows no nipples and is fuller than v6-clothed, but it is not a full match to the
  nude: the bust and hips are still lighter. Its kitchen test picture's belly looks rounder in a leaning pose. Deploy it, or ask for a
  round 2 aimed closer to the nude (about $0.007).
- **Her tongue out**: a Flux 4 Play issue on riding/doggy, and a kitchen picture of 2026-10-09 drew it too (no act LoRA on that route).
- Still open: InstaPic everywhere, ElevenLabs "North Jersey", old session branches (see Open questions).

## Verified this session (2026-10-09, twentieth session)
- Sync report: OK after `git fetch --unshallow origin`; no other branch has work missing here. The session-start warning (30 branches)
  came from the shallow clone, as on 2026-10-08.
- `node tools/check.mjs`: all 6 ok, output read, after the v7 edits and `node tools/build-panel.mjs`.
- Bench (container, `runware:400@2`, nude v6 as image 0, InstaPic + Real HD 2K at 1.0, 576x1024, $0.00169 each): round 1 seeds 101, 102,
  104 showed nipples through the knit; seed 103 showed none and was picked. Round 2 not run. Read at full size (no sub-agents).
- Bot check (`drawPicture`, `BODY_CLOTHED` v7-clothed, 2 pictures): her face held in both against `tools/face/reference.jpg`.
- Not checked: Telegram, `/look`'s DeepSeek call, the deployed code (`main` unchanged), v7 in a live chat.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Your Telegram test** with `docs/OPTIONS.md` on `main`: /look with and without words (with her, apart, in a sex scene), /pic clothed
   full body, doggy, a bra kept on during sex; report misses. *Effort: low*
2. **v7-clothed decision:** deploy it, or round 2 closer to the nude (fuller bust, hips, belly, no nipples), 4 seeds. *Effort: medium*
3. **/look's DeepSeek answers:** read a few in the Worker log after real /look calls and tune `PICTURE.LOOK.PROMPT`. *Effort: medium*
4. **Missionary/riding penetration** shown more often (wording or LoRA weight bench, zoom crops). *Effort: medium*
5. **Flux 4 Play tongue:** bench its weight 0.5-0.8, and check the tongue in the kitchen picture. *Effort: medium*
6. **After a day live:** /spend vs the dashboards (Runware, Workers AI, OpenRouter). *Effort: low*
7. **Text model** (owner's direction): bench cheaper or better Workers AI models with `OWNER_CHAT`. *Effort: high*
8. **Old session branches:** `tools/retired-branches.txt` lists them; the owner presses Actions > Delete retired branches when he agrees.
   *Effort: low*

## Open questions for the owner
- Her tongue on riding/doggy and in the kitchen picture: keep it, lower the Flux 4 Play weight, or use another LoRA?
- v7-clothed: deploy it, or round 2 first?
- OK to press Actions > Delete retired branches for the list in `tools/retired-branches.txt`? The sync check says no work is missing from `dev`.
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? The warning came again this session.
- Commit trailers: the attribution reminder asks for a Co-Authored-By line naming the model; the system rules bar model names in commit
  messages. This session's commits omit the model name. Which do you want?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). My Telegram test: <...>. v7-clothed: <deploy / round 2>. Tongue: <keep / lower / other LoRA>. Then HANDOFF next step 3.
