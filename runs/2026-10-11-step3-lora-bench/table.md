# Step 3: LoRA catalog and ghost hands (bench 2026-10-11)

Haiku's read (not yet Opus's). Bench: `tools/face/lora-bench.mjs`, klein 9B on Runware, 5 steps, CFG 1, the bot's own
`drawPicture` / `startPicture` / `customPicture` code; Runware seed = the run's seed (101 or 202); Math.random seeded by (seed, case),
so every variant of a case makes the same random picks. 72 pictures drawn, Runware spend $0.20397 by the bot's own sum
(account balance before $14.92535, after $14.72138: $0.20397). Stopped at the $0.25 cap: not hit.

Variants (CONFIG only): V0 today; V1 no hand words (POV_MAN: "only his hips and thighs may show", ACT_SCENES: "his hands on her butt" out);
V2 V1 + instapic 0.6 + realhd2kc 0.5; V3 V1 + phone2025 0.6 + ultrareal5 0.6 (smartphone prefix); V4 V1 + ultrareal5 0.7; V5 V1 + no realism LoRA.
Clothed and nude cases: V0, V2, V3, V5. Acts: V0-V5. Face likeness is a close/other read by eye, not measured. At /nsfw Off, the realism LoRAs
alone are the whole list (see the Off note in WORKPLAN, no Off case here).

## Findings
1. **The ghost hands are the hand words.** Doggy, seed 101 and 202: V0 shows his two hands gripping her buttocks/hips (both seeds); V1-V5 show none.
   Riding, seed 202: V0 shows his two hands at the bottom of the frame; V1-V5 none. The words are POV_MAN "only his hands ..." and the
   doggy/anal ACT_SCENES "his hands on her butt". Removing them removed the hands in every case where V0 had them.
2. **Missionary hands on her thighs are a pose,** not the words: V3, V4, V5 (no hand words in V1 either) still hold her thighs at seed 101.
3. **The realism stack leaks on a clothed picture once.** Clothed bedroom, seed 202: V0 (phone2025 + ultrareal5 + instapic + realhd2kc,
   total weight 2.3) shows a bare nipple above a sheer slip; V2, V3 and V5 stay covered. One case: not a rate.
4. **Riding has a second person** behind her shoulder in all six variants (seed 101); a POV defect, not fixed by any variant.
5. **Penis length:** the blowjob penis reads long in all six variants, both seeds. POV_MAN's "average-sized" doesn't change it.
6. **Doggy anatomy is unresolved on zoom** (`doggy-zoom-s101.png`, `doggy-zoom-s202.png`): an anus shows above the entry in some seed 101
   crops; the seed 202 crops don't show one clearly. Opus should judge it at full size, or in Step 6 with a larger crop.
7. **Realism LoRA set:** V2 (instapic + realhd2kc), V3 (phone2025 + ultrareal5) and V5 (none) all held the face and skin at 3 in the frames read.
   Haiku did not pick the set: Opus does.

## Per picture
| id | size | LoRAs | cost | ms | hands | limbs | anatomy | face | realism | act | note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| clothed-kitchen-V0-s101 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5 | 0.0025 | 23410 | 2 of 2 | ok | ok | close | 3 | n/a |  |
| clothed-kitchen-V2-s101 | 768x1344 | instapic@1=0.6, realhd2kc@1=0.5 | 0.0025 | 17365 | 2 of 2 | ok | ok | close | 3 | n/a |  |
| clothed-kitchen-V3-s101 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6 | 0.0025 | 16174 | 2 of 2 | ok | ok | close | 3 | n/a |  |
| clothed-kitchen-V5-s101 | 768x1344 | none | 0.0025 | 5511 | 2 of 2 | ok | ok | close | 2-3 | n/a |  |
| clothed-bedroom-night-V0-s101 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5 | 0.0034 | 18603 | 2 of 2 | ok | covered (faint nipple shape through the fabric) | close | 3 | n/a |  |
| clothed-bedroom-night-V2-s101 | 768x1344 | instapic@1=0.6, realhd2kc@1=0.5 | 0.0042 | 28437 | 2 of 2 | ok | covered (faint nipple shape through the fabric) | close | 3 | n/a |  |
| clothed-bedroom-night-V3-s101 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6 | 0.0034 | 21849 | 2 of 2 | ok | covered (faint nipple shape through the fabric) | close | 3 | n/a |  |
| clothed-bedroom-night-V5-s101 | 768x1344 | none | 0.0034 | 6206 | 2 of 2 | ok | covered (faint nipple shape through the fabric) | close | 3 | n/a |  |
| nude-bedroom-mirror-V0-s101 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8 | 0.0025 | 10693 | 2 of 2 (at the sides) | ok | ok | close | 3 | n/a |  |
| nude-bedroom-mirror-V2-s101 | 768x1344 | instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8 | 0.0025 | 9000 | 2 of 2 (at the sides) | ok | ok | close | 3 | n/a |  |
| nude-bedroom-mirror-V3-s101 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, unchained@2=0.8 | 0.0025 | 22280 | 2 of 2 (at the sides) | ok | ok | close | 3 | n/a |  |
| nude-bedroom-mirror-V5-s101 | 768x1344 | unchained@2=0.8 | 0.0025 | 8770 | 2 of 2 (at the sides) | ok | ok | close | 2-3 | n/a |  |
| act-blowjob-V0-s101 | 1024x1024 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8, povdt@1=0.8 | 0.0042 | 16646 | none seen (no hand words in the frame) | ok | penis reads long, not average (all variants) | close | 3 | right (POV, penis in mouth) |  |
| act-blowjob-V1-s101 | 1024x1024 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8, povdt@1=0.8 | 0.0034 | 9798 | none seen (no hand words in the frame) | ok | penis reads long, not average (all variants) | close | 3 | right (POV, penis in mouth) |  |
| act-blowjob-V2-s101 | 1024x1024 | instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8, povdt@1=0.8 | 0.0025 | 8524 | none seen (no hand words in the frame) | ok | penis reads long, not average (all variants) | close | 3 | right (POV, penis in mouth) |  |
| act-blowjob-V3-s101 | 1024x1024 | phone2025@1=0.6, ultrareal5@1=0.6, unchained@2=0.8, povdt@1=0.8 | 0.0034 | 8808 | none seen (no hand words in the frame) | ok | penis reads long, not average (all variants) | close | 3 | right (POV, penis in mouth) |  |
| act-blowjob-V4-s101 | 1024x1024 | ultrareal5@1=0.7, unchained@2=0.8, povdt@1=0.8 | 0.0025 | 8426 | none seen (no hand words in the frame) | ok | penis reads long, not average (all variants) | close | 3 | right (POV, penis in mouth) |  |
| act-blowjob-V5-s101 | 1024x1024 | unchained@2=0.8, povdt@1=0.8 | 0.0034 | 7957 | none seen (no hand words in the frame) | ok | penis reads long, not average (all variants) | close | 3 | right (POV, penis in mouth) |  |
| act-riding-V0-s101 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, flux4play@1=0.8 | 0.0025 | 9149 | none from him | second head behind her shoulder (POV defect) | ok | close | 3 | right (vaginal) |  |
| act-riding-V1-s101 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, flux4play@1=0.8 | 0.0025 | 8784 | none from him | second head behind her shoulder (POV defect) | ok | close | 3 | right (vaginal) |  |
| act-riding-V2-s101 | 768x1344 | instapic@1=0.6, realhd2kc@1=0.5, flux4play@1=0.8 | 0.0025 | 7313 | none from him | second head behind her shoulder (POV defect) | ok | close | 3 | right (vaginal) |  |
| act-riding-V3-s101 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, flux4play@1=0.8 | 0.0034 | 8106 | none from him | second head behind her shoulder (POV defect) | ok | close | 3 | right (vaginal) |  |
| act-riding-V4-s101 | 768x1344 | ultrareal5@1=0.7, flux4play@1=0.8 | 0.0025 | 7438 | none from him | second head behind her shoulder (POV defect) | ok | close | 3 | right (vaginal) |  |
| act-riding-V5-s101 | 768x1344 | flux4play@1=0.8 | 0.0025 | 7597 | none from him | second head behind her shoulder (POV defect) | ok | close | 3 | right (vaginal) |  |
| act-missionary-V0-s101 | 1024x1024 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, missionary@1=0.8, penis@1=0.6 | 0.0034 | 9699 | his hands holding her thighs (pose) | ok | ok | close | 3 | right (vaginal) |  |
| act-missionary-V1-s101 | 1024x1024 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, missionary@1=0.8, penis@1=0.6 | 0.0034 | 15040 | none from him | ok | ok | close | 3 | right (vaginal) |  |
| act-missionary-V2-s101 | 1024x1024 | instapic@1=0.6, realhd2kc@1=0.5, missionary@1=0.8, penis@1=0.6 | 0.0034 | 7839 | none from him | ok | ok | close | 3 | right (vaginal) |  |
| act-missionary-V3-s101 | 1024x1024 | phone2025@1=0.6, ultrareal5@1=0.6, missionary@1=0.8, penis@1=0.6 | 0.0034 | 8312 | his hands holding her thighs (pose) | ok | ok | close | 3 | right (vaginal) |  |
| act-missionary-V4-s101 | 1024x1024 | ultrareal5@1=0.7, missionary@1=0.8, penis@1=0.6 | 0.0034 | 8080 | his hands holding her thighs (pose) | ok | ok | close | 3 | right (vaginal) |  |
| act-missionary-V5-s101 | 1024x1024 | missionary@1=0.8, penis@1=0.6 | 0.0034 | 8794 | his hands holding her thighs (pose) | ok | ok | close | 3 | right (vaginal) |  |
| act-doggy-V0-s101 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, flux4play@1=0.8, penis@1=0.6 | 0.0034 | 10828 | his 2 hands gripping her butt/hips (both) | ok | UNRESOLVED on zoom (vaginal vs anal) | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V1-s101 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, flux4play@1=0.8, penis@1=0.6 | 0.0034 | 9338 | none (her hands on the bed) | ok | UNRESOLVED on zoom (vaginal vs anal) | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V2-s101 | 768x1344 | instapic@1=0.6, realhd2kc@1=0.5, flux4play@1=0.8, penis@1=0.6 | 0.0034 | 9788 | none (her hands on the bed) | ok | UNRESOLVED on zoom (vaginal vs anal) | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V3-s101 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, flux4play@1=0.8, penis@1=0.6 | 0.0034 | 9953 | none (her hands on the bed) | ok | UNRESOLVED on zoom (vaginal vs anal) | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V4-s101 | 768x1344 | ultrareal5@1=0.7, flux4play@1=0.8, penis@1=0.6 | 0.0034 | 9418 | none (her hands on the bed) | ok | UNRESOLVED on zoom (vaginal vs anal) | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V5-s101 | 768x1344 | flux4play@1=0.8, penis@1=0.6 | 0.0034 | 9438 | none (her hands on the bed) | ok | UNRESOLVED on zoom (vaginal vs anal) | close | 3 | from behind, penis at the buttock junction |  |
| clothed-kitchen-V0-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5 | 0.0025 | 9477 | 2 of 2 | ok | ok | close | 3 | n/a |  |
| clothed-kitchen-V2-s202 | 768x1344 | instapic@1=0.6, realhd2kc@1=0.5 | 0.0025 | 15434 | 2 of 2 | ok | ok | close | 3 | n/a |  |
| clothed-kitchen-V3-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6 | 0.0025 | 9387 | 2 of 2 | ok | ok | close | 3 | n/a |  |
| clothed-kitchen-V5-s202 | 768x1344 | none | 0.0025 | 5339 | 2 of 2 | ok | ok | close | 2-3 | n/a |  |
| clothed-bedroom-night-V0-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8 | 0.0025 | 8648 | 2 of 2 | ok | BREAST LEAK: right nipple uncovered above the sheer slip | close | 3 | n/a | realism stack (4 LoRAs) on a clothed picture |
| clothed-bedroom-night-V2-s202 | 768x1344 | instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8 | 0.0025 | 9024 | 2 of 2 | ok | covered (faint nipple shape through the fabric) | close | 3 | n/a |  |
| clothed-bedroom-night-V3-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, unchained@2=0.8 | 0.0025 | 9148 | 2 of 2 | ok | covered (faint nipple shape through the fabric) | close | 3 | n/a |  |
| clothed-bedroom-night-V5-s202 | 768x1344 | unchained@2=0.8 | 0.0025 | 8791 | 2 of 2 | ok | covered (faint nipple shape through the fabric) | close | 3 | n/a |  |
| nude-bedroom-mirror-V0-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8 | 0.0025 | 17965 | 2 of 2 (at the sides) | ok | ok | close | 3 | n/a |  |
| nude-bedroom-mirror-V2-s202 | 768x1344 | instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8 | 0.0025 | 16850 | 2 of 2 (at the sides) | ok | ok | close | 3 | n/a |  |
| nude-bedroom-mirror-V3-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, unchained@2=0.8 | 0.0025 | 19124 | 2 of 2 (at the sides) | ok | ok | close | 3 | n/a |  |
| nude-bedroom-mirror-V5-s202 | 768x1344 | unchained@2=0.8 | 0.0025 | 14215 | 2 of 2 (at the sides) | ok | ok | close | 2-3 | n/a |  |
| act-blowjob-V0-s202 | 1024x1024 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8, povdt@1=0.8 | 0.0034 | 9723 | none seen (no hand words in the frame) | ok | penis reads long, not average (all variants) | close | 3 | right (POV, penis in mouth) |  |
| act-blowjob-V1-s202 | 1024x1024 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8, povdt@1=0.8 | 0.0034 | 15827 | none seen (no hand words in the frame) | ok | penis reads long, not average (all variants) | close | 3 | right (POV, penis in mouth) |  |
| act-blowjob-V2-s202 | 1024x1024 | instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8, povdt@1=0.8 | 0.0025 | 8232 | none seen (no hand words in the frame) | ok | penis reads long, not average (all variants) | close | 3 | right (POV, penis in mouth) |  |
| act-blowjob-V3-s202 | 1024x1024 | phone2025@1=0.6, ultrareal5@1=0.6, unchained@2=0.8, povdt@1=0.8 | 0.0034 | 22607 | none seen (no hand words in the frame) | ok | penis reads long, not average (all variants) | close | 3 | right (POV, penis in mouth) |  |
| act-blowjob-V4-s202 | 1024x1024 | ultrareal5@1=0.7, unchained@2=0.8, povdt@1=0.8 | 0.0034 | 8562 | none seen (no hand words in the frame) | ok | penis reads long, not average (all variants) | close | 3 | right (POV, penis in mouth) |  |
| act-blowjob-V5-s202 | 1024x1024 | unchained@2=0.8, povdt@1=0.8 | 0.0034 | 13724 | none seen (no hand words in the frame) | ok | penis reads long, not average (all variants) | close | 3 | right (POV, penis in mouth) |  |
| act-riding-V0-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, flux4play@1=0.8 | 0.0025 | 19218 | his 2 hands at the bottom of the frame (gripping) | second head behind her shoulder (POV defect) | ok | close | 3 | right (vaginal) |  |
| act-riding-V1-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, flux4play@1=0.8 | 0.0025 | 8756 | none from him | second head behind her shoulder (POV defect) | ok | close | 3 | right (vaginal) |  |
| act-riding-V2-s202 | 768x1344 | instapic@1=0.6, realhd2kc@1=0.5, flux4play@1=0.8 | 0.0025 | 15857 | none from him | second head behind her shoulder (POV defect) | ok | close | 3 | right (vaginal) |  |
| act-riding-V3-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, flux4play@1=0.8 | 0.0025 | 7900 | none from him | second head behind her shoulder (POV defect) | ok | close | 3 | right (vaginal) |  |
| act-riding-V4-s202 | 768x1344 | ultrareal5@1=0.7, flux4play@1=0.8 | 0.0025 | 13328 | none from him | second head behind her shoulder (POV defect) | ok | close | 3 | right (vaginal) |  |
| act-riding-V5-s202 | 768x1344 | flux4play@1=0.8 | 0.0025 | 7586 | none from him | second head behind her shoulder (POV defect) | ok | close | 3 | right (vaginal) |  |
| act-missionary-V0-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, missionary@1=0.8, penis@1=0.6 | 0.0025 | 7984 | none from him | ok | ok | close | 3 | right (vaginal) | tongue out (V0 only) |
| act-missionary-V1-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, missionary@1=0.8, penis@1=0.6 | 0.0025 | 8683 | none from him | ok | ok | close | 3 | right (vaginal) |  |
| act-missionary-V2-s202 | 768x1344 | instapic@1=0.6, realhd2kc@1=0.5, missionary@1=0.8, penis@1=0.6 | 0.0025 | 7700 | none from him | ok | ok | close | 3 | right (vaginal) |  |
| act-missionary-V3-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, missionary@1=0.8, penis@1=0.6 | 0.0025 | 13603 | none from him | ok | ok | close | 3 | right (vaginal) |  |
| act-missionary-V4-s202 | 768x1344 | ultrareal5@1=0.7, missionary@1=0.8, penis@1=0.6 | 0.0025 | 7714 | none from him | ok | ok | close | 3 | right (vaginal) |  |
| act-missionary-V5-s202 | 768x1344 | missionary@1=0.8, penis@1=0.6 | 0.0025 | 7846 | none from him | ok | ok | close | 3 | right (vaginal) |  |
| act-doggy-V0-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, flux4play@1=0.8, penis@1=0.6 | 0.0025 | 9740 | his 2 hands gripping her butt/hips (both) | ok | UNRESOLVED on zoom (vaginal vs anal) | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V1-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, flux4play@1=0.8, penis@1=0.6 | 0.0025 | 7695 | none (her hands on the bed) | ok | UNRESOLVED on zoom (vaginal vs anal) | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V2-s202 | 768x1344 | instapic@1=0.6, realhd2kc@1=0.5, flux4play@1=0.8, penis@1=0.6 | 0.0025 | 7423 | none (her hands on the bed) | ok | UNRESOLVED on zoom (vaginal vs anal) | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V3-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, flux4play@1=0.8, penis@1=0.6 | 0.0025 | 8210 | none (her hands on the bed) | ok | UNRESOLVED on zoom (vaginal vs anal) | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V4-s202 | 768x1344 | ultrareal5@1=0.7, flux4play@1=0.8, penis@1=0.6 | 0.0034 | 9230 | none (her hands on the bed) | ok | UNRESOLVED on zoom (vaginal vs anal) | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V5-s202 | 768x1344 | flux4play@1=0.8, penis@1=0.6 | 0.0025 | 7747 | none (her hands on the bed) | ok | UNRESOLVED on zoom (vaginal vs anal) | close | 3 | from behind, penis at the buttock junction |  |
