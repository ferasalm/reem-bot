# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-05 (third session). v11, klein-first lingerie, the stronger accent and the owner's place pictures are on `dev`,
**not deployed**. Live is still the 2026-10-04 deploy (Lebanese Reem in Belmont).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid since 2026-10-03, $5/month).
- **Live (`main`, deployed 2026-10-04):** v10 on DeepSeek V4 Flash; Reem Saleh in Belmont; Sulafat voice, bangs, body
  reference, Nano Banana lingerie, 9:16, daily AI cap 50,000 neurons; Whisper hears his voice notes.
- **On `dev`, not deployed:** v11 persona (Reem Nabot, Armenian-Lebanese bookkeeper, Watertown triple-decker); the
  owner's place pictures (all 8 places, day and night) with matching LOOKs; the stronger accent; and, this session:
  - **Hearing:** Gemini 3.8 Flash (OpenRouter) hears his voice notes first, laughs and tone in parentheses; Whisper,
    then Scribe, as backups (`HEARING.OR_*`).
  - **Lingerie route:** klein first in `LINGERIE.KLEIN_WARDROBE` (her face); Nano Banana when klein refuses; two
    pieces, "spicier", from behind or explicit words go straight to Nano Banana with `SPICY_PROMPT` (the owner's
    JSON style, her description; bench 4/4); klein's filter-safe chain last.
- Owner's preview page (private artifact): https://claude.ai/artifact/LWGGrnTjMRAiLCTTSZ3rmg

## Waiting on the owner
- **Deploy?** Say "Deploy" to merge `dev` into `main`; then `/setup`, a voice note (with a laugh), a lingerie
  picture and a "spicier" one, `/restart`.
- The ElevenLabs backup voice is "North Jersey": keep or redesign. Delete old branches (Actions > Delete retired
  branches). Cost estimate questions from 2026-10-04 still open.

## Verified this session (2026-10-05, third session)
- `node tools/check.mjs` all 6 ok: Gemini hears first / too long or failing → Whisper (e2e); klein first in
  KLEIN_WARDROBE, refusal → Nano Banana, two pieces / "spicier pic" / "pic from behind" → Nano Banana JSON (scenarios).
- Read in full (`docs/QUALITY.md`): owner's places (6/6 rooms), lingerie rounds 1 and 2 on klein, STT bench, the
  spicier Nano Banana bench (4/4).
- Not checked: no `[live]` run and no real voice note through the bot; "spicier" only counts when he asks for a
  picture ("send me a spicier pic"; "something spicier" alone plans none); night light ignored by Nano Banana (1/1).

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Deploy** (owner's call), then /setup, a voice note with a laugh, a lingerie and a "spicier" picture. *Effort: low*
2. **Tuning v11 from live chat:** radiator + spoon repeats; family details early; check what Gemini's (laughs) does to
   her replies. *Effort: medium*
3. **Selfie quality with the FLUX skill's rules:** phone shown in "no phone" selfies, phone over the face, selfies
   framed by someone else; Nano Banana night light. *Effort: medium*
4. **"Spicier" without "pic":** decide whether "send me something spicier" alone should plan a picture. *Effort: low*
5. **Night light and outfit places:** beach outfit at 23h, boudoir drawn as a long dress. *Effort: low*
6. **Text model** (owner's direction): DeepSeek V4 Flash vs others, cost and quality. *Effort: high*
7. **Context and memory:** stable prompt prefix for caching, then a "story state" in the notes. *Effort: medium*

## Open questions for the owner
- Deploy now? Should "something spicier" (no "pic") send a picture?
- Time-awareness, a daily plan, explicitness, natural-looking pictures (asked 2026-10-03): which proposal to do.

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). <Deploy | next step 2>. Finish with /handoff.
