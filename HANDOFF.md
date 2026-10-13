# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds the picture overhaul, Steps A-D).

**Last updated:** 2026-10-13 (thirty-eighth session: Opus 5.5, `claude-opus-5-5` per `get_session` `session_context.model` and `last_served_model`. The picture overhaul: plan and Step A.)
**Deployed:** `main` = b42cac1 (the fix round), unchanged. Rollback if ever needed: push `d21c4b3` to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**Branch:** `ccr-b9bbc3c2-9fs3ou` (pushed), and `dev` = the same commit. `dev` is ahead of `main` by Step A (not deployed).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live (`main`): texts, memory, /auto on DeepSeek V4 Flash; voice Sulafat; hearing Gemini; pictures on Runware klein 9B; /nsfw (Off on Cloudflare klein); /studio.
On `dev`, not deployed: **picture overhaul Step A** (owner's rules, DECISIONS 2026-10-12 and 2026-10-13):
- Clothed pictures use his bra-and-thong pictures as image 1 (front, and the back one for back views); the outfit pictures are retired (outfits are words); "full upper arms and soft body" in her descriptions.
- LoRAs: Lenovo UltraReal 1.3 on every picture, NSFW Unlocked 0.8 on nude and sex pictures, Anatomy Fixer 0.7 on every picture that is not a sex act, at most 3; no act, hands, flash or doggy-anal LoRA. 6 steps, CFG 2 (same cost).
- /studio: Face (one), Body (four bodies), Hair (hair only); the editor starts from the bot's sampler and Lenovo; Compose at Off loads the Cloudflare prompt (it said "Runware can't draw" because an Off log row's "edit" set the level to Off).

## Verified this session
- `node tools/check.mjs` 8 of 8; the golden plans' diff read case by case; `tools/test/studio-browser.mjs` 10/10; the editor driven in Chromium (menus, typed words, Compose at Off and On).
- Bench: 31 pictures read at full size, $0.093 (QUALITY "Step A bench"; `face-candidates` runs/2026-10-13-stepA-bench): outfits 10/10 with no underwear showing; NSFW Unlocked alone drew riding 4/4, missionary 4/4, blowjob 2/2, doggy 2/2; POV hand made no difference; POV Doggy Anal changed her face 4/4.
- Not checked: any of this in the real bot (not deployed).

## Waiting on the owner
- Say "deploy" when you want Step A live, or wait for Step B (recommended: Step B fixes the extra man and the prompts; Step A alone changes the LoRAs and bodies).
- After a deploy, a Telegram test: a clothed selfie, a back view ("belfie in jeans"), a nude, riding, doggy anal; and /studio: Body and Hair menus, Compose with new words at On and Off.

## Next steps (in order; one chat each)
1. **Step B: base prompts, he is the camera, possessive hands, Cloudflare klein 9B** (WORKPLAN "Picture overhaul", Step B). Opus. *Effort: high.*
2. **Step C: the hybrid writer** (DeepSeek writes the scene sentence of /look and her own pictures). Opus. *Effort: high.*
3. **Step D: the anatomy check on her own pictures** (vision model, up to 3 tries). Opus designs. *Effort: medium.*
4. **Later**: an anal LoRA that keeps her face (none now: NSFW Unlocked drew doggy anal 1/1, prone/missionary/reverse cowgirl anal drew vaginal in Step 6 without a LoRA); hair drifting to brown highlights; old session branches. *Effort: medium.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? (~35 old branches show as "not here" on a shallow clone; this session left them alone.)
- Old session branches still hold the old pictures in their history. Clear them, or leave them?

## Prompt for the next chat
"Run Step B of the picture overhaul (docs/WORKPLAN.md, end). Read HANDOFF and the Step A bench in docs/QUALITY.md first." *Effort: high.*
