# Decisions

The owner's decisions: the **only** source for them. Loaded at every session start (CLAUDE.md).
Newest first; one dated entry each (`- YYYY-MM-DD — **what** (owner's words): details`). Never drop or reword an
entry: strike it through (`~~…~~`) and say what superseded it. `tools/doc-check.mjs` checks the format.

## Decision log (owner's decisions; newest first; never drop or reword an entry, mark it superseded instead)
- 2026-10-11 — **Root causes, not words** (owner: "request fixing the root cause instead of just applying a temporary or just unreliable fixes that may leak or bite us later"): the Step 3 defects (head size at seed 101, slim arms at seed 101, no anus at seed 202) are Opus's root-cause work: the reference, the body or the camera, not new size, arm or anus words in the prompt. The doggy "ghost hands" are withdrawn as a defect (owner: "hands fine").
- 2026-10-11 — **Step 3 bench: spend under $0.25** (owner: "Try to spend less than $0.25 in this step"): the bench stops at $0.25 by its own cap; the run spent $0.20397 (Runware balance $14.92535 → $14.72138), 72 pictures, no call over the cap. Nothing else changed; the cap stays the Step 3 budget above.
- 2026-10-11 — **LESSONS.md: at most 180 lines, summarized back to about 150 when it reaches 180** (owner: "Expand lessons.md limit by 30 lines, once it hits 180 lines, summarizing it should push it back to 150 lines to allow room."): `tools/doc-check.mjs` checks ≤180; CLAUDE.md, LESSONS.md's header and the handoff skill say to curate it back to ~150 at 180. *Supersedes the 150-line cap of the 2026-10-03 handbook entry (option D).*
- 2026-10-11 — **Work plan: Opus diagnoses and reviews, Haiku builds, one step per chat** (owner: "Let Haiku 5.5 do the heavy lifting where there is a lot of token input and token output ... prepare an entire step-by-step workplan where you do the primary high-stake thinking and writing well scoped detailed prompts for Haiku where I copy and paste them in other chats for Haiku to work on them and to update handoff so you can check it and move to the next step or fix slips"): `docs/WORKPLAN.md` holds the eight steps (specs, wording, checks, budgets, the paste prompts); one Haiku chat per step, strictly in order, each reviewed by Opus before the next. Nothing built yet.
- 2026-10-11 — **/nsfw: Off / Nude / On per chat, default On** (owner: "there should be a telegram slash command /nsfw for the user to enable or disable NSFW LoRAs", then picked "Off / Nude / On, default On (Recommended)"): Off = no nudity, no sex pictures, no NSFW LoRAs, Runware's content check on (lingerie still allowed); Nude = nudity, no sex acts; On = everything, as today. Every chat starts On. Not built yet (WORKPLAN Step 2).
- 2026-10-11 — **Her own nudes: about 1 in 3 of her own pictures when the chat is hot, a few when warm, never when calm** (owner: "the pictures she sends on her own almost never NSFW", then picked "About 1 in 3 when hot (Recommended)"): the cause is `PICTURE.SELF_CHOICE`'s "Your pictures never show you fully naked." (the 2026-10-02 rule, superseded 2026-10-06 but still in her instructions) and tiers that stop at lingerie. A `nude` tier (HOT 0.33, WARM 0.05, CALM 0) and "send nudes" → nude, only at /nsfw Nude or On. Not built yet (Step 2).
- 2026-10-11 — **References and outfits by situation; one home outfit a day** (owner: "Each reference should be used when it makes sense or when the user asks, not randomly (except once every day for everyday casual/home outfits), and not kept as the base for all pictures"): the rust-halter picture stops being image 1 of every clothed picture; an outfit with a picture is image 1 when that outfit is worn; every clothed picture names an outfit (his or her words first, then the tier, outside the day's outdoor outfit, at home the day's home outfit, picked once a day by the weather); nude back views use the back body. Which image 1 for outfits without a picture: an 8-seed bench, then Opus's pick. Not built yet (Step 4).
- 2026-10-11 — **Prompt studio on the bot at /studio; every prompt logged in Cloudflare D1** (owner: "There should be a custom private platform connected to relevant API keys, where me and you can access it ... a log of all prompts used by the bot in chronological order with timestamps (along with a thumbnail of the generated picture if it doesn't cost extra for the thumbnail)", then picked "On the bot at /studio (Recommended)"): a page on the same Worker, opened from a signed `/studio` link only the owner's chat gets; the log (prompt, LoRAs, references, settings, seed, cost, /look's DeepSeek text) in D1 `reem-studio`, which Claude reads with the Cloudflare MCP; thumbnails from Telegram's own copies (free). Not built yet (Steps 1 and 7).
- 2026-10-11 — **Bench budget $0.30 a step; the studio $1 a day of its own; bench pictures on `face-candidates`** (owner picked "$0.30/step, studio $1/day (Recommended)"): each paid bench step stops at $0.30 of Runware (about $1.50 for the whole plan); the studio's money is separate from the bot's `RUNWARE.DAILY_USD` $1; bench pictures, sheets and tables are pushed to `face-candidates` (pictures only) for review.
- 2026-10-10 — **Deploy the belly fix: `main` 0d2010f → 897dfaf** (owner: "Deploy"): `origin/dev` pushed to `main` (fast-forward, no force). Deploy to Cloudflare run 38013450881 (run_number 40) and Tests run 38013450919: both success, every deploy step success. Version ID `496925bf-95b1-4fd7-8a0b-e1daea3953a7` (was 8a4778e1-e606-4b2b-a7dc-e3a4cee17388). `/health` ok: Cloudflare klein drew 55,092 bytes in 15.9 s; the vision model described it. `/setup` all ✅; its Pictures line now reads "runware-klein runware:400@2 with her face, retried, then Cloudflare klein"; Runware today about $0.01 of $1.00 by the bot's ledger. One Runware "200: no picture" was recorded at 09/10/2026 21:31:44 Boston time (01:31:44 UTC, right after the deploy): the new fallback retried and Cloudflare drew. The log doesn't say which picture it was, so check Telegram for it. The belly isn't checked live yet: the owner's Telegram test is that check. To go back: push 0d2010f (the reference set, before the belly fix) or 9c1270f (v9) to `main`. Do not send `/restart` (the `/setup` page says to; it wipes her memory). *Completes the 2026-10-10 "Belly" entry (not deployed at the time).*
- 2026-10-10 — **Belly: her pictures retry klein, then Cloudflare klein with her references; no TwinFlow for her; belly, hip and thigh words out of her body descriptions; dev only** (owner: "Where does the big belly come from? I suspect it's the prompts or that /pic doesn't use reference images. Find why and plan a fix.", then picked "Retry, then Cloudflare klein (Recommended)" and "Flatter, keep bust and arms (Recommended)", then "Implement"): why: (1) the TwinFlow fallback (klein failed) sends no reference and draws from `RUNWARE.LOOKS` ("an hourglass figure … a soft lower belly, wide rounded hips, full thighs, a round full bottom"): captured with 0 references; (2) every klein picture's `RUNWARE.REFERENCE` says "softly rounded belly, wide hips, full thighs" on top of image 1, which already has a belly (the words were added in round 8 against slimness). `/pic` does send her face, body and place when klein works (captured: 3 references). Built: `RUNWARE.KLEIN_TRIES` 2 (panel), then Cloudflare klein with the same references; TwinFlow only without her face; `ledger.rwFailed` counts failed Runware attempts (`/spend` shows them); the belly, hip and thigh clauses are out of REFERENCE, LOOKS (Runware: a neutral figure now), the Cloudflare REFERENCE and LOOKS, `LINGERIE.WHO` and `SPICY_PROMPT`. Checks: `node tools/check.mjs` 6/6 ok; free captures: klein working → 3 refs, 0 belly words; klein failing → 2 klein tries with the refs, then Cloudflare, 0 TwinFlow, `rwFailed` 2. Pictures (`docs/QUALITY.md`): a modest, consistent flattening at the lower belly; bust and arms as full; not slimmer. Not deployed: `main` stays 0d2010f. *Supersedes "TwinFlow when it fails" for her pictures (2026-10-06 route) and the belly, hip and thigh words of REFERENCE (round 8) and of LOOKS (hourglass, 2026-10-06).*
- 2026-10-10 — **Deploy the reference set: `main` 9c1270f → 0d2010f** (owner: "Deploy", then "Only push to main branch to deploy. Don't forget the update handoff"): `origin/dev` pushed to `main` (fast-forward, no force; `git push origin origin/dev:main`). Deploy to Cloudflare run 38011331407 (run_number 39) and Tests run 38011331388: both success, every deploy step success. Version ID `8a4778e1-e606-4b2b-a7dc-e3a4cee17388` (was 04777c05-d54f-4dd8-874c-60dd2809b204). The Vectorize 3002 and metadata 40004 errors in "Cloudflare resources" are the normal already-exists errors. `/health` ok: Cloudflare klein drew 51,103 bytes in 9.3 s, the vision model described them. `/setup` all ✅: Telegram connected; DeepSeek on Workers AI; OpenRouter backup via Relace; Sulafat test clip; Gemini hearing heard "Hey you. I was hoping you'd text."; ElevenLabs key; Workers AI bound; face built in; Runware runware-klein, about $0.00 of $1.00 by the bot's own ledger (our test pictures ran outside it, about $0.02); the old "Runware 200: no picture" from 08/10 19:48 UTC shown again, not new. The Runware route is not checked by these: the owner's Telegram test is the first live check. The `/setup` page says to send `/restart`: do not, it wipes her memory. To go back: push 9c1270f to `main`. *Completes the 2026-10-10 "Reference set" entry (not deployed at the time).*
- 2026-10-10 — **Reference set: the owner's face, bodies, hairstyles and outfits; old references removed; dev only** (owner: "I want to update the references for Reem's face, body, hairstyles, and outfits ... clean and remove all current references of reem from our repo branches ... use the ones attached instead, for face, for front body (nude & clothed), and for back nude body. Also I am attaching images for outfits and hairstyles.", then picked: face = picture 2; clothed front = picture 9; "Words + picture sent along"; "Bangs optional, hairstyle every time"; "Approve the plan"): face `reference.jpg` / `reference-2x.jpg` = picture 2 (messy top bun, no bangs), cut from the hairline to below the chin. Bodies: `BODY` "v10" = picture 6 (nude front, faceless), `BODY_BACK` "v10-back" = picture 7 (nude back), `BODY_CLOTHED` "v10-clothed" = picture 9 (rust halter + jeans, faceless); `tools/face/body.jpg` is the Cloudflare route's small copy. Outfits: `WARDROBE.EVERYDAY` takes the olive cardigan, camel coat and rust halter first (the old camel coat line goes), `FLIRTY` the gray lace set first. Hairstyles: `HAIRSTYLES` takes the four picture styles first and loses its fixed bangs; `HAIR_CHANCE` 1 (bangs are a style, not her look). Outfits and hairstyles with a picture (`RUNWARE.STYLE_PICTURES`, six keys) send it to klein as the next image after face, body and place; `OUTFIT_LINE` / `HAIR_LINE` name it. Old body, reference and owner pictures are gone from the repo (git history keeps them); `face.js` is built by `tools/face/build-face.mjs`; the `face-candidates` drafts (581 pictures) are cleared; voice clips and job files stay. Checks: `node tools/check.mjs` 6/6 ok; four Runware pictures and one with the long-bangs style read at full size (`docs/QUALITY.md`): the same woman in all five (likeness not measured), outfits and hair as asked, except one bare-words picture where the rust halter from the body picture came in. Not deployed: `main` still runs v9 (9c1270f); pushing 93e5fb3 to `main` would return to the state before this set, if a deploy ever needs undoing. *Supersedes the v9 and v6 bodies (dev only), the 2026-10-08 face's fixed bangs, and the camel coat line of WARDROBE.*
- 2026-10-09 — **Deploy v9-clothed; variety of everyday outfits; keep the random moods; the v4-v6 push was intended** (owner: "1. Deploy v9-clothed 2. No, there should be variety of everyday outfits. 3. Keep the random moods 4. The push was intended and happen in a previous session by Opus."): `dev` (9c1270f) fast-forwarded into `main` (was 9309e8e; `git push origin origin/dev:main`, no force). Deploy to Cloudflare run 37944915522 green: every step success, Version 04777c05-d54f-4dd8-874c-60dd2809b204; `/health` ok (Cloudflare klein drew 60,126 bytes, the vision model described it); `/setup` all ✅ (its Runware line: about $0.10 of $1.00 today, and an old Runware "200: no picture" from 08/10 19:48 UTC, not seen since). The Runware route is not checked by these: the owner's Telegram test is the first live check. Before the deploy, a leak check with the bot's own code (2 pictures: a fitted black ribbed tank with high-waisted jeans, an olive ribbed top with gray yoga pants): no white set in either. The white set stays one everyday option among the others (no scope change). The random moods stay. The v4-v6 push to `main` at 03:13 UTC (run 37878269763) is confirmed intended. To go back: push 9309e8e to `main`. Not yet checked: the seated olive picture showed a rounded lower belly (a pose effect). *Completes the v9 entry below.*
- ~~2026-10-09 — **Clothed body v9: the white linen set, from the clothes model 501; dev only**~~ (superseded 2026-10-10: `BODY_CLOTHED` "v10-clothed", the owner's rust halter picture) (owner: "Remove the gray tank, try the white linen with the nude picture once and with every other clothes picture. Let me then choose which one is best.", then "Use the attached body, face, and outfit to construct the clothes model. Make sure you are using Instapic and Real HD 2K LoRAs and ensure highest skin detail and quality. Picture against plain background and lighting, and she has plain pose and expression.", then "Yes this is it. 501 it is."): four candidates first (the white set on the nude photo and on the three clothed photos, each cropped below the mouth; the nude-base one and the photo-4 one closest to the set and the full arms), then the black-slip photo in the set with a plain background and neutral pose (E-401 picked over E-402, which was slimmer). The clothes model: face from the owner’s close-up, body from the nude photo, the white set; klein 9B at 768x1344, 8 steps, CFG 1, InstaPic 1.0 and Real HD 2K 1.0 only; seed 501 chosen over 502 (slimmer arms). The body reference is `tools/face/body-v9-clothed.jpg` (576x839, cropped below the mouth); `BODY_CLOTHED` "v9-clothed"; `WARDROBE.EVERYDAY` gets the white set first, FLIRTY gets the long black slip and the lace-trim slip (text only). Bot check (`drawPicture`, 2 pictures): the outfit and a flat belly held in both; her face was close on the couch picture and looser on the standing one, where a random mood drew a laughing grin with the tongue out (not from the body). Held: the pose shot "bed-chin" (a scenario check fails with it, cause not found). *Supersedes BODY_CLOTHED "v7-clothed" (the gray tank).* Not deployed.
- 2026-10-09 — **Clothed body reference v7; dev only** (owner: "update the clothed body reference to better replicate the nude version using InstaPic and Real HD 2K with klein"): the nude v6 body (`tools/face/body-v6.jpg`) is image 0, dressed in a fitted, opaque gray tank with a normal-length hem over a padded bra, black leggings; klein 9B on Runware (`runware:400@2`) at 576x1024, steps 5, CFG 1, InstaPic 1.0 and Real HD 2K 1.0 only (`ferasalm:instapic@1`, `ferasalm:realhd2kc@1`). Round 1, 4 seeds at $0.00169 each: seeds 101, 102 and 104 showed nipples through the knit; seed 103 showed none, with a fuller bust and upper arms and a less rounded belly than v6-clothed, so it is the pick. Round 2 not run (it runs only when round 1 has no winner). Not a full match to the nude: the bust and hips are still lighter. The bot’s own `drawPicture` (her face as image 0), 2 clothed pictures read: the face held in both (dark bangs, brown eyes, olive skin); the kitchen picture’s belly looks rounder in a leaning pose. Saved as `BODY_CLOTHED` "v7-clothed" (`tools/face/body-v7-clothed.jpg`, `BODY_V7_CLOTHED_JPEG_BASE64`); `"v6-clothed"` and its files are kept. *Supersedes BODY_CLOTHED "v6-clothed" only.* Not deployed.
- ~~2026-10-09 — **Fuller body set v6; Real HD 2K back on every picture; dev only**~~ (bodies superseded 2026-10-10: `BODY` "v10", `BODY_BACK` "v10-back"; its Real HD 2K line stays) (owner: "Do that and redraw the body (the fuller are what's important), also let's return to using Real HD 2k for all pictures"): v5 redrawn on klein 9B + InstaPic 1.0 + Real HD 2K 1.0 with his bodysuit picture as a build reference; the first try (arms named in the middle, side light) stayed slim 4/4, then "Photo of a woman with full, soft, chubby upper arms and a soft, full figure, about 165 cm and 72 kg:" first + soft front light drew fuller arms and a soft belly 4/4. `RUNWARE.BODY` "v6", `BODY_BACK` "v6-back", `BODY_CLOTHED` "v6-clothed" (a bra under a thick ribbed tank: nipples still show faintly). Face unchanged (v5's macro of the old face). `LORAS` adds `ferasalm:realhd2kc@1` at 0.5 (its last live weight; Claude's value) to phone2025, ultrareal5 and InstaPic at 0.6. Live check (bot's own code, 4 pictures): fuller arms and soft belly on clothed and nude, her face held. *Supersedes the v5 body and the round 3 removal of Real HD 2K.* Not deployed.
- ~~2026-10-09 — **Face and body set v5: klein 9B + InstaPic 1.0 + Real HD 2K 1.0; dev only**~~ (body superseded the same day by v6, above; its face stays) (owner: "We want the bodies of the clothed pictures because they have the body shape and fuller arms, nudify it, create front and back pictures, use the same breasts from the nude image front shot, and use same ass from the nude pictures ... Use different realism LoRAs ... once each time with full weight ... also use the pussy diffusion LoRA for the frontal nude picture. Moreover, use her old face but enhance it similarly", then "Instapic and Real HD 2k are good. Use them both together once, then test each of them on their own. Also, apparently there is no need for pussy diffusion here", "Let's do the older face with both LoRAs together"): bench of phone2025 / ultrareal5 / InstaPic / Real HD 2K alone at 1.0, then InstaPic + Real HD 2K together vs each alone (klein 9B, steps 5, CFG 1; 23 pictures, ~$0.08). Claude's picks among the owner's choice: together for all four. Face `reference.jpg` / `reference-2x.jpg` = the old face (`reference-v3-2x.jpg`, bangs) as an extreme close-up macro (v4's bun face kept as `reference-v4*.jpg`); `RUNWARE.BODY` "v5" (his lace picture face-1 nude, breasts and bush from his nude front), `BODY_BACK` "v5-back" (bottom from his nude back and side), `BODY_CLOTHED` "v5-clothed" (gray tank + leggings drawn from v5). Live check (bot's own code, 4 pictures): the old face held in all 4; the body is slimmer than his lace pictures (narrower waist, less full arms). Live LoRAs and weights unchanged. *Supersedes set v4.* Not deployed.
- ~~2026-10-09 — **Her face and body set v4**~~ (superseded the same day: set v5, above) on klein 9B + a realism LoRA, fair olive skin; dev only** (owner: "her body looks so airbrushed and unrealistic. I'd like her skintone be fair olive and for the picture to have hyperdetailed skin texture, natural and imperfect. Let's use Krea 2", then "I don't want the process to be this long and expensive. Let's do it without a LoRA", with new pictures: 5 of her face and fuller arms, 3 nude ones for her breasts and bottom (AI-made, owner: "use them, however change skintone ... and add hyperdetailed skin texture"), then "Use klein for everything with a realism LoRA", "Use the face I uploaded without the bangs ... an extreme close-up macro direct front shot of the face", "Stop using Krea"): Krea 2 dropped (Large refused nudity 4/4 by Krea's moderation; Turbo ignored the body shape 4/4; Raw drew censor blotches; its faces were good, $0.065). New references drawn by klein 9B (`runware:400@2`, steps 5, CFG 1) + phone2025 0.6 + ultrareal5 0.9 from the owner's pictures (`tools/face/owner-2026-10-09/`): face `reference.jpg` / `reference-2x.jpg` (the macro face; old face kept as `reference-v3*.jpg`), `RUNWARE.BODY` "v4", `BODY_BACK` "v4-back", `BODY_CLOTHED` "v4-clothed" (`body-v4*.jpg`); "pale warm ivory" → "fair olive" in every description of her. Live LoRAs and weights unchanged. *Supersedes the "v3" set and "pale warm ivory" of rounds 7-8.* Not deployed.
- 2026-10-08 — **Deploy the picture rounds 6-8 to `main`** (owner: "Continuing from last session's handoff. Deploy to main"): `dev` (9803e28) fast-forwarded into `main` (was 088c9be; `git push origin origin/dev:main`, no force). Deploy run 37860789952 green: every step success, Version ID a8330967-fdd5-40db-b84e-bacb68b15187; `/health` ok (Cloudflare klein drew 52,713 bytes, the vision model described it); `/setup` all ✅. The Runware route is not exercised by those checks: the owner's Telegram test is the first live check. To go back: push 088c9be to `main`. *Completes the round 6, 7 and 8 entries marked "Not deployed".*
- 2026-10-08 — **Picture round 8: General Penis on missionary and doggy, one consistent v3 body set; dev only** (owner: "When applying
  pussy diffusion in sex scenes, his penis becomes as if it were part of the pussy. Try running general penis with it to see how it works.
  Also, update her body reference to reflect the skin tone and fuller arms. Make sure all her body shots (back, front, clothed, and nude)
  are consistent. Make them high quality and ultra-realistic with hyperdetailed skin texture, and use the Realism LoRAs if possible"):
  bench (zoom crops, 2 seeds per act): PussyDiffusion alone missionary 0/2, riding 1/2, doggy 1/2; PussyDiffusion + General Penis 0/2,
  0/2, 1/2; General Penis alone 2/2, 0/2 (a penis drawn growing from her bush), 2/2 → Claude's call: `WITH_LORAS` General Penis on
  missionary and doggy, riding with neither (fresh seeds: 2/2 each); PussyDiffusion only on nude pictures without an act (as before
  round 7). Body set "v3" (`BODY`, `BODY_BACK` "v3-back", `BODY_CLOTHED` "v3-clothed"): body-v2 redrawn by klein 9B with phone2025 +
  ultrareal5 (pale warm ivory skin, fuller arms, detailed skin), the back and clothed (normal-length tank) drawn from it; sent at
  576x1024 (768x1344 cost $0.0009 more and drew the same). `REFERENCE` names image 1's shape again, "not slimmer" (clothed came out slim
  4/4 without it). *Supersedes round 7's PussyDiffusion on vaginal acts and its v2-clothed / v2-back bodies.* Not deployed.
- 2026-10-08 — **Picture round 7: lower resolution, aspect ratios by kind, three picture kinds, /look rebuilt; dev only** (owner: "Use lower
  resolution for lower cost", "Keep it at 1:1 (with occasional 16:9s) for blowjobs and deepthroat. For other sex scenes, randomize between
  9:16, 1:1, with occasional 16:9. Keep other pictures, like clothed, nude, selfies, and mirror selfies at 9:16 vertical", "When it's a doggy
  scene, don't prompt her breasts ... use the body reference of her behind ... always describe that it's from behind", "The tear streak is
  fine during deepthroat", "include the pussy diffusion LoRA for vaginal sex scenes", "/look doesn't always have to involve Reem if the user
  is not with her ... deepseek can help with it, as well as the user by typing after /look", "use concise prompts, relying more on reference
  images", "her body is accurate when she's nude, but it's not accurate when she's clothed, making her too overweight ... keep the fuller
  arms", "a switch for normal vs nudity only vs sex scenes", "I can't seem to make her partially nude", "her skin tone to be pale warm
  ivory. And for the mole ... How about removing it from the prompt?", and a list of every option and LoRA): Runware 9:16 768x1344
  (`WIDTH`/`HEIGHT`, was 1008x1792), `SIZES` + `ASPECTS` (oral 1:1 80% / 16:9 20%; other acts 9:16 40% / 1:1 40% / 16:9 20%; `WIDE` "one
  woman"); clothed body `v2-clothed` (the owner's body dressed by klein, was the heavier "default"), `BODY_BACK` `v2-back` + `REFERENCE_BACK` +
  `NAKED_BACK` on `BACK_WORDS` acts; short `REFERENCE` (image 1's body, soft full upper arms, pale warm ivory skin, no mole; also the persona
  and the other picture words); sex acts always get NAKED, or `PARTIAL` + `BODY_PARTIAL` when clothes are named; `WITH_LORAS` PussyDiffusion
  with Flux 4 Play and Missionary; /look = `PICTURE.LOOK` (DeepSeek on Workers AI writes the picture from the chat and his words; WITH_HER =
  her face, ALONE = no one); `docs/OPTIONS.md` (`tools/options.mjs`). Claude's call: deepthroat alone at 1.0 benched again and not adopted
  (her face drifted 3/3, in her mouth 1/3; with the others her face held); `ALONE_WORDS` kept empty. *Supersedes the 1008x1792 size and the
  1:1-only oral size of rounds 4-5 and the 9:16-only rule (2026-10-04) for sex acts.* Not deployed.
- 2026-10-08 — **Picture round 6: tests, anatomy, flash, variety; dev only** (owner: "(Test; do not commit): Let's try POV doggy anal alone
  without the other LoRAs while raising it's weight to 1", "(Test; do not commit): Randomize pictures between 9:16 and 16:19. Blowjobs and
  deepthroats at 16:9 ... Only /look pictures stay at 1:1", "Does reducing resolution reduce cost?", "(Test; do not commit): When there is a
  deepthroat mentioned, use deepthroat LoRA alone ... weight to 1", "(Test; do not commit): InstaPic LoRA replaced by other LoRAs when there is
  nudity or sex act", "For when removing a LoRA, Adjust weights of other LoRAs accordingly", "Implement more variety: more poses, more
  outfits, more hairstyles, more lighting settings (golden hour, blue hour, dim candle soft lighting, and when asked for specifically: camera
  flash LoRA ... Strength: 1.0)", then mid-session: "Remember and don't confuse which is anal and which is normal vaginal ... Ensure overall
  antomical correctness"): the 16:9, deepthroat-alone and InstaPic tests are reported, not committed (sizes, `LORAS`, `ACT_LORAS` weights
  unchanged). Built: Tushy Raw Filter uploaded as `ferasalm:tushyraw@1`, `FLASH_*` (only when asked: it alone in place of the realism
  LoRAs at 1.0, no place picture); `HAIRSTYLES`/`HAIR_CHANCE` 0.5; more `LIGHT` (golden hour, blue hour, candlelight), `LIGHT_WORDS`; 7 new
  shots (poses) and 23 outfits. For anatomy (Claude's calls, from the owner's last message): `NUDE_LORAS_OFF_WITH` (Unchained off riding,
  missionary, anal), vaginal acts worded "inside her vagina", anal from behind with POV Doggy Anal alone at 1.0 (`ALONE_LORAS`: the owner's
  test 1 adopted, it was the only anal setup right on zoom, 6/6). *Supersedes the anal camera "on her back" of round 5.* Not deployed.
- 2026-10-08 — **Picture round 5: LoRA cuts, oral at 1:1, /look shows the act, anal on her back; deploy** (owner: "Cut LoRAs
  where they make the least impact and where they worsen the output. Test the deepthroat LoRA ... and deploy", "I think blowjobs
  and deepthroat might need a wider aspect ratio instead of 9:16. Test wider aspect ratios going wider gradually until 1:1 ... and
  the 16:9", "Would doing the /look while in a sex scene give a picture that properly reflects that act from POV of user?", "the
  anus looks like a vagina", "we might wanna test how general Penis LoRA might affect the blowjob picture"): Anatomy Fixer out of
  `LORAS` and POV hand out of `ACT_LORAS` (drop-one bench, 6 situations x 2 seeds: no visible change; POV hand's hands are drawn
  by the words 4/4; sex acts now $0.0034, was $0.0042); Holding Deepthroat POV kept at 0.8 (in her mouth 3/3, without 0/2); General
  Penis stays off blowjobs (no change with it; alone only the tip). Claude's calls: oral pictures (`ORAL_WORDS`) at 1344x1344
  (`ORAL_WIDTH`/`ORAL_HEIGHT`; in her mouth 9:16 3/4 vs 1:1 4/4 + 8/8, average length; every other picture stays 9:16 per
  2026-10-04), `MOODS.ORAL` (eyes only: "open-mouthed moan" drew her tongue out), `SEX_CUES` + `SEX_CONTEXT` + `SCENE_ACT_STYLE`
  (/look and her scene pictures name the act in her words, keep the sentences about him, draw her naked: 6/6), the anal camera on
  her back (from behind 0/14 drew a vulva for her anus; on her back 3/3), LoRA trigger words first in the prompt. POV Doggy Anal
  kept for now: on her back it drew the same with and without it (owner decides). Deployed: `main` = 088c9be (was 1176ec8),
  deploy run 37845500501 green, /setup all ✅, live code read back. To go back: push 1176ec8 to `main`.
- 2026-10-08 — **Picture quality round 4: InstaPic on every picture, short prompts, his-eyes sex acts; dev only** (owner: "use
  instapic for every pic, review the prompts, settings and workflow ... Unlock the spending cap for this test", "Don't cut POV Doggy
  Anal (owner) until you test the alternatives and consult me", "Remove the overlapping LoRAs (General Penis, pussy diffusion) unless
  the picture requested specifically requests for a pussy or penis without a sex act", "Remove any side-view, where it implies Reem is
  having sex with another man", "Make framing for sex acts tighter and POV", "Reem has the same expression and gaze direction in almost
  every picture", "The pictures need to look real and natural", "Add the following LoRA for blowjob scenes" (Holding Deepthroat POV),
  "test using 1:1 aspect ratio ... tell me which variables affect cost ... test using simpler prompts with the LoRAs"): InstaPic in
  `LORAS`; `SOLO_LORAS` (penis, PussyDiffusion only without an act LoRA); `ferasalm:povdt@1` uploaded and on blowjobs (POV Blowjob stays on
  Runware); every `ACT_SCENES` from his eyes, no room picture; POV Doggy Anal kept (it and Flux 4 Play both drew doggy from behind
  once the expression moved after the act words). Claude's calls: Runware `WIDTH`/`HEIGHT` 1008x1792, `STEPS` 5, `CFG` 1, `ACCELERATION`
  "none", `BIG_FACE` (2x face), `MOODS`/`GAZES`, `PHOTO`, short REFERENCE/NAKED/POV_MAN/ROOM. Bench: 1:1 7/7 vs 9:16 5/7 and ~25%
  cheaper, but 9:16 (2026-10-04) stays until the owner says. Not deployed.
- 2026-10-08 — **LoRA round 3: Anatomy Fixer everywhere, Real HD out, new act LoRAs; dev only** (owner: "In blowjob scenes: the
  penis is too long", "Compare between SNOFS and NSFW unlocked", "Add POV hand to blowjob (like holding her head) and to riding (holding
  her breasts) and doggy anal (gripping her butt)", "Add anatomy fixer to every picture, and remove the least impactful LoRA", the penis,
  PussyDiffusion, Lenovo UltraReal, Unchained XXX and Flux 4 Play LoRAs; then picked "Keywords + more words" for /look and "Dev only"):
  `LORAS` phone2025 + ultrareal5 + Anatomy Fixer (Real HD 2K out: least change in the drop-one bench; Lenovo drew the same, not added);
  `NUDE_LORAS` Unchained 0.8 (beat SNOFS and Unlocked; both kept on Runware); `ACT_LORAS` by words: Flux 4 Play (riding, cowgirl,
  doggy), Missionary, POV Anal, penis 0.6, PussyDiffusion (pussy, spread legs), POV hand (his hands, doggy/anal), POV Blowjob 0.6;
  `ACT_SCENES`: the camera per act (blowjob a side view without the room picture; doggy/anal his hands on her butt). Claude's calls:
  POV hand on her head (blowjob) drew a second penis and on her breasts (riding) 0/4, so they are left out. *Supersedes the LORAS and
  NUDE_LORAS of "LoRAs by situation" (same day).* Not deployed.
- 2026-10-08 — **LoRAs by situation; seven new LoRAs** (owner: "Use the following LoRAs (upload them if they are not on runware)" — Anatomy
  Fixer (Runware `myaiprojectsqqq:3@2`), POV Blowjob, POV hand, NSFW Unlocked, POV Doggy Anal, Missionary POV, InstaPic — "After testing
  each individually, List all the LoRAs that we have and use, so we can set conditions for each depending on user's request ... instead
  of dumping them all together if that's better"): uploaded as `ferasalm:povbj@1`, `ferasalm:povhandc@1` (converted: OneTrainer
  naming failed to load), `ferasalm:nsfwunlock@1`, `ferasalm:povanal@1`, `ferasalm:missionary@1`, `ferasalm:instapic@1`. Claude's
  routing and weights (`runwareLoras`): LORAS (phone2025, ultrareal5, realhd2kc) on every picture; SELFIE_LORAS InstaPic 0.6; NUDE_LORAS
  SNOFS 0.8 + NSFW Unlocked 0.5 + Anatomy Fixer 0.7; ACT_LORAS by words (blowjob → POV Blowjob 0.9, missionary → Missionary 0.8, anal →
  POV Anal 0.8, his hand/grabbing → POV hand 0.6); LORA_WORDS put their trigger words first. On `dev`; deploy waits on the owner.
- 2026-10-08 — **Sex-act pictures on, POV man, detailed genitalia, $1/day; deploy once verified** (owner: "We're at the development
  stage, we need to lift all restrictions, especially on generating pictures ... I must verify the LoRA is working even with sex acts",
  then picked "POV, faceless man", "Raise to $1", "Deploy when verified", and on the plan: "Allow detailed genitalia"):
  `PICTURE.RUNWARE.SEX_ACTS` true (*supersedes its default off of 2026-10-06*); `NOT_DRAWN` (the sex-act list) widened (blowjob,
  riding, doggystyle, missionary, ...); `NUDE_WORDS` adds pussy, vagina, pubic, bush, spread legs; new `POV_MAN` on sex-act pictures
  (his eyes are the camera, never his face; his penis anatomically correct); /pic's me/my/I are "the man" in a sex act; /look and her
  scene pictures keep a nude or sex-act sentence about him as "the man"; `NAKED` asks for a detailed, unblurred vulva;
  `RUNWARE.DAILY_USD` 1 (was 0.5). Kept (Claude): no picture after he says he's under 18, none in an OOC reply. Deployed with the entry below: `main` = 1176ec8
  (was afbd4fd), deploy run 37799616836 green, /setup all ✅. To go back: push afbd4fd to `main`.
- ~~2026-10-08 — **New face and body (the picture refresh)**~~ (face superseded 2026-10-10: the owner's picture 2; bangs are no longer fixed) (owner: "find attached pictures for Reem. We want to keep the fuller arms",
  "All AI-made. Use 1-2 for face, and the rest for exact body shape and contours (notice the breasts type, areolas, nipples, bushy
  groin)", "They're AI-made, use them", and picked "Natural pubic hair" over the piercings): her face is cropped from his picture 1
  (`tools/face/reference.jpg`, jet-black wavy hair with full bangs, amber-brown eyes, a beauty mark on her left cheek); her words
  (persona, every picture description) say so (*supersedes dark brown hair, dark brown eyes and freckles*). Runware's body is his
  picture 5 (`RUNWARE.BODY` "v2", `tools/face/body-v2.jpg`) on nude and sex-act pictures; clothed pictures keep the gray tank +
  leggings body (`BODY_CLOTHED` "default", Claude's fix: the nude body made 6/6 pictures with no clothes named nude). Bush: "thick,
  full, untrimmed"; arms: "fuller and softer than in image 1". Expressions, poses and wardrobe variety: not done yet.
- 2026-10-08 — **SNOFS on nude pictures only; deploy once verified** (owner: "download the LoRA from Civitai at your machine, upload
  it to runware, and do what you have to do in order to have the LoRA working on our Flux.2 Klein 9B for Reem ... SNOFS", then picked
  "Nude/explicit only" and "Deploy when verified"): `PICTURE.RUNWARE.NUDE_LORAS` `ferasalm:snofsc@1` at 0.8 (Claude's value) is added
  to the three LORAS when NUDE_WORDS match (or, with SEX_ACTS on, a sex act). SNOFS v1.4 is a LoKR Runware can't load, and Runware
  can't draw with its merged checkpoints, so it is a rank-128 LoRA copy (lora-upload run 37788419189). Bench 37789786856 (28/28 read).
  Deployed (owner: "Deploy"): `dev` (afbd4fd) fast-forwarded into `main` (was 206de7d), deploy run 37793652334 green, /setup all ✅,
  live code read back (`NUDE_LORAS` `ferasalm:snofsc@1` 0.8). To go back: push 206de7d to `main`.
- 2026-10-08 — **Next chat: refresh her face, body, expressions, poses, wardrobe** (owner: "update Reem's face, body, expressions, poses, and
  give her variety of wardrobe options. I will need a prompt for each picture you request to use nanobanana on my part ... then hand you
  the pictures", "I will also include reference images for the new face and body"): a planned job, not built. Claude writes one Nano
  Banana prompt per picture it asks for; the owner generates and hands them back; nothing changes in the bot until then.
- 2026-10-08 — **Real HD 2k on too; deploy** (owner: "Switch on Real HD 2K too and make it live (deploy if needed)"):
  `PICTURE.RUNWARE.LORAS` adds `ferasalm:realhd2kc@1` at 0.5 (Claude's value, the all-three bench run 37722968583) to phone2025 +
  ultrareal5 at 0.6. *Supersedes "Real HD benched, not on" in the LoRA entry below.* Deployed: `main` = 206de7d (was 375f490),
  deploy run 37726965611 green, /setup all ✅, live code read back (three LoRAs). To go back: push 375f490 to `main`.
- 2026-10-08 — **Deploy the LoRAs** (owner: "deploy"): `dev` (375f490) fast-forwarded into `main` (was d95fd55). Deploy run
  37726288341 green: /health drew and saw, /setup all ✅ (Workers AI DeepSeek, OpenRouter backup via Novita, Sulafat, Gemini hearing,
  Runware klein); live code read back (`LORAS` phone2025 + ultrareal5 0.6, `LORA_PREFIX`). *Completes the entry below.* To go back:
  push d95fd55 to `main`.
- 2026-10-08 — **Civitai LoRAs on Runware klein 9B** (owner: "download the LoRAs from Civitai at your machine, upload them to runware,
  and do what you have to do in order to have the LoRAs working on our Flux.2 Klein 9B for Reem", then "yes put it on the public host"
  / "we want to try both"): uploaded as `ferasalm:phone2025@1`, `ferasalm:ultrareal5@1` (both load) and `ferasalm:realhd2k@1` (a
  diffusers DoRA Runware can't load: converted by `tools/lora/dora-to-lora.py` to rank 32 and put on a public host, filebin, owner's
  OK: `ferasalm:realhd2kc@1` loads). `PICTURE.RUNWARE.LORAS` phone2025 + ultrareal5 at 0.6 each with phone2025's trigger words
  (`LORA_PREFIX`); Real HD benched, not on. On `dev`, not deployed.
- 2026-10-06 — **Main routes checked; hearing on Gemini first** (owner: "CHECK that the Main route: Her texts, memory, /auto: DeepSeek
  on cloudflare / Her voice: Sulafat on OpenRouter / Hearing: Gemini on OpenRouter / Seeing your photos: Cloudflare / Her pictures:
  Runware klein"): `HEARING.OR_FIRST` true (Gemini first, Whisper when it fails, Scribe last); the other four were already live. A
  unit row pins all five. *Supersedes the hearing order (Whisper first) of the entry below.*
- 2026-10-06 — **Cloudflare first for texts and hearing, OpenRouter the backup; deploy** (owner: "Swap between text main and
  backup, putting cloudflare to the main and openrouter to backup, since it succeeds even with explicit texts. Now openorouter will only
  handle voice as main. Then deploy."): `LLM.MODEL`, `MEMORY.MODEL`, `AUTO.MODEL` `@cf/deepseek-ai/deepseek-v4-flash-0731`;
  `LLM.BACKUP_MODEL` `deepseek/deepseek-v4-flash` with the old providers and reasoning off (`BACKUP_PROVIDER`, `BACKUP_REASONING`);
  `HEARING.OR_FIRST` false: Whisper first, Gemini when it fails, Scribe last. OpenRouter's main job: Sulafat. `LLM.TIMEOUT_MS` 20 s.
  *Supersedes the main/backup order of the entry below (same day).* Deployed: `main` = 7de9e5b (was 59177d8), deploy runs
  37547182886 (AI Gateway refused picture uploads → gateway only for text and vectors; Workers AI's DeepSeek answers bare one-line
  prompts with nothing → tasks get reasoning "low") and 37548651259 green: /health drew and saw, /setup all ✅ (Workers AI DeepSeek
  answered, OpenRouter backup via Novita, Sulafat, hearing, Runware klein). Also on `main`: everything of the entry below. To go back:
  push 59177d8 to `main`.
- 2026-10-06 — **OpenRouter only for DeepSeek, Sulafat and Gemini; backups on Cloudflare; Cloudflare ideas 1-6** (owner: "From
  Openrouter, Remove nanobanana, and Nemo, Keeping only deepseek, sulafat, and Gemini. Let's do cloudflare's ideas from 1 to 6 but Test
  idea 2 first (test cloudflare's deepseek). I am thinking we could make it a backup. So the bot is openrouter (text, voice, listening),
  looking at pictures from cloudflare. The backup is also on cloudflare. The pictures from runware (I have $19 there)."): Nano Banana
  off (`LINGERIE.ENABLED` false); `LLM.BACKUP_MODEL` `@cf/deepseek-ai/deepseek-v4-flash-0731` (Workers AI) for her replies, memory and
  /auto, tested first with no OpenRouter call (live runs 37544031689 → empty-answer retry → 37545345952: 0 broken); her voice's backup
  aura-2 on Workers AI before ElevenLabs; Whisper stays the hearing backup. Built (Claude's designs): `RECALL` long memory (Vectorize
  index `reem-memory`, bge-m3), `RECALL.REPEAT_SCORE` 0.68 (same thing in other words), `DAY` (Open-Meteo weather + a daily plan on
  Workers AI), `/album`, `/spend`, `AI_BUDGET.GATEWAY` "default". On `dev`, not deployed. Runware balance $19.07 (Runware MCP).
  *Supersedes Nemo as the backup (2026-10-06) and Nano Banana for lingerie (2026-10-04/05).*
- 2026-10-06 — **Sulafat stays; no OpenRouter for testing** (owner: "Sulafat is way better." / "Don't use openrouter for testing.
  It's running out of credits. We have cloudflare and runware."): MiniMax is dropped (no voice change). Benches and checks run on
  Cloudflare Workers AI and Runware only: no `[live]` commits or test.yml runs (they call DeepSeek on OpenRouter), no OpenRouter
  candidates in tts/stt/image/model benches, until the owner says otherwise. The live bot itself still runs on OpenRouter (DeepSeek,
  Nemo, Sulafat, Gemini hearing, Nano Banana). The owner also asked Claude to sign in to the Runware MCP (https://mcp.runware.ai):
  it is not connected to this session; he connects it at claude.ai/customize/connectors, then a new session.
- 2026-10-06 — **Runware klein for every picture; MiniMax Turbo test with Arabic script** (owner: "You write the lines. test the turbo
  with the Arabic script. Switch on the runware klein for all pictures."): `PICTURE.ROUTE` default `runware-klein` (was `cloudflare`):
  selfies, scenes, lingerie, /pic and /look on klein 9B with her face, TwinFlow when it fails, Cloudflare past `RUNWARE.DAILY_USD`
  $0.50; /face and /health stay on Cloudflare. On `dev`, not deployed. TTS bench 37541102035: 3 new lines (Claude's), Arabic words in
  Arabic script, MiniMax Turbo (OpenRouter; Runware has only one MiniMax speech model, billed at HD price) and HD, Arabic_CalmWoman,
  vs Sulafat; 9 clips sent. Voice unchanged until the owner picks.
- 2026-10-06 — **Try MiniMax TTS on Runware** (owner: "Step two is already fixed since we changed the model back to deepseek. Now,
  i want to try minimax tts from runware. Let's test it with samples."): the "him at her door" next step is dropped; TTS bench run
  37538682473 made 10 MiniMax Speech 2.8 clips (5 voices x the Fish/Qwen lines), sent in chat. Nothing changed in the bot.
- 2026-10-06 — **Deploy** (owner: "Deploy"): `dev` (59177d8) fast-forwarded into `main` (was 90e5c44): "come over" (she mostly
  goes), the habibi fix, the deploy's /setup step. Deploy run 37520213264 green (Deploy Worker, /health drew and saw, /setup all ✅:
  DeepSeek answered, Nemo backup, Sulafat, Gemini hearing); live code read back (`VISIT_CHANCE: 0.75`, `asksHerOver`, the habibi
  line). *Completes "Come over: she mostly goes" (same day).* To go back: push 90e5c44 to `main`.
- 2026-10-06 — **No settings panel** (owner: "the setting panel from last chat was useless", then picked "Drop it"): Claude stops
  republishing `tools/settings-panel.html` and stops pointing the owner to it; he says changes in chat and Claude makes them in
  code. The file stays for the unit test that every CONFIG key has a field. Also (owner): "there is no such thing as /setup inside
  the telegram bot": /setup is a web page; the deploy now opens it and prints it in the log.
- 2026-10-06 — **"Come over": she mostly goes** (owner picked "Mostly go: about 3 in 4 times she comes; sometimes she teases or
  invites you over instead"): while apart, when he asks her over (`TEXTING.VISIT_PATTERN`, not "can I come over"), 3 in 4
  replies (`TEXTING.VISIT_CHANCE` 0.75) are the scene of her going to his door (`NUDGES.FORMAT_VISIT`; a text is asked again,
  `RETRY_VISIT`); the rest are a normal reply. Not deployed.
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

