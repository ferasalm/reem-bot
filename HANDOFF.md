# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-09 (twentieth session, end: clothed body v9 deployed). **Deployed:** `main` = 9c1270f (deploy run 37944915522,
success, Version 04777c05-d54f-4dd8-874c-60dd2809b204). Rollback: push `9309e8e` (before v9), `9803e28` (rounds 6-8, without v4-v6) or
`088c9be` (round 5) to `main`. `dev` = `main` plus the docs commit of this session. New `dev` work goes live when the owner says "deploy"
(`git push origin origin/dev:main`).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid, $5/month). **Live (`main`):** texts, memory and
/auto on DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat (aura-2, then ElevenLabs); hearing Gemini 3.8 Flash (Whisper,
then Scribe); pictures Runware klein 9B with her face (`runware:400@2`, TwinFlow when it fails; `DAILY_USD` $1, then Cloudflare klein;
nudity and sex acts on). Pictures rounds 6-8, the face and body sets v4-v6 (nude body v6), and the **clothed body v9** are live.
**Clothed body v9** (`BODY_CLOTHED` "v9-clothed", `tools/face/body-v9-clothed.jpg`): the owner's clothes model 501 (face from his close-up,
body from his nude photo, the white linen set, InstaPic + Real HD 2K at 1.0), cropped below the mouth so the reference is faceless. The
gray tank is gone. `WARDROBE.EVERYDAY` has the white set first among many everyday outfits (owner: variety stays); FLIRTY has the long
black slip and the lace-trim slip (text only).

## Waiting on the owner
- **Your Telegram test** of the pictures on `main` (next step 1). Not yet checked live, including the Runware route.
- **Expressions:** the bot's random moods still draw laughing or frowning faces (owner: keep them). Tongue-out grins come with them.
- **Seated belly:** a seated olive crop-top picture drew a rounded lower belly (a pose effect). Tell me if clothed pictures need a flatter
  pose.

## Verified this session (2026-10-09, twentieth session)
- Sync report: OK after `git fetch --unshallow origin`; no other branch has work missing here.
- `node tools/check.mjs`: all 6 ok, output read, on the v9 wiring and the docs.
- Clothes model 501 (`runware:400@2`, 768x1344, 8 steps, InstaPic + Real HD 2K at 1.0, $0.00338 each): the outfit matches the product
  photo; plain background; neutral pose; the face is close (bangs, hair) but not a likeness (no mole). 502 was slimmer.
- Bot check (`drawPicture`, `BODY_CLOTHED` v9-clothed): the white set and no visible belly bulge in both pictures; the couch face close,
  the standing one looser.
- Leak check before the deploy (`drawPicture`, 2 pictures): black ribbed tank + jeans, olive ribbed top + gray yoga pants: no white set.
- Deploy run 37944915522 (push to `main`, 9c1270f): every step success; `/health` ok (klein drew 60,126 bytes; vision described it);
  `/setup` all ✅; Runware about $0.10 of $1.00 today. The Runware route is not checked by these.
- Scenario check: the pose shot "bed-chin" fails the `SPICY_WARDROBE` check when it is in, while the wardrobe words alone pass (seeded
  random sequence; cause not found). Held out; the edit script is in the session scratchpad.
- Not checked: Telegram, `/look`'s DeepSeek call, v9 in a live chat.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Your Telegram test** with `docs/OPTIONS.md` on `main`: /look with and without words (with her, apart, in a sex scene), /pic clothed
   full body, doggy, a bra kept on during sex; report misses. *Effort: low*
2. **Scenario check for the held pose shot:** find why `tools/test/scenarios.mjs` line 683 fails when "bed-chin" and the wardrobe words
   are both in (the seeded random sequence), then re-apply the pose. *Effort: medium*
3. **/look's DeepSeek answers:** read a few in the Worker log after real /look calls and tune `PICTURE.LOOK.PROMPT`. *Effort: medium*
4. **Missionary/riding penetration** shown more often (wording or LoRA weight bench, zoom crops). *Effort: medium*
5. **Flux 4 Play tongue:** bench its weight 0.5-0.8, and check the tongue in the clothed pictures. *Effort: medium*
6. **Seated clothed pose:** bench a pose wording that keeps the belly flat (owner's last note). *Effort: medium*
7. **After a day live:** /spend vs the dashboards (Runware, Workers AI, OpenRouter). *Effort: low*
8. **Text model** (owner's direction): bench cheaper or better Workers AI models with `OWNER_CHAT`. *Effort: high*
9. **Old session branches:** `tools/retired-branches.txt` lists them; the owner presses Actions > Delete retired branches when he agrees.
   *Effort: low*

## Open questions for the owner
- Should clothed pictures use a flatter seated pose (the seated olive picture's belly)?
- OK to press Actions > Delete retired branches for the list in `tools/retired-branches.txt`? The sync check says no work is missing from `dev`.
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? The warning came again this session.
- Commit trailers: the attribution reminder asks for a Co-Authored-By line naming the model; the system rules bar model names in commit
  messages. This session's commits omit the model name. Which do you want?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). My Telegram test: <...>. Seated pose: <flatter belly / keep>. Then HANDOFF next step 2.
