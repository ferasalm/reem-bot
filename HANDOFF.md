# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-03, late night (pictures re-read; first `[live]` run of the new persona; fixes on `dev`)

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid since 2026-10-03, $5/month).
- **Live (`main`, deployed 2026-10-03):** v10 on DeepSeek V4 Flash; Lebanese Reem in Belmont, MA (clock
  America/New_York); Basbousa "she"; fixed places (`places.js`); pictures 768x1024; daily AI cap 28,000 neurons.
- **On `dev`, not deployed:** ROOM no longer asks for the reference's light; no bathroom in body-length mirror
  shots; `takeSelfie` ignores bracketed pauses ("[stays quiet..., then types again]" sent an unasked picture live)
  and drops a "sends:" label; 4 persona situations in the live check. Details: `docs/CHANGELOG.md`.

## Owner's direction (DECISIONS 2026-10-03)
- **Cloudflare is paid for: use it.** Providers allowed: **Cloudflare Workers AI and OpenRouter only.** Keep proposing
  high-quality, low-cost, efficient models for **text, pictures and voice** on those two.
- **Lingerie: not accepted as limited by Cloudflare's filter** (it refuses bra/panties/thong and boudoir back views
  whatever the wording) → find a model or route on Cloudflare or OpenRouter that draws it (see next step 3).

## Waiting on the owner
- **Deploy?** The `dev` fixes above are small and tested (mocked + live). Say "Deploy" to merge `dev` into `main`.
- **Open `/setup` once** (if not done since the 2026-10-03 deploy), then try a pic, a lingerie pic, "let me see you".
- **Delete the old branches:** Actions > Delete retired branches > Run workflow, type `delete`. `face-candidates` stays.

## Verified this session (2026-10-03)
- All 22 test pictures read at full size, one at a time: pass 12, weak 3, fail 7 (`docs/QUALITY.md`, Pictures).
  Holds: rooms 22/22, phone rule 21/21, face in chest-up selfies. Fails: night light 0/12, bathroom mirror 3/3,
  front-camera selfies drawn third-person 4/9, younger/slimmer in full-body shots, "red satin bodysuit" 0/3.
- Round 4 (face run 37155823695) after the ROOM fix: the lamp is on in 1/3 night shots, still daylight → wording is
  not enough. The code-picked bedroom mirror shot is clean.
- `[live]` run 37155823580, every reply read: Lebanon/Beirut 3/3, Basbousa "she" 3/3, clock right 3/3, under-16
  9/9. Slips: an unasked picture (fixed), "[sends: ...]" (fixed); "your cat" and "barbara" for Basbousa once each,
  "tonight" at 5:38 PM, "his gaze" for "you" in 2 scenes (not fixed: content).
- `node tools/check.mjs` all 6 ok.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Night place pictures:** draw an evening/lamp-lit version of her bedroom, living room and his rooms (face.yml,
   places mode), pick by reading each at full size, and send the night one when her hour is evening/night.
   Then re-run the 3 night shots of round 4. *Effort: medium*
2. **Selfies drawn as third-person photos (4/9) and age drift in full-body shots:** try stronger front-camera wording
   (arm visible at the frame edge?) and the age in the mirror template; check with a small face run. *Effort: medium*
3. **Better models on Cloudflare or OpenRouter** (owner's direction): bench (a) pictures, esp. lingerie (other Workers
   AI image models: flux-2-dev, lucid-origin, phoenix; OpenRouter image models: moderation and price first);
   (b) text: DeepSeek V4 Flash vs others, cost per reply and quality; (c) voice: ElevenLabs vs Workers AI TTS
   (melotts, aura). Report price, quality and refusals; the owner picks. *Effort: high*
4. **Persona slips seen live:** Basbousa called "your cat"/"barbara", "him/his" for "you" in scenes, "tonight" in
   the afternoon: scenario rows where a format fix is possible, else prompt tuning for the owner. *Effort: medium*
5. **Context and memory** (owner's questions 6-7): stable prompt prefix for provider caching, then a structured
   "story state" in the memory notes. Measure tokens first. *Effort: medium*
6. **Later (owner's plan):** ElevenLabs v4 instead of v3 (`isV3()`). *Effort: high*

## Open questions for the owner
- Deploy the `dev` fixes now, or wait for the night place pictures (step 1) and deploy together?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). <describe the next change>. Finish with /handoff.
