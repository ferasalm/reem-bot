# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-04 (Whisper hearing on `dev`, Nano Banana + aura-2 tests; nothing deployed)

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid since 2026-10-03, $5/month).
- **Live (`main`, deployed 2026-10-03 22:24 UTC):** v10 on DeepSeek V4 Flash; Lebanese Reem in Belmont, MA (clock
  America/New_York); Basbousa "she"; fixed places with night pictures (`isDark`); pictures 768x1024 on klein; daily
  AI cap 28,000 neurons; voice and hearing on ElevenLabs.
- **On `dev`, not deployed:**
  - **Hearing on Workers AI** (owner 2026-10-04: "Go with your pick for speech recognition"): his voice notes go to
    Whisper large v3 turbo (~47 neurons a minute, $0.0005), counted in the day's AI ledger; ElevenLabs Scribe takes
    over when Whisper fails or the budget is spent. Hint words "Reem, Basbousa, habibi, yaani". Loses Scribe's
    "(laughs)" tags. e2e checks all three paths; Whisper read Telegram's OGG/Opus 32/32 in the voice bench.
  - Benches only (no bot change): `tools/voice/` (aura-2 + Whisper), Nano Banana routes in `tools/face/bench-models.mjs`.

## Owner's direction (DECISIONS 2026-10-03/04)
- Providers: **Cloudflare Workers AI and OpenRouter only**; keep proposing cheap, good models for text, pictures, voice.
- Lingerie: Cloudflare's filter not accepted as final. Her face for lingerie dropped for now (2026-10-04).
- Voice stays ElevenLabs until the owner picks; aura-2-en is a test.

## Bench results this session (`docs/QUALITY.md`)
- **Nano Banana with her face attached: 0/11** (Google: IMAGE_PROHIBITED_CONTENT). **Text only: 7/7, $0.039**, the most
  realistic set so far, curvy as described, same-looking woman each time (not Reem). Nano Banana 2 text-only $0.068,
  tamed one outfit (jeans). Cloudflare's copy needs AI Gateway credits (402).
- Earlier the same day: Recraft V4.1 Flash text-only 7/7 at $0.007; Seedream 4.5 5/9 with her face at $0.04.
- **aura-2-en:** 4 voices sent to the owner (helena, andromeda, delia, vesta; expressive cues "haha", "mm" performed,
  a sigh is silent). $0.03 per 1,000 characters (~$0.005 a voice note). American voices only.

## Waiting on the owner
- **Pick the lingerie route:** Nano Banana text-only ($0.039, best look) vs Recraft V4.1 Flash ($0.007); klein stays
  for everything else. My recommendation: Nano Banana.
- **Listen to the aura-2 samples** and say: keep ElevenLabs, or which voice (my pick: helena, warm and a bit raspy).
- **Deploy Whisper hearing?** (say "Deploy"); then send her a voice note to check.
- **Open `/setup` once** after the last deploy; **delete the old branches** (Actions > Delete retired branches).

## Verified this session (2026-10-04)
- `node tools/check.mjs` all 6 ok (e2e: Whisper used, Scribe on Whisper failure, Scribe when the budget is spent).
- Every Nano Banana picture read at full size (11); every voice transcript read (32).

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Build the lingerie route the owner picks** (OpenRouter call from the Worker for lingerie shots only, its own
   daily money cap, klein fallback on refusal). *Effort: medium*
2. **If the owner picks an aura-2 voice:** a `VOICE.PROVIDER` switch (aura-2 OGG/Opus straight to sendVoice), tags
   turned into spoken cues ([laughs] → "haha", [sighs] dropped), ElevenLabs as the backup. *Effort: medium*
3. **Selfie quality with the FLUX skill's rules:** third-person framing, age/body drift, outfit copied from the
   reference, a second Basbousa, windows light at night. Small face run, every picture read. *Effort: medium*
4. **Text model** (owner's direction): DeepSeek V4 Flash vs others, cost per reply and quality. *Effort: high*
5. **Persona slips seen live:** "your cat"/"barbara", "him/his" for "you", "tonight" in the afternoon. *Effort: medium*
6. **Context and memory:** stable prompt prefix for caching, then a "story state" in the notes. *Effort: medium*

## Open questions for the owner
- Time-awareness, a daily plan, explicitness, natural-looking pictures (asked 2026-10-03): which proposal to do.

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). <describe the next change>. Finish with /handoff.
