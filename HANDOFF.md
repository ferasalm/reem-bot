# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-04 night (everything deployed to `main`: Sulafat voice, bangs, body reference, soft and fleshy arms)

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid since 2026-10-03, $5/month).
- **Live (`main`, deployed 2026-10-04, owner: "Deploy"):** v10 on DeepSeek V4 Flash; Lebanese Reem in Belmont, MA; fixed
  places; everything below. Read back after the deploy: see "Verified".
- **What the deploy brought:**
  - **Voice: Gemini 3.8 Flash TTS, Sulafat** (`VOICE.PROVIDER` "openrouter", `OR_MODEL`, `OR_VOICE`, `OR_FORMAT` "pcm"):
    raw PCM → MP3 in the Worker with lamejs (`mp3.js`, ~0.2 s per 5 s), tags `[laughs]` `[whispers]` `[sighs]`,
    `OR_DAILY_USD` $0.30 (~$0.015 per 1,000 characters), ElevenLabs backup. Aura (Andromeda) is still there: set
    `PROVIDER` "aura". His voice notes: Whisper, ElevenLabs Scribe backup.
  - **Looks:** wispy full bangs, soft narrow rounded shoulders (persona + every picture prompt); new reference face with
    bangs (Nano Banana run 37175758855 #05); **her body from a Nano Banana picture as klein's image 1** (`face.js`
    BODY_JPEG_BASE64): curvy 8/8 (was slim in 5/13), place picture now image 2.
  - **Lingerie on Nano Banana** (`PICTURE.LINGERIE`, $0.039, cap $0.50/day, klein when refused); **9:16** pictures;
    daily AI cap 50,000 neurons (pictures stop at 60%).

- **Klein prompt reviewed (owner: hips wider than shoulders, soft shoulders and arms):** `PICTURE.REFERENCE`, `LOOKS`, the
  lingerie `WHO` and the persona now say pear-shaped hourglass, soft smooth rounded arms, hips and thighs clearly wider than
  the shoulders. 5-shot check: hips wider in 3 of 4 full-body shots, arms soft 5/5; one shot drifted heavy (waist lost).
  Next round (after 00:00 UTC, the day cap is spent): keep "narrow defined waist" first, judge again.

## Owner's direction (DECISIONS 2026-10-04)
- Providers: Cloudflare Workers AI and OpenRouter only. Nano Banana for lingerie, klein for the rest, all 9:16.
- Voice: off ElevenLabs (credits running out); Sulafat first. Body: the Nano Banana body is "perfect".

## Waiting on the owner
- **Open `/setup` once** (Telegram), send her a voice note and ask for one, ask for a lingerie picture. Delete the old
  branches (Actions > Delete retired branches).
- **Cost estimate** (given in chat): ~$0.08 a light user a day, ~$0.20 typical, caps are per bot (lingerie $0.50,
  voice $0.30, Workers AI $0.44 a day) plus $0.17 a day for the plan. Want a daily cap on the text model too?
- **Laughs in Gemini voice:** judge the `[laughs]` sound by ear after the deploy (Whisper can't hear laughs).

## Verified this session (2026-10-04)
- `node tools/check.mjs` all 6 ok; e2e: Gemini asked for pcm with Sulafat and its tags, MP3 sent, Grok path still ok;
  unit: `pcmToMp3` makes real MP3 frames. Not yet tried: a real Gemini voice note on Telegram (no live check).
- Every picture read at full size: 5 Nano Banana (bangs), 13 klein with the new face, 8 klein with the body reference.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **After the deploy:** read the live Worker back (done below if listed), check /setup, one Gemini voice note (ask Reem to send one), one
   lingerie picture, one everyday picture with the body reference. *Effort: low*
2. **Persona prompt for Gemini voice:** her voice notes may use `[laughs]`, `[whispers]`, `[sighs]` (now spoken, not aura's
   "mm"/"hm"); check `VOICE_TAGS` wording. *Effort: low*
3. **Night light and outfit places:** daylight in night shots; a beach outfit chosen at 23h; boudoir/waist drawn as a long
   dress (klein's filter dodge). *Effort: low*
4. **Selfie quality with the FLUX skill's rules:** phone covering half the face in mirror shots, a second Basbousa. *Effort: medium*
5. **Text model** (owner's direction): DeepSeek V4 Flash vs others, cost per reply and quality. *Effort: high*
6. **Persona slips seen live:** "your cat"/"barbara", "him/his" for "you", "tonight" in the afternoon. *Effort: medium*
7. **Context and memory:** stable prompt prefix for caching, then a "story state" in the notes. *Effort: medium*

## Open questions for the owner
- Time-awareness, a daily plan, explicitness, natural-looking pictures (asked 2026-10-03): which proposal to do.

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). <describe the next change>. Finish with /handoff.
