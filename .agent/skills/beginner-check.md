# Skill: beginner-check

## Skill name
beginner-check

## Purpose
Check whether a Business Central instruction explains what a beginner sees, does, why it matters, and how success or failure is recognized.

## Use when
- Evidence exists but the book or guide does not explain it clearly.
- A screenshot needs a beginner-friendly caption.
- A recurring setup mistake should become a learning note.

## Do not use when
- There is no evidence or source for the claim.
- The task asks for broad theory unrelated to the current proof.
- The requested change would hide lab limitations.

## Inputs
- evidence reference
- instance and company
- screenshot status
- target book or guide section
- lab/final status
- known setup dependency

## Output JSON schema
```json
{
  "skill": "beginner-check",
  "beginnerGap": "string",
  "visibleBusinessMeaning": "string",
  "setupBehindIt": "string",
  "failureMode": "string",
  "safePatchPlan": ["string"],
  "labBoundary": "string"
}
```

## Rules
- Explain visible UI, required action, reason, setup background, correction and proof point.
- Keep German terms leading and English terms only as search help.
- Mark CRONUS-USA findings as lab unless final German proof exists.

## Stop if
- The evidence does not prove the intended point.
- A German tax, accounting or compliance claim lacks proof or source.
- The book patch would expand beyond the proven finding.

## Safety gates
- evidence-backed-only
- beginner-can-see-it
- labor-vs-final-label
- no-unproven-german-vat-claim

## Preferred taskClass
judge_work

## Default model class
gpt-5.5-low

## Max context lines
180

## Max output tokens
900

## Tool preferred
no, unless local grep is needed to locate the book section.

## Updates state
yes: coverage, findings or current state when a learning gap is closed.
