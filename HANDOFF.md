# HANDOFF — reem-bot

Current state only, **rewritten every session** (`/handoff`). At most 80 lines (`tools/doc-check.mjs`).
Decisions: `docs/DECISIONS.md`. Lessons: `docs/LESSONS.md`. Code map + checks: `docs/MAP.md`. History: `docs/CHANGELOG.md`.

**Last updated:** 2026-10-03, evening (Lebanese Reem in Belmont, fixed places, pictures round; not deployed)

## Where we are
Telegram roleplay companion "Reem" (@reem_nabot) on Cloudflare Workers (Workers Paid since 2026-10-03, $5/month).
- **Live (`main` = 393414b):** v10 on DeepSeek V4 Flash; pictures v3 (klein 4B, 640x640); Egyptian persona in
  Zamalek; daily AI cap 9,000 neurons. Details: `docs/CHANGELOG.md`.
- **On `dev`, not deployed:** Workers Paid cap (28,000 neurons = $0.20/day); Basbousa "she"; **Lebanese Reem in
  Belmont, MA** (her clock is now Boston time); **fixed places** (her rooms, his rooms, the hallway: same room in
  every picture, `places.js`); pictures 768x1024 at the same price, about twice as often, curvier body, 120 s
  timeout; Cloudflare's lingerie filter worked around as far as it goes (`FILTER_WORDS`, see LESSONS §2);
  branch-delete button. None of it checked with a `[live]` run yet.

## Waiting on the owner
- **Delete the old branches:** Actions > Delete retired branches > Run workflow, type `delete` (`dev` must be the
  branch the workflow runs on, which it is by default). `face-candidates` stays.
- **Open `/setup` once** after the next deploy; then try a pic, a lingerie pic, "let me see you" mid-scene.
- **Decide on lingerie pictures:** Cloudflare refuses bra/panties/thong and boudoir back views whatever the wording.
  Real lingerie needs another image provider (next step 3). Your rule today: "nothing that would certainly trip a
  safety filter" (DECISIONS 2026-10-02).
- Optional: a Cloudflare billing alert.

## Verified this session (2026-10-03)
- `node tools/check.mjs` all 6 ok; CI green on the branch (Tests run for ca4822b, incl. the Worker build).
- 33 test pictures drawn and looked at: same face, the fixed rooms reproduced, framing fixed in round 2.

## Next steps (in order)
Each has a recommended effort. The owner sets the effort; Claude only recommends it.
1. **Deploy** when the owner asks: merge `dev` into `main`; read the deploy run and /health. *Effort: low*
2. **`[live]` run** after the persona change (Lebanese, Belmont, Boston clock, Basbousa she): read every reply,
   add a `docs/QUALITY.md` row, fix slips with scenario rows. *Effort: medium*
3. **Another image provider, if the owner wants real lingerie or a better face:** e.g. Runware or fal.ai with
   FLUX.2 klein 9B (listed at ~$0.0008 and ~$0.006 a picture, safety checker can be turned off; prices from
   search, not yet checked on their own pages). Needs the owner's account + API key as a Worker secret, and a
   decision log entry (it changes the 2026-10-02 filter rule). *Effort: high*
4. **Context and memory** (owner's questions 6-7): stable prompt prefix for provider caching (time and nudges
   after the history), then a structured "story state" in the memory notes. Measure tokens first. *Effort: medium*
5. **Curate LESSONS:** older gotchas into symptom → cause → fix. *Effort: low*
6. **Later (owner's plan):** ElevenLabs v4 instead of v3 (`isV3()`). *Effort: high*

## Open questions for the owner
- Lingerie: stay on Cloudflare (bodysuits, slips, bikinis from the front) or add a provider (step 3)?

## Prompt for the next chat (paste as-is)
> Continue reem-bot. Follow CLAUDE.md (the sync report first; if it lists other branches with work, stop and ask
> me). <describe the next change>. Finish with /handoff.
