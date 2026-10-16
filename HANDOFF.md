# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Rebuild (2026-10-15)", the current plan, with paste prompts).

**Last updated:** 2026-10-16 (fifty-third session: Opus 5.5, `claude-opus-5-5`, configured and served per get_session; no subagents).
Sampler cost bench for the owner's pick; CI of Step 2 read (green). Spent $0.05278 Runware (cap $0.05; two failed tries were billed).
**Deployed:** `main` = c652eb3 (Step 1), Version `649f169d-b85c-44e1-9692-8085f0b3e4ae`. Step 2 is NOT deployed.
Rollback: push `ba540c9`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**On `dev`:** Step 2 (the picture core, cfec209) + this session's bench script and records. Not deployed.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live: chat on DeepSeek V4 Flash (Workers AI, 60 s), voice Sulafat,
hearing Gemini, pictures Runware klein 9B (Nude/On) and Cloudflare klein 4B (Off), still on the old prompts (main = Step 1).
Rebuild plan: 0 done → 1 done (deployed) → **2 done (dev; CI green)** → 3 bench → 4 reference library → 5 deploy.
Runware for the Rebuild so far: $0.096 of $1.00 (Step 3 needs ≤ $0.45, Step 4 ≤ $0.40: it still fits).

## What the samplers cost (this session; QUALITY "what each sampler costs"; sheet: `face-candidates` runs/2026-10-16-step2-sampler-cost)
Same clothed selfie, same seed, 4 steps, 3 references, 1 LoRA:
- Default, DPM++ 2M, DPM++ 3M, UniPC, Euler Beta: **$0.00585 each**, nearly the same picture (2M and 3M pixel-close to Default).
- Heun (two model calls a step): $0.00793 (+36%), no better.
- Default with acceleration "high" (Runware's caching, not a sampler): **$0.0039 (-33%)**, no loss seen on this one picture.
- So the sampler is not a cost lever; acceleration is. Claude's pick: keep Default; try acceleration "high" in Step 3 on nude, act and
  dark cases before adopting it (one picture is not enough).
- Earlier (same day): DPM++ 2M Karras moved the composition and drew her nude fuller; DPM++ 2M Beta ≈ Default.

## Step 2 (dev, from the fifty-second session)
- `PICTURE.CORE` "frames" (default) | "legacy" (old prompts, only for Step 3's bench). Every picture of hers is a ShotSpec phrased by
  `framePrompt` (lens + framing, "She is the woman of image 0 ...", clothes, pose, crop edges, place + light, expression, photo line).
- `PICTURE.FRAMES`: steps 4, CFG 1, acceleration none, SCHEDULER "" (Default); NSFW Unlocked by content (0.5 / 0.65 / 0.75 / 0.8 / 0.75 / 0);
  Anatomy Fixer 0.7 only on anatomy redraws, never acts. D1 `pictures` gets `spec`, `lint`, `scheduler` columns on first write.

## Verified this session
- CI of the Step 2 push: test.yml run 38846706576 (cfec209): mocked (unit, scenarios, e2e, golden plans, docs, the wrangler bundle) and
  sync success; live skipped.
- 7 bench pictures read at full size; costs from Runware's own reported cost and `usage.total` before/after.
- `node tools/check.mjs` 8 of 8.
- Seen on the way (for Step 3): the selfie asked "framed from her chest up" but every variant drew her to the hips.
- Not verified: any picture in Telegram (Step 2 isn't deployed), dark-scene eyes, acceleration "high" beyond one clothed picture.

## Waiting on the owner
- **Sampler + acceleration:** keep Default (all one-call samplers cost the same)? And should Step 3 test acceleration "high" (a third
  cheaper) on nude, act and dark cases?
- Using the bot: the first replies fill D1 `events`. Before Step 4: approving references in /studio.
- Do not send `/restart` (it wipes her memory).

## Next steps (in order; one chat each; paste prompts at the end of WORKPLAN "Rebuild")
1. **Rebuild Step 3:** old (CORE "legacy") vs new (CORE "frames") bench, 12 cases x 2 seeds, then the 0.05 weight sweep; include a dark
   scene for her eyes, one Karras seed, the "chest up" framing slip, and (if the owner says yes) acceleration "high" on 4 cases
   (≤ $0.45, ~70 pictures at $0.00585). Haiku runs, Opus reads. *Effort: medium.*
2. **Read `events`** after some use (slow replies, backup, errors) and decide hedging/timeout with the owner. Sonnet. *Effort: low.*
3. **Rebuild Step 4:** reference library + Studio References tab (≤ $0.40). Sonnet builds, Opus reviews. *Effort: medium.*
4. **Later:** remove CORE "legacy" after Step 3; WORKPLAN issue 12 leftovers (WARDROBE "his oversized" shirt words: the lint flags them
   at runtime); studio pictures expire from KV; `logSent` sizes. Haiku or Sonnet. *Effort: low.*

## Open questions for the owner
- Sampler and acceleration (above).
- Runware's "today" window read $2.83 over 431 requests before this bench (the bot's own cap is $1/day; the Playground key was used
  at 03:29 UTC). Worth a look at Runware's usage page.
- OK to press Actions > Delete retired branches? Unshallow in the SessionStart hook? A 401/402 ping outside the chat?

## Prompt for the next chat
"Do Rebuild Step 3 from docs/WORKPLAN.md (see 'Step 2 build' and HANDOFF for what Step 3 needs, including the dark scene, the framing
slip and, if I said yes, acceleration high)." Opus, medium.
