# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Rebuild (2026-10-15)", the current plan, with paste prompts).

**Last updated:** 2026-10-16 (fifty-second session: Opus 5.5, `claude-opus-5-5`, configured and served per get_session; no subagents).
Rebuild Step 2 built (dev only). Spent $0.04303 Runware (sampler bench; cap was $0.04, a billed failedModelLoad put it $0.003 over).
**Deployed:** `main` = c652eb3 (Step 1), Version `649f169d-b85c-44e1-9692-8085f0b3e4ae`. Step 2 is NOT deployed.
Rollback: push `ba540c9`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**On `dev`:** the Step 2 commit (the picture core), not deployed.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live: chat on DeepSeek V4 Flash (Workers AI, 60 s), voice Sulafat,
hearing Gemini, pictures Runware klein 9B (Nude/On) and Cloudflare klein 4B (Off), still on the old prompts (main = Step 1).
Rebuild plan: 0 done → 1 done (deployed) → **2 done (dev)** → 3 bench → 4 reference library → 5 deploy. Runware so far: $0.043 of $1.00.

## Step 2, built this session (dev)
- `PICTURE.CORE` "frames" (default) | "legacy" (the deployed prompts, kept only for Step 3's old-vs-new bench).
- Every picture of hers is a ShotSpec (`src/pictures/spec.js`, `interpret.js`) phrased by `framePrompt` (`prompt.js`) from `frames.js`, in
  order: lens + framing, "She is the woman of image 0, with the body (shape) of image 1: an adult woman, 29.", what she wears, pose,
  crop edges, place + light, expression, photo line. No body/face/eye/skin words; POV for him; lens for camera; affirmative only.
- `lint.js`: unit test over every frame and all 46 golden plans (green); runtime findings go to D1 `pictures.lint` (never blocks).
- `PICTURE.FRAMES`: steps 4, CFG 1, acceleration none, SCHEDULER "" (Default); one LoRA NSFW Unlocked by content (clothed 0.5, partial
  0.65, nude 0.75, act 0.8, act partly dressed 0.75, /look alone 0); Anatomy Fixer 0.7 only on an anatomy redraw, never on acts.
- Act vs clothes: garments over the act's region come off, the rest stays. Clothed never gets the nude body. Redraws keep the spec.
- Route profiles: Runware (4 refs, LoRA, aspect sizes) / Cloudflare (3 refs, no LoRA, FILTER_WORDS). Writer fills JSON (`WRITER.SPEC`).
- D1 `pictures` gets `spec`, `lint`, `scheduler` columns by self-migration on first write after deploy.

## Verified this session
- `node tools/check.mjs` 8 of 8 (before the docs; docs 201/201 after). Golden plans (46) dumped and read in full; lint clean.
- Unit rows: lint, weights ≤ owner caps in 0.05 steps, Anatomy Fixer only from the 2nd try and never on acts, same prompt and spec on
  3 redraws with 3 seeds, refs per content, act vs clothes, writer fields, D1 columns.
- Sampler bench (6 pictures, each read at full size; QUALITY): Default ≈ DPM++ 2M Beta, Karras moves the composition (and drew her
  nude fuller at seed 101). Her hazel-green eyes came through with no face words, in lit scenes.
- Not verified: the wrangler dry-run bundle (CI runs it on this push: read the `mocked` job), any picture in Telegram, dark-scene eyes.

## Waiting on the owner
- **Sampler:** keep Default (Claude's pick) or try another? Sheet: `face-candidates` runs/2026-10-16-step2-sampler/sheet.jpg.
- Using the bot: the first replies fill D1 `events`. Before Step 4: approving references in /studio.
- Do not send `/restart` (it wipes her memory).

## Next steps (in order; one chat each; paste prompts at the end of WORKPLAN "Rebuild")
1. **Check CI** of this push (test.yml `mocked`, the wrangler bundle) and fix if red. Haiku or Sonnet. *Effort: low.*
2. **Rebuild Step 3:** old (CORE "legacy") vs new (CORE "frames") bench, 12 cases x 2 seeds, then the 0.05 weight sweep; include a dark
   scene for her eyes and one Karras seed (≤ $0.45, ~70 pictures at $0.00585). Haiku runs, Opus reads. *Effort: medium.*
3. **Read `events`** after some use (slow replies, backup, errors) and decide hedging/timeout with the owner. Sonnet. *Effort: low.*
4. **Rebuild Step 4:** reference library + Studio References tab (≤ $0.40). Sonnet builds, Opus reviews. *Effort: medium.*
5. **Later:** remove CORE "legacy" after Step 3; WORKPLAN issue 12 leftovers (WARDROBE "his oversized" shirt words: the lint flags them
   at runtime); studio pictures expire from KV; `logSent` sizes. Haiku or Sonnet. *Effort: low.*

## Open questions for the owner
- Which sampler (above)?
- The Runware account showed $3.19 over 558 requests in its "today" window before this session's bench; the bot's own cap is $1/day.
  Worth a look at Runware's usage page (this session spent $0.043).
- OK to press Actions > Delete retired branches? Unshallow in the SessionStart hook? A 401/402 ping outside the chat?

## Prompt for the next chat
"Check the CI run of the Step 2 push to dev (test.yml mocked job incl. the wrangler bundle); then do Rebuild Step 3 from docs/WORKPLAN.md
(see 'Step 2 build' for what Step 3 needs)." Opus, medium.
