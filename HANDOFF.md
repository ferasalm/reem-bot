# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Fix round 2", the current plan).

**Last updated:** 2026-10-15 (forty-seventh session: Opus 5.5, `claude-opus-5-5`, the configured model; no subagents). On `dev`, not deployed: the old references retired (v13 bodies, no hairstyle pictures, old originals gone), her face first and lit at night, at most two LoRAs, clothes said to be off not kept on.
**Deployed:** `main` = d8ae8ff (face 13 + v12 bodies, full bust/arms words), run 38676885522, Version ID `7a9bd8d1-e8e4-43b9-880d-30686a300715`. Rollback: push `e0e78ac` or `2c18113` to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**On `dev`:** everything above; nothing of it is live.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live: her chat on DeepSeek V4 Flash (Workers AI), 60 s limit (the owner's test passed); voice Sulafat; hearing Gemini; pictures Runware klein 9B (Nude/On) and Cloudflare klein 4B (Off).
`dev` (not live): references = face 13 + v13 bodies (originals 17-19: black bra and briefs, nude back, nude front with a natural bush) only; no hairstyle pictures (words only); every body line opens with her face ("her face exactly image 0's: ... light hazel-green eyes (clearly green, not brown) with black winged eyeliner ..."), SCENE_NIGHT lights her face; MAX_LORAS 2 (nude: Lenovo + NSFW Unlocked; clothed: Lenovo + Anatomy Fixer; an anatomy redraw takes the Anatomy Fixer as a third); BODY_PARTIAL "nude"; `stillWorn`.
Known: nude pictures are still a little slimmer than the body pictures through hips and thighs (the LoRA stack; no LoRAs matched; the owner keeps them).

## Waiting on the owner
- **Deploy?** Say "deploy" to put everything on `dev` live.
- **Slimmer nude bodies:** the remaining options, each a small gain at best: "her hips much wider than her shoulders, full thick thighs" in BODY_WORDS, or lighter weights (Lenovo 1.0, NSFW Unlocked 0.6). Your call; no LoRAs is the only full fix.
- Do not send `/restart` (the `/setup` page says to; it wipes her memory).

## Verified this session
- Deploys e0e78ac (run 38674596701) and d8ae8ff (run 38676885522): every step success, `/health` ok, `/setup` all ✅ (job logs); `git ls-remote`: main = d8ae8ff.
- Live pictures (D1 611, 612, 614) replayed at their seeds: the generic, brown-eyed face came from the prompt (face never named, face unlit at night); face first + lit gave her eyes, eyeliner and brows. "pants are off" kept the pants: fixed (`stillWorn`, 4/4).
- slim-bench on v13: two LoRAs draw as three; body words first, shape words, lighter weights: small or no gain.
- Final bot check on `dev` (4 pictures): dressed when clothed, her brows and face, the bush; the nude back a little slim. Likeness not measured.
- `node tools/check.mjs` 8 of 8 before each push; golden plans rewritten only after checking every difference.
- Not verified: the bot in Telegram after these changes; /nsfw Off pictures with the new `body.jpg`.

## Next steps (in order; one chat each)
1. **Deploy** when the owner says "deploy"; read the deploy log, `/health`, `/setup`; the owner looks at her pictures in Telegram. Haiku. *Effort: low.*
2. **Writer slip seen live:** "her hands holding the man", "her hands on the man" (D1 610, 611) give him a body; `asCamera`/`ownHands` should catch "on/holding the man". Sonnet. *Effort: low.*
3. **If the owner picks a body option** (shape words or lighter weights): build it, golden plans, a 4-picture check. Opus. *Effort: medium.*
4. **Cloudflare half of the bench** after 00:00 UTC, with the new `body.jpg` at /nsfw Off. Haiku runs it, Opus reads. *Effort: low.*
5. **Later:** BODY_WORDS and the face words built from CONFIG instead of copied into each line; a REFERENCE_CLOSE bench; `/setup`'s stale Pictures line; VISION.BACKUP_MODEL; old session branches. *Effort: medium.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? This session it showed 51 false "work not here" branches on a shallow clone.

## Prompt for the next chat
"Read HANDOFF. Deploy if I said so; body option: <none / shape words / lighter weights>. Then step 2." Sonnet. *Effort: low.*
