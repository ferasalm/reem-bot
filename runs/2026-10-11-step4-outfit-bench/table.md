# Step 4 outfit bench (Haiku's read)

Built by Haiku 5.5 (the session that made the Step 4 build); read by the same session at full size. Tool: tools/face/outfit-bench.mjs (the bot's own picture code, the seeds, $0.20 cap).
Total: 39 pictures, $0.10166 by the bench's sum (balance $14.6699 -> $14.56408 = $0.10582; $0.00416 not in the bench's sum).

Refs confirm the plan on every run: outfit pictures are image 1 with no fourth image; back views use body-v10-back; none-mode runs have no body picture.
Name note: the rust body and the rust outfit picture are the same bytes, so the harness shows the rust body as `style:outfit-rust-halter`.

| run | file | refs (order) | read | body / reference |
|---|---|---|---|---|
| outfit-turtleneck-rust-s101 | pictures/outfit-turtleneck-rust-s101.jpg | face-2x, style:outfit-rust-halter, place:bedroom~1 | worn as named; no nudity; face the same; no halter in the picture | rust body (BODY_CLOTHED) as image 1, REFERENCE_CLOTHED |
| outfit-turtleneck-none-s101 | pictures/outfit-turtleneck-none-s101.jpg | face-2x, place:bedroom~1 | worn as named; no nudity; face the same; no halter in the picture | no body picture, REFERENCE_NOBODY |
| outfit-burgundy-rust-s101 | pictures/outfit-burgundy-rust-s101.jpg | face-2x, style:outfit-rust-halter, place:living~3 | worn as named; no nudity; face the same; no halter in the picture | rust body (BODY_CLOTHED) as image 1, REFERENCE_CLOTHED |
| outfit-burgundy-none-s101 | pictures/outfit-burgundy-none-s101.jpg | face-2x, place:living~3 | worn as named; no nudity; face the same; no halter in the picture | no body picture, REFERENCE_NOBODY |
| outfit-hoodie-rust-s101 | pictures/outfit-hoodie-rust-s101.jpg | face-2x, style:outfit-rust-halter, place:bedroom~2 | worn as named; no nudity; face the same; no halter in the picture | rust body (BODY_CLOTHED) as image 1, REFERENCE_CLOTHED |
| outfit-hoodie-none-s101 | pictures/outfit-hoodie-none-s101.jpg | face-2x, place:bedroom~2 | worn as named; no nudity; face the same; no halter in the picture | no body picture, REFERENCE_NOBODY |
| outfit-linen-rust-s101 | pictures/outfit-linen-rust-s101.jpg | face-2x, style:outfit-rust-halter, place:living~2 | worn as named; no nudity; face the same; no halter in the picture | rust body (BODY_CLOTHED) as image 1, REFERENCE_CLOTHED |
| outfit-linen-none-s101 | pictures/outfit-linen-none-s101.jpg | face-2x, place:living~2 | worn as named; no nudity; face the same; no halter in the picture | no body picture, REFERENCE_NOBODY |
| outfit-silk-rust-s101 | pictures/outfit-silk-rust-s101.jpg | face-2x, style:outfit-rust-halter, place:bedroom~1 | worn as named; no nudity; face the same; no halter in the picture | rust body (BODY_CLOTHED) as image 1, REFERENCE_CLOTHED |
| outfit-silk-none-s101 | pictures/outfit-silk-none-s101.jpg | face-2x, place:bedroom~1 | worn as named; no nudity; face the same; no halter in the picture | no body picture, REFERENCE_NOBODY |
| outfit-breton-rust-s101 | pictures/outfit-breton-rust-s101.jpg | face-2x, style:outfit-rust-halter, place:living~3 | named Breton, but a sleeveless striped tank: the rust body's top shape leaked (seed 101 only; 202 is a short-sleeve tee). Suspect | rust body (BODY_CLOTHED) as image 1, REFERENCE_CLOTHED |
| outfit-breton-none-s101 | pictures/outfit-breton-none-s101.jpg | face-2x, place:living~3 | worn as named; no nudity; face the same; no halter in the picture | no body picture, REFERENCE_NOBODY |
| picture-outfit-olive-cardigan-picture-s101 | pictures/picture-outfit-olive-cardigan-picture-s101.jpg | face-2x, style:outfit-olive-cardigan, place:living~1 | worn as named; the outfit's own picture is image 1, no fourth image (refs) | OUTFIT_BODY, REFERENCE_OUTFIT |
| picture-outfit-camel-coat-picture-s101 | pictures/picture-outfit-camel-coat-picture-s101.jpg | face-2x, style:outfit-camel-coat, place:living~3 | worn as named; the outfit's own picture is image 1, no fourth image (refs) | OUTFIT_BODY, REFERENCE_OUTFIT |
| picture-outfit-gray-shirt-lace-picture-s101 | pictures/picture-outfit-gray-shirt-lace-picture-s101.jpg | face-2x, style:outfit-gray-shirt-lace, place:living~3 | worn as named; the outfit's own picture is image 1, no fourth image (refs) | OUTFIT_BODY, REFERENCE_OUTFIT |
| picture-outfit-rust-halter-picture-s101 | pictures/picture-outfit-rust-halter-picture-s101.jpg | face-2x, style:outfit-rust-halter, place:living~2 | worn as named; the outfit's own picture is image 1, no fourth image (refs) | OUTFIT_BODY, REFERENCE_OUTFIT |
| back-belfie-bedroom-back-s101 | pictures/back-belfie-bedroom-back-s101.jpg | face-2x, body-v10-back, place:bedroom~2 | back body, no breasts in front; mirror or not as asked | BODY_BACK, REFERENCE_BACK, NAKED_BACK (NUDE_BACK_WORDS) |
| back-over-shoulder-back-s101 | pictures/back-over-shoulder-back-s101.jpg | face-2x, body-v10-back | back body, no breasts in front; mirror or not as asked | BODY_BACK, REFERENCE_BACK, NAKED_BACK (NUDE_BACK_WORDS) |
| back-mirror-tier-back-s101 | pictures/back-mirror-tier-back-s101.jpg | face-2x, body-v10-back, place:bedroom~1, style:hair-bun-bangs | back body, no breasts in front; mirror or not as asked | BODY_BACK, REFERENCE_BACK, NAKED_BACK (NUDE_BACK_WORDS) |
| back-bent-over-back-s101 | pictures/back-bent-over-back-s101.jpg | face-2x, body-v10-back, place:bedroom~3 | back body, no breasts in front; mirror or not as asked | BODY_BACK, REFERENCE_BACK, NAKED_BACK (NUDE_BACK_WORDS) |
| regress-nude-mirror-rust-s101 | pictures/regress-nude-mirror-rust-s101.jpg | face-2x, body-v10, place:bedroom~2 | head in scale (level gaze), full bust, bush as NAKED says; no lead for the Step 3 head fault | front body v10 |
| outfit-turtleneck-rust-s202 | pictures/outfit-turtleneck-rust-s202.jpg | face-2x, style:outfit-rust-halter, place:bedroom~2, style:hair-long-bangs | worn as named; no nudity; face the same; no halter in the picture | rust body (BODY_CLOTHED) as image 1, REFERENCE_CLOTHED |
| outfit-turtleneck-none-s202 | pictures/outfit-turtleneck-none-s202.jpg | face-2x, place:bedroom~2, style:hair-long-bangs | worn as named; no nudity; face the same; no halter in the picture | no body picture, REFERENCE_NOBODY |
| outfit-burgundy-rust-s202 | pictures/outfit-burgundy-rust-s202.jpg | face-2x, style:outfit-rust-halter, place:living~1 | worn as named; no nudity; face the same; no halter in the picture | rust body (BODY_CLOTHED) as image 1, REFERENCE_CLOTHED |
| outfit-burgundy-none-s202 | pictures/outfit-burgundy-none-s202.jpg | face-2x, place:living~1 | worn as named; no nudity; face the same; no halter in the picture | no body picture, REFERENCE_NOBODY |
| outfit-hoodie-rust-s202 | pictures/outfit-hoodie-rust-s202.jpg | face-2x, style:outfit-rust-halter, place:bedroom~2 | worn as named; no nudity; face the same; no halter in the picture | rust body (BODY_CLOTHED) as image 1, REFERENCE_CLOTHED |
| outfit-hoodie-none-s202 | pictures/outfit-hoodie-none-s202.jpg | face-2x, place:bedroom~2 | worn as named; no nudity; face the same; no halter in the picture | no body picture, REFERENCE_NOBODY |
| outfit-linen-rust-s202 | pictures/outfit-linen-rust-s202.jpg | face-2x, style:outfit-rust-halter, place:living~1 | worn as named; no nudity; face the same; no halter in the picture | rust body (BODY_CLOTHED) as image 1, REFERENCE_CLOTHED |
| outfit-linen-none-s202 | pictures/outfit-linen-none-s202.jpg | face-2x, place:living~1 | worn as named; no nudity; face the same; no halter in the picture | no body picture, REFERENCE_NOBODY |
| outfit-silk-rust-s202 | pictures/outfit-silk-rust-s202.jpg | face-2x, style:outfit-rust-halter, place:bedroom~1 | worn as named; no nudity; face the same; no halter in the picture | rust body (BODY_CLOTHED) as image 1, REFERENCE_CLOTHED |
| outfit-silk-none-s202 | pictures/outfit-silk-none-s202.jpg | face-2x, place:bedroom~1 | worn as named; no nudity; face the same; no halter in the picture | no body picture, REFERENCE_NOBODY |
| outfit-breton-rust-s202 | pictures/outfit-breton-rust-s202.jpg | face-2x, style:outfit-rust-halter, place:living~1 | worn as named; no nudity; face the same; no halter in the picture | rust body (BODY_CLOTHED) as image 1, REFERENCE_CLOTHED |
| outfit-breton-none-s202 | pictures/outfit-breton-none-s202.jpg | face-2x, place:living~1 | worn as named; no nudity; face the same; no halter in the picture | no body picture, REFERENCE_NOBODY |
| picture-outfit-olive-cardigan-picture-s202 | pictures/picture-outfit-olive-cardigan-picture-s202.jpg | face-2x, style:outfit-olive-cardigan, place:living~2 | worn as named; the outfit's own picture is image 1, no fourth image (refs) | OUTFIT_BODY, REFERENCE_OUTFIT |
| picture-outfit-camel-coat-picture-s202 | pictures/picture-outfit-camel-coat-picture-s202.jpg | face-2x, style:outfit-camel-coat, place:living~2 | worn as named; the outfit's own picture is image 1, no fourth image (refs) | OUTFIT_BODY, REFERENCE_OUTFIT |
| picture-outfit-gray-shirt-lace-picture-s202 | pictures/picture-outfit-gray-shirt-lace-picture-s202.jpg | face-2x, style:outfit-gray-shirt-lace, place:living~1 | worn as named; the outfit's own picture is image 1, no fourth image (refs) | OUTFIT_BODY, REFERENCE_OUTFIT |
| picture-outfit-rust-halter-picture-s202 | pictures/picture-outfit-rust-halter-picture-s202.jpg | face-2x, style:outfit-rust-halter, place:living~2 | worn as named; the outfit's own picture is image 1, no fourth image (refs) | OUTFIT_BODY, REFERENCE_OUTFIT |
| regress-nude-mirror-rust-s202 | pictures/regress-nude-mirror-rust-s202.jpg | face-2x, body-v10, place:bedroom~2, style:hair-long-waves | head in scale (level gaze), full bust, bush as NAKED says; no lead for the Step 3 head fault | front body v10 |
| regress-doggy-rust-s202 | pictures/regress-doggy-rust-s202.jpg | face-2x, body-v10-back | doggy from behind: anus above the shaft's entry (zoom crop: anus visible, shaft in the vulva) | act: no Flux 4 Play; BODY_BACK |

Checks: `zoom-doggy-s202.jpg` (crop 340x300 at +440+540, doubled): anus above the entry, shaft in the vulva. Sheets: `sheet-outfits.png` (24 outfits), `sheet-rest.png` (15 others), each tile labelled.

Not measured: likeness (judged by eye, same face in all 39), build vs v10 (judged by eye: no slimmer picture), CLOTHED_BODY pick (the bench gives the reads; Opus decides).
