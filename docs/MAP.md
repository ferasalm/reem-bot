# Map

Read before any code change: where each thing lives and how to check it. Not loaded at session start.
`tools/doc-check.mjs` fails if a source file isn't named here.

## File map
Since Rebuild Step 1 (2026-10-15) the code lives in modules; `worker.js` is only the entry point. Find a function's module with
`grep -rn "function name\|const name" src` (every top-level name is exported once; `src/internals.js` re-exports them all for tests).
- `worker.js`: entry only: `export default { fetch, queue, scheduled }` (wrangler `main` unchanged).
- `src/config/index.js`: `CONFIG` = `src/config/engine.js` (`ENGINE`: models, routes, limits, budgets, timing, the picture engine) merged with
  `src/persona/reem-en/config.js` (`PERSONA_CONFIG`: her words, looks, wardrobe, places, hairstyles, moods, body/reference picture names,
  MESSAGES, NUDGES, the English patterns); a key set by both throws at start-up. `applyOverrides`, `fill`, the per-instance `cache`.
  CONFIG must stay a leaf: config and engine import nothing that imports back (load-time cycles are TDZ errors).
- `src/persona/`: `index.js` = the active persona (every module imports persona code through it; `src/config/index.js` imports
  `reem-en/config.js` directly to stay a leaf). `reem-en/prompts.js` (SYSTEM_PROMPT, INTRO_MESSAGE, MEMORY_PROMPT), `reem-en/config.js`,
  `reem-en/language.js` (`LANGUAGE` (CODE, FOREIGN_SCRIPT: read by live.mjs), `tidySpoken`, `sayArabizi`, `forSpeech`, `ENGLISH_NUMBER`,
  `EMOJI`, `TAG_MARK`). An Arabic SFW persona = `src/persona/reem-ar-sfw/` with the same exports + a wrangler `[env.ar]` (WORKPLAN Rebuild).
- `src/platform/`: `http.js` (`budget`: `used` the cap, `byChat` per chat; `xfetch`, base64, `sleep`), `telegram.js` (`tg`, `sendText`,
  `sendBubbles`, `sendVoice`, `sendPhoto`, `act`, `webhookSecret`), `kv.js` (state, history, owner, seen, the ledger: `loadLedger(env, chatId)`,
  `spend(ledger, field, amount)` adds to the day's total and to `byChat[chat]`; `saveLedger`), `ai.js` (`callModel`, `askModel`, `workersChat`,
  `aiRun`, `aiAffordable`, `aiSpent`), `log.js` (D1: `logPicture`, `logEvent`, the trace).
- `src/gate.js`: **`can(who, feature, detail)`**, the one door for every rule: "pictures" (`picturesAllowed`), "runware"
  (`runwareAffordable`), "draw" (`mayDraw`), "nude" (`nudeTierOk`), "acts" (`!actsOff`), "ai" (`aiAffordable`); `who` = { env, settings,
  ledger, ooc, level }. Also `nsfwLevel`, `levelFor`, `saysMinor`/`noteMinor`. Paid tiers add their checks inside `can()`.
- `src/chat/`: `batch.js` (`handleBatch`, `failed`, `parseCommand`, QUICK/STORY actions), `commands.js` (`runCommand`, name/about, retry,
  rewind, edit, buttons), `auto.js`, `respond.js` (`reply`, `respond`, `replyMode`, timing, `saveTurn`), `think.js`, `shape.js`
  (`shapeReply` and its helpers), `memory.js` (`remember`, the fold on the cron), `recall.js`, `day.js`, `proactive.js`.
- `src/voice/`: `tts.js`, `hearing.js`, `tags.js`. `src/vision.js` (his photos).
- `src/pictures/`: `shots.js` (tiers, shots, heat, word helpers, the day's outfits, hair, light), `compose.js` (Cloudflare prompt, selfies,
  scenes, `asCamera`, `ownHands`), `plan.js` (`runwarePlan`, `pictureFlags`, `nakedLine`, `runwareLoras`), `refs.js` (reference bytes),
  `draw.js` (`drawPicture`, `drawRunware`), `writer.js`, `anatomy.js`, `lingerie.js`, `deliver.js` (`startPicture`, `deliverPicture`,
  `whileDrawing`), `commands.js` (/look, /pic, /pics, /album, /spend, /face, /nsfw).
- `src/studio/routes.js` (`studioRoute`, the API; `setStudioHost` from the webhook) and `src/studio/page.js` (`STUDIO_HTML`). `src/setup.js`
  (/setup, /health).
- One serial queue (max concurrency 1) answers every chat: fine for one user; paid tiers will need per-chat queues (Durable Objects or
  per-chat locks), and per-chat limits can read `budget.byChat` and the ledger's `byChat`.
- `tools/split/` (Rebuild Step 1): `split.mjs` + `manifest.json` made the split from bcbe21c's worker.js (kept as the record; needs acorn and
  eslint-scope from /opt/node-tools); `fix-imports.mjs` recomputes a module's imports after code moves (`node tools/split/fix-imports.mjs`).

Function notes by topic (written when everything was in worker.js; the names are unchanged):
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
  - reliability (Rebuild Step 0, 2026-10-15): `handleBatch` guards each update (`failed(env, chatId, e, deadline, kind)` = her `lineDropped` line + a `logEvent`; never a "(setup)" notice), `runCommand` wraps `runCommandNow`, `queue` guards the batch; `respond` wraps `respondNow` with a `trace` (`startTrace`, `traceCall` from `askModel`, `traceRow`) and writes one D1 `events` row (`logEvent`; table in `STUDIO_SCHEMA`; `late_ms` > 0 = she was ready after the time she meant to answer); `saveTurn` → `queueFold` (backlog `b:<chat>`), `scheduled` → `foldWaiting` → `remember` (15-minute cron, 15 min wall time); `whileDrawing` (upload_photo every 4.5 s, in `deliverPicture`); `RUNWARE.TRANSIENT_RETRIES` (extra try in `drawPictureNow` on a 5xx or timeout at Nude/On); `LIMITS.SUBREQUEST_LIMIT` 10,000 (Workers Paid).
  - the prompt studio (Step 7, 2026-10-11): `/studio` (`studioCommand`, the owner's chat only: a link, or `/studio reset`, which bumps KV
    `studio_epoch`) → `studioRoute` (the link's first visit answers the page with the cookie `studio=<token>`, SameSite=Lax, no redirect (2026-10-11, the 302 + Strict cookie was 404 from Telegram); every other route needs the cookie, 404 without; security headers; `studioApi`):
    `GET /studio` = STUDIO_HTML; `GET /studio/api/options` (`studioOptions`: models, LORA_INFO, `studioRefNames`, sizes, money today);
    `GET /studio/api/log` (`studioLog`: D1 `pictures`, PAGE_ROWS a page, `before` and `source`); `GET|POST /studio/api/presets`;
    `POST /studio/api/compose` (`studioCompose`: /pic words → the bot's own plan: `customPicture`, then `drawPicture` with `planOnly`, which
    returns `runwarePlan`'s tries and draws, logs nothing); `POST /studio/api/draw` (`studioDraw`: one Runware task with `numberResults`
    (`drawRunware` option `results`), STUDIO.DAILY_USD counted in ledger `studioUsd` (read again before the write), a row per picture with
    source "studio", bytes in KV `simg:<id>` for IMG_DAYS); `GET /studio/img/<id>` (KV, else Telegram `getFile` on tg_thumb / tg_full);
    `GET /studio/ref/<name>` (`refBytes`: face-1x/2x, body-<name>, place:<key>, style:<key>). Tokens: `studioToken` / `studioCheck`
    (base64url "chat.exp.epoch" + HMAC-SHA256 keyed with TELEGRAM_BOT_TOKEN; exp in seconds, LINK_DAYS). The link's host: `env.PUBLIC_URL`,
    else the webhook's origin (`studioHost`, KV "origin" via `saveOrigin`). CONFIG.STUDIO; MESSAGES.STUDIO_LINK / _RESET / _NO_HOST.
    Not built (Step 7 spec, deviations in HANDOFF): scene, look and selfie sources in the editor; Cloudflare klein as a studio model.
  - anal positions (Step 6, 2026-10-11): `pictureFlags` adds `anal` (RUNWARE.ANAL_WORDS on a sex act) and `analAt` (ANAL_POSITION_WORDS,
    first match; back unless missionary); `runwarePlan` picks one by ANAL_POSITIONS when none is named (a random pick on anal acts only),
    `actScene(text, analAt)` takes ANAL_SCENES, `runwareLoras({ anal })` takes ANAL_LORAS in place of ACT_WORDS, WITH_LORAS and NUDE_LORAS;
    ANAL_ALONE (doggy) = that LoRA alone, no realism LoRAs or prefix.
  - partly dressed and close-ups (Step 5, 2026-10-11): `pictureFlags` adds `top`, `bottom`, `close` (RUNWARE.PARTIAL_WORDS, TOP_WORDS,
    BOTTOM_WORDS, CLOSE_WORDS); `nakedLine(flags)` builds the nudity line (NAKED + NAKED_BREASTS + NAKED_BUSH, PARTIAL_TOP / PARTIAL_BOTTOM /
    PARTIAL, CROTCH_FRAMING); `runwareLoras({ partial })` applies PARTIAL_LORAS_OFF / PARTIAL_WEIGHTS; in `runwarePlan` a crotch close-up
    takes CLOSE_SHAPE, no place picture, no mood or hair words, and with CLOSE_FACE false no face or body picture (REFERENCE_CLOSE);
    BODY_PARTIAL "none" = no body picture (REFERENCE_NOBODY). `who(w, withImage, rw, n)`: `n` = the place's real image number.
  - /nsfw (Step 2, 2026-10-11): `CONFIG.PICTURE.NSFW` (DEFAULT "on", SELF_NUDE); the chat's level `nsfwLevel(settings)` (`s:<chat>`.nsfw),
    set by `nsfwCommand` (QUICK_ACTIONS) or `nsfwButton` (`nsfw:` taps, before the auto: check); `levelFor` and `nsfwRefusal` answer a
    picture the level doesn't allow (PIC_NSFW names the level it needs). Every picture function takes the level (default On):
    `mayDraw` (NOT_DRAWN kept at Nude; NUDE_WORDS refused at Off), `actsOff` + `sexAct`/`sexCue` (no sex acts below On), `pickTier`
    (nude tier: TIER_WEIGHTS, NUDE_ASK_PATTERN, `nudeTierOk` = Nude/On on Runware; her own NUDE_ASK words pick it too), `selfieSubject`/`selfiePicture`, `scenePicturePrompt`/`sceneWearing`,
    `startPicture` (`nsfw`), `lookPicture`, `picCommand`, `pictureFlags` (Off = clothed), `runwarePlan` (`level`: checkContent on every
    try at Off), `drawRunware` (`checkContent`), `drawPicture` (`nsfw`; the log row's `nsfw`).
  - /nsfw Off on Cloudflare (fix round, 2026-10-11): `CONFIG.PICTURE.NSFW.OFF_ROUTE` "cloudflare" (panel row). `runwareRoute(level)` is false at Off then, and every caller passes its level: `filterSafe`, `safeLine`, `mayDraw` (Off refuses nude words and uses RUNWARE.NOT_DRAWN on every route), `nudeTierOk`, `sexAct`, `sexCue`, `explicitWords`, `flashAsked`, `lightFor`, `runwareAffordable` (false at Off, so `drawPictureNow` skips the Runware block and draws Cloudflare klein with her face, `bodyBytes()` and the place; no Runware or TwinFlow fallback), `picturesAllowed`. `startPicture`'s `nanoBanana` and `wantsLingerie(…, level)` keep Nano Banana out of Off: its lingerie is KLEIN_FIRST klein with FILTER_WORDS (no vision check at Off). `picWords`, `customPicture`, `composePicture`, `lookPicture` take the level. The Off golden case: only "nsfw Off: naked on the bed" changed (Cloudflare try, no Runware try).
  - picture overhaul Step A (2026-10-12): clothed pictures on BODY_CLOTHED (back views by NUDE_BACK_WORDS on BODY_CLOTHED_BACK) with REFERENCE_CLOTHED(_BACK); `runwareLoras` = LORAS (Lenovo) + NUDE_LORAS (NSFW Unlocked) + act (none today) + HANDS_LORAS (HANDS_WORDS; empty today) + ANATOMY_LORAS (`act` false), cut to MAX_LORAS; ANAL_LORAS only for a position the words name (`analNamed`). Studio: `studioOptions` `bodies`, `sampler`, `defaultLoras`; `studioCompose` at Off returns `cloudflare` (drawPictureNow's planOnly Cloudflare prompt).
  - picture overhaul Step B (2026-10-13): `asCamera(text, settings)` (/pic via `picWords(args, level, settings)`, /look via `lookPicture`): his name (`hisName`) and I/me → the man, my → his, her name → she/her, you → her (`aboutHer`); a clause opening with him as its subject loses him ("Feras having sex with Reem" → "Having sex with her"). `involvesHim` → PICTURE.POV_CLOTHED on a /pic picture that isn't a sex act (`customPicture`); acts keep RUNWARE.POV_MAN ("never his face or head"). `firstPerson` (PICTURE.CAMERA "first": the man/he/him/his → I/me/my in the final prompt; "third" leaves it). `ownHands` (every bare "hand(s)" → hers, "one hand" → "one of her hands"; owners, "no hands" and compounds left alone) and `firstPerson` run on every Runware try's text (`runwarePlan`) and on the Cloudflare text (`cloudflareText`: + CRAFT; the callers no longer add CRAFT, and SAFE is ""). `runwarePlan`: no DRESSED on the clothed body; a shot's own EXPRESSIONS pick counts as naming her face (no second MOODS pick). Cloudflare: klein 9B at 768x1344 (PICTURE.MODEL/WIDTH/HEIGHT, AI_BUDGET.PICTURE_NEURONS 1,500); Workers AI takes no LoRA on it (cf-lora-probe).
  - picture overhaul Step C (2026-10-13): the picture writer `CONFIG.PICTURE.WRITER` (DeepSeek on Workers AI, reasoning "low"). `writePicture(env, kind, vars)` (off for a kind outside WRITER.KINDS, failed or slower than TIMEOUT_MS (AbortSignal.timeout: the tests make setTimeout instant) → null) → `writtenWords` (one line, ≤ MAX_WORDS, `asCamera`). `startPicture` (not on the Nano Banana / klein-check lingerie paths): `writtenSelfie` (only when her words or `doing` went into the draft: `composePicture` returns `parts` {lead, draft, expression, light}; the clause must keep every garment and add no nudity or act; phone clauses cut) and `writtenScene` (her reply + `writerChat`; the code's clothes when it names none, the act style only when her narration or the words have the act); `log.llmText` = the writer's raw answer. /look: LOOK.PROMPT takes `{rules}` (WRITER.RULES) and `{clothes}` (`sceneWearing` of her last reply, else the day's outfit) from `lookCommand` → `lookWrite`. Klein 4B again on Cloudflare (576x1024, 115 neurons); Workers AI refuses LoRAs on 4B and 9B (cf-lora-probe).
  - clothed on the nude body (fix round): `runwarePlan`'s `topOnly` (a top in the words, no BOTTOM_WORDS, no ONE_PIECE_WORDS, no BARE_LEGS_WORDS (fix round review), CLOTHED_BODY "nude") adds RUNWARE.DRESSED_BOTTOM ("Below the waist ... never bare") after DRESSED (DRESSED_FULL no longer exists). Panel rows for both keys.
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
- `assets/mp3.js`: the lamejs MP3 encoder (LGPL, minified, never open it), imported by src/voice/tts.js: `pcmToMp3` turns Gemini TTS's raw PCM (`VOICE.OR_FORMAT` "pcm") into the MP3 `sendVoice` takes (~0.2 s for 5 s of speech).
- `src/studio/page.js` (Step 7, 2026-10-11; was studio.js): the prompt studio's page (`STUDIO_HTML`: vanilla JS and CSS inline, light and
  dark, phone first; tabs Log, Editor, Presets; it calls only `/studio/api/*`). Served by `studioRoute` (src/studio/routes.js).
- `tools/options.mjs` → `docs/OPTIONS.md` (round 7): every command, picture kind, nude/sex word, act camera, shot, outfit, hairstyle, light,
  place, expression and LoRA (when, weight, trigger, cost), all from CONFIG; rerun after a picture CONFIG change.
- `assets/face.js` and `assets/places.js`: GENERATED by `tools/face/build-face.mjs` and `build-places.mjs` (never edit or open it): her reference pictures as base64, the owner's set of 2026-10-15 (originals in `tools/face/originals/`, 13 and 17-19 only; the older originals were deleted 2026-10-15): `reference.jpg` / `reference-2x.jpg` (her face, picture 13), `body.jpg` (the Cloudflare route's image 1: the clothed front, small), `body-nude.jpg` / `body-back.jpg` (Runware BODY "v13" / BODY_BACK "v13-back", pictures 19 and 18: `runwareBody`), `body-clothed.jpg` (BODY_CLOTHED "v13-clothed", picture 17, black bra and briefs: `runwarePlan`'s clothed pictures); clothed back views use the nude back (BODY_CLOTHED_BACK "v13-back", REFERENCE_CLOTHED_BACK dresses it), `tools/face/style/*.jpg` (`STYLE_JPEG_BASE64`: the hairstyles sent as the next image, their faces blurred out, then retired 2026-10-15 (none left), `RUNWARE.STYLE_PICTURES`, `stylePicture`, HAIR_LINE; the outfit pictures were retired 2026-10-12); imported by worker.js; the test loader and build-panel copy it next to their worker copy.
  `tools/face/` (`draw.mjs`, `job.json`, `shots.mjs` writes a
  pictures v3 grid job with the bot's own prompts) + `.github/workflows/face.yml`:
  draws face candidates or a consistency check through the Cloudflare REST API (runs when the job changes),
  pictures pushed to branch `face-candidates` (pictures only, listed in retired-branches.txt).
  `bench-models.mjs` + `bench.json` + `.github/workflows/image-bench.yml`: image model bench (`family_of` gives a route its own prompt set, `aspect` the Nano Banana shape; same prompts and
  references through Workers AI, Cloudflare's third-party models, OpenRouter, Runware (`rw-*`, safety check off, `RUNWARE_API_KEY`); capped by `max_usd`; never on dev).
  `lora_routes` (2026-10-08): klein 9B with her face plus `{ lora: { air: weight }, prefix }` (Runware AIRs `ferasalm:...`).
- `tools/face/outfit-bench.mjs` (Step 4, 2026-10-11): the outfit, image-1 and back-view bench through the bot's own picture code (the
  Step 3 harness with its own cases; `--dry` = plans with no network, `--run <dir>` = paid, stops at $0.20 or `BUDGET_USD`; `--review` =
  the review's set: nude and neutral modes, the crop leak at seed 303). Results go to
  `runs/2026-10-11-step4-outfit-bench/` on `face-candidates`. `tools/face/style/outfit-rust-halter.jpg` is the rust-halter picture
  (the old body-clothed picture, now an outfit: RUNWARE.STYLE_PICTURES, OUTFIT_BODY).
- `tools/face/partial-bench.mjs` (Step 5, 2026-10-11): partly dressed and crotch close-ups through the bot's own picture code (the same
  harness; variants set BODY_PARTIAL, PARTIAL_WEIGHTS, CLOSE_SHAPE, CLOSE_FACE; `--framing`, `--redraw`; stops at $0.10 or `BUDGET_USD`).
  Results: `runs/2026-10-11-step5-partial-bench/` on `face-candidates`. `outfit-bench.mjs --nude-check`: the CLOTHED_BODY "nude" check
  (runs/2026-10-11-step5-nude-mode/).
- `tools/face/newref-check.mjs` (2026-10-15): the owner's new face and bodies through the bot's own /pic path on Runware klein 9B (clothed front, clothed back view on the nude back, nude front, nude back; seed 101; `NODE_USE_ENV_PROXY=1 node tools/face/newref-check.mjs <outdir>`, about $0.02).
- `tools/face/slim-bench.mjs` (2026-10-15): why nude pictures come out slimmer than the v13 bodies: the nude front and the belfie through the bot's own /pic path, one change per variant (V0 as built, V1 no NSFW Unlocked, V2 no LoRAs, V3 no place picture, V4 no BODY_WORDS, V5 no Lenovo, V6 no Anatomy Fixer, V7 NSFW Unlocked 0.5, V8 Lenovo 0.8) at a fixed seed (`SEED`) and fixed random picks; `NODE_USE_ENV_PROXY=1 node tools/face/slim-bench.mjs <outdir> [V0,V1]`, $0.12 cap.
- `tools/face/hair-check.mjs` (2026-10-15; no style pictures since the same day, so it draws words only): a chest-up selfie with each hairstyle forced (HAIR_CHANCE 1) through the bot's own /pic path on Runware; `TAG` names the output; run with two face.js builds to compare style pictures ($0.024 a run).
- `tools/face/replay-bench.mjs` + `tools/face/replay-cases.json` (2026-10-15): D1 rows replayed on Runware exactly as logged (prompt, references, LoRAs, seed), one change per variant (R0 as logged, R1 no Anatomy Fixer, R2 no place, R3 no LoRAs, R4, F1 face words, F2 `FACE_FULL` face picture, F3; P1-P5 prompt parts cut; G1 face words first, G2 + her face lit); `NODE_USE_ENV_PROXY=1 node tools/face/replay-bench.mjs <outdir> [R0,F1]`, $0.10 cap.
- `tools/face/body-audit.mjs` (fix round, 2026-10-11): the body audit: five cases (a mirror selfie in a fitted black tank and high-waisted jeans, the olive cardigan and camel coat outfits, row 13's words, a naked mirror selfie) x seeds 101 and 202 through the bot's own picture code; V0 = HEAD, V1 = OUTFIT_BODY false (outfit cases), V2 = the 897dfaf realism LoRAs, V3 = no realism LoRAs. `--dry` = plans with no network, `--run <dir>` = paid (klein 9B on Runware, stops at $0.12). Results: `runs/2026-10-11-body-audit/` on `face-candidates` (audit.md = the static table, table.md = the pictures).
- `tools/face/stepa-bench.mjs` (picture overhaul Step A, 2026-10-13): outfits on the clothed body, his hands with and without HANDS_LORAS, NSFW Unlocked alone on acts (the body audit's harness; `--dry`, `--run <dir>` stops at $0.15, `ONLY=VA8,VU` the doggy-anal variants). Results: `runs/2026-10-13-stepA-bench/` on `face-candidates`.
- `tools/face/stepb-bench.mjs` (picture overhaul Step B, 2026-10-13): PICTURE.CAMERA third (T) vs first (F) on pictures with him (riding + his hands, D1 rows 485, 490, 491 through /pic with his name, 484 through /look), T only for /look 483 (lamp light), the slip-dress mirror selfie and two outfits (Step A's harness; `--dry` prints every full prompt, `--run <dir>` stops at $0.08). Results: `runs/2026-10-13-stepB-bench/` on `face-candidates`.
- `tools/face/stepc-bench.mjs` + `tools/face/stepc-answers.json` (picture overhaul Step C, 2026-10-13): the picture writer's words (W, DeepSeek's answers from the writer-replay run, kept in the JSON by case and seed) vs today's template (T) through the bot's own picture code (Step B's harness; Workers AI stubbed with the answer): selfies from D1 rows 13 and 14, in-person moments (hurt, riding, the kitchen the template can't draw), /look 484 and PoV of spooning; `--dry`, `--run <dir>` stops at $0.12. Results: `runs/2026-10-13-stepC-bench/` on `face-candidates`.
- `tools/face/bodywords-bench.mjs` (Fix round 2 F2, 2026-10-13): today's body lines (`REV`, commit 3d1ab33) against PICTURE.BODY_WORDS through the bot's own picture code: Runware klein 9B, three cases x seeds 101 and 202 x two variants (`--dry`, `--run <outdir>`, $0.10 cap); `--cf` plans the /nsfw Off Cloudflare case with no network and writes `tools/face/job.json` for face.yml (klein 4B, 2 prompts x 2 draws). Results: `runs/2026-10-13-body-words*` on `face-candidates`.
- `tools/face/anal-bench.mjs` (Step 6, 2026-10-11): anal positions through the bot's own picture code (the same harness; variants set
  ANAL_LORAS and ALONE_LORAS per position; 4 cases x 2 variants x seeds 101-303; `--extend` with `PICKS=` = seeds 404, 505 on the picked
  variants; stops at `BUDGET_USD`, default $0.09). Results: `runs/2026-10-11-step6-anal-bench/` on `face-candidates`.
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
- `tools/face/cf-lora-probe.sh` + `.github/workflows/cf-lora-probe.yml` (Step B, 2026-10-13; Step C: klein 4B with the anatomy fixer and amateur selfies 4B LoRAs, refused too): does Workers AI's klein take a LoRA? Uploads it as a finetune (wrangler and REST), draws plain / bogus `lora` / `lora` at 768x1344 seed 4242; pictures to `face-candidates` runs/<id>-cf-lora-probe. Runs on a push of the script (not dev/main).
- `tools/test/writer-replay.mjs` + `.github/workflows/writer-replay.yml` (Step C, 2026-10-13): the picture writer on the real DeepSeek on Workers AI (REST), no pictures: /look stories, her selfies' drafts (D1 rows 9-14), in-person moments; prints each raw answer, the words drawn and the seconds; runs on a push of either file (not dev/main) or by hand.
- `tools/face/anatomy-probe.mjs` + `.github/workflows/anatomy-probe.yml` (Step D, 2026-10-13): the anatomy check (PICTURE.ANATOMY.PROMPT, `anatomyVerdict`) on labelled pictures from `face-candidates` (bad: stray hands, a broken leg, a second head, stray toes; good: selfies, scenes, sex acts) for each vision model in MODELS; prints each answer, right/WRONG, seconds and neurons. Runs on a push of either file (not dev/main) or by hand.
- `tools/face/stepd-bench.mjs` + `.github/workflows/stepd-bench.yml` (Step D, 2026-10-13): her pictures through the bot's own `startPicture` (writer, draw, anatomy check, redraws) on Cloudflare klein 4B at /nsfw Off and a Runware act at On; Workers AI via REST, every try and check answer saved; pictures to `face-candidates` runs/2026-10-13-stepD-bench-<run id>. Runs on a push of either file (not dev/main) or by hand.
- `tools/test/cf-probe.mjs` + `.github/workflows/cf-probe.yml`: her replies on a Workers AI text model as the bot asks (persona, reasoning, max_tokens): finish_reason, usage, reasoning length. Runs on a push of the script to a session branch (2026-10-13); one run at a time.
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
  `live.mjs` (real model, see Testing); `load-worker.mjs` (exports internals; add new ones to `EXPORTS`); `studio.mjs` (Step 7, 2026-10-11:
  the /studio link and cookie, the owner-only command, compose = the golden "/pic messy bun on the porch" plan, the studio draw with
  Runware stubbed and the cap, the log paging, the pictures, the editor's lists, the page script; in check.mjs).
- `tools/model-bench/` + `.github/workflows/model-bench.yml`: the budget-capped model bench (results never
  committed; summaries in FINDINGS.md). Runs only when that workflow file changes.

- Also: `wrangler.toml` (bindings, cron); `face.js` (her reference face as base64: never open it); `places.js` (her
  fixed places' pictures as base64, built by `tools/face/build-places.mjs` from `tools/face/places/*.jpg`; never open
  it); `tools/face/places/views/` + `README.md` (three crops of each place picture, packed into places.js instead of the full ones, 2026-10-05); `tools/face/place-prompts.md` (the owner's prompts to draw each place day and night himself, 2026-10-05); `tools/face/places.mjs` (job: draw the places; `--night`: each place at night from its day picture), `examples.mjs` (job: example pictures + lingerie filter
  probes), `compose.mjs` (a prompt exactly as drawPicture sends it); `.github/workflows/delete-branches.yml` (the
  owner's button: deletes the branches in `tools/retired-branches.txt`, lines marked `# keep` stay);
  `.github/workflows/deploy.yml` (deploy on push to `main`, then /health and /setup printed to the log), `test.yml` (sync, mocked, docs, `[live]`);
  `.claude/settings.json` + `.claude/hooks/session-start.sh` (sync report at session start);
  `.claude/skills/handoff/SKILL.md` (end of session); `.claude/skills/opus-haiku-orchestrator/SKILL.md` + `brief-template.md`
  + `review-checklist.md` and `.claude/agents/haiku-worker.md` (Opus plans and reviews, Haiku 5.5 at medium effort (per brief) does the
  well-defined bulk work; 2026-10-11); `tools/check.mjs` (all local checks), `tools/doc-check.mjs`
  (docs rules); `tools/model-bench/bench.mjs` + `checks.mjs` (the bench); `.gitignore` files.

- `docs/DECISIONS-ARCHIVE.md` (2026-10-11, owner: spend less): the decision log's older entries, word for word; not loaded at start, grep it.
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
- Locally: `node tools/build-panel.mjs && node --check worker.js (and every src/ file) && node tools/test/unit.mjs &&
  node tools/test/scenarios.mjs && node tools/test/e2e.mjs > /dev/null`.
- All local checks in one command: `node tools/check.mjs` (the chain above plus `tools/doc-check.mjs`; ok/FAIL per
  step, the failing step's last lines printed, exit 1 on any failure).
- The studio page in a browser (Step 7, 2026-10-11, by hand, not in check.mjs: CI has no browser): the global Playwright
  (`/opt/node22/lib/node_modules/playwright`, `chromium.launch({ executablePath: "/opt/pw-browsers/chromium" })`); `page.route` answers
  `https://studio.test/**` with STUDIO_HTML and fixture JSON for `/studio/api/*`, so no Worker, D1 or Runware is needed. It checked
  the log, compose, Generate, presets and a phone width (390 px), no console errors.

- `tools/test/studio-cards.mjs` (Rebuild Step 0, 2026-10-15, by hand, not in check.mjs): the studio at 390 px with 1:1, 9:16 and 16:9 results and Log rows (page.route fixtures, SVG pictures): the result card's picture above its text and not stretched, the Log thumbnails' shape, no horizontal scroll, no console errors. `node tools/test/studio-cards.mjs [outDir]`.
- `tools/test/studio-browser.mjs` (fix round, 2026-10-11, by hand, not in check.mjs: CI has no browser): the /studio link clicked from another site in Chromium (`/opt/pw-browsers/chromium`, global Playwright), over https with a self-signed certificate made by openssl into the output directory; the worker's fetch runs behind node:https. Checks: the first visit is 200 with the SameSite=Lax cookie, the page opens, `?t=` leaves the address bar, `/studio/api/options` and `/studio/api/log` answer 200, no console errors (the browser's own /favicon.ico aside), a reload works, a fresh browser without the cookie is 404, a bad token is 404. Run: `node tools/test/studio-browser.mjs [outDir]`; exits 1 on a failed check.

## Branches
- `main` = what's live (every push to `main` deploys via `.github/workflows/deploy.yml`). Only on the owner's ask.
- **`dev` = the shared branch**: every session starts here (GitHub default branch) and pushes its finished, tested
  work back here (standing permission, see `CLAUDE.md`).
- Session branches (`ccr-…`, `claude/…`) are temporary. Once their work is on `dev` they're contained in it and the
  sync report ignores them; a squash-merged or abandoned one goes in `tools/retired-branches.txt` until deleted.
- `Worker.js` (the repo's first commit, already in `main`) was left alone: not part of the clean-up the owner approved.

