# Step 3: LoRA catalog and ghost hands (bench 2026-10-11)

Bench read, corrected by the owner where marked (owner reads override the bench read). Not yet Opus's review. Bench: `tools/face/lora-bench.mjs`, klein 9B on Runware, 5 steps, CFG 1, the bot's own
`drawPicture` / `startPicture` / `customPicture` code; Runware seed = the run's seed (101 or 202); Math.random seeded by (seed, case),
so every variant of a case makes the same random picks. 72 pictures drawn, Runware spend $0.20397 by the bot's own sum
(account balance before $14.92535, after $14.72138: $0.20397). Stopped at the $0.25 cap: not hit.

Variants (CONFIG only): V0 today; V1 no hand words (POV_MAN: "only his hips and thighs may show", ACT_SCENES: "his hands on her butt" out);
V2 V1 + instapic 0.6 + realhd2kc 0.5; V3 V1 + phone2025 0.6 + ultrareal5 0.6 (smartphone prefix); V4 V1 + ultrareal5 0.7; V5 V1 + no realism LoRA.
Clothed and nude cases: V0, V2, V3, V5. Acts: V0-V5. Face likeness is a close/other read by eye, not measured. At /nsfw Off, the realism LoRAs
alone are the whole list (see the Off note in WORKPLAN, no Off case here).

## Findings (corrected by the owner, 2026-10-11)
1. **Nude mirror, seed 101:** the head is disproportionately large for the body (owner; all variants at this seed). Seed 202 is fine. The
   bench read had missed it. Leads for the review to double-check (not findings): BIG_FACE sends the 2x face on every face picture; the head-size line ("her head is
   naturally sized for her body, about one seventh of her height") is in LOOKS only, which her face pictures never use.
2. **Blowjob, seed 101:** the upper arms are slimmer than they should be (owner). The sent prompt says "full upper arms" (REFERENCE), so the
   words do not hold them. Lead: image 1 (body-v10) or the POV camera. Not confirmed.
3. **Doggy, seeds 101 and 202: no ghost hands.** His two hands on her buttocks/hips at V0 are correct and undeformed (owner). The bench read
   called them ghost hands and tied them to the hand words: that is withdrawn. Doggy does not need the V1 wording change for the hands.
4. **Doggy, seed 202: no anus visible** above the entry in any variant (owner; zoom agrees). Seed 101 frames show one in some variants.
   Vaginal vs anal stays unresolved on the zoom crops.
5. Riding, seed 202 V0: his hands at the bottom of the frame (bench read; the owner has not checked it). Riding seed 101: a second head behind her.
6. The realism stack (four LoRAs, 2.3) showed one bare nipple on a clothed picture (seed 202 V0). One case, not a rate.
7. Missionary: his hands on her thighs (seed 101, V0, V3-V5) are a pose. Blowjob penis reads long in all variants.

The review finds the root causes and fixes them in code, not with prompt words that may leak (owner, 2026-10-11). No code was changed for these.

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
| nude-bedroom-mirror-V0-s101 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8 | 0.0025 | 10693 | 2 of 2 (at the sides) | ok | HEAD DISPROPORTIONATELY LARGE for the body (owner read; the bench read missed it) | close | 3 | n/a | no head-size words reach her-face pictures (LOOKS only) |
| nude-bedroom-mirror-V2-s101 | 768x1344 | instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8 | 0.0025 | 9000 | 2 of 2 (at the sides) | ok | HEAD DISPROPORTIONATELY LARGE for the body (owner read; the bench read missed it) | close | 3 | n/a | no head-size words reach her-face pictures (LOOKS only) |
| nude-bedroom-mirror-V3-s101 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, unchained@2=0.8 | 0.0025 | 22280 | 2 of 2 (at the sides) | ok | HEAD DISPROPORTIONATELY LARGE for the body (owner read; the bench read missed it) | close | 3 | n/a | no head-size words reach her-face pictures (LOOKS only) |
| nude-bedroom-mirror-V5-s101 | 768x1344 | unchained@2=0.8 | 0.0025 | 8770 | 2 of 2 (at the sides) | ok | HEAD DISPROPORTIONATELY LARGE for the body (owner read; the bench read missed it) | close | 3 | n/a | no head-size words reach her-face pictures (LOOKS only) |
| act-blowjob-V0-s101 | 1024x1024 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8, povdt@1=0.8 | 0.0042 | 16646 | none seen | ok | UPPER ARMS SLIMMER than they should be (owner read); penis reads long | close | 3 | right (POV, penis in mouth) | the sent prompt says full upper arms (REFERENCE): the words do not hold them |
| act-blowjob-V1-s101 | 1024x1024 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8, povdt@1=0.8 | 0.0034 | 9798 | none seen | ok | UPPER ARMS SLIMMER than they should be (owner read); penis reads long | close | 3 | right (POV, penis in mouth) | the sent prompt says full upper arms (REFERENCE): the words do not hold them |
| act-blowjob-V2-s101 | 1024x1024 | instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8, povdt@1=0.8 | 0.0025 | 8524 | none seen | ok | UPPER ARMS SLIMMER than they should be (owner read); penis reads long | close | 3 | right (POV, penis in mouth) | the sent prompt says full upper arms (REFERENCE): the words do not hold them |
| act-blowjob-V3-s101 | 1024x1024 | phone2025@1=0.6, ultrareal5@1=0.6, unchained@2=0.8, povdt@1=0.8 | 0.0034 | 8808 | none seen | ok | UPPER ARMS SLIMMER than they should be (owner read); penis reads long | close | 3 | right (POV, penis in mouth) | the sent prompt says full upper arms (REFERENCE): the words do not hold them |
| act-blowjob-V4-s101 | 1024x1024 | ultrareal5@1=0.7, unchained@2=0.8, povdt@1=0.8 | 0.0025 | 8426 | none seen | ok | UPPER ARMS SLIMMER than they should be (owner read); penis reads long | close | 3 | right (POV, penis in mouth) | the sent prompt says full upper arms (REFERENCE): the words do not hold them |
| act-blowjob-V5-s101 | 1024x1024 | unchained@2=0.8, povdt@1=0.8 | 0.0034 | 7957 | none seen | ok | UPPER ARMS SLIMMER than they should be (owner read); penis reads long | close | 3 | right (POV, penis in mouth) | the sent prompt says full upper arms (REFERENCE): the words do not hold them |
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
| act-doggy-V0-s101 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, flux4play@1=0.8, penis@1=0.6 | 0.0034 | 10828 | his 2 hands on her butt/hips: correct, no deformation (owner) | ok | anus visible above the entry in some frames; vaginal vs anal UNRESOLVED on zoom | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V1-s101 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, flux4play@1=0.8, penis@1=0.6 | 0.0034 | 9338 | her hands on the bed; no hands of his on her | ok | anus visible above the entry in some frames; vaginal vs anal UNRESOLVED on zoom | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V2-s101 | 768x1344 | instapic@1=0.6, realhd2kc@1=0.5, flux4play@1=0.8, penis@1=0.6 | 0.0034 | 9788 | her hands on the bed; no hands of his on her | ok | anus visible above the entry in some frames; vaginal vs anal UNRESOLVED on zoom | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V3-s101 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, flux4play@1=0.8, penis@1=0.6 | 0.0034 | 9953 | her hands on the bed; no hands of his on her | ok | anus visible above the entry in some frames; vaginal vs anal UNRESOLVED on zoom | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V4-s101 | 768x1344 | ultrareal5@1=0.7, flux4play@1=0.8, penis@1=0.6 | 0.0034 | 9418 | her hands on the bed; no hands of his on her | ok | anus visible above the entry in some frames; vaginal vs anal UNRESOLVED on zoom | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V5-s101 | 768x1344 | flux4play@1=0.8, penis@1=0.6 | 0.0034 | 9438 | her hands on the bed; no hands of his on her | ok | anus visible above the entry in some frames; vaginal vs anal UNRESOLVED on zoom | close | 3 | from behind, penis at the buttock junction |  |
| clothed-kitchen-V0-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5 | 0.0025 | 9477 | 2 of 2 | ok | ok | close | 3 | n/a |  |
| clothed-kitchen-V2-s202 | 768x1344 | instapic@1=0.6, realhd2kc@1=0.5 | 0.0025 | 15434 | 2 of 2 | ok | ok | close | 3 | n/a |  |
| clothed-kitchen-V3-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6 | 0.0025 | 9387 | 2 of 2 | ok | ok | close | 3 | n/a |  |
| clothed-kitchen-V5-s202 | 768x1344 | none | 0.0025 | 5339 | 2 of 2 | ok | ok | close | 2-3 | n/a |  |
| clothed-bedroom-night-V0-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8 | 0.0025 | 8648 | 2 of 2 | ok | BREAST LEAK: right nipple uncovered above the sheer slip | close | 3 | n/a | realism stack (4 LoRAs) on a clothed picture |
| clothed-bedroom-night-V2-s202 | 768x1344 | instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8 | 0.0025 | 9024 | 2 of 2 | ok | covered (faint nipple shape through the fabric) | close | 3 | n/a |  |
| clothed-bedroom-night-V3-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, unchained@2=0.8 | 0.0025 | 9148 | 2 of 2 | ok | covered (faint nipple shape through the fabric) | close | 3 | n/a |  |
| clothed-bedroom-night-V5-s202 | 768x1344 | unchained@2=0.8 | 0.0025 | 8791 | 2 of 2 | ok | covered (faint nipple shape through the fabric) | close | 3 | n/a |  |
| nude-bedroom-mirror-V0-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8 | 0.0025 | 17965 | 2 of 2 (at the sides) | ok | ok (owner) | close | 3 | n/a |  |
| nude-bedroom-mirror-V2-s202 | 768x1344 | instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8 | 0.0025 | 16850 | 2 of 2 (at the sides) | ok | ok (owner) | close | 3 | n/a |  |
| nude-bedroom-mirror-V3-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, unchained@2=0.8 | 0.0025 | 19124 | 2 of 2 (at the sides) | ok | ok (owner) | close | 3 | n/a |  |
| nude-bedroom-mirror-V5-s202 | 768x1344 | unchained@2=0.8 | 0.0025 | 14215 | 2 of 2 (at the sides) | ok | ok (owner) | close | 2-3 | n/a |  |
| act-blowjob-V0-s202 | 1024x1024 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8, povdt@1=0.8 | 0.0034 | 9723 | none seen | ok | penis reads long, not average | close | 3 | right (POV, penis in mouth) |  |
| act-blowjob-V1-s202 | 1024x1024 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8, povdt@1=0.8 | 0.0034 | 15827 | none seen | ok | penis reads long, not average | close | 3 | right (POV, penis in mouth) |  |
| act-blowjob-V2-s202 | 1024x1024 | instapic@1=0.6, realhd2kc@1=0.5, unchained@2=0.8, povdt@1=0.8 | 0.0025 | 8232 | none seen | ok | penis reads long, not average | close | 3 | right (POV, penis in mouth) |  |
| act-blowjob-V3-s202 | 1024x1024 | phone2025@1=0.6, ultrareal5@1=0.6, unchained@2=0.8, povdt@1=0.8 | 0.0034 | 22607 | none seen | ok | penis reads long, not average | close | 3 | right (POV, penis in mouth) |  |
| act-blowjob-V4-s202 | 1024x1024 | ultrareal5@1=0.7, unchained@2=0.8, povdt@1=0.8 | 0.0034 | 8562 | none seen | ok | penis reads long, not average | close | 3 | right (POV, penis in mouth) |  |
| act-blowjob-V5-s202 | 1024x1024 | unchained@2=0.8, povdt@1=0.8 | 0.0034 | 13724 | none seen | ok | penis reads long, not average | close | 3 | right (POV, penis in mouth) |  |
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
| act-doggy-V0-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, flux4play@1=0.8, penis@1=0.6 | 0.0025 | 9740 | his 2 hands on her butt/hips: correct, no deformation (owner) | ok | NO ANUS VISIBLE above the entry (owner; zoom agrees) | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V1-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, instapic@1=0.6, realhd2kc@1=0.5, flux4play@1=0.8, penis@1=0.6 | 0.0025 | 7695 | her hands on the bed; no hands of his on her | ok | NO ANUS VISIBLE above the entry (owner; zoom agrees) | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V2-s202 | 768x1344 | instapic@1=0.6, realhd2kc@1=0.5, flux4play@1=0.8, penis@1=0.6 | 0.0025 | 7423 | her hands on the bed; no hands of his on her | ok | NO ANUS VISIBLE above the entry (owner; zoom agrees) | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V3-s202 | 768x1344 | phone2025@1=0.6, ultrareal5@1=0.6, flux4play@1=0.8, penis@1=0.6 | 0.0025 | 8210 | her hands on the bed; no hands of his on her | ok | NO ANUS VISIBLE above the entry (owner; zoom agrees) | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V4-s202 | 768x1344 | ultrareal5@1=0.7, flux4play@1=0.8, penis@1=0.6 | 0.0034 | 9230 | her hands on the bed; no hands of his on her | ok | NO ANUS VISIBLE above the entry (owner; zoom agrees) | close | 3 | from behind, penis at the buttock junction |  |
| act-doggy-V5-s202 | 768x1344 | flux4play@1=0.8, penis@1=0.6 | 0.0025 | 7747 | her hands on the bed; no hands of his on her | ok | NO ANUS VISIBLE above the entry (owner; zoom agrees) | close | 3 | from behind, penis at the buttock junction |  |
