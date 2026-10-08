# Lessons

Verified experience, loaded at every session start. Curate, don't just append: merge duplicates, fix entries that
proved wrong, delete ones that no longer apply. Only verified lessons, dated. New entries: symptom → cause → fix.
At most 150 lines (`tools/doc-check.mjs`).

## 1. You can do this yourself (don't ask the owner)
- Workers AI from GitHub Actions: the REST API with `CLOUDFLARE_API_TOKEN` works (face.yml). Klein needs
  multipart form data even with only a prompt; reference images must be under 512x512 (ours: 480).
- Claude's cloud container can't reach openrouter.ai or workers.dev (network policy; the owner can allow a host in
  the environment's Network access settings); deleting branches is refused too. The permission check refused reading files under `tools/face/` and a workflow dumping the live KV chat (2026-10-05): work from code, tests and the owner's report. `gh run download` is blocked. Live checks and the bench run on
  GitHub Actions; read their logs with the GitHub MCP (`actions_list` / `get_job_logs`).
- The ElevenLabs MCP needs any voice description and sample line to come from the owner. Transcribing a TTS node
  in a flow only echoes its prompt: upload the MP3 as an asset to really transcribe it.
- Read back the live Worker's code with the Cloudflare MCP after a deploy (done for every deploy on 2026-10-02/03).
- Prices and limits: the Cloudflare MCP's `search_cloudflare_documentation` answers from the current docs (klein
  4B: 26.05 neurons per 512x512 output tile, rounded up, so 768x1024 costs the same as 640x640). Other providers'
  sites (runware.ai, fal.ai) are blocked from the container: WebSearch still finds their prices. (2026-10-03)
- Judging test pictures: a contact sheet of 300 px thumbnails is not enough to say "same face" or "same room"
  (the owner caught it, 2026-10-03) → open each picture at full size, one at a time, and write down per-picture
  checks (face vs reference, age, outfit, phone rule, room vs reference, framing, hands and reflections).
- Test pictures: push a `tools/face/job.json` to your own branch (not `dev`); face.yml draws and pushes them to
  `face-candidates`; `git show origin/face-candidates:<path>` + `montage` make one contact sheet to look at. (2026-10-03)
  Pushing a job to `dev`, or restoring job.json on your branch, drew it again (run 59, 2026-10-05) → face.yml now skips
  dev/main pushes and its own edits (like tts/stt benches); a job.json push to your branch still draws. (2026-10-05)
- The sync report listed an old branch with "26 commits not here" → the clone was shallow (depth 50), so the
  merge base was missing → `git fetch --unshallow origin`, then recount before asking the owner. (2026-10-03) `git cherry origin/dev origin/<b>` counts what's really missing. Deploy = `git push origin origin/dev:main` (fast-forward). (2026-10-05)
- face.yml refused a job at 6,618 neurons used: draw.mjs's day cap 7,000 dates from the free plan → set
  `day_neurons` in job.json (Workers Paid; the owner's cap is AI_BUDGET.DAILY_NEURONS 28,000). (2026-10-03)
- No OpenRouter in tests/benches (owner, 2026-10-06): Workers AI and Runware only; Runware has no MiniMax Turbo (run 37541102035).
  Text replay on Workers AI: test.yml `model` `@cf/...` (no OpenRouter key passed); never two at once (429, 3021). Runware MCP:
  `account` = balance + today's spend. Hand-run workflows must be on `dev` (404); log blob links are blocked: `get_job_logs`.
- Civitai → Runware LoRAs (2026-10-08): the proxy allows `api.civitai.com` (not civitai.com); `/api/download/models/<v>` answers a
  307 to a signed link (24 h) Runware fetches (REST `modelUpload` + `uniqueIdentifier` = sha256; give Actions that link: it has no key).
  "failed to load": DoRA or OneTrainer LoRA (`transformer.` keys, POV hand) → `dora-to-lora.py`, LoKR → `lokr-to-lora.py --rank 128`; custom klein checkpoints: "internalError".
  Civitai file keys without downloading: `curl -r 0-7` (header length), then `-r 8-<n+7>`. Kohya and BFL naming load; PEFT doesn't.
  9 LoRAs in one call work, but her face drifted 5/8 → keep ≤6. A named room's picture pulled blowjobs into wide shots. (2026-10-08)
  klein 9B with refs: $0.00078, with 1-4 LoRAs $0.00169 (flat). Calls past ~60 s die at the proxy: `deliveryMethod: "async"`. The proxy injects Runware's key: `NODE_USE_ENV_PROXY=1 node` + `loadWorker()` + `drawPicture(...)` benches the bot's own picture code from the container (calls ~4 s apart, else 502). (2026-10-08)
- /setup is a web page, not a Telegram command (owner, 2026-10-06): never tell him to send it; deploy.yml opens it.
  A new CONFIG key needs a hand-written field row in `tools/settings-panel.html` `SECTIONS` (the unit test lists the missing ones).

## 2. Known traps
- History before v10 has no `parts` (can't be /edit-ed or /rewind-ed: NOT_FOUND); before v8 no `at` either.
  Rewind/edit only reach the verbatim history; older chat is in `m:` notes (TOO_OLD). Telegram deletes bot messages only for 48 h.
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
- Free plan limits still coded (Workers Paid since 2026-10-03 lifts them; not yet changed in code): at most 50
  outside calls per run (`budget`, `SUBREQUEST_RESERVE`); about 1000 KV writes per day; 10 ms CPU.
  A reply can take up to 4 OpenRouter calls (2 attempts + backup, then one retry).
- Context: `LLM.CONTEXT_TOKENS` 32768 for DeepSeek; the Lunaris backup gets older chat cut to 8192
  (`fitMessages`). History folds into notes at 40 messages, keeping 24 (PR #6 had cut this to 24/14 for Lunaris).
- Tests: `CONFIG_OVERRIDES` is cached once per run, so tests set `W.CONFIG` directly. Voice chances are 0 in e2e and
  scenarios except where a test asks. e2e `herPrompts()`/`sys()` read her prompts (not memory or /auto).
- Telegram reactions: only its fixed emoji list (❤ without FE0F, 🤣 not 😂). Panel textareas get a leading "\n" on purpose.
- Pictures stopped, /setup showed `5006 '/seed'` → the real cause was out of neurons (4006, whose text says
  "upgrade") read as "model unavailable", and face.yml runs bypassing the bot's ledger → when an AI error looks odd,
  run the AI diagnosis workflow (`ai-diag.yml`) and read Cloudflare's analytics before fixing the error shown. (2026-10-03)
- Lingerie on other routes (image bench 2026-10-04, `docs/QUALITY.md`): Cloudflare's 3030 is an *output* filter
  ("Your output has been flagged"); klein via OpenRouter is refused by Black Forest Labs even with `safety_tolerance` 5;
  Seedream 4.5 (OpenRouter $0.04, also on Cloudflare as `bytedance/seedream-4.5`) drew 5/9, bra + panties included,
  random like 3030 (same words passed once, failed once); Grok Imagine 2.0 refused 2/2 with her face attached. Runware with `safety.checkContent: false` (2026-10-06): TwinFlow Z-Image-Turbo drew lingerie, see-through and full nudity 3/3 at $0.0006 (text only, slim body, no face reference); klein needs more than $0.05 balance, Z-Image-Turbo and Fish Audio a $5 balance; a small balance stays reserved ~40 s after a call (`concurrentRequestLimitExceeded`); TwinFlow puts an iPhone in any "selfie" (2/2) and keeps the same face without a reference (6/6). Fuller arms on TwinFlow: only naming the arms first and again with a weight ("Photo of a woman with full soft chubby arms: ... 75 kg ... with full soft chubby arms") worked 2/2; "soft, full, fleshy" alone stayed slim (run 37404957788). A nude body picture as klein's image 1 made 6/6 pictures that named no clothes nude, even with a "she is dressed" line → nude body only on nude/sex pictures (`BODY_CLOTHED`; 2026-10-08). Fuller bodies shrank the head (owner) → "her head is naturally sized for her body, about one seventh of her height, with full soft cheeks..." put it back in scale (run 37406592599); a 50 mm lens line didn't help. Runware once answered HTTP 200 "{}" after 28 s: retried now. klein 9B on Runware (safety off) keeps her face and draws nude 8/8, but only when the prompt says "completely naked: no tank top, no leggings...": with "naked" alone the body picture's clothes leaked (4B 4/4 dressed; runs 37434273611, 37434510898). The same klein 9B call once billed $0.0907 and took 111 s (run 37437301547; cause unknown): the bench stops past 5x the list price. A clothed body picture leaks its clothes into nudes even when named (beige bodysuit 3/4) → a faceless nude body picture (TwinFlow crop): 0 leaks, natural nipples (run 37439133800). Qwen3-TTS voices are lowercase (`serena`). MiniMax Speech 2.8 on Runware (`minimax:speech@2.8`): `speech.voice` required (e.g. `English_captivating_female1`), takes `speech.emotion`, (laughs)/(sighs) in the text; ~$0.09/1k chars (run 37538682473). Cloudflare's third-party models need AI Gateway credits
  (402 "Insufficient balance"); its Seedream 4.0 takes no reference image. OpenRouter image-only models answer on
  `POST /api/v1/images` (`input_references`, `data[0].b64_json`), not chat completions (404). (2026-10-04)
- Lingerie on klein without trigger words: two-piece "top + bottoms" wordings get covered up (round 1: 3/16 as asked,
  9 tamer); one-pieces and layers do better (round 2: 4/12 as asked, 4 half, 4 refused, 0 tamer: bodysuit + stockings,
  robe or his shirt open over a set, satin one-piece; the corset gets shorts added). Runs 37263536954, 37266040257. (2026-10-05)
  Run 37339347977: 2 of 3 refused, 1 drawn as "a red silk romper" → LINGERIE.CHECK sends tamer ones to Nano Banana. (2026-10-05)
- Lingerie on Workers AI's own models (bench 2026-10-04, `docs/QUALITY.md`): flux-2-dev has klein's output filter
  (bra/panties 0, babydoll 2/14, and it dodges by drawing tamer clothes or an empty room); lucid-origin and schnell
  filter the *prompt* (free refusal, 1/14 and 2/9) and draw real lingerie when it passes, but take no face reference.
  A bench count of "not black" is not "drawn": read each picture (2 empty rooms counted as drawn). schnell refuses
  `seed` (5006). (2026-10-04)
- Nano Banana (Gemini image, OpenRouter) refused lingerie 11/11 with her face picture attached (IMAGE_PROHIBITED_CONTENT,
  IMAGE_OTHER) and drew 11/11 text-only: Google refuses the face reference + lingerie, not lingerie. Gemini image models
  answer on chat completions (`modalities: ["image","text"]`, `image_config.aspect_ratio`, picture in
  `message.images[0].image_url.url`); a refusal is HTTP 200 with no picture and `native_finish_reason`. (2026-10-04)
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
- Vendoring a third-party npm package into the repo (lamejs for Gemini TTS's PCM → MP3) was refused by the session's
  permission check until the owner said "add lamejs": ask first, then add. 5 s of speech encode in ~0.2 s. (2026-10-04)
- Body on klein follows image 1: the black-dress body picture gave square shoulders and its dress leaked (live, and 2/3
  selfies) → a Nano Banana picture in a gray tank + leggings (bench 37271580261): rounded shoulders 8/8, asked clothes 8/8.
  Words still move the size: "wide hips, full thighs" heavy, "slim legs" or "not plump" slim; "165 cm, 71 kg, not slim and
  not obese" got 1/3 selfies at BMI ~25, 2/3 ~23 (face runs 2026-10-05). Trim jobs past `day_neurons`, don't raise it.
- Cheap lingerie without her face (2026-10-04): Recraft V4.1 Flash (OpenRouter) 7/7 at $0.007; Seedream 4.5 always without a face picture
  (5/9 with one); Krea has no 3:4. Free route: beta SD models blank NSFW to black; SD 1.5 inpainting over klein 3/5 (1 good).
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

## 3. Routes to avoid (and the cheaper route)
- Never read `worker.js` whole (~212 KB, ~53k tokens): `grep -n` the function or CONFIG key (docs/MAP.md names
  them), then read only those lines. Never open `face.js` (base64 image), `tools/face/reference.jpg` or
  `tools/settings-panel.html` (generated: run `node tools/build-panel.mjs`).
- `docs/CHANGELOG.md` and `tools/model-bench/FINDINGS.md`: `grep -n`, don't read whole.
- Mocked tests: trust the exit code and read the failing lines (`node tools/check.mjs`). `[live]` runs: read every
  reply in the job log (GitHub MCP `get_job_logs`), REVIEW lines included.
- Don't spawn sub-agents to explore: they start cold and re-read what you already know.
- Moving text between files: use a script that asserts each old string exists, never retype it.
- The live log cuts each model reply at ~400 characters → to reproduce a slip, rebuild the reply and run it through
  `shapeReply` from a scratch script with `loadWorker()` (`tools/test/load-worker.mjs`). (2026-10-05)

## 4. What works
- `node tools/check.mjs` before every push; a commit message with `[live]` runs the real-model check on Actions.  Its live job once
  showed "skipped" (run 37459757344) → dispatch test.yml (`actions_run_trigger`: runs, only, model); wait with a background `until curl -s api.github.com/repos/ferasalm/reem-bot/actions/runs/<id> | grep -q completed` loop. (2026-10-06)

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
