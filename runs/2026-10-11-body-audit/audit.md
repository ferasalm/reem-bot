# Body audit, static part (fix round, 2026-10-11; Haiku 5.5)

Scope: the body the bot sends as image 1 (and the reference line it uses) for each picture kind, at **897dfaf** (the belly-fix
deploy, 2026-10-10: the last state before Steps 1-7 went live) and at **HEAD** (the fix round, 32 commits later). Read from
`git show 897dfaf:worker.js` and the current `worker.js`. Size is 768x1344 at both (RUNWARE WIDTH/HEIGHT). The bench (table.md)
draws five of these kinds through the bot's own code at both LoRA sets.

| Kind | 897dfaf | HEAD | Changed by (commit) |
|---|---|---|---|
| Clothed selfie (her own, Runware) | image 1 `BODY_CLOTHED` "v10-clothed" (the rust halter and jeans picture); REFERENCE "not slimmer: the same full bust and full upper arms" (Runware's line); LoRAs phone2025 0.6, ultrareal5 0.6, instapic 0.6, realhd2kc 0.5; the smartphone prefix (phone2025 in the list) | image 1 `BODY` "v10" (the nude front, faceless) with DRESSED "She is dressed as described, not naked." and DRESSED_FULL "...image 1 shows only her body's shape."; DRESSED_BOTTOM when a top is named and no bottom (fix round); REFERENCE_CLOTHED "not slimmer full bust and full upper arms"; LoRAs instapic 0.6, realhd2kc 0.5; no prefix | `CLOTHED_BODY` "nude" (69d4ab1, the owner's "yes, a fuller build using her nude body picture"); DRESSED_FULL (398e71d, Step 4 review); the LoRA set (Steps 3-4); DRESSED_BOTTOM (this round, c8e904d) |
| Clothed with an outfit picture | no outfit body: the outfit's picture (`STYLE_PICTURES`, f0c5fb2) is the next image after face, body and place; OUTFIT_LINE "She wears exactly the clothes shown in image {n} (not image {n}'s body or pose)..." | `OUTFIT_BODY` true: the outfit's own picture is image 1, no body picture; REFERENCE_OUTFIT "...full bust and full upper arms" | `OUTFIT_BODY` (144d0f7, Step 4) |
| Nude (standing or mirror) | image 1 `BODY` "v10"; NAKED "She is completely naked, no clothing of any kind: natural breasts with soft brown areolas, a thick, untrimmed dark bush, a real vulva when in view."; the SNOFS nude LoRA when NUDE_WORDS match (2026-10-08) | image 1 `BODY` "v10"; NAKED + NAKED_BREASTS + NAKED_BUSH (the same words, split); LoRAs by situation: instapic 0.6, realhd2kc 0.5, plus unchained 0.8 from NUDE_LORAS | Step 3 (LoRAs by situation); Step 5 (the NAKED split) |
| Sex act (vaginal, oral, anal) | image 1 `BODY` "v10" + NAKED + the act LoRAs (the 2026-10-08 set) | image 1 `BODY` "v10" + the NAKED split + ACT_LORAS, ANAL_LORAS (Step 6), ALONE_LORAS | Steps 3 and 6; not benched here |
| Back (sex act from behind) | image 1 `BODY_BACK` "v10-back"; REFERENCE_BACK; NAKED_BACK | the same keys and values | unchanged |
| Partly dressed (PARTIAL) | `BODY_PARTIAL` "clothed" = `BODY_CLOTHED` "v10-clothed" | `BODY_PARTIAL` "clothed" = `BODY_CLOTHED` "v10-clothed" | unchanged value (PARTIAL_WEIGHTS and PARTIAL_LORAS_OFF added in Step 5) |
| Crotch close-up | none | CLOSE_FACE, CLOSE_SHAPE, REFERENCE_CLOSE ("average-to-full figure 71 kg ..."); no place picture; with CLOSE_FACE false, no face or body picture | Step 5 |
| Cloudflare klein (her picture's last try; /nsfw Off since this round) | image 1 `body.jpg` = `BODY_JPEG_BASE64`, the clothed body made small; REFERENCE and LOOKS (top-level) | the same | unchanged; the Off route draws with it (fix round) |

Body words, from the reference lines (the same owner-set words at both versions; the change is which picture carries the body):
- 897dfaf, Runware REFERENCE: "not slimmer: the same full bust and full upper arms"; top-level REFERENCE and LOOKS: "71 kg average-to-full
  figure not slim and not heavy: a full bust defined waist rounded shoulders and soft upper arms with no muscle definition".
- HEAD, REFERENCE_CLOTHED: "not slimmer full bust and full upper arms"; REFERENCE_OUTFIT: "full bust and full upper arms";
  REFERENCE_NOBODY: "average-to-full figure 71 kg full bust and soft upper arms"; REFERENCE_CLOSE: "average-to-full figure 71 kg ...".
  The DRESSED_BOTTOM line names hips and legs only.
- No body word was added or removed between the two versions. The clothed reference now sits on a picture of her naked front. That is
  a conjecture for the owner's row 13 (the bottom half of image 1 showed through when the words named only a top): it is not measured
  here, and the bench's V0 row-13 pictures are the check for it (Opus to read them).

LoRA sets: 897dfaf LORAS `{phone2025 0.6, ultrareal5 0.6, instapic 0.6, realhd2kc 0.5}`; HEAD LORAS `{instapic 0.6, realhd2kc 0.5}`
(by situation in `runwareLoras`: NUDE_LORAS, ACT_LORAS, ANAL_LORAS, the kind's own LoRAs, WITH_LORAS). The bench's V2 is the 897dfaf set
at HEAD's code; V3 is no realism LoRA.

Runware before the bench (the MCP's `account`, `usage`): today 0.69888 credits over 263 requests; total 5.81521 credits over 1821.
