# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-09 (twentieth session, later: clothed body v9, the white linen set, on `dev`). **Deployed:** `main` = 9309e8e
(rounds 6-8 plus the face and body sets v4-v6, live since 2026-10-09 03:13 UTC: a push to `main` this session did not make).
Rollback: push `9803e28` (rounds 6-8, without v4-v6) or `088c9be` (round 5) to `main`.
`dev` is ahead of `main` by the v7-to-v9 clothed-body work and the wardrobe words, not deployed. New `dev` work goes live when the owner
says "deploy" (`git push origin origin/dev:main`).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid, $5/month). **Live (`main`):** texts, memory and
/auto on DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat (aura-2, then ElevenLabs); hearing Gemini 3.8 Flash (Whisper,
then Scribe); pictures Runware klein 9B with her face (`runware:400@2`, TwinFlow when it fails; `DAILY_USD` $1, then Cloudflare klein;
nudity and sex acts on). **Pictures, rounds 6-8 and the v4-v6 face and body sets are live on `main`** (the nude body v6, fuller arms).
**On `dev`, not deployed (2026-10-09):** the clothed body **v9** (`BODY_CLOTHED` "v9-clothed", `tools/face/body-v9-clothed.jpg`): the
owner's clothes model 501 (face from his close-up, body from his nude photo, the white linen set, InstaPic + Real HD 2K at 1.0), cropped
below the mouth so the reference is faceless. The gray tank is gone. `WARDROBE.EVERYDAY` gets the white set first; FLIRTY gets the long
black slip and the lace-trim slip (text only).

## Waiting on the owner
- **Deploy v9-clothed?** The bot check showed the outfit and a flat belly in both pictures; her face was close on the couch picture
  and looser on the standing one.
- **White set as the only everyday outfit?** The body reference is white, so when a picture names another outfit, klein may leak the
  white set into it (LESSONS: a clothed body reference leaks its clothes). The owner decides the scope.
- **v4-v6 went live on `main` at 03:13 UTC**, by a push this session did not make: confirm it was intended, or roll `main` back to `9803e28`.
- **Your Telegram test** of rounds 6-8 pictures on `main` (next step 1). Not yet checked live.
- **Expressions:** the bot's random moods drew a laughing grin with the tongue out (the standing bot picture); clothed pictures may need
  the neutral mood the owner asked for.

## Verified this session (2026-10-09, twentieth session)
- Sync report: OK after `git fetch --unshallow origin`; no other branch has work missing here.
- `node tools/check.mjs`: all 6 ok, output read, on the v9 wiring and the docs (`docs/MAP.md`, `docs/DECISIONS.md`, `docs/CHANGELOG.md`).
- Clothes model 501 (`runware:400@2`, 768x1344, 8 steps, InstaPic + Real HD 2K at 1.0, $0.00338 each): the outfit matches the product
  photo; plain background; neutral pose; the face is close (bangs, hair) but not a likeness (no mole). 502 was slimmer.
- Bot check (`drawPicture`, `BODY_CLOTHED` v9-clothed, 2 pictures, $ not logged): both show the white set and no visible belly bulge; the
  couch picture's face is close to `reference.jpg`, the standing one's is looser.
- Scenario check: the pose shot "bed-chin" fails the `SPICY_WARDROBE` check when it is in, while the wardrobe words alone pass (seeded
  random sequence; cause not found). Held out; the edit script is in the session scratchpad.
- Not checked: Telegram, `/look`'s DeepSeek call, v9 in a live chat, the deployed code (`main` unchanged this session).

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Your Telegram test** with `docs/OPTIONS.md` on `main`: /look with and without words (with her, apart, in a sex scene), /pic clothed
   full body, doggy, a bra kept on during sex; report misses. *Effort: low*
2. **v9-clothed decision:** deploy it, keep it on `dev`, or round 2 on the face and expression. *Effort: medium*
3. **Scenario check for the held pose shot:** find why `tools/test/scenarios.mjs` line 683 fails when "bed-chin" and the wardrobe words
   are both in (the seeded random sequence), then re-apply the pose. *Effort: medium*
4. **/look's DeepSeek answers:** read a few in the Worker log after real /look calls and tune `PICTURE.LOOK.PROMPT`. *Effort: medium*
5. **Missionary/riding penetration** shown more often (wording or LoRA weight bench, zoom crops). *Effort: medium*
6. **Flux 4 Play tongue:** bench its weight 0.5-0.8, and check the tongue in the clothed pictures. *Effort: medium*
7. **After a day live:** /spend vs the dashboards (Runware, Workers AI, OpenRouter). *Effort: low*
8. **Text model** (owner's direction): bench cheaper or better Workers AI models with `OWNER_CHAT`. *Effort: high*
9. **Old session branches:** `tools/retired-branches.txt` lists them; the owner presses Actions > Delete retired branches when he agrees.
   *Effort: low*

## Open questions for the owner
- Deploy v9-clothed, keep it on `dev`, or round 2 first?
- Should the white set be the only everyday outfit (cleaner against leaks), or one option among the others?
- Her tongue out and laughing moods: keep the random moods, or neutral for clothed pictures?
- Was the 03:13 UTC push to `main` (v4-v6 live) intended?
- OK to press Actions > Delete retired branches for the list in `tools/retired-branches.txt`? The sync check says no work is missing from `dev`.
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? The warning came again this session.
- Commit trailers: the attribution reminder asks for a Co-Authored-By line naming the model; the system rules bar model names in commit
  messages. This session's commits omit the model name. Which do you want?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). My Telegram test: <...>. v9-clothed: <deploy / keep on dev / round 2>. Everyday outfit: <white set only / one option>.
> Then HANDOFF next step 3.
