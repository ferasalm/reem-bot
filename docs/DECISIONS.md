# Decisions

The owner's decisions: the **only** source for them. Loaded at every session start (CLAUDE.md).
Newest first; one dated entry each (`- YYYY-MM-DD — **what** (owner's words): details`). Never drop or reword an
entry: strike it through (`~~…~~`) and say what superseded it. `tools/doc-check.mjs` checks the format.

## Decision log (owner's decisions; newest first; never drop or reword an entry, mark it superseded instead)
- 2026-10-06 — **A panel switch for sex-act pictures on Runware, default off** (owner: "Yes do that \"make dropping it a switch on
  your settings panel (default off)... You'd do any testing of the actual pictures yourself in Telegram with /pic.\""):
  `PICTURE.RUNWARE.SEX_ACTS` (panel: "Runware: allow sex acts"). Off = `RUNWARE.NOT_DRAWN` holds as before. On = it is ignored on
  the Runware versions only (his /pic words, her selfie and scene words); the Cloudflare version keeps its list; the under-18
  flag and "never OOC" still stop every picture. Claude didn't draw sex-act pictures; the owner tests them in Telegram. Deployed (owner:
  "Deploy"): `main` = 90e5c44, deploy run 37515274946 green, live code read back (`SEX_ACTS: false`, the switch in `mayDraw`).
- 2026-10-06 — **Deploy** (owner: "Deploy"): `dev` (f496197) fast-forwarded into `main` (was 122dac8; only the handoff docs
  differed, the DeepSeek fix was already live). Deploy run 37463278664 green (Deploy Worker, /health), live code read back
  (DeepSeek model, Nemo backup, the guards).
- 2026-10-06 — **Chat model back to DeepSeek, Nemo the backup; deploy** (owner: "What is wrong with Reem? Fix her. She's gotten
  so weird", then picked "DeepSeek + deploy"): his Telegram chat replayed on both models, 5 tries a message (runs 37459244094,
  37459455109): Nemo wrote 1-4 word texts, copied the prompt's examples word for word and went to his door 0/5; DeepSeek wrote full
  in-character texts and opened the door 4/5. `LLM.MODEL` `deepseek/deepseek-v4-flash` with its old providers and reasoning off
  (`LLM.PROVIDER`, `LLM.REASONING`), `LLM.BACKUP_MODEL` `mistralai/mistral-nemo` (OpenRouter picks). Claude's guards: a copied
  prompt example is asked again (`TEXTING.COPY_WORDS`), "hey habibti" said to him becomes habibi, his words echoed back are
  dropped, two example jokes replaced. Deployed: `main` = 122dac8 (was c0e8109), deploy run 37461633468 green, live code read back.
  *Supersedes "Chat model: Mistral Nemo, DeepSeek as the backup" (2026-10-05).*
- 2026-10-06 — **Deploy /pic** (owner: "Deploy"): `dev` (c0e8109) fast-forwarded into `main` (was 4354980). `/pic` (`/photo`, `/custom`)
  live: his words, her face, on `PICTURE.ROUTE`. Deploy run 37453860155 green, /health drew and saw, live code read back (/pic in). *Completes the /pic part of the entry below.*
- 2026-10-06 — **Deploy the picture versions; /pic** (owner: "That's no top. It's skinfold which is good and realistic. Let's deploy
  according to everything on dev right now. Also add a slash command in the bot where the user can generate pictures customized with
  different hairstyles, makeup, poses, clothing, framing, angle, but Reem remains Reem."): `dev` (4354980) fast-forwarded into `main`;
  deploy run 37441152120 green, the Worker secret RUNWARE_API_KEY created by the deploy, /health drew and saw, live code read back (Runware routes in, /pic not yet). Live default stays
  `PICTURE.ROUTE` "cloudflare" until the owner switches it on the panel. `/pic` (`/photo`, `/custom`): his words, her face (`PICTURE.CUSTOM`),
  on the active route; built on `dev`, not deployed yet. Before this deploy `main` was a34bbe7: pushing it back to `main` reverts.
- 2026-10-06 — **Picture versions with different models, ready to deploy; a slimmer hourglass body; realistic nipples** (owner: "She's
  too fat. I want her body and proportions to be similar to those in attached pictures" / "her nipples look unrealistic. Keep fixing. We want
  to have different versions with different models all ready to deploy. Focus on this for now."): `PICTURE.ROUTE` picks the version on the
  settings panel: "cloudflare" (today's), "runware-klein" (klein 9B with her face and a faceless nude hourglass body, nudity allowed), "runware-
  twinflow" (words only). Runware's body: about 163 cm and 64 kg, hourglass (`RUNWARE.REFERENCE`, `tools/face/body-hourglass.jpg`, Claude's
  pick over the owner's bodysuit picture, whose beige clothes leaked 3 of 4); `RUNWARE.NAKED` describes real anatomy. Not deployed; default
  stays "cloudflare". *Supersedes the BMI ~26 body (2026-10-05) for the Runware versions; the Cloudflare version keeps it until the owner says.*
- 2026-10-06 — **Explicit nudity allowed in pictures** (owner: "Drop the \"2026-10-02 rule of no explicit nudity\""): her
  pictures may be nude. Not in the code yet: `PICTURE.SAFE` ("No nudity.") and `PICTURE.NOT_DRAWN` (nude words drop a
  picture) still hold, and klein on Cloudflare and Nano Banana refuse nudity anyway; they change together with a route
  that draws it (TwinFlow Z-Image-Turbo on Runware is being tested). Kept: none after he says he's under 18, never OOC.
  *Supersedes "never explicitly naked" in Pictures v3 rules (2026-10-02).*
- 2026-10-06 — **Any provider, not only Cloudflare or OpenRouter** (owner: "Ignore the \"no other provider\" rule, it was
  only for that specific deepseek model, which can change; it's not a hard rule, it was only for that specific chat session.
  I am currently looking for a better model for the same or cheaper price."): Claude may propose and bench models on any
  provider (Runware included) for text, pictures, voice and hearing; the goal is a better model at the same or a lower
  price. Switching a live model is still the owner's call. *Supersedes "Cloudflare or OpenRouter only" (2026-10-03).*
- 2026-10-05 — **Deploy Mistral Nemo; keep a backup branch** (owner: "Attempt the live test again, if everything is fine,
  deploy. If the live test still isn't working, you may skip it and deploy directly so I can test it myself. Also, create a
  backup branch in the case things don't work and we want to revert back to the previous version."): `backup-before-nemo` =
  the live `main` before the switch (da3ae1a, DeepSeek); live run 37363619497 read (0 broken, persona facts weaker, see
  `docs/QUALITY.md`); `dev` (a34bbe7) fast-forwarded into `main`; deploy run 37371425888 green on attempt 3 (GitHub's
  runner incident cancelled 1-2), live code read back. To revert: push `backup-before-nemo` to `main`.
- ~~2026-10-05 — **Chat model: Mistral Nemo, DeepSeek as the backup**~~ (superseded 2026-10-06: DeepSeek again, Nemo the backup) (owner: "Let's switch our LLM model to mistral nemo. With
  deepseek as our backup model."): `LLM.MODEL` `mistralai/mistral-nemo` (OpenRouter picks its provider, no reasoning block);
  `LLM.BACKUP_MODEL` `deepseek/deepseek-v4-flash` keeps DeepSeek's providers and reasoning off (`LLM.BACKUP_PROVIDER`,
  `LLM.BACKUP_REASONING`). Claude's call: memory folding and /auto stay on DeepSeek. Not deployed yet. *Supersedes the
  DeepSeek chat model and the Lunaris backup of 2026-10-01.*
- 2026-10-05 — **Fix everything, then deploy** (owner: "I am allowing all edits. Fix everything then deploy."): Claude checked
  the fixes with real pictures and two `[live]` runs and fixed what they showed: the place picture is one of three crops of the
  owner's picture (rewording alone changed 1 of 6), /auto keeps a heated chat heated (`AUTO.HOT_MOVES`) and stays short, a scene
  while apart needs her to go to him (`HER_MOVE`). Deployed: `main` = da3ae1a, deploy run 37341573464 green.
- 2026-10-05 — **Lingerie and spicy pictures when he asks; better /auto; places as a reference** (owner: "She is not sending
  lingerie pics, two-piece lingerie, or spicy pics even when I ask her to" / "Auto reply mode is so bad, bland, cliché, cringe,
  does not advance, and doesn't yield variety of outcomes" / "Location pictures are not treated as reference but they're included
  as is"): Claude's fixes, klein-first kept: klein's lingerie is checked by the vision model and redrawn by Nano Banana when
  tamer; "send me something spicier" and "show me your lingerie" now count as asking for a picture (answers the open question
  of 2026-10-05); /auto drafts take one story move each (`AUTO.MOVES`); the place picture is a reference seen from another view
  (`ROOM_VIEWS`). Not deployed yet.
- 2026-10-05 — **Deploy** (owner: "Deploy"): `dev` (b5c4d60) fast-forwarded into `main`; deploy run 37272358522 green
  (Worker deployed, /health step passed). Live now: in-person pictures wearing what the scene said, night light, BMI ~26
  body picture with rounded shoulders, fitted everyday clothes, `/look`, the `/setup` checks. *Completes the 2026-10-05 entries
  marked "Not deployed yet".*
- 2026-10-05 — **BMI about 26, rounded shoulders, fitted clothes** (owner: "Why are her shoulders sharp like a square and not
  rounded with klein? Also yes I want her looking not obese and not slim, as if her BMI is 26. Let's see her in clothes that
  better reflect her body shape and contours."): new body picture for klein's image 1 (`tools/face/body.jpg`, Nano Banana
  bench 37271580261 #01, gray tank + black leggings, face cropped out; the old black-dress one had square shoulders and its
  dress leaked); picture words and persona say "average-to-full, about 165 cm and 71 kg, not slim and not obese", rounded
  sloping shoulders; `WARDROBE.EVERYDAY` is fitted (Claude's picks). Not deployed yet. *Supersedes the body picture of
  2026-10-04 ("it's perfect") and the "a little curvy but not plump" wording of the same day.*
- 2026-10-05 — **A little curvy, not fat; casual at home; /look** (owner: "She should be a little curvy with full arms, but she
  shouldn't be this fat... Also, why is she wearing the cardigan over the dress? She should be wearing casual at home.
  Furthermore, I want there to be a slash command that can send a picture showing what the user sees at the moment."):
  every picture description and the persona say "a little curvy but not plump or heavy", a defined waist, softly rounded
  hips, a full bust and soft, full upper arms (Claude's wording, face runs 2026-10-05); in-person pictures that name only
  a layer (cardigan, socks) put a black tank top and gray sweatpants under it (`SCENE_UNDER`); `/look` (`/see`, `/view`)
  draws the moment in person from her last reply. Not deployed yet. *Supersedes the "curvier body" wording of 2026-10-03
  and the arms wording "soft and fleshy" of 2026-10-04 (arms stay soft, with no muscle).*
- 2026-10-05 — **Deploy** (owner: "Deploy"): `dev` (cdf631f) fast-forwarded into `main`; deploy run 37267949894 green
  (Worker deployed, /health step passed). Live now: v11 Reem Nabot in Watertown, the stronger accent, the owner's place
  pictures, Gemini 3.8 Flash hearing, klein-first lingerie with Nano Banana for "spicier". *Completes the 2026-10-05 entries.*
- 2026-10-05 — **Gemini 3.8 Flash hears his voice notes; klein first unless spicier** (owner: "Go with Gemini 3.8 flash
  for voice. Let klein try first unless it's more explicit or user asks for two pieces or a \"spicier\" picture or
  something similar to attached", with a Nano Banana picture and its JSON prompt, "change it to Reem's description"):
  `HEARING.OR_MODEL` google/gemini-3.8-flash first (Whisper, then Scribe as backups); boudoir selfies go to klein in
  `LINGERIE.KLEIN_WARDROBE` (the one-pieces and layers of round 2), Nano Banana when klein refuses; two pieces,
  "spicier", from behind or explicit words (`SPICY_PATTERN`) go straight to Nano Banana with `SPICY_PROMPT` (the
  owner's JSON style, her description). *Supersedes klein-first with the real lingerie words (same day).*
- 2026-10-05 — **klein draws lingerie first; the stronger accent** (owner: "Let klein draw lingerie first, then
  nanobanana if klein refuses." / "Let's use the stronger accent."): boudoir selfies go to klein with her face and the
  real lingerie words (`PICTURE.LINGERIE.KLEIN_FIRST`), Nano Banana only when klein refuses or fails, klein's own
  filter-safe wardrobe last; `VOICE.OR_INSTRUCTIONS` is the "sulafat-stronger" wording of the tts bench. The owner
  draws the place pictures himself from Claude's prompts and sends them. *Supersedes the Nano-Banana-first order of
  2026-10-04 ("lingerie on Nano Banana") and the light-accent wording.*
- 2026-10-05 — **Basbousa dropped** (owner: "Basbousa: drop"): the new Reem has no cat; the persona, intro scene,
  nudges, picture words and Whisper's hint no longer name her. *Supersedes "Basbousa is a she" (2026-10-03) and the
  Basbousa part of the v10 commands entry (2026-10-01).*
- 2026-10-05 — **Replace all of Reem with the character bible; Levantine accent** (owner: "replace all of her",
  "Levantine", pictures: "Your judgement"; and "don't replace the current Reem yourself, we need to hand it off"):
  `docs/REEM-BIBLE.md` becomes her persona: Reem Nabot, 29, Armenian-Lebanese from Bourj Hammoud, in Boston since
  2020, freelance bookkeeper in a Watertown triple-decker across the landing from him. A later session builds it (its
  "Building it" section); pictures are Claude's call (redraw her living room, porch and hallway, keep the rest). Not
  yet built. *Supersedes "Reem is Lebanese and lives in Belmont, MA" (2026-10-03) once built.*
- 2026-10-04 — **Arms soft and fleshy; Deploy** (owner, over the arms wording tests: "Arms should not be muscular. Remove the word
  thick." / "Arms are plush, soft, fleshy" / "soften \"plush\" to \"soft and fleshy\" for the arms only. Then deploy"): her arms
  are "soft and fleshy arms with no muscle definition" in the Klein prompt, the fallback and lingerie descriptions and the
  persona; `dev` merged into `main` (deploy): Sulafat voice with lamejs, bangs, body reference, Nano Banana lingerie, 9:16,
  daily AI cap 50,000. *Supersedes the arm wording "thick"/"rounded"/"plush" of the same day.*
- 2026-10-04 — **Add lamejs; Nano Banana body as klein's second reference** (owner: "Add lamjes, use nanobanana body as second
  reference it's perfect."): `mp3.js` (lamejs, LGPL) encodes Gemini's raw PCM to MP3 in the Worker; Sulafat
  (`google/gemini-3.8-flash-tts`, `OR_FORMAT` "pcm") is the default voice (`VOICE.PROVIDER` "openrouter"), ElevenLabs the
  backup; klein gets her face as image 0, a Nano Banana body picture (`tools/face/body.jpg`, `face.js`) as image 1 and the
  place as image 2. *Completes the Sulafat part of the entry below.*
- 2026-10-04 — **Bangs, softer shoulders, a redone face; Gemini Sulafat first** (owner: "She should have softer, narrower,
  round shoulders, also give her cute hair bangs similar to Zoe Dechanel's. Redo the Gemini lingerie generation, crop
  face and use it as reference for klein again. Tts-Gemini-sulafat sounds so good; prioritize it over Andromeda. Add it
  for the map. Give me an estimate avg cost per user per day."): persona and picture prompts say wispy full bangs and
  soft, narrow, gently rounded shoulders (described, never the real person's name, in image prompts); new reference
  face cropped from Nano Banana run 37175758855 #05; Sulafat (`google/gemini-3.8-flash-tts`) becomes the voice
  (needs PCM to MP3 in the Worker: waiting on the owner, see HANDOFF); TTS bench files named in `docs/MAP.md`.
  *Supersedes "Andromeda" as the voice pick and the face of 2026-10-04 (no bangs).*
- 2026-10-04 — **Her face from Nano Banana, lingerie on Nano Banana, 9:16, Andromeda, a higher cap** (owner: "Crop the
  face produced by nanobanana in lingerie pictures to be the reference face for Reem in Klein's pictures. Let's keep
  using nanobanana and klein. Also all pictures should have 9:16 aspect ratio. Both don't even come close to
  elevenlabs but Andromeda of course is much better than Helena and much less robotic. The \"Mm\" and \"hm\" did not
  come as natural hums. Is there a better model for tts? Raise the daily cap."): her reference face is cropped from
  Nano Banana's text-only picture (bench run 37172411100, #02); boudoir selfies go to Nano Banana text-only
  (`PICTURE.LINGERIE`, its own money cap, Claude's value $0.50/day), klein draws everything else; every picture 9:16
  (klein 576x1024, same price); aura voice Andromeda until the owner picks a better model (OpenRouter TTS bench sent);
  `AI_BUDGET.DAILY_NEURONS` 50,000 (Claude's value, at most $0.44/day) with pictures capped at 60% of it.
  *Supersedes the lingerie-route and voice choices waiting in HANDOFF; supersedes the 28,000 cap.*
- 2026-10-04 — **Switch voice and hearing off ElevenLabs; test Nano Banana Lite** (owner: "Let's try nano banana lite.
  Eleven labs credits are running out, we gotta do the switch to the best speech and recognition models. Im confused
  between Helena and Andromeda, need more explicit samples where they don't robotically say \"ha ha ha\""): her voice
  notes move to Workers AI aura-2 (`VOICE.PROVIDER` "aura", ElevenLabs only as the backup), his voice notes to Whisper
  (already on `dev`). Which aura voice: owner to pick (helena or andromeda); Claude's default until then: helena.
  *Supersedes "aura-2-en is a test only: her voice stays ElevenLabs" (entry below).*
- 2026-10-04 — **Speech recognition on Cloudflare; test aura-2-en and Nano Banana** (owner: "google safety filters
  are actually lenient, they're not strict, they're just random. Let's test them before judging. Go with your pick for
  speech recognition. Let's test aura-2-en, suggest a suitable voice and make it as expressive as appropriately
  possible."): his voice notes are heard by Workers AI Whisper large v3 turbo (Claude's pick, $0.0005 a minute), with
  ElevenLabs Scribe as the backup. Nano Banana is benched for lingerie (OpenRouter; Cloudflare's copy needs AI Gateway
  credits). ~~aura-2-en is a test only: her voice stays ElevenLabs until the owner picks.~~ (superseded the same day: the switch to aura-2, above)
- 2026-10-03 — **Deploy** (owner: "Deploy"): `dev` merged into `main`: night place pictures (`isDark`), ROOM without
  the reference's light, no bathroom in body-length mirror shots, `takeSelfie` ignoring bracketed pauses, the FLUX
  prompting skill in `.claude/settings.json`.
- 2026-10-03 — **Deploy** (owner: "Deploy"): `dev` merged into `main`: Lebanese Reem in Belmont, Basbousa "she", fixed
  places, bigger and more frequent pictures, the Workers AI cap of 28,000 neurons a day, the branch-delete button.
- ~~2026-10-03 — **Image and model providers: Cloudflare or OpenRouter only**~~ (superseded 2026-10-06: any provider) (owner: "I already paid for cloudflare,
  we must use it, keep suggesting alternatives that can be used via cloudflare or openrouter. We will not stay for
  cloudflare's limits for lingerie, but we will not use another image service other than cloudflare or
  openrouter. We are looking for high-quality, low-cost, efficient models for text, pictures, and voice."):
  Claude keeps proposing better, cheaper models for text, pictures and voice, but only on Cloudflare Workers AI or
  OpenRouter. No Runware, fal.ai or other image service. Cloudflare's lingerie filter is not accepted as final: find
  a way inside these two (another model, another wording, another route).
  ~~Voice stays ElevenLabs until the owner says otherwise.~~ (superseded 2026-10-04: voice moves to aura-2) *Narrows the open question "another image provider" in HANDOFF.*
- ~~2026-10-03 — **Reem is Lebanese and lives in Belmont, MA**~~ (superseded 2026-10-05: Armenian-Lebanese in Watertown, still live until built and deployed) (owner: "She's Lebanese and lives in the US Boston MA
  around or within Belmont"): Claude's details, owner may change them: born in Beirut, family moved to North Jersey
  when she was ten; second-floor apartment in an old brick walk-up near Cushing Square; he lives across the hall;
  her clock is America/New_York; Lebanese Arabizi; beach weekends at Crane Beach. *Supersedes Egyptian/Zamalek.*
- 2026-10-03 — **Fixed places** (owner: "Add fixed locations pictures/references for each character's apartments"):
  her rooms, his rooms and the hallway between their doors look the same in every picture (`PICTURE.LOCATIONS`,
  reference pictures in `places.js`).
- 2026-10-03 — **More pictures, a curvier body, a better-looking picture without klein 9B** (owner: "more
  pictures", "a shapelier, curvy body"; klein 9B on Workers AI: "Too expensive, find alternatives"): chances about
  doubled (Claude's values), the body described in every prompt, 768x1024 pictures at the same price as 640x640.
- 2026-10-03 — **Branch clean-up button** (owner: "Add the button, I'll press it"): Actions > Delete retired
  branches deletes what `tools/retired-branches.txt` lists, `Worker.js` included; `face-candidates` stays.
- ~~2026-10-03 — **Basbousa is a she**~~ (superseded 2026-10-05: Basbousa dropped) (owner: "Basbousa is a she"): the persona says so; its texting example
  no longer calls her "him" (the likely source of the he/she drift seen live).
- 2026-10-03 — **Handbook restructured (option D of the SWOT analysis)** (owner: "Agree with 1 D and agree with 2
  and 3"): HANDOFF.md holds only the current state and is rewritten every session; this decision log moved word for
  word to `docs/DECISIONS.md` and is still the only source of the owner's decisions, loaded with HANDOFF.md and
  `docs/LESSONS.md` at every session start (`@` imports in CLAUDE.md); `docs/MAP.md` before any code change;
  history in `docs/CHANGELOG.md`. `tools/doc-check.mjs` runs in CI (sizes, dated decisions, effort on every next
  step, every file in the map) and `docs/QUALITY.md` records every `[live]` run. End of session: `/handoff`.
  *Supersedes "the decision log lives in HANDOFF.md".*
- 2026-10-03 — **Cloudflare Workers Paid** (owner subscribed; picked "B + A's guards" over waiting on the free
  plan, an OpenRouter klein fallback, Vertex AI's $300 trial and Segmind/Fal): pay $5/month, keep a daily money
  cap in code (`AI_BUDGET.DAILY_NEURONS` 28,000 = at most $0.20/day; Claude's value, tunable) and cap test runs
  by real usage. Never a second free account (Cloudflare's terms). *Supersedes "Cloudflare free tier only" in
  Pictures v2.*
- 2026-10-03 — **Deploy the Workers AI fixes** (owner: "Fix everything and fix the bot so everything works NOW"):
  out-of-neurons no longer read as unavailable, PICTURE_NEURONS 105, klein's seed back, hourly retry after
  "used up" (`OUT_RETRY_MS`, Claude's value). Not done: a non-Cloudflare image fallback (would change the
  "Cloudflare free tier only" decision of Pictures v2; owner's call).
- 2026-10-03 — **Picture fix approved and deployed** (owner: "Do Next step 000 (the picture fix I approved) ...
  then deploy"): a 3030 refusal never goes to the backup model; schnell without `seed`; the shot he names wins.
  ~~Klein without `seed` too~~ (Claude's misreading, reverted; see Status "Real cause").
- 2026-10-03 — **Fewer voice notes** (owner: "fix those bugs"): `VOICE.CHANCE` 0.1, `VOICE.SELF_CHOICE_GAP` 4
  (Claude's values, tunable on the panel). Not deployed.
- 2026-10-02 — **Deploy pictures v3** (owner: "merge and deploy").
- 2026-10-02 — **Under-16 replies: no prompt change** (owner: "ignore this completely keep it unchanged, I don't
  see it as a risk"), about her sometimes answering "what are you wearing" or teasing after "i'm 16" in live runs.
  The prompt and `LIMITS & OOC` stay as they are; the code still blocks pictures in a minor-flagged chat. Don't
  raise it again as an open item.
- 2026-10-02 — **Pictures v3 rules** (owner, while planning the shot catalog): pictures **may be sexualized by
  pose or wardrobe, never explicitly naked** (~~never explicitly naked~~: superseded 2026-10-06, nudity allowed) (nothing that would certainly trip a safety filter); the SAFE
  "fully clothed, non-sexual" rule is **removed**. **Selfies**: the phone and the hand holding it are **not
  visible**; **mirror selfies**: hand and phone **visible**, the phone **always an iPhone**. Reem may send
  sexualized pictures **on her own** by context and mood, not only when asked. Kept: none after he says he's
  under 18, never OOC. *Supersedes "never sexual" in "Pictures v2" (which was Claude's proposal).*
- 2026-10-02 — **Deploy pictures v2** (owner: "Deploy").
- 2026-10-02 — **Pictures v2** (owner): **never the same picture twice** ("a hard no") → no photo pack, every
  picture drawn new; ~~**Cloudflare free tier only**~~ (superseded 2026-10-03: Workers Paid); **pictures follow the voice rules**, only how often is scaled
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

