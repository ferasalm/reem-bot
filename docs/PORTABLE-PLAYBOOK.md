# Portable playbook: cheap, consistent work across many chats

Written 3 Oct 2026 from the Portrait Frame Roller project. Self-contained: give this file to a chat in another repo and ask it to apply it.
Everything below was used in practice here unless marked *(not verified)*.

## The problem it solves
Each new chat starts blank, so it re-reads the project, re-argues settled choices, falls into the same traps, and sometimes asks the user to do things it could do itself. Reading and exploring cost tokens; writing out whole files costs far more.

## 1. Set up in this order
1. **Look before reading.** List the project cheaply first: `unzip -l`/`unzip -v` (CRC32 shows duplicates), `ls -la`, `wc -l`, `git log --oneline`, headings only (`grep -E '^#{1,3} '`). Get a token estimate, show the user, and get a go-ahead before the expensive part. Never open images, builds or generated files.
2. **Verify nothing broke before and after any move.** Run the build and tests first. If the build is deterministic, compare output checksums before and after a refactor: identical means unchanged. Here a rebuild matched the shipped files byte for byte.
3. **Restructure by moving, not retyping.** Use `mv`, `git mv`, `sed` or a short script that asserts each old string exists. Retyping text costs output tokens and invites errors.
4. **Separate the notes by how often they change** (the key design choice):

| File | Holds | Update style |
|---|---|---|
| `CLAUDE.md` | Entry point: what the project is, session start and end routine, hard rules, how the user likes to work, file table. Loads the next two files with `@docs/...`. | Rarely |
| `docs/HANDOFF.md` | Only current state: done, next steps (each with a recommended effort level), open questions, blocked items. | **Rewritten** every session |
| `docs/LESSONS.md` | Verified experience: what you can do yourself, traps (symptom → cause → fix), routes to avoid with the cheaper alternative, what works. | **Curated**: merge, correct, prune; about 150 lines max |
| `docs/DECISIONS.md` | Settled choices and why. One dated line each. | Append-only |
| `docs/REFERENCE.md` | Stable product and design behaviour. | When behaviour changes |
| `docs/MAP.md` | Which file holds what, where each kind of change goes, how to check. | When structure changes |

5. **Add an end-of-session command.** `.claude/skills/handoff/SKILL.md`: verify, rewrite HANDOFF, curate LESSONS, log decisions, update MAP, commit, push, merge into `main`, then tell the user the next step and its recommended effort.
6. **Add a SessionStart hook** (`.claude/hooks/session-start.sh`, registered in `.claude/settings.json`) that fetches `origin/main`, says how many commits the branch is behind, and tells the model to merge first. It never blocks, and it doesn't print the handoff, because `@docs/HANDOFF.md` in CLAUDE.md already loads it.

## 2. Rules to put in CLAUDE.md
- Never read built or generated files; edit the source and rebuild.
- Grep first, then read only the lines needed; make targeted edits, not rewrites.
- Don't spawn sub-agents to explore; they start cold and re-read what you already know.
- Pipe test output through `tail`; the last lines carry the verdict.
- Don't reopen settled choices in DECISIONS unless the user asks.
- Do the work yourself: check LESSONS §1 before asking the user for anything.
- Simplify only when it clearly pays off (fewer files to touch, fewer steps, less to read), never as change for its own sake, and never in the same pass as a restructure. Propose big simplifications first.
- One task per chat; past about 200k tokens, wrap up and suggest a new chat.

## 3. Decisions about process
- **Merge to `main` at the end of every session.** Session branches hide the handoff from the next chat, which starts from `main`.
- **One active working chat at a time**, or HANDOFF edits collide. For parallel chats, give each its own section.
- **Effort level belongs to the user.** A model can't see or change its own setting. The handoff recommends a level per next step; the model states it at session start and end, and the user decides. Rough guide: high for foundational setup, restructures, and bugs that survived one attempt; medium for defined edits, following an existing plan and routine wrap-ups; low for mechanical changes.
- **Switching effort or model mid-chat costs more** *(not verified: believed to lose the discounted cached context)*. So finish a chat at its level and change levels between chats, not inside one.
- **Don't change structure and code in the same pass.** Restructure first, then queue simplifications in HANDOFF as ranked tasks.
- **Chats without Claude Code** don't load CLAUDE.md. Attach HANDOFF and LESSONS (they stand alone), or add the repo to a claude.ai Project. *(not verified)*
- **Missing material:** if a task needs files kept elsewhere, record "available from the user on request" in HANDOFF rather than rebuilding them.

## 4. Lessons that came out of the first few sessions (check your repo for the same)
- **`.gitignore` patterns match in every folder.** A line meant for a root scratch file also hid the committed build output. Anchor root-only patterns with a leading `/` and check with `git check-ignore -v <file>`.
- **Test scripts that only print never fail.** Make every check exit non-zero on failure and add one `--full` command that runs them all; trust its ok/FAIL lines, not eyeballed numbers.
- **Don't scatter test inputs.** Have tools read the build output folder directly instead of asking for copies at the repo root.
- **"Flaky" is not a diagnosis.** With randomised tests, a failure that passes on rerun is an intermittent bug: rerun several times (in parallel with `&` … `wait`), capture the state, and print the full error message before guessing. Truncated errors hid the real cause (here, a test library refusing to tap a deliberately disabled control).
- **Check the test harness before the code.** A UI test that taps with JavaScript `.click()` reaches controls a finger can't (faded, `pointer-events: none`), so a "solver bug" was a stale UI state. Read the test's trail of last actions first.
- **An independent second check is only independent if it's complete.** The Python re-implementation of the rules lacked 16 of 63. Add a build step that fails when any rule has no check there, and a deliberately broken variant that proves each check can fail.
- **Docs drift.** The old README claimed the build copied files to the root, but it didn't. Verify a documented command before copying it into LESSONS.

## 5. Habits worth repeating
- Before building: a short plan, at most 3 questions, then build.
- For each lesson recorded: dated, verified, in symptom → cause → fix form. Unverified ideas stay out, or are marked.
- When a session ends, the last message to the user names the next step and its recommended effort.
