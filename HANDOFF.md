# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md` (older ones: `docs/DECISIONS-ARCHIVE.md`, grep it). Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`.
History: `docs/CHANGELOG.md`. Work plan: `docs/WORKPLAN.md` (its end holds "Rebuild (2026-10-15)", the current plan, with paste prompts).

**Last updated:** 2026-10-16 (fifty-sixth session: Sonnet 5.5, `claude-sonnet-5-5`, configured and served per get_session; Opus 5.5 advisor once; no subagents).
Rebuild Step 4 built (reference library). Runware this session: $0.0451.
**Deployed:** `main` = c652eb3 (Step 1), Version `649f169d-b85c-44e1-9692-8085f0b3e4ae`. Steps 2, 3b and 4 are NOT deployed.
Rollback: push `ba540c9`. Deploy = `git push origin origin/dev:main`, only when the owner says "deploy".
**On `dev`:** Step 2 (picture core) + 3b + POV fix + Step 4 (library, References tab).

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers. Live: still the old prompts (main = Step 1).
Rebuild: 0, 1 done (deployed) → 2, 3, 3b done (dev) → **4 built (dev), candidates not yet approved** → 5 deploy.
Runware for the Rebuild: $0.651 of $1.00.

## This session (Step 4; QUALITY "Rebuild Step 4"; pictures `face-candidates` runs/2026-10-16-step4*)
- `src/pictures/library.js`: D1 `refs`, KV `ref:<id>`, `loadLibrary` (approved only), `pickRefs(spec, prof, lib)`: a clothed front view whose clothes
  match an approved outfit's key sends that picture as image 1; a matching hairstyle takes slot 3. Cloudflare, back views, nudes, golden plans unchanged.
- Studio References tab (`/studio/api/refs`, `/make`, `/batch`, `/set`): new candidate from a base + change text, "first batch" button (~$0.04),
  Approve / Reject / Retire / key and tags. Nothing reaches the bot until approved.
- `RUNWARE.UUID_REFS` false: UUID refs drew another background than base64 at one seed (cheaper, $0.0022); off until you pick.
- First batch drawn here to read (not in the live catalog: this container can't write KV): 4 outfits good, 4 hair pictures carry full faces
  (bangs one is not her), fuller-body candidates weak. Face-vs-no-face nude: the face picture does not slim her (seed 101 only; seed 202 failed twice).

## Verified this session
- `node tools/check.mjs` 8 of 8; golden plans unchanged; studio.mjs rows for the catalog, approval, pickRefs, UUID cache and stale-UUID fallback; page script parses.
- Every picture read at full size. Not verified: the References tab in a browser at 390 px (Playwright not run), a UUID's life over days, an approved outfit drawn through /pic.

## Waiting on the owner
- Deploy Steps 2 + 3b + 4 (the References tab exists only after a deploy); then open /studio > References, press "Draw the first batch", approve outfits.
- Hair pictures: approve none until a blurred-face version is tested (they carry her face). Do not send `/restart`.

## Next steps (in order; one chat each)
1. **Step 4 finish:** Playwright at 390 px on the References tab; blurred-face hair bench; one approved outfit drawn through `/pic` with a local catalog;
   a fuller body reference that works (the two candidates don't). Sonnet builds, Opus reads pictures. ≤ $0.15. *Effort: medium.*
2. **Step 5:** deploy on the owner's word, `/health` + `/setup`, then the owner's Telegram check. *Effort: low (Haiku).*
3. **Read `events`** after some use; decide hedging/timeout. Sonnet. *Effort: low.*
4. **Later:** WORKPLAN issue 12 leftovers; studio pictures expire from KV; `logSent` sizes; remove runwarePlan once /face and /health use a spec. Haiku. *Effort: low.*

## Open questions for the owner
- Deploy now, so you can approve candidates in /studio?
- UUID refs (cheaper, a different background at one seed): on or off?
- Runware's "today" window read $2.72 before Step 3 (the bot's cap is $1/day): worth a look at Runware's usage page.
- OK to press Actions > Delete retired branches? Unshallow in the SessionStart hook? A 401/402 ping outside the chat?

## Prompt for the next chat
"Finish Rebuild Step 4 from HANDOFF.md next steps 1." Sonnet builds, effort medium.
