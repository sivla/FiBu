# Skill: error-recovery

## Skill name
error-recovery

## Purpose
Turn a Business Central error or blocker into a reproducible learning case with cause, safe fix or documented boundary.

## Use when
- A BC dialog, validation error or blocked field appears.
- A helper clicks the wrong page or wrong action.
- Setup or master data appears missing.

## Do not use when
- The active case forbids BC execution and no prior evidence exists.
- The message is already fully documented and unchanged.
- The fix would require an unapproved posting or setup change.

## Inputs
- visible error text
- page context
- last action
- intended business result
- allowed and forbidden actions

## Output JSON schema
```json
{
  "skill": "error-recovery",
  "situation": "string",
  "symptom": "string",
  "likelyCause": "string",
  "bcReason": "string",
  "safeFix": "string",
  "boundary": "string",
  "nextCheck": "string"
}
```

## Rules
- Capture the error before fixing.
- Explain why BC reacts that way.
- Prefer a safe idempotent setup or master-data fit only when allowed.
- Document cleanup if a draft was created.

## Stop if
- Instance, company or document context is unclear.
- The next action could post, pay or ship.
- The fix would be an API shortcut without explicit exception.

## Safety gates
- capture-before-fix
- no-silent-workaround
- setup-change-gate
- cleanup-or-boundary

## Preferred taskClass
judge_work

## Default model class
gpt-5.5-low

## Max context lines
200

## Max output tokens
1000

## Tool preferred
yes: screenshots, page text, local evidence search.

## Updates state
yes: workarounds, findings, current state or active case.
