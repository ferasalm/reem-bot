# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-03 (handbook restructured, option D; no bot code changed)

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid since 2026-10-03, $5/month).
- **Live (`main` = 393414b, 2026-10-03):** v10 on DeepSeek V4 Flash (Novita first, Lunaris 8B backup); fast
  timing and instant settings commands; her voice in person scenes; pictures v3 (klein from her face, shot
  catalog); fewer voice notes; Workers AI fixes (out-of-neurons read right, hourly retry after "used up").
  The live daily AI cap is still 9,000 neurons (the free part).
- **On `dev`, not deployed:** Workers Paid cap (`AI_BUDGET.DAILY_NEURONS` 28,000 = at most $0.20/day,
  `PICTURE_SHARE` 0.8; face.yml test runs capped by real usage), commits 42bff5a + 06fa780. Handbook restructure
  (docs, CI docs check, `/handoff` skill): no effect on the bot.
- Details and run ids for everything above: `docs/CHANGELOG.md`.

## Waiting on the owner
- **Open `/setup` once** (not confirmed done since v10): turns on message edits and /auto buttons, updates the
  command menu, shows any `CONFIG_OVERRIDES`/`VOICE_ID` effect and the last AI error.
- **Try in the chat and report back:** send her a photo; ask for a pic, a lingerie pic and a belfie; "let me see
  you" and "say it again" mid-scene. Then read /setup: a `3030` line = the filter refused (a tamer picture still
  comes); a new `5006` line = a bug.
- **Delete the branches** in `tools/retired-branches.txt` on GitHub (Claude can't), then empty the list.
- Optional: Cloudflare dashboard > Notifications > a billing/usage alert as a second safety net.

## Verified this session (2026-10-03)
- Local checks (panel, unit, scenarios, e2e) passed before the restructure; `node tools/check.mjs` all 6 ok after.
- `tools/doc-check.mjs` proven to fail: an unlabelled next step, an undated decision and an unmapped file each FAILed.
- Every line of the old HANDOFF.md is in the new docs files, word for word (script check).

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Deploy the Workers Paid cap** when the owner asks (merge `dev` into `main`; read the deploy run and /health). *Effort: low*
2. **Tune from evidence:** read the latest `[live]` run in full, add a `docs/QUALITY.md` row, then tune NUDGES,
   TEXTURE, `LLM.MAX_TOKENS`, `VOICE.CHANCE*`, picture `TIER_WEIGHTS`/`HEAT_WORDS`/`SELF_CHOICE` (0/15 so far).
   Never LIMITS & OOC, never toning down explicitness. *Effort: medium*
3. **Paid-plan ideas, owner picks one:** more pictures (CHANCE values); klein at 1024 px; klein 9B for a better
   face (~$0.017 a picture); lift the free-plan limits in code (subrequests, his photos above 800 px);
   DeepSeek V4 Flash on Workers AI as backup or main (needs a bench; owner decides models). *Effort: medium to high*
4. **Curate LESSONS:** rewrite the old gotchas in §2 as symptom → cause → fix as each one comes up. *Effort: low*
5. **Later (owner's plan):** ElevenLabs v4 instead of v3, after confirming its model ID and features; all code
   touchpoints are keyed on `isV3()`. *Effort: high*

## Open questions for the owner
- Basbousa's pronoun: the persona gives none and the model drifts between "he" and "she". Pick one?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). <describe the next change>. Finish with /handoff.
