# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Rebuild (2026-10-15)", the current plan, with paste prompts).

**Last updated:** 2026-10-15 (forty-ninth session: Opus 5.5, `claude-opus-5-5`, configured and served per get_session; read-only
Explore subagents on Sonnet and Haiku, an Opus advisor). Planning only: the owner approved the rebuild plan. No code changed, $0 spent.
**Deployed:** `main` = 72962ba, Version ID `5b39bfb2-933c-41a2-82ee-c29ee1e5c4b5`. Rollback: push `3da31c2`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**On `dev`:** 72962ba plus records commits (this plan); no undeployed code.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live: chat on DeepSeek V4 Flash (Workers AI, 60 s limit),
voice Sulafat, hearing Gemini, pictures Runware klein 9B (Nude/On) and Cloudflare klein 4B (Off). Pictures today: face 13 + v13
bodies, BODY_WORDS in the body lines, Lenovo 1.3 + NSFW Unlocked 0.8 / Anatomy Fixer, steps 6 CFG 2, no scheduler sent (Runware "Default").
**The rebuild (owner, 2026-10-15):** the picture prompts fight the references and LoRAs (body words 4-5 times, "the man", "camera",
out-of-frame things, negatives), and everything is one 490 KB file. Plan: WORKPLAN "Rebuild (2026-10-15)", steps 0-5, one chat each:
0 reliability + studio fix → 1 split into `src/` modules (behaviour unchanged) → 2 picture core (ShotSpec, frame prompts in POV/lens
words, lint, NSFW Unlocked only by a weight table, CFG 1 / 4 steps, sampler read-then-test) → 3 bench → 4 reference library + Studio
References tab → 5 deploy. Budget $1.00 Runware in all.

## Found this session (to fix in the step named)
- Disconnects (step 0): every message acked before work, no retries; `runCommand` mostly without try/catch (a throw drops the batch);
  `budget.used++` + `xfetch` count 4 call kinds twice against a 50-call free-plan limit; the memory fold (up to ~135 s) holds the
  single queue; chat waits up to 60 s per attempt (kept: owner, measure first); 401/402 shows "(setup) ⚠️".
- Pictures (step 0): at Nude/On a Runware failure = no picture (D1 row 705); D1 has no rows at all on 2026-10-14 (quiet or broken?).
- Studio (step 0): stretched picture + vertical seed text = one flex bug in `resultCard` (`studio.js` ~40-45, ~280).
- Prompts (step 2): `ref0`'s replace makes CUSTOM.SAME_PERSON dead when a hairstyle is picked; REFERENCE_BACK names "a full bust";
  random picks re-roll on anatomy redraws; all 8 anatomy flags since 10-13 were "2 or 3 heads" (likely false).

## Waiting on the owner
- Nothing for step 0. Before step 4: the first candidate references to approve in /studio.
- Earlier open: the clothed-picture checks of 72962ba (green eyes, image 1's bra) are folded into the rebuild (body and face words go).
- Do not send `/restart` (the `/setup` page says to; it wipes her memory).

## Verified this session
- Read-only: the Runware prompt build (`runwarePlan`, `runwareLoras`, every CONFIG prompt string), D1 `reem-studio.pictures` (1,654
  rows since 10-11, 121 from the bot; one failure, row 705), Runware MCP `model_schema` for `runware:400@2` (4 refs, UUID refs,
  scheduler enum, defaults steps 4 / CFG 3.5 / acceleration high).
- The tools that read `worker.js` as text (for step 1): load-worker, build-panel, check.mjs and test.yml `node --check`, stt-bench.
- Not verified: the studio bug in a browser (read in the CSS), Worker logs (not reachable), OpenRouter credit.

## Next steps (in order; one chat each; paste prompts at the end of WORKPLAN "Rebuild")
1. **Rebuild Step 0:** reliability + studio fix (events table, try/catch, budget fix, fold on the cron, upload_photo, a Runware
   retry at Nude/On, studio cards, the 10-14 gap). Sonnet. *Effort: medium.*
2. **Rebuild Step 1:** the module split, golden plans byte-identical. Opus (haiku-worker for the classification). *Effort: high.*
3. **Rebuild Step 2:** the picture core + sampler reading and short list (≤ $0.04). Opus. *Effort: high.*
4. **Rebuild Step 3:** bench old vs new and the weight sweep (≤ $0.45). Haiku runs, Opus reads. *Effort: medium.*
5. **Rebuild Step 4:** reference library + Studio References tab (≤ $0.40). Sonnet builds, Opus reviews. *Effort: medium.*
6. **Later:** the Writer slip "her hands on the man" (folded into step 2's frames); Cloudflare bench at /nsfw Off; `/setup`'s
   stale Pictures line; old session branches. *Effort: low.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? (false "work not here" branches again)

## Prompt for the next chat
The Step 0 paste prompt at the end of `docs/WORKPLAN.md` ("Rebuild", "Paste prompts"). Sonnet. *Effort: medium.*
