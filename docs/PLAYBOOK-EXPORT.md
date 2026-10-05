# Working playbook from reem-bot (for another repo's agent)

Written 2026-10-05 from reem-bot, a Telegram bot run by an owner who is not a developer and works from an Android
phone, with many short Claude Code sessions in the cloud. Give this file to the agent in another repo.

## To the agent reading this: read it critically
This is one project's experience, not a rulebook. **You decide what's more effective and efficient for your repo.**
- Every rule below says why it exists. If the *why* doesn't apply to your repo, drop the rule.
- Look at your repo first (size, tests, who the owner is, how many sessions run, what breaks) and keep what fits.
- Prefer your own measured evidence over this file. Where this file says "unverified", treat it as a guess.
- Write down what you adopted, adapted and rejected, with one line why each, in your repo's own notes, and tell your
  owner in a few lines. Don't copy this file into your instructions whole: rules without their reasons get followed
  narrowly, and every line loaded at session start costs tokens in every session.

## 1. The problem
Each session starts blank: it re-reads the project, re-argues settled choices, falls into known traps, and asks the
owner for things it could do itself. Reading costs tokens; rewriting whole files costs more; parallel sessions that
don't know about each other cost the most (here, three sessions built conflicting versions in one night).

## 2. Notes, split by how often they change
| File | Holds | Style | Why |
|---|---|---|---|
| `CLAUDE.md` | Process rules, session start/end, where things are | Rarely changed | Loaded every session: keep it short |
| `HANDOFF.md` | Current state, what waits on the owner, next steps each with an effort level | **Rewritten** every session, size-capped | Appending turns it into history nobody reads |
| `docs/DECISIONS.md` | The owner's decisions, dated, in the owner's words | Append-only; replaced ones struck through with what replaced them | The single source of truth stops sessions restating rules from memory or old branches |
| `docs/LESSONS.md` | Verified traps (symptom → cause → fix), what the agent can do itself, cheaper routes | Curated, size-capped | Prevents paying twice for the same mistake |
| `docs/MAP.md` | Where code lives, how to check it | When structure changes | Lets a session grep the right place instead of reading whole files |
| `docs/CHANGELOG.md`, quality logs | History, run ids, test results over time | Grep on demand, never loaded | History is rarely needed and expensive to load |

Load HANDOFF, DECISIONS and LESSONS from CLAUDE.md with `@path` imports. A small CI script (`doc-check`) enforces
the size caps, dated decisions and an effort level on every next step, because rules nobody checks drift.

## 3. Session routine
- **Start:** a SessionStart hook prints a sync report: is this branch behind the shared branch, and do other
  branches hold work that isn't here? If yes, stop and ask the owner which work is current. *Why:* that's what
  would have prevented the parallel-sessions incident. *Trap:* in a shallow clone the report can over-count; run
  `git fetch --unshallow` before believing it.
- **Start:** tell the owner in one or two lines the next step you're taking and its recommended effort.
- **End:** one `/handoff` skill: run the checks, log decisions, curate lessons, rewrite HANDOFF, commit, push, and
  say where the work is (branch, shared or not, deployed or not) plus the next step and its effort. *Why:* a fixed
  routine is cheaper than remembering one, and the next session starts from the shared branch.
- **Branches:** one shared branch every session starts from and returns finished work to (standing permission);
  the deploy branch only when the owner says so. *Why:* session branches hide work from the next session.

## 4. Token habits that kept quality
- Grep, then read only the lines needed. Never read big source files, generated files or base64 assets whole.
- Edit with targeted replacements; move text with scripts that assert the old string exists, never by retyping.
- One task per chat. Past ~200k tokens, finish the unit of work, hand off, start a new chat.
- Don't spawn subagents to explore: they start cold and re-read what the main session already knows. Delegate only
  bulky, well-specified work that is cheaper to check than to do.
- Mocked tests: trust the exit code, read only the failing lines. Real-model or live checks: read every output,
  never just the summary line (a summary once said "nothing broken" while broken replies went out).
- Effort and model are the owner's to set; the agent recommends per step. Rough guide: low for mechanical edits,
  medium for defined changes and wrap-ups, high for design, restructures and bugs that survived one attempt.
- Changing model mid-chat starts a new prompt cache (caches are per model); whether changing effort does is
  *unverified*. So change model or effort between chats when you can.
- Opus plans, Sonnet executes (Claude Code `/model opusplan`, or a Sonnet subagent with a self-contained brief) pays
  off only for bulky, well-specified work; judgment-heavy work is cheaper done once by the stronger model.

## 5. Quality habits
- A test or live check counts only when its output was read.
- Every bug seen live gets a regression test that fails on the old code, then the fix.
- When something odd fails, diagnose the real cause (logs, analytics, a diagnosis script) before fixing the error
  message shown. Here, an "unavailable" error was really "out of quota"; a fix for the shown error would have been wrong.
- "Flaky" is not a diagnosis. Random external filters are real, though: never conclude from one refusal.
- Judge generated media at full size, one item at a time, with written per-item checks; thumbnails lie.
- After a deploy, read back what is actually live, and re-test a few minutes later before blaming new code.

## 6. Working with a non-developer owner
- The owner decides product, content, models, money and deploys; the agent advises with numbers (cost per day,
  per user) and runs every test itself. Never ask the owner to run commands.
- Before asking, check LESSONS for "you can do this yourself". Ask only what changes what you do next, at most a
  few questions, each with a recommended option.
- Things the agent can't do (e.g. delete branches, install CLI plugins) get a one-tap route for the owner (a
  workflow button, a settings entry) and a line in HANDOFF.
- Paid limits live in code as daily caps the owner can tune.
- Ask before adding a third-party dependency.

## 7. Prompts the owner can reuse
- New chat: "Continue <repo>. Follow CLAUDE.md. <one task>. Finish with /handoff."
- "Grep first; don't read whole files. Plan in 5 lines, then do it." (stops exploratory reading)
- "Answer in at most N lines." / "Only the diff summary, no recap." (cuts output tokens, the most expensive kind)
- "Don't ask unless blocked; pick the recommended option and tell me." (saves a round trip)
- "Do steps 1-3 of HANDOFF in this chat, then /handoff." (batches small related work into one context)
- `/compact` with a focus, e.g. "/compact keep the decisions and the open bug", when a long chat must continue.
