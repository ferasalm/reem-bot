# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-04 night (bangs + soft shoulders, new face with bangs, TTS bench in the MAP; Sulafat waits on the owner; not deployed)

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid since 2026-10-03, $5/month).
- **Live (`main`, deployed 2026-10-03 22:24 UTC):** v10 on DeepSeek V4 Flash; Lebanese Reem in Belmont, MA; fixed
  places; pictures 768x1024 on klein; daily AI cap 28,000 neurons; voice and hearing on ElevenLabs.
- **On `dev`** (pushed earlier today): her voice on aura-2, his voice notes heard by Whisper, ElevenLabs as backup.
- **On branch `ccr-71a2a962-xvkpy6` only** (not on `dev` yet: the docs check needs the TTS bench in `docs/MAP.md`):
  - **New face:** cropped from Nano Banana's lingerie picture (`face.js`); klein keeps it in 13/13 test pictures.
    If `/face keep` was ever used, `/face reset` brings this one in.
  - **9:16 everywhere:** klein 576x1024 (same price), Nano Banana `aspect_ratio` 9:16.
  - **Lingerie on Nano Banana** (`PICTURE.LINGERIE`): boudoir selfies drawn text-only on OpenRouter with real
    lingerie words, $0.039 each, its own cap $0.50/day; klein draws them when Google refuses or the money is spent.
  - **Voice:** aura speaks as Andromeda; a new `VOICE.PROVIDER` "openrouter" (Grok, Fish Audio, MiniMax, Orpheus...)
    with its own money cap `OR_DAILY_USD` $0.30, MP3 voice notes; ElevenLabs stays the backup.
  - **Daily AI cap 50,000 neurons** (at most $0.44/day); pictures stop at 60%, so voice/hearing/photos keep 20,000.

- **This session (2026-10-04, owner's list):** persona + picture prompts say wispy full bangs and soft, narrow, rounded
  shoulders (described, never the real person's name, in image prompts); Nano Banana redone with them (bench 37175758855),
  new reference face cropped from #05 (`face.js`); klein face run 37175866255: bangs in 12/13, slim body in 5/13 again.
  MAP line for the TTS bench added (`docs/MAP.md`, docs check passes). **Not done: Sulafat as the voice** (below).

## Owner's direction (DECISIONS 2026-10-04)
- Providers: Cloudflare Workers AI and OpenRouter only. Nano Banana for lingerie, klein for the rest, all 9:16.
- Voice: off ElevenLabs (credits running out); Andromeda beats Helena but nothing matches ElevenLabs yet.

## Waiting on the owner
- **Pick a voice** from the 9 OpenRouter samples sent (Gemini Sulafat/Despina, Grok ara/eve, Fish Audio, MiniMax HD,
  Orpheus tara/leah, Deepgram Flux maeve), or keep Andromeda. Grok/Fish/MiniMax/Orpheus plug in with 2 settings.
  Gemini needs one more step (it only gives raw audio).
- **Sulafat (Gemini 3.8 Flash TTS, $0.015 per 1,000 chars) needs PCM → MP3 inside the Worker.** The only route I found is
  vendoring `@breezystack/lamejs` (LGPL, 165 KB as `mp3.js`); the session's permission check blocked it. Say "add lamejs"
  (or pick another route) and I wire `OR_FORMAT: "pcm"`, `OR_MODEL`, `OR_VOICE: "Sulafat"`, an e2e test and a MAP line.
- **Deploy** (say "Deploy"): everything above plus `dev`. Then open `/setup` once and send her a voice note.
- **Delete the old branches** (Actions > Delete retired branches).

## Verified this session (2026-10-04)
- `node tools/check.mjs`: settings panel, parse, unit, scenarios, e2e ok; docs FAIL only on the MAP line above.
- e2e/scenarios: Nano Banana draws lingerie (real words, 9:16, price counted), klein on refusal/error/money spent,
  everyday never sent to it; OpenRouter voice used with its own tags, ElevenLabs on failure or money spent.
- 15 klein pictures with the new face read at full size; 27 OpenRouter voice transcripts read.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **MAP line + push to `dev`** once the owner allows it; then deploy on "Deploy", read the live Worker back, check
   /setup, one lingerie picture, one voice note each way. *Effort: low*
2. **Wire the owner's voice pick** (`VOICE.PROVIDER`, `OR_MODEL`, `OR_VOICE`, `OR_CUES`; Gemini needs PCM → OGG
   in the Worker or sendAudio). *Effort: low (Gemini: medium)*
3. **Curvy body on klein:** 6/15 drawn slim with the new face; try the body words first in REFERENCE, or the body
   from a Nano Banana picture as a second reference. Small face run, every picture read. *Effort: medium*
4. **Night light and outfit places:** daylight in 2 night shots; a beach outfit chosen at 23h. *Effort: low*
5. **Text model** (owner's direction): DeepSeek V4 Flash vs others, cost per reply and quality. *Effort: high*
6. **Persona slips seen live:** "your cat"/"barbara", "him/his" for "you", "tonight" in the afternoon. *Effort: medium*
7. **Context and memory:** stable prompt prefix for caching, then a "story state" in the notes. *Effort: medium*

## Open questions for the owner
- Time-awareness, a daily plan, explicitness, natural-looking pictures (asked 2026-10-03): which proposal to do.

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). <describe the next change>. Finish with /handoff.
