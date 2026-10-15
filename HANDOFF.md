# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Fix round 2", the current plan).

**Last updated:** 2026-10-15 (forty-seventh session: Opus 5.5, `claude-opus-5-5`, the configured model; no subagents). New face (13) + v12 bodies, BODY_WORDS with "a full bust" and "full arms", hairstyle pictures without the old face: all deployed.
**Deployed:** `main` = d8ae8ff, run 38676885522, Version ID `7a9bd8d1-e8e4-43b9-880d-30686a300715`. Rollback: push `e0e78ac` to `main` (before the body words and the blurred hairstyles) or `2c18113` (the old face). Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**On `dev`:** d8ae8ff plus this docs-only records commit. Nothing waits to be deployed.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live: her chat on DeepSeek V4 Flash (Workers AI), 60 s limit, `LLM.THINK_TOKENS` 700 (the owner's Telegram test passed, 2026-10-15); memory, /auto and the day plan on DeepSeek; OpenRouter DeepSeek as the backup; voice Sulafat; hearing Gemini; pictures Runware klein 9B (Nude/On) and Cloudflare klein 4B (Off) with the owner's face of 2026-10-15 (hazel-green eyes) and the v12 bodies (nude front shaved, nude back, black lace bra + panties; clothed back views on the nude back); `PICTURE.BODY_WORDS` "narrow shoulders, a full bust, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, soft feminine curves"; the Llama picture writer and /look; the Scout anatomy check.
Known: nude pictures come out slimmer than the body picture because of the LoRA stack (Lenovo 1.3 + NSFW Unlocked 0.8 + Anatomy Fixer 0.7); no LoRAs matched the body on two seeds (slim-bench, QUALITY). The owner kept the LoRAs.

## Waiting on the owner
- **Look at her pictures in Telegram** with the new face, the full bust and arms words, and the blurred hairstyles: tell Claude what's off.
- **Slimmer nude pictures:** if they bother you, the tested fix is no LoRAs on nude pictures (not sex acts); your call.
- **Cloudflare half of the body bench** (only matters at /nsfw Off): wait for 00:00 UTC or OK raising `day_neurons`.
- Do not send `/restart` (the `/setup` page says to; it wipes her memory).

## Verified this session
- Two deploys, every step success, `/health` ok and `/setup` all ✅ read in each job log: run 38674596701 (e0e78ac, Version `b38605e3-…`) and run 38676885522 (d8ae8ff, Version `7a9bd8d1-e8e4-43b9-880d-30686a300715`); `git ls-remote`: main = d8ae8ff.
- `node tools/check.mjs` 8 of 8 before each push; golden plans rewritten only after a substitution diff showed just the intended words.
- Runware pictures through the bot's own code, read at full size: v12 check ($0.0234), v13 check ($0.0276, set dropped), slim-bench ($0.1525), hair-check ($0.0476). Likeness not measured.
- The DeepSeek chat at 60 s: the owner's Telegram test passed.
- Not verified: a picture in Telegram after d8ae8ff; /nsfw Off pictures with the new `body.jpg`.

## Next steps (in order; one chat each)
1. **The owner's picture check in Telegram** (new face, full bust/arms, hairstyles): no chat needed until the owner reports. *Effort: low.*
2. **If nude pictures should match the body:** no LoRAs on nude pictures that aren't sex acts (slim-bench V2), golden plans and a 4-picture check. Opus. *Effort: medium.*
3. **Cloudflare half of the bench** after 00:00 UTC (face.yml on a session branch), with the new `body.jpg` at /nsfw Off. Haiku runs it, Opus reads. *Effort: low.*
4. **Later:** BODY_WORDS copied into each body line instead of built from CONFIG; a REFERENCE_CLOSE bench; Step D's edge strays; `/setup`'s stale Pictures line; VISION.BACKUP_MODEL; old session branches; `chat-llama` can be retired. *Effort: medium.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? This session it showed 51 false "work not here" branches on a shallow clone.

## Prompt for the next chat
"Read HANDOFF. Her pictures in Telegram: <what's off>. Fix it; if it's the slimmer nude body, do step 2." Opus. *Effort: medium.*
