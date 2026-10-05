# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-05 (seventh session). **Deployed:** `main` = b5c4d60 (deploy run 37272358522 green).
**On `dev`, not deployed:** the seventh session's fixes for the owner's three problems (below).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid since 2026-10-03, $5/month).
- **Live (`main`):** v11 persona (Reem Nabot, Armenian-Lebanese bookkeeper, Watertown triple-decker); DeepSeek V4 Flash
  text; Sulafat voice; Gemini 3.8 Flash hearing; the owner's place pictures (8 places, day and night); BMI ~26 body
  picture; klein-first lingerie, Nano Banana for "spicier"; `/look`; daily AI cap 50,000 neurons.
- **On `dev` (seventh session, mocked tests only):**
  - **Lingerie when he asks:** more asks count as a picture ask ("show me your lingerie", "can i see you in…", "send me
    something spicier", "a spicier one", "another pic"). klein still draws lingerie first, but the vision model now
    checks what she's wearing (`LINGERIE.CHECK`): no lingerie word → Nano Banana draws it (klein's picture is the
    fallback). A spicier outfit Google refuses (the "only a thong" ones) gets one more try in a two-piece set. When he
    asks for lingerie and her [selfie] words name none, the lingerie wardrobe is drawn. In person, a lingerie moment
    goes klein (checked) → Nano Banana (`LINGERIE.SCENES`); before, klein refused the real words and nothing came.
  - **/auto:** a specific man, no stock lines, never repeats his own lines; each draft takes one story move
    (`AUTO.MOVES`: tease a detail, bold move, change the scene, a dare, a confession…); Another picks a different move
    and is told the drafts he skipped; temperature 1.0.
  - **Places:** the place picture is only a reference for the room ("do not copy its composition or camera"), seen from
    one of `ROOM_VIEWS` per picture, close behind her and softly out of focus.
- Owner's preview page (private artifact): https://claude.ai/artifact/LWGGrnTjMRAiLCTTSZ3rmg

## Waiting on the owner
- **Deploy?** Say "Deploy" and the next session fast-forwards `dev` into `main`.
- **Then in Telegram:** `/setup`, "show me your lingerie", "send me a two piece pic", "send me something spicier",
  the same in person ("*knocks* let me see you in lingerie"), a few `/auto` with 🔄 Another, and a couple of selfies
  at home (do rooms still look pasted in?). Tell Claude what slipped.
- Nano Banana's money cap is $0.50 a day (~12 pictures; `LINGERIE.DAILY_USD`): when it's spent, lingerie falls back to
  klein's tamer wardrobe. Raise it?
- To let Claude read the live bot's state (last AI error, today's picture ledger, recent chat) from a workflow, the
  owner has to allow it: the permission check refused it this session.
- Still open: ElevenLabs backup voice "North Jersey"; delete old branches (Actions > Delete retired branches);
  Lunaris via DeepInfra; cost estimate questions from 2026-10-04.

## Verified this session (2026-10-05, seventh session)
- `node tools/check.mjs` all 6 ok; new mocked tests: tamer klein → Nano Banana, Google refuses → klein's picture sent,
  hoodie words replaced, in-person two pieces → Nano Banana, in-person one-piece → klein checked, ROOM_VIEWS in the
  prompt, /auto moves differ and the skipped draft is in the prompt. Ask pattern probed on 13 sentences (8 asks, 5 not).
- Every old session branch: `git cherry` shows 0 commits missing from `dev` (the sync report's counts were a shallow clone).
- **Not checked:** no picture drawn (files under `tools/face/` were refused to this session, so no face.yml job), no
  `[live]` run, no real /auto draft read. Whether klein follows the new ROOM wording is unknown until pictures are seen.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Deploy, then the owner's live test** (list above), then report slips. *Effort: low*
2. **Place framing with real pictures:** a face.yml job of selfies in 3-4 places, read picture by picture; if klein still
   copies the reference, attach the place picture only part of the time or draw extra views of each place. *Effort: medium*
3. **Tuning v11 from live chat:** radiator + spoon repeats; family details early; Gemini's (laughs). *Effort: medium*
4. **Selfie quality with the FLUX skill's rules:** phone shown in "no phone" selfies, phone over the face. *Effort: medium*
5. **Text model** (owner's direction): DeepSeek V4 Flash vs others, cost and quality. *Effort: high*
6. **Context and memory:** stable prompt prefix for caching, then a "story state" in the notes. *Effort: medium*
7. **Old session branches:** all are contained in `dev`; list them in `tools/retired-branches.txt` once the owner
   agrees. *Effort: low*

## Open questions for the owner
- Raise Nano Banana's daily money cap above $0.50?
- Time-awareness, a daily plan, explicitness, natural-looking pictures (asked 2026-10-03): which proposal to do.
- OK to retire the old session branches the sync report keeps listing?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). <Deploy | Here is what slipped in my live test: ... | next step 2>. Finish with /handoff.
