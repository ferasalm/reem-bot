---
name: handoff
description: End-of-session wrap-up for reem-bot. Runs the checks, rewrites HANDOFF.md, logs owner decisions in docs/DECISIONS.md, curates docs/LESSONS.md, adds docs/QUALITY.md rows, commits, pushes the branch and pushes it to dev (never main). Use when the user types /handoff, says "wrap up", or the chat is getting long (~200k tokens).
---

# Handoff (reem-bot)

Do these in order. HANDOFF, DECISIONS and LESSONS load at every session start, so every line costs tokens forever.

1. **Check.** `node tools/check.mjs` must print `all … checks passed`; read any FAIL lines and fix them first.
   If a `[live]` run happened this session, its job log was read in full.
2. **Log decisions** the owner made this session at the top of `docs/DECISIONS.md`: one dated entry each, with the
   owner's words. A replaced entry is struck through (`~~…~~`) with "Superseded by …"; never delete or reword one.
3. **Quality record.** One row in `docs/QUALITY.md` per `[live]` run read this session.
4. **Curate `docs/LESSONS.md`.** Did anything cost real time (an error, a wrong guess, nearly asking the owner for
   something you could do)? Add it as symptom → cause → fix, dated, verified only. Merge with a similar entry;
   fix or delete entries that proved wrong. At most 180 lines; once it reaches 180, summarize it back to about 150 (merge, shorten, prune).
5. **Update `docs/MAP.md`** if files, functions or checks were added, moved or renamed.
6. **Rewrite `HANDOFF.md`** (rewrite, don't append; at most 80 lines): Last updated; Where we are (what's live
   on `main`, what's on `dev` and not deployed); Waiting on the owner; Verified this session; Next steps in order,
   each ending `*Effort: low|medium|high*`; Open questions. Move finished detail (run ids, versions) to the top of
   `docs/CHANGELOG.md` instead of keeping it.
7. **Commit and push:** `git fetch origin dev && git merge origin/dev` if the sync report said work is missing,
   then `node tools/check.mjs` again, commit, `git push -u origin <branch>`, `git push origin HEAD:dev`.
   Never push to `main` unless the owner asked to deploy in this session.
8. **Tell the owner** in a few lines: what was done, which branch, that it's on `dev`, whether it's deployed, the
   next step and its recommended effort, and whether a new chat is advisable.
