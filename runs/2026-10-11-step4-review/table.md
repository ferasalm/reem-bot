# Step 4 review bench (Opus's read)

Reviewed by Opus (session_01SS9jTukEt8oHbi6CVAE3Ni, model read with `get_session`); the Step 4 build and bench were Haiku's
(session_01TtxHDLcufHAr8WtgC8sPXj, `runs/2026-10-11-step4-outfit-bench/`). Every picture below read at full size, side by side with the
same seed's rust and none pictures from Haiku's bench (the `sheet-q-*` files: RUST | NONE | NUDE | NEUTRAL at seed 101).
Tool: `node tools/face/outfit-bench.mjs --run <dir> --review` (BUDGET_USD=0.085). Spend: neutral candidates $0.00988 + bench $0.04446;
Runware balance $14.56408 → $14.50883 ($0.05525). Step 4 in all: $0.10166 + $0.05525 = $0.15691 of $0.20.

## The neutral reference (CLOTHED_BODY "neutral")
klein 9B, image 0 = body-nude.jpg (v10), InstaPic 1.0 + Real HD 2K 1.0, 768x1344, steps 8, CFG 1, the WORKPLAN prompt, seeds 401-404.
| seed | read |
|---|---|
| 401 | same build as v10; faint nipple points through the knit (chest crop) |
| 402 | same build, bust fuller than the rust picture's; no nipples (chest crop). **Picked**: tools/face/body-neutral.jpg (576x1008) |
| 403 | nipples show through |
| 404 | nipples show through |

## Seed 101, the four modes (6 outfits)
| outfit | rust (Haiku) | none (Haiku) | nude | neutral |
|---|---|---|---|---|
| turtleneck + jeans | as named | as named | as named, bust a little fuller | as named |
| burgundy dress + coat | as named | as named | as named | as named |
| hoodie + crop tank | as named (crop asked) | as named | as named, bust fuller; faint nipple outline | as named |
| white linen set | top cropped short | as named | as named (square neck), arms and bust fullest; faint nipple outline | **scoop neck** (the tank's) |
| red silk blouse | **cropped: midriff shows** | as named; a stray red cuff on the forearm | as named | as named |
| Breton + jeans | **sleeveless crop** | short-sleeve tee | short-sleeve tee, fullest bust | **scoop-neck tank** (the tank's) |
No nudity or see-through in any; face the same woman in all 24 (by eye). Hair: brown highlights at seed 101 turtleneck and Breton in
every mode (not a mode effect; the face reference is jet black).

## Seed 303, the leak again (Breton, silk)
| outfit | rust | none | neutral |
|---|---|---|---|
| Breton + jeans | **sleeveless crop, midriff** | sleeveless, full length | **scoop-neck tank** |
| red silk blouse | as named | as named | as named |
"Sleeveless" also comes with none (klein's reading of "Breton top"); the crop length comes only with rust (Breton s101, s303; silk s101).

## Verdict
Klein copies the garment of a clothed image 1: the rust halter's crop length (3 pictures) and the neutral tank's scoop neck (3). With
no body picture, 0 of 18 leaked, and the build is not slimmer than rust (the owner's "slimmer at seed 101" came with the cropped
tops and the rust picture's smaller bust). `CLOTHED_BODY` = **none**. Nude mode gave the fullest build (v10's) and 6/6 dressed, but
on one seed and without the boudoir tier, /nsfw Off or a scene with no clothes named: an option for the owner, not the default.
