# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-08 (nineteenth session: deployed picture rounds 6-8 to `main`). **Deployed:** `main` = 9803e28 (rounds 6, 7 + 8).
Round 5 is `088c9be`: to go back, push it to `main`. New `dev` work goes live when the owner says "deploy" (`git push origin origin/dev:main`).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid, $5/month). **Live (`main`):** texts, memory and
/auto on DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat (aura-2, then ElevenLabs); hearing Gemini 3.8 Flash (Whisper,
then Scribe); pictures Runware klein 9B with her face (`runware:400@2`, TwinFlow when it fails; `DAILY_USD` $1, then Cloudflare klein;
nudity and sex acts on).
**Pictures, rounds 6-8, now live** (detail: `docs/CHANGELOG.md`, the 2026-10-08 entries):
- **Cheaper sizes:** 9:16 768x1344; blowjobs 1:1 or 16:9; other sex acts 9:16 / 1:1 / 16:9. About $0.0025-0.0034 a picture.
- **Three picture kinds:** clothed, nude, sex act, each with its own body picture from one set ("v3": pale warm ivory skin, fuller arms);
  from behind for doggy, anal and reverse cowgirl.
- **Penis:** General Penis on missionary and doggy; PussyDiffusion on nude pictures only; riding with neither.
- **Partial nudity:** clothes named in a nude or sex picture stay on.
- **/look:** DeepSeek (Workers AI) writes the picture from the last 8 messages and his words, with her or without her.
- **Variety:** flash on request; hairstyles, light, poses, outfits. `docs/OPTIONS.md` lists every command, word, act and LoRA
  (when, weight, trigger, cost).

## Waiting on the owner
- **Your Telegram test** (next step 1). The Runware pictures of rounds 6-8 are not yet checked live.
- **Her tongue out** on riding/doggy (Flux 4 Play draws it): keep, lower its weight, or another LoRA.
- Still open: InstaPic everywhere, ElevenLabs "North Jersey", old session branches (see Open questions).

## Verified this session (2026-10-08, nineteenth session)
- Deploy run 37860789952 (Deploy to Cloudflare, push to `main` at 9803e28): job `deploy` success, every step success. Read in the job
  log: Deploy Worker uploaded `reem-bot`, version a8330967-fdd5-40db-b84e-bacb68b15187.
- `/health`: ok. Cloudflare klein drew 52,713 bytes in 27.5 s; the vision model described it. This checks Cloudflare, not the Runware route.
- `/setup`: all ✅ (Telegram connected; DeepSeek on Workers AI and the OpenRouter backup answered; Sulafat test clip made; Gemini heard it
  as "Hey you. I was hoping you'd text."; ElevenLabs key works; face built in; memory and queue connected). Runware about $0.17 of $1.00 today.
- One failure before this deploy: Runware "200: no picture" at 13:26 UTC today (round 5 code). Not seen since; watch for repeats.
- Not checked live: Runware pictures of rounds 6-8, /look's DeepSeek call, Telegram replies. The full code read-back was skipped: the
  Cloudflare tool returns the whole ~5 MB bundle.
- `node tools/check.mjs`: all 6 ok on 9803e28, before the deploy; again after the docs (see the commit).
- Sync report: OK after `git fetch --unshallow origin`. The warning at session start came from the shallow clone.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Your Telegram test** with `docs/OPTIONS.md`: /look with and without words (with her, apart, in a sex scene), /pic clothed full body,
   doggy, a bra kept on during sex; report misses. *Effort: low*
2. **/look's DeepSeek answers:** read a few in the Worker log after real /look calls and tune `PICTURE.LOOK.PROMPT`. *Effort: medium*
3. **Missionary/riding penetration** shown more often (wording or LoRA weight bench, zoom crops). *Effort: medium*
4. **Flux 4 Play tongue:** bench its weight 0.5-0.8. *Effort: medium*
5. **After a day live:** /spend vs the dashboards (Runware, Workers AI, OpenRouter). *Effort: low*
6. **Text model** (owner's direction): bench cheaper or better Workers AI models with `OWNER_CHAT`. *Effort: high*
7. **Old session branches:** `tools/retired-branches.txt` lists them; the owner presses Actions > Delete retired branches when he agrees.
   *Effort: low*

## Open questions for the owner
- Her tongue on riding/doggy: keep it, lower the Flux 4 Play weight, or use another LoRA?
- OK to press Actions > Delete retired branches for the list in `tools/retired-branches.txt`? The sync check says no work is missing from `dev`.
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? Today it printed 25 false "commits not here"
  warnings from the shallow clone (`.claude/settings.json`).

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). My Telegram test: <...>. Tongue on riding/doggy: <keep / lower / other LoRA>. Then HANDOFF next step 2.
