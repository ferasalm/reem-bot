# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-05. The new Reem (v11, `docs/REEM-BIBLE.md`) is built, tested and on `dev`, **not deployed**.
Live is still the 2026-10-04 deploy (Lebanese Reem in Belmont).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid since 2026-10-03, $5/month).
- **Live (`main`, deployed 2026-10-04):** v10 on DeepSeek V4 Flash; Reem Saleh in Belmont; Sulafat voice (Gemini TTS,
  lamejs MP3), bangs, Nano Banana body as klein's image 1, Nano Banana lingerie, 9:16, daily AI cap 50,000 neurons.
- **On `dev`, not deployed: v11 persona** (owner 2026-10-05, Basbousa dropped):
  - `SYSTEM_PROMPT` distilled from the bible: Reem Nabot, 29, Armenian-Lebanese from Bourj Hammoud, freelance
    bookkeeper at her kitchen table in a Watertown triple-decker, his door across the landing; deflect then
    interrogate, cold reads through the wall, no polite filler, at most one question a reply, end on a hook;
    Levantine English with Lebanese, Armenian and French words. Looks, INTIMACY and `LIMITS & OOC` unchanged.
  - Intro scene = the bible's runtime scene; `CITY` Watertown; schedule, nudges, proactive prompt, Whisper hint and
    picture words (no café in Cushing Square, no fabric samples, no cat); `OR_INSTRUCTIONS` ask Sulafat for a light
    Lebanese accent; `NUDGES.TIME`: "tonight" only in the evening.
  - Code: `offeredTags` (she's told only the tags her voice performs: Sulafat [laughs] [sighs] [whispers]); `toYou`
    (him/his → you/your in scene narration); whole [bracket] lines dropped; `[photos: ...]` and `[label: ...]`
    markers; OOC acting → her quoted words; apart acting on her phone → her words as texts.
- **Pictures not redrawn yet:** her living room, porch and hallway pictures still show the brick Belmont flat (next
  step 3). Until then a picture of her worktable may show the old desk.

## Waiting on the owner
- **Deploy v11?** Say "Deploy" to merge `dev` into `main`. Suggest after step 3 (places) so words and pictures match;
  deploying now works too (only the three places look like the old flat).
- After any deploy: open `/setup` once, ask her for a voice note (judge the Levantine accent and `[laughs]` by ear;
  Whisper can't hear either), one lingerie picture, then `/restart` (old Belmont chat pulls her back).
- The ElevenLabs backup voice was designed "North Jersey": keep it or redesign (your call; it's only the backup).
- Delete the old branches (Actions > Delete retired branches). Cost estimate questions from 2026-10-04 still open.

## Verified this session (2026-10-05)
- `node tools/check.mjs` all 6 ok; new scenario rows each failed on the old code first.
- Three `[live]` runs, every reply read (`docs/QUALITY.md`): 37259031783 (1 broken: OOC acted), 37259492385 (2 broken:
  a bracketed paragraph, a phone "scene" apart), **37259888697: 85/85 calls, 0 broken**, origin 3/3, the landing 3/3,
  bookkeeper 3/3, no "him/his" in 15 scenes, under-16 held (the known "what are you wearing" answer once).
- Not tried: a real Gemini voice note with the new accent wording, any picture with the new words (no live draw).

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Redraw her places** for the triple-decker (bible "Building it"): living room → plaster walls, steam radiator,
   kitchen-table workspace with laptop and receipt shoeboxes; porch → small third-floor porch over an asphalt
   driveway; hallway → narrow wooden third-floor landing, two facing doors; day and night; update `LOCATIONS` LOOK
   to match; read every picture at full size. Own chat. *Effort: medium*
2. **After the deploy:** /setup, a Gemini voice note (accent, laughs), a lingerie picture, an everyday picture with
   the body reference. *Effort: low*
3. **Tuning v11 from live chat:** she leans on the radiator + spoon; family details sometimes come early; read a
   real conversation and adjust the prompt (no format guards for content). *Effort: medium*
4. **Night light and outfit places:** daylight in night shots; a beach outfit at 23h; boudoir/waist drawn as a long
   dress. *Effort: low*
5. **Selfie quality with the FLUX skill's rules:** phone covering half the face in mirror shots. *Effort: medium*
6. **Text model** (owner's direction): DeepSeek V4 Flash vs others, cost per reply and quality. *Effort: high*
7. **Context and memory:** stable prompt prefix for caching, then a "story state" in the notes. *Effort: medium*

## Open questions for the owner
- Deploy v11 now or after the places redraw?
- Time-awareness, a daily plan, explicitness, natural-looking pictures (asked 2026-10-03): which proposal to do.

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). Do next step 1: redraw her places for the triple-decker. Finish with /handoff.
