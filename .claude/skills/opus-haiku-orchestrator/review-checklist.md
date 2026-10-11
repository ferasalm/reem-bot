# Review checklist (Opus, step e)

Check each haiku-worker result in this order. Stop at the first hard fail.

## 1. Shape
- [ ] The reply ends with a `NOTE:` line. If it says "not done", treat that part as failed.
- [ ] The output matches the OUTPUT TEMPLATE: same fields, order, delimiters; nothing before or after it.

## 2. The brief's own self-checks
- [ ] Re-answer each of the 3 self-checks yourself from the output. Don't trust the NOTE's "yes".
- [ ] Counts: verify against the source (count the inputs with Glob/grep; count the output entries).

## 3. Faithfulness and scope
- [ ] Spot-check at least 2 values (or 20% of entries, if more) against the inputs. Any invented value = fail.
- [ ] File edits: `git diff --stat` (or list the files' mtimes) shows only the files the brief allowed.
- [ ] Open at least one changed file at the edited spot and read it.
- [ ] No extra sections, suggestions, refactors or "improvements" the brief didn't ask for.

## 4. Fitness for assembly
- [ ] The result can be merged with the other steps' results without rework (same terms, units, format).
- [ ] Where a check is cheap and exists (tests, lint, a parser), run it.

## Verdict
- All pass → keep.
- Minor format slip you can fix in under a minute → fix it on Opus, count it as a pass with a fix.
- Otherwise → fail. Send ONE corrected brief:

```
(the original brief, unchanged)

CORRECTION (your previous attempt failed review):
- What was wrong: (specific: "entry 4 summarized the Context section, not Decision")
- What right looks like: (specific: "use only the text under ## Decision")
- Keep everything else as the brief says.
```

- Second fail on the same step → do the step yourself on Opus. No third brief.
