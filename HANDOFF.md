# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-06 (ninth session). **Deployed:** `main` = `dev` code (122dac8): DeepSeek V4 Flash writes her replies
again, Mistral Nemo is only the backup. To go back to the version before today: push c0e8109 to `main`.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid since 2026-10-03, $5/month).
- **Live:** v11 persona (Reem Nabot, Armenian-Lebanese bookkeeper, Watertown triple-decker); DeepSeek V4 Flash text, memory and
  /auto (Nemo the backup); Sulafat voice; Gemini 3.8 Flash hearing; `/look`; `/pic` (his words, her face); daily AI cap 50,000
  neurons; picture versions on the panel (`PICTURE.ROUTE`, default "cloudflare"; "runware-klein"/"runware-twinflow" draw nudity).
- **Fixed this session (owner: "What is wrong with Reem? Fix her. She's gotten so weird"):** the cause was Mistral Nemo. His
  chat replayed 5 times a message: Nemo wrote 1-4 word texts, copied the prompt's examples word for word and went to his door
  0/5; DeepSeek wrote full in-character texts and opened the door 4/5. Owner picked "DeepSeek + deploy". Guards added for any
  model: a copied prompt example is asked again (`TEXTING.COPY_WORDS`); "hey habibti" to him becomes habibi (talking about
  the word stays); his own words echoed back are dropped; a scene's bare words are quoted; "she repeats" in a text is
  narration. The two example jokes DeepSeek reused (napkin receipt 6x, "taxes are a suggestion" 5x) are replaced.
- **New test tools:** `OWNER_CHAT` in `tools/test/live.mjs` replays his chat; Actions > Tests > Run workflow takes `model`
  to compare another OpenRouter model on the same situations.
- Owner's preview page (private artifact): https://claude.ai/artifact/LWGGrnTjMRAiLCTTSZ3rmg

## Waiting on the owner
- **Sex-act switch** (`PICTURE.RUNWARE.SEX_ACTS`, panel "Runware: allow sex acts", default off) is on `dev`, not deployed:
  say "Deploy" to get it on the panel; it only acts on the Runware picture versions. The owner tests the pictures with /pic.
- **In Telegram now:** `/setup` once (it shows which models answer: the chat model should read DeepSeek; if the panel's
  overrides still name Nemo, clear `LLM.MODEL` there), then `/rewind` past the short Nemo replies or `/restart` (old short
  replies in her history pull her back to that style). Then the same chat: "come over", "waiting for you to knock".
- Nano Banana's money cap $0.50 a day (`LINGERIE.DAILY_USD`): raise it?
- Still open: ElevenLabs backup voice "North Jersey"; delete old branches (Actions > Delete retired branches);
  Lunaris via DeepInfra; cost estimate questions from 2026-10-04.

## Verified this session (2026-10-06, ninth session)
- `node tools/check.mjs` all 6 ok. Live runs read reply by reply: 37459244094 (Nemo, his chat), 37459455109 (DeepSeek, his
  chat), 37459992726 (DeepSeek, all; 1 broken = Nemo after an OpenRouter timeout), 37460798857 (DeepSeek, all; 0 broken).
- Deploy run 37461633468 green (Deploy Worker, /health); live code read back: DeepSeek model, Nemo backup, the new guards.
- Not checked: the panel's `CONFIG_OVERRIDES` (Claude can't read it); the live chat after the deploy.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Owner's live test** (list above), then report slips. *Effort: low*
2. **Going over to him:** after "come over" she mostly invites him instead (3/9 went to him in run 37460798857); decide with
   the owner if she should go more often. *Effort: medium*
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
