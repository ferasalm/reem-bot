# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-05 (second session). The new Reem (v11) and her redrawn places are on `dev`, **not deployed**.
Live is still the 2026-10-04 deploy (Lebanese Reem in Belmont).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid since 2026-10-03, $5/month).
- **Live (`main`, deployed 2026-10-04):** v10 on DeepSeek V4 Flash; Reem Saleh in Belmont; Sulafat voice (Gemini TTS,
  lamejs MP3), bangs, Nano Banana body as klein's image 1, Nano Banana lingerie, 9:16, daily AI cap 50,000 neurons.
- **On `dev`, not deployed:**
  - v11 persona from `docs/REEM-BIBLE.md` (Reem Nabot, Armenian-Lebanese bookkeeper, Watertown triple-decker across the
    landing; Basbousa dropped) with its format guards (`offeredTags`, `toYou`, bracket lines, OOC acting). See CHANGELOG.
  - **Her places redrawn (this session):** living room (plaster walls, steam radiator under the sash window, kitchen
    table as her desk with laptop, calculator and receipt shoeboxes, olive sofa), back porch (gray boards, folding
    chair, coffee can, string lights, driveway with bins and a van below), third-floor landing (plank floor, back stairs,
    facing wooden doors, bare bulb, tall mirror by her door); day and night pictures in `places.js`; `LOCATIONS` LOOK
    and living WORDS match. Bedroom, bathroom, kitchen and his rooms unchanged.
- **Which model draws what (read from the code, shown to the owner):** klein 4B = every everyday/flirty selfie and
  scene picture (face + body + place references) and boudoir when Nano Banana refuses/fails/is capped; Nano Banana
  (OpenRouter, words only) = boudoir selfies; schnell = only when klein is unavailable (a different woman, wrong
  rooms: backup only); Llama 4 Scout (Gemma 3 backup) = sees his photos.
- Owner's preview page (private artifact): https://claude.ai/artifact/LWGGrnTjMRAiLCTTSZ3rmg (places before/after,
  one picture per model, 12 voice clips).

## Waiting on the owner
- **Which accent wording?** Listen to the clips on the preview page: live "light Levantine" vs a "stronger accent"
  test wording vs the old one. Say which to keep (Claude's lean: the live one unless the accent is too faint).
- **Deploy v11?** Words and pictures now match. Say "Deploy" to merge `dev` into `main`.
- After any deploy: open `/setup` once, ask her for a voice note, one lingerie picture, then `/restart`.
- The ElevenLabs backup voice is "North Jersey": keep or redesign. Delete old branches (Actions > Delete retired
  branches). Cost estimate questions from 2026-10-04 still open.

## Verified this session (2026-10-05, second session)
- `node tools/check.mjs` all 6 ok. Sync report's "other branches" warning was the shallow clone (unshallowed: none).
- Every picture read at full size (`docs/QUALITY.md`): 9 day + 9 night place tries, 6 klein shots in the new places
  (5 pass, 1 weak: dusk sky at 22h), 2 Nano Banana (both drawn), 2 schnell (backup quality).
- Voice run 37261464781: Whisper heard every word of the live wording; the accent and [laughs] need the owner's ears.
- Not checked: the porch reads as one floor up, not three (all three tries); no `[live]` chat run this session (no
  prompt change).

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Accent pick, then deploy** (owner's call): if the owner picks the stronger wording, put it in
   `VOICE.OR_INSTRUCTIONS` and rebuild the panel; then deploy and do /setup, a voice note, a lingerie picture. *Effort: low*
2. **Tuning v11 from live chat:** she leans on the radiator + spoon; family details sometimes come early; read a
   real conversation and adjust the prompt (no format guards for content). *Effort: medium*
3. **Night light and outfit places:** daylight/dusk in night shots (seen again: porch at 22h); a beach outfit at 23h;
   boudoir/waist drawn as a long dress. *Effort: low*
4. **Selfie quality with the FLUX skill's rules:** phone covering half the face in mirror shots; "from above"
   selfies drawn as third-person shots. *Effort: medium*
5. **Porch height (optional):** redraw the porch so it looks three floors up (wording "seen from high above,
   rooftops at eye level"). *Effort: low*
6. **Text model** (owner's direction): DeepSeek V4 Flash vs others, cost per reply and quality. *Effort: high*
7. **Context and memory:** stable prompt prefix for caching, then a "story state" in the notes. *Effort: medium*

## Open questions for the owner
- Which accent wording, and deploy v11 now?
- Time-awareness, a daily plan, explicitness, natural-looking pictures (asked 2026-10-03): which proposal to do.

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). Accent wording: <live|stronger>. Then do next step 2 (tuning v11 from live chat). Finish with /handoff.
