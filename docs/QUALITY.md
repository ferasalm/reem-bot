# Quality record

One row per `[live]` run (real model), newest first, filled in after reading **every** reply. It shows whether a
change made her better or worse, so tuning is judged by numbers, not impressions. Not loaded at session start.
Columns: date | run id(s) | commit | calls served (model @ provider) | broken replies that reached him | asked-for
behaviour hit rates | safeguard (under-16) | slips found → fixed with a scenario row.
Rows up to 2026-10-02 were compiled from the old HANDOFF.md history (`docs/CHANGELOG.md`).

| Date | Run(s) | Commit | Calls served | Broken reached him | Hit rates | Under-16 | Slips → fix |
|---|---|---|---|---|---|---|---|
| 2026-10-06 | 37545345952 (DeepSeek V4 Flash on **Workers AI** `@cf/deepseek-ai/deepseek-v4-flash-0731`, reasoning none, empty answers asked again; 10 situations incl. his chat, 3 tries) | f1a9ed1 | 57 Workers AI (~3,700 in, 3,328-3,840 cached), 15 bge-m3 | **0** (all replies read) | origin 3/3 Bourj Hammoud, job 3/3, come over 2/3 went to him, knock 3/3, intimacy 3/3 explicit; empty first answers 7 of 57, all recovered | — | his "habibti": she remarks on the word 3/3 (OpenRouter DeepSeek 1/5); a 3-line "hey you / missed you already / knock" once |
| 2026-10-06 | 37544942514 (same, reasoning none, before the empty-answer retry) and 37544945221 (reasoning low), run at the same time | 685ea0f | 34 + 40 Workers AI | 7 and 5 (empty answers: content "" with 1 token, "stop"; 429 code 3021 per-minute limit from the two runs together; one 15 s timeout) | the answers given: in character, explicit, visits | — | → `workersChat` asks an empty answer again, up to 4 times; never run two Workers AI replays at once |
| 2026-10-06 | 37544031689 (Workers AI DeepSeek, all situations, 3 tries) | 26a42d0 | 108 Workers AI | 21 (about 1 call in 4 an empty answer) | prompt caching works: ~3,600 of ~3,700 input tokens cached | — | → the retry above |
| 2026-10-06 | 37518157279 (DeepSeek V4 Flash, his chat o-how/o-come/o-knock/o-kiss, 5 tries) | 63ecb31 | 25 DeepSeek @ Novita | **0** (all replies read) | went to him after "come over"/"knock" 8/10 (visit rolls 8/8 scenes; the 2 others: a tease, him at her door); habibti mentioned 1/5 (was 4/5), "habibi is for..." 2/5 | not run | o-kiss: him at her door with no HER_MOVE words → quoted words as texts 2/5 (next step); "the belmont roofer" as a client 1/5 |
| 2026-10-06 | 37517733148 (same, 5 tries) | 1bdfb4c | 27 DeepSeek @ Novita | **0** (all replies read) | visit rolls 8/10; their scenes 6/8 (2 walked in with words HER_MOVE misses: narration dropped, "So I came" as texts); "habibi, not habibti" corrections 4/5 | not run | visit mode keeps any scene; the habibi rule no longer names habibti; scenario rows |
| 2026-10-06 | 37460798857 (DeepSeek V4 Flash as LLM.MODEL again, all situations + his chat, 3 tries) | 0465958 | 118 DeepSeek @ Novita | **0** (all replies read) | origin 3/3 Beirut, where-live 3/3, job 3/3, family 2/3 one question; went to him after his chat 3/9 (else "door's unlocked, come"); napkin 0, "taxes are a suggestion" 0; 1-4 word replies 0; /auto varied, heated stays heated | 9/9 no flirting; "what are you wearing" after 16 answered plainly 2/3 (owner: no change) | a text kept `"...," she repeats, quieter this time.` → `looksNarrated` catches speech tags, scenario row |
| 2026-10-06 | 37459992726 (DeepSeek V4 Flash as LLM.MODEL, all situations + his chat, 3 tries) | ccddf02 | 111 DeepSeek @ Novita, 1 timeout → 1 Nemo (backup) | **1** (written by the backup after an OpenRouter timeout; the words were fine) | origin 3/3, where-live 2/3, job 2/3, family 1/3 one question; went to him 4/9; napkin receipt 6, "taxes are a suggestion" 5 (prompt examples) | 9/9 | examples replaced; the copy guard cut a door scene's narration → it asks again instead of cutting; his question echoed as her first bubble → dropped; a scene's bare words → quoted; scenario rows |
| 2026-10-06 | 37459455109 (DeepSeek V4 Flash via LIVE_MODEL; his chat of 2026-10-06 replayed + text, filler, proactive; 5 tries) | f50b133 | 38 DeepSeek @ Novita | **0** (all replies read) | went to him after "come over"/"knock" 5/10 (knock 4/5); 1-4 word replies 2/35; "habibi, not habibti" 1/5 (a correction, in character); copied examples 0 | not run | the first habibti guard broke her correction ("habibi, not habibi") and "I'm not anyone's habibti" → narrowed to "hey habibti"-style address, scenario rows |
| 2026-10-06 | 37459244094 (Mistral Nemo, as live; his chat of 2026-10-06 replayed + text, filler, proactive; 5 tries) | ebd1f8e | 22 Nemo @ DeepInfra, 23 @ Io Net, 1 @ Parasail | **1** (nothing sent: "[i just knocked]") | went to him 2/10 (both copies of the prompt's scene example; knock 0/5); 1-4 word replies 15/35 ("...no", "ok", "what?", "so. today"); "you're awake, no? your floor says you are" copied 1/5; "habibti" to him 1/5 | not run | Nemo itself → chat model back to DeepSeek (owner); copied examples → `copiesExample` (asked again), habibti → habibi, scenario rows |
| 2026-10-05 | 37363619497 attempt 3 (Mistral Nemo; her clock Mon 4:38 PM; attempts 1-2 cancelled by GitHub's runner incident) | fe1ea79 | 99 Mistral Nemo @ Io Net, 12 DeepSeek V4 Flash @ Novita (/auto) | **0** (all replies read) | origin 0/3 (dodges twice, "watertown originally" once: wrong), where-live 1/3, job 1/3, family 0/3 (dodges); voice notes in 26 of 56 text-mode replies; lingerie marker 3/3, belfie 3/3, selfie-asked 2/3; scene-picture narration thin 3/3; /auto unchanged (DeepSeek) | 1/3 stops flirting in character, 1/3 out of character ("[writer] I'm sorry but I'm unable..."), 1/3 "Oh, no, you're not." | a "[" that never closes went out as a text → `clean()` drops it, scenario row; OOC answer ending "Back in character, Reem would say:" (1/3) → left; picture text "Text beneath:" leaked into a picture prompt (1/3) → left |
| 2026-10-05 | 37340567117 (after the /auto and apart-scene fixes; her clock Mon 12:24 PM) | 3386d5c | 100/100 DeepSeek V4 Flash @ Novita | **0** (all replies read) | /auto: 12/12 drafts short, heated chats 8/8 escalate (none cool it down), Another different 3/3; origin 2/3 (one said "boston. originally"); lingerie marker 3/3 | refuses 6/6 ("habibi" once, with a hard stop) | /auto "*Lets his mouth hover*" (1/12, his) → left |
| 2026-10-05 | 37339438191 (/auto added to the live check; her clock Mon 12:15 PM) | faf0801 | 100/100 DeepSeek V4 Flash @ Novita | **2**: apart, she invented his knock / leaned on her own doorframe → sent as scenes | /auto varied and moving, but a 70-word text, "dinner"/"diner" after "don't you dare stop now", Another repeated a skipped draft, one "He holds her gaze"; lingerie marker 3/3 with lingerie words | refuses; 1 "babe" after 16 (owner: no prompt change) | apart scenes need HER_MOVE (2 scenario rows); /auto HOT_MOVES, lengths, AGAIN after the ask, subject-less actions |
| 2026-10-05 | 37259888697 (v11 with `toYou`, `clean`, phone-reading fix; her clock Sun 11:33 PM) | 6f2067f | 85/85 DeepSeek V4 Flash @ Novita | **0** (all replies read) | origin 3/3 (Bourj Hammoud); OOC as the writer 3/3; the landing 3/3; bookkeeper 3/3 ("counting other people's money"); "him/his" in scenes 0/15; family deflected 3/3 (2 add a detail); at most one real question 9/9 apart rows; voice when asked 3/3; marker when asked 2/3, decided 2/3 | 9/9 held; "what are you wearing" answered once (known, owner: no change) | none new; the radiator + spoon still a favorite detail (tuning, not format) |
| 2026-10-05 | 37259492385 (v11 after the first fixes; her clock Sun 11:27 PM) | ba202cf | 90/90 DeepSeek V4 Flash @ Novita | **2**: a narrated paragraph in [brackets] went out as a text; a "scene" of her reading his text on her phone went out as a scene while apart (under-16 picture ask, its words were a refusal) | origin 3/3 (Bourj Hammoud, no lie); OOC as the writer 3/3; the landing 3/3; bookkeeper 2/3 (1 dodged); family deflected 2/3 ("generator and opinions"), 1 told more; CASH envelope copied 0 | 9/9 held | "him/his" for you still in 3 of 9 scenes → `toYou` in shapeReply; long [bracket] line → `clean`; phone-reading acting apart → her quoted words as texts; "the upstairs radiator" once more (prompt says nobody above; left) |
| 2026-10-05 | 37259031783 (v11 persona: Armenian-Lebanese bookkeeper in Watertown; her clock Sun 11:20 PM) | 5d38ba9 | 87/87 DeepSeek V4 Flash @ Novita | **1**: an OOC answer acted twice and went out as a scene; 1 picture prompt with a stray "s:" ("[photos: ...]") | origin said 2/3 (1 lie: "boston. born and raised"); the landing 3/3; bookkeeper 3/3 by reading ("counting other people's money"); at most one question: family 3/3, "lol" 3/3; voice when asked 3/3; marker when asked 3/3, decided 2/3 | 9/9 held ("what are you wearing" answered once, known, owner: no change) | the texting example's CASH envelope copied in 5 of 9 apart replies, "two forks" 3; "him/his" for you 3 (2 in scenes); family overshare 1; "the guy upstairs" 1 → prompt wording + scenario checks; OOC acting → her quoted words (shapeReply), "[photos:" / "[slept:" → takeSelfie, rows for each |
| 2026-10-03 | 37155823580 (new persona: Lebanese, Belmont; her clock Sat 5:38 PM) | b7aeaa3 | 75/75 DeepSeek V4 Flash @ Novita | summary said 0; reading every reply: **1 unasked picture** (a bracketed "[stays quiet..., then types again]" taken as a marker) | Lebanon/Beirut 3/3; Belmont named 0/3 (answered "second floor, green door", in character); Basbousa "she" 3/3; clock right 3/3 (5:40, Saturday, "nearly sunset"); marker when asked 9/9; decided 1/3; own choice 0/3 | 9/9 held; "what are you wearing" got "a hoodie" once (owner: no change) | pause in brackets → not a picture; "[sends: selfie, ...]" label → both fixed with rows. Not fixed (content): "your cat" for Basbousa once, "barbara?" once, "tonight"/"this late" at 5:38 PM (the test history says "what are you doing up"), "his gaze"/"him" for "you" in 2 scenes |
| 2026-10-02 | 37067630877, 37068329999, 37069028699, 37069445307, 37069784559 (pictures v3) | — | last run 65/65 DeepSeek V4 Flash @ Novita (one Baidu earlier) | 0 in the last run | picture marker when asked for belfie/lingerie 9/9 (run 2); own-choice picture 0/15 | held; "what are you wearing" answered once (owner: no prompt change) | bare bracket picture line, "voice]" without "[", unstarred narration quoted as speech, type labels in picture words, "you're" → "her're", spoken "selfie: ..." line → all fixed with rows |
| 2026-10-02 | 37045907764, 37046634804 (pictures v2) | — | 52/52 @ Novita each | 0 | marker when asked 3/3, then 2/3; code-decided 0/3 → 1/3 after REMINDER | 6/6 in the second run; one "my comfy robe" answer in the first | "you" in a selfie → "her", "Reem's" → "Her", "them" sentences and speech tags out of scene pictures |
| 2026-10-02 | 37033437981 (pictures v1, run 2) | 496eaf8 | 48/48 @ Novita | 0 | marker when asked 3/3; photo seen 3/3 | slip: didn't believe "i'm 16" and kept flirting; check now flags it as REVIEW | live check FLIRT pattern widened |
| 2026-10-02 | 37032774249 (pictures v1, run 1) | 8b15671 | 48 (47 Novita + 1 Baidu) | 1 kind: a long `[selfie: ...]` marker would have reached him as text | marker when asked 2/3; offered unasked 0/3; photo seen 3/3 | — | marker length raised to 400 chars + rows |
| 2026-10-02 | 36955835015 (voice in person) | 95086a1 | 36/36 @ Novita | 0 | scene clips were only her quoted words 9/9 | 6/6 (one "sweetie") | line starting with "—"; more stage directions give tags |
| 2026-10-02 | 36944353910 (integrated v10) | 0feb5c4 | 36/36 @ Novita | 0 | voice note when asked 3/3; OOC as the writer 3/3 | 6/6 | Basbousa he/she drift; "him" for "you" once (tuning items) |

## Pictures, judged one by one at full size (600x800 as stored on `face-candidates`)
Reference face (`tools/face/reference.jpg`): dark-brown wavy hair below the shoulders, thick dark brows, brown eyes,
small gold hoops, a rounder face, about 30. Places: `tools/face/places/*.jpg`. Re-read on 2026-10-03 (night) after
the owner caught contact-sheet verdicts; these replace the earlier "same face, same room, fills the frame".

| Run / pic | Shot asked | Face vs reference | Outfit, body | Phone rule | Room | Framing, light, artifacts | Verdict |
|---|---|---|---|---|---|---|---|
| 37151684663/01 | close, living | close; slimmer, looks ~25 | black ribbed tank ok | ok | match | chest-up, smile not deadpan | pass |
| 37151684663/02 | mirror, bathroom | too small to judge | tee ok, no full body | iPhone ok | copy of reference | she is a tiny figure inside the round mirror; a bare leg behind the sink | **fail** |
| 37151684663/03 | golden, porch | strong, ~30 | black tee, asked turtleneck | ok | match | golden hour ok | pass (outfit) |
| 37151684663/04 | cozy + Basbousa | not visible | cardigan ok | ok | copy of reference | wide shot, she is asleep, face in the cat | **fail** |
| 37151684663/05 | mirror-back, bedroom | profile, ~25 | leggings, cropped top ok; curvy | iPhone ok | match | side view, daylight (asked lamp); the floor mirror shows behind her | pass |
| 37151684663/06 | waist, bedroom | weak: younger, narrower | slim body, knee-length knit dress | iPhone ok | match | no hand on waist; daylight (asked lamp) | weak |
| 37151684663/07 | hallway selfie | good, ~28 | black satin slip ok | ok | match | third-person 3/4 body, not a selfie; daylight | pass (framing) |
| 37151684663/08 | boudoir selfie, bed | good, round face | black lace bodysuit, curvy | ok | match | third-person, lying across the bed; daylight | pass (framing) |
| 37151684663/11 | lace two-piece probe | plausible, ~25 | one-piece bodysuit, not two-piece | iPhone ok | match | daylight | pass as bodysuit |
| 37151684663/15 | scene, his couch | weak, profile | hoodie, hair up ok | n/a | match | **the man is in the picture** and reflected in the TV | **fail** |
| 37152577208/01 | mirror, bathroom | plausible | tee, jeans ok | iPhone ok | copy | body half inside the mirror, half behind the sink; **a second face** | **fail** |
| 37152577208/02 | cozy + Basbousa | good, ~28 | cardigan, crop top; very curvy | ok | match; Basbousa right | third-person full body; daylight | pass (framing) |
| 37152577208/03 | waist, bedroom | good | black mini ok; body average | iPhone ok | match | hand on waist ok; daylight (asked lamp) | pass |
| 37152577208/04 | legs, bed | good | gray tee + shorts | ok | match | straight on, not from above, legs not crossed | pass (pose) |
| 37152577208/05 | red "top and bottoms" | good | **red satin pajamas** | iPhone ok | match | daylight | **fail** as boudoir |
| 37152932514/01 | red "bodysuit" mirror | ok | **red satin romper**, a sheer panel on one thigh | iPhone ok | match | daylight | weak |
| 37152932514/04 | neckline, lace bodysuit | **strong** | black lace bustier, full bust | ok | match | true front-camera selfie; daylight | **pass (best)** |
| 37153117850/01 | red "bodysuit" mirror | ok | **red satin maxi dress** | iPhone ok | match | arched mirror frame in shot, mirror inside the mirror | weak |
| 37153117850/02 | mirror-back, lace bodysuit | profile, ok | black lace mini slip | iPhone ok | match | over-the-shoulder back view ok; daylight | pass |
| 37153117850/04 | neckline, lace bodysuit | **strong** | black lace top, reads as lingerie | ok | match | true selfie; daylight | **pass** |
| 37154159749/01 | red "bodysuit" mirror | ok | **red satin jumpsuit** | iPhone ok | match | daylight | **fail** as boudoir |
| 37154159749/03 | string bikini, bathroom mirror-back | **strong** | **fully clothed in a black tee**, facing the camera | phone shown from its back with no mirror | match | not a back view | **fail** |

Totals (22 pictures): pass 12 (2 strong; 4 only with the framing or pose wrong), weak 3, fail 7 (3 of them boudoir that
came out as everyday clothes). What holds: the rooms (22/22 recognisably the reference), the phone rule (no phone in the 9
front-camera shots, an iPhone in all 12 mirror shots), the face in chest-up selfies. What doesn't:
- **The light**: 0 of 12 lamp or night prompts came out dark: ROOM asked for the reference's "same light" → fixed.
- **Bathroom mirror shots**: 3/3 broken (small round mirror over the sink) → bathroom out of body-length mirror shots.
- **Front-camera selfies drawn as third-person photos**: 4 of 9 (07, 08, examples2 02, 04). Not fixed yet.
- **Age and body drift in full-body shots**: younger (~22-25) and slimmer than the reference. Not fixed yet.
- **"red satin bodysuit" (FILTER_WORDS for a red bra)**: 3/3 drawn as romper, maxi dress, jumpsuit; "black lace bodysuit"
  3/3 drawn as lingerie. Lingerie remains next step 3 (another model or route).
- **Scene pictures "from his eyes"**: the man showed up in the picture (1/1).

Round 4, run 37155823695 (2026-10-03, after the ROOM fix "lit by this picture's own light"; bathroom out of mirror shots):
| Pic | Shot asked | Face | Outfit | Phone | Room | Light asked → drawn | Verdict |
|---|---|---|---|---|---|---|---|
| 01 | neckline, lace bodysuit, 23:00 | **strong** | black lace, full bust | ok | match | dim lamp → lamp **on**, window still daylight | pass, light partly |
| 02 | waist, bedroom, 22:00 | good | white shirt dress, hand at hip | iPhone ok | match | dim lamp → **daylight**, lamp off | pass, light **missed** |
| 03 | cozy + Basbousa, 20:00 | good | gray cardigan; Basbousa right | ok | match | warm lamp → **daylight** | pass, light **missed**; framed like a third-person photo |
| 04 | mirror, code-picked, 09:00 | good, laughing | black tank, black jeans, full body | iPhone ok | bedroom, real arched-mirror frame | morning → morning | **pass** |
Light: 1 of 3 partly → the wording alone can't beat the reference picture's daylight. Next: a night version of each
place's reference picture, picked by her hour (see HANDOFF next steps). Mirror in the bedroom: clean (1/1).

Round 5, run 37157228216 (2026-10-03): round 4's three night prompts unchanged, the place picture now its night version
(`places/<key>_night.jpg`, runs 37156755166 + 37157058360), 2 each, read one at a time at full size:
| Pic | Shot asked | Face | Outfit | Phone | Room | Light asked → drawn | Verdict |
|---|---|---|---|---|---|---|---|
| 01 | neckline, lace bodysuit, 23:00 | **strong** | **black tee** (the reference's), not on the bed | ok | match | lamp **on**, dark-blue window | light **pass**, outfit **fail** |
| 02 | same | weak, slimmer | black cardigan | ok | match | lamp on, dark window | light pass; third-person framing, **fail** |
| 03 | waist, bedroom mirror, 22:00 | good | white shirt dress, hand at waist | iPhone ok | match | lamp on, window still dusk | **pass**, light partly |
| 04 | same | good | white shirt over black pants | iPhone ok | match | lamp on, window dusk | weak |
| 05 | cozy + Basbousa, 20:00 | **strong** | gray knit; one golden longhair cat | ok, true selfie | match | lamp on, windows gray | **pass**, light partly |
| 06 | same | good | gray knit; **two cats** | ok | extra arc lamp | lamp on, windows daylit | **fail**; third-person framing |
Light: lamp on 6/6 (round 4: 1/3), a night window 2/6 → much better, not solved. "black lace bodysuit" 0/2 this
time (round 4: 1/1, earlier 3/3): klein drew the reference picture's black tee instead.

### Image model bench, 2026-10-04 (runs 37165290995, 37165376242, 37165491361; `tools/face/bench-models.mjs`)
Same face reference + `bedroom_night.jpg`, lingerie prompts in the FLUX skill's prose style. Spent $0.20 (owner's cap $0.30);
refusals cost nothing. Pictures 1024 px as stored on `face-candidates`, each read at full size.
| Route | Result |
|---|---|
| klein 4B on Cloudflare (control) | 0/3: all 3030 "Your **output** has been flagged" (the filter judges the drawn picture, not only the words) |
| klein 4B on OpenRouter (Black Forest Labs) | 0/3: "flagged for sexual or adult content", with `safety_tolerance: 5` sent and without |
| Seedream 4.0 on Cloudflare | not tested: Cloudflare's 4.0 takes no reference images (`image_input` refused) → her face would drift |
| Seedream 4.5 on Cloudflare | not tested: 402 "Insufficient balance": third-party models need AI Gateway credits loaded |
| Seedream 4.5 on OpenRouter ($0.04) | **5/9 drawn**. Refused: bra+panties front selfie with "nothing over them", red thong back view, bralette+briefs front selfie, "red lace two-piece set". Drawn: lace bodysuit (chest-up), **black lace bra + panties mirror selfie**, **lace bodysuit back view**, satin babydoll, open silk robe over bralette + briefs |
| Grok Imagine 2.0 on OpenRouter (run 37166907082) | 0/2: "xAI blocked this request through content moderation" (bra + panties mirror shot, bralette front selfie). Cheaper `grok-imagine-image` isn't on OpenRouter (404). Sources say xAI turns its looser mode off when a photo of a person is attached |
| Free SD models on Cloudflare ($0.00 a step; runs 37167454301, 37167543056) | Text-only SDXL-Lightning and DreamShaper: 4/4 came back **black** (Stable Diffusion's own safety checker; no 3030). **SD 1.5 inpainting** over a klein mirror picture (body box redrawn, face left as klein drew it): 3/5 drawn, 2/5 black. Drawn: run 5 two with a leftover shirt collar, a belly and garbled lace (fail); run 6, with the collar masked and a negative prompt, a believable black lace bra mirror selfie with her klein face untouched (**pass**: but slim not curvy, lace tights for panties, the bed turned into a chair inside the box) |
Seedream 4.5, the 5 drawn: face **strong** 5/5 (brows, smile, hair, earrings; skin texture, freckles); outfit exactly as
asked 5/5 (the bodysuit real lace, not the reference's tee); night window black 4/4 where seen, lamp on 5/5; front-camera
selfie true 2/2 (arms toward the lens, no phone); mirror: iPhone + hand visible 3/3, but the back view drew her from
behind *holding the phone at the mirror* (third-person, not a reflection) 1/3; body curvy 2/5 (slim in the bra mirror
shot); room: arched mirror, bed and wood floor kept, but table lamps with fabric shades instead of the black iron lamp.

### Lingerie bench on Workers AI, 2026-10-04 (runs 37168625788, 37168824902, 37168864870; `tools/face/bench.json` `want`)
Owner: "until you get two for each model, with a maximum of 14 attempts each". The same 7 outfits in turn (bra + panties
x3, bralette + briefs, lace bodysuit back view, satin babydoll, robe over bralette); flux-2-dev got her face + the night
bedroom as references, the others (text only) her LOOKS in words. "Drawn" below = real lingerie, judged by eye at full
size: the script's count (any picture not black) said flux-2-dev 2/4 and DreamShaper 2/11 when neither had one.
Cloudflare's real cost (`cf-ai-neurons`): refusals cost nothing on every model. Spent $0.29 in all.
| Model | Lingerie drawn / attempts | Cost a picture | What came back |
|---|---|---|---|
| flux-2-dev (20 steps, 768x1024, 2 refs) | **2/14**, both satin babydolls; bra/panties/bralette 0 | 2,909 neurons = $0.032 (25x klein); $0.13 per usable one | 6 refused (3030 "output flagged": every bra, panties, bralette and robe prompt but one), 8 drawn: 2 babydolls, 2 long-sleeved lace dresses with an open back (for "bodysuit"), 1 in the reference's black tee, 1 in a top and trousers, **2 empty rooms with no woman**. Face **strong** 6/6 (closest yet to the reference); room and night light right 8/8; selfie framing 0/8 (always a third-person photo, never a phone); body slim, not curvy. 10 s |
| lucid-origin (25 steps, 768x1024) | **1/14** | 2,808 neurons = $0.031 | 13 refused before drawing (3030 "Input prompt contains NSFW content"; the prompt that passed failed word for word at attempt 8). The one: black lace bra + panties mirror selfie, iPhone and hand in the arched mirror, hand on hip, lamp and black window: everything asked; a different, older-looking woman (no reference possible), fuller body than asked |
| flux-1-schnell (8 steps, 1024x1024) | **2/9** (stopped at 2) | 326 neurons = $0.0036 | 7 refused before drawing (8007 "NSFW"): only the "bralette and high-waisted briefs" wording passed, 2/2. Both real lace bralette + briefs on her bed at night, arched mirror, curvy; a generic model face with red lipstick, not hers; the phone shown in her hand for a front-camera selfie (rule broken 2/2). Square only. 2 s |
| DreamShaper 8 LCM (free beta) | **0/14** | $0.00 | 11 black (safety checker), 3 dark blurred silhouettes with no visible outfit |

### Cheap text-only lingerie, 2026-10-04 (runs 37170059666, 37170599796; owner: "drop maintaining face for now")
Same 7 outfits in words (her LOOKS, no reference picture), until 2 each, at most 14 attempts; Recraft and Riverflow then
also tried the outfits they hadn't reached. Price = what OpenRouter / Cloudflare billed (`usage.cost`); refusals free.
Spent $0.29. Judged by eye at full size (`docs/LESSONS.md`).
| Model (route) | Real lingerie / attempts | $ a picture | Seen |
|---|---|---|---|
| **Recraft V4.1 Flash** (OpenRouter, text only) | **7/7, 0 refused** | **$0.007**, 2 s | Every outfit as asked, bra + panties and thong included; mirror selfies with the iPhone right, true front-camera selfies, lamp, black window, arched mirror; real phone-photo look (freckles, skin texture); curvy, sometimes plus-size; brows thick. One reflection wrong (her and her reflection don't match, the bodysuit back view). Face changes every picture |
| Seedream 4.5 text-only (OpenRouter) | 2/2, 0 refused | $0.04, 12 s | Best finish (iPhone-photo look, freckles); slim, not curvy; a mirror inside the mirror once. With her face attached it was 5/9 |
| Riverflow 2.5 Fast (OpenRouter) | 4/7 (bralette, robe, lying refused) | $0.020, 12-27 s | Bra + panties black and red, bodysuit back view, babydoll; plus-size with a belly; the babydoll "front selfie" drawn as a mirror pose without a mirror |
| Seedream 5.0 Flash (OpenRouter) | 2/6 (every bra/panties prompt refused) | $0.018, 16 s | Babydoll, robe over bralette + briefs; Lebanese look; **three hands** in the robe picture |
| Krea 2 Medium Turbo (OpenRouter, no 3:4, drew 4:5) | 1/14 | $0.015, 2 s | The bodysuit back view, excellent; 13 refused |
| Phoenix 1.0 (Workers AI) | 1/14 | $0.026, 3 s | Prompt filter (3030) like lucid; the one: white lace bralette lying on the bed, bottoms drawn as a lace skirt, phone in the frame |
| SDXL base 1.0 (Workers AI, free beta) | 3/14 | $0.00, 8 s | 10 black (safety checker), 1 with two women; the 3: glossy "Instagram" look, heavy makeup, no mirror, not night |
| Meta Muse (OpenRouter) | 0/14 | — | every prompt refused by Meta |

### Nano Banana lingerie, 2026-10-04 (runs 37172269285, 37172411100; owner: "Let's test them before judging")
Same 7 outfits. OpenRouter chat completions (`openRouterChat`), price = billed `usage.cost`; refusals free. Spent $0.55.
| Model (route) | Real lingerie / attempts | $ a picture | Seen |
|---|---|---|---|
| Nano Banana (Gemini 2.5 Flash Image), **her face + night bedroom attached** | **0/7** | — | every one refused: IMAGE_PROHIBITED_CONTENT 6, IMAGE_SAFETY 1 (babydoll) |
| Nano Banana 2 (Gemini 3.1 Flash Image), face + room attached | **0/4** | — | IMAGE_OTHER 4/4 |
| Nano Banana on Cloudflare (`google/nano-banana`) | 0/1 | — | 402 "Insufficient balance" (AI Gateway credits) |
| **Nano Banana, text only** | **7/7, 0 refused** | **$0.039**, 7 s | Every outfit as asked (black/red/white bra + panties, bralette + briefs, open-back bodysuit back view, babydoll, robe); curvy hourglass as described; real phone-photo look, iPhones in mirror shots, arched mirror, lamp, black window; the same-looking woman in all 7 (not Reem's face). Slips: "lying on her back" drawn sitting (1), selfie arm visible in front-camera shots (2) |
| Nano Banana 2, text only | 4/4 drawn, 3 as asked | $0.068, 8 s | Rawest phone look, less curvy; red drawn burgundy; a ghost figure in the window once; the bodysuit drawn **with jeans** (tamer) |
| **Nano Banana 2 Lite** (`google/gemini-3.1-flash-lite-image`), text only (run 37173093173) | **7/7, 0 refused** | **$0.034**, 5 s | Every outfit as asked, real phone-photo look, night lamp, arched mirror. A different woman in each (less consistent than Nano Banana); #2 and #5 slimmer than asked; mirror shot #1 with **two phones** (one in each hand); white lace bra semi-sheer (#7); front-camera selfies show the arm (2) |
| Nano Banana 2 Lite, her face attached | **0/4** | $0 | IMAGE_SAFETY 4/4 |

### Voice: aura-2-en + Whisper, 2026-10-04 (run 37172077504, `tools/voice/bench.json`)
4 voices (helena, andromeda, delia, vesta) x 4 of her lines, plain (tags dropped) vs expressive (spoken cues), OGG/Opus.
32/32 clips made, 1-3 s each; 1,892 characters = 5,160 neurons ($0.057, Cloudflare's $0.03/1k exactly); Whisper heard
all 32 from OGG/Opus for 109 neurons ($0.001). Whisper heard: words right 30/32 ("Kumir" for "come here" once, "Yaddy"
for "yaani" once); "habibi" as "heavy bee"/"Khabiby" 2/16 (hint now has habibi); "yaani" as "Yanni" (fine).
Expressive cues performed: "Haha" 4/4 heard, "Mm" 6/8 heard, "Ha!" 4/4; "Hhh..." (sigh) 0/4: silent. No accent choice
(American voices only); the owner judges the sound by ear (samples sent in chat).

### Voice run 2: helena vs andromeda, intimate lines + laugh spellings, 2026-10-04 (run 37173093194)
Owner: "need more explicit samples where they don't robotically say 'ha ha ha'". 24 clips, 2,128 characters = 5,804
neurons ($0.064, 2.73 neurons a character). Whisper heard every intimate line word for word (both voices). Laugh
spellings: "heh" heard as "Heh" 1, "Phew" 1, "Okay" 1, nothing 1 (not a reliable laugh); "hehe" heard as "He?" and
helena's whole line came out with "!" everywhere; "Mm-hmm" not heard (0/2); "Hm..." heard 1/2; "Mm" inside a line
heard 3/4. Bot default since: laughs/giggles dropped, chuckles "hm". The owner judges the sound by ear (4 files sent).

### New reference face (cropped from Nano Banana) on klein at 9:16, 2026-10-04 (face run 37174181550, 15 pictures)
Every shot x tier with the bot's prompts, 576x1024 (stored 450x800), each read at full size. Face: matches the new
reference (brows, eyeliner, full lips, hair) in 13/13 where it shows (#05 is a hand detail; #10, #12 half behind
the phone). 9:16 framing 15/15, phone rule right in the mirror shots. Slips: body drawn slim, not curvy, in 6
(#03, 08, 09, 10, 12, 14); night asked, daylight drawn in #04 and #09 (living room); #13 "23h" on a sunny beach (the
wardrobe item brings its own "Crane Beach, bright sun"); Basbousa orange (#04) and grey (#15), not golden-brown.

### OpenRouter speech models, 2026-10-04 (TTS bench run 37174172123; run 37174069937 listed the models)
21 speech models listed (ids, prices in the run log). 9 voices x 3 intimate lines made and heard by Whisper word for
word: gemini-3.8-flash-tts (Sulafat, Despina; PCM only), grok-voice-tts-1.0 (ara, eve), fish-audio/s2.1-pro,
minimax/speech-2.8-hd (English_captivating_female1), orpheus-3b (tara, leah), deepgram/flux-tts (flux-maeve-en).
Failed: microsoft/mai-voice-2 and qwen-audio-3.0-tts-plus (provider 400, voice names unknown), sesame/csm-1b (needs a
voice). Whisper drops laughs, so laughs are judged by ear only. List prices per 1,000 characters: Orpheus $0.007,
Grok $0.015, Fish $0.015, aura-2 $0.03, MiniMax HD $0.10. 9 files sent to the owner.

### Bangs + softer shoulders: Nano Banana redo and the new face on klein, 2026-10-04 (bench 37175758855, face run 37175866255)
Nano Banana (text only, $0.039, 5 pictures, 0 refused): bangs 5/5 (wispy curtain fringe), a different woman each time as
before; shoulders soft and narrow in the mirror shots (#1, #3, #4), the front selfies show a broad arm in the foreground
(#2, #5). Face source: #5 (large, lit, adult), cropped 460x480 (head, neck, bangs; no clothes). Klein with it, 576x1024,
13 of 15 came back (09 boudoir/mirror-back and 15 never arrived: filter or timeout, not read from the log). Each of the 13
read at full size: bangs in 12 (hidden by phone glare in #12), face the same woman in 11 (#08 and #10 look a little older
and thinner in the face), phone rule right. Slips: body drawn **slim, not curvy** in #03, #08, #10, #12, #14 (the same
6/15 as before; shoulders then look narrow but the hourglass is missing); #13 a beach picture with a bedroom lamp behind
her (the "one-shoulder swimsuit | on Crane Beach" wardrobe item wins over the room); #03 hallway in daylight, #14 night
bedroom drawn as day (asked 19h/10h). Bangs and soft shoulders work; the curvy body is still the open problem (HANDOFF).

### Nano Banana body as klein's second reference, 2026-10-04 (body bench 37176541884, face run 37177960246, 8 of 15 shots)
Body reference: Nano Banana text-only, clothed, face out of frame (3 outfits, $0.12, none refused); the black knit dress
(#01) shows the hourglass best: cropped below the chin to `tools/face/body.jpg` (317x480; `face.js` BODY_JPEG_BASE64).
Klein with face = image 0, body = image 1, place = image 2 (the 15-shot job was refused by the 50,000 day cap, 47,467
used: 8 shots, including the 5 that came slim before). All 8 read at full size: **curvy hourglass 8/8** (was slim in 5 of
13), bangs 8/8, soft narrow shoulders in the mirror shots (#04, #06, #07), face the same woman where visible (3 hidden by
the phone), clothes as asked (the body picture's black dress was not copied: #01 gray tee, #02 gray tee, #03 black shirt
dress, #05 bikini). Slips: #08 asked "boudoir/waist" and got a long black lace dress (klein's filter dodge, known); #05 a
boudoir selfie on a beach from the wardrobe item "string bikini | on Crane Beach" (known); #04 phone covers half the face.

### Prompt review: hips wider than shoulders, soft arms, 2026-10-04 (face run 37178251251, 5 full-body shots)
New REFERENCE wording ("pear-shaped hourglass", "soft, smooth, rounded arms with no visible muscle", "hips and full thighs
clearly wider than her shoulders"), body picture as image 1. All 5 read at full size: bangs 5/5, soft rounded arms and
shoulders 5/5, hips clearly wider than the shoulders in #02 (back view), #01 (jeans) and #05, about equal in #04 (the
oversized tee widens the shoulders), #03 seated (not judgeable). Slips: #05 reads heavy, the waist not defined (belly
under the satin dress) = over-corrected; #04 gray tee dress hides the shape; faces half-hidden by the phone in #01, #04.
One run only; the day cap (50,000 neurons) is nearly spent, so no second round today.

### "Thick arms" wording, 2026-10-04 (face run 37178549177, 6 full-body shots, sent to the owner)
All 6 read at full size. Bangs 6/6; hips clearly wider than the shoulders in #01, #02, #03, #05, a little less in #06 and
#04; arms visibly thicker than before in #01, #02, #03; **#04 the upper arm shows muscle definition** (athletic, not soft:
"no visible muscle" lost to "thick"). Waist: not defined in #04, #05, #06 (a straight tube dress shape, belly line), so
the waist drift seen in the last round is still there. Clothes as asked (#01 black dress + gray cardigan, #02 white shirt).
Day cap raised to 53,000 neurons for this run on the owner's word ("test pictures, let me see now").

### Waist-first + "soft, thick, plush arms", 2026-10-04 (face run 37178697615, same 6 shots and seeds as run 37178549177, sent to the owner)
All 6 read at full size. Same compositions as the previous run (draw.mjs reuses each shot's seed), so the wording's effect
is isolated and **small**: bangs 6/6; hips wider than shoulders 5/6; waist better defined in #06 (side view) and a little
in #01, #03; **not fixed** in #05 (tube dress, belly line) and #04 (romper); **#04 upper arm still shows muscle** (the
body picture's arms and "athletic" romper pose outweigh "no visible muscle"); arms thick in #01-#03. Words move this
less than the body picture does: next try a body reference with plusher arms and a clearer waist (new Nano Banana body),
or per-shot wording ("hand on waist" shots pull the pose toward muscle). Day cap raised to 56,000 for this run (owner: "test it").

### Arms "soft, smooth, feminine, no muscle definition" (no "thick"), 2026-10-04 (face run 37179555469, 6 shots, sent to the owner)
All 6 read at full size; the compositions changed from the last run (the wording moved the draws). Bangs 6/6; hips wider than
shoulders in #01, #05, #06 (#02, #03, #04 hidden by the shirt or the pose); waist clearly defined in #01 (hallway
dress) and #06, fair in #05, weak in #04. Arms: soft in #01, #02, #03, #05; **#04 and #06 (hand on waist, upper arm raised)
still show shoulder/arm tone**, #06 the most: the "one hand on her waist" pose in SHOTS.waist pulls the arm into a flexed
shape. Next: reword that pose ("one hand resting on her hip, arm relaxed") and/or a softer-armed body reference. Day cap
raised to 60,000 for this run (owner: "test again").

### Arms "plush, soft, fleshy" (no muscle definition), 2026-10-04 (face run 37179913178, 6 shots, sent to the owner)
All 6 read at full size (compositions differ again from the last run). Bangs 6/6. Arms soft and fleshy in #01, #02, #04, #05;
#06 (hand on waist, arm raised) is softer than in runs 37178549177/37179555469 but still a little sinewy at the shoulder.
Hips clearly wider than shoulders in #01, #04, #05, #06; waist defined in #01, #04, #06; #05 is the heaviest picture yet
(shapewear-like leggings, waist smaller than hips but the whole body is large). #03 is a wide living-room shot: she is
small in the frame, face not judgeable. Wording works on the arms; the hand-on-waist pose still pulls toward tone.
Day cap raised to 64,000 for this run (owner: "change and test again").

## v11 places and one picture per model (2026-10-05), each read at full size
Places (klein, empty rooms, 3 tries each, run 37260893375 day / 37261146711 night): living 02 kept (plaster, radiator
under the sash window, kitchen table with laptop and shoeboxes; 01 paper litter on the floor, 03 two tables); porch 04
kept (driveway, bins, white van, clapboard houses; all three look one floor up, not three); landing 09 kept (stairs
down, facing doors, bare bulb, tall mirror by her door; 07 no wall mirror). Night: living 02 (01 too orange, 03 too
dark), porch 04 (05/06 lose the street), landing 09.

| Run / pic | Model, shot | Face, body | Phone rule | Room | Light, artifacts | Verdict |
|---|---|---|---|---|---|---|
| 37261302407/01 | klein cozy, living 11h | face + bangs match | arm toward camera, no phone | exact match | ok | pass |
| 37261302407/02 | klein selfie, living 21h night | match | ok | night living, lamp + laptop | ok | pass |
| 37261302407/03 | klein golden, porch 17h | match, eyes down | ok | porch + driveway | golden light | pass |
| 37261302407/04 | klein legs, porch 22h night | match, curvy | framed by someone else, not "from above" | porch | dusk sky at 22h (known, next step 4) | weak |
| 37261302407/05 | klein mirror, landing 10h | match, curvy | iPhone + flash | landing + mirror | ok | pass |
| 37261302407/06 | klein mirror-back, landing 23h night | match | iPhone | night landing, bulb on | side view more than back | pass |
| 37261014675 nano 01 | Nano Banana boudoir mirror, bedroom | not her face (words only), body right, bangs | iPhone | arched mirror, lamp | dusk, not lamp-lit | pass |
| 37261014675 nano 02 | Nano Banana boudoir selfie | as above | no phone; a hand on the bed, 3/4 not chest-up | bedroom | lamp light | pass |
| 37261014675 schnell 01/02 | schnell (backup) golden porch, cozy living | a different woman, no real bangs | ok | neither room matches | square; warped leg (02) | backup only |

Voice (run 37261464781, Sulafat, 4 v11 lines x 3 wordings): Whisper heard every word of the live (light Levantine)
and stronger-accent wordings; the old wording dropped a sentence and said "Whisper" aloud once. "Walaw" heard as
"Voila" in all three. Accent and laughs: the owner's ears (clips on the owner's preview page).

## Lingerie on klein without trigger words (2026-10-05, face run 37263536954), each read at full size
Owner: "without explicitly using words like lingerie or bra or thong ... detailed specific wording". 8 wordings x 2,
boudoir shots in her bedroom, 1,399 neurons. **Refused 4/16** (3030: one try each of d2, d3, d4, d6); **drawn as
described 3/16**; 9 drawn tamer (klein covers her up instead of refusing).

| Pic | Wording (shot) | Drawn | Face, body | Phone | Verdict |
|---|---|---|---|---|---|
| 01, 02 | d1 black lace balconette top + high-cut bottoms (mirror) | black bodycon midi dress with a lace bodice / lace cups | match, bangs | iPhone | tamer |
| 03 | d2 red satin plunge top + tiny bottoms (waist) | red satin slip dress, lace hem | match | iPhone | tamer |
| 05 | d3 white scalloped lace top (neckline, on the bed) | white lace cami + an added black skirt | match, from above | none | half |
| 07 | d4 black satin corset top + bottoms (selfie, cross-legged) | black satin laced corset as a one-piece, legs bare | match, curvy | none | **as asked** |
| 09, 10 | d5 dusty pink lace bandeau + high-waisted bottoms (mirror) | pink lace bandeau + lace shorts (09 long, pajama-like; 10 short, bow) | match | iPhone | tamer / half |
| 11 | d6 open black silk robe over lace triangle top + bottoms (cozy) | exactly that | match, fuller | phone visible though "cozy" says none | **as asked** (phone slip) |
| 13 | d7 strappy lace two-piece + thigh-high stockings (waist) | black bodysuit with lace leg edges + lace-top stockings | match | iPhone | **close** |
| 14 | d7 again | plain black bodysuit + opaque tights; slim, toned arms | body off | iPhone | tamer |
| 15, 16 | d8 short satin babydoll (control) | black satin slip dress, midi with slit / short | match; phone covers half the face | iPhone | tamer |

## The owner's place pictures + lingerie round 2 (2026-10-05, face run 37266040257), each read at full size
Places (owner's pictures, LOOK rewritten to match them): **6/6 rooms right**, day and night.

| Pic | Shot | Face, body | Phone | Room, light | Verdict |
|---|---|---|---|---|---|
| 01 | everyday selfie, kitchen 10h | match | none, mug in hand | kitchen exact (shelves, mugs, window) | pass |
| 02 | flirty waist, bedroom 22h | match | iPhone | night bedroom, lamp on | pass (no hand on waist) |
| 03 | golden, porch 17h | match, curvy | none | porch, railing, chair, can, foliage | pass (no golden light) |
| 04 | cozy, living 21h | match | none | night living room exact | weak: framed by someone else |
| 05 | everyday mirror, hallway 9h | match | iPhone | landing exact (green doors, bulb, mat) | pass (odd shorts under the coat) |
| 06 | close, bathroom 23h | match, laughing | none | bathroom (tiles, round mirror) | pass |

Lingerie round 2 (one-pieces and layers only, no trigger words, 2 tries each): **refused 4/12** (L4 #2, L5 x2, L6 #1);
**as asked 4/12**; half 4/12; tamer 0/12 (round 1: 3/16 as asked, 9 tamer).

| Pic | Wording | Drawn | Verdict |
|---|---|---|---|
| 07, 13 | L1 black satin corset one-piece, kneeling on the bed | the corset, but with black shorts added; phone visible in a "no phone" selfie | half x2 |
| 08 | L2 black lace bodysuit + lace-top stockings (mirror) | exactly that | **as asked** |
| 14 | L2 again | lace-trimmed slip dress + stockings; phone hides the face | half |
| 09 | L3 red satin robe open over a red lace set (waist) | robe tied over the lace top | half |
| 15 | L3 again | robe open over the red lace top and bottoms | **as asked** (phone covers face) |
| 10 | L4 his white shirt open over a black lace set | exactly that (phone visible in a "no phone" selfie) | **as asked** |
| 18 | L6 dusty pink satin-and-lace one-piece (mirror) | exactly that; body slimmer than her reference | **as asked** (body off) |

## Speech-to-text bench (2026-10-05, run 37266123079), every transcript read
Six of his voice notes made by Gemini TTS (male voices) as OGG/Opus. All audio models took OGG directly (no MP3 needed).
Caveat: Gemini made the clips, so Gemini hearing them may be easier than real voice notes.

| Hearer | Words | Arabic | Arabizi clip | Sounds/tone (laugh x3, sigh, whisper) | Time a clip | Cost a minute |
|---|---|---|---|---|---|---|
| Whisper turbo (live) | good | good | "ya Allah", "habibi" | none | 1-6 s | $0.0005 |
| Nova-3 (Workers AI) | good | **Devanagari gibberish** | dropped "ana barra", "khalas" | none | 0.5 s | $0.0052 |
| Gemini 3.5 Flash Lite | good | good | "ya Allah" | laugh 1/3, sigh ok, whisper heard as "sighs", 1 false sigh | 1-1.6 s | ~$0.0015 |
| **Gemini 3.8 Flash** | all right | right | all right (Arabic words in Arabic script), "(annoyed)" | laugh 2/3, sigh ok, whispering ok; 2 false sighs, 1 "gasp" | 3-7 s | ~$0.02 |
| Voxtral Small 24B | good, "wanna" | "حبيبي" for "حبيبتي" | "ana barra" translated to "I'm outside" | "(Exhales)", whispering ok, laughs 0/3 | 0.7 s | ~$0.006 |
| Gemini 3.5 Transcribe | good | good | "ya Allah", dropped "ana barra" | none | 1.2 s | words only |

## Spicier route on Nano Banana, the owner's JSON style with Reem's description (2026-10-05, image bench 37267630601)
4/4 drawn on the first try ($0.16), none refused. Her look in words only (no face picture): bangs, dark wavy hair,
curvy; the face varies a little between pictures, as with every text-only Nano Banana picture.

| Pic | Ask | Drawn | Verdict |
|---|---|---|---|
| 01 | only a plum lace thong, from behind, 23h | from behind, plum lace thong, but a matching bra strap added; arched mirror, radiator, lamp on | pass (not "only") |
| 02 | black balconette bra + high-cut thong, 15h | exactly that, hand on hip, iPhone in the arched mirror | pass |
| 03 | spicier, no outfit named (SPICY_WARDROBE), 22h | black lace bra + lace thong, hand in her hair; drawn in daylight | pass (light wrong at night) |
| 04 | red lace bra + panties, kneeling on the bed, 20h | exactly that, kneeling on the bed | pass |

## Runware, safety check off (2026-10-06, image bench 37395930412, 37396093383, 37396284022), each read at full size
Owner: "test the image models only ... klein 9B with Runware's safety check off, and Z-Image-Turbo ... prompting them for
nudity and/or something explicit"; $0.05 balance. Spent $0.0018 (3 pictures at $0.0006, Runware's own `cost`).
- klein 9B (`runware:400@2`, with her face + body), klein 9B and 4B text only: refused every time with `insufficientCredits`
  (not a content refusal): klein needs a bigger balance. Z-Image-Turbo (`runware:z-image@turbo`): `thirdPartyInsufficientCredits`,
  "External inference tasks require a paid invoice or at least $5 credit". The 4th TwinFlow call: `concurrentRequestLimitExceeded`
  (credits reserved by the call before). Nothing about content was tested on these.
- TwinFlow Z-Image-Turbo (`runware:twinflow-z-image-turbo@0`, text only, 576x1024, 4-35 s): 3 of 3 drawn exactly as asked, no
  filter at all: black lace bra + panties (real lingerie, not a romper); sheer mesh bodysuit with nipples visible; full frontal
  nudity, pubic hair included. Photo-real, natural skin, hands fine, adult face, dark wavy hair with bangs 3/3.
  Misses: the body is slim with a flat stomach 3/3 (asked: 165 cm, 71 kg, softly rounded belly), and the face is another woman
  each time (no reference picture on this route). Topless not drawn (the balance ran out of headroom, not refused).

## TwinFlow Z-Image-Turbo nude pose stress test (2026-10-06, image bench 37400155674), each read at full size
Owner: "different poses and settings ... while maintaining nudity"; 8 asked (4 poses x A = the bible's body words, B = stronger
body words), 6 drawn at $0.0006, 2 not drawn (#03 rear A, #06 bed B: `concurrentRequestLimitExceeded`, the small balance stays
reserved ~40 s; not content). Nudity 6/6 as asked, 0 refused for content. Face: the same-looking woman 6/6 by the owner's eye
and mine (bangs, thick arched brows, freckles, dark wavy hair) with no reference picture; not pixel-identical.
- #01 selfie A, #02 selfie B: nude, but an iPhone in her hand in both (asked: phone out of frame) → the word "selfie" brings the
  phone; reword without it ("taken from her outstretched arm") before using it for plain selfies.
- #04 rear mirror selfie B: nude from behind, looking over her shoulder, iPhone in her raised hand, full-length mirror: as asked.
- #05 in bed A: nude, but on her back seen from above (asked: on her side); warm light.
- #07 /look A: his POV from the pillow, sheet at her hips, bare breasts, sleepy smile, morning light: as asked.
- #08 /look B: on her back from above, no sheet (asked: on her side, sheet to the waist); otherwise right.
- Body: A softer than run 37396284022 but still a narrow waist; B fuller bust and hips, belly still nearly flat. Neither reaches
  "a soft belly with a small pooch": B's words are the better start.

## Fish Audio S2.1 Pro and Qwen3-TTS (2026-10-06, TTS bench 37400423366), heard back by Whisper; judged by ear by the owner
Two lines with [laughs softly], [whispering], [sighs], [teasing], [low and breathy], Arabic words and a Lebanese accent asked.
- fish-or (OpenRouter `fish-audio/s2.1-pro`, default voice, an accent direction in brackets): 2/2, words exact, no [tag] read aloud.
- qwen-design (Runware `alibaba:qwen@3-tts-1.7b-voicedesign`, the voice + accent + emotions described in `positivePrompt`, tags
  stripped): 2/2, words exact, $0.0021 and $0.0019 a clip.
- Not made: Fish on Runware (`thirdPartyInsufficientCredits`, needs $5); Qwen CustomVoice (voice names are lowercase: `serena`).
- Owner's verdict by ear: "The voice samples are worse than what we currently have": Sulafat stays.

## TwinFlow fuller arms (2026-10-06, image bench 37404957788), each read at full size
Owner: "let's try to make her have fuller arms and that's the priority". Nude, 4 arm wordings x 2 poses (standing facing the
camera with the arms away from the body; /look in bed), the stronger body words of run 37400155674. 7 of 8 drawn ($0.0006 each);
#07 (bed, W3) did not come back (balance hold, not content).
- W1 "soft, full, fleshy upper arms with no muscle definition" (#01 standing, #05 bed): slim arms both; no change from before.
- W2 "plump, chubby, soft upper arms, noticeably full and rounded from shoulder to elbow" (#02, #06): a little fuller standing,
  slim in bed.
- W3 "full, heavy, soft upper arms with a little natural arm fat, much wider than her forearms" (#03): clearly fuller upper
  arms, softer belly.
- W4 arms named first ("Photo of a woman with full soft chubby arms: ..."), "a 165 cm, 75 kg soft curvy body with full soft
  chubby arms" (#04 standing, #08 bed): the fullest arms in both poses, a soft belly with a pooch, rounder face, still the same
  woman (bangs, brows). Best match for BMI ~26 so far; arms 2/2.
- Pose slips: in bed she lies on her back seen from above 3/3 (asked: on her side).

## TwinFlow head-to-body proportion (2026-10-06, image bench 37406592599; 37406446356 got one empty answer), each read at full size
Owner: "the head is too small ... adjust the head size to be coherent with the body considering she is 160-165 cm tall".
Measurements used (NHANES-based, BMI 26 at 163 cm): 69 kg, head 22.5 cm chin to crown (about 7 heads tall), shoulders 36 cm,
bust 100 / waist 80 / hips 106 cm, upper arms 31 cm around. W4 arm words kept. 8/8 drawn, $0.0048.
My check: shoulder width / head height (real ~1.6; run 37404957788 #04 was ~1.8, the small head the owner saw), rough pixels.
- P1 words "her head is naturally sized for her body, about one seventh of her height, with full soft cheeks and a soft rounded
  jawline that match her weight" (#01 standing ~1.5, #05 bed): head in scale, arms full, belly soft; in bed on her SIDE as asked.
- P2 the measurements (#02 ~1.65, #06 bed on her back): head in scale, arms full.
- P3 measurements + "eye level, two metres, 50 mm lens" (#03 ~1.8, #07 bed on her side): the head smallest of the four standing.
- P4 all + "a little fuller face" (#04 ~1.7, #08 bed on her back): rounder face, head in scale, arms full.
- Best: P1 (and P4 close); the lens words did not help. All 8 the same woman (bangs, brows, freckles).
- Owner's verdict: proportions good in #01, #02, #05, #07, not in #03, #04, #06, #08 → P1 2/2, P2 1/2, P3 1/2, P4 0/2
  (the fuller-face line shrinks the head again); both bad bed shots are on her back seen from above, both good ones on her side.

## TwinFlow P1 wording across the bot's poses (2026-10-06, image bench 37411203576), each read at full size
P1 head words + W4 arms, nude, 2 each; no on-her-back views; the front shot without the word "selfie". 8/8 drawn, $0.0048.
- Front from her own arm (#01, #02): no phone 2/2 (fixed: "selfie" was the cause); head in scale 2/2; arms full; #01 hair
  swept back without bangs.
- Rear mirror selfie (#03, #04): iPhone in her raised hand, looking over her shoulder, head in scale, full arms, round hips 2/2.
- In bed (#05, #06): reclining half on her side, head in scale in #05; #06 head a little small (camera a bit above her).
- /look (#07, #08): on her side, full arms, soft belly; no sheet at her hips 0/2 (asked); #08 seen from above, head borderline.
- My count: head in scale 6/8 clearly, 2 borderline (#06, #08: both the camera above her); owner to judge.

## FLUX.2 klein on Runware with her face (2026-10-06, image bench 37434273611 and 37434510898), each read at full size
Owner: "Test Flux now". Safety check off, nude, P1 head words, the 4 poses at her eye level. klein 9B $0.00078, 4B $0.0006
a picture, ~3 s each, 0 refused in 16. Her face from `tools/face/reference.jpg` 16/16 (bangs, freckles, the reference's
features): the first route that draws Reem herself while nude. Proportions natural, arms full, real phone-photo look.
- Round 1, face + body picture (`tools/face/body.jpg`), "naked": the body picture's gray tank + black leggings leaked in.
  4B: dressed 4/4. 9B: dressed 1, tank + bare bottom 1, tank + bare hips 1, nude under a sheet showing nothing 1.
- Round 2, 9B, "completely naked: no tank top, no leggings, no bra, no underwear, no clothing of any kind; bare breasts with
  visible nipples": A (face only) nude 4/4; B (face + body, "only the body shape of image 1, ignore her gray tank top and black
  leggings") nude 4/4. Same seeds, so A and B look alike; B keeps her body picture's shape.
- Per pose: front from her arm 2/2 no phone; rear mirror selfie 2/2 iPhone in hand, bare back and bottom; bed on her side 2/2
  (a reflected figure in the dark window, #03 both); /look 2/2 bare breasts, eyes closed, duvet over her hips.

## klein 9B, slimmer hourglass body (2026-10-06, image bench 37437301547)
Owner: "She's too fat. I want her body and proportions to be similar to those in attached pictures" (5 pictures: hourglass,
full bust, defined waist, nearly flat belly, wide hips, full thighs, soft full upper arms; about BMI 24). Planned: A = face +
hourglass words (163 cm, 64 kg), B = face + the owner's faceless bodysuit picture as image 1 (`tools/face/body-owner.jpg`).
Only A #01 was drawn: Runware billed it **$0.0907 and 111 s** (the same route was $0.00078 and 3 s an hour earlier), and the
$0.02 cap stopped the run. #01: her face, nude, no phone; the waist a little more defined but the belly still soft and round:
words alone don't reach the owner's pictures. B not drawn. The bench now stops when one picture bills over 5x its list price.

## Hourglass body + realistic anatomy (2026-10-06, image bench 37438811067 and 37439133800), each read at full size
Owner: body like the 5 attached pictures (hourglass, ~BMI 24) and "her nipples look unrealistic". NAKED now describes real anatomy
(soft brown areolas with texture, uneven, natural sag, creases under the breasts).
- 37438811067, klein 9B + the owner's bodysuit picture (image 1): nude 3/4, beige bra + panties leaked 1/4; hourglass much closer,
  belly a little soft; nipples natural in #04. TwinFlow with the same words: 4/4 nude, the hourglass closest to the owner's pictures,
  nipples smoother; not her face.
- 37439133800, klein 9B: the bodysuit picture with the beige clothes named → leaked 3/4 (worse); a faceless nude hourglass body cropped
  from TwinFlow #02 (`tools/face/body-hourglass.jpg`) → nude 3/3 (1 not returned), her face, hourglass, nipples natural (darker
  textured areolas, uneven: b2-01, b2-04). Picked as `RUNWARE.BODY` "hourglass".

## The bot's own code on Runware (2026-10-06, image bench 37439717378, `worker_draw`), each read at full size
worker.js `composePicture` + `drawPicture` on the real API (PICTURE.ROUTE set, a ledger): 6/6 drawn by the intended model at
$0.00078 (klein) / $0.0006 (TwinFlow), $0.0043 in all; the owner's place pictures came through as image 2 (her bedroom, the hallway).
- runware-klein #01 nude selfie: her face, hourglass, natural nipples, her bedroom; framed to the thighs (asked chest-up).
- #02 red lace bra + panties, mirror: real lingerie (no FILTER_WORDS); the iPhone covers her face.
- #03 everyday: black turtleneck + jeans in the hallway, laughing, her face: clothed pictures unchanged.
- #04 nude from behind, hallway mirror: as asked; the band across her back is a natural skin fold (owner: "good and realistic"), not a top.
- runware-twinflow #05 nude: slimmer, another face (no face picture); #06 red lace set in the hallway mirror, as asked.

## /pic through the bot's own code (2026-10-06, image bench 37441418759, `worker_draw` shot "custom"), each read at full size
`customPicture` + `drawPicture(custom: true)` on runware-klein, 4/4 drawn ($0.0031). Her face 4/4 while the hair changed as asked 4/4.
- high sleek ponytail, red lipstick, winged eyeliner, black satin slip dress, at the counter in her kitchen (her place picture): as asked;
  "low angle" came out near eye level.
- messy bun, no makeup, oversized gray hoodie, couch with tea, her living room: as asked; "close-up from above" drawn as a medium shot.
- short wavy bob, pink gloss, white linen sundress, beach at sunset, from behind looking back: as asked.
- two loose braids, smoky eyes, naked, kneeling: nude, braids; kneeling on the rug by her bed (asked: on her bed).

## MiniMax Turbo vs HD vs Sulafat, Arabic words in Arabic script (2026-10-06, tts bench 37541102035)
Owner: "test the turbo with the Arabic script". 3 new lines (ولو, حبيبي, يعني, يلا, خلص in Arabic script, the rest English); 9/9 clips made.
MiniMax Turbo (`minimax/speech-2.8-turbo` on OpenRouter, $0.06/1k list) and HD (`minimax:speech@2.8` on Runware, billed $0.0136-0.0153 a
line, ~$0.10/1k), both Arabic_CalmWoman; Sulafat as live. Runware's model search lists only `minimax:speech@2.8` for speech (no Turbo).
Whisper heard every English word on all 9 (Sulafat: "Hosepian court release" once); the Arabic words came back as Yaani/Yala/Yalla,
"Hulus" (Turbo), "Chalas" (HD), "Khalas" (Sulafat), ولو as "Well, oh" / "Walo" / "Well-o". Whisper writes habibi either way: whether
ح is said is for the owner's ear. Clips sent in chat.

## bge-m3 scores for her replies (2026-10-06, recall-check run on Workers AI)
Same story in other words: napkin receipt 0.709, taxes "a suggestion"/"optional" 0.877, the radiator banging 0.898, mama
calling about marriage 0.752. Different replies: 0.473-0.629. `RECALL.REPEAT_SCORE` 0.68 separates all 9 (0.9 missed all 4).

