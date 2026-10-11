# Step 3 review: root-cause tests (Opus, 2026-10-11)

Review of the Step 3 bench built by Haiku (`runs/2026-10-11-step3-lora-bench/`). Same harness as `tools/face/lora-bench.mjs`
(the bot's own picture code, Runware seed = the run's seed, Math.random seeded per case), copied as `diag.mjs` with two additions:
a test can swap a reference picture (`swap`) or a CONFIG key (`cfg`). Test lists: `t1.json`-`t4.json`. All V0 (today's four realism LoRAs).
Spend: $0.03666 by the bot's sum (13 pictures); Runware balance $14.70565 → $14.66990 ($0.03575).

| Picture | What changed | Read (Opus, full size) |
|---|---|---|
| nude-bedroom-mirror-V0-s101-control | nothing (the bench's picture again) | Same picture as the bench: the seed reproduces. Head too large, narrow shoulders. |
| nude-bedroom-mirror-V0-s101-face1x | BIG_FACE off (the 480 px face) | Same large head. **BIG_FACE ruled out.** |
| nude-bedroom-mirror-V0-s101-levelgaze | gaze "looking up at the camera through her lashes" → "looking straight into the lens" | Head in scale, shoulders wider, body longer. **Cause: that gaze puts the camera above her.** |
| nude-bedroom-mirror-V0-s101-fixed | the fix in code (the gaze out of GAZES; this seed now draws "looking away toward the window") | Head in scale, like seed 202. |
| act-doggy-V0-s202-frontbody | image 1 = the front body instead of the standing back | Same picture as the bench. **The back body ruled out.** |
| act-doggy-V0-s202-nobelly | "belly" out of POV_MAN | Same picture. **Ruled out.** |
| act-doggy-V0-s202-noflux | Flux 4 Play off (Unchained 0.8 + General Penis instead) | Anus visible above the entry, shaft in the vulva; black hair, her face closer. **Cause: Flux 4 Play's doggy (d0gg13): it drew the man lying down and her torso upright (a reverse cowgirl), the cleft closed.** |
| act-doggy-V0-s101-noflux | the same at seed 101 | Anus visible above the entry; correct. |
| act-doggy-V0-s202-fixed / s101-fixed | the fix in code (no Flux 4 Play on doggy, d0gg13 out of the scene) | Both: anus above the entry, shaft in the vulva, his hands on her buttocks, her face closer than the bench's. |
| act-blowjob-V0-s101-nopovdt | Holding Deepthroat POV off | Arms still reach forward and read slim; bust a little fuller. |
| act-blowjob-V0-s101-nounchained | Unchained off (povdt alone) | Bust and upper arms fuller, closer to image 1, but the penis is out of her mouth (tongue out): the act fails. |
| act-blowjob-V0-s101-unchained05 | Unchained 0.5 | Same as the bench (slim forearms reaching forward). Not a fix. |

Not confirmed: the blowjob arms. Ruled out: image 1 (body-v10 is the owner's picture 6 cropped, arms unchanged), BIG_FACE (same face
on the nude test), Unchained at 0.5. Seen: at seed 101 her arms are stretched forward to his thighs and seen from above (the POV
camera); Unchained at 0.8 pulls the bust and arms smaller than image 1, but without it the act fails. One seed each: a lead for a later bench.
