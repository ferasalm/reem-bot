# Body audit, the pictures (fix round, 2026-10-11; Haiku 5.5)

Drawn by `tools/face/body-audit.mjs` through the bot's own picture code: klein 9B on Runware, 768x1344, `checkContent` as the bot
sends it (on for Off only), Math.random seeded per case. Every picture was opened alone at full size (V0, all ten), and each row was
read side by side (`rows/`). **Nothing here was measured in pixels.** Waist, bust, arms and "slimmer" are visual judgements at full size;
where a value cannot be seen (the coat hides the waist), the cell says so. No variant is picked as the winner (Opus decides).

Spend: `$0.08684` of the `$0.12` cap (34 pictures; the cap was not reached). Runware `account` before: today 0.69888 credits over 263
requests; after: today 0.78572 over 297 (+34); the difference is the bench's $0.08684.

| Case | Seed | V0 HEAD (as committed) | V1 OUTFIT_BODY off | V2 897dfaf LoRAs | V3 no realism LoRAs |
|---|---|---|---|---|---|
| mirror-tank-jeans ("a mirror selfie, standing, full body, a fitted black tank top and high-waisted jeans, her arms visible") | 101 | Black fitted tank, high-waisted light-blue jeans as named; nothing bare below the waist. Frame ends at the knees (not full length). Bust shape under the tank, no nipple showing. Upper arms look full; not measured. | not run (no outfit) | As V0, with a band of skin between the tank hem and the jeans; same framing. | A different room and pose; the torso reads narrower at the waist than V0 (judged). Tank and jeans as named. |
| mirror-tank-jeans | 202 | As named; the torso and arms read slimmer than V0 at s101 (judged; seed variance). Frame ends at the knees. No bare skin below the waist. | not run | As V0; the bust reads a little fuller; a band of skin above the jeans. | A window-lit room and a high ponytail; the torso reads fuller at the bust than V0 (judged). Tank and jeans as named. |
| outfit-olive-cardigan ("on the couch, wearing: a fitted olive ribbed cami and soft olive cotton shorts under a long, open cream chunky-knit cardigan") | 101 | Olive ribbed cami, olive shorts, open cream cardigan as named. Seated; thighs bare below the shorts (normal for shorts). Bust shape under the cami; the waist is fitted; arms in the cardigan sleeves. | Olive cami and shorts as named; body width as V0 (judged). The nude front is image 1 here and the picture is dressed. | As V0; the hair differs. | As V0 (same outfit). |
| outfit-olive-cardigan | 202 | As named; seated with knees apart; thighs bare below the shorts; bust under the cami. | As named; body width as V0 (judged). | As named; softer hair. | As named; arms down, a different pose. |
| outfit-camel-coat ("on the couch, wearing: a long camel wool coat open over a black turtleneck and charcoal trousers, a cream chunky-knit scarf around her neck") | 101 | Camel coat open over a black turtleneck, cream scarf, charcoal trousers; no bare skin. The coat hides the waist and arms (not measurable). | As named (coat, turtleneck, scarf, trousers); the same cover. | As V0. | As V0. |
| outfit-camel-coat | 202 | Coat, turtleneck, scarf as named; charcoal trousers at the lower frame; no bare skin. Waist and arms hidden. | As named. | As named; the coat more open. | As named; the coat open and the lap covered; no bare skin. |
| row13-cardigan-cami ("her father's old gray cardigan over a black cami, in the kitchen", no bottom named) | 101 | Gray cardigan open, black cami, light-blue jeans from the waist down: the bottom is clothed. Standing in a kitchen, frame to the upper thighs. | not run (no outfit) | Jeans as V0; the cardigan and cami as named. | Jeans as V0; the cardigan and cami as named. |
| row13-cardigan-cami | 202 | Gray cardigan, black cami, cuffed denim shorts: the bottom is clothed (shorts, one of the bottoms the line lists); bare legs below the hem, as for shorts. Full-length standing. | not run | Denim shorts as V0. | Denim below the waist; the frame ends above the hem, so the length can't be read. |
| naked-standing-mirror ("naked, standing, a mirror selfie in the bedroom mirror"; explicit: proportions only) | 101 | Nude mirror selfie in a bedroom. Waist defined against the bust and hips; full bust; arms in proportion. Frame to the upper thighs. | not run (no outfit) | Same proportions as V0. | Same proportions; the frame a little wider. |
| naked-standing-mirror | 202 | Nude mirror selfie in a bedroom. The waist reads narrower than at s101 (judged); full bust; arms in proportion. | not run | Same proportions as V0; the bust similar. | Same proportions as V0. |

## Runs (`results.json`: refs, LoRAs and cost per picture)

| Run | Refs sent (in order) | LoRAs | Cost |
|---|---|---|---|
| mirror-tank-jeans V0 (s101, s202) | face-2x, body-v10 | instapic 0.6, realhd2kc 0.5 | $0.0025 each |
| outfit-olive-cardigan V0 | face-2x, style:outfit-olive-cardigan, place | instapic 0.6, realhd2kc 0.5 | $0.0025 each |
| outfit-camel-coat V0 | face-2x, style:outfit-camel-coat, place | instapic 0.6, realhd2kc 0.5 | $0.0025 each |
| row13-cardigan-cami V0 | face-2x, body-v10, place:kitchen | instapic 0.6, realhd2kc 0.5 | $0.0025 each |
| naked-standing-mirror V0 | face-2x, body-v10, place:bedroom | instapic 0.6, realhd2kc 0.5, unchained 0.8 | $0.0025 each |
| outfit-* V1 (4 pictures) | face-2x, body-v10, place, style | instapic 0.6, realhd2kc 0.5 | $0.0034 each |
| V2 (10 pictures) | as V0 | phone2025 0.6, ultrareal5 0.6, instapic 0.6, realhd2kc 0.5 (+ unchained 0.8 on the naked case) | $0.0025 each |
| V3 (10 pictures) | as V0 | none (unchained 0.8 on the naked case) | $0.0025 each (one at $0.0017) |

The extra reference (the outfit picture as a fourth image) is what costs more: $0.0034 against $0.0025.

## Notes for the reader (Opus)

- **The bench does not isolate `DRESSED_BOTTOM`.** Every row-13 picture in every column has the bottom clothed, but the line is in all
  of them. The owner's naked-lower-half report came from code before this round's commit; no run here has the line left out. Testing
  it would need a variant with `DRESSED_BOTTOM` empty (about $0.01 for the two seeds; not in this spec, not run).
- **Seed variance is larger than the variant differences** in several rows: s202 reads slimmer than s101 in both the clothed mirror and
  the naked mirror, with the same words and references. Any body judgement needs more than two seeds.
- **V1 (the nude front plus the outfit picture) came out dressed as named in all four outfit pictures** (the cami and shorts, the
  coat, the turtleneck, the trousers). So the nude image 1 is not, by itself, a leak on these two outfits.
- **V2 shortens the tank** on the mirror case: the hem ends above the waistband, leaving a band of skin above the jeans, on both seeds
  (checked alone at full size for seed 202). A visible difference from V0, not a body measurement.
- **V3 moves the composition** (room, pose, hair) more than the body: the body comparisons across columns are rough.
- Nothing picks a winner. The body settings stay as committed (`BODY`, `CLOTHED_BODY`, `OUTFIT_BODY`, the LoRA set); any change is
  Opus's call after this read.
