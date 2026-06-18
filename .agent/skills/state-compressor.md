# Skill: state-compressor

## Skill name
state-compressor

## Purpose
Compress a run result into compact state files that the next agent can use without old chat history.

## Use when
- A run ends with new evidence, blocker, capability, setup status or next step.
- `last_run_summary.json` is stale.
- A case state needs a concise handover.

## Do not use when
- No real project truth changed.
- The update would add long history or raw logs.
- Evidence links are unknown.

## Inputs
- run result
- active case
- evidence links
- changed files
- validation results
- next step

## Output JSON schema
```json
{
  "skill": "state-compressor",
  "currentStatePatch": {},
  "lastRunSummaryPatch": {},
  "caseStatePatch": {},
  "coveragePatch": {},
  "nextStep": "string"
}
```

## Rules
- Keep current truth at the top.
- Link evidence instead of copying it.
- State what is open, blocked or final-open.
- Remove stale next-step wording when it is superseded.

## Stop if
- There is no evidence or changed decision to summarize.
- The proposed state contradicts source evidence.
- Next step is vague.

## Safety gates
- state-over-chat
- evidence-linked
- no-long-history-in-state
- next-step-required

## Preferred taskClass
monkey_work

## Default model class
gpt-4-mini-medium

## Max context lines
140

## Max output tokens
700

## Tool preferred
yes: JSON validation.

## Updates state
yes: current state, last run summary, active case or coverage.
