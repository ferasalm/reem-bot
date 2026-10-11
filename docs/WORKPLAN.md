# Work plan: pictures, /nsfw, prompt log and studio (2026-10-11)

Written by Claude (Opus) for the owner's report of 2026-10-11 (see `docs/DECISIONS.md`, 2026-10-11). Each step is done by **Haiku 5.5
in its own chat**, strictly in order, then reviewed by Opus in another chat before the next step starts. This file is the spec: a
step's section says what to build, the exact wording, the checks and the budget. Opus adds "Decided in review" notes under the next
step at the end of this file; that step applies them first. Never two steps (or two sessions) at once: see the 2026-10-01 incident in `docs/CHANGELOG.md`.

## How to run a step (for the owner)
1. New chat, pick **Haiku 5.5** in the model menu, paste the prompt below with N (and the budget) filled in.
2. When it says "Step N done, waiting on review", new chat, pick **Opus**, paste the review prompt.
3. Then the next step. Deploy only when you say "deploy" (suggested after Steps 2, 6 and 7).

**Haiku prompt (Step N):**
> Continue reem-bot. Follow CLAUDE.md: run `git fetch --unshallow origin`, then the sync report; stop and ask me if it lists work
> really missing. Your task is docs/WORKPLAN.md, Step N only: read that whole section first, it is your spec, and apply the
> "Decided in review" notes for Step N (end of the file) before anything else. grep worker.js, never read it whole. No deploy, never push to main. Spend at most
> $X on Runware (read the balance before and after with the Runware MCP `account`). Don't touch tools/face/bench.json. LIMITS & OOC
> stays word for word. If the spec is unclear, contradicts the code, or a check fails twice, stop and write it under "Waiting on the
> owner" in HANDOFF instead of guessing. Finish with /handoff: HANDOFF says "Step N done, waiting on review", with every check you
> ran and read, the golden-plan diff summary, and where the pictures are.

**Opus review prompt (Step N):**
> Continue reem-bot. Follow CLAUDE.md. Review docs/WORKPLAN.md Step N (done by Haiku): read HANDOFF, the step's commits on dev
> (the diff, the golden-plan diff), its check output and its bench pictures on face-candidates at full size. Fix any slip, decide
> what the step left to Opus, write the notes for Step N+1 under "Decided in review" at the end of WORKPLAN.md, then /handoff.

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
