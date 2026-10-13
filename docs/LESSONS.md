# Lessons

Verified experience, loaded at every session start. Curate, don't just append: merge duplicates, fix entries that
proved wrong, delete ones that no longer apply. Only verified lessons, dated. New entries: symptom → cause → fix.
At most 180 lines (`tools/doc-check.mjs`); once it reaches 180, summarize it back to about 150 (owner, 2026-10-11).

## 1. You can do this yourself (don't ask the owner)
- Workers AI from GitHub Actions: the REST API with `CLOUDFLARE_API_TOKEN` works (face.yml). Klein needs multipart form data even
  with only a prompt; reference images under 512x512 (ours: 480). The container can't reach api.cloudflare.com, openrouter.ai or
  workers.dev (network policy; the owner can allow a host): a Cloudflare question goes to a small workflow that runs on a push of its
  script to your branch (`cf-lora-probe.yml`, 2026-10-13). Deleting branches, `gh run download` and a KV dump workflow are refused;
  reading `tools/face/` images works. Read Actions logs with the GitHub MCP (`actions_list` / `get_job_logs`, `per_page` small); a job still running answers 404 for its log: wait for it to complete (2026-10-13).
- The ElevenLabs MCP needs any voice description and sample line from the owner; transcribing a TTS node only echoes its prompt
  (upload the MP3 as an asset).
- Read the live Worker after a deploy: the deploy log's Version ID, `/health` and `/setup` (`workers_get_worker_code` is the ~5 MB
  bundle); Vectorize "already exists" errors (3002, 40004) are normal. D1: `d1_databases_list`, `d1_database_create`,
  `d1_database_query` (several statements in one call) on the Cloudflare MCP (2026-10-11).
- Prices and limits: the Cloudflare MCP's `search_cloudflare_documentation` (klein 4B 26.05 neurons per 512² output tile; klein 9B
  1,363.64 neurons for the first megapixel, billed whole, + 181.82 per input megapixel: 768x1344 costs what 576x1024 does, 2026-10-13).
  runware.ai and fal.ai are blocked: WebSearch finds their prices. Workers AI LoRAs are text models only: klein 9B and 4B answer
  "MODEL_NOT_SUPPORTED ... not supported for finetunes" (runs 38330056690, 38333810448, 2026-10-13). On this account Gemma 3 12B is
  "not allowed" (5018: VISION.BACKUP_MODEL can't answer), Llama 3.2 11B Vision wants a one-time `{prompt: "agree"}`, Mistral Small
  3.1 rejects `reasoning_effort: "none"` (the bot always sends it) (2026-10-13).
- Judging pictures: 300 px contact sheets can't say "same face" (owner, 2026-10-03) → each picture at full size, one at a time, with
  per-picture checks (face, age, outfit, phone rule, room, framing, hands, a second person).
- Test pictures on Cloudflare: push `tools/face/job.json` to your branch (never `dev`: face.yml skips dev/main and its own edits);
  pictures land on `face-candidates`; past `day_neurons` it refuses, and the count is the whole account's neurons today (61,712 on 2026-10-13: wait for 00:00 UTC, or raise it); `model` and `keep_full` pick klein 9B at
  full size (2026-10-13). A 3030 there falls back to Pollinations (watermarked: never a reference).
- The sync report lists "N commits not here" for old branches on a shallow clone: `git fetch --unshallow origin`, rerun
  `node tools/sync-check.mjs`; `git cherry origin/dev origin/<b>` counts what's really missing. Deploy = `git push origin origin/dev:main`.
- No OpenRouter in tests/benches (owner, 2026-10-06): Workers AI and Runware only. Text replay on Workers AI: test.yml `model`
  `@cf/...`; never two at once (429, 3021); a push-triggered probe starts a run per push, so fix the script locally, push once
  (cf-probe: three pushes, three runs at once, one hung with no fetch timeout; give probe calls `AbortSignal.timeout`, 2026-10-13). Runware MCP `account`: the spend is `usage.total` read before and after (the `balance`
  lagged). Hand-run workflows must be on `dev` (404).
- Civitai → Runware LoRAs (2026-10-08): the proxy allows `api.civitai.com`; `/api/download/models/<v>` answers a 307 to a signed
  link (24 h) Runware or Actions can fetch (REST `modelUpload` + `uniqueIdentifier` = sha256). "failed to load": DoRA/OneTrainer
  (`transformer.` keys) → `dora-to-lora.py`, LoKR → `lokr-to-lora.py --rank 128`; PEFT naming fails, Kohya and BFL load; custom
  klein checkpoints: "internalError". File keys without downloading: `curl -r 0-7` (header length), then `-r 8-<n+7>`.
  9 LoRAs in one call work but her face drifted 5/8 (keep ≤6); POV Doggy Anal drew another woman 4/4 (Step A) → judge her face on
  every act-LoRA bench. A named room's picture pulled blowjobs into wide shots.
- Runware klein 9B bills GPU time in steps of ~$0.0008: 1024² or 768x1344 $0.0025-0.0034 (more LoRAs or a third reference = the
  higher), 1008x1792 up to $0.0042; steps 4-6, acceleration and CFG 1-2 don't change it. Calls past ~60 s die at the proxy
  (`deliveryMethod: "async"`). `NODE_USE_ENV_PROXY=1 node` + `loadWorker()` + `drawPicture(...)` benches the bot's own code from the
  container (calls ~4 s apart; wrap `fetch` to fix `seed`). A 502 "no picture" is often billed (4 of 4, Step B; 2026-10-11, 2026-10-13):
  read `usage`, not the script's sum ($0.0495 by usage vs $0.0369 by the script, Fix round 2), and budget ~20% over.
- Picture bench harness (rounds 5-Step B): seed `Math.random` per case (MOODS/GAZES/place picks) so variants differ only by the change (plan-only calls too: unseeded, the light differed per variant, 2026-10-13);
  give `env` an `AI` stub; mixed sizes: `convert ... -resize x700 +append`, not `montage`. Find causes free by stubbing
  `globalThis.fetch` and printing each Runware request (Belly, 2026-10-10).
- /setup is a web page (owner, 2026-10-06): never tell him to send it; its "send /restart" line wipes her memory: don't repeat it.
  A new CONFIG key needs a hand-written row in `tools/settings-panel.html` `SECTIONS` (the unit test names missing ones).
- Skills/agents go in the repo's `.claude/` (`~/.claude` is wiped); a new agents folder needs a new chat (2026-10-11).
- Browser checks: global Playwright (`createRequire` on `/opt/node22/lib/node_modules/playwright`), `executablePath:
  "/opt/pw-browsers/chromium"`; `allHeaders()` shows Set-Cookie; the browser's own `/favicon.ico` 404 is not the page's (2026-10-11).
- Voice/API facts (2026-10-04): Qwen3-TTS voices lowercase (`serena`); MiniMax Speech 2.8 on Runware needs `speech.voice`;
  Cloudflare's third-party models need AI Gateway credits (402); OpenRouter image models answer on `POST /api/v1/images`.
- Two writers on one repo: stop a background workflow before running its steps by hand (TaskStop). `image-bench.yml` runs (paid)
  on every push that changes `tools/face/bench.json`: edit it only for an owner-approved bench.

## 2. Known traps (pictures)
- A vision check of drawn pictures (Step D probes, 2026-10-13): one open checklist → "ok" on most mistakes; one question per mistake
  works better (Scout 5/7). On POV sex acts Scout counts the man as a second head even on clean pictures (checked at full size) → don't
  count heads there. Label each probe picture by reading it at full size first; a "good" label was right where the model was wrong.
- Klein draws a person for every body or position the words give someone (Step A, Step B 2026-10-13): "his hands on her hips" → a
  second man's head 3/4 (third person 1/2 again in Step B); "The man sits on the edge of a bed, she is beside him" → the man 2/2;
  "her hand raised to his jaw", "the cut above his brow" → a second woman; first person ("I sit… beside me") → a second woman 2/2,
  since the only reference is hers. Fix in words: he is never a subject with a body, his face is "the camera" (`asCamera`),
  every hand is owned (`ownHands`). Left over: "studies the cut above the camera" put a phone in her hands 1/3 → Step C's writer.
- Image 1 leaks whenever the words name no clothes: the bra-and-thong body (Step A) drew her in it on /look 484 4/4 and /pic 491
  3/3 → SCENE_WEARING when /look or /pic name none (Step B); earlier the rust halter (2026-10-10) and a nude image 1 with "covered
  breasts" drew image 1 whole (Step 5). A clothed image 1 also lends its garment's cut (crop length, scoop neck, 0/18). Bench
  clothed pictures with real wardrobe words; judge on same-seed side-by-sides.
- Cloudflare's prompt filter (3030) refuses bra, panties, briefs, thong, g-string (5/5) wherever they stand, even in "not image 1's
  black bra and thong" (unit row caught it, Step B) → `FILTER_WORDS` (bodysuit, string bikini); every boudoir back view (4/4) and
  "PoV of spooning" (Step B) are refused too. Front lace bodysuits pass; "top and bottoms" draws pajamas. Its output filter is
  random: never conclude from one 3030.
- Off on Runware: `checkContent` didn't stop a naked lower half (a top named on the nude image 1) → `DRESSED_BOTTOM`; Off draws on
  Cloudflare now. Gate by the level's rule, not the route's list (`mayDraw` let "blowjob" pass at Off once): rerun `levelFor` and
  `mayDraw` after any route change. A line gated on word lists needs a sweep of every WARDROBE entry through `runwarePlan` (2026-10-11).
- A gaze or expression is camera words: "looking up through her lashes" made her head too large (Step 3); "looking down at something in
  her hands" drew a second phone, "looking past the camera at someone" invites a second person, "an intense, hungry stare" drew a frown
  2/2 (Step A-B) → removed. Test a lead by changing one thing at the same seed, after redrawing the original once.
- Act LoRAs: their own pose can override the words (Flux 4 Play's doggy laid the man down, no anus); vaginal-trained ones put the
  entry at her vulva even with "inside her anus" (0/9); only POV Doggy Anal drew anal, from behind only; General Penis alone no
  penetration (0/9); PussyDiffusion melted the penis into the labia; Unchained put the penis below an empty vulva (0/8). Judge
  genitals only on a full-size crop (`convert -crop 400x400+x+y`): at 800 px a slit where her anus is looked right (round 6, Step 6).
- Body words stack on the body picture: "curvier, wide hips, full thighs" on a heavier picture → overweight; no words → slimmer;
  belly words on a picture with a belly → a big belly (2026-10-10) → name image 1's own shape + "not slimmer", "full upper arms and
  soft body" only, and grep DECISIONS for banned body words before writing a description (Step 5 slipped them back in). The
  owner's shape words (BODY_WORDS) moved nude pictures a little and clothed ones hardly at all: image 1 sets her build (Fix round 2).
- Klein copies the place picture's light (night places `<key>_night`, no place picture on flash), framing and angle (three crops per
  place) and bathroom mirrors break (bedroom/hallway only). "natural light" at night drew daylight → `SCENE_NIGHT` (2026-10-03/05).
- Image numbers in a prompt follow the pictures sent (ROOM's `{n}`). A 9:16 frame plus her face kept crotch close-ups framed from her
  lips (12/12) → 1:1 without the face (Step 5). The camera is the frame and the references, not the framing words.
- Pose words that are also clothes ("on her heels", riding "on top", "covered" in sweat, "between her legs") → only phrases that
  name the thing; "her back" is not a back view ("lying on her back") (2026-10-11).
- A superseded rule lives on in a prompt string (`SELF_CHOICE` kept "never fully naked" for 5 days) → grep every prompt string
  when a decision supersedes a rule (2026-10-11).
- New shot names are matched as words in her descriptions (`shotNamed`): "lying"/"pillow" stole her plain selfies → names nobody
  writes. 16:9 drew her twice on a clothed sofa picture (1/1). Short prompts beat long ones (blowjob 4/4 vs 0/10, round 4); an
  expression early turned doggy to face the lens: on acts it goes after the act words.
- D1 (`reem-studio`, table `pictures`): Worker `exec()` reads one statement per line → `batch()` of prepared statements; check SQL in
  `node:sqlite`; /look's DeepSeek text is `llm_text`. R2 is off on the account (403 10042). Read `runwareLoras` before blaming a
  LoRA (POV hand sat in ACT_WORDS, never loaded) (2026-10-11).
- Lingerie on other routes (2026-10-04): klein via OpenRouter, Grok, Seedream refused or 5/9; TwinFlow draws nudity without a face;
  klein 9B needs a balance over $0.05; "completely naked: no tank top, no leggings" drew nude 8/8; "her head is naturally sized for
  her body, about one seventh of her height" keeps the head in scale.

## 2b. Known traps (chat, voice, code)
- A link opened from another app: a 302 setting `SameSite=Strict` loses the cookie → answer the page with `SameSite=Lax`; reproduce
  over https from a different site (`tools/test/studio-browser.mjs`, 2026-10-11).
- History before v10 has no `parts` (no /edit or /rewind: NOT_FOUND); older chat is in `m:` notes (TOO_OLD). Telegram deletes bot
  messages only for 48 h. A `VOICE_ID` Worker secret overrides `VOICE.ID`: remove it. Cron runs must finish in 30 s (`scheduled` queues).
- `clean()` strips `[...]` at line starts except audio tags; `dropCues()` anywhere; `tidySpoken()` every other `[...]` before TTS.
  eleven_v3: no `<break>`, stability 0/0.5/1, tags only with `eleven_v3` + `AUDIO_TAGS`. `texting()` keeps mid-sentence `*word*`.
  Reactions only apart, never OOC; stored on her entry so /retry, /rewind and his edits clear them; Telegram's fixed emoji list only.
- Free-plan limits still in code (50 outside calls per run, ~1000 KV writes a day). A reply can take 4 OpenRouter calls.
  `LLM.CONTEXT_TOKENS` 32768; history folds into notes at 40 messages, keeping 24.
- The tests make `setTimeout` instant (scenarios, e2e): a deadline race on it always loses → `AbortSignal.timeout` (as aiRun); Node
  doesn't stay alive for it (exit 13, "unsettled top-level await") → hold a `setInterval` in that test row. Unit rows that call AI
  need `W.budget.reset()` first (earlier rows spend the per-request subrequest budget) (2026-10-13).
- Tests: `CONFIG_OVERRIDES` is cached per run (set `W.CONFIG`); voice chances are 0 in e2e and scenarios; a unit row comparing a plan's
  refs must leave out random picks; rerun a new test file ~10 times. A per-picture neuron change (klein 9B: 115 → 1,500) made the
  scenarios reach PICTURE_SHARE mid-run → reset the test ledger before late picture blocks (Step B, 2026-10-13).
- Golden cases are seeded by index: add cases at the end; compare case by case. Shrinking a MOODS/GAZES list shifts later picks in
  those cases only: expected, read them (Step B).
- An odd AI error (`5006 '/seed'`) was out of neurons (4006) → run `ai-diag.yml` and read Cloudflare's analytics before fixing the
  error shown (2026-10-03). Right after a deploy the old code may still serve: re-test later.
- Shared KV keys and `ctx.waitUntil`: re-read the key right before a write and keep the other writer's field (`refreshDay`, 2026-10-11).
  A sync function can't await (`startPicture`): async callers pass values in (`dayWear`).
- bench-models.mjs: a route without a family crashes the run. face.yml, image-bench and tts-bench share one queue keeping one waiting
  run: a third push cancels it → push one job, wait, then the next.
- Voice: Workers AI Whisper reads Telegram's OGG as base64 `audio`; aura-2 returns OGG/Opus, performs "mm"/"hm", reads [tags] aloud,
  laughs sound wrong (`AURA_CUES` drops them), 2.73 neurons a character. Gemini TTS answers only PCM (24 kHz s16le); sendVoice takes
  MP3; Whisper never transcribes laughs; OpenRouter audio chat takes OGG as `input_audio` "ogg"; Nova-3 turns Arabic into Devanagari.
- Vendoring an npm package needs the owner's OK first (lamejs, 2026-10-04).

## 3. Routes to avoid (and the cheaper route)
- Never read `worker.js` whole (~450 KB, 2026-10-13): `grep -n` the function or CONFIG key (docs/MAP.md), then read only those lines.
  Never open `face.js` or `tools/settings-panel.html` (generated: `node tools/build-panel.mjs`). Golden diffs: dump the prompts to a
  scratch file and read them, not `--check`'s whole-prompt output.
- `docs/CHANGELOG.md` and `tools/model-bench/FINDINGS.md`: `grep -n`, don't read whole.
- Mocked tests: trust the exit code and read the failing lines. `[live]` runs: read every reply in the job log, REVIEW lines included;
  a summary once said "nothing broken" while broken replies went out (Incident).
- Don't spawn sub-agents to explore: they start cold and re-read what you already know.
- Moving text between files or editing CONFIG strings: a script that asserts each old string exists once, anchored on text unique to the
  line, then print the changed lines (2026-10-09).
- The live log cuts replies at ~400 characters → rebuild the reply and run it through `shapeReply` with `loadWorker()` (2026-10-05).

## 4. What works
- `node tools/check.mjs` before every push (`git add` new files first: the map check reads `git ls-files`); `[live]` in a commit runs
  the real-model check; a skipped live job → dispatch test.yml and watch it (Monitor, poll 30 s).
- Refactoring a sender: golden plans first (`tools/test/picture-plans.mjs`, $0), keep every `Math.random` pick in its order; check
  levels by name (`actsOff`), never `level !== "on"`; `grep -n` every reader of a pattern before editing it (2026-10-11).
- Before writing "deployed" in HANDOFF, read the remote: `git ls-remote origin main` and the deploy runs for `main` (2026-10-09).
- A free probe before building on a doc's promise: one push-triggered workflow answered the LoRA question in 2 minutes and 3 pictures
  (2026-10-13). Comparing models: a workflow `matrix`, one job each, in parallel (writer-replay: 3 models in 5 minutes, 2026-10-13).

## 5. Model behaviour seen live (DeepSeek V4 Flash unless named)
- Before any model switch, replay `OWNER_CHAT` with `model`. Examples teach as strongly as rules: an example's "bring him back" drifted
  her to "he"; "envelope that says CASH" came back 5/9, the napkin receipt 6 times → examples with rhythm, no story detail (2026-10-05/06).
- DeepSeek on Workers AI: with reasoning "none" a chat reply is empty ~1 in 4 and a bare task prompt nearly always → tasks use "low"
  (+1500 tokens, ~20 s). Caching cuts ~3,600 of ~3,700 tokens. AI Gateway refuses picture uploads → text and vectors only (2026-10-06).
- A rule that names the word to avoid makes her say it ("never habibti" → corrections 4/5; "(to him it's always habibi)" 1/5).
- Told to go to him, she walks in with words `HER_MOVE` misses → visit mode trusts the scene. "him/his" for "you" in scenes survived a
  prompt rule (3/9): POV slips need a code guard (`toYou`). (2026-10-05/06)
- /look's DeepSeek text makes the man a subject with a body ("The man sits on the edge of a bed", D1 484) despite "he is the camera":
  code rewrites it (`asCamera`) and LOOK.PROMPT now forbids it (Step B, not yet seen live).
- DeepSeek V4 Flash on Workers AI thinks before every answer, even at reasoning "none" and chat-shaped: completions sit at max_tokens
  with the content empty or cut (writer replays, median 5-24 s) → short structured writing on Llama 3.3 70B fast (15/15, 1.3 s,
  no refusals on explicit scenes) (2026-10-13). Her own replies too: the thinking (`reasoning_content`, ~150-300 tokens) counts in
  max_tokens, so TEXT 220 came back cut or empty 3/3 → the owner saw short, cut replies and "wifi died" right after a deploy that
  didn't touch the chat path (cf-probe 38355964346). A behaviour change at the provider can look like a deploy bug: probe the live
  call shape first (2026-10-13). Writer words that draw wrong: "thumb extended toward the camera" → a jab at the lens,
  "pinched with worry" → a glare or wince, a top with nothing named below → jeans in bed (RUNWARE.DRESSED_BOTTOM) (Step C bench).
- DeepSeek on Workers AI with a thinking room of 700 (`LLM.THINK_TOKENS`, cf-probe 3d1ab33, 2026-10-13): 8 of 12 answers finished with content (none cut or empty), but latency is bimodal: 4-6 s or 33-48 s, and 4 of 12 timed out at 60 s, with no link to the reasoning length. A 30 s bot limit keeps about a third: read the timing with the cut check.
