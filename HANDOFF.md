# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Fix round 2", the current plan).

**Last updated:** 2026-10-13 (forty-fourth session: Opus 5.5, `claude-opus-5-5` per `get_session` `session_context.model` and `last_served_model`; no subagents). The Opus check of Fix round 2 F1 and F2. No code changed; nothing deployed.
**Deployed:** `main` = 79daf47 (Steps A-D), Version ID `4f30ebfd-6bbe-406b-9fa5-f4003830b6f0`, untouched. Rollback if ever needed: push `b42cac1` to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**Branch:** `ccr-468e83c1-ci51w8` and `dev`: the same commit, pushed at the end of this session.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live (`main`): texts, memory, /auto on DeepSeek V4 Flash (Workers AI); voice Sulafat; hearing Gemini; pictures on Runware klein 9B (Nude/On) and Cloudflare klein 4B (/nsfw Off); the Llama picture writer; the Scout anatomy check.
On `dev`, not deployed (WORKPLAN "Fix round 2"), both checked by Opus this session (verdict in QUALITY):
- **F1, replies (`b13aece`): sound.** `LLM.THINK_TOKENS` 700, `LLM.TIMEOUT_MS` 30 s. Probe 38357963015: no cut or empty answer (8 of 12 finished), but 4 of 12 got nothing in 60 s and finished ones took 4-6 s or 33-48 s. Voice notes stay capped at 360 spoken chars (`forSpeech`). Her replies are broken live until this ships.
- **F2, her body (`ba42045`): right direction, small effect.** `PICTURE.BODY_WORDS` (the owner's list) in every body line; the golden diff is body words only (checked by script). Pictures: a little fuller in 2 of 6 pairs (nude front 101, nude back 202: wider hips, a defined waist, a bigger bottom), barely in the rest; the clothed fronts hardly change; arms and shoulders unchanged; never overweight; faces hold; no new anatomy mistakes (one small stray object by her ear, nude front V1 202).
- **F3, the redraw cost:** the owner's pick; nothing built.

## Waiting on the owner
- **F2 enough, or Option B?** The words make her only a little fuller, and clothed pictures barely change, because the clothed body picture (image 1) sets her build. For a clearly fuller her in clothed pictures, words won't do it: Option B = a fuller clothed body picture (a bench per body, and your pick of each picture). Ship F2 as is either way: it does no harm.
- **Reply latency (F1).** At 30 s about a third of her answers finish in time; the rest go to the OpenRouter backup. Choose: a longer timeout (e.g. 60 s: slower replies, fewer backups), or her chat on Llama 3.3 70B fast (1.3 s median on the writer replays; your model call).
- **F3, the redraw cost:** (a) stop redrawing when a try repeats the try before it's single mistake, (b) `ANATOMY.TRIES` 2, or (c) leave it (~+18%).
- **Cloudflare half of the body bench:** face.yml run 38359468394 was refused by the day cap (`day_neurons` 20000); wait for 00:00 UTC or OK raising it (~500 neurons, ~$0.005).
- **Persona body words:** SYSTEM_PROMPT "HOW YOU LOOK" still says "a full bust, soft, narrow, gently sloping shoulders and soft, full arms" and "rounded hips"; SPICY's frame line (165 cm, 71 kg) kept. Your call.
- A Telegram test after any deploy (replies, body, pictures): the only live check.

## Verified this session
- F1 diff (`workersChat`, CONFIG, unit rows) read; probe log 38357963015 read line by line: Haiku's table is right.
- F2 diff read; golden: old and new identical once the body phrases are mapped to one token (script).
- All 12 Runware bench pictures (`face-candidates` runs/2026-10-13-body-words-runware) read at full size, V0 beside V1 at each seed.
- `node tools/check.mjs` before the push (see the commit). Not verified: no live bot check; REFERENCE_CLOSE (faceless close-ups) now names shoulders and a bottom, not benched; the Cloudflare half.

## Next steps (in order; one chat each)
1. **Deploy F1 (and F2)** when the owner says "deploy": both are on `dev`; F1 fixes her broken replies live. Sonnet. *Effort: low.*
2. **The owner's latency call,** then set `LLM.TIMEOUT_MS` or the model route and probe once. Opus for a route change, Sonnet for a timeout. *Effort: medium.*
3. **F3** once the owner picks: a small build in the anatomy loop (worker.js ~4561-4605) + a unit row. Sonnet. *Effort: medium.*
4. **Option B** if the owner asks: fuller clothed body pictures, benched against the current one at the same seeds; Opus judges. *Effort: high.*
5. **Cloudflare half of the bench** after 00:00 UTC: rerun face.yml on a session branch (push `tools/face/job.json`); Haiku runs it, Opus reads. *Effort: low.*
6. **Later:** `PICTURE.BODY_WORDS` is copied into each body line, not inserted from CONFIG (a panel change wouldn't reach the prompts: build the lines from it); a REFERENCE_CLOSE bench; Step D's edge strays; `/setup`'s stale Pictures line; VISION.BACKUP_MODEL; old session branches. *Effort: medium.*

## Open questions for the owner
- F2 enough or Option B; latency; F3; the Cloudflare day cap (above).
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? It happened again this session: about 50 branches listed as "not here" until the unshallow.

## Prompt for the next chat
If the owner says "deploy": "Deploy `dev` to `main` (F1 and F2 of Fix round 2), read the deploy run, /health and /setup, log it in DECISIONS." Pick Sonnet. *Effort: low.*
