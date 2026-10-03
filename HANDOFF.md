# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-03, late night (night place pictures; FLUX prompting skill registered; on `dev`)

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid since 2026-10-03, $5/month).
- **Live (`main`, deployed 2026-10-03, last at 22:24 UTC with everything below):** v10 on DeepSeek V4 Flash; Lebanese Reem in Belmont, MA (clock
  America/New_York); Basbousa "she"; fixed places (`places.js`); pictures 768x1024; daily AI cap 28,000 neurons.
- **Deployed 22:24 UTC (was on `dev`):**
  - (earlier session) ROOM no longer asks for the reference's light; no bathroom in body-length mirror shots;
    `takeSelfie` ignores bracketed pauses and drops a "sends:" label; 4 persona situations in the live check.
  - (this session) **night place pictures**: 7 rooms drawn at night from their day pictures (`places/<key>_night.jpg`,
    in `places.js`); after dark (`isDark`) her pictures use them. Bathroom keeps its one picture (lamp-lit).
  - **FLUX prompting skill** (Black Forest Labs, `flux-image-best-practices`) registered in `.claude/settings.json`:
    sessions get it installed. Its rules: klein wants narrative prose, subject first, light described in detail,
    40-70 words, no negative wording; name each reference image's role ("image 0: face", "image 1: room").

## Owner's direction (DECISIONS 2026-10-03)
- **Cloudflare is paid for: use it.** Providers allowed: **Cloudflare Workers AI and OpenRouter only.** Keep proposing
  high-quality, low-cost, efficient models for **text, pictures and voice** on those two.
- **Lingerie: not accepted as limited by Cloudflare's filter** → find a model or route on Cloudflare or OpenRouter
  that draws it (next step 2).

## Waiting on the owner
- **Open `/setup` once** (after the 22:24 deploy), then try a pic at night, a lingerie pic, "let me see you".
- **Delete the old branches:** Actions > Delete retired branches > Run workflow, type `delete`. `face-candidates` stays.

## Verified this session (2026-10-03)
- The 14 + 6 night room pictures read at full size next to their day pictures; 7 picked (CHANGELOG has the picks).
  his_living's night picture is a weak pass: its doorway still looks daylit.
- Round 5 (face run 37157228216), round 4's night prompts with the night rooms: lamp on 6/6 (was 1/3), night window
  2/6. Fails: "black lace bodysuit" drawn as the reference's black tee 2/2, two cats once, third-person framing 2/6
  (`docs/QUALITY.md`).
- `node tools/check.mjs` all 6 ok; new scenario rows: `isDark`, and each place's night picture sent when dark.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Selfie quality with the FLUX skill's rules:** front-camera selfies drawn as third-person photos (2/6 this round,
   4/9 before), age/body drift in full-body shots, the outfit copied from the reference's black tee, a second
   Basbousa, windows still light at night (4/6). Try: image roles named ("image 0 is only her face; her clothes
   are..."), front-camera wording, age in the mirror template, "the window black with night" in NIGHT light.
   Check with a small face run, every picture read at full size. *Effort: medium*
2. **Better models on Cloudflare or OpenRouter** (owner's direction): bench (a) pictures, esp. lingerie (other Workers
   AI image models: flux-2-dev, lucid-origin, phoenix; OpenRouter image models: moderation and price first);
   (b) text: DeepSeek V4 Flash vs others, cost per reply and quality; (c) voice: ElevenLabs vs Workers AI TTS
   (melotts, aura). Report price, quality and refusals; the owner picks. *Effort: high*
3. **Persona slips seen live:** Basbousa called "your cat"/"barbara", "him/his" for "you" in scenes, "tonight" in
   the afternoon: scenario rows where a format fix is possible, else prompt tuning for the owner. *Effort: medium*
4. **Context and memory** (owner's questions 6-7): stable prompt prefix for provider caching, then a structured
   "story state" in the memory notes. Measure tokens first. *Effort: medium*
5. **Later (owner's plan):** ElevenLabs v4 instead of v3 (`isV3()`). *Effort: high*

## Open questions for the owner
- Owner asked 2026-10-03: time-awareness, a daily plan, explicitness, natural-looking pictures → answered in chat;
  the owner picks which proposal to do (day plan, picture probe run).

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). <describe the next change>. Finish with /handoff.
