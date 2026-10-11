# Haiku brief template

Fill every section. Under 400 words. Haiku sees nothing but this text, so name every file by absolute
path and paste any text it needs. Delete the guidance in parentheses.

```
GOAL: (one sentence: the deliverable, not the activity)

INPUTS:
- (absolute path, plus what part matters: "lines 10-40", "the ## Usage section")
- (or pasted text between <<< and >>>)

STEPS:
1. (one action per step, imperative, concrete: "Read X", "For each Y, write Z")
2. ...
(Bulk edits: state the rule once and list every target, or give the exact grep that finds them.)

CONSTRAINTS:
- Length: (exact: "each summary 2-3 sentences", "under 120 words")
- Tone/format: (plain text / Markdown / JSON; the voice to use)
- Do NOT: (touch other files; add sections; change X; guess missing values: write "MISSING" instead)

OUTPUT TEMPLATE:
(the exact shape of the reply: headings, fields, order, delimiters)

EXAMPLE (one short filled instance of the template):
(...)

SELF-CHECKS (answer yes/no before replying; fix until all yes):
1. (countable: "Does the output have exactly N entries, one per input?")
2. (format: "Does every entry match the template, fields in order?")
3. (scope/faithfulness: "Is every value taken from the inputs, none invented?")

End your reply with one line: NOTE: all done; self-checks 1-3 yes.  (or NOTE: not done: <what, why>)
```

## Writing good self-checks
- Make each one verifiable from the output alone, by a reviewer who didn't do the work.
- Prefer counts and presence tests ("exactly 7 rows", "no line over 100 characters", "no file other than
  X modified") over quality words ("is it good", "is it clear").
- One check on scope or faithfulness is mandatory: it's where Haiku slips most.

## Filled example

```
GOAL: Produce a one-line summary of each Markdown file in /repo/docs/adr/.

INPUTS:
- Every *.md file in /repo/docs/adr/ (use Glob "/repo/docs/adr/*.md").

STEPS:
1. List the files with Glob, sorted by name.
2. For each file, read its title (first # heading) and its "Decision" section.
3. Write one line per file using the template.

CONSTRAINTS:
- Length: each summary 25 words or fewer.
- Format: Markdown list, nothing before or after it.
- Do NOT edit any file. Do NOT summarize sections other than "Decision". If a file has no
  "Decision" section, write "MISSING" as its summary.

OUTPUT TEMPLATE:
- `<filename>`: <title> | <summary of the Decision section>

EXAMPLE:
- `0003-queue.md`: Use SQS for jobs | Jobs move from cron to SQS for retries and visibility.

SELF-CHECKS:
1. Is there exactly one line per .md file in /repo/docs/adr/?
2. Is every summary 25 words or fewer and in the template's shape?
3. Is every summary drawn only from that file's Decision section (or MISSING)?

End your reply with one line: NOTE: all done; self-checks 1-3 yes.  (or NOTE: not done: <what, why>)
```
