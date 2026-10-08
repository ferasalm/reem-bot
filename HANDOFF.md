# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-08 (thirteenth session). **Deployed:** `main` = afbd4fd (deploy run 37793652334, /setup all ✅, live code
read back: three LoRAs + `NUDE_LORAS`). Back to before SNOFS: push 206de7d to `main`; two LoRAs: 375f490; none: d95fd55.

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
- **SNOFS (live 2026-10-08):** nude pictures only (`PICTURE.RUNWARE.NUDE_LORAS` `ferasalm:snofsc@1` 0.8, a rank-128 LoRA copy of
  the LoKR; Runware can't load the LoKR or draw with its merged checkpoints). Same price: any 1-4 LoRAs $0.00169.
- Owner's preview page (private artifact): https://claude.ai/artifact/LWGGrnTjMRAiLCTTSZ3rmg

## Waiting on the owner
- **Next chat: the picture refresh.** Owner (2026-10-08): update Reem's face, body, expressions, poses and give her a variety of
  wardrobe; he brings **reference images of the new face and body** to the chat, Claude writes a Nano Banana prompt for each picture
  it asks for, he generates them and hands them back.
- **In Telegram:** /pic a nude (SNOFS is live), /spend, /album. Recall starts after ~40 more messages; weather and the day's plan from her second reply.
- **One LoRA off?** Saves nothing ($0.00169 flat for 1-4 LoRAs). Claude's pick on quality: Real HD 2K. No LoRAs on clothed pictures would halve their price.
- Sex-act switch (`PICTURE.RUNWARE.SEX_ACTS`, off): on = SNOFS on those pictures too.
- Still open: ElevenLabs backup voice "North Jersey"; delete old branches (Actions > Delete retired branches).

## Verified this session (2026-10-08, thirteenth session)
- `node tools/check.mjs` all 6 ok (new unit rows: NUDE_LORAS on nude and, with SEX_ACTS on, sex-act pictures only; TwinFlow none).
- `ferasalm:snofsc@1` drew on Runware (run 37788419189). Bench 37789786856: 28/28 drawn and opened at full size (docs/CHANGELOG.md):
  SNOFS gave more natural nude bodies and poses closer to the words; clothed unchanged; minus-one sets: small differences.
- Cost by direct calls: 0 LoRAs $0.00078, 1 or 4 LoRAs $0.00169. Deploy 37793652334: /health drew and saw, /setup all ✅, live code read back.
  Not checked: a real Telegram picture with SNOFS. /setup's last failure: "Runware 200: no picture" at 09:26 Watertown (before the deploy; watch for it).

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Picture refresh (new face, body, expressions, poses, wardrobe):** read the owner's reference images at full size, describe the new
   look in words, then write one Nano Banana prompt per picture requested (style: `tools/face/place-prompts.md`; her words:
   `PICTURE.RUNWARE.REFERENCE`, `LINGERIE.SPICY_PROMPT`; lessons: LESSONS §2 Nano Banana, text-only prompts for lingerie, 9:16).
   Suggested batch: face 8 (angles + expressions), faceless body 4, wardrobe 8, poses 4. He sends them back; open each at full size.
   *Effort: high*
2. **Make them live:** new reference face (`tools/face/reference.jpg` → `face.js`) and body (`body.jpg`), new words in
   `PICTURE.RUNWARE.REFERENCE`/`LOOKS`, `WARDROBE`, `EXPRESSIONS`, `SHOTS`; bench klein 9B with the LoRAs (`lora_routes`), read every picture. *Effort: high*
3. **Owner's live test** of /pic and selfies, then report slips. *Effort: low*
4. **After a day live:** /spend vs the dashboards, AI Gateway logs, the day's plan in KV "day", recall in a real prompt. *Effort: low*
5. **Workers AI "habibti" slip:** she remarks on his "habibti" 2/2-3/3 on this model; try the prompt line without naming it. *Effort: medium*
6. **Selfie framing:** the phone shows in plain selfies (1 of 6; the live LoRA set drew one in the bench too). *Effort: medium*
7. **Text model** (owner's direction): bench cheaper or better Workers AI models with `OWNER_CHAT`. *Effort: high*
8. **Old session branches:** list them in `tools/retired-branches.txt` once the owner agrees. *Effort: low*

## Open questions for the owner
- Turn off Real HD 2K (no saving, quality only), or no LoRAs on clothed pictures (halves their price)?
- Raise Runware's daily picture cap ($0.50, ~300 pictures at $0.0017) or keep it?
- OK to retire the old session branches the sync report keeps listing?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). We're doing the picture refresh (HANDOFF next step 1). Here are my reference images for the new face and body: <attach>.
> Changes I want: <...>. Finish with /handoff.
