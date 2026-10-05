# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-05 (seventh session). **Deployed:** `main` = `dev` (the seventh session's fixes; deploy run
in `docs/CHANGELOG.md`). Everything on `dev` is live.

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid since 2026-10-03, $5/month).
- **Live:** v11 persona (Reem Nabot, Armenian-Lebanese bookkeeper, Watertown triple-decker); DeepSeek V4 Flash text;
  Sulafat voice; Gemini 3.8 Flash hearing; BMI ~26 body picture; `/look`; daily AI cap 50,000 neurons.
- **Live since the seventh session (owner: "Fix everything then deploy"):**
  - **Lingerie when he asks:** more asks count ("show me your lingerie", "can i see you in…", "send me something
    spicier", "a spicier one", "another pic"). klein draws lingerie first, the vision model checks it (`LINGERIE.CHECK`):
    tamer → Nano Banana (klein's picture is the fallback). In tests klein refused 2 of 3 outfits and drew the third as
    "a red silk romper", so most lingerie ends on Nano Banana. A refused spicier outfit gets a second try in a two-piece
    set; his lingerie ask beats her non-lingerie words; in person, lingerie moments go klein → Nano Banana (`SCENES`).
  - **/auto:** a specific man, no stock lines; one move per draft (`AUTO.MOVES`, or `AUTO.HOT_MOVES` when the chat is
    heated: never cools it down); texts under 30 words, scenes under 50; Another gets a different move and is shown
    the skipped drafts. Live run 37340567117: 12/12 short, heated 8/8 escalate, Another different 3/3.
  - **Places:** each place is three crops of the owner's picture (`tools/face/places/views`), one per picture: 8 of 8
    test pictures showed another part of the same room (before: the reference's own angle, 5 of 6).
  - **Apart scenes:** a reply that is only *actions* + "words" while apart is a scene only when she goes to him
    (`HER_MOVE`); invented knocks are asked again, at last her words go as texts.
- Owner's preview page (private artifact): https://claude.ai/artifact/LWGGrnTjMRAiLCTTSZ3rmg

## Waiting on the owner
- **In Telegram now:** `/setup` once, then "show me your lingerie", "send me a two piece pic", "send me something
  spicier", the same in person, a few `/auto` + 🔄 Another, and selfies at home. Tell Claude what slipped.
- Nano Banana's money cap is $0.50 a day (~12 pictures, `LINGERIE.DAILY_USD`): with klein refusing most lingerie, this
  cap now limits lingerie pictures; after it, klein's tamer wardrobe. Raise it?
- Still open: ElevenLabs backup voice "North Jersey"; delete old branches (Actions > Delete retired branches);
  Lunaris via DeepInfra; cost estimate questions from 2026-10-04.

## Verified this session (2026-10-05, seventh session)
- `node tools/check.mjs` all 6 ok. Face runs read picture by picture: 37339347977 (rewording: 1/6 another angle;
  klein lingerie 2/3 refused, 1 "red silk romper"), 37340198460 (crops: 8/8 another part of the same room).
- `[live]` 37339438191 (2 broken: invented apart scenes → fixed) and 37340567117 (0 broken, every reply read).
- Not checked: the vision check and Nano Banana on the live bot (no real lingerie ask sent); live code not read back.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Owner's live test** (list above), then report slips. *Effort: low*
2. **Selfie framing:** in plain selfies the phone shows (1 of 6) or she's framed by someone else (1 of 8); the FLUX
   skill's rules. *Effort: medium*
3. **Tuning v11 from live chat:** "boston. originally" (1/3 live), radiator repeats, family details early. *Effort: medium*
4. **Text model** (owner's direction): DeepSeek V4 Flash vs others, cost and quality. *Effort: high*
5. **Context and memory:** stable prompt prefix for caching, then a "story state" in the notes. *Effort: medium*
6. **Old session branches:** all are contained in `dev`; list them in `tools/retired-branches.txt` once the owner
   agrees. *Effort: low*

## Open questions for the owner
- Raise Nano Banana's daily money cap above $0.50?
- Time-awareness, a daily plan, explicitness, natural-looking pictures (asked 2026-10-03): which proposal to do.
- OK to retire the old session branches the sync report keeps listing?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). <Here is what slipped in my live test: ... | next step 2>. Finish with /handoff.
