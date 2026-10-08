# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-08 (fifteenth session: picture quality round 4 on `dev`). **Deployed:** `main` = 1176ec8 (deploy run 37799616836, /setup all ✅, $1.00 cap,
face "built in"). Back to before this session: push afbd4fd to `main`.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid, $5/month). **Live now:**
- **Texts, memory notes, /auto:** DeepSeek V4 Flash on Workers AI (`@cf/deepseek-ai/deepseek-v4-flash-0731`), the same DeepSeek on
  OpenRouter (Novita...) as the backup. Her replies: reasoning "none" + empty-answer retries (last 2 "low"); tasks: "low".
- **Voice:** Sulafat (OpenRouter); backup aura-2 Andromeda (Workers AI), then ElevenLabs. **Hearing:** Gemini 3.8 Flash, then Whisper, then Scribe.
- **Pictures (live):** Runware klein 9B with her face + 3 LoRAs (phone2025, ultrareal5 0.6, realhd2kc 0.5), SNOFS 0.8 on nude and
  sex-act pictures; `RUNWARE.DAILY_USD` $1 (then Cloudflare klein, never nude). Seeing his photos: Llama 4 Scout. Runware ~$18.20.
- **On `dev`, not deployed: round 3 + round 4** (`runwareLoras`, `actScene`, `drawPicture`'s Runware block; docs/CHANGELOG.md has every bench):
  | When | LoRAs (weight) |
  |---|---|
  | every picture | phone2025 0.6, UltraReal V5 0.6, Anatomy Fixer 0.7, InstaPic 0.6 (round 4: all pictures) |
  | nude or sex act | + Unchained XXX 0.8 |
  | riding, cowgirl, doggy | + Flux 4 Play 0.8 (c0wg1rl, r3v3rs3_c0wg1rl, d0gg13) |
  | missionary / anal | + Missionary POV 0.8 / POV Doggy Anal 0.8 (kept: owner decides after the bench) |
  | blowjob | + Holding Deepthroat POV 0.8 (new, `ferasalm:povdt@1`), from his eyes; no side view |
  | penis / pussy named, no act LoRA | + General Penis 0.6 / PussyDiffusion 0.8 (`SOLO_LORAS`) |
  | his hand(s), doggy, anal | + POV hand 0.6 |
  Round 4 settings (Runware only): 1008x1792, 5 steps, CFG 1, acceleration none, her face 2x (`BIG_FACE`), short prompts (REFERENCE,
  NAKED, POV_MAN, ROOM), `PHOTO` line, an expression + gaze when the words name none (`MOODS`, `GAZES`; after the act words on sex acts).
  Price: ~$0.0034-0.0042 a picture (was $0.0017); at 1:1 ~$0.0025-0.0034.
- **Round 3 session (owner):** sex acts drawn (`SEX_ACTS` true, widened word lists), the man from his own eyes (`POV_MAN`, never his
  face), detailed genitals in `NAKED`, /pic's me/my = "the man" in a sex act, /look keeps sex sentences about him.
- **New face and body:** his picture 1 (black wavy hair, full bangs, amber-brown eyes, beauty mark on her left cheek) = `face.js`;
  his picture 5 = `BODY_V2` (image 1 on nude/sex pictures only); clothed pictures keep the gray tank + leggings body (`BODY_CLOTHED`).
  Persona and every picture description changed to the new hair, eyes and mark.
- `RECALL` long memory, `DAY` weather + daily plan, `/album`, `/spend`, AI Gateway "default" for text and vectors (unchanged).
- No OpenRouter for tests (owner 2026-10-06). /setup is a web page. Preview page: https://claude.ai/artifact/LWGGrnTjMRAiLCTTSZ3rmg

## Waiting on the owner
- **1:1 or 9:16?** Bench (short prompts, the bot's own code): 1:1 drew 7/7 situations right, 9:16 5/7 (blowjob, nude pose), and 1:1 is
  ~25% cheaper. Your 2026-10-04 rule says 9:16, so it stays until you say "1:1".
- **POV Doggy Anal:** keep it, or Flux 4 Play for doggy only (both drew doggy from behind once the expression moved). Anal has no other
  LoRA that draws it: Claude's pick is keep.
- **Overlapping LoRAs, ranked to cut first** (pros/cons in the last chat reply): Anatomy Fixer (least change), InstaPic (you asked for it
  everywhere; little change on selfies), then POV hand; phone2025 and UltraReal hold the selfie framing (without either she held the phone).
- **Deploy round 3 + 4?** Say "deploy"; the daily cap $1 is ~250 pictures at the new price.
- Still open: ElevenLabs backup voice "North Jersey"; delete old branches (Actions > Delete retired branches).

## Verified this session (2026-10-08, fifteenth session)
- `node tools/check.mjs` all 6 ok (new unit rows: InstaPic + PHOTO + expression on every picture, no expression pick when named,
  penis/pussy LoRAs only without an act, no side view, every act from his eyes without the room picture, Runware size/steps/CFG sent).
- ~75 pictures drawn on Runware, every sheet read; the final 14 through the real `drawPicture`. Not checked: Telegram, a live deploy.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **The owner's picks above** (1:1, POV Doggy Anal, LoRA cuts), then deploy and his Telegram test. *Effort: low*
2. **Bench the cuts** he picks (drop-one on nude and sex acts too, 2 seeds each), read every picture. *Effort: medium*
3. **Wardrobe, poses:** widen `WARDROBE`, `SHOTS` with the short-prompt style. *Effort: medium*
4. **A second pass** (the picture as a reference, "the same photo, sharper") only if the owner still sees soft detail. *Effort: medium*
5. **After a day live:** /spend vs the dashboards (new price), AI Gateway logs, recall in a real prompt. *Effort: low*
6. **Workers AI "habibti" slip:** try the prompt line without naming it. *Effort: medium*
7. **Text model** (owner's direction): bench cheaper or better Workers AI models with `OWNER_CHAT`. *Effort: high*
8. **Old session branches:** list them in `tools/retired-branches.txt` once the owner agrees. *Effort: low*

## Open questions for the owner
- Keep the gray tank + leggings body for clothed pictures, or a new clothed body picture (Nano Banana)?
- OK to retire the old session branches the sync report keeps listing?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). My picks: 1:1 or 9:16, POV Doggy Anal, LoRA cuts: <...>. Then HANDOFF next step 2. Finish with /handoff.
