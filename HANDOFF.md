# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Rebuild (2026-10-15)", the current plan, with paste prompts).

**Last updated:** 2026-10-16 (fifty-first session: Opus 5.5, `claude-opus-5-5`, configured and served per get_session; one haiku-worker,
Haiku 5.5 `claude-haiku-5-5` per its transcript, drafted the module classification). Rebuild Step 1 built and deployed. $0 Runware;
about $0.03 OpenRouter spent by mistake (an STT bench run started by a push; CHANGELOG, LESSONS).
**Deployed:** `main` = c652eb3 (Step 1 + the /setup Pictures line), Version ID `649f169d-b85c-44e1-9692-8085f0b3e4ae`, run 38826871125;
`/setup` all ✅. Rollback: push `ba540c9` (Step 0). Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**On `dev`:** c652eb3 plus this records commit; no undeployed code.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live: chat on DeepSeek V4 Flash (Workers AI, 60 s limit),
voice Sulafat, hearing Gemini, pictures Runware klein 9B (Nude/On) and Cloudflare klein 4B (Off). Rebuild plan (WORKPLAN "Rebuild
(2026-10-15)", one chat each): 0 done → **1 done (deployed)** → 2 picture core → 3 bench → 4 reference library → 5 deploy.
Budget $1.00 Runware in all (none spent so far).

## Step 1, built and deployed this session
- `worker.js` is only the entry point (fetch, queue, scheduled); the code is in 38 modules under `src/` (map: `docs/MAP.md`, top).
  Generated files moved to `assets/` (face.js, places.js, mp3.js); studio.js is `src/studio/page.js`.
- CONFIG = `src/config/engine.js` (engine) + `src/persona/reem-en/config.js` (her words, looks, wardrobe, places, MESSAGES, NUDGES,
  English patterns: 85 paths); a key in both throws at start-up. `src/persona/index.js` is the switch point for a second persona.
- `src/gate.js` `can(who, feature, detail)`: all 28 existing rule checks go through it (pictures, runware, draw, nude, acts, ai).
- Per chat: `loadLedger(env, chatId)` + `spend()` keep each chat's share (`byChat`) beside the global caps; `budget.byChat` counts
  outside calls per chat. MAP notes that paid tiers will need per-chat queues.
- The persona's language: `LANGUAGE.FOREIGN_SCRIPT` (live.mjs reads it); sayArabizi/tidySpoken/forSpeech in `reem-en/language.js`.
- Tools: tests load `src/internals.js`; build-panel imports `src/config`; check.mjs and test.yml parse every module; stt-bench reads
  `CONFIG.HEARING.PROMPT` (the old regex likely matched OR_PROMPT); `tools/split/` keeps the split script, manifest and `fix-imports.mjs`.
- The old worker.js header (v4-v11 history) is in CHANGELOG's appendix. Inline dated comments stay where they are.

## Verified this session
- `node tools/check.mjs` 8 of 8, read line by line. Golden picture plans byte-identical (39 cases).
- CONFIG deep-equal to the old one (sorted JSON compare against bcbe21c). The settings panel's DEFAULTS line changed key order only.
- The LIMITS & OOC test reads the moved SYSTEM_PROMPT: `W.SYSTEM_PROMPT` is the persona file's binding, CONFIG uses it, every reply's
  prompt is checked for the text (scenarios).
- New unit rows: `can()` answers as the old functions at every level; per-chat ledger and budget; the barrel covers every module.
- `wrangler deploy --dry-run` bundles (5,259 KiB) and the bundle imports in Node (no load-order error).
- Deployed (owner: "Deploy"): runs 38826585241 and 38826871125 all steps success; `/health` drew and saw; `/setup` all ✅ (Telegram,
  DeepSeek, OpenRouter backup, Sulafat clip, Gemini hearing, ElevenLabs, KV, queue: these ran through the new modules).
- Pre-Step-2 audit: no unresolved names in any module (escope), no duplicate exports (380), D1 `events` 0 rows (nobody wrote yet).
- Not verified: a reply in Telegram, the first `events` rows, the cron fold.

## Waiting on the owner
- Using the bot: the first replies fill `events` (read it with the Cloudflare MCP).
- Before Step 4: the first candidate references to approve in /studio.
- Do not send `/restart` (the `/setup` page says to; it wipes her memory).

## Next steps (in order; one chat each; paste prompts at the end of WORKPLAN "Rebuild")
1. **Read `events`** after a few days of use (slow replies, backup use, errors, `late_ms`) and decide hedging / timeout with the owner.
   Sonnet. *Effort: low.*
2. **Rebuild Step 2:** the picture core + sampler reading and short list (≤ $0.04), in `src/pictures/` (spec, frames, compose, lint,
   loras, refs). Opus. *Effort: high.*
3. **Rebuild Step 3:** bench old vs new and the weight sweep (≤ $0.45). Haiku runs, Opus reads. *Effort: medium.*
4. **Rebuild Step 4:** reference library + Studio References tab (≤ $0.40). Sonnet builds, Opus reviews. *Effort: medium.*
5. **Later:** WORKPLAN issue 12 (WARDROBE "his oversized shirt", BODY_WORDS read only by tests, /setup's stale Pictures line: Step 2);
   studio pictures expire from KV with no Telegram copy; `logSent` stores no real size; Cloudflare bench at /nsfw Off; old session
   branches. Haiku or Sonnet. *Effort: low.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`?
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? (it listed 50+ false branches again; after
  unshallowing only `chat-timeout` is left, a superseded commit)
- Her line on a provider error is "wifi died" for every error; should a 401/402 also ping you once outside the chat?

## Prompt for the next chat
Step 2's paste prompt at the end of `docs/WORKPLAN.md` (Opus, high), or "Read the D1 `events` rows and summarize slow replies, backup use
and errors" (Sonnet, low).
