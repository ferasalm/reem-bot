# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Rebuild (2026-10-15)", the current plan, with paste prompts).

**Last updated:** 2026-10-16 (fifty-third session: Opus 5.5, `claude-opus-5-5`, configured and served per get_session; no subagents).
Sampler cost bench, then the Rebuild Step 3 bench. Runware this session: $0.489 (cost bench $0.053 + Step 3 $0.436).
**Deployed:** `main` = c652eb3 (Step 1), Version `649f169d-b85c-44e1-9692-8085f0b3e4ae`. Step 2 is NOT deployed.
Rollback: push `ba540c9`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**On `dev`:** Step 2 (the picture core, cfec209; CI green) + bench scripts and records. Nothing in the bot changed this session.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live: chat on DeepSeek V4 Flash (Workers AI, 60 s), voice Sulafat,
hearing Gemini, pictures Runware klein 9B (Nude/On) and Cloudflare klein 4B (Off), still on the old prompts (main = Step 1).
Rebuild: 0 done → 1 done (deployed) → 2 done (dev) → **3 bench done (fixes waiting)** → 4 reference library → 5 deploy.
Runware for the Rebuild: $0.575 of $1.00 (Step 4 planned ≤ $0.40: it still fits, just).

## Step 3 results (QUALITY "Rebuild Step 3"; pictures: `face-candidates` runs/2026-10-16-step3)
- Settings now: steps 4, CFG 1 (klein's own reference), scheduler Default, acceleration none.
- New prompts vs old: a quarter cheaper ($0.00585 vs $0.00793: one LoRA instead of two); they keep the rules the old ones broke (the old
  "selfie" drew a mirror selfie with the phone 2/2; the old POV drew his hands holding a phone); all acts as named, anal right 2/2; her
  eyes hazel-green in the dark 2/2. But she is drawn **a little slimmer** (the old prompts had BODY_WORDS; the new rely on image 1).
- Slips to fix (Step 3b, $0): black leggings drawn as bike shorts with bare thighs in POV (2/2); "from her chest up" drawn to the hips (2/2).
- **Karras vs Default:** the same picture at both seeds (6/6), the same price. No reason to switch.
- **Acceleration "high":** $0.0039 (a third cheaper), the same picture as Default in 6/6 (nude, riding, dark, selfie).
- Weights: clothed 0.6 ≈ 0.5, nude 0.7 ≈ 0.75 (seed 101); the rest not reached (budget).

## Verified this session
- CI of the Step 2 push (test.yml run 38846706576): mocked incl. the wrangler bundle, sync: success.
- 71 bench pictures (7 cost bench + 64 Step 3) read at full size, anal on full-size crops; prompts dry-run and read before the paid run.
- `node tools/check.mjs` 8 of 8.
- Not verified: any picture in Telegram (Step 2 not deployed); the weight sweep beyond its two edges.

## Waiting on the owner
- **Acceleration "high"** for her pictures (a third cheaper, no loss seen)? And keep **Default** (Karras is the same picture, same price)?
- **Her body:** the new prompts draw her a little slimmer than the old (as the reference pictures show her). Keep, or bring fullness back
  (a fuller body reference in Step 4, or a body line; your rule was "rely on the references")?
- Using the bot: the first replies fill D1 `events`. Before Step 4: approving references in /studio. Do not send `/restart`.

## Next steps (in order; one chat each)
1. **Step 3b:** set the owner's picks (FRAMES.ACCELERATION, SCHEDULER); fix the leggings and "chest up" framing slips in frames.js (golden
   plans read, lint green, $0 unless the owner wants a 4-picture check ≈ $0.02); then remove CORE "legacy". Sonnet or Opus. *Effort: medium.*
2. **Rebuild Step 4:** reference library + Studio References tab (≤ $0.40; the body question above goes here). Sonnet builds, Opus
   reviews. *Effort: medium.*
3. **Read `events`** after some use and decide hedging/timeout with the owner. Sonnet. *Effort: low.*
4. **Later:** WORKPLAN issue 12 leftovers (WARDROBE "his oversized" shirt words); studio pictures expire from KV; `logSent` sizes. Haiku.
   *Effort: low.*

## Open questions for the owner
- Acceleration, sampler and body (above).
- Runware's "today" window read $2.72 before the Step 3 run (the bot's cap is $1/day; the Playground key was used at 03:29 UTC). Worth a
  look at Runware's usage page.
- OK to press Actions > Delete retired branches? Unshallow in the SessionStart hook? A 401/402 ping outside the chat?

## Prompt for the next chat
"Do Rebuild Step 3b from HANDOFF (my picks on acceleration, sampler and body are in docs/DECISIONS.md), then remove CORE legacy." Opus, medium.
