# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Rebuild (2026-10-15)", the current plan, with paste prompts).

**Last updated:** 2026-10-15 (fiftieth session: Sonnet 5.5, `claude-sonnet-5-5`, configured and served per get_session; no subagents).
Rebuild Step 0 built on `dev`, $0 spent (no pictures drawn).
**Deployed:** `main` = ba540c9 (Step 0), Version ID `a6a82381-242a-432a-837f-5b352d0cf787`, run 38822659565; `/health` ok, `/setup` all ✅. Rollback: push `72962ba`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**On `dev`:** ba540c9 plus this records commit; no undeployed code.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live: chat on DeepSeek V4 Flash (Workers AI, 60 s limit),
voice Sulafat, hearing Gemini, pictures Runware klein 9B (Nude/On) and Cloudflare klein 4B (Off). The rebuild plan (WORKPLAN
"Rebuild (2026-10-15)", steps 0-5, one chat each): **0 done (dev)** → 1 split into `src/` modules → 2 picture core → 3 bench →
4 reference library + Studio References tab → 5 deploy. Budget $1.00 Runware in all (none spent so far).

## Step 0, built and deployed this session
- D1 `events` table (one row per reply, command, failure and fold: outcome, error, model calls, backup used, ms, model_ms, `late_ms`).
  It is created on the first write after a deploy; read it with `SELECT kind, outcome, error, ms, late_ms FROM events ORDER BY id DESC`.
- Every update and every command is guarded: a throw gives her "wifi died" line and an event row; 401/402 too (the "(setup) ⚠️"
  notice is gone; the real error is in `events`). The other updates of the batch are still answered.
- Budget: the four double `budget.used++` removed; `SUBREQUEST_LIMIT` 10,000 (Workers Paid, Cloudflare docs 2026-02-11).
- Memory fold: `saveTurn` queues the folded messages in `b:<chat>`; the 15-minute cron folds them (`foldWaiting`; Cron Triggers get
  15 min wall time). Her notes can lag up to 15 minutes behind a fold.
- Pictures: `upload_photo` every 4.5 s while drawing; `RUNWARE.TRANSIENT_RETRIES` 1 (one more Runware try at Nude/On on a 5xx or
  timeout only; 400s are not retried).
- Studio: result cards stack (picture above text); Log thumbnails keep each picture's shape (`aspect-ratio`, `object-fit: contain`).
- D1 had no rows on 2026-10-14: most likely a quiet day (writes worked 10-13 and 10-15 with the same code; no deploy or commit on
  10-14). Can't be proven from D1; the events log settles it from now on.
- Unchanged by design: chat model, 60 s timeout, no hedging (measure first: read `events` after a few days).

## Waiting on the owner
- Nothing for Step 0 except using the bot: the first replies fill `events` (read it with the Cloudflare MCP).
- Before Step 4: the first candidate references to approve in /studio.
- Do not send `/restart` (the `/setup` page says to; it wipes her memory).

## Verified this session
- `node tools/check.mjs` 8 of 8, read line by line. New rows: unit (budget counts once, 10,000 limit, the 5xx/400/503/0-retry cases, events
  row for a 402, no "(setup)"), scenarios (a throwing command, a throwing update among three, a 402, answers again after it), e2e (the
  fold waits, then the cron folds it), golden (one case changed: a third Runware try on 5xx).
- `tools/test/studio-cards.mjs` in Chromium at 390 px (1:1, 9:16, 16:9 cards and Log rows): 18 of 18; the same script fails 15 checks
  on the old CSS. Screenshots read. `whileDrawing` checked by hand (2 pulses in 9.8 s, stops when done).
- Deployed (owner: "Deploy"): run 38822659565 all steps success; `/health` drew and saw; `/setup` all ✅; `events` table exists with 0 rows.
- Not verified: a reply in Telegram, the first `events` rows, the cron fold, `upload_photo` live.

## Next steps (in order; one chat each; paste prompts at the end of WORKPLAN "Rebuild")
1. **Read `events`** after a few days of use (slow replies, backup use, errors, `late_ms`) and decide hedging / timeout with the owner. Sonnet. *Effort: low.*
2. **Rebuild Step 1:** the module split, golden plans byte-identical. Opus (haiku-worker for the classification). *Effort: high.*
3. **Rebuild Step 2:** the picture core + sampler reading and short list (≤ $0.04). Opus. *Effort: high.*
4. **Rebuild Step 3:** bench old vs new and the weight sweep (≤ $0.45). Haiku runs, Opus reads. *Effort: medium.*
5. **Rebuild Step 4:** reference library + Studio References tab (≤ $0.40). Sonnet builds, Opus reviews. *Effort: medium.*
6. **Later:** studio pictures expire from KV with no Telegram copy and `logSent` stores no real size (WORKPLAN issue 6); the Writer
   slip "her hands on the man"; Cloudflare bench at /nsfw Off; `/setup`'s stale Pictures line; old session branches. *Effort: low.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? (false "work not here" branches again; the
  only real one left is `chat-timeout`, a superseded commit)
- Should her line on a provider error stay "wifi died" for every error (done as the plan said), or should a 401/402 also ping you once
  outside the chat (e.g. a Telegram notice to the owner only)? You no longer see "(setup)" in the chat.

## Prompt for the next chat
"Read the D1 `events` rows and summarize slow replies, backup use and errors." Or Step 1's paste prompt at the end of `docs/WORKPLAN.md`.
