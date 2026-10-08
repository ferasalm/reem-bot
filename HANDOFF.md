# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-08 (sixteenth session: picture round 5, deployed). **Deployed:** `main` = 088c9be (deploy run 37845500501,
/setup all ✅, live code read back). Back to before this session: push 1176ec8 to `main`. `dev` = `main` + this handoff (docs only).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid, $5/month). **Live now:**
- **Texts, memory notes, /auto:** DeepSeek V4 Flash on Workers AI (`@cf/deepseek-ai/deepseek-v4-flash-0731`), the same DeepSeek on
  OpenRouter (Novita) as the backup. **Voice:** Sulafat (OpenRouter); backups aura-2 Andromeda, ElevenLabs. **Hearing:** Gemini 3.8
  Flash, then Whisper, then Scribe. **Seeing his photos:** Llama 4 Scout. `RECALL`, `DAY`, `/album`, `/spend` unchanged.
- **Pictures:** Runware klein 9B, her face 2x + body + place, 5 steps, CFG 1, acceleration none, short prompts, an expression + gaze.
  `DAILY_USD` $1, then Cloudflare klein (never nude). Runware balance $16.74.
  | When | LoRAs (weight) |
  |---|---|
  | every picture | phone2025 0.6, UltraReal V5 0.6, InstaPic 0.6 |
  | nude or sex act | + Unchained XXX 0.8 |
  | riding, cowgirl, reverse cowgirl, doggy | + Flux 4 Play 0.8 (its triggers c0wg1rl, r3v3rs3_c0wg1rl, d0gg13) |
  | missionary / anal | + Missionary POV 0.8 / POV Doggy Anal 0.8 |
  | blowjob, deepthroat | + Holding Deepthroat POV 0.8, at 1:1 (1344x1344), eyes-only expression |
  | penis / pussy named, no act LoRA | + General Penis 0.6 / PussyDiffusion 0.8 |
  Out this session: Anatomy Fixer, POV hand (no visible effect; the words draw his hands). Size: 1008x1792 (9:16), oral 1:1.
  Price: clothed $0.0034, nude $0.0042, sex acts $0.0034 (was $0.0042), rarely $0.0049-0.0059 (cold loads); the $1 cap ≈ 250-290.
- **/look in a sex scene** now shows the act from his eyes: `SEX_CUES` read her own words ("wraps her lips around you", "pulls you
  down on top of her"), keep her sentences about him, draw her naked (not the scene's cardigan). Anal is drawn on her back.

## Waiting on the owner
- **POV Doggy Anal:** from behind, every anal picture drew a vulva for her anus (0/14, with or without it, Flux 4 Play too). On her back
  it's right 3/3 with or without it. Keep it, drop it, or look for a dedicated anal LoRA on Civitai (Claude: a 2-seed bench first).
- **Everything else still 9:16?** 1:1 beat 9:16 on sex acts (round 4: 7/7 vs 5/7) and blowjobs (this round). Your 2026-10-04 rule stays
  for all but oral pictures until you say.
- **InstaPic:** kept (you asked for it everywhere): real skin and it followed the asked gaze; it adds faint freckles her new face
  doesn't have and once drew a second glans on a blowjob. Your call.
- Still open: ElevenLabs backup voice "North Jersey"; delete old branches (Actions > Delete retired branches).

## Verified this session (2026-10-08, sixteenth session)
- `node tools/check.mjs` all 6 ok (new rows: trigger words first, base LoRAs without Anatomy Fixer, no POV hand, oral 1:1 + MOODS.ORAL,
  SEX_CUES on everyday vs act lines, /look missionary and blowjob from her words, other acts 9:16, anal on her back).
- 117 pictures on Runware ($0.57), every sheet read; final 6/6 through the real code. Deploy green, /setup ✅. Not checked: Telegram.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Your Telegram test:** /pic and /look in a few sex scenes (missionary, blowjob, riding, anal); report any miss. *Effort: low*
2. **Your picks above** (POV Doggy Anal, 9:16 vs 1:1 for the rest, InstaPic). *Effort: low*
3. **SEX_CUES from real chats:** add a scenario row for every /look miss he reports; widen the cue list. *Effort: medium*
4. **Wardrobe, poses:** widen `WARDROBE`, `SHOTS` in the short-prompt style. *Effort: medium*
5. **After a day live:** /spend vs the dashboards, AI Gateway logs, recall in a real prompt. *Effort: low*
6. **Workers AI "habibti" slip:** try the prompt line without naming it. *Effort: medium*
7. **Text model** (owner's direction): bench cheaper or better Workers AI models with `OWNER_CHAT`. *Effort: high*
8. **Old session branches:** list them in `tools/retired-branches.txt` once the owner agrees. *Effort: low*

## Open questions for the owner
- Keep the gray tank + leggings body for clothed pictures, or a new clothed body picture (Nano Banana)?
- OK to retire the old session branches the sync report keeps listing?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). My Telegram test: <...>. My picks: POV Doggy Anal <...>, 9:16 or 1:1 <...>, InstaPic <...>. Then HANDOFF next step 3.
