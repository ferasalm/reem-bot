# Lessons

Verified experience, loaded at every session start. Curate, don't just append: merge duplicates, fix entries that
proved wrong, delete ones that no longer apply. Only verified lessons, dated. New entries: symptom → cause → fix.
At most 180 lines (`tools/doc-check.mjs`); once it reaches 180, summarize it back to about 150 (owner, 2026-10-11).

## 1. You can do this yourself (don't ask the owner)
- Workers AI from GitHub Actions: the REST API with `CLOUDFLARE_API_TOKEN` (face.yml; klein needs multipart, references under 512x512). The container can't
  reach api.cloudflare.com, openrouter.ai or workers.dev → a small push-triggered workflow (`cf-lora-probe.yml`). Deleting branches and `gh run download` are
  refused. Actions logs: GitHub MCP `get_job_logs` (`return_content`, small `tail_lines`); a running job answers 404.
- Read the live Worker after a deploy: the deploy log's Version ID, `/health` and `/setup` (`workers_get_worker_code` is the ~5 MB
  bundle); Vectorize "already exists" errors (3002, 40004) are normal. D1: `d1_databases_list`, `d1_database_create`,
  `d1_database_query` (several statements in one call) on the Cloudflare MCP (2026-10-11).
- Prices: the Cloudflare MCP's `search_cloudflare_documentation`; runware.ai and fal.ai are blocked. Workers AI takes no LoRA on klein; Gemma 3 12B is
  "not allowed" on this account; Mistral Small 3.1 rejects `reasoning_effort: "none"` (2026-10-13).
- Judging pictures: 300 px contact sheets can't say "same face" (owner, 2026-10-03) → each picture at full size, one at a time, with
  per-picture checks (face, age, outfit, phone rule, room, framing, hands, a second person).
- Test pictures on Cloudflare: push `tools/face/job.json` to your branch (never `dev`); pictures land on `face-candidates`; `day_neurons` counts the whole
  account's day; `model`/`keep_full` pick klein 9B at full size; a 3030 falls back to Pollinations (watermarked: never a reference) (2026-10-13).
- The sync report lists false "commits not here" on a shallow clone: `git fetch --unshallow origin`, rerun `node tools/sync-check.mjs`
  (2026-10-13). Deploy = `git push origin origin/dev:main`.
- No OpenRouter in tests/benches (owner, 2026-10-06): Workers AI and Runware only (test.yml `model` `@cf/...`; never two runs at once: 429, 3021). A push-
  triggered probe runs per push: fix locally, push once, give calls `AbortSignal.timeout`. Runware spend: MCP `account` `usage.total` before and after.
  Hand-run workflows must be on `dev` (404) (2026-10-13).
- Civitai → Runware LoRAs (2026-10-08): `api.civitai.com/api/download/models/<v>` gives a signed link for REST `modelUpload` (`uniqueIdentifier` = sha256);
  "failed to load": DoRA → `dora-to-lora.py`, LoKR → `lokr-to-lora.py --rank 128`. Judge her face on every LoRA bench (POV Doggy Anal drew another woman 4/4).
- Runware klein 9B bills GPU time in ~$0.0008 steps: 768x1344 $0.0025-0.0079 (each LoRA or reference adds a step); steps and CFG
  don't. Calls past ~60 s die at the proxy. `NODE_USE_ENV_PROXY=1 node` + `loadWorker()` + `drawPicture` benches the bot's own code
  (calls ~4 s apart; wrap `fetch` to fix `seed`). A 502 "no picture" is often billed: read `usage`, budget ~20% over (2026-10-13).
- Runware klein 9B (Steps 2-4, 2026-10-15/16): BFL's reference is 4 steps, CFG 1; never ancestral/SDE samplers; Default ≈ DPM++ 2M Beta ≈ Karras (6/6).
  With 3 refs + 1 LoRA: one-call samplers $0.00585, acceleration "high" $0.0039; `negativePrompt` ignored at CFG ≤ 1; at most 4 references; MCP `model_schema`
  is free; WebFetch can't reach outside hosts (use WebSearch). A `failedModelLoad` or a 400 is sometimes billed; twice in a row on one case: stop.
- Runware `imageUpload` UUID refs drew another background than base64 at one seed ($0.0022 vs $0.0039, Step 4) → `RUNWARE.UUID_REFS` off.
- Waiting for a deploy: foreground `sleep` is blocked, but `Bash` `sleep N` with `run_in_background` works and wakes you when it ends; then `actions_get`
  (run) and `list_workflow_jobs` → `get_job_logs` (`return_content`, `tail_lines` 120) give the Version ID and the `/health` and `/setup` lines (2026-10-17).
- `git cherry` can list a branch commit as "not on dev" when dev applied the same change by hand: compare the lines (`grep TIMEOUT_MS`) before calling it missing work (2026-10-17).
- GitHub Actions failing in 2-5 s with no steps and a 404 log (2026-10-16, 2026-10-17, runner_id 0) is an account-level outage that clears: note the last
  green run, don't loop reruns, retry later. `actions_list` can dump 20 KB: read one run with `actions_get` + `list_workflow_jobs`.
- A bench that skips the command's own word step tests another prompt: /pic runs `picWords` (me → the man) before `specFromWords`;
  without it "across from me" reached the prompt as "me" (Step 3 dry run, 2026-10-16) → call the same steps, dry-run (`DRY=1`) and read prompts first.
- Bench harness: seed `Math.random` per case so variants differ only by the change; `env` gets an `AI` stub; `convert -resize x700
  +append` for sheets; stub `globalThis.fetch` and print each Runware request to find causes for free (2026-10-10, 2026-10-13).
- /setup is a web page (owner, 2026-10-06): never tell him to send it; its "send /restart" line wipes her memory: don't repeat it.
  A new CONFIG key needs a hand-written row in `tools/settings-panel.html` `SECTIONS` (the unit test names missing ones).
- `fix-imports.mjs` turns `import * as FR from "./frames.js"` into `import { FR }` (2026-10-16): restore namespace imports by hand after it.
- Moving code between modules (2026-10-15): acorn + eslint-scope are in `/opt/node-tools/node_modules` (createRequire); `node
  tools/split/fix-imports.mjs` recomputes every module's imports. ES imports are read-only (a `let` set from another module needs a setter)
  and a load-time use of a binding from a module in the same import cycle is a TDZ error: CONFIG stays a leaf. Prove a move with the golden
  plans, a sorted deep compare of CONFIG, and the `wrangler deploy --dry-run` bundle imported in Node.
- Skills/agents go in the repo's `.claude/` (`~/.claude` is wiped); a new agents folder needs a new chat (2026-10-11).
- Browser checks: global Playwright (`createRequire` on `/opt/node22/lib/node_modules/playwright`), `executablePath:
  "/opt/pw-browsers/chromium"`; `allHeaders()` shows Set-Cookie; the browser's own `/favicon.ico` 404 is not the page's (2026-10-11).
- Paid workflows run on any push changing a file in their `paths` (stt-bench.yml → an OpenRouter run, ~$0.03, 2026-10-15; `image-bench.yml` on
  `tools/face/bench.json`): before pushing under `tools/`, `grep -n paths .github/workflows/*.yml`. Stop a background workflow before running its steps by hand.

## 2. Known traps (pictures)
- Vision checks (Step D, 2026-10-13): one question per mistake (Scout 5/7), not one checklist; on POV acts Scout counts the man as a second head →
  heads don't count there. Label probe pictures by reading them at full size first.
- Klein draws a person for every body or position the words give someone ("his hands on her hips" → a second man 3/4; "I sit beside
  me" → a second woman 2/2): he is never a subject with a body (`asCamera`) and every hand is owned (`ownHands`) (Step A-B, 2026-10-13).
  A mirror with her back to it draws her body and her reflection (2 heads, 3/3) → "the whole frame is the reflection" (1/1 at 3 seeds, 2026-10-17).
- Image 1 leaks whenever the words name no clothes (the bra-and-thong body on /look and /pic 7/7 → SCENE_WEARING, Step B); a clothed
  image 1 also lends its garment's cut (0/18). Bench clothed pictures with real wardrobe words, on same-seed side-by-sides.
- Cloudflare's prompt filter (3030) refuses bra, panties, briefs, thong, g-string (5/5) anywhere, even negated → `FILTER_WORDS`;
  boudoir back views and "PoV of spooning" too; front lace bodysuits pass. Its output filter is random: never conclude from one 3030.
- Gate by the level's rule, not the route's list (`mayDraw` once let "blowjob" pass at Off): rerun `levelFor` and `mayDraw` after any route change;
  a line gated on word lists needs a sweep of every WARDROBE entry through the plan (2026-10-11).
- A gaze or expression is camera words: "looking up through her lashes" made her head too large (Step 3); "looking down at something in
  her hands" drew a second phone, "looking past the camera at someone" invites a second person, "an intense, hungry stare" drew a frown
  2/2 (Step A-B) → removed. Test a lead by changing one thing at the same seed, after redrawing the original once.
- Judge genitals on a full-size crop (`convert -crop 400x400+x+y`), never at 800 px; act LoRAs override the words with their own pose (round 6).
- A small, dim face loses her likeness even with her face picture: name her face first in the prompt (before the body words), and
  light it ("lamp light falls on her face"): in the dark her hazel-green eyes drew brown (D1 611/612 replays, 2026-10-15). Replay a live picture from D1 (prompt, refs, LoRAs, seed: `tools/face/replay-bench.mjs`) before guessing.
- The LoRA stack slims her nude body (no LoRAs matched the body picture, 2 seeds; slim-bench 2026-10-15); body words stack on image 1 ("curvier" →
  overweight, belly words → a big belly, 2026-10-10): image 1 sets her build. Test without LoRAs, then grep DECISIONS for banned body words.
- Klein copies the place picture's light (night places `<key>_night`, no place picture on flash), framing and angle (three crops per
  place) and bathroom mirrors break (bedroom/hallway only). "natural light" at night drew daylight → `SCENE_NIGHT` (2026-10-03/05).
- A nude image 1 can dress a clothed back view when the line says "Image 1 shows her body naked: she is not naked here" (tank + jeans, 1/1,
  2026-10-15); new body pictures: cut off the chin and lips, or klein gets a second mouth to copy. Skin tint: saturation and flood-fill masks caught the background and floor shadows; Lab a* (redness) separates skin cleanly (`tools/face/warm-skin.sh`, 2026-10-17).
- Image numbers in a prompt follow the pictures sent (ROOM's `{n}`). A 9:16 frame plus her face kept crotch close-ups framed from her
  lips (12/12) → 1:1 without the face (Step 5). The camera is the frame and the references, not the framing words.
- Pose words that are also clothes ("on her heels", riding "on top", "covered" in sweat, "between her legs") → only phrases that
  name the thing; "her back" is not a back view ("lying on her back") (2026-10-11). The reverse too: clothes "riding up" made a selfie a
  riding act (D1 865) → `notActs` before every act check (2026-10-17).
- A superseded rule lives on in a prompt string (`SELF_CHOICE` kept "never fully naked" 5 days) → grep every prompt string (2026-10-11).
- A framing slip can be the wear words (chest-up + "jeans" drew to the hips 2/2 → `inFrameOutfit`, Step 3b). Removing a switch: grep the local
  variable it set too (a leftover `core` stopped every selfie; only the golden plans' "drawn: false" showed it, 2026-10-16).
- "Sitting across from POV" seats POV too: klein drew his bare legs toward the lens 4/4 (I first blamed the knee framing; a lap
  framing made it worse) → POV poses say "facing the lens" (Step 3b check, 2026-10-16). Rule out a second body from the words first.
- Shot names are matched as words (`shotNamed`) → names nobody writes. Short prompts beat long ones; on acts the expression goes after the act words.
- D1 (`reem-studio`, `pictures`, `events`): Worker `exec()` reads one statement per line → `batch()` of prepared statements; /look's text is `llm_text`;
  R2 is off on the account (403 10042). Read `runwareLoras`/`lorasFor` before blaming a LoRA (2026-10-11).

## 2b. Known traps (chat, voice, code)
- A link opened from another app: a 302 with `SameSite=Strict` loses the cookie → answer the page with `SameSite=Lax` (`tools/test/studio-browser.mjs`, 2026-10-11).
- History before v10 has no `parts` (no /edit or /rewind: NOT_FOUND); older chat is in `m:` notes (TOO_OLD). Telegram deletes bot
  messages only for 48 h. A `VOICE_ID` Worker secret overrides `VOICE.ID`: remove it. A cron run (`scheduled`) has 15 min of wall time on Workers Paid (the 30 s is CPU time): the memory fold runs there, not in the reply queue (2026-10-15).
- `clean()` strips `[...]` at line starts except audio tags; `dropCues()` anywhere; `tidySpoken()` the rest before TTS. eleven_v3: no
  `<break>`, tags only with `AUDIO_TAGS`. Reactions only apart, never OOC, stored on her entry. History folds into notes at 40, keeping 24.
- The tests make `setTimeout` instant (scenarios, e2e): a deadline race on it always loses → `AbortSignal.timeout` (as aiRun); Node
  doesn't stay alive for it (exit 13, "unsettled top-level await") → hold a `setInterval` in that test row. Unit rows that call AI
  need `W.budget.reset()` first (earlier rows spend the per-request subrequest budget) (2026-10-13).
- Outside-call count: `xfetch` already counts; a `budget.used++` before it counted Runware, Nano Banana, Gemini hearing and Sulafat twice.
  Workers Paid allows 10,000 subrequests an invocation (free: 50); the count is a guard, not a budget (2026-10-15). `failed()` is the one
  place an error becomes her line; real errors go to D1 `events` (read it: `SELECT kind, outcome, error, ms, late_ms FROM events`).
- Tests: `CONFIG_OVERRIDES` is cached per run (set `W.CONFIG`); voice chances are 0 in e2e and scenarios; a unit row comparing a plan's
  refs must leave out random picks; rerun a new test file ~10 times. A per-picture neuron change (klein 9B: 115 → 1,500) made the
  scenarios reach PICTURE_SHARE mid-run → reset the test ledger before late picture blocks (Step B, 2026-10-13).
- Test stubs key on prompt text: the scenarios' writer stub matched "You write the words of one photo", so a new writer template
  (WRITER.SPEC) went unanswered; the golden harness turns WRITER off for all cases (a case with `writer` turns it on) (2026-10-16).
- Golden cases are seeded by index: add cases at the end; compare case by case. Shrinking a MOODS/GAZES list shifts later picks in
  those cases only: expected, read them (Step B).
- An odd AI error (`5006 '/seed'`) was out of neurons (4006) → run `ai-diag.yml` and read Cloudflare's analytics before fixing the
  error shown (2026-10-03). Right after a deploy the old code may still serve: re-test later.
- Shared KV keys and `ctx.waitUntil`: re-read the key right before a write, keep the other writer's field; a sync function can't await: callers pass values in (2026-10-11).
- face.yml, image-bench and tts-bench share one queue keeping one waiting run: a third push cancels it → one job at a time.
- Voice: Whisper reads Telegram's OGG as base64 `audio`, never laughs; aura-2 reads [tags] aloud (`AURA_CUES`), 2.73 neurons a char;
  Gemini TTS answers only PCM (→ MP3 for sendVoice); Nova-3 turns Arabic into Devanagari. Vendoring an npm package needs the owner's OK.

## 3. Routes to avoid (and the cheaper route)
- Never read a big file whole: `src/config/engine.js` (~95 KB), `src/persona/reem-en/config.js` (~64 KB): `grep -rn` in `src` (docs/MAP.md), read only those lines;
  never open `assets/` or `tools/settings-panel.html` (generated). Golden diffs: dump the prompts to a scratch file, not `--check`'s output.
- `docs/CHANGELOG.md` and `tools/model-bench/FINDINGS.md`: `grep -n`, don't read whole.
- Mocked tests: trust the exit code, read the failing lines. `[live]` runs: read every reply, REVIEW lines included (a summary hid broken replies: Incident).
- Don't spawn sub-agents to explore: they start cold and re-read what you already know.
- Moving text or editing CONFIG strings: a script asserting each old string exists once, then print the changed lines (2026-10-09).
- The live log cuts replies at ~400 characters → rebuild the reply and run it through `shapeReply` with `loadWorker()` (2026-10-05).

## 4. What works
- `node tools/check.mjs` before every push (`git add` new files first: the map check reads `git ls-files`); `[live]` in a commit runs
  the real-model check; a skipped live job → dispatch test.yml and watch it (Monitor, poll 30 s).
- Refactoring a sender: golden plans first (`tools/test/picture-plans.mjs`, $0), keep every `Math.random` pick in its order; check
  levels by name (`actsOff`), never `level !== "on"`; `grep -n` every reader of a pattern before editing it (2026-10-11).
- Before writing "deployed" in HANDOFF, read the remote: `git ls-remote origin main` and the deploy runs for `main` (2026-10-09).
- A free probe before building on a doc's promise (one push-triggered workflow, 2 minutes); compare models with a workflow `matrix` (2026-10-13).

## 5. Model behaviour seen live (DeepSeek V4 Flash unless named)
- Before any model switch, replay `OWNER_CHAT` with `model`. Examples teach as strongly as rules: an example's "bring him back" drifted
  her to "he"; "envelope that says CASH" came back 5/9, the napkin receipt 6 times → examples with rhythm, no story detail (2026-10-05/06).
- DeepSeek on Workers AI: with reasoning "none" a chat reply is empty ~1 in 4 and a bare task prompt nearly always → tasks use "low"
  (+1500 tokens, ~20 s). Caching cuts ~3,600 of ~3,700 tokens. AI Gateway refuses picture uploads → text and vectors only (2026-10-06).
- A rule that names the word to avoid makes her say it ("never habibti" → corrections 4/5; "(to him it's always habibi)" 1/5).
- Told to go to him, she walks in with words `HER_MOVE` misses → visit mode trusts the scene. "him/his" for "you" in scenes survived a
  prompt rule (3/9): POV slips need a code guard (`toYou`). (2026-10-05/06)
- /look's DeepSeek text made the man a subject with a body (D1 484) despite "he is the camera" → `asCamera` rewrites it (Step B).
- DeepSeek V4 Flash on Workers AI thinks before every answer, even at reasoning "none": the thinking counts in max_tokens, so short
  limits come back cut or empty (writer replays 5-24 s; TEXT 220 cut 3/3, cf-probe 38355964346) → short writing on Llama 3.3 70B fast
  (15/15, 1.3 s). A provider change can look like a deploy bug: probe the live call shape first. Writer words that draw wrong: "thumb
  extended toward the camera" (a jab), "pinched with worry" (a glare), a top with nothing below → jeans in bed (DRESSED_BOTTOM) (2026-10-13).
- DeepSeek on Workers AI with a thinking room of 700 (`LLM.THINK_TOKENS`, cf-probe 3d1ab33, 2026-10-13): 8 of 12 answers finished with content (none cut or empty), but latency is bimodal: 4-6 s or 33-48 s, and 4 of 12 timed out at 60 s, with no link to the reasoning length. A 30 s bot limit keeps about a third: read the timing with the cut check.
