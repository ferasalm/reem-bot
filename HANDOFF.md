# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds the picture overhaul, Steps A-D).

**Last updated:** 2026-10-13 (fortieth session: Opus 5.5, `claude-opus-5-5` per `get_session` `session_context.model` and `last_served_model`. Picture overhaul Steps C and D.)
**Deployed:** `main` = b42cac1 (the fix round), unchanged. Rollback if ever needed: push `d21c4b3` to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**Branch:** `ccr-472c3621-pyrq4y` (pushed), and `dev` = the same commit. `dev` is ahead of `main` by Steps A, B, C and D (not deployed).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live (`main`): texts, memory, /auto on DeepSeek V4 Flash; voice Sulafat; hearing Gemini; pictures on Runware klein 9B; /nsfw (Off on Cloudflare klein 4B); /studio.
On `dev`, not deployed: Step A (one clothed body, Lenovo + NSFW Unlocked), Step B (he is the camera, owned hands), and this session:
- **Cloudflare back to klein 4B** at 576x1024 (owner). Workers AI refuses LoRAs on klein 4B too (MODEL_NOT_SUPPORTED); the anatomy fixer and amateur-selfies LoRAs dropped (owner).
- **Step C, the picture writer** (`PICTURE.WRITER`, Llama 3.3 70B fast, owner's pick): tidies her selfie drafts (one pose, no phone, no second smile; bench 4/4 vs the template's 1/4), writes her in-person moments, including ones the template couldn't draw; /look's LOOK.PROMPT under the same rules. Off, failed, past 25 s or unusable → today's template.
- **Nude/On are Runware's only** (owner): no Cloudflare or Nano Banana fallback; a picture Runware can't draw (failed, or $1/day spent) doesn't come.
- **Step D, the anatomy check** (`PICTURE.ANATOMY`, Llama 4 Scout): her pictures are checked, a picture with mistakes is redrawn with another seed, 3 at most, the fewest mistakes sent. Probe: 5 of 7 known mistakes caught (second heads, a bare leg next to a jeans leg); misses most edge strays. Bench: klein 4B with her references clean 18/20 at Off.

## Verified this session
- `node tools/check.mjs` 8 of 8; golden plans: the 4B size and "Runware fails twice: no picture" only (read case by case); unit rows for the writer and the check; scenarios for the writer in person and Runware-only.
- Writer replays on Workers AI (no pictures): DeepSeek thinks first even at "none" (median 5-24 s, most selfie calls past 25 s); Llama 15/15 in 1.3 s with the rules kept. Step C bench: 18 Runware pictures read (QUALITY "Step C"). Anatomy probes x3 and the Step D bench: 22 pictures, every try read (QUALITY "Step D").
- Spend: my benches ~$0.064 by the scripts' sums; Runware usage +$0.228 over the session (the live bot drew too). Cloudflare: ~11,000 neurons across probes and benches.
- Not checked: any of this in the real bot (not deployed).

## Waiting on the owner
- Say "deploy" for Steps A-D, or keep it on `dev`.
- After a deploy, a Telegram test: a selfie with her own words, an in-person "let me see you", /look in a scene, /pic, a sex act, one picture at /nsfw Off; then read D1 rows (`llm_text` = the writer's words; `error` "anatomy: ..." = a redrawn try).

## Next steps (in order; one chat each)
1. **After the owner's Telegram test, read the D1 rows** of the new pictures (writer words, anatomy notes, seconds a picture). Sonnet. *Effort: medium.*
2. **Edge strays**: the check misses hands or sleeves reaching in at an edge (2 of 3 in the probe, 2 of 2 in the bench). Try a second, edge-only question, or crops of the left/right thirds sent as extra images. Opus. *Effort: medium.*
3. **Later**: VISION.BACKUP_MODEL (Gemma 3 12B) answers "not allowed" on this account: pick another; Llama's plainer wording ("thumb near a cut"; spooning lost "facing away"); selfies on klein 4B sometimes show a phone; an anal LoRA that keeps her face; old session branches. *Effort: medium.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? (~35 old branches show as "not here" on a shallow clone; left alone again.)
- Old session branches still hold the old pictures in their history. Clear them, or leave them?

## Prompt for the next chat
"Read HANDOFF. I tested the bot in Telegram after the deploy: read the D1 rows of those pictures and tell me what the writer and the anatomy check did." *Effort: medium.*
