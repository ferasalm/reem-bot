# Map

Read before any code change: where each thing lives and how to check it. Not loaded at session start.
`tools/doc-check.mjs` fails if a source file isn't named here.

## File map
- `worker.js`: everything. SETTINGS on top (`SYSTEM_PROMPT`, `INTRO_MESSAGE`, `MEMORY_PROMPT`, `CONFIG`), then code:
  - entry points: `fetch` (/setup, /webhook → queue; answers button taps and `isQuickCommand` commands at once), `queue`, `scheduled`
    (cron → `proactiveChat` → queue task)
  - `handleBatch`: messages, `edited_message` (`onEdited`), `callback_query` (`onButton`), commands
    (`parseCommand` → `runCommand`). Story commands (`STORY_ACTIONS`) first flush pending messages through `reply`.
  - commands: `nameCommand`, `aboutCommand` (`hisName`, `aboutHim`), `autoCommand`/`autoDraft` (one of `AUTO.MOVES` per draft; Another avoids the last moves and is told
    the skipped drafts, KV `a:` `moves`/`skipped`)/`cleanDraft`/`draftHtml`, `retry`, `rewind`, `editHers`; helpers `findPart`, `cutAfter`, `deleteIds`, `clearReactions`,
    `answerAgain`, `failed`
  - `reply` (builds `heard` + his `parts`, `noticeTime`) → **`respond`**: `isOoc`, `sceneOf`, `replyMode`
    (text/voice/scene/visit; OOC always text; apart, `asksHerOver` + `TEXTING.VISIT_CHANCE` → "visit": FORMAT_VISIT, RETRY_VISIT if she stays on the phone, shapeReply keeps it a scene; in a scene `asksToHear`/SCENE_CHANCE adds a `sayScene` clip), `think`, wait, **`shapeReply`**, reaction, texts then voice note,
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
    narrationOnly, repaired, copied}`. `copied` (`copiesAny`/`copiesExample`, TEXTING.COPY_WORDS): a line copies a style example
    of SYSTEM_PROMPT (`exampleKeys`) → think() asks once more; his own words sent back are dropped like repeats; "hey habibti" to him
    → habibi in `scrubModel`.
  - `callModel` (OpenRouter via `openRouterBody`: `LLM.PROVIDER` + `LLM.REASONING` only with `LLM.MODEL`; `trimCut`
    → `trimUnfinished`; `backup` → one try with `LLM.BACKUP_MODEL`, messages cut by `fitMessages` to
    `LLM.BACKUP_CONTEXT_TOKENS`) → `askModel` (a `@cf/` model → `workersChat`: the AI binding, reasoning_effort "none", an empty
    answer asked again up to 4 times); `LLM.BACKUP_MODEL` is DeepSeek on Workers AI (2026-10-06), memory and /auto use it too;
    `remember` (memory folding)
  - Cloudflare extras (2026-10-06): `RECALL` long memory: `saveTurn` → `recallSave` (folded messages → `embed` bge-m3 →
    Vectorize `env.MEMORY_INDEX`), `respond` → `recallFind` (his words → nearest older moments → RECALL.NUDGE in `think`;
    `rs:<chat>` = /restart time, older ones skipped); `saidBefore` (her reply vs her last ones by meaning,
    RECALL.REPEAT_SCORE → asked again); `DAY`: `dayInfo` (KV "day") → `refreshDay` via ctx.waitUntil (Open-Meteo →
    `weatherWords`; PLAN_MODEL → `parsePlan`), `planNow` replaces the schedule's "doing" in N.TIME; `/album` (`albumAdd` in
    `deliverPicture` keeps Telegram photo ids in `al:<chat>`, `albumCommand` sends 10 a page); `/spend` (`spendCommand`:
    OpenRouter /key + /credits, Runware accountManagement, the bot's neuron ledger); `aiRun` sends AI_BUDGET.GATEWAY.
  - timing: `noticeTime`, `typingTime`, `act`, `sendBubbles` (returns `[{id, text}]`)
  - pictures v3: `planShot` (`pickTier`, `chatHeat`, `shotNamed`, `pickShot`), `selfieSubject` (her marker →
    {shot, words, doing}), `selfiePicture` (keeps `asked`, `explicit`) → `composePicture` (`wardrobeList`); lingerie route in `startPicture`: `isSpicy` (LINGERIE.SPICY_PATTERN) → `spicyPicture` (SPICY_PROMPT JSON) → `drawLingerie`, else klein in KLEIN_WARDROBE, then Nano Banana, then klein's filter-safe chain (template + slots + phone rule, `{who}` filled by
    `drawPicture`); 3030 → `aiFiltered`, one tamer try in `startPicture`. Since 2026-10-05: `lingerieSeen` (VISION.MODEL says what klein drew; no
    LINGERIE.WORDS → Nano Banana, klein's picture the fallback), `lingerieArgs` (his lingerie ask beats her non-lingerie words), a refused spicier
    outfit retried in a two-piece set, in-person lingerie (`LINGERIE.SCENES`) as `nanoScene`; `drawPicture` sends one of the place's crops
    (`placePictures`: `<key>~1..3` in places.js, night crops after dark)
  - fixed places (2026-10-03): `PICTURE.LOCATIONS`; `@key` in SHOTS/PLACES → NAME; `locationOf` (her words, a scene);
    `composePicture` returns `location` and a `{room}` slot that `drawPicture` fills (ROOM + the place's picture from
    `places.js` as image 1, else ROOM_TEXT); scene pictures (`startPicture` kind "scene"): `scenePicturePrompt` + `sceneWearing`
    (clothes her narration of this scene named, `underLayers` adds `SCENE_UNDER` under a cardigan or socks, else
    `SCENE_WEARING`) + the time's LIGHT or `SCENE_NIGHT`; `/look [words]` = `lookCommand` (round 7: `lookWrite` asks PICTURE.LOOK.MODEL to write the picture from the chat and his words,
    WITH_HER → `lookPicture` with her face, ALONE → `drawPicture` with `herself: false` (no face, klein text-only); the model down → a scene
    picture of her last reply as before; not stored); `/pic` = `picCommand` + `customPicture` (his words, her face: `drawPicture` with `custom` swaps REFERENCE's "same face and hair" for CUSTOM.SAME_PERSON; not stored); after dark (`isDark`: night, or evening unless the light is daylight;
    `timeOfDay`) `composePicture`/scene pictures set `night` and `drawPicture` sends `<key>_night` when it exists
  - picture versions (2026-10-06): `PICTURE.ROUTE` "cloudflare" | "runware-klein" | "runware-twinflow"; `runwareRoute` (her words unfiltered:
    `filterSafe` a no-op, `mayDraw` uses RUNWARE.NOT_DRAWN unless the panel switch RUNWARE.SEX_ACTS is on, `safeLine` drops SAFE), `runwareAffordable` (key + RUNWARE.DAILY_USD, ledger `rwUsd`),
    `runwareBody` (RUNWARE.BODY; BODY_CLOTHED when not nude), `runwareLoras` (LoRAs by situation: LORAS + SELFIE/SCENE/PIC_LORAS by `kind`, NUDE_LORAS (not with NUDE_LORAS_OFF_WITH), ACT_LORAS by ACT_WORDS, an ALONE_LORAS act LoRA alone, FLASH_LORAS in place of LORAS when `flashAsked`; `loraWords` puts LORA_WORDS first); round 6: `pickHair` (HAIRSTYLES in `drawPicture`), `lightFor` (FLASH_LIGHT, or none when LIGHT_WORDS name the light: composePicture, customPicture, scene pictures), `runwarePlan(prompt, opts)` (Step 1, 2026-10-11: the Runware plan with no network: `tries` in order, each { model, text, refs [{name, bytes}], loras, width, height, steps, cfg, acceleration }, and `flags` from `pictureFlags`; the random picks keep their order, the golden plans check it) and `drawRunware` (api.runware.ai, content check off; only sends: model, text, refs, LoRA list, seed, sampler); round 7 (in `runwarePlan`, was `drawPicture`): three kinds (clothed: BODY_CLOTHED + DRESSED; nude: BODY + NAKED;
    sex act: NAKED, or NAKED_BACK + REFERENCE_BACK + `runwareBody("back")` on BACK_WORDS; clothes named = PARTIAL + BODY_PARTIAL), a sex act's
    shape from ASPECTS (ORAL on `ORAL_WORDS`, with `MOODS.ORAL`) → SIZES, WIDE on 16:9; `runwareLoras` adds WITH_LORAS and honours ALONE_WORDS; `sexCue` (round 5: the act in her own narration, `PICTURE.SEX_CUES` gated by `SEX_CONTEXT`: `scenePicturePrompt` names it and keeps its sentences about him, `startPicture` "scene" draws her naked in `SCENE_ACT_STYLE`); `drawPicture` tries Runware first when given a ledger
    (klein 9B with face/body/place, KLEIN_TRIES times, then Cloudflare klein with the same references; TwinFlow from LOOKS only without her face: 2026-10-10, TwinFlow drew her from words and the belly), adds RUNWARE.NAKED on NUDE_WORDS; `startPicture` skips the klein
    check and Nano Banana on Runware. The deploy copies the GitHub secret RUNWARE_API_KEY to the Worker; /setup shows the route.
  - studio log (Step 1, 2026-10-11): `drawPicture(env, prompt, { ..., log: { source, chat, asked, herWords, llmText, nsfw } })` = `drawPictureNow` (her face/body/place, `runwarePlan`, `drawRunware` tries, then Cloudflare klein; `rec` keeps what was sent) → `logPicture` (one row per call, `pictureRow`; drawn or not) → one JSON line printed; returns `logId`. `STUDIO_SCHEMA` (tables `pictures`, `presets`) applied once per isolate by `ensureStudioSchema(env)` (a `batch()` of one prepared statement each: D1's `exec()` reads one statement per line); a klein retry sends the next seed; no binding = no log. `logSent` (from `deliverPicture`) stores Telegram's copies: `tg_thumb` (largest at most 400 px), `tg_full`. Sources: selfie, scene (`startPicture`; its `source` option: /look's in-person fallback passes look), look (`lookPicture`; `lookWrite` returns `raw`), pic (`picCommand`), health, face. D1 `reem-studio` (binding `STUDIO_DB`, id in `wrangler.toml`): created with the Cloudflare MCP; `tools/cf-resources.sh` checks it with `wrangler d1 info`.
  - /nsfw (Step 2, 2026-10-11): `CONFIG.PICTURE.NSFW` (DEFAULT "on", SELF_NUDE); the chat's level `nsfwLevel(settings)` (`s:<chat>`.nsfw),
    set by `nsfwCommand` (QUICK_ACTIONS) or `nsfwButton` (`nsfw:` taps, before the auto: check); `levelFor` and `nsfwRefusal` answer a
    picture the level doesn't allow (PIC_NSFW names the level it needs). Every picture function takes the level (default On):
    `mayDraw` (NOT_DRAWN kept at Nude; NUDE_WORDS refused at Off), `actsOff` + `sexAct`/`sexCue` (no sex acts below On), `pickTier`
    (nude tier: TIER_WEIGHTS, NUDE_ASK_PATTERN, `nudeTierOk` = Nude/On on Runware; her own NUDE_ASK words pick it too), `selfieSubject`/`selfiePicture`, `scenePicturePrompt`/`sceneWearing`,
    `startPicture` (`nsfw`), `lookPicture`, `picCommand`, `pictureFlags` (Off = clothed), `runwarePlan` (`level`: checkContent on every
    try at Off), `drawRunware` (`checkContent`), `drawPicture` (`nsfw`; the log row's `nsfw`).
  - pictures: `describePhoto` (`aiRun` + `aiOutOfNeurons`/`aiUnavailable`/`aiBusy`, `aiText`, `tidyDescription`,
    `photoLine`); ledger `loadLedger`/`saveLedger`/`aiAffordable`/`aiSpent` (KV `pics`); `picturesAllowed`,
    `pictureMode`; `takeSelfie` (in `shapeReply`); `startPicture` (`selfieSubject` or `scenePicturePrompt` →
    `drawPicture` with `faceBytes`) and `deliverPicture` (hash check, `sendPhoto`); `noteMinor`/`saysMinor`;
    `picsCommand`, `faceCommand`; `health` (`/health`); `aiFailed` (KV `ai_error`)
  - hearing: `transcribe` (his voice notes: `hearWithGemini` first = `HEARING.OR_MODEL` on OpenRouter, OGG as `input_audio`, laughs/tone in parentheses; then Workers AI Whisper `HEARING.MODEL`, counted in the AI ledger by
    `AI_BUDGET.HEARING_NEURONS_PER_MIN`; `scribe` = ElevenLabs backup when it fails or the budget is spent)
  - voice: `bodyOf`/`clean`, `forSpeech` → `tidySpoken` → `sayArabizi`, `tts` (`VOICE.PROVIDER` "aura": Workers AI
    aura-2 with `auraText` (tags → `AURA_CUES`) and `audioBytes`, counted by `AI_BUDGET.VOICE_NEURONS_PER_1000_CHARS`;
    `orSpeech` = the OpenRouter voice (also /setup's test clip, heard back by `hearWithGemini`); `elevenTts` + `voiceSettings` = ElevenLabs, the backup), `sendVoice`
    (returns `{delivered, id, error}`), `voiceFailed` (KV `voice_error`, shown on /setup)
  - audio tags: `isV3`, `audioTagsOn`, `audioTagRe`, `isAudioTag`, `stripAudioTags`; `offeredTags` (the tags she's told about: only those the current voice performs, by `OR_CUES`/`AURA_CUES`)
  - overrides: `applyOverrides`/`mergeSettings` (`CONFIG_OVERRIDES` env var; PRONUNCIATIONS, ARABIZI_DIGITS,
    STAGE_DIRECTIONS and arrays replaced whole; SAMPLING, PROVIDER, REASONING accept new OpenRouter keys)
  - KV keys: `s:<chat>` settings (moreVoice, proactive {day,count}, selfies {day,count}, minor, name, about, tgName), `h:<chat>` history
    `{role, content, at, parts: [{id, text}], proactive?, ooc?, react?, reactTo?}`, `m:` notes, `b:` backlog,
    `a:<chat>` /auto draft `{id, text, idea}`, `pics` {day (UTC), neurons, out, hashes, recent}, `face` (base64, from
    /face keep), `face_draft:<message id>` (a day), `health`/`health_at`, `owner`, `seen`, `voice_error`,
    `ai_error`; his photo parts carry `photo: true` and `seen` (the description); settings also `morePics`, `minor`
- `mp3.js`: the lamejs MP3 encoder (LGPL, minified, never open it), imported by worker.js: `pcmToMp3` turns Gemini TTS's raw PCM (`VOICE.OR_FORMAT` "pcm") into the MP3 `sendVoice` takes (~0.2 s for 5 s of speech); test loader and build-panel copy it.
- `tools/options.mjs` → `docs/OPTIONS.md` (round 7): every command, picture kind, nude/sex word, act camera, shot, outfit, hairstyle, light,
  place, expression and LoRA (when, weight, trigger, cost), all from CONFIG; rerun after a picture CONFIG change.
- `face.js`: GENERATED by `tools/face/build-face.mjs` (never edit or open it): her reference pictures as base64, the owner's set of 2026-10-10 (originals in `tools/face/originals/`, 01-10): `reference.jpg` / `reference-2x.jpg` (her face, picture 2), `body.jpg` (the Cloudflare route's image 1), `body-nude.jpg` / `body-back.jpg` / `body-clothed.jpg` (Runware BODY "v10" / BODY_BACK "v10-back" / BODY_CLOTHED "v10-clothed": `runwareBody`), `tools/face/style/*.jpg` (`STYLE_JPEG_BASE64`: the outfits and hairstyles sent as the next image, `RUNWARE.STYLE_PICTURES`, `stylePicture`, OUTFIT_LINE / HAIR_LINE); imported by worker.js; the test loader and build-panel copy it next to their worker copy.
  `tools/face/` (`draw.mjs`, `job.json`, `shots.mjs` writes a
  pictures v3 grid job with the bot's own prompts) + `.github/workflows/face.yml`:
  draws face candidates or a consistency check through the Cloudflare REST API (runs when the job changes),
  pictures pushed to branch `face-candidates` (pictures only, listed in retired-branches.txt).
  `bench-models.mjs` + `bench.json` + `.github/workflows/image-bench.yml`: image model bench (`family_of` gives a route its own prompt set, `aspect` the Nano Banana shape; same prompts and
  references through Workers AI, Cloudflare's third-party models, OpenRouter, Runware (`rw-*`, safety check off, `RUNWARE_API_KEY`); capped by `max_usd`; never on dev).
  `lora_routes` (2026-10-08): klein 9B with her face plus `{ lora: { air: weight }, prefix }` (Runware AIRs `ferasalm:...`).
- `tools/face/outfit-bench.mjs` (Step 4, 2026-10-11): the outfit, image-1 and back-view bench through the bot's own picture code (the
  Step 3 harness with its own cases; `--dry` = plans with no network, `--run <dir>` = paid, stops at $0.20). Results go to
  `runs/2026-10-11-step4-outfit-bench/` on `face-candidates`. `tools/face/style/outfit-rust-halter.jpg` is the rust-halter picture
  (the old body-clothed picture, now an outfit: RUNWARE.STYLE_PICTURES, OUTFIT_BODY).
- `tools/face/lora-bench.mjs` (Step 3, 2026-10-11): the LoRA and ghost-hands bench through the bot's own picture code
  (`--dry` = plans with no network, `--run <dir>` = paid Runware, stops at $0.25). Variants are CONFIG edits (LORAS, POV_MAN,
  ACT_SCENES), restored per run; Math.random is seeded by (seed, case). Results go to `runs/2026-10-11-step3-lora-bench/` on `face-candidates`.
  CONFIG: `RUNWARE.LORA_INFO` (the 18 LoRAs: category, Civitai id, trigger, note; read by options.mjs only) and `LORA_PREFIX_WITH`
  (the smartphone prefix goes in only with that LoRA in the list).
- `tools/lora/dora-to-lora.py`: a diffusers-named FLUX.2 klein DoRA → the BFL-named LoRA Runware loads (dora_scale dropped,
  q/k/v fused); numpy only. `tools/lora/lokr-to-lora.py` (2026-10-08): a LyCORIS LoKR (SNOFS) → a rank-N LoRA, exact cut via the
  Kronecker SVD (prints the share kept); both read and write with `tools/lora/lora_io.py`. Runware fetches a model only from a public URL (`model_upload` / `modelUpload`, AIR source `ferasalm`).
  `.github/workflows/lora-upload.yml` (hand-run, on dev): download URL → optional conversion → the first public host that works (filebin, uguu, catbox, litterbox, 0x0.st; owner OK
  2026-10-08) → Runware modelUpload → one test picture.
- `tools/test/recall-check.mjs` + `.github/workflows/recall-check.yml`: real bge-m3 scores for pairs of her replies, to set
  `RECALL.REPEAT_SCORE` (Workers AI only).
- `tools/test/cf-probe.mjs` + `.github/workflows/cf-probe.yml`: empty-answer check of a Workers AI text model, direct vs AI Gateway.
- `tools/cf-resources.sh` + `.github/workflows/cf-resources.yml`: creates the Cloudflare resources wrangler.toml binds (the Vectorize
  index `reem-memory` for `RECALL`); deploy.yml runs it before every deploy.
- `tools/voice/bench.mjs` + `bench.json` + `.github/workflows/voice-bench.yml`: Workers AI voice bench (aura-2 clips
  as OGG/Opus, each heard back by Whisper; capped by `max_chars`; clips pushed to `face-candidates` runs/<id>-voice).
- `tools/voice/tts-bench.mjs` + `tts-bench.json` + `.github/workflows/tts-bench.yml`: OpenRouter text-to-speech bench (Gemini, Grok, Fish Audio,
  MiniMax, Orpheus, Deepgram clips, each heard back by Whisper; capped by `max_chars`; clips pushed to `face-candidates` runs/<id>-tts).
- `tools/voice/stt-bench.mjs` + `stt-bench.json` + `.github/workflows/stt-bench.yml`: speech-to-text bench (his voice notes
  made by Gemini TTS in male voices, heard by Whisper, Nova-3 and OpenRouter audio-input models; clips to `face-candidates` runs/<id>-stt).
- `wrangler.toml`: D1 `STUDIO_DB` (`reem-studio`, the studio's picture log, 2026-10-11), KV `REEM_KV`, queue `reem-inbox` (consumer: max concurrency 1, retries 0), cron `*/15 * * * *`,
  Workers AI binding `AI` (free: 10,000 neurons a day; FLUX.1 schnell at 6 steps ≈ 80 neurons a picture, so ~100 a day if nothing else used it).
- `tools/settings-panel.html`: offline settings UI; a unit test needs a field for every CONFIG key (add rows by hand to its
  `SECTIONS`). The owner found the published copy useless (2026-10-06): don't republish it or point him to it. Field schema in `SECTIONS`; types: text, textarea, long, list,
  number, ms, range, bool, select, commands, map, groups, schedule. `tools/build-panel.mjs` rewrites its DEFAULTS.
- Cloudflare tells the real cost of every REST call in the `cf-ai-neurons` response header (klein 104.2 at both
  256 and 640 px). Analytics (GraphQL `aiInferenceAdaptiveGroups.sum.totalNeurons`) lag a few minutes.
- `tools/ai-diag.mjs` + `.github/workflows/ai-diag.yml`: Workers AI diagnosis (token, model schemas, neuron usage
  by hour and model from GraphQL analytics, tiny test calls, full answers). Runs when either file changes or by hand.
- `tools/sync-check.mjs` + `tools/retired-branches.txt`: the sync report (session start, CI `sync` job).
- Tests (`tools/test/`): `unit.mjs`;- Tests (`tools/test/`): `picture-plans.mjs` + `picture-plans.golden.json` (Step 1: the bot's picture code with the network stubbed, every Runware request as sent; `--write` only for an intended change, `--check` in check.mjs and test.yml); `unit.mjs`; `scenarios.mjs` (model outputs → delivery table, properties, scene state,
  mocked conversations; add a row for every new slip seen); `e2e.mjs` (whole flows, exits 1 on any false check);
  `live.mjs` (real model, see Testing); `load-worker.mjs` (exports internals; add new ones to `EXPORTS`).
- `tools/model-bench/` + `.github/workflows/model-bench.yml`: the budget-capped model bench (results never
  committed; summaries in FINDINGS.md). Runs only when that workflow file changes.

- Also: `wrangler.toml` (bindings, cron); `face.js` (her reference face as base64: never open it); `places.js` (her
  fixed places' pictures as base64, built by `tools/face/build-places.mjs` from `tools/face/places/*.jpg`; never open
  it); `tools/face/places/views/` + `README.md` (three crops of each place picture, packed into places.js instead of the full ones, 2026-10-05); `tools/face/place-prompts.md` (the owner's prompts to draw each place day and night himself, 2026-10-05); `tools/face/places.mjs` (job: draw the places; `--night`: each place at night from its day picture), `examples.mjs` (job: example pictures + lingerie filter
  probes), `compose.mjs` (a prompt exactly as drawPicture sends it); `.github/workflows/delete-branches.yml` (the
  owner's button: deletes the branches in `tools/retired-branches.txt`, lines marked `# keep` stay);
  `.github/workflows/deploy.yml` (deploy on push to `main`, then /health and /setup printed to the log), `test.yml` (sync, mocked, docs, `[live]`);
  `.claude/settings.json` + `.claude/hooks/session-start.sh` (sync report at session start);
  `.claude/skills/handoff/SKILL.md` (end of session); `tools/check.mjs` (all local checks), `tools/doc-check.mjs`
  (docs rules); `tools/model-bench/bench.mjs` + `checks.mjs` (the bench); `.gitignore` files.

- `docs/WORKPLAN.md` (2026-10-11): the step-by-step plan (pictures, /nsfw, prompt log, studio); one Haiku chat per step, each
  reviewed by Opus; its "Decided in review" notes at the end bind the next step.

## Testing
- Every push: `.github/workflows/test.yml` runs `sync` (sync check) and `mocked` (`node --check`, panel matches
  CONFIG, unit, scenarios, e2e). Free.
- A commit whose message contains `[live]` also runs `live.mjs` against the real model (repository secret
  `OPENROUTER_API_KEY`, already set; a few cents). It pins `LLM.MODEL` (backup off), prints the model and provider
  that served every call, and fails if anything broken reaches him: wrong kind, digit spoken, [brackets], "(or)",
  non-Latin script, *actions* or her name in a text, "Voice" labels. "REVIEW" lines (safeguard, fade-outs, first
  person in a scene) need a human read of every reply.
  `OWNER_CHAT` replays the owner's Telegram chat of 2026-10-06 (REVIEW: a word or two, "habibti" to him, a copied example,
  not going to him). By hand (Actions > Tests > Run workflow): `runs`, `only` (ids) and `model` (another OpenRouter model
  in LLM.MODEL's place, to compare; the backup model keeps its own providers).
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

