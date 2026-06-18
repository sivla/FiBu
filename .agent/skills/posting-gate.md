# Skill: posting-gate

## Skill name
posting-gate

## Purpose
Decide whether risky BC actions such as Preview Posting, Post, Ship, Invoice, Payment, acquisition, depreciation or setup changes are allowed.

## Use when
- A run may open Preview Posting or a posting dialog.
- A setup or master-data change is considered.
- A payment, application, invoice or shipment might be posted.

## Do not use when
- The task is read-only file validation.
- The active case explicitly forbids the risky action and no new evidence exists.
- Company or instance is unclear.

## Inputs
- active case
- allowed actions
- forbidden actions
- company and instance proof
- setup proof
- expected entry types
- evidence plan
- cleanup or no-duplicate rule

## Output JSON schema
```json
{
  "skill": "posting-gate",
  "decision": "locked",
  "allowedAction": null,
  "blockedReason": "string",
  "requiredProof": ["string"],
  "mayProceed": false
}
```

## Rules
- Default is locked.
- Unlock only for the exact active action.
- Define expected entries before posting.
- Screenshot or evidence plan must exist before confirmation.

## Stop if
- The action is not explicitly allowed.
- Preview/Post/Ship/Invoice/Payment dialog appears unexpectedly.
- Setup proof is missing.
- Cleanup or no-duplicate rule is missing.

## Safety gates
- default-locked
- explicit-active-case-allowance
- company-and-instance-confirmed
- evidence-plan-before-risky-action

## Preferred taskClass
judge_work

## Default model class
gpt-5.5-low

## Max context lines
180

## Max output tokens
800

## Tool preferred
yes: local state validation and dialog evidence.

## Updates state
yes: active case or current state when a gate changes status.
