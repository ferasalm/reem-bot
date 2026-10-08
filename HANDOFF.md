# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-08 (thirteenth session). **Deployed:** `main` = 206de7d (deploy run 37726965611, /setup all ✅, live code
read back: three LoRAs). Back to two LoRAs: push 375f490 to `main`; back to no LoRAs: push d95fd55.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid, $5/month). **Live now:**
- **Texts, memory notes, /auto:** DeepSeek V4 Flash on Workers AI (`@cf/deepseek-ai/deepseek-v4-flash-0731`), the same DeepSeek on
  OpenRouter (Novita...) as the backup. Her replies: reasoning "none" + empty-answer retries (last 2 "low"); tasks: "low".
- **Voice:** Sulafat (OpenRouter); backup aura-2 Andromeda (Workers AI), then ElevenLabs. OpenRouter mains: Sulafat and Gemini.
- **Hearing:** Gemini 3.8 Flash (OpenRouter) first, Whisper (Workers AI) when it fails, Scribe last (`HEARING.OR_FIRST` true).
- **Pictures:** Runware klein 9B with her face (`PICTURE.ROUTE` "runware-klein", $0.50/day, then Cloudflare klein); Nano Banana
  and Nemo removed. Seeing his photos: Workers AI (Llama 4 Scout). Runware balance about $18.40 (2026-10-08).
- **New:** `RECALL` long memory (Vectorize `reem-memory`) + meaning-based repeat check (0.68); `DAY` real weather + daily plan;
  `/album`; `/spend`; text and vectors through AI Gateway "default" (pictures can't go through it).
- **Owner, 2026-10-06:** no tests on OpenRouter: replays on Workers AI (test.yml with an empty `model` now uses Workers AI),
  `cf-probe.yml` for quick model checks. Sulafat stays. /setup is a web page; no settings panel.
- **LoRAs (live 2026-10-08):** her klein 9B pictures with three Civitai LoRAs (`PICTURE.RUNWARE.LORAS`: Phone Photography
  `ferasalm:phone2025@1` + UltraReal V5 Pro `ferasalm:ultrareal5@1`, 0.6 each, phone's trigger words before her description).
  + Real HD 2k (`ferasalm:realhd2kc@1`, converted from a DoRA) at 0.5. Pictures cost about $0.0017 (was $0.0008).
- **On `dev`, not deployed (ee2decb):** SNOFS on nude pictures only (`PICTURE.RUNWARE.NUDE_LORAS` `ferasalm:snofsc@1` 0.8, a
  rank-128 LoRA copy of the LoKR; Runware can't load the LoKR or draw with its merged checkpoints). Same price: any 1-4 LoRAs $0.00169.
- Owner's preview page (private artifact): https://claude.ai/artifact/LWGGrnTjMRAiLCTTSZ3rmg

## Waiting on the owner
- **Deploy SNOFS:** say "deploy" (this session's safety check refused the push to `main`); then /pic a nude in Telegram.
- **One LoRA off?** Turning one off saves nothing (Runware's LoRA price is flat, $0.00169 for 1-4; $0.00078 with none). Claude's pick on
  quality: Real HD 2K (the converted DoRA, smallest effect; leaving it out kept every bench picture as good or better).
- **In Telegram:** chat as usual; try /spend and /album. Recall starts after ~40 more messages; weather and the day's plan from her second reply.
- Sex-act switch (`PICTURE.RUNWARE.SEX_ACTS`, off): on = SNOFS on those pictures too.
- Still open: ElevenLabs backup voice "North Jersey"; delete old branches (Actions > Delete retired branches).

## Verified this session (2026-10-08, thirteenth session)
- `node tools/check.mjs` all 6 ok (new unit rows: NUDE_LORAS on nude and, with SEX_ACTS on, sex-act pictures only; TwinFlow none).
- `ferasalm:snofsc@1` drew on Runware (run 37788419189). Bench 37789786856: 28/28 drawn and opened at full size (docs/CHANGELOG.md):
  SNOFS gave more natural nude bodies and poses closer to the words; clothed unchanged; minus-one sets: small differences.
- Cost by direct calls: 0 LoRAs $0.00078, 1 or 4 LoRAs $0.00169. Not checked: a real Telegram picture with SNOFS (not deployed).

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Deploy SNOFS** when the owner says so: `git push origin origin/dev:main`, read the deploy log (/setup), read the live code back. *Effort: low*
2. **Turn off one LoRA** if the owner agrees (Claude's pick: Real HD 2K); for a real saving: no LoRAs on clothed pictures ($0.00078). *Effort: low*
3. **Owner's live test**, then report slips. *Effort: low*
4. **After a day live:** /spend vs the dashboards, AI Gateway logs, the day's plan in KV "day", recall in a real prompt. *Effort: low*
5. **Workers AI "habibti" slip:** she remarks on his "habibti" 2/2-3/3 on this model; try the prompt line without naming it. *Effort: medium*
6. **Selfie framing:** the phone shows in plain selfies (1 of 6; the live LoRA set drew one in the bench too). *Effort: medium*
7. **Text model** (owner's direction): bench cheaper or better Workers AI models with `OWNER_CHAT`. *Effort: high*
8. **Old session branches:** list them in `tools/retired-branches.txt` once the owner agrees. *Effort: low*

## Open questions for the owner
- Deploy SNOFS now? Turn off Real HD 2K (no saving, quality only), or no LoRAs on clothed pictures (halves their price)?
- Raise Runware's daily picture cap ($0.50, ~300 pictures at $0.0017) or keep it?
- OK to retire the old session branches the sync report keeps listing?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). <Deploy | Here is what slipped live: ...>. Finish with /handoff.
