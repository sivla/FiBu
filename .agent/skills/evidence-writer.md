# Skill: evidence-writer

## Skill name
evidence-writer

## Purpose
Write compact evidence that states what was proven, what was not proven, and what the next step is.

## Use when
- A BC run, setup fit, screenshot QA or read-only check produced a result.
- A case needs Markdown and JSON evidence.
- Existing evidence lacks company, status, limitation or book impact.

## Do not use when
- There is no real proof.
- The user asked for no documentation changes.
- The only available material is raw logs or unreviewed dumps.

## Inputs
- case id
- environment and company
- work type
- proofs observed
- screenshots and metadata
- limitations
- book impact

## Output JSON schema
```json
{
  "skill": "evidence-writer",
  "caseId": "string",
  "status": "labor",
  "proves": ["string"],
  "doesNotProve": ["string"],
  "screenshots": ["string"],
  "limitations": ["string"],
  "bookImpact": "string",
  "nextStep": "string"
}
```

## Rules
- No fake evidence.
- No raw dumps unless explicitly required and small.
- Use repo-relative paths in evidence files.
- Mark lab, candidate, final or rejected clearly.

## Stop if
- Company or sandbox is unknown.
- Screenshot does not show the claimed proof.
- The result would imply German final proof without evidence.

## Safety gates
- no-fake-evidence
- screenshot-truth
- lab-vs-final-label
- compact-evidence-only

## Preferred taskClass
monkey_work

## Default model class
gpt-4-mini-medium

## Max context lines
160

## Max output tokens
900

## Tool preferred
yes: JSON validation and local file checks.

## Updates state
yes: evidence README, current state or coverage when proof status changes.
