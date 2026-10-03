# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-03, night (deployed: Lebanese Reem in Belmont, fixed places, pictures, Workers AI cap)

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid since 2026-10-03, $5/month).
- **Live (`main` = `dev`, deployed 2026-10-03 on the owner's "Deploy"):** v10 on DeepSeek V4 Flash; **Lebanese Reem in
  Belmont, MA** (her clock is America/New_York); Basbousa "she"; **fixed places** (her rooms, his rooms, the hallway:
  `places.js`); pictures 768x1024, about twice as often, curvier body, 120 s timeout; `FILTER_WORDS` and the boudoir
  retry; daily AI cap 28,000 neurons (at most $0.20/day); branch-delete button. Details: `docs/CHANGELOG.md`.
- Not yet checked with a `[live]` run or in the real chat: the new persona, the new pictures.

## Owner's direction (DECISIONS 2026-10-03)
- **Cloudflare is paid for: use it.** Providers allowed: **Cloudflare Workers AI and OpenRouter only.** Keep proposing
  high-quality, low-cost, efficient models for **text, pictures and voice** on those two.
- **Lingerie: not accepted as limited by Cloudflare's filter** (it refuses bra/panties/thong and boudoir back views
  whatever the wording) → find a model or route on Cloudflare or OpenRouter that draws it (see next step 3).

## Waiting on the owner
- **Open `/setup` once** now that it is deployed; then try a pic, a lingerie pic, "let me see you" mid-scene, and
  tell Claude what comes out and what she says (Boston time, Lebanese, Basbousa).
- **Delete the old branches:** Actions > Delete retired branches > Run workflow, type `delete`. `face-candidates` stays.
- Optional: a Cloudflare billing alert.

## Verified this session (2026-10-03)
- `node tools/check.mjs` all 6 ok; CI green; deploy: see CHANGELOG for the run.
- **Correction (owner): my reading of the test pictures was not accurate enough.** I judged 33 pictures from small
  contact sheets and called them "same face", "same room", "fills the frame". Treat those verdicts as unverified.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Re-read the test pictures carefully:** open each picture at full size (`face-candidates` runs 37150980076,
   37151684663, 37152577208 and round 3), one at a time, and write down per picture: face match against
   `tools/face/reference.jpg`, apparent age, body, outfit, phone rule, room match against `tools/face/places/*.jpg`,
   framing, artifacts (hands, mirror reflection). Record the verdicts in `docs/QUALITY.md`, then fix what is wrong. *Effort: medium*
2. **`[live]` run** of the deployed persona: read every reply, add a `docs/QUALITY.md` row, fix slips with scenario
   rows (Boston clock and day rhythm, Lebanese details, Basbousa "she"). *Effort: medium*
3. **Better models on Cloudflare or OpenRouter** (the owner's direction): bench, with real pictures and live replies,
   candidates for (a) pictures, esp. lingerie: other Workers AI image models (flux-2-dev, lucid-origin, phoenix) and
   image models on OpenRouter (check their moderation and price first); (b) text: DeepSeek V4 Flash vs other
   OpenRouter and Workers AI chat models, by cost per reply and quality; (c) voice: ElevenLabs cost per note vs
   Workers AI TTS (melotts, aura). Report price, quality and refusals per candidate; the owner picks. *Effort: high*
4. **Context and memory** (owner's questions 6-7): stable prompt prefix for provider caching (time and nudges after
   the history), then a structured "story state" in the memory notes. Measure tokens first. *Effort: medium*
5. **Curate LESSONS:** older gotchas into symptom → cause → fix. *Effort: low*
6. **Later (owner's plan):** ElevenLabs v4 instead of v3 (`isV3()`). *Effort: high*

## Open questions for the owner
- None. (Lingerie is step 3; providers are limited to Cloudflare and OpenRouter.)

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). <describe the next change>. Finish with /handoff.
