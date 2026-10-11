# Step 5 bench: partly dressed and close-ups (Opus's read)

Built, run and read by Opus (session_01AmUQa9XtUpc3EGRs7ctq3K, model read with `get_session`) in the chat meant for Haiku's Step 5.
Tool: `NODE_USE_ENV_PROXY=1 node tools/face/partial-bench.mjs --run <dir>` (24), then `--framing` (12), then `--redraw` (4).
Spend (the bench's sums): $0.05928 + $0.02340 + $0.00676 = $0.08944 of $0.10. klein 9B, steps 5, CFG 1, InstaPic 0.6 + Real HD 2K 0.5,
Unchained XXX off (PARTIAL_LORAS_OFF). Every picture read at full size; the vulva on a zoom crop (`sheets/zoom-*.jpg`).
Variants: `nude-pd08/06/off` = BODY_PARTIAL "nude" with PussyDiffusion 0.8 / 0.6 / off; `none-pd06` = no body picture, 0.6.
P3 and P4 name no PussyDiffusion words (it never loads there): `nude` / `none` only.

## The first 24 (9:16, her face as image 0)
| picture | what I saw |
|---|---|
| p1 nude-pd08 s101 | white tee on, nipple points through it; framed from her lips to the crotch; legs spread, thick bush, real labia (zoom) |
| p1 nude-pd06 s101 | the same picture as 0.8 almost line for line; real, hairy vulva (zoom); nipple points |
| p1 nude-pdoff s101 | tee on, nipples fainter; chin at the top; legs closer, only the bush, no vulva (zoom: a fold) |
| p1 none-pd06 s101 | tee on, nipple points; lips to crotch; real, hairy vulva (zoom) |
| p1 nude-pd08 s202 | tee on, clear nipple points; nose and lips at the top; dappled light; real, hairy vulva |
| p1 nude-pd06 s202 | as 0.8; real, hairy vulva |
| p1 nude-pdoff s202 | tee on; legs closer; the bush, the vulva hidden (a dark glossy spot on the zoom) |
| p1 none-pd06 s202 | tee on, nipple points; real, hairy vulva |
| p2 nude-pd08 s101 | **fully naked, breasts bare**: image 1 copied (standing, plain wall, its crop from the lips to the thighs) |
| p2 nude-pd06 s101 | **the same: breasts bare** |
| p2 nude-pdoff s101 | **the same: breasts bare** |
| p2 none-pd06 s101 | breasts covered by a beige crop tank klein added, nipple points through it; lips to thighs; thick bush, a faint slit |
| p2 nude-pd08 s202 | **fully naked, breasts bare**, image 1's pose and crop |
| p2 nude-pd06 s202 | **breasts bare** |
| p2 nude-pdoff s202 | **breasts bare** |
| p2 none-pd06 s202 | a gray crop tee added, breasts covered, nipple points; lips to thighs; labia visible in the bush |
| p3 nude s101 | black sports bra on, breasts covered; naked below, sitting on the bed's edge; bush, no vulva visible; face: smiling aside, claw clip |
| p3 none s101 | the same pose and face; the bush drawn high and wide over her lower belly; no vulva visible |
| p3 nude s202 | sports bra (faint nipple points); legs apart, eyes closed, head back; the crotch in shadow, no vulva |
| p3 none s202 | the same; crotch in shadow |
| p4 nude s101 | topless in jeans, natural breasts; iPhone mirror selfie; eyes closed, smiling, claw clip |
| p4 none s101 | the same |
| p4 nude s202 | topless in jeans, iPhone mirror selfie, looking at the lens, messy bun |
| p4 none s202 | the same |

## Framing (`framing/`: no body picture, PussyDiffusion 0.6; `sheets/framing-*.jpg` put none-pd06 9:16 first)
| picture | what I saw |
|---|---|
| p1 square s101 (1:1, face) | from the shoulders (hair at the top edge) to the crotch; tee, nipple points; vulva large, real, hairy; her hand on her thigh |
| p1 noface s101 (9:16) | her chin at the top; tee, nipple points; real vulva |
| p1 noface-square s101 | from the neck (a thin necklace) down; tee, nipple points; the largest vulva, real, hairy |
| p1 square s202 | from the chin down; tee; real vulva |
| p1 noface s202 | chin at the top; real vulva |
| p1 noface-square s202 | from the chest (breasts cut by the top edge) to the crotch; tee, nipple points; real, hairy vulva |
| p2 square s101 | her chin at the top; a gray tube top added, nipple points; heavier belly; the vulva hidden in the bush |
| p2 noface s101 | chin at the top; a white tee added, nipple points; a slit in the bush |
| p2 noface-square s101 | from the shoulders down; gray tee, nipple points; real vulva |
| p2 square s202 | her lips at the top; white V-neck crop top, nipple points; vulva faint |
| p2 noface s202 | chin at the top; gray tee, nipple points; vulva in the bush |
| p2 noface-square s202 | from the chest (breasts cut) down; white crop tee, nipple points; real, hairy vulva |

## Redraw (`redraw/`: noface-square, REFERENCE_CLOSE without "a soft belly, full soft hips and thighs")
| picture | what I saw |
|---|---|
| p1 s101 | the same frame as with the words (shoulders down); tee, nipple points; belly about the same; real, hairy vulva |
| p1 s202 | chest down; tee; real vulva |
| p2 s101 | gray tank, nipple points; the belly a little flatter than with the words; vulva visible |
| p2 s202 | chest down, white crop tee; real, hairy vulva |

## Verdict
- **Breasts covered:** P1 8/8 and P3 4/4 (a garment named), but P2 "covered breasts" with the nude body as image 1: **0/6** (image 1
  copied whole); with no body picture 2/2 (klein adds a top). Nipple points show through thin tops in nearly every covered picture.
- **BODY_PARTIAL:** nude and none look alike when a garment is named (P1, P3, P4); only "none" covers garment-less words → recommend
  "none" (left "clothed" for the review, as WORKPLAN asked).
- **PussyDiffusion when partly naked:** 0.6 = 0.8 (real, hairy vulva 4/4 each on P1); off: no vulva 0/2 → 0.6 (PARTIAL_WEIGHTS).
- **Framing:** 9:16 with her face ran from the lips down in 12/12 close-ups; the tall frame is most of it, the face picture the rest
  (no face at 9:16: chin 4/4; 1:1 with face: lips or chin 2/4; 1:1 without: 0/4). CLOSE_SHAPE "1:1" + CLOSE_FACE false, made the
  default. Navel-to-thighs exactly: never (0/16), the breasts stay in the frame, covered.
- **P3 vulva:** none visible 0/4 ("legs apart" is not a PussyDiffusion word, so it doesn't load): a lead for the review, not changed.
- Face (P3, P4): the same woman in all 8.
