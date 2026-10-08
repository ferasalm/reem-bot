# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-08 (seventeenth session: picture round 6, on `dev`). **Deployed:** `main` = 088c9be (round 5, unchanged).
`dev` = round 6 (not deployed). To deploy: the owner says "deploy" (`git push origin origin/dev:main`).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid, $5/month). **Live (`main`):** texts, memory,
/auto on DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat; hearing Gemini 3.8 Flash; pictures Runware klein 9B
(LoRA table of round 5 in `docs/CHANGELOG.md`; `DAILY_USD` $1, then Cloudflare klein, never nude). Runware balance ≈ $16.5.
**On `dev`, not deployed (round 6):**
- **Anatomy** (owner: "don't confuse which is anal and which is normal vaginal"): Unchained XXX off riding, missionary and anal
  (`NUDE_LORAS_OFF_WITH`: with it the penis went in below an open, empty vulva 0/8); vaginal acts say "inside her vagina"; anal is
  drawn from behind with POV Doggy Anal **alone at 1.0** (`ALONE_LORAS`, your test 1: right 6/6 on zoom; with the other LoRAs a vulva
  was drawn where her anus is 4/5). Nude pictures and blowjobs keep Unchained.
- **Flash on request** ("with flash", "camera flash", ...): Tushy Raw Filter (`ferasalm:tushyraw@1`) alone at 1.0 in place of the realism
  LoRAs, its trigger words, flash light, no room picture (the room's lamp light beat the flash).
- **Variety:** 12 hairstyles (half of Runware pictures; color and bangs stay), golden hour / blue hour / candlelight / overcast light,
  7 new poses (belly-down, overhead in bed, floor-sit, counter-sit, window-lean, stretch-mirror, kneel-mirror), 23 new outfits.

## Your tests (reported, not committed)
| Test | Result |
|---|---|
| Lower resolution cheaper? | Yes: 576x1024 $0.0017, 768x1344 $0.0025, 1008x1792 / 1792x1008 $0.0034 (more LoRAs or a cold load +$0.0008) |
| 16:9 blowjob/deepthroat | 3/3 in her mouth, natural length, her face kept. As good as 1:1 (round 5) |
| 16:9 other pictures | Clothed sofa: two of her side by side (1/1). Riding/missionary wrong, but that was Unchained, not the size |
| Holding Deepthroat alone at 1.0 | In her mouth 2/2, but her face drifted (older, a tear streak); mixed with the others her face holds |
| InstaPic out on nude/sex, the other two 0.6 → 0.9 | No visible change on the same seeds (nude 1/1, riding 1/1) |
| POV Doggy Anal alone at 1.0 | From behind 6/6 right → built in (see Anatomy). On her back: a fused, impossible pose 2/2 |
"16:19" read as 16:9. /look stays 1:1 for oral pictures as now; the random 9:16 / 16:9 mix isn't built (it drew her twice).

## Waiting on the owner
- **Deploy round 6?** Anatomy fix, flash, variety (all on `dev`).
- **16:9 for blowjobs/deepthroats** instead of 1:1, and the 9:16/16:9 mix for the rest (Claude: blowjobs fine either way; the mix
  needs a "one woman" guard first).
- **Her tongue out** on riding/doggy/reverse cowgirl: Flux 4 Play draws it whatever the words. Keep, lower its weight, or look for another.
- Still open: InstaPic everywhere (no visible change now either), ElevenLabs "North Jersey", old branches.

## Verified this session (2026-10-08, seventeenth session)
- `node tools/check.mjs` all 6 ok (new rows: flash LoRAs/trigger/photo, /pic flash light, light words, hairstyle, NUDE_LORAS_OFF_WITH,
  ALONE_LORAS anal from behind, new mirror shots). 56 pictures on Runware ($0.19), every one read, genitals cropped at full size.
- Not checked: Telegram, a deploy.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Your picks above**, then deploy if you want round 6 live. *Effort: low*
2. **Your Telegram test:** /pic with "with flash", a few hairstyles and lights, riding/missionary/anal/doggy; report misses. *Effort: low*
3. **Missionary 4/5:** one more wording or LoRA weight bench (zoom crops). *Effort: medium*
4. **Flux 4 Play tongue:** bench its weight 0.5-0.8 vs the tongue and the pose. *Effort: medium*
5. **SEX_CUES from real chats:** a scenario row for every /look miss he reports. *Effort: medium*
6. **After a day live:** /spend vs the dashboards, recall in a real prompt. *Effort: low*
7. **Text model** (owner's direction): bench cheaper or better Workers AI models with `OWNER_CHAT`. *Effort: high*
8. **Old session branches:** list them in `tools/retired-branches.txt` once the owner agrees. *Effort: low*

## Open questions for the owner
- Keep the gray tank + leggings body for clothed pictures, or a new clothed body picture?
- OK to retire the old session branches the sync report keeps listing?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). Deploy round 6: <yes/no>. Blowjobs 16:9 or 1:1 <...>. Flux 4 Play tongue <...>. My Telegram test: <...>. Then HANDOFF next step 3.
