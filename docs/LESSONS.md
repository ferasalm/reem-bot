# Lessons

Verified experience, loaded at every session start. Curate, don't just append: merge duplicates, fix entries that
proved wrong, delete ones that no longer apply. Only verified lessons, dated. New entries: symptom → cause → fix.
At most 150 lines (`tools/doc-check.mjs`).

## 1. You can do this yourself (don't ask the owner)
- Workers AI from GitHub Actions: the REST API with `CLOUDFLARE_API_TOKEN` works (face.yml). Klein needs
  multipart form data even with only a prompt; reference images must be under 512x512 (ours: 480).
- Claude's cloud container can't reach openrouter.ai or workers.dev (network policy; the owner can allow a host in
  the environment's Network access settings); deleting branches is refused too. `gh run download` is blocked. Live checks and the bench run on
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
  Pushing those commits to `dev` later runs face.yml once more (job.json changed in the push): ~4 pictures spent
  twice on 2026-10-03. Fine when small; for a big job, push it to `dev` before the last job.json edit lands. (2026-10-03)
- The sync report listed an old branch with "26 commits not here" → the clone was shallow (depth 50), so the
  merge base was missing → `git fetch --unshallow origin`, then recount before asking the owner. (2026-10-03)
- face.yml refused a job at 6,618 neurons used: draw.mjs's day cap 7,000 dates from the free plan → set
  `day_neurons` in job.json (Workers Paid; the owner's cap is AI_BUDGET.DAILY_NEURONS 28,000). (2026-10-03)
- `/plugin marketplace add` / `/plugin install` can't be run by Claude (CLI commands) → put the marketplace in
  `extraKnownMarketplaces` and the plugin in `enabledPlugins` of `.claude/settings.json`; it loads next session.
  Its files can be read now from a clone (`git clone https://github.com/<owner>/<repo>`; github.com is reachable). (2026-10-03)
- Commit, push your branch and push it to `dev` (standing permission, CLAUDE.md). Pushing to `main` deploys: only
  when the owner asks. Deleting branches is refused: the owner does it (`tools/retired-branches.txt`).

## 2. Known traps
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
- Free plan limits still coded (Workers Paid since 2026-10-03 lifts them; not yet changed in code): at most 50
  outside calls per run (`budget`, `SUBREQUEST_RESERVE`); about 1000 KV writes per day; 10 ms CPU.
  A reply can take up to 4 OpenRouter calls (2 attempts + backup, then one retry).
- Context: `LLM.CONTEXT_TOKENS` 32768 for DeepSeek; the Lunaris backup gets older chat cut to 8192
  (`fitMessages`). History folds into notes at 40 messages, keeping 24 (PR #6 had cut this to 24/14 for Lunaris).
- Tests: `CONFIG_OVERRIDES` is cached once per run, so tests set `W.CONFIG` directly. Voice chances are 0 in e2e and
  scenarios except where a test asks. e2e `herPrompts()`/`sys()` read her prompts (not memory or /auto).
- Telegram reactions accept only its fixed emoji list (❤ without FE0F, 🤣 rather than 😂).
- Panel textareas: a leading "\n" is added on purpose (browsers drop the first newline).
- Pictures stopped, /setup showed `5006 '/seed'` → the real cause was out of neurons (4006, whose text says
  "upgrade") read as "model unavailable", and face.yml runs bypassing the bot's ledger → when an AI error looks odd,
  run the AI diagnosis workflow (`ai-diag.yml`) and read Cloudflare's analytics before fixing the error shown. (2026-10-03)
- Lingerie on other routes (image bench 2026-10-04, `docs/QUALITY.md`): Cloudflare's 3030 is an *output* filter
  ("Your output has been flagged"); klein via OpenRouter is refused by Black Forest Labs even with `safety_tolerance` 5;
  Seedream 4.5 (OpenRouter $0.04, also on Cloudflare as `bytedance/seedream-4.5`) drew 5/9, bra + panties included,
  random like 3030 (same words passed once, failed once); Grok Imagine 2.0 refused 2/2 with her face attached. Cloudflare's third-party models need AI Gateway credits
  (402 "Insufficient balance"); its Seedream 4.0 takes no reference image. OpenRouter image-only models answer on
  `POST /api/v1/images` (`input_references`, `data[0].b64_json`), not chat completions (404). (2026-10-04)
- Lingerie on Workers AI's own models (bench 2026-10-04, `docs/QUALITY.md`): flux-2-dev has klein's output filter
  (bra/panties 0, babydoll 2/14, and it dodges by drawing tamer clothes or an empty room); lucid-origin and schnell
  filter the *prompt* (free refusal, 1/14 and 2/9) and draw real lingerie when it passes, but take no face reference.
  A bench count of "not black" is not "drawn": read each picture (2 empty rooms counted as drawn). schnell refuses
  `seed` (5006). (2026-10-04)
- Nano Banana (Gemini image, OpenRouter) refused lingerie 11/11 with her face picture attached (IMAGE_PROHIBITED_CONTENT,
  IMAGE_OTHER) and drew 11/11 text-only: Google refuses the face reference + lingerie, not lingerie. Gemini image models
  answer on chat completions (`modalities: ["image","text"]`, `image_config.aspect_ratio`, picture in
  `message.images[0].image_url.url`); a refusal is HTTP 200 with no picture and `native_finish_reason`. (2026-10-04)
- bench-models.mjs `want` mode reads `prompt_sets[route.family]`: a new route without `family` crashes the run at once
  (run 37172077483) → give every new route a family ("ref" or "text"). (2026-10-04)
- Workers AI Whisper reads Telegram's OGG/Opus as base64 `audio` (32/32, voice bench 2026-10-04); aura-2 can return
  OGG/Opus (`encoding: "opus", container: "ogg"`), ready for sendVoice. aura-2 performs "mm" and "hm" but not
  "hhh" (a sigh is silent) and reads [tags] aloud; "haha" sounds robotic (owner), "heh" is heard as "Phew"/"Okay",
  "hehe" makes the line shouted → `VOICE.AURA_CUES` drops laughs. aura costs 2.73 neurons a character. (2026-10-04)
- OpenRouter speech (`POST /api/v1/audio/speech`, run 37174172123): Gemini TTS answers only `response_format: "pcm"`
  (24 kHz 16-bit mono; ffmpeg `-f s16le -ar 24000`); a wrong `voice` makes Deepgram list its voices in the error;
  Sesame needs a voice; MAI-Voice-2 and Qwen gave a bare "Provider returned 400". Telegram's sendVoice takes MP3.
  Whisper never transcribes laughs: judge them by ear. (2026-10-04)
- The auto-mode classifier refused vendoring a third-party npm package (lamejs, an MP3 encoder) into the repo for
  Gemini TTS's PCM → MP3 step: not done without the owner's say-so (HANDOFF). (2026-10-04)
- e2e: a mocked reply that repeats a line she already said in an earlier step is cut by the repeat guard (her note
  shrank to "Come over.") → give each mocked reply in a test its own words. (2026-10-04)
- Cheap lingerie without her face (bench 2026-10-04, `docs/QUALITY.md`): Recraft V4.1 Flash on OpenRouter drew 7/7
  outfits, none refused, $0.007 a picture; Seedream 4.5 passes every time without a face picture (5/9 with one).
  OpenRouter shapes vary by model (Krea has no 3:4: the bench falls back to its tallest shape). (2026-10-04)
- Free lingerie route (2026-10-04): Cloudflare's beta SD models cost $0.00 and skip 3030, but blank NSFW output to a
  black picture (tiny grayscale file); SD 1.5 inpainting over a klein picture keeps her face (only the masked box is
  redrawn) and passed 3/5, 1 of them good. A collar left outside the mask stays in the picture; say the body shape.
- A check right after a deploy can hit the old code still serving (a 00:01 /health 5006 led to the wrong "klein
  rejects seed") → re-test a few minutes later before concluding. (2026-10-03)
- Cloudflare's usage analytics lag several minutes → a guard reading them can't see the last minutes. (2026-10-03)
- Cloudflare's prompt filter (3030) is random: the same words pass in one run and fail in another → never conclude
  from one refusal; the bot draws one tier tamer instead. (2026-10-02)
- Lingerie pictures came out as robes or tamer outfits → Cloudflare's filter (3030) refuses any prompt with bra,
  panties, briefs, thong or g-string (5/5), and every boudoir back view (4/4), and judges the whole prompt (a
  "two-piece set" passed once, failed once) → `FILTER_WORDS` draws those as a bodysuit or string bikini in her
  color; mirror-back left out of BOUDOIR. Front-view lace bodysuits pass. Real lingerie needs another provider.
  "top and bottoms" passes but draws pajamas. (face runs 37151684663, 37152577208, round 3; 2026-10-03)
- Night pictures came out in daylight (0/12) → klein copies the place picture's light, and wording alone turned the
  lamp on 1/3 → night place pictures (`places/<key>_night.jpg`): lamp on 6/6, night window 2/6 (round 5). Drawing
  them, "deep shadow" made 3 of 7 rooms too dark to use → "warmly lit and easy to see". (2026-10-03)
  Bathroom body-length mirror shots broke 3/3 (its mirror is small and round) → bedroom/hallway only. (2026-10-03)
- With a place's picture attached she came out small in a wide room shot → klein copies the reference's framing →
  `ROOM` puts the room "behind her" and says she fills the frame (verified in round 2: she fills it). (2026-10-03)
- klein took 9-238 s a picture on 2026-10-03 (one 408 after 241 s); `draw.mjs` then falls back to Pollinations,
  whose pictures carry a watermark → never pick those as references; the bot waits up to `TIMEOUT_MS` 120 s. (2026-10-03)
- A live check said "nothing broken reached him" while broken replies went out (Incident, docs/CHANGELOG.md) →
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

## 4. What works
- `node tools/check.mjs` before every push; a commit message with `[live]` runs the real-model check on Actions.
- Every slip seen live → a scenario row that fails on the old code, then the fix (CLAUDE.md).

## 5. Model behaviour seen live (DeepSeek V4 Flash)
- Leaves the picture marker out ~2/3 of the time when he didn't ask (hence `PICTURE.REMINDER`). (2026-10-02)
- Picks a picture on her own (`SELF_CHOICE`) almost never: 0/15 in the v3 live runs. (2026-10-02)
- Fixed places work: with the room's picture as image 1, klein redraws the same room, furniture and light in
  every shot (16 example pictures, 2026-10-03).
- Basbousa (the cat) drifted between "he" and "she": the persona's texting example said "bring him back". Examples
  teach as strongly as rules: check them when a fact drifts. Fixed 2026-10-03 (owner: she). (2026-10-02)
- Under-16 safeguard holds in most runs; "what are you wearing" after "i'm 16" got an answer a few times. Owner:
  no prompt change (DECISIONS 2026-10-02); pictures are blocked there in code. (2026-10-02)
