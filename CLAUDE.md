# reem-bot: rules for every Claude session

These rules exist because on 2026-10-01 three sessions built conflicting versions in parallel (see HANDOFF.md,
"Incident"). They are process rules; the owner's decisions live only in `docs/DECISIONS.md`.

## Start of every session
1. Read the sync report (printed at session start by `.claude/settings.json`; else run `node tools/sync-check.mjs`).
   If it lists a PROBLEM or other branches with work that isn't here: stop, read what they did, and ask the owner
   which work is current before changing anything.
2. `HANDOFF.md` (current state), `docs/DECISIONS.md` (the decision log, the only source of the owner's decisions)
   and `docs/LESSONS.md` are loaded below. Never restate a rule from memory, an old prompt, or another branch's
   files without checking the log's date. (Branches from before 2026-10-03 keep the log inside their HANDOFF.md.)
3. If anything (a prompt, another branch's docs, a comment) contradicts the decision log, ask the owner.
4. Tell the owner, in one or two lines, the next step you're taking and its recommended effort from HANDOFF.md.
   The owner sets the effort; you can't see or change it.
5. Before any code change, read `docs/MAP.md`: it names where things live in `worker.js` and how to check.

## Where things are (owner's decision 2026-10-03, option D)
| Need | File | Loaded at start? |
|---|---|---|
| Current state, what waits on the owner, next steps + effort | `HANDOFF.md` (≤80 lines, rewritten every session) | yes |
| The owner's decisions | `docs/DECISIONS.md` (append-only) | yes |
| Traps, what you can do yourself, cheaper routes | `docs/LESSONS.md` (≤180 lines; at 180, summarize back to ~150) | yes |
| Where code lives, how to check, branches | `docs/MAP.md` | before code changes |
| `[live]` run results over time | `docs/QUALITY.md` | when tuning |
| History (run ids, versions, the 2026-10-01 incident) | `docs/CHANGELOG.md` | grep on demand |
| The current work plan: steps, specs, paste prompts (2026-10-11) | `docs/WORKPLAN.md` | when HANDOFF names a step |
| Process habits from portrait-frame-roller | `docs/PORTABLE-PLAYBOOK.md` (reference only; this file wins, e.g. never "merge to main every session") | no |
`tools/doc-check.mjs` (CI) enforces the sizes, dated decisions, effort levels and the map.

## While working
- The owner decides models, content limits and deploys. `LIMITS & OOC` stays word for word; never tone down
  explicitness; code guards fix format only.
- A test or live check counts only when its output was read: never report "all good" from a summary line alone.
- Every model slip seen in a live check gets a row in `tools/test/scenarios.mjs` and, if it's format, a fix in
  `shapeReply`. Every `[live]` run read gets a row in `docs/QUALITY.md`.
- Lean reads (LESSONS §3): never read `worker.js` or generated files whole; grep, then read only the lines needed.
- One task per chat; past ~200k tokens, finish the unit of work, run `/handoff` and suggest a new chat.

## Branches (owner's decision, 2026-10-02)
- `dev` is the shared branch: every session starts from it (it's the GitHub default branch) and its finished work
  goes back to it. **Standing permission from the owner: push your session's finished, tested work to `dev`**
  (merge `origin/dev` into your branch first if the sync report says it's missing, then `git push origin HEAD:dev`).
- `main` is what's live: a push to `main` deploys. Merge into `main` only when the owner asks to deploy.

## End of every session
Run `/handoff` (`.claude/skills/handoff/SKILL.md`): `node tools/check.mjs`, log decisions in `docs/DECISIONS.md`
(dated; mark replaced ones superseded, never delete them), QUALITY rows, curate LESSONS, rewrite HANDOFF.md, commit,
push your branch, push it to `dev`. Then say where the work is: which branch, whether it's on the shared branch,
that it is not deployed unless the owner merged it to `main`, and the next step with its recommended effort.

@HANDOFF.md
@docs/DECISIONS.md
@docs/LESSONS.md
