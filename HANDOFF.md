# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-05 (third session). v11, klein-first lingerie and the stronger accent are on `dev`,
**not deployed**. Live is still the 2026-10-04 deploy (Lebanese Reem in Belmont).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid since 2026-10-03, $5/month).
- **Live (`main`, deployed 2026-10-04):** v10 on DeepSeek V4 Flash; Reem Saleh in Belmont; Sulafat voice (Gemini TTS,
  lamejs MP3), bangs, Nano Banana body as klein's image 1, Nano Banana lingerie, 9:16, daily AI cap 50,000 neurons.
- **On `dev`, not deployed:**
  - v11 persona (Reem Nabot, Armenian-Lebanese bookkeeper, Watertown triple-decker) with its format guards, and
    her redrawn living room, porch and landing (see CHANGELOG).
  - **This session:** boudoir selfies go to klein first (her face, real lingerie words; `LINGERIE.KLEIN_FIRST`),
    then Nano Banana when klein refuses, then klein's filter-safe wardrobe; `VOICE.OR_INSTRUCTIONS` = the
    stronger accent wording.
- **Expect:** in the 2026-10-03 tests Cloudflare refused every prompt with bra/panties (5/5), so most lingerie
  pictures will still end up on Nano Banana, each after one klein try (~105 neurons and klein's wait). Turn
  `KLEIN_FIRST` off on the panel if that's too slow.
- Owner's preview page (private artifact): https://claude.ai/artifact/LWGGrnTjMRAiLCTTSZ3rmg

## Waiting on the owner
- **Place pictures:** the owner draws them from `tools/face/place-prompts.md` (day first, night by editing the day
  picture) and sends them. Claude then crops to 480x480, checks each at full size against its LOOK, saves
  `tools/face/places/<key>.jpg` / `<key>_night.jpg`, runs `node tools/face/build-places.mjs`, checks with a klein job.
- **Hearing model:** Claude proposed Gemini Flash Lite (OpenRouter, audio input) to hear laughs, tone, accents and
  Arabic; owner to say whether to bench it against Whisper.
- **Deploy v11?** Say "Deploy" to merge `dev` into `main`; then `/setup`, a voice note, a lingerie picture, `/restart`.
- The ElevenLabs backup voice is "North Jersey": keep or redesign. Delete old branches (Actions > Delete retired
  branches). Cost estimate questions from 2026-10-04 still open.

## Verified this session (2026-10-05, third session)
- `node tools/check.mjs` all 6 ok (scenarios: klein first, klein refuses → Nano Banana, both refuse → filter
  words, refused klein picture counted once). Sync report's warning was the shallow clone (unshallowed: none).
- Not checked: no real picture or voice drawn with the new code (no live run); the accent was the owner's pick by ear.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Owner's place pictures in:** check, crop, build `places.js`, one klein job of her in each new place. *Effort: low*
2. **Hearing bench (if the owner agrees):** Gemini Flash Lite vs Whisper on clips with laughs, sighs, Arabic and
   an accent (Sulafat-made clips + one real voice note), then switch `transcribe`. *Effort: medium*
3. **Deploy** (owner's call), then /setup, a voice note, a lingerie picture; watch how often klein draws lingerie. *Effort: low*
4. **Tuning v11 from live chat:** radiator + spoon repeats; family details early. *Effort: medium*
5. **Night light and outfit places:** daylight at night, beach outfit at 23h, boudoir drawn as a long dress. *Effort: low*
6. **Selfie quality with the FLUX skill's rules:** phone hiding the face; "from above" drawn third-person. *Effort: medium*
7. **Text model** (owner's direction): DeepSeek V4 Flash vs others, cost and quality. *Effort: high*
8. **Context and memory:** stable prompt prefix for caching, then a "story state" in the notes. *Effort: medium*

## Open questions for the owner
- Bench Gemini for hearing? Deploy v11 now?
- Time-awareness, a daily plan, explicitness, natural-looking pictures (asked 2026-10-03): which proposal to do.

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). Here are the place pictures: <attach>. Then next step 2 if I said yes to the hearing bench. Finish with /handoff.
