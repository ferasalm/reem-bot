# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-04 (aura-2 voice switch + Whisper hearing on `dev`; Nano Banana 2 Lite bench; nothing deployed)

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid since 2026-10-03, $5/month).
- **Live (`main`, deployed 2026-10-03 22:24 UTC):** v10 on DeepSeek V4 Flash; Lebanese Reem in Belmont, MA; fixed
  places with night pictures; pictures 768x1024 on klein; daily AI cap 28,000 neurons; voice and hearing on ElevenLabs.
- **On `dev`, not deployed** (owner 2026-10-04: "Eleven labs credits are running out, we gotta do the switch"):
  - **Her voice on Workers AI aura-2** (`VOICE.PROVIDER` "aura", `AURA_SPEAKER` "helena" until the owner picks):
    OGG/Opus straight to Telegram, counted in the day's AI ledger (~410 neurons, $0.0045, for a 150-character note).
    ElevenLabs speaks only when aura fails or the budget is spent (`ELEVENLABS_BACKUP`); with no backup, a text.
    Audio tags become spoken cues (`AURA_CUES`: laughs dropped, chuckles "hm"); /setup tests the aura voice.
  - **His voice notes heard by Whisper large v3 turbo** (ElevenLabs Scribe as backup), from earlier today.
  - Benches only: `tools/voice/` (aura-2 + Whisper), Nano Banana routes in `tools/face/bench-models.mjs`.

## Owner's direction (DECISIONS 2026-10-03/04)
- Providers: **Cloudflare Workers AI and OpenRouter only**; keep proposing cheap, good models for text, pictures, voice.
- Voice and hearing move off ElevenLabs (credits running out); ElevenLabs stays only as a backup.
- Lingerie: Cloudflare's filter not accepted as final. Her face for lingerie dropped for now.

## Bench results this session (`docs/QUALITY.md`)
- **Nano Banana 2 Lite, text only: 7/7, $0.034**, realistic, every outfit as asked, but a different woman each time;
  slips: two phones in one mirror shot, two slimmer than asked, a semi-sheer white bra. With her face: 0/4.
- Nano Banana text-only (earlier): 7/7, $0.039, the same-looking woman each time. Recraft V4.1 Flash: 7/7, $0.007.
- **Voice run 2** (helena vs andromeda, 5 intimate lines + laughs written 7 ways): Whisper heard every line right;
  "heh" not a reliable laugh, "hehe" shouted, "mm"/"hm" fine. 4 files sent to the owner.

## Waiting on the owner
- **Pick the voice: helena or andromeda** (files sent). Also: do any laugh spellings sound right to you?
- **Pick the lingerie route:** Nano Banana ($0.039, same woman each time), Nano Banana 2 Lite ($0.034, varies), or
  Recraft V4.1 Flash ($0.007). My recommendation: Nano Banana (the consistency matters more than $0.005).
- **Voice budget:** voice notes now share the 28,000-neuron day with pictures (up to 80% of it). About 13 notes
  a day fit after a full picture day. Raise `AI_BUDGET.DAILY_NEURONS` (each +10,000 ≈ $0.11/day max)? Your call.
- **Deploy** the voice + hearing switch (say "Deploy"); then send her a voice note and ask for one.
- **Open `/setup` once** after the deploy; **delete the old branches** (Actions > Delete retired branches).

## Verified this session (2026-10-04)
- `node tools/check.mjs` all 6 ok; e2e: aura used with cues and counted, aura fails → ElevenLabs, budget spent →
  ElevenLabs, no backup → text.
- Every Nano Banana 2 Lite picture read at full size (7); every voice transcript read (24).

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **After the owner picks the voice:** set `AURA_SPEAKER`, deploy on "Deploy", read the live Worker back, check
   /setup and one real voice note each way. *Effort: low*
2. **Build the lingerie route the owner picks** (OpenRouter call from the Worker for lingerie shots only, its own
   daily money cap, klein fallback on refusal; prompt says one phone). *Effort: medium*
3. **Persona prompt for aura:** tell her voice notes use "mm"/"hm" instead of [laughs] when aura speaks. *Effort: low*
4. **Selfie quality with the FLUX skill's rules:** third-person framing, age/body drift, outfit copied from the
   reference, a second Basbousa, windows light at night. Small face run, every picture read. *Effort: medium*
5. **Text model** (owner's direction): DeepSeek V4 Flash vs others, cost per reply and quality. *Effort: high*
6. **Persona slips seen live:** "your cat"/"barbara", "him/his" for "you", "tonight" in the afternoon. *Effort: medium*
7. **Context and memory:** stable prompt prefix for caching, then a "story state" in the notes. *Effort: medium*

## Open questions for the owner
- Time-awareness, a daily plan, explicitness, natural-looking pictures (asked 2026-10-03): which proposal to do.

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). <describe the next change>. Finish with /handoff.
