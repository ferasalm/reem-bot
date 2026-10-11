# Lessons

Verified experience, loaded at every session start. Curate, don't just append: merge duplicates, fix entries that
proved wrong, delete ones that no longer apply. Only verified lessons, dated. New entries: symptom → cause → fix.
At most 180 lines (`tools/doc-check.mjs`); once it reaches 180, summarize it back to about 150 (owner, 2026-10-11).

## 1. You can do this yourself (don't ask the owner)
- Workers AI from GitHub Actions: the REST API with `CLOUDFLARE_API_TOKEN` works (face.yml). Klein needs
  multipart form data even with only a prompt; reference images must be under 512x512 (ours: 480).
- Claude's cloud container can't reach openrouter.ai or workers.dev (network policy; the owner can allow a host in
  the environment's Network access settings); deleting branches is refused too. A workflow dumping the live KV chat was refused (2026-10-05): work from code, tests and the owner's report; reading `tools/face/` images works (2026-10-09). `gh run download` is blocked. Live checks and the bench run on
  GitHub Actions; read their logs with the GitHub MCP (`actions_list` / `get_job_logs`).
- The ElevenLabs MCP needs any voice description and sample line to come from the owner. Transcribing a TTS node
  in a flow only echoes its prompt: upload the MP3 as an asset to really transcribe it.
- Read the live Worker after a deploy: the deploy log's Version ID, `/health` and `/setup` (run 37860789952). `workers_get_worker_code` returns the whole bundle (~5 MB on 2026-10-08), so no full code read-back; `cf-resources.sh`'s Vectorize "already exists" errors (3002, 40004) are normal. D1 the same way: `d1_databases_list`, `d1_database_create` and `d1_database_query` (several statements in one call) on the Cloudflare MCP make and check a database (2026-10-11).
- Prices and limits: the Cloudflare MCP's `search_cloudflare_documentation` answers from the current docs (klein
  4B: 26.05 neurons per 512x512 output tile, rounded up, so 768x1024 costs the same as 640x640). Other providers'
  sites (runware.ai, fal.ai) are blocked from the container: WebSearch still finds their prices. (2026-10-03)
- Judging test pictures: a contact sheet of 300 px thumbnails is not enough to say "same face" or "same room"
  (the owner caught it, 2026-10-03) → open each picture at full size, one at a time, and write down per-picture
  checks (face vs reference, age, outfit, phone rule, room vs reference, framing, hands and reflections).
- Test pictures: push a `tools/face/job.json` to your own branch (not `dev`); face.yml draws and pushes them to
  `face-candidates`; `git show origin/face-candidates:<path>` + `montage` make one contact sheet to look at. (2026-10-03)
  face.yml skips dev/main pushes and its own edits (a job pushed to `dev` drew twice, run 59, 2026-10-05); past 7,000 neurons it refuses: set `day_neurons` in job.json. (2026-10-05)
- The session-start sync report can list "N commits not here" for old branches when the clone is shallow (depth 50): the merge base is missing.
  Fix: `git fetch --unshallow origin`, rerun `node tools/sync-check.mjs` (2026-10-08: 25 branches listed, then "OK"); `git cherry origin/dev origin/<b>` counts what's really missing (2026-10-03). Deploy = `git push origin origin/dev:main` (fast-forward) (2026-10-05).
- No OpenRouter in tests/benches (owner, 2026-10-06): Workers AI and Runware only; Runware has no MiniMax Turbo (run 37541102035).
  Text replay on Workers AI: test.yml `model` `@cf/...` (no OpenRouter key passed); never two at once (429, 3021). Runware MCP:
  `account`: the spend is `usage` (`total`, `today` credits), read before and after; the `balance` field lagged a $0.00247 draw (2026-10-11). Hand-run workflows must be on `dev` (404); log blob links are blocked: `get_job_logs`.
- Civitai → Runware LoRAs (2026-10-08): the proxy allows `api.civitai.com` (not civitai.com); `/api/download/models/<v>` answers a
  307 to a signed link (24 h) Runware fetches (REST `modelUpload` + `uniqueIdentifier` = sha256; give Actions that link: it has no key).
  "failed to load": DoRA or OneTrainer LoRA (`transformer.` keys, POV hand) → `dora-to-lora.py`, LoKR → `lokr-to-lora.py --rank 128`; custom klein checkpoints: "internalError".
  Civitai file keys without downloading: `curl -r 0-7` (header length), then `-r 8-<n+7>`. Kohya and BFL naming load; PEFT doesn't.
  9 LoRAs in one call work, but her face drifted 5/8 → keep ≤6. A named room's picture pulled blowjobs into wide shots. (2026-10-08)
  Runware klein 9B bills GPU time in steps of ~$0.0008: 576x1024 at its defaults $0.00169; 1024² $0.0025-0.0034, 1008x1792 $0.0034-0.0042 (more LoRAs = the higher one); steps 4-5, acceleration and CFG don't change it (round 4, 2026-10-08). Calls past ~60 s die at the proxy: `deliveryMethod: "async"`. The proxy injects Runware's key: `NODE_USE_ENV_PROXY=1 node` + `loadWorker()` + `drawPicture(...)` benches the bot's own picture code from the container (calls ~4 s apart, else 502; a bench script that wraps `fetch` can fix `seed`). (2026-10-08) A direct Runware call (`inputs.referenceImages`, `lora: [{model, weight}]`) from the container works the same way (2026-10-09). A direct call's 502 "upstream request failed" can still be drawn and billed (2 of 2, 2026-10-11): read `usage` after, not the script's sum.
- Sex acts drawn with the wrong opening (round 6, 2026-10-08; owner: "don't confuse which is anal and which is normal vaginal") → judge genitals only on a full-size crop (`convert -crop 600x600+200+1050`): at 800 px a small vulva-shaped slit where her anus is looked "right" (0/3 on zoom). Unchained XXX on penetration put the penis below an open, empty vulva (riding 0/4, missionary 0/4, even worded "inside her vagina") → `NUDE_LORAS_OFF_WITH`; the realism LoRAs with POV Doggy Anal drew a vulva for her anus from behind (4/5) → `ALONE_LORAS` (alone at 1.0: 6/6); on her back it fused her front and spread bottom. Vaginal acts say "inside her vagina". Flux 4 Play draws her tongue out whatever the mood words. Step 6 (2026-10-11): act LoRAs trained on vaginal sex (Flux 4 Play, Missionary POV) put the entry at her vulva even with "inside her anus" words (0/9); only POV Doggy Anal draws anal, and only as a rear view (on her back it lost her legs); General Penis alone draws no penetration (0/9).
- A random "open-mouthed moan" on a blowjob drew her tongue out → eyes-only `MOODS.ORAL`. /look missed acts: her narration says "wraps her lips around it", "pulls you down on top of her" → `SEX_CUES` (+ `SEX_CONTEXT`). Test a new word list on her real phrasing (`startPicture` "scene"), not on keyword prompts. (round 5)
- A new body reference costs cents (round 7, 2026-10-08): klein 9B on Runware with body-v2 as image 0 ("image 0 dressed: exactly the same body
  and size, nothing slimmer ...", or "seen from directly behind") kept the build 2/3 seeds (one slimmer) → pick at full size. Clothed pictures
  were "overweight" because REFERENCE said "image 1 but curvier ... wide hips, full thighs" on top of a heavier body picture: words added to a
  reference count twice; with none, klein drew her slimmer than image 1 (round 8) → name image 1's own shape + "not slimmer". A bigger
  reference costs GPU time: a third picture (the room) or a 768x1344 body picture each add ~$0.0009 → body pictures at 576x1024.
  A cropped top in the body picture cropped every T-shirt. PussyDiffusion on penetration melted the penis into the labia (General Penis fixes it).
- Belly (2026-10-10): her body words stacked on a body picture that already has a belly (REFERENCE's "softly rounded belly, wide hips, full thighs", added in round 8 against slimness), and the TwinFlow fallback sent no reference with hourglass words. Fixed: her pictures retry klein, then Cloudflare klein with her references; no TwinFlow. Found free by stubbing `globalThis.fetch` and printing each Runware request (references, prompt). Clothed body references (2026-10-09): nipples showed through a fitted opaque tank on 3/4 seeds (pick the seed with none, read at full size); a clothed picture with no outfit named draws the body picture's own clothes (the rust halter, 2026-10-10 bare-words bench), so bench with the wardrobe words; cut below the mouth: lips gone at +96 px (768x1376) or +170 px (1535x2730).
- Two writers on one repo: stop a background workflow before its steps are run by hand (TaskStop; its log's mtime shows it idle; 2026-10-10 the Haiku agent had already cropped files). `.github/workflows/image-bench.yml` runs on every push that changes `tools/face/bench.json` (paid; skipped only on face-candidates): edit it only when the owner wants a bench run.
- Klein copies the place picture's light: a flash picture with her room attached kept its lamp light → no place picture on flash (2/2). 16:9: blowjobs 3/3 in her mouth, but a clothed sofa picture drew her twice (1/1). New shot names are matched as words in her descriptions (`shotNamed`): "lying"/"pillow" stole her plain selfies → names nobody writes. (2026-10-08)
- Pictures soft and plastic, same smile, sex acts posed wrong (round 4, 2026-10-08) → 576x1024 (face ~100 px), a 460 px face reference whose closed-lip smile klein copies, and ~2,500-character prompts that drowned the act and the LoRAs (blowjob 0/10, doggy facing the lens) → 1008x1792 or 1024², CFG 1, the 2x face, "not image 0's expression", short prompts (blowjob 4/4, doggy 2/2); 1:1 beat 9:16 on sex acts 7/7 vs 5/7. An expression placed early turned doggy to face the lens: on sex acts it goes after the act words.
- Picture bench from the container (round 5, 2026-10-08): fix `Math.random` too (MOODS/GAZES/place picks) or two variants differ by
  more than the LoRA; give `env` an `AI` stub (both Runware models 502 → the Cloudflare fallback crashed the run); `startPicture`'s result
  has no `model`; `montage -geometry x700` pads every tile to the widest picture → `convert ... -resize x700 +append` for mixed sizes.
  Dropping 2 of 6 LoRAs cut a sex act from $0.0042 to $0.0034 (fewer LoRA loads = less GPU time).
- /setup is a web page, not a Telegram command (owner, 2026-10-06): never tell him to send it; deploy.yml opens it. Its last line says "send /restart", and /restart wipes her memory (`docs/OPTIONS.md`): don't repeat it (2026-10-08).
  A new CONFIG key needs a hand-written field row in `tools/settings-panel.html` `SECTIONS` (the unit test lists the missing ones).

- Skills/agents go in the repo's `.claude/` (`~/.claude` is wiped; personal skills don't load in cloud chats); a new agents folder needs a new chat (2026-10-11).

- Browser checks here (2026-10-11): global Playwright (`createRequire` on `/opt/node22/lib/node_modules/playwright`) with `executablePath: "/opt/pw-browsers/chromium"`; `response.headers()` hides Set-Cookie (use `allHeaders()`); the browser's own `/favicon.ico` 404 is not the page's (the CSP refuses a `data:` icon).
- Voice and API facts (2026-10-04): Qwen3-TTS voices are lowercase (`serena`); MiniMax Speech 2.8 on Runware needs `speech.voice`; Cloudflare's third-party models need AI Gateway credits (402); OpenRouter image-only models answer on `POST /api/v1/images` (`input_references`, `data[0].b64_json`), not chat completions.

## 2. Known traps
- A link opened from another app (2026-10-11): a 302 that sets `SameSite=Strict` loses the cookie on the redirected request (the owner's /studio was 404 though the cookie was stored): answer the page itself with `SameSite=Lax`. Plain http hid it (Secure); reproduce over https with a different-site page (`tools/test/studio-browser.mjs`).
- Off on Runware (2026-10-11): `checkContent` on did not stop a naked lower half: the nude front as image 1 with only a top named (row 13, "a cardigan over a black cami") drew the bottom naked → `RUNWARE.DRESSED_BOTTOM`; Off now draws on Cloudflare (its filter). A line gated on word lists needs a sweep of every WARDROBE entry through `runwarePlan` before the push: the bottoms line forced jeans onto a lace set with "briefs" and onto two bare-legs FLIRTY outfits (fix round review) → more BOTTOM_WORDS, `BARE_LEGS_WORDS`.
- A route-dependent gate at a level change (2026-10-11): with Off on Cloudflare, `mayDraw` used Cloudflare's NOT_DRAWN (no sex-act words), so "blowjob" passed at Off; the unit `levelFor` row caught it. Gate by the level's rule, not the route's list, and re-run `levelFor` and `mayDraw` after any route change.
- A head too large for the body (nude mirror, Step 3, seed 101) came from the camera, not the face reference: the random gaze "looking up at
  the camera through her lashes" put the camera above her (a level gaze drew it in scale; the 1x face drew the same head) → gaze removed.
  A gaze or expression is camera words too. Test a lead by changing one thing at the same seed, after redrawing the original once. (2026-10-11)
- An act LoRA's own pose can override the scene words: Flux 4 Play's doggy (d0gg13) drew the man lying down and her torso upright, the
  cleft closed (no anus at seed 202); without it the anus showed at both seeds → no Flux 4 Play on doggy. The body picture didn't matter. (2026-10-11)
- Blowjob arms slim at seed 101 (arms stretched forward, seen from above): not image 1, not BIG_FACE; Unchained 0.8 pulls the bust and arms
  smaller, but povdt alone lost the act. Open. Withdrawn (owner): the doggy "ghost hands" were correct. (2026-10-11)
- Four realism LoRAs (phone2025 0.6, ultrareal5 0.6, instapic 0.6, realhd2kc 0.5 = 2.3) on a clothed picture showed a bare nipple once (clothed
  bedroom, seed 202, V0); the same seed with 2 or 0 realism LoRAs stayed covered. One case: not a rate.
- A superseded rule can live on in a prompt string: her own pictures were never nude because `PICTURE.SELF_CHOICE` still said "Your pictures never show you fully naked." (2026-10-02 rule, dropped 2026-10-06) → when a decision supersedes a rule, grep every prompt string for it. (2026-10-11)
- Picture prompts go to the D1 table `pictures` (`reem-studio`) from the first deploy after Step 1 (2026-10-11; not deployed yet): check that table, not the Worker log; /look's DeepSeek text is `llm_text`. D1's Worker `exec()` reads one statement per line (a multi-line CREATE TABLE fails; the MCP's `d1_database_query` doesn't, and a fake D1 hides it) → `batch()` of prepared statements; check SQL in `node:sqlite`. R2 is off on the account (403 10042). POV hand sits in `ACT_WORDS` but not `ACT_LORAS`, so it never loads: read `runwareLoras` before blaming a LoRA. (2026-10-11)
- History before v10 has no `parts` (can't be /edit-ed or /rewind-ed: NOT_FOUND); before v8 no `at` either. Rewind/edit only reach the verbatim history; older chat is in `m:` notes (TOO_OLD). Telegram deletes bot messages only for 48 h.
- A `VOICE_ID` Worker secret, if set, overrides `VOICE.ID`: remove it.
- Cron runs (every 15 min) must finish within 30 s, so `scheduled` only queues a task.
- `clean()` strips `[...]` at line starts except allowed audio tags; `dropCues()` strips them anywhere (keeping
  allowed tags in voice notes); `tidySpoken()` strips every other `[...]` before TTS.
- eleven_v3: no `<break>` (lines joined with "..."), stability 0/0.5/1 only, speaker boost not sent. Tags only when
  `VOICE.MODEL` starts with `eleven_v3` and `AUDIO_TAGS` is on.
- `texting()` keeps `*word*` mid-sentence as emphasis; her own name in a text or voice note is narration (PR #6:
  texts are "I"), but an OOC answer may name her.
- Reactions only when apart, never OOC or when she texts first; stored on her entry (`react`, `reactTo`) so /retry,
  /rewind and his edits clear them.
- Free-plan limits still in code (Workers Paid since 2026-10-03 lifts them): 50 outside calls per run (`budget`, `SUBREQUEST_RESERVE`), about 1000 KV writes a day, 10 ms CPU. A reply can take up to 4 OpenRouter calls (2 attempts, the backup, one retry).
- Context: `LLM.CONTEXT_TOKENS` 32768 for DeepSeek; the Lunaris backup gets older chat cut to 8192
  (`fitMessages`). History folds into notes at 40 messages, keeping 24 (PR #6 had cut this to 24/14 for Lunaris).
- Tests: `CONFIG_OVERRIDES` is cached once per run, so tests set `W.CONFIG` directly. Voice chances are 0 in e2e and A unit row comparing a plan's refs must leave out random picks (the hairstyle picture failed 1 run in 6, fix round review, 2026-10-11): rerun a new test file ~10 times.
  scenarios except where a test asks. e2e `herPrompts()`/`sys()` read her prompts (not memory or /auto).
- Telegram reactions: only its fixed emoji list (❤ without FE0F, 🤣 not 😂). Panel textareas get a leading "\n" on purpose.
- Pictures stopped, /setup showed `5006 '/seed'` → the real cause was out of neurons (4006, whose text says
  "upgrade") read as "model unavailable", and face.yml runs bypassing the bot's ledger → when an AI error looks odd,
  run the AI diagnosis workflow (`ai-diag.yml`) and read Cloudflare's analytics before fixing the error shown. (2026-10-03)
- Lingerie on other routes (image bench 2026-10-04; numbers in `docs/QUALITY.md`): Cloudflare's 3030 is an output filter and random (never conclude from one); klein via OpenRouter, Grok and Seedream were refused or drew 5/9; Runware with `safety.checkContent: false` drew lingerie, see-through and nudity 3/3 with TwinFlow (no face reference, a slim body); klein 9B needs a balance over $0.05 (a small one stays reserved ~40 s after a call).
  A nude body picture as klein's image 1 made clothed pictures nude 6/6, even when named (nude body only on nude pictures, `BODY_CLOTHED`); klein 9B draws nude 8/8 only with "completely naked: no tank top, no leggings" (with "naked" alone the clothes leaked); "her head is naturally sized for her body, about one seventh of her height" keeps the head in scale (run 37406592599); fuller arms on TwinFlow: name them first and again with a weight (2/2), "soft, full, fleshy" alone stayed slim (run 37404957788). (2026-10-04, 2026-10-08)
- bench-models.mjs reads `prompt_sets[job.family_of[route] || route.family]`: a route without a family crashes the run
  (run 37172077483). face.yml, image-bench and tts-bench share one queue that keeps one waiting run: a third push
  cancels the waiting one (2026-10-05) → push one job, wait, then the next; tts `max_chars` counts instructions too.
- Workers AI Whisper reads Telegram's OGG/Opus as base64 `audio` (32/32, voice bench 2026-10-04); aura-2 can return
  OGG/Opus (`encoding: "opus", container: "ogg"`), ready for sendVoice. aura-2 performs "mm" and "hm" but not
  "hhh" (a sigh is silent) and reads [tags] aloud; "haha" sounds robotic (owner), "heh" is heard as "Phew"/"Okay",
  "hehe" makes the line shouted → `VOICE.AURA_CUES` drops laughs. aura costs 2.73 neurons a character. (2026-10-04)
- OpenRouter speech (`POST /api/v1/audio/speech`, run 37174172123): Gemini TTS answers only `response_format: "pcm"`
  (24 kHz 16-bit mono; ffmpeg `-f s16le -ar 24000`); a wrong `voice` makes Deepgram list its voices in the error;
  Sesame needs a voice; MAI-Voice-2 and Qwen gave a bare "Provider returned 400". Telegram's sendVoice takes MP3.
  Whisper never transcribes laughs: judge them by ear. (2026-10-04) Hearing (stt bench 2026-10-05): OpenRouter audio
  chat models take Telegram's OGG as `input_audio` format "ogg"; Nova-3 turns Arabic into Devanagari.
- Vendoring a third-party npm package into the repo (lamejs for Gemini TTS's PCM → MP3) was refused by the session's permission check until the owner said "add lamejs": ask first, then add. 5 s of speech encode in ~0.2 s. (2026-10-04)
- Body on klein follows image 1: the black-dress body picture gave square shoulders and its dress leaked (live, and 2/3
  selfies) → a Nano Banana picture in a gray tank + leggings (bench 37271580261): rounded shoulders 8/8, asked clothes 8/8.
  Words still move the size: "wide hips, full thighs" heavy, "slim legs" or "not plump" slim; "165 cm, 71 kg, not slim and
  not obese" got 1/3 selfies at BMI ~25, 2/3 ~23 (face runs 2026-10-05). Trim jobs past `day_neurons`, don't raise it.
- Lingerie pictures came out as robes or tamer outfits → Cloudflare's filter (3030) refuses any prompt with bra,
  panties, briefs, thong or g-string (5/5), and every boudoir back view (4/4), and judges the whole prompt (a
  "two-piece set" passed once, failed once) → `FILTER_WORDS` draws those as a bodysuit or string bikini in her
  color; mirror-back left out of BOUDOIR. Front-view lace bodysuits pass. Real lingerie needs another provider.
  "top and bottoms" passes but draws pajamas. (face runs 37151684663, 37152577208, round 3; 2026-10-03)
- Night pictures came out in daylight (0/12) → klein copies the place picture's light, and wording alone turned the
  lamp on 1/3 → night place pictures (`places/<key>_night.jpg`): lamp on 6/6, night window 2/6 (round 5). Drawing
  them, "deep shadow" made 3 of 7 rooms too dark to use → "warmly lit and easy to see". (2026-10-03) Scene pictures with "natural light": 3/3
  daylight at 1:30 even with the night place → `SCENE_NIGHT`: 3/3 night (face runs 37269519565, 37269696933; 2026-10-05).
  Bathroom body-length mirror shots broke 3/3 (its mirror is small and round) → bedroom/hallway only. (2026-10-03)
- With a place's picture attached she came out small in a wide room shot → klein copies the reference's framing →
  `ROOM` puts the room "behind her" and says she fills the frame (2026-10-03). It also kept the place picture's angle (owner;
  rewording fixed 1 of 6) → three crops per place (`tools/face/places/views`): 8/8 another part of the room (run 37340198460, 2026-10-05).
- klein took 9-238 s a picture on 2026-10-03 (one 408 after 241 s); `draw.mjs` then falls back to Pollinations,
  whose pictures carry a watermark → never pick those as references; the bot waits up to `TIMEOUT_MS` 120 s. (2026-10-03)
- Right after a deploy the old code may still serve → re-test later (2026-10-03). Cloudflare's 3030 is random: never conclude from one. A live check said "nothing broken reached him" while broken replies went out (Incident, docs/CHANGELOG.md) →
  read every reply of a `[live]` run, not its summary. (2026-10-01)

- Pose words that are also clothes (2026-10-11): "sitting back on her heels" counted as shoes ("heels"), so a naked mirror shot read as
  partly naked → pictureFlags takes "on her heels" (and, Step 5, riding "on top") out before the clothes check. A bare clothes-ish word
  is a trap in sex narration: "covered" (in sweat), "between her legs" (his knees, her hand) → only phrases that name the thing.
- A sync function can't await: `startPicture` is sync (it returns the drawing promise), so a `dayOutfits(env)` await inside it
  broke the module load (golden check, SyntaxError). The async callers pass the day's outfits in as an option (`dayWear`).
- Her back: "her back" in NUDE_BACK_WORDS would make "naked, lying on her back" a back view, so it is left out (2026-10-11).
- Klein copies image 1 (2026-10-11): a clothed image 1 its garment's cut (the rust halter's crop length, a gray tank's scoop neck, 0/18
  with no body picture); the nude image 1 is safe when a garment is named (12/12 outfits, `CLOTHED_BODY` "nude", owner) but with words
  that name none ("covered breasts") it drew image 1 whole, naked, 0/6 → no body picture there (Step 5). Judge modes on same-seed side-by-sides.
- Image numbers in a prompt must follow the pictures sent: ROOM's `{n}` assumed a body picture, so "none" modes said "image 2" with
  only face and place sent (Step 4-5 benches; fixed). A tall 9:16 frame plus her face picture kept every crotch close-up framed from
  her lips down (12/12): 1:1 without the face 0/4 (Step 5). The camera is the frame and the references, not the framing words.
- A new description of her must pass the owner's word bans: Step 5's REFERENCE_CLOSE got "a soft belly, full soft hips and thighs",
  which 2026-10-10 had taken out of every description → grep DECISIONS for the body words before writing one.
- Shared KV keys and `ctx.waitUntil` (2026-10-11): `refreshDay` wrote back the "day" object `dayInfo` read at the start of the reply,
  erasing the outfits `dayOutfits` saved meanwhile → re-read the key right before the write and keep the other writer's field.
- Golden cases are seeded by their index: inserting cases mid-list moved every later case's random picks and buried the real diff
  (Step 4) → add cases at the end; compare old and new golden case by case with the expected changes normalized out.

## 3. Routes to avoid (and the cheaper route)
- Never read `worker.js` whole (~212 KB, ~53k tokens): `grep -n` the function or CONFIG key (docs/MAP.md names them), then read only those lines.
  Never open `face.js` (base64 image) or `tools/settings-panel.html` (generated: run `node tools/build-panel.mjs`); `tools/face/reference.jpg` once, for a face check only.
- `docs/CHANGELOG.md` and `tools/model-bench/FINDINGS.md`: `grep -n`, don't read whole.
- Mocked tests: trust the exit code and read the failing lines (`node tools/check.mjs`). `[live]` runs: read every
  reply in the job log (GitHub MCP `get_job_logs`), REVIEW lines included.
- Don't spawn sub-agents to explore: they start cold and re-read what you already know.
- Moving text between files: use a script that asserts each old string exists, never retype it. The assert alone is not enough: anchor on text unique to the line, then print the changed lines (2026-10-09: an import edit hit the pics map).
- The live log cuts each model reply at ~400 characters → to reproduce a slip, rebuild the reply and run it through
  `shapeReply` from a scratch script with `loadWorker()` (`tools/test/load-worker.mjs`). (2026-10-05)

## 4. What works
- `node tools/check.mjs` before every push (`git add` new files first: the map check reads `git ls-files`, so an untracked new script passed locally and failed after the commit, 2026-10-11); `[live]` in a commit runs the real-model check, and a skipped live job → dispatch test.yml (`actions_run_trigger`) and watch it (Monitor on `api.github.com/repos/ferasalm/reem-bot/actions/runs/<id>`, grep `"status"`, poll 30 s). (2026-10-06, 2026-10-08)
- Refactoring a sender (2026-10-11): capture golden plans first (`tools/test/picture-plans.mjs`, network stubbed, $0), keep every `Math.random` pick in its order, golden diff empty; the sender only sends (LoRA unit tests read `runwarePlan`). A level added to it (/nsfw, 2026-10-11): callbacks like `.map(W.sexCue)` pass the index as the second argument, so check levels by name (`actsOff`), never `level !== "on"`; a golden case for a level matches structure (body, clause, LoRAs, sampler), since each case draws its own random picks. Moving words out of a shared pattern (naked out of BOUDOIR_ASK_PATTERN, for his ask) changed a second reader too (`selfiePicture`, her own words): her naked selfie lost its tier and the golden didn't show it → `grep -n` every reader of a pattern before editing it.
- Before writing "deployed" or "not deployed" in HANDOFF, read the remote: `git ls-remote origin main` and the Deploy to Cloudflare runs for `main` (2026-10-09: remote main was 9309e8e, deployed 03:13 UTC, while the draft said 9803e28).

## 5. Model behaviour seen live (DeepSeek V4 Flash unless named)
- Before any model switch, replay `OWNER_CHAT` with `model` (Nemo, removed 2026-10-06, wrote 1-4 word texts). Examples teach as strongly as rules: Basbousa drifted to "he" because an example said "bring him back" (2026-10-02);
  the v11 texting example's "envelope that says CASH" came back in 5 of 9 apart replies (run 37259031783), 0 after
  examples with rhythm but no story detail. Check the examples first when a reply repeats or a fact drifts. (2026-10-05)
  Again 2026-10-06 (run 37459992726): the napkin receipt 6 times, "taxes are a suggestion" 5 → both examples replaced.
- DeepSeek on Workers AI (2026-10-06): with reasoning "none" a chat reply is empty ~1 in 4 (retried; the last 2 tries "low") and a
  bare task prompt nearly always ("Reply with: OK" 5/5) → tasks use "low" (+1500 tokens, ~20 s). Caching cuts ~3,600 of ~3,700 tokens.
  AI Gateway refuses picture uploads ("does not support ReadableStreams") → `aiRun` routes only text and vectors through it.
- A rule that names the word to avoid makes her talk about it: "(he is habibi, never habibti... even when he calls you
  habibti)" → "habibi, not habibti" corrections 4/5; "(to him it's always habibi)" → 1/5 (runs 37517733148, 37518157279). (2026-10-06)
- Told to go to him, she walks in with words `HER_MOVE` misses ("turns the handle and steps in") → visit mode trusts the scene. (2026-10-06)
- "him/his" for "you" in scenes survived a prompt rule (3/9 scenes, two runs): POV slips need a code guard (`toYou`). (2026-10-05)
