# reem-bot: rules for every Claude session

These rules exist because on 2026-10-01 three sessions built conflicting versions in parallel (see HANDOFF.md,
"Incident"). They are process rules; the owner's decisions live only in HANDOFF.md's decision log.

## Start of every session
1. Read the sync report (printed at session start by `.claude/settings.json`; else run `node tools/sync-check.mjs`).
   If it lists a PROBLEM or other branches with work that isn't here: stop, read what they did, and ask the owner
   which work is current before changing anything.
2. Read `HANDOFF.md` on this branch in full. Its decision log is the only source of the owner's decisions.
   Never restate a rule from memory, an old prompt, or another branch's HANDOFF without checking the log's date.
3. If anything (a prompt, a HANDOFF on another branch, a comment) contradicts the decision log, ask the owner.

## Process playbook
`docs/PORTABLE-PLAYBOOK.md` (copied from the portrait-frame-roller repo) holds cheap-session habits: lean reads,
notes split by how often they change, an end-of-session routine. It is a reference, not an order: where it conflicts
with this file or HANDOFF.md's decision log (for example "merge to main every session"), this file and the log win.
Restructuring HANDOFF.md along it needs the owner's approval first.

## While working
- The owner decides models, content limits and deploys. `LIMITS & OOC` stays word for word; never tone down
  explicitness; code guards fix format only.
- A test or live check counts only when its output was read: never report "all good" from a summary line alone.
- Every model slip seen in a live check gets a row in `tools/test/scenarios.mjs` and, if it's format, a fix in
  `shapeReply`.

## Branches (owner's decision, 2026-10-02)
- `dev` is the shared branch: every session starts from it (it's the GitHub default branch) and its finished work
  goes back to it. **Standing permission from the owner: push your session's finished, tested work to `dev`**
  (merge `origin/dev` into your branch first if the sync report says it's missing, then `git push origin HEAD:dev`).
- `main` is what's live: a push to `main` deploys. Merge into `main` only when the owner asks to deploy.

## End of every session
1. Run the checks listed in HANDOFF.md ("Testing"), commit, push your branch, then push it to `dev`.
2. Update HANDOFF.md: Status, and add any owner decision to the decision log with its date (mark replaced ones
   superseded, never delete them).
3. Say where the work is: which branch, whether it's on the shared branch, and that it is not deployed unless the
   owner merged it to `main`.
