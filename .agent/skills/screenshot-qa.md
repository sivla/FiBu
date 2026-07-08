# Skill: screenshot-qa

## Skill name
screenshot-qa

## Purpose
Accept, downgrade or reject screenshots based on whether the visible image proves the claimed business point.

## Use when
- A screenshot is proposed for the book.
- A screenshot was created after a BC run.
- The user reports that important codes or values are not visible.

## Do not use when
- No screenshot or metadata exists.
- The task only validates JSON or scripts.
- The image is a raw artifact forbidden for commit.

## Inputs
- screenshot path
- screenshot metadata
- claimed proof
- expected visible values
- book purpose
- lab/final status

## Output JSON schema
```json
{
  "skill": "screenshot-qa",
  "status": "needs-retake-wide-layout",
  "visibleProof": ["string"],
  "missingProof": ["string"],
  "retakeInstruction": "string",
  "bookUsable": false
}
```

## Rules
- Metadata alone is not enough.
- Codes, amounts, buttons or posting traces must be readable if claimed.
- Use wide layout or hide FactBox when columns are hidden.
- Rejected/debugging images must be labeled that way.

## Stop if
- The screenshot shows the wrong page or company.
- The claimed proof is not visible.
- A final screenshot is claimed from lab evidence.

## Safety gates
- visible-proof-required
- wrong-page-rejected
- hidden-columns-retake-wide-layout
- lab-vs-final-label

## Preferred taskClass
monkey_work

## Default model class
gpt-4-mini-high

## Max context lines
120

## Max output tokens
600

## Tool preferred
yes: screenshot metadata and optional visual inspection when needed.

## Executable helper/check
- Helper: `playwright/core/bc/visual-proof-skills.ts`
- Selftest: `npm run core:visual-proof-skills:selftest`
- Preflight binding: `npm run agent:visual-proof-skills:check`

## Updates state
yes: screenshot QA, coverage or evidence README when status changes.
