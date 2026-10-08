# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-08 (twelfth session). **Deployed:** `main` = the eleventh session's work (deploy runs 37547182886,
37548651259). **On `dev`, not deployed:** Civitai LoRAs on Runware klein 9B (below). To go back on `main`: push 59177d8.

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
- **On `dev` only (2026-10-08):** her klein 9B pictures with two Civitai LoRAs (`PICTURE.RUNWARE.LORAS`: Phone Photography
  `ferasalm:phone2025@1` + UltraReal V5 Pro `ferasalm:ultrareal5@1`, 0.6 each, phone's trigger words before her description).
  Real HD 2k is on Runware too (`ferasalm:realhd2kc@1`, converted from a DoRA) but not switched on. Pictures cost $0.0017 (was $0.0008).
- Owner's preview page (private artifact): https://claude.ai/artifact/LWGGrnTjMRAiLCTTSZ3rmg

## Waiting on the owner
- **LoRAs:** look at the comparison sheets in chat; say "deploy" to try Phone+UltraReal in Telegram, or pick another set
  (Real HD alone, all three, other weights).
- **In Telegram:** chat as usual; try /spend and /album (empty until her next picture). Recall starts after ~40 more messages;
  the weather and her day's plan show from her second reply of the day.
- Sex-act switch (`PICTURE.RUNWARE.SEX_ACTS`, off): tell Claude to turn it on, then try /pic.
- Still open: ElevenLabs backup voice "North Jersey"; delete old branches (Actions > Delete retired branches).

## Verified this session (2026-10-08, twelfth session)
- `node tools/check.mjs` all 6 ok (new unit row: LoRAs go with klein 9B only). All 24 bench pictures opened (runs 37720473185,
  37722968583): face, body, clothes and scene kept with every LoRA set; differences small (docs/CHANGELOG.md).
- The prompt with LoRAs on, built by the bot's own code: "...she took herself: This is a candid photograph taken with a smartphone
  of the woman from image 0, ..." with both LoRAs in the Runware task.
- Not checked: a real Telegram picture with LoRAs (not deployed).

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **LoRAs:** the owner picks a set (or "deploy" for Phone+UltraReal), then deploy and check /pic in Telegram. *Effort: low*
2. **Owner's live test**, then report slips (texts now come from Workers AI). *Effort: low*
3. **After a day live:** /spend vs the dashboards, AI Gateway logs, the day's plan in KV "day", recall in a real prompt. *Effort: low*
4. **Workers AI "habibti" slip:** she remarks on his "habibti" 2/2-3/3 on this model; try the prompt line without naming it. *Effort: medium*
5. **Selfie framing:** the phone shows in plain selfies (1 of 6); framed by someone else (1 of 8). *Effort: medium*
6. **Text model** (owner's direction): bench cheaper or better Workers AI models with `OWNER_CHAT`. *Effort: high*
7. **Old session branches:** list them in `tools/retired-branches.txt` once the owner agrees. *Effort: low*

## Open questions for the owner
- Raise Runware's daily picture cap ($0.50, ~600 pictures) or keep it?
- OK to retire the old session branches the sync report keeps listing?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). <Deploy | Here is what slipped live: ...>. Finish with /handoff.
