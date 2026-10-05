# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-05 (fourth session). **Deployed:** `main` = `dev` = cdf631f (deploy run 37267949894 green).
v11, klein-first lingerie, the stronger accent, Gemini hearing and the owner's place pictures are live.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid since 2026-10-03, $5/month).
- **Live (`main`, deployed 2026-10-05):** v11 persona (Reem Nabot, Armenian-Lebanese bookkeeper, Watertown
  triple-decker); DeepSeek V4 Flash text; Sulafat voice with the stronger accent; the owner's place pictures (8 places,
  day and night); bangs, body reference, 9:16, daily AI cap 50,000 neurons.
  - **Hearing:** Gemini 3.8 Flash (OpenRouter) first, laughs and tone in parentheses; Whisper, then Scribe, as backups.
  - **Lingerie:** klein first (`LINGERIE.KLEIN_WARDROBE`, her face); Nano Banana when klein refuses; two pieces,
    "spicier", from behind or explicit words go straight to Nano Banana with `SPICY_PROMPT`.
- **On `dev` but not on `main` (2026-10-05, fifth session):** in-person pictures wear what the scene said (`sceneWearing`),
  casual clothes under a cardigan (`SCENE_UNDER`), night light (`SCENE_NIGHT`), only she in the frame; a little curvy, not
  heavy, full upper arms (all picture descriptions + persona); `/look` sends what he sees in person. /setup tests Sulafat,
  Gemini hearing and lists Nano Banana; old failures as ℹ️ notes. Face runs 2026-10-05 (5 rounds) read picture by picture.
- Owner's preview page (private artifact): https://claude.ai/artifact/LWGGrnTjMRAiLCTTSZ3rmg

## Waiting on the owner
- **Say "Deploy"** to put the picture, body, /look and /setup fixes live. After it: `/setup` once (the command menu
  gets /look). Selfies still copy the body reference's black dress sometimes (2/3 in a test): new body picture in
  casual clothes? (owner's call; the current one is the owner's pick). Lunaris (backup) answered via DeepInfra, which DeepSeek's
  routing excludes: exclude it for Lunaris too?
- **After the deploy, in Telegram:** `/setup`, a voice note with a laugh, a lingerie picture, a "spicier" picture
  ("send me a spicier pic"), then `/restart`. Tell Claude what slipped.
- The ElevenLabs backup voice is "North Jersey": keep or redesign. Delete old branches (Actions > Delete retired
  branches). Cost estimate questions from 2026-10-04 still open.

## Verified this session (2026-10-05, fourth session)
- `node tools/check.mjs` all 6 ok before the push; `main` fast-forwarded to cdf631f; deploy run 37267949894 completed
  with success (Deploy Worker step ok, /health step ran in the same run).
- Not checked: no `[live]` run, no real voice note or picture through the bot yet; the sync report's 13 old session
  branches (commits not on dev, all dated 2026-10-04 or earlier) were not read.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Owner's live test** (list above), then report slips. *Effort: low*
2. **Tuning v11 from live chat:** radiator + spoon repeats; family details early; check what Gemini's (laughs) does to
   her replies. *Effort: medium*
3. **Selfie quality with the FLUX skill's rules:** phone shown in "no phone" selfies, phone over the face, selfies
   framed by someone else; Nano Banana night light. *Effort: medium*
4. **"Spicier" without "pic":** decide whether "send me something spicier" alone should plan a picture. *Effort: low*
5. **Night light and outfit places:** beach outfit at 23h, boudoir drawn as a long dress. *Effort: low*
6. **Text model** (owner's direction): DeepSeek V4 Flash vs others, cost and quality. *Effort: high*
7. **Context and memory:** stable prompt prefix for caching, then a "story state" in the notes. *Effort: medium*
8. **Old session branches:** read or retire the ones the sync report lists (add to `tools/retired-branches.txt`
   once the owner agrees). *Effort: low*

## Open questions for the owner
- Should "something spicier" (no "pic") send a picture?
- Time-awareness, a daily plan, explicitness, natural-looking pictures (asked 2026-10-03): which proposal to do.
- OK to retire the old session branches the sync report keeps listing?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). <Here is what slipped in my live test: ... | next step 2>. Finish with /handoff.
