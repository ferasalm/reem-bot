# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Fix round 2", the current plan).

**Last updated:** 2026-10-13 (forty-third session: Haiku 5.5, per `get_session` `session_context.model` and `last_served_model`; no subagents). Built Fix round 2 F1 and F2, the cf-probe and the Runware bench. Nothing deployed.
**Deployed:** `main` = 79daf47 (Steps A-D), Version ID `4f30ebfd-6bbe-406b-9fa5-f4003830b6f0`, untouched this session. Rollback if ever needed: push `b42cac1` to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**Branch:** `ccr-6aa4a139-eewbq5` (pushed) and `dev`: the same commit, pushed at the end of this session.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live (`main`): texts, memory, /auto on DeepSeek V4 Flash (Workers AI); voice Sulafat; hearing Gemini; pictures on Runware klein 9B (Nude/On) and Cloudflare klein 4B (/nsfw Off); the Llama picture writer; the Scout anatomy check.
On `dev`, not deployed (WORKPLAN "Fix round 2"):
- **F1, replies (`b13aece`):** `LLM.THINK_TOKENS` 700 on chat replies (`max_tokens` = the reply's length + 700; tasks keep +1500), `LLM.TIMEOUT_MS` 20 → 30 s. The cut and empty replies are gone in the probe; the latency is not (below).
- **F2, her body (`ba42045`):** `PICTURE.BODY_WORDS` (the owner's list) in the 11 body lines; the belly and hourglass ban stays. Pictures benched, not judged.
- **F3, redraw cost:** still the owner's pick; nothing built.

## Waiting on the owner
- **Reply latency (F1).** Probe run 38357963015: 8 of 12 answers finished with content, none cut or empty, but 4 of 12 timed out at 60 s and the finished ones took 4-6 s or 33-48 s. At 30 s only about 4 in 12 would finish in time; the rest fall to the OpenRouter backup. Choose a longer timeout (longer waits per reply), or her chat on Llama 3.3 70B fast (1.3 s median on the writer replays; your model call). Not tuned here.
- **F3, the redraw cost:** (a) stop redrawing when a try has the same single mistake as the try before it, (b) `ANATOMY.TRIES` 2, or (c) leave it.
- **Cloudflare half of the body bench:** face.yml run 38359468394 was refused by the job's day cap before any draw (the account had used 61,712 neurons today; `day_neurons` 20000). Wait until 00:00 UTC, or say to raise it (about 500 neurons, ~$0.005).
- **Persona body words:** SYSTEM_PROMPT "HOW YOU LOOK" still says "a full bust, soft, narrow, gently sloping shoulders and soft, full arms" and "rounded hips" (F2 left it, as the plan says). SPICY's frame line (165 cm, 71 kg, "not slim and not obese") was kept. Your call.
- A Telegram test after any deploy (replies, body, pictures): the only live check.

## Verified this session
- `node tools/check.mjs` 8 of 8 at `ba42045` (F2) and again at `b1420e1` before its push.
- cf-probe run 38357963015: all 12 answers read in the job log (table in QUALITY).
- Runware bench, 12 pictures (`face-candidates` runs/2026-10-13-body-words-runware, `008041c`): per run the V0 and V1 prompts differ only in the body words (checked by script). Spend $0.0495 by the Runware usage delta (balance 12.34433 → 12.29571), $0.0369 by the script's own sum (three 502s, all on V1, retried with the same seed and prompt).
- Golden: 39 of 300 picture-plan strings changed, all only in the body words (string by string, by script).
- Not verified: no picture judged (Opus and the owner do that at full size); no live bot check; `main` not touched.

## Next steps (in order; one chat each)
1. **Opus check of F1 and F2:** the "Opus check prompt" in WORKPLAN, plus the probe's timing and the 12 Runware pictures at full size, each pair at the same seed (today vs BODY_WORDS). *Effort: medium.*
2. **Cloudflare half of the bench** after 00:00 UTC (or with the owner's OK on `day_neurons`): run face.yml on this branch again (push `tools/face/job.json` again, or run its workflow), then read the 4 pictures at full size beside the Runware ones. Haiku runs it; Opus reads. *Effort: low.*
3. **The owner's latency call (above),** then Opus sets `LLM.TIMEOUT_MS` or the model route. *Effort: medium.*
4. **Deploy** when the owner says "deploy": F1 can go alone first (her replies are still broken live until then), then F2. Sonnet. *Effort: low.*
5. **Later:** Step D's edge strays; `/setup`'s stale Pictures line; VISION.BACKUP_MODEL (Gemma 3 12B "not allowed"); old session branches. *Effort: medium.*

## Open questions for the owner
- Reply latency and F3; the Cloudflare day cap (above).
- Model names in records: the 2026-10-11 DECISIONS entry asks for the raw model ID next to the name, but this session's instructions forbid model identifiers in pushed files. Pushed records (HANDOFF, CHANGELOG, QUALITY, commits) name the model "Haiku 5.5" only; the raw ID is in the chat. Which rule wins?
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? It happened again: the shallow clone listed about 50 branches as "not here"; after the unshallow, none.

## Prompt for the next chat
Paste the "Opus check prompt" of WORKPLAN "Fix round 2" (pick Opus, effort medium) and add: "The probe is run 38357963015 (QUALITY); the Runware pictures are on `face-candidates` runs/2026-10-13-body-words-runware (`008041c`)." *Effort: medium.*
