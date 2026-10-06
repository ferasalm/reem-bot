# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-06 (eleventh session). **Deployed:** `main` = `dev` (deploy runs 37547182886, 37548651259 and the
/setup-wording one after them). To go back to before this session: push 59177d8 to `main`.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid, $5/month). **Live now:**
- **Texts, memory notes, /auto:** DeepSeek V4 Flash on Workers AI (`@cf/deepseek-ai/deepseek-v4-flash-0731`), the same DeepSeek on
  OpenRouter (Novita...) as the backup. Her replies: reasoning "none" + empty-answer retries (last 2 "low"); tasks: "low".
- **Voice:** Sulafat (OpenRouter, the only OpenRouter main); backup aura-2 Andromeda (Workers AI), then ElevenLabs.
- **Hearing:** Whisper (Workers AI) first, Gemini 3.8 Flash (OpenRouter) when it fails, Scribe last (`HEARING.OR_FIRST` false).
- **Pictures:** Runware klein 9B with her face (`PICTURE.ROUTE` "runware-klein", $0.50/day, then Cloudflare klein); Nano Banana
  and Nemo removed. Seeing his photos: Workers AI (Llama 4 Scout). Runware balance $19.07 (2026-10-06).
- **New:** `RECALL` long memory (Vectorize `reem-memory`) + meaning-based repeat check (0.68); `DAY` real weather + daily plan;
  `/album`; `/spend`; text and vectors through AI Gateway "default" (pictures can't go through it).
- **Owner, 2026-10-06:** no tests on OpenRouter: replays on Workers AI (test.yml with an empty `model` now uses Workers AI),
  `cf-probe.yml` for quick model checks. Sulafat stays. /setup is a web page; no settings panel.
- Owner's preview page (private artifact): https://claude.ai/artifact/LWGGrnTjMRAiLCTTSZ3rmg

## Waiting on the owner
- **In Telegram:** chat as usual; try /spend and /album (empty until her next picture). Recall starts after ~40 more messages;
  the weather and her day's plan show from her second reply of the day.
- Sex-act switch (`PICTURE.RUNWARE.SEX_ACTS`, off): tell Claude to turn it on, then try /pic.
- Still open: ElevenLabs backup voice "North Jersey"; delete old branches (Actions > Delete retired branches).

## Verified this session (2026-10-06, eleventh session)
- `node tools/check.mjs` all 6 ok (rows for Workers AI text, empty-answer retries, task reasoning, recall, repeat check, lone *,
  /album, /spend, the day's plan, the aura voice backup, Whisper-first hearing, Cloudflare-first texts).
- Workers AI replays read reply by reply: 37545345952 (0 broken), 37548268082 (1: lone *) → fix → 37548447961 (0 broken, /auto 9/9).
- cf-probe runs: bare prompts empty on "none", fine on "low". recall-check: REPEAT_SCORE 0.68. Vectorize `reem-memory` made.
- Deploy 37548651259: /health drew and saw; /setup all ✅. Not checked yet: a real Telegram chat, Open-Meteo from the Worker.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Owner's live test**, then report slips (texts now come from Workers AI). *Effort: low*
2. **After a day live:** /spend vs the dashboards, AI Gateway logs, the day's plan in KV "day", recall in a real prompt. *Effort: low*
3. **Workers AI "habibti" slip:** she remarks on his "habibti" 2/2-3/3 on this model; try the prompt line without naming it. *Effort: medium*
4. **Selfie framing:** the phone shows in plain selfies (1 of 6); framed by someone else (1 of 8). *Effort: medium*
5. **Text model** (owner's direction): bench cheaper or better Workers AI models with `OWNER_CHAT`. *Effort: high*
6. **Old session branches:** list them in `tools/retired-branches.txt` once the owner agrees. *Effort: low*

## Open questions for the owner
- Raise Runware's daily picture cap ($0.50, ~600 pictures) or keep it?
- OK to retire the old session branches the sync report keeps listing?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). <Deploy | Here is what slipped live: ...>. Finish with /handoff.
