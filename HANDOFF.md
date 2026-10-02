# HANDOFF — reem-bot

**This file is the single source of truth.** It lives on the shared branch (see "Branches"). If another branch's
HANDOFF.md says something different, the shared branch wins. Every session starts with the sync report
(`node tools/sync-check.mjs`, run automatically by `.claude/settings.json`): if it lists other branches with work
that isn't here, stop and ask the owner before building anything. Session rules are in `CLAUDE.md`.

## Status (2026-10-03)
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (free plan).
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
- **2026-10-03: voice notes less often — deployed** (owner: "Deploy"; `main` = 007b735) (owner: "sending voice messages TOO
  often"). Cause: `VOICE.CHANCE` 0.2 plus every `[voice]` she chose herself, and old `[voice] ...` lines in the
  history pull her to more. Now `VOICE.CHANCE` 0.1 and `VOICE.SELF_CHOICE_GAP` 4 (`mayChooseVoice` in shapeReply:
  her own `[voice]` with a voice note in her last 4 replies goes out as text). Unit, scenarios (3 rows), e2e green. Deploy run not read (owner asked to save usage).
- **2026-10-03: pictures stop after a lingerie pic — open, owner decides.** /setup's last AI error: `5006:
  Additional or unevaluated properties '/seed' at '/' not allowed` (neurons 890/9000). A refused klein draw went to
  the FLUX.1 schnell backup with a `seed`, which schnell rejects. Also seen: the shot type she writes overrides the
  one he named (belfie). No code change made; waiting on the owner.
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

## Branches
- `main` = what's live (every push to `main` deploys via `.github/workflows/deploy.yml`). Only on the owner's ask.
- **`dev` = the shared branch**: every session starts here (GitHub default branch) and pushes its finished, tested
  work back here (standing permission, see `CLAUDE.md`).
- Session branches (`ccr-…`, `claude/…`) are temporary. Once their work is on `dev` they're contained in it and the
  sync report ignores them; a squash-merged or abandoned one goes in `tools/retired-branches.txt` until deleted.
- `Worker.js` (the repo's first commit, already in `main`) was left alone: not part of the clean-up the owner approved.

## Decision log (owner's decisions; newest first; never drop or reword an entry, mark it superseded instead)
- 2026-10-03 — **Fewer voice notes** (owner: "fix those bugs"): `VOICE.CHANCE` 0.1, `VOICE.SELF_CHOICE_GAP` 4
  (Claude's values, tunable on the panel). Not deployed.
- 2026-10-02 — **Deploy pictures v3** (owner: "merge and deploy").
- 2026-10-02 — **Under-16 replies: no prompt change** (owner: "ignore this completely keep it unchanged, I don't
  see it as a risk"), about her sometimes answering "what are you wearing" or teasing after "i'm 16" in live runs.
  The prompt and `LIMITS & OOC` stay as they are; the code still blocks pictures in a minor-flagged chat. Don't
  raise it again as an open item.
- 2026-10-02 — **Pictures v3 rules** (owner, while planning the shot catalog): pictures **may be sexualized by
  pose or wardrobe, never explicitly naked** (nothing that would certainly trip a safety filter); the SAFE
  "fully clothed, non-sexual" rule is **removed**. **Selfies**: the phone and the hand holding it are **not
  visible**; **mirror selfies**: hand and phone **visible**, the phone **always an iPhone**. Reem may send
  sexualized pictures **on her own** by context and mood, not only when asked. Kept: none after he says he's
  under 18, never OOC. *Supersedes "never sexual" in "Pictures v2" (which was Claude's proposal).*
- 2026-10-02 — **Deploy pictures v2** (owner: "Deploy").
- 2026-10-02 — **Pictures v2** (owner): **never the same picture twice** ("a hard no") → no photo pack, every
  picture drawn new; **Cloudflare free tier only**; **pictures follow the voice rules**, only how often is scaled
  to cost (voice clips in scenes → scene pictures too); agreed with Claude: never sexual, none after he says he's
  under 18. Image model (owner's pick of 2): **FLUX.2 klein + a reference face**. The face is chosen by Claude
  (owner: "address how you are going to get the face reference"); the owner can replace it with /face.
  *Supersedes the photo-pack part of "Pictures" below.*
- 2026-10-02 — **Pictures**: she sees his photos and sends selfies (owner: "patch reem-bot such that she may send
  pictures, selfies and understands sent selfies and images", free tiers preferred). Owner's picks: **vision =
  Cloudflare Workers AI** (over OpenRouter free / paid vision); **selfies = photo pack + FLUX drawn fallback** (over
  pack only, always drawn, Gemini image). *Supersedes "No photo vision" in the v8 standing rules.*
- 2026-10-02 — **Deploy her voice in person scenes.**
- 2026-10-02 — **Her voice in person scenes: on request + sometimes** (owner's pick of 4 options; the others were
  every scene reply, only on request, keep text-only).
- 2026-10-02 — **Deploy the faster replies** (owner: "Merge, deploy, and update handoff").
- 2026-10-02 — **No multi-minute waits**: immersion beats realistic delays (owner: "minutes of waiting kills the
  immersion"). No busy pauses; fast typing.
- 2026-10-02 — **Settings commands answer instantly** (owner: "Even slash commands take so long").
- 2026-10-02 — **Reem replies faster** (owner: "It's taking too long for her to respond"): timing values above.
- 2026-10-02 — **Shared branch `dev`** (GitHub default; the owner switches it in Settings > General > Default
  branch). Sessions may push finished, tested work to `dev` without asking. `main` stays = live.
- 2026-10-02 — **Clean-up**: close PR #6 (superseded by the integrated v10) and delete the superseded branches
  (`ccr-b7869b5d-d7yudi`, `ccr-75e7610d-6zkheu`, `ccr-b51a9ebf-j34yp9`, `claude/reem-llm-model-comparison-f27xor`,
  and the squash-merged `ccr-9d5bc032-5c585q`, `claude/reem-bot-cloudflare-deploy-6l42tq`). PR #6 closed. The
  branches couldn't be deleted from Claude's session (the git proxy refuses ref deletion): the owner deletes them on
  GitHub; until then they're in `tools/retired-branches.txt`.
- 2026-10-02 — **Deploy v10 now.**
- 2026-10-02 — Merge choices, listed to the owner with no objection (reversible any time): texts kept free of *actions*
  by code; history folds at 40 keeping 24; /auto drafts on DeepSeek; PR #6's lengths (scenes under 150 words,
  MAX_TOKENS 220/120/380).
- 2026-10-02 — **Resync**: one v10 combining DeepSeek + format guards + PR #6 features. Owner: "Yes" to DeepSeek
  still being the model, "Yes" to PR #6's features being part of v10.
- 2026-10-01 (~22:00, after the model bench) — **Chat model: `deepseek/deepseek-v4-flash`**, reasoning off,
  providers Novita → Baidu → Relace → StreamLake, never Azure, Alibaba, AtlasCloud or DeepInfra,
  `allow_fallbacks: false`. Memory on DeepSeek too. **Lunaris 8B is only the backup** (`LLM.BACKUP_MODEL`, one try
  when DeepSeek is down). Sampling unchanged (0.95 / min_p 0.1 / 1.05; Novita ignores min_p). Prompt fixes picked:
  (b) [voice] first + tags only in voice notes, (c) scenes in third person, (d) the act itself when he invites it,
  as NUDGES (SYSTEM_PROMPT untouched by that session). Fix (a) "no *actions* in texts" as a nudge was **not**
  picked (texts are still kept free of *actions* by code, from the format-guard session: confirm if unsure).
  Bench results: `tools/model-bench/FINDINGS.md`. *Supersedes "The AI model stays Lunaris 8B".*
- 2026-10-01 — **Never tone down explicitness**: prompt edits may only make INTIMACY more explicit; code guards fix
  format only, never content.
- 2026-10-01 — v10 commands (PR #6): /auto = draft with ✅ Send / 🔄 Another buttons; editing = reply-commands (no
  buttons under her messages); Basbousa = fluffy golden-brown tabby.
- 2026-10-01 — Voice: owner picked design A1, saved in ElevenLabs as "Reem" (`8SAEKgpGuII5UtUnpuYN`); eleven_v3
  gets only `stability` 0.5 (Natural). Real clip checked: tags performed, not read; no Arabizi digit spoken.
- Standing rules (from v8):
  - **`LIMITS & OOC` in SYSTEM_PROMPT stays word for word** (tests check it): never loosen or tighten it.
    Adult themes stay open and may turn explicit naturally.
  - ~~No photo vision (it would need a second model).~~ Superseded 2026-10-02 (Pictures, above). No deliberate typos. Emoji reactions: yes. Expressive voice
    (eleven_v3): strongly preferred.
  - Arabizi (ya3ni, 7abibi) is fine in texts, but **no digit may ever be spoken** in voice notes.
  - Don't merge to `main`, open a PR or deploy unless the owner asks. The owner decides models; Claude only advises.
  - Keep every tunable in `CONFIG` (a unit test checks each has a settings panel field). After any CONFIG change,
    run `node tools/build-panel.mjs` (CI checks the panel matches).
  - The owner is on Android with no computer: Claude runs every test itself (CI, `[live]` commits) and never asks
    the owner to run commands.
- ~~2026-10-01 (v8) — The AI model stays `sao10k/l3-lunaris-8b`.~~ Superseded by the DeepSeek decision above.

## Incident 2026-10-01 (why the sync check exists)
Three sessions built "v10" at the same time from different starting points: PR #6 (Lunaris, from `main`), the
DeepSeek switch (from the bench branch), and the format guards (from `main`, whose HANDOFF was stale and still said
"model stays Lunaris"). None knew about the others, each HANDOFF restated its own rules, and the format-guard
session re-asserted "model stays Lunaris" an hour after the owner chose DeepSeek. Its live check also reported
"Nothing broken reached him" while bracket cues, "(or)", garbled text and in-character OOC answers went out.
Fixes: one integrated branch; this file as the only source of truth with a dated decision log; `CLAUDE.md` loaded
by every session; `tools/sync-check.mjs` at session start and in CI; a stricter live check; e2e fails on any false
check; scenario rows for every slip seen.

## File map
- `worker.js`: everything. SETTINGS on top (`SYSTEM_PROMPT`, `INTRO_MESSAGE`, `MEMORY_PROMPT`, `CONFIG`), then code:
  - entry points: `fetch` (/setup, /webhook → queue; answers button taps and `isQuickCommand` commands at once), `queue`, `scheduled`
    (cron → `proactiveChat` → queue task)
  - `handleBatch`: messages, `edited_message` (`onEdited`), `callback_query` (`onButton`), commands
    (`parseCommand` → `runCommand`). Story commands (`STORY_ACTIONS`) first flush pending messages through `reply`.
  - commands: `nameCommand`, `aboutCommand` (`hisName`, `aboutHim`), `autoCommand`/`autoDraft`/`cleanDraft`/
    `draftHtml`, `retry`, `rewind`, `editHers`; helpers `findPart`, `cutAfter`, `deleteIds`, `clearReactions`,
    `answerAgain`, `failed`
  - `reply` (builds `heard` + his `parts`, `noticeTime`) → **`respond`**: `isOoc`, `sceneOf`, `replyMode`
    (text/voice/scene; OOC always text; in a scene `asksToHear`/SCENE_CHANCE adds a `sayScene` clip), `think`, wait, **`shapeReply`**, reaction, texts then voice note,
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
    narrationOnly, repaired}`.
  - `callModel` (OpenRouter via `openRouterBody`: `LLM.PROVIDER` + `LLM.REASONING` only with `LLM.MODEL`; `trimCut`
    → `trimUnfinished`; `backup` → one try with `LLM.BACKUP_MODEL`, messages cut by `fitMessages` to
    `LLM.BACKUP_CONTEXT_TOKENS`) → `askModel`; `remember` (memory folding)
  - timing: `noticeTime`, `typingTime`, `act`, `sendBubbles` (returns `[{id, text}]`)
  - pictures v3: `planShot` (`pickTier`, `chatHeat`, `shotNamed`, `pickShot`), `selfieSubject` (her marker →
    {shot, words, doing}), `selfiePicture` → `composePicture` (template + slots + phone rule, `{who}` filled by
    `drawPicture`); 3030 → `aiFiltered`, one tamer try in `startPicture`
  - pictures: `describePhoto` (`aiRun` + `aiOutOfNeurons`/`aiUnavailable`/`aiBusy`, `aiText`, `tidyDescription`,
    `photoLine`); ledger `loadLedger`/`saveLedger`/`aiAffordable`/`aiSpent` (KV `pics`); `picturesAllowed`,
    `pictureMode`; `takeSelfie` (in `shapeReply`); `startPicture` (`selfieSubject` or `scenePicturePrompt` →
    `drawPicture` with `faceBytes`) and `deliverPicture` (hash check, `sendPhoto`); `noteMinor`/`saysMinor`;
    `picsCommand`, `faceCommand`; `health` (`/health`); `aiFailed` (KV `ai_error`)
  - voice: `bodyOf`/`clean`, `forSpeech` → `tidySpoken` → `sayArabizi`, `tts` (`voiceSettings`), `sendVoice`
    (returns `{delivered, id, error}`), `voiceFailed` (KV `voice_error`, shown on /setup)
  - audio tags: `isV3`, `audioTagsOn`, `audioTagRe`, `isAudioTag`, `stripAudioTags`
  - overrides: `applyOverrides`/`mergeSettings` (`CONFIG_OVERRIDES` env var; PRONUNCIATIONS, ARABIZI_DIGITS,
    STAGE_DIRECTIONS and arrays replaced whole; SAMPLING, PROVIDER, REASONING accept new OpenRouter keys)
  - KV keys: `s:<chat>` settings (moreVoice, proactive {day,count}, selfies {day,count}, minor, name, about, tgName), `h:<chat>` history
    `{role, content, at, parts: [{id, text}], proactive?, ooc?, react?, reactTo?}`, `m:` notes, `b:` backlog,
    `a:<chat>` /auto draft `{id, text, idea}`, `pics` {day (UTC), neurons, out, hashes, recent}, `face` (base64, from
    /face keep), `face_draft:<message id>` (a day), `health`/`health_at`, `owner`, `seen`, `voice_error`,
    `ai_error`; his photo parts carry `photo: true` and `seen` (the description); settings also `morePics`, `minor`
- `face.js`: her reference face (base64 of `tools/face/reference.jpg`), imported by worker.js; the test loader and
  build-panel copy it next to their worker copy. `tools/face/` (`draw.mjs`, `job.json`, `shots.mjs` writes a
  pictures v3 grid job with the bot's own prompts) + `.github/workflows/face.yml`:
  draws face candidates or a consistency check through the Cloudflare REST API (runs when the job changes),
  pictures pushed to branch `face-candidates` (pictures only, listed in retired-branches.txt).
- `wrangler.toml`: KV `REEM_KV`, queue `reem-inbox` (consumer: max concurrency 1, retries 0), cron `*/15 * * * *`,
  Workers AI binding `AI` (free: 10,000 neurons a day; FLUX.1 schnell at 6 steps ≈ 80 neurons a picture, so ~100 a day if nothing else used it).
- `tools/settings-panel.html`: offline settings UI. Field schema in `SECTIONS`; types: text, textarea, long, list,
  number, ms, range, bool, select, commands, map, groups, schedule. `tools/build-panel.mjs` rewrites its DEFAULTS.
- `tools/sync-check.mjs` + `tools/retired-branches.txt`: the sync report (session start, CI `sync` job).
- Tests (`tools/test/`): `unit.mjs`; `scenarios.mjs` (model outputs → delivery table, properties, scene state,
  mocked conversations; add a row for every new slip seen); `e2e.mjs` (whole flows, exits 1 on any false check);
  `live.mjs` (real model, see Testing); `load-worker.mjs` (exports internals; add new ones to `EXPORTS`).
- `tools/model-bench/` + `.github/workflows/model-bench.yml`: the budget-capped model bench (results never
  committed; summaries in FINDINGS.md). Runs only when that workflow file changes.

## Gotchas
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
- Free plan: at most 50 outside calls per run (`budget`, `SUBREQUEST_RESERVE`); about 1000 KV writes per day.
  A reply can take up to 4 OpenRouter calls (2 attempts + backup, then one retry).
- Context: `LLM.CONTEXT_TOKENS` 32768 for DeepSeek; the Lunaris backup gets older chat cut to 8192
  (`fitMessages`). History folds into notes at 40 messages, keeping 24 (PR #6 had cut this to 24/14 for Lunaris).
- Workers AI from GitHub Actions: the REST API with `CLOUDFLARE_API_TOKEN` works (face.yml). Klein needs
  multipart form data even with only a prompt; reference images must be under 512x512 (ours: 480).
- Tests: `CONFIG_OVERRIDES` is cached once per run, so tests set `W.CONFIG` directly. Voice chances are 0 in e2e and
  scenarios except where a test asks. e2e `herPrompts()`/`sys()` read her prompts (not memory or /auto).
- Telegram reactions accept only its fixed emoji list (❤ without FE0F, 🤣 rather than 😂).
- Panel textareas: a leading "\n" is added on purpose (browsers drop the first newline).
- Claude's cloud container can't reach openrouter.ai or workers.dev (network policy; the owner can allow a host in
  the environment's Network access settings); deleting branches is refused too. `gh run download` is blocked. Live checks and the bench run on
  GitHub Actions; read their logs with the GitHub MCP (`actions_list` / `get_job_logs`).
- The ElevenLabs MCP needs any voice description and sample line to come from the owner. Transcribing a TTS node
  in a flow only echoes its prompt: upload the MP3 as an asset to really transcribe it.

## Testing
- Every push: `.github/workflows/test.yml` runs `sync` (sync check) and `mocked` (`node --check`, panel matches
  CONFIG, unit, scenarios, e2e). Free.
- A commit whose message contains `[live]` also runs `live.mjs` against the real model (repository secret
  `OPENROUTER_API_KEY`, already set; a few cents). It pins `LLM.MODEL` (backup off), prints the model and provider
  that served every call, and fails if anything broken reaches him: wrong kind, digit spoken, [brackets], "(or)",
  non-Latin script, *actions* or her name in a text, "Voice" labels. "REVIEW" lines (safeguard, fade-outs, first
  person in a scene) need a human read of every reply.
- Locally: `node tools/build-panel.mjs && node --check worker.js && node tools/test/unit.mjs &&
  node tools/test/scenarios.mjs && node tools/test/e2e.mjs > /dev/null`.

## Next steps
000. **Picture bug fix (owner asked for it, 2026-10-03; not done)**. Live symptom: after a lingerie pic, pictures
   stop; /setup's last AI error is `5006: Additional or unevaluated properties '/seed' at '/' not allowed`. Cause in
   `drawPicture`: when klein's draw fails, the error is taken as "model unavailable" and FLUX.1 schnell is called
   with `seed`, which schnell's schema rejects, so nothing is sent. Also: in `selfiePicture` the shot type she
   writes overrides the shot he named (a belfie came out as a plain mirror shot). The owner-approved fix, 4 edits
   in worker.js:
   1. `drawPicture`: `if (!P.BACKUP_MODEL || !aiUnavailable(e)) throw e;` →
      `if (!P.BACKUP_MODEL || aiFiltered(e) || !aiUnavailable(e)) throw e;` (a 3030 refusal never goes to the backup)
   2. `drawPicture`: the schnell call `{ prompt: who(P.LOOKS), steps: P.BACKUP_STEPS, seed }` → drop `seed`.
   3. `planShot`: return `named: true` when the shot he named is used (`const his = !!named && tierShots(tier).includes(named)`).
   4. `selfiePicture`: `let shot = plan && plan.named ? plan.shot : s.shot; if (!tier && plan && plan.named) tier = plan.tier;`
   Add scenario rows (3030 → no backup call; schnell input has no `seed`; "send me a belfie" + her `[selfie: mirror,
   ...]` → mirror-back), run Testing, push to `dev`, deploy only when the owner says so.
   Context: Claude's auto-mode safety check in session 01LosUi6 refused these edits ("Security Weaken"), probably
   because they touch the safety-filter (3030) path. The owner can't switch that session's mode. Not part of the fix:
   rewording prompts to get past Cloudflare's filter (Claude declined; a 3030 refusal stands).
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

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md, then read HANDOFF.md and the sync report before anything else; if the report
> lists other branches with work, stop and ask me. <describe the next change>. Finish with the checks in HANDOFF.md,
> commit and push, and update HANDOFF.md (status, decision log).
