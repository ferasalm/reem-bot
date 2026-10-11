# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.
**Work plan: `docs/WORKPLAN.md`** (2026-10-11): the eight steps, their specs, and the review notes at its end.

**Last updated:** 2026-10-11 (thirty-second session, **Opus**: the opus-haiku-orchestrator skill and haiku-worker in the repo; Step 5 stands without review (owner); **Step 6 next, with the skill**. On `dev`.)
**Deployed:** `main` = 897dfaf (deploy run 38013450881), unchanged. Rollback: push `0d2010f` or `9c1270f` to `main`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. **Live (`main`):** texts, memory, /auto on DeepSeek V4 Flash (Workers AI, OpenRouter backup); voice Sulafat; hearing Gemini; pictures Runware klein 9B with her face, body and place references, `DAILY_USD` $1.
**On `dev`, not deployed:** Steps 1-4 (each reviewed by Opus) and Step 5 (built by Opus; no review, owner 2026-10-11).
- **Model:** this chat was opened with the Haiku prompt, but `get_session` read Opus (configured and served), so Opus built Step 5.
- **Clothed pictures, the owner's yes:** `CLOTHED_BODY` "nude" (her nude front as image 1 + DRESSED_FULL). Checked first, 18 pictures:
  the six outfits at a second seed as named (no crop leak), lingerie 3/3 (lace stays sheer, no nipples), /nsfw Off 2/2 past Runware's
  content check, scenes 2/2 dressed; one lace cami came out a short bralette.
- **Fixed on the way:** the Runware prompt said "her room as in image 2" when no body picture was sent (the place was image 1);
  "satin/silk/lace/velvet slip" are clothes words now (her "satin slip" got a second outfit stacked on).
- **Step 5 as built:** "covered breasts", "crop top", "sports bra" count as clothes; top on = naked from the waist down (+ her bush),
  bottom on = topless (+ her breasts); NAKED in three parts (same text joined); partly naked: no Unchained, PussyDiffusion 0.6;
  BODY_PARTIAL "none" built (default left "clothed"); crotch close-ups: no breasts, face, hair or room words, 1:1, no face or body picture.
- **Bench read (40 pictures):** the nude body drew "covered breasts" fully naked 0/6 (image 1 copied whole), no body picture 2/2
  covered; PussyDiffusion 0.6 = 0.8 (real, hairy vulva), off = none; at 9:16 with her face every close-up ran from her lips down (12/12),
  1:1 without the face 0/4. Deviations from the spec and the review's list: WORKPLAN "Step 5 build (Opus)".
- Pictures: `face-candidates` runs/2026-10-11-step5-nude-mode/ (18) and runs/2026-10-11-step5-partial-bench/ (40; table.md has one
  line per picture, `sheets/` the side-by-sides and zoom crops).

## Waiting on the owner
- **Your Telegram test** of the belly fix (deployed 2026-10-10), and of /nsfw once deployed. Do not send `/restart` (it wipes her memory).
- Steps 1-5 are not deployed. Deploy when you say "deploy" (suggested after Steps 2, 6 and 7).
- Once deployed, Step 2 makes a chat with no `/nsfw` setting On (about 1 in 3 hot-chat pictures nude): deploy only when you say so.
- Pick **Opus** for the Step 6 chat: the skill needs Opus to plan and judge; it starts the Haiku 5.5 workers itself.

## Verified this session (2026-10-11, thirty-second session)
- Docs checked first (claude-code-guide): Haiku 5.5 supports effort `max`; a subagent's `model` takes a full ID; an agents folder made
  mid-session needs a new chat. `.claude/agents/haiku-worker.md` (claude-haiku-5-5, effort max, Read/Write/Edit/Grep/Glob/Bash) and
  `.claude/skills/opus-haiku-orchestrator/` (SKILL.md, brief-template.md, review-checklist.md) are in the repo.
- Test: two Haiku workers extracted the 14 workflows in parallel, 14/14 rows matched the files (checked by script); a third run as
  `haiku-worker` answered right; the transcripts read `claude-haiku-5-5`, effort `max`.
- `node tools/check.mjs` 7/7, read in full, before each push.

## Next steps (in order; one chat each)
1. **Step 6** in one Opus chat with `/opus-haiku-orchestrator`: anal positions, zoom-crop bench (also riding: a second head, his
   hands). ≤ $0.12. WORKPLAN "Step 6 with the orchestrator". *Effort: high.*
2. **Step 7**: the prompt studio at /studio, reading the D1 log. ≤ $0.05. *Effort: high.*
3. **Step 8**: deploy and live checks when you say "deploy" (suggested after Steps 2, 6 and 7). *Effort: low.*
4. **Your Telegram test** of the belly fix, and of /nsfw once deployed. *Effort: low.*
5. **Later:** Step 5's open questions (BODY_PARTIAL "none", the faceless 1:1 close-up, nipple points through thin tops, P3 "legs
   apart", close-ups that never reach navel-to-thighs); hair drifting to brown highlights (seed 101); the plain mirror belfie with no
   phone; the blowjob arms; the riding second head; Flux 4 Play tongue weight; `/look`'s DeepSeek answers (`llm_text`); /spend vs the
   dashboards; a cheaper text model; old session branches (`tools/retired-branches.txt`). *Effort: medium.*

## Open questions for the owner
- OK to press Actions > Delete retired branches for `tools/retired-branches.txt`? The sync check says no work is missing from `dev`.
- Should the SessionStart hook run `git fetch --unshallow origin` before the sync report? (Done by hand again this session.)
- Old session branches still hold the old Reem pictures in their history. Clear those too, or leave them?

## Prompt for the next chat
Pick **Opus** (effort high) and paste "Prompt for the Step 6 chat" from the end of `docs/WORKPLAN.md`.
