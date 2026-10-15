# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Fix round 2", the current plan).

**Last updated:** 2026-10-15 (forty-seventh session: Opus 5.5, `claude-opus-5-5`, the configured model; no subagents). Clothed pictures toned down step by step (owner): "voluptuous" and "a full bust" out of the clothed lines, deployed.
**Deployed:** `main` = 3da31c2, run 38683991814, Version ID `d0c88dfb-17e8-4c58-b2e4-875d74498311`. Rollback: push `901cefc` (with "a full bust") or `451f008` (before the clothed steps) to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**On `dev`:** 3da31c2 plus this docs-only records commit.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live: her chat on DeepSeek V4 Flash (Workers AI), 60 s limit (the owner's test passed); voice Sulafat; hearing Gemini; pictures Runware klein 9B (Nude/On) and Cloudflare klein 4B (Off).
Her references: face 13 + v13 bodies only (originals 17-19: black bra and briefs, nude back, nude front with a natural bush); no hairstyle pictures (words only). Every body line opens with her face ("her face exactly image 0's: ... light hazel-green eyes (clearly green, not brown) with black winged eyeliner ..."); SCENE_NIGHT lights her face; BODY_WORDS "narrow shoulders, a full bust, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, soft feminine curves, thick arms, thick thighs, voluptuous" (nude, back, acts, lingerie); BODY_WORDS_CLOTHED "narrow shoulders, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, soft feminine curves, thick arms, thick thighs" (the three clothed lines); MAX_LORAS 2 (nude: Lenovo + NSFW Unlocked; clothed: Lenovo + Anatomy Fixer; an anatomy redraw adds the Anatomy Fixer); BODY_PARTIAL "nude"; `stillWorn` (clothes said to be off aren't kept on).
Known: nude pictures may still be a little slimmer than the body pictures (the LoRA stack; the owner keeps the LoRAs).

## Waiting on the owner
- **Clothed pictures, live without "voluptuous" and "a full bust":** the owner checks in Telegram, then says whether "thick arms" goes next, then "thick thighs" (each out of `PICTURE.BODY_WORDS_CLOTHED` and the three clothed lines). Nude and sex pictures keep BODY_WORDS ("The nude ones are good").
- Do not send `/restart` (the `/setup` page says to; it wipes her memory).

## Verified this session
- Deploys this session, every step success, read in each job log: e0e78ac, d8ae8ff, 451f008, 901cefc (/setup ❌ DeepSeek 8005, passing), 3da31c2 (run 38683991814, Version `d0c88dfb-…`, /health ok, /setup all ✅); `git ls-remote`: main = 3da31c2.
- Live pictures (D1 611, 612, 614) replayed at their seeds: face first + lit at night brought her eyes, eyeliner and brows back; `stillWorn` dropped "pants are off" (4/4).
- slim-bench on v13: two LoRAs = three; "thick arms, thick thighs, voluptuous" a little fuller, never overweight. The clothed steps were not benched: the owner checks them live.
- `node tools/check.mjs` 8 of 8 before each push; golden plans rewritten only after checking every difference.
- Not verified: her pictures in Telegram after 451f008. Likeness never measured, only judged by eye.

## Next steps (in order; one chat each)
1. **Next clothed steps** when the owner says: remove "thick arms" (then "thick thighs") from `PICTURE.BODY_WORDS_CLOTHED` and the same words from the three clothed lines (Cloudflare REFERENCE, RUNWARE.REFERENCE_CLOTHED, REFERENCE_CLOTHED_BACK); golden plans (only clothed cases change); `node tools/check.mjs`; deploy; read the log. Haiku or Sonnet. *Effort: low.*
2. **Writer slip seen live:** "her hands holding the man", "her hands on the man" (D1 610, 611) give him a body; `asCamera`/`ownHands` should catch "on/holding the man". Sonnet. *Effort: low.*
3. **Cloudflare half of the bench** after 00:00 UTC, with the new `body.jpg` at /nsfw Off. Haiku runs it, Opus reads. *Effort: low.*
4. **Later:** BODY_WORDS and the face words built from CONFIG instead of copied into each line; a REFERENCE_CLOSE bench; `/setup`'s stale Pictures line; VISION.BACKUP_MODEL; old session branches. *Effort: medium.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? This session it showed 51 false "work not here" branches on a shallow clone.

## Prompt for the next chat
"Read HANDOFF. Clothed pictures look <fine / still too full>: remove <thick arms / thick thighs / nothing> and deploy." Sonnet. *Effort: low.*
