# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-06 (eleventh session). **Deployed:** `main` = `dev` = 59177d8 (run 37520213264): "come over" and the
habibi fix are live. To go back to the version before: push 90e5c44 to `main`.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid since 2026-10-03, $5/month).
- **Live:** v11 persona (Reem Nabot, Armenian-Lebanese bookkeeper, Watertown triple-decker); DeepSeek V4 Flash text, memory and
  /auto (Nemo the backup); Sulafat voice; Gemini 3.8 Flash hearing; `/look`; `/pic`; daily AI cap 50,000 neurons; picture
  versions (`PICTURE.ROUTE`, default "cloudflare"; Runware versions draw nudity; `PICTURE.RUNWARE.SEX_ACTS` default off).
- **Built and deployed this session** (owner picked "Mostly go", then "Deploy"):
  - While apart, when he asks her over ("come over", "waiting for you to knock"; not "can I come over"), 3 in 4 replies
    (`TEXTING.VISIT_CHANCE` 0.75) are the scene of her crossing to his door; if she texts instead she's asked once more.
    Live: she went to him 8/10 (was 3/9 to 5/10).
  - The prompt's habibi rule no longer names "habibti": she "corrected" him for calling her habibti 4/5, now 1/5.
  - The deploy now opens the /setup web page itself and prints it in the deploy log (command menu, which models answer).
- **Owner, 2026-10-06:** /setup is not a Telegram command (it's a web page; the deploy handles it now); the settings panel is
  dropped: don't publish it or point him to it. He says changes in chat; Claude makes them in code.
- **Test tools:** `OWNER_CHAT` in `tools/test/live.mjs` replays his chat; Actions > Tests > Run workflow (`runs`, `only`, `model`).
- Owner's preview page (private artifact): https://claude.ai/artifact/LWGGrnTjMRAiLCTTSZ3rmg

## Waiting on the owner
- **In Telegram now:** `/rewind` past the short Nemo replies, or `/restart` (old short replies pull her back to that
  style). Then try "come over".
- **Deploy?** `dev` has `PICTURE.ROUTE` "runware-klein" (every picture on klein 9B with her face, nudity allowed, $0.50/day
  cap, then Cloudflare). Not live until he says "Deploy". Check the Runware balance covers it (~$0.0008 a picture).
- **Voice to judge:** 9 clips sent (TTS bench 37541102035): MiniMax Turbo (OpenRouter, $0.06/1k) and HD (Runware, $0.10/1k),
  Arabic_CalmWoman, Arabic words in Arabic script, vs Sulafat (~$0.015/1k, live). Does ح come through? Which voice, if any?
  If MiniMax: the Worker must turn her Arabizi (habibi, yalla) into Arabic script before speaking.
- Sex-act switch: to try it, Runware klein as the picture version plus the switch on (tell Claude; no panel), then /pic.
- Nano Banana's money cap $0.50 a day (`LINGERIE.DAILY_USD`): raise it?
- Still open: ElevenLabs backup voice "North Jersey"; delete old branches (Actions > Delete retired branches);
  Lunaris via DeepInfra; cost estimate questions from 2026-10-04.

## Verified this session (2026-10-06, tenth session)
- Sync report: after `git fetch --unshallow`, every listed branch is contained in `dev` (`git cherry`); only the retired
  squash-merged ones and `face-candidates` have their own commits.
- `node tools/check.mjs` all 6 ok (unit rows for `asksHerOver`/visit mode, an e2e step for the retry, 2 scenario rows).
- Live runs read reply by reply: 37517733148 (visit scenes 6/8, habibti 4/5) → fixes → 37518157279 (8/8, went to him 8/10,
  habibti 1/5, 0 broken). See `docs/QUALITY.md`.
- Deploy run 37520213264 green: /health drew and saw; the new /setup step printed all ✅ (DeepSeek answered via Novita, no Nemo
  override); live code read back (`VISIT_CHANCE: 0.75`, `asksHerOver`, the habibi line). Not checked: the live chat.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Owner's live test** (list above), then report slips. *Effort: low*
2. **MiniMax voice (owner's ear):** if he picks a MiniMax voice, add it as a voice provider behind Sulafat or in its place
   (`VOICE.PROVIDER`, Runware `audioInference`), then a test clip on /setup. *Effort: medium*
3. **Selfie framing:** the phone shows in plain selfies (1 of 6); framed by someone else (1 of 8). *Effort: medium*
4. **Text model** (owner's direction): bench cheaper or better models on `OWNER_CHAT` with the `model` input before any
   switch. *Effort: high*
5. **Context and memory:** stable prompt prefix for caching, then a "story state" in the notes. *Effort: medium*
6. **Old session branches:** all contained in `dev`; list them in `tools/retired-branches.txt` once the owner agrees. *Effort: low*

## Open questions for the owner
- Raise Nano Banana's daily money cap above $0.50?
- Time-awareness, a daily plan, explicitness, natural-looking pictures (asked 2026-10-03): which proposal to do.
- OK to retire the old session branches the sync report keeps listing?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). <Here is what slipped in my live test: ... | next step 2>. Finish with /handoff.
