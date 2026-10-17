# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Rebuild (2026-10-15)", the current plan, with paste prompts).

**Last updated:** 2026-10-17 (fifty-ninth session: Opus 5.5, `claude-opus-5-5`, configured and served per the session record; no subagents;
the slips were first listed by Haiku 5.5, `claude-haiku-5-5`, in the "Slip logs review" chat). Runware this session $0.0156.
**DEPLOYED:** `main` = 6c6c19f, Deploy run 38991580245 (run_number 58). `dev` = the slip fixes below, **not deployed**.
**Live Worker:** Version `31d318d7-23fd-409c-b446-0b9be7a05927`. Rollback: push `8d0f79c` to `main`.
Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers.
Rebuild: 0-4 done and live; 5 = the owner's Telegram check: done, its slips fixed on `dev` (this session).
Runware for the Rebuild: about $0.70 of $1.00.

## On dev, not deployed (the slips of D1 860-871)
- "Send a side view pic" was drawn as a riding sex act (865): clothes "riding up" counted as riding → `notActs` before every act check.
- Belfies drew her twice, body + reflection ("2 heads", 868/869) → "A photo of her from behind, taken in a tall mirror: the whole frame
  is the reflection", her back toward the lens. One woman at all 3 live seeds (QUALITY).
- "belfie in tights" drew the day's outfit (870): "tights" is now a garment. "in tights only" = only the tights, the rest bare (871; Claude's reading).
- Junk in the pose: "She side view." (866), "rear view" (860), "Reem in tights only in" (871) → her name, the view and photo-type words go.
- "wet creamy pussy, cum on ass" became "wet creamy, on ass" (862) → "her vulva wet and creamy, POV's semen on her bottom".
- "with no bra" in an outfit (863, lint "banned: no") → "braless"; outfit words pass `ruleWords`.
- /studio: Body menu has the v15 side view, fixed labels; editor defaults = the bot's core (4 steps, CFG 1, "high", Karras, NSFW Unlocked 0.5),
  a new Scheduler field (was the retired 6 steps, CFG 2, Lenovo 1.3).

## Verified this session
- Playwright studio-refs and studio-cards at 390 px green. `node tools/check.mjs` 8 of 8; a unit row per slip with the live words; golden plans changed only in the 2 belfie cases (read).
- 4 Runware pictures read at full size (QUALITY 2026-10-17). Not verified: Telegram after a deploy.

## Waiting on the owner
- Deploy the slip fixes and the /studio update? (say "deploy").
- "tights only" picture: the tights weren't drawn (she came out fully nude) and she held a phone in each hand. Fix next, or leave?
- Is "in tights only" = topless what you meant? (Claude's reading; at /nsfw Off it stays clothed.)
- /studio > References, "Draw the first batch" (~$0.04), approve outfits only.

## Next steps (in order; one chat each)
1. **Deploy** when the owner says so, then read `/health`, `/setup`. Haiku. *Effort: low.*
2. **Tights and the second phone** (if the owner wants): bench "black opaque tights" and one-phone wording at seed 881416599, ≤ $0.02. Opus reads pictures. *Effort: medium.*
3. **Read `events`** after some use; decide timeout/hedging (6 rows so far: wall 17-104 s, model 2-30 s). Sonnet. *Effort: low.*
4. **Skin (optional):** stronger warm-skin.sh tint if pictures read too fair. Opus reads pictures. *Effort: medium.*
5. **Later:** blurred-face hair candidates; WORKPLAN issue 12 leftovers; studio pictures expire from KV; remove runwarePlan once /face and /health use a spec. Haiku. *Effort: low.*

## Open questions for the owner
- UUID refs (cheaper, a different background at one seed): on or off?
- OK to press Actions > Delete retired branches? Unshallow in the SessionStart hook? A 401/402 ping outside the chat?

## Prompt for the next chat
"Deploy dev, then read /health and /setup." Haiku, effort low.
