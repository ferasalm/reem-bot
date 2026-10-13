# Step C bench, 2026-10-13 (Opus 5.5, `claude-opus-5-5`; `tools/face/stepc-bench.mjs`, klein 9B on Runware, Lenovo 1.3 + Anatomy Fixer 0.7, 6 steps, CFG 2)

T = today's template (writer off; /look: Step B's logged DeepSeek text). W = the picture writer's words (DeepSeek V4 Flash answers from
writer-replay runs 38334730750 / 38336511907, kept in `tools/face/stepc-answers.json`). Seeds 101, 202. Each picture read at full size.
Script sum $0.04654 + $0.00494 (redraw of c-hurt; Runware 502s on the first try).

| Picture | Read |
|---|---|
| s13-counter T s101 | **phone held up in her hand** (a front-camera selfie); leaning against the counter, not on it; laughing |
| s13-counter W s101 | sitting on the counter as the shot says; no phone; pencil in her bun; cardigan over black cami, jeans; laughing |
| s13-counter T s202 | **phone in her hand**; **broken lower body**: denim shorts with a bare raised leg plus a jeans leg and a bare foot |
| s13-counter W s202 | on the counter; no phone; cardigan, black cami, jeans; a hair clip instead of the pencil; clean body |
| s14-close T s101 | no phone; looking down, hair across her eyes; waist-up (not the close-up) |
| s14-close W s101 | no phone; face clear, soft smile; red blouse, black jeans; waist-up |
| s14-close T s202 | **not a selfie**: third-person, from behind, **a phone in her hands** (over-the-shoulder angle + "looking down at her phone") |
| s14-close W s202 | a proper selfie, face clear, no phone |
| c-hurt W s101 | cardigan, black top, gray sweatpants on the bed; lamp and glass of water; **"face pinched with worry" drawn as a wince** |
| c-hurt W s202 | same clothes; worried look; his own hand at the bottom edge (first person); her face a little older |
| c-kitchen W s101 | back to the camera at the stove, black ribbed tank, floury gray sweatpants, her kitchen; only her |
| c-kitchen W s202 | same; another kitchen; big laugh (the code's random mood: the words named no expression) |
| l484-hurt T s101 | standing over the nightstand, frowning down; blister packs, lamp; only her |
| l484-hurt W s101 | on the bed, **pointing at the camera with an angry frown** ("thumb extended toward the camera", "expression pinched") |
| l484-hurt T s202 | **a phone in her hands** (Step B's slip) |
| l484-hurt W s202 | **a glaring thumb jab at the camera** |
| l-spooning W s101 | in bed, gray tee, asleep, facing the camera (not spooning); **jeans in bed** (DRESSED_BOTTOM: nothing named below) |
| l-spooning W s202 | on her side seen from just behind her shoulder, his hand at the bottom edge: a spooning point of view; **jeans in bed** |

Totals: selfies W 4/4 right, T 1/4 (a phone 3/4, a broken leg 1). Moments the template can't draw (hurt, kitchen): W drew 4/4, expression
wrong 1/4. /look 484: W 0/2 (gesture + anger), T 0/2 (phone; standing). Spooning W 1/2. Fixes in WRITER.RULES (no gestures toward the
camera, plain expressions, below the waist named).
