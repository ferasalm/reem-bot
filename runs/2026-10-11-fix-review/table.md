# Fix round review: 897dfaf vs HEAD, one clothed /pic (Opus, 2026-10-11)

Words: "a mirror selfie in the bedroom mirror, standing, full body, a soft smile, hair in a messy bun, a fitted black tank top and
high-waisted jeans, her arms visible". The Runware request each version's own `/pic` code builds (customPicture + drawPicture, captured
with fetch stubbed, Math.random fixed), sent as is with seeds 101, 202, 303, 404. Differences between the two requests: image 1
(897dfaf: body-v10-clothed, the rust halter; HEAD: body-v10, the nude front), the reference line, the LoRAs (897dfaf adds phone2025 and
ultrareal5) and HEAD's DRESSED_FULL. Same face, place crop, size 768x1344, steps 5, CFG 1.

Spend: Runware `usage.today` 0.78572 → 0.8138 = $0.02808 (8 pictures at $0.00247, plus two proxy 502s that were billed anyway).

| Seed | 897dfaf (old-sN.jpg) | HEAD (new-sN.jpg) |
|---|---|---|
| 101 | halter neckline (image 1's cut); tank to the waistband | scoop tank as named, to the waistband |
| 202 | halter neckline; cropped: a band of bare midriff | scoop tank, full length |
| 303 | halter neckline; cropped: bare midriff | scoop tank, full length |
| 404 | halter neckline; to the waistband | scoop tank, full length |

Arms and shoulders (judged at full size, torso crops of 101 and 404; not measured): the halter cut bares the shoulder and reads broader;
the upper arms differ less between versions than between seeds. No seed shows HEAD clearly slimmer at full size.
Sheets: sheet-101-202.jpg and sheet-303-404.jpg (old | new | old | new).
