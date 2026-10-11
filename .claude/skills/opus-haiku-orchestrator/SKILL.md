---
name: opus-haiku-orchestrator
description: >-
  Plan on Opus, delegate well-defined token-heavy execution to the haiku-worker subagent, then review and assemble on Opus. Use for multi-step tasks with sizeable execution work: drafting several documents or sections, extracting data from many files, reformatting or converting content, bulk or repetitive file edits, renames across files, or summarizing research material. Skip for small one-step tasks or work that is mostly judgment.
when_to_use: >-
  Trigger phrases such as "draft these", "extract from all", "reformat every", "apply this change across", "summarize these files", "delegate to Haiku", "use Haiku for the heavy lifting", any task with 3+ similar or token-heavy steps.
---

# Opus plans and judges; Haiku executes

You (Opus) are the planner, reviewer and assembler. `haiku-worker` (Haiku 5.5, pinned as `claude-haiku-5-5`, medium effort by default, tools: Read, Write,
Edit, Grep, Glob, Bash) does the well-defined, token-heavy execution. Haiku starts with zero context: it sees
only the brief you write.

## The goal: spend less, same quality (owner, 2026-10-11)
A worker's cost is its tool calls times its context: every call re-sends all it has read. A delegated step pays for the brief
(Opus), the worker's whole run (Haiku) and the review (Opus). It saves money only when the worker reads or writes far more than the
brief and the review. Measured 2026-10-11 (Step 6): pasting a 30-line block Opus had already written and running 3 commands cost a
worker 176k tokens; copying a 223-line script with 40 lines changed, 158k; a Civitai search, 286k (JSON in context).

## Rules
- Delegate only token-heavy work: the worker reads or writes many times more than the brief (many files, many pictures, bulky API
  output, long drafts). If the brief would hold the answer (a block to paste, a 3-line edit, one command), do it on Opus.
- Never pay twice for one read: if Opus must judge every picture or every line anyway, the worker makes crops, sheets and tables,
  not a first read.
- Effort per brief (pass `effort` to the Agent tool; this skill asks for it): `low` for running commands, copying and reformatting;
  `medium` (the agent's default) for edits and extraction; `high` only for reading pictures or a subtle multi-file edit. Never `max`.
- Every brief caps the worker: "at most N tool calls" (N about 2x the steps), outputs piped through `tail`/`grep`, a reply under
  ~300 words. Merge small steps on the same files into one brief instead of several workers.
- While workers run, don't end turns just to wait: each turn re-sends the whole chat. Commit the reviewed parts early (the stop hook
  asks for a commit at every turn end).
- Never pass more context than a step needs: paths or the exact excerpt, never the conversation.
- Keep your own commentary minimal: a plan, the briefs (in tool calls), the result, two report lines.

## Workflow

### a. PLAN
Break the task into small, independent steps (each one output, one owner). Show the user a short plan
before executing: a numbered list, one line per step, each tagged `[Opus]` or `[Haiku]`, plus which
Haiku steps run in parallel. Keep it under ~12 lines. Proceed unless the user objects or the task is
ambiguous enough that a wrong plan would waste the run (then ask one question).

### b. CLASSIFY
Keep on Opus:
- judgment calls, trade-offs, choosing between options
- ambiguity: anything you couldn't specify exactly in a brief
- synthesis across several results, and the final assembly
- anything needing the conversation's context or the user's decisions
- steps so small that writing the brief costs more than doing them

Send to `haiku-worker`:
- drafting from a clear spec, extraction, reformatting, conversion
- bulk or repetitive edits with a stated rule, renames, boilerplate
- summarizing given material into a fixed template

Test: could you write the exact output template and three yes/no checks for it, and will the worker read many times more than
the brief? Both yes → Haiku. Otherwise → Opus.

### c. BRIEF
For each Haiku step, read `brief-template.md` (in this skill's folder) and fill it in. Each brief is
self-contained and under 400 words, with:
1. Goal in one sentence.
2. Exact inputs: absolute file paths, or the pasted text. Never whole conversations.
3. Numbered steps.
4. Constraints: length, tone, format, and what NOT to do (files not to touch, no extra sections).
5. Exact output template plus one short example.
6. Three yes/no self-checks that a reviewer can verify from the output alone.

If two Haiku steps edit the same file, they are not independent: merge them or run them in sequence.

### d. EXECUTE
Spawn one `haiku-worker` per step with the Agent tool (`subagent_type: "haiku-worker"`, the brief as
the prompt, `run_in_background: false` when the next step needs the result). Put independent steps in
the same message so they run in parallel. Work on your own Opus steps while workers run, if they don't
depend on the results.

If `haiku-worker` isn't available ("Agent type not found": `~/.claude/agents/` didn't exist when the
session started; a restart fixes it for next time), use
`subagent_type: "general-purpose"` with `model: "haiku"` and the brief's effort, and put the body of
`haiku-worker.md` (the project's `.claude/agents/`, else `~/.claude/agents/`) at the top of the brief. The Agent tool takes only the `haiku`
alias, so after the run confirm it was Haiku 5.5:
`grep -rhoE '"model":"claude-haiku[a-z0-9-]*"' ~/.claude/projects | sort | uniq -c` must show only
`claude-haiku-5-5`. If not, do those steps on Opus and tell the user.

### e. REVIEW
Read `review-checklist.md` and check each result against it and its own self-checks. Verify claims
yourself where cheap (open the changed file, grep the count, run the test); never accept a "done" line
on its word alone.
- Pass → keep it.
- Fail → send one corrected brief: the original brief plus a `CORRECTION:` block naming exactly what
  was wrong and what right looks like. Don't send the failed output back unless the fix needs it.
- Second fail → do that step yourself on Opus. Don't send a third brief.

### f. ASSEMBLE
Do the final synthesis on Opus: merge the results, resolve conflicts between them, check that the
whole answers the user's request, and deliver the finished output (files written, or the text).

### g. REPORT
End with exactly two lines, no recap. Each names the model that did the work by its raw model ID, read, never
assumed: the workers' from their transcripts (`grep -rhoE '"model":"claude-[a-z0-9-]*"'` on
`~/.claude/projects/*/<session>/subagents/agent-*.jsonl`), yours from `get_session` when the session has it
(else the model the session reports). Write the same IDs into any records the project keeps.
`Delegated to Haiku (<worker model ID>): <steps, n of m passed first time, k retried, j taken back>.`
`Kept on Opus (<orchestrator model ID>): <planning, the judgment steps by name, review, assembly>.`

## Supporting files (read only when needed)
- `brief-template.md`: the brief skeleton with a filled example. Read at step c.
- `review-checklist.md`: what to check on each result and how to write a correction. Read at step e.
