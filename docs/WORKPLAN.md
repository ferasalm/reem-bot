# Work plan: pictures, /nsfw, prompt log and studio (2026-10-11)

Written by Claude (Opus) for the owner's report of 2026-10-11 (see `docs/DECISIONS.md`, 2026-10-11). Each step is done by **Haiku 5.5
in its own chat**, strictly in order, then reviewed by Opus in another chat before the next step starts. This file is the spec: a
step's section says what to build, the exact wording, the checks and the budget. Opus adds "Decided in review" notes under the next
step at the end of this file; that step applies them first. Never two steps (or two sessions) at once: see the 2026-10-01 incident in `docs/CHANGELOG.md`.

## How to run a step (for the owner)
1. New chat, pick **Haiku 5.5** in the model menu, paste the prompt below with N (and the budget) filled in.
2. When it says "Step N done, waiting on review", new chat, pick **Opus**, paste the review prompt.
3. Then the next step. Deploy only when you say "deploy" (suggested after Steps 2, 6 and 7).
4. **From Step 6 (owner, 2026-10-11):** one chat, pick **Opus**, paste the prompt in "Step 6 with the orchestrator" (end of this
   file). Opus runs `/opus-haiku-orchestrator`: it hands the well-defined parts to `haiku-worker` (Haiku 5.5) and checks them itself.

**Haiku prompt (Step N):**
> Continue reem-bot. Follow CLAUDE.md: run `git fetch --unshallow origin`, then the sync report; stop and ask me if it lists work
> really missing. Your task is docs/WORKPLAN.md, Step N only: read that whole section first, it is your spec, and apply the
> "Decided in review" notes for Step N (end of the file) before anything else. grep worker.js, never read it whole. No deploy, never push to main. Spend at most
> $X on Runware (read the balance before and after with the Runware MCP `account`). Don't touch tools/face/bench.json. LIMITS & OOC
> stays word for word. If the spec is unclear, contradicts the code, or a check fails twice, stop and write it under "Waiting on the
> owner" in HANDOFF instead of guessing. Finish with /handoff: HANDOFF says "Step N done, waiting on review", with every check you
> ran and read, the golden-plan diff summary, and where the pictures are. Name your model and its raw model ID (`get_session`) in HANDOFF and the commits.

**Opus review prompt (Step N):**
> Continue reem-bot. Follow CLAUDE.md. Review docs/WORKPLAN.md Step N (done by Haiku): read HANDOFF, the step's commits on dev
> (the diff, the golden-plan diff), its check output and its bench pictures on face-candidates at full size. Fix any slip, decide
> what the step left to Opus, write the notes for Step N+1 under "Decided in review" at the end of WORKPLAN.md, then /handoff. Name your model and its raw model ID (`get_session`) in the records.

## Rules every step follows
- Start from `dev`; push your branch, then `dev` (CLAUDE.md). Never `main`. Code changes only in the files the step names.
- `worker.js` (~380 KB): `grep -n` the function or CONFIG key, read only those lines (LESSONS §3). Never open `face.js`,
  `places.js`, `mp3.js` or `tools/settings-panel.html`.
- A new CONFIG key needs a field row in `tools/settings-panel.html` `SECTIONS` (the unit test names missing ones), then
  `node tools/build-panel.mjs`; any picture CONFIG change: `node tools/options.mjs` (rewrites `docs/OPTIONS.md`).
- A new export used by tests goes in `EXPORTS` of `tools/test/load-worker.mjs`; a new module next to worker.js is copied there
  (like `face.js`) and in `tools/build-panel.mjs`, and named in `docs/MAP.md`.
- From Step 1 on, `node tools/test/picture-plans.mjs --check` is part of `node tools/check.mjs`. A step that changes prompts on
  purpose runs `--write` and commits the golden diff: that diff is what the review reads. Any unintended line in it is a bug.
- Benches (paid): Runware from the container (`NODE_USE_ENV_PROXY=1 node`, `loadWorker()`; calls about 4 s apart; `deliveryMethod:
  "async"` past 60 s), fixed `seed` per picture and a seeded `Math.random` so variants differ only by what is tested. Read every
  picture at full size; genitals on a zoom crop (`convert -crop 600x600+X+Y`). Write your read in a table marked "Haiku's read";
  Opus checks it. Push pictures, sheets (`convert … -resize x700 +append`, then `-append`, each tile labelled), `results.json` and
  `table.md` to branch `face-candidates` under `runs/2026-10-<dd>-step<N>-<name>/` (owner's OK, 2026-10-11): `git worktree add
  /tmp/fc origin/face-candidates`, copy, commit, `git push origin HEAD:face-candidates`. Stop at the step's budget.
- Every finished step: `node tools/check.mjs` all ok, read in full; a `docs/QUALITY.md` row per bench; a `docs/CHANGELOG.md` line.
- Owner's decisions only from `docs/DECISIONS.md`. Wording marked "Claude's wording" here is Opus's and may be changed in review.

---

## Step 1: plan/draw split, seeds, golden plans, prompt log (Haiku, effort medium, $0)
**Why.** No picture prompt is logged anywhere today (no `console.log`, no `[observability]`, KV keeps only short "what" lines), so
nobody can see what was sent, and `/look`'s DeepSeek text is lost. Every later step also needs to see the exact prompt before paying
for it, and to compare before/after.

**1a. Golden capture first (before any refactor).** New `tools/test/picture-plans.mjs`:
- `loadWorker()`, an `env` with a fake `RUNWARE_API_KEY`, a KV stub, an `AI` stub, a ledger with money left; stub
  `globalThis.fetch` so api.runware.ai calls are recorded (return a tiny JPEG as `imageBase64Data`, cost 0.0025); a seeded PRNG
  (mulberry32, seed = case index) in place of `Math.random` for each case; a frozen clock (a `Date` subclass whose `new Date()` and
  `Date.now()` give 2026-10-11T18:00:00Z, 14:00 in Boston, unless the case sets another time), since `lookPicture` and `herHour`
  read the current hour.
- For each case record: `positivePrompt`, `lora` list, `width`, `height`, `steps`, `CFGScale`, `acceleration`, and the reference
  images as names: hash every known reference (face 1x/2x, `v10`, `v10-back`, `v10-clothed`, each style picture, each place crop
  from `PLACE_JPEG_BASE64`) once and map each sent `referenceImages` entry back to its name. Not the seed.
- Cases (24): selfie everyday kitchen "making coffee in my kitchen, gray cardigan" (composePicture); selfie with no words (cozy);
  mirror bedroom at night; flirty mirror-back; boudoir "a black lace bodysuit"; /pic "messy bun, red lipstick, black turtleneck, on
  the porch"; /pic with the olive-cardigan outfit text; /pic with a hairstyle that has a picture; /pic "naked on the bed"; /pic
  "close-up of her pussy, wearing a white t-shirt"; /pic "pussy close up, covered breasts"; /pic "topless, jeans on, mirror selfie";
  /pic "blowjob"; "deepthroat"; "riding the man"; "reverse cowgirl"; "missionary"; "doggy style"; "anal"; "missionary anal";
  "camera flash selfie in the bedroom mirror"; /look alone "the view out of my car window at night" (`herself: false`); a scene with
  her "She sits on his couch in her old cardigan, laughing" (`lookPicture(..., true)`); /pic "nude belfie in the bedroom mirror";
  plus one case where Runware fails twice (record the Cloudflare form's `prompt`).
- `--write` writes `tools/test/picture-plans.golden.json` (pretty, stable key order); `--check` compares and prints a readable diff
  per case, exit 1 on any difference. Commit the golden file made from the code **before** 1b.

**1b. Split** (`drawPicture`'s Runware branch): new `runwarePlan(env, prompt, opts)` returning `{ model list, text, refs: [{name,
bytes}], loras, width, height, steps, cfg, acceleration, seed, flags: {act, nude, partial, back, oral, flash, alone}, style }` with
the same logic, and `drawRunware(env, model, text, refBytes, width, height, { loras, seed, steps, cfg, acceleration })` that only
sends (no LoRA logic inside). `drawPicture` = plan → draw → log. Send `seed` (random 1..2147483646 unless `opts.seed`). After the
split `--check` must pass unchanged. Export `runwarePlan`.

**1c. Log (Cloudflare D1).** Create the database with the Cloudflare MCP `d1_database_create` (name `reem-studio`); put it in
`wrangler.toml`: `[[d1_databases]]` `binding = "STUDIO_DB"`, `database_name = "reem-studio"`, `database_id = "<id>"`. Also
`[observability]` `enabled = true`. In worker.js a `STUDIO_SCHEMA` const, applied once per isolate by `ensureStudioSchema(env)`
(`env.STUDIO_DB.exec`) and once now with `d1_database_query`:
```sql
CREATE TABLE IF NOT EXISTS pictures (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, chat TEXT, source TEXT NOT NULL,
  asked TEXT, her_words TEXT, llm_text TEXT, kind TEXT, nsfw TEXT, model TEXT, prompt TEXT NOT NULL, loras TEXT, refs TEXT,
  width INTEGER, height INTEGER, steps INTEGER, cfg REAL, seed INTEGER, cost REAL, ms INTEGER, attempts INTEGER, ok INTEGER NOT NULL,
  error TEXT, tg_thumb TEXT, tg_full TEXT);
CREATE INDEX IF NOT EXISTS pictures_at ON pictures(at);
CREATE TABLE IF NOT EXISTS presets (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, author TEXT, name TEXT, body TEXT NOT NULL);
```
- `logPicture(env, row)` → id or null: insert; no binding = no-op; any error = `console.error`, never throws, never delays the
  picture (await it only after the bytes are back). One row per `drawPicture` call: the final model, prompt, LoRAs (JSON), reference
  names (JSON), size, steps, CFG, seed, cost, ms, attempts, ok, error. `kind`: clothed | nude | partial | act | alone.
- Context: `drawPicture` opts gain `log: { source, chat, asked, herWords, llmText, nsfw }`; sources: selfie, scene, look, pic, health,
  face (and studio in Step 7). Pass it from `startPicture` (add a `chat` option; `respond` has the chat id), `lookPicture` (his /look
  words and `lookWrite`'s raw DeepSeek text: make `lookWrite` return `raw` too), `picCommand`, `health`, `faceCommand`.
- `drawPicture` returns `logId`; the picture objects carry it; `deliverPicture` calls `logSent(env, logId, sent.photo)` after
  `sendPhoto`: `tg_thumb` = the largest `PhotoSize` at most 400 px wide, `tg_full` = the last one.
- One `console.log` per picture: `JSON.stringify({ picture: id, source, model, kind, loras: n, cost, ms, ok })`.
- `tools/cf-resources.sh`: `$W d1 info reem-studio` (exit 1 when it fails). Push to dev, run Actions > Cloudflare resources
  (`actions_run_trigger`, workflow `cf-resources.yml` on dev), read its log. If the token can't see D1: stop, and HANDOFF tells the
  owner to add "Account, D1, Edit" to the `CLOUDFLARE_API_TOKEN` secret; no deploy until then (a deploy with this binding would fail).

**Tests.** Unit: a fake D1 (`prepare(sql).bind(...).run()` / `.first()` recorder) gets one row per picture with prompt, LoRAs and
seed; no binding: the picture still comes back. `check.mjs` gets the step "picture plans match golden"; `.github/workflows/test.yml`
mocked job runs the same command.
**Acceptance.** `--check` passes with the golden made before the split; `node tools/check.mjs` all ok; `d1_database_query` shows
the two tables; cf-resources run read. MAP: `runwarePlan`, the log, `picture-plans.mjs`, D1. HANDOFF: "Step 1 done, waiting on review".

---

## Step 2: /nsfw, her own nudes, the stale "never naked" line (Haiku, effort medium, $0)
**Why.** No user switch exists (only the global `RUNWARE.SEX_ACTS`). Her own pictures are never nude because `PICTURE.SELF_CHOICE`
still ends "Your pictures never show you fully naked." (the 2026-10-02 rule, dropped 2026-10-06), tiers stop at boudoir, and
`BOUDOIR_ASK_PATTERN` turns "send nudes" into lingerie. Owner, 2026-10-11: levels Off / Nude / On, default On; her own nudes about 1
in 3 when the chat is hot, never when calm.

**Build.**
- `CONFIG.PICTURE.NSFW`: `{ DEFAULT: "on" }`; settings `s:<chat>.nsfw` = "off" | "nude" | "on"; `nsfwLevel(settings)`.
  Off = no nudity, no sex acts, no NUDE/ACT LoRAs, Runware `safety.checkContent: true` (lingerie and boudoir still allowed).
  Nude = nudity, no sex acts (`RUNWARE.NOT_DRAWN` applies). On = today.
- Command: COMMANDS `{ command: "nsfw", aliases: [], action: "nsfw", description: "Nudity and sex in {name}'s pictures: /nsfw off, nude or on" }`;
  `nsfw` in QUICK_ACTIONS; `nsfwCommand(env, chatId, args)`: no args = MESSAGES.NSFW_SHOW with an inline keyboard
  `[[Off, Nude, On]]` (`callback_data` `nsfw:off|nude|on`); an arg sets it. `onButton`: handle `^nsfw:` before the `auto:` check,
  save, edit the message to NSFW_SET (no buttons). MESSAGES (Claude's wording):
  NSFW_SHOW "Pictures are set to {level}. Off: no nudity or sex. Nude: nudity, no sex acts. On: everything. Tap one, or send /nsfw off, /nsfw nude or /nsfw on.";
  NSFW_SET "Pictures set to {level}."; PIC_NSFW "That picture needs /nsfw {need} (it's {level} now)."; labels Off / Nude / On.
- Thread the level (an extra argument defaulting to `CONFIG.PICTURE.NSFW.DEFAULT`): `mayDraw(text, level)`, `sexAct(text, level)`,
  `explicitWords(text, level)` (nude: sexAct false and NOT_DRAWN applies; off: NUDE_WORDS also refused), `selfieSubject`,
  `scenePicturePrompt` (its sentence filter), `startPicture` (no SCENE_ACT_STYLE below On), `pickTier`, `picCommand` (refused words →
  PIC_NSFW with the level they need), `lookCommand` (`lookWrite`'s text not drawable → PIC_NSFW), `drawPicture` opts `nsfw` (off:
  nude and act forced false, `checkContent: true`), and the log row's `nsfw`. `respond` reads the settings it already has.
- SELF_CHOICE: delete "Your pictures never show you fully naked." and end it with `{nude}`, filled with NSFW.SELF_NUDE when the level
  is nude or on, else "": SELF_NUDE (Claude's wording) " When things are hot between you, you may send one naked or topless: say plainly what's bare."
- Tier `nude` (TIER_NAMES, TIERS, TIER_WEIGHTS, TIER_HINTS, WARDROBE, EXPRESSIONS), used only when the level allows:
  TIERS.NUDE `["selfie", "mirror", "mirror-back", "waist", "belly-down", "overhead", "kneel-mirror", "cozy"]`;
  TIER_WEIGHTS CALM `{ everyday: 0.85, flirty: 0.13, boudoir: 0.02, nude: 0 }`, WARM `{ everyday: 0.48, flirty: 0.36, boudoir: 0.11, nude: 0.05 }`,
  HOT `{ everyday: 0.1, flirty: 0.27, boudoir: 0.3, nude: 0.33 }`;
  TIER_HINTS.nude " You're naked or topless in it: say plainly what's bare.";
  WARDROBE.NUDE `["completely naked", "topless, in only black lace panties", "naked except for her thin gold rings", "completely naked, her hair still damp from the shower", "topless, in only his oversized gray sweatpants", "naked on rumpled white sheets"]`;
  EXPRESSIONS.NUDE `["heavy-lidded eyes, lips slightly parted", "a slow, knowing smile", "a daring look straight into the camera", "a shy, flushed smile", "biting her lower lip"]`.
  `NUDE_ASK_PATTERN` `"\\b(?:nudes?|naked|topless|nothing on|no clothes|without (?:any |your )?clothes)\\b"` → `{ nude: 1 }` in
  `pickTier` when allowed (else boudoir as now); remove nudes?/naked/topless from BOUDOIR_ASK_PATTERN. `selfiePicture`: a nude-tier
  picture whose words have no NUDE_WORDS gets ", completely naked" appended. Level below nude: nude weight 0 everywhere.
- Help (MESSAGES.HELP lists commands from COMMANDS already), panel rows, `options.mjs`, OPTIONS.md.

**Tests.** /nsfw shows buttons; the button and each arg set the level; Off: /pic "naked" → PIC_NSFW (need nude), her [selfie: naked
...] not drawn nude, a sex scene in person draws no act; Nude: "blowjob" → PIC_NSFW (need on), "naked" drawn nude; On: golden
unchanged. SELF_CHOICE contains no "never" + "naked"; with nude: the SELF_NUDE line. 3,000 `pickTier` draws at HOT: nude 33% ± 3,
CALM 0. "send nudes" at On → nude tier. Golden diff: none (default On) except cases you add for Off/Nude.
**Acceptance.** check.mjs all ok; a scenario row for each test above; HANDOFF "Step 2 done, waiting on review".

---

## Step 3: LoRA catalog, realism diet, ghost hands (Haiku runs, Opus judges; effort medium, ≤ $0.25)
**Why.** POV hand is not loaded (it is in `ACT_WORDS` but not `ACT_LORAS`, and `runwareLoras` builds from ACT_LORAS), so it is not the
ghost-hands cause. Likely causes, to test: four realism LoRAs stacked on every picture (phone2025 0.6, ultrareal5 0.6, instapic 0.6,
realhd2kc 0.5 = 2.3) plus the act LoRA, General Penis or Unchained (5-6 per act); hands named twice in sex prompts (`POV_MAN` "only
his hands, belly, hips and thighs may show", the doggy/anal `ACT_SCENES` "his hands on her butt"); phone2025's prefix "taken with a
smartphone" on POV acts (and on every picture with any LoRA, not only with phone2025). Fewer LoRAs also cost less GPU time.

**Build (no routing change yet).**
- `RUNWARE.LORA_INFO` `{ air: { name, category, civitai, trigger, note } }` for all 18 uploaded LoRAs; categories realism, nudity,
  anatomy, act, light, spare: phone2025 (Phone Photography 2000-2025, realism, trigger = LORA_PREFIX), ultrareal5 (UltraReal V5 Pro,
  realism), instapic (InstaPic 2998522, realism, "instapic"), realhd2kc (Real HD 2K, DoRA converted to rank 32, realism), lenovoc
  (Lenovo UltraReal, realism, spare), unchained@2 (Unchained XXX v2 2753532, nudity), snofsc (SNOFS v1.4 rank-128 copy, nudity,
  spare), nsfwunlock (NSFW Unlocked V2 3030169, nudity, spare), pussyd (PussyDiffusion v2 2960754, anatomy, "hairy pussy"), penis
  (General Penis 2624854, anatomy), flux4play (Flux 4 Play AIO 2702716, act: riding, reverse cowgirl, doggy; c0wg1rl,
  r3v3rs3_c0wg1rl, d0gg13), missionary (Missionary POV K3NK 2699087, act), povanal (POV Doggy Anal 2821244, act), povdt (Holding
  Deepthroat POV 2779637, act, "POV deepthroat scene"), povbj (POV Blowjob, act, spare), povhandc (POV hand 2640656 converted, act,
  spare: not loaded since round 5), tushyraw (Tushy Raw Filter 2569967, light), `myaiprojectsqqq:3@2` (Anatomy Quality Fixer,
  anatomy, spare). `options.mjs` prints the category column and a "spare (on Runware, not used)" list. Remove the dead povhandc
  line from ACT_WORDS and LORA_WORDS (golden unchanged).
- `RUNWARE.LORA_PREFIX_WITH: "ferasalm:phone2025@1"`: the prefix only when that LoRA is in the list (golden unchanged today).
- Bench script `tools/face/lora-bench.mjs` (uses `runwarePlan`, then swaps the plan's LoRAs/text per variant; seeds 101 and 202).
  Variants: **V0** today; **V1** no hand words (POV_MAN → "First-person view from the man's own eyes, never his face; only his
  hips and thighs may show. One man, his penis average-sized and realistic." and "his hands on her butt" / "His hands on her butt"
  removed from the doggy and anal scenes; Claude's wording); **V2** V1 + realism = instapic 0.6 + realhd2kc 0.5 (no prefix);
  **V3** V1 + realism = phone2025 0.6 + ultrareal5 0.6 (prefix); **V4** V1 + ultrareal5 0.7 alone; **V5** V1 + no realism LoRA.
  Cases: clothed selfie in her kitchen "making coffee, a fitted black t-shirt and jeans" (afternoon), clothed mirror in her bedroom
  "a black slip dress" (night), nude standing mirror "naked" (bedroom), and the acts blowjob, riding, missionary, doggy style.
  Clothed and nude cases: V0, V2, V3, V5; acts: V0-V5. 3×4×2 + 4×6×2 = 72 pictures.
- Read-out per picture (table.md, "Haiku's read"): hands seen vs expected, extra or missing limbs, warped anatomy (where), face vs
  image 0 (same / close / other woman), skin realism 1-3, act right on the zoom crop (acts), cost, ms. One sheet per case
  (variants across, seeds down).
**Acceptance.** check.mjs ok; pictures, sheets, results.json and table.md on face-candidates; QUALITY row; spend read before/after.
HANDOFF: "Step 3 done, waiting on review (Opus picks the LoRA set and the hand words)".

---

## Step 4: outfits, the daily outfit, image 1, nude back views (Haiku, effort high, ≤ $0.20)
**Why (all six confirmed in code).** (a) The Runware `REFERENCE` says "exactly the body of image 1" and never "not its clothes"
(the Cloudflare one did); (b) `BODY_CLOTHED`, image 1 of every clothed picture, *is* the rust-halter picture; (c) no outfit is added
when her `[selfie]` words or his /pic words name none (`composePicture` uses her words instead of WARDROBE; `customPicture` never adds
one), so klein copies image 1's halter; (d) an outfit with a picture is sent as a fourth image next to the halter body: two clothed
bodies, blended; (e) in person, `SCENE_WEARING` is always the same cardigan; (f) nude back views use the front body (`BACK_WORDS` are
read only on sex acts). The four outfit pictures share the body pictures' framing (faceless, standing, plain wall), so an outfit
picture can itself be image 1.

**Build.**
- **An outfit on every clothed picture.** `namesClothes(text)` = any WEARING_WORDS (plus "top", "crop top", "outfit"). If the words
  name none: tier flirty / boudoir / nude → that tier's WARDROBE (as now); everyday → outside (`OUTSIDE_WORDS` "outside, out, walk,
  walking, street, park, cafe, café, coffee shop, store, grocery, market, work, office, car, train, bus, subway, beach, restaurant,
  bar, date, campus, sidewalk, snow, rain") the day's `out` outfit, else the day's `home` outfit. His or her clothes words always win.
- **The day's outfits.** `dayOutfits(env, day)`: picked once per her date, stored in KV "day" (`dayInfo` already caches the weather
  there), never the same as yesterday's; band from the current temperature °F: cold < 50, mild 50-72, warm > 72; no weather → by
  month (Dec-Mar cold, Apr-May and Oct-Nov mild, Jun-Sep warm). `WARDROBE.HOME` / `WARDROBE.OUT`, each `{ COLD, MILD, WARM }`
  (Claude's lists; EVERYDAY stays as the union for anything else):
  HOME.COLD: her father's old gray knit cardigan over a plain black tank top and soft gray sweatpants (persona); a cream cable-knit
  sweater and soft gray sweatpants; a gray zip-up hoodie half open over a white crop tank and joggers; a matching soft beige lounge
  set, cropped top and wide pants; a fitted olive ribbed long-sleeve top and gray yoga pants.
  HOME.MILD: the olive cami, shorts and cream cardigan (exact STYLE_PICTURES text); a gray knit cardigan sliding off one shoulder over
  a fitted black tank top and soft gray sweatpants; the beige lounge set; a fitted gray ribbed tee and soft black lounge shorts; an
  oversized gray tee and black bike shorts.
  HOME.WARM: the olive cami, shorts and cardigan; the rust halter and jeans (exact text); a tight ribbed white tank top and soft gray
  cotton shorts; a loose white linen button-down over a black bralette and cotton shorts.
  OUT.COLD: the camel coat outfit (exact text); a fitted burgundy sweater dress, black tights and a long black wool coat; a cream
  cable-knit sweater, fitted dark jeans and a black puffer jacket; a black leather jacket over a black turtleneck and jeans.
  OUT.MILD: a black leather jacket over a fitted gray tee and jeans; a fitted black turtleneck tucked into high-waisted jeans and
  small gold hoops; a denim button-up shirt knotted at the waist over a white tank top and jeans; a fitted navy striped Breton top and
  high-waisted jeans; a fitted black wrap dress; a red silk blouse with the top buttons open and black jeans; a fitted black ribbed
  knit midi dress.
  OUT.WARM: the rust halter and jeans; a sleeveless white linen top with a square neckline and wide-leg white linen pants; a fitted
  black ribbed tank top and high-waisted jeans; a fitted black t-shirt tucked into high-waisted jeans; a fitted white linen
  button-down tucked into black trousers.
- **In person:** `SCENE_WEARING` → the day's home outfit (out outfit when the scene is outside); her narration's clothes still win
  (`sceneWearing`, `underLayers`).
- **Image 1 when clothed.** The rust halter becomes an outfit picture: copy `tools/face/body-clothed.jpg` to
  `tools/face/style/outfit-rust-halter.jpg`, STYLE_PICTURES `"outfit-rust-halter"` = its WARDROBE text, rebuild `face.js`
  (`node tools/face/build-face.mjs`). `RUNWARE.OUTFIT_BODY: true`: an outfit with a picture is image 1 itself (no fourth image), with
  `REFERENCE_OUTFIT` (Claude's wording) "The woman from image 0, with exactly the same face and hair (not image 0's expression or head
  tilt), with exactly the body of image 1 and wearing exactly image 1's clothes: the same full bust and full upper arms, fair olive
  skin. She is 29, clearly an adult." Other outfits: `RUNWARE.CLOTHED_BODY` = "rust" | "nude" | "neutral" | "none" (set from the bench):
  - rust: today's picture + `REFERENCE_CLOTHED` "The woman from image 0, with exactly the same face and hair (not image 0's expression
    or head tilt), and exactly the body shape of image 1, not slimmer, but not image 1's clothes: the same full bust and full upper
    arms, fair olive skin. She is 29, clearly an adult.";
  - nude: the nude front body + REFERENCE_CLOTHED + `DRESSED_FULL` "She is fully dressed in the clothes described, nothing
    see-through; image 1 shows only her body's shape.";
  - neutral: a new faceless reference `v10-neutral` (`tools/face/body-neutral.jpg`, added to `runwareBody`'s map and build-face):
    klein 9B, image 0 = `body-nude.jpg`, InstaPic 1.0 + Real HD 2K 1.0, 768x1344, steps 8, CFG 1, prompt "Image 0 dressed: exactly
    the same body, size, pose and crop, nothing slimmer, in front of the same plain wall, now wearing a plain, opaque heather-gray tank
    top with wide straps over a smooth padded bra, and plain black leggings; no nipples showing." 4 seeds; pick at full size (no
    nipples, same build); + REFERENCE_CLOTHED;
  - none: face and place only + `REFERENCE_NOBODY` "The woman from image 0, with exactly the same face and hair (not image 0's
    expression or head tilt): an average-to-full figure, about 165 cm and 71 kg, a full bust and soft, full upper arms, fair olive
    skin. She is 29, clearly an adult."
- **Nude back views.** A nude (not act) picture whose shot is mirror-back or whose words match `NUDE_BACK_WORDS` "from behind,
  belfie, booty, butt, her ass, her back, back view, over her shoulder, bent over" uses BODY_BACK, REFERENCE_BACK and NAKED_BACK.
- **Bench.** Six outfits without a picture (black turtleneck + jeans, burgundy sweater dress, gray hoodie + joggers, white linen set,
  red silk blouse, Breton top; three as a mirror selfie in her bedroom, three chest-up in her living room) × the four modes × 2 seeds =
  48; the four picture outfits as image 1 × 2 seeds = 8; the neutral candidates 4; nude back views ("nude belfie in the bedroom
  mirror", "naked, from behind, looking over her shoulder", a nude-tier mirror-back, "naked, bent over the bed, from behind") 4.
  Read-out: outfit as named, halter leak, nudity or see-through, build vs v10 (not slimmer), face; back views: her back body, no
  breasts in front.
**Tests.** No-clothes /pic gets the day's outfit; the same day gives the same home outfit; a cold day never a WARM item; outside
words → OUT; a named outfit is never replaced; an outfit picture is image 1 with no fourth image; nude belfie → `v10-back`.
**Acceptance.** check.mjs ok, golden diff = outfits added where none were named, the new image 1 rules, back views; bench on
face-candidates; `CLOTHED_BODY` left at "rust" until the review picks. HANDOFF "Step 4 done, waiting on review".

---

## Step 5: partly dressed and close-ups (Haiku, effort medium, ≤ $0.10)
**Why.** "covered breasts/chest", "top", "crop top", "sports bra" are not WEARING_WORDS, so the picture is fully nude and `NAKED`
itself says "natural breasts with soft brown areolas"; partial pictures still load Unchained XXX 0.8 and PussyDiffusion 0.8 (trained
on full nudes); nothing keeps the breasts out of a crotch close-up; `BODY_PARTIAL` "clothed" sends the halter picture.

**Build.**
- `PARTIAL_WORDS` = WEARING_WORDS + "top", "crop top", "sports bra", "covered", "covering", "covers", "covered up", "shirt on", "top on",
  "bra on", "half-dressed", "half dressed" (partial = nude or act + any of these).
- `TOP_WORDS` (bra, bralette, sports bra, top, crop top, tank top, camisole, t-shirt, tee, shirt, blouse, sweater, hoodie, sweatshirt,
  cardigan, corset, turtleneck, covered breasts, breasts covered, covered chest, chest covered) and `BOTTOM_WORDS` (panties,
  underwear, thong, jeans, leggings, sweatpants, pants, trousers, shorts, skirt). Texts (Claude's wording):
  PARTIAL_TOP "She is naked only from the waist down: the top described stays on and fully covers her breasts, no nipples or
  underboob showing."; PARTIAL_BOTTOM "She is topless: only the clothes described below her waist stay on; her breasts are bare.";
  PARTIAL as now when both or neither.
- Split NAKED into NAKED "She is completely naked, no clothing of any kind:", NAKED_BREASTS "natural breasts with soft brown
  areolas,", NAKED_BUSH "a thick, untrimmed dark bush, a real vulva when in view." (joined = today's text: golden unchanged).
- `CLOSE_WORDS` "close-up of her pussy, pussy close-up, pussy close up, close up of her pussy, close-up between her legs, between her
  legs, her pussy up close, zoomed in on her pussy, spread pussy, pussy shot, crotch shot": add `CROTCH_FRAMING` "Close-up from her
  navel to her upper thighs; her breasts are out of the frame." and leave out NAKED_BREASTS.
- Partial pictures: `PARTIAL_LORAS_OFF ["ferasalm:unchained@2"]`, `PARTIAL_WEIGHTS { "ferasalm:pussyd@1": 0.6 }` (bench decides).
- Bench: P1 "close-up of her pussy, legs spread on the bed, wearing a white t-shirt", P2 "pussy close up, covered breasts", P3 "naked
  from the waist down, black sports bra, sitting on the edge of the bed, legs apart", P4 "topless, in jeans, mirror selfie in her
  bedroom" × { nude body with PussyDiffusion 0.8, 0.6, off; Step 4's clothed image 1 at 0.6 } × 2 seeds = 32. Read-out: breasts
  covered (P1-P3) or bare (P4), the named clothes there, vulva real and hairy (zoom), framing, face (P3, P4).
**Acceptance.** check.mjs ok; golden diff only on the partial and close-up cases; bench on face-candidates. HANDOFF "Step 5 done".

---

## Step 6: anal positions (Haiku runs, Opus judges; effort medium, ≤ $0.12)
**Why.** One anal camera (on all fours, from behind) and POV Doggy Anal alone at 1.0 (`ALONE_LORAS`) make every anal picture the same
pose. `ACT_SCENES` is first-match with missionary and riding listed before anal, so "missionary anal" gets the *vaginal* missionary
text plus POV Doggy Anal alone, and "anal riding" the vaginal riding text: wrong opening.

**Build.**
- Anal first: when `ANAL_WORDS` ("anal, ass fucking, in her ass, in the ass, her ass, anally") match, the position comes from
  `ANAL_POSITION_WORDS` { missionary: "missionary, on her back, legs up, knees to her chest", "reverse cowgirl": "reverse cowgirl,
  riding, rides, cowgirl, on top", prone: "prone, lying flat, on her stomach, prone bone", doggy: "doggy, doggystyle, doggy style, all
  fours, from behind, bent over" }, else by `ANAL_POSITIONS` { doggy: 0.45, missionary: 0.3, "reverse cowgirl": 0.15, prone: 0.1 }.
  Its scene from `ANAL_SCENES` and its LoRAs from `ANAL_LORAS` (in place of ACT_WORDS matching); body: missionary front, the others
  BODY_BACK. Scenes (Claude's wording):
  missionary "{pov} She lies on her back with her knees pulled up to her chest and her legs held wide, her round bottom lifted toward
  the man kneeling between them; his penis inside her anus, low between her buttocks, and above it her vulva closed and untouched.
  She looks up at him. {close}";
  reverse cowgirl "r3v3rs3_c0wg1rl, pov. {pov} She rides the man facing away, her back and round bottom close, his penis inside her
  anus between her spread buttocks; below it her vulva closed and untouched; she glances back over her shoulder. {close}";
  prone "{pov} She lies flat on her stomach on the bed, legs together, the man on top of her from behind; his penis inside her anus
  between her round buttocks; she looks back over her shoulder, her cheek on the pillow. {close}";
  doggy: today's anal scene (with Step 3's hand-word decision).
  ANAL_LORAS start: doggy `{ "ferasalm:povanal@1": 1 }` (alone, as now); missionary `{ "ferasalm:missionary@1": 0.8,
  "ferasalm:penis@1": 0.6 }`; reverse cowgirl `{ "ferasalm:flux4play@1": 0.8, "ferasalm:penis@1": 0.6 }`; prone `{ "ferasalm:penis@1": 0.6 }`;
  each with the realism set from Step 3 unless alone.
- Bench (zoom crops at the joining point): doggy {povanal alone 1.0 | flux4play 0.8 + penis + realism}, missionary {missionary +
  penis | penis only}, reverse cowgirl {flux4play + penis | penis only}, prone {penis | povanal 0.8} × 3 seeds = 24, then 8 more seeds
  on the best of each = 32. Read-out: in her anus (not her vulva), her vulva closed where the text says, one penis, hands, pose as
  asked, her face when seen.
- Report only (no upload): Civitai (`api.civitai.com`) FLUX.2 klein 9B LoRAs for anal or sex positions: name, version, downloads,
  rating, file type (LoRA, LoKR, DoRA).
**Acceptance.** check.mjs ok; golden diff only on anal cases; bench on face-candidates. HANDOFF "Step 6 done, waiting on review".

---

## Step 7: the prompt studio (Haiku, effort high, ≤ $0.05)
**What (owner, 2026-10-11):** a private page where he (and Claude, through D1) sees every prompt the bot used, in order, with
thumbnails, copies one into an editor, changes prompt, LoRAs, weights, references and settings, generates, and sees the result.

**Build.**
- Access: `/studio` command, only for the owner's chat (`env.OWNER_ID`, else KV `owner`; other chats get no answer). It replies
  STUDIO_LINK (Claude's wording) "Your picture studio, private, valid 30 days: {url}\nDon't share it. /studio reset makes old links
  stop working." Link token = base64url(`chat.exp.epoch`) + "." + base64url(HMAC-SHA256 with key TELEGRAM_BOT_TOKEN); KV
  `studio_epoch` (reset bumps it). `GET /studio?t=…` checks it, sets cookie `studio=<token>; Path=/studio; HttpOnly; Secure;
  SameSite=Strict; Max-Age=2592000` and redirects to `/studio`. Every `/studio*` route without a valid cookie answers 404
  "not found". Headers: `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex`, `Cache-Control: private`, a CSP without
  outside hosts. The link's host: `env.PUBLIC_URL`, else KV "origin" saved by the webhook handler when it changes.
- New module `studio.js` (exports `STUDIO_HTML`; vanilla JS, no outside libraries or fonts, mobile first, light and dark). Tabs:
  **Log** (newest first, 30 a page, filter by source; each row: Boston time, source, his words, thumbnail, kind, LoRA chips, model,
  size, cost; buttons "copy prompt" and "edit"), **Editor** (prompt textarea; "compose from words" with source pic / selfie (tier,
  shot) / scene / look and an nsfw level = the bot's own `runwarePlan`, free; LoRA table from LORA_INFO plus every AIR in CONFIG, each
  with on/off, weight 0-1.5 and "add trigger words"; references: face 2x / 1x / none, body v10 / v10-back / v10-clothed /
  v10-neutral / none, place and crop and night, style picture; model klein 9B / Cloudflare klein 4B / TwinFlow; size 9:16 / 1:1 /
  16:9 or custom; steps, CFG, acceleration, seed (0 = random, the used seed shown back); 1-4 results; estimated cost before the
  button), **Presets** (save the editor as a preset; list and load; Claude can add rows with `d1_database_query`).
- API (JSON): `GET /studio/api/log?before=&source=`, `GET /studio/api/options`, `POST /studio/api/compose`, `POST /studio/api/draw`
  (one Runware task with `numberResults`; a log row per picture with source "studio"; picture bytes in KV `simg:<id>` with a 30-day
  expiry), `GET/POST /studio/api/presets`, `GET /studio/img/<id>` (KV `simg:`, else Telegram `getFile` for `tg_thumb` / `tg_full`,
  streamed), `GET /studio/ref/<name>` (the reference pictures). Money: `STUDIO.DAILY_USD` 1 (owner, 2026-10-11), ledger `studioUsd`,
  separate from the bot's $1; over it the draw answers an error saying so.
- MAP, OPTIONS (/studio), panel rows, `load-worker.mjs` and `build-panel.mjs` copy `studio.js`.
**Tests.** A bad or old token → 404; the cookie flow; /studio from another chat → nothing; compose for golden case "/pic messy bun…"
equals the golden prompt; draw with stubbed Runware writes a row and stops at the cap; log paging with the fake D1.
**Acceptance.** check.mjs ok; one real studio draw from the container through the same code path (≤ $0.01) read; HANDOFF "Step 7 done".

---

## Step 8: deploy and live checks (when the owner says "deploy"; effort low)
`git push origin origin/dev:main` (fast-forward), watch Deploy to Cloudflare and Tests, read `/health` and `/setup` in the log, confirm
the D1 binding (a new row after the owner's first picture, read with `d1_database_query`). The owner's Telegram checks: /nsfw (each
level), a hot chat until she sends one of her own, /pic with no clothes named (the day's outfit), a nude belfie, a "covered" close-up,
"missionary anal", /studio link and one studio draw. Log the deploy in DECISIONS (run id, Version ID, rollback commit).

## Decided in review
(Opus writes here, per step, after each review.)

### Step 1 review (Opus, 2026-10-11)
Step 1 matches its spec, and the golden diff is empty. Haiku's four calls stand: the `kind` order (alone > act > partial > nude >
clothed); a seed sent to Runware; both klein tries planned before the first send; the LoRA unit test reading `runwarePlan`.
Opus fixed three slips (the golden is still unchanged, `node tools/check.mjs` 7/7):
- **The schema would have failed live.** `ensureStudioSchema` used `env.STUDIO_DB.exec(STUDIO_SCHEMA)`, but D1's `exec()` reads one
  statement per line, and `CREATE TABLE pictures` spans three lines. Every picture would have logged nothing, with only a
  `console.error`. Now it splits on ";" and sends `batch()` with one prepared statement each (checked in node:sqlite: all 3 run).
  The unit fake D1 now fails like D1 does on a statement split across lines.
- **A klein retry used the same seed.** A seed that drew "no picture" might fail the same way again. Each try now sends the next
  seed (`seed + attempt - 1`), and the row keeps the seed actually sent (unit: 41, then 42).
- **/look's in-person fallback logged `source` "scene".** `startPicture` now takes a `source` option, and that call passes "look".
- Pre-existing: `unit.mjs` called `process.exit` before its last test. The exit is now at the end, and `pcmToMp3` runs and passes.

### Decided in review, for Step 2 (apply these first)
- Put the sender's settings in the plan: `runwarePlan` gets `level` and adds `checkContent` (true at Off) to each try, and
  `drawRunware` takes it as an argument (`safety: { checkContent }`). No NSFW logic goes in `drawRunware`. `picture-plans.mjs`
  records `checkContent` only when it is true, so the 25 On cases stay as they are.
- `pictureFlags(prompt, herself, level)`: at Off, `nude` and `act` are false (so `partial` is too), and the log's `kind` matches
  what was drawn. The row's `nsfw` = the level (never null after Step 2).
- Golden: any changed line in the 25 existing cases is a bug (default On). Add these cases with `--write`: Off "naked on the bed"
  through `drawPicture` opts `nsfw: "off"` (expect no NAKED, `body-v10-clothed`, `checkContent` true, no NUDE LoRAs), Nude "naked
  on the bed" (expect the same plan as On), and Nude "topless, jeans on, mirror selfie". The refusals (/pic at Off or Nude) are
  unit and scenario rows, not golden cases.
- Before you finish, grep every prompt string in worker.js for `never` near `naked|nude|topless` (LESSONS §2). Only the SELF_CHOICE
  line should have been there. List what the grep found in HANDOFF.
- `picCommand` and `lookCommand` load the chat's settings (`s:<chat>`) themselves; `respond` already has them. A missing or
  unknown value = `CONFIG.PICTURE.NSFW.DEFAULT`.
- Leave alone: the seed logic, the studio log (except `nsfw`), and `tools/face/bench.json`.

### Step 2 review (Opus, 2026-10-11)
Step 2 matches its spec and the Step 2 review notes. Off sends no NAKED clause, the clothed body, no NUDE or ACT LoRAs and
`checkContent` true. Nude matches On without the sex acts. The 25 existing golden cases are unchanged (diff: 123 added, 0 removed).
The prompt strings have no stale "never naked" line (re-grepped: only comments are left, and they say "never nude" about
Cloudflare). Haiku's six calls stand: the nude tier is Runware-only; `PLACES.NUDE` = boudoir's places; at Off, `drawPicture` gets
what it's given (the entry points refuse, and `checkContent` is the second guard); /look refuses below On; levels are checked by name
(`actsOff`), so the index from `.map(W.sexCue)` reads as On, as before; a scene with nothing left about her draws nothing.
Opus fixed two slips (golden still unchanged, `node tools/check.mjs` 7/7; each new row fails on Haiku's code):
- **Her own nude words got a random tier, even at the default On.** "naked", "nudes" and "topless" left `BOUDOIR_ASK_PATTERN`,
  which `selfiePicture` also reads for her `[selfie: …]` words. So "naked on the bed" could come with an everyday expression
  ("an unimpressed deadpan look"), and the nude tier never applied to her own words. Now her NUDE_ASK words pick the nude tier where
  the level allows it (`nudeTierOk`, shared with `pickTier` and SELF_CHOICE's `{nude}`), else boudoir, as before Step 2.
- **A nude-tier picture that Cloudflare refused (3030) fell to everyday.** Runware past its cap or failing → Cloudflare klein
  → 3030 → it was redrawn as an everyday picture. Now it goes to boudoir, then flirty, like a refused boudoir picture.
- Left for later (not Step 3): at Off or Nude, `lookWrite` (DeepSeek) isn't told the level, so in a hot chat /look often answers
  PIC_NSFW. Telling it the level would draw a picture the level allows; that's a prompt change, so it waits for the owner's Telegram test.

### Decided in review, for Step 3 (apply these first)
- The bench runs at the default level (On): `runwarePlan(prompt, { ..., level: "on" })`, or leave `level` out. No /nsfw logic changes in Step 3.
- At Off a picture gets only the realism LoRAs (LORAS + own), so whichever realism set Opus picks after the bench is the whole LoRA list at Off.
  Note it in table.md. No Off case is needed in the bench.
- `LORA_INFO` and `LORA_PREFIX_WITH` are new CONFIG keys: each needs a field row in `tools/settings-panel.html` `SECTIONS`, then
  `node tools/build-panel.mjs` and `node tools/options.mjs`. Removing the povhandc line and adding `LORA_PREFIX_WITH` must leave the
  golden unchanged (`--check`, not `--write`).
- Seed `Math.random` per picture (LESSONS §1, round 5), not only the Runware seed, so V0-V5 differ only by their LoRAs and words.
  Give `env` an `AI` stub that throws, so a failed Runware call shows as an error and doesn't go to Cloudflare.
- Stop at $0.25 by the Runware MCP `account` (read before and after; 72 pictures at about $0.0034 is about $0.25, so stop early and
  say so rather than go over).
- Leave alone: /nsfw, the seed logic, the studio log, `tools/face/bench.json`.

### Step 3 corrections and the review (owner, 2026-10-11)
Bench: GitHub branch `face-candidates`, folder `runs/2026-10-11-step3-lora-bench/` (commit fd0e9e0): 72 pictures, `table.md` (every
picture; the owner's reads override the bench read), `reads-raw.md`, `plan.txt` (every prompt sent), `results.json`, zoom sheets.
The root causes are the review's to find (DECISIONS 2026-10-11). The build's leads below are for it to double-check, not findings.
1. **Nude mirror, seed 101: the head is disproportionately large** for the body (all four variants; seed 202 fine). Leads: `BIG_FACE` (the 2x
   face, 896x960, image 0 on every face picture); the head-size line ("her head is naturally sized for her body, about one seventh of her
   height") is only in LOOKS, which her face pictures never use.
2. **Blowjob, seed 101: the upper arms are slimmer than they should be.** The sent prompt already says "full upper arms" (REFERENCE). Lead:
   image 1 (`body-v10`, the owner's nude front); compare with the owner's picture 6 in `tools/face/originals/`.
3. **Doggy, seed 202: no anus visible** above the entry in any variant. The target is "her anus above it closed and untouched". No lead yet.
4. **Doggy hands, seeds 101 and 202: correct, no change.** The hand-word cause is withdrawn.
5. Not checked by the owner: riding seed 202 V0 (his hands at the bottom of the frame); the second head behind her in riding (both seeds).
The owner asked for root-cause fixes (the reference, the body or the camera), not prompt words, which leak (DECISIONS 2026-10-11).

### Step 3 review (Opus, 2026-10-11)
Built by Haiku (session_01RoSzs9sjxYEF75N7tTu8Nt), reviewed by Opus (session_01PVtSGCTGu7CyWDm5pnS4S7); both read with `get_session`.
**The build** matches its spec: `LORA_INFO` (18), `LORA_PREFIX_WITH`, povhandc out of ACT_WORDS and LORA_WORDS, options.mjs, the bench
harness; golden unchanged by it; `node tools/check.mjs` 7/7. Haiku left CLAUDE.md, `.claude/`, the CI workflows, `tools/test/` and
`tools/face/bench.json` untouched, and only appended to DECISIONS.md (no entry reworded). One slip, left as is: the panel row for
`LORA_INFO` is a "textarea", which shows a nested object as "[object Object]"; the panel is retired (2026-10-06) and the bot never reads the key.
**Root causes** (13 pictures through the bot's own code, one change at a time, the seed reproduced first; `face-candidates`
`runs/2026-10-11-step3-review/`, table.md):
- **Head too large (nude mirror, seed 101): the camera.** The random gaze "looking up at the camera through her lashes" puts the camera
  above her; on a standing full-body picture that draws the head big and the body short and narrow. Same seed with a level gaze: in scale.
  Ruled out: BIG_FACE (the 480 px face drew the same head). The LOOKS head-size line was not tested: the gaze alone fixed it, and the owner
  asked for no new words. Fix: the gaze is out of `GAZES.EVERYDAY` and `GAZES.HEATED` (the shorter lists move other cases' gaze picks:
  1 golden line). Seed 101 now draws "looking away toward the window", head in scale.
- **No anus at doggy seed 202: Flux 4 Play.** Its doggy (d0gg13) draws the man lying down and her torso upright (a reverse cowgirl), so the
  cleft stays closed. Ruled out: the standing back body (image 1 = the front body drew the same picture) and "belly" in POV_MAN. Without
  Flux 4 Play (Unchained 0.8 + General Penis, the bot's own route) both seeds show the anus above the entry and the shaft in the vulva, and her
  face is closer to image 0. Fix: Flux 4 Play off doggy (riding and cowgirl keep it), d0gg13 out of the doggy scene; unit row changed.
- **Blowjob arms (seed 101): not fixed.** Ruled out: image 1 (the owner's picture 6, cropped; same arms), BIG_FACE, Unchained at 0.5. Seen:
  her arms stretched forward to his thighs, seen from above; without Unchained the bust and arms were fuller but the act failed (penis out
  of her mouth). One seed per test: a lead for a later bench, not a finding.
Golden: `--write`, 3 lines (doggy: LoRA 4 Unchained for Flux 4 Play, d0gg13 gone; one gaze pick moved). Spend: $0.03666 by the bot's sum
(balance $14.70565 → $14.66990); with the bench, $0.24063 of $0.25. The balance had already fallen $0.01573 between the bench's end and this
review (from $14.72138, cause unknown); counting that, the step is $0.25636.

### Decided in review, for Step 4 (apply these first)
- **Realism LoRAs: V2**, `LORAS` = `{ "ferasalm:instapic@1": 0.6, "ferasalm:realhd2kc@1": 0.5 }` (phone2025 and ultrareal5 become spare;
  update their `LORA_INFO` notes). Why: on the reads V0, V2 and V3 look alike (skin, faces), V0's four LoRAs gave the one bare nipple,
  fewer LoRAs cost less GPU time, and V2 keeps the two the owner asked for by name (InstaPic 2026-10-08, Real HD 2K 2026-10-09).
  The smartphone prefix then never goes in (`LORA_PREFIX_WITH` is phone2025). At /nsfw Off these two are the whole list.
  `--write` the golden: only `lora` lists and the prefix sentence may change. Name the reason in the commit.
- Add three regression pictures to the Step 4 bench (about $0.008): "naked, standing in front of the bedroom mirror" seeds 101 and 202
  (head in scale) and "doggy style" seed 202 (anus above the entry), read at full size with a zoom crop for doggy.
- Name the model in HANDOFF, table.md and the commits (owner, 2026-10-11): read it with `get_session`.
- Leave alone: blowjob routing (the arms stay open), riding (the second head and his hands are not checked yet: Step 6 looks at positions).

### Step 3 review prompt (paste into a new chat, pick Opus, effort high)
> Continue reem-bot. Follow CLAUDE.md. You are reviewing WORKPLAN Step 3. The build session that made it is linked in HANDOFF
> (https://claude.ai/code/session_01RoSzs9sjxYEF75N7tTu8Nt). It built the LoRA catalog, the smartphone-prefix change, the options script,
> the bench script, and the 72-picture bench. The review is yours.
>
> Read first: HANDOFF.md; the 2026-10-11 entries of docs/DECISIONS.md; docs/LESSONS.md; docs/WORKPLAN.md (Step 3, "Decided in review,
> for Step 3", and "Step 3 corrections and the review"). Then the bench on GitHub branch `face-candidates` (commit 5fba51a), folder
> `runs/2026-10-11-step3-lora-bench/`: table.md (the owner's reads there override the bench read), reads-raw.md, plan.txt (every
> prompt sent), results.json, the zoom sheets, and the pictures you need at full size.
>
> The owner's findings, to verify and fix:
> 1. Nude mirror, seed 101 (all four variants): her head is disproportionately large for the body. Seed 202 is fine.
> 2. Blowjob, seed 101: her upper arms are slimmer than they should be. The sent prompt already says "full upper arms" (REFERENCE).
> 3. Doggy, seed 202: no anus is visible above the entry in any variant.
> Doggy hands at seeds 101 and 202 are correct (his hands on her buttocks, no deformation): the bench's hand-word finding is withdrawn.
>
> The build's leads, for you to double-check (not findings): BIG_FACE sends the 2x face on every face picture; the head-size sentence
> ("her head is naturally sized for her body, about one seventh of her height") lives only in LOOKS, which face pictures never use;
> image 1 (body-v10) may be slim in the arms (the owner's picture 6 is in tools/face/originals/); the camera. Test them with real pictures
> through the bot's own code (tools/face/lora-bench.mjs is the harness). Report what you confirm and what you rule out.
>
> The owner's decision (DECISIONS 2026-10-11): fix the root causes, not with prompt words, which leak. Find each cause and fix it where it
> lives: the reference, the body, or the camera.
>
> Also decide the realism LoRA set (V0 with four LoRAs; V2, V3 and V5 are the reduced sets) from the reads, and write "Decided in review,
> for Step 4" at the end of docs/WORKPLAN.md. Report the Runware spend against the step's $0.25 budget. If the golden plans change, run
> `--write` and say why. Finish with `node tools/check.mjs` (read it in full), then /handoff. CLAUDE.md covers pushes and deploys.
> The repo records name no model (the session rule); say who did the review in chat.

### Step 4 review (Opus, 2026-10-11)
Built by Haiku (session_01TtxHDLcufHAr8WtgC8sPXj), reviewed by Opus (session_01SS9jTukEt8oHbi6CVAE3Ni); both read with `get_session`.
**The build** matches its spec except the bench, which left out the neutral reference and the nude and neutral modes (39 of 67
pictures, $0.10 of $0.20). Haiku's table read 24 outfits as "worn as named" in one repeated phrase; the rust-mode silk blouse at seed
101 was cut short too. Opus fixed four slips (each new unit row fails on Haiku's code; `node tools/check.mjs` 7/7):
- **The day's outfit could change during the day.** `dayInfo` reads KV "day" and starts `refreshDay` (weather every 30 min) in
  `waitUntil`; the reply's picture then saved today's outfits; `refreshDay` wrote back the "day" it had read, without them, so the next
  picture re-rolled. Now `refreshDay` re-reads the key and keeps `outfits` (unit: same outfits after a refresh in the same reply).
- **`OUTSIDE_WORDS` "out", "rain", "snow"** (Opus's own list) matched "stretched out", "lights out", "rain on the window": the coat
  outfit at home. Now "going out", "out for", "out with", "night out", "in the rain", "in the snow".
- **Her sex-act words got a wardrobe item.** `composePicture` added the tier's clothes to any words that named none, so a boudoir
  "riding him on the bed" became "…, wearing a black one-shoulder swimsuit" and read as partly naked. Act words get none now.
- **The golden diff was noise.** The three new cases were inserted near the top; cases are seeded by index, so every later case's
  random picks moved (hair, mood, place, aspect). They are at the end now, with two more (an outfit picture as image 1; act words).
**`CLOTHED_BODY` = "none"** (review bench, `face-candidates` runs/2026-10-11-step4-review/, $0.05525; Step 4 in all $0.15691 of
$0.20). Klein copies the garment of a clothed image 1, whatever the words say: the rust halter cut tops to its crop length (Breton at
seeds 101 and 303, silk at 101), the neutral gray tank (built: `v10-neutral`, seed 402) put its scoop neck on the Breton (101, 303)
and the linen top. No body picture: 0 of 18 leaked, and not slimmer than rust (the owner's "slimmer at seed 101" were the cropped tops
and the rust picture's smaller bust). The nude mode drew the fullest build, v10's, 6/6 dressed at seed 101, but one seed and no
boudoir, /nsfw Off or no-clothes scene was tried: kept as an option, not the default. The seed-101 "sleeveless Breton" is klein's
reading of "Breton top" (none drew it sleeveless at 303 too); only the crop length was the leak.
Left open: hair drifts to brown highlights at seed 101 in every mode (the face is jet black); faint nipple outlines on thin white tops
(also in the owner's own olive and rust outfit pictures). The plain "nude belfie in the bedroom mirror" drew no phone and no
reflection.

### Decided in review, for Step 5 (apply these first)
- **Partial pictures' image 1.** `BODY_PARTIAL` "clothed" sends the rust-halter picture, which leaks its crop top (Step 4 review).
  Add `BODY_PARTIAL` "none": no body picture and REFERENCE_NOBODY, like `CLOTHED_BODY` "none" (`runwarePlan`: `noBody` also when
  `partial && R.BODY_PARTIAL === "none"`). The bench's fourth variant, "Step 4's clothed image 1 at 0.6", becomes BODY_PARTIAL
  "none" with PussyDiffusion 0.6. Leave the default "clothed" until the review picks.
- New golden cases go **at the end** of the list (cases are seeded by index); `--write`, then compare old and new case by case. Any
  changed line outside the partial and close-up cases is a bug.
- Bench ≤ $0.10 (read the Runware balance before and after with `account`). In table.md, one line per picture saying what you saw in
  that picture (not one phrase for all), and a P1-P4 zoom crop for the vulva.
- Name the model in HANDOFF, table.md and the commits (read it with `get_session`).
- Leave alone: `CLOTHED_BODY`, the day outfits and OUTSIDE_WORDS, the LoRA set, the blowjob routing, `tools/face/bench.json`.

### Step 5 build (Opus, 2026-10-11)
Built by Opus (session_01AmUQa9XtUpc3EGRs7ctq3K, `get_session`): the chat was opened with the Haiku prompt, but its model was Opus.
Before Step 5, the owner's yes to the fuller build: `CLOTHED_BODY` "nude", checked first (`outfit-bench.mjs --nude-check`, 18 pictures,
$0.04628; see docs/DECISIONS.md and QUALITY). Also fixed there: ROOM's image number when no body picture is sent; "satin slip" words.
**Step 5 as built, and where it leaves the spec (each for a path seen or traced):**
- PARTIAL_WORDS: "covered" only as "covered breasts", "breasts covered", "covered chest", "chest covered", "covered up" ("covered in
  sweat" is no clothing); "on top" / "top of" are taken out before the check (riding "on top" made the act partly naked).
- CLOSE_WORDS without a bare "between her legs" ("her hand between her legs", "he kneels between her legs"); close-ups only on nude,
  non-act, non-back pictures (an act keeps its ACT_SCENES camera).
- PARTIAL_TOP says "her top stays on" (P2 names no garment); PARTIAL_TOP adds NAKED_BUSH, PARTIAL_BOTTOM adds NAKED_BREASTS (as
  sentences); "topless" / "bottomless" beat a top / bottom word.
- Crotch close-ups: no place picture and no mood or hairstyle words (camera words; the random picks are still made in order).
- New after the bench: CLOSE_SHAPE "1:1" and CLOSE_FACE false (no face or body picture, REFERENCE_CLOSE): at 9:16 with her face
  every close-up ran from her lips down (12/12); 1:1 without the face 0/4 faces. REFERENCE_CLOSE carries no belly, hip or thigh words.
- PARTIAL_WEIGHTS PussyDiffusion 0.6 (= 0.8 on the zoom, off loses the vulva). `BODY_PARTIAL` left "clothed", as asked.
**For the review (Opus) to decide:** `BODY_PARTIAL` "none" (my read: the nude body drew "covered breasts" naked 0/6, none 2/2;
nude = none when a garment is named; "clothed" is the rust halter, which leaks its crop); the faceless 1:1 close-up (it drops her
face and body pictures: is the skin and build close enough?); nipple points through thin tops (every mode, all three steps); P3
"legs apart" draws no vulva (not a PussyDiffusion word: LoRA routing was off-limits); close-ups never reach navel-to-thighs (the
breasts stay in, covered).

### Step 5: no review (owner, 2026-10-11)
Step 5 stands as built (above). `BODY_PARTIAL` stays "clothed". Its open questions go to HANDOFF's Later: BODY_PARTIAL "none", the
faceless 1:1 close-up, nipple points through thin tops, P3 "legs apart" (no vulva), close-ups that never reach navel-to-thighs.

### Step 6 with the orchestrator (owner, 2026-10-11; apply these first)
The chat is Opus and runs `/opus-haiku-orchestrator` (`.claude/skills/opus-haiku-orchestrator/`); `haiku-worker` loads from
`.claude/agents/` when the chat starts (if "Agent type not found", the skill's fallback). Split (Claude's plan; the chat may change it
and says so in HANDOFF):
- **Opus:** the sync report; the Runware balance before and after (MCP `account`: workers have no MCP); the anal-first routing in
  `runwarePlan` (before ACT_SCENES; body per position; povanal alone on doggy); reading the golden diff case by case; every picture at
  full size and every zoom crop, the picks and root causes (owner, 2026-10-11); the push to `face-candidates`; check.mjs read in full;
  /handoff.
- **Haiku, one brief each:** (1) the CONFIG keys ANAL_WORDS, ANAL_POSITION_WORDS, ANAL_POSITIONS, ANAL_SCENES, ANAL_LORAS with the
  spec's values pasted into the brief word for word, their settings-panel rows, `node tools/build-panel.mjs`, `node tools/options.mjs`;
  (2) unit rows and golden cases from a list Opus writes (cases at the end of the list), then `picture-plans.mjs --write`;
  (3) the bench: one worker, calls in sequence about 4 s apart (never two bench workers at once), the dollar cap Opus gives it, the
  crops and sheets, a first "Haiku's read" line per picture in table.md; (4) the Civitai report (`api.civitai.com`, report only, a
  fixed table: name, version, downloads, rating, file type).
- Every brief carries the repo rules, since Haiku sees nothing else: grep `worker.js`, never read it whole; never open `face.js`,
  `places.js`, `mp3.js` or `tools/settings-panel.html` whole; don't touch `tools/face/bench.json`; no git push, no deploy;
  LIMITS & OOC untouched; the spend cap in dollars.
- Leave alone (Step 5 stands): BODY_PARTIAL, CLOTHED_BODY, the close-up settings, the day outfits. Also check riding for the second
  head and his hands (HANDOFF Later), only if the budget allows.
- Done: Step 6's acceptance, then HANDOFF "Step 6 done" (no separate review chat), naming which parts Haiku did, by name and raw model ID: the
  chat's from `get_session`, each worker's from its subagent transcript (`grep -rhoE '"model":"claude-haiku[a-z0-9-]*"' ~/.claude/projects | sort | uniq -c`).

**Prompt for the Step 6 chat (pick Opus, effort high):**
> Continue reem-bot. Follow CLAUDE.md: run `git fetch --unshallow origin`, then the sync report; stop and ask me if it lists work
> really missing. Your task is docs/WORKPLAN.md Step 6 only: read its section and "Step 6 with the orchestrator" at the end of the
> file, then run /opus-haiku-orchestrator for it: show me the plan, then go. Spend at most $0.12 on Runware (read the balance before
> and after with the Runware MCP `account`). No deploy, never push to main. Finish with /handoff: HANDOFF says "Step 6 done", with
> every check you ran and read, the golden-plan diff summary, where the pictures are, and which parts Haiku did. Name the model of
> this chat (`get_session`) and of each worker (its subagent transcript) by name and raw model ID in the records.

### Step 6 build (Opus + haiku-worker, 2026-10-11)
Chat: Opus (`claude-opus-5-5`, `get_session`, session_01Uk8PCnuhgSYzVgAkNLd9k7). Workers: haiku-worker (`claude-haiku-5-5`, from the
subagent transcripts): the CONFIG keys and panel rows; the unit rows and golden cases; `tools/face/anal-bench.mjs`; pass 1 of the bench
(its first read stopped: Opus reads every picture); the Civitai report. Opus: the routing, the golden diff, every picture, the picks.
**Where it leaves the spec (each for a path seen or traced):**
- ANAL_WORDS without a bare "her ass" ("his hands on her ass" while riding loaded POV Doggy Anal alone and, with anal first, would turn
  vaginal riding anal); povanal's ACT_WORDS the same list; the anal entry of ACT_SCENES moved to ANAL_SCENES.doggy (its "her ass"
  caught vaginal doggy words first). "on top" in the reverse cowgirl words only as hers ("he's on top of her" is missionary or prone).
- ANAL_LORAS from the bench (QUALITY "Step 6 bench"): POV Doggy Anal in every position (doggy alone 1.0, the others 0.8 with the
  realism LoRAs; `ANAL_ALONE` ["doggy"] is new); no NUDE_LORAS or WITH_LORAS on anal. Flux 4 Play, Missionary POV and General Penis
  out (vaginal 0/9, no penetration 0/9). The reverse cowgirl scene lost Flux 4 Play's trigger.
- ANAL_POSITIONS doggy 0.6, reverse cowgirl 0.1, prone 0.3, missionary 0: missionary anal never draws right (vaginal 6/6 with the spec's
  LoRAs; POV Doggy Anal keeps the opening but loses her legs 2/2). Named "missionary anal" uses POV Doggy Anal 0.8 (the opening right).
- Bench: 24, then 8 on POV Doggy Anal (doggy, prone, and missionary and reverse cowgirl as new variants) instead of 8 more seeds of
  0/3 setups. Riding's second head: seen once (anal reverse cowgirl s505); his hands: correct in every picture.
**Later:** a frontal anal LoRA for missionary (Civitai below: True-Anal Frontal view, Piledriver anal, Reverse Cowgirl anal); the
two-heads / two-women defect on riding and at 16:9 (WIDE's "Only one woman" did not stop it).

**Civitai, FLUX.2 klein 9B, sex positions (report only; `api.civitai.com`, 2026-10-11, haiku-worker; two rows checked by Opus):**
| Name | Model id | Version (id) | Downloads | 👍 | File | Act |
|---|---|---|---|---|---|---|
| SNOFS | 1972981 | Klein 9b v1.4 (2960556; v1.0-1.3 too) | 290528 | 7507 | LoKR | doggy, missionary, prone, cowgirl |
| Blacked / Interracial | 2674806 | Doggy Style KLEIN-9B (3092509) | 10324 | 303 | LoRA | doggy |
| Pyro's Cowgirls | 2332978 | v1.0 (2624304) | 8956 | 295 | LoRA | cowgirl |
| FLUX 4 PLAY AIO | 2403747 | Flux4Play_Klein9B_v1 (2702716) | 8303 | 360 | LoRA | several (in use) |
| Missionary POV Vaginal | 2465199 | v1.0 (2771752) | 7145 | 277 | LoRA | missionary, vaginal |
| POV Doggy Anal Adriano-angle | 2509925 | Klein 9b (2821244) | 7055 | 370 | LoRA | anal doggy (in use) |
| Against wall doggystyle | 2499761 | v1.0 (2809996) | 6816 | 321 | LoRA | doggy |
| Bulldog Anal | 2572426 | v1.0 (2890279) | 6520 | 374 | LoRA | anal doggy |
| Full Nelson Double penetration | 2484754 | v1.0 (2793575) | 5751 | 284 | LoRA | full nelson |
| True-Anal Frontal view | 2527075 | v1.0 (2840130) | 5715 | 309 | LoRA | anal, frontal |
| Doggystyle anal Spitroast | 2512133 | v1.0 (2823689) | 5229 | 270 | LoRA | anal doggy |
| POV Squatting Sex | 2374944 | Klein9b (2670873) | 4944 | 191 | LoRA | squatting |
| SexGod Doggystyle | 2532708 | v1.0 (2846431) | 4815 | 175 | LoRA | doggy |
| POV Anal K3NK | 2435368 | v1.0 (2738283) | 4642 | 258 | LoRA | anal POV |
| Piledriver anal | 2512899 | v1.0 (2824535) | 4582 | 268 | LoRA | anal, on her back |
| Ultimate Blowjob V2 K3nk | 2520572 | v2.0 (2832958) | 4557 | 174 | LoRA | blowjob, 69 |
| Missionary POV K3NK | 2400540 | v1.0 (2699087) | 3976 | 205 | LoRA | missionary (in use) |
| Reverse Cowgirl anal | 2529508 | v1.0 (2842888) | 3241 | 154 | LoRA | anal reverse cowgirl |

### Step 7: how to run it cheaply (Opus, 2026-10-11; owner: "spend less")
The studio is a well-specified build (its section above): **Sonnet 5.5, effort high**, one chat, with the Haiku prompt of "How to run a
step" (N = 7, $0.05). No orchestrator: little of it is token-heavy. Opus only if the D1 or link-signing part goes wrong twice.

### Step 7 review and the fix round (Opus, 2026-10-11)
Owner: the studio link shows "not found"; a naked lower body at /nsfw Off; Reem slimmer, without the fuller arms. Opus read D1
`pictures` and the code (findings in the prompt below). Step 7 deviations (1)-(4): accepted for now, to Later. The fix round is
built by Haiku 5.5 from this prompt (one chat); Opus reviews it once at the end.

#### Fix round prompt (paste into a new chat, Haiku 5.5)

```
You are building a fix round for reem-bot (Opus planned it; Opus reviews it once at the end). Work on branch
claude/step-7-haiku-audit-fmac61 (create it from origin/dev if missing). Follow CLAUDE.md's session start (sync report, HANDOFF,
DECISIONS, LESSONS, then docs/MAP.md before any code). Lean reads: never read worker.js whole; grep, then read only the lines needed.
Never open face.js, places.js or tools/settings-panel.html. Records name the model by name ("Haiku 5.5"); the raw-ID question is
still open with the owner (HANDOFF), don't decide it.

Owner's decisions for this round (log them in docs/DECISIONS.md, dated 2026-10-11, owner's words):
- "when /nsfw off, we reroute image generation to cloudflare as it has a built in safety filter. Keep nsfw nudity and sex on runware."
- Lingerie stays allowed at /nsfw Off (owner picked "Keep lingerie at Off").
- Opus's Step 7 review: the four Step 7 deviations are accepted for now and go to Later (not owner decisions: write them in WORKPLAN
  "Decided in review", not DECISIONS).

Facts Opus found (don't re-investigate, build on them):
- D1 reem-studio `pictures` rows 9-14 (nsfw "off"): every Off selfie went to Runware with refs ["face-2x","body-v10"], the NUDE front
  as image 1 (RUNWARE.CLOTHED_BODY "nude"). Row 13 named only "her father's old gray cardigan over a black cami": klein drew image 1's
  naked lower half. Runware's checkContent (on at Off) did not stop it.
- /studio shows "not found": studioRoute (grep `async function studioRoute`) answers `/studio?t=` with a 302 and
  `Set-Cookie: studio=...; SameSite=Strict`. The link is opened from Telegram (cross-site), so the cookie isn't sent on the redirected
  request and `/studio` answers 404. D1 has no "studio" rows. Step 7's Chromium test used page.route fixtures, never the real route.

TASK A: the studio link (free)
1. Reproduce first. Write tools/test/studio-browser.mjs (by hand, not in check.mjs; CI has no browser): load the worker with
   tools/test/load-worker.mjs, put a node:http server on 127.0.0.1 in front of its `fetch` (a fake env: REEM_KV in memory,
   TELEGRAM_BOT_TOKEN "test", OWNER_ID "1", STUDIO_DB stubbed like tools/test/studio.mjs does, no RUNWARE key). Make a link with
   `studioToken`. In Chromium (global Playwright, executablePath /opt/pw-browsers/chromium): open a page on a DIFFERENT origin
   (e.g. http://localhost:<port2>/ with an <a href="http://127.0.0.1:<port>/studio?t=..."> link), click it, and record what loads.
   Expect "not found" with the current code. Write the output down; if it does NOT reproduce, stop and report what you saw
   instead of changing the route.
2. Fix in studioRoute: a valid `?t=` on GET /studio answers 200 with STUDIO_HTML and
   `Set-Cookie: studio=<token>; Path=/studio; HttpOnly; Secure; SameSite=Lax; Max-Age=...` (no redirect). In studio.js, first thing:
   if location.search has t=, `history.replaceState(null, "", "/studio")`. Every other /studio route still needs the cookie (404
   without). Keep STUDIO_HEADERS (Referrer-Policy no-referrer keeps the token out of referrers).
3. Rerun the browser script: the cross-site click loads the page, /studio/api/options and /studio/api/log answer ok (look at the
   screenshot at 390x844 and the console: no errors), a reload without ?t= still works, a fresh context without the cookie gets 404.
4. tools/test/studio.mjs: rows for 200 + SameSite=Lax on the first visit, no Location header, 404 without the cookie.

TASK B: /nsfw Off draws on Cloudflare
1. CONFIG.PICTURE.NSFW.OFF_ROUTE: "cloudflare" (comment with the owner's words; "" = as before). Add its field to
   tools/settings-panel.html SECTIONS by hand, then `node tools/build-panel.mjs`.
2. `runwareRoute(level)`: false when level === "off" and OFF_ROUTE is "cloudflare"; otherwise as today. `grep -n "runwareRoute("`
   and pass the level at EVERY call site; where a function has no level yet, thread it from its caller (the chat's level comes from
   `nsfwLevel(settings)`). This makes filterSafe (FILTER_WORDS), safeLine (SAFE "No nudity."), mayDraw (PICTURE.NOT_DRAWN),
   nudeTierOk and explicitWords take the Cloudflare rules at Off. Also `runwareAffordable(env, ledger, level)`.
3. drawPictureNow: at Off skip the Runware block entirely and draw with Cloudflare klein (P.MODEL) with her face, `bodyBytes()`
   (body.jpg, the clothed small body) and the place: the existing Cloudflare code below the Runware block. At Off never fall back
   to Runware or TwinFlow: a 3030 refusal or no neurons = no picture (the existing "one tamer try" in startPicture stays).
4. Nano Banana (startPicture's lingerie route, `drawLingerie`, `nanoScene`, the `L.ENABLED && env.OPENROUTER_API_KEY &&
   !runwareRoute()` checks): never at Off. Lingerie at Off = Cloudflare klein with FILTER_WORDS (bra/panties become bodysuit words).
5. /setup's Pictures line adds "at /nsfw Off: Cloudflare klein". studioCompose at Off returns plan [] (no change needed; check).
6. Tests (unit.mjs or e2e.mjs): at Off, with globalThis.fetch stubbed, drawPicture makes no request to api.runware.ai and calls
   env.AI with P.MODEL and 2-3 input images; "a black lace bra and panties" at Off reaches klein FILTER_WORDS-ed; SAFE is in the
   prompt; no OpenRouter image call; the D1 row has model @cf/... and nsfw "off". At On and Nude nothing changes.
7. Golden plans: run `node tools/test/picture-plans.mjs --check` BEFORE editing to confirm clean, then after. Only the "nsfw Off"
   case(s) may change (they now send no Runware request). Write the new golden with --write only then, and list the diff case by
   case in your commit message.

TASK C: clothed with a top and no bottoms (Nude and On, Runware)
1. In runwarePlan, when the clothed picture sends the nude BODY as image 1 (CLOTHED_BODY "nude", not OUTFIT_BODY) and the words name
   a top (RUNWARE.TOP_WORDS) but no bottom (BOTTOM_WORDS) and no one-piece, add RUNWARE.DRESSED_BOTTOM after DRESSED_FULL:
   "Below the waist she wears what suits the outfit (jeans, a skirt, shorts or sweatpants); her hips and legs are never bare."
   One-pieces: add RUNWARE.ONE_PIECE_WORDS (dress, jumpsuit, romper, robe, nightgown, bodysuit, overalls, onesie, long coat) with a
   panel field. grep every reader of TOP_WORDS/BOTTOM_WORDS first (LESSONS: a shared pattern has other readers).
2. A golden case at the END of the list: "/pic her father's old gray cardigan over a black cami, in the kitchen" at On. Only the new
   case and cases whose words have a top and no bottom may change; list them.
3. A scenarios.mjs or unit row with row 13's exact words.

TASK D: body audit (Runware, cap $0.12; NO body CONFIG change: Opus decides at review)
1. Static table in runs/2026-10-11-body-audit/audit.md: for each picture kind (clothed selfie, clothed with an outfit picture, nude,
   sex act, back, partial, close-up, Cloudflare), at 897dfaf vs HEAD: image 1 sent, the REFERENCE* line used, LORAS and other LoRAs,
   size, and every body word (bust, arms, figure, kg, slim). From `git show 897dfaf:worker.js | grep -n` and the current file, quoting
   the strings. Mark which step changed each (git log -S).
2. Bench through the bot's own code (copy the harness of tools/face/outfit-bench.mjs; `NODE_USE_ENV_PROXY=1`, calls ~4 s apart,
   Math.random seeded, seeds 101 and 202, level "on"). Read the Runware `account` usage before and after (the MCP).
   Cases: (1) mirror selfie, standing, full body, "a fitted black tank top and high-waisted jeans" (arms visible);
   (2) the olive cardigan outfit (its style picture); (3) the camel coat outfit; (4) row 13's words at On (also checks Task C);
   (5) naked, standing, mirror selfie.
   Variants: V0 = HEAD as committed; V1 = OUTFIT_BODY false (cases 2-3 only); V2 = LORAS of 897dfaf (phone2025 0.6, ultrareal5 0.6,
   instapic 0.6, realhd2kc 0.5); V3 = LORAS {} (no realism LoRAs).
   Draw V0 for every case first, then the variants; stop at $0.12 (the script's own cap).
3. Push pictures + side-by-side sheets (`convert ... -resize x700 +append`, one row per case and seed: V0 | V1 | V2 | V3) and a
   table.md to `face-candidates` runs/2026-10-11-body-audit/. In table.md write per picture only what you can measure or plainly
   see at full size (open each picture alone): arms' width relative to the forearm/wrist, waist, bust, clothes as named, any bare
   skin below the waist. Do not pick a winner.

TASK E: records and push
- docs/DECISIONS.md (the two owner decisions above), WORKPLAN "Decided in review" (Step 7 deviations accepted for now; the body
  audit waits on Opus), QUALITY rows (the bench), LESSONS (two entries: a 302 + SameSite=Strict cookie from a link opened in another
  app is not sent → 200 + Lax; Runware checkContent didn't block a naked lower half at Off, and a nude image 1 with only a top
  named draws the bottom half naked), MAP (OFF_ROUTE, DRESSED_BOTTOM, ONE_PIECE_WORDS, studio-browser.mjs, the first-visit change),
  CHANGELOG. Keep LESSONS at most 180 lines (it is at 179: merge or trim older entries to make room).
- `node tools/check.mjs` (git add new files first), read every step's output, not the summary. Commit, push the branch, merge
  origin/dev if needed and `git push origin HEAD:dev`. Do NOT push to main and do not deploy.
- HANDOFF: what changed, the checks you read, the bench totals and where the sheets are, "not deployed", and next step: "Opus
  review of the fix round (one chat): the studio browser run, the Off unit rows, the golden diff, the body-audit sheets; then the
  owner says deploy. Effort: high." Put the Opus review prompt in WORKPLAN.

Stop and report (do not improvise) if: the studio bug does not reproduce; the golden diff shows changes outside the cases named;
Cloudflare klein is the wrong route for some Off picture you find; the bench would pass $0.12.
```

### Decided in review, for the fix round and Later (Opus's Step 7 review, 2026-10-11)
- The four Step 7 deviations are accepted for now and go to Later (owner, 2026-10-11; not owner decisions, so not in DECISIONS):
  (1) compose takes /pic words only (scene, look and selfie are not in the editor); (2) no Cloudflare klein in the studio (klein 9B and
  TwinFlow on Runware only); (3) the editor's place is a place's first crop, the bot picks at random, and compose names the place, not
  the crop; (4) studio draws send `checkContent` false (the owner's own tool).
- The owner's decisions of the fix round are in DECISIONS (2026-10-11: "/nsfw Off draws on Cloudflare ..."; lingerie stays at Off).

### Fix round (Haiku 5.5, 2026-10-11): what was built
- A. The /studio link: the first visit is the page with `SameSite=Lax` (no 302; `studio.js` drops `?t=`). The 404 was reproduced first in
  Chromium over https (`tools/test/studio-browser.mjs`): the 302's Strict cookie was stored, not sent on the redirected request.
- B. /nsfw Off on Cloudflare (`NSFW.OFF_ROUTE` "cloudflare"; see MAP): Off pictures are Cloudflare klein with her face, the clothed body
  and the place; lingerie at Off is klein with the filter words; Nano Banana, Runware and TwinFlow never at Off; Off refuses nudity and sex
  acts on every route.
- C. A top and no bottom on the nude body (the owner's row 13): `RUNWARE.DRESSED_BOTTOM`; `ONE_PIECE_WORDS` (a dress, a robe) leave it out.
- D. The body audit (Opus decides any body change): `runs/2026-10-11-body-audit/` on `face-candidates`, see QUALITY.
- E. Records: DECISIONS, CHANGELOG, LESSONS (three traps), MAP, QUALITY, HANDOFF.

### Fix round review prompt (paste into a new chat, pick Opus, effort high)
Review the fix round of reem-bot (branch `claude/step-7-haiku-audit-fmac61`, built by Haiku 5.5). Read `HANDOFF.md`, then the fix round
entries: DECISIONS (2026-10-11 "/nsfw Off draws on Cloudflare"), CHANGELOG (thirty-fifth session), LESSONS (the three 2026-10-11 traps),
and QUALITY (fix round). Check, and say what you found at each step:
1. The studio link: the browser run (`tools/test/studio-browser.mjs`, before and after): the first visit 200 with SameSite=Lax, the page,
   the reload, a fresh browser 404. Read the screenshot.
2. Off: the unit rows (Off route, lingerie, Task C) and the three scenario rows that now assert the Cloudflare call. Is each Off rule right?
3. The golden diff: the case list in CHANGELOG; decide whether any changed prompt is wrong for its words.
4. The body audit: `runs/2026-10-11-body-audit/` (audit.md and table.md): decide which body settings, if any, Opus changes (a CONFIG
   change is Opus's call), and what to do with each finding.
5. Then the owner decides on "deploy". Report anything stuck first.
Effort: high. Model: Opus. Do not push to `main`.

### Fix round review (Opus, 2026-10-11): what was found and decided
1. Studio link: reproduced on d21c4b3 (302 + Strict, then 404; a reload 404 too); HEAD 10/10 in Chromium, screenshot read. Lax is safe:
   every GET is read-only, and money is spent only by POST (compose, draw), which a cross-site link never sends with the cookie. Accepted.
2. Off: the unit and scenario rows assert the right things (no Runware or OpenRouter call, one klein call with 2-3 pictures, SAFE, the filter
   words, the log row at "off"). Every real Off path is gated before drawing (`/pic` and `/look` refuse, scenes skip, selfies go boudoir).
   Off refuses Runware's sex-act list and NUDE_WORDS; Cloudflare's own extra words (sheer, see-through) are left to its filter (a 3030
   gets the existing tamer try). Accepted. Fixed: the golden harness built the Off prompt at On (no SAFE); `picAt` now builds at its level.
3. Golden diff: every changed prompt fits its words (the bottoms line on chest-up shots is harmless). But a sweep of every wardrobe
   entry found the line on outfits that show her legs on purpose or name a bottom it didn't know: fixed with BOTTOM_WORDS (briefs,
   bottoms, joggers) and `BARE_LEGS_WORDS`; golden unchanged. The row 13 unit row was flaky (a random hairstyle reference): fixed.
4. Body audit: no body CONFIG change. Seed variance beats the variant differences; the 897dfaf LoRAs (V2) shorten the tank, so HEAD's
   set stays; a no-line DRESSED_BOTTOM run is not worth its $0.01 (the owner's row 13 is the "without" case, and all V0 row-13 pictures
   came out clothed below). A direct check of the owner's "slimmer" (897dfaf vs HEAD, the same /pic at four seeds, QUALITY) did not show
   HEAD slimmer at full size; 897dfaf copied the rust halter's cut (4/4) and crop (2/4). If she still reads slim in Telegram, the owner
   names the pictures (the studio log shows each one's refs); the lever is the body picture itself (the owner's pick), not body words.
   Nipples through fitted tops (the tank at seed 202, the olive cami) stay in Later with Step 5's open questions.
5. Ready for the owner's Telegram test, then "deploy".

## Picture overhaul (2026-10-12; owner's plan, DECISIONS 2026-10-12): Steps A-D, one Opus chat each
Planned and Step A built by Opus 5.5 (`claude-opus-5-5`). Each step ends with `/handoff` and a push to `dev`; deploy only when the owner says so. Benches ≤ $0.15 a step, every picture read at full size.
- **Step A (done, 2026-10-13):** the clothed body v11 (front and back), the outfit pictures retired, Lenovo 1.3 + NSFW Unlocked 0.8 + Anatomy Fixer (not on sex acts), at most 3 LoRAs, no act, hands or flash LoRA, 6 steps CFG 2, the studio's Face/Body/Hair menus and Compose at Off. Bench: QUALITY "Step A bench".
- **Step B (done, 2026-10-13):** short descriptions, CRAFT/SAFE/DRESSED duplicates cut, one expression and one light, `asCamera` + POV_CLOTHED (third person kept: first person drew a second woman), `ownHands`, SCENE_WEARING when no clothes are named, Cloudflare klein 9B at 768x1344 (no LoRA: Workers AI refused it). Bench: QUALITY "Step B bench". Left for Step C: /look texts that place him in the room, vague /pic words ("PoV of spooning").
- **Step B plan (as written):** (1) One short description in RUNWARE REFERENCE / REFERENCE_BACK / REFERENCE_CLOTHED(_BACK) / NOBODY / CLOSE: face and body from the references, "full upper arms and soft body" in words, nothing the pictures show (hair, height, weight); LOOKS and the Cloudflare REFERENCE (still ~700 characters) the same; grep DECISIONS for the body-word bans first. (2) Cut duplicate and contradicting lines: CRAFT vs PHOTO, DRESSED, two lights (a scene's own light wins over LIGHT: /look 483 asked for lamp light and "bright afternoon daylight"), SAFE "No nudity" where Off already filters, random MOODS/GAZES that add props ("looking down at something in her hands" drew a second phone) or scowls. (3) He is the camera: `/pic` and `/look` replace his name (`hisName`, e.g. "Feras having sex with Reem", rows 485-491), I/me/my and "the man" as a subject with a first-person line on every picture that involves him, clothed too ("Feras PoV of spooning", row 491, had none); her name → "she"; SCENE_STYLE's "in front of her" only when the scene says so; "his hands on her hips" drew a second man's head 3/4 (Step A bench). (4) `ownHands(text)`: every "hand(s)" gets an owner ("one hand" → "one of her hands"; bare "hands" → "her hands" unless his/the man's comes before), on every Runware and Cloudflare prompt; unit and scenarios rows. (5) Cloudflare `PICTURE.MODEL` → `@cf/black-forest-labs/flux-2-klein-9b` (neurons a picture vs `AI_BUDGET`; Workers AI takes no LoRAs). Checks: check.mjs, golden diff case by case, D1 rows 483, 484, 485, 490, 491 replayed, a ≤ $0.15 bench.
- **Step C (done, 2026-10-13):** `PICTURE.WRITER` on Llama 3.3 70B fast (owner; DeepSeek thinks first: 5-24 s) words her selfies (tidies the draft: one pose, no phone, no second smile) and in-person moments (also ones the template can't draw); LOOK.PROMPT under the same RULES. Bench: QUALITY "Step C". Left: Llama's plainer wording ("thumb near a cut"; spooning lost "facing away").
- **Step D (built, 2026-10-13):** `PICTURE.ANATOMY` on Llama 4 Scout, up to 3 pictures, fewest mistakes sent. Probes: QUALITY "Step D". Left: Scout misses most klein 4B stray hands and all problems on sex acts.
- **Step C plan (as written): the hybrid writer (Opus, effort high).** `PICTURE.WRITER` (DeepSeek on Workers AI, reasoning "low") writes only the scene sentence (action, pose, clothes, place) of /look (in place of LOOK.PROMPT's free text) and her own pictures, under Step B's rules; code keeps choosing references (front/back, clothed/nude body, a place picture only in a named room and not a close-up, the hair picture) and LoRAs from `pictureFlags`; when the writer fails or is slow, today's template. Checks: free replays of D1 `her_words` / `llm_text`, then a ≤ $0.15 bench.
- **Step D plan (as written): anatomy check on her own pictures (Opus to design, effort medium).** After each draw of her own pictures, VISION.MODEL answers a fixed checklist (extra or missing limbs, hands, fingers, a second person or head); a fail redraws with the next seed, 3 tries at most, the best one sent; per-try results in D1. First a free test on known good and bad pictures (the vision model may refuse nudes).

## Fix round 2 (2026-10-13, after the Steps A-D deploy): cut replies, her body words, picture cost
Diagnosed and planned by Opus 5.5 (`claude-opus-5-5`, per the session's model line; subagents for the cost and body sweeps). Build: one
**Haiku 5.5** chat (prompt below), then an Opus check. Deploy only when the owner says "deploy".

### Diagnosis
1. **Short, cut replies and "wifi died" (the in-character `LINE_DROPPED` message = every try failed).** Not the deploy's code: the
   chat path (`think` → `callModel` → `workersChat`, worker.js ~2790, ~2993-3086) didn't change between b42cac1 and 79daf47. Workers AI's
   DeepSeek V4 Flash now **ignores `reasoning_effort: "none"` and thinks before every reply**, and the thinking counts inside
   `max_tokens`. cf-probe run 38355964346 (her persona + a 3-line chat, as the bot asks; two other probe runs were going at the same
   time, so some of the slowness may be the probes' own load): every answer carried 450-920 chars of `reasoning_content`.
   At `LLM.MAX_TOKENS.TEXT` 220 (texts), 0 of 3 came back whole: 1 cut mid-sentence (`finish=length`, 203 chars), 1 empty (all 220 tokens were thinking), 1 timed out at 60 s.
   At SCENE 380 (scenes and visits): 1 of 3 cut. At 900: 2 of 2 finished at 249-267 tokens, with a 326-518 char reply, and 1 timed out.
   Latency 4-10 s, with some at 37-60 s (the bot gives up at `LLM.TIMEOUT_MS` 20 s). Cut text → `trimUnfinished` → a short reply; empty
   → asked again up to 4 times → past 20 s → the OpenRouter backup (one try) → "wifi died". VOICE 120 is worse still.
2. **Her body.** Every body line repeats "not slimmer: the same full bust, full upper arms and soft body, fair olive skin" (RUNWARE
   REFERENCE 1205, REFERENCE_CLOTHED 1010, _CLOTHED_BACK 1011, _NOBODY 1012, _BACK 1207, _CLOSE 1291, LOOKS 1208; PICTURE.REFERENCE 823,
   LOOKS 824; LINGERIE.WHO 1350, SPICY_PROMPT 1331). The words describe only the bust and the arms, not the shape the owner wants. Round 8's evidence (ARCHIVE) is that a clothed
   picture with no body words came out slim 4/4, so removing the words with nothing in their place risks a slimmer her. LESSONS §2:
   body words stack on the body picture. So whatever goes in has to be benched.
3. **Picture cost (subagent, D1 `reem-studio` + the deployed code):** the price of **one picture is unchanged**: Runware klein 9B
   $0.0025-0.0034, Cloudflare klein 4B 115 neurons, as before. What's new is Step D: a picture with mistakes is drawn again, up to 3
   paid pictures (`ANATOMY.TRIES` 3, worker.js ~4561-4605; each Runware try in `rwUsd`, capped by `RUNWARE.DAILY_USD` $1; Scout 60
   neurons a check). After the deploy: 18 bot rows for 15 requests, $0.0517, about **+18%** from redraws. One /look (D1 565-567)
   was paid 3 times, every try "2 heads": a /look is checked as "pov", where heads count, and Scout infers the man (LESSONS §2, as on
   acts). Pictures take 16-26 s now (a /look was 11.5 s). Today's $0.70 Runware spend is mostly benches/studio, not the bot.
   The writer (Llama, ~$0.00024 a call) is not in the neuron ledger.

### The fix (owner's picks marked; the rest is Opus's recommendation)
- **F1, replies:** `workersChat` gives a chat reply (task false) `max_tokens` = the reply's own limit + `LLM.THINK_TOKENS` (new, 700;
  the probe's thinking ran 150-300 tokens). The visible length stays the same: the prompt and `shapeReply` still decide it, and
  `trimUnfinished` still cuts at a sentence end. `LLM.TIMEOUT_MS` 20000 → 30000. The OpenRouter backup is unchanged (reasoning off there).
- **F2, her body (owner: remove the body descriptions; make her "a little bit fuller, yet same fullness"):** one CONFIG string,
  `PICTURE.BODY_WORDS` = "narrow shoulders, wide low hips, full arms, a tapered defined waist, a big round bubbly bottom, soft feminine
  curves" (the owner's list, in the owner's words). It goes in every body line above, in place of "not slimmer: the same full bust, full upper arms and soft body"
  and "a full bust, full upper arms and a soft body". "Exactly the body of image 1" stays: it is the anchor, not a description. "fair olive skin" stays (a skin tone,
  not a body description; the owner can drop it too). The back lines keep "seen from behind". SPICY_PROMPT's `body`, `upper`, `waist` and `arms`
  fields become BODY_WORDS too, and the JSON must stay valid. The persona (SYSTEM_PROMPT "HOW YOU LOOK") is not touched.
  **Option B** (the owner named it as an alternative): redraw the four body references a little fuller, then drop the words. Kept for later because
  a new body picture risks her likeness, costs a bench per body, and needs the owner's pick of each picture. Bench F2 first.
- **F3, picture cost (owner to pick; nothing built without it):** (a) stop redrawing when a try has the same single mistake as the
  try before it (a likely false alarm): at most 2 paid pictures; (b) `ANATOMY.TRIES` 3 → 2; (c) leave it (~+18%).

### Checks
F1: unit row: a chat call on a `@cf/` model sends max_tokens = MAX_TOKENS[mode] + THINK_TOKENS; a task call is unchanged (+1500).
Then cf-probe (push `tools/test/cf-probe.mjs` with cases `[220+700, "none"]`, `[380+700, "none"]`, `[120+700, "none"]`, 4 calls
each, **one run at a time**): every answer must finish (`finish=stop`) with content. F2: unit rows 312, 718 and 520-524
(`tools/test/unit.mjs`) follow the owner's new words: the ban on "wide hips" etc. is superseded for BODY_WORDS only, and the belly
words stay banned. Then `node tools/test/picture-plans.mjs --write` and read the golden diff case by case (only the body words may change).
Bench ≤ $0.10: the bot's own `drawPicture` (LESSONS §1), seeds 101 and 202, today vs BODY_WORDS, at clothed front, nude front, a back
view and a clothed /nsfw Off on Cloudflare (16 pictures). Pictures go to `face-candidates` runs/2026-10-13-body-words. **Haiku does not
judge the pictures**: Opus and the owner do, at full size, side by side.

### Haiku prompt (paste into a new chat, pick Haiku 5.5, effort high)
"Read HANDOFF, then docs/WORKPLAN.md 'Fix round 2' end to end; it is your spec. Build F1 and F2 on your session branch, in that
order, one commit each. Do not build F3 or Option B. Rules: never read worker.js whole: grep -n the CONFIG key or function and read
only those lines (docs/MAP.md). Change CONFIG strings with a script that asserts each old string exists exactly once, then print the
changed lines. Add a hand-written `tools/settings-panel.html` SECTIONS row for every new CONFIG key (LLM.THINK_TOKENS,
PICTURE.BODY_WORDS), then `node tools/build-panel.mjs`. F1: in `workersChat`, task false → max_tokens = sampling.max_tokens +
CONFIG.LLM.THINK_TOKENS (700); the empty-answer retries (reasoning low, +1500) stay as they are; LLM.TIMEOUT_MS 30000; add the unit row
from Checks. Push tools/test/cf-probe.mjs with the Checks cases and read every line of its log (GitHub MCP get_job_logs). Push it once
and wait for the run to finish before pushing anything else that triggers a workflow. Report the finish/content counts. If any
answer is still cut or empty, stop and write that down; do not tune further. F2: add PICTURE.BODY_WORDS with exactly the wording in the
spec, then put it into each line listed in Diagnosis 2 (verify each line number by grep first; they are from 79daf47). Grep every prompt string for
'not slimmer', 'full upper arms', 'soft body' afterwards: zero left outside SYSTEM_PROMPT. Update the unit rows named in Checks. Then
`node tools/test/picture-plans.mjs --write`. Dump the old and the new prompts to a scratch file and confirm that only the body words changed,
case by case. Run the bench from Checks (spend: read Runware `usage` with the MCP account tool before and after; stop at $0.10).
Push the pictures to face-candidates. Do not say which picture is better. Before each push run `node tools/check.mjs`; it must show 8 of 8.
Record your model by name and raw ID from get_session. Then /handoff: QUALITY rows (probe and bench), CHANGELOG, HANDOFF ('Fix round 2
built (F1, F2), waiting on the Opus check and the owner's look at the bench'), push your branch and dev. Never main."

### Opus check prompt (after Haiku; pick Opus, effort medium)
"Read HANDOFF and WORKPLAN 'Fix round 2'. Check Haiku's F1 and F2: the diff, the probe log line by line and the golden diff. Then read
every bench picture at full size against the same seed with today's words: is she fuller in the owner's shape (narrow shoulders, wide low hips,
full arms, a defined waist, a big round bottom) without going overweight? Is her face the same? Are there new anatomy mistakes? Write the
verdict in QUALITY and ask the owner F3 and whether Option B is needed."

## Rebuild (2026-10-15): reliability, module split, picture core, bench, reference library
Planned by Opus 5.5 (`claude-opus-5-5`, configured and served per get_session; three read-only Explore subagents: two Sonnet, one Haiku, plus an Opus advisor). Approved by the owner (DECISIONS 2026-10-15). One chat per step, in order; each ends with `/handoff` and a push to `dev`; deploy only when the owner says "deploy". Runware budget for the whole rebuild: $1.00.

### Context

Over two weeks the picture system grew one patch at a time. Each prompt now says the same thing up to five times: a long
face-and-body paragraph, a body picture, nudity lines, act lines and LoRA pulls. Those pieces fight each other, so pictures
look like neither the references nor the words. The prompts name "the man", "the camera" and things that are out of frame
("his hands on her butt"), and they use negatives ("never his face", "closed and untouched"). FLUX.2 klein reads those as
things to draw. Everything lives in one 490 KB `worker.js`: 1,360 lines of settings, then about 256 functions, with history
written into the comments. On top of that, Reem "disconnects" more often and pictures fail more often.

Goal: a skeleton that is easy to debug and to extend, and that is ready for later needs without building them now:
- an Arabic SFW Reem as a second persona, not a copy of the code;
- paid tiers as one gate;
- pictures that describe only what is in the frame, lean on approved reference pictures, and use one LoRA;
- a chat that answers, or fails fast and visibly.

Owner's answers (2026-10-15):
- Split everything into modules.
- The reliability fixes come first, then the split, with behaviour unchanged.
- New references are approved in a Studio References tab.
- $1.00 Runware for the whole rebuild (benches plus candidate references).
- Anatomy Fixer: only on a redraw after the vision check finds a mistake, and never on sex acts.
- The chat model stays as it is: measure first (no hedging, no timeout change).

### What the searches found (evidence)

- **Prompt (Runware try):** triggers + style opener + REFERENCE paragraph + scene words + nakedLine + ACT_SCENES/POV_MAN + mood
  + DRESSED + WIDE + PHOTO (`runwarePlan`, worker.js ~4084-4202).
  - Body words appear in REFERENCE*, NAKED_*, ACT_SCENES and LOOKS. The man appears in POV_MAN, ACT_SCENES, ANAL_SCENES,
    SCENE_STYLE, POV_CLOTHED, the writer RULES and WARDROBE ("his oversized flannel shirt").
  - "camera" appears in SELFIE_PHONE, POV_PHONE, ANGLES, GAZES and EXPRESSIONS.
- **Sampler:** steps 6, CFG 2, acceleration "none". **No `scheduler` is sent**, so Runware uses klein 9B's "Default" (the
  schema lists no default; FLUX.2's own pipeline uses the flow-match Euler scheduler, `FlowMatchEulerDiscreteScheduler`).
  - Runware's schema: at most **4 reference images**.
  - References may be sent as an uploaded **UUID**. Today about 0.5 MB of base64 goes with every call.
  - At CFG 1 the negative prompt is ignored, which suits the rule of affirmative prompts only.
- **LoRAs today:** Lenovo 1.3 always, NSFW Unlocked 0.8 on nude and acts, Anatomy Fixer 0.7 on clothed pictures (and on a nude redraw). Every other list is empty.
- **Studio bug, one cause** (`studio.js:40-45`, `resultCard` at ~280):
  - `.row` is a flex row whose children stretch, and the image is 100% wide.
  - So the text column shrinks to about 0 px and wraps one character per line.
  - The tall text column then stretches the image's height, so a 1:1 or 16:9 picture looks stretched.
- **Reliability:**
  - The chat waits up to 60 s per DeepSeek attempt. Its replies take either 4-6 s or 33-48 s, and some time out.
  - Worst case for a text reply is about 200 s; a picture message is about 11 min. Everything runs serially on one queue
    consumer, so one slow message holds every later one.
  - The memory fold (up to about 135 s) is awaited in `saveTurn`.
  - Every message is acked before work starts, with no retries, and `runCommand` mostly has no try/catch: a throw drops the
    rest of the batch silently.
  - `budget.used++` plus `xfetch`'s own count makes each Runware, Gemini-hearing, Gemini-voice or lingerie call count twice
    against a 50-call limit that is a free-plan number. This can silently switch pictures and the anatomy check off.
  - At Nude and On, a Runware failure means no picture (D1 row 705). Before 10-13 the Cloudflare fallback saved these.
  - 401/402 errors show him "(setup) ⚠️" instead of an in-character line.
  - There's no counter for these failures: we can't measure "disconnects" today.

### Architecture (target)

```
worker.js                 entry only: export default { fetch, queue, scheduled } (wrangler `main` unchanged)
src/
  config/engine.js        engine CONFIG (LLM, voice, budgets, picture engine: model, sampler, LoRA policy, sizes)
  config/index.js         CONFIG = merge(engine, persona) + applyOverrides (CONFIG_OVERRIDES env)
  persona/reem-en/        SYSTEM_PROMPT, INTRO, MEMORY_PROMPT, MESSAGES, wardrobe, places, hairstyles, moods, refs list
  platform/               telegram.js, kv.js (state), ai.js (aiRun, workersChat), http.js (xfetch, budget), log.js (D1)
  gate.js                 can(chat, feature) – today: the current rules (nsfw level, caps, minor); later: paid tiers
  chat/                   respond, think, shapeReply, commands, memory, recall, auto
  voice/                  tts, hearing, audio tags, arabizi
  pictures/
    spec.js               ShotSpec: what the picture is (data, logged)
    interpret.js          her words / writer / /pic / /look → ShotSpec
    frames.js             frame templates (data): views, framings, act frames, crop edges
    compose.js            framePrompt(spec, refs) → text (fixed sentence order)
    lint.js               banned words, image-number check (tests + runtime log)
    refs.js               reference catalog + pickRefs(spec) (≤4 slots) + Runware UUID cache
    loras.js              LoRA policy table by content
    runware.js cloudflare.js anatomy.js writer.js deliver.js
  studio/                 routes.js, page.js (was studio.js)
assets/ face.js places.js mp3.js (generated, unchanged)
```

- **Arabic SFW Reem later:** `src/persona/reem-ar-sfw/` plus a wrangler `[env.ar]` with its own bot token and KV.
  - The persona caps nsfw at "off", so all its pictures go to Cloudflare klein.
  - Its MESSAGES and prompts are in Arabic.
  - No engine copy.
- **Paid tiers later:** a D1 `users` table plus `gate.js` rules. Every check that exists today goes through `can()` now.

### The new picture pipeline

1. **ShotSpec**, one object that is logged as JSON in D1:
   - view: selfie | mirror | pov | pov-act | closeup
   - content: clothed | partial | nude | act
   - act {name, hole, position}
   - outfit {key, refId}, hair {key, refId}, place {key, crop, night}
   - light, expression
   - framing: face | chest-up | waist-up | three-quarter | full | crotch
   - aspect
   - `inFrame` (her parts, POV's parts) and `edges` (a part cropped at an edge)

   The writer (Llama) **fills spec fields as JSON**: outfit key, action, place, expression. It no longer writes prose, so
   code alone phrases every prompt and the rules hold by construction.
2. **framePrompt** writes the sentences in a fixed order:
   1. lens/perspective + framing
   2. identity by image number only ("She is the woman of image 0, with the body of image 1"), plus "an adult woman,
      29" (kept as the age statement, not a body description)
   3. what she wears, from the outfit picture ("wearing the outfit of image 1"), or plain words when the outfit has no
      picture yet; or "fully nude"
   4. pose and what is in frame
   5. crop edges ("her extended forearm is cropped at the left edge of the frame")
   6. place + light
   7. expression
   8. one affirmative photo-style line

   Act frames are data in `frames.js`, one per act/position. Each names what is visible: "POV's torso and below fill the
   bottom of the frame", "POV's erect penis …", "her hands cropped at the top edge". They describe the frame, not the act's
   story. Every act frame names the penis explicitly, after the owner's finding about weights below 1.
3. **lint.js**, enforced on every frame, golden plan and writer field:
   - Banned: man/men/he/him/his, camera, not/no/never/without/nobody.
   - Also banned: **body descriptor phrases**, meaning an adjective of build on a body part (full/thick/wide/big/narrow/
     tapered … + bust, hips, thighs, arms, waist, bottom), plus curves, voluptuous, eye colour and skin tone.
   - Body-part nouns stay allowed, because the frames need them to place things ("her forearm cropped at the left edge",
     "POV's torso and below").
   - Anatomy words for acts stay allowed too (vulva, penis, anus, labia), to keep the 2026-10-08 detailed-genitalia
     decision.
   - Every "image N" must be lower than the number of references sent.
   - It is a unit test over every frame × case. At runtime it logs a `lint` column in D1 and doesn't block the picture.
4. **LoRA policy:** only NSFW Unlocked (Lenovo and the others retired), with weight by content. NSFW Unlocked is the one
   LoRA that helps her face, so clothed pictures keep it too. Starting values, then decided by the bench:

   Owner's rules (2026-10-15):
   - Clothed pictures are tested at 0.6 and below.
   - Acts and nudity never go above 0.8, because with a long prompt 1.0 and higher can force an act or nudity.
   - Weights move in 0.05 steps.

   | content | start | bench sweep (same seed, 0.05 steps) |
   |---|---|---|
   | clothed (clothed or outfit body picture, never the nude one) | 0.5 | 0.4 / 0.5 / 0.6 |
   | partial | 0.65 | 0.6 / 0.65 / 0.7 |
   | nude | 0.75 | 0.7 / 0.75 / 0.8 |
   | act (penis always named in the frame) | 0.8 | 0.7 / 0.75 / 0.8 |
   | act partly dressed | 0.75 | 0.7 / 0.75 / 0.8 |

   - The owner saw that ≥0.7 together with the nude body picture forces nudity on clothed pictures. Clothed pictures never
     get the nude body picture.
   - The weights go in one `LORA_WEIGHTS` table, a panel row each.

   **Anatomy Fixer (owner):** never on the first draw. It is added only on a redraw after the vision check finds a mistake,
   for every kind except sex acts.
5. **Act vs clothes (the attached picture: an act drawn with jeans on):** `interpret.js` resolves this before any words
   are written.
   - Pulled down or pulled aside doesn't draw yet: the owner says it needs its own LoRA. So any garment that covers the
     act's region is **taken off**: below the waist for vaginal and anal acts, nothing in the way of the mouth for oral.
     The frame describes only what she still wears.
   - Garments elsewhere (a bra, a top) may stay.
   - A partly dressed act sends the nude body picture as image 1, with the kept garment in words. Sending the clothed
     body would bring in its black bra, which is what the attached picture shows.
   - Later (owner's approval): a pulled-aside LoRA, and "partly dressed" outfit references (for example a top only) for
     slot 1. The spec already has a `garmentState` field (on / off; pulled-aside is held back until that LoRA exists).
6. **Sampler:** steps 4, CFG 1, acceleration none.
   - No scheduler is sent today, so Runware uses its "Default", and its schema doesn't say which sampler that is.
   - The chosen sampler becomes the `SCHEDULER` config key, and every D1 row logs it.
   - **Read first, then test a short list (owner).** Before any picture: Runware's scheduler docs, the FLUX.2 klein model
     card, and what the community reports for distilled 4-step flow models. Findings go in LESSONS.
   - Starting reasoning, to be confirmed by that reading:
     - klein 9B is a step-distilled flow-matching model, trained around the plain flow-match Euler path ("Default" is
       probably that).
     - Each sampler name has two parts:
       - the solver: Euler, DPM++ 2M, 2M SDE, 3M, SDE;
       - the sigma spacing: Karras, Exponential, Beta, Uniform.
     - At 4 steps the spacing matters most. Karras crowds the steps at low noise: sharper fine detail, weaker composition.
       Beta is the spacing most often used for Flux.
     - DPM++ 2M reuses the last step, so it costs no extra model calls. The SDE kinds add fresh noise at each step: more
       skin texture, less faithful.
     - Singlestep "DPM++ SDE" / "2S" kinds call the model twice per step. Runware bills GPU time, so they cost about
       double: excluded.
     - 3M needs more than 4 steps to help: excluded.
   - **Short list:** Default, DPM++ 2M, DPM++ 2M Karras (the owner tried it), DPM++ 2M Beta, DPM++ 2M SDE.
     - Cases: one clothed selfie and one nude, at one seed.
     - That's 10 pictures, about $0.03.
     - For each: likeness, anatomy, skin, adherence to the frame, Runware's `cost` and the time.
   - Settle on the most accurate one at the same price; at equal accuracy, the cheapest and fastest. The owner sees the
     sheet before it's set.
   - Steps don't change Runware's price; steps 4 against 6 is timed in the same bench.
7. **Redraws keep the same spec.** Only the seed changes; today the mood, hair and aspect are re-rolled too.
8. **Route profiles:** framePrompt and pickRefs read a profile.
   - Runware klein 9B: 4 references, the LoRA, 768x1344.
   - Cloudflare klein 4B: 3 references, no LoRA, FILTER_WORDS, 576x1024.
   - The /nsfw Off route, and later the whole SFW Arabic Reem, run on the Cloudflare profile with the same spec and frames.

### Reference library

- **Catalog:** D1 table `refs` with id, kind (face, body, outfit, hair, place, pose), key, tags, parent, status
  (candidate, approved, retired), prompt, seed and runware_uuid.
  - The picture bytes live in KV `ref:<id>`.
  - The four core pictures in face.js stay built in as the fallback.
- **Slots (Runware's limit is 4):**
  - 0 = her face, the original always, so her likeness never drifts.
  - 1 = body: the outfit picture, the nude front, the nude back or the clothed body.
  - 2 = place crop.
  - 3 = the hairstyle picture, when one is picked.
  - Hair pictures are drawn from her face picture; outfit pictures are drawn from her faceless body picture.
  - On 2026-10-15 the old hair pictures' faces had to be blurred so they wouldn't fight her face. A hair picture with its
    face blurred is benched against an unblurred one before the format is fixed.
- **`pickRefs(spec)`** picks by tags, deterministically:
  - the day's home outfit stays the same all day;
  - an outfit he or she names wins;
  - an outfit with no approved picture is described in words on the clothed body.
- **Runware UUIDs:** each reference is uploaded once (imageUpload) and later calls send only its UUID; on an
  invalid-UUID error it is uploaded again. A first probe checks that a UUID still works days later. This makes calls
  smaller and faster.
- **Studio References tab:**
  - pick a base picture and write the change ("the same body, now in a cream knit sweater and blue jeans, same pose, plain
    background"), for about $0.003;
  - the candidate shows at full size;
  - Approve, Reject or edit tags.
  - Nothing reaches the bot until the owner approves it.
  - Claude can also propose a batch of candidates within the budget.

### Reliability

- **Measure first:** a D1 `events` table, one row per reply, holding stage timings, model, attempts, fallback used,
  outcome and the error. Claude reads it with the MCP, and a Studio Health tab comes later.
- **The chat model stays as it is (owner).**
  - The events table counts slow replies, timeouts, backup use and errors per day.
  - With those numbers, the owner decides between hedging, a shorter timeout or nothing.
- **No lost messages:**
  - a try/catch per update and per command;
  - on a throw, a short in-character line and a logged event, never silence;
  - 401/402 errors also get the in-character line plus the logged event.
- **Budget:** fix the double count. Set the limit to the Workers Paid subrequest limit, checked against Cloudflare's docs
  before setting it.
- **Memory fold moves to the cron.** The 15-minute `scheduled` run is a separate invocation, so it no longer holds the
  reply queue.
- **Pictures:**
  - send Telegram's `upload_photo` action while a picture draws;
  - at Nude and On, one more Runware retry, only on a 5xx error or a timeout;
  - the owner's Runware-only rule stays.
- **Studio:**
  - `resultCard` stacks the picture above its text;
  - pictures use `align-self: flex-start` and `height: auto`;
  - Log thumbnails keep their shape (`aspect-ratio` from the row's width and height, `object-fit: contain`).

### Order of work (one chat each; the owner sets the effort; nothing deploys unless the owner says "deploy")

| # | Chat | Model, effort | Spend |
|---|---|---|---|
| 0 | **Reliability + studio fix:** events table, try/catch per update, budget fix, fold on the cron, upload_photo, a Runware retry at Nude/On, studio cards. Tests and scenarios; deploy on the owner's word. | Sonnet, medium | $0 |
| 1 | **Module split, behaviour unchanged** (details below). | Opus, high | $0 |
| 2 | **Picture core:** spec, frames, compose, lint, LoRA policy, the same spec on redraws, the writer filling spec fields. The sampler reading, then the sampler short list (~$0.03). New golden plans; lint is green on all of them. | Opus, high | ~$0.04 |
| 3 | **Bench:** 12 cases × 2 seeds, old against new: selfie, mirror, POV clothed, partial, nude front, nude back, blowjob, riding, missionary, doggy, reverse cowgirl, anal doggy. Then the 0.05-step weight sweep from the table above at one seed. Haiku runs it; Opus judges every picture at full size; QUALITY rows. | Haiku runs, Opus reads | ≤ $0.45 |
| 4 | **Reference library:** D1/KV catalog, UUID cache, pickRefs, the Studio References tab; a first batch of outfit and hair candidates for approval. | Sonnet builds from an Opus spec, then an Opus review | ≤ $0.40 |
| 5 | Deploy, then the owner's Telegram check, then tuning from what the owner sees. | | rest of the $1 |

**Step 1 in detail:**
- Opus writes the manifest and the split script. haiku-worker drafts the first function → module classification and Opus
  reviews it. The script computes the imports. Persona-free modules (config, platform) must not import at load time, to
  avoid TDZ cycles.
- **Tools that read `worker.js` as text** (grep done) must follow the code:
  - `tools/test/load-worker.mjs` (copies worker.js and appends `export {EXPORTS}`) → it imports a `src/internals.js`
    barrel instead. The tests only mutate objects; none reassigns a binding.
  - `tools/build-panel.mjs` (evaluates worker.js text for CONFIG) → it imports `src/config`.
  - `node --check worker.js` in `tools/check.mjs` and `test.yml` → `node --check` on every file under `src/`.
  - `tools/voice/stt-bench.mjs` (regex on HEARING.PROMPT) → it imports CONFIG.
  - `doc-check.mjs`'s map check → MAP.md lists the new files.
  - `tools/face/*-bench.mjs` use `loadWorker()` and keep working through the barrel; `bodywords-bench` reads old
    revisions and is left as it is.
- Proof that behaviour didn't change:
  - golden plans byte-identical;
  - `node tools/check.mjs` 8/8;
  - plus a check that the LIMITS & OOC test still reads the moved SYSTEM_PROMPT (a test that passes but checks nothing
    is the trap).
- **Language belongs to the persona:**
  - Arabizi, `sayArabizi`, the digit rules, `tidySpoken`'s English rules, Latin-only checks in `live.mjs` and scenarios,
    and MESSAGES go under `persona/reem-en/` (or take the persona's language), so an Arabic persona doesn't fail them.
  - The persona folder and `gate.js` are carved out.
- **Per user:**
  - The money ledgers (`pics`, `rwUsd`) and the call budget get a chat key wherever it costs nothing now (global totals
    stay as caps), ready for tiers.
  - A note in MAP: one serial queue for everyone stays fine for one user, but paid tiers will need per-chat queues
    (Durable Objects or per-chat locks).
- History comments move to CHANGELOG.

Records:
- DECISIONS gets today's owner decisions. They mark as superseded BODY_WORDS / BODY_WORDS_CLOTHED, the face lines in
  every body line, Lenovo 1.3 (2026-10-12), steps 6 / CFG 2, MAX_LORAS 2, and the Anatomy Fixer on clothed first draws. "Sex scenes don't
  use anatomy fixer" (2026-10-12) stays.
- New owner rules to log:
  - NSFW Unlocked ≤0.8 on nudity and acts, ≤0.6 on clothed pictures, in 0.05 steps;
  - no pulled-aside garments until a LoRA exists;
  - the sampler is chosen by reading first, then a short list.
- MAP, LESSONS and HANDOFF are rewritten at each step.

### Issues and bugs found (existing or likely), to fix in the step named

1. The double `budget.used++` at four call sites, and the 50-call free-plan limit on a Paid account. (0)
2. Every message is acked before work starts and `runCommand` has no try/catch, so a throw silently drops the batch; a run
   past the 15-minute cap is lost. (0)
3. The 60 s chat wait (the owner keeps it for now: measured in 0); 401/402 errors show "⚠️ setup" to him. (0)
4. The memory fold blocks the queue for up to about 135 s. (0)
5. At Nude and On, no picture when Runware fails (row 705). (0)
6. Studio: the stretched picture and the vertical text (one cause); Log thumbnails crop; studio pictures expire from KV
   with no Telegram copy; `logSent` stores no real size. (0)
7. D1 has **no rows at all on 2026-10-14**: either a quiet day or logging broke; check it in step 0.
8. `ref0`'s replace turns "same face and hair" into "same face, hair color (…)", and that makes `CUSTOM.SAME_PERSON` dead
   whenever a hairstyle is picked (always, since HAIR_CHANCE is 1). (2)
9. REFERENCE_BACK names "a full bust" in a back view. (2)
10. Mood, gaze, hair, aspect and anal position re-roll on every anatomy redraw. (2)
11. All 8 anatomy flags since 10-13 were "2 or 3 heads" on pictures that aren't acts, so they're likely false and cost a
    redraw each: review in the bench. (3)
12. WARDROBE has "his oversized … shirt"; MAP mentions DRESSED_FULL, which no longer exists; BODY_WORDS is read only by
    tests; /setup's Pictures line is stale. (1-2)
13. `places.js` is 3.5 MB of the about 5 MB bundle. The reference library would let place crops move to KV/UUIDs later.
    (4, optional)
14. The shallow clone gives false sync warnings (an open question to the owner since 10-13).
15. Risk: with no face words, her eyes may draw brown in dark scenes again (seen 10-15). The bench checks this; any
    face word comes back only with the owner's OK.

### Verification

- Every step: `node tools/check.mjs` 8/8, read line by line, and golden plans:
  - step 1: byte-identical;
  - step 2: the new prompts dumped to a scratch file and read in full;
  - lint green on all of them.
- Step 0:
  - scenarios rows for a throwing command, a throwing update in a batch of three (the other two still answered) and a
    402;
  - unit tests for the budget count;
  - the studio page in Playwright at 390 px with 1:1, 9:16 and 16:9 results;
  - after the deploy, `/health`, `/setup` and the first `events` rows read from D1.
- Step 3: each picture read at full size; genitals checked on full-size crops; QUALITY rows; spend read from Runware
  `usage` before and after.
- Step 4: the studio References tab in Playwright; one approved outfit drawn through the bot's own `/pic` path.

### Paste prompts (one new chat each, in order)
- **Step 0 (Sonnet, effort medium):** "Do Rebuild Step 0 from docs/WORKPLAN.md (section 'Rebuild (2026-10-15)'): the D1 `events`
  table, try/catch per update and per command (in-character line on a throw and on 401/402), the double `budget.used++` fix and the
  Workers Paid subrequest limit (check Cloudflare's docs first), the memory fold on the cron, `upload_photo` while drawing, one more
  Runware retry at Nude/On on 5xx or timeout only, the studio cards (stack the picture above its text; Log thumbnails keep their
  shape). Also find out why D1 has no rows on 2026-10-14. Chat model, timeout and hedging stay as they are. Scenarios and unit rows
  as listed under Verification; Playwright at 390 px; /handoff."
- **Step 1 (Opus, effort high):** "Do Rebuild Step 1 from docs/WORKPLAN.md: split worker.js into the src/ modules of 'Architecture
  (target)', behaviour unchanged. Follow 'Step 1 in detail' (manifest + split script, haiku-worker drafts the classification, the
  text-reading tools, golden plans byte-identical, persona folder, gate.js, per-chat ledger keys). /handoff."
- **Step 2 (Opus, effort high):** "Do Rebuild Step 2 from docs/WORKPLAN.md: the picture core (ShotSpec, frames, framePrompt, lint,
  the NSFW Unlocked weight table, the Anatomy Fixer on redraws only (not acts), act vs clothes, same spec on redraws, route
  profiles, the writer filling spec fields). Read about the samplers first (Runware docs, FLUX.2 klein, distilled flow models),
  then the sampler short list (≤ $0.04). New golden plans read in full; lint green. /handoff."
- **Step 3 (Haiku runs, Opus reads; effort medium):** "Do Rebuild Step 3 from docs/WORKPLAN.md: the old-vs-new bench (12 cases x 2
  seeds) and the 0.05-step weight sweep, ≤ $0.45; every picture read at full size by Opus; QUALITY rows; /handoff."
- **Step 4 (Sonnet builds from Opus's spec, Opus reviews; effort medium):** "Do Rebuild Step 4 from docs/WORKPLAN.md: the reference
  library (D1 `refs`, KV bytes, Runware UUID cache, pickRefs, the Studio References tab) and a first batch of outfit and hair
  candidates for the owner's approval, ≤ $0.40. /handoff."
