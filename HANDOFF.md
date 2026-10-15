# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Fix round 2", the current plan).

**Last updated:** 2026-10-15 (forty-seventh session: Opus 5.5, `claude-opus-5-5`, the configured model; no subagents). All of this session's picture work is deployed.
**Deployed:** `main` = 451f008, run 38681909873, Version ID `9b124fe0-335e-4cec-ab60-1a3a45cc3bdf`. Rollback: push `d8ae8ff` (before today's last batch) to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**On `dev`:** 451f008 plus this docs-only records commit.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live: her chat on DeepSeek V4 Flash (Workers AI), 60 s limit (the owner's test passed); voice Sulafat; hearing Gemini; pictures Runware klein 9B (Nude/On) and Cloudflare klein 4B (Off).
Her references: face 13 + v13 bodies only (originals 17-19: black bra and briefs, nude back, nude front with a natural bush); no hairstyle pictures (words only). Every body line opens with her face ("her face exactly image 0's: ... light hazel-green eyes (clearly green, not brown) with black winged eyeliner ..."); SCENE_NIGHT lights her face; BODY_WORDS "narrow shoulders, a full bust, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, soft feminine curves, thick arms, thick thighs, voluptuous"; MAX_LORAS 2 (nude: Lenovo + NSFW Unlocked; clothed: Lenovo + Anatomy Fixer; an anatomy redraw adds the Anatomy Fixer); BODY_PARTIAL "nude"; `stillWorn` (clothes said to be off aren't kept on).
Known: nude pictures may still be a little slimmer than the body pictures (the LoRA stack; the owner keeps the LoRAs).

## Waiting on the owner
- **Look at her pictures in Telegram** (face, eyes, body fullness, partly dressed acts): tell Claude what's off.
- Do not send `/restart` (the `/setup` page says to; it wipes her memory).

## Verified this session
- Three deploys, every step success, `/health` ok and `/setup` all ✅ in each job log: e0e78ac (run 38674596701), d8ae8ff (38676885522), 451f008 (38681909873, Version `9b124fe0-…`); `git ls-remote`: main = 451f008. /health's Cloudflare draw passed the prompt filter with the new body words.
- Live pictures (D1 611, 612, 614) replayed at their seeds: face first + lit at night brought her eyes, eyeliner and brows back; `stillWorn` dropped "pants are off" (4/4).
- slim-bench on v13: two LoRAs = three; "thick arms, thick thighs, voluptuous" a little fuller, never overweight; bot check after adding them: fuller arms, hips and thighs.
- `node tools/check.mjs` 8 of 8 before each push; golden plans rewritten only after checking every difference.
- Not verified: her pictures in Telegram after 451f008. Likeness never measured, only judged by eye.

## Next steps (in order; one chat each)
1. **The owner's picture check in Telegram:** no chat needed until the owner reports. *Effort: low.*
2. **Writer slip seen live:** "her hands holding the man", "her hands on the man" (D1 610, 611) give him a body; `asCamera`/`ownHands` should catch "on/holding the man". Sonnet. *Effort: low.*
3. **Cloudflare half of the bench** after 00:00 UTC, with the new `body.jpg` at /nsfw Off. Haiku runs it, Opus reads. *Effort: low.*
4. **Later:** BODY_WORDS and the face words built from CONFIG instead of copied into each line; a REFERENCE_CLOSE bench; `/setup`'s stale Pictures line; VISION.BACKUP_MODEL; old session branches. *Effort: medium.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? This session it showed 51 false "work not here" branches on a shallow clone.

## Prompt for the next chat
"Read HANDOFF. Her pictures in Telegram: <what's off, or fine>. Fix what's off, then step 2." Sonnet (Opus if a picture problem needs root-causing). *Effort: low.*
