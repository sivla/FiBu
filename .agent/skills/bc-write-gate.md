# Skill: bc-write-gate

## Skill name
bc-write-gate

## Purpose
Decide whether a Business Central write action is justified, bounded, evidenced and reversible enough to execute in the sandbox.

## Use when
- Setup, master data, document drafts, imports, cleanup, preview, posting or payment are proposed.
- A case wants to move from read-first proof to effective action.
- Superrechte could make an unsafe action technically possible.

## Do not use when
- The action is purely read-only.
- The active case explicitly freezes live work.
- The proposed action is a hard forbidden action such as committing secrets or faking evidence.

## Inputs
- active case and allowed actions
- active context proof
- business purpose and book/training/UAT value
- source or evidence basis
- fields or records to change
- fallback, cleanup or keep strategy

## Output JSON schema
```json
{
  "skill": "bc-write-gate",
  "decision": "allow|block|read-first-required|human-approval-required",
  "allowedActions": ["string"],
  "blockedActions": ["string"],
  "requiredEvidenceBefore": ["string"],
  "requiredEvidenceAfter": ["string"],
  "cleanupOrKeepStrategy": "string",
  "reason": "string"
}
```

## Rules
- Superrechte create responsibility, not permission to skip gates.
- Every write needs context proof, purpose, expected effect, stop conditions and after-proof.
- Posting, payment, deletion, import, company switch and cleanup require stronger review than simple setup field edits.
- Configuration packages, Excel, API or AL routes require an explicit route decision before use.

## Stop if
- Context proof is missing or wrong.
- The write would affect a legacy company or unapproved environment.
- The changed fields/records are not named.
- Cleanup/keep strategy is missing for drafts, imports, deletes or rebuilds.
- The action would create a claim the book cannot support.

## Safety gates
- playthru-context-confirmed
- smart-decision-before-effective-action
- evidence-before-and-after
- cleanup-or-keep-declared
- no-final-claim-without-proof

## Preferred taskClass
judge_work

## Default model class
gpt-5.5-low

## Max context lines
180

## Max output tokens
900

## Tool preferred
yes: state checks, source checks, result JSON and screenshot QA.

## Updates state
yes: gate result, result JSON or decision log when write readiness changes.
