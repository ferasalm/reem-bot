# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-05 (third session). v11, klein-first lingerie, the stronger accent and the owner's place pictures are on `dev`,
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
- **Hearing model** (STT bench run 37266123079, `docs/QUALITY.md`): Gemini 3.8 Flash got every word, the Arabic and
  the Arabizi, and heard sighs, whispers, annoyance and 2/3 laughs (with some made-up sighs), ~$0.02 a minute, 3-7 s;
  Gemini 3.5 Flash Lite is ~$0.0015 a minute and fast but mislabels sounds; Whisper (live) hears no sounds. Owner
  picks; Claude's lean: Gemini 3.8 Flash with Whisper as the backup. Then build it in `transcribe` (OGG goes as is).
- **Lingerie on klein** (runs 37263536954, 37266040257): one-pieces and layers drew 4/12 as asked (bodysuit +
  stockings, robe or his shirt open over a set, satin one-piece), 4 half, 4 refused. Owner picks: give klein these
  wordings (her face, but less real lingerie; Nano Banana rarely called), or keep klein-first with the real words.
- **Deploy?** Say "Deploy" to merge `dev` into `main`; then `/setup`, a voice note, a lingerie picture, `/restart`.
- The ElevenLabs backup voice is "North Jersey": keep or redesign. Delete old branches (Actions > Delete retired
  branches). Cost estimate questions from 2026-10-04 still open.

## Verified this session (2026-10-05, third session)
- `node tools/check.mjs` all 6 ok (scenarios: klein first, klein refuses → Nano Banana, both refuse → filter words).
- The owner's place pictures: in `places.js`, LOOK matched; klein drew her in 6 of them, 6/6 rooms right (1 framing weak).
- Both lingerie rounds and the STT bench read in full (`docs/QUALITY.md`).
- Not checked: no `[live]` run, no real picture or voice note through the bot with the new code; the STT clips were
  made by Gemini TTS, not a real voice note.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Hearing switch** (after the owner's pick): `transcribe` sends his OGG to the picked model on OpenRouter with the
   bench prompt (Arabizi kept in Latin letters), Whisper as the backup, a CONFIG key + panel field, scenarios. *Effort: medium*
2. **Lingerie wordings on klein** (if the owner picks them): a klein wardrobe of the 4 that worked. *Effort: low*
3. **Deploy** (owner's call), then /setup, a voice note, a lingerie picture. *Effort: low*
4. **Tuning v11 from live chat:** radiator + spoon repeats; family details early. *Effort: medium*
5. **Selfie quality with the FLUX skill's rules:** phone shown in "no phone" selfies, phone over the face, selfies
   framed by someone else. *Effort: medium*
6. **Night light and outfit places:** beach outfit at 23h, boudoir drawn as a long dress. *Effort: low*
7. **Text model** (owner's direction): DeepSeek V4 Flash vs others, cost and quality. *Effort: high*
8. **Context and memory:** stable prompt prefix for caching, then a "story state" in the notes. *Effort: medium*

## Open questions for the owner
- Which hearing model? Klein lingerie wordings or the current route? Deploy now?
- Time-awareness, a daily plan, explicitness, natural-looking pictures (asked 2026-10-03): which proposal to do.

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). Hearing model: <pick>. Klein lingerie: <wordings|current>. Then next step 1. Finish with /handoff.
