# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds the picture overhaul, Steps A-D).

**Last updated:** 2026-10-13 (thirty-ninth session: Opus 5.5, `claude-opus-5-5` per `get_session` `session_context.model` and `last_served_model`. Picture overhaul Step B.)
**Deployed:** `main` = b42cac1 (the fix round), unchanged. Rollback if ever needed: push `d21c4b3` to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**Branch:** `ccr-490fa8f7-06tf3u` (pushed), and `dev` = the same commit. `dev` is ahead of `main` by Steps A and B (not deployed).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live (`main`): texts, memory, /auto on DeepSeek V4 Flash; voice Sulafat; hearing Gemini; pictures on Runware klein 9B; /nsfw (Off on Cloudflare klein 4B); /studio.
On `dev`, not deployed: **Step A** (the bra-and-thong clothed body, Lenovo + NSFW Unlocked, 6 steps CFG 2, the studio's menus) and **Step B**:
- Short descriptions (no height or weight; "full upper arms and soft body"); CRAFT only on Cloudflare, no "No nudity.", no DRESSED; one expression (a shot's own expression counts), one light (lamp words beat the random light); gazes and moods that drew props, frowns or a second person removed.
- He is the camera: /pic and /look words go through `asCamera` (his name and I/me → the man, her name → she, no "Feras having sex with Reem" in prompts; where he sits goes; his face is "the camera"); POV_CLOTHED on a /pic picture with him that isn't a sex act; every hand gets an owner (`ownHands`).
- No clothes named on /pic or /look → SCENE_WEARING (the bra-and-thong body showed 7/7 without it).
- Cloudflare draws on klein 9B at 768x1344 (~$0.0165 a picture, your pick); Lenovo on Cloudflare is not possible: Workers AI refuses LoRAs on klein 9B ("not supported for finetunes") and ignores a `lora` field.

## Verified this session
- `node tools/check.mjs` 8 of 8; golden plans rewritten, the diff read case by case; new unit rows (hands, camera, POV line) and a scenarios row (her selfie's hands).
- Bench: 25 Runware pictures read at full size (+$0.10283; four 502s billed) and 3 Cloudflare 9B pictures (QUALITY "Step B bench"; `face-candidates` runs/2026-10-13-stepB-bench). Third person stays: first person drew a second woman 2/2 on /look. After the fixes: /look 3/3 only her, dressed; outfits 3/3 as named, no underwear; lamp light only.
- Spend note: Runware $0.103 plus ~8,800 Cloudflare neurons (≤ $0.10, much of it in the free 10,000) is over the $0.15 step budget if Cloudflare billed it.
- Not checked: any of this in the real bot (not deployed); LOOK.PROMPT's new rule on DeepSeek (Workers AI is unreachable from here).

## Waiting on the owner
- Say "deploy" for Steps A + B, or wait for Step C (recommended: Step C writes /look's scene sentence, the part Step B can only patch: one /look still put a phone in her hands; "PoV of spooning" drew no spooning).
- After a deploy, a Telegram test: a clothed selfie, a back view, a nude, riding with "my hands on your hips", `/pic <your name> PoV of spooning with Reem`, /look in a scene, and one picture at /nsfw Off (Cloudflare 9B).

## Next steps (in order; one chat each)
1. **Step C: the hybrid writer** (WORKPLAN "Picture overhaul", Step C): DeepSeek writes only the scene sentence of /look and her own pictures, under Step B's rules (he is never a body in the frame; clothes always named). Opus. *Effort: high.*
2. **Step D: the anatomy check on her own pictures** (vision model, up to 3 tries; add "a second person" to the checklist). Opus designs. *Effort: medium.*
3. **Later**: an anal LoRA that keeps her face; hair drifting to brown highlights; slimmer arms on Cloudflare 9B mirror shots (1/2); old session branches. *Effort: medium.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? (~35 old branches show as "not here" on a shallow clone; left alone again.)
- Old session branches still hold the old pictures in their history. Clear them, or leave them?

## Prompt for the next chat
"Run Step C of the picture overhaul (docs/WORKPLAN.md, end). Read HANDOFF and the Step B bench in docs/QUALITY.md first." *Effort: high.*
