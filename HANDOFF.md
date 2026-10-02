# HANDOFF — reem-bot

**This file is the single source of truth.** It lives on the shared branch (see "Branches"). If another branch's
HANDOFF.md says something different, the shared branch wins. Every session starts with the sync report
(`node tools/sync-check.mjs`, run automatically by `.claude/settings.json`): if it lists other branches with work
that isn't here, stop and ask the owner before building anything. Session rules are in `CLAUDE.md`.

## Status (2026-10-02)
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (free plan).
- **Live (deployed from `main`)**: v8 + v9 (PR #5), on **Lunaris 8B**. Verified 2026-10-01 by reading the deployed
  Worker's code with the Cloudflare MCP. Not checked: a `CONFIG_OVERRIDES` dashboard variable could change the
  model without a deploy; `/setup` shows which model answers.
- **Integrated v10 (not deployed)**: branch `ccr-1eb562e9-ds09eq`. It merges all three v10 lines that were built
  in parallel on 2026-10-01 (see "Incident"): DeepSeek V4 Flash (`ccr-b7869b5d-d7yudi`, bench branch
  `claude/reem-llm-model-comparison-f27xor`), format enforced in code + scenario tests + CI (`ccr-75e7610d-6zkheu`),
  and commands/story editing/looks (`ccr-b51a9ebf-j34yp9`, PR #6). Those branches are superseded by this one.
- **Verified 2026-10-02** (Tests run 36944353910, commit 0feb5c4): sync + mocked green; `[live]` on the integrated
  v10: all 36 calls served by DeepSeek V4 Flash @ Novita, nothing broken reached him, voice note when asked 3/3,
  OOC answered as the writer 3/3, under-16 safeguard held 6/6 (one REVIEW was "go to bed", a false alarm since fixed).
  Seen while reading: Basbousa is "he" in some replies and "she" in others (persona gives no pronoun); one scene
  called him "him" instead of "you". Tuning items, not format failures.
- **Open, owner's call**: where the shared branch lives from now on (see "Branches"), then merge/deploy v10.

## Branches
- `main` = what's deployed (every push to `main` deploys via `.github/workflows/deploy.yml`).
- **Shared branch** = where every session starts and where its finished work lands. Proposed: `dev`, set as the
  GitHub default branch so new sessions clone it (owner decides; until then `tools/sync-check.mjs` uses `main`).
- Session branches (`ccr-…`, `claude/…`) are temporary. When work is done it goes to the shared branch (only with
  the owner's standing OK, written in `CLAUDE.md`), and the session branch is listed in `tools/retired-branches.txt`
  until the owner deletes it.

## Decision log (owner's decisions; newest first; never drop or reword an entry, mark it superseded instead)
- 2026-10-02 — **Resync**: one v10 combining DeepSeek + format guards + PR #6 features. Owner: "Yes" to DeepSeek
  still being the model, "Yes" to PR #6's features being part of v10.
- 2026-10-01 (~22:00, after the model bench) — **Chat model: `deepseek/deepseek-v4-flash`**, reasoning off,
  providers Novita → Baidu → Relace → StreamLake, never Azure, Alibaba, AtlasCloud or DeepInfra,
  `allow_fallbacks: false`. Memory on DeepSeek too. **Lunaris 8B is only the backup** (`LLM.BACKUP_MODEL`, one try
  when DeepSeek is down). Sampling unchanged (0.95 / min_p 0.1 / 1.05; Novita ignores min_p). Prompt fixes picked:
  (b) [voice] first + tags only in voice notes, (c) scenes in third person, (d) the act itself when he invites it,
  as NUDGES (SYSTEM_PROMPT untouched by that session). Fix (a) "no *actions* in texts" as a nudge was **not**
  picked (texts are still kept free of *actions* by code, from the format-guard session: confirm if unsure).
  Bench results: `tools/model-bench/FINDINGS.md`. *Supersedes "The AI model stays Lunaris 8B".*
- 2026-10-01 — **Never tone down explicitness**: prompt edits may only make INTIMACY more explicit; code guards fix
  format only, never content.
- 2026-10-01 — v10 commands (PR #6): /auto = draft with ✅ Send / 🔄 Another buttons; editing = reply-commands (no
  buttons under her messages); Basbousa = fluffy golden-brown tabby.
- 2026-10-01 — Voice: owner picked design A1, saved in ElevenLabs as "Reem" (`8SAEKgpGuII5UtUnpuYN`); eleven_v3
  gets only `stability` 0.5 (Natural). Real clip checked: tags performed, not read; no Arabizi digit spoken.
- Standing rules (from v8):
  - **`LIMITS & OOC` in SYSTEM_PROMPT stays word for word** (tests check it): never loosen or tighten it.
    Adult themes stay open and may turn explicit naturally.
  - No photo vision (it would need a second model). No deliberate typos. Emoji reactions: yes. Expressive voice
    (eleven_v3): strongly preferred.
  - Arabizi (ya3ni, 7abibi) is fine in texts, but **no digit may ever be spoken** in voice notes.
  - Don't merge to `main`, open a PR or deploy unless the owner asks. The owner decides models; Claude only advises.
  - Keep every tunable in `CONFIG` (a unit test checks each has a settings panel field). After any CONFIG change,
    run `node tools/build-panel.mjs` (CI checks the panel matches).
  - The owner is on Android with no computer: Claude runs every test itself (CI, `[live]` commits) and never asks
    the owner to run commands.
- ~~2026-10-01 (v8) — The AI model stays `sao10k/l3-lunaris-8b`.~~ Superseded by the DeepSeek decision above.

## Incident 2026-10-01 (why the sync check exists)
Three sessions built "v10" at the same time from different starting points: PR #6 (Lunaris, from `main`), the
DeepSeek switch (from the bench branch), and the format guards (from `main`, whose HANDOFF was stale and still said
"model stays Lunaris"). None knew about the others, each HANDOFF restated its own rules, and the format-guard
session re-asserted "model stays Lunaris" an hour after the owner chose DeepSeek. Its live check also reported
"Nothing broken reached him" while bracket cues, "(or)", garbled text and in-character OOC answers went out.
Fixes: one integrated branch; this file as the only source of truth with a dated decision log; `CLAUDE.md` loaded
by every session; `tools/sync-check.mjs` at session start and in CI; a stricter live check; e2e fails on any false
check; scenario rows for every slip seen.

## File map
- `worker.js`: everything. SETTINGS on top (`SYSTEM_PROMPT`, `INTRO_MESSAGE`, `MEMORY_PROMPT`, `CONFIG`), then code:
  - entry points: `fetch` (/setup, /webhook → queue; answers button taps at once), `queue`, `scheduled`
    (cron → `proactiveChat` → queue task)
  - `handleBatch`: messages, `edited_message` (`onEdited`), `callback_query` (`onButton`), commands
    (`parseCommand` → `runCommand`). Story commands (`STORY_ACTIONS`) first flush pending messages through `reply`.
  - commands: `nameCommand`, `aboutCommand` (`hisName`, `aboutHim`), `autoCommand`/`autoDraft`/`cleanDraft`/
    `draftHtml`, `retry`, `rewind`, `editHers`; helpers `findPart`, `cutAfter`, `deleteIds`, `clearReactions`,
    `answerAgain`, `failed`
  - `reply` (builds `heard` + his `parts`, `noticeTime`) → **`respond`**: `isOoc`, `sceneOf`, `replyMode`
    (text/voice/scene; OOC always text), `think`, wait, **`shapeReply`**, reaction, texts then voice note,
    `saveTurn` after delivery with message ids. `textFirst` (`proactiveHeard`) also uses `respond`.
  - `think`: system prompt + nudges (memory, ABOUT_HIM/HIS_NAME, TIME, TOGETHER/APART, OOC, VOICE_TAGS for texts
    while apart, SEVERAL_MESSAGES, REACT, TEXTURE + TEXTURE_APART, VARY_OPENING); `fitHistory`
    (`LLM.CONTEXT_TOKENS`); `formatNudge` (NUDGES.FORMAT_*) as a system message after the chat; `LLM.MAX_TOKENS`
    per mode. One retry when the shaped reply is empty (RETRY_EMPTY, or RETRY_OOC), repeated/same opening (RETRY),
    or needed narration cut (`repaired` → RETRY_FORMAT); the retry is taken only if sendable and clean.
  - **`shapeReply(raw, {scene, mode, ooc, canReact, history, heard, lastResort})`**: the single place format is
    enforced. `scrubModel` (chat tokens, his lines, {{char}}, OOC/Note asides, a second version after "(or)") →
    `takeReaction` → OOC (plain words; acting only → retry, last resort the scene) / together (`dropCues`,
    `asDialogue` after his action, `markScene` italics line by line) / apart voice (when [voice] or `mode` voice:
    narration before it dropped, typed words → texts first, `emotesToTags`, `stageToTags`) / apart text
    (`texting`: `isNarration` lines, `dropActions`, `dropCues`, `unnarrate` when `looksNarrated`; narration-only →
    asked again, last resort a scene). Returns `{kind, texts, voiceText, spoken, stored, reaction, repeated,
    narrationOnly, repaired}`.
  - `callModel` (OpenRouter via `openRouterBody`: `LLM.PROVIDER` + `LLM.REASONING` only with `LLM.MODEL`; `trimCut`
    → `trimUnfinished`; `backup` → one try with `LLM.BACKUP_MODEL`, messages cut by `fitMessages` to
    `LLM.BACKUP_CONTEXT_TOKENS`) → `askModel`; `remember` (memory folding)
  - timing: `noticeTime`, `typingTime`, `act`, `sendBubbles` (returns `[{id, text}]`)
  - voice: `bodyOf`/`clean`, `forSpeech` → `tidySpoken` → `sayArabizi`, `tts` (`voiceSettings`), `sendVoice`
    (returns `{delivered, id, error}`), `voiceFailed` (KV `voice_error`, shown on /setup)
  - audio tags: `isV3`, `audioTagsOn`, `audioTagRe`, `isAudioTag`, `stripAudioTags`
  - overrides: `applyOverrides`/`mergeSettings` (`CONFIG_OVERRIDES` env var; PRONUNCIATIONS, ARABIZI_DIGITS,
    STAGE_DIRECTIONS and arrays replaced whole; SAMPLING, PROVIDER, REASONING accept new OpenRouter keys)
  - KV keys: `s:<chat>` settings (moreVoice, proactive {day,count}, name, about, tgName), `h:<chat>` history
    `{role, content, at, parts: [{id, text}], proactive?, ooc?, react?, reactTo?}`, `m:` notes, `b:` backlog,
    `a:<chat>` /auto draft `{id, text, idea}`, `owner`, `seen`, `voice_error`
- `wrangler.toml`: KV `REEM_KV`, queue `reem-inbox` (consumer: max concurrency 1, retries 0), cron `*/15 * * * *`.
- `tools/settings-panel.html`: offline settings UI. Field schema in `SECTIONS`; types: text, textarea, long, list,
  number, ms, range, bool, select, commands, map, groups, schedule. `tools/build-panel.mjs` rewrites its DEFAULTS.
- `tools/sync-check.mjs` + `tools/retired-branches.txt`: the sync report (session start, CI `sync` job).
- Tests (`tools/test/`): `unit.mjs`; `scenarios.mjs` (model outputs → delivery table, properties, scene state,
  mocked conversations; add a row for every new slip seen); `e2e.mjs` (whole flows, exits 1 on any false check);
  `live.mjs` (real model, see Testing); `load-worker.mjs` (exports internals; add new ones to `EXPORTS`).
- `tools/model-bench/` + `.github/workflows/model-bench.yml`: the budget-capped model bench (results never
  committed; summaries in FINDINGS.md). Runs only when that workflow file changes.

## Gotchas
- History before v10 has no `parts` (can't be /edit-ed or /rewind-ed: NOT_FOUND); before v8 no `at` either.
  Rewind/edit only reach the verbatim history; older chat is in `m:` notes (TOO_OLD).
- Telegram deletes bot messages only for 48 h (`DELETE_FAILED`); history is cut anyway.
- After deploying v10: open `/setup` once (Telegram must start sending `edited_message` and `callback_query`; the
  command menu updates), then `/restart` or `/rewind` to a clean point, since old narrated replies in history pull
  the model back to that style. A `VOICE_ID` Worker secret, if set, overrides `VOICE.ID`: remove it.
- Cron runs (every 15 min) must finish within 30 s, so `scheduled` only queues a task.
- `clean()` strips `[...]` at line starts except allowed audio tags; `dropCues()` strips them anywhere (keeping
  allowed tags in voice notes); `tidySpoken()` strips every other `[...]` before TTS.
- eleven_v3: no `<break>` (lines joined with "..."), stability 0/0.5/1 only, speaker boost not sent. Tags only when
  `VOICE.MODEL` starts with `eleven_v3` and `AUDIO_TAGS` is on.
- `texting()` keeps `*word*` mid-sentence as emphasis; her own name in a text or voice note is narration (PR #6:
  texts are "I"), but an OOC answer may name her.
- Reactions only when apart, never OOC or when she texts first; stored on her entry (`react`, `reactTo`) so /retry,
  /rewind and his edits clear them.
- Free plan: at most 50 outside calls per run (`budget`, `SUBREQUEST_RESERVE`); about 1000 KV writes per day.
  A reply can take up to 4 OpenRouter calls (2 attempts + backup, then one retry).
- Context: `LLM.CONTEXT_TOKENS` 32768 for DeepSeek; the Lunaris backup gets older chat cut to 8192
  (`fitMessages`). History folds into notes at 40 messages, keeping 24 (PR #6 had cut this to 24/14 for Lunaris).
- Tests: `CONFIG_OVERRIDES` is cached once per run, so tests set `W.CONFIG` directly. Voice chances are 0 in e2e and
  scenarios except where a test asks. e2e `herPrompts()`/`sys()` read her prompts (not memory or /auto).
- Telegram reactions accept only its fixed emoji list (❤ without FE0F, 🤣 rather than 😂).
- Panel textareas: a leading "\n" is added on purpose (browsers drop the first newline).
- Claude's cloud container can't reach openrouter.ai; `gh run download` is blocked. Live checks and the bench run on
  GitHub Actions; read their logs with the GitHub MCP (`actions_list` / `get_job_logs`).
- The ElevenLabs MCP needs any voice description and sample line to come from the owner. Transcribing a TTS node
  in a flow only echoes its prompt: upload the MP3 as an asset to really transcribe it.

## Testing
- Every push: `.github/workflows/test.yml` runs `sync` (sync check) and `mocked` (`node --check`, panel matches
  CONFIG, unit, scenarios, e2e). Free.
- A commit whose message contains `[live]` also runs `live.mjs` against the real model (repository secret
  `OPENROUTER_API_KEY`, already set; a few cents). It pins `LLM.MODEL` (backup off), prints the model and provider
  that served every call, and fails if anything broken reaches him: wrong kind, digit spoken, [brackets], "(or)",
  non-Latin script, *actions* or her name in a text, "Voice" labels. "REVIEW" lines (safeguard, fade-outs, first
  person in a scene) need a human read of every reply.
- Locally: `node tools/build-panel.mjs && node --check worker.js && node tools/test/unit.mjs &&
  node tools/test/scenarios.mjs && node tools/test/e2e.mjs > /dev/null`.

## Next steps
1. Owner: decide the shared branch (proposed `dev` as GitHub default) and whether sessions may push their finished
   work to it; retire the superseded branches; close PR #6 (superseded).
2. Read the `[live]` check of the integrated v10 on DeepSeek (see the latest Tests run) and tune from evidence:
   NUDGES, TEXTURE, `LLM.MAX_TOKENS`, `VOICE.CHANCE*`, never LIMITS & OOC, never toning down explicitness.
3. Owner: merge/deploy v10. Then `/setup` (should show "Model answered (via Novita)" and the Lunaris backup line),
   `/restart`, and ask her for a voice note.
4. Later (owner's plan from the format-guard session): ElevenLabs v4 instead of v3, after confirming its model ID
   and what it supports; code touchpoints are all keyed on `isV3()`.

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md, then read HANDOFF.md and the sync report before anything else; if the report
> lists other branches with work, stop and ask me. <describe the next change>. Finish with the checks in HANDOFF.md,
> commit and push, and update HANDOFF.md (status, decision log).
