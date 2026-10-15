# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Fix round 2", the current plan).

**Last updated:** 2026-10-15 (forty-seventh session: Opus 5.5, `claude-opus-5-5`, the configured model; no subagents). New face (13) + v12 bodies, BODY_WORDS with "a full bust" and "full arms", hairstyle pictures without the old face: all deployed.
**Deployed:** `main` = d8ae8ff, run 38676885522, Version ID `7a9bd8d1-e8e4-43b9-880d-30686a300715`. Rollback: push `e0e78ac` to `main` (before the body words and the blurred hairstyles) or `2c18113` (the old face). Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**On `dev`:** d8ae8ff + her face named in words in every body line + `stillWorn` (clothes said to be off aren't kept on) + records. Not deployed.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live: her chat on DeepSeek V4 Flash (Workers AI), 60 s limit, `LLM.THINK_TOKENS` 700 (the owner's Telegram test passed, 2026-10-15); memory, /auto and the day plan on DeepSeek; OpenRouter DeepSeek as the backup; voice Sulafat; hearing Gemini; pictures Runware klein 9B (Nude/On) and Cloudflare klein 4B (Off) with the owner's face of 2026-10-15 (hazel-green eyes) and the v12 bodies (nude front shaved, nude back, black lace bra + panties; clothed back views on the nude back); `PICTURE.BODY_WORDS` "narrow shoulders, a full bust, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, soft feminine curves"; the Llama picture writer and /look; the Scout anatomy check.
Known: nude pictures come out slimmer than the body picture because of the LoRA stack (Lenovo 1.3 + NSFW Unlocked 0.8 + Anatomy Fixer 0.7); no LoRAs matched the body on two seeds (slim-bench, QUALITY). The owner kept the LoRAs.

## Waiting on the owner
- **Deploy the face words and the clothes-off fix?** Say "deploy" (`dev` is ahead of `main`).
- **Partly naked acts:** keep the lace-bra body as image 1 (BODY_PARTIAL "clothed": its bra replaces the named top) or the nude body ("nude": the named top drawn, 2/2)? Your call.
- **Slimmer nude pictures:** the LoRA stack (slim-bench); the tested fix is no LoRAs on nude pictures that aren't sex acts. Your call.
- Do not send `/restart` (the `/setup` page says to; it wipes her memory).

## Verified this session
- Two deploys, every step success, `/health` ok and `/setup` all ✅ read in each job log: run 38674596701 (e0e78ac, Version `b38605e3-…`) and run 38676885522 (d8ae8ff, Version `7a9bd8d1-e8e4-43b9-880d-30686a300715`); `git ls-remote`: main = d8ae8ff.
- `node tools/check.mjs` 8 of 8 before each push; golden plans rewritten only after a substitution diff showed just the intended words.
- Runware pictures through the bot's own code, read at full size: v12 check ($0.0234), v13 check ($0.0276, set dropped), slim-bench ($0.1525), hair-check ($0.0476). Likeness not measured.
- The DeepSeek chat at 60 s: the owner's Telegram test passed.
- The owner's live pictures (D1 611, 612, 614) replayed at their seeds: the face lost at a distance comes back with face words (2/2 twice); "pants are off" no longer keeps the pants (4/4). `node tools/check.mjs` 8 of 8.
- Not verified: a picture in Telegram after d8ae8ff; /nsfw Off pictures with the new `body.jpg`.

## Next steps (in order; one chat each)
1. **Deploy** the face words and `stillWorn` when the owner says "deploy"; then the owner looks at her pictures in Telegram. Haiku. *Effort: low.*
2. **BODY_PARTIAL and the nude LoRAs** once the owner picks (golden plans, a 4-picture check each). Opus. *Effort: medium.*
3. **Writer slip seen live:** "her hands holding the man", "her hands on the man" (D1 610, 611) give him a body; `asCamera`/`ownHands` should catch "on/holding the man". Sonnet. *Effort: low.*
4. **Cloudflare half of the bench** after 00:00 UTC, with the new `body.jpg` at /nsfw Off. Haiku runs it, Opus reads. *Effort: low.*
5. **Later:** BODY_WORDS and the face sentence built from CONFIG instead of copied into each line; a REFERENCE_CLOSE bench; `/setup`'s stale Pictures line; VISION.BACKUP_MODEL; old session branches. *Effort: medium.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? This session it showed 51 false "work not here" branches on a shallow clone.

## Prompt for the next chat
"Read HANDOFF. Deploy if I said so; BODY_PARTIAL: <clothed / nude>; nude LoRAs: <keep / none>. Then step 3." Opus. *Effort: medium.*
