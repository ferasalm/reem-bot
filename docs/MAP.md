# Map

Read before any code change: where each thing lives and how to check it. Not loaded at session start.
`tools/doc-check.mjs` fails if a source file isn't named here.

## File map
- `worker.js`: everything. SETTINGS on top (`SYSTEM_PROMPT`, `INTRO_MESSAGE`, `MEMORY_PROMPT`, `CONFIG`), then code:
  - entry points: `fetch` (/setup, /webhook → queue; answers button taps and `isQuickCommand` commands at once), `queue`, `scheduled`
    (cron → `proactiveChat` → queue task)
  - `handleBatch`: messages, `edited_message` (`onEdited`), `callback_query` (`onButton`), commands
    (`parseCommand` → `runCommand`). Story commands (`STORY_ACTIONS`) first flush pending messages through `reply`.
  - commands: `nameCommand`, `aboutCommand` (`hisName`, `aboutHim`), `autoCommand`/`autoDraft`/`cleanDraft`/
    `draftHtml`, `retry`, `rewind`, `editHers`; helpers `findPart`, `cutAfter`, `deleteIds`, `clearReactions`,
    `answerAgain`, `failed`
  - `reply` (builds `heard` + his `parts`, `noticeTime`) → **`respond`**: `isOoc`, `sceneOf`, `replyMode`
    (text/voice/scene; OOC always text; in a scene `asksToHear`/SCENE_CHANCE adds a `sayScene` clip), `think`, wait, **`shapeReply`**, reaction, texts then voice note,
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
  - pictures v3: `planShot` (`pickTier`, `chatHeat`, `shotNamed`, `pickShot`), `selfieSubject` (her marker →
    {shot, words, doing}), `selfiePicture` → `composePicture` (template + slots + phone rule, `{who}` filled by
    `drawPicture`); 3030 → `aiFiltered`, one tamer try in `startPicture`
  - fixed places (2026-10-03): `PICTURE.LOCATIONS`; `@key` in SHOTS/PLACES → NAME; `locationOf` (her words, a scene);
    `composePicture` returns `location` and a `{room}` slot that `drawPicture` fills (ROOM + the place's picture from
    `places.js` as image 1, else ROOM_TEXT); after dark (`isDark`: night, or evening unless the light is daylight;
    `timeOfDay`) `composePicture`/scene pictures set `night` and `drawPicture` sends `<key>_night` when it exists
  - pictures: `describePhoto` (`aiRun` + `aiOutOfNeurons`/`aiUnavailable`/`aiBusy`, `aiText`, `tidyDescription`,
    `photoLine`); ledger `loadLedger`/`saveLedger`/`aiAffordable`/`aiSpent` (KV `pics`); `picturesAllowed`,
    `pictureMode`; `takeSelfie` (in `shapeReply`); `startPicture` (`selfieSubject` or `scenePicturePrompt` →
    `drawPicture` with `faceBytes`) and `deliverPicture` (hash check, `sendPhoto`); `noteMinor`/`saysMinor`;
    `picsCommand`, `faceCommand`; `health` (`/health`); `aiFailed` (KV `ai_error`)
  - voice: `bodyOf`/`clean`, `forSpeech` → `tidySpoken` → `sayArabizi`, `tts` (`voiceSettings`), `sendVoice`
    (returns `{delivered, id, error}`), `voiceFailed` (KV `voice_error`, shown on /setup)
  - audio tags: `isV3`, `audioTagsOn`, `audioTagRe`, `isAudioTag`, `stripAudioTags`
  - overrides: `applyOverrides`/`mergeSettings` (`CONFIG_OVERRIDES` env var; PRONUNCIATIONS, ARABIZI_DIGITS,
    STAGE_DIRECTIONS and arrays replaced whole; SAMPLING, PROVIDER, REASONING accept new OpenRouter keys)
  - KV keys: `s:<chat>` settings (moreVoice, proactive {day,count}, selfies {day,count}, minor, name, about, tgName), `h:<chat>` history
    `{role, content, at, parts: [{id, text}], proactive?, ooc?, react?, reactTo?}`, `m:` notes, `b:` backlog,
    `a:<chat>` /auto draft `{id, text, idea}`, `pics` {day (UTC), neurons, out, hashes, recent}, `face` (base64, from
    /face keep), `face_draft:<message id>` (a day), `health`/`health_at`, `owner`, `seen`, `voice_error`,
    `ai_error`; his photo parts carry `photo: true` and `seen` (the description); settings also `morePics`, `minor`
- `face.js`: her reference face (base64 of `tools/face/reference.jpg`), imported by worker.js; the test loader and
  build-panel copy it next to their worker copy. `tools/face/` (`draw.mjs`, `job.json`, `shots.mjs` writes a
  pictures v3 grid job with the bot's own prompts) + `.github/workflows/face.yml`:
  draws face candidates or a consistency check through the Cloudflare REST API (runs when the job changes),
  pictures pushed to branch `face-candidates` (pictures only, listed in retired-branches.txt).
- `wrangler.toml`: KV `REEM_KV`, queue `reem-inbox` (consumer: max concurrency 1, retries 0), cron `*/15 * * * *`,
  Workers AI binding `AI` (free: 10,000 neurons a day; FLUX.1 schnell at 6 steps ≈ 80 neurons a picture, so ~100 a day if nothing else used it).
- `tools/settings-panel.html`: offline settings UI. Field schema in `SECTIONS`; types: text, textarea, long, list,
  number, ms, range, bool, select, commands, map, groups, schedule. `tools/build-panel.mjs` rewrites its DEFAULTS.
- Cloudflare tells the real cost of every REST call in the `cf-ai-neurons` response header (klein 104.2 at both
  256 and 640 px). Analytics (GraphQL `aiInferenceAdaptiveGroups.sum.totalNeurons`) lag a few minutes.
- `tools/ai-diag.mjs` + `.github/workflows/ai-diag.yml`: Workers AI diagnosis (token, model schemas, neuron usage
  by hour and model from GraphQL analytics, tiny test calls, full answers). Runs when either file changes or by hand.
- `tools/sync-check.mjs` + `tools/retired-branches.txt`: the sync report (session start, CI `sync` job).
- Tests (`tools/test/`): `unit.mjs`; `scenarios.mjs` (model outputs → delivery table, properties, scene state,
  mocked conversations; add a row for every new slip seen); `e2e.mjs` (whole flows, exits 1 on any false check);
  `live.mjs` (real model, see Testing); `load-worker.mjs` (exports internals; add new ones to `EXPORTS`).
- `tools/model-bench/` + `.github/workflows/model-bench.yml`: the budget-capped model bench (results never
  committed; summaries in FINDINGS.md). Runs only when that workflow file changes.

- Also: `wrangler.toml` (bindings, cron); `face.js` (her reference face as base64: never open it); `places.js` (her
  fixed places' pictures as base64, built by `tools/face/build-places.mjs` from `tools/face/places/*.jpg`; never open
  it); `tools/face/places.mjs` (job: draw the places; `--night`: each place at night from its day picture), `examples.mjs` (job: example pictures + lingerie filter
  probes), `compose.mjs` (a prompt exactly as drawPicture sends it); `.github/workflows/delete-branches.yml` (the
  owner's button: deletes the branches in `tools/retired-branches.txt`, lines marked `# keep` stay);
  `.github/workflows/deploy.yml` (deploy on push to `main`), `test.yml` (sync, mocked, docs, `[live]`);
  `.claude/settings.json` + `.claude/hooks/session-start.sh` (sync report at session start);
  `.claude/skills/handoff/SKILL.md` (end of session); `tools/check.mjs` (all local checks), `tools/doc-check.mjs`
  (docs rules); `tools/model-bench/bench.mjs` + `checks.mjs` (the bench); `.gitignore` files.

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
- All local checks in one command: `node tools/check.mjs` (the chain above plus `tools/doc-check.mjs`; ok/FAIL per
  step, the failing step's last lines printed, exit 1 on any failure).

## Branches
- `main` = what's live (every push to `main` deploys via `.github/workflows/deploy.yml`). Only on the owner's ask.
- **`dev` = the shared branch**: every session starts here (GitHub default branch) and pushes its finished, tested
  work back here (standing permission, see `CLAUDE.md`).
- Session branches (`ccr-…`, `claude/…`) are temporary. Once their work is on `dev` they're contained in it and the
  sync report ignores them; a squash-merged or abandoned one goes in `tools/retired-branches.txt` until deleted.
- `Worker.js` (the repo's first commit, already in `main`) was left alone: not part of the clean-up the owner approved.

