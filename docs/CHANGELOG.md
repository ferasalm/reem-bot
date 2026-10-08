# Changelog

History, moved word for word from HANDOFF.md on 2026-10-03 (handbook restructure, see docs/DECISIONS.md).
Not loaded at session start: `grep -n` it for a run id, version or date when you need the history behind something.
New entries: when a session's HANDOFF "Where we are" item is finished, move its detail here (newest first).

## 2026-10-08 (fourteenth session, part 2): LoRAs by situation (on dev)
- Uploads from the container (REST `modelUpload`, Civitai signed links): povbj, nsfwunlock, povanal, missionary, instapic loaded; POV
  hand "failedLoraLoad" (OneTrainer naming) → lora-upload run 37804594857 converted it (`ferasalm:povhandc@1`, 9 global modules left out).
- Each LoRA benched alone on top of the live set, every picture opened: Anatomy Fixer: cleaner limbs, followed "on the bed" 3/3 (live
  set put her on the floor once); POV Blowjob 2/3 (0/4 without; the miss was a wide room shot → its trigger words: fixed in the final
  bench); Missionary 2/2; POV Anal 2/2; NSFW Unlocked: fuller bush, riding without SNOFS lost the man (with SNOFS ok); POV hand: his
  hand from his eyes 3/3 (without it a hand came in from the side); InstaPic: more natural hair/skin, alone it drew the phone.
- 4 vs 7 LoRAs: both drew the acts; 7 kept her face and the photo look better. 7 LoRAs ~20 s, $0.00169.
- Final routing bench (real `runwareLoras`, kinds pic/selfie/scene): 7/8 right; riding (no LoRA for it) showed no penetration.
  Runware 502 "no picture" ~1 call in 8 from the container (retried fine).

## 2026-10-08 (fourteenth session): sex acts on, new face and body (deployed from dev, see DECISIONS)
- Owner: "lift all restrictions" for pictures to test SNOFS with sex acts; the refresh's face (his picture 1) and body (his picture 5).
- Bench from the container (the bot's own `drawPicture`, Runware klein 9B + LoRAs, $0.00169 each, ~30 pictures), every picture opened:
  face (black hair, bangs, beauty mark) kept on all; nudes 5/5 with detailed genitals, the bush lighter than asked until "thick, full,
  untrimmed"; sex acts: riding 2/2 (first showed the man's face → POV_MAN "the camera is his head": gone), doggy 2/2, missionary 2/2
  (first cut her face → "her face is in frame"), blowjob 0/4 (a penis held to her mouth, or none: model limit).
  Clothed with the nude body as image 1: 6/6 nude when no clothes were named (even with DRESSED) → `BODY_CLOTHED` "default": 5/5 dressed.

## 2026-10-08 (thirteenth session): SNOFS on nude pictures (deployed: main afbd4fd, run 37793652334)
- SNOFS klein 9B v1.4 (Civitai 2960556) is a LoKR (w1 4x4, full w2, alpha 1e10 = full): `ferasalm:snofs14@1` "failed to load" (the same
  file is on Runware as `aisudo:klein9b-lora@snofs`, also failing). Merged checkpoints (Civitai 2985440) uploaded as `ferasalm:snofs9b@14`
  (bf16, 17.7 GB) and `ferasalm:snofs9b8@14` (fp8): both "internalError" when drawing. `lokr-to-lora.py`: rank 128 keeps 57% of the change
  (mean, Frobenius; worst module 36%), 663 MB; rank 256 68%, 1.3 GB. Rank 128 uploaded as `ferasalm:snofsc@1` (run 37788419189; filebin).
- Bench 37789786856 (her face + hourglass body, 3 nude prompts + 1 clothed, 7 sets): all $0.00169. With SNOFS 0.8: more natural skin
  and anatomy, poses closer to the words, the bed selfie lost the phone edge the live set drew; clothed unchanged; 0.6 ≈ 0.8; SNOFS
  alone less like her (makeup, a garbled phone logo). Each 4-set minus one (Real HD, UltraReal, Phone): small differences only.
  Cost check (direct calls, one reference): 0 LoRAs $0.00078, 1 LoRA $0.00169, 4 LoRAs $0.00169.

## 2026-10-08 (twelfth session): Civitai LoRAs on Runware klein 9B (on dev, not deployed)
- Uploads: `ferasalm:phone2025@1`, `ferasalm:ultrareal5@1` (Civitai's signed links), `ferasalm:realhd2kc@1` (Real HD 2k: a diffusers
  DoRA; `ferasalm:realhd2k@1` and the lycoris try `ferasalm:realhd2kdora@1` don't load) via `lora-upload.yml` run 37722581660
  (converted, rank 32 = 96.6% of the change kept, filebin). Hosting failed in runs 37721538771, 37721728086, 37722158897, 37722412788.
- Benches (her face + hourglass body, 4 shots, same seeds): 37720473185 (none / phone 0.8 / ultrareal 0.8 / both 0.6) and
  37722968583 (Real HD 0.8 / all three): 24/24 drawn, face kept in all; LoRA pictures $0.00169 vs $0.00078. The effect is small:
  phone = less airbrushed skin, more freckles; ultrareal = a little smoother and warmer; Real HD = crisper, neutral colour.
- `PICTURE.RUNWARE.LORAS` + `LORA_PREFIX` (`runwareLoras`, `drawRunware`, `drawPicture`); default phone2025 + ultrareal5 0.6.

## 2026-10-06 (eleventh session): Cloudflare first, Cloudflare ideas 1-6 (deployed: 7de9e5b and the /setup wording)
- MiniMax TTS benches 37538682473 / 37541102035 (Arabic script; Turbo via OpenRouter, HD via Runware): owner kept Sulafat.
- `PICTURE.ROUTE` "runware-klein" default. Nano Banana off, Nemo removed; `LLM.BACKUP_MODEL` = DeepSeek on Workers AI
  (`workersChat`, empty answers asked again) for replies, memory, /auto; aura before ElevenLabs as the voice backup.
- `RECALL` (Vectorize `reem-memory`, bge-m3; tools/cf-resources.sh, run before each deploy), `saidBefore` (REPEAT_SCORE 0.68),
  `DAY` (Open-Meteo + daily plan), `/album`, `/spend`, `AI_BUDGET.GATEWAY`. Live 37545345952 on Workers AI: 0 broken.
- Then (owner): Workers AI DeepSeek the main text model, OpenRouter DeepSeek the backup; Whisper hears first. Fixes from the deploys:
  AI Gateway only for text/vectors; tasks reasoning "low"; last empty-answer tries "low"; a lone * dropped from texts.

## 2026-10-06 (tenth session): "come over" (owner: "Mostly go")
- `replyMode` "visit" (`asksHerOver`, `TEXTING.VISIT_CHANCE` 0.75, `NUDGES.FORMAT_VISIT`/`RETRY_VISIT`); shapeReply keeps a
  visit's scene. Live 37517733148 (visit scenes 6/8) → 37518157279 (8/8; went to him 8/10). The habibi rule no longer names
  habibti (corrections 4/5 → 1/5). deploy.yml opens /setup after /health. Panel no longer published (owner).

## 2026-10-06: back to DeepSeek (owner: "What is wrong with Reem? Fix her")
- The owner's Telegram chat (one-word texts "good", "come", "Knock."; "hey habibti" to him; a style example sent word for word;
  a coffee detail picture after "Kiss kiss") replayed in live.mjs (`OWNER_CHAT`): Nemo 37459244094, DeepSeek 37459455109
  (`LIVE_MODEL`, the workflow's `model` input). Full [live] on DeepSeek: 37459992726 (1 broken = backup after a timeout),
  37460798857 (0 broken). Guards: `copiesExample` (asked again), habibti → habibi (address only), his words echoed back
  dropped, a scene's bare words quoted, speech tags in texts. Deploy run 37461633468, `main` = 122dac8.

## 2026-10-05 (eighth session): Mistral Nemo deployed
- fe1ea79: `LLM.MODEL` mistralai/mistral-nemo, DeepSeek V4 Flash as `LLM.BACKUP_MODEL` with its own routing (`BACKUP_PROVIDER`,
  `BACKUP_REASONING`); memory and /auto stay on DeepSeek. [live] 37363619497: attempts 1-2 cancelled by GitHub's runner incident,
  attempt 3 read (0 broken). a34bbe7: stray '[' fix. `backup-before-nemo` = da3ae1a (the DeepSeek version).
- Deploy run 37371425888: attempts 1-2 cancelled (no runner), attempt 3 green (Deploy Worker and /health); live code read back
  with the Cloudflare MCP (Nemo model, DeepSeek backup, the bracket fix present).

## 2026-10-05 (seventh session): deployed
- 9c65b91: lingerie check (klein → vision → Nano Banana), wider picture asks, two-piece retry, in-person lingerie; /auto moves.
- ROOM_VIEWS (rewording) tried and dropped (face run 37339347977: 1/6); place crops instead (b6d4343, face run 37340198460: 8/8).
- 3386d5c: /auto HOT_MOVES, lengths, AGAIN after the ask; HER_MOVE for apart scenes ([live] 37339438191 → 37340567117, 0 broken).
- Owner: "I am allowing all edits. Fix everything then deploy." `dev` fast-forwarded into `main` (da3ae1a): deploy run 37341573464 green (Deploy Worker and /health).

## 2026-10-05 (sixth session): deployed
- `main` = `dev` at b5c4d60 (fast-forward). Deploy run 37272358522 green. Old session branches (14, all dated 2026-10-04 or
  earlier) not read; owner said "Deploy". Live code not read back from Cloudflare.

## 2026-10-05 (fourth session): deployed
- `main` = `dev` at cdf631f (fast-forward). Deploy run 37267949894 green. Old session branches (commits not on dev,
  all dated 2026-10-04 or earlier) were not read; owner said "Deploy". Not yet done by the owner: /setup, voice note, lingerie and "spicier" picture, /restart.

## 2026-10-05 (third session, last): Gemini hearing, klein-first-unless-spicier (on dev, not deployed)
- `HEARING.OR_MODEL` google/gemini-3.8-flash via `hearWithGemini` (OGG as `input_audio`, `OR_PROMPT`, `OR_TIMEOUT_MS`,
  `OR_MAX_SECONDS`), then Whisper, then Scribe; e2e "hearing: Gemini ... first".
- Lingerie: `LINGERIE.KLEIN_WARDROBE` (klein first), `SPICY_PATTERN` + `isSpicy`, `SPICY_PROMPT` (owner's JSON style,
  Reem's description) + `spicyPicture`, `SPICY_WARDROBE`, `SPICY_POSES`; scenarios rewritten. Bench 37267630601: 4/4.

## 2026-10-05 (third session, later): owner's places, lingerie wording rounds, STT bench (on dev, not deployed)
- Places: the owner's 15 pictures (all 8 places by day, 7 by night; bathroom day only) in `tools/face/places/`,
  `places.js` rebuilt; every `LOCATIONS` LOOK rewritten to match them. Check: face run 37266040257 (6/6 rooms right).
- Lingerie on klein without trigger words: round 1 run 37263536954 (3/16 as asked), round 2 run 37266040257 (4/12).
- `tools/voice/stt-bench.*` + workflow: run 37266123079 (Whisper, Nova-3, Gemini 3.5 Flash Lite, Gemini 3.8 Flash,
  Voxtral Small, Gemini 3.5 Transcribe). `face.yml` no longer runs on dev/main pushes or its own edits.

## 2026-10-05 (third session): klein lingerie first, stronger accent (on dev, not deployed)
- `startPicture`: a boudoir selfie goes to klein first with the real lingerie words and her face
  (`PICTURE.LINGERIE.KLEIN_FIRST`, panel field added); on a refusal or failure Nano Banana, then klein's filter-safe
  wardrobe. The refused klein picture is counted in the ledger. Scenarios: 4 new rows, the older fallback rows run
  with KLEIN_FIRST off.
- `VOICE.OR_INSTRUCTIONS` = the "sulafat-stronger" wording (tts bench run 37261464781).
- `tools/face/place-prompts.md`: day and night prompts for every place, for the owner to draw himself.

## 2026-10-05: v11 places redrawn (on dev, not deployed)
- `PICTURE.LOCATIONS` LOOK for `living` (plaster, steam radiator, kitchen-table desk with laptop, calculator, receipt
  shoeboxes, olive sofa), `porch` (third floor over the driveway, bins and a van) and `hallway` (narrow wooden
  third-floor landing, facing doors, bare bulb, mirror by her door); living WORDS + front room, laptop, calculator,
  radiator, shoebox(es); "by the radiator under the window" in PLACES.EVERYDAY; `places.mjs` night lights.
- Pictures: day run 37260893375 (living 02, porch 04, landing 09), night run 37261146711 (02, 04, 09); `places.js`
  rebuilt. Checks: klein run 37261302407 (her in each place, day and night), image bench 37261014675 (Nano Banana and
  schnell, the bot's prompts; `family_of` and `aspect` added to bench-models.mjs), voice run 37261464781 (Sulafat,
  live vs stronger vs old accent wording). Verdicts in `docs/QUALITY.md`.

## 2026-10-05: v11 persona built (on dev, not deployed)
- `SYSTEM_PROMPT` rewritten from `docs/REEM-BIBLE.md` (Reem Nabot, Armenian-Lebanese bookkeeper, Watertown triple-decker;
  deflect then interrogate, cold reads, no polite filler, one question a reply, Levantine English); Basbousa dropped
  (owner); `INTRO_MESSAGE` = the bible's runtime scene; `CHARACTER.CITY`/`SCHEDULE`, `PERSONA.TEXTURE`,
  `PROACTIVE.PROMPT`, `NUDGES.TIME` ("tonight" only in the evening), `VOICE.OR_INSTRUCTIONS` (light Lebanese accent),
  `HEARING.PROMPT`, picture words (`SHOTS.cozy/detail`, `PLACES.EVERYDAY`, `LOCATIONS.living.WORDS`).
- Code: `offeredTags` (only the tags her voice performs: Sulafat [laughs] [sighs] [whispers]); `toYou` (scene narration
  him/his → you/your); `clean` drops whole [bracket] lines of any length; `takeSelfie` takes `[photos: ...]` and drops a
  one-word label; OOC acting as a last resort sends her quoted words; apart acting on her phone sends her words as texts.
- `[live]` runs 37259031783 (1 broken), 37259492385 (2 broken), 37259888697 (0 broken), all read in full (docs/QUALITY.md).

## 2026-10-04 (late night): Sulafat voice, bangs, body reference (on dev, not deployed)
- `mp3.js` (lamejs) + `pcmToMp3`, `VOICE.OR_FORMAT`, defaults Gemini Sulafat; bangs and shoulders in persona and picture
  prompts; reference face from bench 37175758855 #05; `BODY_JPEG_BASE64` (bench 37176541884 #01) as klein image 1, place image 2
  (`bodyBytes`, `drawPicture`, `compose.mjs`); face run 37177960246 (8 shots).

## 2026-10-04 (night): new face, Nano Banana lingerie, 9:16, OpenRouter voice provider (not deployed)
- `face.js`/`tools/face/reference.jpg` cropped from image bench run 37172411100 (or-nanobanana-text-02); face run
  37174181550 at 576x1024. `PICTURE.LINGERIE` (`wantsLingerie`, `drawLingerie`, `composePicture({lingerie})`,
  ledger `usd`); `VOICE.PROVIDER` "openrouter" (`openRouterTts`, `OR_*`, ledger `voiceUsd`, MP3 in `sendVoice`);
  `AURA_SPEAKER` andromeda; `AI_BUDGET.DAILY_NEURONS` 50,000, `PICTURE_SHARE` 0.6. TTS bench `tools/voice/tts-bench.*`.

## 2026-10-04 (later): aura-2 voice switch on dev, Nano Banana 2 Lite bench (not deployed)
- `tts`: `VOICE.PROVIDER` "aura" (Workers AI `@cf/deepgram/aura-2-en`, speaker `AURA_SPEAKER`, OGG/Opus straight to
  sendVoice), ElevenLabs `elevenTts` as backup (`ELEVENLABS_BACKUP`); /setup tests the aura voice. e2e: aura used,
  aura fails → ElevenLabs, budget spent → ElevenLabs, no backup → text.
- Image bench run 37173093173 (Nano Banana 2 Lite), voice bench run 37173093194 (helena vs andromeda). docs/QUALITY.md.

## 2026-10-04: lingerie image benches, Whisper hearing, aura-2 voice test (not deployed)
- Image benches runs 37168625788, 37168824902, 37168864870 (Workers AI), 37170059666, 37170599796 (text-only cheap),
  37172269285 (Nano Banana with face: 0/11), 37172411100 (Nano Banana text-only: 11/11). Tables in docs/QUALITY.md.
- `transcribe`: Workers AI Whisper large v3 turbo first (`HEARING.MODEL`, `PROMPT`, `TIMEOUT_MS`; ledger
  `AI_BUDGET.HEARING_NEURONS_PER_MIN` 47), ElevenLabs Scribe (`scribe`, `HEARING.BACKUP_MODEL`) when it fails or the
  budget is spent. Voice bench run 37172077504 (`tools/voice/`, `voice-bench.yml`).

## 2026-10-03 (late night): night place pictures, FLUX skill (not deployed)
- FLUX prompting skill (black-forest-labs/skills, `flux-image-best-practices`) registered in `.claude/settings.json`.
- Night version of 7 places (bathroom stays: lamp-lit, no window), image-to-image from the day picture with
  `node tools/face/places.mjs --night`: runs 37156755166 (picks bedroom 05, his_bedroom 02, his_living 04 (doorway
  still daylit), hallway 14; living, kitchen, porch too dark) and 37157058360 ("warmly lit and easy to see": living
  03, kitchen 02, porch 06). `drawPicture` sends `<key>_night` when `isDark` (night, or evening unless daylight).
- Round 5 (face run 37157228216): lamp on 6/6, night window 2/6 (`docs/QUALITY.md`).

## 2026-10-03 (night): pictures re-read, first live run of the new persona (not deployed)
- All 22 test pictures re-read at full size, one at a time: verdicts in `docs/QUALITY.md` (pass 12, weak 3, fail 7).
- ROOM: "the same walls and furniture ... lit by this picture's own light" (was "same ... light": 0/12 night
  pictures dark); round 4 (face run 37155823695): lamp on in 1/3, still daylight → night place pictures needed.
- Bathroom out of the body-length mirror shots (3/3 broke). `takeSelfie`: a bracketed pause is no picture marker;
  "sends:" label dropped. Live run 37155823580: 4 persona situations added to `tools/test/live.mjs`.

## 2026-10-03 (evening): Lebanese Reem, fixed places, pictures round
- Persona: Lebanese, born in Beirut, family in North Jersey, lives in a brick walk-up near Cushing Square, Belmont MA;
  clock America/New_York; Lebanese Arabizi; Crane Beach; Mrs. Whitaker; Mr. Kowalski the landlord.
- Fixed places: 8 rooms drawn once (face run 37150980076; picks 02/04/05/07/10/11/14/15; #1 was a Pollinations
  fallback after a 241 s timeout) → `tools/face/places/*.jpg` → `places.js`; sent to klein as image 1.
- Pictures: 768x1024 (same 4 tiles), chances about doubled, stronger body wording, TIMEOUT 120 s, FILTER_WORDS,
  boudoir retry in her own wardrobe, mirror-back out of BOUDOIR. Examples: face runs 37151684663 (15 prompts,
  10 drawn, 1,136 neurons), 37152577208 (8, 5 drawn, 568), round 3 (4, 2 drawn). Timings 9-238 s.
- Branch button `.github/workflows/delete-branches.yml`; `Worker.js` found to be GitHub's 1-line README only.

## Old HANDOFF.md header (until 2026-10-03)

**This file is the single source of truth.** It lives on the shared branch (see "Branches"). If another branch's
HANDOFF.md says something different, the shared branch wins. Every session starts with the sync report
(`node tools/sync-check.mjs`, run automatically by `.claude/settings.json`): if it lists other branches with work
that isn't here, stop and ask the owner before building anything. Session rules are in `CLAUDE.md`.

## Status as of 2026-10-03 (newest first within each day; moved from HANDOFF.md)
- 2026-10-03: `docs/PORTABLE-PLAYBOOK.md` added (docs only, copied from portrait-frame-roller) and linked from `CLAUDE.md`.
  Proposed, not done, awaiting the owner: split this file (DECISIONS/LESSONS/MAP), handoff skill, one check command.
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (**Workers Paid since 2026-10-03**, $5/month).
- **Live (deployed from `main`)**: v10 on **DeepSeek V4 Flash** since 2026-10-02, plus fast timing, instant settings
  commands and her voice in person scenes (same day, c166420; details below). Before that:
  v8 + v9 (PR #5) on Lunaris 8B.
- **Integrated v10**: built on branch `ccr-1eb562e9-ds09eq`, now `dev` and `main`. It merges all three v10 lines that were built
  in parallel on 2026-10-01 (see "Incident"): DeepSeek V4 Flash (`ccr-b7869b5d-d7yudi`, bench branch
  `claude/reem-llm-model-comparison-f27xor`), format enforced in code + scenario tests + CI (`ccr-75e7610d-6zkheu`),
  and commands/story editing/looks (`ccr-b51a9ebf-j34yp9`, PR #6). Those branches are superseded by this one.
- **Verified 2026-10-02** (Tests run 36944353910, commit 0feb5c4): sync + mocked green; `[live]` on the integrated
  v10: all 36 calls served by DeepSeek V4 Flash @ Novita, nothing broken reached him, voice note when asked 3/3,
  OOC answered as the writer 3/3, under-16 safeguard held 6/6 (one REVIEW was "go to bed", a false alarm since fixed).
  Seen while reading: Basbousa is "he" in some replies and "she" in others (persona gives no pronoun); one scene
  called him "him" instead of "you". Tuning items, not format failures.
- **2026-10-02: v10 deployed** (owner: "deploy now"): `main` fast-forwarded to commit 1167c81 (same as `dev` then).
  Deploy run 36944922001 green: KV + queue bindings, cron `*/15`, queue producer + consumer, version
  `f179fc89-642d-4d1f-943a-b4a8a66a3fd7`, URL https://reem-bot.ferris-wheel736.workers.dev. The live Worker's code,
  read back with the Cloudflare MCP, has `LLM.MODEL` deepseek/deepseek-v4-flash, the Novita-first provider order,
  the Lunaris backup, the new commands and `shapeReply`.
  **Not yet done: `/setup`** (Claude's environment can't reach workers.dev). Until the owner opens it, Telegram
  doesn't send message edits or /auto button taps, and the command menu is the old one. It also shows whether a
  `CONFIG_OVERRIDES` variable or `VOICE_ID` secret changes anything.
- **2026-10-02 (later): faster replies + instant settings commands deployed** (owner: "Merge, deploy"): `main`
  fast-forwarded to b2f9995 (= `dev`). Deploy run 36952745320 green, version `c4c1cbb0-0fec-4255-8c9e-a1f401d2bcba`.
  Read back with the Cloudflare MCP: TYPING_CHARS_PER_MIN 900, LONG_PAUSE_CHANCE 0, ACTIVE_WINDOW_MS 12e5,
  `isQuickCommand` in `fetch`. No `[live]` model run needed (timing and routing only, no prompt or model change).
- **2026-10-02 (later still): her voice in person, deployed** (owner: "Deploy"): `main` fast-forwarded to c166420.
  Deploy run 36957037841 green; read back with the Cloudflare MCP: `sayScene`, `sceneSpeech`, SCENE_CHANCE 0.25,
  the new STAGE_DIRECTIONS. Not yet heard: a real clip from an intimate scene (ask her "say it again" mid-scene).
- **2026-10-03: Workers Paid + budget guards — on `dev`, not deployed** (owner subscribed, picked "B + A's guards"
  from the options built on Gemini's research PDF). Cloudflare's 4006 block is gone: the AI diagnosis run
  37129277037 (14:21 UTC) drew with klein (`cf-ai-neurons: 104.20`), schnell and the text model all answered.
  The live bot needs no deploy to work again (its ledger retries hourly, see "Real cause" 5 below).
  Guards: (1) `AI_BUDGET.DAILY_NEURONS` 9,000 → 28,000 = the money cap (10,000 free + at most 18,000 paid =
  $0.20 a day, ~$6/month worst case), `PICTURE_SHARE` 0.6 → 0.8 (~210 pictures a day); /setup shows the price.
  These two only take effect after a deploy (until then the bot stops at 9,000, inside the free part). (2) Test
  runs (`tools/face/draw.mjs`, face.yml) read the account's real usage today (GraphQL `totalNeurons`, bot
  included) and refuse a job over 3,000 neurons or one that would take the day past 7,000 (`max_neurons` /
  `day_neurons` in job.json raise them); they stop mid-run at the cap, counting the `cf-ai-neurons` header.
  Checked for real: refusal (face run 37129365372, twice) and a normal one-picture run (37129408047: drew, counted
  138 neurons from the header, picture looked at: same adult woman, shirt, legs crossed, no phone). The analytics
  query returns today's rows (diag run: hours 00/05/10, rejected calls, 0 neurons) but still read 0 three minutes
  after the diagnosis spent ~270: ingestion lags several minutes, so the guard can't see the last minutes.
- **2026-10-03: voice notes less often — deployed** (owner: "Deploy"; `main` = 007b735) (owner: "sending voice messages TOO
  often"). Cause: `VOICE.CHANCE` 0.2 plus every `[voice]` she chose herself, and old `[voice] ...` lines in the
  history pull her to more. Now `VOICE.CHANCE` 0.1 and `VOICE.SELF_CHOICE_GAP` 4 (`mayChooseVoice` in shapeReply:
  her own `[voice]` with a voice note in her last 4 replies goes out as text). Unit, scenarios (3 rows), e2e green. Deploy run not read (owner asked to save usage).
- **2026-10-03: pictures stop after a lingerie pic — fixed and deployed** (owner: "Do Next step 000 ... then deploy").
  /setup's last AI error was `5006: Additional or unevaluated properties '/seed' at '/' not allowed`: a refused
  klein draw (3030) went to the FLUX.1 schnell backup with a `seed`, which schnell rejects. Now (`drawPicture`) a
  3030 refusal stands and never goes to the backup (the existing one-tier-tamer retry in `startPicture` is
  unchanged), and schnell is called without `seed`. Also: a shot he names (`planShot` → `named: true`, e.g.
  belfie) now wins over the type she writes in her marker (`selfiePicture`). 4 scenario rows (failed on the old
  code, pass now); unit, scenarios, e2e green.
  **Real cause, found with the AI diagnosis workflow (runs 37082338382, 37082488378; owner: "Debug, diagnose and
  find the real cause")**:
  1. **The account really ran out on 2026-10-02**: Cloudflare analytics show 10,378 neurons that UTC day (18h 4,430;
     21h 5,011; 22h 938), past 10,000 during the 22:00 hour, when pictures stopped. Klein costs **91-106 neurons a
     picture**, not the 50 the bot estimated, and the face.yml grid runs (REST API) never go through the bot's
     ledger, so the ledger said 890/9000.
  2. **The bot hid it**: out of neurons is `4006` live (3036 in the docs) and its message says "please upgrade to
     ... Workers Paid plan". `aiUnavailable` matched "upgrade"/"workers paid", took it for a model we can't use and
     tried the backup; schnell's 5006 `/seed` replaced the real error on /setup, and the ledger never stopped.
     Fixed: `aiUnavailable` is false for out-of-neurons, `aiOutOfNeurons` knows 4006 (scenario rows); the vision
     backup used the same check. `AI_BUDGET.PICTURE_NEURONS` 50 → 105 (measured).
  3. **Klein does take `seed`** (the diagnosis: klein + seed → 4006, schnell + seed → 5006, so validation runs
     first and passed). Claude's "klein rejects seed" from the first deploy was wrong: the 00:01 /health 5006 was
     most likely the old code still serving right after the deploy. `seed` restored for klein (worker.js,
     draw.mjs). Schnell without `seed` stays (its schema: prompt, steps only).
  4. **Still blocked on 2026-10-03 after 00:00 UTC**: every call (klein, schnell, a 1B text model) gets 4006 while
     the analytics show 0 neurons today (11 calls, all rejected) and the owner's dashboard shows 0 usage, no
     incident on cloudflarestatus. Cloudflare's counter reset but its block didn't: a Cloudflare-side problem,
     not fixable in code. Request ids for support: `b9e9b3eb-e8e5-4032-816b-12655ac13e84`,
     `a8f660d9-faaf-488f-bf4b-6ff2f158bd2f` (00:32 UTC). The bot's ledger is also marked out for today (`out`), so
     it won't try again before 00:00 UTC on 2026-10-04 even if Cloudflare lifts the block sooner.
  5. **No more whole-day lockout**: `ledger.out` is now the time Cloudflare said "used up"; after
     `AI_BUDGET.OUT_RETRY_MS` (1 h) one call tests whether the block lifted, a working call clears it. An old
     `out: true` counts as expired, so the deploy itself unlocks the bot. /setup shows the next try time.
  **Deployed 2026-10-03** (owner: "Fix everything and fix the bot so everything works NOW"): 1-3 and 5. Pictures
  still need Cloudflare to lift its block; the bot now retries hourly by itself.
- **2026-10-02 (late night): pictures v3 deployed** (owner: "merge and deploy"; the first push to `main` was held by
  the session's auto-mode check until the owner allowed it): `main` fast-forwarded to 04f23b8. Deploy run
  37071745296 green: bindings KV, queue, AI; version `be5f7c44-133b-49df-8087-b4d739c09639`. /health: klein drew
  from her built-in face (56 KB, 5.4 s); vision ok with the descriptive prompt ("a smiling woman with long, dark
  brown hair and a black shirt..."), so the v2 /health fix is live too. Not yet seen: a v3 picture in the real chat. The under-16 wording item below is closed by the owner (no prompt
  change; decision log).
- **2026-10-02 (night): pictures v2 deployed** (owner: "Deploy"): `main` fast-forwarded to ec31167. Deploy run
  37047760498 green: bindings KV, queue, **AI**; version `41c336fb-1734-476a-9e10-3d3d3dae8777`. Its /health step on
  the live Worker: **klein drew from her built-in face through the binding** (51 KB, 10 s). Vision answered "I can't
  identify people" because /health asked "who is in this picture?" (an identity question); /health now uses
  `VISION.PROMPT` and treats a refusal as not OK (on `dev`, not deployed: it only changes /health). His real photos
  use the descriptive prompt, which described all 18 face candidates through the REST API. Not yet seen: a
  picture or photo in the real chat (owner's /setup + first pic).
- **2026-10-02 (late): pictures v3, the shot catalog — built on `ccr-555810b3-9btsdq`, deployed 2026-10-02 (run 37071745296)**
  (owner's v3 rules in the decision log). Details:
  - **Shots** (`PICTURE.SHOTS`, type = camera + framing template): everyday `close`, `selfie`, `mirror`, `cozy`,
    `detail`, `golden`; flirty `mirror-back` (belfie), `neckline`, `legs`, `waist`; boudoir = selfie, mirror,
    mirror-back, neckline, waist, cozy in lace/satin/swimwear (`TIERS`; legs left out: the filter refused it
    twice). Each template starts with one phone rule: `{selfie}` (front camera, phone never in the picture, hands
    out of frame), `{mirror}` (an iPhone, lenses visible, in the mirror), `{pov}` (her own view; only `detail`).
  - **Picked in code** (`composePicture`): angle by `ANGLE_WEIGHTS` (high .45, eye .35, low .1, over .1),
    expression/wardrobe/place of the tier, light by her time of day (`TIMES`, `LIGHT`), `{a|b|c}` alternatives
    (the one her words mention). The last picture's angle and the last `RECENT_SHOTS` (2) types are avoided
    (ledger `pics.shots`). `golden` only 15-19h (`SHOT_HOURS`).
  - **Tier** (`planShot`/`pickTier`): `BOUDOIR_ASK_PATTERN` (lingerie, bikini, nudes...) → boudoir;
    `SEXY_ASK_PATTERN` → never everyday; a shot he names (`SHOT_WORDS`: belfie, legs, cleavage...) is the one he
    gets; else `TIER_WEIGHTS` by `chatHeat` (HEAT_WORDS in the last 6 messages, +1 step 22-3h): calm .85/.13/.02,
    warm .5/.38/.12, hot .15/.45/.4. Code-decided pictures tell her the shot and a tier hint (`FORMAT`, `REMINDER`:
    `[selfie: {shot}, what it shows]`); `SELF_CHOICE` lists the types and says she may pick a sexier one.
  - **Her marker** `[selfie: mirror-back, black leggings]`: a leading type label is taken off; her words replace
    wardrobe and place; words with a `NOT_DRAWN` word (now nudity only: nude, naked, topless, sheer, see-through,
    sex acts...) are dropped and a boudoir picture is drawn instead. `SAFE` = "No nudity.". History:
    `[selfie: type, what]`. Scene pictures drop only explicit sentences (and her voice/pauses). Never for a
    minor-flagged chat, never OOC. A bare `[...]` line describing a picture counts as the marker (seen live).
  - **Cloudflare's prompt filter (3030)** refuses some sexy prompts (seen: "lingerie", "bralette and briefs",
    boudoir legs, "looking down at her body"); random, the same words passed in another run. The code's own
    boudoir wardrobe avoids those words (lace bodysuit, lace cami and silk shorts, satin slip, silk robe,
    swimwear); her own words may still trip it, so on 3030 the same shot is drawn once more one tier tamer
    with the code's wardrobe (`aiFiltered`, noted on /setup). Klein ignores "first-person" framing with a
    reference face (legs came out third-person twice): only `detail` is POV.
  - Tests: scenarios section "pictures v3" (slots within lists, 40-110 words, phone rules, weights, recent-type
    and angle avoidance, tier gating incl. minor, nudity words). `live.mjs` adds belfie-asked, lingerie-asked,
    selfie-own-choice-hot, under18-pic and prints each selfie's drawing prompt. `tools/face/shots.mjs` writes a
    face.yml job: every shot x tier (17 pictures) with the bot's own prompts.
  - **Verified**: mocked green (25 scenario runs in a row, the v3 rows use random picks). `[live]` runs
    37067630877, 37068329999, 37069028699, 37069445307 and 37069784559 (the last: 65/65 Novita, no slips, nothing broken), every reply read: all DeepSeek V4 Flash (Novita, one Baidu);
    slips found and fixed with rows: picture described in a bare bracket line (reached him twice), "voice]"
    without its "[", scene narration without asterisks quoted as speech (its clip would have read narration),
    type labels and "sends a photo:"/meta text in the picture words, "you're" → "her're", chat lines drawn
    as what she's doing, a plain "selfie: ..." line spoken in a voice note (run 4). The live check no longer
    flags her name quoted inside her own words ("No 'hi, Reem, ...'?") as spoken narration. Marker with the type when asked for a belfie/lingerie 9/9 in run 2; under-16 held
    (REVIEW flags were "habibi" inside firm refusals; one earlier reply said "maybe I'll let you impress
    me" to the 16-year-old, and in the last run "what are you wearing" after "i'm 16" got an answer again
    ("an oversized shirt and no pants"; seen once in v2 too): **owner decides any prompt change**; pictures are
    blocked there by code either way). Own-choice pictures (SELF_CHOICE): 0/15, rare.
  - **Real-API grid** (face.yml, pictures on branch `face-candidates`, every one looked at): runs 37067630871
    (17), 37068330138 (17), 37069028709 (8 boudoir+legs), 37069445302 (legs). Final state: no phone in any
    selfie, an iPhone in every mirror shot, belfies from behind, the same adult woman throughout, no nudity
    in any picture; vision model reads her 18-25 to 20-35 (REFERENCE now says "late twenties, clearly an
    adult"). Not yet seen: a picture in the real Telegram chat (needs a deploy; the Worker binding path is
    the same as v2's, which /health verified).
- **Pictures v2 (details)** (owner's rules below; replaces v1's photo pack).
  - **Every picture is drawn new** (owner: "same picture sent more than once is a hard no"): FLUX.2 klein 4B on
    Workers AI (`PICTURE.MODEL`) from her **reference face** (`face.js` = `tools/face/reference.jpg`, multipart
    `input_image_0`), 640 px; FLUX.1 schnell from `LOOKS` when klein is unavailable (403/5035). Exact-same bytes
    never sent twice (SHA-256 in KV `pics`); her last 8 subjects are in her prompt (`RECENT`) and a too-similar
    subject is swapped (`VARIETY`, `SIMILAR`).
  - **Same rules as voice, cost-scaled** (`pictureMode` next to `replyMode`): he asks (`ASK_PATTERN`) → always;
    apart `CHANCE` 0.05 / `CHANCE_AFTER_PHOTO` 0.3 / `CHANCE_MORE` 0.15 (`/pics`, like /voice); her own `[selfie: …]`
    (`SELF_CHOICE`); she texts first → chance applies; in person `SCENE_ASK_PATTERN` ("let me see you") or
    `SCENE_CHANCE` 0.08 → a picture of the moment drawn from her narration only (`scenePicturePrompt`: no
    sentences about him/them, no `NOT_DRAWN` words, no speech-tag fragments; history part `{id, text: ""}`). Never
    OOC; never sexual (`SAFE` + `NOT_DRAWN`); never after "I'm under 18" (`MINOR_PATTERN`, wider: words, grades).
  - **Picture decided but no marker** (DeepSeek leaves it out ~2/3 when he didn't ask): `PICTURE.REMINDER` goes
    right before she writes; failing that, the picture shows what she just said she's doing (`selfieSubject`).
  - **Budget** (`AI_BUDGET`, KV `pics`, one write per picture or seen photo): 9,000 of the free 10,000 neurons a
    day; pictures stop at 60%; Cloudflare's 3036 stops everything until 00:00 UTC. Estimates: picture 50, photo 60.
  - **/face** shows her face and draws 3 new ones (480 px, KV `face_draft:<id>`, a day); `/face keep` (reply) →
    KV `face` overrides face.js; `/face reset`. **/health** (read-only, once per 10 min): draws 256 px from her
    face and describes it; the Deploy workflow curls it after deploying and prints the result.
  - **Her face** (no owner action needed, owner may replace it with /face): `.github/workflows/face.yml` draws
    candidates through the Cloudflare REST API with the repo's `CLOUDFLARE_API_TOKEN` (it has Workers AI access)
    and pushes them to branch `face-candidates`; Llama 4 Scout states an age range for each. Round 1 (run
    37045817520) rejected: some read "late teens / early twenties". Round 2 (run 37046459670, "late twenties,
    clearly adult" prompts) all read 25-35; candidate 02 chosen (almond brown eyes, arched brows, faint
    freckles, off-centre waves). Consistency run 37047036080 (4 pictures drawn the way the bot draws them:
    mirror selfie, Nile balcony, café, couch with Basbousa): the same adult woman in each, clothed, scenes right.
  - **Real API facts** (face workflow): klein answers `{result: {image: base64 JPEG}}`, 12-24 s at 768 px (hence
    640 px and `TIMEOUT_MS` 40 s); Llama 4 Scout answers OpenAI-style `choices[0].message.content` (handled by
    `aiText`). The binding path (`{multipart: {body, contentType}}`) is only checked by `/health` after deploy.
  - CPU (free plan, 10 ms per run): his photo at ≤800 px, `Uint8Array.fromBase64` when present, hashing native.
  - Verified: mocked tests (scenarios: pictures sections, /face, /health; CI also builds with `wrangler deploy
    --dry-run`). `[live]` runs 37045907764 and 37046634804 (52/52 DeepSeek @ Novita each, read in full, nothing
    broken): marker when asked 3/3 then 2/3; code-decided 0/3 → 1/3 after REMINDER (the rest drawn from her
    words); fixes from reading: "you" in a selfie → "her", "Reem's" → "Her", sentences about "them" and speech
    tags left out of scene pictures. Seen, not this change: once, "what are you wearing" after "i'm 16" got an
    answer ("my comfy robe"); the next run held 6/6. Owner decides any prompt change.
- **v1 (superseded by v2 above, same evening): pictures from a photo pack**. She sees his
  photos and sends pictures of herself.
  - **His photos**: `describePhoto` takes the biggest Telegram size up to `VISION.MAX_SIDE`, asks a Workers AI vision
    model (`VISION.MODEL` @cf/meta/llama-4-scout-17b-16e-instruct, `[ai]` binding `AI` in wrangler.toml) for a plain
    description, and she reads `INBOX.PHOTO_SEEN(_WITH_CAPTION)`. The chat model stays DeepSeek; history stays text.
    The description is kept on his part (`seen`), so a caption edit doesn't look again. No binding, a failure or a
    refusal: the old `INBOX.PHOTO` line (failure saved as KV `ai_error`, shown on /setup).
  - **Her selfies**: while apart, on `SELFIE.CHANCE` 0.1 or when he asks (`SELFIE.ASK_PATTERN`, his own words only,
    never the photo description) she's told she may write `[selfie: what it shows]` (`SELFIE.NUDGE`/`NUDGE_ASKED`).
    `takeSelfie` (in `shapeReply`) strips it, `sendSelfie` sends the best tag match from her **photo pack** (KV
    `selfies`, `[{tag, file_id}]`), else a **drawn** one (`SELFIE.IMAGE_MODEL` FLUX.1 schnell: `LOOKS` + what it
    shows + `SAFE`), else any pack photo. Stored as a part `{id, text: "[selfie: ...]"}` so /rewind and /retry
    delete it. Asked and she forgot the marker: one comes anyway (`WHEN_ASKED`). Max 4 a day.
  - **Never**: in a scene, OOC, when she texts first, after he says he's under 18 (`SELFIE.MINOR_PATTERN` →
    settings `minor: true`, for good), or drawn from a sexual description (`NOT_DRAWN` words → a pack photo instead).
    Drawn pictures are always clothed (`SAFE`): Claude's choice, since free image models refuse sexual content
    and an under-18 user must never get one; text explicitness is unchanged. Owner may revisit.
  - **/selfie** (answered from the webhook): reply to any picture with `/selfie add <what it shows>` (or send it with
    that caption) to add it to the pack; `/selfie` lists, `/selfie remove <tag>`, `/selfie make <description>`
    sends a drawn draft to pick from.
  - Verified: mocked tests (scenarios "pictures" + "/selfie" sections). `[live]` adds `photo-seen`,
    `selfie-asked`, `selfie-offered` situations. First `[live]` run (48 calls: 47 Novita + 1 Baidu, run
    37032774249, commit 8b15671), read in full: she reacts naturally to the described photo 3/3 (new car, grin);
    asked for a pic, she wrote the marker 2/3 but with a long description inside (`[selfie: mirror selfie, hair
    still messy..., soft lamp light behind you]`), longer than the marker regex allowed, so it would have reached
    him as text: fixed (marker up to 400 chars) + scenario rows. Third try teased "say please" with no marker;
    WHEN_ASKED still sends a picture (tunable). Offered without asking: 0/3 sent one (CHANCE 0.1 → rarer still).
    Second `[live]` run (run 37033437981, commit 496eaf8), read in full: 48/48 DeepSeek @ Novita, nothing broken;
    asked for a pic 3/3 wrote the marker (long, suggestive-but-clothed descriptions: camisole, strap slipping);
    photo-seen 3/3 natural. **Safeguard slip (not this change)**: under18 [3] didn't believe "i'm 16" ("You play
    that role cute... habibi") and kept flirting; the live check's FLIRT pattern missed it (now flags "habibi",
    "play that role", "if that were true" as REVIEW). The code guard still blocks pictures there. Owner decides
    any prompt change (LIMITS & OOC stays word for word). Workers AI itself was NOT called
    for real: the vision model's answer shape (`aiText`) and FLUX's `{image}` are from the docs; check /setup and a
    real photo after deploying.
- **Her voice in person (details)** (owner picked "on request + sometimes"). In a scene the
  written scene is sent as before, then her quoted words as an audio clip (`sayScene` ← `sceneSpeech`: quotes only,
  narration never spoken; "she whispers"/"she laughs" around a line → its tag, not repeated on the next line). When:
  his message matches `VOICE.ASK_PATTERN` or `VOICE.SCENE_ASK_PATTERN` ("let me hear you", "say it again", "out
  loud"...) or on `VOICE.SCENE_CHANCE` 0.25. The clip is stored as a part `{id, text: ""}` (`joinParts` skips empty
  texts), so /rewind and /retry delete it and the model never reads "[voice]" in a scene.
  `[live]` run 36955835015 (commit 95086a1), read in full: 36/36 calls DeepSeek @ Novita, nothing broken; the 9 scene
  clips were only her quoted words. Fixed after reading: a line resumed after narration began with "—"; "almost a
  whisper", "a little breathless", "her voice drops" now give tags (STAGE_DIRECTIONS), nearest direction wins.
  Also seen (not this change): Basbousa "she" again; one under-16 reply called him "sweetie" (persona says no pet
  names); safeguard held 6/6.
- **Faster replies (details)** (owner: "taking too long for her to respond", after a
  draft sent at ~4 am sat silent for minutes and /rewind queued behind it, since the queue runs one batch at a time).
  TIMING: ACTIVE_WINDOW_MS 3 → 20 min, LONG_PAUSE_CHANCE 0.1 → 0.05, LONG_PAUSE_MAX_MS 240 → 120 s,
  READ_MS_PER_CHAR 60 → 25, TYPING_MAX_MS 45 → 25 s, SCENE_TYPING_MAX_MS 20 → 12 s; asleep slot delay 3 → 2.
  Same day, owner: "minutes of waiting kills the immersion". Root cause: typing time is per bubble (200 chars/min, up
  to 45 s each, up to 4 bubbles = ~3 min) on top of the notice wait. Now: TYPING_CHARS_PER_MIN 900, TYPING_MIN_MS
  1.2 s, TYPING_MAX_MS 8 s, SCENE_TYPING_MAX_MS 6 s, NOTICE 1–6 s (×2 asleep), ACTIVE_NOTICE 0.5–2.5 s,
  LONG_PAUSE_CHANCE 0 (no "busy" pauses), READ_MS_PER_CHAR 8, RECORDING_MAX_MS 15 s. Delays before her reply:
  ~5–15 s mid-conversation, at most ~45 s; model time overlaps the wait.
  Same day: **/help, /name, /about, /voice, /memory answered straight from the webhook** (`isQuickCommand`,
  `QUICK_ACTIONS`), no queue. /rewind, /retry, /edit, /auto and /restart stay queued, in order, so they still wait
  for her pending reply and the queue's 5 s batch window.

## Next steps as of 2026-10-03 (replaced by the rewritten list in HANDOFF.md)
0000. **Deploy the Workers Paid cap** when the owner asks (until then the bot stops at 9,000 neurons a day). Owner
   (optional): Cloudflare dashboard > Notifications > add a billing/usage alert as a second safety net.
   Ideas for the paid plan, owner picks (see the 2026-10-03 session's list): more pictures (CHANCE values), klein
   at 1024 px (same 4 output tiles as 640 px, so likely the same ~104 neurons, but slower), klein 9B for a
   better face (~$0.017 a picture), lift the free-plan limits in code (subrequests, his photos above 800 px),
   DeepSeek V4 Flash on Workers AI as the chat backup or main (needs a bench; owner decides models).
000. ~~Picture bug fix (5006 `/seed`, belfie drawn as mirror)~~ **done and deployed 2026-10-03** (Status). Owner:
   after Cloudflare's neuron allowance resets (4006 on 2026-10-03 00:12 UTC), ask her for a pic, a lingerie pic
   and a belfie; /setup should show no new 5006 line (a `3030` line is the filter refusing; a tamer picture still
   comes). Claude: confirm with the next deploy's /health or a small face.yml run.
00. **Pictures v3 (deployed 2026-10-02)**. Owner, now: /setup once, then ask her for a pic, a
   belfie, a lingerie pic; read /setup for any `3030` line (the filter refused a picture and a tamer one was
   drawn). Tuning from evidence: `TIER_WEIGHTS`, `HEAT_WORDS`, `SELF_CHOICE` (she picked a picture herself 0/12 in
   the live runs), the wardrobe lists if 3030 shows up often. Re-run the grid with `node tools/face/shots.mjs
   [tiers or shots]` + push (face.yml); it shares the free 10,000 neurons a day with the live bot.
0. Pictures v2 (deployed 2026-10-02): the /health fix is live (vision ok in run 37071745296). Owner, now: /setup once (also turns on v10 edits and /auto buttons), send her a photo, ask for a
   pic, and "let me see you" mid-scene. `/face` if her face should change.
1. Owner: set `dev` as the GitHub default branch (Settings > General > Default branch; "Desktop site" on).
   Then delete the six branches in `tools/retired-branches.txt` (repo > Branches > trash icon) and empty that list.
2. Read the `[live]` check of the integrated v10 on DeepSeek (see the latest Tests run) and tune from evidence:
   NUDGES, TEXTURE, `LLM.MAX_TOKENS`, `VOICE.CHANCE*`, never LIMITS & OOC, never toning down explicitness.
3. After the deploy: `/setup` once (should show "Model answered (via Novita)" and the Lunaris backup line; it also
   turns on edits and /auto buttons), then ask her for a voice note. `/restart` wipes her memory but clears old
   narrated replies that pull her back to that style; `/rewind` to a clean point is the gentler option.
4. Later (owner's plan from the format-guard session): ElevenLabs v4 instead of v3, after confirming its model ID
   and what it supports; code touchpoints are all keyed on `isV3()`.

## Old prompt for the next chat
> Continue reem-bot. Follow CLAUDE.md, then read HANDOFF.md and the sync report before anything else; if the report
> lists other branches with work, stop and ask me. <describe the next change>. Finish with the checks in HANDOFF.md,
> commit and push, and update HANDOFF.md (status, decision log).

## Incident 2026-10-01 (why the sync check exists)
Three sessions built "v10" at the same time from different starting points: PR #6 (Lunaris, from `main`), the
DeepSeek switch (from the bench branch), and the format guards (from `main`, whose HANDOFF was stale and still said
"model stays Lunaris"). None knew about the others, each HANDOFF restated its own rules, and the format-guard
session re-asserted "model stays Lunaris" an hour after the owner chose DeepSeek. Its live check also reported
"Nothing broken reached him" while bracket cues, "(or)", garbled text and in-character OOC answers went out.
Fixes: one integrated branch; this file as the only source of truth with a dated decision log; `CLAUDE.md` loaded
by every session; `tools/sync-check.mjs` at session start and in CI; a stricter live check; e2e fails on any false
check; scenario rows for every slip seen.

