# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-08 (fourteenth session, part 3: LoRA round 3 on `dev`). **Deployed:** `main` = 1176ec8 (deploy run 37799616836, /setup all ✅, $1.00 cap,
face "built in"). Back to before this session: push afbd4fd to `main`.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid, $5/month). **Live now:**
- **Texts, memory notes, /auto:** DeepSeek V4 Flash on Workers AI (`@cf/deepseek-ai/deepseek-v4-flash-0731`), the same DeepSeek on
  OpenRouter (Novita...) as the backup. Her replies: reasoning "none" + empty-answer retries (last 2 "low"); tasks: "low".
- **Voice:** Sulafat (OpenRouter); backup aura-2 Andromeda (Workers AI), then ElevenLabs. **Hearing:** Gemini 3.8 Flash, then Whisper, then Scribe.
- **Pictures (live):** Runware klein 9B with her face + 3 LoRAs (phone2025, ultrareal5 0.6, realhd2kc 0.5), SNOFS 0.8 on nude and
  sex-act pictures; `RUNWARE.DAILY_USD` $1 (then Cloudflare klein, never nude). Seeing his photos: Llama 4 Scout. Runware ~$18.20.
- **On `dev`, not deployed: LoRAs by situation, round 3** (`runwareLoras`, `actScene`; docs/CHANGELOG.md has every bench):
  | When | LoRAs (weight) |
  |---|---|
  | every picture | phone2025 0.6, UltraReal V5 0.6, Anatomy Fixer 0.7 (Real HD 2K out) |
  | her selfies | + InstaPic 0.6 |
  | nude or sex act | + Unchained XXX 0.8 (SNOFS, NSFW Unlocked kept on Runware, not used) |
  | riding, cowgirl, doggy | + Flux 4 Play 0.8 (its trigger by act: c0wg1rl, r3v3rs3_c0wg1rl, d0gg13) |
  | missionary / anal | + Missionary POV 0.8 / POV Anal 0.8 |
  | blowjob | + POV Blowjob 0.6, side view, no room picture (`ACT_SCENES` "{close}") |
  | any sex act | + General Penis 0.6; POV_MAN "average-sized" |
  | pussy, spread legs | + PussyDiffusion 0.8 ("hairy pussy") |
  | his hand(s), grabbing / doggy, anal | + POV hand 0.6 (anal/doggy: his hands grip her butt) |
  Bench: riding, reverse, missionary, doggy, anal, nudes, selfie right; **blowjob 2/4** (a named room breaks it).
- **New this session (owner):** sex acts drawn (`SEX_ACTS` true, widened word lists), the man from his own eyes (`POV_MAN`, never his
  face), detailed genitals in `NAKED`, /pic's me/my = "the man" in a sex act, /look keeps sex sentences about him.
- **New face and body:** his picture 1 (black wavy hair, full bangs, amber-brown eyes, beauty mark on her left cheek) = `face.js`;
  his picture 5 = `BODY_V2` (image 1 on nude/sex pictures only); clothed pictures keep the gray tank + leggings body (`BODY_CLOTHED`).
  Persona and every picture description changed to the new hair, eyes and mark.
- `RECALL` long memory, `DAY` weather + daily plan, `/album`, `/spend`, AI Gateway "default" for text and vectors (unchanged).
- No OpenRouter for tests (owner 2026-10-06). /setup is a web page. Preview page: https://claude.ai/artifact/LWGGrnTjMRAiLCTTSZ3rmg

## Waiting on the owner
- **In Telegram:** /pic nudes and sex acts (e.g. "/pic you riding me on the bed"); a selfie; /look in a heated scene.
  If an old `/face keep` is stored, pictures keep the old face: send `/face reset`.
- **Deploy round 3?** On `dev` (owner: "Dev only"); say "deploy" and Claude pushes it to `main`.
- **Still to do from the refresh:** expressions, poses and wardrobe variety (words, Claude can write them; Nano Banana prompts if you
  want reference pictures).
- Still open: ElevenLabs backup voice "North Jersey"; delete old branches (Actions > Delete retired branches).

## Verified this session (2026-10-08, fourteenth session)
- `node tools/check.mjs` all 6 ok (new unit rows: SEX_ACTS on/off, POV_MAN only on sex acts, /pic "riding me" → "the man", scene
  sentences about him only when explicit, body v2 only on nude/sex pictures, DRESSED on clothed).
- ~30 pictures drawn by the bot's own `drawPicture` on Runware, each opened at full size (docs/CHANGELOG.md): face kept on all.
- Deploy run 37799616836 green: /health drew and saw, /setup all ✅ (Runware klein, today $0.11 of $1.00). Live code not read back
  (the Cloudflare MCP returns the whole bundle); /setup's new cap is the proof. Not checked: a real Telegram sex-act picture.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Deploy round 3** (owner's call), then his live test of /pic, selfies and /look; report slips. *Effort: low*
2. **Wardrobe, expressions, poses:** widen `WARDROBE`, `EXPRESSIONS`, `SHOTS` (Claude's picks), bench on Runware from the container
   (LESSONS §1), read every picture. *Effort: medium*
3. **Blowjob with a named room** (2/4): try leaving out the room words too, or the room only for in-person /look. *Effort: medium*
4. **After a day live:** /spend vs the dashboards, AI Gateway logs, the day's plan in KV "day", recall in a real prompt. *Effort: low*
5. **Workers AI "habibti" slip:** she remarks on his "habibti"; try the prompt line without naming it. *Effort: medium*
6. **Selfie framing:** the phone shows in plain selfies (1 of 6). *Effort: medium*
7. **Text model** (owner's direction): bench cheaper or better Workers AI models with `OWNER_CHAT`. *Effort: high*
8. **Old session branches:** list them in `tools/retired-branches.txt` once the owner agrees. *Effort: low*

## Open questions for the owner
- Keep the gray tank + leggings body for clothed pictures, or a new clothed body picture in the new shape (Nano Banana)?
- Turn off Real HD 2K (no saving, quality only), or no LoRAs on clothed pictures (halves their price)?
- OK to retire the old session branches the sync report keeps listing?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). Here's what I saw testing pictures in Telegram: <...>. Then do HANDOFF next step 2. Finish with /handoff.
