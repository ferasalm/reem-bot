# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-06 (eleventh session). **Deployed:** `main` = 59177d8 (run 37520213264). `dev` is ahead with
everything below, **not deployed**. To go back after a deploy: push 59177d8 to `main`.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid, $5/month).
- **Live (main):** v11 persona; DeepSeek V4 Flash (OpenRouter) text, memory, /auto, Nemo backup; Sulafat voice; Gemini 3.8
  Flash hearing; pictures on Cloudflare klein (`PICTURE.ROUTE` "cloudflare"), Nano Banana for lingerie; /look, /pic.
- **On `dev`, waiting for "Deploy"** (owner's plan: OpenRouter = DeepSeek, Sulafat, Gemini only; backups on Cloudflare;
  pictures on Runware):
  - Every picture on Runware klein 9B with her face (`PICTURE.ROUTE` "runware-klein", $0.50/day cap, then Cloudflare).
    Runware balance $19.07 (MCP, 2026-10-06).
  - Nano Banana off (`LINGERIE.ENABLED` false); Nemo removed. Backup text = DeepSeek on Workers AI
    (`@cf/deepseek-ai/deepseek-v4-flash-0731`) for replies, memory and /auto; voice backup aura-2, then ElevenLabs.
  - `RECALL`: long memory in Vectorize (`reem-memory`, made by tools/cf-resources.sh, run before every deploy);
    `RECALL.REPEAT_SCORE` 0.68: the same thing in other words is asked again.
  - `DAY`: real Watertown weather (Open-Meteo) and a new plan for her day (Workers AI) in her prompt.
  - `/album` (her pictures, 10 a page), `/spend` (today's money per account), Workers AI through AI Gateway "default".
- **Owner, 2026-10-06:** no tests on OpenRouter (credit low): replays on Workers AI (test.yml `model` `@cf/...`), benches on
  Workers AI or Runware. Sulafat stays (MiniMax dropped). /setup is a web page; no settings panel.
- Owner's preview page (private artifact): https://claude.ai/artifact/LWGGrnTjMRAiLCTTSZ3rmg

## Waiting on the owner
- **Deploy?** Everything above goes live together. After it: send /spend, /album, then chat normally (recall starts once
  ~40 messages have folded; the day's plan and weather appear from the second reply of the day).
- **OpenRouter credit is low:** her texts, voice and hearing still run on it; when it's out, the Cloudflare backups answer.
- Sex-act switch (`PICTURE.RUNWARE.SEX_ACTS`, off): tell Claude to turn it on, then try /pic.
- Still open: ElevenLabs backup voice "North Jersey"; delete old branches (Actions > Delete retired branches).

## Verified this session (2026-10-06, eleventh session)
- Sync report: only retired squash-merged branches and `face-candidates` hold their own commits (`git cherry`).
- `node tools/check.mjs` all 6 ok (new unit rows: @cf text, empty-answer retry, recall save, repeat check; e2e steps:
  recall in her prompt, /album, /spend + gateway, the day's weather and plan, aura voice backup).
- Workers AI replays read reply by reply: 37544031689 (21 broken: empty answers) → retry → 37545345952 (57 calls, 0 broken;
  went to him 2/3, knock 3/3, origin 3/3). See `docs/QUALITY.md`. bge-m3 scores set REPEAT_SCORE (recall-check).
- cf-resources run 37544392915: Vectorize index `reem-memory` created (1024 dims, metadata indexes chat and who).
- Not checked: the live Worker with these changes (not deployed); Open-Meteo and AI Gateway from the real Worker.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Deploy on the owner's word**, then read /health and /setup in the deploy log (Workers AI backup answered, Runware,
   gateway), and read back the live code. *Effort: low*
2. **After a day live:** /spend figures vs the providers' dashboards; the AI Gateway logs; recall lines in a real
   reply (her prompt shows THINGS FROM BEFORE). *Effort: low*
3. **Backup "habibti" slip:** on Workers AI she remarks on his "habibti" 3/3; check the prompt line on that model. *Effort: medium*
4. **Selfie framing:** the phone shows in plain selfies (1 of 6); framed by someone else (1 of 8). *Effort: medium*
5. **Text model** (owner's direction): bench cheaper or better models on Workers AI with `OWNER_CHAT`. *Effort: high*
6. **Old session branches:** list them in `tools/retired-branches.txt` once the owner agrees. *Effort: low*

## Open questions for the owner
- Raise Runware's daily picture cap ($0.50, ~600 pictures) or keep it?
- OK to retire the old session branches the sync report keeps listing?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). <Deploy | Here is what slipped live: ...>. Finish with /handoff.
